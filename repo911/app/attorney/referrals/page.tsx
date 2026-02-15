'use client';

import { useState, useEffect } from 'react';
import { Gift, Copy, Users, Award, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate } from '@/lib/utils';

interface ReferralData {
  id: string;
  created_at: string;
  referred_name: string;
  status: string;
  completed_at: string | null;
  credit_awarded: boolean;
}

export default function ReferralsPage() {
  const [referralCode, setReferralCode] = useState('');
  const [credits, setCredits] = useState(0);
  const [referrals, setReferrals] = useState<ReferralData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/attorney/referrals');
        if (res.ok) {
          const data = await res.json();
          setReferralCode(data.referral_code || '');
          setCredits(data.referral_credits || 0);
          setReferrals(data.referrals || []);
        }
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  function handleCopy(text: string) {
    navigator.clipboard.writeText(text);
    toast.success('Copied!');
  }

  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/attorney/register?ref=${referralCode}`
    : '';

  const completedCount = referrals.filter((r) => r.status === 'completed').length;
  const pendingCount = referrals.filter((r) => r.status === 'pending').length;

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <Gift className="h-6 w-6 text-[#2ECC71]" />
          Referral Program
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Refer fellow attorneys and earn free lead claims when they join and get activated.
        </p>
      </div>

      {/* Referral Code & Link */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6 mb-4">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">Your Referral Code</h2>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Code</label>
            <div className="flex items-center gap-2">
              <code className="flex-1 px-4 py-2.5 bg-gray-50 dark:bg-slate-900 rounded-lg text-lg font-mono font-bold text-[#1B2A4A] dark:text-gray-100 border border-gray-200 dark:border-slate-700">
                {referralCode || 'N/A'}
              </code>
              {referralCode && (
                <button
                  onClick={() => handleCopy(referralCode)}
                  className="p-2.5 rounded-lg border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                  title="Copy code"
                >
                  <Copy className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                </button>
              )}
            </div>
          </div>
          <div className="flex-1">
            <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Shareable Link</label>
            <div className="flex items-center gap-2">
              <input
                readOnly
                value={shareUrl}
                className="flex-1 px-4 py-2.5 bg-gray-50 dark:bg-slate-900 rounded-lg text-sm text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-slate-700 truncate"
              />
              {referralCode && (
                <button
                  onClick={() => handleCopy(shareUrl)}
                  className="p-2.5 rounded-lg border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                  title="Copy link"
                >
                  <Copy className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-5">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-50 dark:bg-green-950">
              <Award className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{credits}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Free Claims Available</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-5">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{completedCount}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Successful Referrals</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-5">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950">
              <Clock className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{pendingCount}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Pending Referrals</p>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="bg-blue-50 dark:bg-blue-950 border border-blue-100 dark:border-blue-900 rounded-xl p-6 mb-4">
        <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-200 mb-2">How It Works</h3>
        <ol className="space-y-1.5 text-sm text-blue-800 dark:text-blue-300">
          <li>1. Share your referral code or link with fellow attorneys.</li>
          <li>2. They register using your link or enter your code during sign-up.</li>
          <li>3. Once their account is approved and activated, you earn <strong>1 free lead claim</strong>.</li>
          <li>4. Free claims are automatically applied the next time you claim a lead.</li>
        </ol>
      </div>

      {/* Referrals Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-700">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Your Referrals</h2>
        </div>
        {referrals.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-400 dark:text-gray-500">
            No referrals yet. Share your code to get started!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-slate-700">
                  <th className="px-6 py-3 font-medium">Referred Attorney</th>
                  <th className="px-6 py-3 font-medium">Date</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium">Credit</th>
                </tr>
              </thead>
              <tbody>
                {referrals.map((ref) => (
                  <tr key={ref.id} className="border-b border-gray-50 dark:border-slate-700 last:border-0">
                    <td className="px-6 py-3 text-sm text-gray-900 dark:text-gray-100">{ref.referred_name}</td>
                    <td className="px-6 py-3 text-sm text-gray-500 dark:text-gray-400">{formatDate(ref.created_at)}</td>
                    <td className="px-6 py-3">
                      <Badge variant={ref.status === 'completed' ? 'hot' : ref.status === 'pending' ? 'warm' : 'cold'}>
                        {ref.status === 'completed' ? 'Completed' : ref.status === 'pending' ? 'Pending' : 'Expired'}
                      </Badge>
                    </td>
                    <td className="px-6 py-3 text-sm">
                      {ref.credit_awarded ? (
                        <span className="text-green-600 font-medium">+1 Awarded</span>
                      ) : (
                        <span className="text-gray-400 dark:text-gray-500">--</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
