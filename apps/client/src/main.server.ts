import { bootstrapApplication } from '@angular/platform-browser';
import { LayoutComponent } from '@rucken/engine-afat';
import { config } from './app/app.config.server';

const bootstrap = () => bootstrapApplication(LayoutComponent, config);

export default bootstrap;
