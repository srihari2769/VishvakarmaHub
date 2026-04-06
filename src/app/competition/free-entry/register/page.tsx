'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Card, Button, Input, Select } from '@/components/ui';
import { useAuthStore } from '@/store/authStore';
import {
  AcademicCapIcon,
  BriefcaseIcon,
  GiftIcon,
  EyeIcon,
  EyeSlashIcon,
  ArrowLeftIcon,
} from '@heroicons/react/24/outline';

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

export default function FreeEntryRegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center"><div className="w-8 h-8 border-2 border-green-400 border-t-transparent rounded-full animate-spin" /></div>}>
      <FreeEntryRegisterForm />
    </Suspense>
  );
}

function FreeEntryRegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const ref = searchParams.get('ref') || '';
  const { setUser } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    participantType: '',
    college: '',
    company: '',
    designation: '',
    city: '',
    state: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
    setError('');
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!form.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!form.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!form.email.trim()) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) newErrors.email = 'Invalid email';
    if (!form.password) newErrors.password = 'Password is required';
    else if (form.password.length < 8) newErrors.password = 'Min 8 characters';
    else if (!/[A-Z]/.test(form.password)) newErrors.password = 'Need an uppercase letter';
    else if (!/[a-z]/.test(form.password)) newErrors.password = 'Need a lowercase letter';
    else if (!/[0-9]/.test(form.password)) newErrors.password = 'Need a number';
    if (form.password !== form.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    if (!form.phone.trim()) newErrors.phone = 'Phone number is required';
    else if (!/^[6-9]\d{9}$/.test(form.phone.replace(/\s/g, ''))) newErrors.phone = 'Invalid Indian phone number';
    if (!form.participantType) newErrors.participantType = 'Select participant type';
    if (form.participantType === 'STUDENT' && !form.college.trim()) newErrors.college = 'College/University is required';
    if (!form.city.trim()) newErrors.city = 'City is required';
    if (!form.state) newErrors.state = 'State is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setError('');

    try {
      const url = ref
        ? `/api/competition/free-entry/auth/register?ref=${encodeURIComponent(ref)}`
        : '/api/competition/free-entry/auth/register';

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (!data.success) {
        setError(data.error || 'Registration failed');
        setLoading(false);
        return;
      }

      setUser(data.data.user, data.data.token, 'vic');
      router.push('/competition/free-entry/dashboard');
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pt-24 pb-16 px-4">
      <div className="max-w-2xl mx-auto">
        <Link href="/competition/free-entry" className="inline-flex items-center gap-2 text-sm text-muted hover:text-foreground mb-6 transition-colors">
          <ArrowLeftIcon className="w-4 h-4" />
          Back to Free Entry
        </Link>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-green-400/10 border border-green-400/20 text-green-400 text-sm font-medium mb-4">
              <GiftIcon className="w-4 h-4" />
              Free Entry Registration
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Create Your Account</h1>
            <p className="text-muted">Register to start your free entry journey</p>
          </div>

          {ref && (
            <div className="mb-6 p-4 rounded-xl bg-purple/10 text-purple border border-purple/20 text-sm text-center">
              You were referred! Your registration will count towards the referrer&apos;s free entry goal.
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-400/10 text-red-400 border border-red-400/20 text-sm">
              {error}
            </div>
          )}

          <Card className="p-6 md:p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Name */}
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

              {/* Email */}
              <Input
                label="Email Address"
                type="email"
                value={form.email}
                onChange={(e) => updateField('email', e.target.value)}
                error={errors.email}
                placeholder="your@email.com"
              />

              {/* Phone */}
              <Input
                label="Phone Number"
                type="tel"
                value={form.phone}
                onChange={(e) => updateField('phone', e.target.value)}
                error={errors.phone}
                placeholder="9876543210"
              />

              {/* Participant Type */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">I am a</label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => updateField('participantType', 'STUDENT')}
                    className={`p-4 rounded-xl border-2 transition-all text-left ${
                      form.participantType === 'STUDENT'
                        ? 'border-blue bg-blue/5'
                        : 'border-border hover:border-blue/40'
                    }`}
                  >
                    <AcademicCapIcon className={`w-8 h-8 mb-2 ${form.participantType === 'STUDENT' ? 'text-blue' : 'text-muted'}`} />
                    <p className="font-semibold text-foreground">Student</p>
                    <p className="text-xs text-muted">College / University</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => updateField('participantType', 'PROFESSIONAL')}
                    className={`p-4 rounded-xl border-2 transition-all text-left ${
                      form.participantType === 'PROFESSIONAL'
                        ? 'border-purple bg-purple/5'
                        : 'border-border hover:border-purple/40'
                    }`}
                  >
                    <BriefcaseIcon className={`w-8 h-8 mb-2 ${form.participantType === 'PROFESSIONAL' ? 'text-purple' : 'text-muted'}`} />
                    <p className="font-semibold text-foreground">Professional</p>
                    <p className="text-xs text-muted">Working / Founder</p>
                  </button>
                </div>
                {errors.participantType && <p className="text-red-400 text-xs mt-1">{errors.participantType}</p>}
              </div>

              {/* College (for students) */}
              {form.participantType === 'STUDENT' && (
                <Input
                  label="College / University"
                  value={form.college}
                  onChange={(e) => updateField('college', e.target.value)}
                  error={errors.college}
                  placeholder="e.g., IIT Delhi"
                />
              )}

              {/* Company (for professionals) */}
              {form.participantType === 'PROFESSIONAL' && (
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Company (optional)"
                    value={form.company}
                    onChange={(e) => updateField('company', e.target.value)}
                    placeholder="e.g., Google India"
                  />
                  <Input
                    label="Designation (optional)"
                    value={form.designation}
                    onChange={(e) => updateField('designation', e.target.value)}
                    placeholder="e.g., Software Engineer"
                  />
                </div>
              )}

              {/* City & State */}
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="City"
                  value={form.city}
                  onChange={(e) => updateField('city', e.target.value)}
                  error={errors.city}
                  placeholder="e.g., Hyderabad"
                />
                <Select
                  label="State"
                  value={form.state}
                  onChange={(e) => updateField('state', e.target.value)}
                  error={errors.state}
                  options={[{ value: '', label: 'Select State' }, ...STATES.map((s) => ({ value: s, label: s }))]}
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={(e) => updateField('password', e.target.value)}
                    placeholder="Min 8 chars, uppercase, lowercase, number"
                    className="w-full px-4 py-3 rounded-xl border border-border bg-card text-foreground placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-green-400/50 pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground"
                  >
                    {showPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                  </button>
                </div>
                {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password}</p>}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Confirm Password</label>
                <input
                  type="password"
                  value={form.confirmPassword}
                  onChange={(e) => updateField('confirmPassword', e.target.value)}
                  placeholder="Repeat your password"
                  className="w-full px-4 py-3 rounded-xl border border-border bg-card text-foreground placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-green-400/50"
                />
                {errors.confirmPassword && <p className="text-red-400 text-xs mt-1">{errors.confirmPassword}</p>}
              </div>

              {/* Submit */}
              <Button type="submit" size="lg" className="w-full" isLoading={loading} disabled={loading}>
                Register for Free Entry
              </Button>

              <p className="text-center text-sm text-muted">
                Already registered?{' '}
                <Link href="/competition/free-entry/login" className="text-green-400 hover:underline font-medium">
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
