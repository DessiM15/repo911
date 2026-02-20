'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useForm, Controller, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
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
import { AlertCircle, ArrowLeft, ArrowRight, X } from 'lucide-react';
import { Link } from '@/i18n/navigation';

const TOTAL_STEPS = 11;
const DRAFT_KEY = 'repo911_intake_draft';
const CONSENT_FIELDS = ['electronic_signature', 'consent_accurate_info', 'consent_not_legal_advice', 'consent_contact', 'consent_privacy_policy'];

const MAX_YEAR = new Date().getFullYear() + 1;
const YEAR_OPTIONS = Array.from({ length: MAX_YEAR - 1990 + 1 }, (_, i) => ({
  value: String(MAX_YEAR - i),
  label: String(MAX_YEAR - i),
}));

// Fields to validate per step (only required fields)
const STEP_FIELDS: Record<number, (keyof IntakeFormInput)[]> = {
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

interface UtmParams {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
}

export function IntakeForm() {
  const router = useRouter();
  const t = useTranslations('claim');
  const tc = useTranslations('common');
  const utmRef = useRef<UtmParams>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [step, setStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [otherLender, setOtherLender] = useState('');
  const [otherRepoLocation, setOtherRepoLocation] = useState('');
  const [draftRestored, setDraftRestored] = useState(false);
  const [draftSavedAt, setDraftSavedAt] = useState<number | null>(null);
  const saveTimerRef = useRef<number>(0);

  // Translated option arrays
  const REPO_LOCATIONS = [
    { value: 'driveway', label: t('options.repoLocations.driveway') },
    { value: 'street_front', label: t('options.repoLocations.streetFront') },
    { value: 'closed_garage', label: t('options.repoLocations.closedGarage') },
    { value: 'gated_community', label: t('options.repoLocations.gatedCommunity') },
    { value: 'private_parking', label: t('options.repoLocations.privateParking') },
    { value: 'workplace_parking', label: t('options.repoLocations.workplaceParking') },
    { value: 'public_parking', label: t('options.repoLocations.publicParking') },
    { value: 'other', label: tc('other') },
  ];

  const IMPACT_OPTIONS = [
    { value: 'lost_job', label: t('options.impacts.lostJob') },
    { value: 'missed_medical', label: t('options.impacts.missedMedical') },
    { value: 'children_school', label: t('options.impacts.childrenSchool') },
    { value: 'emotional_distress', label: t('options.impacts.emotionalDistress') },
    { value: 'credit_score', label: t('options.impacts.creditScore') },
    { value: 'harassment', label: t('options.impacts.harassment') },
    { value: 'other', label: tc('other') },
  ];

  const FDCPA_VIOLATION_OPTIONS = [
    { value: 'called_outside_hours', label: t('options.fdcpaViolations.calledOutsideHours') },
    { value: 'called_workplace', label: t('options.fdcpaViolations.calledWorkplace') },
    { value: 'abusive_language', label: t('options.fdcpaViolations.abusiveLanguage') },
    { value: 'threatened_arrest', label: t('options.fdcpaViolations.threatenedArrest') },
    { value: 'told_others', label: t('options.fdcpaViolations.toldOthers') },
    { value: 'continued_calling', label: t('options.fdcpaViolations.continuedCalling') },
    { value: 'misrepresented_amount', label: t('options.fdcpaViolations.misrepresentedAmount') },
    { value: 'no_validation', label: t('options.fdcpaViolations.noValidation') },
  ];

  const LENDER_OPTIONS = [
    ...COMMON_LENDERS.map((l) => ({ value: l, label: l })),
    { value: 'other', label: tc('other') },
  ];

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    setValue,
    trigger,
    formState: { errors },
  } = useForm<IntakeFormInput>({
    resolver: zodResolver(intakeFormSchema) as unknown as Resolver<IntakeFormInput>,
    defaultValues: {
      repo_location: [],
      impacts: [],
      fdcpa_violations: [],
      consent_accurate_info: false,
      consent_not_legal_advice: false,
      consent_contact: false,
      consent_privacy_policy: false,
    },
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const keys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'] as const;
    for (const key of keys) {
      const val = params.get(key);
      if (val) utmRef.current[key] = val;
    }
  }, []);

  // Restore draft on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(DRAFT_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        reset(parsed.values, { keepDefaultValues: true });
        setStep(parsed.step || 0);
        setCompletedSteps(parsed.completedSteps || []);
        if (parsed.otherLender) setOtherLender(parsed.otherLender);
        if (parsed.otherRepoLocation) setOtherRepoLocation(parsed.otherRepoLocation);
        setDraftSavedAt(parsed.savedAt || null);
        setDraftRestored(true);
      }
    } catch { /* ignore corrupt data */ }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Debounced save to localStorage
  useEffect(() => {
    const subscription = watch((values) => {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = window.setTimeout(() => {
        try {
          // Exclude consent fields to avoid implying pre-consent
          const filtered = { ...values };
          for (const key of CONSENT_FIELDS) {
            delete filtered[key as keyof typeof filtered];
          }
          localStorage.setItem(DRAFT_KEY, JSON.stringify({
            values: filtered,
            step,
            completedSteps,
            otherLender,
            otherRepoLocation,
            savedAt: Date.now(),
          }));
        } catch { /* quota exceeded — ignore */ }
      }, 1000);
    });
    return () => subscription.unsubscribe();
  }, [watch, step, completedSteps, otherLender, otherRepoLocation]);

  function discardDraft() {
    localStorage.removeItem(DRAFT_KEY);
    reset();
    setStep(0);
    setCompletedSteps([]);
    setOtherLender('');
    setOtherRepoLocation('');
    setDraftRestored(false);
    setDraftSavedAt(null);
  }

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
      const valid = await trigger(fields);
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
        body: JSON.stringify({ ...data, ...utmRef.current }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || t('errors.submitError'));
      }

      localStorage.removeItem(DRAFT_KEY);

      const params = new URLSearchParams({
        tier: result.tier,
        id: result.id,
      });
      router.push(`/claim/confirmation?${params.toString()}`);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : t('errors.generic'));
    } finally {
      setSubmitting(false);
    }
  }

  const isLastStep = step === TOTAL_STEPS - 1;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {draftRestored && (
        <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-sm text-blue-800">
          <span>
            {draftSavedAt ? t('draft.restoredWithDate', { date: new Date(draftSavedAt).toLocaleString() }) : t('draft.restored')}
          </span>
          <button
            type="button"
            onClick={discardDraft}
            className="flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium ml-4 flex-shrink-0"
          >
            <X className="h-3.5 w-3.5" />
            {t('draft.discard')}
          </button>
        </div>
      )}

      <ProgressIndicator
        currentSection={step}
        completedSections={completedSteps}
        onSectionClick={goToStep}
      />

      {/* Step 0: Contact Information */}
      {step === 0 && (
        <FormSection title={t('sections.contactInfo.title')} description={t('sections.contactInfo.description')}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label={t('labels.firstName')}
              required
              id="first_name"
              error={errors.first_name?.message}
              {...register('first_name')}
            />
            <Input
              label={t('labels.lastName')}
              required
              id="last_name"
              error={errors.last_name?.message}
              {...register('last_name')}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label={t('labels.email')}
              type="email"
              required
              id="email"
              error={errors.email?.message}
              {...register('email')}
            />
            <Input
              label={t('labels.phone')}
              type="tel"
              required
              id="phone"
              placeholder={t('placeholders.phone')}
              error={errors.phone?.message}
              {...register('phone')}
            />
          </div>
          <Controller
            control={control}
            name="preferred_contact"
            render={({ field }) => (
              <RadioGroup
                label={t('labels.preferredContact')}
                name="preferred_contact"
                required
                options={[
                  { value: 'phone', label: t('options.contactMethods.phone') },
                  { value: 'email', label: t('options.contactMethods.email') },
                  { value: 'text', label: t('options.contactMethods.text') },
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
                label={t('labels.bestTime')}
                id="best_time_to_contact"
                placeholder={t('placeholders.selectTime')}
                options={[
                  { value: 'morning', label: t('options.times.morning') },
                  { value: 'afternoon', label: t('options.times.afternoon') },
                  { value: 'evening', label: t('options.times.evening') },
                  { value: 'anytime', label: t('options.times.anytime') },
                ]}
                value={field.value || ''}
                onChange={(e) => field.onChange(e.target.value || undefined)}
              />
            )}
          />
          <Input
            label={t('labels.streetAddress')}
            required
            id="street_address"
            error={errors.street_address?.message}
            {...register('street_address')}
          />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label={t('labels.city')}
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
                  label={t('labels.state')}
                  required
                  id="state"
                  placeholder={t('placeholders.selectState')}
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
              label={t('labels.zipCode')}
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
        <FormSection title={t('sections.vehicleInfo.title')} description={t('sections.vehicleInfo.description')}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Controller
              control={control}
              name="vehicle_year"
              render={({ field }) => (
                <Select
                  label={t('labels.vehicleYear')}
                  required
                  id="vehicle_year"
                  placeholder={t('placeholders.selectYear')}
                  options={YEAR_OPTIONS}
                  value={field.value ? String(field.value) : ''}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                  error={errors.vehicle_year?.message}
                />
              )}
            />
            <Input
              label={t('labels.vehicleMake')}
              required
              id="vehicle_make"
              placeholder={t('placeholders.vehicleMake')}
              error={errors.vehicle_make?.message}
              {...register('vehicle_make')}
            />
            <Input
              label={t('labels.vehicleModel')}
              required
              id="vehicle_model"
              placeholder={t('placeholders.vehicleModel')}
              error={errors.vehicle_model?.message}
              {...register('vehicle_model')}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label={t('labels.vehicleColor')}
              id="vehicle_color"
              {...register('vehicle_color')}
            />
            <Input
              label={t('labels.vin')}
              id="vin"
              maxLength={17}
              helperText={t('helpers.vin')}
              error={errors.vin?.message}
              {...register('vin')}
            />
          </div>
          <Controller
            control={control}
            name="lease_or_finance"
            render={({ field }) => (
              <RadioGroup
                label={t('questions.leaseOrFinance')}
                name="lease_or_finance"
                required
                options={[
                  { value: 'financed', label: t('options.leaseOrFinance.financed') },
                  { value: 'leased', label: t('options.leaseOrFinance.leased') },
                  { value: 'not_sure', label: t('options.leaseOrFinance.notSure') },
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
        <FormSection title={t('sections.lenderInfo.title')} description={t('sections.lenderInfo.description')}>
          <Controller
            control={control}
            name="lender_name"
            render={({ field }) => (
              <div>
                <Select
                  label={t('labels.lenderName')}
                  required
                  id="lender_name"
                  placeholder={t('placeholders.selectLender')}
                  options={LENDER_OPTIONS}
                  value={field.value || ''}
                  onChange={(e) => field.onChange(e.target.value)}
                  error={errors.lender_name?.message}
                />
                {watchLender === 'other' && (
                  <Input
                    className="mt-2"
                    placeholder={t('placeholders.enterLender')}
                    value={otherLender}
                    onChange={(e) => setOtherLender(e.target.value)}
                  />
                )}
              </div>
            )}
          />
          <Input
            label={t('labels.repoCompanyName')}
            id="repo_company_name"
            {...register('repo_company_name')}
          />
          <Controller
            control={control}
            name="behind_on_payments"
            render={({ field }) => (
              <RadioGroup
                label={t('questions.behindOnPayments')}
                name="behind_on_payments"
                required
                options={[
                  { value: 'yes', label: tc('yes') },
                  { value: 'no', label: tc('no') },
                  { value: 'not_sure', label: tc('notSure') },
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
                  label={t('questions.paymentsBehind')}
                  id="payments_behind"
                  placeholder={t('placeholders.select')}
                  options={[
                    { value: '1', label: '1' },
                    { value: '2', label: '2' },
                    { value: '3', label: '3' },
                    { value: '4', label: '4' },
                    { value: '5', label: t('options.paymentsBehind.5plus') },
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
                label={t('questions.contactedLender')}
                name="contacted_lender"
                options={[
                  { value: 'true', label: tc('yes') },
                  { value: 'false', label: tc('no') },
                ]}
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />
          <Controller
            control={control}
            name="received_written_notice"
            render={({ field }) => (
              <RadioGroup
                label={t('questions.receivedWrittenNotice')}
                name="received_written_notice"
                required
                options={[
                  { value: 'yes', label: tc('yes') },
                  { value: 'no', label: tc('no') },
                  { value: 'not_sure', label: tc('notSure') },
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
        <FormSection title={t('sections.repoDetails.title')} description={t('sections.repoDetails.description')}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label={t('labels.repoDate')}
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
                  label={t('labels.repoTimeOfDay')}
                  required
                  id="repo_time_of_day"
                  placeholder={t('placeholders.select')}
                  options={[
                    { value: 'early_morning', label: t('options.repoTimes.earlyMorning') },
                    { value: 'morning', label: t('options.repoTimes.morning') },
                    { value: 'afternoon', label: t('options.repoTimes.afternoon') },
                    { value: 'evening', label: t('options.repoTimes.evening') },
                    { value: 'not_sure', label: t('options.repoTimes.notSure') },
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
              {t('questions.repoLocation')} <span className="text-red-500">*</span>
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
                  placeholder={t('placeholders.describeLocation')}
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
                label={t('labels.repoState')}
                required
                id="repo_state"
                placeholder={t('placeholders.selectState')}
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
          title={t('sections.breachOfPeace.title')}
          description={t('sections.breachOfPeace.description')}
        >
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
            <AlertCircle className="inline h-4 w-4 mr-1 -mt-0.5" />
            {t('breachAlert')}
          </div>

          <Controller
            control={control}
            name="verbally_objected"
            render={({ field }) => (
              <RadioGroup
                label={t('questions.verballyObjected')}
                name="verbally_objected"
                required
                options={[
                  { value: 'yes', label: tc('yes') },
                  { value: 'no', label: tc('no') },
                  { value: 'not_sure', label: tc('notSure') },
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
                  label={t('questions.continuedAfterObjection')}
                  name="continued_after_objection"
                  required
                  options={[
                    { value: 'yes', label: tc('yes') },
                    { value: 'no', label: tc('no') },
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
                label={t('questions.physicalForce')}
                name="physical_force"
                required
                options={[
                  { value: 'true', label: tc('yes') },
                  { value: 'false', label: tc('no') },
                ]}
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />

          <Controller
            control={control}
            name="excessive_noise"
            render={({ field }) => (
              <RadioGroup
                label={t('questions.excessiveNoise')}
                name="excessive_noise"
                required
                options={[
                  { value: 'true', label: tc('yes') },
                  { value: 'false', label: tc('no') },
                ]}
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />

          <Controller
            control={control}
            name="entered_locked_area"
            render={({ field }) => (
              <RadioGroup
                label={t('questions.enteredLockedArea')}
                name="entered_locked_area"
                required
                options={[
                  { value: 'true', label: tc('yes') },
                  { value: 'false', label: tc('no') },
                ]}
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />

          <Controller
            control={control}
            name="property_damage"
            render={({ field }) => (
              <RadioGroup
                label={t('questions.propertyDamage')}
                name="property_damage"
                required
                options={[
                  { value: 'true', label: tc('yes') },
                  { value: 'false', label: tc('no') },
                ]}
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />

          <Controller
            control={control}
            name="police_present"
            render={({ field }) => (
              <RadioGroup
                label={t('questions.policePresent')}
                name="police_present"
                required
                options={[
                  { value: 'true', label: tc('yes') },
                  { value: 'false', label: tc('no') },
                ]}
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />

          {watchPolicePresent === 'true' && (
            <Controller
              control={control}
              name="police_assisted"
              render={({ field }) => (
                <RadioGroup
                  label={t('questions.policeAssisted')}
                  name="police_assisted"
                  options={[
                    { value: 'yes', label: tc('yes') },
                    { value: 'no', label: tc('no') },
                    { value: 'not_sure', label: tc('notSure') },
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
                label={t('questions.repoAtWorkplace')}
                name="repo_at_workplace"
                required
                options={[
                  { value: 'true', label: tc('yes') },
                  { value: 'false', label: tc('no') },
                ]}
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />

          <Controller
            control={control}
            name="public_embarrassment"
            render={({ field }) => (
              <RadioGroup
                label={t('questions.publicEmbarrassment')}
                name="public_embarrassment"
                required
                options={[
                  { value: 'true', label: tc('yes') },
                  { value: 'false', label: tc('no') },
                ]}
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />

          <Textarea
            label={t('questions.narrative')}
            required
            id="narrative"
            placeholder={t('placeholders.narrative')}
            error={errors.narrative?.message}
            className="min-h-[150px]"
            {...register('narrative')}
          />
        </FormSection>
      )}

      {/* Step 5: Personal Belongings */}
      {step === 5 && (
        <FormSection title={t('sections.belongings.title')} description={t('sections.belongings.description')}>
          <Controller
            control={control}
            name="had_belongings"
            render={({ field }) => (
              <RadioGroup
                label={t('questions.hadBelongings')}
                name="had_belongings"
                required
                options={[
                  { value: 'true', label: tc('yes') },
                  { value: 'false', label: tc('no') },
                ]}
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />

          {watchHadBelongings === 'true' && (
            <>
              <Controller
                control={control}
                name="belongings_returned"
                render={({ field }) => (
                  <RadioGroup
                    label={t('questions.belongingsReturned')}
                    name="belongings_returned"
                    required
                    options={[
                      { value: 'yes', label: t('options.belongingsReturned.yes') },
                      { value: 'no', label: t('options.belongingsReturned.no') },
                      { value: 'some', label: t('options.belongingsReturned.some') },
                    ]}
                    value={field.value}
                    onChange={field.onChange}
                  />
                )}
              />

              {(watchBelongingsReturned === 'no' || watchBelongingsReturned === 'some') && (
                <>
                  <Textarea
                    label={t('labels.belongingsList')}
                    id="belongings_list"
                    placeholder={t('placeholders.belongingsList')}
                    {...register('belongings_list')}
                  />
                  <Input
                    label={t('labels.belongingsValue')}
                    type="number"
                    id="belongings_value"
                    placeholder={t('placeholders.dollarSign')}
                    {...register('belongings_value')}
                  />
                </>
              )}

              <Controller
                control={control}
                name="charged_fee_for_belongings"
                render={({ field }) => (
                  <RadioGroup
                    label={t('questions.chargedFee')}
                    name="charged_fee"
                    options={[
                      { value: 'true', label: tc('yes') },
                      { value: 'false', label: tc('no') },
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
        <FormSection title={t('sections.postRepo.title')} description={t('sections.postRepo.description')}>
          <Controller
            control={control}
            name="received_notice_of_sale"
            render={({ field }) => (
              <RadioGroup
                label={t('questions.receivedNoticeOfSale')}
                name="received_notice_of_sale"
                required
                options={[
                  { value: 'yes', label: tc('yes') },
                  { value: 'no', label: tc('no') },
                  { value: 'not_sure', label: tc('notSure') },
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
                label={t('questions.deficiencyBalance')}
                name="deficiency_balance_contact"
                required
                options={[
                  { value: 'yes', label: tc('yes') },
                  { value: 'no', label: tc('no') },
                  { value: 'not_sure', label: tc('notSure') },
                ]}
                value={field.value}
                onChange={field.onChange}
                error={errors.deficiency_balance_contact?.message}
              />
            )}
          />
          <div>
            <p className="block text-sm font-medium text-gray-700 mb-2">
              {t('questions.impactsLabel')}
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
                label={t('questions.creditReport')}
                name="credit_report_affected"
                options={[
                  { value: 'yes', label: tc('yes') },
                  { value: 'no', label: tc('no') },
                  { value: 'not_sure', label: tc('notSure') },
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
        <FormSection title={t('sections.military.title')} description={t('sections.military.description')}>
          <Controller
            control={control}
            name="military_service"
            render={({ field }) => (
              <RadioGroup
                label={t('questions.militaryService')}
                name="military_service"
                required
                options={[
                  { value: 'true', label: tc('yes') },
                  { value: 'false', label: tc('no') },
                ]}
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />
          {watchMilitaryService === 'true' && (
            <>
              <Controller
                control={control}
                name="military_branch"
                render={({ field }) => (
                  <Select
                    label={t('labels.militaryBranch')}
                    id="military_branch"
                    placeholder={t('placeholders.selectBranch')}
                    options={[
                      { value: 'army', label: t('options.militaryBranches.army') },
                      { value: 'navy', label: t('options.militaryBranches.navy') },
                      { value: 'air_force', label: t('options.militaryBranches.airForce') },
                      { value: 'marines', label: t('options.militaryBranches.marines') },
                      { value: 'coast_guard', label: t('options.militaryBranches.coastGuard') },
                      { value: 'space_force', label: t('options.militaryBranches.spaceForce') },
                      { value: 'national_guard', label: t('options.militaryBranches.nationalGuard') },
                      { value: 'reserves', label: t('options.militaryBranches.reserves') },
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
                    label={t('questions.activeDuty')}
                    name="active_duty"
                    options={[
                      { value: 'true', label: tc('yes') },
                      { value: 'false', label: tc('no') },
                    ]}
                    value={field.value === undefined ? undefined : String(field.value)}
                    onChange={(v) => field.onChange(v === 'true')}
                  />
                )}
              />
              {watchActiveDuty === 'true' && (
                <Controller
                  control={control}
                  name="loan_before_active_duty"
                  render={({ field }) => (
                    <RadioGroup
                      label={t('questions.loanBeforeActiveDuty')}
                      name="loan_before_active"
                      options={[
                        { value: 'yes', label: tc('yes') },
                        { value: 'no', label: tc('no') },
                        { value: 'not_sure', label: tc('notSure') },
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
        <FormSection title={t('sections.debtCollection.title')} description={t('sections.debtCollection.description')}>
          <Controller
            control={control}
            name="debt_collector_contact"
            render={({ field }) => (
              <RadioGroup
                label={t('questions.debtCollectorContact')}
                name="debt_collector_contact"
                required
                options={[
                  { value: 'true', label: tc('yes') },
                  { value: 'false', label: tc('no') },
                ]}
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />
          {watchDebtCollector === 'true' && (
            <div>
              <p className="block text-sm font-medium text-gray-700 mb-2">
                {t('questions.fdcpaLabel')}
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
        <FormSection title={t('sections.evidence.title')} description={t('sections.evidence.description')}>
          <Controller
            control={control}
            name="has_photos_videos"
            render={({ field }) => (
              <RadioGroup
                label={t('questions.hasPhotosVideos')}
                name="has_photos_videos"
                options={[
                  { value: 'true', label: tc('yes') },
                  { value: 'false', label: tc('no') },
                ]}
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />
          <Controller
            control={control}
            name="has_documents"
            render={({ field }) => (
              <RadioGroup
                label={t('questions.hasDocuments')}
                name="has_documents"
                options={[
                  { value: 'true', label: tc('yes') },
                  { value: 'false', label: tc('no') },
                ]}
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />
          <Controller
            control={control}
            name="has_witnesses"
            render={({ field }) => (
              <RadioGroup
                label={t('questions.hasWitnesses')}
                name="has_witnesses"
                options={[
                  { value: 'true', label: tc('yes') },
                  { value: 'false', label: tc('no') },
                ]}
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />
          {watchHasWitnesses === 'true' && (
            <Textarea
              label={t('labels.witnessInfo')}
              id="witness_info"
              placeholder={t('placeholders.witnessInfo')}
              {...register('witness_info')}
            />
          )}
          <p className="text-sm text-gray-500">
            {t('uploadNote')}
          </p>
        </FormSection>
      )}

      {/* Step 10: Consent & Submission */}
      {step === 10 && (
        <FormSection title={t('sections.consent.title')} description={t('sections.consent.description')}>
          <Input
            label={t('labels.electronicSignature')}
            required
            id="electronic_signature"
            placeholder={t('placeholders.signature')}
            error={errors.electronic_signature?.message}
            {...register('electronic_signature')}
          />
          <Input
            label={t('labels.date')}
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
                  label={t('consent.accurateInfo')}
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
                  label={t('consent.notLegalAdvice')}
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
                  label={t('consent.contact')}
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
              {t.rich('consent.privacyConsent', {
                privacyLink: (chunks) => (
                  <Link href="/privacy" target="_blank" className="text-[#3474BA] dark:text-blue-300 underline">{chunks}</Link>
                ),
                termsLink: (chunks) => (
                  <Link href="/terms" target="_blank" className="text-[#3474BA] dark:text-blue-300 underline">{chunks}</Link>
                ),
              })}
            </label>
          </div>

          {submitError && (
            <div role="alert" className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
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
            {t('buttons.back')}
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
            {t('buttons.submitFull')}
          </Button>
        ) : (
          <Button
            type="button"
            variant="primary"
            size="lg"
            onClick={goNext}
            className="flex-1 max-w-sm"
          >
            {t('buttons.continue')}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>

      {isLastStep && (
        <p className="text-xs text-gray-400 text-center">
          {t('submitDisclaimer')}
        </p>
      )}
    </form>
  );
}
