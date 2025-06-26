import { FindManyArgs } from '@nestjs-mod/swagger';

import { searchIn } from '@nestjs-mod/misc';
import { InjectPrismaClient } from '@nestjs-mod/prisma';
import { PrismaToolsService } from '@nestjs-mod/prisma-tools';
import { ValidationError } from '@nestjs-mod/validation';
import { Body, Controller, Get, Param, ParseUUIDPipe, Put, Query } from '@nestjs/common';
import { ApiBadRequestResponse, ApiOkResponse, ApiTags, refs } from '@nestjs/swagger';
import { isUUID } from 'class-validator';
import { omit } from 'lodash/fp';
import { SkipTranslate } from 'nestjs-translates';
import { EngineEmailTemplateDto } from '../generated/rest/dto/engine-email-template.dto';
import { UpdateEngineEmailTemplateDto } from '../generated/rest/dto/update-engine-email-template.dto';
import { Prisma, PrismaClient } from '../generated/prisma-client';
import { RUCKEN_ENGINE_FEATURE } from '../engine.constants';
import { CurrentEngineRequest } from '../engine.decorators';
import { EngineError } from '../engine.errors';
import { FindManyEngineEmailTemplateResponse } from '../types/find-many-engine-email-template-response';
import { EngineRequest } from '../types/engine-request';
import { EngineRole } from '../types/engine-role';

@ApiBadRequestResponse({
  schema: { allOf: refs(EngineError, ValidationError) },
})
@ApiTags('Engine')
@Controller('/engine/email-templates')
@SkipTranslate()
export class EngineEmailTemplatesController {
  constructor(
    @InjectPrismaClient(RUCKEN_ENGINE_FEATURE)
    private readonly prismaClient: PrismaClient,
    private readonly prismaToolsService: PrismaToolsService,
  ) {}

  @Get()
  @ApiOkResponse({ type: FindManyEngineEmailTemplateResponse })
  async findMany(@CurrentEngineRequest() engineRequest: EngineRequest, @Query() args: FindManyArgs) {
    const { take, skip, curPage, perPage } = this.prismaToolsService.getFirstSkipFromCurPerPage({
      curPage: args.curPage,
      perPage: args.perPage,
    });

    const searchText = args.searchText;
    const projectId = engineRequest.engineProject.id;

    const orderBy = (args.sort || 'createdAt:desc')
      .split(',')
      .map((s) => s.split(':'))
      .reduce(
        (all, [key, value]) => ({
          ...all,
          ...(key in Prisma.EngineEmailTemplateScalarFieldEnum
            ? {
                [key]: value === 'desc' ? 'desc' : 'asc',
              }
            : {}),
        }),
        {},
      );
    const result = await this.prismaClient.$transaction(async (prisma) => {
      return {
        engineEmailTemplates: await prisma.engineEmailTemplate.findMany({
          where: {
            ...(projectId ? { projectId: { equals: projectId } } : {}),
            ...(searchText
              ? {
                  OR: [
                    ...(isUUID(searchText) ? [{ id: { equals: searchText } }] : []),
                    {
                      html: { contains: searchText, mode: 'insensitive' },
                    },
                    {
                      operationName: {
                        contains: searchText,
                        mode: 'insensitive',
                      },
                    },
                    {
                      subject: { contains: searchText, mode: 'insensitive' },
                    },
                    {
                      text: { contains: searchText, mode: 'insensitive' },
                    },
                    {
                      htmlLocale: {
                        string_contains: searchText,
                      },
                    },
                    {
                      subjectLocale: {
                        string_contains: searchText,
                      },
                    },
                    {
                      textLocale: {
                        string_contains: searchText,
                      },
                    },
                  ],
                }
              : {}),
          },
          take,
          skip,
          orderBy,
        }),
        totalResults: await prisma.engineEmailTemplate.count({
          where: {
            ...(projectId ? { projectId: { equals: projectId } } : {}),
            ...(searchText
              ? {
                  OR: [
                    ...(isUUID(searchText) ? [{ id: { equals: searchText } }] : []),
                    {
                      html: { contains: searchText, mode: 'insensitive' },
                    },
                    {
                      operationName: {
                        contains: searchText,
                        mode: 'insensitive',
                      },
                    },
                    {
                      subject: { contains: searchText, mode: 'insensitive' },
                    },
                    {
                      text: { contains: searchText, mode: 'insensitive' },
                    },
                    {
                      htmlLocale: {
                        string_contains: searchText,
                      },
                    },
                    {
                      subjectLocale: {
                        string_contains: searchText,
                      },
                    },
                    {
                      textLocale: {
                        string_contains: searchText,
                      },
                    },
                  ],
                }
              : {}),
          },
        }),
      };
    });
    return {
      engineEmailTemplates: result.engineEmailTemplates,
      meta: {
        totalResults: result.totalResults,
        curPage,
        perPage,
      },
    };
  }

  @Put(':id')
  @ApiOkResponse({ type: EngineEmailTemplateDto })
  async updateOne(
    @CurrentEngineRequest() engineRequest: EngineRequest,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() args: UpdateEngineEmailTemplateDto,
  ) {
    const projectId = searchIn(EngineRole.admin, engineRequest.engineUser?.roles)
      ? undefined
      : engineRequest.engineProject.id;

    const result = await this.prismaClient.engineEmailTemplate.update({
      data: { ...omit(['operationName'], args), updatedAt: new Date() },
      where: {
        ...(projectId ? { projectId: { equals: projectId } } : {}),
        id,
      },
    });

    return result;
  }

  @Get(':id')
  @ApiOkResponse({ type: EngineEmailTemplateDto })
  async findOne(@CurrentEngineRequest() engineRequest: EngineRequest, @Param('id', new ParseUUIDPipe()) id: string) {
    const projectId = searchIn(EngineRole.admin, engineRequest.engineUser?.roles)
      ? undefined
      : engineRequest.engineProject.id;

    return await this.prismaClient.engineEmailTemplate.findFirstOrThrow({
      where: {
        ...(projectId ? { projectId: { equals: projectId } } : {}),
        id,
      },
    });
  }
}
