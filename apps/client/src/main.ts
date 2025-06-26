import { bootstrapApplication } from '@angular/platform-browser';
import { LayoutComponent } from '@rucken/engine-afat';
import { minioURL } from './environments/environment';
import { engineAppConfig } from './app/app.config';

bootstrapApplication(LayoutComponent, engineAppConfig({ minioURL })).catch((err) => console.error(err));
