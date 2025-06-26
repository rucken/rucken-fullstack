import { TIMEZONE_OFFSET } from '@nestjs-mod/misc';
import { Injectable, PipeTransform } from '@nestjs/common';
import { EngineTimezoneService } from '../services/engine-timezone.service';
import { EngineAsyncLocalStorageContext } from '../types/engine-async-local-storage-data';

@Injectable()
export class EngineTimezonePipe implements PipeTransform {
  constructor(
    private readonly asyncLocalStorage: EngineAsyncLocalStorageContext,
    private readonly authTimezoneService: EngineTimezoneService,
  ) {}

  transform(value: unknown) {
    const result = this.authTimezoneService.convertObject(
      value,
      -1 * (this.asyncLocalStorage.get()?.authTimezone || 0) - TIMEZONE_OFFSET,
    );

    return this.authTimezoneService.convertDatesInObjectToDateStrings(result);
  }
}
