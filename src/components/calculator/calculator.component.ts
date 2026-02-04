import { Component, inject, signal, computed } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { StoreService, PrayerCounts } from '../../services/store.service';
import { Router } from '@angular/router';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { CommonModule } from '@angular/common'; 

interface QadaPeriod {
  id: string;
  startDate: string;
  endDate: string;
  selectedPrayers: { [key: string]: boolean };
  calculatedDays: number;
}

@Component({
  selector: 'app-calculator',
  standalone: true,
  imports: [ReactiveFormsModule, TranslatePipe, CommonModule],
  templateUrl: './calculator.component.html'
})
export class CalculatorComponent {
  private fb: FormBuilder = inject(FormBuilder);
  private store = inject(StoreService);
  private router = inject(Router);

  step = signal(1); // 1 = Dates, 2 = Adjustments, 3 = Confirmation
  isCalculating = signal(false);

  // Modus-Umschalter: 'simple' (Global) oder 'advanced' (Flexibel)
  mode = signal<'simple' | 'advanced'>('simple');
  // Liste der hinzugefügten Perioden (nur für Advanced Mode)
  periods = signal<QadaPeriod[]>([]);

  calcForm = this.fb.group({
    startDate: ['', Validators.required],
    endDate: ['', Validators.required],
    isFemale: [false],
    menstruationDays: [7, [Validators.min(0), Validators.max(15)]],
    dailyCapacity: [0.5, [Validators.required, Validators.min(0.5)]],
    resetHistory: [true]
  });

  // Zusatz-Formular für das Hinzufügen einer Periode im Advanced Mode
  periodForm = this.fb.group({
    pStart: ['', Validators.required],
    pEnd: ['', Validators.required],
    // Checkboxen für Gebete
    fajr: [true],
    dhuhr: [true],
    asr: [true],
    maghrib: [true],
    isha: [true],
    witr: [true]
  });

  // Helper: Gesamtschulden berechnen (Aggregation aller Perioden)
  totalDebtPreview = computed(() => {
    if (this.mode() === 'simple') {
       return { totalDays: this.calculateDaysSimple(), details: null };
    } else {
       // Advanced Aggregation
       const totals: any = { fajr: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0, witr: 0 };
       
       this.periods().forEach(p => {
          const days = this.calculateDaysForPeriod(p.startDate, p.endDate);
          // Übertrage Tage auf ausgewählte Gebete
          Object.keys(totals).forEach(type => {
             if (p.selectedPrayers[type]) {
                totals[type] += days;
             }
          });
       });
       return { totalDays: 0, details: totals }; // totalDays 0 weil individuell
    }
  });

  setMode(m: 'simple' | 'advanced') {
    this.mode.set(m);
  }

  // Fügt eine Periode zur Liste hinzu
  addPeriod() {
    const val = this.periodForm.value;
    if (!val.pStart || !val.pEnd) return;

    const days = this.calculateDaysForPeriod(val.pStart, val.pEnd);
    
    const newPeriod: QadaPeriod = {
      id: crypto.randomUUID(),
      startDate: val.pStart,
      endDate: val.pEnd,
      calculatedDays: days,
      selectedPrayers: {
        fajr: val.fajr!,
        dhuhr: val.dhuhr!,
        asr: val.asr!,
        maghrib: val.maghrib!,
        isha: val.isha!,
        witr: val.witr!
      }
    };

    this.periods.update(list => [...list, newPeriod]);
    
    // Reset period form dates, but keep checkboxes
    this.periodForm.patchValue({ pStart: '', pEnd: '' });
  }

  removePeriod(id: string) {
    this.periods.update(list => list.filter(p => p.id !== id));
  }

  // Helper für UI Anzeige
  get totalYears() {
    const s = this.calcForm.value.startDate;
    const e = this.calcForm.value.endDate;
    if (!s || !e) return 0;
    const start = new Date(s);
    const end = new Date(e);
    const diff = end.getTime() - start.getTime();
    return (diff / (1000 * 60 * 60 * 24 * 365)).toFixed(1);
  }

  get totalYearsSimple() {
    const days = this.calculateDaysSimple();
    return (days / 365).toFixed(1);
  }

  nextStep() {
    // Validierung abhängig vom Modus
    if (this.step() === 1) {
        if (this.mode() === 'simple') {
            if (this.calcForm.controls.startDate.valid && this.calcForm.controls.endDate.valid) {
                this.step.set(2);
            }
        } else {
            // Advanced Mode: Mindestens eine Periode muss da sein
            if (this.periods().length > 0) {
                this.step.set(2);
            }
        }
    } else if (this.step() === 2) {
      this.step.set(3);
    }
  }

  prevStep() {
    if (this.step() > 1) this.step.update(s => s - 1);
  }

  async calculateAndSave() {
    this.isCalculating.set(true);

    // Get reset preference
    const shouldReset = this.calcForm.value.resetHistory ?? true;

    try {
      if (this.mode() === 'simple') {
          const days = this.calculateDaysSimple();
          // Pass shouldReset to service
          await this.store.initializePrayerCounts(days, shouldReset);
      } else {
          const totals = this.totalDebtPreview().details;
          if (totals) {
              // Pass shouldReset to service
              await this.store.initializePrayerCounts(totals, shouldReset);
          }
      }

      const val = this.calcForm.value;
      await this.store.updateSettings({
        startDate: new Date().toISOString(),
        dailyCapacity: val.dailyCapacity!,
        isFemale: val.isFemale!,
        menstruationDays: val.menstruationDays!
      });

      this.router.navigate(['/dashboard']);
    } catch (e) {
      console.error(e);
    } finally {
      this.isCalculating.set(false);
    }
  }

  // Logik für Menstruation pro Periode/Zeitraum anwenden
  private calculateDaysForPeriod(startStr: string, endStr: string): number {
    const start = new Date(startStr);
    const end = new Date(endStr);
    const diffTime = end.getTime() - start.getTime();
    if (diffTime < 0) return 0;
    
    const totalDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    // Menstruations-Abzug
    const isFemale = this.calcForm.value.isFemale;
    const mDays = this.calcForm.value.menstruationDays || 0;
    
    if (isFemale && mDays > 0) {
        const years = totalDays / 365;
        const deduction = Math.floor(years * 12 * mDays);
        return Math.max(0, totalDays - deduction);
    }
    return totalDays;
  }

  // Wrapper für den Simple Mode (nutzt das Hauptformular)
  calculateDaysSimple(): number {
     const s = this.calcForm.value.startDate;
     const e = this.calcForm.value.endDate;
     if (!s || !e) return 0;
     return this.calculateDaysForPeriod(s, e);
  }

}