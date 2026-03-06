'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Card, Badge, Button } from '@/components/ui';
import { useAuthStore } from '@/store/authStore';
import {
  UserGroupIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowLeftIcon,
} from '@heroicons/react/24/outline';

const ROLES = [
  'Developer',
  'Designer',
  'Marketer',
  'Business Strategist',
  'Sales',
  'Operations',
  'Data Scientist',
  'Product Manager',
  'Finance',
];

interface Startup {
  id: string;
  title: string;
  slug: string;
  logo: string | null;
  thumbnail: string | null;
  category: string;
  status: string;
  lookingForCofounder: boolean;
  cofounderRoles: string[];
}

export default function ManageCofounderPage() {
  const router = useRouter();
  const { token, isAuthenticated, isLoading: authLoading } = useAuthStore();
  const [startups, setStartups] = useState<Startup[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [successId, setSuccessId] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (!token) return;

    async function fetchStartups() {
      try {
        const res = await fetch('/api/startups?founder=me', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success) {
          setStartups(
            data.data.startups.map((s: Startup) => ({
              id: s.id,
              title: s.title,
              slug: s.slug,
              logo: s.logo,
              thumbnail: s.thumbnail,
              category: s.category,
              status: s.status,
              lookingForCofounder: s.lookingForCofounder || false,
              cofounderRoles: s.cofounderRoles || [],
            }))
          );
        }
      } catch {
        setError('Failed to load your startups');
      } finally {
        setLoading(false);
      }
    }

    fetchStartups();
  }, [token]);

  const toggleLooking = (id: string) => {
    setStartups((prev) =>
      prev.map((s) =>
        s.id === id
          ? { ...s, lookingForCofounder: !s.lookingForCofounder, cofounderRoles: !s.lookingForCofounder ? s.cofounderRoles : [] }
          : s
      )
    );
  };

  const toggleRole = (id: string, role: string) => {
    setStartups((prev) =>
      prev.map((s) => {
        if (s.id !== id) return s;
        const has = s.cofounderRoles.includes(role);
        return {
          ...s,
          cofounderRoles: has
            ? s.cofounderRoles.filter((r) => r !== role)
            : [...s.cofounderRoles, role],
        };
      })
    );
  };

  const handleSave = async (startup: Startup) => {
    setSavingId(startup.id);
    setError('');
    setSuccessId(null);

    try {
      const res = await fetch(`/api/startups/${startup.slug}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          lookingForCofounder: startup.lookingForCofounder,
          cofounderRoles: startup.cofounderRoles,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSuccessId(startup.id);
        setTimeout(() => setSuccessId(null), 3000);
      } else {
        setError(data.message || 'Failed to save');
      }
    } catch {
      setError('Failed to save changes');
    } finally {
      setSavingId(null);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-blue border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <Link
          href="/startup-dashboard"
          className="inline-flex items-center gap-2 text-muted hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          Back to Dashboard
        </Link>

        <div className="flex items-center gap-3 mb-8">
          <UserGroupIcon className="w-8 h-8 text-blue" />
          <div>
            <h1 className="text-2xl font-bold text-foreground">Co-Founder Search</h1>
            <p className="text-muted text-sm">
              Enable co-founder search for your startups and specify the roles you need
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl text-sm">
            {error}
          </div>
        )}

        {startups.length === 0 ? (
          <Card className="p-12 text-center">
            <UserGroupIcon className="w-16 h-16 text-muted mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">No Startups Yet</h2>
            <p className="text-muted mb-4">Create a startup first to enable co-founder search.</p>
            <Link href="/submit-idea">
              <Button>Create Startup</Button>
            </Link>
          </Card>
        ) : (
          <div className="space-y-6">
            {startups.map((startup) => (
              <motion.div
                key={startup.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="p-6">
                  <div className="flex items-start gap-4 mb-5">
                    <div className="w-14 h-14 rounded-xl overflow-hidden bg-card-hover flex-shrink-0">
                      {startup.logo || startup.thumbnail ? (
                        <Image
                          src={startup.logo || startup.thumbnail || ''}
                          alt={startup.title}
                          width={56}
                          height={56}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted text-lg font-bold">
                          {startup.title[0]}
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold text-foreground">{startup.title}</h3>
                        <Badge variant={startup.status === 'APPROVED' ? 'success' : 'warning'}>
                          {startup.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted">{startup.category}</p>
                    </div>
                  </div>

                  {/* Toggle */}
                  <div className="border-t border-border pt-4">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={startup.lookingForCofounder}
                        onChange={() => toggleLooking(startup.id)}
                        className="w-5 h-5 rounded border-border text-blue focus:ring-blue bg-card"
                      />
                      <div>
                        <span className="text-foreground font-medium">Looking for a co-founder</span>
                        <p className="text-xs text-muted">
                          Your startup will appear on the Co-Founders discovery page
                        </p>
                      </div>
                    </label>
                  </div>

                  {/* Roles */}
                  {startup.lookingForCofounder && (
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Roles you need
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {ROLES.map((role) => (
                          <label
                            key={role}
                            className="flex items-center gap-2 p-2 rounded-lg border border-border hover:border-blue/30 cursor-pointer transition-colors"
                          >
                            <input
                              type="checkbox"
                              checked={startup.cofounderRoles.includes(role)}
                              onChange={() => toggleRole(startup.id, role)}
                              className="w-4 h-4 rounded border-border text-blue focus:ring-blue bg-card"
                            />
                            <span className="text-sm text-foreground">{role}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Save / Status */}
                  <div className="mt-5 flex items-center gap-3">
                    <Button
                      onClick={() => handleSave(startup)}
                      disabled={savingId === startup.id}
                    >
                      {savingId === startup.id ? 'Saving...' : 'Save Changes'}
                    </Button>

                    {successId === startup.id && (
                      <span className="flex items-center gap-1 text-emerald-400 text-sm">
                        <CheckCircleIcon className="w-4 h-4" /> Saved!
                      </span>
                    )}
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
