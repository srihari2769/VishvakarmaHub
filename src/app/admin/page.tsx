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
  TrashIcon,
  XMarkIcon,
  Cog6ToothIcon,
  TrophyIcon,
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
  _count?: { startups: number; contributions: number };
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

interface AllStartup {
  id: string;
  title: string;
  slug: string;
  category: string;
  status: string;
  createdAt: string;
  founder: { firstName: string; lastName: string; email: string };
  campaign: { fundingGoal: number; raisedAmount: number; supporterCount: number; status: string } | null;
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

type Tab = 'overview' | 'pending' | 'startups' | 'users' | 'withdrawals' | 'contacts' | 'reports' | 'competition' | 'settings';

interface CompetitionEntryItem {
  id: string;
  status: string;
  upvotes: number;
  totalScore: number | null;
  createdAt: string;
  startup: { id: string; title: string; slug: string; category: string; logo: string | null };
  user: { firstName: string; lastName: string; email: string };
  _count: { votes: number };
}

interface CompetitionData {
  id: string;
  name: string;
  tagline: string;
  description: string;
  currentPhase: string;
  studentFee: number;
  founderFee: number;
  boothPrice: number;
  boothDescription: string | null;
  registrationStart: string;
  registrationEnd: string;
  screeningEnd: string;
  votingEnd: string;
  finalsDate: string;
  entries: CompetitionEntryItem[];
  judges: CompetitionJudgeItem[];
  sponsors: CompetitionSponsorItem[];
  _count: { entries: number };
}

interface CompetitionJudgeItem {
  id: string;
  name: string;
  title: string;
  organization: string;
  avatar: string | null;
}

interface CompetitionSponsorItem {
  id: string;
  tier: string;
  name: string;
  logo: string | null;
  price: number;
  benefits: string;
}

interface ContactSubmission {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export default function AdminPage() {
  const router = useRouter();
  const { user, isAuthenticated, checkAuth, isLoading } = useAuthStore();
  const [tab, setTab] = useState<Tab>('overview');
  const [pendingStartups, setPendingStartups] = useState<PendingStartup[]>([]);
  const [allStartups, setAllStartups] = useState<AllStartup[]>([]);
  const [users, setUsers] = useState<PlatformUser[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [contacts, setContacts] = useState<ContactSubmission[]>([]);
  const [reports, setReports] = useState<ReportData | null>(null);
  const [stats, setStats] = useState({ totalUsers: 0, totalStartups: 0, totalFunding: 0, pendingReview: 0, pendingWithdrawals: 0 });
  const [searchQuery, setSearchQuery] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [withdrawalNote, setWithdrawalNote] = useState('');
  const [viewUser, setViewUser] = useState<PlatformUser | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'startup' | 'user'; id: string; name: string } | null>(null);
  const [comingSoon, setComingSoon] = useState(false);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [competitionSeeded, setCompetitionSeeded] = useState(false);
  const [seedingCompetition, setSeedingCompetition] = useState(false);
  const [competitionData, setCompetitionData] = useState<CompetitionData | null>(null);
  const [entryStatusLoading, setEntryStatusLoading] = useState<string | null>(null);
  const [compEditMode, setCompEditMode] = useState(false);
  const [compForm, setCompForm] = useState<Record<string, string | number>>({});
  const [compSaving, setCompSaving] = useState(false);
  const [compSubTab, setCompSubTab] = useState<'entries' | 'details' | 'sponsors' | 'judges'>('entries');
  const [sponsorForm, setSponsorForm] = useState({ tier: 'TITLE', sponsorName: '', price: '', benefits: '' });
  const [judgeForm, setJudgeForm] = useState({ judgeName: '', judgeTitle: '', judgeOrganization: '', judgeAvatar: '' });

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
      fetchAdmin('all-startups');
      fetchAdmin('users');
      fetchAdmin('withdrawals');
      fetchAdmin('contacts');
      fetchAdmin('reports');
      fetchSiteSettings();
      fetchCompetitionEntries();
    }
  }, [isAuthenticated, user]);

  const fetchSiteSettings = async () => {
    try {
      const res = await fetch('/api/site-settings');
      const data = await res.json();
      if (data.success) setComingSoon(data.data.comingSoon);
    } catch {}
  };

  const toggleComingSoon = async () => {
    setSettingsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/site-settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ comingSoon: !comingSoon }),
      });
      const data = await res.json();
      if (data.success) setComingSoon(data.data.comingSoon);
    } catch {}
    setSettingsLoading(false);
  };

  const seedCompetition = async () => {
    setSeedingCompetition(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/competition/seed', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setCompetitionSeeded(true);
      else alert(data.error || 'Failed to seed competition');
    } catch {}
    setSeedingCompetition(false);
  };

  const fetchCompetitionEntries = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/admin?action=competition-entries', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success && data.data) setCompetitionData(data.data);
    } catch {}
  };

  const updateEntryStatus = async (entryId: string, status: string) => {
    setEntryStatusLoading(entryId);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/admin', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: 'update-entry-status', entryId, status }),
      });
      const data = await res.json();
      if (data.success) fetchCompetitionEntries();
    } catch {}
    setEntryStatusLoading(null);
  };

  const saveCompetitionDetails = async () => {
    setCompSaving(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/admin', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: 'update-competition', competitionId: competitionData?.id, ...compForm }),
      });
      const data = await res.json();
      if (data.success) {
        setCompEditMode(false);
        fetchCompetitionEntries();
      } else {
        alert(data.error || 'Failed to save');
      }
    } catch {}
    setCompSaving(false);
  };

  const addSponsor = async () => {
    if (!sponsorForm.sponsorName || !sponsorForm.price) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/admin', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          action: 'add-sponsor',
          competitionId: competitionData?.id,
          tier: sponsorForm.tier,
          sponsorName: sponsorForm.sponsorName,
          price: parseFloat(sponsorForm.price),
          benefits: sponsorForm.benefits.split(',').map((b: string) => b.trim()).filter(Boolean),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSponsorForm({ tier: 'TITLE', sponsorName: '', price: '', benefits: '' });
        fetchCompetitionEntries();
      }
    } catch {}
  };

  const deleteSponsor = async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/admin', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: 'delete-sponsor', sponsorId: id }),
      });
      const data = await res.json();
      if (data.success) fetchCompetitionEntries();
    } catch {}
  };

  const addJudge = async () => {
    if (!judgeForm.judgeName || !judgeForm.judgeTitle) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/admin', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          action: 'add-judge',
          competitionId: competitionData?.id,
          judgeName: judgeForm.judgeName,
          judgeTitle: judgeForm.judgeTitle,
          judgeOrganization: judgeForm.judgeOrganization,
          judgeAvatar: judgeForm.judgeAvatar || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setJudgeForm({ judgeName: '', judgeTitle: '', judgeOrganization: '', judgeAvatar: '' });
        fetchCompetitionEntries();
      }
    } catch {}
  };

  const deleteJudge = async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/admin', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: 'delete-judge', judgeId: id }),
      });
      const data = await res.json();
      if (data.success) fetchCompetitionEntries();
    } catch {}
  };

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
        if (action === 'all-startups') setAllStartups(data.data);
        if (action === 'users') setUsers(data.data);
        if (action === 'withdrawals') setWithdrawals(data.data);
        if (action === 'contacts') setContacts(data.data);
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
        fetchAdmin('all-startups');
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

  const handleDeleteStartup = async (startupId: string) => {
    setActionLoading(startupId);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/admin', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: 'delete-startup', startupId }),
      });
      const data = await res.json();
      if (data.success) {
        setPendingStartups((prev) => prev.filter((s) => s.id !== startupId));
        setAllStartups((prev) => prev.filter((s) => s.id !== startupId));
        fetchAdmin('stats');
        setDeleteConfirm(null);
      } else {
        alert(data.error || 'Failed to delete startup');
      }
    } catch (error) {
      console.error('Delete startup failed:', error);
      alert('Failed to delete startup');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    setActionLoading(userId);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/admin', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: 'delete-user', userId }),
      });
      const data = await res.json();
      if (data.success) {
        setUsers((prev) => prev.filter((u) => u.id !== userId));
        fetchAdmin('stats');
        fetchAdmin('all-startups');
        fetchAdmin('pending-startups');
        setDeleteConfirm(null);
      } else {
        alert(data.error || 'Failed to delete user');
      }
    } catch (error) {
      console.error('Delete user failed:', error);
      alert('Failed to delete user');
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
            { id: 'startups' as Tab, label: `All Startups (${allStartups.length})` },
            { id: 'users' as Tab, label: 'Users' },
            { id: 'withdrawals' as Tab, label: `Withdrawals (${withdrawals.filter(w => w.status === 'PENDING').length})` },
            { id: 'contacts' as Tab, label: `Contacts (${contacts.filter(c => !c.isRead).length})` },
            { id: 'reports' as Tab, label: 'Reports' },
            { id: 'competition' as Tab, label: `Competition (${competitionData?._count?.entries || 0})` },
            { id: 'settings' as Tab, label: 'Settings' },
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
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteConfirm({ type: 'startup', id: s.id, name: s.title })}
                          className="!text-red-400 hover:!bg-red-500/10"
                        >
                          <TrashIcon className="w-4 h-4 mr-1" /> Delete
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* All Startups */}
        {tab === 'startups' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {allStartups.length === 0 ? (
              <Card className="p-12 text-center">
                <RocketLaunchIcon className="w-12 h-12 text-muted mx-auto mb-3" />
                <p className="text-foreground font-medium">No startups on the platform</p>
                <p className="text-muted text-sm">Startups will appear here once founders submit ideas.</p>
              </Card>
            ) : (
              <Card className="overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-card">
                        <th className="px-4 py-3 text-left text-muted font-medium">Startup</th>
                        <th className="px-4 py-3 text-left text-muted font-medium">Founder</th>
                        <th className="px-4 py-3 text-left text-muted font-medium">Category</th>
                        <th className="px-4 py-3 text-left text-muted font-medium">Status</th>
                        <th className="px-4 py-3 text-left text-muted font-medium">Funding</th>
                        <th className="px-4 py-3 text-left text-muted font-medium">Submitted</th>
                        <th className="px-4 py-3 text-left text-muted font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allStartups.map((s) => (
                        <tr key={s.id} className="border-b border-border/50 hover:bg-card-hover transition-colors">
                          <td className="px-4 py-3 font-medium text-foreground">{s.title}</td>
                          <td className="px-4 py-3 text-muted">{s.founder.firstName} {s.founder.lastName}</td>
                          <td className="px-4 py-3 text-muted">{s.category}</td>
                          <td className="px-4 py-3">
                            <Badge variant={
                              s.status === 'APPROVED' ? 'success' :
                              s.status === 'PENDING' ? 'warning' :
                              s.status === 'REJECTED' ? 'danger' : 'default'
                            }>
                              {s.status}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-foreground">
                            {s.campaign
                              ? `${formatCurrency(s.campaign.raisedAmount)} / ${formatCurrency(s.campaign.fundingGoal)}`
                              : 'No campaign'}
                          </td>
                          <td className="px-4 py-3 text-muted">{new Date(s.createdAt).toLocaleDateString()}</td>
                          <td className="px-4 py-3">
                            <div className="flex gap-1">
                              <button
                                onClick={() => router.push(`/startup/${s.slug}`)}
                                className="p-1.5 rounded-lg hover:bg-blue/10 text-blue"
                                title="View"
                              >
                                <EyeIcon className="w-4 h-4" />
                              </button>
                              {s.status === 'PENDING' && (
                                <>
                                  <button
                                    onClick={() => handleStartupAction(s.id, 'approve-startup')}
                                    disabled={actionLoading === s.id}
                                    className="p-1.5 rounded-lg hover:bg-emerald-500/10 text-emerald-400"
                                    title="Approve"
                                  >
                                    <CheckCircleIcon className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleStartupAction(s.id, 'reject-startup')}
                                    disabled={actionLoading === s.id}
                                    className="p-1.5 rounded-lg hover:bg-red-500/10 text-red-400"
                                    title="Reject"
                                  >
                                    <XCircleIcon className="w-4 h-4" />
                                  </button>
                                </>
                              )}
                              <button
                                onClick={() => setDeleteConfirm({ type: 'startup', id: s.id, name: s.title })}
                                className="p-1.5 rounded-lg hover:bg-red-500/10 text-red-400"
                                title="Delete"
                              >
                                <TrashIcon className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
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
                          <div className="flex gap-1 items-center">
                            <button
                              onClick={() => setViewUser(u)}
                              className="p-1.5 rounded-lg hover:bg-blue/10 text-blue"
                              title="View user"
                            >
                              <EyeIcon className="w-4 h-4" />
                            </button>
                            {u.role !== 'ADMIN' && (
                              <>
                                <button
                                  onClick={() => handleSuspendUser(u.id)}
                                  disabled={actionLoading === u.id}
                                  className={`text-xs px-2 py-1 rounded-lg ${u.isActive ? 'text-orange hover:bg-orange/10' : 'text-emerald-400 hover:bg-emerald-500/10'}`}
                                >
                                  {u.isActive ? 'Suspend' : 'Reactivate'}
                                </button>
                                <button
                                  onClick={() => setDeleteConfirm({ type: 'user', id: u.id, name: `${u.firstName} ${u.lastName}` })}
                                  className="p-1.5 rounded-lg hover:bg-red-500/10 text-red-400"
                                  title="Delete user"
                                >
                                  <TrashIcon className="w-4 h-4" />
                                </button>
                              </>
                            )}
                          </div>
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

        {/* Contacts */}
        {tab === 'contacts' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            {contacts.length === 0 ? (
              <Card className="p-12 text-center">
                <p className="text-muted">No contact submissions yet.</p>
              </Card>
            ) : (
              contacts.map((c) => (
                <Card key={c.id} className={`p-5 ${!c.isRead ? 'border-blue/30 bg-blue/5' : ''}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-foreground">{c.subject}</h3>
                        {!c.isRead && <span className="text-xs bg-blue/20 text-blue px-2 py-0.5 rounded-full">New</span>}
                      </div>
                      <p className="text-sm text-muted mb-2">From: {c.name} &lt;{c.email}&gt;</p>
                      <p className="text-sm text-foreground whitespace-pre-wrap">{c.message}</p>
                      <p className="text-xs text-muted mt-2">{new Date(c.createdAt).toLocaleString('en-IN')}</p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      {!c.isRead && (
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={actionLoading === c.id}
                          onClick={async () => {
                            setActionLoading(c.id);
                            try {
                              const token = localStorage.getItem('token');
                              await fetch('/api/admin', {
                                method: 'PATCH',
                                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                                body: JSON.stringify({ action: 'mark-contact-read', contactId: c.id }),
                              });
                              setContacts(prev => prev.map(x => x.id === c.id ? { ...x, isRead: true } : x));
                            } catch {}
                            setActionLoading(null);
                          }}
                        >
                          Mark Read
                        </Button>
                      )}
                      <Button
                        variant="danger"
                        size="sm"
                        disabled={actionLoading === c.id}
                        onClick={async () => {
                          setActionLoading(c.id);
                          try {
                            const token = localStorage.getItem('token');
                            await fetch('/api/admin', {
                              method: 'DELETE',
                              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                              body: JSON.stringify({ action: 'delete-contact', contactId: c.id }),
                            });
                            setContacts(prev => prev.filter(x => x.id !== c.id));
                          } catch {}
                          setActionLoading(null);
                        }}
                      >
                        <TrashIcon className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </motion.div>
        )}

        {/* Competition Tab */}
        {tab === 'competition' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            {competitionData ? (
              <>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">{competitionData.name}</h3>
                    <p className="text-sm text-muted">
                      Phase: <span className="text-blue font-medium">{competitionData.currentPhase}</span> &middot; {competitionData._count.entries} entries
                    </p>
                  </div>
                  <Button size="sm" variant="ghost" onClick={fetchCompetitionEntries}>Refresh</Button>
                </div>

                {/* Sub-tabs */}
                <div className="flex gap-1 bg-card rounded-lg p-1">
                  {(['entries', 'details', 'sponsors', 'judges'] as const).map((st) => (
                    <button
                      key={st}
                      onClick={() => setCompSubTab(st)}
                      className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors capitalize ${
                        compSubTab === st ? 'bg-blue text-white' : 'text-muted hover:text-foreground'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>

                {/* Entries Sub-tab */}
                {compSubTab === 'entries' && (
                  <>
                    {competitionData.entries.length === 0 ? (
                      <Card className="p-8 text-center">
                        <TrophyIcon className="w-12 h-12 mx-auto text-muted mb-3" />
                        <p className="text-muted">No entries registered yet.</p>
                      </Card>
                    ) : (
                      <div className="space-y-3">
                        {competitionData.entries.map((entry) => (
                          <Card key={entry.id} className="p-4">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-lg bg-card-hover flex items-center justify-center overflow-hidden flex-shrink-0">
                                {entry.startup.logo ? (
                                  <img src={entry.startup.logo} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  <RocketLaunchIcon className="w-6 h-6 text-muted" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-foreground truncate">{entry.startup.title}</h4>
                                <p className="text-xs text-muted">
                                  {entry.user.firstName} {entry.user.lastName} &middot; {entry.user.email}
                                </p>
                                <p className="text-xs text-muted mt-0.5">
                                  {entry.startup.category} &middot; Registered {new Date(entry.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                              <div className="text-right flex-shrink-0 space-y-1">
                                <Badge variant={
                                  entry.status === 'WINNER' ? 'success' :
                                  entry.status === 'ELIMINATED' ? 'danger' :
                                  entry.status === 'FINALIST' ? 'info' :
                                  entry.status === 'SUBMITTED' ? 'default' : 'warning'
                                }>
                                  {entry.status}
                                </Badge>
                                <p className="text-xs text-muted">{entry.upvotes} votes</p>
                              </div>
                              <div className="flex-shrink-0">
                                <select
                                  className="text-xs bg-card border border-border rounded px-2 py-1.5 text-foreground"
                                  value={entry.status}
                                  disabled={entryStatusLoading === entry.id}
                                  onChange={(e) => updateEntryStatus(entry.id, e.target.value)}
                                >
                                  <option value="SUBMITTED">Submitted</option>
                                  <option value="SHORTLISTED">Shortlisted</option>
                                  <option value="SELECTED_TOP200">Top 200</option>
                                  <option value="PUBLIC_VOTING">Public Voting</option>
                                  <option value="FINALIST">Finalist</option>
                                  <option value="WINNER">Winner</option>
                                  <option value="ELIMINATED">Eliminated</option>
                                </select>
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    )}
                  </>
                )}

                {/* Details Sub-tab */}
                {compSubTab === 'details' && (
                  <Card className="p-6 space-y-6">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-foreground">Competition Details</h4>
                      {!compEditMode ? (
                        <Button size="sm" onClick={() => {
                          setCompForm({
                            name: competitionData.name,
                            tagline: competitionData.tagline || '',
                            description: competitionData.description || '',
                            currentPhase: competitionData.currentPhase,
                            studentFee: competitionData.studentFee,
                            founderFee: competitionData.founderFee,
                            boothPrice: competitionData.boothPrice,
                            boothDescription: competitionData.boothDescription || '',
                            registrationStart: competitionData.registrationStart?.slice(0, 10) || '',
                            registrationEnd: competitionData.registrationEnd?.slice(0, 10) || '',
                            screeningEnd: competitionData.screeningEnd?.slice(0, 10) || '',
                            votingEnd: competitionData.votingEnd?.slice(0, 10) || '',
                            finalsDate: competitionData.finalsDate?.slice(0, 10) || '',
                          });
                          setCompEditMode(true);
                        }}>Edit</Button>
                      ) : (
                        <div className="flex gap-2">
                          <Button size="sm" variant="ghost" onClick={() => setCompEditMode(false)}>Cancel</Button>
                          <Button size="sm" onClick={saveCompetitionDetails} isLoading={compSaving}>Save</Button>
                        </div>
                      )}
                    </div>

                    {compEditMode ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                          <label className="block text-xs text-muted mb-1">Name</label>
                          <input className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground" value={compForm.name || ''} onChange={(e) => setCompForm({ ...compForm, name: e.target.value })} />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-xs text-muted mb-1">Tagline</label>
                          <input className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground" value={compForm.tagline || ''} onChange={(e) => setCompForm({ ...compForm, tagline: e.target.value })} />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-xs text-muted mb-1">Description</label>
                          <textarea rows={3} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground" value={compForm.description || ''} onChange={(e) => setCompForm({ ...compForm, description: e.target.value })} />
                        </div>
                        <div>
                          <label className="block text-xs text-muted mb-1">Current Phase</label>
                          <select className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground" value={compForm.currentPhase || ''} onChange={(e) => setCompForm({ ...compForm, currentPhase: e.target.value })}>
                            <option value="REGISTRATION">Registration</option>
                            <option value="SCREENING">Screening</option>
                            <option value="PUBLIC_VOTING">Public Voting</option>
                            <option value="FINALS">Finals</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs text-muted mb-1">Student Fee (₹)</label>
                          <input type="number" className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground" value={compForm.studentFee || ''} onChange={(e) => setCompForm({ ...compForm, studentFee: parseFloat(e.target.value) || 0 })} />
                        </div>
                        <div>
                          <label className="block text-xs text-muted mb-1">Founder Fee (₹)</label>
                          <input type="number" className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground" value={compForm.founderFee || ''} onChange={(e) => setCompForm({ ...compForm, founderFee: parseFloat(e.target.value) || 0 })} />
                        </div>
                        <div>
                          <label className="block text-xs text-muted mb-1">Booth Price (₹)</label>
                          <input type="number" className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground" value={compForm.boothPrice || ''} onChange={(e) => setCompForm({ ...compForm, boothPrice: parseFloat(e.target.value) || 0 })} />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-xs text-muted mb-1">Booth Description</label>
                          <textarea rows={2} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground" value={compForm.boothDescription || ''} onChange={(e) => setCompForm({ ...compForm, boothDescription: e.target.value })} />
                        </div>
                        <div>
                          <label className="block text-xs text-muted mb-1">Registration Start</label>
                          <input type="date" className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground" value={compForm.registrationStart || ''} onChange={(e) => setCompForm({ ...compForm, registrationStart: e.target.value })} />
                        </div>
                        <div>
                          <label className="block text-xs text-muted mb-1">Registration End</label>
                          <input type="date" className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground" value={compForm.registrationEnd || ''} onChange={(e) => setCompForm({ ...compForm, registrationEnd: e.target.value })} />
                        </div>
                        <div>
                          <label className="block text-xs text-muted mb-1">Screening End</label>
                          <input type="date" className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground" value={compForm.screeningEnd || ''} onChange={(e) => setCompForm({ ...compForm, screeningEnd: e.target.value })} />
                        </div>
                        <div>
                          <label className="block text-xs text-muted mb-1">Voting End</label>
                          <input type="date" className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground" value={compForm.votingEnd || ''} onChange={(e) => setCompForm({ ...compForm, votingEnd: e.target.value })} />
                        </div>
                        <div>
                          <label className="block text-xs text-muted mb-1">Finals Date</label>
                          <input type="date" className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground" value={compForm.finalsDate || ''} onChange={(e) => setCompForm({ ...compForm, finalsDate: e.target.value })} />
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div className="md:col-span-2">
                          <span className="text-muted">Tagline:</span>
                          <p className="text-foreground">{competitionData.tagline || '—'}</p>
                        </div>
                        <div className="md:col-span-2">
                          <span className="text-muted">Description:</span>
                          <p className="text-foreground">{competitionData.description || '—'}</p>
                        </div>
                        <div>
                          <span className="text-muted">Student Fee:</span>
                          <p className="text-foreground font-medium">{formatCurrency(competitionData.studentFee)}</p>
                        </div>
                        <div>
                          <span className="text-muted">Founder Fee:</span>
                          <p className="text-foreground font-medium">{formatCurrency(competitionData.founderFee)}</p>
                        </div>
                        <div>
                          <span className="text-muted">Booth Price:</span>
                          <p className="text-foreground font-medium">{formatCurrency(competitionData.boothPrice)}</p>
                        </div>
                        <div className="md:col-span-2">
                          <span className="text-muted">Booth Description:</span>
                          <p className="text-foreground">{competitionData.boothDescription || '—'}</p>
                        </div>
                        <div>
                          <span className="text-muted">Registration:</span>
                          <p className="text-foreground">{competitionData.registrationStart ? new Date(competitionData.registrationStart).toLocaleDateString() : '—'} → {competitionData.registrationEnd ? new Date(competitionData.registrationEnd).toLocaleDateString() : '—'}</p>
                        </div>
                        <div>
                          <span className="text-muted">Screening End:</span>
                          <p className="text-foreground">{competitionData.screeningEnd ? new Date(competitionData.screeningEnd).toLocaleDateString() : '—'}</p>
                        </div>
                        <div>
                          <span className="text-muted">Voting End:</span>
                          <p className="text-foreground">{competitionData.votingEnd ? new Date(competitionData.votingEnd).toLocaleDateString() : '—'}</p>
                        </div>
                        <div>
                          <span className="text-muted">Finals:</span>
                          <p className="text-foreground">{competitionData.finalsDate ? new Date(competitionData.finalsDate).toLocaleDateString() : '—'}</p>
                        </div>
                      </div>
                    )}
                  </Card>
                )}

                {/* Sponsors Sub-tab */}
                {compSubTab === 'sponsors' && (
                  <div className="space-y-4">
                    {competitionData.sponsors.length > 0 && (
                      <div className="space-y-3">
                        {competitionData.sponsors.map((s) => (
                          <Card key={s.id} className="p-4">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-lg bg-card-hover flex items-center justify-center overflow-hidden flex-shrink-0">
                                {s.logo ? <img src={s.logo} alt="" className="w-full h-full object-cover" /> : <BanknotesIcon className="w-5 h-5 text-muted" />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-foreground">{s.name}</h4>
                                <p className="text-xs text-muted">{s.tier.replace('_', ' ')} &middot; {formatCurrency(s.price)}</p>
                              </div>
                              <button onClick={() => deleteSponsor(s.id)} className="text-red-400 hover:text-red-300 p-1">
                                <TrashIcon className="w-4 h-4" />
                              </button>
                            </div>
                          </Card>
                        ))}
                      </div>
                    )}
                    <Card className="p-4 space-y-3">
                      <h4 className="font-medium text-foreground text-sm">Add Sponsor</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <select className="bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground" value={sponsorForm.tier} onChange={(e) => setSponsorForm({ ...sponsorForm, tier: e.target.value })}>
                          <option value="TITLE">Title Sponsor</option>
                          <option value="PLATINUM">Platinum Sponsor</option>
                          <option value="GOLD">Gold Sponsor</option>
                          <option value="SILVER">Silver Sponsor</option>
                          <option value="STARTUP_PARTNER">Startup Partner</option>
                          <option value="INNOVATION_PARTNER">Innovation Partner</option>
                          <option value="COMMUNITY_PARTNER">Community Partner</option>
                          <option value="STAGE">Stage Sponsor</option>
                          <option value="MEDIA">Media Sponsor</option>
                          <option value="AWARD">Award Sponsor</option>
                        </select>
                        <input placeholder="Sponsor Name" className="bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground" value={sponsorForm.sponsorName} onChange={(e) => setSponsorForm({ ...sponsorForm, sponsorName: e.target.value })} />
                        <input type="number" placeholder="Price (₹)" className="bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground" value={sponsorForm.price} onChange={(e) => setSponsorForm({ ...sponsorForm, price: e.target.value })} />
                        <input placeholder="Benefits (comma-separated)" className="bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground" value={sponsorForm.benefits} onChange={(e) => setSponsorForm({ ...sponsorForm, benefits: e.target.value })} />
                      </div>
                      <Button size="sm" onClick={addSponsor}>Add Sponsor</Button>
                    </Card>
                  </div>
                )}

                {/* Judges Sub-tab */}
                {compSubTab === 'judges' && (
                  <div className="space-y-4">
                    {competitionData.judges.length > 0 && (
                      <div className="space-y-3">
                        {competitionData.judges.map((j) => (
                          <Card key={j.id} className="p-4">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-full bg-card-hover flex items-center justify-center overflow-hidden flex-shrink-0">
                                {j.avatar ? <img src={j.avatar} alt="" className="w-full h-full object-cover" /> : <UsersIcon className="w-5 h-5 text-muted" />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-foreground">{j.name}</h4>
                                <p className="text-xs text-muted">{j.title}{j.organization ? ` at ${j.organization}` : ''}</p>
                              </div>
                              <button onClick={() => deleteJudge(j.id)} className="text-red-400 hover:text-red-300 p-1">
                                <TrashIcon className="w-4 h-4" />
                              </button>
                            </div>
                          </Card>
                        ))}
                      </div>
                    )}
                    <Card className="p-4 space-y-3">
                      <h4 className="font-medium text-foreground text-sm">Add Judge</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <input placeholder="Name" className="bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground" value={judgeForm.judgeName} onChange={(e) => setJudgeForm({ ...judgeForm, judgeName: e.target.value })} />
                        <input placeholder="Title (e.g. CEO)" className="bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground" value={judgeForm.judgeTitle} onChange={(e) => setJudgeForm({ ...judgeForm, judgeTitle: e.target.value })} />
                        <input placeholder="Organization" className="bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground" value={judgeForm.judgeOrganization} onChange={(e) => setJudgeForm({ ...judgeForm, judgeOrganization: e.target.value })} />
                        <input placeholder="Avatar URL (optional)" className="bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground" value={judgeForm.judgeAvatar} onChange={(e) => setJudgeForm({ ...judgeForm, judgeAvatar: e.target.value })} />
                      </div>
                      <Button size="sm" onClick={addJudge}>Add Judge</Button>
                    </Card>
                  </div>
                )}
              </>
            ) : (
              <Card className="p-8 text-center">
                <TrophyIcon className="w-12 h-12 mx-auto text-muted mb-3" />
                <p className="text-muted mb-4">No competition created yet.</p>
                <Button onClick={seedCompetition} disabled={seedingCompetition} size="sm">
                  {seedingCompetition ? 'Creating...' : 'Create Competition'}
                </Button>
              </Card>
            )}
          </motion.div>
        )}

        {/* Settings Tab */}
        {tab === 'settings' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 max-w-2xl">
            {/* Coming Soon Toggle */}
            <Card className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-orange/10 flex items-center justify-center flex-shrink-0">
                  <Cog6ToothIcon className="w-5 h-5 text-orange" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground mb-1">Coming Soon Mode</h3>
                  <p className="text-sm text-muted mb-4">
                    When enabled, the entire website will be inaccessible. Only the Competition event page
                    and the Admin panel will remain accessible.
                  </p>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={toggleComingSoon}
                      disabled={settingsLoading}
                      className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors ${
                        comingSoon ? 'bg-orange' : 'bg-border'
                      }`}
                    >
                      <span
                        className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                          comingSoon ? 'translate-x-8' : 'translate-x-1'
                        }`}
                      />
                    </button>
                    <span className={`text-sm font-medium ${comingSoon ? 'text-orange' : 'text-muted'}`}>
                      {comingSoon ? 'ENABLED — Site is in Coming Soon mode' : 'DISABLED — Site is live'}
                    </span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Competition Seeding */}
            <Card className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-purple/10 flex items-center justify-center flex-shrink-0">
                  <TrophyIcon className="w-5 h-5 text-purple" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground mb-1">Vishvakarma Innovation Challenge 2026</h3>
                  <p className="text-sm text-muted mb-4">
                    Initialize the national startup competition. This will create the competition record with all phases and dates configured.
                  </p>
                  {competitionSeeded ? (
                    <div className="flex items-center gap-2 text-green-400 text-sm">
                      <CheckCircleIcon className="w-5 h-5" />
                      Competition created successfully!
                    </div>
                  ) : (
                    <Button
                      onClick={seedCompetition}
                      disabled={seedingCompetition}
                      size="sm"
                    >
                      {seedingCompetition ? 'Creating...' : 'Create Competition'}
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </div>
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setDeleteConfirm(null)}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card border border-border rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
                <ExclamationTriangleIcon className="w-5 h-5 text-red-400" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">Confirm Delete</h3>
            </div>
            <p className="text-muted text-sm mb-1">
              Are you sure you want to permanently delete this {deleteConfirm.type}?
            </p>
            <p className="text-foreground font-medium mb-4">&quot;{deleteConfirm.name}&quot;</p>
            {deleteConfirm.type === 'user' && (
              <p className="text-xs text-red-400 mb-4">
                This will also delete all their startups, campaigns, contributions, and related data.
              </p>
            )}
            {deleteConfirm.type === 'startup' && (
              <p className="text-xs text-red-400 mb-4">
                This will also delete the campaign, contributions, milestones, comments, and all related data.
              </p>
            )}
            <div className="flex gap-3 justify-end">
              <Button variant="ghost" size="sm" onClick={() => setDeleteConfirm(null)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                isLoading={actionLoading === deleteConfirm.id}
                onClick={() => {
                  if (deleteConfirm.type === 'startup') handleDeleteStartup(deleteConfirm.id);
                  else handleDeleteUser(deleteConfirm.id);
                }}
              >
                <TrashIcon className="w-4 h-4 mr-1" /> Delete
              </Button>
            </div>
          </motion.div>
        </div>
      )}

      {/* User View Modal */}
      {viewUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setViewUser(null)}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card border border-border rounded-2xl p-6 w-full max-w-lg mx-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-foreground">User Details</h3>
              <button onClick={() => setViewUser(null)} className="p-1.5 rounded-lg hover:bg-card-hover text-muted">
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue to-purple flex items-center justify-center text-white text-xl font-bold">
                {viewUser.firstName[0]}
              </div>
              <div>
                <p className="text-lg font-semibold text-foreground">{viewUser.firstName} {viewUser.lastName}</p>
                <p className="text-sm text-muted">{viewUser.email}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="p-3 rounded-xl bg-card-hover">
                <p className="text-xs text-muted mb-1">Role</p>
                <Badge variant={viewUser.role === 'ADMIN' ? 'info' : viewUser.role === 'FOUNDER' ? 'success' : 'default'}>
                  {viewUser.role}
                </Badge>
              </div>
              <div className="p-3 rounded-xl bg-card-hover">
                <p className="text-xs text-muted mb-1">Status</p>
                <Badge variant={viewUser.isActive ? 'success' : 'danger'}>
                  {viewUser.isActive ? 'Active' : 'Suspended'}
                </Badge>
              </div>
              <div className="p-3 rounded-xl bg-card-hover">
                <p className="text-xs text-muted mb-1">Startups</p>
                <p className="text-foreground font-semibold">{viewUser._count?.startups ?? 0}</p>
              </div>
              <div className="p-3 rounded-xl bg-card-hover">
                <p className="text-xs text-muted mb-1">Contributions</p>
                <p className="text-foreground font-semibold">{viewUser._count?.contributions ?? 0}</p>
              </div>
            </div>
            <div className="p-3 rounded-xl bg-card-hover mb-6">
              <p className="text-xs text-muted mb-1">Joined</p>
              <p className="text-foreground text-sm">{new Date(viewUser.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            </div>
            <div className="flex gap-3 justify-end">
              {viewUser.role !== 'ADMIN' && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => { handleSuspendUser(viewUser.id); setViewUser(null); }}
                  >
                    {viewUser.isActive ? 'Suspend' : 'Reactivate'}
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => { setViewUser(null); setDeleteConfirm({ type: 'user', id: viewUser.id, name: `${viewUser.firstName} ${viewUser.lastName}` }); }}
                  >
                    <TrashIcon className="w-4 h-4 mr-1" /> Delete
                  </Button>
                </>
              )}
              <Button variant="ghost" size="sm" onClick={() => setViewUser(null)}>
                Close
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
