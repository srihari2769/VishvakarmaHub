'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Card, Button, Input } from '@/components/ui';
import { useAuthStore } from '@/store/authStore';
import { UserGroupIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Razorpay: any;
  }
}

interface TeamMember {
  user: { id: string; name: string };
  role: string;
}

interface Team {
  id: string;
  name: string;
  code: string;
  totalScore: number;
  isActive: boolean;
  paymentStatus: string;
  members: TeamMember[];
  myRole?: string;
}

export default function TeamsPage() {
  const router = useRouter();
  const { token, loginContext } = useAuthStore();
  const [teams, setTeams] = useState<Team[]>([]);
  const [teamEntryFee, setTeamEntryFee] = useState(249);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'my-teams' | 'create' | 'join'>('my-teams');
  const [teamName, setTeamName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token || loginContext !== 'vsc') { router.push('/vsc/login'); return; }
    loadTeams();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, loginContext, router]);

  const loadTeams = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/vsc/teams', { headers: { Authorization: `Bearer ${token}` } });
      const d = await res.json();
      if (d.success) { setTeams(d.data.teams); setTeamEntryFee(d.data.teamEntryFee); }
    } catch { /* ignore */ }
    setLoading(false);
  };

  const handleCreate = async () => {
    if (!token || !teamName.trim()) return;
    setProcessing(true);
    setMessage('');
    try {
      const res = await fetch('/api/vsc/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: teamName.trim() }),
      });
      const d = await res.json();
      if (!d.success) { setMessage(d.error); setProcessing(false); return; }

      const options = {
        key: d.data.keyId,
        amount: d.data.amount,
        currency: d.data.currency,
        name: 'VSC Team Battle',
        description: `Create Team: ${teamName.trim()}`,
        order_id: d.data.orderId,
        handler: async (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
          const verify = await fetch('/api/vsc/teams', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ action: 'verify', teamId: d.data.teamId, ...response }),
          });
          const v = await verify.json();
          if (v.success) { setMessage(`Team created! Code: ${d.data.teamCode}`); loadTeams(); setTab('my-teams'); }
          else setMessage('Payment verification failed');
        },
        theme: { color: '#ec4899' },
      };
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch { setMessage('Failed'); }
    setProcessing(false);
  };

  const handleJoin = async () => {
    if (!token || !joinCode.trim()) return;
    setProcessing(true);
    setMessage('');
    try {
      const res = await fetch('/api/vsc/teams', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: 'join', code: joinCode.trim().toUpperCase() }),
      });
      const d = await res.json();
      setMessage(d.success ? d.data.message : d.error);
      if (d.success) { loadTeams(); setTab('my-teams'); }
    } catch { setMessage('Failed'); }
    setProcessing(false);
  };

  if (loading) return <div className="min-h-screen bg-[#050508] flex items-center justify-center"><div className="w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-[#050508] text-white pt-20 pb-12 px-4">
      <script src="https://checkout.razorpay.com/v1/checkout.js" async />
      <div className="max-w-3xl mx-auto">
        <Link href="/vsc/dashboard" className="inline-flex items-center gap-2 text-sm text-white/30 hover:text-white/50 mb-6">
          <ArrowLeftIcon className="w-4 h-4" /> Back to Dashboard
        </Link>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-black mb-2 flex items-center gap-3">
            <UserGroupIcon className="w-8 h-8 text-pink-400" /> Clan Battles
          </h1>
          <p className="text-white/40 mb-6">Form a team of 3. Compete together. Share the glory.</p>

          <div className="flex gap-2 mb-6">
            {(['my-teams', 'create', 'join'] as const).map(t => (
              <button key={t} onClick={() => { setTab(t); setMessage(''); }}
                className={`px-4 py-2 rounded-lg text-sm font-semibold capitalize transition-all ${
                  tab === t ? 'bg-pink-500/20 text-pink-300 border border-pink-500/30' : 'bg-white/[0.03] text-white/40 border border-white/5'
                }`}>
                {t === 'my-teams' ? 'My Teams' : t === 'create' ? 'Create Team' : 'Join Team'}
              </button>
            ))}
          </div>

          {message && <div className="mb-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-sm text-amber-400">{message}</div>}

          {tab === 'my-teams' && (
            teams.length === 0 ? (
              <Card className="p-12 bg-white/[0.02] border-white/5 text-center">
                <div className="text-4xl mb-4">👥</div>
                <h2 className="text-xl font-bold mb-2">No Teams Yet</h2>
                <p className="text-white/40 mb-4">Create a team or join one with a code!</p>
              </Card>
            ) : (
              <div className="space-y-4">
                {teams.map(t => (
                  <Card key={t.id} className="p-6 bg-white/[0.02] border-pink-500/10">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-lg font-bold text-white">{t.name}</h3>
                        <p className="text-xs text-white/30">Code: <span className="font-mono text-pink-400">{t.code}</span> · {t.myRole}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-black text-amber-400">{t.totalScore.toFixed(0)}</div>
                        <div className="text-[10px] text-white/25">Total Score</div>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      {t.members.map((m, i) => (
                        <div key={i} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/5">
                          <span className="text-sm">{m.role === 'CAPTAIN' ? '👑' : '👤'}</span>
                          <span className="text-sm text-white/60">{m.user.name}</span>
                        </div>
                      ))}
                      {t.members.length < 3 && (
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-dashed border-white/10 text-white/20 text-sm">
                          + {3 - t.members.length} spot{t.members.length < 2 ? 's' : ''}
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )
          )}

          {tab === 'create' && (
            <Card className="p-6 bg-white/[0.02] border-white/5">
              <h3 className="text-lg font-bold mb-4">Create Your Team</h3>
              <p className="text-sm text-white/40 mb-4">Captain pays ₹{teamEntryFee}. Team members join free with your team code.</p>
              <Input
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="Team Name"
                className="mb-4 bg-white/[0.03] border-white/10 text-white"
              />
              <Button onClick={handleCreate} disabled={processing || !teamName.trim()}
                className="w-full py-3 bg-gradient-to-r from-pink-600 to-rose-500 rounded-xl font-bold disabled:opacity-50">
                {processing ? 'Processing...' : `Create Team — ₹${teamEntryFee}`}
              </Button>
            </Card>
          )}

          {tab === 'join' && (
            <Card className="p-6 bg-white/[0.02] border-white/5">
              <h3 className="text-lg font-bold mb-4">Join a Team</h3>
              <p className="text-sm text-white/40 mb-4">Enter the team code shared by your captain. Joining is free!</p>
              <Input
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="Team Code (e.g. VSC-A1B2C3)"
                className="mb-4 bg-white/[0.03] border-white/10 text-white font-mono"
              />
              <Button onClick={handleJoin} disabled={processing || !joinCode.trim()}
                className="w-full py-3 bg-gradient-to-r from-pink-600 to-rose-500 rounded-xl font-bold disabled:opacity-50">
                {processing ? 'Joining...' : 'Join Team'}
              </Button>
            </Card>
          )}
        </motion.div>
      </div>
    </div>
  );
}
