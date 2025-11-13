import { bootstrapApplication } from '@angular/platform-browser';
import { CvComponent } from './app/pages/cv/cv';
import { appConfig } from './app/app.config';

bootstrapApplication(CvComponent, appConfig)
  .catch((err) => console.error(err));
