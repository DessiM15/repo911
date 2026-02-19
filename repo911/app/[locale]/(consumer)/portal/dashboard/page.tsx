'use client';

import { useState, useEffect, Suspense } from 'react';
import { Link, useRouter } from '@/i18n/navigation';
import { useLocale } from 'next-intl';
import {
  Shield,
  FileText,
  Clock,
  CheckCircle,
  AlertTriangle,
  LogOut,
  Loader2,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { formatDistanceToNow } from 'date-fns';

interface CaseItem {
  id: string;
  status: string;
  statusLabel: string;
  tier: string;
  submittedAt: string;
  claimed: boolean;
  vehicleYear: string;
  vehicleMake: string;
  vehicleModel: string;
  repoState: string;
  lenderName: string;
  hasStory: boolean;
  uploadedFiles: unknown[];
}

function getStatusIcon(status: string) {
  if (status === 'claimed' || status === 'contacted' || status === 'retained') {
    return <CheckCircle className="h-4 w-4 text-green-500" />;
  }
  if (status === 'disqualified' || status === 'closed') {
    return <AlertTriangle className="h-4 w-4 text-gray-400" />;
  }
  return <Clock className="h-4 w-4 text-[#3474BA] dark:text-blue-400" />;
}

function getTierBadge(tier: string) {
  const colors: Record<string, string> = {
    hot: 'bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300',
    warm: 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300',
    cold: 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300',
  };
  const labels: Record<string, string> = {
    hot: 'High Priority',
    warm: 'Under Review',
    cold: 'Pending Review',
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${colors[tier] || 'bg-gray-100 text-gray-600'}`}
    >
      {labels[tier] || 'Pending'}
    </span>
  );
}

function DashboardContent() {
  const locale = useLocale();
  const router = useRouter();
  const [cases, setCases] = useState<CaseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    async function fetchCases() {
      try {
        const res = await fetch('/api/consumer/cases');
        if (res.status === 401) {
          router.replace('/portal/login');
          return;
        }
        if (res.ok) {
          const data = await res.json();
          setCases(data.cases || []);
        }
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    }

    async function getUser() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user?.email) setUserEmail(user.email);
    }

    fetchCases();
    getUser();
  }, [router]);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace('/portal/login');
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-[#3474BA]" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Shield className="h-7 w-7 text-[#3474BA] dark:text-blue-400" />
            My Cases
          </h1>
          {userEmail && (
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{userEmail}</p>
          )}
        </div>
        <Button variant="outline" size="sm" onClick={handleSignOut}>
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </Button>
      </div>

      {/* Cases Grid */}
      {cases.length === 0 ? (
        <div className="text-center py-16">
          <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            No Cases Found
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            No cases are associated with your email address yet.
          </p>
          <Link href="/claim">
            <Button variant="consumer">Submit a Case</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cases.map((c) => (
            <Link
              key={c.id}
              href={`/portal/cases/${c.id}`}
              className="block bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6 shadow-sm hover:shadow-md hover:border-[#3474BA]/30 transition-all"
            >
              {/* Vehicle */}
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                {c.vehicleYear} {c.vehicleMake} {c.vehicleModel}
              </h3>

              {/* Status + Tier */}
              <div className="flex items-center gap-2 mb-3">
                <div className="flex items-center gap-1.5">
                  {getStatusIcon(c.status)}
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {c.statusLabel}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 mb-3">
                {getTierBadge(c.tier)}
                {c.claimed && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300">
                    Attorney Assigned
                  </span>
                )}
              </div>

              {/* Meta */}
              <div className="space-y-1 text-xs text-gray-500 dark:text-gray-400">
                {c.repoState && <p>State: {c.repoState}</p>}
                <p>
                  Submitted{' '}
                  {formatDistanceToNow(new Date(c.submittedAt), { addSuffix: true })}
                </p>
              </div>

              {/* CTA */}
              <div className="mt-4 flex items-center text-sm font-medium text-[#3474BA] dark:text-blue-300">
                View Details
                <ArrowRight className="ml-1 h-4 w-4" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ConsumerDashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-[#3474BA]" />
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
