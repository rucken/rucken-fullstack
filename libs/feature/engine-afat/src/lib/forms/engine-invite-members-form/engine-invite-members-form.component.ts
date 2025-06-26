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
import { FormsModule, ReactiveFormsModule, UntypedFormGroup } from '@angular/forms';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { ValidationService } from '@nestjs-mod/afat';
import { compare } from '@nestjs-mod/misc';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { FormlyFieldConfig, FormlyModule } from '@ngx-formly/core';
import { ValidationErrorMetadataInterface } from '@rucken/rucken-rest-sdk-angular';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NZ_MODAL_DATA } from 'ng-zorro-antd/modal';
import { BehaviorSubject, catchError, distinctUntilChanged, Observable, tap } from 'rxjs';

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
  selector: 'engine-invite-members-form',
  templateUrl: './engine-invite-members-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
})
export class EngineInviteMembersFormComponent implements OnInit {
  @Input()
  hideButtons?: boolean;
  @Input({ required: true })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sendInvitationLinks!: (emails: string) => Observable<any>;

  @Output()
  afterSendInvitationLinks = new EventEmitter<string>();

  form = new UntypedFormGroup({});
  formlyModel$ = new BehaviorSubject<object | null>(null);
  formlyFields$ = new BehaviorSubject<FormlyFieldConfig[] | null>(null);
  errors?: ValidationErrorMetadataInterface[];

  constructor(
    @Optional()
    @Inject(NZ_MODAL_DATA)
    private readonly nzModalData: EngineInviteMembersFormComponent,
    private readonly nzMessageService: NzMessageService,
    private readonly translocoService: TranslocoService,
    private readonly validationService: ValidationService,
  ) {}

  ngOnInit(): void {
    Object.assign(this, this.nzModalData);

    this.translocoService.langChanges$
      .pipe(
        untilDestroyed(this),
        tap(() => {
          this.formlyFields$.next(this.formlyFields$.value);
        }),
      )
      .subscribe();

    this.form.valueChanges
      .pipe(
        distinctUntilChanged((prev, cur) => compare(prev, cur).different.length === 0),
        tap(() => {
          if (this.errors?.length) {
            this.setFormlyFields({ errors: [] });
          }
        }),
        untilDestroyed(this),
      )
      .subscribe();

    this.setFieldsAndModel();
  }

  setFieldsAndModel(model?: Partial<object>) {
    this.setFormlyFields();
    this.formlyModel$.next(model || null);
  }

  submitForm(): void {
    this.sendInvitationLinks(this.form.value)
      .pipe(
        catchError((err) =>
          this.validationService.catchAndProcessServerError(err, (options) => this.setFormlyFields(options)),
        ),
        tap((result) => {
          if (result) {
            this.nzMessageService.success(this.translocoService.translate('Success'));
            this.afterSendInvitationLinks.next(this.formlyModel$.value?.['emails'] || '');
          }
        }),
        untilDestroyed(this),
      )
      .subscribe();
  }

  private setFormlyFields(options?: { errors?: ValidationErrorMetadataInterface[] }) {
    this.formlyFields$.next(
      this.validationService.appendServerErrorsAsValidatorsToFields(
        [
          {
            key: 'emails',
            type: 'input',
            validation: {
              show: true,
            },
            props: {
              label: this.translocoService.translate(`engine-invite-members.form.fields.emails`),
              placeholder: 'emails',
              required: true,
            },
          },
        ],
        options?.errors || [],
      ),
    );
    this.errors = options?.errors || [];
  }
}
