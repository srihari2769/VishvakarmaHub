'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Card, Button, Input } from '@/components/ui';
import { useAuthStore } from '@/store/authStore';
import {
  TrophyIcon,
  EyeIcon,
  EyeSlashIcon,
  ArrowLeftIcon,
} from '@heroicons/react/24/outline';

export default function CompetitionLoginPage() {
  const router = useRouter();
  const { setUser } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ email: '', password: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      setError('Email and password are required');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/competition/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (!data.success) {
        setError(data.error || 'Login failed');
        setLoading(false);
        return;
      }

      setUser(data.data.user, data.data.token);

      if (data.data.hasCompetitionProfile) {
        router.push('/competition/dashboard');
      } else {
        // User exists but no competition profile — redirect to register
        router.push('/competition/dashboard');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pt-24 pb-16 px-4">
      <div className="max-w-md mx-auto">
        <Link href="/competition" className="inline-flex items-center gap-2 text-sm text-muted hover:text-foreground mb-6 transition-colors">
          <ArrowLeftIcon className="w-4 h-4" />
          Back to Competition
        </Link>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-sm font-medium mb-4">
              <TrophyIcon className="w-4 h-4" />
              Competition Portal
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Welcome Back</h1>
            <p className="text-muted">Login to your competition account</p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-400/10 text-red-400 border border-red-400/20 text-sm">
              {error}
            </div>
          )}

          <Card className="p-6 md:p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              <Input
                label="Email Address"
                type="email"
                value={form.email}
                onChange={(e) => { setForm((f) => ({ ...f, email: e.target.value })); setError(''); }}
                placeholder="your@email.com"
              />

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={(e) => { setForm((f) => ({ ...f, password: e.target.value })); setError(''); }}
                    placeholder="Enter your password"
                    className="w-full px-4 py-3 rounded-xl border border-border bg-card text-foreground placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-purple/50 pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground"
                  >
                    {showPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <Button type="submit" size="lg" className="w-full" isLoading={loading} disabled={loading}>
                Login
              </Button>

              <p className="text-center text-sm text-muted">
                Don&apos;t have an account?{' '}
                <Link href="/competition/register" className="text-purple hover:underline font-medium">
                  Register here
                </Link>
              </p>
            </form>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
