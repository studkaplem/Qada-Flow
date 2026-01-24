import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { StoreService, PrayerCounts } from '../services/store.service';
import { Router } from '@angular/router';
import { TranslatePipe } from '../pipes/translate.pipe';
import { CommonModule } from '@angular/common'; 

@Component({
  selector: 'app-calculator',
  standalone: true,
  imports: [ReactiveFormsModule, TranslatePipe],
  templateUrl: './calculator.component.html'
})
export class CalculatorComponent {
  private fb: FormBuilder = inject(FormBuilder);
  private store = inject(StoreService);
  private router = inject(Router);

  step = signal(1); // 1 = Dates, 2 = Adjustments, 3 = Confirmation
  isCalculating = signal(false);

  calcForm = this.fb.group({
    startDate: ['', Validators.required],
    endDate: ['', Validators.required],
    isFemale: [false],
    menstruationDays: [7, [Validators.min(0), Validators.max(15)]],
    dailyCapacity: [1, [Validators.required, Validators.min(1)]]
  });

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

  nextStep() {
    if (this.step() === 1 && this.calcForm.controls.startDate.valid && this.calcForm.controls.endDate.valid) {
      this.step.set(2);
    } else if (this.step() === 2) {
      this.step.set(3);
    }
  }

  prevStep() {
    if (this.step() > 1) this.step.update(s => s - 1);
  }

  async calculateAndSave() {
    const val = this.calcForm.value;
    if (!val.startDate || !val.endDate) return;

    this.isCalculating.set(true);

    // Berechnung der Tage
    const start = new Date(val.startDate);
    const end = new Date(val.endDate);
    const days = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    
    // Einfache Logik: Alles 1x pro Tag verpasst
    let adjustedDays = days;
    if (val.isFemale && val.menstruationDays) {
        const years = days / 365;
        adjustedDays -= (years * 12 * val.menstruationDays);
    }
  
    const initialDebt = Math.floor(adjustedDays);

    try {
      // WARTEN auf DB Speicher
      await this.store.initializePrayerCounts(initialDebt);
      await this.store.updateSettings({
        startDate: val.startDate,
        isFemale: val.isFemale || false,
        menstruationDays: val.menstruationDays || 7,
        dailyCapacity: val.dailyCapacity || 1,
        calculationMethod: 'UserCalc'
      });
      this.router.navigate(['/dashboard']);
    } catch (e) {
      console.error('Error saving plan', e);
    } finally {
      this.isCalculating.set(false);
    }
  }
}