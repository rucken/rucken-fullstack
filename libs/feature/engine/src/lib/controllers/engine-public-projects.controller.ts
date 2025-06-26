import { FindManyArgs } from '@nestjs-mod/swagger';

import { InjectPrismaClient } from '@nestjs-mod/prisma';
import { PrismaToolsService } from '@nestjs-mod/prisma-tools';
import { Controller, Get, Query } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { isUUID } from 'class-validator';
import { Prisma, PrismaClient } from '../generated/prisma-client';
import { RUCKEN_ENGINE_FEATURE } from '../engine.constants';
import { AllowEmptyEngineUser } from '../engine.decorators';
import { FindManyEnginePublicProjectResponse } from '../types/find-many-engine-public-project-response';

@ApiTags('Engine')
@AllowEmptyEngineUser()
@Controller('/engine/public-projects')
export class EnginePublicProjectsController {
  constructor(
    @InjectPrismaClient(RUCKEN_ENGINE_FEATURE)
    private readonly prismaClient: PrismaClient,
    private readonly prismaToolsService: PrismaToolsService,
  ) {}

  @Get()
  @ApiOkResponse({ type: FindManyEnginePublicProjectResponse })
  async findMany(@Query() args: FindManyArgs) {
    const { take, skip, curPage, perPage } = this.prismaToolsService.getFirstSkipFromCurPerPage({
      curPage: args.curPage,
      perPage: args.perPage,
    });
    const searchText = args.searchText;

    const orderBy = (args.sort || 'name:asc')
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
        enginePublicProjects: await prisma.engineProject.findMany({
          select: {
            id: true,
            clientId: true,
            name: true,
            nameLocale: true,
            createdAt: true,
            updatedAt: true,
          },
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
            public: true,
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
            public: true,
          },
        }),
      };
    });
    return {
      enginePublicProjects: result.enginePublicProjects,
      meta: {
        totalResults: result.totalResults,
        curPage,
        perPage,
      },
    };
  }
}
