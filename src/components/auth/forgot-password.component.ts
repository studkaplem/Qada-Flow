import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div class="max-w-md w-full">
        
        <div class="bg-white p-8 rounded-2xl shadow-xl border border-slate-100">
          
          <div class="text-center mb-6">
             <div class="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-500 mb-4">
                <i class="fa-solid fa-key"></i>
             </div>
             <h2 class="text-2xl font-bold text-slate-800">Reset Password</h2>
             <p class="text-slate-500 text-sm mt-1">Enter your email to receive a reset link.</p>
          </div>

          @if (successMessage()) {
             <div class="bg-emerald-50 text-emerald-800 p-4 rounded-lg text-center mb-6 border border-emerald-100 animate-fade-in">
                <i class="fa-solid fa-paper-plane mb-2 text-xl"></i>
                <p class="font-bold">Link Sent!</p>
                <p class="text-xs mt-1">Check your inbox to reset your password.</p>
             </div>
             <div class="text-center">
                <a routerLink="/login" class="text-emerald-600 font-bold hover:underline text-sm">Back to Login</a>
             </div>
          } @else {
             <form [formGroup]="resetForm" (ngSubmit)="onSubmit()" class="space-y-4">
                @if (errorMessage()) {
                   <div class="p-3 bg-red-50 text-red-700 rounded-lg text-sm border border-red-100">
                      {{ errorMessage() }}
                   </div>
                }

                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                  <input type="email" formControlName="email" placeholder="you@example.com"
                        class="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none transition bg-white text-slate-900">
                </div>

                <button type="submit" [disabled]="resetForm.invalid || auth.isLoading()" 
                      class="w-full bg-slate-800 text-white py-3 rounded-lg font-bold hover:bg-slate-700 transition shadow-lg flex justify-center items-center disabled:opacity-70 disabled:cursor-not-allowed">
                    @if (auth.isLoading()) {
                        <i class="fa-solid fa-circle-notch fa-spin mr-2"></i> Sending...
                    } @else {
                        Send Reset Link
                    }
                </button>
             </form>

             <div class="mt-6 text-center">
                <a routerLink="/login" class="text-slate-500 hover:text-slate-800 text-sm font-medium"><i class="fa-solid fa-arrow-left mr-1"></i> Back to Login</a>
             </div>
          }

        </div>
      </div>
    </div>
  `
})
export class ForgotPasswordComponent {
  auth = inject(AuthService);
  private fb = inject(FormBuilder);

  resetForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]]
  });

  successMessage = signal(false);
  errorMessage = signal<string | null>(null);

  async onSubmit() {
    if (this.resetForm.valid) {
       this.errorMessage.set(null);
       const { email } = this.resetForm.value;
       
       const { error } = await this.auth.resetPasswordForEmail(email!);
       
       if (error) {
           this.errorMessage.set(error.message);
       } else {
           this.successMessage.set(true);
       }
    }
  }
}
