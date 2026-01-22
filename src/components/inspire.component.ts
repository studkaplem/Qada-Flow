import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '../pipes/translate.pipe';
import { TranslationService } from '../services/translation.service';
import { ContentService, Article } from '../services/content.service';

interface ContentCard extends Article {
  displayTitle: string;
  displayExcerpt: string;
  displayContent: string[]; 
  displayAction: string;
  displaySource?: string;
}

@Component({
  selector: 'app-inspire',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './inspire.component.html'
})
export class InspireComponent {
  private ts = inject(TranslationService);
  private contentService = inject(ContentService);
  
  // Filter State
  activeFilter = signal<'all' | 'islamic' | 'science' | 'practical'>('all');
  
  // Modal State
  selectedCard = signal<ContentCard | null>(null);

  // Dynamic Quote from Translations
  dailyQuote = computed(() => {
     const q = this.ts.currentDictionary()?.inspire?.quote;
     return q || { text: '...', source: '...' };
  });

  // Computed content that merges metadata with current translation dictionary OR uses custom content
  filteredContent = computed(() => {
    const dict = this.ts.currentDictionary()?.inspire?.articles;
    const rawArticles = this.contentService.articles();

    const allCards: ContentCard[] = rawArticles.map(article => {
       if (article.isCustom) {
         // Use raw data for custom articles
         return {
           ...article,
           displayTitle: article.title || '',
           displayExcerpt: article.excerpt || '',
           displayContent: article.content || [],
           displayAction: article.actionStep || '',
           displaySource: article.source
         };
       } else {
         // Use i18n for default articles
         const trans = (dict as any)?.[article.id];
         return {
            ...article,
            displayTitle: trans?.title || 'Loading...',
            displayExcerpt: trans?.excerpt || '...',
            displayContent: trans?.content || [],
            displayAction: trans?.action || '',
            displaySource: trans?.source
         };
       }
    });

    const filter = this.activeFilter();
    if (filter === 'all') return allCards;
    return allCards.filter(c => c.category === filter);
  });

  setFilter(f: 'all' | 'islamic' | 'science' | 'practical') {
    this.activeFilter.set(f);
  }

  openCard(card: ContentCard) {
    this.selectedCard.set(card);
    document.body.style.overflow = 'hidden'; 
  }

  closeCard() {
    this.selectedCard.set(null);
    document.body.style.overflow = ''; 
  }
}