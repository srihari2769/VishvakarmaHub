'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Card, Button, Badge } from '@/components/ui';
import { useAuthStore } from '@/store/authStore';
import {
  TrophyIcon,
  LightBulbIcon,
  CheckCircleIcon,
  ClockIcon,
  UserGroupIcon,
  CurrencyRupeeIcon,
  ArrowLeftIcon,
  RocketLaunchIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  IdentificationIcon,
  ArrowDownTrayIcon,
  AcademicCapIcon,
} from '@heroicons/react/24/outline';

interface Participant {
  id: string;
  phone: string;
  participantType: string;
  college: string | null;
  company: string | null;
  designation: string | null;
  city: string;
  state: string;
  teamName: string | null;
  teamSize: number;
  teamMembers: { name: string; email: string; role: string }[] | null;
  ideaTitle: string | null;
  ideaDescription: string | null;
  ideaCategory: string | null;
  problemStatement: string | null;
  solution: string | null;
  targetAudience: string | null;
  uniqueness: string | null;
  productStage: string | null;
  pitchDeck: string | null;
  demoVideo: string | null;
  totalFee: number | null;
  paymentStatus: string;
  status: string;
  createdAt: string;
  user: { firstName: string; lastName: string; email: string; avatar: string | null };
}

interface CompetitionInfo {
  id: string;
  name: string;
  studentFee: number;
  founderFee: number;
  currentPhase: string;
  pageContent: Record<string, unknown> | null;
  finalsDate: string | null;
}

const STATUS_MAP: Record<string, { label: string; color: 'default' | 'success' | 'warning' | 'danger' | 'info' }> = {
  REGISTERED: { label: 'Registered', color: 'info' },
  IDEA_SUBMITTED: { label: 'Idea Submitted', color: 'warning' },
  SHORTLISTED: { label: 'Shortlisted', color: 'success' },
  SELECTED: { label: 'Selected', color: 'success' },
  FINALIST: { label: 'Finalist', color: 'success' },
  WINNER: { label: 'Winner 🏆', color: 'success' },
  ELIMINATED: { label: 'Eliminated', color: 'danger' },
};

export default function CompetitionDashboardPage() {
  const router = useRouter();
  const { user, token, isAuthenticated, isLoading, checkAuth } = useAuthStore();
  const [participant, setParticipant] = useState<Participant | null>(null);
  const [competition, setCompetition] = useState<CompetitionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const idCardRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const certRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [downloading, setDownloading] = useState<string | null>(null);
  const [certDownloading, setCertDownloading] = useState<string | null>(null);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/competition/login');
      return;
    }
    if (isAuthenticated && token) {
      fetchParticipant();
    }
  }, [isLoading, isAuthenticated, token]);

  const fetchParticipant = async () => {
    try {
      const res = await fetch('/api/competition/participant', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setParticipant(data.data.participant);
        setCompetition(data.data.competition);
      } else {
        setError(data.error || 'Failed to load profile');
      }
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  const downloadIdCard = useCallback(async (key: string, memberName: string) => {
    const el = idCardRefs.current[key];
    if (!el) return;
    setDownloading(key);
    try {
      const html2canvas = (await import('html2canvas-pro')).default;
      const canvas = await html2canvas(el, {
        backgroundColor: '#0B0F1A',
        scale: 2,
        useCORS: true,
      });
      const link = document.createElement('a');
      link.download = `ID-Card-${memberName.replace(/\s+/g, '-')}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('Download failed:', err);
    } finally {
      setDownloading(null);
    }
  }, []);

  const downloadCertificate = useCallback(async (key: string, memberName: string) => {
    const el = certRefs.current[key];
    if (!el) return;
    setCertDownloading(key);
    try {
      const html2canvas = (await import('html2canvas-pro')).default;
      const canvas = await html2canvas(el, {
        backgroundColor: '#0a0e1f',
        scale: 3,
        useCORS: true,
      });
      const link = document.createElement('a');
      link.download = `Certificate-${memberName.replace(/\s+/g, '-')}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('Certificate download failed:', err);
    } finally {
      setCertDownloading(null);
    }
  }, []);

  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-purple border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // No competition profile — show prompt to register
  if (error || !participant) {
    return (
      <div className="min-h-screen bg-background pt-24 pb-16 px-4">
        <div className="max-w-lg mx-auto text-center">
          <Card className="p-8">
            <ExclamationTriangleIcon className="w-12 h-12 text-amber-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-foreground mb-2">Competition Profile Not Found</h1>
            <p className="text-muted mb-6">
              {error || 'You haven\'t registered for the competition yet. Create your competition profile to get started.'}
            </p>
            <div className="flex gap-3 justify-center">
              <Link href="/competition/register">
                <Button>Register for Competition</Button>
              </Link>
              <Link href="/competition">
                <Button variant="outline">View Competition</Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  const statusInfo = STATUS_MAP[participant.status] || STATUS_MAP.REGISTERED;
  const isPaid = participant.paymentStatus === 'PAID';
  const hasIdea = !!participant.ideaTitle;

  return (
    <div className="min-h-screen bg-background pt-24 pb-16 px-4">
      <div className="max-w-4xl mx-auto">
        <Link href="/competition" className="inline-flex items-center gap-2 text-sm text-muted hover:text-foreground mb-6 transition-colors">
          <ArrowLeftIcon className="w-4 h-4" />
          Back to Competition
        </Link>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-1">Competition Dashboard</h1>
              <p className="text-muted">{competition?.name}</p>
            </div>
            <Badge variant={statusInfo.color}>{statusInfo.label}</Badge>
          </div>

          {/* Progress Steps */}
          <Card className="p-6 mb-6">
            <h3 className="text-sm font-semibold text-muted uppercase tracking-wider mb-4">Your Progress</h3>
            <div className="flex items-center gap-0">
              {[
                { label: 'Registered', done: true },
                { label: 'Idea Submitted', done: hasIdea },
                { label: 'Payment Done', done: isPaid },
                { label: 'Under Review', done: ['SHORTLISTED', 'SELECTED', 'FINALIST', 'WINNER'].includes(participant.status) },
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

          {/* Action Card — Submit Idea / Payment pending */}
          {!hasIdea && (
            <Card className="p-6 mb-6 border-amber-400/20 bg-amber-400/5">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-amber-400/10 flex items-center justify-center flex-shrink-0">
                  <LightBulbIcon className="w-6 h-6 text-amber-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-foreground mb-1">Submit Your Idea</h3>
                  <p className="text-muted text-sm mb-4">
                    Complete your registration by submitting your startup idea and making the payment.
                  </p>
                  <Link href="/competition/idea-submission">
                    <Button>
                      <RocketLaunchIcon className="w-4 h-4 mr-2 inline" />
                      Submit Idea & Pay
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          )}

          {hasIdea && !isPaid && (
            <Card className="p-6 mb-6 border-red-400/20 bg-red-400/5">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-red-400/10 flex items-center justify-center flex-shrink-0">
                  <CurrencyRupeeIcon className="w-6 h-6 text-red-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-foreground mb-1">Payment Pending</h3>
                  <p className="text-muted text-sm mb-4">
                    Your idea has been saved but payment is pending. Complete payment to finalize your registration.
                  </p>
                  <Link href="/competition/idea-submission">
                    <Button>Complete Payment — ₹{participant.totalFee}</Button>
                  </Link>
                </div>
              </div>
            </Card>
          )}

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Profile Card */}
            <Card className="p-6">
              <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                <TrophyIcon className="w-5 h-5 text-purple" />
                Your Profile
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between py-2 border-b border-border">
                  <span className="text-muted">Name</span>
                  <span className="text-foreground font-medium">{participant.user.firstName} {participant.user.lastName}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-border">
                  <span className="text-muted">Email</span>
                  <span className="text-foreground font-medium">{participant.user.email}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-border">
                  <span className="text-muted">Phone</span>
                  <span className="text-foreground font-medium">{participant.phone}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-border">
                  <span className="text-muted">Type</span>
                  <Badge variant={participant.participantType === 'STUDENT' ? 'info' : 'default'}>
                    {participant.participantType === 'STUDENT' ? 'Student' : 'Professional'}
                  </Badge>
                </div>
                {participant.college && (
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="text-muted">College</span>
                    <span className="text-foreground font-medium">{participant.college}</span>
                  </div>
                )}
                {participant.company && (
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="text-muted">Company</span>
                    <span className="text-foreground font-medium">{participant.company}</span>
                  </div>
                )}
                <div className="flex justify-between py-2 border-b border-border">
                  <span className="text-muted">Location</span>
                  <span className="text-foreground font-medium">{participant.city}, {participant.state}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-muted">Registered On</span>
                  <span className="text-foreground font-medium">
                    {new Date(participant.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </div>
              </div>
            </Card>

            {/* Idea & Payment Card */}
            <Card className="p-6">
              <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                <DocumentTextIcon className="w-5 h-5 text-blue" />
                Submission Details
              </h3>
              {hasIdea ? (
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="text-muted">Idea Title</span>
                    <span className="text-foreground font-medium">{participant.ideaTitle}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="text-muted">Category</span>
                    <span className="text-foreground font-medium">{participant.ideaCategory}</span>
                  </div>
                  {participant.productStage && (
                    <div className="flex justify-between py-2 border-b border-border">
                      <span className="text-muted">Stage</span>
                      <span className="text-foreground font-medium">{participant.productStage}</span>
                    </div>
                  )}
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="text-muted">Team Size</span>
                    <span className="text-foreground font-medium flex items-center gap-1">
                      <UserGroupIcon className="w-4 h-4" />
                      {participant.teamSize} {participant.teamSize > 1 ? 'members' : 'member'}
                    </span>
                  </div>
                  {participant.teamName && (
                    <div className="flex justify-between py-2 border-b border-border">
                      <span className="text-muted">Team Name</span>
                      <span className="text-foreground font-medium">{participant.teamName}</span>
                    </div>
                  )}
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="text-muted">Total Fee</span>
                    <span className="text-foreground font-bold">₹{participant.totalFee}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-muted">Payment</span>
                    <Badge variant={isPaid ? 'success' : 'danger'}>
                      {isPaid ? 'Paid ✓' : 'Pending'}
                    </Badge>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <LightBulbIcon className="w-12 h-12 text-muted mx-auto mb-3" />
                  <p className="text-muted">No idea submitted yet</p>
                  <Link href="/competition/idea-submission" className="text-purple text-sm hover:underline mt-2 inline-block">
                    Submit your idea →
                  </Link>
                </div>
              )}
            </Card>
          </div>

          {/* Team Members */}
          {participant.teamMembers && Array.isArray(participant.teamMembers) && participant.teamMembers.length > 0 && (
            <Card className="p-6 mt-6">
              <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                <UserGroupIcon className="w-5 h-5 text-green-400" />
                Team Members
              </h3>
              <div className="space-y-3">
                {/* Team leader */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-purple/5 border border-purple/20">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-purple/20 flex items-center justify-center text-sm font-bold text-purple">
                      {participant.user.firstName[0]}
                    </div>
                    <div>
                      <p className="text-foreground font-medium text-sm">{participant.user.firstName} {participant.user.lastName}</p>
                      <p className="text-xs text-muted">{participant.user.email}</p>
                    </div>
                  </div>
                  <Badge variant="default">Team Leader</Badge>
                </div>
                {/* Other members */}
                {(participant.teamMembers as { name: string; email: string; role: string }[]).map((member, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-card border border-border">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue/10 flex items-center justify-center text-sm font-bold text-blue">
                        {member.name[0]}
                      </div>
                      <div>
                        <p className="text-foreground font-medium text-sm">{member.name}</p>
                        <p className="text-xs text-muted">{member.email}</p>
                      </div>
                    </div>
                    <span className="text-xs text-muted">{member.role || `Member ${i + 1}`}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* ===== ID CARDS SECTION ===== */}
          {isPaid && (
            <Card className="p-6 mt-6">
              <h3 className="text-lg font-bold text-foreground mb-2 flex items-center gap-2">
                <IdentificationIcon className="w-5 h-5 text-amber-400" />
                Participant ID Cards
              </h3>
              <p className="text-muted text-sm mb-6">
                Download your ID cards to present at the event venue.
              </p>

              <div className="space-y-8">
                {/* Build list: leader + team members */}
                {[
                  {
                    key: 'leader',
                    name: `${participant.user.firstName} ${participant.user.lastName}`,
                    email: participant.user.email,
                    role: 'Team Leader',
                    initial: participant.user.firstName[0],
                  },
                  ...((participant.teamMembers as { name: string; email: string; role: string }[] | null) || []).map((m, i) => ({
                    key: `member-${i}`,
                    name: m.name,
                    email: m.email,
                    role: m.role || `Member ${i + 1}`,
                    initial: m.name[0],
                  })),
                ].map((person) => (
                  <div key={person.key} className="space-y-3">
                    {/* ID Card */}
                    <div
                      ref={(el) => { idCardRefs.current[person.key] = el; }}
                      className="rounded-2xl overflow-hidden shadow-2xl shadow-amber-500/10 border border-amber-500/20 max-w-md mx-auto"
                      style={{ minHeight: 280 }}
                    >
                      {/* Card Header */}
                      <div className="bg-gradient-to-r from-amber-600 to-amber-500 px-5 py-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-black/20 flex items-center justify-center">
                            <span className="text-white font-bold text-xs">V</span>
                          </div>
                          <div>
                            <p className="text-black font-bold text-sm tracking-wide">Vishvakarma Hub</p>
                            <p className="text-black/60 text-[9px] font-medium">Innovation Challenge 2026</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-black/80 text-[9px] font-bold uppercase tracking-wider">
                            {participant.participantType === 'STUDENT' ? 'Student' : 'Founder'}
                          </p>
                          <p className="text-black font-bold text-[10px]">ID CARD</p>
                        </div>
                      </div>

                      {/* Card Body */}
                      <div className="bg-gradient-to-br from-[#0f1729] to-[#1a1f36] px-5 py-4">
                        <div className="flex items-start gap-4">
                          {/* Avatar */}
                          <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 border-2 border-amber-500/30 flex items-center justify-center flex-shrink-0">
                            <span className="text-2xl font-black text-amber-400">{person.initial.toUpperCase()}</span>
                          </div>
                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <h4 className="text-white font-bold text-lg leading-tight truncate">{person.name}</h4>
                            <p className="text-amber-400/80 text-xs font-semibold mt-0.5">{person.role}</p>
                            <p className="text-white/40 text-xs mt-1 truncate">{person.email}</p>
                          </div>
                        </div>

                        {/* Details Grid */}
                        <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                          {participant.teamName && (
                            <div>
                              <span className="text-white/30 uppercase tracking-wider text-[9px]">Team</span>
                              <p className="text-white/80 font-medium truncate">{participant.teamName}</p>
                            </div>
                          )}
                          {participant.ideaCategory && (
                            <div>
                              <span className="text-white/30 uppercase tracking-wider text-[9px]">Category</span>
                              <p className="text-white/80 font-medium truncate">{participant.ideaCategory}</p>
                            </div>
                          )}
                          <div>
                            <span className="text-white/30 uppercase tracking-wider text-[9px]">Location</span>
                            <p className="text-white/80 font-medium truncate">{participant.city}, {participant.state}</p>
                          </div>
                          <div>
                            <span className="text-white/30 uppercase tracking-wider text-[9px]">Type</span>
                            <p className="text-white/80 font-medium">{participant.participantType === 'STUDENT' ? 'Student' : 'Professional'}</p>
                          </div>
                        </div>
                      </div>

                      {/* Card Footer */}
                      <div className="bg-[#0a0e1a] px-5 py-2.5 flex items-center justify-between border-t border-white/5">
                        <div className="flex items-center gap-1.5">
                          <div className="w-2 h-2 rounded-full bg-green-400" />
                          <span className="text-green-400 text-[10px] font-bold uppercase tracking-wider">Verified Participant</span>
                        </div>
                        <span className="text-white/20 text-[9px] font-mono">
                          {participant.id.slice(-8).toUpperCase()}
                        </span>
                      </div>
                    </div>

                    {/* Download Button */}
                    <div className="text-center">
                      <button
                        onClick={() => downloadIdCard(person.key, person.name)}
                        disabled={downloading === person.key}
                        className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ArrowDownTrayIcon className="w-4 h-4" />
                        {downloading === person.key ? 'Downloading...' : `Download ${person.name.split(' ')[0]}'s ID Card`}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* ===== CERTIFICATE OF PARTICIPATION SECTION ===== */}
          {isPaid && (() => {
            const pc = competition?.pageContent as Record<string, unknown> | null;
            const relDate = pc?.certificateReleaseDate as string | undefined;
            const relTime = pc?.certificateReleaseTime as string | undefined;
            if (!relDate) return null;
            const releaseISO = `${relDate}T${relTime || '00:00'}:00+05:30`;
            const releaseMs = new Date(releaseISO).getTime();
            if (Date.now() < releaseMs) return null;

            const eventDate = competition?.finalsDate
              ? new Date(competition.finalsDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
              : new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

            const people = [
              {
                key: 'cert-leader',
                name: `${participant.user.firstName} ${participant.user.lastName}`,
                role: 'Team Leader',
              },
              ...((participant.teamMembers as { name: string; email: string; role: string }[] | null) || []).map((m, i) => ({
                key: `cert-member-${i}`,
                name: m.name,
                role: m.role || `Team Member`,
              })),
            ];

            return (
              <Card className="p-6 mt-6">
                <h3 className="text-lg font-bold text-foreground mb-2 flex items-center gap-2">
                  <AcademicCapIcon className="w-5 h-5 text-amber-400" />
                  Certificate of Participation
                </h3>
                <p className="text-muted text-sm mb-6">
                  Download your participation certificates below.
                </p>

                <div className="space-y-10">
                  {people.map((person) => (
                    <div key={person.key} className="space-y-3">
                      {/* Certificate */}
                      <div
                        ref={(el) => { certRefs.current[person.key] = el; }}
                        className="mx-auto overflow-hidden"
                        style={{ width: 1120, height: 790, position: 'relative', fontFamily: 'Georgia, "Times New Roman", serif' }}
                      >
                        {/* Deep navy background with subtle radial glow */}
                        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 40%, #141e3a 0%, #0a0e1f 60%, #060a16 100%)' }} />

                        {/* Subtle texture overlay */}
                        <div style={{
                          position: 'absolute', inset: 0, opacity: 0.03,
                          backgroundImage: 'repeating-linear-gradient(45deg, #c9a84c 0px, #c9a84c 1px, transparent 1px, transparent 16px), repeating-linear-gradient(-45deg, #c9a84c 0px, #c9a84c 1px, transparent 1px, transparent 16px)',
                        }} />

                        {/* ── Outer gold border ── */}
                        <div style={{ position: 'absolute', inset: 10, border: '2px solid #c9a84c', borderRadius: 3 }} />
                        {/* ── Inner gold border ── */}
                        <div style={{ position: 'absolute', inset: 18, border: '1px solid rgba(201,168,76,0.35)' }} />

                        {/* ── Corner flourishes (4 corners) ── */}
                        {/* Top-left */}
                        <div style={{ position: 'absolute', top: 26, left: 26 }}>
                          <div style={{ width: 50, height: 2, background: 'linear-gradient(90deg, #c9a84c, transparent)' }} />
                          <div style={{ width: 2, height: 50, background: 'linear-gradient(180deg, #c9a84c, transparent)' }} />
                          <div style={{ position: 'absolute', top: 0, left: 0, width: 8, height: 8, borderTop: '3px solid #c9a84c', borderLeft: '3px solid #c9a84c' }} />
                        </div>
                        {/* Top-right */}
                        <div style={{ position: 'absolute', top: 26, right: 26 }}>
                          <div style={{ width: 50, height: 2, background: 'linear-gradient(-90deg, #c9a84c, transparent)', marginLeft: 'auto' }} />
                          <div style={{ width: 2, height: 50, background: 'linear-gradient(180deg, #c9a84c, transparent)', marginLeft: 'auto' }} />
                          <div style={{ position: 'absolute', top: 0, right: 0, width: 8, height: 8, borderTop: '3px solid #c9a84c', borderRight: '3px solid #c9a84c' }} />
                        </div>
                        {/* Bottom-left */}
                        <div style={{ position: 'absolute', bottom: 26, left: 26 }}>
                          <div style={{ width: 2, height: 50, background: 'linear-gradient(0deg, #c9a84c, transparent)' }} />
                          <div style={{ width: 50, height: 2, background: 'linear-gradient(90deg, #c9a84c, transparent)', marginTop: -2 }} />
                          <div style={{ position: 'absolute', bottom: 0, left: 0, width: 8, height: 8, borderBottom: '3px solid #c9a84c', borderLeft: '3px solid #c9a84c' }} />
                        </div>
                        {/* Bottom-right */}
                        <div style={{ position: 'absolute', bottom: 26, right: 26 }}>
                          <div style={{ width: 2, height: 50, background: 'linear-gradient(0deg, #c9a84c, transparent)', marginLeft: 'auto' }} />
                          <div style={{ width: 50, height: 2, background: 'linear-gradient(-90deg, #c9a84c, transparent)', marginLeft: 'auto', marginTop: -2 }} />
                          <div style={{ position: 'absolute', bottom: 0, right: 0, width: 8, height: 8, borderBottom: '3px solid #c9a84c', borderRight: '3px solid #c9a84c' }} />
                        </div>

                        {/* ── Main content ── */}
                        <div style={{
                          position: 'absolute', inset: 0,
                          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                          padding: '65px 80px', textAlign: 'center',
                        }}>
                          {/* Top ornament line */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
                            <div style={{ width: 60, height: 1, background: 'linear-gradient(90deg, transparent, #c9a84c)' }} />
                            <span style={{ color: '#c9a84c', fontSize: 14 }}>✦</span>
                            <div style={{ width: 60, height: 1, background: 'linear-gradient(-90deg, transparent, #c9a84c)' }} />
                          </div>

                          {/* Certificate title */}
                          <h2 style={{
                            color: '#c9a84c', fontSize: 50, fontWeight: 700, letterSpacing: 10,
                            textTransform: 'uppercase', lineHeight: 1, marginBottom: 4,
                            textShadow: '0 0 30px rgba(201,168,76,0.15)',
                          }}>
                            Certificate
                          </h2>
                          <p style={{
                            color: 'rgba(201,168,76,0.7)', fontSize: 18, letterSpacing: 12,
                            textTransform: 'uppercase', fontWeight: 400, marginBottom: 0,
                          }}>
                            of Participation
                          </p>

                          {/* Gold divider with diamond */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '14px 0 18px 0' }}>
                            <div style={{ width: 80, height: 1, background: 'linear-gradient(90deg, transparent, #c9a84c)' }} />
                            <div style={{
                              width: 8, height: 8, backgroundColor: '#c9a84c', transform: 'rotate(45deg)',
                            }} />
                            <div style={{ width: 80, height: 1, background: 'linear-gradient(-90deg, transparent, #c9a84c)' }} />
                          </div>

                          {/* Presented to */}
                          <p style={{
                            color: 'rgba(255,255,255,0.45)', fontSize: 14, letterSpacing: 5,
                            textTransform: 'uppercase', marginBottom: 12, fontWeight: 400,
                          }}>
                            This is Proudly Presented To
                          </p>

                          {/* Recipient name */}
                          <h3 style={{
                            color: '#e8d5a3', fontSize: 44, fontWeight: 700, marginBottom: 8,
                            fontStyle: 'italic', letterSpacing: 2,
                            textShadow: '0 2px 20px rgba(201,168,76,0.2)',
                          }}>
                            {person.name}
                          </h3>

                          {/* Underline below name */}
                          <div style={{
                            width: 260, height: 1, margin: '0 auto 12px auto',
                            background: 'linear-gradient(90deg, transparent, rgba(201,168,76,0.5), transparent)',
                          }} />

                          {/* Role badge */}
                          <div style={{
                            display: 'inline-flex', alignItems: 'center', gap: 8,
                            padding: '5px 22px', borderRadius: 20,
                            border: '1px solid rgba(201,168,76,0.3)',
                            backgroundColor: 'rgba(201,168,76,0.06)',
                            marginBottom: 16,
                          }}>
                            <span style={{ color: '#c9a84c', fontSize: 10 }}>★</span>
                            <span style={{
                              color: '#c9a84c', fontSize: 12, fontWeight: 700, letterSpacing: 3,
                              textTransform: 'uppercase',
                            }}>
                              {person.role}
                            </span>
                            <span style={{ color: '#c9a84c', fontSize: 10 }}>★</span>
                          </div>

                          {/* Description */}
                          <p style={{
                            color: 'rgba(255,255,255,0.45)', fontSize: 13, lineHeight: 1.8,
                            maxWidth: 540, marginBottom: 10,
                          }}>
                            In recognition of their valuable participation and commitment shown during the{' '}
                            <span style={{ color: 'rgba(255,255,255,0.65)', fontWeight: 600 }}>
                              {competition?.name || 'Vishvakarma Innovation Challenge 2026'}
                            </span>
                            {participant.teamName ? (
                              <>, as a member of Team <span style={{ color: 'rgba(255,255,255,0.65)', fontWeight: 600 }}>&ldquo;{participant.teamName}&rdquo;</span></>
                            ) : ''}
                            . This certificate acknowledges their enthusiasm, creative thinking, and willingness
                            to take on new challenges in the spirit of innovation and entrepreneurship.
                          </p>
                          <p style={{
                            color: 'rgba(201,168,76,0.5)', fontSize: 10, letterSpacing: 2,
                            textTransform: 'uppercase', marginBottom: 18,
                          }}>
                            We appreciate your contribution to the innovation ecosystem.
                          </p>

                          {/* ── Bottom section: stamp + signatures ── */}
                          <div style={{
                            display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
                            gap: 80, marginTop: 'auto', width: '100%',
                          }}>
                            {/* Date column */}
                            <div style={{ textAlign: 'center', minWidth: 140 }}>
                              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
                                {eventDate}
                              </p>
                              <div style={{ width: 140, height: 1, backgroundColor: 'rgba(201,168,76,0.4)', marginBottom: 5 }} />
                              <p style={{ color: 'rgba(201,168,76,0.6)', fontSize: 9, letterSpacing: 2, textTransform: 'uppercase' }}>Date</p>
                            </div>

                            {/* Stamp */}
                            <img src="/Stamp.png" alt="Vishvakarma Hub Stamp" style={{
                              width: 90, height: 90, borderRadius: '50%', flexShrink: 0,
                            }} />

                            {/* Organization column */}
                            <div style={{ textAlign: 'center', minWidth: 140 }}>
                              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: 600, marginBottom: 8, fontStyle: 'italic' }}>
                                Vishvakarma Hub
                              </p>
                              <div style={{ width: 140, height: 1, backgroundColor: 'rgba(201,168,76,0.4)', marginBottom: 5 }} />
                              <p style={{ color: 'rgba(201,168,76,0.6)', fontSize: 9, letterSpacing: 2, textTransform: 'uppercase' }}>Organization</p>
                            </div>
                          </div>
                        </div>

                        {/* ── Top-center branding ── */}
                        <div style={{
                          position: 'absolute', top: 24, left: '50%', transform: 'translateX(-50%)',
                          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                        }}>
                          <img src="/Stamp.png" alt="VH" style={{ width: 40, height: 40, borderRadius: '50%' }} />
                          <span style={{ color: 'rgba(201,168,76,0.55)', fontSize: 9, fontWeight: 600, letterSpacing: 4, textTransform: 'uppercase' }}>
                            Vishvakarma Hub
                          </span>
                        </div>
                      </div>

                      {/* Download Button */}
                      <div className="text-center">
                        <button
                          onClick={() => downloadCertificate(person.key, person.name)}
                          disabled={certDownloading === person.key}
                          className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <ArrowDownTrayIcon className="w-4 h-4" />
                          {certDownloading === person.key ? 'Downloading...' : `Download ${person.name.split(' ')[0]}'s Certificate`}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            );
          })()}

        </motion.div>
      </div>
    </div>
  );
}
