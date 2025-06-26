import { WebhookService } from '@nestjs-mod/webhook';
import { searchIn } from '@nestjs-mod/misc';
import { InjectPrismaClient } from '@nestjs-mod/prisma';
import { PrismaToolsService } from '@nestjs-mod/prisma-tools';
import { StatusResponse } from '@nestjs-mod/swagger';
import { ValidationError } from '@nestjs-mod/validation';
import { Body, Controller, Get, Logger, Param, ParseUUIDPipe, Post, Put, Query } from '@nestjs/common';
import { ApiBadRequestResponse, ApiOkResponse, ApiTags, refs } from '@nestjs/swagger';
import { isUUID } from 'class-validator';
import { randomUUID } from 'crypto';
import { omit } from 'lodash/fp';
import { EngineUserDto } from '../generated/rest/dto/engine-user.dto';
import { UpdateEngineUserDto } from '../generated/rest/dto/update-engine-user.dto';
import { Prisma, PrismaClient } from '../generated/prisma-client';
import { EngineCacheService } from '../services/engine-cache.service';
import { EngineEventsService } from '../services/engine-events.service';
import { EnginePasswordService } from '../services/engine-password.service';
import { EngineService } from '../services/engine.service';
import { OperationName } from '../engine.configuration';
import { RUCKEN_ENGINE_FEATURE } from '../engine.constants';
import { CurrentEngineRequest } from '../engine.decorators';
import { EngineError } from '../engine.errors';
import { FindManyEngineUserArgs } from '../types/find-many-engine-user-args';
import { FindManyEngineUserResponse } from '../types/find-many-engine-user-response';
import { SendInvitationLinksArgs } from '../types/send-invitation-links.dto';
import { EngineRequest } from '../types/engine-request';
import { EngineRole } from '../types/engine-role';
import { EngineWebhookEvent } from '../types/engine-webhooks';

@ApiBadRequestResponse({
  schema: { allOf: refs(EngineError, ValidationError) },
})
@ApiTags('Engine')
@Controller('/engine/users')
export class EngineUsersController {
  private readonly logger = new Logger(EngineUsersController.name);

  constructor(
    @InjectPrismaClient(RUCKEN_ENGINE_FEATURE)
    private readonly prismaClient: PrismaClient,
    private readonly prismaToolsService: PrismaToolsService,
    private readonly enginePasswordService: EnginePasswordService,
    private readonly engineCacheService: EngineCacheService,
    private readonly engineService: EngineService,
    private readonly webhookService: WebhookService,
    private readonly engineEventsService: EngineEventsService,
  ) {}

  @Get()
  @ApiOkResponse({ type: FindManyEngineUserResponse })
  async findMany(@CurrentEngineRequest() engineRequest: EngineRequest, @Query() args: FindManyEngineUserArgs) {
    const { take, skip, curPage, perPage } = this.prismaToolsService.getFirstSkipFromCurPerPage({
      curPage: args.curPage,
      perPage: args.perPage,
    });
    const searchText = args.searchText;
    const projectId = searchIn(EngineRole.admin, engineRequest.engineUser?.roles)
      ? args.projectId
      : engineRequest.engineProject.id;

    const orderBy = (args.sort || 'createdAt:desc')
      .split(',')
      .map((s) => s.split(':'))
      .reduce(
        (all, [key, value]) => ({
          ...all,
          ...(key in Prisma.EngineUserScalarFieldEnum
            ? {
                [key]: value === 'desc' ? 'desc' : 'asc',
              }
            : {}),
        }),
        {},
      );

    const result = await this.prismaClient.$transaction(async (prisma) => {
      return {
        engineUsers: await prisma.engineUser.findMany({
          where: {
            ...(projectId ? { projectId: { equals: projectId } } : {}),
            ...(searchText
              ? isUUID(searchText)
                ? {
                    OR: [{ id: { equals: searchText } }],
                  }
                : {
                    OR: [
                      { email: { contains: searchText, mode: 'insensitive' } },
                      {
                        username: { contains: searchText, mode: 'insensitive' },
                      },
                      {
                        firstname: {
                          contains: searchText,
                          mode: 'insensitive',
                        },
                      },
                      {
                        lastname: { contains: searchText, mode: 'insensitive' },
                      },
                    ],
                  }
              : {}),
          },
          take,
          skip,
          orderBy,
        }),
        totalResults: await prisma.engineUser.count({
          where: {
            ...(projectId ? { projectId: { equals: projectId } } : {}),
            ...(searchText
              ? isUUID(searchText)
                ? {
                    OR: [{ id: { equals: searchText } }],
                  }
                : {
                    OR: [
                      { email: { contains: searchText, mode: 'insensitive' } },
                      {
                        username: { contains: searchText, mode: 'insensitive' },
                      },
                      {
                        firstname: {
                          contains: searchText,
                          mode: 'insensitive',
                        },
                      },
                      {
                        lastname: { contains: searchText, mode: 'insensitive' },
                      },
                    ],
                  }
              : {}),
          },
        }),
      };
    });

    return {
      engineUsers: result.engineUsers,
      meta: {
        totalResults: result.totalResults,
        curPage,
        perPage,
      },
    };
  }

  @Put(':id')
  @ApiOkResponse({ type: EngineUserDto })
  async updateOne(
    @CurrentEngineRequest() engineRequest: EngineRequest,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() args: UpdateEngineUserDto,
  ) {
    const projectId = searchIn(EngineRole.admin, engineRequest.engineUser?.roles)
      ? undefined
      : engineRequest.engineProject.id;
    const result = await this.prismaClient.engineUser.update({
      data: {
        ...args,
        ...(args.password
          ? {
              password: await this.enginePasswordService.createPasswordHash(args.password),
            }
          : {}),
        updatedAt: new Date(),
      },
      where: {
        id,
        ...(projectId ? { projectId: { equals: projectId } } : {}),
      },
    });

    await this.engineCacheService.clearCacheByUserId({ userId: id });

    return result;
  }

  @Post('send-invitation-links')
  @ApiOkResponse({ type: StatusResponse })
  async sendInvitationLinks(
    @CurrentEngineRequest() engineRequest: EngineRequest,
    @Body() args: SendInvitationLinksArgs,
  ) {
    const emails = args.emails.split(',').map((e) => e.trim());
    for (const email of emails) {
      const signUpArgs = {
        fingerprint: '',
        confirmPassword: '',
        password: randomUUID(),
        email,
      };
      const user = await this.engineService.signUp({
        signUpArgs,
        projectId: engineRequest.engineProject.id,
        operationName: OperationName.COMPLETE_REGISTRATION_USING_THE_INVITATION_LINK,
      });

      await this.webhookService.sendEvent({
        eventName: EngineWebhookEvent['engine.sign-up'],
        eventBody: omit(['password'], user),
        eventHeaders: { projectId: engineRequest.engineProject.id },
      });

      if (user.emailVerifiedAt !== null) {
        await this.engineEventsService.send({
          SignUp: { signUpArgs: signUpArgs },
          userId: user.id,
        });
      }
    }
    return { message: 'ok' };
  }

  @Get(':id')
  @ApiOkResponse({ type: EngineUserDto })
  async findOne(@CurrentEngineRequest() engineRequest: EngineRequest, @Param('id', new ParseUUIDPipe()) id: string) {
    const projectId = searchIn(EngineRole.admin, engineRequest.engineUser?.roles)
      ? undefined
      : engineRequest.engineProject.id;
    return await this.prismaClient.engineUser.findFirstOrThrow({
      where: {
        id,
        ...(projectId ? { projectId } : {}),
      },
    });
  }
}
