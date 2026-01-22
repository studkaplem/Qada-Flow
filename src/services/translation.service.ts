import { Injectable, signal, computed } from '@angular/core';
import { en } from '../i18n/en';
import { de } from '../i18n/de';
import { tr } from '../i18n/tr';

type LangCode = 'en' | 'de' | 'tr';

@Injectable({
  providedIn: 'root'
})
export class TranslationService {
  readonly currentLang = signal<LangCode>('de'); // Default to German as requested

  private readonly dictionaries = {
    en: en,
    de: de,
    tr: tr
  };

  readonly currentDictionary = computed(() => {
    return this.dictionaries[this.currentLang()];
  });

  setLanguage(lang: LangCode) {
    this.currentLang.set(lang);
    localStorage.setItem('qada_lang', lang);
  }

  constructor() {
    const saved = localStorage.getItem('qada_lang') as LangCode;
    if (saved && (saved === 'en' || saved === 'de' || saved === 'tr')) {
      this.currentLang.set(saved);
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