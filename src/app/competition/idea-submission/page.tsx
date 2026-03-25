'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Script from 'next/script';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, Button, Input, Textarea, Select } from '@/components/ui';
import { useAuthStore } from '@/store/authStore';
import {
  LightBulbIcon,
  UserGroupIcon,
  CurrencyRupeeIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  PlusIcon,
  TrashIcon,
  RocketLaunchIcon,
  AcademicCapIcon,
  BriefcaseIcon,
  TicketIcon,
} from '@heroicons/react/24/outline';

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Razorpay: any;
  }
}

const CATEGORIES = [
  'Artificial Intelligence / ML',
  'FinTech',
  'EdTech',
  'HealthTech',
  'AgriTech',
  'CleanTech / Sustainability',
  'E-Commerce / D2C',
  'SaaS / B2B',
  'Social Impact',
  'IoT / Hardware',
  'Gaming / Entertainment',
  'Logistics / Supply Chain',
  'Deep Tech',
  'Other',
];

const PRODUCT_STAGES = [
  { value: 'IDEA', label: 'Just an Idea' },
  { value: 'PROTOTYPE', label: 'Prototype / MVP' },
  { value: 'EARLY_TRACTION', label: 'Early Traction' },
  { value: 'GROWTH', label: 'Growth Stage' },
];

interface TeamMember {
  name: string;
  email: string;
  role: string;
}

export default function IdeaSubmissionPage() {
  const router = useRouter();
  const { user, token, isAuthenticated, isLoading, checkAuth } = useAuthStore();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [participantType, setParticipantType] = useState<string>('');
  const [participationMode, setParticipationMode] = useState<string>('');
  const [baseFee, setBaseFee] = useState(0);
  const [studentFee, setStudentFee] = useState(199);
  const [founderFee, setFounderFee] = useState(499);
  const [existingIdea, setExistingIdea] = useState(false);

  // Idea form
  const [idea, setIdea] = useState({
    ideaTitle: '',
    ideaDescription: '',
    ideaCategory: '',
    problemStatement: '',
    solution: '',
    targetAudience: '',
    uniqueness: '',
    productStage: '',
    pitchDeck: '',
    demoVideo: '',
  });

  // Team form
  const [teamName, setTeamName] = useState('');
  const [teamSize, setTeamSize] = useState(1);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/competition/login');
      return;
    }
    if (isAuthenticated && token) {
      fetchParticipantInfo();
    }
  }, [isLoading, isAuthenticated, token]);

  const fetchParticipantInfo = async () => {
    try {
      const res = await fetch('/api/competition/participant', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        const p = data.data.participant;
        const c = data.data.competition;
        setParticipantType(p.participantType);
        setStudentFee(c.studentFee);
        setFounderFee(c.founderFee);
        const fee = p.participantType === 'STUDENT' ? c.studentFee : c.founderFee;
        setBaseFee(fee);

        // If already paid, redirect to dashboard
        if (p.paymentStatus === 'PAID') {
          router.push('/competition/dashboard');
          return;
        }

        // If participationMode already set, restore it
        if (p.participationMode && p.participationMode !== '') {
          setParticipationMode(p.participationMode);
        }

        // If Event Access mode but unpaid, jump to event access payment step
        if (p.participationMode === 'EVENT_ACCESS') {
          setStep(4);
          setPageLoading(false);
          return;
        }

        // If Idea Submission mode selected but no idea yet, go to step 1
        if (p.participationMode === 'IDEA_SUBMISSION' && !p.ideaTitle) {
          setStep(1);
          setPageLoading(false);
          return;
        }

        // No mode selected yet — stay on step 0 (default)
        if (!p.participationMode || p.participationMode === '') {
          setStep(0);
          setPageLoading(false);
          return;
        }

        // If idea already submitted but not paid, pre-fill
        if (p.ideaTitle) {
          setExistingIdea(true);
          setIdea({
            ideaTitle: p.ideaTitle || '',
            ideaDescription: p.ideaDescription || '',
            ideaCategory: p.ideaCategory || '',
            problemStatement: p.problemStatement || '',
            solution: p.solution || '',
            targetAudience: p.targetAudience || '',
            uniqueness: p.uniqueness || '',
            productStage: p.productStage || '',
            pitchDeck: p.pitchDeck || '',
            demoVideo: p.demoVideo || '',
          });
          setTeamName(p.teamName || '');
          setTeamSize(p.teamSize || 1);
          if (p.teamMembers && Array.isArray(p.teamMembers)) {
            setTeamMembers(p.teamMembers as TeamMember[]);
          }
          // Jump to payment step if idea already filled
          setStep(3);
        }
      } else {
        // No competition profile — redirect to register
        router.push('/competition/register');
        return;
      }
    } catch {
      setError('Failed to load your profile.');
    } finally {
      setPageLoading(false);
    }
  };

  const updateIdea = (field: string, value: string) => {
    setIdea((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
    setError('');
  };

  const validateStep1 = (): boolean => {
    const e: Record<string, string> = {};
    if (!idea.ideaTitle.trim()) e.ideaTitle = 'Idea title is required';
    if (!idea.ideaDescription.trim()) e.ideaDescription = 'Description is required';
    else if (idea.ideaDescription.trim().length < 50) e.ideaDescription = 'At least 50 characters';
    if (!idea.ideaCategory) e.ideaCategory = 'Select a category';
    if (!idea.problemStatement.trim()) e.problemStatement = 'Problem statement is required';
    if (!idea.solution.trim()) e.solution = 'Solution is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateStep2 = (): boolean => {
    const e: Record<string, string> = {};
    if (teamSize > 1 && !teamName.trim()) e.teamName = 'Team name is required';
    if (teamSize > 1) {
      for (let i = 0; i < teamMembers.length; i++) {
        if (!teamMembers[i].name.trim()) e[`member_${i}_name`] = 'Name is required';
        if (!teamMembers[i].email.trim()) e[`member_${i}_email`] = 'Email is required';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(teamMembers[i].email))
          e[`member_${i}_email`] = 'Invalid email';
      }
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleTeamSizeChange = (newSize: number) => {
    const size = Math.max(1, Math.min(10, newSize));
    setTeamSize(size);
    // Additional members = size - 1 (leader is the registered user)
    const additionalCount = size - 1;
    if (additionalCount > teamMembers.length) {
      const extra = Array.from({ length: additionalCount - teamMembers.length }, () => ({
        name: '',
        email: '',
        role: '',
      }));
      setTeamMembers([...teamMembers, ...extra]);
    } else {
      setTeamMembers(teamMembers.slice(0, additionalCount));
    }
    setErrors({});
  };

  const updateTeamMember = (index: number, field: keyof TeamMember, value: string) => {
    setTeamMembers((prev) => prev.map((m, i) => (i === index ? { ...m, [field]: value } : m)));
    setErrors((prev) => ({ ...prev, [`member_${index}_${field}`]: '' }));
  };

  const removeMember = (index: number) => {
    setTeamMembers((prev) => prev.filter((_, i) => i !== index));
    setTeamSize((prev) => prev - 1);
  };

  const addMember = () => {
    if (teamSize >= 10) return;
    setTeamMembers([...teamMembers, { name: '', email: '', role: '' }]);
    setTeamSize(teamSize + 1);
  };

  const totalFee = baseFee * teamSize;

  const goToStep = (s: number) => {
    if (s === 1 && !participationMode) return;
    if (s === 2 && !validateStep1()) return;
    if (s === 3 && !validateStep2()) return;
    setStep(s);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleModeSelect = async (mode: string) => {
    setParticipationMode(mode);
    setError('');

    if (mode === 'EVENT_ACCESS') {
      // Save mode to DB and go to event access payment step
      try {
        await fetch('/api/competition/event-access', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ participationMode: mode }),
        });
      } catch { /* mode will be set on payment anyway */ }
      setStep(4);
    } else {
      setStep(1);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleEventAccessPay = async () => {
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/competition/event-access', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ participationMode: 'EVENT_ACCESS' }),
      });

      const data = await res.json();
      if (!data.success) {
        setError(data.error || 'Failed to create order');
        setLoading(false);
        return;
      }

      const d = data.data;

      const options = {
        key: d.keyId,
        amount: d.amount * 100,
        currency: d.currency,
        name: 'Vishvakarma Hub',
        description: `${d.competitionName} — Event Access Pass`,
        order_id: d.orderId,
        prefill: d.prefill,
        handler: async (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
          const verifyRes = await fetch('/api/competition/event-access', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              participantId: d.participantId,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            }),
          });

          const verifyData = await verifyRes.json();
          if (verifyData.success) {
            setSuccess(true);
          } else {
            setError('Payment verification failed. Please contact support.');
          }
          setLoading(false);
        },
        modal: {
          ondismiss: () => {
            setError('Payment was cancelled. You can try again.');
            setLoading(false);
          },
        },
        theme: { color: '#6366f1' },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch {
      setError('Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  const handleSubmitAndPay = async () => {
    setLoading(true);
    setError('');

    try {
      // Step 1: Submit idea + create Razorpay order
      const res = await fetch('/api/competition/idea-submission', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...idea,
          teamName: teamSize > 1 ? teamName : null,
          teamSize,
          teamMembers: teamSize > 1 ? teamMembers : null,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        setError(data.error || 'Failed to submit idea');
        setLoading(false);
        return;
      }

      const d = data.data;

      // Step 2: Open Razorpay checkout
      const options = {
        key: d.keyId,
        amount: d.amount * 100,
        currency: d.currency,
        name: 'Vishvakarma Hub',
        description: `${d.competitionName} — Idea Registration (${d.teamSize} ${d.teamSize > 1 ? 'members' : 'member'})`,
        order_id: d.orderId,
        prefill: d.prefill,
        handler: async (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
          // Step 3: Verify payment
          const verifyRes = await fetch('/api/competition/idea-submission', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              participantId: d.participantId,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            }),
          });

          const verifyData = await verifyRes.json();
          if (verifyData.success) {
            setSuccess(true);
          } else {
            setError('Payment verification failed. Please contact support.');
          }
          setLoading(false);
        },
        modal: {
          ondismiss: () => {
            setError('Payment was cancelled. Your idea has been saved — you can complete payment later from your dashboard.');
            setLoading(false);
          },
        },
        theme: { color: '#6366f1' },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch {
      setError('Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  if (isLoading || pageLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-purple border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Success screen
  if (success) {
    return (
      <div className="min-h-screen bg-background pt-24 pb-16 px-4">
        <div className="max-w-lg mx-auto">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
            <Card className="p-8 text-center">
              <div className="w-20 h-20 bg-green-400/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircleIcon className="w-10 h-10 text-green-400" />
              </div>
              <h1 className="text-2xl font-bold text-foreground mb-2">Registration Complete! 🎉</h1>
              <p className="text-muted mb-2">
                {participationMode === 'EVENT_ACCESS'
                  ? 'Your event access pass is confirmed and payment is complete.'
                  : 'Your idea has been submitted and payment is confirmed.'}
              </p>
              <p className="text-sm text-muted mb-6">
                Amount paid: <span className="text-foreground font-bold">₹{participationMode === 'EVENT_ACCESS' ? baseFee : totalFee}</span>
                {participationMode !== 'EVENT_ACCESS' && <> for {teamSize} {teamSize > 1 ? 'members' : 'member'}</>}
              </p>
              <div className="flex gap-3 justify-center">
                <Link href="/competition/dashboard">
                  <Button>Go to Dashboard</Button>
                </Link>
                <Link href="/competition">
                  <Button variant="outline">View Competition</Button>
                </Link>
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />

      <div className="min-h-screen bg-background pt-24 pb-16 px-4">
        <div className="max-w-3xl mx-auto">
          <Link href="/competition/dashboard" className="inline-flex items-center gap-2 text-sm text-muted hover:text-foreground mb-6 transition-colors">
            <ArrowLeftIcon className="w-4 h-4" />
            Back to Dashboard
          </Link>

          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              {step === 0 ? 'Choose Participation Mode' : step === 4 ? 'Event Access Payment' : 'Submit Your Idea'}
            </h1>
            <p className="text-muted">
              {step === 0
                ? 'Select how you want to participate in the competition'
                : step === 4
                  ? 'Complete payment to get your event access pass'
                  : 'Fill out your startup idea, add team members, and complete payment'}
            </p>
          </div>

          {/* Step indicator — only for idea submission flow */}
          {participationMode === 'IDEA_SUBMISSION' && step >= 1 && step <= 3 && (
          <div className="flex items-center justify-center gap-0 mb-8">
            {[
              { num: 1, label: 'Idea Details', icon: LightBulbIcon },
              { num: 2, label: 'Team', icon: UserGroupIcon },
              { num: 3, label: 'Review & Pay', icon: CurrencyRupeeIcon },
            ].map((s, i, arr) => (
              <div key={s.num} className="flex items-center">
                <button
                  type="button"
                  onClick={() => { if (s.num < step) setStep(s.num); }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    step === s.num
                      ? 'bg-purple text-white'
                      : step > s.num
                        ? 'bg-green-400/10 text-green-400 cursor-pointer'
                        : 'bg-card text-muted'
                  }`}
                >
                  {step > s.num ? (
                    <CheckCircleIcon className="w-4 h-4" />
                  ) : (
                    <s.icon className="w-4 h-4" />
                  )}
                  <span className="hidden sm:inline">{s.label}</span>
                  <span className="sm:hidden">{s.num}</span>
                </button>
                {i < arr.length - 1 && (
                  <div className={`w-8 md:w-16 h-0.5 mx-1 ${step > s.num ? 'bg-green-400' : 'bg-border'}`} />
                )}
              </div>
            ))}
          </div>
          )}

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-400/10 text-red-400 border border-red-400/20 text-sm">
              {error}
            </div>
          )}

          <AnimatePresence mode="wait">
            {/* Step 0: Choose Participation Mode */}
            {step === 0 && (
              <motion.div key="step0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Idea Submission Card */}
                  <button
                    type="button"
                    onClick={() => handleModeSelect('IDEA_SUBMISSION')}
                    className="text-left group"
                  >
                    <Card className="p-6 md:p-8 h-full border-2 border-transparent hover:border-purple transition-all duration-300 cursor-pointer group-focus:border-purple">
                      <div className="w-14 h-14 bg-purple/10 rounded-2xl flex items-center justify-center mb-5">
                        <LightBulbIcon className="w-7 h-7 text-purple" />
                      </div>
                      <h3 className="text-xl font-bold text-foreground mb-2">Idea Submission</h3>
                      <p className="text-muted text-sm mb-4">
                        Submit your startup idea, form a team, and compete for prizes. Includes full event access.
                      </p>
                      <ul className="space-y-2 text-sm text-muted">
                        <li className="flex items-center gap-2">
                          <CheckCircleIcon className="w-4 h-4 text-green-400 flex-shrink-0" />
                          Submit &amp; pitch your startup idea
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircleIcon className="w-4 h-4 text-green-400 flex-shrink-0" />
                          Compete for prizes &amp; recognition
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircleIcon className="w-4 h-4 text-green-400 flex-shrink-0" />
                          Add team members
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircleIcon className="w-4 h-4 text-green-400 flex-shrink-0" />
                          Full event access included
                        </li>
                      </ul>
                      <div className="mt-5 pt-4 border-t border-border">
                        <p className="text-sm text-muted">Starting from</p>
                        <p className="text-2xl font-bold text-foreground">₹{participantType === 'STUDENT' ? studentFee : founderFee}<span className="text-sm font-normal text-muted"> / member</span></p>
                      </div>
                    </Card>
                  </button>

                  {/* Event Access Card */}
                  <button
                    type="button"
                    onClick={() => handleModeSelect('EVENT_ACCESS')}
                    className="text-left group"
                  >
                    <Card className="p-6 md:p-8 h-full border-2 border-transparent hover:border-amber-400 transition-all duration-300 cursor-pointer group-focus:border-amber-400">
                      <div className="w-14 h-14 bg-amber-400/10 rounded-2xl flex items-center justify-center mb-5">
                        <TicketIcon className="w-7 h-7 text-amber-400" />
                      </div>
                      <h3 className="text-xl font-bold text-foreground mb-2">Event Access</h3>
                      <p className="text-muted text-sm mb-4">
                        Get your event access pass to attend sessions, workshops, and networking events.
                      </p>
                      <ul className="space-y-2 text-sm text-muted">
                        <li className="flex items-center gap-2">
                          <CheckCircleIcon className="w-4 h-4 text-green-400 flex-shrink-0" />
                          Attend all sessions &amp; workshops
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircleIcon className="w-4 h-4 text-green-400 flex-shrink-0" />
                          Network with founders &amp; mentors
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircleIcon className="w-4 h-4 text-green-400 flex-shrink-0" />
                          Access to all event activities
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircleIcon className="w-4 h-4 text-green-400 flex-shrink-0" />
                          Quick &amp; easy registration
                        </li>
                      </ul>
                      <div className="mt-5 pt-4 border-t border-border">
                        <p className="text-sm text-muted">Fixed price</p>
                        <p className="text-2xl font-bold text-foreground">₹{participantType === 'STUDENT' ? studentFee : founderFee}<span className="text-sm font-normal text-muted"> / person</span></p>
                      </div>
                    </Card>
                  </button>
                </div>
              </motion.div>
            )}

            {/* Step 4: Event Access Payment */}
            {step === 4 && (
              <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <Card className="p-6 md:p-8 max-w-lg mx-auto">
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-amber-400/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <TicketIcon className="w-8 h-8 text-amber-400" />
                    </div>
                    <h2 className="text-xl font-bold text-foreground mb-1">Event Access Pass</h2>
                    <p className="text-muted text-sm">Complete payment to confirm your event access</p>
                  </div>

                  <div className="bg-card-hover rounded-xl p-5 mb-6 space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted">Participant Type</span>
                      <span className="text-foreground font-medium capitalize">{participantType?.toLowerCase()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted">Access Type</span>
                      <span className="text-foreground font-medium">Event Access Pass</span>
                    </div>
                    <div className="border-t border-border pt-3 flex justify-between">
                      <span className="text-foreground font-semibold">Total Amount</span>
                      <span className="text-2xl font-bold text-purple">₹{baseFee}</span>
                    </div>
                  </div>

                  <Button
                    onClick={handleEventAccessPay}
                    disabled={loading}
                    className="w-full"
                  >
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Processing...
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-2">
                        <CurrencyRupeeIcon className="w-5 h-5" />
                        Pay ₹{baseFee}
                      </div>
                    )}
                  </Button>

                  <button
                    type="button"
                    onClick={() => { setStep(0); setParticipationMode(''); }}
                    className="w-full mt-3 text-sm text-muted hover:text-foreground transition-colors text-center"
                  >
                    ← Change participation mode
                  </button>
                </Card>
              </motion.div>
            )}

            {/* Step 1: Idea Details */}
            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <Card className="p-6 md:p-8">
                  <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
                    <LightBulbIcon className="w-5 h-5 text-amber-400" />
                    Your Startup Idea
                  </h2>

                  <div className="space-y-5">
                    <Input
                      label="Idea / Startup Title *"
                      value={idea.ideaTitle}
                      onChange={(e) => updateIdea('ideaTitle', e.target.value)}
                      error={errors.ideaTitle}
                      placeholder="e.g., AI-Powered Crop Health Monitor"
                    />

                    <Textarea
                      label="Brief Description *"
                      value={idea.ideaDescription}
                      onChange={(e) => updateIdea('ideaDescription', e.target.value)}
                      error={errors.ideaDescription}
                      placeholder="Describe your idea in 2-3 sentences (min 50 characters)"
                      rows={3}
                    />

                    <Select
                      label="Category *"
                      value={idea.ideaCategory}
                      onChange={(e) => updateIdea('ideaCategory', e.target.value)}
                      error={errors.ideaCategory}
                      options={[{ value: '', label: 'Select Category' }, ...CATEGORIES.map((c) => ({ value: c, label: c }))]}
                    />

                    <Textarea
                      label="Problem Statement *"
                      value={idea.problemStatement}
                      onChange={(e) => updateIdea('problemStatement', e.target.value)}
                      error={errors.problemStatement}
                      placeholder="What problem does your idea solve?"
                      rows={3}
                    />

                    <Textarea
                      label="Your Solution *"
                      value={idea.solution}
                      onChange={(e) => updateIdea('solution', e.target.value)}
                      error={errors.solution}
                      placeholder="How does your idea solve the problem?"
                      rows={3}
                    />

                    <Input
                      label="Target Audience (optional)"
                      value={idea.targetAudience}
                      onChange={(e) => updateIdea('targetAudience', e.target.value)}
                      placeholder="e.g., Small-scale farmers in India"
                    />

                    <Textarea
                      label="What makes your idea unique? (optional)"
                      value={idea.uniqueness}
                      onChange={(e) => updateIdea('uniqueness', e.target.value)}
                      placeholder="What differentiates you from existing solutions?"
                      rows={2}
                    />

                    <Select
                      label="Product Stage (optional)"
                      value={idea.productStage}
                      onChange={(e) => updateIdea('productStage', e.target.value)}
                      options={[{ value: '', label: 'Select Stage' }, ...PRODUCT_STAGES]}
                    />

                    <div className="grid md:grid-cols-2 gap-4">
                      <Input
                        label="Pitch Deck URL (optional)"
                        value={idea.pitchDeck}
                        onChange={(e) => updateIdea('pitchDeck', e.target.value)}
                        placeholder="Link to your presentation"
                      />
                      <Input
                        label="Demo Video URL (optional)"
                        value={idea.demoVideo}
                        onChange={(e) => updateIdea('demoVideo', e.target.value)}
                        placeholder="YouTube / Loom link"
                      />
                    </div>
                  </div>

                  <div className="flex justify-between mt-8">
                    <button
                      type="button"
                      onClick={() => { setStep(0); setParticipationMode(''); }}
                      className="text-sm text-muted hover:text-foreground transition-colors"
                    >
                      ← Change participation mode
                    </button>
                    <Button onClick={() => goToStep(2)}>
                      Next: Team Details
                      <ArrowRightIcon className="w-4 h-4 ml-2 inline" />
                    </Button>
                  </div>
                </Card>
              </motion.div>
            )}

            {/* Step 2: Team Details */}
            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <Card className="p-6 md:p-8">
                  <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
                    <UserGroupIcon className="w-5 h-5 text-blue" />
                    Team Information
                  </h2>

                  {/* Team size selector */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-foreground mb-2">
                      How many members are attending? (including you)
                    </label>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => handleTeamSizeChange(teamSize - 1)}
                        disabled={teamSize <= 1}
                        className="w-10 h-10 rounded-xl border border-border bg-card text-foreground flex items-center justify-center disabled:opacity-30 hover:bg-muted/10 transition"
                      >
                        −
                      </button>
                      <div className="w-16 h-10 rounded-xl border border-border bg-card flex items-center justify-center text-lg font-bold text-foreground">
                        {teamSize}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleTeamSizeChange(teamSize + 1)}
                        disabled={teamSize >= 10}
                        className="w-10 h-10 rounded-xl border border-border bg-card text-foreground flex items-center justify-center disabled:opacity-30 hover:bg-muted/10 transition"
                      >
                        +
                      </button>
                      <span className="text-sm text-muted ml-2">Max 10</span>
                    </div>
                  </div>

                  {/* Fee preview */}
                  <div className="p-4 rounded-xl bg-purple/5 border border-purple/20 mb-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {participantType === 'STUDENT' ? (
                          <AcademicCapIcon className="w-5 h-5 text-blue" />
                        ) : (
                          <BriefcaseIcon className="w-5 h-5 text-purple" />
                        )}
                        <span className="text-sm text-muted">
                          ₹{baseFee} × {teamSize} {teamSize > 1 ? 'members' : 'member'}
                        </span>
                      </div>
                      <span className="text-xl font-bold text-foreground">₹{totalFee}</span>
                    </div>
                  </div>

                  {/* Team leader (always shown as yourself) */}
                  <div className="p-4 rounded-xl bg-card border border-border mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-purple/20 flex items-center justify-center text-sm font-bold text-purple">
                        {user?.firstName?.[0] || 'Y'}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-foreground text-sm">{user?.firstName} {user?.lastName}</p>
                        <p className="text-xs text-muted">{user?.email}</p>
                      </div>
                      <span className="text-xs bg-purple/10 text-purple px-2 py-1 rounded-full">Team Leader (You)</span>
                    </div>
                  </div>

                  {/* Team name (if team > 1) */}
                  {teamSize > 1 && (
                    <div className="mb-6">
                      <Input
                        label="Team Name *"
                        value={teamName}
                        onChange={(e) => { setTeamName(e.target.value); setErrors((p) => ({ ...p, teamName: '' })); }}
                        error={errors.teamName}
                        placeholder="e.g., Team Innovators"
                      />
                    </div>
                  )}

                  {/* Team members */}
                  {teamSize > 1 && (
                    <div className="space-y-4">
                      <p className="text-sm font-medium text-foreground">Team Members</p>
                      {teamMembers.map((member, i) => (
                        <div key={i} className="p-4 rounded-xl border border-border bg-card/50 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-foreground">Member {i + 2}</span>
                            <button
                              type="button"
                              onClick={() => removeMember(i)}
                              className="text-red-400 hover:text-red-300 transition"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="grid md:grid-cols-3 gap-3">
                            <Input
                              label="Full Name *"
                              value={member.name}
                              onChange={(e) => updateTeamMember(i, 'name', e.target.value)}
                              error={errors[`member_${i}_name`]}
                              placeholder="Full name"
                            />
                            <Input
                              label="Email *"
                              type="email"
                              value={member.email}
                              onChange={(e) => updateTeamMember(i, 'email', e.target.value)}
                              error={errors[`member_${i}_email`]}
                              placeholder="email@example.com"
                            />
                            <Input
                              label="Role (optional)"
                              value={member.role}
                              onChange={(e) => updateTeamMember(i, 'role', e.target.value)}
                              placeholder="e.g., Developer"
                            />
                          </div>
                        </div>
                      ))}

                      {teamSize < 10 && (
                        <button
                          type="button"
                          onClick={addMember}
                          className="w-full p-3 rounded-xl border-2 border-dashed border-border hover:border-purple/40 text-muted hover:text-purple transition flex items-center justify-center gap-2 text-sm"
                        >
                          <PlusIcon className="w-4 h-4" />
                          Add Another Member
                        </button>
                      )}
                    </div>
                  )}

                  <div className="flex justify-between mt-8">
                    <Button variant="outline" onClick={() => setStep(1)}>
                      <ArrowLeftIcon className="w-4 h-4 mr-2 inline" />
                      Back
                    </Button>
                    <Button onClick={() => goToStep(3)}>
                      Next: Review & Pay
                      <ArrowRightIcon className="w-4 h-4 ml-2 inline" />
                    </Button>
                  </div>
                </Card>
              </motion.div>
            )}

            {/* Step 3: Review & Pay */}
            {step === 3 && (
              <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <div className="space-y-6">
                  {/* Idea Summary */}
                  <Card className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                        <LightBulbIcon className="w-5 h-5 text-amber-400" />
                        Idea Summary
                      </h3>
                      <button type="button" onClick={() => setStep(1)} className="text-sm text-purple hover:underline">
                        Edit
                      </button>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between py-1.5 border-b border-border">
                        <span className="text-muted">Title</span>
                        <span className="text-foreground font-medium text-right max-w-[60%]">{idea.ideaTitle}</span>
                      </div>
                      <div className="flex justify-between py-1.5 border-b border-border">
                        <span className="text-muted">Category</span>
                        <span className="text-foreground font-medium">{idea.ideaCategory}</span>
                      </div>
                      {idea.productStage && (
                        <div className="flex justify-between py-1.5 border-b border-border">
                          <span className="text-muted">Stage</span>
                          <span className="text-foreground font-medium">
                            {PRODUCT_STAGES.find((s) => s.value === idea.productStage)?.label || idea.productStage}
                          </span>
                        </div>
                      )}
                      <div className="py-1.5">
                        <span className="text-muted block mb-1">Description</span>
                        <span className="text-foreground text-xs leading-relaxed">{idea.ideaDescription}</span>
                      </div>
                    </div>
                  </Card>

                  {/* Team Summary */}
                  <Card className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                        <UserGroupIcon className="w-5 h-5 text-blue" />
                        Team — {teamSize} {teamSize > 1 ? 'Members' : 'Member'}
                      </h3>
                      <button type="button" onClick={() => setStep(2)} className="text-sm text-purple hover:underline">
                        Edit
                      </button>
                    </div>
                    <div className="space-y-2">
                      {teamName && (
                        <p className="text-sm text-muted mb-2">Team: <span className="text-foreground font-medium">{teamName}</span></p>
                      )}
                      <div className="p-3 rounded-xl bg-purple/5 border border-purple/20 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-purple/20 flex items-center justify-center text-xs font-bold text-purple">
                          {user?.firstName?.[0]}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-foreground">{user?.firstName} {user?.lastName}</p>
                          <p className="text-xs text-muted">{user?.email}</p>
                        </div>
                        <span className="text-xs text-purple">Leader</span>
                      </div>
                      {teamMembers.map((m, i) => (
                        <div key={i} className="p-3 rounded-xl bg-card border border-border flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue/10 flex items-center justify-center text-xs font-bold text-blue">
                            {m.name[0]}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-foreground">{m.name}</p>
                            <p className="text-xs text-muted">{m.email}</p>
                          </div>
                          {m.role && <span className="text-xs text-muted">{m.role}</span>}
                        </div>
                      ))}
                    </div>
                  </Card>

                  {/* Payment Card */}
                  <Card className="p-6 border-purple/20">
                    <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                      <CurrencyRupeeIcon className="w-5 h-5 text-green-400" />
                      Payment Summary
                    </h3>
                    <div className="space-y-2 text-sm mb-6">
                      <div className="flex justify-between py-2 border-b border-border">
                        <span className="text-muted">
                          Registration Fee ({participantType === 'STUDENT' ? 'Student' : 'Professional'})
                        </span>
                        <span className="text-foreground">₹{baseFee}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-border">
                        <span className="text-muted">Team Size</span>
                        <span className="text-foreground">× {teamSize}</span>
                      </div>
                      <div className="flex justify-between py-3 text-lg font-bold">
                        <span className="text-foreground">Total Amount</span>
                        <span className="text-green-400">₹{totalFee}</span>
                      </div>
                    </div>

                    <Button
                      size="lg"
                      className="w-full"
                      onClick={handleSubmitAndPay}
                      isLoading={loading}
                      disabled={loading}
                    >
                      <RocketLaunchIcon className="w-5 h-5 mr-2 inline" />
                      {existingIdea ? `Complete Payment — ₹${totalFee}` : `Submit & Pay — ₹${totalFee}`}
                    </Button>

                    <p className="text-xs text-muted text-center mt-3">
                      Powered by Razorpay. 100% secure payment.
                    </p>
                  </Card>

                  <div className="flex justify-start">
                    <Button variant="outline" onClick={() => setStep(2)}>
                      <ArrowLeftIcon className="w-4 h-4 mr-2 inline" />
                      Back to Team
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </>
  );
}
