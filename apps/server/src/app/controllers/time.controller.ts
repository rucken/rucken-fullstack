import { Controller, Get } from '@nestjs/common';

import { EngineGuard, UseEngineInterceptorsAndGuards } from '@rucken/engine';
import { ApiOkResponse } from '@nestjs/swagger';
import { SubscribeMessage, WebSocketGateway, WsResponse } from '@nestjs/websockets';
import { interval, map, Observable } from 'rxjs';
import { ChangeTimeStream } from '../app.constants';

@UseEngineInterceptorsAndGuards({
  guards: [EngineGuard],
  skipInterceptor: true,
})
@WebSocketGateway({
  cors: {
    origin: '*',
  },
  path: '/ws/time',
  transports: ['websocket'],
})
@Controller()
export class TimeController {
  @Get('/time')
  @ApiOkResponse({ type: Date })
  time() {
    return new Date();
  }

  @UseEngineInterceptorsAndGuards()
  @SubscribeMessage(ChangeTimeStream)
  onChangeTimeStream(): Observable<WsResponse<Date>> {
    return interval(1000).pipe(
      map(() => ({
        data: new Date(),
        event: ChangeTimeStream,
      })),
    );
  }
}
