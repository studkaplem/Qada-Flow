import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ContentService, InspirationPost } from '../../services/content.service';
import { AdminService } from '../../services/admin.service';
import { TranslatePipe } from '../../pipes/translate.pipe';

type Timeframe = '1w' | '1m' | '1y';
type MetricType = 'users' | 'active' | 'db' | 'cost';

interface ChartPoint {
    label: string;
    value: number;
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  providers: [DatePipe],
  imports: [CommonModule, ReactiveFormsModule, TranslatePipe],
  templateUrl: './admin-dashboard.component.html'
})
export class AdminDashboardComponent implements OnInit{
  contentService = inject(ContentService);
  adminService = inject(AdminService);
  private fb = inject(FormBuilder);
  private datePipe = inject(DatePipe);

  activeTab = signal<'analytics' | 'content'>('analytics');
  selectedTimeframe = signal<Timeframe>('1w');
  
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

  // Dynamische Berechnung basierend auf Datenbankgröße
  // TODO: nutzen wenn preismodel sich ändert
  estimatedCost = computed(() => {
    const stats = this.adminService.stats();
    if (!stats) return '$0.00';
    
    // Pro Plan $25 + $0.125 pro GB über 8GB
    const basePrice = 25.00; 
    const sizeGB = stats.rawDbSize / (1024 * 1024 * 1024);
    const extraStorage = Math.max(0, sizeGB - 8) * 0.125;
    
    return '$' + (basePrice + extraStorage).toFixed(2);
  });

  chartMax = computed(() => {
    const data = this.adminService.stats()?.chartData || [];
    if (data.length === 0) return 10;
    return Math.max(...data.map(d => d.value)) * 1.2; // +20% Buffer oben
  });

  ngOnInit() {
    this.refreshStats();
  }

  // Zentraler Refresh
  refreshStats() {
    this.adminService.loadStats(
      this.growthTimeframe(), 
      this.selectedMetric()
    );
    this.contentService.loadPosts();
  }

  selectMetric(metric: MetricType) {
    this.selectedMetric.set(metric);
    this.refreshStats();
  }

  // Titel basierend auf Auswahl
  getChartTitle(): string {
    switch(this.selectedMetric()) {
      case 'users': return 'Wachstum: Neue Benutzer';
      case 'active': return 'Trend: Aktive Benutzer (Daily)';
      case 'db': return 'Datenbank Wachstum (geschätzt)';
      case 'cost': return 'Kosten Entwicklung (geschätzt)';
      default: return 'Statistik';
    }
  }

  // Helper für Chart-Balken Höhe
  getBarHeight(val: number): string {
    const data = this.adminService.stats()?.chartData || [];
    if (!data.length) return '0%';
    const max = Math.max(...data.map(d => d.value)) || 1;
    // Mindesthöhe 5%, damit man auch kleine Werte sieht
    const pct = (val / max) * 100;
    return `${Math.max(pct, 5)}%`;
  }

  // Chart Helper: Balkenfarbe basierend auf Metrik
  getBarColorClass(): string {
    switch(this.selectedMetric()) {
      case 'users': return 'bg-blue-500 hover:bg-blue-600';
      case 'active': return 'bg-emerald-500 hover:bg-emerald-600';
      case 'db': return 'bg-purple-500 hover:bg-purple-600';
      case 'cost': return 'bg-amber-500 hover:bg-amber-600';
      default: return 'bg-slate-500';
    }
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

  /**
   * Entscheidet, ob ein Label angezeigt wird
   * - 1w: Immer
   * - 1m: Jeden 5. Tag
   * - 1y: Jeden Monat (immer, da nur 12 Balken)
   */
  shouldShowLabel(index: number): boolean {
    const tf = this.growthTimeframe();
    if (tf === '1w') return true;
    if (tf === '1y') return true;
    if (tf === '1m') return index % 5 === 0;
    return false;
  }

  formatLabel(dateStr: string): string {
    const tf = this.growthTimeframe();
    
    if (tf === '1y') {
        return this.datePipe.transform(dateStr, 'MMM yyyy') || dateStr;
    } 
    else if (tf === '1w') {
        return this.datePipe.transform(dateStr, 'EEE') || dateStr;
    }
    return this.datePipe.transform(dateStr, 'dd.MM') || dateStr;
  }

  setTab(tab: 'analytics' | 'content') {
    this.activeTab.set(tab);
  }
  
  setTimeframe(tf: Timeframe) {
      this.growthTimeframe.set(tf);
      this.refreshStats();
  }

  getChartDateRange() {
    const now = new Date();
    const start = new Date(now);
    
    switch(this.growthTimeframe()) {
      case '1w': 
        start.setDate(now.getDate() - 7); 
        break;
      case '1m': 
        start.setDate(now.getDate() - 30); 
        break;
      case '1y': 
        start.setFullYear(now.getFullYear() - 1); 
        break;
    }
    
    return { start, end: now };
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