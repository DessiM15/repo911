'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShoppingCart, FileText, DollarSign, TrendingUp,
  ArrowRight, Clock,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency, formatDate } from '@/lib/utils';

interface DashboardData {
  available_leads: number;
  claimed_leads: number;
  total_spent: number;
  recent_leads: Array<{
    id: string;
    first_name: string;
    last_name: string;
    qualification_tier: string;
    repo_state: string;
    claimed_at: string;
  }>;
}

export default function AttorneyDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const res = await fetch('/api/attorney/dashboard');
        const result = await res.json();
        if (res.ok) setData(result);
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    }
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid sm:grid-cols-3 gap-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Welcome back. Here is your overview.</p>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                <ShoppingCart className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Available Leads</p>
                <p className="text-2xl font-bold text-gray-900">{data?.available_leads ?? 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-50 rounded-lg">
                <FileText className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">My Claimed Leads</p>
                <p className="text-2xl font-bold text-gray-900">{data?.claimed_leads ?? 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-50 rounded-lg">
                <DollarSign className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Invested</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(data?.total_spent ?? 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Quick Actions */}
        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5" /> Quick Actions
            </h3>
            <div className="space-y-3">
              <Link href="/attorney/marketplace">
                <Button variant="attorney" className="w-full justify-between">
                  Browse Marketplace <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/attorney/my-leads">
                <Button variant="outline" className="w-full justify-between">
                  View My Leads <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/attorney/billing">
                <Button variant="outline" className="w-full justify-between">
                  Payment History <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Recent Claimed Leads */}
        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Clock className="h-5 w-5" /> Recently Claimed
            </h3>
            {data?.recent_leads && data.recent_leads.length > 0 ? (
              <div className="space-y-3">
                {data.recent_leads.map((lead) => (
                  <Link key={lead.id} href={`/attorney/my-leads/${lead.id}`} className="block">
                    <div className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-2">
                        <Badge variant={lead.qualification_tier === 'hot' ? 'hot' : lead.qualification_tier === 'warm' ? 'warm' : 'cold'}>
                          {lead.qualification_tier?.toUpperCase()}
                        </Badge>
                        <span className="text-sm font-medium text-gray-900">{lead.first_name} {lead.last_name}</span>
                        <span className="text-xs text-gray-400">{lead.repo_state}</span>
                      </div>
                      <span className="text-xs text-gray-400">{formatDate(lead.claimed_at)}</span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">No leads claimed yet.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
