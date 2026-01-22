import { Injectable, signal, effect } from '@angular/core';

export interface Article {
  id: string;
  category: 'islamic' | 'science' | 'practical';
  icon: string;
  readTime: string;
  isCustom: boolean;
  // Required for DB migration / editable CMS
  title: string;
  excerpt: string;
  content: string[];
  actionStep: string;
  source: string;
}

const DEFAULT_ARTICLES: Article[] = [
  { 
    id: 'a1', 
    category: 'science', 
    icon: 'fa-chart-line', 
    readTime: '2 min', 
    isCustom: false, // Set to false to use i18n translations
    title: 'The Science of Habit Formation',
    excerpt: 'Why small, consistent actions (Istiqamah) rewire your brain more effectively than sudden bursts of effort.',
    content: [
      'Neuroplasticity research shows that repeating a behavior in a specific context strengthens the neural pathways associated with that action. This is the biological basis of "Istiqamah".',
      'When you perform Qada prayers immediately after a Fard prayer, you leverage an existing neural trigger. This reduces the "activation energy" required to start the task.',
      'James Clear, author of Atomic Habits, calls this "Habit Stacking". In Islam, we are taught that the most beloved deeds to Allah are those that are consistent, even if small.'
    ],
    actionStep: 'Link one Qada prayer to your Dhuhr prayer for the next 7 days.',
    source: 'Atomic Habits / Sunnah'
  },
  { 
    id: 'a2', 
    category: 'practical', 
    icon: 'fa-link', 
    readTime: '3 min', 
    isCustom: false,
    title: 'Overcoming Decision Fatigue',
    excerpt: 'Stop asking yourself "Should I pray Qada now?". Make it a rule, not a choice.',
    content: [
      'Decision fatigue refers to the deteriorating quality of decisions made by an individual after a long session of decision making.',
      'If you have to decide *when* to pray your Qada every single day, you will eventually choose not to do it because your willpower is drained.',
      'The solution is to automate the decision. Create a rule: "I always pray Qada before breakfast" or "I always pray Qada after Maghrib". Once the rule is set, the negotiation with yourself ends.'
    ],
    actionStep: 'Set a fixed time for your Qada and stick to it for 3 days.',
    source: 'Psychology of Willpower'
  },
  { 
    id: 'a3', 
    category: 'islamic', 
    icon: 'fa-user-check', 
    readTime: '2 min', 
    isCustom: false,
    title: 'Hope over Despair (Rawj & Khawf)',
    excerpt: 'Your debt is large, but Allah’s mercy is larger. How to balance fear and hope.',
    content: [
      'Shaytan wants you to look at the mountain of missed prayers and despair. He wants you to think "It is impossible, I will never finish".',
      'This is a trap. Allah does not ask you to finish everything today. He asks you to try today. If you die with the sincere intention of paying back your debt, and you were working towards it, there is great hope in His mercy.',
      'Focus on the step you are taking now, not the entire journey ahead.'
    ],
    actionStep: 'Make a sincere Dua asking Allah to help you remain consistent.',
    source: 'Theology of Repentance'
  },
  { 
    id: 'a4', 
    category: 'practical', 
    icon: 'fa-compass-drafting', 
    readTime: '1 min', 
    isCustom: false,
    title: 'The "Sprint" vs. "Marathon" Mindset',
    excerpt: 'Why burning out in the first week causes failure. Slow and steady wins the race.',
    content: [
      'Many people start their Qada journey by praying 50 sets in one day. After 3 days, they are exhausted and stop completely.',
      'This is the sprint mindset, and it fails in spiritual marathons. The Prophet (pbuh) advised moderation. Do what you can sustain.',
      'Calculated consistency beats sporadic intensity every time.'
    ],
    actionStep: 'Reduce your daily target to a number you can definitely hit even on your worst day.',
    source: 'Productivity Tips'
  },
  { 
    id: 'a5', 
    category: 'science', 
    icon: 'fa-stopwatch', 
    readTime: '2 min', 
    isCustom: false,
    title: 'The Dopamine of Progress',
    excerpt: 'Using visual trackers to hack your brain\'s reward system for spiritual gain.',
    content: [
      'The brain releases dopamine when it anticipates a reward or sees progress. This is why ticking a box on a checklist feels good.',
      'Qada Flow uses the "Garden" visualization to give you that visual feedback. Seeing your garden grow gives your brain a signal that you are moving forward.',
      'Do not underestimate the power of simply tracking your numbers. What gets measured, gets managed.'
    ],
    actionStep: 'Check your progress graph after logging your prayers today.',
    source: 'Behavioral Psychology'
  },
  { 
    id: 'a6', 
    category: 'islamic', 
    icon: 'fa-hands-holding-heart', 
    readTime: '3 min', 
    isCustom: false,
    title: 'Qada as a form of Tawbah',
    excerpt: 'Repaying your debt is not a punishment, it is a purification.',
    content: [
      'Do not view your Qada prayers as a burden or a punishment for past sins. View them as a ladder.',
      'Every Sujood you perform in Qada is washing away the negligence of the past. It is an active form of Tawbah (Repentance).',
      'Turn your regret into action. Action wipes out the error.'
    ],
    actionStep: 'Perform Wudu with the intention of washing away sins.',
    source: 'Spiritual Purification'
  }
];

@Injectable({
  providedIn: 'root'
})
export class ContentService {
  readonly articles = signal<Article[]>([]);

  constructor() {
    this.loadContent();
    
    effect(() => {
      localStorage.setItem('qada_content', JSON.stringify(this.articles()));
    });
  }

  private loadContent() {
    const stored = localStorage.getItem('qada_content');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Merge defaults if local storage is empty or user reset
        if (parsed.length === 0) {
            this.articles.set(DEFAULT_ARTICLES);
        } else {
            this.articles.set(parsed);
        }
      } catch(e) {
        this.articles.set(DEFAULT_ARTICLES);
      }
    } else {
      this.articles.set(DEFAULT_ARTICLES);
    }
  }

  addArticle(article: Omit<Article, 'id' | 'isCustom'>) {
    const newArticle: Article = {
      ...article,
      id: crypto.randomUUID(),
      isCustom: true
    };
    
    this.articles.update(list => [newArticle, ...list]);
  }

  updateArticle(id: string, data: Partial<Omit<Article, 'id' | 'isCustom'>>) {
    this.articles.update(list => list.map(item => {
      if (item.id === id) {
        return { ...item, ...data };
      }
      return item;
    }));
  }

  deleteArticle(id: string) {
    this.articles.update(list => list.filter(a => a.id !== id));
  }

  resetDefaults() {
    this.articles.set(DEFAULT_ARTICLES);
  }
}