'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Button, Card, Badge } from '@/components/ui';
import { useAuthStore } from '@/store/authStore';
import { formatCurrency } from '@/lib/utils';
import {
  ShieldCheckIcon,
  UsersIcon,
  RocketLaunchIcon,
  CurrencyRupeeIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
  ChartBarIcon,
  EyeIcon,
  BanknotesIcon,
  ArrowTrendingUpIcon,
} from '@heroicons/react/24/outline';

interface PendingStartup {
  id: string;
  title: string;
  slug: string;
  category: string;
  description?: string;
  createdAt: string;
  founder: { firstName: string; lastName: string; email: string };
}

interface PlatformUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

interface WithdrawalRequest {
  id: string;
  amount: number;
  status: string;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  accountHolder: string;
  note?: string;
  adminNote?: string;
  createdAt: string;
  user: { firstName: string; lastName: string; email: string };
  campaign: { startup: { title: string; slug: string } };
}

interface ReportData {
  totalUsers: number;
  totalStartups: number;
  totalCampaigns: number;
  totalFunding: number;
  avgFunding: number;
  totalContributions: number;
  startupsByStatus: { status: string; count: number }[];
  campaignsByStatus: { status: string; count: number }[];
  withdrawalStats: { status: string; count: number; amount: number }[];
}

type Tab = 'overview' | 'pending' | 'users' | 'withdrawals' | 'reports';

export default function AdminPage() {
  const router = useRouter();
  const { user, isAuthenticated, checkAuth, isLoading } = useAuthStore();
  const [tab, setTab] = useState<Tab>('overview');
  const [pendingStartups, setPendingStartups] = useState<PendingStartup[]>([]);
  const [users, setUsers] = useState<PlatformUser[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [reports, setReports] = useState<ReportData | null>(null);
  const [stats, setStats] = useState({ totalUsers: 0, totalStartups: 0, totalFunding: 0, pendingReview: 0, pendingWithdrawals: 0 });
  const [searchQuery, setSearchQuery] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [withdrawalNote, setWithdrawalNote] = useState('');

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login?redirect=/admin');
    }
    if (!isLoading && isAuthenticated && user?.role !== 'ADMIN') {
      router.push('/dashboard');
    }
  }, [isLoading, isAuthenticated, user, router]);

  useEffect(() => {
    if (isAuthenticated && user?.role === 'ADMIN') {
      fetchAdmin('stats');
      fetchAdmin('pending-startups');
      fetchAdmin('users');
      fetchAdmin('withdrawals');
      fetchAdmin('reports');
    }
  }, [isAuthenticated, user]);

  const fetchAdmin = async (action: string) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/admin?action=${action}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        if (action === 'stats') setStats(data.data);
        if (action === 'pending-startups') setPendingStartups(data.data);
        if (action === 'users') setUsers(data.data);
        if (action === 'withdrawals') setWithdrawals(data.data);
        if (action === 'reports') setReports(data.data);
      }
    } catch (error) {
      console.error(`Failed to fetch ${action}:`, error);
    }
  };

  const handleStartupAction = async (startupId: string, action: 'approve-startup' | 'reject-startup') => {
    setActionLoading(startupId);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/admin', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action, startupId }),
      });
      const data = await res.json();
      if (data.success) {
        setPendingStartups((prev) => prev.filter((s) => s.id !== startupId));
        fetchAdmin('stats');
      }
    } catch (error) {
      console.error('Action failed:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleSuspendUser = async (userId: string) => {
    setActionLoading(userId);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/admin', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: 'suspend-user', userId }),
      });
      const data = await res.json();
      if (data.success) {
        setUsers((prev) =>
          prev.map((u) => u.id === userId ? { ...u, isActive: data.data.isActive } : u)
        );
      }
    } catch (error) {
      console.error('Suspend failed:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleWithdrawalAction = async (withdrawalId: string, action: 'approve-withdrawal' | 'reject-withdrawal') => {
    setActionLoading(withdrawalId);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/admin', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action, withdrawalId, adminNote: withdrawalNote }),
      });
      const data = await res.json();
      if (data.success) {
        fetchAdmin('withdrawals');
        fetchAdmin('stats');
        setWithdrawalNote('');
      }
    } catch (error) {
      console.error('Withdrawal action failed:', error);
    } finally {
      setActionLoading(null);
    }
  };

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-blue border-t-transparent rounded-full" />
      </div>
    );
  }

  const filteredUsers = users.filter(
    (u) =>
      u.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center gap-3 mb-1">
            <ShieldCheckIcon className="w-7 h-7 text-blue" />
            <h1 className="text-2xl font-bold text-foreground">Admin Panel</h1>
          </div>
          <p className="text-muted text-sm">Platform moderation and management</p>
        </motion.div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Users', value: stats.totalUsers, icon: UsersIcon, color: 'text-blue' },
            { label: 'Total Startups', value: stats.totalStartups, icon: RocketLaunchIcon, color: 'text-purple' },
            { label: 'Total Funding', value: formatCurrency(stats.totalFunding), icon: CurrencyRupeeIcon, color: 'text-emerald-400' },
            { label: 'Pending Review', value: stats.pendingReview, icon: ExclamationTriangleIcon, color: 'text-orange' },
          ].map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.label} className="p-5">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg bg-card-hover flex items-center justify-center ${stat.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xl font-bold text-foreground">{stat.value}</p>
                    <p className="text-xs text-muted">{stat.label}</p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-border mb-8 overflow-x-auto">
          {([
            { id: 'overview' as Tab, label: 'Overview' },
            { id: 'pending' as Tab, label: `Pending (${pendingStartups.length})` },
            { id: 'users' as Tab, label: 'Users' },
            { id: 'withdrawals' as Tab, label: `Withdrawals (${withdrawals.filter(w => w.status === 'PENDING').length})` },
            { id: 'reports' as Tab, label: 'Reports' },
          ]).map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                tab === t.id
                  ? 'border-blue text-blue'
                  : 'border-transparent text-muted hover:text-foreground'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Overview */}
        {tab === 'overview' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid md:grid-cols-2 gap-6">
            <Card className="p-6">
              <h2 className="font-semibold text-foreground mb-4">Pending Approvals</h2>
              {pendingStartups.length === 0 ? (
                <p className="text-muted text-sm">No startups pending review</p>
              ) : (
                <div className="space-y-3">
                  {pendingStartups.slice(0, 5).map((s) => (
                    <div key={s.id} className="flex items-center justify-between p-3 rounded-xl bg-card-hover">
                      <div>
                        <p className="font-medium text-foreground text-sm">{s.title}</p>
                        <p className="text-xs text-muted">{s.founder.firstName} {s.founder.lastName}</p>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => router.push(`/startup/${s.slug}`)}
                          className="p-1.5 rounded-lg hover:bg-blue/10 text-blue"
                          title="View startup"
                        >
                          <EyeIcon className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleStartupAction(s.id, 'approve-startup')}
                          disabled={actionLoading === s.id}
                          className="p-1.5 rounded-lg hover:bg-emerald-500/10 text-emerald-400"
                        >
                          <CheckCircleIcon className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleStartupAction(s.id, 'reject-startup')}
                          disabled={actionLoading === s.id}
                          className="p-1.5 rounded-lg hover:bg-red-500/10 text-red-400"
                        >
                          <XCircleIcon className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <Card className="p-6">
              <h2 className="font-semibold text-foreground mb-4">Recent Users</h2>
              {users.length === 0 ? (
                <p className="text-muted text-sm">No users yet</p>
              ) : (
                <div className="space-y-3">
                  {users.slice(0, 5).map((u) => (
                    <div key={u.id} className="flex items-center justify-between p-3 rounded-xl bg-card-hover">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue to-purple flex items-center justify-center text-white text-xs font-bold">
                          {u.firstName[0]}
                        </div>
                        <div>
                          <p className="font-medium text-foreground text-sm">{u.firstName} {u.lastName}</p>
                          <p className="text-xs text-muted">{u.email}</p>
                        </div>
                      </div>
                      <Badge variant={u.role === 'ADMIN' ? 'info' : u.role === 'FOUNDER' ? 'success' : 'default'}>
                        {u.role}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </motion.div>
        )}

        {/* Pending */}
        {tab === 'pending' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {pendingStartups.length === 0 ? (
              <Card className="p-12 text-center">
                <CheckCircleIcon className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
                <p className="text-foreground font-medium">All caught up!</p>
                <p className="text-muted text-sm">No startups pending review</p>
              </Card>
            ) : (
              <div className="space-y-4">
                {pendingStartups.map((s) => (
                  <Card key={s.id} className="p-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <h3 className="font-semibold text-foreground">{s.title}</h3>
                        <p className="text-sm text-muted">
                          Category: {s.category} &bull; By: {s.founder.firstName} {s.founder.lastName} ({s.founder.email})
                        </p>
                        <p className="text-xs text-muted mt-1">
                          Submitted {new Date(s.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/startup/${s.slug}`)}
                        >
                          <EyeIcon className="w-4 h-4 mr-1" /> View
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleStartupAction(s.id, 'approve-startup')}
                          isLoading={actionLoading === s.id}
                        >
                          <CheckCircleIcon className="w-4 h-4 mr-1" /> Approve
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleStartupAction(s.id, 'reject-startup')}
                          isLoading={actionLoading === s.id}
                        >
                          <XCircleIcon className="w-4 h-4 mr-1" /> Reject
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Users */}
        {tab === 'users' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="mb-4">
              <div className="relative max-w-md">
                <MagnifyingGlassIcon className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search users..."
                  className="w-full bg-input border border-border rounded-xl pl-10 pr-4 py-2.5 text-foreground placeholder-muted text-sm focus:outline-none focus:border-blue"
                />
              </div>
            </div>
            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-card">
                      <th className="px-4 py-3 text-left text-muted font-medium">User</th>
                      <th className="px-4 py-3 text-left text-muted font-medium">Email</th>
                      <th className="px-4 py-3 text-left text-muted font-medium">Role</th>
                      <th className="px-4 py-3 text-left text-muted font-medium">Status</th>
                      <th className="px-4 py-3 text-left text-muted font-medium">Joined</th>
                      <th className="px-4 py-3 text-left text-muted font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((u) => (
                      <tr key={u.id} className="border-b border-border/50 hover:bg-card-hover transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue to-purple flex items-center justify-center text-white text-xs font-bold">
                              {u.firstName[0]}
                            </div>
                            <span className="font-medium text-foreground">{u.firstName} {u.lastName}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-muted">{u.email}</td>
                        <td className="px-4 py-3">
                          <Badge variant={u.role === 'ADMIN' ? 'info' : u.role === 'FOUNDER' ? 'success' : 'default'}>
                            {u.role}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={u.isActive ? 'success' : 'danger'}>
                            {u.isActive ? 'Active' : 'Suspended'}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-muted">{new Date(u.createdAt).toLocaleDateString()}</td>
                        <td className="px-4 py-3">
                          {u.role !== 'ADMIN' && (
                            <button
                              onClick={() => handleSuspendUser(u.id)}
                              disabled={actionLoading === u.id}
                              className="text-xs text-red-400 hover:text-red-300"
                            >
                              {u.isActive ? 'Suspend' : 'Reactivate'}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Withdrawals */}
        {tab === 'withdrawals' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {withdrawals.length === 0 ? (
              <Card className="p-12 text-center">
                <BanknotesIcon className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
                <p className="text-foreground font-medium">No withdrawal requests</p>
                <p className="text-muted text-sm">Withdrawal requests from founders will appear here</p>
              </Card>
            ) : (
              <div className="space-y-4">
                {withdrawals.map((w) => (
                  <Card key={w.id} className="p-5">
                    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-foreground">
                            {formatCurrency(w.amount)}
                          </h3>
                          <Badge
                            variant={
                              w.status === 'APPROVED' ? 'success' :
                              w.status === 'REJECTED' ? 'danger' :
                              w.status === 'COMPLETED' ? 'info' : 'warning'
                            }
                          >
                            {w.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted mb-1">
                          <span className="text-foreground font-medium">{w.user.firstName} {w.user.lastName}</span>
                          {' '}&bull; {w.user.email}
                        </p>
                        <p className="text-sm text-muted mb-2">
                          Campaign: <span className="text-foreground">{w.campaign.startup.title}</span>
                        </p>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-muted bg-card-hover rounded-lg p-3">
                          <div><span className="font-medium text-foreground">Bank:</span> {w.bankName}</div>
                          <div><span className="font-medium text-foreground">A/C:</span> {w.accountNumber}</div>
                          <div><span className="font-medium text-foreground">IFSC:</span> {w.ifscCode}</div>
                          <div><span className="font-medium text-foreground">Holder:</span> {w.accountHolder}</div>
                        </div>
                        {w.note && <p className="text-xs text-muted mt-2">Note: {w.note}</p>}
                        <p className="text-xs text-muted mt-1">
                          Requested: {new Date(w.createdAt).toLocaleString()}
                        </p>
                      </div>
                      {w.status === 'PENDING' && (
                        <div className="flex flex-col gap-2 shrink-0 min-w-[200px]">
                          <input
                            type="text"
                            placeholder="Admin note (optional)"
                            value={withdrawalNote}
                            onChange={(e) => setWithdrawalNote(e.target.value)}
                            className="w-full px-3 py-2 bg-input border border-border rounded-lg text-sm text-foreground placeholder-muted focus:outline-none focus:border-blue"
                          />
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleWithdrawalAction(w.id, 'approve-withdrawal')}
                              isLoading={actionLoading === w.id}
                              className="flex-1"
                            >
                              <CheckCircleIcon className="w-4 h-4 mr-1" /> Approve
                            </Button>
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => handleWithdrawalAction(w.id, 'reject-withdrawal')}
                              isLoading={actionLoading === w.id}
                              className="flex-1"
                            >
                              <XCircleIcon className="w-4 h-4 mr-1" /> Reject
                            </Button>
                          </div>
                        </div>
                      )}
                      {w.adminNote && (
                        <p className="text-xs text-muted italic">Admin: {w.adminNote}</p>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Reports */}
        {tab === 'reports' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            {reports ? (
              <>
                {/* Key Metrics */}
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    { label: 'Total Users', value: reports.totalUsers, icon: UsersIcon, color: 'text-blue' },
                    { label: 'Total Startups', value: reports.totalStartups, icon: RocketLaunchIcon, color: 'text-purple' },
                    { label: 'Total Campaigns', value: reports.totalCampaigns, icon: ArrowTrendingUpIcon, color: 'text-orange' },
                    { label: 'Total Funding', value: formatCurrency(reports.totalFunding), icon: CurrencyRupeeIcon, color: 'text-emerald-400' },
                    { label: 'Avg per Campaign', value: formatCurrency(reports.avgFunding), icon: ChartBarIcon, color: 'text-cyan-400' },
                    { label: 'Total Contributions', value: reports.totalContributions, icon: BanknotesIcon, color: 'text-yellow-400' },
                  ].map((m) => {
                    const Icon = m.icon;
                    return (
                      <Card key={m.label} className="p-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-lg bg-card-hover flex items-center justify-center ${m.color}`}>
                            <Icon className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-lg font-bold text-foreground">{m.value}</p>
                            <p className="text-xs text-muted">{m.label}</p>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>

                {/* Startups by Status */}
                <div className="grid md:grid-cols-2 gap-6">
                  <Card className="p-6">
                    <h3 className="font-semibold text-foreground mb-4">Startups by Status</h3>
                    {reports.startupsByStatus.length === 0 ? (
                      <p className="text-muted text-sm">No startup data yet</p>
                    ) : (
                      <div className="space-y-3">
                        {reports.startupsByStatus.map((s) => (
                          <div key={s.status} className="flex items-center justify-between p-3 rounded-lg bg-card-hover">
                            <Badge
                              variant={
                                s.status === 'APPROVED' ? 'success' :
                                s.status === 'REJECTED' ? 'danger' :
                                s.status === 'PENDING' ? 'warning' : 'default'
                              }
                            >
                              {s.status}
                            </Badge>
                            <span className="font-bold text-foreground">{s.count}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </Card>

                  <Card className="p-6">
                    <h3 className="font-semibold text-foreground mb-4">Campaigns by Status</h3>
                    {reports.campaignsByStatus.length === 0 ? (
                      <p className="text-muted text-sm">No campaign data yet</p>
                    ) : (
                      <div className="space-y-3">
                        {reports.campaignsByStatus.map((c) => (
                          <div key={c.status} className="flex items-center justify-between p-3 rounded-lg bg-card-hover">
                            <Badge
                              variant={
                                c.status === 'ACTIVE' ? 'success' :
                                c.status === 'COMPLETED' ? 'info' :
                                c.status === 'FAILED' ? 'danger' : 'default'
                              }
                            >
                              {c.status}
                            </Badge>
                            <span className="font-bold text-foreground">{c.count}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </Card>
                </div>

                {/* Withdrawal Summary */}
                <Card className="p-6">
                  <h3 className="font-semibold text-foreground mb-4">Withdrawal Summary</h3>
                  {reports.withdrawalStats.length === 0 ? (
                    <p className="text-muted text-sm">No withdrawals yet</p>
                  ) : (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      {reports.withdrawalStats.map((w) => (
                        <div key={w.status} className="p-4 rounded-xl bg-card-hover text-center">
                          <Badge
                            variant={
                              w.status === 'APPROVED' || w.status === 'COMPLETED' ? 'success' :
                              w.status === 'REJECTED' ? 'danger' : 'warning'
                            }
                          >
                            {w.status}
                          </Badge>
                          <p className="text-lg font-bold text-foreground mt-2">{w.count}</p>
                          <p className="text-xs text-muted">{formatCurrency(w.amount)}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              </>
            ) : (
              <Card className="p-12 text-center">
                <div className="animate-spin w-8 h-8 border-2 border-blue border-t-transparent rounded-full mx-auto" />
                <p className="text-muted mt-4">Loading reports...</p>
              </Card>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
