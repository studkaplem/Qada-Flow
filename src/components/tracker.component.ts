import { Component, inject, signal } from '@angular/core';
import { StoreService } from '../services/store.service';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '../pipes/translate.pipe';

@Component({
  selector: 'app-tracker',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './tracker.component.html'
})
export class TrackerComponent {
  store = inject(StoreService);

  // Tracks which prayer card is currently asking for rating
  activeKhushuInput = signal<string | null>(null);

  // Helper for consistent ordering
  prayers = [
    { key: 'fajr', label: 'Fajr' },
    { key: 'dhuhr', label: 'Dhuhr' },
    { key: 'asr', label: 'Asr' },
    { key: 'maghrib', label: 'Maghrib' },
    { key: 'isha', label: 'Isha' },
    { key: 'witr', label: 'Witr' }
  ];

  todayFardState: {[key: string]: boolean} = {};

  toggleFard(key: string) {
    this.todayFardState[key] = !this.todayFardState[key];
    this.store.logPrayer(key as any, false);
  }

  // Opens the rating menu for a specific prayer
  initiateQada(key: string) {
    this.activeKhushuInput.set(key);
  }

  cancelQada() {
    this.activeKhushuInput.set(null);
  }

  // Logs the prayer with specific focus level
  confirmQada(key: string, rating: number) {
    this.store.logPrayer(key as any, true, rating);
    this.activeKhushuInput.set(null); // Close menu
  }

  getMissedCount(key: string): number {
    return (this.store.missedPrayers() as any)[key];
  }
}