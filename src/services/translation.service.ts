import { Injectable, signal, computed, inject } from '@angular/core';
import { AuthService } from './auth.service';
import { createClient } from '@supabase/supabase-js';
import { environment } from '../environments/environment';
import { en } from '../i18n/en';
import { de } from '../i18n/de';
import { tr } from '../i18n/tr';

type LangCode = 'en' | 'de' | 'tr';

@Injectable({
  providedIn: 'root'
})
export class TranslationService {
  private auth = inject(AuthService);
  private supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
  readonly currentLang = signal<LangCode>('de'); // Default to German as requested

  private readonly dictionaries = {
    en: en,
    de: de,
    tr: tr
  };

  readonly currentDictionary = computed(() => {
    return this.dictionaries[this.currentLang()];
  });

  async setLanguage(lang: LangCode) {
    // A. Lokal sofort updaten (schnell für UI)
    this.currentLang.set(lang);
    localStorage.setItem('qada_lang', lang);
    document.documentElement.lang = lang; // Hilft Browsern & SEO

    // B. Datenbank updaten (im Hintergrund für Edge Functions)
    const user = this.auth.currentUser();
    
    if (user) {
      try {
        const { error } = await this.supabase
          .from('profiles')
          .update({ preferred_language: lang })
          .eq('id', user.id);

        if (error) {
          console.error('Fehler beim Speichern der Sprache in DB:', error);
        } else {
          console.log('Sprache erfolgreich in DB synchronisiert:', lang);
        }
      } catch (err) {
        console.error('Verbindungsfehler beim Sprach-Update:', err);
      }
    }
  }

  constructor() {
    const saved = localStorage.getItem('qada_lang') as LangCode;
    if (saved && (saved === 'en' || saved === 'de' || saved === 'tr')) {
      this.currentLang.set(saved);
    }
  }

  private loadInitialLanguage() {
    // 1. Versuche aus LocalStorage zu laden
    const saved = localStorage.getItem('qada_lang') as LangCode;
    if (saved && ['en', 'de', 'tr'].includes(saved)) {
      this.currentLang.set(saved);
    } else {
      // 2. Fallback: Browser-Sprache erkennen (optional)
      const browserLang = navigator.language.split('-')[0] as LangCode;
      if (['en', 'de', 'tr'].includes(browserLang)) {
        this.currentLang.set(browserLang);
      }
    }
  }

  // Helper to access nested keys safely, e.g. "dashboard.title"
  translate(key: string): string {
    const keys = key.split('.');
    let current: any = this.currentDictionary();
    
    for (const k of keys) {
      // Fix: Check for undefined specifically, allowing empty strings "" and 0 to be valid values
      if (current && current[k] !== undefined) {
        current = current[k];
      } else {
        return key; // Fallback to key if not found
      }
    }
    return current;
  }
}