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
import {
  BehaviorSubject,
  catchError,
  mergeMap,
  of,
  tap,
  throwError,
} from 'rxjs';
import { SsoSessionFormService } from '../../services/sso-session-form.service';
import {
  SsoSessionModel,
  SsoSessionService,
} from '../../services/sso-session.service';

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
  selector: 'sso-session-form',
  templateUrl: './sso-session-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SsoSessionFormComponent implements OnInit {
  @Input()
  id?: string;

  @Input()
  hideButtons?: boolean;

  @Output()
  afterFind = new EventEmitter<SsoSessionModel>();

  @Output()
  afterCreate = new EventEmitter<SsoSessionModel>();

  @Output()
  afterUpdate = new EventEmitter<SsoSessionModel>();

  form = new UntypedFormGroup({});
  formlyModel$ = new BehaviorSubject<object | null>(null);
  formlyFields$ = new BehaviorSubject<FormlyFieldConfig[] | null>(null);

  constructor(
    @Optional()
    @Inject(NZ_MODAL_DATA)
    private readonly nzModalData: SsoSessionFormComponent,
    private readonly ssoSessionService: SsoSessionService,
    private readonly nzMessageService: NzMessageService,
    private readonly translocoService: TranslocoService,
    private readonly ssoSessionFormService: SsoSessionFormService,
    private readonly validationService: ValidationService
  ) {}

  ngOnInit(): void {
    Object.assign(this, this.nzModalData);

    this.translocoService.langChanges$
      .pipe(
        untilDestroyed(this),
        tap(() => {
          this.formlyFields$.next(this.formlyFields$.value);
        })
      )
      .subscribe();

    if (this.id) {
      this.findOne()
        .pipe(
          tap((result) =>
            this.afterFind.next({
              ...result,
            })
          ),
          untilDestroyed(this)
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
      this.updateOne()
        .pipe(
          tap((result) => {
            if (result) {
              this.nzMessageService.success(
                this.translocoService.translate('Success')
              );
              this.afterUpdate.next({
                ...result,
              });
            }
          }),
          untilDestroyed(this)
        )
        .subscribe();
    }
  }

  updateOne() {
    if (!this.id) {
      return throwError(
        () => new Error(this.translocoService.translate('id not set'))
      );
    }
    return this.ssoSessionService
      .updateOne(this.id, this.form.value)
      .pipe(
        catchError((err) =>
          this.validationService.catchAndProcessServerError(err, (options) =>
            this.setFormlyFields(options)
          )
        )
      );
  }

  findOne() {
    if (!this.id) {
      return throwError(
        () => new Error(this.translocoService.translate('id not set'))
      );
    }
    return this.ssoSessionService.findOne(this.id).pipe(
      tap((result) => {
        this.setFieldsAndModel(result);
      })
    );
  }

  private setFormlyFields(options?: {
    errors?: ValidationErrorMetadataInterface[];
  }) {
    this.formlyFields$.next(
      this.ssoSessionFormService.getFormlyFields(options)
    );
  }
}
