'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Button, Card, Badge, ProgressBar } from '@/components/ui';
import { useAuthStore } from '@/store/authStore';
import { formatCurrency, calculateProgress, calculateDaysLeft } from '@/lib/utils';
import {
  RocketLaunchIcon,
  CurrencyRupeeIcon,
  UserGroupIcon,
  ChartBarIcon,
  PencilSquareIcon,
  PlusCircleIcon,
  EyeIcon,
  ArrowTrendingUpIcon,
} from '@heroicons/react/24/outline';

interface StartupSummary {
  id: string;
  title: string;
  slug: string;
  status: string;
  category: string;
  campaign: {
    fundingGoal: number;
    raisedAmount: number;
    supporterCount: number;
    endDate: string;
    status: string;
  } | null;
}

type Tab = 'overview' | 'startups' | 'analytics';

export default function StartupDashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, checkAuth, isLoading } = useAuthStore();
  const [tab, setTab] = useState<Tab>('overview');
  const [startups, setStartups] = useState<StartupSummary[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login?redirect=/startup-dashboard');
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    // In production, fetch from /api/founder/startups
    setDataLoading(false);
  }, []);

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-blue border-t-transparent rounded-full" />
      </div>
    );
  }

  const totalRaised = startups.reduce((sum, s) => sum + (s.campaign?.raisedAmount || 0), 0);
  const totalSupporters = startups.reduce((sum, s) => sum + (s.campaign?.supporterCount || 0), 0);

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4"
        >
          <div>
            <h1 className="text-2xl font-bold text-foreground">Founder Dashboard</h1>
            <p className="text-muted text-sm">Manage your startups and campaigns</p>
          </div>
          <Link href="/submit-idea">
            <Button>
              <PlusCircleIcon className="w-4 h-4 mr-2" /> New Startup
            </Button>
          </Link>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue/10 flex items-center justify-center">
                <RocketLaunchIcon className="w-5 h-5 text-blue" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{startups.length}</p>
                <p className="text-xs text-muted">My Startups</p>
              </div>
            </div>
          </Card>
          <Card className="p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <CurrencyRupeeIcon className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{formatCurrency(totalRaised)}</p>
                <p className="text-xs text-muted">Total Raised</p>
              </div>
            </div>
          </Card>
          <Card className="p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple/10 flex items-center justify-center">
                <UserGroupIcon className="w-5 h-5 text-purple" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{totalSupporters}</p>
                <p className="text-xs text-muted">Total Supporters</p>
              </div>
            </div>
          </Card>
          <Card className="p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-orange/10 flex items-center justify-center">
                <ArrowTrendingUpIcon className="w-5 h-5 text-orange" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {startups.filter((s) => s.status === 'APPROVED').length}
                </p>
                <p className="text-xs text-muted">Active Campaigns</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-border mb-8 overflow-x-auto">
          {([
            { id: 'overview' as Tab, label: 'Overview', icon: ChartBarIcon },
            { id: 'startups' as Tab, label: 'My Startups', icon: RocketLaunchIcon },
            { id: 'analytics' as Tab, label: 'Analytics', icon: ArrowTrendingUpIcon },
          ]).map((t) => {
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

        {tab === 'overview' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            {startups.length === 0 ? (
              <Card className="p-12 text-center">
                <RocketLaunchIcon className="w-16 h-16 text-muted mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-foreground mb-2">No startups yet</h2>
                <p className="text-muted mb-6">Submit your first idea and start building your campaign.</p>
                <Link href="/submit-idea">
                  <Button>
                    <PlusCircleIcon className="w-4 h-4 mr-2" /> Submit Your First Idea
                  </Button>
                </Link>
              </Card>
            ) : (
              startups.map((startup) => {
                const progress = startup.campaign
                  ? calculateProgress(startup.campaign.raisedAmount, startup.campaign.fundingGoal)
                  : 0;
                const daysLeft = startup.campaign
                  ? calculateDaysLeft(new Date(startup.campaign.endDate))
                  : 0;
                return (
                  <Card key={startup.id} className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-lg font-semibold text-foreground">{startup.title}</h3>
                          <Badge variant={startup.status === 'APPROVED' ? 'success' : 'warning'}>
                            {startup.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted">{startup.category}</p>
                      </div>
                      <div className="flex gap-2">
                        <Link href={`/startup/${startup.slug}`}>
                          <Button variant="outline" size="sm">
                            <EyeIcon className="w-4 h-4 mr-1" /> View
                          </Button>
                        </Link>
                        <Button variant="outline" size="sm">
                          <PencilSquareIcon className="w-4 h-4 mr-1" /> Edit
                        </Button>
                      </div>
                    </div>

                    {startup.campaign && (
                      <>
                        <ProgressBar progress={progress} />
                        <div className="grid grid-cols-3 gap-4 mt-4 text-center">
                          <div>
                            <p className="font-bold text-foreground">
                              {formatCurrency(startup.campaign.raisedAmount)}
                            </p>
                            <p className="text-xs text-muted">Raised</p>
                          </div>
                          <div>
                            <p className="font-bold text-foreground">{startup.campaign.supporterCount}</p>
                            <p className="text-xs text-muted">Supporters</p>
                          </div>
                          <div>
                            <p className="font-bold text-foreground">{daysLeft}</p>
                            <p className="text-xs text-muted">Days Left</p>
                          </div>
                        </div>
                      </>
                    )}
                  </Card>
                );
              })
            )}
          </motion.div>
        )}

        {tab === 'startups' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            {startups.length === 0 ? (
              <Card className="p-12 text-center">
                <p className="text-muted">No startups created yet</p>
                <Link href="/submit-idea">
                  <Button className="mt-4">Create Your First Startup</Button>
                </Link>
              </Card>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left">
                      <th className="pb-3 text-muted font-medium">Startup</th>
                      <th className="pb-3 text-muted font-medium">Category</th>
                      <th className="pb-3 text-muted font-medium">Status</th>
                      <th className="pb-3 text-muted font-medium">Raised</th>
                      <th className="pb-3 text-muted font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {startups.map((s) => (
                      <tr key={s.id} className="border-b border-border/50">
                        <td className="py-3 font-medium text-foreground">{s.title}</td>
                        <td className="py-3 text-muted">{s.category}</td>
                        <td className="py-3">
                          <Badge variant={s.status === 'APPROVED' ? 'success' : 'warning'}>
                            {s.status}
                          </Badge>
                        </td>
                        <td className="py-3 text-foreground">
                          {formatCurrency(s.campaign?.raisedAmount || 0)}
                        </td>
                        <td className="py-3">
                          <Link href={`/startup/${s.slug}`} className="text-blue text-sm hover:underline">
                            View
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        )}

        {tab === 'analytics' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Card className="p-12 text-center">
              <ChartBarIcon className="w-16 h-16 text-muted mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-foreground mb-2">Analytics Coming Soon</h2>
              <p className="text-muted">
                Detailed funding analytics, supporter demographics, and campaign performance metrics will be available here.
              </p>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}
