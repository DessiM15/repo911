'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ShieldCheck, ArrowLeft } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';

export default function AdminForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const supabase = createClient();
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/auth/reset-password`,
      });

      if (resetError) {
        setError(resetError.message);
        return;
      }

      setSuccess(true);
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <ShieldCheck className="h-10 w-10 text-[#2ECC71]" />
            <span className="text-2xl font-bold text-[#1B2A4A] dark:text-gray-100">
              Repo<span className="text-[#2ECC71]">911</span>
            </span>
          </div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Reset Your Password</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Enter your email and we&apos;ll send you a reset link.
          </p>
        </div>

        {success ? (
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-8 text-center">
            <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 rounded-lg p-4 mb-4">
              Check your email for a password reset link.
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Didn&apos;t receive it? Check your spam folder or try again.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-8 space-y-4">
            {error && (
              <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-lg p-3 text-sm">{error}</div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@repo911.com"
                required
              />
            </div>

            <Button type="submit" variant="primary" size="lg" loading={loading} className="w-full bg-[#1B2A4A] hover:bg-[#2A3D66] focus:ring-[#1B2A4A]">
              Send Reset Link
            </Button>
          </form>
        )}

        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
          <Link href="/admin/login" className="inline-flex items-center gap-1 text-[#1B2A4A] dark:text-blue-300 font-medium hover:underline">
            <ArrowLeft className="h-4 w-4" />
            Back to Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
