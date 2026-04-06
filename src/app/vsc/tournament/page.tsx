'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Card, Button } from '@/components/ui';
import { useAuthStore } from '@/store/authStore';
import { TrophyIcon, ArrowLeftIcon, ClockIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Razorpay: any;
  }
}

interface Tournament {
  id: string;
  title: string;
  description: string;
  entryFee: number;
  prizePool: number;
  prizes: unknown;
  startsAt: string;
  endsAt: string;
  timeLimit: number;
  maxParticipants: number | null;
  participantCount: number;
  isLive: boolean;
}

export default function TournamentPage() {
  const router = useRouter();
  const { token, loginContext } = useAuthStore();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState<string | null>(null);

  useEffect(() => {
    if (!token || loginContext !== 'vsc') { router.push('/vsc/login'); return; }
    fetch('/api/vsc/tournament', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { if (d.success) setTournaments(d.data.tournaments); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token, loginContext, router]);

  const handleJoin = async (tournamentId: string) => {
    if (!token) return;
    setJoining(tournamentId);
    try {
      const res = await fetch('/api/vsc/tournament', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ tournamentId }),
      });
      const d = await res.json();
      if (!d.success) { alert(d.error); setJoining(null); return; }

      const options = {
        key: d.data.keyId,
        amount: d.data.amount,
        currency: d.data.currency,
        name: 'VSC Tournament',
        description: 'Tournament Entry Fee',
        order_id: d.data.orderId,
        handler: async (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
          const verify = await fetch('/api/vsc/tournament', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ action: 'verify', entryId: d.data.entryId, ...response }),
          });
          const v = await verify.json();
          if (v.success) alert('Registered! Good luck!');
          else alert('Payment verification failed');
        },
        theme: { color: '#0ea5e9' },
      };
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch { alert('Failed to join'); }
    setJoining(null);
  };

  if (loading) return <div className="min-h-screen bg-[#050508] flex items-center justify-center"><div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-[#050508] text-white pt-20 pb-12 px-4">
      <script src="https://checkout.razorpay.com/v1/checkout.js" async />
      <div className="max-w-4xl mx-auto">
        <Link href="/vsc/dashboard" className="inline-flex items-center gap-2 text-sm text-white/30 hover:text-white/50 mb-6">
          <ArrowLeftIcon className="w-4 h-4" /> Back to Dashboard
        </Link>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-black mb-2 flex items-center gap-3">
            <TrophyIcon className="w-8 h-8 text-cyan-400" /> Weekly Tournaments
          </h1>
          <p className="text-white/40 mb-8">Compete for real prizes. Entry: ₹49. Top performers win cash.</p>

          {tournaments.length === 0 ? (
            <Card className="p-12 bg-white/[0.02] border-white/5 text-center">
              <div className="text-4xl mb-4">🏆</div>
              <h2 className="text-xl font-bold mb-2">No Active Tournaments</h2>
              <p className="text-white/40">Check back soon — new tournaments are announced weekly!</p>
            </Card>
          ) : (
            <div className="grid sm:grid-cols-2 gap-6">
              {tournaments.map((t) => {
                const start = new Date(t.startsAt);
                const end = new Date(t.endsAt);
                const now = new Date();
                const isUpcoming = now < start;
                const isEnded = now > end;

                return (
                  <motion.div key={t.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    className={`rounded-2xl bg-white/[0.02] border overflow-hidden ${t.isLive ? 'border-cyan-500/30' : 'border-white/5'}`}>
                    {t.isLive && (
                      <div className="bg-cyan-500/10 px-4 py-1.5 text-center">
                        <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 animate-pulse">● LIVE NOW</span>
                      </div>
                    )}
                    <div className="p-6">
                      <h3 className="text-lg font-bold text-white mb-1">{t.title}</h3>
                      {t.description && <p className="text-sm text-white/40 mb-4">{t.description}</p>}

                      <div className="flex flex-wrap gap-4 mb-4">
                        <div className="text-center">
                          <div className="text-xl font-black text-amber-400">₹{t.prizePool}</div>
                          <div className="text-[10px] text-white/25 uppercase">Prize Pool</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xl font-black text-white/60">₹{t.entryFee}</div>
                          <div className="text-[10px] text-white/25 uppercase">Entry</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xl font-black text-white/60">{t.participantCount}</div>
                          <div className="text-[10px] text-white/25 uppercase">Joined</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-white/25 mb-4">
                        <ClockIcon className="w-3.5 h-3.5" />
                        {isUpcoming ? `Starts ${start.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}` :
                         isEnded ? 'Ended' :
                         `Ends ${end.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`}
                        {' · '}{Math.round(t.timeLimit / 60)} min time limit
                      </div>

                      {!isEnded && (
                        <Button onClick={() => handleJoin(t.id)} disabled={joining === t.id}
                          className="w-full py-3 bg-gradient-to-r from-cyan-600 to-blue-500 rounded-xl font-bold disabled:opacity-50">
                          {joining === t.id ? 'Processing...' : `Join — ₹${t.entryFee}`}
                        </Button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
