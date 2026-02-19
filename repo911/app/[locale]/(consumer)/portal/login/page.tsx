'use client';

import { useState } from 'react';
import { Link } from '@/i18n/navigation';
import { useLocale } from 'next-intl';
import { Shield, Mail, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';

export default function ConsumerLoginPage() {
  const locale = useLocale();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const supabase = createClient();
      const origin = window.location.origin;
      const redirectTo = `${origin}/auth/callback?next=/${locale === 'en' ? '' : locale + '/'}portal/dashboard`;

      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: { emailRedirectTo: redirectTo },
      });

      if (otpError) {
        setError(otpError.message);
        return;
      }

      setSent(true);
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-8 shadow-sm">
          {/* Branding */}
          <div className="text-center mb-6">
            <Shield className="h-10 w-10 mx-auto mb-3 text-[#3474BA] dark:text-blue-400" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Consumer Portal
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Sign in to view all your cases in one place
            </p>
          </div>

          {sent ? (
            /* Success state */
            <div className="text-center py-4">
              <Mail className="h-12 w-12 mx-auto mb-4 text-[#3474BA] dark:text-blue-400" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Check Your Email
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                We sent a magic link to <strong>{email}</strong>. Click the link in the email to
                sign in.
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                Didn&apos;t receive it? Check your spam folder or{' '}
                <button
                  onClick={() => {
                    setSent(false);
                    setError('');
                  }}
                  className="text-[#3474BA] dark:text-blue-300 underline"
                >
                  try again
                </button>
                .
              </p>
            </div>
          ) : (
            /* Login form */
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#3474BA] dark:bg-slate-900 dark:text-gray-100"
                />
              </div>

              {error && (
                <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-lg p-3 text-sm">
                  {error}
                </div>
              )}

              <Button type="submit" variant="consumer" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
                    Send Magic Link
                  </>
                )}
              </Button>
            </form>
          )}

          {/* Track link */}
          <div className="mt-6 pt-4 border-t border-gray-200 dark:border-slate-700 text-center">
            <Link
              href="/track"
              className="text-sm text-gray-500 dark:text-gray-400 hover:text-[#3474BA] dark:hover:text-blue-300"
            >
              Or track a single case without signing in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
