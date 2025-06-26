import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { ReplaySubject } from 'rxjs';
import { EngineEventContext } from '../types/engine-event';

type EngineEventCallback = (event: Partial<EngineEventContext>) => Promise<void>;

@Injectable()
export class EngineEventsService {
  private logger = new Logger(EngineEventsService.name);
  private engineEventStream$ = new ReplaySubject<Partial<EngineEventContext>>();
  private engineEventCallbacks: EngineEventCallback[] = [];

  private id = randomUUID();

  async send(event: Partial<EngineEventContext>) {
    if (event.serviceId !== this.id) {
      event.serviceId = this.id;
      this.logger.debug(`send: ${JSON.stringify(event)}`);
      this.engineEventStream$.next(event);
      for (const engineEventCallback of this.engineEventCallbacks) {
        await engineEventCallback(event);
      }
    }
  }

  listen(engineEventCallback?: EngineEventCallback) {
    if (engineEventCallback) {
      this.logger.debug(`append new callback...`);
      this.engineEventCallbacks.push(engineEventCallback);
      return null;
    } else {
      this.logger.debug(`listen...`);
      return this.engineEventStream$;
    }
  }
}
