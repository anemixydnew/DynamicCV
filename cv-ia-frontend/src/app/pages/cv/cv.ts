import { Component, ElementRef, ViewChild } from '@angular/core';
import data from '../../data/user.json';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  TranslateModule,
  TranslateService,
  provideTranslateService,
  TranslateLoader,
} from '@ngx-translate/core';
import { TranslateHttpLoader, provideTranslateHttpLoader } from '@ngx-translate/http-loader';
import { HttpClient, HttpClientModule } from '@angular/common/http';

interface DatedItem {
  year?: Record<string, string>;
  years?: Record<string, string>;
}

@Component({
  selector: 'app-cv',
  standalone: true,
  templateUrl: './cv.html',
  imports: [CommonModule, TranslateModule, HttpClientModule, FormsModule],
  styleUrls: ['./cv.scss'],
  providers: [
    provideTranslateHttpLoader({
      prefix: './assets/i18n/',
      suffix: '.json',
    }),
    provideTranslateService({
      loader: {
        provide: TranslateLoader,
        useClass: TranslateHttpLoader,
        deps: [HttpClient],
      },
    }),
  ],
})
export class CvComponent {
  data: any = data;
  currentTheme: string = 'theme-pink';
  selectedLang: string = 'es';
  @ViewChild('cvContainer') cvContainer!: ElementRef;

  constructor(public translate: TranslateService, private http: HttpClient) {
    this.selectedLang = 'es';
    this.translate.use(this.selectedLang);
    this.sortDataByDate(this.data.certifications, 'es', 'year');
    this.sortDataByDate(this.data.experience, 'es', 'years');
    this.sortDataByDate(this.data.education, 'es', 'years');
    this.sortDataByDate(this.data.achievements, 'es', 'year');
    this.sortSkills();
  }

  jobDescription: string = '';
  resultAI: any = null;

 processWithAI() {
  this.http.post("http://localhost:4000/process-job", {
    profileData: this.data,
    jobDescription: this.jobDescription
  }).subscribe(result => {
    console.log("RESULTADO IA:", result);
  });
}


  parseDate(dateStr: string, lang: string): Date {
    if (dateStr.includes('-')) {
      dateStr = dateStr.split('-')[1].trim();
    }

    if (!dateStr) return new Date(0);
    let parts = dateStr.split('/');

    if (lang === 'es') {
      return new Date(+parts[2], +parts[1] - 1, +parts[0]);
    } else {
      return new Date(+parts[2], +parts[0] - 1, +parts[1]);
    }
  }

  changeTheme(theme: string) {
    this.currentTheme = theme;
    document.documentElement.className = theme;
  }

  changeLanguage() {
    this.translate.use(this.selectedLang).subscribe(() => {
      this.sortDataByDate(this.data.certifications, this.selectedLang, 'year');
      this.sortDataByDate(this.data.experience, this.selectedLang, 'years');
      this.sortDataByDate(this.data.education, this.selectedLang, 'years');
      this.sortDataByDate(this.data.achievements, this.selectedLang, 'year');
    });
  }

  private sortDataByDate(list: DatedItem[], lang: string, datePropName: keyof DatedItem) {
    if (!list) return;

    list.sort((a: DatedItem, b: DatedItem) => {
      const dateStringA = (a[datePropName] as Record<string, string>)?.[lang];
      const dateStringB = (b[datePropName] as Record<string, string>)?.[lang];

      const dateA = this.parseDate(dateStringA, lang);
      const dateB = this.parseDate(dateStringB, lang);

      return dateB.getTime() - dateA.getTime();
    });
  }

  sortSkills() {
    this.data.skills.sort((a: any, b: any) => {
      return b.level - a.level;
    });
  }

  getProgressStyle(level: number) {
    const deg = (level / 100) * 360;
    return {
      background: `conic-gradient(var(--color-secondary) ${deg}deg, #e6e6e6 ${deg}deg)`,
    };
  }

  printDocument() {
    window.print();
  }
}
