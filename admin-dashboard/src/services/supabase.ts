import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Configuration - Replace with your Supabase project details
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

export const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Admin authentication
export async function signIn(email: string, password: string) {
  // For demo purposes, we'll use a simple check
  // In production, use Supabase Auth or custom JWT
  const { data, error } = await supabase
    .from('admin_users')
    .select('*')
    .eq('email', email)
    .single();

  if (error || !data) {
    throw new Error('Invalid credentials');
  }

  // Simple password check (in production, use proper hashing)
  if (data.password_hash !== hashPassword(password)) {
    throw new Error('Invalid credentials');
  }

  // Update last login
  await supabase
    .from('admin_users')
    .update({ last_login: new Date().toISOString() })
    .eq('id', data.id);

  return data;
}

export async function signOut() {
  localStorage.removeItem('admin_user');
}

export async function createAdminUser(email: string, password: string, name: string) {
  const { data, error } = await supabase
    .from('admin_users')
    .insert({
      email,
      password_hash: hashPassword(password),
      name,
      role: 'admin',
      is_active: true,
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function checkAdminExists() {
  const { data, error } = await supabase
    .from('admin_users')
    .select('id')
    .limit(1);

  if (error) {
    console.error('Error checking admin:', error);
    return false;
  }

  return data && data.length > 0;
}

// Simple hash function (use bcrypt in production)
function hashPassword(password: string): string {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return 'hash_' + Math.abs(hash).toString(16);
}

export default supabase;
