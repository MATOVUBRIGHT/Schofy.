import { useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export default function TestSupabase() {
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const testConnection = async () => {
    setLoading(true);
    setResult('Testing...\n');

    setResult(prev => prev + `isSupabaseConfigured: ${isSupabaseConfigured}\n`);
    setResult(prev => prev + `supabase client: ${supabase ? 'exists' : 'null'}\n`);

    if (!supabase) {
      setResult(prev => prev + '\n❌ Supabase not configured. Check .env file.\n');
      setLoading(false);
      return;
    }

    try {
      // Test inserting
      const testId = 'test-' + Date.now();
      const { data, error } = await supabase
        .from('users')
        .upsert({
          id: testId,
          school_id: testId,
          email: 'test@test.com',
          first_name: 'Test',
          last_name: 'User',
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        setResult(prev => prev + `\n❌ Error: ${error.message}\n`);
        setResult(prev => prev + `Details: ${error.details}\n`);
        setResult(prev => prev + `Hint: ${error.hint}\n`);
      } else {
        setResult(prev => prev + `\n✅ Success! Inserted record:\n`);
        setResult(prev => prev + JSON.stringify(data, null, 2) + '\n');
      }
    } catch (err: any) {
      setResult(prev => prev + `\n❌ Exception: ${err.message}\n`);
    }

    setLoading(false);
  };

  return (
    <div className="p-4 bg-slate-100 rounded-lg">
      <h3 className="font-bold mb-2">Supabase Connection Test</h3>
      <button
        onClick={testConnection}
        disabled={loading}
        className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
      >
        {loading ? 'Testing...' : 'Test Connection'}
      </button>
      <pre className="mt-4 p-2 bg-white rounded text-xs whitespace-pre-wrap max-h-96 overflow-auto">
        {result || 'Click button to test...'}
      </pre>
    </div>
  );
}
