import { Component } from '@angular/core';
import data from '../../data/user.json';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService, provideTranslateService, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader, provideTranslateHttpLoader } from '@ngx-translate/http-loader';
import { HttpClient, HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-cv',
  standalone: true,
  templateUrl: './cv.html',
  imports: [CommonModule, TranslateModule, HttpClientModule, FormsModule],
  styleUrls: ['./cv.scss'],
  providers: [
    provideTranslateHttpLoader({
      prefix: './assets/i18n/',
      suffix: '.json'
    }),
    provideTranslateService({
      loader: {
        provide: TranslateLoader,
        useClass: TranslateHttpLoader,
        deps: [HttpClient]
      }
    })
  ]
})
export class CvComponent {
  data: any = data;
  currentTheme: string = 'theme-pink';
  selectedLang: string = 'es';

  constructor(private translate: TranslateService) {
    this.selectedLang = 'es';
    this.translate.use(this.selectedLang);
  }

  changeTheme(theme: string) {
    this.currentTheme = theme;
    document.documentElement.className = theme;
  }

  async exportPDF() {
  }

  changeLanguage() {
    this.translate.use(this.selectedLang).subscribe(() => {
      console.log('Language selected is:', this.selectedLang);
    });
  }
}