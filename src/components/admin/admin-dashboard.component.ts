import { Component, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ContentService, Article } from '../../services/content.service';
import { TranslatePipe } from '../../pipes/translate.pipe';

type Timeframe = '1w' | '1m' | '6m' | '1y';
type MetricType = 'users' | 'active' | 'db' | 'cost';

interface ChartPoint {
    label: string;
    value: number;
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslatePipe],
  templateUrl: './admin-dashboard.component.html'
})
export class AdminDashboardComponent {
  contentService = inject(ContentService);
  private fb = inject(FormBuilder);

  activeTab = signal<'analytics' | 'content'>('analytics');
  
  // Analytics State
  growthTimeframe = signal<Timeframe>('1m');
  selectedMetric = signal<MetricType>('users');
  chartData: ChartPoint[] = [];

  // CMS State
  editingArticleId = signal<string | null>(null);

  // CMS Form
  articleForm = this.fb.group({
    title: ['', Validators.required],
    category: ['islamic', Validators.required],
    excerpt: ['', Validators.required],
    content: ['', Validators.required], // Store as one string, split by newline later
    actionStep: ['', Validators.required],
    readTime: ['2 min', Validators.required],
    source: ['Admin', Validators.required],
    icon: ['fa-star', Validators.required]
  });

  // Analytics Mock Data Holders
  stats = signal({
    totalUsers: 1420,
    dailyActive: 340,
    databaseSize: '450 MB',
    estCost: '$12.40'
  });

  constructor() {
    // Regenerate charts whenever timeframe or selected metric changes
    effect(() => {
        this.generateMockCharts(this.growthTimeframe(), this.selectedMetric());
    });
  }

  selectMetric(metric: MetricType) {
      this.selectedMetric.set(metric);
  }
  
  // Helper for tooltip display
  getMetricLabel(value: number): string {
      const type = this.selectedMetric();
      if (type === 'cost') return `$${value.toFixed(2)}`;
      if (type === 'db') return `${value} MB`;
      if (type === 'users') return `${value} Users`;
      if (type === 'active') return `${value} Active`;
      return `${value}`;
  }

  generateMockCharts(timeframe: Timeframe, metric: MetricType) {
    this.chartData = [];
    let base = 0;
    let volatility = 0;
    
    // Set base values depending on metric
    switch(metric) {
        case 'users': base = 1000; volatility = 20; break;
        case 'active': base = 300; volatility = 50; break;
        case 'db': base = 400; volatility = 5; break; // MB
        case 'cost': base = 10; volatility = 1; break; // $
    }

    // Helpers for labels
    const getDayName = (offset: number) => {
        const d = new Date();
        d.setDate(d.getDate() - offset);
        return d.toLocaleDateString('en-US', { weekday: 'short' });
    };

    const getMonthName = (offset: number) => {
        const d = new Date();
        d.setMonth(d.getMonth() - offset);
        return d.toLocaleDateString('en-US', { month: 'short' });
    };

    const addPoint = (label: string, val: number) => {
        this.chartData.push({ label, value: Math.max(0, val) });
    };

    // Generation Logic
    if (timeframe === '1w') {
        // Last 7 days
        for(let i=6; i>=0; i--) {
            // Simulate trend
            if (metric === 'users' || metric === 'db') base += Math.random() * 10;
            if (metric === 'active') base = 300 + (Math.random() * 100 - 50);
            
            const noise = (Math.random() * volatility) - (volatility/2);
            addPoint(getDayName(i), Math.round(base + noise));
        }
    } else if (timeframe === '1m') {
        // Last 30 days
        for(let i=29; i>=0; i--) {
            if (metric === 'users' || metric === 'db') base += Math.random() * 5;
            if (metric === 'active') base = 300 + (Math.random() * 100 - 50);

            const showLabel = i % 5 === 0;
            const d = new Date();
            d.setDate(d.getDate() - i);
            const noise = (Math.random() * volatility) - (volatility/2);
            
            addPoint(showLabel ? `${d.getDate()}.` : '', Math.round(base + noise));
        }
    } else if (timeframe === '6m') {
         // Last 6 months
         if (metric === 'users') base = 500; // Reset for longer timeframe simulation

         for(let i=5; i>=0; i--) {
            base += (metric === 'users' ? 150 : metric === 'db' ? 50 : 0);
            if (metric === 'active') base = 300 + (Math.random() * 50);

            const noise = (Math.random() * volatility * 2);
            addPoint(getMonthName(i), Math.round(base + noise));
         }
    } else if (timeframe === '1y') {
        // Last 12 months
         if (metric === 'users') base = 100;

         for(let i=11; i>=0; i--) {
            base += (metric === 'users' ? 120 : metric === 'db' ? 40 : 0);
            if (metric === 'active') base = 300 + (Math.random() * 50);

            const noise = (Math.random() * volatility * 3);
            addPoint(getMonthName(i), Math.round(base + noise));
         }
    }
  }

  setTab(tab: 'analytics' | 'content') {
    this.activeTab.set(tab);
  }
  
  setTimeframe(tf: Timeframe) {
      this.growthTimeframe.set(tf);
  }

  // --- CMS Actions ---

  editArticle(article: Article) {
      this.editingArticleId.set(article.id);
      
      // Populate form
      this.articleForm.patchValue({
          title: article.title || '',
          category: article.category,
          excerpt: article.excerpt || '',
          content: (article.content || []).join('\n'),
          actionStep: article.actionStep || '',
          readTime: article.readTime,
          source: article.source || 'Admin',
          icon: article.icon
      });
      
      // Scroll to form on mobile
      window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  cancelEdit() {
      this.editingArticleId.set(null);
      this.resetForm();
  }

  deleteArticle(id: string) {
    if(confirm('Are you sure you want to delete this article?')) {
        this.contentService.deleteArticle(id);
        if (this.editingArticleId() === id) {
            this.cancelEdit();
        }
    }
  }

  submitArticle() {
    if (this.articleForm.valid) {
      const v = this.articleForm.value;
      
      const articleData = {
        category: v.category as any,
        icon: v.icon || 'fa-star',
        readTime: v.readTime || '2 min',
        title: v.title!,
        excerpt: v.excerpt!,
        content: (v.content || '').split('\n').filter(p => p.trim().length > 0),
        actionStep: v.actionStep!,
        source: v.source!
      };

      if (this.editingArticleId()) {
          // Update existing
          this.contentService.updateArticle(this.editingArticleId()!, articleData);
          alert('Article updated successfully!');
      } else {
          // Create new
          this.contentService.addArticle(articleData);
          alert('Article published successfully!');
      }

      this.cancelEdit(); // Resets form and ID
    }
  }
  
  private resetForm() {
      this.articleForm.reset({
        category: 'islamic',
        readTime: '2 min',
        source: 'Admin',
        icon: 'fa-star'
      });
  }
  
  getGrowthHeight(val: number): string {
      const values = this.chartData.map(p => p.value);
      const max = Math.max(...values);
      const min = Math.min(...values);
      const range = max - min;
      const normalized = (val - min) / (range || 1); // Avoid divide by zero
      return (normalized * 80 + 10) + '%'; // Min 10% height
  }
}