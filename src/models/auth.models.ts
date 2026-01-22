export interface UserMetadata {
  full_name?: string;
  avatar_url?: string;
  // Future proofing for app specific settings stored in auth metadata
  preferred_language?: string; 
}

export interface AppUser {
  id: string;
  email?: string;
  role: 'user' | 'admin'; // Added role
  created_at: string;
  last_sign_in_at?: string;
  user_metadata: UserMetadata;
}

export interface AuthResponse {
  data: {
    user: AppUser | null;
    session: any | null; // Placeholder for Supabase Session
  };
  error: AuthError | null;
}

export interface AuthError {
  message: string;
  status?: number;
}