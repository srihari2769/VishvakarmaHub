'use client';

import { useState, useEffect } from 'react';
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
        </motion.div>
      </div>
    </div>
  );
}
