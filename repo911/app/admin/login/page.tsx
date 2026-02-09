'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createClient } from '@/lib/supabase/client';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password });

      if (authError) {
        setError('Invalid email or password.');
        return;
      }

      // Verify user is an admin
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('Authentication failed.');
        return;
      }

      const { data: admin } = await supabase
        .from('admins')
        .select('id, role')
        .eq('supabase_auth_id', user.id)
        .single();

      if (!admin) {
        await supabase.auth.signOut();
        setError('You do not have admin access.');
        return;
      }

      router.push('/admin/dashboard');
    } catch {
      setError('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <ShieldCheck className="h-10 w-10 text-[#2ECC71]" />
            <span className="text-2xl font-bold text-[#1B2A4A]">
              Repo<span className="text-[#2ECC71]">911</span>
            </span>
          </div>
          <h1 className="text-xl font-semibold text-gray-900">Admin Portal</h1>
          <p className="text-sm text-gray-500 mt-1">Sign in to access the admin dashboard</p>
        </div>

        <form onSubmit={handleLogin} className="bg-white rounded-xl border border-gray-200 p-8 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">{error}</div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@repo911.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
          </div>

          <Button type="submit" variant="primary" size="lg" loading={loading} className="w-full bg-[#1B2A4A] hover:bg-[#2A3D66] focus:ring-[#1B2A4A]">
            Sign In
          </Button>
        </form>
      </div>
    </div>
  );
}
