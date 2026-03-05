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

type Tab = 'overview' | 'startups' | 'analytics' | 'withdraw';

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
      </div>
    </div>
  );
}
