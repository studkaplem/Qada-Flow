import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '../pipes/translate.pipe';
import { TranslationService } from '../services/translation.service';
import { InspireComponent } from './inspire.component';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslatePipe],
  template: `
    <div class="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800 animate-fade-in">
      
      <!-- Navbar -->
      <nav class="w-full p-6 flex justify-between items-center max-w-7xl mx-auto">
        <div class="flex items-center space-x-2">
          <div class="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white text-lg shadow-md">
            <i class="fa-solid fa-kaaba"></i>
          </div>
          <h1 class="font-bold text-xl tracking-tight text-slate-800">Qada' Flow</h1>
        </div>

        <div class="flex items-center gap-4 md:gap-6">
          <!-- Language Switcher -->
          <div class="flex bg-slate-100 p-1 rounded-lg">
              <button (click)="switchLang('de')" 
                      class="px-2 py-1 text-xs font-bold rounded transition-all"
                      [class.bg-white]="ts.currentLang() === 'de'" 
                      [class.shadow-sm]="ts.currentLang() === 'de'" 
                      [class.text-slate-800]="ts.currentLang() === 'de'" 
                      [class.text-slate-400]="ts.currentLang() !== 'de'">DE</button>
              <button (click)="switchLang('en')" 
                      class="px-2 py-1 text-xs font-bold rounded transition-all"
                      [class.bg-white]="ts.currentLang() === 'en'" 
                      [class.shadow-sm]="ts.currentLang() === 'en'" 
                      [class.text-slate-800]="ts.currentLang() === 'en'" 
                      [class.text-slate-400]="ts.currentLang() !== 'en'">EN</button>
              <button (click)="switchLang('tr')" 
                      class="px-2 py-1 text-xs font-bold rounded transition-all"
                      [class.bg-white]="ts.currentLang() === 'tr'" 
                      [class.shadow-sm]="ts.currentLang() === 'tr'" 
                      [class.text-slate-800]="ts.currentLang() === 'tr'" 
                      [class.text-slate-400]="ts.currentLang() !== 'tr'">TR</button>
          </div>

          <a routerLink="/login" class="text-sm font-bold text-slate-600 hover:text-emerald-600 transition">{{ 'landing.cta_login' | translate }}</a>
        </div>
      </nav>

      <!-- Hero Section -->
      <header class="flex-1 flex flex-col items-center justify-center text-center px-4 py-16 md:py-24 relative overflow-hidden">
        <!-- Abstract Background -->
        <div class="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 opacity-30">
             <div class="absolute -top-20 -left-20 w-96 h-96 bg-emerald-300 rounded-full blur-3xl opacity-20 animate-pulse"></div>
             <div class="absolute top-40 right-0 w-72 h-72 bg-blue-200 rounded-full blur-3xl opacity-20"></div>
        </div>

        <div class="inline-block px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold uppercase tracking-wider rounded-full mb-6 border border-emerald-100 shadow-sm">
          {{ 'landing.privacy_badge' | translate }}
        </div>
        
        <h1 class="text-4xl md:text-6xl font-extrabold text-slate-900 leading-tight max-w-4xl mb-6">
          {{ 'landing.hero_title' | translate }}
        </h1>
        
        <p class="text-lg md:text-xl text-slate-500 max-w-2xl mb-10 leading-relaxed">
          {{ 'landing.hero_subtitle' | translate }}
        </p>
        
        <a routerLink="/login" class="group bg-emerald-600 text-white px-8 py-4 rounded-full text-lg font-bold shadow-lg hover:bg-emerald-700 transition transform hover:-translate-y-1 hover:shadow-xl flex items-center gap-2">
          {{ 'landing.cta_start' | translate }} <i class="fa-solid fa-arrow-right group-hover:translate-x-1 transition-transform"></i>
        </a>

        <!-- Visual Preview Placeholder (Could be an image in real app) -->
        <div class="mt-16 w-full max-w-4xl bg-white rounded-xl shadow-2xl border border-slate-200 p-4 relative -mb-32 md:-mb-48 opacity-90 transform scale-95 md:scale-100">
           <!-- Mock UI Header -->
           <div class="h-4 bg-slate-100 rounded-full w-1/3 mb-4"></div>
           <div class="grid grid-cols-3 gap-4">
              <div class="h-32 bg-emerald-50 rounded-lg border border-emerald-100 flex items-center justify-center text-emerald-200 text-4xl"><i class="fa-solid fa-chart-pie"></i></div>
              <div class="h-32 bg-slate-50 rounded-lg border border-slate-100"></div>
              <div class="h-32 bg-slate-50 rounded-lg border border-slate-100"></div>
           </div>
        </div>
      </header>

      <!-- Features Grid -->
      <section class="bg-white py-24 md:py-32 border-t border-slate-100">
        <div class="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-12 text-center md:text-left">
          
          <!-- Feature 1 -->
          <div class="space-y-4 group">
            <div class="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center text-2xl mx-auto md:mx-0 group-hover:scale-110 transition-transform">
              <i class="fa-solid fa-calculator"></i>
            </div>
            <h3 class="text-xl font-bold text-slate-800">{{ 'landing.feature_1_title' | translate }}</h3>
            <p class="text-slate-500 leading-relaxed">{{ 'landing.feature_1_desc' | translate }}</p>
          </div>

          <!-- Feature 2 -->
          <div class="space-y-4 group">
            <div class="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center text-2xl mx-auto md:mx-0 group-hover:scale-110 transition-transform">
              <i class="fa-solid fa-layer-group"></i>
            </div>
            <h3 class="text-xl font-bold text-slate-800">{{ 'landing.feature_2_title' | translate }}</h3>
            <p class="text-slate-500 leading-relaxed">{{ 'landing.feature_2_desc' | translate }}</p>
          </div>

          <!-- Feature 3 -->
          <div class="space-y-4 group">
            <div class="w-14 h-14 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center text-2xl mx-auto md:mx-0 group-hover:scale-110 transition-transform">
              <i class="fa-solid fa-tree"></i>
            </div>
            <h3 class="text-xl font-bold text-slate-800">{{ 'landing.feature_3_title' | translate }}</h3>
            <p class="text-slate-500 leading-relaxed">{{ 'landing.feature_3_desc' | translate }}</p>
          </div>

        </div>
      </section>

      <!-- Why Choose Us Section -->
       <div class="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800 animate-fade-in">
        <section class="py-24 bg-slate-100 relative overflow-hidden">
            <div class="absolute top-0 right-0 w-64 h-64 bg-emerald-100 rounded-full blur-3xl opacity-40 -translate-y-1/2 translate-x-1/2"></div>
            <div class="absolute bottom-0 left-0 w-96 h-96 bg-blue-100 rounded-full blur-3xl opacity-40 translate-y-1/2 -translate-x-1/2"></div>

            <div class="max-w-7xl mx-auto px-6 relative z-10">
                <div class="text-center max-w-3xl mx-auto mb-16">
                    <h2 class="text-3xl md:text-5xl font-extrabold text-slate-900 mb-6">{{ 'landing.why_title' | translate }}</h2>
                    <p class="text-lg text-slate-600 leading-relaxed">{{ 'landing.why_subtitle' | translate }}</p>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                    
                    <div class="bg-white p-8 rounded-2xl shadow-sm hover:shadow-md transition border border-slate-200 flex gap-6 items-start group">
                        <div class="w-12 h-12 bg-rose-50 text-rose-500 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 group-hover:scale-110 transition-transform">
                            <i class="fa-solid fa-heart-crack"></i> </div>
                        <div>
                            <h3 class="text-xl font-bold text-slate-800 mb-2">{{ 'landing.benefit_1_title' | translate }}</h3>
                            <p class="text-slate-500 leading-relaxed">{{ 'landing.benefit_1_desc' | translate }}</p>
                        </div>
                    </div>

                    <div class="bg-white p-8 rounded-2xl shadow-sm hover:shadow-md transition border border-slate-200 flex gap-6 items-start group">
                        <div class="w-12 h-12 bg-emerald-50 text-emerald-500 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 group-hover:scale-110 transition-transform">
                            <i class="fa-solid fa-seedling"></i>
                        </div>
                        <div>
                            <h3 class="text-xl font-bold text-slate-800 mb-2">{{ 'landing.benefit_2_title' | translate }}</h3>
                            <p class="text-slate-500 leading-relaxed">{{ 'landing.benefit_2_desc' | translate }}</p>
                        </div>
                    </div>

                    <div class="bg-white p-8 rounded-2xl shadow-sm hover:shadow-md transition border border-slate-200 flex gap-6 items-start group">
                        <div class="w-12 h-12 bg-purple-50 text-purple-500 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 group-hover:scale-110 transition-transform">
                            <i class="fa-solid fa-calculator"></i>
                        </div>
                        <div>
                            <h3 class="text-xl font-bold text-slate-800 mb-2">{{ 'landing.benefit_3_title' | translate }}</h3>
                            <p class="text-slate-500 leading-relaxed">{{ 'landing.benefit_3_desc' | translate }}</p>
                        </div>
                    </div>

                    <div class="bg-white p-8 rounded-2xl shadow-sm hover:shadow-md transition border border-slate-200 flex gap-6 items-start group">
                        <div class="w-12 h-12 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 group-hover:scale-110 transition-transform">
                            <i class="fa-solid fa-sliders"></i>
                        </div>
                        <div>
                            <h3 class="text-xl font-bold text-slate-800 mb-2">{{ 'landing.benefit_4_title' | translate }}</h3>
                            <p class="text-slate-500 leading-relaxed">{{ 'landing.benefit_4_desc' | translate }}</p>
                        </div>
                    </div>

                </div>
                
                <div class="mt-16 text-center">
                  <h3 class="text-2xl font-bold text-slate-800 mb-6 max-w-2xl mx-auto italic">
                    "{{ dailyQuote().text }}"
                    <span class="block text-base font-normal text-slate-500 mt-2 not-italic">- {{ dailyQuote().source }}</span>
                  </h3>
                  <a routerLink="/login" class="group bg-emerald-600 text-white px-8 py-4 rounded-full text-lg font-bold shadow-lg hover:bg-emerald-700 transition transform hover:-translate-y-1 hover:shadow-xl inline-flex items-center gap-2">
                    {{ 'landing.cta_start' | translate }} <i class="fa-solid fa-arrow-right group-hover:translate-x-1 transition-transform"></i>
                  </a>
              </div>
            </div>
        </section>
      </div>

      <!-- Open Source & Charity Section -->
      <section class="bg-slate-900 text-white py-20 relative overflow-hidden">
        <div class="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/arabesque.png')]"></div>
        
        <div class="max-w-4xl mx-auto px-6 text-center relative z-10">
          <i class="fa-solid fa-hand-holding-heart text-5xl text-emerald-400 mb-6"></i>
          <h2 class="text-3xl md:text-4xl font-bold mb-4">{{ 'landing.opensource_title' | translate }}</h2>
          <p class="text-slate-300 text-lg md:text-xl mb-2">{{ 'landing.opensource_desc' | translate }}</p>
          <p class="text-slate-400 text-sm mb-8">{{ 'landing.opensource_sub' | translate }}</p>
          
          <div class="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="https://github.com/studkaplem/Qada-Flow" target="_blank" class="px-6 py-3 bg-white text-slate-900 rounded-lg font-bold hover:bg-slate-200 transition flex items-center justify-center gap-2">
              <i class="fa-brands fa-github"></i> GitHub Repo
            </a>
            <button class="px-6 py-3 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-500 transition flex items-center justify-center gap-2">
              <i class="fa-solid fa-heart"></i> Donate (Sadaqah)
            </button>
          </div>
        </div>
      </section>

      <!-- Footer -->
      <footer class="bg-white py-8 border-t border-slate-100">
        <div class="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center text-sm text-slate-400">
          <p>&copy; 2026 Qada' Flow. Open Source.</p>
          <div class="flex gap-4 mt-4 md:mt-0">
             <a href="#" class="hover:text-emerald-600">Privacy</a>
             <a href="#" class="hover:text-emerald-600">Terms</a>
             <a href="#" class="hover:text-emerald-600">Contact</a>
          </div>
        </div>
      </footer>

    </div>
  `
})
export class LandingComponent {
  ts = inject(TranslationService);

  dailyQuote = computed(() => {
     const q = this.ts.currentDictionary()?.inspire?.quote;
     return q || { text: 'Loading...', source: '' };
  });

  switchLang(lang: 'en' | 'de' | 'tr') {
    this.ts.setLanguage(lang);
  }
}
