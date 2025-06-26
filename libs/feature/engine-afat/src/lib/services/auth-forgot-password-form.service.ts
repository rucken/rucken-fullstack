import { Injectable } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';
import { ValidationService } from '@nestjs-mod/afat';
import { UntilDestroy } from '@ngneat/until-destroy';
import { FormlyFieldConfig } from '@ngx-formly/core';
import { ValidationErrorMetadataInterface } from '@rucken/rucken-rest-sdk-angular';
import { EngineForgotPasswordInput } from './auth.types';

@UntilDestroy()
@Injectable({ providedIn: 'root' })
export class EngineForgotPasswordFormService {
  constructor(
    protected readonly translocoService: TranslocoService,
    protected readonly validationService: ValidationService,
  ) {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getFormlyFields(options?: {
    data?: EngineForgotPasswordInput;
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
            label: this.translocoService.translate(`engine.forgot-password-form.fields.email`),
            placeholder: 'email',
            required: true,
          },
        },
      ],
      options?.errors || [],
    );
  }
}
