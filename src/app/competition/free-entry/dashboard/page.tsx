'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Card, Button, Badge, Input, Select } from '@/components/ui';
import { useAuthStore } from '@/store/authStore';
import {
  GiftIcon,
  VideoCameraIcon,
  UserGroupIcon,
  CheckCircleIcon,
  ClockIcon,
  ArrowLeftIcon,
  LinkIcon,
  ShareIcon,
  ClipboardDocumentIcon,
  ExclamationTriangleIcon,
  CheckBadgeIcon,
  XCircleIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';

interface Referral {
  id: string;
  paymentVerified: boolean;
  createdAt: string;
  referredUser: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

interface FreeEntryData {
  id: string;
  phone: string;
  participantType: string;
  college: string | null;
  company: string | null;
  designation: string | null;
  city: string;
  state: string;
  videoUrl: string | null;
  videoPlatform: string | null;
  videoDescription: string | null;
  referralCode: string;
  referralCount: number;
  videoStatus: string;
  adminNotes: string | null;
  status: string;
  freeEntryGranted: boolean;
  createdAt: string;
  referrals: Referral[];
  user: {
    firstName: string;
    lastName: string;
    email: string;
    avatar: string | null;
  };
}

const STATUS_MAP: Record<string, { label: string; color: 'default' | 'success' | 'warning' | 'danger' | 'info' }> = {
  REGISTERED: { label: 'Registered', color: 'info' },
  VIDEO_SUBMITTED: { label: 'Video Submitted', color: 'warning' },
  UNDER_REVIEW: { label: 'Under Review', color: 'warning' },
  APPROVED: { label: 'Approved', color: 'success' },
  REJECTED: { label: 'Rejected', color: 'danger' },
};

const VIDEO_STATUS_MAP: Record<string, { label: string; color: 'default' | 'success' | 'warning' | 'danger' | 'info' }> = {
  PENDING: { label: 'Pending Review', color: 'warning' },
  APPROVED: { label: 'Approved', color: 'success' },
  REJECTED: { label: 'Rejected', color: 'danger' },
};

const PLATFORMS = [
  { value: 'INSTAGRAM', label: 'Instagram' },
  { value: 'YOUTUBE', label: 'YouTube' },
  { value: 'TWITTER', label: 'Twitter / X' },
  { value: 'LINKEDIN', label: 'LinkedIn' },
  { value: 'FACEBOOK', label: 'Facebook' },
  { value: 'OTHER', label: 'Other' },
];

export default function FreeEntryDashboardPage() {
  const router = useRouter();
  const { token, isAuthenticated, isLoading, checkAuth } = useAuthStore();
  const [freeEntry, setFreeEntry] = useState<FreeEntryData | null>(null);
  const [verifiedReferrals, setVerifiedReferrals] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  // Video submission form
  const [videoForm, setVideoForm] = useState({ videoUrl: '', videoPlatform: '', videoDescription: '' });
  const [videoErrors, setVideoErrors] = useState<Record<string, string>>({});
  const [videoSubmitting, setVideoSubmitting] = useState(false);
  const [videoSuccess, setVideoSuccess] = useState('');

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/competition/free-entry/login');
      return;
    }
    if (isAuthenticated && token) {
      fetchDashboard();
    }
  }, [isLoading, isAuthenticated, token]);

  const fetchDashboard = async () => {
    try {
      const res = await fetch('/api/competition/free-entry', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setFreeEntry(data.data.freeEntry);
        setVerifiedReferrals(data.data.verifiedReferrals);
        if (data.data.freeEntry.videoUrl) {
          setVideoForm({
            videoUrl: data.data.freeEntry.videoUrl,
            videoPlatform: data.data.freeEntry.videoPlatform || '',
            videoDescription: data.data.freeEntry.videoDescription || '',
          });
        }
      } else {
        setError(data.error || 'Failed to load dashboard');
      }
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  const handleVideoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    if (!videoForm.videoUrl.trim()) newErrors.videoUrl = 'Video URL is required';
    else {
      try { new URL(videoForm.videoUrl); } catch { newErrors.videoUrl = 'Invalid URL'; }
    }
    if (!videoForm.videoPlatform) newErrors.videoPlatform = 'Select a platform';
    setVideoErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setVideoSubmitting(true);
    setVideoSuccess('');

    try {
      const res = await fetch('/api/competition/free-entry', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: 'submit-video', ...videoForm }),
      });
      const data = await res.json();
      if (data.success) {
        setVideoSuccess('Video submitted successfully! Admin will review it soon.');
        fetchDashboard();
      } else {
        setVideoErrors({ videoUrl: data.error || 'Submission failed' });
      }
    } catch {
      setVideoErrors({ videoUrl: 'Network error' });
    } finally {
      setVideoSubmitting(false);
    }
  };

  const copyReferralLink = () => {
    if (!freeEntry) return;
    const link = `${window.location.origin}/competition/free-entry/register?ref=${freeEntry.referralCode}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-green-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !freeEntry) {
    return (
      <div className="min-h-screen bg-background pt-24 pb-16 px-4">
        <div className="max-w-lg mx-auto text-center">
          <Card className="p-8">
            <ExclamationTriangleIcon className="w-12 h-12 text-amber-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-foreground mb-2">Free Entry Not Found</h1>
            <p className="text-muted mb-6">
              {error || 'You haven\'t registered for the free entry program yet.'}
            </p>
            <div className="flex gap-3 justify-center">
              <Link href="/competition/free-entry/register">
                <Button>Register for Free Entry</Button>
              </Link>
              <Link href="/competition/free-entry">
                <Button variant="outline">Learn More</Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  const statusInfo = STATUS_MAP[freeEntry.status] || STATUS_MAP.REGISTERED;
  const hasVideo = !!freeEntry.videoUrl;
  const videoApproved = freeEntry.videoStatus === 'APPROVED';
  const referralsMet = verifiedReferrals >= 5;

  return (
    <div className="min-h-screen bg-background pt-24 pb-16 px-4">
      <div className="max-w-4xl mx-auto">
        <Link href="/competition/free-entry" className="inline-flex items-center gap-2 text-sm text-muted hover:text-foreground mb-6 transition-colors">
          <ArrowLeftIcon className="w-4 h-4" />
          Back to Free Entry
        </Link>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-1">Free Entry Dashboard</h1>
              <p className="text-muted">Welcome, {freeEntry.user.firstName}!</p>
            </div>
            <Badge variant={statusInfo.color}>{statusInfo.label}</Badge>
          </div>

          {/* Free Entry Granted Banner */}
          {freeEntry.freeEntryGranted && (
            <Card className="p-6 mb-6 border-green-400/20 bg-green-400/5">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-green-400/10 flex items-center justify-center flex-shrink-0">
                  <CheckBadgeIcon className="w-8 h-8 text-green-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-green-400 mb-1">🎉 Free Entry Granted!</h3>
                  <p className="text-muted text-sm">
                    Congratulations! Your video has been approved and you have met all the referral requirements. You now have free access to the competition event with all benefits!
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* Rejected Banner */}
          {freeEntry.status === 'REJECTED' && (
            <Card className="p-6 mb-6 border-red-400/20 bg-red-400/5">
              <div className="flex items-start gap-4">
                <XCircleIcon className="w-8 h-8 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-lg font-bold text-red-400 mb-1">Video Rejected</h3>
                  <p className="text-muted text-sm mb-2">Your video submission was not approved.</p>
                  {freeEntry.adminNotes && (
                    <p className="text-sm text-red-400/80 italic">&ldquo;{freeEntry.adminNotes}&rdquo;</p>
                  )}
                  <p className="text-muted text-xs mt-2">You can submit a new video below.</p>
                </div>
              </div>
            </Card>
          )}

          {/* Progress Steps */}
          <Card className="p-6 mb-6">
            <h3 className="text-sm font-semibold text-muted uppercase tracking-wider mb-4">Your Progress</h3>
            <div className="flex items-center gap-0">
              {[
                { label: 'Registered', done: true },
                { label: 'Video Submitted', done: hasVideo },
                { label: 'Video Approved', done: videoApproved },
                { label: '5 Referrals', done: referralsMet },
                { label: 'Free Entry', done: freeEntry.freeEntryGranted },
              ].map((step, i, arr) => (
                <div key={step.label} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-1 ${
                      step.done
                        ? 'bg-green-400/20 border-2 border-green-400'
                        : 'bg-card border-2 border-border'
                    }`}>
                      {step.done ? (
                        <CheckCircleIcon className="w-5 h-5 text-green-400" />
                      ) : (
                        <ClockIcon className="w-5 h-5 text-muted" />
                      )}
                    </div>
                    <span className={`text-xs text-center ${step.done ? 'text-green-400' : 'text-muted'}`}>{step.label}</span>
                  </div>
                  {i < arr.length - 1 && (
                    <div className={`w-full h-0.5 mb-5 ${step.done ? 'bg-green-400' : 'bg-border'}`} />
                  )}
                </div>
              ))}
            </div>
          </Card>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Video Submission Card */}
            <Card className="p-6">
              <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                <VideoCameraIcon className="w-5 h-5 text-purple" />
                Video Submission
              </h3>

              {hasVideo && freeEntry.videoStatus !== 'REJECTED' ? (
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="text-muted">Platform</span>
                    <span className="text-foreground font-medium">{freeEntry.videoPlatform}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="text-muted">Video URL</span>
                    <a href={freeEntry.videoUrl!} target="_blank" rel="noopener noreferrer" className="text-blue hover:underline font-medium flex items-center gap-1 max-w-[200px] truncate">
                      <LinkIcon className="w-4 h-4 flex-shrink-0" />
                      {freeEntry.videoUrl}
                    </a>
                  </div>
                  {freeEntry.videoDescription && (
                    <div className="py-2 border-b border-border">
                      <span className="text-muted block mb-1">Description</span>
                      <span className="text-foreground text-sm">{freeEntry.videoDescription}</span>
                    </div>
                  )}
                  <div className="flex justify-between py-2">
                    <span className="text-muted">Video Status</span>
                    <Badge variant={VIDEO_STATUS_MAP[freeEntry.videoStatus]?.color || 'default'}>
                      {VIDEO_STATUS_MAP[freeEntry.videoStatus]?.label || freeEntry.videoStatus}
                    </Badge>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleVideoSubmit} className="space-y-4">
                  <p className="text-sm text-muted mb-2">
                    {freeEntry.videoStatus === 'REJECTED'
                      ? 'Submit a new video link below:'
                      : 'Create a video about the competition, post it on social media, and submit the link below.'}
                  </p>

                  <Input
                    label="Video URL"
                    value={videoForm.videoUrl}
                    onChange={(e) => { setVideoForm((f) => ({ ...f, videoUrl: e.target.value })); setVideoErrors({}); }}
                    error={videoErrors.videoUrl}
                    placeholder="https://instagram.com/p/your-video"
                  />

                  <Select
                    label="Platform"
                    value={videoForm.videoPlatform}
                    onChange={(e) => { setVideoForm((f) => ({ ...f, videoPlatform: e.target.value })); setVideoErrors({}); }}
                    error={videoErrors.videoPlatform}
                    options={[{ value: '', label: 'Select Platform' }, ...PLATFORMS]}
                  />

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Description (optional)</label>
                    <textarea
                      value={videoForm.videoDescription}
                      onChange={(e) => setVideoForm((f) => ({ ...f, videoDescription: e.target.value }))}
                      placeholder="Brief description of your video..."
                      rows={3}
                      className="w-full px-4 py-3 rounded-xl border border-border bg-card text-foreground placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-green-400/50 resize-none"
                    />
                  </div>

                  {videoSuccess && (
                    <div className="p-3 rounded-xl bg-green-400/10 text-green-400 border border-green-400/20 text-sm">
                      {videoSuccess}
                    </div>
                  )}

                  <Button type="submit" className="w-full" isLoading={videoSubmitting} disabled={videoSubmitting}>
                    Submit Video
                  </Button>
                </form>
              )}
            </Card>

            {/* Referral Card */}
            <Card className="p-6">
              <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                <UserGroupIcon className="w-5 h-5 text-green-400" />
                Referrals ({verifiedReferrals}/5)
              </h3>

              {/* Referral Code */}
              <div className="p-4 rounded-xl bg-card border border-border mb-4">
                <p className="text-xs text-muted mb-2">Your Referral Code</p>
                <div className="flex items-center gap-2">
                  <code className="text-lg font-bold text-foreground flex-1 tracking-wider">{freeEntry.referralCode}</code>
                  <button
                    onClick={copyReferralLink}
                    className="p-2 rounded-lg bg-green-400/10 text-green-400 hover:bg-green-400/20 transition-colors"
                    title="Copy referral link"
                  >
                    {copied ? <CheckCircleIcon className="w-5 h-5" /> : <ClipboardDocumentIcon className="w-5 h-5" />}
                  </button>
                </div>
                {copied && <p className="text-xs text-green-400 mt-1">Link copied!</p>}
              </div>

              {/* Share button */}
              <button
                onClick={copyReferralLink}
                className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-green-400/10 text-green-400 border border-green-400/20 hover:bg-green-400/20 transition-colors text-sm font-medium mb-4"
              >
                <ShareIcon className="w-4 h-4" />
                Share Referral Link
              </button>

              {/* Progress bar */}
              <div className="mb-4">
                <div className="flex justify-between text-xs text-muted mb-1">
                  <span>Verified Referrals</span>
                  <span>{verifiedReferrals} / 5</span>
                </div>
                <div className="w-full h-3 bg-border rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-green-400 to-emerald-400 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min((verifiedReferrals / 5) * 100, 100)}%` }}
                  />
                </div>
                {verifiedReferrals >= 5 && (
                  <p className="text-xs text-green-400 mt-1 flex items-center gap-1">
                    <CheckCircleIcon className="w-3 h-3" /> Target reached!
                  </p>
                )}
              </div>

              {/* Referred users */}
              {freeEntry.referrals.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-xs text-muted font-semibold uppercase tracking-wider mb-2">Referred Members</p>
                  {freeEntry.referrals.map((r) => (
                    <div key={r.id} className="flex items-center justify-between p-3 rounded-xl bg-card border border-border">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue/10 flex items-center justify-center text-sm font-bold text-blue">
                          {r.referredUser.firstName[0]}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{r.referredUser.firstName} {r.referredUser.lastName}</p>
                          <p className="text-xs text-muted">{r.referredUser.email}</p>
                        </div>
                      </div>
                      <Badge variant={r.paymentVerified ? 'success' : 'warning'} className="text-xs">
                        {r.paymentVerified ? 'Paid ✓' : 'Pending'}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <UserGroupIcon className="w-10 h-10 text-muted mx-auto mb-2" />
                  <p className="text-sm text-muted">No referrals yet. Share your link!</p>
                </div>
              )}
            </Card>
          </div>

          {/* Profile Card */}
          <Card className="p-6 mt-6">
            <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
              <SparklesIcon className="w-5 h-5 text-amber-400" />
              Your Profile
            </h3>
            <div className="grid sm:grid-cols-2 gap-x-8 gap-y-3 text-sm">
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted">Name</span>
                <span className="text-foreground font-medium">{freeEntry.user.firstName} {freeEntry.user.lastName}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted">Email</span>
                <span className="text-foreground font-medium">{freeEntry.user.email}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted">Phone</span>
                <span className="text-foreground font-medium">{freeEntry.phone}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted">Type</span>
                <Badge variant={freeEntry.participantType === 'STUDENT' ? 'info' : 'default'}>
                  {freeEntry.participantType === 'STUDENT' ? 'Student' : 'Professional'}
                </Badge>
              </div>
              {freeEntry.college && (
                <div className="flex justify-between py-2 border-b border-border">
                  <span className="text-muted">College</span>
                  <span className="text-foreground font-medium">{freeEntry.college}</span>
                </div>
              )}
              {freeEntry.company && (
                <div className="flex justify-between py-2 border-b border-border">
                  <span className="text-muted">Company</span>
                  <span className="text-foreground font-medium">{freeEntry.company}</span>
                </div>
              )}
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted">Location</span>
                <span className="text-foreground font-medium">{freeEntry.city}, {freeEntry.state}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted">Registered On</span>
                <span className="text-foreground font-medium">
                  {new Date(freeEntry.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
