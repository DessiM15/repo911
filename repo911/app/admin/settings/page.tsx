'use client';

import { useState, useEffect } from 'react';
import { Settings, DollarSign, Bell, Shield, Users, Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/lib/utils';

interface PlatformSettings {
  lead_price_hot: number;
  lead_price_warm: number;
  lead_price_cold: number;
  notification_email_from: string;
  platform_name: string;
  fee_share_percentage: number;
}

interface AdminUser {
  id: string;
  first_name: string;
  last_name: string | null;
  email: string;
  role: string;
  created_at: string;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<PlatformSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  // Edit values
  const [priceHot, setPriceHot] = useState('');
  const [priceWarm, setPriceWarm] = useState('');
  const [priceCold, setPriceCold] = useState('');
  const [emailFrom, setEmailFrom] = useState('');
  const [feeShare, setFeeShare] = useState('');

  // Admin management
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [adminsLoading, setAdminsLoading] = useState(true);
  const [showAddAdmin, setShowAddAdmin] = useState(false);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminFirstName, setNewAdminFirstName] = useState('');
  const [newAdminLastName, setNewAdminLastName] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [newAdminRole, setNewAdminRole] = useState('viewer');
  const [creatingAdmin, setCreatingAdmin] = useState(false);
  const [adminError, setAdminError] = useState('');
  const [adminSuccess, setAdminSuccess] = useState('');

  useEffect(() => {
    async function fetchSettings() {
      try {
        const res = await fetch('/api/admin/settings');
        if (res.ok) {
          const data = await res.json();
          setSettings(data.settings);
          setPriceHot((data.settings.lead_price_hot / 100).toString());
          setPriceWarm((data.settings.lead_price_warm / 100).toString());
          setPriceCold((data.settings.lead_price_cold / 100).toString());
          setEmailFrom(data.settings.notification_email_from);
          setFeeShare(data.settings.fee_share_percentage.toString());
        }
      } catch {
        setError('Failed to load settings');
      } finally {
        setLoading(false);
      }
    }
    fetchSettings();
  }, []);

  useEffect(() => {
    async function fetchAdmins() {
      try {
        const res = await fetch('/api/admin/admins');
        if (res.ok) {
          const data = await res.json();
          setAdmins(data.admins || []);
        }
      } catch {
        // Non-critical — admin list may not load on first render
      } finally {
        setAdminsLoading(false);
      }
    }
    fetchAdmins();
  }, []);

  async function handleCreateAdmin(e: React.FormEvent) {
    e.preventDefault();
    setCreatingAdmin(true);
    setAdminError('');
    setAdminSuccess('');
    try {
      const res = await fetch('/api/admin/admins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: newAdminEmail,
          firstName: newAdminFirstName,
          lastName: newAdminLastName,
          password: newAdminPassword,
          role: newAdminRole,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAdminError(data.error || 'Failed to create admin');
        return;
      }
      setAdminSuccess(`Admin "${newAdminEmail}" created successfully.`);
      setNewAdminEmail('');
      setNewAdminFirstName('');
      setNewAdminLastName('');
      setNewAdminPassword('');
      setNewAdminRole('viewer');
      setShowAddAdmin(false);
      // Refresh admin list
      const refreshRes = await fetch('/api/admin/admins');
      if (refreshRes.ok) {
        const refreshData = await refreshRes.json();
        setAdmins(refreshData.admins || []);
      }
      setTimeout(() => setAdminSuccess(''), 5000);
    } catch {
      setAdminError('Failed to create admin');
    } finally {
      setCreatingAdmin(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    setError('');
    setSaved(false);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lead_price_hot: Math.round(parseFloat(priceHot) * 100),
          lead_price_warm: Math.round(parseFloat(priceWarm) * 100),
          lead_price_cold: Math.round(parseFloat(priceCold) * 100),
          notification_email_from: emailFrom,
          fee_share_percentage: parseInt(feeShare),
        }),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        setError('Failed to save settings');
      }
    } catch {
      setError('Failed to save settings');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
        <Settings className="h-6 w-6" /> Platform Settings
      </h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">{error}</div>
      )}

      {saved && (
        <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg p-3 text-sm">
          Settings saved successfully.
        </div>
      )}

      {/* Lead Pricing */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-900 mb-1 flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-green-500" /> Lead Pricing
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          Set the price attorneys pay to claim leads by qualification tier. Prices are in USD.
        </p>

        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Hot Lead Price
              {settings && <span className="text-gray-400 font-normal ml-1">(current: {formatCurrency(settings.lead_price_hot)})</span>}
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
              <input
                type="number"
                value={priceHot}
                onChange={(e) => setPriceHot(e.target.value)}
                min="0"
                step="0.01"
                className="w-full pl-7 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1B2A4A]"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Warm Lead Price
              {settings && <span className="text-gray-400 font-normal ml-1">(current: {formatCurrency(settings.lead_price_warm)})</span>}
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
              <input
                type="number"
                value={priceWarm}
                onChange={(e) => setPriceWarm(e.target.value)}
                min="0"
                step="0.01"
                className="w-full pl-7 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1B2A4A]"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cold Lead Price
              {settings && <span className="text-gray-400 font-normal ml-1">(current: {formatCurrency(settings.lead_price_cold)})</span>}
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
              <input
                type="number"
                value={priceCold}
                onChange={(e) => setPriceCold(e.target.value)}
                min="0"
                step="0.01"
                className="w-full pl-7 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1B2A4A]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Fee Share */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-900 mb-1 flex items-center gap-2">
          <Shield className="h-5 w-5 text-blue-500" /> Fee-Sharing Agreement
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          The percentage of attorney legal fees that Repo911 receives from each case.
        </p>
        <div className="max-w-xs">
          <label className="block text-sm font-medium text-gray-700 mb-1">Revenue Share (%)</label>
          <div className="relative">
            <input
              type="number"
              value={feeShare}
              onChange={(e) => setFeeShare(e.target.value)}
              min="0"
              max="100"
              className="w-full pr-8 pl-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1B2A4A]"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">%</span>
          </div>
        </div>
      </div>

      {/* Notification Settings */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-900 mb-1 flex items-center gap-2">
          <Bell className="h-5 w-5 text-amber-500" /> Notification Settings
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          Configure email notification settings.
        </p>
        <div className="max-w-md">
          <label className="block text-sm font-medium text-gray-700 mb-1">From Email Address</label>
          <input
            type="email"
            value={emailFrom}
            onChange={(e) => setEmailFrom(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1B2A4A]"
          />
        </div>

        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Email Templates</h4>
          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex items-center justify-between">
              <span>Lead Submission Confirmation</span>
              <span className="text-xs text-gray-400">Auto-sent</span>
            </div>
            <div className="flex items-center justify-between">
              <span>New Hot Lead Alert (to attorneys)</span>
              <span className="text-xs text-gray-400">Auto-sent</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Lead Claimed Notification (to consumer)</span>
              <span className="text-xs text-gray-400">Auto-sent</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Payment Receipt (to attorney)</span>
              <span className="text-xs text-gray-400">Auto-sent</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Attorney Registration Alert (to admin)</span>
              <span className="text-xs text-gray-400">Auto-sent</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Fee Payment Reminder (to attorney)</span>
              <span className="text-xs text-gray-400">Auto-sent</span>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-3">Email templates are managed in code. Contact your developer to modify.</p>
        </div>
      </div>

      <div className="flex justify-end">
        <Button variant="primary" size="lg" onClick={handleSave} loading={saving} className="bg-[#1B2A4A] hover:bg-[#2A3D66]">
          Save Settings
        </Button>
      </div>

      {/* Admin Users */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-500" /> Admin Users
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Manage administrator accounts for the platform.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAddAdmin(!showAddAdmin)}
          >
            <Plus className="mr-1 h-4 w-4" />
            Add Admin
          </Button>
        </div>

        {adminError && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm mb-4">{adminError}</div>
        )}

        {adminSuccess && (
          <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg p-3 text-sm mb-4">{adminSuccess}</div>
        )}

        {/* Add Admin Form */}
        {showAddAdmin && (
          <form onSubmit={handleCreateAdmin} className="bg-gray-50 rounded-lg p-4 mb-4 space-y-3">
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                <input
                  type="text"
                  required
                  value={newAdminFirstName}
                  onChange={(e) => setNewAdminFirstName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1B2A4A]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                <input
                  type="text"
                  value={newAdminLastName}
                  onChange={(e) => setNewAdminLastName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1B2A4A]"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
              <input
                type="email"
                required
                value={newAdminEmail}
                onChange={(e) => setNewAdminEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1B2A4A]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password * (min 8 characters)</label>
              <input
                type="password"
                required
                minLength={8}
                value={newAdminPassword}
                onChange={(e) => setNewAdminPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1B2A4A]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <select
                value={newAdminRole}
                onChange={(e) => setNewAdminRole(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1B2A4A] bg-white"
              >
                <option value="viewer">Viewer (read-only)</option>
                <option value="admin">Admin (full access)</option>
              </select>
            </div>
            <div className="flex items-center gap-2 pt-1">
              <Button type="submit" variant="primary" size="sm" className="bg-[#1B2A4A] hover:bg-[#2A3D66]" disabled={creatingAdmin}>
                {creatingAdmin ? <><Loader2 className="mr-1 h-4 w-4 animate-spin" /> Creating...</> : 'Create Admin'}
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => setShowAddAdmin(false)}>
                Cancel
              </Button>
            </div>
          </form>
        )}

        {/* Admin Table */}
        {adminsLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : admins.length === 0 ? (
          <p className="text-sm text-gray-500">No admin users found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-2 font-medium text-gray-500">Name</th>
                  <th className="text-left py-2 px-2 font-medium text-gray-500">Email</th>
                  <th className="text-left py-2 px-2 font-medium text-gray-500">Role</th>
                </tr>
              </thead>
              <tbody>
                {admins.map((admin) => (
                  <tr key={admin.id} className="border-b border-gray-100">
                    <td className="py-2 px-2 text-gray-900">
                      {admin.first_name} {admin.last_name || ''}
                    </td>
                    <td className="py-2 px-2 text-gray-600">{admin.email}</td>
                    <td className="py-2 px-2">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        admin.role === 'super_admin' ? 'bg-purple-100 text-purple-700' :
                        admin.role === 'admin' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {admin.role === 'super_admin' ? 'Super Admin' : admin.role === 'admin' ? 'Admin' : 'Viewer'}
                      </span>
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
