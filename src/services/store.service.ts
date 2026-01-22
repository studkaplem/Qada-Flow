import { Injectable, signal, computed, effect } from '@angular/core';

export interface PrayerCounts {
  fajr: number;
  dhuhr: number;
  asr: number;
  maghrib: number;
  isha: number;
  witr: number;
}

export interface HabitRule {
  trigger: string; // e.g., 'fard_dhuhr'
  action: string;  // e.g., '1_set'
  active: boolean;
}

export interface UserSettings {
  startDate: string | null;
  endDate: string | null;
  isFemale: boolean;
  menstruationDays: number;
  dailyCapacity: number; // How many extra Qada prayers per day
  calculationMethod: string;
  habitStackingRule: HabitRule | null; // NEW: The atomic habit contract
}

// Map "YYYY-MM-DD" to total count of Qada prayers performed that day
export interface HistoryLog {
  [date: string]: number; 
}

// Track aggregate quality scores
export interface KhushuStats {
  [key: string]: { totalScore: number; count: number }; 
}

const INITIAL_COUNTS: PrayerCounts = {
  fajr: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0, witr: 0
};

const INITIAL_KHUSHU: KhushuStats = {
  fajr: { totalScore: 0, count: 0 },
  dhuhr: { totalScore: 0, count: 0 },
  asr: { totalScore: 0, count: 0 },
  maghrib: { totalScore: 0, count: 0 },
  isha: { totalScore: 0, count: 0 },
  witr: { totalScore: 0, count: 0 }
};

@Injectable({
  providedIn: 'root'
})
export class StoreService {
  // State Signals
  readonly userSettings = signal<UserSettings>({
    startDate: null,
    endDate: null,
    isFemale: false,
    menstruationDays: 7,
    dailyCapacity: 1,
    calculationMethod: 'MWL',
    habitStackingRule: null
  });

  readonly missedPrayers = signal<PrayerCounts>({ ...INITIAL_COUNTS });
  readonly completedPrayers = signal<PrayerCounts>({ ...INITIAL_COUNTS });
  readonly history = signal<HistoryLog>({});
  
  // NEW: Khushu Stats
  readonly khushuStats = signal<KhushuStats>({ ...INITIAL_KHUSHU });

  // Computed Signals
  readonly totalMissed = computed(() => {
    const counts = this.missedPrayers();
    return counts.fajr + counts.dhuhr + counts.asr + counts.maghrib + counts.isha + counts.witr;
  });

  readonly totalCompleted = computed(() => {
    const counts = this.completedPrayers();
    return counts.fajr + counts.dhuhr + counts.asr + counts.maghrib + counts.isha + counts.witr;
  });

  readonly progressPercentage = computed(() => {
    const total = this.totalMissed() + this.totalCompleted();
    if (total === 0) return 0;
    return Math.round((this.totalCompleted() / total) * 100);
  });

  readonly estimatedCompletionDate = computed(() => {
    const remaining = this.totalMissed();
    const prayersPerDay = this.userSettings().dailyCapacity * 6; 
    
    if (remaining <= 0 || prayersPerDay <= 0) return 'Completed';
    
    const daysNeeded = Math.ceil(remaining / prayersPerDay);
    const date = new Date();
    date.setDate(date.getDate() + daysNeeded);
    return date.toLocaleDateString('de-DE', { month: 'long', year: 'numeric', day: 'numeric' });
  });

  constructor() {
    this.loadFromStorage();
    
    // Auto-save effect
    effect(() => {
      localStorage.setItem('qada_settings', JSON.stringify(this.userSettings()));
      localStorage.setItem('qada_missed', JSON.stringify(this.missedPrayers()));
      localStorage.setItem('qada_completed', JSON.stringify(this.completedPrayers()));
      localStorage.setItem('qada_history', JSON.stringify(this.history()));
      localStorage.setItem('qada_khushu', JSON.stringify(this.khushuStats()));
    });
  }

  calculateMissedPrayers(start: string, end: string, isFemale: boolean, periodDays: number) {
    const startDate = new Date(start);
    const endDate = new Date(end);
    
    // Difference in time
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    
    let totalDays = diffDays;

    if (isFemale) {
        // Approximate reduction based on monthly cycle
        const reductionRatio = periodDays / 30;
        const daysToSubtract = Math.floor(totalDays * reductionRatio);
        totalDays = totalDays - daysToSubtract;
    }

    const total = totalDays;
    
    this.missedPrayers.set({
      fajr: total,
      dhuhr: total,
      asr: total,
      maghrib: total,
      isha: total,
      witr: total
    });

    this.userSettings.update(s => ({ ...s, startDate: start, endDate: end, isFemale, menstruationDays: periodDays }));
  }

  updateDailyCapacity(newCapacity: number) {
    this.userSettings.update(s => ({ ...s, dailyCapacity: newCapacity }));
  }
  
  updateHabitRule(trigger: string, action: string) {
    this.userSettings.update(s => ({ 
        ...s, 
        habitStackingRule: { trigger, action, active: true } 
    }));
  }

  adjustMissedPrayer(type: keyof PrayerCounts, amount: number) {
    // 1. Update Missed Count
    this.missedPrayers.update(current => {
      const newVal = current[type] + amount;
      return { ...current, [type]: Math.max(0, newVal) }; // Prevent negative debt
    });

    // 2. Logic Update: If user reduces debt manually (amount < 0), 
    // we assume they completed them or found they had done them previously.
    // This ensures the "Garden" and progress bars update accordingly.
    if (amount < 0) {
      const completedAmount = Math.abs(amount);
      this.completedPrayers.update(current => ({ 
        ...current, 
        [type]: current[type] + completedAmount 
      }));
    }
  }

  // Updated: Accepts optional khushu rating (1-3)
  logPrayer(type: keyof PrayerCounts, isQada: boolean, khushuRating?: number) {
    if (isQada) {
      // 1. Update Totals
      this.missedPrayers.update(current => {
        const val = current[type];
        return { ...current, [type]: Math.max(0, val - 1) };
      });
      this.completedPrayers.update(current => ({ ...current, [type]: current[type] + 1 }));

      // 2. Update History Log
      const today = new Date().toISOString().split('T')[0]; // "YYYY-MM-DD"
      this.history.update(h => {
        const currentCount = h[today] || 0;
        return { ...h, [today]: currentCount + 1 };
      });

      // 3. Update Khushu Stats (if provided)
      if (khushuRating) {
        this.khushuStats.update(k => {
          const currentStat = k[type] || { totalScore: 0, count: 0 };
          return {
            ...k,
            [type]: {
              totalScore: currentStat.totalScore + khushuRating,
              count: currentStat.count + 1
            }
          };
        });
      }

    } else {
        // Just tracking daily fard
        console.log(`Fard ${type} completed`);
    }
  }

  private loadFromStorage() {
    const s = localStorage.getItem('qada_settings');
    const m = localStorage.getItem('qada_missed');
    const c = localStorage.getItem('qada_completed');
    const h = localStorage.getItem('qada_history');
    const k = localStorage.getItem('qada_khushu');

    if (s) this.userSettings.set(JSON.parse(s));
    if (m) this.missedPrayers.set(JSON.parse(m));
    if (c) this.completedPrayers.set(JSON.parse(c));
    if (h) this.history.set(JSON.parse(h));
    if (k) this.khushuStats.set(JSON.parse(k));
  }
}