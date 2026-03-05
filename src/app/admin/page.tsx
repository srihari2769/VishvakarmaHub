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

type Tab = 'overview' | 'pending' | 'users' | 'reports';

export default function AdminPage() {
  const router = useRouter();
  const { user, isAuthenticated, checkAuth, isLoading } = useAuthStore();
  const [tab, setTab] = useState<Tab>('overview');
  const [pendingStartups, setPendingStartups] = useState<PendingStartup[]>([]);
  const [users, setUsers] = useState<PlatformUser[]>([]);
  const [stats, setStats] = useState({ totalUsers: 0, totalStartups: 0, totalFunding: 0, pendingReview: 0 });
  const [searchQuery, setSearchQuery] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

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
      await fetch('/api/admin', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: 'suspend-user', userId }),
      });
      fetchAdmin('users');
    } catch (error) {
      console.error('Suspend failed:', error);
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

        {/* Reports */}
        {tab === 'reports' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Card className="p-12 text-center">
              <ChartBarIcon className="w-16 h-16 text-muted mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-foreground mb-2">Reports Coming Soon</h2>
              <p className="text-muted">Financial reports, platform analytics, and moderation logs.</p>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}
