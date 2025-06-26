import { ArgumentsHost, Catch, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { EngineError, EngineErrorEnum } from './engine.errors';

@Catch(EngineError)
export class EngineExceptionsFilter extends BaseExceptionFilter {
  private logger = new Logger(EngineExceptionsFilter.name);

  override catch(exception: EngineError, host: ArgumentsHost) {
    if (exception instanceof EngineError) {
      this.logger.error(exception, exception.stack);
      super.catch(
        new HttpException(
          {
            code: exception.code,
            message: exception.message,
            metadata: exception.metadata,
          },
          exception.code === EngineErrorEnum.AccessTokenExpired ? HttpStatus.UNAUTHORIZED : HttpStatus.BAD_REQUEST,
        ),
        host,
      );
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this.logger.error(exception, (exception as any)?.stack);
      super.catch(exception, host);
    }
  }
}
