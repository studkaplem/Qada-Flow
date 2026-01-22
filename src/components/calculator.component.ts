import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { StoreService } from '../services/store.service';
import { Router } from '@angular/router';
import { TranslatePipe } from '../pipes/translate.pipe';

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

  calcForm = this.fb.group({
    startDate: ['', Validators.required],
    endDate: ['', Validators.required],
    isFemale: [false],
    menstruationDays: [7, [Validators.min(0), Validators.max(15)]],
    dailyCapacity: [1, [Validators.required, Validators.min(1)]]
  });

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

  calculate() {
    if (this.calcForm.valid) {
      const v = this.calcForm.value;
      this.store.calculateMissedPrayers(
        v.startDate!, 
        v.endDate!, 
        v.isFemale!, 
        v.menstruationDays!
      );
      this.store.userSettings.update(s => ({...s, dailyCapacity: v.dailyCapacity || 1}));
      
      this.router.navigate(['/dashboard']);
    }
  }
}