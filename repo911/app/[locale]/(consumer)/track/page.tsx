'use client';

import { useState, useRef, useCallback, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Search, Clock, CheckCircle, Shield, FileText, Upload, X, AlertTriangle, Loader2, Phone } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { MessageThread } from '@/components/consumer/MessageThread';
import { formatDistanceToNow } from 'date-fns';

interface TrackResult {
  id: string;
  status: string;
  statusLabel: string;
  tier: string;
  submittedAt: string;
  claimed: boolean;
  uploadedFiles: { name: string; url: string; uploadedAt: string }[];
}

function getStatusIcon(status: string) {
  if (status === 'claimed' || status === 'contacted' || status === 'retained') {
    return <CheckCircle className="h-5 w-5 text-green-500" />;
  }
  if (status === 'disqualified' || status === 'closed') {
    return <AlertTriangle className="h-5 w-5 text-gray-400" />;
  }
  return <Clock className="h-5 w-5 text-[#3474BA]" />;
}

function getTierBadge(tier: string) {
  const colors: Record<string, string> = {
    hot: 'bg-green-100 text-green-700',
    warm: 'bg-blue-100 text-blue-700',
    cold: 'bg-gray-100 text-gray-700',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[tier] || 'bg-gray-100 text-gray-600'}`}>
      {tier === 'hot' ? 'High Priority' : tier === 'warm' ? 'Under Review' : 'Pending Review'}
    </span>
  );
}

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'application/pdf'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_FILES = 5;

function SearchParamReader({ onId }: { onId: (id: string) => void }) {
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  useEffect(() => {
    if (id) onId(id);
  }, [id, onId]);
  return null;
}

export default function TrackPage() {
  const [lookupMode, setLookupMode] = useState<'case_id' | 'phone'>('case_id');
  const [email, setEmail] = useState('');
  const [leadId, setLeadId] = useState('');
  const [phone, setPhone] = useState('');
  const [lastName, setLastName] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TrackResult | null>(null);
  const [error, setError] = useState('');

  // Upload state
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleTrack(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);
    setFiles([]);

    try {
      const payload = lookupMode === 'case_id'
        ? { mode: 'case_id' as const, email: email.trim(), leadId: leadId.trim() }
        : { mode: 'phone' as const, phone: phone.trim(), lastName: lastName.trim() };

      const res = await fetch('/api/leads/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Something went wrong. Please try again.');
        return;
      }

      setResult(data);
    } catch {
      setError('Unable to connect. Please check your internet and try again.');
    } finally {
      setLoading(false);
    }
  }

  const handleFileSelect = useCallback((selectedFiles: FileList | null) => {
    if (!selectedFiles) return;

    const existingCount = result?.uploadedFiles?.length || 0;
    const newFiles = Array.from(selectedFiles);

    if (files.length + newFiles.length + existingCount > MAX_FILES) {
      toast.error(`You can upload a maximum of ${MAX_FILES} files total. You already have ${existingCount} uploaded.`);
      return;
    }

    for (const file of newFiles) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        toast.error(`"${file.name}" is not a supported file type. Please upload images (JPG, PNG, WebP) or PDFs.`);
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`"${file.name}" exceeds the 10MB limit.`);
        return;
      }
    }

    setFiles(prev => [...prev, ...newFiles]);
  }, [files.length, result?.uploadedFiles?.length]);

  function removeFile(index: number) {
    setFiles(prev => prev.filter((_, i) => i !== index));
  }

  async function handleUpload() {
    if (files.length === 0) return;
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('email', email.trim());
      formData.append('leadId', leadId.trim());
      files.forEach(file => formData.append('files', file));

      const res = await fetch('/api/leads/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Upload failed. Please try again.');
        return;
      }

      toast.success(`${files.length} file(s) uploaded successfully.`);
      setFiles([]);

      // Refresh the result to show new uploads
      const trackRes = await fetch('/api/leads/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), leadId: leadId.trim() }),
      });
      if (trackRes.ok) {
        setResult(await trackRes.json());
      }
    } catch {
      toast.error('Upload failed. Please check your connection and try again.');
    } finally {
      setUploading(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  }

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
      <Suspense>
        <SearchParamReader onId={setLeadId} />
      </Suspense>
      <div className="text-center mb-8">
        <Search className="h-12 w-12 mx-auto mb-4 text-[#3474BA]" />
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-gray-100">Track Your Case</h1>
        <p className="mt-3 text-gray-600 dark:text-gray-400">
          Look up your case status using your case ID or phone number.
        </p>
      </div>

      <form onSubmit={handleTrack} className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6 shadow-sm space-y-4">
        {/* Lookup mode toggle */}
        <div className="flex rounded-lg border border-gray-200 dark:border-slate-700 overflow-hidden">
          <button
            type="button"
            onClick={() => { setLookupMode('case_id'); setError(''); setResult(null); }}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors ${
              lookupMode === 'case_id'
                ? 'bg-[#3474BA] text-white'
                : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700'
            }`}
          >
            <Search className="h-4 w-4" />
            By Case ID
          </button>
          <button
            type="button"
            onClick={() => { setLookupMode('phone'); setError(''); setResult(null); }}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors ${
              lookupMode === 'phone'
                ? 'bg-[#3474BA] text-white'
                : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700'
            }`}
          >
            <Phone className="h-4 w-4" />
            By Phone & Last Name
          </button>
        </div>

        {lookupMode === 'case_id' ? (
          <>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#3474BA] dark:bg-slate-900 dark:text-gray-100"
              />
            </div>

            <div>
              <label htmlFor="leadId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Case ID
              </label>
              <input
                id="leadId"
                type="text"
                required
                value={leadId}
                onChange={(e) => setLeadId(e.target.value)}
                placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#3474BA] dark:bg-slate-900 dark:text-gray-100"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">You received this in your confirmation email.</p>
            </div>
          </>
        ) : (
          <>
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Phone Number
              </label>
              <input
                id="phone"
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(555) 555-5555"
                className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#3474BA] dark:bg-slate-900 dark:text-gray-100"
              />
            </div>

            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Last Name
              </label>
              <input
                id="lastName"
                type="text"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Enter your last name"
                className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#3474BA] dark:bg-slate-900 dark:text-gray-100"
              />
            </div>
          </>
        )}

        {error && (
          <div className="bg-red-50 dark:bg-red-950 border border-red-200 text-red-700 dark:text-red-300 rounded-lg p-3 text-sm">
            {error}
          </div>
        )}

        <Button type="submit" variant="consumer" className="w-full" loading={loading}>
          <Search className="mr-2 h-4 w-4" />
          Look Up My Case
        </Button>
      </form>

      {result && (
        <div className="mt-8 space-y-6">
          {/* Status Card */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
              <Shield className="h-5 w-5 text-[#3474BA]" />
              Case Status
            </h2>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">Status</span>
                <div className="flex items-center gap-2">
                  {getStatusIcon(result.status)}
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{result.statusLabel}</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">Priority</span>
                {getTierBadge(result.tier)}
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">Submitted</span>
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {formatDistanceToNow(new Date(result.submittedAt), { addSuffix: true })}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">Attorney Assigned</span>
                <span className="text-sm text-gray-700 dark:text-gray-300">{result.claimed ? 'Yes' : 'Not yet'}</span>
              </div>
            </div>

            {result.claimed && (
              <div className="mt-4 p-3 bg-green-50 dark:bg-green-950 border border-green-200 rounded-lg text-sm text-green-700 dark:text-green-300">
                An attorney has claimed your case. They will reach out to you using the contact information you provided.
              </div>
            )}

            {!result.claimed && result.tier !== 'disqualified' && (
              <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg text-sm text-blue-700 dark:text-blue-300">
                Your case is available for attorney review. You will be contacted when an attorney claims your case.
              </div>
            )}
          </div>

          {/* Messages Section — only shown when case is claimed and lookup by case_id */}
          {lookupMode === 'case_id' && result.claimed && (
            <MessageThread email={email} leadId={leadId} />
          )}

          {/* File Upload Section — only shown for case_id lookup (upload API requires email+leadId) */}
          {lookupMode === 'case_id' && <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1 flex items-center gap-2">
              <FileText className="h-5 w-5 text-[#3474BA]" />
              Evidence & Documents
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Upload photos, videos, or documents related to your case. Max 5 files, 10MB each.
            </p>

            {/* Existing uploads */}
            {result.uploadedFiles && result.uploadedFiles.length > 0 && (
              <div className="mb-4">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Previously Uploaded</h3>
                <ul className="space-y-2">
                  {result.uploadedFiles.map((file, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-slate-900 rounded-lg px-3 py-2">
                      <FileText className="h-4 w-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                      <span className="truncate">{file.name}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Drop zone */}
            {(result.uploadedFiles?.length || 0) < MAX_FILES && (
              <>
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                    dragOver ? 'border-[#3474BA] bg-blue-50 dark:bg-blue-950' : 'border-gray-300 dark:border-slate-600 hover:border-gray-400'
                  }`}
                >
                  <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400 dark:text-gray-500" />
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Drag and drop files here, or <span className="text-[#3474BA] font-medium">browse</span>
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">JPG, PNG, WebP, or PDF up to 10MB</p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".jpg,.jpeg,.png,.webp,.heic,.pdf"
                  onChange={(e) => handleFileSelect(e.target.files)}
                  className="hidden"
                />
              </>
            )}

            {/* Selected files */}
            {files.length > 0 && (
              <div className="mt-4 space-y-2">
                {files.map((file, i) => (
                  <div key={i} className="flex items-center justify-between bg-gray-50 dark:bg-slate-900 rounded-lg px-3 py-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="h-4 w-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                      <span className="text-sm text-gray-700 dark:text-gray-300 truncate">{file.name}</span>
                      <span className="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0">
                        {(file.size / 1024 / 1024).toFixed(1)}MB
                      </span>
                    </div>
                    <button onClick={() => removeFile(i)} className="p-1 hover:bg-gray-200 rounded">
                      <X className="h-4 w-4 text-gray-400" />
                    </button>
                  </div>
                ))}

                <Button onClick={handleUpload} variant="primary" className="w-full mt-3" disabled={uploading}>
                  {uploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Upload {files.length} File{files.length > 1 ? 's' : ''}
                    </>
                  )}
                </Button>
              </div>
            )}

          </div>}
        </div>
      )}

      <div className="mt-8 text-center">
        <Link href="/" className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">
          Return to Homepage
        </Link>
      </div>
    </div>
  );
}
