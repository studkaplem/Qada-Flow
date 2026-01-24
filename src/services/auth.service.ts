import { Injectable, signal, inject } from '@angular/core';
import { createClient, SupabaseClient, User, Session } from '@supabase/supabase-js';
import { environment } from '../environments/environment';
import { AppUser, AuthResponse, UserMetadata } from '../models/auth.models';
import { Router } from '@angular/router';

// --- ARCHITECTURE CONSTANTS & TYPES ---

const DB_TABLES = {
  PROFILES: 'profiles'
} as const;

// Wir definieren genau, welche Spalten wir brauchen.
const PROFILE_COLUMNS = [
  'role',
  'full_name',
  'settings',
  'preferred_language'
] as const;

// Interface für die Datenbank-Antwort
interface ProfileRow {
  role?: 'user' | 'admin';
  full_name?: string;
  preferred_language?: string;
  settings?: any;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private supabase: SupabaseClient;
  private router = inject(Router);

  // Central State Signal
  readonly currentUser = signal<AppUser | null>(null);
  readonly isLoading = signal<boolean>(true);

  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
    this.initializeAuth();
  }

  private async initializeAuth() {
    // Session beim Start prüfen
    const { data: { session } } = await this.supabase.auth.getSession();
    if (session?.user) {
      await this.fetchProfileAndSetUser(session.user);
    } else {
      this.isLoading.set(false);
    }

    // Auf Änderungen hören
    this.supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        if (this.currentUser()?.id !== session.user.id) {
            await this.fetchProfileAndSetUser(session.user);
        }
      } else {
        this.currentUser.set(null);
        this.isLoading.set(false);
      }
    });
  }

  /**
   * Lädt Profildaten abstrahiert von der Datenbank-Schicht.
   */
  private async fetchProfileAndSetUser(sbUser: User) {
    try {
      const selectQuery = PROFILE_COLUMNS.join(', ');

      // Request an Supabase
      const { data, error } = await this.supabase
        .from(DB_TABLES.PROFILES)
        .select(selectQuery)
        .eq('id', sbUser.id)
        .single();

      if (error && error.code !== 'PGRST116') {
         console.error('[Auth] Profile fetch error:', error.message);
      }
      const profile = data as ProfileRow | null;
      const appUser: AppUser = {
        id: sbUser.id,
        email: sbUser.email,
        role: profile?.role || 'user', 
        created_at: sbUser.created_at,
        last_sign_in_at: sbUser.last_sign_in_at,
        user_metadata: {
          full_name: profile?.full_name || sbUser.user_metadata['full_name'] || this.extractNameFromEmail(sbUser.email),
          preferred_language: profile?.preferred_language || 'de'
        }
      };

      this.currentUser.set(appUser);
      
    } catch (err) {
      console.error('[Auth] Unexpected error during profile load:', err);
    } finally {
      this.isLoading.set(false);
    }
  }

  // --- Public API ---

  async signUp(email: string, password: string, metadata: UserMetadata): Promise<AuthResponse> {
    this.isLoading.set(true);
    
    const { data, error } = await this.supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: metadata.full_name,
        }
      }
    });

    if (error) {
      this.isLoading.set(false);
      return { data: { user: null, session: null }, error: { message: error.message } };
    }

    this.isLoading.set(false);
    return { data: { user: null, session: data.session }, error: null };
  }

  async signIn(email: string, password: string): Promise<AuthResponse> {
    this.isLoading.set(true);

    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      this.isLoading.set(false);
      return { 
        data: { user: null, session: null }, 
        error: { message: 'Login fehlgeschlagen. Prüfe Email & Passwort.' } 
      };
    }

    return { data: { user: null, session: data.session }, error: null };
  }

  async signOut(): Promise<{ error: null }> {
    this.isLoading.set(true);
    await this.supabase.auth.signOut();
    return { error: null };
  }

  async updateUser(metadata: UserMetadata): Promise<AuthResponse> {
    const current = this.currentUser();
    if (!current) return { data: { user: null, session: null }, error: { message: 'No user logged in' } };

    const updates: any = {};
    if (metadata.full_name) updates.full_name = metadata.full_name;
    if (metadata.preferred_language) updates.preferred_language = metadata.preferred_language;

    const { error } = await this.supabase
      .from(DB_TABLES.PROFILES)
      .update(updates)
      .eq('id', current.id);

    if (error) {
        console.error('[Auth] Update failed:', error);
        return { data: { user: null, session: null }, error: { message: error.message } };
    }

    // Optimistic Update
    this.currentUser.update(u => u ? ({ 
      ...u, 
      user_metadata: { ...u.user_metadata, ...metadata } 
    }) : null);

    return { data: { user: this.currentUser(), session: null }, error: null };
  }

  async resetPasswordForEmail(email: string): Promise<{ data: any; error: any }> {
    const { data, error } = await this.supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + '/update-password',
    });
    return { data, error: error ? { message: error.message } : null };
  }

  // --- Helpers ---
  
  private extractNameFromEmail(email: string | undefined): string {
      if (!email) return 'User';
      return email.split('@')[0];
  }
}