import { searchIn } from '@nestjs-mod/misc';
import { InjectPrismaClient } from '@nestjs-mod/prisma';
import { PrismaToolsService } from '@nestjs-mod/prisma-tools';
import { ValidationError } from '@nestjs-mod/validation';
import { Body, Controller, Get, Param, ParseUUIDPipe, Put, Query } from '@nestjs/common';
import { ApiBadRequestResponse, ApiOkResponse, ApiTags, refs } from '@nestjs/swagger';
import { isUUID } from 'class-validator';
import { EngineRefreshSessionDto } from '../generated/rest/dto/engine-refresh-session.dto';
import { UpdateEngineRefreshSessionDto } from '../generated/rest/dto/update-engine-refresh-session.dto';
import { Prisma, PrismaClient } from '../generated/prisma-client';
import { EngineCacheService } from '../services/engine-cache.service';
import { RUCKEN_ENGINE_FEATURE } from '../engine.constants';
import { CurrentEngineRequest } from '../engine.decorators';
import { EngineError } from '../engine.errors';
import { FindManyEngineRefreshSessionArgs } from '../types/find-many-engine-refresh-session-args';
import { FindManyEngineRefreshSessionResponse } from '../types/find-many-engine-refresh-session-response';
import { EngineRequest } from '../types/engine-request';
import { EngineRole } from '../types/engine-role';

@ApiBadRequestResponse({
  schema: { allOf: refs(EngineError, ValidationError) },
})
@ApiTags('Engine')
@Controller('/engine/sessions')
export class EngineRefreshSessionsController {
  constructor(
    @InjectPrismaClient(RUCKEN_ENGINE_FEATURE)
    private readonly prismaClient: PrismaClient,
    private readonly prismaToolsService: PrismaToolsService,
    private readonly engineCacheService: EngineCacheService,
  ) {}

  @Get()
  @ApiOkResponse({ type: FindManyEngineRefreshSessionResponse })
  async findMany(
    @CurrentEngineRequest() engineRequest: EngineRequest,
    @Query() args: FindManyEngineRefreshSessionArgs,
  ) {
    const projectId = engineRequest.engineProject.id;
    const { take, skip, curPage, perPage } = this.prismaToolsService.getFirstSkipFromCurPerPage({
      curPage: args.curPage,
      perPage: args.perPage,
    });
    const searchText = args.searchText;
    const userId = args.userId;

    const orderBy = (args.sort || 'createdAt:desc')
      .split(',')
      .map((s) => s.split(':'))
      .reduce(
        (all, [key, value]) => ({
          ...all,
          ...(key in Prisma.EngineRefreshSessionScalarFieldEnum
            ? {
                [key]: value === 'desc' ? 'desc' : 'asc',
              }
            : {}),
        }),
        {},
      );
    const result = await this.prismaClient.$transaction(async (prisma) => {
      return {
        engineRefreshSessions: await prisma.engineRefreshSession.findMany({
          where: {
            enabled: true,
            // ...(projectId ? { projectId } : {}),
            ...(searchText
              ? {
                  OR: [
                    ...(isUUID(searchText) ? [{ id: { equals: searchText } }] : []),
                    {
                      userIp: { contains: searchText, mode: 'insensitive' },
                    },
                    {
                      fingerprint: {
                        contains: searchText,
                        mode: 'insensitive',
                      },
                    },
                    {
                      userAgent: { contains: searchText, mode: 'insensitive' },
                    },
                  ],
                }
              : {}),
            userId: { equals: userId },
          },
          take,
          skip,
          orderBy,
        }),
        totalResults: await prisma.engineRefreshSession.count({
          where: {
            enabled: true,
            // ...(projectId ? { projectId } : {}),
            ...(searchText
              ? {
                  OR: [
                    ...(isUUID(searchText) ? [{ id: { equals: searchText } }] : []),
                    {
                      userIp: { contains: searchText, mode: 'insensitive' },
                    },
                    {
                      fingerprint: {
                        contains: searchText,
                        mode: 'insensitive',
                      },
                    },
                    {
                      userAgent: { contains: searchText, mode: 'insensitive' },
                    },
                  ],
                }
              : {}),
            userId: { equals: userId },
          },
        }),
      };
    });
    return {
      engineRefreshSessions: result.engineRefreshSessions,
      meta: {
        totalResults: result.totalResults,
        curPage,
        perPage,
      },
    };
  }

  @Put(':id')
  @ApiOkResponse({ type: EngineRefreshSessionDto })
  async updateOne(
    @CurrentEngineRequest() engineRequest: EngineRequest,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() args: UpdateEngineRefreshSessionDto,
  ) {
    const projectId = searchIn(EngineRole.admin, engineRequest.engineUser?.roles)
      ? undefined
      : engineRequest.engineProject.id;
    const result = await this.prismaClient.engineRefreshSession.update({
      data: { ...args, updatedAt: new Date() },
      where: {
        ...(projectId ? { projectId } : {}),
        id,
      },
    });

    await this.engineCacheService.clearCacheByRefreshSession(result.refreshToken);

    return result;
  }

  @Get(':id')
  @ApiOkResponse({ type: EngineRefreshSessionDto })
  async findOne(@CurrentEngineRequest() engineRequest: EngineRequest, @Param('id', new ParseUUIDPipe()) id: string) {
    const projectId = searchIn(EngineRole.admin, engineRequest.engineUser?.roles)
      ? undefined
      : engineRequest.engineProject.id;
    return await this.prismaClient.engineRefreshSession.findFirstOrThrow({
      where: {
        ...(projectId ? { projectId } : {}),
        id,
      },
    });
  }
}
