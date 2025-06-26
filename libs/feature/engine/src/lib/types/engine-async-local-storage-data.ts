import { Injectable } from '@nestjs/common';
import { AsyncLocalStorage } from 'node:async_hooks';

export type EngineAsyncLocalStorageData = {
  authTimezone?: number;
};

@Injectable()
export class EngineAsyncLocalStorageContext {
  private storage: AsyncLocalStorage<EngineAsyncLocalStorageData>;

  constructor() {
    this.storage = new AsyncLocalStorage();
  }

  get() {
    return this.storage.getStore() as EngineAsyncLocalStorageData;
  }

  runWith<T = void>(context: EngineAsyncLocalStorageData, cb: () => T) {
    return this.storage.run(context, cb);
  }
}
