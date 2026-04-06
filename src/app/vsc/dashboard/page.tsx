'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Card, Button } from '@/components/ui';
import { useAuthStore } from '@/store/authStore';
import {
  TrophyIcon,
  BoltIcon,
  ClockIcon,
  ArrowRightIcon,
  ShareIcon,
  ChevronRightIcon,
  FireIcon,
  ShieldExclamationIcon,
  ArrowPathIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Razorpay: any;
  }
}

interface Attempt {
  id: string;
  roundId: string;
  score: number;
  maxScore: number;
  percentage: number;
  timeTaken: number | null;
  passed: boolean;
  round: { roundNumber: number; title: string; roundType: string };
}

interface PowerUp {
  id: string;
  type: string;
  isUsed: boolean;
  usedAtRound: number | null;
}

interface Participant {
  id: string;
  name: string;
  currentRound: number;
  isEliminated: boolean;
  eliminatedAt: number | null;
  totalScore: number;
  rank: number | null;
  entryFee: number;
  attemptNumber: number;
  paymentStatus: string;
  referralCode: string;
  referralsCount: number;
  isBoosted: boolean;
  attempts: Attempt[];
  powerUps: PowerUp[];
  certificates?: {
    id: string;
    type: string;
    rank: number | null;
    totalScore: number;
    roundsCompleted: number;
    certificateUrl: string | null;
    issuedAt: string;
  }[];
  challenge: {
    id: string;
    name: string;
    skipRoundPrice: number;
    extraTimePrice: number;
    revivePrice: number;
    leaderboardBoostPrice: number;
    rounds: {
      id: string;
      roundNumber: number;
      title: string;
      roundType: string;
      isActive: boolean;
      isLocked: boolean;
      timeLimit: number;
    }[];
  };
}

interface LeaderboardEntry {
  id: string;
  name: string;
  totalScore: number;
  currentRound: number;
  isEliminated: boolean;
  isBoosted: boolean;
  rank: number | null;
}

const powerUpInfo: Record<string, { icon: string; label: string; desc: string }> = {
  SKIP_ROUND: { icon: '⏭️', label: 'Skip Round', desc: 'Skip one round entirely' },
  EXTRA_TIME: { icon: '⏱️', label: 'Extra Time', desc: '+2 minutes in next round' },
  REVIVE: { icon: '💀', label: 'Revive', desc: 'Re-enter after elimination' },
  LEADERBOARD_BOOST: { icon: '🔥', label: 'Leaderboard Boost', desc: 'Highlight your profile' },
};

export default function VSCDashboardPage() {
  const router = useRouter();
  const { isAuthenticated, token } = useAuthStore();
  const [participant, setParticipant] = useState<Participant | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [stats, setStats] = useState({ totalParticipants: 0, activeParticipants: 0 });
  const [loading, setLoading] = useState(true);
  const [buyingPowerUp, setBuyingPowerUp] = useState<string | null>(null);
  const [usingPowerUp, setUsingPowerUp] = useState<string | null>(null);
  const [error, setError] = useState('');

  const fetchDashboard = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/vsc/participant', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setParticipant(data.data.participant);
        setLeaderboard(data.data.leaderboard || []);
        setStats(data.data.stats || { totalParticipants: 0, activeParticipants: 0 });
      }
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/vsc/login');
      return;
    }
    fetchDashboard();
  }, [isAuthenticated, router, fetchDashboard]);

  const handleBuyPowerUp = async (type: string) => {
    if (!participant || !token) return;
    setBuyingPowerUp(type);
    setError('');

    try {
      const res = await fetch('/api/vsc/powerups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ participantId: participant.id, type }),
      });

      const data = await res.json();
      if (!data.success) {
        setError(data.error || 'Failed to purchase');
        setBuyingPowerUp(null);
        return;
      }

      const d = data.data;

      // Razorpay checkout for power-up
      const options = {
        key: d.keyId,
        amount: d.amount * 100,
        currency: d.currency,
        name: 'Vishvakarma Hub',
        description: `Power-up: ${powerUpInfo[type]?.label || type}`,
        order_id: d.orderId,
        prefill: d.prefill,
        handler: async (response: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) => {
          const verifyRes = await fetch('/api/vsc/powerups', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              powerUpId: d.powerUp.id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            }),
          });
          const verifyData = await verifyRes.json();
          if (verifyData.success) {
            fetchDashboard();
          } else {
            setError('Payment verification failed');
          }
          setBuyingPowerUp(null);
        },
        modal: {
          ondismiss: () => { setBuyingPowerUp(null); },
        },
        theme: { color: '#8b5cf6' },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch {
      setError('Something went wrong');
      setBuyingPowerUp(null);
    }
  };

  const handleUsePowerUp = async (powerUpId: string, type: string) => {
    if (!participant || !token) return;
    setUsingPowerUp(powerUpId);
    setError('');

    try {
      const res = await fetch('/api/vsc/powerups', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ powerUpId, participantId: participant.id }),
      });

      const data = await res.json();
      if (data.success) {
        fetchDashboard();
      } else {
        setError(data.error || `Failed to use ${type}`);
      }
    } catch {
      setError('Something went wrong');
    } finally {
      setUsingPowerUp(null);
    }
  };

  if (!isAuthenticated) return null;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050508] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500" />
      </div>
    );
  }

  if (!participant) {
    return (
      <div className="min-h-screen bg-[#050508] pt-24 pb-16 px-4">
        <div className="max-w-lg mx-auto text-center">
          <div className="text-6xl mb-6">🔥</div>
          <h1 className="text-3xl font-black text-white mb-3">Not Registered Yet</h1>
          <p className="text-white/40 mb-8">You haven&apos;t entered the Survival Challenge yet. Join now!</p>
          <Link href="/vsc/register">
            <Button className="bg-gradient-to-r from-red-600 to-orange-500 text-white font-bold px-8 py-3">
              Enter the Arena — ₹99
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (participant.paymentStatus !== 'PAID') {
    return (
      <div className="min-h-screen bg-[#050508] pt-24 pb-16 px-4">
        <div className="max-w-lg mx-auto text-center">
          <div className="text-6xl mb-6">⏳</div>
          <h1 className="text-3xl font-black text-white mb-3">Payment Pending</h1>
          <p className="text-white/40 mb-8">Complete your payment to enter the arena.</p>
          <Link href="/vsc/register">
            <Button className="bg-gradient-to-r from-red-600 to-orange-500 text-white font-bold px-8 py-3">
              Complete Payment
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const currentRoundData = participant.challenge.rounds.find(
    r => r.roundNumber === participant.currentRound
  );
  const completedAttempts = participant.attempts.filter(a => a.passed);
  const failedAttempts = participant.attempts.filter(a => !a.passed && a.score > 0);
  const unusedPowerUps = participant.powerUps.filter(p => p.isUsed === false && !('paymentStatus' in p && (p as PowerUp & { paymentStatus?: string }).paymentStatus !== 'PAID'));

  return (
    <div className="min-h-screen bg-[#050508] pt-24 pb-16 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-black text-white">
                {participant.isEliminated ? '💀 Eliminated' : '⚔️ Arena Dashboard'}
              </h1>
              <p className="text-white/40 mt-1">
                Welcome back, <span className="text-white/70 font-semibold">{participant.name}</span>
              </p>
            </div>
            {!participant.isEliminated && currentRoundData && currentRoundData.isActive && !currentRoundData.isLocked && (
              <Link href={`/vsc/play?round=${currentRoundData.roundNumber}`}>
                <Button className="bg-gradient-to-r from-red-600 to-orange-500 text-white font-bold px-6 py-3 shadow-lg shadow-red-500/20">
                  Play Round {currentRoundData.roundNumber}
                  <ArrowRightIcon className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            )}
          </div>
        </motion.div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-400/10 text-red-400 border border-red-400/20 text-sm">
            {error}
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Status Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: 'Current Round', value: participant.isEliminated ? `Elim. R${participant.eliminatedAt}` : `Round ${participant.currentRound}`, icon: <BoltIcon className="w-5 h-5" />, color: 'text-amber-400' },
                { label: 'Total Score', value: participant.totalScore.toFixed(0), icon: <TrophyIcon className="w-5 h-5" />, color: 'text-green-400' },
                { label: 'Rank', value: participant.rank ? `#${participant.rank}` : '—', icon: <FireIcon className="w-5 h-5" />, color: 'text-red-400' },
                { label: 'Referrals', value: participant.referralsCount, icon: <ShareIcon className="w-5 h-5" />, color: 'text-purple-400' },
              ].map((stat, i) => (
                <Card key={i} className="p-4 bg-white/[0.02] border-white/5">
                  <div className={`${stat.color} mb-2`}>{stat.icon}</div>
                  <div className="text-xl font-black text-white">{stat.value}</div>
                  <div className="text-xs text-white/30 mt-0.5">{stat.label}</div>
                </Card>
              ))}
            </div>

            {/* Eliminated Banner */}
            {participant.isEliminated && (
              <Card className="p-6 bg-red-500/5 border-red-500/20">
                <div className="flex items-start gap-4">
                  <ShieldExclamationIcon className="w-8 h-8 text-red-400 flex-shrink-0" />
                  <div>
                    <h3 className="text-lg font-bold text-red-400 mb-1">You&apos;ve Been Eliminated</h3>
                    <p className="text-sm text-white/40 mb-4">
                      Eliminated at Round {participant.eliminatedAt}. But it&apos;s not over — use a Revive card or re-enter the challenge!
                    </p>
                    <div className="flex gap-3">
                      {unusedPowerUps.some(p => p.type === 'REVIVE') ? (
                        <Button
                          onClick={() => {
                            const revive = unusedPowerUps.find(p => p.type === 'REVIVE');
                            if (revive) handleUsePowerUp(revive.id, 'REVIVE');
                          }}
                          disabled={usingPowerUp !== null}
                          className="bg-green-500/10 border border-green-500/20 text-green-400 text-sm"
                        >
                          <ArrowPathIcon className="w-4 h-4 mr-1" /> Use Revive Card
                        </Button>
                      ) : (
                        <Button
                          onClick={() => handleBuyPowerUp('REVIVE')}
                          disabled={buyingPowerUp !== null}
                          className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm"
                        >
                          Buy Revive — ₹{participant.challenge.revivePrice}
                        </Button>
                      )}
                      <Link href="/vsc/register">
                        <Button className="bg-white/5 border border-white/10 text-white/50 text-sm">
                          Re-enter Challenge
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* Round Progress */}
            <Card className="p-6 bg-white/[0.02] border-white/5">
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <ClockIcon className="w-5 h-5 text-white/30" />
                Round Progress
              </h2>
              <div className="space-y-3">
                {participant.challenge.rounds.map(round => {
                  const attempt = participant.attempts.find(
                    a => a.round.roundNumber === round.roundNumber
                  );
                  const isCurrent = round.roundNumber === participant.currentRound && !participant.isEliminated;

                  let status = 'locked';
                  if (attempt?.passed) status = 'passed';
                  else if (attempt && !attempt.passed) status = 'failed';
                  else if (isCurrent && round.isActive && !round.isLocked) status = 'active';
                  else if (isCurrent) status = 'waiting';

                  return (
                    <div
                      key={round.id}
                      className={`flex items-center gap-4 p-3 rounded-xl transition-all ${
                        status === 'active' ? 'bg-red-500/5 border border-red-500/20' :
                        status === 'passed' ? 'bg-green-500/5 border border-green-500/20' :
                        status === 'failed' ? 'bg-red-500/5 border border-red-500/10' :
                        'bg-white/[0.01] border border-white/5'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold ${
                        status === 'passed' ? 'bg-green-500/20 text-green-400' :
                        status === 'failed' ? 'bg-red-500/20 text-red-400' :
                        status === 'active' ? 'bg-red-500/20 text-red-400 animate-pulse' :
                        'bg-white/5 text-white/20'
                      }`}>
                        {status === 'passed' ? '✓' : status === 'failed' ? '✗' : `R${round.roundNumber}`}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-white">{round.title}</div>
                        {attempt && (
                          <div className="text-xs text-white/30">
                            Score: {attempt.score}/{attempt.maxScore} ({attempt.percentage.toFixed(0)}%)
                            {attempt.timeTaken && ` • ${Math.round(attempt.timeTaken / 60)}m ${attempt.timeTaken % 60}s`}
                          </div>
                        )}
                        {status === 'active' && (
                          <div className="text-xs text-red-400 font-medium">Ready to play!</div>
                        )}
                        {status === 'waiting' && (
                          <div className="text-xs text-amber-400/60">Waiting for round to open</div>
                        )}
                        {status === 'locked' && (
                          <div className="text-xs text-white/20">Locked</div>
                        )}
                      </div>
                      {status === 'active' && (
                        <Link href={`/vsc/play?round=${round.roundNumber}`}>
                          <ChevronRightIcon className="w-5 h-5 text-red-400" />
                        </Link>
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Referral Section */}
            <Card className="p-6 bg-white/[0.02] border-white/5">
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <ShareIcon className="w-5 h-5 text-white/30" />
                Referral Code
              </h2>
              <div className="flex items-center gap-4">
                <div className="flex-1 p-3 rounded-lg bg-white/[0.03] border border-white/5 font-mono text-lg text-amber-400 font-bold text-center">
                  {participant.referralCode}
                </div>
                <Button
                  onClick={() => {
                    const url = `https://www.vishvakarmahub.com/vsc/register?ref=${participant.referralCode}`;
                    navigator.clipboard.writeText(url);
                  }}
                  className="bg-amber-500/10 border border-amber-500/20 text-amber-400 px-4 py-3"
                >
                  Copy Link
                </Button>
              </div>
              <p className="text-xs text-white/25 mt-3">
                {participant.referralsCount} referral{participant.referralsCount !== 1 ? 's' : ''} so far — share and grow the movement!
              </p>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Power-Up Shop */}
            <Card className="p-6 bg-white/[0.02] border-white/5">
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <SparklesIcon className="w-5 h-5 text-purple-400" />
                Power-Up Shop
              </h2>
              <div className="space-y-3">
                {[
                  { type: 'SKIP_ROUND', price: participant.challenge.skipRoundPrice },
                  { type: 'EXTRA_TIME', price: participant.challenge.extraTimePrice },
                  { type: 'REVIVE', price: participant.challenge.revivePrice },
                  { type: 'LEADERBOARD_BOOST', price: participant.challenge.leaderboardBoostPrice },
                ].map(({ type, price }) => {
                  const info = powerUpInfo[type];
                  const owned = participant.powerUps.filter(p => p.type === type && !p.isUsed);
                  return (
                    <div key={type} className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-xl">{info.icon}</span>
                        <div className="flex-1">
                          <div className="text-sm font-semibold text-white">{info.label}</div>
                          <div className="text-xs text-white/30">{info.desc}</div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-amber-400">₹{price}</span>
                        <div className="flex items-center gap-2">
                          {owned.length > 0 && (
                            <span className="text-xs text-green-400/70 bg-green-400/10 px-2 py-0.5 rounded-full">
                              {owned.length} owned
                            </span>
                          )}
                          <Button
                            onClick={() => handleBuyPowerUp(type)}
                            disabled={buyingPowerUp !== null}
                            className="text-xs px-3 py-1 bg-purple-500/10 border border-purple-500/20 text-purple-400 hover:bg-purple-500/20"
                          >
                            {buyingPowerUp === type ? '...' : 'Buy'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Your Power-Ups */}
            {unusedPowerUps.length > 0 && (
              <Card className="p-6 bg-white/[0.02] border-white/5">
                <h2 className="text-sm font-bold text-white/50 uppercase tracking-wider mb-3">Your Power-Ups</h2>
                <div className="space-y-2">
                  {unusedPowerUps.map(pu => {
                    const info = powerUpInfo[pu.type];
                    return (
                      <div key={pu.id} className="flex items-center justify-between p-2 rounded-lg bg-white/[0.02]">
                        <span className="text-sm text-white/60">{info?.icon} {info?.label}</span>
                        <Button
                          onClick={() => handleUsePowerUp(pu.id, pu.type)}
                          disabled={usingPowerUp !== null}
                          className="text-xs px-3 py-1 bg-green-500/10 border border-green-500/20 text-green-400"
                        >
                          {usingPowerUp === pu.id ? '...' : 'Use'}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}

            {/* Leaderboard Preview */}
            <Card className="p-6 bg-white/[0.02] border-white/5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <TrophyIcon className="w-5 h-5 text-amber-400" />
                  Leaderboard
                </h2>
                <Link href="/vsc/leaderboard" className="text-xs text-white/30 hover:text-white/50">
                  View All →
                </Link>
              </div>
              <div className="text-xs text-white/25 mb-3">
                {stats.activeParticipants} of {stats.totalParticipants} still alive
              </div>
              <div className="space-y-2">
                {leaderboard.slice(0, 10).map((entry, i) => (
                  <div
                    key={entry.id}
                    className={`flex items-center gap-3 p-2 rounded-lg ${
                      entry.id === participant.id ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-white/[0.01]'
                    }`}
                  >
                    <span className={`w-6 text-center text-xs font-bold ${
                      i === 0 ? 'text-amber-400' : i === 1 ? 'text-gray-300' : i === 2 ? 'text-orange-400' : 'text-white/20'
                    }`}>
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <span className={`text-sm truncate block ${
                        entry.id === participant.id ? 'text-amber-400 font-semibold' : 'text-white/60'
                      }`}>
                        {entry.name}
                        {entry.isBoosted && <span className="ml-1 text-amber-400">🔥</span>}
                      </span>
                    </div>
                    <span className="text-xs text-white/30 font-mono">{entry.totalScore.toFixed(0)}</span>
                    {entry.isEliminated && <span className="text-xs text-red-400/50">💀</span>}
                  </div>
                ))}
              </div>
            </Card>

            {/* Certificates */}
            {participant.certificates && participant.certificates.length > 0 && (
              <Card className="p-6 bg-white/[0.02] border-white/5">
                <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
                  🏅 Your Certificates
                </h2>
                <div className="space-y-3">
                  {participant.certificates.map((cert: { id: string; type: string; rank: number | null; totalScore: number; roundsCompleted: number; certificateUrl: string | null; issuedAt: string }) => (
                    <div key={cert.id} className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-amber-500/5 to-orange-500/5 border border-amber-500/20">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">
                          {cert.type === 'CHAMPION' ? '🏆' : cert.type === 'WINNER' ? '🥈' : cert.type === 'FINALIST' ? '🥉' : '📜'}
                        </span>
                        <div>
                          <p className="text-sm font-semibold text-white">{cert.type} Certificate</p>
                          <p className="text-xs text-white/30">
                            {cert.rank ? `Rank #${cert.rank} · ` : ''}Score: {cert.totalScore} · Rounds: {cert.roundsCompleted}
                          </p>
                          <p className="text-[10px] text-white/20">Issued {new Date(cert.issuedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                        </div>
                      </div>
                      {cert.certificateUrl && (
                        <a
                          href={cert.certificateUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 hover:bg-amber-500/20 transition-colors"
                        >
                          Download
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
