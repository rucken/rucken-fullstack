import { FindManyArgs, StatusResponse } from '@nestjs-mod/swagger';

import { InjectPrismaClient } from '@nestjs-mod/prisma';
import { PrismaToolsService } from '@nestjs-mod/prisma-tools';
import { ValidationError } from '@nestjs-mod/validation';
import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Post, Put, Query } from '@nestjs/common';
import { ApiBadRequestResponse, ApiCreatedResponse, ApiOkResponse, ApiTags, refs } from '@nestjs/swagger';
import { isUUID } from 'class-validator';
import { CurrentLocale, SkipTranslate, TranslatesService } from 'nestjs-translates';
import { CreateEngineProjectDto } from '../generated/rest/dto/create-engine-project.dto';
import { EngineProjectDto } from '../generated/rest/dto/engine-project.dto';
import { UpdateEngineProjectDto } from '../generated/rest/dto/update-engine-project.dto';
import { Prisma, PrismaClient } from '../generated/prisma-client';
import { EngineCacheService } from '../services/engine-cache.service';
import { EngineTemplatesService } from '../services/engine-templates.service';
import { RUCKEN_ENGINE_FEATURE } from '../engine.constants';
import { CheckEngineRole } from '../engine.decorators';
import { EngineError } from '../engine.errors';
import { FindManyEngineProjectResponse } from '../types/find-many-engine-project-response';
import { EngineRole } from '../types/engine-role';

@ApiBadRequestResponse({
  schema: { allOf: refs(EngineError, ValidationError) },
})
@ApiTags('Engine')
@CheckEngineRole([EngineRole.admin])
@Controller('/engine/projects')
@SkipTranslate()
export class EngineProjectsController {
  constructor(
    @InjectPrismaClient(RUCKEN_ENGINE_FEATURE)
    private readonly prismaClient: PrismaClient,
    private readonly prismaToolsService: PrismaToolsService,
    private readonly translatesService: TranslatesService,
    private readonly engineCacheService: EngineCacheService,
    private readonly engineTemplatesService: EngineTemplatesService,
  ) {}

  @Get()
  @ApiOkResponse({ type: FindManyEngineProjectResponse })
  async findMany(@Query() args: FindManyArgs) {
    const { take, skip, curPage, perPage } = this.prismaToolsService.getFirstSkipFromCurPerPage({
      curPage: args.curPage,
      perPage: args.perPage,
    });
    const searchText = args.searchText;

    const orderBy = (args.sort || 'createdAt:desc')
      .split(',')
      .map((s) => s.split(':'))
      .reduce(
        (all, [key, value]) => ({
          ...all,
          ...(key in Prisma.EngineProjectScalarFieldEnum
            ? {
                [key]: value === 'desc' ? 'desc' : 'asc',
              }
            : {}),
        }),
        {},
      );
    const result = await this.prismaClient.$transaction(async (prisma) => {
      return {
        engineProjects: await prisma.engineProject.findMany({
          where: {
            ...(searchText
              ? {
                  OR: [
                    ...(isUUID(searchText) ? [{ id: { equals: searchText } }] : []),
                    {
                      clientId: { contains: searchText, mode: 'insensitive' },
                    },
                  ],
                }
              : {}),
          },
          take,
          skip,
          orderBy,
        }),
        totalResults: await prisma.engineProject.count({
          where: {
            ...(searchText
              ? {
                  OR: [
                    ...(isUUID(searchText) ? [{ id: { equals: searchText } }] : []),
                    {
                      clientId: { contains: searchText, mode: 'insensitive' },
                    },
                  ],
                }
              : {}),
          },
        }),
      };
    });
    return {
      engineProjects: result.engineProjects,
      meta: {
        totalResults: result.totalResults,
        curPage,
        perPage,
      },
    };
  }

  @Post()
  @ApiCreatedResponse({ type: EngineProjectDto })
  async createOne(@Body() args: CreateEngineProjectDto) {
    const result = await this.prismaClient.engineProject.create({
      data: {
        ...args,
      },
    });

    await this.engineTemplatesService.createProjectDefaultEmailTemplates(result.id);

    // fill cache
    await this.engineCacheService.getCachedProject(result.clientId);

    return result;
  }

  @Put(':id')
  @ApiOkResponse({ type: EngineProjectDto })
  async updateOne(@Param('id', new ParseUUIDPipe()) id: string, @Body() args: UpdateEngineProjectDto) {
    const result = await this.prismaClient.engineProject.update({
      data: { ...args, updatedAt: new Date() },
      where: {
        id,
      },
    });

    await this.engineCacheService.clearCacheProjectByClientId(result.clientId);

    return result;
  }

  @Delete(':id')
  @ApiOkResponse({ type: StatusResponse })
  async deleteOne(
    @Param('id', new ParseUUIDPipe()) id: string,
    // todo: change to InjectTranslateFunction, after write all posts
    @CurrentLocale() locale: string,
  ) {
    await this.prismaClient.engineProject.delete({
      where: {
        id,
      },
    });
    return { message: this.translatesService.translate('ok', locale) };
  }

  @Get(':id')
  @ApiOkResponse({ type: EngineProjectDto })
  async findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return await this.prismaClient.engineProject.findFirstOrThrow({
      where: {
        id,
      },
    });
  }
}
