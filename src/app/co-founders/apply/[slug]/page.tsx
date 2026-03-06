'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Card, Button, Textarea, Input } from '@/components/ui';
import { useAuthStore } from '@/store/authStore';
import {
  UserGroupIcon,
  RocketLaunchIcon,
  MapPinIcon,
  ArrowLeftIcon,
  PaperAirplaneIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline';

interface StartupInfo {
  id: string;
  title: string;
  slug: string;
  shortDescription: string;
  category: string;
  location: string;
  productStage: string;
  logo: string | null;
  thumbnail: string | null;
  cofounderRoles: string[];
  founder: {
    firstName: string;
    lastName: string;
    avatar: string | null;
  };
}

export default function ApplyCofounderPage({ params }: { params: Promise<{ slug: string }> }) {
  const router = useRouter();
  const { user, token, isAuthenticated } = useAuthStore();
  const [startup, setStartup] = useState<StartupInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [slug, setSlug] = useState('');

  const [form, setForm] = useState({
    role: '',
    message: '',
    experience: '',
    portfolio: '',
    linkedIn: '',
  });

  useEffect(() => {
    params.then((p) => setSlug(p.slug));
  }, [params]);

  useEffect(() => {
    if (!slug) return;
    const fetchStartup = async () => {
      try {
        const res = await fetch(`/api/startups/${slug}`);
        const data = await res.json();
        if (data.success) {
          setStartup(data.data);
        } else {
          setError('Startup not found');
        }
      } catch {
        setError('Failed to load startup');
      } finally {
        setLoading(false);
      }
    };
    fetchStartup();
  }, [slug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startup || !token) return;

    if (!form.role) {
      setError('Please select a role you want to apply for');
      return;
    }
    if (!form.message.trim()) {
      setError('Please write a message about why you want to join');
      return;
    }
    if (!form.experience.trim()) {
      setError('Please describe your relevant experience');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/cofounder-applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          startupId: startup.id,
          role: form.role,
          message: form.message.trim(),
          experience: form.experience.trim(),
          portfolio: form.portfolio.trim() || undefined,
          linkedIn: form.linkedIn.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSubmitted(true);
      } else {
        setError(data.error || 'Failed to submit application');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-purple border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen pt-24 pb-16">
        <div className="max-w-xl mx-auto px-4 text-center py-20">
          <UserGroupIcon className="w-16 h-16 text-muted mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-3">Login Required</h1>
          <p className="text-muted mb-6">You need to be logged in to apply as a co-founder.</p>
          <Link href="/login">
            <Button>Log In</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen pt-24 pb-16">
        <div className="max-w-xl mx-auto px-4 text-center py-20">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', duration: 0.5 }}>
            <CheckCircleIcon className="w-20 h-20 text-green-400 mx-auto mb-6" />
          </motion.div>
          <h1 className="text-2xl font-bold text-foreground mb-3">Application Submitted!</h1>
          <p className="text-muted mb-2">
            Your co-founder application for <span className="text-foreground font-medium">{startup?.title}</span> has been sent.
          </p>
          <p className="text-muted mb-8">
            The founder will review your application and you&apos;ll be notified of the outcome.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/co-founders">
              <Button variant="outline">Browse More Startups</Button>
            </Link>
            <Link href="/dashboard">
              <Button>My Applications</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!startup || error === 'Startup not found') {
    return (
      <div className="min-h-screen pt-24 pb-16">
        <div className="max-w-xl mx-auto px-4 text-center py-20">
          <ExclamationCircleIcon className="w-16 h-16 text-muted mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-3">Startup Not Found</h1>
          <p className="text-muted mb-6">This startup doesn&apos;t exist or is no longer looking for co-founders.</p>
          <Link href="/co-founders">
            <Button variant="outline">Back to Co-Founders</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        {/* Back Link */}
        <Link
          href="/co-founders"
          className="inline-flex items-center gap-2 text-muted hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          Back to Co-Founders
        </Link>

        {/* Startup Info Card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="p-6 mb-8">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-xl bg-card border border-border flex-shrink-0 overflow-hidden">
                {startup.logo || startup.thumbnail ? (
                  <Image
                    src={startup.logo || startup.thumbnail!}
                    alt={startup.title}
                    width={64}
                    height={64}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple/20 to-blue/20">
                    <RocketLaunchIcon className="w-8 h-8 text-muted" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-bold text-foreground mb-1">{startup.title}</h2>
                <p className="text-sm text-muted mb-2">{startup.shortDescription}</p>
                <div className="flex flex-wrap items-center gap-3 text-xs text-muted">
                  <span className="px-2 py-0.5 rounded-full bg-blue/10 text-blue border border-blue/20">
                    {startup.productStage.replace('_', ' ')}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-purple/10 text-purple border border-purple/20">
                    {startup.category}
                  </span>
                  {startup.location && (
                    <span className="flex items-center gap-1">
                      <MapPinIcon className="w-3 h-3" />
                      {startup.location}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-3">
                  <div className="w-5 h-5 rounded-full bg-purple/20 flex items-center justify-center text-purple text-[10px] font-bold overflow-hidden">
                    {startup.founder.avatar ? (
                      <Image src={startup.founder.avatar} alt="" width={20} height={20} className="object-cover" />
                    ) : (
                      startup.founder.firstName[0]
                    )}
                  </div>
                  <span className="text-xs text-muted">
                    Founded by {startup.founder.firstName} {startup.founder.lastName}
                  </span>
                </div>
              </div>
            </div>

            {/* Roles Needed */}
            <div className="mt-5 pt-5 border-t border-border">
              <p className="text-sm font-medium text-foreground mb-2">Roles they&apos;re looking for:</p>
              <div className="flex flex-wrap gap-2">
                {startup.cofounderRoles.map((role) => (
                  <span
                    key={role}
                    className="px-3 py-1 text-sm rounded-full bg-purple/10 text-purple border border-purple/20"
                  >
                    {role}
                  </span>
                ))}
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Application Form */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-purple/10 flex items-center justify-center">
                <PaperAirplaneIcon className="w-5 h-5 text-purple" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Apply as Co-Founder</h3>
                <p className="text-sm text-muted">Fill in the form to send your application to the founder.</p>
              </div>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-400">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Role Selection */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Which role are you applying for? <span className="text-red-400">*</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {startup.cofounderRoles.map((role) => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => setForm({ ...form, role })}
                      className={`px-4 py-3 rounded-xl text-sm font-medium transition-all border ${
                        form.role === role
                          ? 'bg-purple text-white border-purple shadow-lg shadow-purple/20'
                          : 'bg-card border-border text-muted hover:text-foreground hover:border-purple/30'
                      }`}
                    >
                      {role}
                    </button>
                  ))}
                </div>
              </div>

              {/* Message */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Why do you want to join this startup? <span className="text-red-400">*</span>
                </label>
                <Textarea
                  value={form.message}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setForm({ ...form, message: e.target.value })}
                  placeholder="Explain what excites you about this startup and why you'd be a great co-founder..."
                  rows={4}
                />
              </div>

              {/* Experience */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Relevant experience <span className="text-red-400">*</span>
                </label>
                <Textarea
                  value={form.experience}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setForm({ ...form, experience: e.target.value })}
                  placeholder="Describe your relevant skills, past projects, and experience that makes you a fit for this role..."
                  rows={4}
                />
              </div>

              {/* Portfolio */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Portfolio / Website
                </label>
                <Input
                  type="url"
                  value={form.portfolio}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, portfolio: e.target.value })}
                  placeholder="https://yourportfolio.com"
                />
                <p className="text-xs text-muted mt-1">Optional — Link to your portfolio, GitHub, or personal website.</p>
              </div>

              {/* LinkedIn */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  LinkedIn Profile
                </label>
                <Input
                  type="url"
                  value={form.linkedIn}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, linkedIn: e.target.value })}
                  placeholder="https://linkedin.com/in/yourprofile"
                />
                <p className="text-xs text-muted mt-1">Optional — Helps the founder know more about your professional background.</p>
              </div>

              {/* Submit */}
              <div className="flex items-center gap-4 pt-2">
                <Button type="submit" disabled={submitting} className="flex-1 sm:flex-none">
                  {submitting ? (
                    <span className="flex items-center gap-2">
                      <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                      Submitting...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <PaperAirplaneIcon className="w-4 h-4" />
                      Submit Application
                    </span>
                  )}
                </Button>
                <Link href="/co-founders">
                  <Button type="button" variant="outline">
                    Cancel
                  </Button>
                </Link>
              </div>
            </form>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
