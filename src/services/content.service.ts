import { Injectable, inject, signal } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../environments/environment';

export interface InspirationPost {
  id?: number;
  title: string;
  category: 'islamic' | 'science' | 'practical';
  icon?: string;
  read_time: string;
  excerpt: string;
  content: string[];
  action_step?: string;
  author?: string;
  is_published?: boolean;
  created_at?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ContentService {
  private supabase: SupabaseClient;
  
  // Reatives Signal für die UI
  readonly posts = signal<InspirationPost[]>([]);
  readonly isLoading = signal(false);

  // Mapping für automatische Icons
  private readonly CATEGORY_ICONS: Record<string, string> = {
    islamic: 'fa-book-open',
    science: 'fa-brain',
    practical: 'fa-list-check'
  };

  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
    this.loadPosts();
  }

  // --- HILFSMETHODEN ---
  
  private getIconForCategory(cat: string): string {
    return this.CATEGORY_ICONS[cat] || 'fa-star';
  }

  async loadPosts() {
    this.isLoading.set(true);

    const { data, error } = await this.supabase
      .from('inspiration_posts')
      .select('*')
      .order('id', { ascending: false }); // Neueste zuerst

    if (error) {
      console.error('Error loading posts:', error);
    } else {
      this.posts.set(data as InspirationPost[] || []);
    }
    this.isLoading.set(false);
  }

  async createPost(post: InspirationPost) {
    // icon automatisch setzen
    post.icon = this.getIconForCategory(post.category);

    const { data, error } = await this.supabase
      .from('inspiration_posts')
      .insert(post)
      .select()
      .single();

    if (data) {
      // Optimistisches Update oder Reload
      this.posts.update(curr => [data as InspirationPost, ...curr]);
    }
    return { data, error };
  }

  async updatePost(id: number, updates: Partial<InspirationPost>) {
    // Falls Kategorie geändert wird, Icon mitziehen
    if (updates.category) {
      updates.icon = this.getIconForCategory(updates.category);
    }

    const { data, error } = await this.supabase
      .from('inspiration_posts')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (data) {
      this.posts.update(curr => 
        curr.map(p => p.id === id ? (data as InspirationPost) : p)
      );
    }
    return { data, error };
  }

  async deletePost(id: number) {
    const { error } = await this.supabase
      .from('inspiration_posts')
      .delete()
      .eq('id', id);

    if (!error) {
      this.posts.update(curr => curr.filter(p => p.id !== id));
    }
    return { error };
  }
}