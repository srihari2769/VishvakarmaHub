'use client';

import { motion } from 'framer-motion';
import { Card, Button } from '@/components/ui';
import { useState } from 'react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Something went wrong');
      }

      setSubmitted(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-16 flex items-center justify-center">
      <div className="w-full max-w-md px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="p-8">
            {!submitted ? (
              <>
                <h1 className="text-2xl font-bold text-foreground text-center mb-2">
                  Reset Your Password
                </h1>
                <p className="text-muted text-center mb-6 text-sm">
                  Enter your email address and we&apos;ll send you instructions to reset your password.
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="you@example.com"
                      className="w-full px-4 py-2.5 bg-[#1a1f2e] border border-white/10 rounded-lg text-foreground placeholder:text-muted/50 focus:outline-none focus:border-blue"
                    />
                  </div>

                  {error && (
                    <p className="text-red-400 text-sm">{error}</p>
                  )}

                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'Sending...' : 'Send Reset Instructions'}
                  </Button>
                </form>

                <div className="mt-6 text-center">
                  <Link href="/login" className="text-sm text-blue hover:underline">
                    ← Back to Login
                  </Link>
                </div>
              </>
            ) : (
              <div className="text-center">
                <div className="text-5xl mb-4">📧</div>
                <h2 className="text-xl font-bold text-foreground mb-2">Check Your Email</h2>
                <p className="text-muted text-sm mb-6">
                  If an account exists for <strong className="text-foreground">{email}</strong>,
                  you will receive password reset instructions shortly.
                </p>
                <Link href="/login">
                  <Button variant="outline" className="w-full">
                    Back to Login
                  </Button>
                </Link>
              </div>
            )}
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
