import { Pipe, PipeTransform } from '@angular/core';
import { EngineGuardService } from '../services/auth-guard.service';

@Pipe({
  name: 'checkUserRoles',
  pure: true,
  standalone: true,
})
export class CheckUserRolesPipe implements PipeTransform {
  constructor(private readonly authGuardService: EngineGuardService) {}

  public transform(authRoles?: string[]) {
    return this.authGuardService.checkUserRoles(authRoles);
  }
}
