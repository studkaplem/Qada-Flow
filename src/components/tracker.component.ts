import { Component, inject, signal } from '@angular/core';
import { StoreService, PrayerCounts } from '../services/store.service';
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

  activeKhushuInput = signal<string | null>(null);

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
    // Optional: Fard Tracking in DB implementieren (aktuell nur UI)
    console.log('Fard toggled:', key);
  }

  initiateQada(key: string) {
    this.activeKhushuInput.set(key);
  }

  cancelQada() {
    this.activeKhushuInput.set(null);
  }

  // Fix: logPrayer -> updatePrayerCount
  // Wichtig: change = -1 bedeutet "1 Gebet nachgeholt" (Schuld verringern)
  confirmQada(key: string, rating: number) {
    this.store.updatePrayerCount(key as keyof PrayerCounts, -1, rating);
    this.activeKhushuInput.set(null);
  }

  // Fix: Helper um den aktuellen Stand abzufragen
  getMissedCount(key: string): number {
    return (this.store.prayerCounts() as any)[key] || 0;
  }
}