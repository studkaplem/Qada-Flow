import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslatePipe, RouterLink],
  template: `
    <div class="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div class="max-w-md w-full relative">
        
        <!-- Back to Home -->
        <a routerLink="/" class="absolute -top-12 left-0 text-slate-400 hover:text-emerald-600 text-sm font-bold flex items-center gap-2 transition">
            <i class="fa-solid fa-arrow-left"></i> Home
        </a>

        <!-- Logo Header -->
        <div class="text-center mb-8">
          <div class="w-16 h-16 bg-emerald-600 rounded-2xl flex items-center justify-center text-white text-3xl mx-auto shadow-lg mb-4">
            <i class="fa-solid fa-kaaba"></i>
          </div>
          <h1 class="text-3xl font-bold text-slate-800">Qada' Flow</h1>
          <p class="text-slate-500 mt-2">{{ 'profile.sign_in_text' | translate }}</p>
        </div>

        <!-- Error Alert -->
        @if (errorMessage()) {
          <div class="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-3 animate-fade-in">
              <i class="fa-solid fa-triangle-exclamation text-xl"></i>
              <p class="text-sm font-medium">{{ errorMessage() }}</p>
          </div>
        }

        <div class="bg-white p-8 rounded-2xl shadow-xl border border-slate-100">
          
          <!-- Tabs -->
          <div class="flex mb-6 border-b border-slate-100">
            <button (click)="toggleMode(true)" 
                    class="flex-1 pb-3 text-sm font-bold transition-colors border-b-2"
                    [class.text-emerald-600]="isLoginMode()" [class.border-emerald-600]="isLoginMode()"
                    [class.text-slate-400]="!isLoginMode()" [class.border-transparent]="!isLoginMode()">
              {{ 'profile.login' | translate }}
            </button>
            <button (click)="toggleMode(false)" 
                    class="flex-1 pb-3 text-sm font-bold transition-colors border-b-2"
                    [class.text-emerald-600]="!isLoginMode()" [class.border-emerald-600]="!isLoginMode()"
                    [class.text-slate-400]="isLoginMode()" [class.border-transparent]="isLoginMode()">
              {{ 'profile.signup' | translate }}
            </button>
          </div>

          <!-- Login Form -->
          @if (isLoginMode()) {
            <form [formGroup]="loginForm" (ngSubmit)="onLogin()" class="space-y-4 animate-fade-in">
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1">{{ 'profile.email' | translate }}</label>
                <div class="relative">
                  <i class="fa-regular fa-envelope absolute left-3 top-3 text-slate-400"></i>
                  <input type="email" formControlName="email" placeholder="you@example.com"
                        class="w-full pl-10 p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none transition bg-white text-slate-900">
                </div>
              </div>
              
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1">{{ 'profile.password' | translate }}</label>
                <div class="relative">
                  <i class="fa-solid fa-lock absolute left-3 top-3 text-slate-400"></i>
                  <input [type]="showPassword() ? 'text' : 'password'" formControlName="password" placeholder="••••••••"
                        class="w-full pl-10 p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none transition bg-white text-slate-900">
                  <button type="button" (click)="togglePasswordVisibility()" class="absolute right-3 top-3 text-slate-400 hover:text-slate-600">
                    <i class="fa-regular" [class.fa-eye]="showPassword()" [class.fa-eye-slash]="!showPassword()"></i>
                  </button>
                </div>
              </div>

              <div class="flex justify-end">
                  <a routerLink="/forgot-password" class="text-xs font-medium text-emerald-600 hover:text-emerald-700">Forgot Password?</a>
              </div>

              <button type="submit" [disabled]="loginForm.invalid || auth.isLoading()" 
                      class="w-full bg-emerald-600 text-white py-3 rounded-lg font-bold hover:bg-emerald-700 transition shadow-lg flex justify-center items-center disabled:opacity-70 disabled:cursor-not-allowed">
                @if (auth.isLoading()) {
                  <i class="fa-solid fa-circle-notch fa-spin mr-2"></i> {{ 'profile.logging_in' | translate }}
                } @else {
                  {{ 'profile.login' | translate }}
                }
              </button>
              
              <!-- DEVELOPER TOOLS / MOCK LOGIN HELPERS -->
              <div class="pt-6 mt-4 border-t border-slate-100">
                  <p class="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-2 text-center">Developer Quick Login</p>
                  <div class="grid grid-cols-2 gap-2">
                    <button type="button" (click)="fillDevUser('user')" class="text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 py-2 rounded font-medium transition">
                        User Demo
                    </button>
                    <button type="button" (click)="fillDevUser('admin')" class="text-xs bg-slate-800 hover:bg-slate-700 text-emerald-300 py-2 rounded font-bold transition flex items-center justify-center gap-1">
                        <i class="fa-solid fa-lock"></i> Admin Demo
                    </button>
                  </div>
              </div>

            </form>
          }

          <!-- Register Form -->
          @if (!isLoginMode()) {
            <form [formGroup]="registerForm" (ngSubmit)="onRegister()" class="space-y-4 animate-fade-in">
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1">{{ 'profile.full_name' | translate }}</label>
                <div class="relative">
                  <i class="fa-regular fa-user absolute left-3 top-3 text-slate-400"></i>
                  <input type="text" formControlName="name" placeholder="Bilal Ibn Rabah"
                        class="w-full pl-10 p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none transition bg-white text-slate-900">
                </div>
              </div>

              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1">{{ 'profile.email' | translate }}</label>
                <div class="relative">
                  <i class="fa-regular fa-envelope absolute left-3 top-3 text-slate-400"></i>
                  <input type="email" formControlName="email" placeholder="you@example.com"
                        class="w-full pl-10 p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none transition bg-white text-slate-900">
                </div>
              </div>
              
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1">{{ 'profile.password' | translate }}</label>
                <div class="relative">
                  <i class="fa-solid fa-lock absolute left-3 top-3 text-slate-400"></i>
                  <input type="password" formControlName="password" placeholder="Create a password"
                        class="w-full pl-10 p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none transition bg-white text-slate-900">
                </div>
              </div>

              <button type="submit" [disabled]="registerForm.invalid || auth.isLoading()" 
                      class="w-full bg-emerald-600 text-white py-3 rounded-lg font-bold hover:bg-emerald-700 transition shadow-lg flex justify-center items-center disabled:opacity-70 disabled:cursor-not-allowed">
                @if (auth.isLoading()) {
                  <i class="fa-solid fa-circle-notch fa-spin mr-2"></i> {{ 'profile.creating' | translate }}
                } @else {
                  {{ 'profile.create_account' | translate }}
                }
              </button>
            </form>
          }

        </div>
        
        <div class="text-center mt-6 text-slate-400 text-xs">
           &copy; 2024 Qada' Flow. Your spiritual journey starts here.
        </div>
      </div>
    </div>
  `
})
export class LoginComponent {
  auth = inject(AuthService);
  private fb = inject(FormBuilder);
  private router = inject(Router);

  isLoginMode = signal(true);
  showPassword = signal(false);
  errorMessage = signal<string | null>(null);

  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  registerForm = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  toggleMode(isLogin: boolean) {
    this.isLoginMode.set(isLogin);
    this.errorMessage.set(null);
  }

  togglePasswordVisibility() {
    this.showPassword.update(v => !v);
  }

  // --- Helper for Testing ---
  fillDevUser(type: 'user' | 'admin') {
      if (type === 'admin') {
          this.loginForm.setValue({
              email: 'admin@qada.flow',
              password: 'adminpassword123'
          });
      } else {
          this.loginForm.setValue({
              email: 'user@test.com',
              password: 'password123'
          });
      }
  }

  async onLogin() {
    if (this.loginForm.valid) {
      this.errorMessage.set(null);
      const { email, password } = this.loginForm.value;
      const { error } = await this.auth.signIn(email!, password!);
      
      if (error) {
        this.errorMessage.set(error.message);
      } else {
        // Redirect logic based on role could happen here or in guard
        // For now, everyone goes to dashboard, but admins will see the sidebar link
        this.router.navigate(['/dashboard']);
      }
    }
  }

  async onRegister() {
    if (this.registerForm.valid) {
      this.errorMessage.set(null);
      const { name, email, password } = this.registerForm.value;
      const { error } = await this.auth.signUp(email!, password!, { full_name: name! });
      
      if (error) {
        this.errorMessage.set(error.message);
      } else {
        this.router.navigate(['/dashboard']);
      }
    }
  }
}