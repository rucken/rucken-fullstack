import { Pipe, PipeTransform } from '@angular/core';
import { map } from 'rxjs';
import { EngineService } from '../services/auth.service';

@Pipe({
  name: 'user',
  pure: true,
  standalone: true,
})
export class UserPipe implements PipeTransform {
  constructor(private readonly authService: EngineService) {}

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public transform(value: any) {
    return this.authService.profile$.pipe(map((profile) => profile || value));
  }
}
