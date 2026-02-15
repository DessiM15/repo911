'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Scale, UserPlus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { FeeAgreement } from '@/components/attorney/FeeAgreement';
import { attorneyRegistrationSchema, type AttorneyRegistrationData } from '@/lib/validations/attorney-registration';
import { US_STATES } from '@/lib/utils';

const PRACTICE_AREAS = [
  { value: 'wrongful_repo', label: 'Wrongful Repossession' },
  { value: 'fdcpa', label: 'FDCPA / Debt Collection' },
  { value: 'scra', label: 'SCRA / Military Protection' },
  { value: 'fcra', label: 'FCRA / Credit Reporting' },
];

function RefCodeReader({ onCode }: { onCode: (code: string) => void }) {
  const searchParams = useSearchParams();
  const ref = searchParams.get('ref');
  if (ref) {
    // Set once on mount via useEffect-like pattern
    onCode(ref);
  }
  return null;
}

export default function AttorneyRegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<'register' | 'agreement'>('register');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<AttorneyRegistrationData | null>(null);
  const [refCode, setRefCode] = useState('');

  const {
    register: formRegister,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<AttorneyRegistrationData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(attorneyRegistrationSchema) as any,
    defaultValues: {
      licensed_states: [],
      preferred_case_types: [],
    },
  });

  function onRegistrationSubmit(data: AttorneyRegistrationData) {
    setFormData(data);
    setStep('agreement');
    setError('');
  }

  async function onAgreementSign(signature: string) {
    if (!formData) return;
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/attorney/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          electronic_signature: signature,
          referral_code: refCode || undefined,
        }),
      });

      const result = await res.json();
      if (!res.ok) {
        setError(result.error || 'Registration failed. Please try again.');
        return;
      }

      router.push('/attorney/dashboard');
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 py-12">
      <Suspense>
        <RefCodeReader onCode={(code) => setRefCode((prev) => prev || code)} />
      </Suspense>
      <div className="w-full max-w-2xl">
        {/* Referral indicator */}
        {refCode && (
          <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-700 flex items-center gap-2">
            <UserPlus className="h-4 w-4 shrink-0" />
            Referred by a colleague (code: <strong>{refCode}</strong>)
          </div>
        )}
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <Scale className="h-8 w-8 text-[#2ECC71]" />
            <span className="text-2xl font-bold text-[#1B2A4A]">
              Repo<span className="text-[#2ECC71]">911</span>
            </span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Attorney Registration</h1>
          <p className="text-gray-600 mt-1">
            {step === 'register'
              ? 'Create your account to access the lead marketplace.'
              : 'Review and sign the lead purchase agreement to complete registration.'}
          </p>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-4 mb-8">
          <div className={`flex items-center gap-2 text-sm font-medium ${step === 'register' ? 'text-[#1B2A4A]' : 'text-green-600'}`}>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step === 'register' ? 'bg-[#1B2A4A] text-white' : 'bg-green-100 text-green-600'}`}>
              {step === 'register' ? '1' : '\u2713'}
            </span>
            Account Details
          </div>
          <div className="w-8 h-px bg-gray-300" />
          <div className={`flex items-center gap-2 text-sm font-medium ${step === 'agreement' ? 'text-[#1B2A4A]' : 'text-gray-400'}`}>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step === 'agreement' ? 'bg-[#1B2A4A] text-white' : 'bg-gray-200 text-gray-500'}`}>
              2
            </span>
            Lead Purchase Agreement
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 mb-6">
            {error}
          </div>
        )}

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 sm:p-8">
          {step === 'register' ? (
            <form onSubmit={handleSubmit(onRegistrationSubmit)} className="space-y-6">
              {/* Name */}
              <div className="grid sm:grid-cols-2 gap-4">
                <Input label="First Name" required error={errors.first_name?.message} {...formRegister('first_name')} />
                <Input label="Last Name" required error={errors.last_name?.message} {...formRegister('last_name')} />
              </div>

              {/* Email & Phone */}
              <div className="grid sm:grid-cols-2 gap-4">
                <Input label="Email Address" type="email" required error={errors.email?.message} {...formRegister('email')} />
                <Input label="Phone Number" type="tel" required error={errors.phone?.message} {...formRegister('phone')} />
              </div>

              {/* Password */}
              <div className="grid sm:grid-cols-2 gap-4">
                <Input label="Password" type="password" required error={errors.password?.message} {...formRegister('password')} />
                <Input label="Confirm Password" type="password" required error={errors.confirm_password?.message} {...formRegister('confirm_password')} />
              </div>

              {/* Firm & Bar */}
              <Input label="Firm Name" error={errors.firm_name?.message} {...formRegister('firm_name')} placeholder="Optional" />

              <div className="grid sm:grid-cols-2 gap-4">
                <Input label="Bar Number" required error={errors.bar_number?.message} {...formRegister('bar_number')} />
                <Controller
                  control={control}
                  name="bar_state"
                  render={({ field }) => (
                    <Select
                      label="Primary Bar State"
                      required
                      options={US_STATES.map((s) => ({ value: s.value, label: s.label }))}
                      error={errors.bar_state?.message}
                      {...field}
                    />
                  )}
                />
              </div>

              <Input label="Website" type="url" error={errors.website?.message} {...formRegister('website')} placeholder="https://yourfirm.com (optional)" />

              {/* Licensed States */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  States Where Licensed <span className="text-red-500">*</span>
                </label>
                <Controller
                  control={control}
                  name="licensed_states"
                  render={({ field }) => (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-3">
                      {US_STATES.map((state) => (
                        <label key={state.value} className="flex items-center gap-2 text-sm cursor-pointer">
                          <input
                            type="checkbox"
                            checked={field.value?.includes(state.value)}
                            onChange={(e) => {
                              const val = field.value || [];
                              field.onChange(
                                e.target.checked
                                  ? [...val, state.value]
                                  : val.filter((s: string) => s !== state.value)
                              );
                            }}
                            className="rounded border-gray-300"
                          />
                          {state.label}
                        </label>
                      ))}
                    </div>
                  )}
                />
                {errors.licensed_states?.message && (
                  <p className="text-sm text-red-500 mt-1">{errors.licensed_states.message}</p>
                )}
              </div>

              {/* Practice Areas */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Practice Areas of Interest <span className="text-red-500">*</span>
                </label>
                <Controller
                  control={control}
                  name="preferred_case_types"
                  render={({ field }) => (
                    <div className="space-y-2">
                      {PRACTICE_AREAS.map((area) => (
                        <Checkbox
                          key={area.value}
                          id={`practice_${area.value}`}
                          label={area.label}
                          checked={field.value?.includes(area.value)}
                          onChange={(e) => {
                            const val = field.value || [];
                            field.onChange(
                              e.target.checked
                                ? [...val, area.value]
                                : val.filter((v: string) => v !== area.value)
                            );
                          }}
                        />
                      ))}
                    </div>
                  )}
                />
                {errors.preferred_case_types?.message && (
                  <p className="text-sm text-red-500 mt-1">{errors.preferred_case_types.message}</p>
                )}
              </div>

              <Button type="submit" variant="attorney" className="w-full" size="lg">
                Continue to Lead Purchase Agreement
              </Button>
            </form>
          ) : (
            <div>
              <button
                onClick={() => setStep('register')}
                className="text-sm text-[#3474BA] hover:underline mb-4"
              >
                &larr; Back to account details
              </button>
              <FeeAgreement onSign={onAgreementSign} loading={loading} />
            </div>
          )}
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account?{' '}
          <Link href="/attorney/login" className="text-[#1B2A4A] font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
