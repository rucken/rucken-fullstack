import { bootstrapApplication } from '@angular/platform-browser';
import { LayoutComponent } from '@rucken/engine-afat';
import { minioURL } from './environments/environment';
import { ssoAppConfig } from './app/app.config';

bootstrapApplication(LayoutComponent, ssoAppConfig({ minioURL })).catch((err) =>
  console.error(err)
);
