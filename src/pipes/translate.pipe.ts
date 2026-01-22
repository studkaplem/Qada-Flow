import { Pipe, PipeTransform, inject } from '@angular/core';
import { TranslationService } from '../services/translation.service';

@Pipe({
  name: 'translate',
  standalone: true,
  pure: false // Impure to update when signal changes in service
})
export class TranslatePipe implements PipeTransform {
  private ts = inject(TranslationService);

  transform(key: string): string {
    return this.ts.translate(key);
  }
}