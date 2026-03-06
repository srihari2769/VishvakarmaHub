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
  BanknotesIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  DocumentTextIcon,
  TrashIcon,
  ShareIcon,
  GiftIcon,
  CheckBadgeIcon,
  StarIcon,
  ClipboardDocumentIcon,
} from '@heroicons/react/24/outline';

interface StartupSummary {
  id: string;
  title: string;
  slug: string;
  status: string;
  category: string;
  campaign: {
    id: string;
    fundingGoal: number;
    raisedAmount: number;
    supporterCount: number;
    endDate: string;
    status: string;
  } | null;
}

interface WithdrawalRecord {
  id: string;
  amount: number;
  status: string;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  note?: string;
  adminNote?: string;
  createdAt: string;
  campaign: {
    startup: { title: string };
    raisedAmount: number;
    fundingGoal: number;
  };
}

type Tab = 'overview' | 'startups' | 'analytics' | 'withdraw' | 'referrals' | 'applications';

interface CofounderApp {
  id: string;
  role: string;
  message: string;
  experience: string;
  portfolio: string | null;
  linkedIn: string | null;
  status: string;
  createdAt: string;
  applicant: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatar: string | null;
    linkedIn: string | null;
    bio: string | null;
  };
  startup: {
    id: string;
    title: string;
    slug: string;
  };
}

interface ReferredUser {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
  createdAt: string;
}

interface ReferralData {
  referralCode: string;
  referralCount: number;
  isVerified: boolean;
  hasFeaturedStartup: boolean;
  referredUsers: ReferredUser[];
  rewards: {
    featuredSlotUnlocked: boolean;
    verifiedBadgeUnlocked: boolean;
  };
}

export default function StartupDashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, checkAuth, isLoading } = useAuthStore();
  const [tab, setTab] = useState<Tab>('overview');
  const [startups, setStartups] = useState<StartupSummary[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRecord[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [withdrawForm, setWithdrawForm] = useState({
    campaignId: '',
    amount: '',
    bankName: '',
    accountNumber: '',
    ifscCode: '',
    accountHolder: '',
    note: '',
  });
  const [withdrawError, setWithdrawError] = useState('');
  const [withdrawSuccess, setWithdrawSuccess] = useState('');
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [draft, setDraft] = useState<{ title: string; step: number; categories: string[] } | null>(null);
  const [referralData, setReferralData] = useState<ReferralData | null>(null);
  const [referralCopied, setReferralCopied] = useState(false);
  const [claimingReward, setClaimingReward] = useState(false);
  const [cofounderApps, setCofounderApps] = useState<CofounderApp[]>([]);
  const [appActionLoading, setAppActionLoading] = useState<string | null>(null);

  // Check for saved draft in localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('vishvakarma_submit_idea_draft');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.form?.title) {
          setDraft({
            title: parsed.form.title,
            step: parsed.step || 0,
            categories: parsed.form.categories || [],
          });
        }
      }
    } catch {
      // ignore
    }
  }, []);

  const deleteDraft = () => {
    localStorage.removeItem('vishvakarma_submit_idea_draft');
    setDraft(null);
  };

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login?redirect=/startup-dashboard');
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated && user) {
      const fetchStartups = async () => {
        try {
          const token = localStorage.getItem('token');
          const res = await fetch('/api/startups?founder=me', {
            headers: { Authorization: `Bearer ${token}` },
          });
          const data = await res.json();
          if (data.success) {
            setStartups(data.data.startups || []);
          }
        } catch (error) {
          console.error('Failed to fetch startups:', error);
        } finally {
          setDataLoading(false);
        }
      };
      const fetchWithdrawals = async () => {
        try {
          const token = localStorage.getItem('token');
          const res = await fetch('/api/withdrawals', {
            headers: { Authorization: `Bearer ${token}` },
          });
          const data = await res.json();
          if (data.success) setWithdrawals(data.data);
        } catch (error) {
          console.error('Failed to fetch withdrawals:', error);
        }
      };
      fetchStartups();
      fetchWithdrawals();
      // Fetch referral data
      const fetchReferrals = async () => {
        try {
          const token = localStorage.getItem('token');
          const res = await fetch('/api/referrals', {
            headers: { Authorization: `Bearer ${token}` },
          });
          const data = await res.json();
          if (data.success) setReferralData(data.data);
        } catch (error) {
          console.error('Failed to fetch referral data:', error);
        }
      };
      fetchReferrals();
      // Fetch co-founder applications
      const fetchApplications = async () => {
        try {
          const token = localStorage.getItem('token');
          const res = await fetch('/api/cofounder-applications?view=founder', {
            headers: { Authorization: `Bearer ${token}` },
          });
          const data = await res.json();
          if (data.success) setCofounderApps(data.data);
        } catch (error) {
          console.error('Failed to fetch applications:', error);
        }
      };
      fetchApplications();
    }
  }, [isAuthenticated, user]);

  const handleWithdrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setWithdrawError('');
    setWithdrawSuccess('');
    setWithdrawLoading(true);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/withdrawals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          ...withdrawForm,
          amount: parseFloat(withdrawForm.amount),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setWithdrawSuccess('Withdrawal request submitted! Admin will review it shortly.');
        setWithdrawForm({ campaignId: '', amount: '', bankName: '', accountNumber: '', ifscCode: '', accountHolder: '', note: '' });
        // Refresh withdrawals
        const res2 = await fetch('/api/withdrawals', { headers: { Authorization: `Bearer ${token}` } });
        const data2 = await res2.json();
        if (data2.success) setWithdrawals(data2.data);
      } else {
        setWithdrawError(data.error || 'Failed to submit withdrawal');
      }
    } catch {
      setWithdrawError('Network error. Please try again.');
    } finally {
      setWithdrawLoading(false);
    }
  };

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
            { id: 'withdraw' as Tab, label: 'Withdraw Funds', icon: BanknotesIcon },
            { id: 'referrals' as Tab, label: 'Referrals', icon: GiftIcon },
            { id: 'applications' as Tab, label: 'Applications', icon: UserGroupIcon },
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
            {/* Saved Draft Card */}
            {draft && (
              <Card className="p-6 border-2 border-dashed border-yellow-500/40 bg-yellow-500/5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                      <DocumentTextIcon className="w-5 h-5 text-yellow-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold text-foreground">{draft.title}</h3>
                        <Badge variant="warning">Draft</Badge>
                      </div>
                      <p className="text-sm text-muted">
                        {draft.categories.length > 0 ? draft.categories.join(', ') + ' • ' : ''}
                        Step {draft.step + 1} of 6 completed
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Link href="/submit-idea">
                      <Button size="sm">
                        <PencilSquareIcon className="w-4 h-4 mr-1" /> Continue Editing
                      </Button>
                    </Link>
                    <Button variant="outline" size="sm" onClick={deleteDraft} className="text-red-400 border-red-400/30 hover:bg-red-400/10">
                      <TrashIcon className="w-4 h-4 mr-1" /> Delete Draft
                    </Button>
                  </div>
                </div>
              </Card>
            )}

            {startups.length === 0 && !draft ? (
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
            ) : startups.length === 0 ? null : (
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
                        <Link href={`/edit-startup/${startup.slug}`}>
                          <Button variant="outline" size="sm">
                            <PencilSquareIcon className="w-4 h-4 mr-1" /> Edit
                          </Button>
                        </Link>
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
            {/* Saved Draft Card in startups tab */}
            {draft && (
              <Card className="p-5 border-2 border-dashed border-yellow-500/40 bg-yellow-500/5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <DocumentTextIcon className="w-5 h-5 text-yellow-400" />
                    <div>
                      <span className="font-medium text-foreground">{draft.title}</span>
                      <Badge variant="warning" className="ml-2">Draft</Badge>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Link href="/submit-idea" className="text-blue text-sm hover:underline">Continue</Link>
                    <button onClick={deleteDraft} className="text-red-400 text-sm hover:underline">Delete</button>
                  </div>
                </div>
              </Card>
            )}

            {startups.length === 0 && !draft ? (
              <Card className="p-12 text-center">
                <p className="text-muted">No startups created yet</p>
                <Link href="/submit-idea">
                  <Button className="mt-4">Create Your First Startup</Button>
                </Link>
              </Card>
            ) : startups.length === 0 ? null : (
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
                          <div className="flex gap-2">
                            <Link href={`/startup/${s.slug}`} className="text-blue text-sm hover:underline">
                              View
                            </Link>
                            <Link href="/co-founders/manage" className="text-emerald-400 text-sm hover:underline">
                              Co-Founder
                            </Link>
                          </div>
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
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            {startups.length === 0 ? (
              <Card className="p-12 text-center">
                <ChartBarIcon className="w-16 h-16 text-muted mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-foreground mb-2">No Data Yet</h2>
                <p className="text-muted">Submit your first startup to see analytics here.</p>
              </Card>
            ) : (
              <>
                {/* Funding Summary */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Card className="p-5">
                    <p className="text-xs text-muted mb-1">Total Funding Goal</p>
                    <p className="text-2xl font-bold text-foreground">
                      {formatCurrency(startups.reduce((s, st) => s + (st.campaign?.fundingGoal || 0), 0))}
                    </p>
                  </Card>
                  <Card className="p-5">
                    <p className="text-xs text-muted mb-1">Total Raised</p>
                    <p className="text-2xl font-bold text-emerald-400">{formatCurrency(totalRaised)}</p>
                  </Card>
                  <Card className="p-5">
                    <p className="text-xs text-muted mb-1">Overall Progress</p>
                    <p className="text-2xl font-bold text-blue">
                      {startups.reduce((s, st) => s + (st.campaign?.fundingGoal || 0), 0) > 0
                        ? Math.round(
                            (totalRaised /
                              startups.reduce((s, st) => s + (st.campaign?.fundingGoal || 0), 0)) *
                              100
                          )
                        : 0}
                      %
                    </p>
                  </Card>
                </div>

                {/* Per-Startup Breakdown */}
                <h3 className="text-lg font-semibold text-foreground">Campaign Breakdown</h3>
                {startups.map((s) => {
                  const progress = s.campaign
                    ? calculateProgress(s.campaign.raisedAmount, s.campaign.fundingGoal)
                    : 0;
                  const daysLeft = s.campaign ? calculateDaysLeft(new Date(s.campaign.endDate)) : 0;
                  return (
                    <Card key={s.id} className="p-5">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="font-semibold text-foreground">{s.title}</h4>
                          <p className="text-xs text-muted">{s.category}</p>
                        </div>
                        <Badge variant={s.status === 'APPROVED' ? 'success' : 'warning'}>{s.status}</Badge>
                      </div>
                      {s.campaign ? (
                        <>
                          <ProgressBar progress={progress} />
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
                            <div>
                              <p className="text-xs text-muted">Raised</p>
                              <p className="font-bold text-foreground">
                                {formatCurrency(s.campaign.raisedAmount)}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-muted">Goal</p>
                              <p className="font-bold text-foreground">
                                {formatCurrency(s.campaign.fundingGoal)}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-muted">Supporters</p>
                              <p className="font-bold text-foreground">{s.campaign.supporterCount}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted">Days Left</p>
                              <p className="font-bold text-foreground">{daysLeft > 0 ? daysLeft : 'Ended'}</p>
                            </div>
                          </div>
                        </>
                      ) : (
                        <p className="text-sm text-muted">No campaign created yet</p>
                      )}
                    </Card>
                  );
                })}

                {/* Withdrawal Summary */}
                {withdrawals.length > 0 && (
                  <>
                    <h3 className="text-lg font-semibold text-foreground">Withdrawal Summary</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <Card className="p-5">
                        <p className="text-xs text-muted mb-1">Total Withdrawn</p>
                        <p className="text-2xl font-bold text-emerald-400">
                          {formatCurrency(
                            withdrawals
                              .filter((w) => w.status === 'COMPLETED' || w.status === 'APPROVED')
                              .reduce((s, w) => s + w.amount, 0)
                          )}
                        </p>
                      </Card>
                      <Card className="p-5">
                        <p className="text-xs text-muted mb-1">Pending Withdrawals</p>
                        <p className="text-2xl font-bold text-yellow-400">
                          {formatCurrency(
                            withdrawals.filter((w) => w.status === 'PENDING').reduce((s, w) => s + w.amount, 0)
                          )}
                        </p>
                      </Card>
                      <Card className="p-5">
                        <p className="text-xs text-muted mb-1">Available Balance</p>
                        <p className="text-2xl font-bold text-blue">
                          {formatCurrency(
                            totalRaised -
                              withdrawals
                                .filter((w) => w.status !== 'REJECTED')
                                .reduce((s, w) => s + w.amount, 0)
                          )}
                        </p>
                      </Card>
                    </div>
                  </>
                )}
              </>
            )}
          </motion.div>
        )}

        {tab === 'withdraw' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            {/* Withdraw Form */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Request Fund Withdrawal</h3>

              {withdrawError && (
                <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  {withdrawError}
                </div>
              )}
              {withdrawSuccess && (
                <div className="mb-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">
                  {withdrawSuccess}
                </div>
              )}

              {startups.filter((s) => s.campaign).length === 0 ? (
                <p className="text-muted text-sm">You need an active campaign with funds before you can withdraw.</p>
              ) : (
                <form onSubmit={handleWithdrawSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-muted mb-1">Campaign</label>
                      <select
                        value={withdrawForm.campaignId}
                        onChange={(e) => setWithdrawForm({ ...withdrawForm, campaignId: e.target.value })}
                        className="w-full px-3 py-2 bg-card border border-border rounded-lg text-foreground text-sm focus:outline-none focus:border-blue"
                        required
                      >
                        <option value="">Select a campaign</option>
                        {startups
                          .filter((s) => s.campaign)
                          .map((s) => (
                            <option key={s.campaign!.id} value={s.campaign!.id}>
                              {s.title} — Raised: {formatCurrency(s.campaign!.raisedAmount)}
                            </option>
                          ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-muted mb-1">Amount (₹)</label>
                      <input
                        type="number"
                        value={withdrawForm.amount}
                        onChange={(e) => setWithdrawForm({ ...withdrawForm, amount: e.target.value })}
                        placeholder="Enter amount"
                        min="1"
                        className="w-full px-3 py-2 bg-card border border-border rounded-lg text-foreground text-sm focus:outline-none focus:border-blue"
                        required
                      />
                    </div>
                  </div>

                  <h4 className="text-sm font-medium text-foreground pt-2">Bank Details</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-muted mb-1">Account Holder Name</label>
                      <input
                        type="text"
                        value={withdrawForm.accountHolder}
                        onChange={(e) => setWithdrawForm({ ...withdrawForm, accountHolder: e.target.value })}
                        placeholder="Full name as per bank"
                        className="w-full px-3 py-2 bg-card border border-border rounded-lg text-foreground text-sm focus:outline-none focus:border-blue"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-muted mb-1">Bank Name</label>
                      <input
                        type="text"
                        value={withdrawForm.bankName}
                        onChange={(e) => setWithdrawForm({ ...withdrawForm, bankName: e.target.value })}
                        placeholder="e.g. State Bank of India"
                        className="w-full px-3 py-2 bg-card border border-border rounded-lg text-foreground text-sm focus:outline-none focus:border-blue"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-muted mb-1">Account Number</label>
                      <input
                        type="text"
                        value={withdrawForm.accountNumber}
                        onChange={(e) => setWithdrawForm({ ...withdrawForm, accountNumber: e.target.value })}
                        placeholder="Bank account number"
                        className="w-full px-3 py-2 bg-card border border-border rounded-lg text-foreground text-sm focus:outline-none focus:border-blue"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-muted mb-1">IFSC Code</label>
                      <input
                        type="text"
                        value={withdrawForm.ifscCode}
                        onChange={(e) => setWithdrawForm({ ...withdrawForm, ifscCode: e.target.value })}
                        placeholder="e.g. SBIN0001234"
                        className="w-full px-3 py-2 bg-card border border-border rounded-lg text-foreground text-sm focus:outline-none focus:border-blue"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-muted mb-1">Note (optional)</label>
                    <textarea
                      value={withdrawForm.note}
                      onChange={(e) => setWithdrawForm({ ...withdrawForm, note: e.target.value })}
                      placeholder="Any additional details for the admin..."
                      rows={2}
                      className="w-full px-3 py-2 bg-card border border-border rounded-lg text-foreground text-sm focus:outline-none focus:border-blue resize-none"
                    />
                  </div>

                  <Button type="submit" disabled={withdrawLoading}>
                    {withdrawLoading ? 'Submitting...' : 'Submit Withdrawal Request'}
                  </Button>
                </form>
              )}
            </Card>

            {/* Withdrawal History */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Withdrawal History</h3>
              {withdrawals.length === 0 ? (
                <p className="text-muted text-sm">No withdrawal requests yet.</p>
              ) : (
                <div className="space-y-4">
                  {withdrawals.map((w) => (
                    <div key={w.id} className="p-4 bg-background rounded-lg border border-border/50">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {w.status === 'PENDING' && <ClockIcon className="w-4 h-4 text-yellow-400" />}
                          {(w.status === 'APPROVED' || w.status === 'COMPLETED') && (
                            <CheckCircleIcon className="w-4 h-4 text-emerald-400" />
                          )}
                          {w.status === 'REJECTED' && <XCircleIcon className="w-4 h-4 text-red-400" />}
                          <span className="font-semibold text-foreground">{formatCurrency(w.amount)}</span>
                          <Badge
                            variant={
                              w.status === 'APPROVED' || w.status === 'COMPLETED'
                                ? 'success'
                                : w.status === 'REJECTED'
                                ? 'danger'
                                : 'warning'
                            }
                          >
                            {w.status}
                          </Badge>
                        </div>
                        <span className="text-xs text-muted">
                          {new Date(w.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm text-muted">
                        Campaign: {w.campaign.startup.title} • Bank: {w.bankName} — {w.accountNumber}
                      </p>
                      {w.note && <p className="text-sm text-muted mt-1">Note: {w.note}</p>}
                      {w.adminNote && (
                        <p className="text-sm text-blue mt-1">Admin: {w.adminNote}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </motion.div>
        )}

        {tab === 'referrals' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            {/* Referral Link Card */}
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-purple/10 flex items-center justify-center">
                  <ShareIcon className="w-5 h-5 text-purple" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Your Referral Link</h3>
                  <p className="text-sm text-muted">Invite founders and earn rewards</p>
                </div>
              </div>

              {referralData?.referralCode ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 px-4 py-3 bg-background border border-border rounded-lg text-foreground text-sm font-mono break-all">
                      {typeof window !== 'undefined'
                        ? `${window.location.origin}/signup?ref=${referralData.referralCode}`
                        : `https://vishvakarmahub.vercel.app/signup?ref=${referralData.referralCode}`}
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => {
                        const url = `${window.location.origin}/signup?ref=${referralData.referralCode}`;
                        navigator.clipboard.writeText(url);
                        setReferralCopied(true);
                        setTimeout(() => setReferralCopied(false), 2000);
                      }}
                    >
                      {referralCopied ? (
                        <CheckCircleIcon className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <ClipboardDocumentIcon className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-muted">
                    Referral code: <span className="font-mono text-foreground">{referralData.referralCode}</span>
                  </p>
                </div>
              ) : (
                <p className="text-muted text-sm">Loading referral code...</p>
              )}
            </Card>

            {/* Rewards Progress */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Card className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  <StarIcon className="w-6 h-6 text-yellow-400" />
                  <h4 className="font-semibold text-foreground">Featured Startup Slot</h4>
                </div>
                <p className="text-sm text-muted mb-3">
                  Invite 1 founder to unlock a featured slot for one of your startups.
                </p>
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex-1 h-2 bg-border rounded-full overflow-hidden">
                    <div
                      className="h-full bg-yellow-400 rounded-full transition-all"
                      style={{ width: `${Math.min((referralData?.referralCount || 0) / 1 * 100, 100)}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted">{Math.min(referralData?.referralCount || 0, 1)}/1</span>
                </div>
                {referralData?.rewards.featuredSlotUnlocked && !referralData.hasFeaturedStartup && startups.length > 0 && (
                  <div className="mt-3">
                    <select
                      className="w-full px-3 py-2 bg-card border border-border rounded-lg text-foreground text-sm mb-2"
                      id="featured-startup-select"
                    >
                      {startups.map((s) => (
                        <option key={s.id} value={s.id}>{s.title}</option>
                      ))}
                    </select>
                    <Button
                      size="sm"
                      disabled={claimingReward}
                      onClick={async () => {
                        setClaimingReward(true);
                        try {
                          const select = document.getElementById('featured-startup-select') as HTMLSelectElement;
                          const token = localStorage.getItem('token');
                          const res = await fetch('/api/referrals', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                            body: JSON.stringify({ reward: 'featured', startupId: select.value }),
                          });
                          const data = await res.json();
                          if (data.success) {
                            // Refresh referral data
                            const r = await fetch('/api/referrals', { headers: { Authorization: `Bearer ${token}` } });
                            const rd = await r.json();
                            if (rd.success) setReferralData(rd.data);
                          }
                        } catch { /* ignore */ } finally {
                          setClaimingReward(false);
                        }
                      }}
                    >
                      {claimingReward ? 'Claiming...' : 'Claim Featured Slot'}
                    </Button>
                  </div>
                )}
                {referralData?.hasFeaturedStartup && (
                  <p className="text-sm text-emerald-400 flex items-center gap-1 mt-2">
                    <CheckCircleIcon className="w-4 h-4" /> Featured slot active
                  </p>
                )}
              </Card>

              <Card className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  <CheckBadgeIcon className="w-6 h-6 text-blue" />
                  <h4 className="font-semibold text-foreground">Verified Founder Badge</h4>
                </div>
                <p className="text-sm text-muted mb-3">
                  Invite 5 founders to earn the verified founder badge on your profile.
                </p>
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex-1 h-2 bg-border rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue rounded-full transition-all"
                      style={{ width: `${Math.min((referralData?.referralCount || 0) / 5 * 100, 100)}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted">{Math.min(referralData?.referralCount || 0, 5)}/5</span>
                </div>
                {referralData?.rewards.verifiedBadgeUnlocked && !referralData.isVerified && (
                  <Button
                    size="sm"
                    className="mt-3"
                    disabled={claimingReward}
                    onClick={async () => {
                      setClaimingReward(true);
                      try {
                        const token = localStorage.getItem('token');
                        const res = await fetch('/api/referrals', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                          body: JSON.stringify({ reward: 'verified' }),
                        });
                        const data = await res.json();
                        if (data.success) {
                          const r = await fetch('/api/referrals', { headers: { Authorization: `Bearer ${token}` } });
                          const rd = await r.json();
                          if (rd.success) setReferralData(rd.data);
                        }
                      } catch { /* ignore */ } finally {
                        setClaimingReward(false);
                      }
                    }}
                  >
                    {claimingReward ? 'Claiming...' : 'Claim Verified Badge'}
                  </Button>
                )}
                {referralData?.isVerified && (
                  <p className="text-sm text-blue flex items-center gap-1 mt-2">
                    <CheckBadgeIcon className="w-4 h-4" /> Verified badge earned
                  </p>
                )}
              </Card>
            </div>

            {/* Referred Users */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">
                People You Referred ({referralData?.referralCount || 0})
              </h3>
              {!referralData?.referredUsers?.length ? (
                <p className="text-muted text-sm">No referrals yet. Share your link to get started!</p>
              ) : (
                <div className="space-y-3">
                  {referralData.referredUsers.map((u) => (
                    <div key={u.id} className="flex items-center justify-between p-3 bg-background rounded-lg border border-border/50">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-purple/20 flex items-center justify-center text-purple text-sm font-bold">
                          {u.firstName[0]}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{u.firstName} {u.lastName}</p>
                          <p className="text-xs text-muted">{u.role}</p>
                        </div>
                      </div>
                      <span className="text-xs text-muted">{new Date(u.createdAt).toLocaleDateString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </motion.div>
        )}

        {tab === 'applications' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-foreground mb-1">Co-Founder Applications</h3>
              <p className="text-sm text-muted mb-6">Review applications from people who want to join your startups.</p>

              {cofounderApps.length === 0 ? (
                <div className="text-center py-12">
                  <UserGroupIcon className="w-12 h-12 text-muted mx-auto mb-3" />
                  <p className="text-muted">No applications received yet.</p>
                  <p className="text-sm text-muted mt-1">When someone applies to join your startup, it will appear here.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {cofounderApps.map((app) => (
                    <div key={app.id} className="p-5 bg-background rounded-xl border border-border">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-full bg-purple/20 flex items-center justify-center text-purple text-sm font-bold flex-shrink-0">
                            {app.applicant.firstName[0]}
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{app.applicant.firstName} {app.applicant.lastName}</p>
                            <p className="text-xs text-muted">{app.applicant.email}</p>
                            {app.applicant.bio && <p className="text-xs text-muted mt-1">{app.applicant.bio}</p>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 text-xs rounded-full bg-purple/10 text-purple border border-purple/20">{app.role}</span>
                          <span className={`px-2 py-0.5 text-xs rounded-full ${
                            app.status === 'PENDING' ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                              : app.status === 'ACCEPTED' ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                              : 'bg-red-500/10 text-red-400 border border-red-500/20'
                          }`}>{app.status}</span>
                        </div>
                      </div>

                      <div className="text-xs text-muted mb-1">Applying to: <span className="text-foreground">{app.startup.title}</span></div>

                      <div className="mt-3 space-y-3">
                        <div>
                          <p className="text-xs font-medium text-muted mb-1">Why they want to join:</p>
                          <p className="text-sm text-foreground bg-card p-3 rounded-lg border border-border/50">{app.message}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-muted mb-1">Experience:</p>
                          <p className="text-sm text-foreground bg-card p-3 rounded-lg border border-border/50">{app.experience}</p>
                        </div>
                        {(app.portfolio || app.linkedIn || app.applicant.linkedIn) && (
                          <div className="flex flex-wrap gap-3">
                            {app.portfolio && <a href={app.portfolio} target="_blank" rel="noopener noreferrer" className="text-xs text-blue hover:underline">Portfolio ↗</a>}
                            {(app.linkedIn || app.applicant.linkedIn) && <a href={app.linkedIn || app.applicant.linkedIn!} target="_blank" rel="noopener noreferrer" className="text-xs text-blue hover:underline">LinkedIn ↗</a>}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/50">
                        <span className="text-xs text-muted">{new Date(app.createdAt).toLocaleDateString()}</span>
                        {app.status === 'PENDING' && (
                          <div className="flex gap-2">
                            <button
                              disabled={appActionLoading === app.id}
                              onClick={async () => {
                                setAppActionLoading(app.id);
                                try {
                                  const token = localStorage.getItem('token');
                                  const res = await fetch(`/api/cofounder-applications/${app.id}`, {
                                    method: 'PATCH',
                                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                                    body: JSON.stringify({ status: 'ACCEPTED' }),
                                  });
                                  const data = await res.json();
                                  if (data.success) {
                                    setCofounderApps(prev => prev.map(a => a.id === app.id ? { ...a, status: 'ACCEPTED' } : a));
                                  }
                                } catch { /* ignore */ }
                                setAppActionLoading(null);
                              }}
                              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20 transition-colors disabled:opacity-50"
                            >
                              {appActionLoading === app.id ? '...' : 'Accept'}
                            </button>
                            <button
                              disabled={appActionLoading === app.id}
                              onClick={async () => {
                                setAppActionLoading(app.id);
                                try {
                                  const token = localStorage.getItem('token');
                                  const res = await fetch(`/api/cofounder-applications/${app.id}`, {
                                    method: 'PATCH',
                                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                                    body: JSON.stringify({ status: 'REJECTED' }),
                                  });
                                  const data = await res.json();
                                  if (data.success) {
                                    setCofounderApps(prev => prev.map(a => a.id === app.id ? { ...a, status: 'REJECTED' } : a));
                                  }
                                } catch { /* ignore */ }
                                setAppActionLoading(null);
                              }}
                              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors disabled:opacity-50"
                            >
                              {appActionLoading === app.id ? '...' : 'Decline'}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}
