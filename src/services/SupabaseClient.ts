/**
 * Supabase Client Configuration
 *
 * Provides database connection for:
 * - Analytics data storage
 * - User profiles
 * - Admin authentication
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../config/supabase';

// Database types
export interface Database {
  public: {
    Tables: {
      analytics_events: {
        Row: {
          id: string;
          user_id: string;
          device_id: string;
          session_id: string;
          event_type: string;
          event_name: string;
          event_data: Record<string, any>;
          timestamp: string;
          platform: string;
          app_version: string;
          os_version: string;
          device_model: string;
          locale: string;
          timezone: string;
          screen_name: string | null;
          location: Record<string, any> | null;
          network_type: string | null;
          ip_address: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['analytics_events']['Row'], 'created_at'>;
        Update: Partial<Database['public']['Tables']['analytics_events']['Insert']>;
      };
      analytics_users: {
        Row: {
          id: string;
          device_id: string;
          first_seen: string;
          last_seen: string;
          total_sessions: number;
          total_playtime: number;
          total_coins_earned: number;
          total_coins_spent: number;
          total_purchases: number;
          total_revenue: number;
          platform: string;
          app_version: string;
          country: string | null;
          city: string | null;
          device_model: string;
          os_version: string;
          is_premium: boolean;
          has_subscription: boolean;
          acquisition_source: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['analytics_users']['Row'], 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['analytics_users']['Insert']>;
      };
      admin_users: {
        Row: {
          id: string;
          email: string;
          password_hash: string;
          name: string;
          role: 'admin' | 'viewer' | 'analyst';
          is_active: boolean;
          last_login: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['admin_users']['Row'], 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['admin_users']['Insert']>;
      };
      reports: {
        Row: {
          id: string;
          title: string;
          type: 'daily' | 'weekly' | 'monthly' | 'custom' | 'investor';
          data: Record<string, any>;
          created_by: string;
          share_token: string | null;
          is_public: boolean;
          created_at: string;
          expires_at: string | null;
        };
        Insert: Omit<Database['public']['Tables']['reports']['Row'], 'created_at'>;
        Update: Partial<Database['public']['Tables']['reports']['Insert']>;
      };
    };
  };
}

// Create Supabase client with custom storage for React Native
export const supabaseClient: SupabaseClient<Database> = createClient<Database>(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);

// Helper function to check connection
export async function checkSupabaseConnection(): Promise<boolean> {
  try {
    const { error } = await supabaseClient.from('analytics_events').select('id').limit(1);
    return !error;
  } catch {
    return false;
  }
}

export default supabaseClient;
