import axios, { AxiosInstance } from 'axios';
import { Observable, finalize } from 'rxjs';

import WebSocket from 'ws';
import { Configuration, EngineApi, TimeApi } from './generated';

export class RuckenRestSdkService {
  private engineApi?: EngineApi;
  private timeApi?: TimeApi;

  private timeApiAxios?: AxiosInstance;
  private engineApiAxios?: AxiosInstance;

  private wsHeaders: Record<string, string> = {};

  constructor(
    private options?: {
      serverUrl?: string;
      headers?: Record<string, string>;
    },
  ) {
    this.createApiClients();
    this.updateHeaders(options?.headers || {});
  }

  getTimeApi() {
    if (!this.timeApi) {
      throw new Error('timeApi not set');
    }
    return this.timeApi;
  }

  getEngineApi() {
    if (!this.engineApi) {
      throw new Error('engineApi not set');
    }
    return this.engineApi;
  }

  updateHeaders(headers: Record<string, string>) {
    Object.assign(this.wsHeaders, headers);

    if (this.engineApiAxios) {
      Object.assign(this.engineApiAxios.defaults.headers.common, headers);
    }
    if (this.timeApiAxios) {
      Object.assign(this.timeApiAxios.defaults.headers.common, headers);
    }
  }

  webSocket<T>({ path, eventName, options }: { path: string; eventName: string; options?: WebSocket.ClientOptions }) {
    const wss = new WebSocket(this.options?.serverUrl?.replace('/api', '').replace('http', 'ws') + path, {
      ...(options || {}),
      headers: this.wsHeaders || {},
    });
    return new Observable<{ data: T; event: string }>((observer) => {
      wss.on('open', () => {
        wss.on('message', (data) => {
          observer.next(JSON.parse(data.toString()));
        });
        wss.on('error', (err) => {
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

  private createApiClients() {
    this.engineApiAxios = axios.create();
    this.engineApi = new EngineApi(
      new Configuration({
        basePath: this.options?.serverUrl,
      }),
      undefined,
      this.engineApiAxios,
    );
    //

    this.timeApiAxios = axios.create();
    this.timeApi = new TimeApi(
      new Configuration({
        basePath: this.options?.serverUrl,
      }),
      undefined,
      this.timeApiAxios,
    );
  }
}
