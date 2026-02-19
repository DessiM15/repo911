'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { CheckCircle, AlertTriangle, XCircle, Info, Mail, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

function VerifyContent() {
  const searchParams = useSearchParams();
  const t = useTranslations('verify');
  const status = searchParams.get('status');
  const leadId = searchParams.get('lead_id') || searchParams.get('id');

  const [email, setEmail] = useState('');
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState('');

  async function handleResend() {
    if (!leadId || !email.trim()) return;
    setResending(true);
    setResendMessage('');
    try {
      const res = await fetch('/api/leads/verify/resend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lead_id: leadId, email: email.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setResendMessage(data.message || t('resendSuccess'));
      } else {
        setResendMessage(data.error || t('resendError'));
      }
    } catch {
      setResendMessage(t('resendError'));
    } finally {
      setResending(false);
    }
  }

  if (status === 'success') {
    return (
      <div className="text-center">
        <CheckCircle className="h-16 w-16 mx-auto mb-4 text-green-500" />
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-3">{t('successTitle')}</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">{t('successDescription')}</p>
        {leadId && (
          <Link href={`/track?id=${leadId}`}>
            <Button variant="consumer">{t('trackCase')}</Button>
          </Link>
        )}
      </div>
    );
  }

  if (status === 'already_verified') {
    return (
      <div className="text-center">
        <Info className="h-16 w-16 mx-auto mb-4 text-blue-500" />
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-3">{t('alreadyVerifiedTitle')}</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">{t('alreadyVerifiedDescription')}</p>
        <Link href="/track">
          <Button variant="consumer">{t('trackCase')}</Button>
        </Link>
      </div>
    );
  }

  if (status === 'expired') {
    return (
      <div className="text-center">
        <AlertTriangle className="h-16 w-16 mx-auto mb-4 text-amber-500" />
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-3">{t('expiredTitle')}</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">{t('expiredDescription')}</p>
        {leadId && (
          <div className="max-w-sm mx-auto space-y-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('emailPlaceholder')}
              className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#3474BA] dark:bg-slate-900 dark:text-gray-100"
            />
            <Button
              variant="consumer"
              className="w-full"
              onClick={handleResend}
              disabled={resending || !email.trim()}
            >
              {resending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-4 w-4" />}
              {t('resendButton')}
            </Button>
            {resendMessage && (
              <p className="text-sm text-gray-600 dark:text-gray-400">{resendMessage}</p>
            )}
          </div>
        )}
      </div>
    );
  }

  if (status === 'invalid') {
    return (
      <div className="text-center">
        <XCircle className="h-16 w-16 mx-auto mb-4 text-red-500" />
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-3">{t('invalidTitle')}</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">{t('invalidDescription')}</p>
        <Link href="/">
          <Button variant="consumer">{t('returnHome')}</Button>
        </Link>
      </div>
    );
  }

  // No status — informational "Check Your Email" page
  return (
    <div className="text-center">
      <Mail className="h-16 w-16 mx-auto mb-4 text-[#3474BA] dark:text-blue-400" />
      <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-3">{t('checkEmailTitle')}</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-8">{t('checkEmailDescription')}</p>
      <Link href="/track">
        <Button variant="outline">{t('trackCase')}</Button>
      </Link>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
      <Suspense>
        <VerifyContent />
      </Suspense>
    </div>
  );
}
