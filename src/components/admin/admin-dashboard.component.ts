import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ContentService, InspirationPost } from '../../services/content.service';
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
  isEditorOpen = signal(false);
  editingPostId = signal<number | null>(null);

  postForm = this.fb.group({
    title: ['', Validators.required],
    category: ['islamic', Validators.required],
    read_time: ['2 min', Validators.required],
    excerpt: ['', Validators.required],
    contentBody: ['', Validators.required],
    action_step: [''],
    source: ['']
  });

  // Analytics Mock Data Holders
  stats = signal({
    totalUsers: 1420,
    dailyActive: 340,
    databaseSize: '450 MB',
    estCost: '$12.40'
  });

  ngOnInit() {
    this.contentService.loadPosts();
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

  openEditor(post?: InspirationPost) {
    this.isEditorOpen.set(true);
    
    if (post) {
      this.editingPostId.set(post.id!);
      
      // DB Array -> Textarea String (verbunden mit zwei Zeilenumbrüchen)
      const bodyText = Array.isArray(post.content) 
        ? post.content.join('\n\n') 
        : '';

      this.postForm.patchValue({
        title: post.title,
        category: post.category,
        read_time: post.read_time,
        excerpt: post.excerpt,
        contentBody: bodyText,
        action_step: post.action_step,
        source: post.author || ''
      });
    } else {
      // Reset für neuen Post
      this.editingPostId.set(null);
      this.postForm.reset({
        category: 'islamic',
        read_time: '2 min'
      });
    }
  }

  closeEditor() {
    this.isEditorOpen.set(false);
    this.editingPostId.set(null);
  }

  async deletePost(id: number) {
    if (confirm('Diesen Beitrag wirklich löschen?')) {
      await this.contentService.deletePost(id);
    }
  }

  async savePost() {
    if (this.postForm.invalid) return;

    const v = this.postForm.value;
    
    // Textarea String -> DB Array (Split bei Leerzeilen)
    const contentArray = v.contentBody 
      ? v.contentBody.split('\n\n').map(p => p.trim()).filter(p => p.length > 0)
      : [];

    const postData: InspirationPost = {
      title: v.title!,
      category: v.category as any,
      read_time: v.read_time!,
      excerpt: v.excerpt!,
      content: contentArray,
      action_step: v.action_step || '',
      // Icon wird im Service gesetzt
    };

    if (this.editingPostId()) {
      await this.contentService.updatePost(this.editingPostId()!, postData);
    } else {
      await this.contentService.createPost(postData);
    }

    this.closeEditor();
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