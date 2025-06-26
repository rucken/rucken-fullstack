import { Injectable } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';
import { ValidationService } from '@nestjs-mod/afat';
import { UntilDestroy } from '@ngneat/until-destroy';
import { FormlyFieldConfig } from '@ngx-formly/core';
import { ValidationErrorMetadataInterface } from '@rucken/rucken-rest-sdk-angular';
import { SsoSignupInput } from './auth.types';

@UntilDestroy()
@Injectable({ providedIn: 'root' })
export class SsoSignUpFormService {
  constructor(
    protected readonly translocoService: TranslocoService,
    protected readonly validationService: ValidationService,
  ) {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getFormlyFields(options?: {
    data?: SsoSignupInput;
    errors?: ValidationErrorMetadataInterface[];
  }): FormlyFieldConfig[] {
    return this.validationService.appendServerErrorsAsValidatorsToFields(
      [
        {
          key: 'email',
          type: 'input',
          validation: {
            show: true,
          },
          props: {
            label: this.translocoService.translate(`sso.sign-up-form.fields.email`),
            placeholder: 'email',
            required: true,
          },
        },
        {
          key: 'password',
          type: 'input',
          validation: {
            show: true,
          },
          props: {
            label: this.translocoService.translate(`sso.sign-up-form.fields.password`),
            placeholder: 'password',
            required: true,
            type: 'password',
          },
        },
        {
          key: 'confirmPassword',
          type: 'input',
          validation: {
            show: true,
          },
          props: {
            label: this.translocoService.translate(`sso.sign-up-form.fields.confirm-password`),
            placeholder: 'confirmPassword',
            required: true,
            type: 'password',
          },
        },
      ],
      options?.errors || [],
    );
  }
}
