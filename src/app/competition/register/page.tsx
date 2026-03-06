'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Card, Button, Badge } from '@/components/ui';
import { useAuthStore } from '@/store/authStore';
import {
  AcademicCapIcon,
  LightBulbIcon,
  CheckCircleIcon,
  RocketLaunchIcon,
  ArrowLeftIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';

interface UserStartup {
  id: string;
  title: string;
  slug: string;
  status: string;
  shortDescription?: string;
  logo?: string | null;
}

interface CompetitionData {
  id: string;
  name: string;
  studentFee: number;
  founderFee: number;
  currentPhase: string;
  registrationEnd: string;
}

export default function CompetitionRegisterPage() {
  const router = useRouter();
  const { user, token, isAuthenticated } = useAuthStore();
  const [competition, setCompetition] = useState<CompetitionData | null>(null);
  const [userStartups, setUserStartups] = useState<UserStartup[]>([]);
  const [registeredStartupIds, setRegisteredStartupIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  // Registration flow state
  const [step, setStep] = useState<'role' | 'startup' | 'payment'>('role');
  const [selectedRole, setSelectedRole] = useState<'STUDENT' | 'FOUNDER' | null>(null);
  const [selectedStartup, setSelectedStartup] = useState<UserStartup | null>(null);
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  useEffect(() => {
    fetchCompetition();
  }, []);

  useEffect(() => {
    if (isAuthenticated && token) {
      fetchUserStartups();
    }
  }, [isAuthenticated, token]);

  const fetchCompetition = async () => {
    try {
      const res = await fetch('/api/competition');
      const data = await res.json();
      if (data.success) {
        setCompetition(data.data);
        // Collect already-registered startup IDs
        const registered = new Set<string>();
        for (const entry of data.data.entries || []) {
          if (entry.startup?.id) registered.add(entry.startup.id);
        }
        setRegisteredStartupIds(registered);
      }
    } catch {
      console.error('Failed to fetch competition');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserStartups = async () => {
    try {
      const res = await fetch('/api/startups?founder=me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        const approved = data.data.filter(
          (s: UserStartup) => s.status === 'APPROVED' || s.status === 'ACTIVE'
        );
        setUserStartups(approved);
      }
    } catch {
      console.error('Failed to fetch user startups');
    }
  };

  const fee = selectedRole === 'STUDENT' ? competition?.studentFee || 199 : competition?.founderFee || 499;

  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  const handlePayment = async () => {
    if (!selectedStartup || !selectedRole || !token) return;
    setProcessing(true);
    setMessage({ text: '', type: '' });

    try {
      // Step 1: Create registration order
      const res = await fetch('/api/competition/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ startupId: selectedStartup.id, registrationType: selectedRole }),
      });
      const data = await res.json();

      if (!data.success) {
        setMessage({ text: data.error || 'Failed to create order', type: 'error' });
        setProcessing(false);
        return;
      }

      // Step 2: Open Razorpay checkout
      if (typeof window !== 'undefined' && (window as any).Razorpay) {
        const options = {
          key: data.data.keyId,
          amount: data.data.amount * 100,
          currency: data.data.currency,
          name: 'Vishvakarma Hub',
          description: `Competition Registration — ${data.data.startupTitle}`,
          order_id: data.data.orderId,
          handler: async (response: any) => {
            // Verify payment
            try {
              await fetch('/api/competition/register', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                  entryId: data.data.entryId,
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                }),
              });
            } catch {
              // Payment still captured via webhook
            }
            setPaymentSuccess(true);
            setProcessing(false);
          },
          prefill: data.data.prefill,
          theme: { color: '#7C3AED' },
          modal: {
            ondismiss: () => {
              setProcessing(false);
              setMessage({ text: 'Payment was cancelled. You can try again.', type: 'error' });
            },
          },
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.on('payment.failed', (response: any) => {
          setProcessing(false);
          setMessage({ text: response?.error?.description || 'Payment failed. Please try again.', type: 'error' });
        });
        rzp.open();
      } else {
        setMessage({ text: 'Payment gateway is loading. Please try again.', type: 'error' });
        setProcessing(false);
      }
    } catch {
      setMessage({ text: 'Network error. Please try again.', type: 'error' });
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-purple border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Payment success screen
  if (paymentSuccess) {
    return (
      <div className="min-h-screen bg-background pt-24 pb-16 px-4">
        <div className="max-w-2xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <Card className="p-10 sm:p-14 text-center border-green-400/20 relative overflow-hidden">
              {/* Background glow */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[200px] bg-green-400/10 rounded-full blur-[100px]" />

              <div className="relative">
                {/* Success icon */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
                  className="w-24 h-24 rounded-full bg-gradient-to-br from-green-400/20 to-green-500/10 flex items-center justify-center mx-auto mb-8 border border-green-400/30"
                >
                  <CheckCircleIcon className="w-12 h-12 text-green-400" />
                </motion.div>

                {/* Title */}
                <motion.h1
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-3xl sm:text-4xl font-black text-foreground mb-3"
                >
                  Registration Confirmed!
                </motion.h1>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <p className="text-lg text-muted mb-2">
                    Your startup <span className="text-foreground font-bold">{selectedStartup?.title}</span> has been
                    successfully registered for the competition.
                  </p>
                  <p className="text-green-400 font-semibold text-lg mb-8">
                    Payment of ₹{fee} received ✓
                  </p>
                </motion.div>

                {/* Info card */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="bg-card/50 border border-border/50 rounded-2xl p-6 mb-8 text-left"
                >
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-blue/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-5 h-5 text-blue" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-foreground font-bold text-base mb-1">What happens next?</h3>
                      <p className="text-muted text-sm leading-relaxed">
                        Our team at <span className="text-foreground font-medium">Vishvakarma Hub</span> will review your registration and keep you updated at every stage. All important updates, screening results, and next steps will be sent to your registered email address.
                      </p>
                    </div>
                  </div>

                  <div className="border-t border-border/50 pt-4 space-y-3">
                    <div className="flex items-center gap-3 text-sm">
                      <span className="text-green-400">✓</span>
                      <span className="text-muted">Confirmation email sent to your inbox</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <span className="text-green-400">✓</span>
                      <span className="text-muted">Screening updates via email &amp; notifications</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <span className="text-green-400">✓</span>
                      <span className="text-muted">Results announced on the competition page</span>
                    </div>
                  </div>
                </motion.div>

                {/* Branding */}
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="text-xs text-muted/60 mb-8"
                >
                  Organized by <span className="text-foreground/70 font-medium">Trinetrashakti Innovations Pvt Ltd</span> — Startup India Recognized
                </motion.p>

                {/* Actions */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                  className="flex flex-col sm:flex-row gap-3 justify-center"
                >
                  <Link href="/competition">
                    <Button size="lg">View Competition</Button>
                  </Link>
                  <Link href="/dashboard">
                    <Button variant="outline" size="lg">Go to Dashboard</Button>
                  </Link>
                </motion.div>
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    );
  }

  // Not in registration phase
  if (competition && competition.currentPhase !== 'REGISTRATION') {
    return (
      <div className="min-h-screen bg-background pt-24 pb-16 px-4">
        <div className="max-w-lg mx-auto text-center">
          <Card className="p-8">
            <h1 className="text-2xl font-bold text-foreground mb-4">Registration Closed</h1>
            <p className="text-muted mb-6">Competition registration is not currently open.</p>
            <Link href="/competition"><Button>View Competition</Button></Link>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-24 pb-16 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Back link */}
        <Link href="/competition" className="inline-flex items-center gap-2 text-sm text-muted hover:text-foreground mb-6 transition-colors">
          <ArrowLeftIcon className="w-4 h-4" />
          Back to Competition
        </Link>

        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-foreground mb-2">Register for Competition</h1>
          <p className="text-muted">Complete the steps below to register your startup</p>
          {competition?.registrationEnd && (
            <p className="text-xs text-muted mt-2">Registration closes on {formatDate(competition.registrationEnd)}</p>
          )}
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-0 mb-10">
          {[
            { num: 1, label: 'Select Role', key: 'role' },
            { num: 2, label: 'Select Startup', key: 'startup' },
            { num: 3, label: 'Payment', key: 'payment' },
          ].map((s, i) => {
            const stepOrder = ['role', 'startup', 'payment'];
            const currentIdx = stepOrder.indexOf(step);
            const thisIdx = stepOrder.indexOf(s.key);
            const isActive = thisIdx === currentIdx;
            const isDone = thisIdx < currentIdx;
            return (
              <div key={s.key} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all ${
                    isDone ? 'bg-green-400 border-green-400 text-white' :
                    isActive ? 'bg-purple border-purple text-white' :
                    'bg-card border-border text-muted'
                  }`}>
                    {isDone ? <CheckCircleIcon className="w-5 h-5" /> : s.num}
                  </div>
                  <span className={`text-xs mt-1 font-medium ${isActive ? 'text-purple' : isDone ? 'text-green-400' : 'text-muted'}`}>
                    {s.label}
                  </span>
                </div>
                {i < 2 && (
                  <div className={`w-16 sm:w-24 h-0.5 mx-2 mb-5 ${isDone ? 'bg-green-400' : 'bg-border'}`} />
                )}
              </div>
            );
          })}
        </div>

        {/* Message */}
        {message.text && (
          <div className={`mb-6 p-4 rounded-xl text-sm ${
            message.type === 'success' ? 'bg-green-400/10 text-green-400 border border-green-400/20' :
            'bg-red-400/10 text-red-400 border border-red-400/20'
          }`}>
            {message.text}
          </div>
        )}

        {/* Not authenticated */}
        {!isAuthenticated && (
          <Card className="p-8 text-center">
            <RocketLaunchIcon className="w-12 h-12 text-purple mx-auto mb-4" />
            <h2 className="text-xl font-bold text-foreground mb-2">Login Required</h2>
            <p className="text-muted mb-6">You need to be logged in to register for the competition.</p>
            <div className="flex gap-3 justify-center">
              <Link href="/login"><Button>Log In</Button></Link>
              <Link href="/signup"><Button variant="outline">Create Account</Button></Link>
            </div>
          </Card>
        )}

        {/* Step 1: Select Role */}
        {isAuthenticated && step === 'role' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h2 className="text-xl font-bold text-foreground text-center mb-6">Choose Your Registration Type</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {/* Student Card */}
              <button
                onClick={() => { setSelectedRole('STUDENT'); setStep('startup'); setMessage({ text: '', type: '' }); }}
                className="text-left transition-all hover:scale-[1.02]"
              >
                <Card className={`p-6 h-full border-2 transition-colors ${
                  selectedRole === 'STUDENT' ? 'border-blue' : 'border-border hover:border-blue/40'
                }`}>
                  <div className="text-center mb-4">
                    <div className="w-16 h-16 rounded-2xl bg-blue/10 flex items-center justify-center mx-auto mb-3">
                      <AcademicCapIcon className="w-8 h-8 text-blue" />
                    </div>
                    <h3 className="text-lg font-bold text-foreground">Student</h3>
                    <p className="text-3xl font-bold text-blue mt-2">₹{competition?.studentFee || 199}</p>
                    <p className="text-xs text-muted mt-1">Valid college/university ID required</p>
                  </div>
                  <div className="space-y-2 text-sm text-muted">
                    <div className="flex items-center gap-2"><CheckCircleIcon className="w-4 h-4 text-green-400 flex-shrink-0" /><span>Full competition access</span></div>
                    <div className="flex items-center gap-2"><CheckCircleIcon className="w-4 h-4 text-green-400 flex-shrink-0" /><span>Mentorship sessions</span></div>
                    <div className="flex items-center gap-2"><CheckCircleIcon className="w-4 h-4 text-green-400 flex-shrink-0" /><span>Certificate of participation</span></div>
                  </div>
                </Card>
              </button>

              {/* Founder Card */}
              <button
                onClick={() => { setSelectedRole('FOUNDER'); setStep('startup'); setMessage({ text: '', type: '' }); }}
                className="text-left transition-all hover:scale-[1.02]"
              >
                <Card className={`p-6 h-full border-2 transition-colors ${
                  selectedRole === 'FOUNDER' ? 'border-purple' : 'border-border hover:border-purple/40'
                }`}>
                  <div className="text-center mb-4">
                    <div className="w-16 h-16 rounded-2xl bg-purple/10 flex items-center justify-center mx-auto mb-3">
                      <LightBulbIcon className="w-8 h-8 text-purple" />
                    </div>
                    <h3 className="text-lg font-bold text-foreground">Founder / Professional</h3>
                    <p className="text-3xl font-bold text-purple mt-2">₹{competition?.founderFee || 499}</p>
                    <p className="text-xs text-muted mt-1">For entrepreneurs and working professionals</p>
                  </div>
                  <div className="space-y-2 text-sm text-muted">
                    <div className="flex items-center gap-2"><CheckCircleIcon className="w-4 h-4 text-green-400 flex-shrink-0" /><span>Full competition access</span></div>
                    <div className="flex items-center gap-2"><CheckCircleIcon className="w-4 h-4 text-green-400 flex-shrink-0" /><span>Investor networking opportunity</span></div>
                    <div className="flex items-center gap-2"><CheckCircleIcon className="w-4 h-4 text-green-400 flex-shrink-0" /><span>Priority pitch slot</span></div>
                    <div className="flex items-center gap-2"><CheckCircleIcon className="w-4 h-4 text-green-400 flex-shrink-0" /><span>Certificate of participation</span></div>
                  </div>
                </Card>
              </button>
            </div>
          </motion.div>
        )}

        {/* Step 2: Select Startup */}
        {isAuthenticated && step === 'startup' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-foreground">Select Your Startup</h2>
              <button onClick={() => { setStep('role'); setSelectedStartup(null); }} className="text-sm text-purple hover:underline">
                ← Change Role
              </button>
            </div>

            <div className="mb-4 flex items-center gap-3 p-3 rounded-xl bg-purple/5 border border-purple/20">
              <Badge variant={selectedRole === 'STUDENT' ? 'info' : 'default'}>
                {selectedRole === 'STUDENT' ? 'Student' : 'Founder / Professional'}
              </Badge>
              <span className="text-sm text-muted">Registration fee: <span className="text-foreground font-bold">₹{fee}</span></span>
            </div>

            {userStartups.length === 0 ? (
              <Card className="p-8 text-center">
                <RocketLaunchIcon className="w-12 h-12 text-muted mx-auto mb-4" />
                <h3 className="text-lg font-bold text-foreground mb-2">No Approved Startups</h3>
                <p className="text-muted mb-6">You need an approved startup to register. Submit your idea first!</p>
                <Link href="/submit-idea"><Button>Submit Your Idea</Button></Link>
              </Card>
            ) : (
              <div className="space-y-3">
                {userStartups.map((startup) => {
                  const alreadyRegistered = registeredStartupIds.has(startup.id);
                  return (
                    <button
                      key={startup.id}
                      disabled={alreadyRegistered}
                      onClick={() => {
                        setSelectedStartup(startup);
                        setStep('payment');
                        setMessage({ text: '', type: '' });
                      }}
                      className={`w-full text-left p-4 rounded-xl border transition-all ${
                        alreadyRegistered
                          ? 'bg-green-400/5 border-green-400/20 cursor-not-allowed opacity-70'
                          : selectedStartup?.id === startup.id
                          ? 'bg-purple/5 border-purple/30'
                          : 'bg-card border-border hover:border-purple/30'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-purple/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
                            {startup.logo ? (
                              <img src={startup.logo} alt={startup.title} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-lg font-bold text-purple">{startup.title[0]}</span>
                            )}
                          </div>
                          <div>
                            <p className="font-semibold text-foreground">{startup.title}</p>
                            <p className="text-xs text-muted">Status: {startup.status}</p>
                          </div>
                        </div>
                        {alreadyRegistered ? (
                          <span className="flex items-center gap-1.5 text-sm text-green-400">
                            <CheckCircleIcon className="w-4 h-4" />
                            Registered
                          </span>
                        ) : (
                          <span className="text-xs text-purple font-medium">Select →</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}

        {/* Step 3: Payment Confirmation */}
        {isAuthenticated && step === 'payment' && selectedStartup && selectedRole && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-foreground">Confirm & Pay</h2>
              <button onClick={() => { setStep('startup'); }} className="text-sm text-purple hover:underline">
                ← Change Startup
              </button>
            </div>

            <Card className="p-6 mb-6">
              <h3 className="text-lg font-bold text-foreground mb-4">Registration Summary</h3>

              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-border">
                  <span className="text-sm text-muted">Competition</span>
                  <span className="text-sm font-medium text-foreground">{competition?.name}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-border">
                  <span className="text-sm text-muted">Startup</span>
                  <span className="text-sm font-medium text-foreground">{selectedStartup.title}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-border">
                  <span className="text-sm text-muted">Registration Type</span>
                  <Badge variant={selectedRole === 'STUDENT' ? 'info' : 'default'}>
                    {selectedRole === 'STUDENT' ? 'Student' : 'Founder / Professional'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-border">
                  <span className="text-sm text-muted">Registered By</span>
                  <span className="text-sm font-medium text-foreground">{user?.firstName} {user?.lastName}</span>
                </div>
                <div className="flex items-center justify-between py-3">
                  <span className="text-base font-bold text-foreground">Total Amount</span>
                  <span className="text-2xl font-bold text-purple">₹{fee}</span>
                </div>
              </div>
            </Card>

            {/* Payment benefits */}
            <Card className="p-4 mb-6 border-green-400/20 bg-green-400/5">
              <div className="flex items-start gap-3">
                <ShieldCheckIcon className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-muted">
                  <p className="font-medium text-foreground mb-1">Secure Payment via Razorpay</p>
                  <p>Your payment is processed securely. Registration is confirmed instantly upon successful payment.</p>
                </div>
              </div>
            </Card>

            <Button
              size="lg"
              className="w-full"
              onClick={handlePayment}
              isLoading={processing}
              disabled={processing}
            >
              <ShieldCheckIcon className="w-5 h-5 mr-2 inline" />
              Pay ₹{fee} & Register
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
