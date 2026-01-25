import { Injectable, inject, signal } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../environments/environment';

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
  
  // State
  stats = signal<AdminStats | null>(null);
  isLoading = signal(false);

  async loadStats(range: string, metric: string) {
    this.isLoading.set(true);
    
    const { data, error } = await this.supabase
      .rpc('get_admin_dashboard_stats', { 
        time_range: range, 
        metric: metric 
      });

    if (error) {
      console.error('Admin Stats Error:', error);
    } else {
      this.stats.set(data as AdminStats);
    }
    
    this.isLoading.set(false);
  }
}