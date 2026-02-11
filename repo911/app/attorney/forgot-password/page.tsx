'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Scale, ArrowLeft } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';

export default function AttorneyForgotPasswordPage() {
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
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <Scale className="h-8 w-8 text-[#2ECC71]" />
            <span className="text-2xl font-bold text-[#1B2A4A]">
              Repo<span className="text-[#2ECC71]">911</span>
            </span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Reset Your Password</h1>
          <p className="text-gray-600 mt-1">
            Enter your email and we&apos;ll send you a reset link.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 mb-6">
            {error}
          </div>
        )}

        {success ? (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 sm:p-8 text-center">
            <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg p-4 mb-4">
              Check your email for a password reset link.
            </div>
            <p className="text-sm text-gray-500">
              Didn&apos;t receive it? Check your spam folder or try again.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              <Input
                label="Email Address"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@lawfirm.com"
              />
              <Button type="submit" variant="attorney" className="w-full" size="lg" loading={loading}>
                Send Reset Link
              </Button>
            </form>
          </div>
        )}

        <p className="text-center text-sm text-gray-500 mt-6">
          <Link href="/attorney/login" className="inline-flex items-center gap-1 text-[#1B2A4A] font-medium hover:underline">
            <ArrowLeft className="h-4 w-4" />
            Back to Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
