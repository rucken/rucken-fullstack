import { HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, finalize } from 'rxjs';
import { RuckenRestClientConfiguration, EngineRuckenRestService, TimeRuckenRestService } from './generated';

@Injectable({ providedIn: 'root' })
export class RuckenRestSdkAngularService {
  constructor(
    private readonly ruckenRestClientConfiguration: RuckenRestClientConfiguration,
    private readonly timeRuckenRestService: TimeRuckenRestService,
    private readonly engineRuckenRestService: EngineRuckenRestService,
  ) {
    timeRuckenRestService.configuration.withCredentials = true;
    engineRuckenRestService.configuration.withCredentials = true;
  }

  getTimeApi() {
    if (!this.timeRuckenRestService) {
      throw new Error('timeRestService not set');
    }
    return this.timeRuckenRestService;
  }

  getEngineApi() {
    if (!this.engineRuckenRestService) {
      throw new Error('engineApi not set');
    }
    return this.engineRuckenRestService;
  }

  updateHeaders(headers: Record<string, string>) {
    this.timeRuckenRestService.defaultHeaders = new HttpHeaders(headers);
    this.engineRuckenRestService.defaultHeaders = new HttpHeaders(headers);
  }

  webSocket<T>({
    path,
    eventName,
    options,
  }: {
    path: string;
    eventName: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    options?: any;
  }) {
    const wss = new WebSocket(
      (this.ruckenRestClientConfiguration.basePath || '').replace('/api', '').replace('http', 'ws') + path,
      options,
    );
    return new Observable<{ data: T; event: string }>((observer) => {
      wss.addEventListener('open', () => {
        wss.addEventListener('message', ({ data }) => {
          observer.next(JSON.parse(data.toString()));
        });
        wss.addEventListener('error', (err) => {
          observer.error(err);
          if (wss?.readyState == WebSocket.OPEN) {
            wss.close();
          }
        });
        wss.send(
          JSON.stringify({
            event: eventName,
            data: true,
          }),
        );
      });
    }).pipe(
      finalize(() => {
        if (wss?.readyState == WebSocket.OPEN) {
          wss.close();
        }
      }),
    );
  }
}
