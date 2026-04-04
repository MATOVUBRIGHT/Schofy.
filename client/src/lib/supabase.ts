import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials not configured. Cloud sync will be disabled.');
}

export const supabase: SupabaseClient | null = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

export function getSupabaseUrl(): string {
  return supabaseUrl;
}

// === DEBUG UTILITIES ===
export async function testSupabaseConnection(): Promise<void> {
  console.log('🧪 Testing Supabase connection...');
  
  if (!supabase) {
    console.error('❌ Supabase client not initialized');
    return;
  }

  if (!isSupabaseConfigured) {
    console.error('❌ Supabase credentials not configured');
    return;
  }

  try {
    console.log('📍 Supabase URL:', supabaseUrl);
    console.log('🔑 Anon Key (first 20 chars):', supabaseAnonKey.substring(0, 20) + '...');

    // Try to fetch any data to test connection
    const { error, status } = await supabase
      .from('users')
      .select('COUNT(*)', { count: 'exact', head: true })
      .limit(0);

    if (error) {
      console.error('❌ Connection test failed:', error.message);
      console.error('Error code:', error.code);
      console.error('Error details:', error.details);
      
      if (error.code === '42501') {
        console.error('⚠️ Likely RLS POLICY issue - anonymous user lacks permissions');
      }
      return;
    }

    console.log('✅ Supabase connection successful!');
    console.log('Response status:', status);
  } catch (err: any) {
    console.error('❌ Connection test exception:', err.message);
  }
}

export async function testUserInsert(testUser: any): Promise<void> {
  console.log('🧪 Testing user insert with payload:', testUser);
  
  if (!supabase) {
    console.error('❌ Supabase client not initialized');
    return;
  }

  try {
    console.log('📤 Inserting test user...');
    const { data, error } = await supabase
      .from('users')
      .insert([testUser])
      .select();

    if (error) {
      console.error('❌ Insert failed:', error.message);
      console.error('Error code:', error.code);
      console.error('Error details:', error.details);
      console.error('Error hint:', error.hint);
      
      if (error.code === '42501') {
        console.error('⚠️ RLS POLICY BLOCKING INSERT');
        console.error('Solution: Disable RLS on users table or add policy for anon role');
      }
      return;
    }

    console.log('✅ Insert successful!', data);
  } catch (err: any) {
    console.error('❌ Insert exception:', err.message);
  }
}

export async function checkRLSPolicies(): Promise<void> {
  console.log('🔍 Checking RLS status...');
  
  if (!supabase) {
    console.error('❌ Supabase client not initialized');
    return;
  }

  try {
    // Try inserting a dummy row
    const testId = 'rls-test-' + Date.now();
    const { error } = await supabase
      .from('users')
      .insert({
        id: testId,
        school_id: testId,
        email: 'rls-test@test.com',
        first_name: 'RLS',
        last_name: 'Test',
        is_active: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select();

    if (error?.code === '42501') {
      console.error('❌ RLS POLICY DETECTED - Anonymous user lacks insert permission');
      console.log('📌 FIX: In Supabase dashboard > Authentication > Policies');
      console.log('   1. Go to "users" table');
      console.log('   2. Disable RLS or add policy for anon role');
    } else if (error) {
      console.error('❌ Other error:', error.message);
    } else {
      console.log('✅ RLS policy allows anonymous insert');
      // Clean up test record
      await supabase.from('users').delete().eq('id', testId);
    }
  } catch (err: any) {
    console.error('❌ Check exception:', err.message);
  }
}

export async function checkDatabaseSchema(): Promise<void> {
  console.log('📋 Checking users table schema...');
  
  if (!supabase) {
    console.error('❌ Supabase client not initialized');
    return;
  }

  try {
    // Try to fetch empty result to check schema
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .limit(1);

    if (error) {
      console.error('❌ Cannot access users table:', error.message);
      return;
    }

    console.log('✅ Users table exists and is accessible');
    if (data && data.length > 0) {
      console.log('Column names:', Object.keys(data[0]));
    }
  } catch (err: any) {
    console.error('❌ Schema check exception:', err.message);
  }
}

// Make available in browser console
if (typeof window !== 'undefined') {
  (window as any).SupabaseDebug = {
    testSupabaseConnection,
    testUserInsert,
    checkRLSPolicies,
    checkDatabaseSchema,
    supabase,
    isSupabaseConfigured,
  };
}
