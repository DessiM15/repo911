'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Scale } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';

export default function AttorneyLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  useEffect(() => {
    const savedEmail = localStorage.getItem('attorney_remembered_email');
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        setError('Invalid email or password. Please try again.');
        return;
      }

      if (rememberMe) {
        localStorage.setItem('attorney_remembered_email', email);
      } else {
        localStorage.removeItem('attorney_remembered_email');
      }
      sessionStorage.setItem('attorney_session_active', 'true');
      router.push('/attorney/dashboard');
      router.refresh();
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <Scale className="h-8 w-8 text-[#2ECC71]" />
            <span className="text-2xl font-bold text-[#1B2A4A] dark:text-gray-100">
              Repo<span className="text-[#2ECC71]">911</span>
            </span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Attorney Portal</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Sign in to access the lead marketplace.</p>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-lg p-4 mb-6">
            {error}
          </div>
        )}

        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Email Address"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@lawfirm.com"
            />
            <Input
              label="Password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 dark:border-slate-600 text-[#1B2A4A] focus:ring-[#1B2A4A] dark:bg-slate-700"
                />
                <span className="text-sm text-gray-600 dark:text-gray-400">Remember me</span>
              </label>
              <Link href="/attorney/forgot-password" className="text-sm text-gray-500 dark:text-gray-400 hover:text-[#1B2A4A] dark:hover:text-gray-200 hover:underline">
                Forgot password?
              </Link>
            </div>
            <Button type="submit" variant="attorney" className="w-full" size="lg" loading={loading}>
              Sign In
            </Button>
          </form>
        </div>

        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
          Don&apos;t have an account?{' '}
          <Link href="/attorney/register" className="text-[#1B2A4A] dark:text-blue-300 font-medium hover:underline">
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
}
