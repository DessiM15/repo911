'use client';

import { useState, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { intakeFormSchema, type IntakeFormInput } from '@/lib/validations/intake-form';
import { FormSection } from './FormSection';
import { ProgressIndicator } from './ProgressIndicator';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup } from '@/components/ui/radio';
import { Button } from '@/components/ui/button';
import { US_STATES, COMMON_LENDERS } from '@/lib/utils';
import { AlertCircle, ArrowLeft, ArrowRight } from 'lucide-react';
import Link from 'next/link';

const TOTAL_STEPS = 11;

const REPO_LOCATIONS = [
  { value: 'driveway', label: 'Driveway' },
  { value: 'street_front', label: 'Street in front of home' },
  { value: 'closed_garage', label: 'Closed/locked garage' },
  { value: 'gated_community', label: 'Gated community or gated property' },
  { value: 'private_parking', label: 'Private parking lot' },
  { value: 'workplace_parking', label: 'Workplace parking lot' },
  { value: 'public_parking', label: 'Public parking lot' },
  { value: 'other', label: 'Other' },
];

const IMPACT_OPTIONS = [
  { value: 'lost_job', label: 'Lost job or missed work' },
  { value: 'missed_medical', label: 'Missed medical appointments' },
  { value: 'children_school', label: "Children couldn't get to school" },
  { value: 'emotional_distress', label: 'Emotional distress / anxiety / depression' },
  { value: 'credit_score', label: 'Negative impact on credit score' },
  { value: 'harassment', label: 'Harassment from lender or collections' },
  { value: 'other', label: 'Other' },
];

const FDCPA_VIOLATION_OPTIONS = [
  { value: 'called_outside_hours', label: 'Called before 8am or after 9pm' },
  { value: 'called_workplace', label: 'Called your workplace after being told not to' },
  { value: 'abusive_language', label: 'Used abusive or profane language' },
  { value: 'threatened_arrest', label: 'Threatened arrest or jail' },
  { value: 'told_others', label: 'Told friends/family/employer about your debt' },
  { value: 'continued_calling', label: 'Continued calling after you requested they stop in writing' },
  { value: 'misrepresented_amount', label: 'Misrepresented the amount you owe' },
  { value: 'no_validation', label: 'Failed to send written validation of the debt' },
];

const YEAR_OPTIONS = Array.from({ length: 2026 - 1990 + 1 }, (_, i) => ({
  value: String(2026 - i),
  label: String(2026 - i),
}));

const LENDER_OPTIONS = [
  ...COMMON_LENDERS.map((l) => ({ value: l, label: l })),
  { value: 'other', label: 'Other' },
];

// Fields to validate per step (only required fields)
const STEP_FIELDS: Record<number, string[]> = {
  0: ['first_name', 'last_name', 'email', 'phone', 'preferred_contact', 'street_address', 'city', 'state', 'zip_code'],
  1: ['vehicle_year', 'vehicle_make', 'vehicle_model', 'lease_or_finance'],
  2: ['lender_name', 'behind_on_payments', 'received_written_notice'],
  3: ['repo_date', 'repo_time_of_day', 'repo_location', 'repo_state'],
  4: ['verbally_objected', 'narrative'],
  5: [],
  6: ['received_notice_of_sale', 'deficiency_balance_contact'],
  7: [],
  8: [],
  9: [],
  10: ['electronic_signature', 'consent_accurate_info', 'consent_not_legal_advice', 'consent_contact', 'consent_privacy_policy'],
};

export function IntakeForm() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [step, setStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [otherLender, setOtherLender] = useState('');
  const [otherRepoLocation, setOtherRepoLocation] = useState('');

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    trigger,
    formState: { errors },
  } = useForm<IntakeFormInput>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(intakeFormSchema) as any,
    defaultValues: {
      physical_force_or_threats: false,
      excessive_noise: false,
      entered_locked_area: false,
      property_damage: false,
      police_present: false,
      repo_at_workplace: false,
      public_embarrassment: false,
      had_belongings: false,
      military_service: false,
      debt_collector_contact: false,
      has_photos_videos: false,
      has_documents: false,
      has_witnesses: false,
      repo_location: [],
      impacts: [],
      fdcpa_violations: [],
      consent_accurate_info: false,
      consent_not_legal_advice: false,
      consent_contact: false,
      consent_privacy_policy: false,
    },
  });

  const watchBehindOnPayments = watch('behind_on_payments');
  const watchVerballyObjected = watch('verbally_objected');
  const watchPolicePresent = watch('police_present');
  const watchHadBelongings = watch('had_belongings');
  const watchBelongingsReturned = watch('belongings_returned');
  const watchMilitaryService = watch('military_service');
  const watchActiveDuty = watch('active_duty_at_repo');
  const watchDebtCollector = watch('debt_collector_contact');
  const watchHasWitnesses = watch('has_witnesses');
  const watchState = watch('state');
  const watchLender = watch('lender_name');
  const watchRepoLocation = watch('repo_location');

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  async function goNext() {
    const fields = STEP_FIELDS[step];
    if (fields && fields.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const valid = await trigger(fields as any);
      if (!valid) return;
    }

    setCompletedSteps((prev) => {
      const updated = new Set(prev);
      updated.add(step);
      return Array.from(updated);
    });

    if (step < TOTAL_STEPS - 1) {
      setStep(step + 1);
      scrollToTop();
    }
  }

  function goBack() {
    if (step > 0) {
      setStep(step - 1);
      scrollToTop();
    }
  }

  function goToStep(index: number) {
    if (completedSteps.includes(index)) {
      setStep(index);
      scrollToTop();
    }
  }

  async function onSubmit(data: IntakeFormInput) {
    setSubmitting(true);
    setSubmitError(null);

    // Handle "Other" lender
    if (data.lender_name === 'other' && otherLender) {
      data.lender_name = otherLender;
    }

    // Handle "Other" repo location
    if (data.repo_location.includes('other') && otherRepoLocation) {
      data.repo_location = data.repo_location.map((l) =>
        l === 'other' ? `Other: ${otherRepoLocation}` : l
      );
    }

    try {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Something went wrong. Please try again.');
      }

      const params = new URLSearchParams({
        tier: result.tier,
        id: result.id,
      });
      router.push(`/claim/confirmation?${params.toString()}`);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  }

  const isLastStep = step === TOTAL_STEPS - 1;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <ProgressIndicator
        currentSection={step}
        completedSections={completedSteps}
        onSectionClick={goToStep}
      />

      {/* Step 0: Contact Information */}
      {step === 0 && (
        <FormSection title="Contact Information" description="How can we reach you?">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="First Name"
              required
              id="first_name"
              error={errors.first_name?.message}
              {...register('first_name')}
            />
            <Input
              label="Last Name"
              required
              id="last_name"
              error={errors.last_name?.message}
              {...register('last_name')}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Email Address"
              type="email"
              required
              id="email"
              error={errors.email?.message}
              {...register('email')}
            />
            <Input
              label="Phone Number"
              type="tel"
              required
              id="phone"
              placeholder="(555) 555-5555"
              error={errors.phone?.message}
              {...register('phone')}
            />
          </div>
          <Controller
            control={control}
            name="preferred_contact"
            render={({ field }) => (
              <RadioGroup
                label="Preferred Contact Method"
                name="preferred_contact"
                required
                options={[
                  { value: 'phone', label: 'Phone' },
                  { value: 'email', label: 'Email' },
                  { value: 'text', label: 'Text Message' },
                ]}
                value={field.value}
                onChange={field.onChange}
                error={errors.preferred_contact?.message}
              />
            )}
          />
          <Controller
            control={control}
            name="best_time_to_contact"
            render={({ field }) => (
              <Select
                label="Best Time to Contact"
                id="best_time_to_contact"
                placeholder="Select a time..."
                options={[
                  { value: 'morning', label: 'Morning' },
                  { value: 'afternoon', label: 'Afternoon' },
                  { value: 'evening', label: 'Evening' },
                  { value: 'anytime', label: 'Anytime' },
                ]}
                value={field.value || ''}
                onChange={(e) => field.onChange(e.target.value || undefined)}
              />
            )}
          />
          <Input
            label="Street Address"
            required
            id="street_address"
            error={errors.street_address?.message}
            {...register('street_address')}
          />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="City"
              required
              id="city"
              error={errors.city?.message}
              {...register('city')}
            />
            <Controller
              control={control}
              name="state"
              render={({ field }) => (
                <Select
                  label="State"
                  required
                  id="state"
                  placeholder="Select state..."
                  options={US_STATES.map((s) => ({ value: s.value, label: s.label }))}
                  value={field.value || ''}
                  onChange={(e) => {
                    field.onChange(e.target.value);
                    if (!watch('repo_state')) {
                      setValue('repo_state', e.target.value);
                    }
                  }}
                  error={errors.state?.message}
                />
              )}
            />
            <Input
              label="ZIP Code"
              required
              id="zip_code"
              maxLength={5}
              error={errors.zip_code?.message}
              {...register('zip_code')}
            />
          </div>
        </FormSection>
      )}

      {/* Step 1: Vehicle Information */}
      {step === 1 && (
        <FormSection title="Vehicle Information" description="Tell us about the repossessed vehicle.">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Controller
              control={control}
              name="vehicle_year"
              render={({ field }) => (
                <Select
                  label="Vehicle Year"
                  required
                  id="vehicle_year"
                  placeholder="Select year..."
                  options={YEAR_OPTIONS}
                  value={field.value ? String(field.value) : ''}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                  error={errors.vehicle_year?.message}
                />
              )}
            />
            <Input
              label="Vehicle Make"
              required
              id="vehicle_make"
              placeholder="e.g., Toyota"
              error={errors.vehicle_make?.message}
              {...register('vehicle_make')}
            />
            <Input
              label="Vehicle Model"
              required
              id="vehicle_model"
              placeholder="e.g., Camry"
              error={errors.vehicle_model?.message}
              {...register('vehicle_model')}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Vehicle Color"
              id="vehicle_color"
              {...register('vehicle_color')}
            />
            <Input
              label="VIN (if known)"
              id="vin"
              maxLength={17}
              helperText="17-character Vehicle Identification Number"
              error={errors.vin?.message}
              {...register('vin')}
            />
          </div>
          <Controller
            control={control}
            name="lease_or_finance"
            render={({ field }) => (
              <RadioGroup
                label="Was this a leased or financed vehicle?"
                name="lease_or_finance"
                required
                options={[
                  { value: 'financed', label: 'Financed' },
                  { value: 'leased', label: 'Leased' },
                  { value: 'not_sure', label: 'Not Sure' },
                ]}
                value={field.value}
                onChange={field.onChange}
                error={errors.lease_or_finance?.message}
              />
            )}
          />
        </FormSection>
      )}

      {/* Step 2: Lender / Creditor Information */}
      {step === 2 && (
        <FormSection title="Lender / Creditor Information" description="Who held the loan or lease on your vehicle?">
          <Controller
            control={control}
            name="lender_name"
            render={({ field }) => (
              <div>
                <Select
                  label="Lender / Finance Company Name"
                  required
                  id="lender_name"
                  placeholder="Select your lender..."
                  options={LENDER_OPTIONS}
                  value={field.value || ''}
                  onChange={(e) => field.onChange(e.target.value)}
                  error={errors.lender_name?.message}
                />
                {watchLender === 'other' && (
                  <Input
                    className="mt-2"
                    placeholder="Enter lender name..."
                    value={otherLender}
                    onChange={(e) => setOtherLender(e.target.value)}
                  />
                )}
              </div>
            )}
          />
          <Input
            label="Repossession Company Name (if known)"
            id="repo_company_name"
            {...register('repo_company_name')}
          />
          <Controller
            control={control}
            name="behind_on_payments"
            render={({ field }) => (
              <RadioGroup
                label="Were you behind on payments at the time of repossession?"
                name="behind_on_payments"
                required
                options={[
                  { value: 'yes', label: 'Yes' },
                  { value: 'no', label: 'No' },
                  { value: 'not_sure', label: 'Not Sure' },
                ]}
                value={field.value}
                onChange={field.onChange}
                error={errors.behind_on_payments?.message}
              />
            )}
          />
          {watchBehindOnPayments === 'yes' && (
            <Controller
              control={control}
              name="payments_behind"
              render={({ field }) => (
                <Select
                  label="How many payments behind?"
                  id="payments_behind"
                  placeholder="Select..."
                  options={[
                    { value: '1', label: '1' },
                    { value: '2', label: '2' },
                    { value: '3', label: '3' },
                    { value: '4', label: '4' },
                    { value: '5', label: '5+' },
                  ]}
                  value={field.value ? String(field.value) : ''}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                />
              )}
            />
          )}
          <Controller
            control={control}
            name="contacted_lender_about_arrangements"
            render={({ field }) => (
              <RadioGroup
                label="Had you been in contact with your lender about payment arrangements?"
                name="contacted_lender"
                options={[
                  { value: 'true', label: 'Yes' },
                  { value: 'false', label: 'No' },
                ]}
                value={field.value === undefined ? undefined : String(field.value)}
                onChange={(v) => field.onChange(v === 'true')}
              />
            )}
          />
          <Controller
            control={control}
            name="received_written_notice"
            render={({ field }) => (
              <RadioGroup
                label="Did you receive any written notice before the repossession?"
                name="received_written_notice"
                required
                options={[
                  { value: 'yes', label: 'Yes' },
                  { value: 'no', label: 'No' },
                  { value: 'not_sure', label: 'Not Sure' },
                ]}
                value={field.value}
                onChange={field.onChange}
                error={errors.received_written_notice?.message}
              />
            )}
          />
        </FormSection>
      )}

      {/* Step 3: Repossession Details */}
      {step === 3 && (
        <FormSection title="Repossession Details" description="When and where did the repossession happen?">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Date of Repossession"
              type="date"
              required
              id="repo_date"
              max={new Date().toISOString().split('T')[0]}
              error={errors.repo_date?.message}
              {...register('repo_date')}
            />
            <Controller
              control={control}
              name="repo_time_of_day"
              render={({ field }) => (
                <Select
                  label="Approximate Time of Day"
                  required
                  id="repo_time_of_day"
                  placeholder="Select..."
                  options={[
                    { value: 'early_morning', label: 'Early Morning (12am-6am)' },
                    { value: 'morning', label: 'Morning (6am-12pm)' },
                    { value: 'afternoon', label: 'Afternoon (12pm-6pm)' },
                    { value: 'evening', label: 'Evening (6pm-12am)' },
                    { value: 'not_sure', label: 'Not Sure' },
                  ]}
                  value={field.value || ''}
                  onChange={(e) => field.onChange(e.target.value)}
                  error={errors.repo_time_of_day?.message}
                />
              )}
            />
          </div>
          <div>
            <p className="block text-sm font-medium text-gray-700 mb-2">
              Where was your vehicle when it was taken? <span className="text-red-500">*</span>
            </p>
            <div className="space-y-2">
              {REPO_LOCATIONS.map((loc) => (
                <Controller
                  key={loc.value}
                  control={control}
                  name="repo_location"
                  render={({ field }) => (
                    <Checkbox
                      id={`repo_loc_${loc.value}`}
                      label={loc.label}
                      checked={field.value?.includes(loc.value)}
                      onChange={(e) => {
                        const current = field.value || [];
                        if (e.target.checked) {
                          field.onChange([...current, loc.value]);
                        } else {
                          field.onChange(current.filter((v: string) => v !== loc.value));
                        }
                      }}
                    />
                  )}
                />
              ))}
              {watchRepoLocation?.includes('other') && (
                <Input
                  className="ml-4 sm:ml-8"
                  placeholder="Please describe the location..."
                  value={otherRepoLocation}
                  onChange={(e) => setOtherRepoLocation(e.target.value)}
                />
              )}
            </div>
            {errors.repo_location && (
              <p className="mt-1 text-sm text-red-500">{errors.repo_location.message}</p>
            )}
          </div>
          <Controller
            control={control}
            name="repo_state"
            render={({ field }) => (
              <Select
                label="State where repossession occurred"
                required
                id="repo_state"
                placeholder="Select state..."
                options={US_STATES.map((s) => ({ value: s.value, label: s.label }))}
                value={field.value || watchState || ''}
                onChange={(e) => field.onChange(e.target.value)}
                error={errors.repo_state?.message}
              />
            )}
          />
        </FormSection>
      )}

      {/* Step 4: Breach of Peace Screening */}
      {step === 4 && (
        <FormSection
          title="Breach of Peace Screening"
          description="The law protects you from aggressive or unlawful behavior during a repossession. Please answer all questions below."
        >
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
            <AlertCircle className="inline h-4 w-4 mr-1 -mt-0.5" />
            These questions are critical for evaluating your case. Please answer as accurately as possible.
          </div>

          <Controller
            control={control}
            name="verbally_objected"
            render={({ field }) => (
              <RadioGroup
                label={"Did you verbally object to the repossession? (e.g., \"Stop,\" \"Leave my car,\" \"You can't take it\")"}
                name="verbally_objected"
                required
                options={[
                  { value: 'yes', label: 'Yes' },
                  { value: 'no', label: 'No' },
                  { value: 'not_sure', label: 'Not Sure' },
                ]}
                value={field.value}
                onChange={field.onChange}
                error={errors.verbally_objected?.message}
              />
            )}
          />

          {watchVerballyObjected === 'yes' && (
            <Controller
              control={control}
              name="continued_after_objection"
              render={({ field }) => (
                <RadioGroup
                  label="Did the repo agent continue taking the vehicle AFTER you objected?"
                  name="continued_after_objection"
                  required
                  options={[
                    { value: 'yes', label: 'Yes' },
                    { value: 'no', label: 'No' },
                  ]}
                  value={field.value}
                  onChange={field.onChange}
                />
              )}
            />
          )}

          <Controller
            control={control}
            name="physical_force_or_threats"
            render={({ field }) => (
              <RadioGroup
                label="Did the repo agent use physical force, threats, or intimidation?"
                name="physical_force"
                required
                options={[
                  { value: 'true', label: 'Yes' },
                  { value: 'false', label: 'No' },
                ]}
                value={String(field.value)}
                onChange={(v) => field.onChange(v === 'true')}
              />
            )}
          />

          <Controller
            control={control}
            name="excessive_noise"
            render={({ field }) => (
              <RadioGroup
                label="Did the repo agent yell, cause a scene, or create excessive noise?"
                name="excessive_noise"
                required
                options={[
                  { value: 'true', label: 'Yes' },
                  { value: 'false', label: 'No' },
                ]}
                value={String(field.value)}
                onChange={(v) => field.onChange(v === 'true')}
              />
            )}
          />

          <Controller
            control={control}
            name="entered_locked_area"
            render={({ field }) => (
              <RadioGroup
                label="Did the repo agent enter a locked or gated area without permission? (e.g., closed garage, gated yard, gated community)"
                name="entered_locked_area"
                required
                options={[
                  { value: 'true', label: 'Yes' },
                  { value: 'false', label: 'No' },
                ]}
                value={String(field.value)}
                onChange={(v) => field.onChange(v === 'true')}
              />
            )}
          />

          <Controller
            control={control}
            name="property_damage"
            render={({ field }) => (
              <RadioGroup
                label="Did the repo agent damage your property during the repossession? (e.g., broke a lock, damaged gate, scratched another vehicle)"
                name="property_damage"
                required
                options={[
                  { value: 'true', label: 'Yes' },
                  { value: 'false', label: 'No' },
                ]}
                value={String(field.value)}
                onChange={(v) => field.onChange(v === 'true')}
              />
            )}
          />

          <Controller
            control={control}
            name="police_present"
            render={({ field }) => (
              <RadioGroup
                label="Were police called or present during the repossession?"
                name="police_present"
                required
                options={[
                  { value: 'true', label: 'Yes' },
                  { value: 'false', label: 'No' },
                ]}
                value={String(field.value)}
                onChange={(v) => field.onChange(v === 'true')}
              />
            )}
          />

          {watchPolicePresent && (
            <Controller
              control={control}
              name="police_assisted"
              render={({ field }) => (
                <RadioGroup
                  label="If police were present, did they assist or encourage the repo agent?"
                  name="police_assisted"
                  options={[
                    { value: 'yes', label: 'Yes' },
                    { value: 'no', label: 'No' },
                    { value: 'not_sure', label: 'Not Sure' },
                  ]}
                  value={field.value}
                  onChange={field.onChange}
                />
              )}
            />
          )}

          <Controller
            control={control}
            name="repo_at_workplace"
            render={({ field }) => (
              <RadioGroup
                label="Did the repo agent come to your workplace?"
                name="repo_at_workplace"
                required
                options={[
                  { value: 'true', label: 'Yes' },
                  { value: 'false', label: 'No' },
                ]}
                value={String(field.value)}
                onChange={(v) => field.onChange(v === 'true')}
              />
            )}
          />

          <Controller
            control={control}
            name="public_embarrassment"
            render={({ field }) => (
              <RadioGroup
                label="Did the repossession happen in a way that caused public embarrassment or humiliation?"
                name="public_embarrassment"
                required
                options={[
                  { value: 'true', label: 'Yes' },
                  { value: 'false', label: 'No' },
                ]}
                value={String(field.value)}
                onChange={(v) => field.onChange(v === 'true')}
              />
            )}
          />

          <Textarea
            label="Describe what happened in your own words"
            required
            id="narrative"
            placeholder="Please describe the repossession in as much detail as possible. Include what the repo agent said or did, where you were, who witnessed it, and anything else you remember."
            error={errors.narrative?.message}
            className="min-h-[150px]"
            {...register('narrative')}
          />
        </FormSection>
      )}

      {/* Step 5: Personal Belongings */}
      {step === 5 && (
        <FormSection title="Personal Belongings" description="Were your personal items affected?">
          <Controller
            control={control}
            name="had_belongings"
            render={({ field }) => (
              <RadioGroup
                label="Did you have personal belongings in the vehicle at the time?"
                name="had_belongings"
                required
                options={[
                  { value: 'true', label: 'Yes' },
                  { value: 'false', label: 'No' },
                ]}
                value={String(field.value)}
                onChange={(v) => field.onChange(v === 'true')}
              />
            )}
          />

          {watchHadBelongings && (
            <>
              <Controller
                control={control}
                name="belongings_returned"
                render={({ field }) => (
                  <RadioGroup
                    label="Were your belongings returned to you?"
                    name="belongings_returned"
                    required
                    options={[
                      { value: 'yes', label: 'Yes' },
                      { value: 'no', label: 'No' },
                      { value: 'some', label: 'Some were returned' },
                    ]}
                    value={field.value}
                    onChange={field.onChange}
                  />
                )}
              />

              {(watchBelongingsReturned === 'no' || watchBelongingsReturned === 'some') && (
                <>
                  <Textarea
                    label="What items were in the vehicle?"
                    id="belongings_list"
                    placeholder="List all personal items (laptops, phones, tools, car seats, medications, documents, etc.)"
                    {...register('belongings_list')}
                  />
                  <Input
                    label="Estimated value of unreturned belongings"
                    type="number"
                    id="belongings_value"
                    placeholder="$"
                    {...register('belongings_value')}
                  />
                </>
              )}

              <Controller
                control={control}
                name="charged_fee_for_belongings"
                render={({ field }) => (
                  <RadioGroup
                    label="Did the lender or repo company charge you a fee to retrieve your belongings?"
                    name="charged_fee"
                    options={[
                      { value: 'true', label: 'Yes' },
                      { value: 'false', label: 'No' },
                    ]}
                    value={field.value === undefined ? undefined : String(field.value)}
                    onChange={(v) => field.onChange(v === 'true')}
                  />
                )}
              />
            </>
          )}
        </FormSection>
      )}

      {/* Step 6: Post-Repossession */}
      {step === 6 && (
        <FormSection title="Post-Repossession" description="What happened after the repossession?">
          <Controller
            control={control}
            name="received_notice_of_sale"
            render={({ field }) => (
              <RadioGroup
                label="Have you received a Notice of Sale (notice that your vehicle will be sold at auction)?"
                name="received_notice_of_sale"
                required
                options={[
                  { value: 'yes', label: 'Yes' },
                  { value: 'no', label: 'No' },
                  { value: 'not_sure', label: 'Not Sure' },
                ]}
                value={field.value}
                onChange={field.onChange}
                error={errors.received_notice_of_sale?.message}
              />
            )}
          />
          <Controller
            control={control}
            name="deficiency_balance_contact"
            render={({ field }) => (
              <RadioGroup
                label="Have you been contacted about a deficiency balance (remaining loan amount after the vehicle is sold)?"
                name="deficiency_balance_contact"
                required
                options={[
                  { value: 'yes', label: 'Yes' },
                  { value: 'no', label: 'No' },
                  { value: 'not_sure', label: 'Not Sure' },
                ]}
                value={field.value}
                onChange={field.onChange}
                error={errors.deficiency_balance_contact?.message}
              />
            )}
          />
          <div>
            <p className="block text-sm font-medium text-gray-700 mb-2">
              Have you experienced any of the following as a result of the repossession?
            </p>
            <div className="space-y-2">
              {IMPACT_OPTIONS.map((impact) => (
                <Controller
                  key={impact.value}
                  control={control}
                  name="impacts"
                  render={({ field }) => (
                    <Checkbox
                      id={`impact_${impact.value}`}
                      label={impact.label}
                      checked={field.value?.includes(impact.value)}
                      onChange={(e) => {
                        const current = field.value || [];
                        if (e.target.checked) {
                          field.onChange([...current, impact.value]);
                        } else {
                          field.onChange(current.filter((v: string) => v !== impact.value));
                        }
                      }}
                    />
                  )}
                />
              ))}
            </div>
          </div>
          <Controller
            control={control}
            name="credit_report_affected"
            render={({ field }) => (
              <RadioGroup
                label="Has the repossession been reported on your credit report?"
                name="credit_report_affected"
                options={[
                  { value: 'yes', label: 'Yes' },
                  { value: 'no', label: 'No' },
                  { value: 'not_sure', label: 'Not Sure' },
                ]}
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />
        </FormSection>
      )}

      {/* Step 7: Military Service */}
      {step === 7 && (
        <FormSection title="Military Service (SCRA Protection)" description="Active-duty military members have special federal protections.">
          <Controller
            control={control}
            name="military_service"
            render={({ field }) => (
              <RadioGroup
                label="Are you currently serving or have you recently served in the US military?"
                name="military_service"
                required
                options={[
                  { value: 'true', label: 'Yes' },
                  { value: 'false', label: 'No' },
                ]}
                value={String(field.value)}
                onChange={(v) => field.onChange(v === 'true')}
              />
            )}
          />
          {watchMilitaryService && (
            <>
              <Controller
                control={control}
                name="military_branch"
                render={({ field }) => (
                  <Select
                    label="Branch of Service"
                    id="military_branch"
                    placeholder="Select branch..."
                    options={[
                      { value: 'army', label: 'Army' },
                      { value: 'navy', label: 'Navy' },
                      { value: 'air_force', label: 'Air Force' },
                      { value: 'marines', label: 'Marines' },
                      { value: 'coast_guard', label: 'Coast Guard' },
                      { value: 'space_force', label: 'Space Force' },
                      { value: 'national_guard', label: 'National Guard' },
                      { value: 'reserves', label: 'Reserves' },
                    ]}
                    value={field.value || ''}
                    onChange={(e) => field.onChange(e.target.value || undefined)}
                  />
                )}
              />
              <Controller
                control={control}
                name="active_duty_at_repo"
                render={({ field }) => (
                  <RadioGroup
                    label="Were you on active duty at the time of the repossession?"
                    name="active_duty"
                    options={[
                      { value: 'true', label: 'Yes' },
                      { value: 'false', label: 'No' },
                    ]}
                    value={field.value === undefined ? undefined : String(field.value)}
                    onChange={(v) => field.onChange(v === 'true')}
                  />
                )}
              />
              {watchActiveDuty && (
                <Controller
                  control={control}
                  name="loan_before_active_duty"
                  render={({ field }) => (
                    <RadioGroup
                      label="Was your auto loan originated before your active duty service began?"
                      name="loan_before_active"
                      options={[
                        { value: 'yes', label: 'Yes' },
                        { value: 'no', label: 'No' },
                        { value: 'not_sure', label: 'Not Sure' },
                      ]}
                      value={field.value}
                      onChange={field.onChange}
                    />
                  )}
                />
              )}
            </>
          )}
        </FormSection>
      )}

      {/* Step 8: FDCPA Violations */}
      {step === 8 && (
        <FormSection title="Illegal Debt Collection (FDCPA)" description="Federal law protects you from abusive debt collection practices.">
          <Controller
            control={control}
            name="debt_collector_contact"
            render={({ field }) => (
              <RadioGroup
                label="Has any debt collector contacted you about this vehicle?"
                name="debt_collector_contact"
                required
                options={[
                  { value: 'true', label: 'Yes' },
                  { value: 'false', label: 'No' },
                ]}
                value={String(field.value)}
                onChange={(v) => field.onChange(v === 'true')}
              />
            )}
          />
          {watchDebtCollector && (
            <div>
              <p className="block text-sm font-medium text-gray-700 mb-2">
                Have they done any of the following? (Check all that apply)
              </p>
              <div className="space-y-2">
                {FDCPA_VIOLATION_OPTIONS.map((violation) => (
                  <Controller
                    key={violation.value}
                    control={control}
                    name="fdcpa_violations"
                    render={({ field }) => (
                      <Checkbox
                        id={`fdcpa_${violation.value}`}
                        label={violation.label}
                        checked={field.value?.includes(violation.value)}
                        onChange={(e) => {
                          const current = field.value || [];
                          if (e.target.checked) {
                            field.onChange([...current, violation.value]);
                          } else {
                            field.onChange(current.filter((v: string) => v !== violation.value));
                          }
                        }}
                      />
                    )}
                  />
                ))}
              </div>
            </div>
          )}
        </FormSection>
      )}

      {/* Step 9: Evidence & Documents */}
      {step === 9 && (
        <FormSection title="Evidence & Documents" description="Supporting evidence strengthens your case.">
          <Controller
            control={control}
            name="has_photos_videos"
            render={({ field }) => (
              <RadioGroup
                label="Do you have any photos or videos of the repossession?"
                name="has_photos_videos"
                options={[
                  { value: 'true', label: 'Yes' },
                  { value: 'false', label: 'No' },
                ]}
                value={String(field.value)}
                onChange={(v) => field.onChange(v === 'true')}
              />
            )}
          />
          <Controller
            control={control}
            name="has_documents"
            render={({ field }) => (
              <RadioGroup
                label="Do you have any documents related to your loan or repossession?"
                name="has_documents"
                options={[
                  { value: 'true', label: 'Yes' },
                  { value: 'false', label: 'No' },
                ]}
                value={String(field.value)}
                onChange={(v) => field.onChange(v === 'true')}
              />
            )}
          />
          <Controller
            control={control}
            name="has_witnesses"
            render={({ field }) => (
              <RadioGroup
                label="Do you have any witnesses to the repossession?"
                name="has_witnesses"
                options={[
                  { value: 'true', label: 'Yes' },
                  { value: 'false', label: 'No' },
                ]}
                value={String(field.value)}
                onChange={(v) => field.onChange(v === 'true')}
              />
            )}
          />
          {watchHasWitnesses && (
            <Textarea
              label="Witness name(s) and contact info"
              id="witness_info"
              placeholder="Please provide witness names and their phone numbers or email addresses"
              {...register('witness_info')}
            />
          )}
          <p className="text-sm text-gray-500">
            You will be able to upload photos, videos, and documents after submitting this form.
          </p>
        </FormSection>
      )}

      {/* Step 10: Consent & Submission */}
      {step === 10 && (
        <FormSection title="Consent & Submission" description="Please review and sign below to submit your case for review.">
          <Input
            label="Electronic Signature (Full Legal Name)"
            required
            id="electronic_signature"
            placeholder="Type your full legal name"
            error={errors.electronic_signature?.message}
            {...register('electronic_signature')}
          />
          <Input
            label="Date"
            type="date"
            id="consent_date"
            value={new Date().toISOString().split('T')[0]}
            disabled
          />

          <div className="space-y-3 pt-2">
            <Controller
              control={control}
              name="consent_accurate_info"
              render={({ field }) => (
                <Checkbox
                  id="consent_accurate_info"
                  label="I certify that the information provided is true and accurate to the best of my knowledge."
                  required
                  checked={!!field.value}
                  onChange={(e) => field.onChange(e.target.checked)}
                  error={errors.consent_accurate_info?.message}
                />
              )}
            />
            <Controller
              control={control}
              name="consent_not_legal_advice"
              render={({ field }) => (
                <Checkbox
                  id="consent_not_legal_advice"
                  label="I understand that submitting this form does not create an attorney-client relationship. This is not legal advice."
                  required
                  checked={!!field.value}
                  onChange={(e) => field.onChange(e.target.checked)}
                  error={errors.consent_not_legal_advice?.message}
                />
              )}
            />
            <Controller
              control={control}
              name="consent_contact"
              render={({ field }) => (
                <Checkbox
                  id="consent_contact"
                  label="I consent to being contacted by Repo911 and its network of attorneys via phone, email, or text message regarding my case."
                  required
                  checked={!!field.value}
                  onChange={(e) => field.onChange(e.target.checked)}
                  error={errors.consent_contact?.message}
                />
              )}
            />
            <Controller
              control={control}
              name="consent_privacy_policy"
              render={({ field }) => (
                <Checkbox
                  id="consent_privacy_policy"
                  required
                  checked={!!field.value}
                  onChange={(e) => field.onChange(e.target.checked)}
                  error={errors.consent_privacy_policy?.message}
                  label=""
                  description=""
                />
              )}
            />
            <label htmlFor="consent_privacy_policy" className="text-sm text-gray-700 -mt-2 block ml-4 sm:ml-8 cursor-pointer">
              I have read and agree to the{' '}
              <Link href="/privacy" target="_blank" className="text-[#4A90D9] underline">
                Privacy Policy
              </Link>{' '}
              and{' '}
              <Link href="/terms" target="_blank" className="text-[#4A90D9] underline">
                Terms of Service
              </Link>
              .
            </label>
          </div>

          {submitError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
              <AlertCircle className="inline h-4 w-4 mr-1 -mt-0.5" />
              {submitError}
            </div>
          )}
        </FormSection>
      )}

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between gap-4">
        {step > 0 ? (
          <Button type="button" variant="outline" size="lg" onClick={goBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        ) : (
          <div />
        )}

        {isLastStep ? (
          <Button
            type="submit"
            variant="consumer"
            size="lg"
            loading={submitting}
            className="flex-1 max-w-sm text-lg py-4"
          >
            Submit My Case for Free Review
          </Button>
        ) : (
          <Button
            type="button"
            variant="primary"
            size="lg"
            onClick={goNext}
            className="flex-1 max-w-sm"
          >
            Continue
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>

      {isLastStep && (
        <p className="text-xs text-gray-400 text-center">
          By submitting, you agree to our Privacy Policy and Terms of Service.
          This is not legal advice and does not create an attorney-client relationship.
        </p>
      )}
    </form>
  );
}
