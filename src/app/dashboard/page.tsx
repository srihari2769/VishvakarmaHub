'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Button, Card, Badge, ProgressBar } from '@/components/ui';
import { useAuthStore } from '@/store/authStore';
import { formatCurrency, calculateProgress } from '@/lib/utils';
import {
  HeartIcon,
  BellIcon,
  CurrencyRupeeIcon,
  UserCircleIcon,
  BookmarkIcon,
  Cog6ToothIcon,
  ArrowTopRightOnSquareIcon,
} from '@heroicons/react/24/outline';

interface Contribution {
  id: string;
  amount: number;
  createdAt: string;
  startup: { title: string; slug: string; logo: string | null };
  rewardTier: { name: string } | null;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

type Tab = 'overview' | 'contributions' | 'notifications' | 'settings';

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, checkAuth, isLoading, logout } = useAuthStore();
  const [tab, setTab] = useState<Tab>('overview');
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login?redirect=/dashboard');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-blue border-t-transparent rounded-full" />
      </div>
    );
  }

  const totalContributed = contributions.reduce((sum, c) => sum + c.amount, 0);

  const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'overview', label: 'Overview', icon: UserCircleIcon },
    { id: 'contributions', label: 'Contributions', icon: CurrencyRupeeIcon },
    { id: 'notifications', label: 'Notifications', icon: BellIcon },
    { id: 'settings', label: 'Settings', icon: Cog6ToothIcon },
  ];

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue to-purple flex items-center justify-center text-white text-2xl font-bold">
              {user.firstName?.[0] || 'U'}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Welcome back, {user.firstName}!
              </h1>
              <p className="text-muted text-sm">{user.email}</p>
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-border mb-8 overflow-x-auto">
          {TABS.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  tab === t.id
                    ? 'border-blue text-blue'
                    : 'border-transparent text-muted hover:text-foreground'
                }`}
              >
                <Icon className="w-4 h-4" />
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Overview */}
        {tab === 'overview' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="p-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue/10 flex items-center justify-center">
                    <CurrencyRupeeIcon className="w-5 h-5 text-blue" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{formatCurrency(totalContributed)}</p>
                    <p className="text-xs text-muted">Total Contributed</p>
                  </div>
                </div>
              </Card>
              <Card className="p-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-purple/10 flex items-center justify-center">
                    <HeartIcon className="w-5 h-5 text-purple" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{contributions.length}</p>
                    <p className="text-xs text-muted">Startups Backed</p>
                  </div>
                </div>
              </Card>
              <Card className="p-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-cyan/10 flex items-center justify-center">
                    <BookmarkIcon className="w-5 h-5 text-cyan" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">0</p>
                    <p className="text-xs text-muted">Saved Startups</p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card className="p-6">
              <h2 className="font-semibold text-foreground mb-4">Quick Actions</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Link href="/explore">
                  <Button variant="outline" className="w-full justify-start">
                    <ArrowTopRightOnSquareIcon className="w-4 h-4 mr-2" /> Explore Startups
                  </Button>
                </Link>
                <Link href="/submit-idea">
                  <Button variant="outline" className="w-full justify-start">
                    <HeartIcon className="w-4 h-4 mr-2" /> Submit an Idea
                  </Button>
                </Link>
                <Button variant="outline" className="w-full justify-start" onClick={() => setTab('settings')}>
                  <Cog6ToothIcon className="w-4 h-4 mr-2" /> Edit Profile
                </Button>
              </div>
            </Card>

            {/* Recent Contributions */}
            <Card className="p-6">
              <h2 className="font-semibold text-foreground mb-4">Recent Contributions</h2>
              {contributions.length === 0 ? (
                <div className="text-center py-8">
                  <CurrencyRupeeIcon className="w-10 h-10 text-muted mx-auto mb-2" />
                  <p className="text-muted text-sm">No contributions yet</p>
                  <Link href="/explore" className="text-blue text-sm hover:underline mt-1 inline-block">
                    Explore startups to support
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {contributions.slice(0, 5).map((c) => (
                    <div
                      key={c.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-card-hover"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue to-purple flex items-center justify-center text-white text-sm font-bold">
                          {c.startup.title[0]}
                        </div>
                        <div>
                          <Link
                            href={`/startup/${c.startup.slug}`}
                            className="font-medium text-foreground text-sm hover:text-blue"
                          >
                            {c.startup.title}
                          </Link>
                          <p className="text-xs text-muted">
                            {new Date(c.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <span className="font-semibold text-foreground">{formatCurrency(c.amount)}</span>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </motion.div>
        )}

        {/* Contributions */}
        {tab === 'contributions' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Card className="p-6">
              <h2 className="font-semibold text-foreground mb-4">Contribution History</h2>
              {contributions.length === 0 ? (
                <div className="text-center py-12">
                  <CurrencyRupeeIcon className="w-12 h-12 text-muted mx-auto mb-3" />
                  <p className="text-muted">You haven&apos;t made any contributions yet.</p>
                  <Link href="/explore">
                    <Button className="mt-4">Explore Startups</Button>
                  </Link>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-left">
                        <th className="pb-3 text-muted font-medium">Startup</th>
                        <th className="pb-3 text-muted font-medium">Amount</th>
                        <th className="pb-3 text-muted font-medium">Tier</th>
                        <th className="pb-3 text-muted font-medium">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {contributions.map((c) => (
                        <tr key={c.id} className="border-b border-border/50">
                          <td className="py-3">
                            <Link href={`/startup/${c.startup.slug}`} className="text-foreground hover:text-blue">
                              {c.startup.title}
                            </Link>
                          </td>
                          <td className="py-3 text-foreground">{formatCurrency(c.amount)}</td>
                          <td className="py-3 text-muted">{c.rewardTier?.name || '—'}</td>
                          <td className="py-3 text-muted">{new Date(c.createdAt).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </motion.div>
        )}

        {/* Notifications */}
        {tab === 'notifications' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Card className="p-6">
              <h2 className="font-semibold text-foreground mb-4">Notifications</h2>
              {notifications.length === 0 ? (
                <div className="text-center py-12">
                  <BellIcon className="w-12 h-12 text-muted mx-auto mb-3" />
                  <p className="text-muted">No notifications yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`p-4 rounded-xl border ${
                        n.isRead ? 'border-border bg-card' : 'border-blue/20 bg-blue/5'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-medium text-foreground text-sm">{n.title}</h3>
                          <p className="text-xs text-muted mt-1">{n.message}</p>
                        </div>
                        <span className="text-xs text-muted whitespace-nowrap ml-2">
                          {new Date(n.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </motion.div>
        )}

        {/* Settings */}
        {tab === 'settings' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <Card className="p-6">
              <h2 className="font-semibold text-foreground mb-4">Profile Settings</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-muted mb-1">First Name</label>
                  <input
                    className="w-full bg-input border border-border rounded-xl px-4 py-2.5 text-foreground"
                    defaultValue={user.firstName}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted mb-1">Last Name</label>
                  <input
                    className="w-full bg-input border border-border rounded-xl px-4 py-2.5 text-foreground"
                    defaultValue={user.lastName}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-muted mb-1">Email</label>
                  <input
                    className="w-full bg-input border border-border rounded-xl px-4 py-2.5 text-muted"
                    defaultValue={user.email}
                    disabled
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-muted mb-1">Bio</label>
                  <textarea
                    className="w-full bg-input border border-border rounded-xl px-4 py-2.5 text-foreground resize-none"
                    rows={3}
                    placeholder="Tell us about yourself..."
                  />
                </div>
              </div>
              <Button className="mt-4">Save Changes</Button>
            </Card>

            <Card className="p-6 border-red-500/20">
              <h2 className="font-semibold text-red-400 mb-2">Danger Zone</h2>
              <p className="text-sm text-muted mb-4">Once you log out, you&apos;ll need to sign in again.</p>
              <Button variant="danger" onClick={logout}>
                Log Out
              </Button>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}
