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
  theme = {
    esName: '',
    enName: '',
    primary: '#000000',
    secondary: '#000000',
    image: '',
  };

  availableImages: string[] = [];

  constructor(public translate: TranslateService, private http: HttpClient) {
    this.selectedLang = 'es';
    this.translate.use(this.selectedLang);
    this.sortDataByDate(this.data.certifications, 'es', 'year');
    this.sortDataByDate(this.data.experience, 'es', 'years');
    this.sortDataByDate(this.data.education, 'es', 'years');
    this.sortDataByDate(this.data.achievements, 'es', 'year');
    this.sortSkills();
    this.loadImages();
  }

  loadImages() {
    this.availableImages = [
      'aqua.jpg',
      'black.jpg',
      'blue.jpg',
      'brown.jpg',
      'deeppink.jpg',
      'gray.jpg',
      'green.jpg',
      'greenyellow.jpg',
      'mistyrose.jpg',
      'orange.jpg',
      'pink.jpg',
      'purple.jpg',
      'red.jpg',
      'royalblue.jpg',
      'sandybrown.jpg',
      'yellow.jpg',
    ];
  }

  selectedFileName: string = '';

  uploadImage(event: any) {
    const file = event.target.files[0];

    if (file) {
      this.selectedFileName = this.translate.instant('IMAGE_UPLOADED');
    } else {
      this.selectedFileName = '';
    }
  }

  selectImage(img: string) {
    this.theme.image = img;
  }

  createTheme() {
    this.http
      .post('http://localhost:4000/create-theme', {
        esName: this.theme.esName,
        enName: this.theme.enName,
        primary: this.theme.primary,
        secondary: this.theme.secondary,
        image: this.theme.image,
      })
      .subscribe({
        next: (resp) => {
          alert('Theme created successfully');
        },
        error: (err) => {
          console.error('Error creating theme:', err);
        },
      });
  }

  jobDescription: string = '';
  resultAI: any = null;

  processWithAI() {
    this.http
      .post('http://localhost:4000/process-job', {
        profileData: this.data,
        jobDescription: this.jobDescription,
      })
      .subscribe((result) => {
        console.log('IA response:', result);
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

  showThemeSelector = false;
  showNetworkIntelligence = false;
  dropdownOpen = false;
  showCreateNewTheme = false;

  selectLang(lang: string) {
    this.selectedLang = lang;
    this.dropdownOpen = false;
    this.changeLanguage();
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
