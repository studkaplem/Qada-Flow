import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { TranslationService } from '../../services/translation.service';
import { ContentService, InspirationPost } from '../../services/content.service';

@Component({
  selector: 'app-inspire',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './inspire.component.html'
})
export class InspireComponent implements OnInit {
  private ts = inject(TranslationService);
  contentService = inject(ContentService); // Public machen für HTML Zugriff
  
  // Filter State
  activeFilter = signal<'all' | 'islamic' | 'science' | 'practical'>('all');
  
  // Modal State
  selectedCard = signal<InspirationPost | null>(null);

  dailyQuote = computed(() => {
     const q = this.ts.currentDictionary()?.inspire?.quote;
     return q || { text: '...', source: '...' };
  });

  ngOnInit() {
    this.contentService.loadPosts();
  }

  filteredContent = computed(() => {
    const posts = this.contentService.posts();
    const filter = this.activeFilter();

    if (filter === 'all') return posts;
    
    // Typ-Sicheres Filtern
    return posts.filter(post => post.category === filter);
  });

  setFilter(f: 'all' | 'islamic' | 'science' | 'practical') {
    this.activeFilter.set(f);
  }

  openCard(card: InspirationPost) {
    this.selectedCard.set(card);
    document.body.style.overflow = 'hidden'; 
  }

  closeCard() {
    this.selectedCard.set(null);
    document.body.style.overflow = ''; 
  }
  
  // Helper für Icon (falls nicht im Objekt, holen wir es vom Service)
  getIcon(post: InspirationPost): string {
    if (post.icon) return post.icon;
    // Fallback auf Service-Logik, falls Icon fehlt
    return (this.contentService as any)['getIconForCategory'] 
      ? (this.contentService as any).getIconForCategory(post.category) 
      : 'fa-star';
  }
}