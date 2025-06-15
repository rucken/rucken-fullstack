import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Inject,
  Input,
  OnInit,
  Optional,
  Output,
} from '@angular/core';
import {
  FormsModule,
  ReactiveFormsModule,
  UntypedFormGroup,
} from '@angular/forms';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { ValidationService } from '@nestjs-mod/afat';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { FormlyFieldConfig, FormlyModule } from '@ngx-formly/core';
import { ValidationErrorMetadataInterface } from '@rucken/rucken-rest-sdk-angular';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NZ_MODAL_DATA } from 'ng-zorro-antd/modal';
import { BehaviorSubject, catchError, of, tap, throwError } from 'rxjs';
import { CrudConfiguration } from '../../dynamic-pages/crud-page/crud-page.configuration';
import { DynamicCrudFormConfiguration } from './dynamic-crud-form.configuration';

@UntilDestroy()
@Component({
  imports: [
    FormlyModule,
    NzFormModule,
    NzInputModule,
    NzButtonModule,
    FormsModule,
    ReactiveFormsModule,
    AsyncPipe,
    TranslocoPipe,
  ],
  selector: 'dynamic-crud-form',
  templateUrl: './dynamic-crud-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DynamicCrudFormComponent<
  DynamicCrudModel extends { id: string } = { id: string },
> implements OnInit
{
  @Input()
  id?: string;

  @Input()
  hideButtons?: boolean;

  @Input({ required: true })
  crudConfiguration!: CrudConfiguration;

  @Input({ required: true })
  configuration!: DynamicCrudFormConfiguration;

  @Output()
  afterFind = new EventEmitter<DynamicCrudModel>();

  @Output()
  afterCreate = new EventEmitter<DynamicCrudModel>();

  @Output()
  afterUpdate = new EventEmitter<DynamicCrudModel>();

  form = new UntypedFormGroup({});
  formlyModel$ = new BehaviorSubject<object | null>(null);
  formlyFields$ = new BehaviorSubject<FormlyFieldConfig[] | null>(null);

  constructor(
    @Optional()
    @Inject(NZ_MODAL_DATA)
    private readonly nzModalData: DynamicCrudFormComponent<DynamicCrudModel>,
    private readonly nzMessageService: NzMessageService,
    private readonly translocoService: TranslocoService,
    private readonly validationService: ValidationService,
  ) {}

  ngOnInit(): void {
    console.log(this.nzModalData);
    Object.assign(this, this.nzModalData);

    this.translocoService.langChanges$
      .pipe(
        untilDestroyed(this),
        tap(() => {
          this.formlyFields$.next(this.formlyFields$.value);
        }),
      )
      .subscribe();

    if (this.id) {
      (this.findOne() || of(false))
        .pipe(
          tap((result) =>
            this.afterFind.next({
              ...(result as DynamicCrudModel),
            }),
          ),
          untilDestroyed(this),
        )
        .subscribe();
    } else {
      this.setFieldsAndModel();
    }
  }

  setFieldsAndModel(model?: Partial<object>) {
    this.setFormlyFields();
    this.formlyModel$.next(model || null);
  }

  submitForm(): void {
    if (this.id) {
      (this.updateOne?.() || of(false))
        .pipe(
          tap((result) => {
            if (result) {
              this.nzMessageService.success(
                this.translocoService.translate('Success'),
              );
              this.afterUpdate.next({
                ...(result as DynamicCrudModel),
              });
            }
          }),
          untilDestroyed(this),
        )
        .subscribe();
    } else {
      (this.createOne?.() || of(false))
        .pipe(
          tap((result) => {
            if (result) {
              this.nzMessageService.success(
                this.translocoService.translate('Success'),
              );
              this.afterCreate.next({
                ...(result as DynamicCrudModel),
              });
            }
          }),

          untilDestroyed(this),
        )
        .subscribe();
    }
  }

  createOne() {
    return this.crudConfiguration
      .handlers()
      .createOne?.(this.form.value)
      .pipe(
        catchError((err) =>
          this.validationService.catchAndProcessServerError(err, (options) =>
            this.setFormlyFields(options),
          ),
        ),
      );
  }

  updateOne() {
    if (!this.id) {
      return throwError(
        () => new Error(this.translocoService.translate('id not set')),
      );
    }
    return this.crudConfiguration
      .handlers()
      .updateOne?.(this.id, this.form.value)
      .pipe(
        catchError((err) =>
          this.validationService.catchAndProcessServerError(err, (options) =>
            this.setFormlyFields(options),
          ),
        ),
      );
  }

  findOne() {
    if (!this.id) {
      return throwError(
        () => new Error(this.translocoService.translate('id not set')),
      );
    }
    return this.crudConfiguration
      .handlers()
      .findOne?.(this.id)
      .pipe(
        tap((result) => {
          this.setFieldsAndModel(result as DynamicCrudModel);
        }),
      );
  }

  private setFormlyFields(options?: {
    errors?: ValidationErrorMetadataInterface[];
  }) {
    this.formlyFields$.next(
      this.validationService.appendServerErrorsAsValidatorsToFields(
        this.configuration.inputs,
        options?.errors || [],
      ),
    );
  }
}
