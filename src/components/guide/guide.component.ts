import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-guide',
  standalone: true,
  imports: [CommonModule, TranslatePipe, RouterLink],
  templateUrl: './guide.component.html'
})
export class GuideComponent {}