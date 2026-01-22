import { Component, inject } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { TranslationService } from './services/translation.service';
import { AuthService } from './services/auth.service';
import { TranslatePipe } from './pipes/translate.pipe';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, TranslatePipe],
  templateUrl: './app.component.html',
  styleUrls: []
})
export class AppComponent {
  ts = inject(TranslationService);
  auth = inject(AuthService); // Injected to check login state
  isMobileMenuOpen = false;

  toggleMenu() {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  closeMenu() {
    this.isMobileMenuOpen = false;
  }

  switchLang(lang: 'en' | 'de' | 'tr') {
    this.ts.setLanguage(lang);
  }
}
