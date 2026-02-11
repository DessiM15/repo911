'use client';

import { useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import { Search, Clock, CheckCircle, Shield, FileText, Upload, X, AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
  return <Clock className="h-5 w-5 text-[#4A90D9]" />;
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

export default function TrackPage() {
  const [email, setEmail] = useState('');
  const [leadId, setLeadId] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TrackResult | null>(null);
  const [error, setError] = useState('');

  // Upload state
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleTrack(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);
    setFiles([]);
    setUploadError('');
    setUploadSuccess('');

    try {
      const res = await fetch('/api/leads/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), leadId: leadId.trim() }),
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
    setUploadError('');

    const existingCount = result?.uploadedFiles?.length || 0;
    const newFiles = Array.from(selectedFiles);

    if (files.length + newFiles.length + existingCount > MAX_FILES) {
      setUploadError(`You can upload a maximum of ${MAX_FILES} files total. You already have ${existingCount} uploaded.`);
      return;
    }

    for (const file of newFiles) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        setUploadError(`"${file.name}" is not a supported file type. Please upload images (JPG, PNG, WebP) or PDFs.`);
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        setUploadError(`"${file.name}" exceeds the 10MB limit.`);
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
    setUploadError('');
    setUploadSuccess('');

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
        setUploadError(data.error || 'Upload failed. Please try again.');
        return;
      }

      setUploadSuccess(`${files.length} file(s) uploaded successfully.`);
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
      setUploadError('Upload failed. Please check your connection and try again.');
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
      <div className="text-center mb-8">
        <Search className="h-12 w-12 mx-auto mb-4 text-[#4A90D9]" />
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">Track Your Case</h1>
        <p className="mt-3 text-gray-600">
          Enter the email you used to submit your case and your case ID to check your status.
        </p>
      </div>

      <form onSubmit={handleTrack} className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email Address
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4A90D9]"
          />
        </div>

        <div>
          <label htmlFor="leadId" className="block text-sm font-medium text-gray-700 mb-1">
            Case ID
          </label>
          <input
            id="leadId"
            type="text"
            required
            value={leadId}
            onChange={(e) => setLeadId(e.target.value)}
            placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#4A90D9]"
          />
          <p className="mt-1 text-xs text-gray-400">You received this in your confirmation email.</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">
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
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Shield className="h-5 w-5 text-[#4A90D9]" />
              Case Status
            </h2>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Status</span>
                <div className="flex items-center gap-2">
                  {getStatusIcon(result.status)}
                  <span className="text-sm font-medium text-gray-900">{result.statusLabel}</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Priority</span>
                {getTierBadge(result.tier)}
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Submitted</span>
                <span className="text-sm text-gray-700">
                  {formatDistanceToNow(new Date(result.submittedAt), { addSuffix: true })}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Attorney Assigned</span>
                <span className="text-sm text-gray-700">{result.claimed ? 'Yes' : 'Not yet'}</span>
              </div>
            </div>

            {result.claimed && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
                An attorney has claimed your case. They will reach out to you using the contact information you provided.
              </div>
            )}

            {!result.claimed && result.tier !== 'disqualified' && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
                Your case is available for attorney review. You will be contacted when an attorney claims your case.
              </div>
            )}
          </div>

          {/* File Upload Section */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-1 flex items-center gap-2">
              <FileText className="h-5 w-5 text-[#4A90D9]" />
              Evidence & Documents
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              Upload photos, videos, or documents related to your case. Max 5 files, 10MB each.
            </p>

            {/* Existing uploads */}
            {result.uploadedFiles && result.uploadedFiles.length > 0 && (
              <div className="mb-4">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Previously Uploaded</h3>
                <ul className="space-y-2">
                  {result.uploadedFiles.map((file, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 rounded-lg px-3 py-2">
                      <FileText className="h-4 w-4 text-gray-400 flex-shrink-0" />
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
                    dragOver ? 'border-[#4A90D9] bg-blue-50' : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm text-gray-600">
                    Drag and drop files here, or <span className="text-[#4A90D9] font-medium">browse</span>
                  </p>
                  <p className="text-xs text-gray-400 mt-1">JPG, PNG, WebP, or PDF up to 10MB</p>
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
                  <div key={i} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      <span className="text-sm text-gray-700 truncate">{file.name}</span>
                      <span className="text-xs text-gray-400 flex-shrink-0">
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

            {uploadError && (
              <div className="mt-3 bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">
                {uploadError}
              </div>
            )}

            {uploadSuccess && (
              <div className="mt-3 bg-green-50 border border-green-200 text-green-700 rounded-lg p-3 text-sm">
                {uploadSuccess}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="mt-8 text-center">
        <Link href="/" className="text-sm text-gray-500 hover:text-gray-700">
          Return to Homepage
        </Link>
      </div>
    </div>
  );
}
