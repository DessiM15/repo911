'use client';

import { useState, useEffect } from 'react';
import { User, Bell, Shield, Save } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { US_STATES } from '@/lib/utils';
import type { Attorney } from '@/types';

const PRACTICE_AREAS = [
  { value: 'wrongful_repo', label: 'Wrongful Repossession' },
  { value: 'fdcpa', label: 'FDCPA / Debt Collection' },
  { value: 'scra', label: 'SCRA / Military Protection' },
  { value: 'fcra', label: 'FCRA / Credit Reporting' },
];

export default function ProfilePage() {
  const [attorney, setAttorney] = useState<Attorney | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Editable fields
  const [phone, setPhone] = useState('');
  const [firmName, setFirmName] = useState('');
  const [website, setWebsite] = useState('');
  const [preferredStates, setPreferredStates] = useState<string[]>([]);
  const [preferredCaseTypes, setPreferredCaseTypes] = useState<string[]>([]);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch('/api/attorney/profile');
        if (!res.ok) {
          setError('Failed to load data. Please try again.');
          return;
        }
        const data = await res.json();
        if (data.attorney) {
          const a = data.attorney as Attorney;
          setAttorney(a);
          setPhone(a.phone);
          setFirmName(a.firm_name || '');
          setWebsite(a.website || '');
          setPreferredStates(a.preferred_states || []);
          setPreferredCaseTypes(a.preferred_case_types || []);
          setEmailNotifications(a.email_notifications);
          setSmsNotifications(a.sms_notifications);
        }
      } catch {
        setError('Failed to load data. Please try again.');
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, []);

  async function handleSave() {
    setSaving(true);
    setMessage('');
    try {
      const res = await fetch('/api/attorney/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone,
          firm_name: firmName || null,
          website: website || null,
          preferred_states: preferredStates,
          preferred_case_types: preferredCaseTypes,
          email_notifications: emailNotifications,
          sms_notifications: smsNotifications,
        }),
      });

      if (res.ok) {
        setMessage('Profile updated successfully.');
      } else {
        setMessage('Failed to update profile.');
      }
    } catch {
      setMessage('An error occurred.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!attorney) {
    return <p className="text-gray-500">Profile not found.</p>;
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Profile &amp; Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your account details and preferences</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 mb-6">
          {error}
        </div>
      )}

      {message && (
        <div className={`rounded-lg p-4 mb-4 ${message.includes('success') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {message}
        </div>
      )}

      {/* Account Info (read-only) */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" /> Account Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 gap-4 text-sm">
            <div><span className="text-gray-500">Name</span><p className="font-medium">{attorney.first_name} {attorney.last_name}</p></div>
            <div><span className="text-gray-500">Email</span><p className="font-medium">{attorney.email}</p></div>
            <div><span className="text-gray-500">Bar Number</span><p className="font-medium">{attorney.bar_number}</p></div>
            <div><span className="text-gray-500">Bar State</span><p className="font-medium">{attorney.bar_state}</p></div>
            <div><span className="text-gray-500">Licensed States</span><p className="font-medium">{attorney.licensed_states?.join(', ')}</p></div>
            <div><span className="text-gray-500">Lead Purchase Agreement</span><p className="font-medium text-green-600">{attorney.fee_agreement_signed ? 'Signed' : 'Not signed'}</p></div>
            <div><span className="text-gray-500">Account Status</span><p className="font-medium capitalize">{attorney.status}</p></div>
            <div><span className="text-gray-500">Verified</span><p className="font-medium">{attorney.is_verified ? 'Yes' : 'Pending'}</p></div>
          </div>
        </CardContent>
      </Card>

      {/* Editable Fields */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" /> Edit Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <Input label="Phone Number" value={phone} onChange={(e) => setPhone(e.target.value)} />
            <Input label="Firm Name" value={firmName} onChange={(e) => setFirmName(e.target.value)} />
          </div>
          <Input label="Website" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://yourfirm.com" />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Preferred States for Leads</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-3">
              {US_STATES.map((state) => (
                <label key={state.value} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferredStates.includes(state.value)}
                    onChange={(e) => {
                      setPreferredStates(
                        e.target.checked
                          ? [...preferredStates, state.value]
                          : preferredStates.filter((s) => s !== state.value)
                      );
                    }}
                    className="rounded border-gray-300"
                  />
                  {state.value}
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Practice Areas</label>
            <div className="space-y-2">
              {PRACTICE_AREAS.map((area) => (
                <Checkbox
                  key={area.value}
                  id={`pref_${area.value}`}
                  label={area.label}
                  checked={preferredCaseTypes.includes(area.value)}
                  onChange={(e) => {
                    setPreferredCaseTypes(
                      e.target.checked
                        ? [...preferredCaseTypes, area.value]
                        : preferredCaseTypes.filter((v) => v !== area.value)
                    );
                  }}
                />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notification Preferences */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" /> Notification Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Checkbox
            id="email_notifications"
            label="Email Notifications"
            description="Receive email alerts for new leads matching your preferences"
            checked={emailNotifications}
            onChange={(e) => setEmailNotifications(e.target.checked)}
          />
          <Checkbox
            id="sms_notifications"
            label="SMS Notifications (Coming Soon)"
            description="Text alerts for hot leads are not yet available"
            checked={smsNotifications}
            onChange={(e) => setSmsNotifications(e.target.checked)}
            disabled
          />
        </CardContent>
      </Card>

      <Button variant="attorney" onClick={handleSave} loading={saving} className="w-full sm:w-auto">
        <Save className="h-4 w-4 mr-2" /> Save Changes
      </Button>
    </div>
  );
}
