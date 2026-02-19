'use client';

import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { Link, useRouter } from '@/i18n/navigation';
import {
  ArrowLeft,
  Shield,
  Clock,
  CheckCircle,
  AlertTriangle,
  Copy,
  Check,
  Car,
  Upload,
  FileText,
  X,
  Loader2,
  Mic,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MessageThread } from '@/components/consumer/MessageThread';
import { StoryRecorderCTA } from '@/components/consumer/StoryRecorderCTA';
import { createClient } from '@/lib/supabase/client';
import { formatDistanceToNow, format } from 'date-fns';
import { toast } from 'sonner';
import { use } from 'react';

interface TimelineEntry {
  status: string;
  date: string;
  note?: string;
}

interface CaseDetail {
  id: string;
  status: string;
  statusLabel: string;
  tier: string;
  submittedAt: string;
  claimed: boolean;
  vehicleYear: string;
  vehicleMake: string;
  vehicleModel: string;
  repoDate: string | null;
  repoState: string;
  lenderName: string;
  firstName: string;
  lastName: string;
  email: string;
  hasStory: boolean;
  uploadedFiles: { name: string; path: string; uploadedAt: string }[];
  feeTracking: {
    caseStatus: string;
    settlementAmount: number | null;
    statusUpdatedAt: string | null;
  } | null;
  timeline: TimelineEntry[];
}

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'application/pdf'];
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_FILES = 5;

const timelineStatusLabels: Record<string, string> = {
  submitted: 'Case Submitted',
  open: 'Case Open',
  in_progress: 'In Progress',
  settled: 'Settled',
  dismissed: 'Dismissed',
  closed: 'Closed',
  paid: 'Paid',
};

function getStatusIcon(status: string) {
  if (status === 'claimed' || status === 'contacted' || status === 'retained') {
    return <CheckCircle className="h-5 w-5 text-green-500" />;
  }
  if (status === 'disqualified' || status === 'closed') {
    return <AlertTriangle className="h-5 w-5 text-gray-400" />;
  }
  return <Clock className="h-5 w-5 text-[#3474BA] dark:text-blue-400" />;
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
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[tier] || 'bg-gray-100 text-gray-600'}`}
    >
      {labels[tier] || 'Pending'}
    </span>
  );
}

function CaseDetailContent({ params }: { params: Promise<{ id: string }> }) {
  const { id: caseId } = use(params);
  const router = useRouter();
  const [caseData, setCaseData] = useState<CaseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState('');
  const [copied, setCopied] = useState(false);

  // Upload state
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function fetchCase() {
      try {
        const res = await fetch(`/api/consumer/cases/${caseId}`);
        if (res.status === 401) {
          router.replace('/portal/login');
          return;
        }
        if (res.ok) {
          const data = await res.json();
          setCaseData(data.case);
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

    fetchCase();
    getUser();
  }, [caseId, router]);

  function handleCopyId() {
    if (!caseData) return;
    navigator.clipboard.writeText(caseData.id);
    toast.success('Copied!');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const handleFileSelect = useCallback(
    (selectedFiles: FileList | null) => {
      if (!selectedFiles || !caseData) return;

      const existingCount = caseData.uploadedFiles?.length || 0;
      const newFiles = Array.from(selectedFiles);

      if (files.length + newFiles.length + existingCount > MAX_FILES) {
        toast.error(`Maximum ${MAX_FILES} files allowed. You already have ${existingCount} uploaded.`);
        return;
      }

      for (const file of newFiles) {
        if (!ALLOWED_TYPES.includes(file.type)) {
          toast.error(`"${file.name}" has an unsupported type.`);
          return;
        }
        if (file.size > MAX_FILE_SIZE) {
          toast.error(`"${file.name}" exceeds the 10MB size limit.`);
          return;
        }
      }

      setFiles((prev) => [...prev, ...newFiles]);
    },
    [files.length, caseData]
  );

  function removeFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleUpload() {
    if (files.length === 0 || !caseData) return;
    setUploading(true);

    try {
      const formData = new FormData();
      files.forEach((file) => formData.append('files', file));

      const res = await fetch(`/api/consumer/cases/${caseData.id}/upload`, {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Upload failed');
        return;
      }

      toast.success(`${files.length} file(s) uploaded successfully`);
      setFiles([]);

      // Refresh case data
      const refetchRes = await fetch(`/api/consumer/cases/${caseData.id}`);
      if (refetchRes.ok) {
        const refetchData = await refetchRes.json();
        setCaseData(refetchData.case);
      }
    } catch {
      toast.error('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-[#3474BA]" />
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 text-center">
        <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Case Not Found
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          This case could not be found or you don&apos;t have access to it.
        </p>
        <Link href="/portal/dashboard">
          <Button variant="consumer">Back to Dashboard</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-6">
      {/* Back nav */}
      <Link
        href="/portal/dashboard"
        className="inline-flex items-center text-sm text-gray-500 dark:text-gray-400 hover:text-[#3474BA] dark:hover:text-blue-300"
      >
        <ArrowLeft className="mr-1 h-4 w-4" />
        Back to Dashboard
      </Link>

      {/* Status Header Card */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
          <Shield className="h-5 w-5 text-[#3474BA] dark:text-blue-400" />
          Case Status
        </h2>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500 dark:text-gray-400">Case ID</span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-mono text-gray-900 dark:text-gray-100">
                {caseData.id}
              </span>
              <button
                onClick={handleCopyId}
                title="Copy Case ID"
                className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500 dark:text-gray-400">Status</span>
            <div className="flex items-center gap-2">
              {getStatusIcon(caseData.status)}
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {caseData.statusLabel}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500 dark:text-gray-400">Priority</span>
            {getTierBadge(caseData.tier)}
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500 dark:text-gray-400">Submitted</span>
            <span className="text-sm text-gray-700 dark:text-gray-300">
              {formatDistanceToNow(new Date(caseData.submittedAt), { addSuffix: true })}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500 dark:text-gray-400">Attorney Assigned</span>
            <span className="text-sm text-gray-700 dark:text-gray-300">
              {caseData.claimed ? 'Yes' : 'Not yet'}
            </span>
          </div>
        </div>
      </div>

      {/* Case Progress Timeline */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
          <Clock className="h-5 w-5 text-[#3474BA] dark:text-blue-400" />
          Case Progress
        </h2>

        <div className="relative">
          {caseData.timeline.map((entry, i) => (
            <div key={i} className="flex gap-4 pb-6 last:pb-0">
              {/* Timeline dot + line */}
              <div className="flex flex-col items-center">
                <div
                  className={`w-3 h-3 rounded-full flex-shrink-0 ${
                    i === caseData.timeline.length - 1
                      ? 'bg-[#3474BA] ring-4 ring-blue-100 dark:ring-blue-950'
                      : 'bg-gray-300 dark:bg-slate-600'
                  }`}
                />
                {i < caseData.timeline.length - 1 && (
                  <div className="w-0.5 flex-1 bg-gray-200 dark:bg-slate-700 mt-1" />
                )}
              </div>

              {/* Content */}
              <div className="pb-2">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {timelineStatusLabels[entry.status] || entry.status}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {format(new Date(entry.date), 'MMM d, yyyy h:mm a')}
                </p>
                {entry.note && (
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{entry.note}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Vehicle & Repo Summary */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
          <Car className="h-5 w-5 text-[#3474BA] dark:text-blue-400" />
          Vehicle &amp; Repo Details
        </h2>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="text-xs text-gray-500 dark:text-gray-400">Vehicle</span>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {caseData.vehicleYear} {caseData.vehicleMake} {caseData.vehicleModel}
            </p>
          </div>
          <div>
            <span className="text-xs text-gray-500 dark:text-gray-400">Lender</span>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {caseData.lenderName || '—'}
            </p>
          </div>
          <div>
            <span className="text-xs text-gray-500 dark:text-gray-400">Repo Date</span>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {caseData.repoDate
                ? format(new Date(caseData.repoDate), 'MMM d, yyyy')
                : '—'}
            </p>
          </div>
          <div>
            <span className="text-xs text-gray-500 dark:text-gray-400">State</span>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {caseData.repoState || '—'}
            </p>
          </div>
        </div>
      </div>

      {/* Messages (if claimed) */}
      {caseData.claimed && userEmail && (
        <MessageThread email={userEmail} leadId={caseData.id} />
      )}

      {/* Story Recorder */}
      {userEmail && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1 flex items-center gap-2">
            <Mic className="h-5 w-5 text-[#3474BA] dark:text-blue-400" />
            Tell Your Story
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Record a voice memo describing what happened during your repossession.
          </p>
          {caseData.hasStory && (
            <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400 mb-3">
              <CheckCircle className="h-4 w-4" />
              <span>Story recorded</span>
            </div>
          )}
          <StoryRecorderCTA
            email={userEmail}
            leadId={caseData.id}
            hasExistingStory={caseData.hasStory}
            onComplete={() => {
              setCaseData((prev) => (prev ? { ...prev, hasStory: true } : prev));
            }}
          />
        </div>
      )}

      {/* Evidence Upload */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1 flex items-center gap-2">
          <FileText className="h-5 w-5 text-[#3474BA] dark:text-blue-400" />
          Evidence &amp; Documents
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Upload photos, documents, or other evidence related to your case.
        </p>

        {/* Existing uploads */}
        {caseData.uploadedFiles && caseData.uploadedFiles.length > 0 && (
          <div className="mb-4">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Previously Uploaded
            </h3>
            <ul className="space-y-2">
              {caseData.uploadedFiles.map((file, i) => (
                <li
                  key={i}
                  className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-slate-900 rounded-lg px-3 py-2"
                >
                  <FileText className="h-4 w-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                  <span className="truncate">{file.name}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Drop zone */}
        {(caseData.uploadedFiles?.length || 0) < MAX_FILES && (
          <>
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                dragOver
                  ? 'border-[#3474BA] bg-blue-50 dark:bg-blue-950'
                  : 'border-gray-300 dark:border-slate-600 hover:border-gray-400'
              }`}
            >
              <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400 dark:text-gray-500" />
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Drag &amp; drop files or{' '}
                <span className="text-[#3474BA] dark:text-blue-300 font-medium">browse</span>
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                JPG, PNG, WebP, PDF — up to 10MB each
              </p>
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
              <div
                key={i}
                className="flex items-center justify-between bg-gray-50 dark:bg-slate-900 rounded-lg px-3 py-2"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <FileText className="h-4 w-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                  <span className="text-sm text-gray-700 dark:text-gray-300 truncate">
                    {file.name}
                  </span>
                  <span className="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0">
                    {(file.size / 1024 / 1024).toFixed(1)}MB
                  </span>
                </div>
                <button
                  onClick={() => removeFile(i)}
                  className="p-1 hover:bg-gray-200 dark:hover:bg-slate-700 rounded"
                >
                  <X className="h-4 w-4 text-gray-400" />
                </button>
              </div>
            ))}

            <Button
              onClick={handleUpload}
              variant="consumer"
              className="w-full mt-3"
              disabled={uploading}
            >
              {uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload {files.length} File{files.length !== 1 ? 's' : ''}
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function CaseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-[#3474BA]" />
        </div>
      }
    >
      <CaseDetailContent params={params} />
    </Suspense>
  );
}
