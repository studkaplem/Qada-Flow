import { Component, inject, signal, effect, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../services/auth.service';
import { StoreService } from '../services/store.service';
import { TranslationService } from '../services/translation.service';
import { Router } from '@angular/router';
import { TranslatePipe } from '../pipes/translate.pipe';
import { NotificationService } from '../services/notification.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslatePipe],
  templateUrl: './profile.component.html'
})
export class ProfileComponent {
  auth = inject(AuthService);
  store = inject(StoreService);
  ts = inject(TranslationService);
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private notificationService = inject(NotificationService);

  // UI State
  activeTab = signal<'overview' | 'settings'>('overview');
  
  // Feedback
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  // Computed Values für Overview ---
  currentPlanLabel = computed(() => {
    const cap = this.store.settings().dailyCapacity || 1;
    return cap;
  });

  progressPercentage = computed(() => {
    const missed = this.store.totalMissed(); // Offene Gebete
    const completed = this.store.totalCompletedAbsolute(); // Erledigte Gebete
    const total = missed + completed;
    
    if (total === 0) return 0;
    return Math.round((completed / total) * 100);
  });

  // --- Settings Forms ---
  profileUpdateForm = this.fb.group({
    fullName: ['', [Validators.required, Validators.minLength(2)]]
  });

  constructor() {
    // Sync profile form with current user data when user changes
    effect(() => {
        const user = this.auth.currentUser();
        if (user) {
            this.profileUpdateForm.patchValue({
                fullName: user.user_metadata.full_name
            });
        }
    });
  }

  setActiveTab(tab: 'overview' | 'settings') {
    this.activeTab.set(tab);
    this.clearMessages();
  }

  clearMessages() {
      this.errorMessage.set(null);
      this.successMessage.set(null);
  }

  async onLogout() {
    await this.auth.signOut();
    this.router.navigate(['/login']);
  }

  // --- Settings Actions ---

  async updateProfile() {
      if (this.profileUpdateForm.valid) {
          const { fullName } = this.profileUpdateForm.value;
          const { error } = await this.auth.updateUser({ full_name: fullName! });
          
          if (error) {
              this.errorMessage.set(error.message);
          } else {
              this.successMessage.set('Profile updated successfully.');
              setTimeout(() => this.successMessage.set(null), 3000);
          }
      }
  }

  switchLanguage(lang: 'en' | 'de' | 'tr') {
      this.ts.setLanguage(lang);
      // Optional: Persist to user_metadata in auth service as well
      this.auth.updateUser({ preferred_language: lang });
  }
}
