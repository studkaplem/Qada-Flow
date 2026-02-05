import { Injectable, inject, signal } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../environments/environment';
import { Router } from '@angular/router';

export interface AdminStats {
  totalUsers: number;
  activeToday: number;
  dbSize: string;
  rawDbSize: number;
  chartData: { label: string; value: number }[];
}

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
  private router = inject(Router);
  
  // State
  stats = signal<AdminStats | null>(null);
  isLoading = signal(false);
  error = signal<string | null>(null);

  async loadStats(range: string, metric: string) {
    this.isLoading.set(true);
    this.error.set(null);
    
    try {
      const { data, error } = await this.supabase
        .rpc('get_admin_dashboard_stats', { 
          time_range: range, 
          metric: metric 
        });

      if (error) throw error;

      this.stats.set(data as AdminStats);

    } catch (err: any) {
      console.error('[Admin] Stats Load Error:', err);
      this.error.set(err.message || 'Fehler beim Laden');
      
      // Security: Wenn Zugriff verweigert, sofort wegnavigieren
      if (err.message?.includes('Access denied') || err.code === '42501' || err.code === 'P0001') {
        this.router.navigate(['/']); 
      }
    } finally {
      this.isLoading.set(false);
    }
  }
}