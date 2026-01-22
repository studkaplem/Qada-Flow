import { Injectable, signal, effect } from '@angular/core';
import { AppUser, AuthResponse, UserMetadata } from '../models/auth.models';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // Central signal for the current user state
  readonly currentUser = signal<AppUser | null>(null);
  readonly isLoading = signal<boolean>(false);

  constructor() {
    this.restoreSession();
  }

  /**
   * Restores the session from local storage (Simulating Supabase's auto-restore)
   */
  private restoreSession() {
    const stored = localStorage.getItem('qada_auth_user');
    if (stored) {
      try {
        const user = JSON.parse(stored);
        // Migration: Ensure role exists for older session data
        if (!user.role) {
            user.role = 'user';
        }
        this.currentUser.set(user);
      } catch (e) {
        console.error('Failed to parse user session', e);
        localStorage.removeItem('qada_auth_user');
      }
    }
  }

  /**
   * Persist user state (Simulating session persistence)
   */
  private persistSession(user: AppUser | null) {
    if (user) {
      localStorage.setItem('qada_auth_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('qada_auth_user');
    }
  }

  // --- Auth Methods (Designed to match Supabase Signature) ---

  async signUp(email: string, password: string, data: UserMetadata): Promise<AuthResponse> {
    this.isLoading.set(true);
    await this.delay(1000); // Simulate network

    // Mock Check
    if (email === 'error@test.com') {
      this.isLoading.set(false);
      return { data: { user: null, session: null }, error: { message: 'User already registered' } };
    }

    const newUser: AppUser = {
      id: crypto.randomUUID(),
      email: email,
      role: 'user', // Default role
      created_at: new Date().toISOString(),
      last_sign_in_at: new Date().toISOString(),
      user_metadata: data
    };

    this.currentUser.set(newUser);
    this.persistSession(newUser);
    this.isLoading.set(false);

    return { data: { user: newUser, session: { access_token: 'mock_token' } }, error: null };
  }

  async signIn(email: string, password: string): Promise<AuthResponse> {
    this.isLoading.set(true);
    await this.delay(800);

    // Mock validation
    if (!email.includes('@')) {
        this.isLoading.set(false);
        return { data: { user: null, session: null }, error: { message: 'Invalid email address' } };
    }

    // ADMIN MOCK LOGIN
    const isAdmin = email === 'admin@qada.flow';

    const user: AppUser = {
      id: this.currentUser()?.id || (isAdmin ? 'admin_01' : 'u_12345'),
      email: email,
      role: isAdmin ? 'admin' : 'user',
      created_at: this.currentUser()?.created_at || new Date().toISOString(),
      last_sign_in_at: new Date().toISOString(),
      user_metadata: this.currentUser()?.user_metadata || { full_name: isAdmin ? 'Admin User' : email.split('@')[0] }
    };

    this.currentUser.set(user);
    this.persistSession(user);
    this.isLoading.set(false);

    return { data: { user: user, session: { access_token: 'mock_token' } }, error: null };
  }

  async signOut(): Promise<{ error: null }> {
    this.isLoading.set(true);
    await this.delay(500);
    
    this.currentUser.set(null);
    this.persistSession(null);
    this.isLoading.set(false);
    
    return { error: null };
  }

  async updateUser(metadata: UserMetadata): Promise<AuthResponse> {
    this.isLoading.set(true);
    await this.delay(600);

    const current = this.currentUser();
    if (!current) {
        this.isLoading.set(false);
        return { data: { user: null, session: null }, error: { message: 'No user logged in' } };
    }

    const updatedUser: AppUser = {
        ...current,
        user_metadata: {
            ...current.user_metadata,
            ...metadata
        }
    };

    this.currentUser.set(updatedUser);
    this.persistSession(updatedUser);
    this.isLoading.set(false);

    return { data: { user: updatedUser, session: {} }, error: null };
  }

  async resetPasswordForEmail(email: string): Promise<{ data: any; error: any }> {
    this.isLoading.set(true);
    await this.delay(1000);
    this.isLoading.set(false);
    
    if (!email.includes('@')) {
        return { data: null, error: { message: 'Invalid email address' } };
    }
    return { data: {}, error: null };
  }

  private delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}