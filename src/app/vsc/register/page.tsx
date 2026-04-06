'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Card, Button, Input, Select } from '@/components/ui';
import { useAuthStore } from '@/store/authStore';
import {
  ArrowLeftIcon,
  FireIcon,
  CheckCircleIcon,
  ShareIcon,
  EyeIcon,
  EyeSlashIcon,
} from '@heroicons/react/24/outline';

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Razorpay: any;
  }
}

const STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
  'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Delhi', 'Jammu & Kashmir', 'Ladakh', 'Puducherry',
  'Chandigarh', 'Andaman & Nicobar', 'Dadra & Nagar Haveli', 'Daman & Diu', 'Lakshadweep',
];

export default function VSCRegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500" /></div>}>
      <VSCRegisterContent />
    </Suspense>
  );
}

function VSCRegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, user, token, setUser } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [referralCode, setReferralCode] = useState('');
  const [entryFee, setEntryFee] = useState(99);
  const [attemptInfo, setAttemptInfo] = useState<{ attempt: number; fee: number } | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [currentToken, setCurrentToken] = useState<string | null>(token);
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    college: '',
    city: '',
    state: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Get referral code from URL
  useEffect(() => {
    const ref = searchParams.get('ref');
    if (ref) setReferralCode(ref);
  }, [searchParams]);

  // Pre-fill user data if already logged in
  useEffect(() => {
    if (user) {
      setForm(prev => ({
        ...prev,
        firstName: user.firstName || prev.firstName,
        lastName: user.lastName || prev.lastName,
        email: user.email || prev.email,
      }));
    }
  }, [user]);

  // Keep currentToken in sync
  useEffect(() => {
    setCurrentToken(token);
  }, [token]);

  // Fetch current attempt info if already logged in
  useEffect(() => {
    if (!currentToken) return;
    fetch('/api/vsc')
      .then(r => r.json())
      .then(d => {
        if (d.success && d.data) {
          const challenge = d.data;
          fetch('/api/vsc/participant', { headers: { Authorization: `Bearer ${currentToken}` } })
            .then(r => r.json())
            .then(pd => {
              if (pd.success && pd.data?.participant) {
                const attempt = pd.data.participant.attemptNumber + 1;
                let fee = challenge.entryFee;
                if (attempt === 2) fee = challenge.secondChanceFee;
                if (attempt >= 3) fee = challenge.thirdChanceFee;
                setAttemptInfo({ attempt, fee });
                setEntryFee(fee);
              } else {
                setEntryFee(challenge.entryFee || 99);
              }
            })
            .catch(() => {});
        }
      })
      .catch(() => {});
  }, [currentToken]);

  const updateField = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: '' }));
    setError('');
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!isAuthenticated) {
      if (!form.firstName.trim()) newErrors.firstName = 'First name is required';
      if (!form.lastName.trim()) newErrors.lastName = 'Last name is required';
      if (!form.password) newErrors.password = 'Password is required';
      else if (form.password.length < 8) newErrors.password = 'Min 8 characters';
      else if (!/[A-Z]/.test(form.password)) newErrors.password = 'Need an uppercase letter';
      else if (!/[a-z]/.test(form.password)) newErrors.password = 'Need a lowercase letter';
      else if (!/[0-9]/.test(form.password)) newErrors.password = 'Need a number';
      if (form.password !== form.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    }
    if (!form.email.trim()) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) newErrors.email = 'Invalid email';
    if (!form.phone.trim()) newErrors.phone = 'Phone number is required';
    else if (!/^[6-9]\d{9}$/.test(form.phone.replace(/\s/g, ''))) newErrors.phone = 'Invalid Indian phone number';
    if (!form.city.trim()) newErrors.city = 'City is required';
    if (!form.state) newErrors.state = 'State is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegisterAndPay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setError('');

    let authToken = currentToken;

    try {
      // Step 1: If not logged in, create account first
      if (!isAuthenticated) {
        const regRes = await fetch('/api/vsc/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            firstName: form.firstName,
            lastName: form.lastName,
            email: form.email,
            password: form.password,
            phone: form.phone,
            college: form.college || undefined,
            city: form.city,
            state: form.state,
          }),
        });

        const regData = await regRes.json();
        if (!regData.success) {
          setError(regData.error || 'Account creation failed');
          setLoading(false);
          return;
        }

        setUser(regData.data.user, regData.data.token, 'vsc');
        authToken = regData.data.token;
        setCurrentToken(authToken);
      }

      // Step 2: Register for VSC and create Razorpay order
      const name = isAuthenticated
        ? `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || form.firstName + ' ' + form.lastName
        : `${form.firstName} ${form.lastName}`;

      const res = await fetch('/api/vsc', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          name,
          phone: form.phone,
          email: form.email,
          college: form.college || undefined,
          city: form.city,
          state: form.state,
          referralBy: referralCode || undefined,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        setError(data.error || 'Registration failed');
        setLoading(false);
        return;
      }

      const d = data.data;

      // Step 3: Open Razorpay checkout
      const options = {
        key: d.keyId,
        amount: d.amount * 100,
        currency: d.currency,
        name: 'Vishvakarma Hub',
        description: `Vishvakarma Survival Challenge — Entry #${d.participant.attemptNumber}`,
        order_id: d.orderId,
        prefill: d.prefill,
        handler: async (response: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) => {
          const verifyRes = await fetch('/api/vsc', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${authToken}`,
            },
            body: JSON.stringify({
              participantId: d.participant.id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            }),
          });

          const verifyData = await verifyRes.json();
          if (verifyData.success) {
            setSuccess(true);
            setReferralCode(d.participant.referralCode || '');
          } else {
            setError('Payment verification failed. Please contact support.');
          }
          setLoading(false);
        },
        modal: {
          ondismiss: () => {
            setError('Payment was cancelled. Please try again.');
            setLoading(false);
          },
        },
        theme: { color: '#ef4444' },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch {
      setError('Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  // Success state
  if (success) {
    return (
      <div className="min-h-screen bg-[#050508] pt-24 pb-16 px-4">
        <div className="max-w-lg mx-auto text-center">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
            <div className="w-20 h-20 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center mx-auto mb-6">
              <CheckCircleIcon className="w-10 h-10 text-green-400" />
            </div>
            <h1 className="text-3xl font-black text-white mb-3">You&apos;re In! 🔥</h1>
            <p className="text-white/50 mb-8">Welcome to the Vishvakarma Survival Challenge. The arena awaits.</p>

            {referralCode && (
              <Card className="p-6 bg-white/[0.02] border-white/10 mb-6">
                <div className="flex items-center gap-2 text-amber-400 text-sm font-bold mb-2">
                  <ShareIcon className="w-4 h-4" />
                  Your Referral Code
                </div>
                <div className="text-2xl font-mono font-bold text-white mb-3">{referralCode}</div>
                <p className="text-xs text-white/40 mb-4">Share this with friends — build the movement!</p>
                <Button
                  onClick={() => {
                    const url = `https://www.vishvakarmahub.com/vsc/register?ref=${referralCode}`;
                    navigator.clipboard.writeText(url);
                  }}
                  className="w-full bg-amber-500/10 border border-amber-500/20 text-amber-400 hover:bg-amber-500/20"
                >
                  Copy Referral Link
                </Button>
              </Card>
            )}

            <div className="flex flex-col gap-3">
              <Link href="/vsc/dashboard">
                <Button className="w-full bg-gradient-to-r from-red-600 to-orange-500 text-white font-bold">
                  Go to Dashboard
                </Button>
              </Link>
              <Link href="/vsc">
                <Button variant="outline" className="w-full border-white/10 text-white/50">
                  Back to Challenge
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050508] pt-24 pb-16 px-4">
      <div className="max-w-2xl mx-auto">
        <Link href="/vsc" className="inline-flex items-center gap-2 text-sm text-white/40 hover:text-white/70 mb-6 transition-colors">
          <ArrowLeftIcon className="w-4 h-4" />
          Back to Challenge
        </Link>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium mb-4">
              <FireIcon className="w-4 h-4" />
              Enter the Arena
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Register for VSC</h1>
            <p className="text-white/40">
              {attemptInfo
                ? `Attempt #${attemptInfo.attempt} — Entry fee: ₹${attemptInfo.fee}`
                : `Entry fee: ₹${entryFee}`}
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-400/10 text-red-400 border border-red-400/20 text-sm">
              {error}
            </div>
          )}

          <Card className="p-6 md:p-8 bg-white/[0.02] border-white/10">
            <form onSubmit={handleRegisterAndPay} className="space-y-5">
              {/* Account fields — only for new users */}
              {!isAuthenticated && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="First Name"
                      value={form.firstName}
                      onChange={(e) => updateField('firstName', e.target.value)}
                      error={errors.firstName}
                      placeholder="First name"
                    />
                    <Input
                      label="Last Name"
                      value={form.lastName}
                      onChange={(e) => updateField('lastName', e.target.value)}
                      error={errors.lastName}
                      placeholder="Last name"
                    />
                  </div>
                </>
              )}

              <Input
                label="Email Address"
                type="email"
                value={form.email}
                onChange={(e) => updateField('email', e.target.value)}
                error={errors.email}
                placeholder="your@email.com"
                disabled={isAuthenticated}
              />

              {/* Password fields — only for new users */}
              {!isAuthenticated && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-white mb-1">Password</label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={form.password}
                        onChange={(e) => updateField('password', e.target.value)}
                        placeholder="Min 8 chars, uppercase, lowercase, number"
                        className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/[0.03] text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-red-500/50 pr-12"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60"
                      >
                        {showPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                      </button>
                    </div>
                    {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white mb-1">Confirm Password</label>
                    <input
                      type="password"
                      value={form.confirmPassword}
                      onChange={(e) => updateField('confirmPassword', e.target.value)}
                      placeholder="Repeat your password"
                      className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/[0.03] text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-red-500/50"
                    />
                    {errors.confirmPassword && <p className="text-red-400 text-xs mt-1">{errors.confirmPassword}</p>}
                  </div>
                </>
              )}

              <Input
                label="Phone Number"
                type="tel"
                value={form.phone}
                onChange={(e) => updateField('phone', e.target.value)}
                error={errors.phone}
                placeholder="9876543210"
              />

              <Input
                label="College / University (Optional)"
                value={form.college}
                onChange={(e) => updateField('college', e.target.value)}
                placeholder="Your college name"
              />

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="City"
                  value={form.city}
                  onChange={(e) => updateField('city', e.target.value)}
                  error={errors.city}
                  placeholder="Your city"
                />

                <Select
                  label="State"
                  value={form.state}
                  onChange={(e) => updateField('state', e.target.value)}
                  error={errors.state}
                  options={[
                    { value: '', label: 'Select state' },
                    ...STATES.map(s => ({ value: s, label: s })),
                  ]}
                />
              </div>

              {/* Referral code */}
              <Input
                label="Referral Code (Optional)"
                value={referralCode}
                onChange={(e) => setReferralCode(e.target.value)}
                placeholder="VSC-XXXX-XXXXX"
              />

              {/* Pricing breakdown */}
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-white/50">
                    Entry Fee {attemptInfo ? `(Attempt #${attemptInfo.attempt})` : ''}
                  </span>
                  <span className="text-white font-bold text-lg">₹{entryFee}</span>
                </div>
                {attemptInfo && attemptInfo.attempt > 1 && (
                  <p className="text-xs text-green-400/60 mt-1">
                    Discounted! Original price: ₹99
                  </p>
                )}
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-gradient-to-r from-red-600 to-orange-500 text-white font-bold text-lg shadow-lg shadow-red-500/20 hover:shadow-red-500/35 transition-all disabled:opacity-50"
              >
                {loading ? 'Processing...' : `Pay ₹${entryFee} & Enter the Arena`}
              </Button>

              <p className="text-xs text-center text-white/20">
                By registering, you agree to the challenge rules. No refunds after payment.
              </p>

              <p className="text-center text-sm text-white/40">
                Already have an account?{' '}
                <Link href="/vsc/login" className="text-red-400 hover:underline font-medium">
                  Login here
                </Link>
              </p>
            </form>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
