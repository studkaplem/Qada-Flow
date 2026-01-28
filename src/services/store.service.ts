import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { SupabaseClient, createClient } from '@supabase/supabase-js';
import { environment } from '../environments/environment';
import { AuthService } from './auth.service';

// --- Domain Models (Erweitert wie gewünscht) ---

export interface PrayerCounts {
  fajr: number; dhuhr: number; asr: number; maghrib: number; isha: number; witr: number;
}

export interface HabitRule {
  trigger: string; 
  action: string;
  active: boolean;
}

export interface UserSettings {
  calculationMethod: string;
  startDate: string;
  dailyCapacity: number;
  isFemale: boolean;
  menstruationDays: number;
  habitStackingRule: HabitRule | null;
  madhab: 'hanafi' | 'shafi'; // TODO: change this later
}

export interface HistoryLog {
  [date: string]: number; 
}

export interface KhushuStats {
  [key: string]: { totalScore: number; count: number }; 
}

// Defaults
const DEFAULT_COUNTS: PrayerCounts = { fajr: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0, witr: 0 };
const DEFAULT_SETTINGS: UserSettings = {
  calculationMethod: 'MWL',
  startDate: new Date().toISOString(),
  dailyCapacity: 1,
  isFemale: false,
  menstruationDays: 7,
  habitStackingRule: null,
  madhab: 'hanafi'
};

@Injectable({
  providedIn: 'root'
})
export class StoreService {
  private supabase: SupabaseClient;
  private auth = inject(AuthService);

  // --- STATE (Signals) ---
  readonly prayerCounts = signal<PrayerCounts>(DEFAULT_COUNTS); // Schulden
  readonly completedCounts = signal<PrayerCounts>(DEFAULT_COUNTS); // Erledigte Gebete
  readonly settings = signal<UserSettings>(DEFAULT_SETTINGS);
  
  // Diese waren im alten Service im localStorage, jetzt kommen sie aus der DB View
  readonly history = signal<HistoryLog>({});
  readonly khushuStats = signal<KhushuStats>({});
  
  readonly isLoading = signal<boolean>(false);

  // Computed
  readonly totalMissed = computed(() => {
    const c = this.prayerCounts();
    return c.fajr + c.dhuhr + c.asr + c.maghrib + c.isha + c.witr;
  });

  readonly totalCompletedAbsolute = computed(() => {
    const c = this.completedCounts();
    return c.fajr + c.dhuhr + c.asr + c.maghrib + c.isha + c.witr;
  });

  // Berechnet, ob der User überhaupt schon gestartet hat (für Dashboard Empty State)
  readonly hasStarted = computed(() => this.totalMissed() > 0 || Object.keys(this.history()).length > 0);

  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);

    effect(() => {
      const user = this.auth.currentUser();
      if (user) {
        this.loadUserData(user.id);
      } else {
        this.resetState();
      }
    }, { allowSignalWrites: true });
  }

  private resetState() {
    this.prayerCounts.set(DEFAULT_COUNTS);
    this.settings.set(DEFAULT_SETTINGS);
    this.history.set({});
    this.khushuStats.set({});
  }
  
  /**
   * Lädt ALLE relevanten Informationen parallel aus DB und Views
   */
  private async loadUserData(userId: string) {
    this.isLoading.set(true);
    try {
      const [resSettings, resCounts, resKhushu, resHistory] = await Promise.all([
        this.supabase.from('profiles').select('settings').eq('id', userId).single(),
        this.supabase.from('view_prayer_counts').select('*').eq('user_id', userId),
        this.supabase.from('view_khushu_stats').select('*').eq('user_id', userId),
        this.supabase.from('view_daily_history').select('*').eq('user_id', userId)
      ]);

      if (resSettings.data?.settings) this.settings.set({ ...DEFAULT_SETTINGS, ...resSettings.data.settings });

      if (resCounts.data) {
        const newMissed = { ...DEFAULT_COUNTS };
        const newCompleted = { ...DEFAULT_COUNTS };
        
        resCounts.data.forEach((row: any) => {
          const type = row.prayer_type;
          if (Object.keys(newMissed).includes(type)) {
            (newMissed as any)[type] = Number(row.total_count) || 0;
            (newCompleted as any)[type] = Number(row.completed_count) || 0; // Das neue Feld aus der SQL View
          }
        });
        
        this.prayerCounts.set(newMissed);
        this.completedCounts.set(newCompleted);
      }
      
      // History Mapping (Bleibt für den Garden relevant)
      if (resHistory.data) {
        const hist: HistoryLog = {};
        resHistory.data.forEach((row: any) => { hist[row.log_date] = row.prayers_done; });
        this.history.set(hist);
      }
      // Khushu Mapping
      if (resKhushu.data) {
        const stats: KhushuStats = {};
        resKhushu.data.forEach((row: any) => {
          stats[row.prayer_type] = { totalScore: row.total_score, count: row.rating_count };
        });
        this.khushuStats.set(stats);
      }

    } catch (err) {
      console.error('[Store] Load Error', err);
    } finally {
      this.isLoading.set(false);
    }
  }


  /**
   * Transaktion ausführen (Zählt +1/-1 und aktualisiert Khushu & History)
   */
  async updatePrayerCount(type: keyof PrayerCounts, change: number, khushuRating?: number) {
    const user = this.auth.currentUser();
    if (!user) return;

    // Optimistic Update Schulden
    this.prayerCounts.update(c => ({ ...c, [type]: Math.max(0, (c[type] || 0) + change) }));
    
    // Optimistic Update Erledigt & History (nur wenn change negativ ist)
    if (change < 0) {
        this.completedCounts.update(c => ({ ...c, [type]: (c[type] || 0) + 1 }));

        // History Log für Garden
        const today = new Date().toISOString().split('T')[0];
        this.history.update(h => ({ ...h, [today]: (h[today] || 0) + 1 }));

        // Khushu Stats (optional, nur wenn vom Tracker übergeben)
        if (khushuRating !== undefined && khushuRating !== null) {
             this.khushuStats.update(k => {
                const current = k[type] || { totalScore: 0, count: 0 };
                return { ...k, [type]: { totalScore: current.totalScore + khushuRating, count: current.count + 1 }};
            });
        }
    }

    await this.supabase.from('qada_transactions').insert({
      user_id: user.id,
      prayer_type: type,
      amount: change,
      khushu_rating: khushuRating || null,
      is_qada: true
    });
  }

  /**
   * Initialisiert oder Aktualisiert die Schulden.
   * @param debtData Zahl (für alle) oder Objekt (individuell)
   * @param resetHistory 
   * - true: "Hard Reset" -> Alles löschen, bei Null anfangen.
   * - false: "Additiv" -> Neue Schulden werden zu den bestehenden ADDIERT.
   */
  async initializePrayerCounts(debtData: number | PrayerCounts, resetHistory: boolean = true) {
    this.isLoading.set(true);
    const user = this.auth.currentUser();
    
    if (!user) {
        this.isLoading.set(false);
        return; 
    }

    const types: (keyof PrayerCounts)[] = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha', 'witr'];
    
    // =========================================================
    // 1. RESET LOGIK (Nur bei Hard Reset)
    // =========================================================
    if (resetHistory) {
        // ... (Dieser Teil bleibt gleich wie zuvor: Alles löschen) ...
        const { error } = await this.supabase.from('qada_transactions').delete().eq('user_id', user.id);
        
        if (error) {
            console.error("CRITICAL: Konnte Daten nicht löschen.", error);
            this.isLoading.set(false);
            alert("Fehler beim Zurücksetzen.");
            return;
        }

        this.completedCounts.set({ ...DEFAULT_COUNTS });
        this.history.set({});
        this.khushuStats.set({}); 
    } 
    
    // WICHTIG: Kein 'else { delete... }' mehr! 
    // Wenn resetHistory=false ist, lassen wir die alten Einträge einfach in der DB.

    // =========================================================
    // 2. NEUE SCHULDEN HINZUFÜGEN (Additiv)
    // =========================================================
    
    // Wir fügen einfach NEUE Transaktionen hinzu.
    // SQL View (view_prayer_counts) summiert das automatisch für uns!
    // Beispiel: Alt = 100, Neu = 50 -> View zeigt 150.
    
    const updates = types.map(type => {
      const amount = typeof debtData === 'number' ? debtData : debtData[type];
      return {
        user_id: user.id,
        prayer_type: type,
        amount: amount, // Positive Zahl = Schuld wird erhöht
        is_qada: true
      };
    });

    if (updates.length > 0) {
      const { error } = await this.supabase.from('qada_transactions').insert(updates);
      
      if (!error) {
          // Update Local State
          // Wenn Reset: Setze exakt auf neuen Wert.
          // Wenn Additiv: Addiere zum aktuellen Wert.
          
          this.prayerCounts.update(current => {
              const newCounts = { ...current };
              types.forEach(t => {
                  const addedAmount = typeof debtData === 'number' ? debtData : debtData[t];
                  
                  if (resetHistory) {
                      newCounts[t] = addedAmount; // Reset: Exakter Wert
                  } else {
                      newCounts[t] = (current[t] || 0) + addedAmount; // Additiv: Alter Wert + Neuer Wert
                  }
              });
              return newCounts;
          });

      } else {
          console.error("Error initializing counts:", error);
      }
    }
    
    this.isLoading.set(false);
  }

  /**
   * Speichert komplexe Settings (ink. HabitRule & Menstruation)
   */
  async updateSettings(newSettings: Partial<UserSettings>) {
    const user = this.auth.currentUser();
    if (!user) return;

    // Lokal sofort anzeigen (Optimistic Update)
    const updatedState = { ...this.settings(), ...newSettings };
    this.settings.set(updatedState);

    const { data, error } = await this.supabase
      .from('profiles')
      .update({ settings: updatedState })
      .eq('id', user.id)
      .select();

    if (error) {
      console.error('[Store] Fehler beim Speichern:', error.message);
    } else if (data && data.length === 0) {
      console.warn('[Store] WARNUNG: Einstellungen wurden nicht gespeichert! Profil fehlt in DB.');
    } else {
      console.log('[Store] Einstellungen erfolgreich gespeichert:', newSettings);
    }
  }
}