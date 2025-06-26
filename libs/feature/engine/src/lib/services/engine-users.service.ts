import { searchIn } from '@nestjs-mod/misc';
import { InjectPrismaClient } from '@nestjs-mod/prisma';
import { PrismaToolsService } from '@nestjs-mod/prisma-tools';
import { Injectable, Logger } from '@nestjs/common';
import { PrismaClient } from '../generated/prisma-client';
import { CreateEngineUserDto } from '../generated/rest/dto/create-engine-user.dto';
import { EngineUser } from '../generated/rest/dto/engine-user.entity';
import { RUCKEN_ENGINE_FEATURE } from '../engine.constants';
import { EngineStaticEnvironments } from '../engine.environments';
import { EngineError, EngineErrorEnum } from '../engine.errors';
import { EngineCacheService } from './engine-cache.service';
import { EnginePasswordService } from './engine-password.service';
import { EngineProjectService } from './engine-project.service';

@Injectable()
export class EngineUsersService {
  private readonly logger = new Logger(EngineUsersService.name);

  constructor(
    @InjectPrismaClient(RUCKEN_ENGINE_FEATURE)
    private readonly prismaClient: PrismaClient,
    private readonly enginePasswordService: EnginePasswordService,
    private readonly prismaToolsService: PrismaToolsService,
    private readonly engineCacheService: EngineCacheService,
    private readonly engineProjectService: EngineProjectService,
    private readonly engineStaticEnvironments: EngineStaticEnvironments,
  ) {}

  async createAdmin() {
    if (this.engineStaticEnvironments.adminEmail && this.engineStaticEnvironments.adminPassword) {
      try {
        const signupUserResult = await this.create({
          user: {
            username: this.engineStaticEnvironments.adminUsername,
            password: this.engineStaticEnvironments.adminPassword,
            email: this.engineStaticEnvironments.adminEmail,
          },
          roles: this.engineStaticEnvironments.adminDefaultRoles,
        });

        await this.prismaClient.engineUser.update({
          data: { emailVerifiedAt: new Date() },
          where: {
            id: signupUserResult.id,
          },
        });

        await this.engineCacheService.clearCacheByUserId({
          userId: signupUserResult.id,
        });

        this.logger.debug(`Admin with email: ${signupUserResult.email} successfully created!`);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (err: any) {
        if (!(err instanceof EngineError && err.code === EngineErrorEnum.EmailIsExists)) {
          this.logger.error(err, err.stack);
        }
      }
    }
  }

  async getByEmail({ email, projectId }: { email: string; projectId: string }) {
    try {
      return await this.prismaClient.engineUser.findUniqueOrThrow({
        include: { EngineProject: true },
        where: { email_projectId: { email, projectId } },
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      if (this.prismaToolsService.isErrorOfRecordNotFound(err)) {
        throw new EngineError(EngineErrorEnum.UserNotFound);
      }
      this.logger.debug({
        getByEmail: {
          email,
          projectId,
        },
      });
      this.logger.error(err, err.stack);
      throw err;
    }
  }

  async getById({ id, projectId }: { id: string; projectId: string }) {
    try {
      return await this.prismaClient.engineUser.findUniqueOrThrow({
        include: { EngineProject: true },
        where: { id, projectId },
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      this.logger.debug({
        getById: {
          id,
          projectId,
        },
      });
      if (this.prismaToolsService.isErrorOfRecordNotFound(err)) {
        return this.getAdminById({ id });
      }
      this.logger.error(err, err.stack);
      throw err;
    }
  }

  async getAdminById({ id }: { id: string }) {
    const OR =
      this.engineStaticEnvironments.adminDefaultRoles?.map((r) => ({
        roles: {
          contains: r,
        },
      })) || [];
    try {
      return await this.prismaClient.engineUser.findUniqueOrThrow({
        include: { EngineProject: true },
        where: {
          id,
          ...(OR.length ? { OR } : {}),
        },
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      this.logger.debug({
        getAdminById: {
          id,
        },
        OR,
      });
      if (this.prismaToolsService.isErrorOfRecordNotFound(err)) {
        throw new EngineError(EngineErrorEnum.UserNotFound);
      }
      this.logger.error(err, err.stack);
      throw err;
    }
  }

  async getAdminByEmailAndPassword({ email, password }: { email: string; password: string }) {
    const OR =
      this.engineStaticEnvironments.adminDefaultRoles?.map((r) => ({
        roles: {
          contains: r,
        },
      })) || [];
    try {
      const user = await this.prismaClient.engineUser.findFirstOrThrow({
        include: { EngineProject: true },
        where: { email, ...(OR.length ? { OR } : {}) },
      });
      if (
        !(await this.enginePasswordService.comparePasswordWithHash({
          password,
          hashedPassword: user.password,
        }))
      ) {
        throw new EngineError(EngineErrorEnum.WrongPassword);
      }
      return user;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      if (this.prismaToolsService.isErrorOfRecordNotFound(err)) {
        this.logger.debug({ getAdminByEmailAndPassword: { email }, OR });
        throw new EngineError(EngineErrorEnum.UserNotFound);
      }
      this.logger.debug({
        getAdminByEmailAndPassword: { email, password },
      });
      this.logger.error(err, err.stack);
      throw err;
    }
  }

  async getByEmailAndPassword({ email, password, projectId }: { email: string; password: string; projectId: string }) {
    try {
      const user = await this.prismaClient.engineUser.findUniqueOrThrow({
        include: { EngineProject: true },
        where: { email_projectId: { email, projectId } },
      });
      if (
        !(await this.enginePasswordService.comparePasswordWithHash({
          password,
          hashedPassword: user.password,
        }))
      ) {
        throw new EngineError(EngineErrorEnum.WrongPassword);
      }
      return user;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      if (this.prismaToolsService.isErrorOfRecordNotFound(err)) {
        this.logger.debug({
          getByEmailAndPassword: {
            email,
            projectId,
          },
        });
        return this.getAdminByEmailAndPassword({ email, password });
      }
      this.logger.debug({
        getByEmailAndPassword: { email, password, projectId },
      });
      this.logger.error(err, err.stack);
      throw err;
    }
  }

  async create({ user, projectId, roles }: { user: CreateEngineUserDto; projectId?: string; roles?: string[] }) {
    if (roles?.length && !searchIn(roles, this.engineStaticEnvironments.userAvailableRoles)) {
      this.logger.debug({
        create: {
          user,
          projectId,
          roles,
        },
        userAvailableRoles: this.engineStaticEnvironments.userAvailableRoles,
        result: searchIn(roles, this.engineStaticEnvironments.userAvailableRoles),
      });
      throw new EngineError(EngineErrorEnum.NonExistentRoleSpecified);
    }

    const hashedPassword = await this.enginePasswordService.createPasswordHash(user.password);

    try {
      const result = await this.prismaClient.engineUser.create({
        include: { EngineProject: true },
        data: {
          ...user,
          ...(user.email
            ? {
                email: user.email.toLowerCase(),
              }
            : {}),
          username: user.username,
          password: hashedPassword,
          EngineProject: {
            connect: projectId
              ? { id: projectId }
              : {
                  clientId: (await this.engineProjectService.getOrCreateDefaultProject())?.clientId,
                },
          },
          roles: roles ? roles.join(',') : null,
        },
      });

      // fill cache
      await this.engineCacheService.getCachedUser({
        userId: result.id,
      });

      return result;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      if (this.prismaToolsService.isErrorOfUniqueField<{ email: string }>(err, 'email', true)) {
        throw new EngineError(EngineErrorEnum.EmailIsExists);
      }
      if (this.prismaToolsService.isErrorOfUniqueField<{ username: string }>(err, 'username', true)) {
        throw new EngineError(EngineErrorEnum.UserIsExists);
      }
      this.logger.debug({
        create: {
          user,
          projectId,
        },
      });
      this.logger.error(err, err.stack);
      throw err;
    }
  }

  async changePassword({ id, password, projectId }: { id: string; password: string; projectId: string }) {
    const hashedPassword = await this.enginePasswordService.createPasswordHash(password);

    await this.prismaClient.engineUser.update({
      data: {
        password: hashedPassword,
        updatedAt: new Date(),
      },
      where: { id, projectId },
    });

    await this.engineCacheService.clearCacheByUserId({ userId: id });

    return await this.getById({ id, projectId });
  }

  async update({
    user,
    projectId,
  }: {
    user: Pick<
      EngineUser,
      'birthdate' | 'firstname' | 'lastname' | 'id' | 'picture' | 'gender' | 'lang' | 'timezone'
    > & {
      password: string | null;
      oldPassword: string | null;
    };
    projectId: string;
  }) {
    const { password, oldPassword, lang, timezone, ...profile } = user;
    if (password) {
      const currentUser = await this.prismaClient.engineUser.findFirst({
        include: { EngineProject: true },
        where: { id: user.id },
      });

      if (
        currentUser &&
        !(await this.enginePasswordService.comparePasswordWithHash({
          password: oldPassword || '',
          hashedPassword: currentUser.password,
        }))
      ) {
        throw new EngineError(EngineErrorEnum.WrongOldPassword);
      }

      if (
        currentUser &&
        (await this.enginePasswordService.comparePasswordWithHash({
          password,
          hashedPassword: currentUser.password,
        }))
      ) {
        user.password = null;
      }
    }
    const updatedUser = await this.prismaClient.engineUser.update({
      include: { EngineProject: true },
      data: {
        ...profile,
        projectId,
        ...(user.password
          ? {
              password: await this.enginePasswordService.createPasswordHash(user.password),
            }
          : {}),
        ...(lang === undefined
          ? {}
          : {
              lang,
            }),
        ...(timezone === undefined
          ? {}
          : {
              timezone,
            }),
        updatedAt: new Date(),
      },
      where: { id: user.id },
    });

    await this.engineCacheService.clearCacheByUserId({ userId: updatedUser.id });

    return this.getById({ id: updatedUser.id, projectId });
  }
}
