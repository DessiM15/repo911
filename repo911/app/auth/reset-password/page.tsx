'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Scale } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      setLoading(false);
      return;
    }

    try {
      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });

      if (updateError) {
        setError(updateError.message);
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
            <span className="text-2xl font-bold text-[#1B2A4A] dark:text-gray-100">
              Repo<span className="text-[#2ECC71]">911</span>
            </span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Set New Password</h1>
          <p className="text-gray-600 mt-1">Enter your new password below.</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 mb-6">
            {error}
          </div>
        )}

        {success ? (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 sm:p-8 text-center">
            <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg p-4 mb-4">
              Your password has been updated successfully.
            </div>
            <div className="flex flex-col gap-3 mt-4">
              <Link href="/attorney/login">
                <Button variant="attorney" className="w-full" size="lg">
                  Sign In as Attorney
                </Button>
              </Link>
              <Link href="/admin/login">
                <Button variant="primary" className="w-full bg-[#1B2A4A] hover:bg-[#2A3D66]" size="lg">
                  Sign In as Admin
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              <Input
                label="New Password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                helperText="Must be at least 8 characters"
              />
              <Input
                label="Confirm New Password"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              <Button type="submit" variant="attorney" className="w-full" size="lg" loading={loading}>
                Update Password
              </Button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
