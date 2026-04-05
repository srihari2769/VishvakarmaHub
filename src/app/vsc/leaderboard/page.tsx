'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui';
import { useAuthStore } from '@/store/authStore';
import {
  TrophyIcon,
  ArrowLeftIcon,
  FireIcon,
} from '@heroicons/react/24/outline';

interface LeaderboardEntry {
  id: string;
  name: string;
  college: string | null;
  city: string;
  totalScore: number;
  currentRound: number;
  isEliminated: boolean;
  isBoosted: boolean;
}

export default function VSCLeaderboardPage() {
  const { token } = useAuthStore();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [myRank, setMyRank] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedRound, setSelectedRound] = useState<number | null>(null);

  useEffect(() => {
    const url = selectedRound
      ? `/api/vsc/leaderboard?roundNumber=${selectedRound}`
      : '/api/vsc/leaderboard';
    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Bearer ${token}`;

    fetch(url, { headers })
      .then(r => r.json())
      .then(d => {
        if (d.success) {
          setEntries(d.data.leaderboard || []);
          setMyRank(d.data.myRank || null);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token, selectedRound]);

  return (
    <div className="min-h-screen bg-[#050508] pt-24 pb-16 px-4">
      <div className="max-w-3xl mx-auto">
        <Link href="/vsc/dashboard" className="inline-flex items-center gap-2 text-sm text-white/40 hover:text-white/70 mb-6 transition-colors">
          <ArrowLeftIcon className="w-4 h-4" />
          Back to Dashboard
        </Link>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="text-center mb-8">
            <h1 className="text-3xl font-black text-white flex items-center justify-center gap-3">
              <TrophyIcon className="w-8 h-8 text-amber-400" />
              Leaderboard
            </h1>
            {myRank && (
              <p className="text-white/40 mt-2">Your rank: <span className="text-amber-400 font-bold">#{myRank}</span></p>
            )}
          </div>

          {/* Round filter */}
          <div className="flex flex-wrap gap-2 justify-center mb-8">
            <button
              onClick={() => { setSelectedRound(null); setLoading(true); }}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                !selectedRound ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-white/5 text-white/30 border border-white/5'
              }`}
            >
              Overall
            </button>
            {[1, 2, 3, 4, 5, 6, 7].map(r => (
              <button
                key={r}
                onClick={() => { setSelectedRound(r); setLoading(true); }}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  selectedRound === r ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-white/5 text-white/30 border border-white/5'
                }`}
              >
                R{r}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-red-500" />
            </div>
          ) : entries.length === 0 ? (
            <div className="text-center py-12 text-white/30">No participants yet</div>
          ) : (
            <Card className="bg-white/[0.02] border-white/5 overflow-hidden">
              {/* Top 3 */}
              {entries.length >= 3 && (
                <div className="grid grid-cols-3 gap-4 p-6 border-b border-white/5">
                  {[1, 0, 2].map(i => {
                    const e = entries[i];
                    if (!e) return null;
                    const rank = i + 1;
                    const medals = ['🥇', '🥈', '🥉'];
                    return (
                      <div key={e.id} className={`text-center ${rank === 1 ? 'order-2 -mt-4' : rank === 2 ? 'order-1 mt-2' : 'order-3 mt-2'}`}>
                        <div className="text-3xl mb-1">{medals[rank - 1]}</div>
                        <div className="text-sm font-bold text-white truncate">{e.name}</div>
                        {e.college && <div className="text-[10px] text-white/20 truncate">{e.college}</div>}
                        <div className="text-lg font-black text-amber-400 mt-1">{e.totalScore.toFixed(0)}</div>
                        <div className="text-[10px] text-white/20">R{e.currentRound}</div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Full list */}
              <div className="divide-y divide-white/5">
                {entries.map((entry, i) => (
                  <div
                    key={entry.id}
                    className={`flex items-center gap-4 px-6 py-3 ${
                      myRank && i + 1 === myRank ? 'bg-amber-500/5' : ''
                    }`}
                  >
                    <span className={`w-8 text-center text-sm font-bold flex-shrink-0 ${
                      i === 0 ? 'text-amber-400' : i === 1 ? 'text-gray-300' : i === 2 ? 'text-orange-400' : 'text-white/20'
                    }`}>
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-white truncate">{entry.name}</span>
                        {entry.isBoosted && <FireIcon className="w-4 h-4 text-amber-400 flex-shrink-0" />}
                        {entry.isEliminated && <span className="text-xs text-red-400/50">💀</span>}
                      </div>
                      {entry.college && <div className="text-xs text-white/20 truncate">{entry.college}</div>}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-sm font-bold text-white/70">{entry.totalScore.toFixed(0)}</div>
                      <div className="text-[10px] text-white/20">Round {entry.currentRound}</div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </motion.div>
      </div>
    </div>
  );
}
