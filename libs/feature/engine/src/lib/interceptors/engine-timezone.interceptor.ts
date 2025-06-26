import { getRequestFromExecutionContext } from '@nestjs-mod/common';
import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { isObservable, Observable } from 'rxjs';
import { concatMap } from 'rxjs/operators';
import { EngineCacheService } from '../services/engine-cache.service';
import { EngineTimezoneService, TData } from '../services/engine-timezone.service';
import { EngineAsyncLocalStorageContext } from '../types/engine-async-local-storage-data';
import { EngineRequest } from '../types/engine-request';

@Injectable()
export class EngineTimezoneInterceptor implements NestInterceptor<TData, TData> {
  constructor(
    private readonly authTimezoneService: EngineTimezoneService,
    private readonly engineCacheService: EngineCacheService,
    private readonly asyncLocalStorage: EngineAsyncLocalStorageContext,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler) {
    const req: EngineRequest = getRequestFromExecutionContext(context);
    const userId = req.engineUser?.id;

    if (!userId) {
      return next.handle();
    }
    const store = { authTimezone: req.engineUser?.timezone || 0 };
    const wrapObservableForWorkWithAsyncLocalStorage = (
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      observable: Observable<any>,
    ) =>
      new Observable((observer) => {
        this.asyncLocalStorage.runWith(store, () => {
          observable.subscribe({
            next: (res) => observer.next(res),
            error: (error) => observer.error(error),
            complete: () => observer.complete(),
          });
        });
      });

    const run = () => {
      const result = this.asyncLocalStorage.runWith(store, () => next.handle());

      if (isObservable(result)) {
        return wrapObservableForWorkWithAsyncLocalStorage(result).pipe(
          concatMap(async (data) => {
            const user = await this.engineCacheService.getCachedUser({ userId });
            const newData = this.authTimezoneService.convertObject(data, user?.timezone);

            return newData;
          }),
        );
      }
      if (result instanceof Promise && typeof result?.then === 'function') {
        return result.then(async (data) => {
          if (isObservable(data)) {
            return wrapObservableForWorkWithAsyncLocalStorage(data).pipe(
              concatMap(async (data) => {
                const user = await this.engineCacheService.getCachedUser({
                  userId,
                });
                return this.authTimezoneService.convertObject(data, user?.timezone);
              }),
            );
          } else {
            const user = await this.engineCacheService.getCachedUser({ userId });
            // need for correct map types with base method of NestInterceptor
            return this.authTimezoneService.convertObject(data, user?.timezone) as Observable<TData>;
          }
        });
      }
      // need for correct map types with base method of NestInterceptor
      return this.authTimezoneService.convertObject(result, req.engineUser?.timezone) as Observable<TData>;
    };

    return run();
  }
}
