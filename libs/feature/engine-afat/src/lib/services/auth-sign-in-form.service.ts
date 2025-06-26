import { Injectable } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';
import { ValidationService } from '@nestjs-mod/afat';
import { UntilDestroy } from '@ngneat/until-destroy';
import { FormlyFieldConfig } from '@ngx-formly/core';
import { ValidationErrorMetadataInterface } from '@rucken/rucken-rest-sdk-angular';
import { EngineLoginInput } from './auth.types';

@UntilDestroy()
@Injectable({ providedIn: 'root' })
export class EngineSignInFormService {
  constructor(
    protected readonly translocoService: TranslocoService,
    protected readonly validationService: ValidationService,
  ) {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getFormlyFields(options?: {
    data?: EngineLoginInput;
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
            label: this.translocoService.translate(`engine.sign-in-form.fields.email`),
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
            label: this.translocoService.translate(`engine.sign-in-form.fields.password`),
            placeholder: 'password',
            required: true,
            type: 'password',
          },
        },
      ],
      options?.errors || [],
    );
  }
}
