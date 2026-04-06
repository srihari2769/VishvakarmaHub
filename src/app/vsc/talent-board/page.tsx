'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui';
import { StarIcon, TrophyIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

interface Talent {
  rank: number;
  name: string;
  currentRound: number;
  totalScore: number;
  accuracy: number;
  roundsCompleted: number;
  status: string;
}

export default function TalentBoardPage() {
  const [talents, setTalents] = useState<Talent[]>([]);
  const [challengeTitle, setchallengeTitle] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/vsc/talent-board')
      .then(r => r.json())
      .then(d => {
        if (d.success) {
          setTalents(d.data.talents);
          setchallengeTitle(d.data.challengeTitle);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="min-h-screen bg-[#050508] flex items-center justify-center"><div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-[#050508] text-white pt-20 pb-12 px-4">
      <div className="max-w-4xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 text-violet-400 text-xs font-bold tracking-widest uppercase mb-4">
              <StarIcon className="w-4 h-4" /> Public Talent Board
            </div>
            <h1 className="text-3xl sm:text-5xl font-black mb-2">
              VSC <span className="bg-gradient-to-r from-violet-400 to-purple-500 bg-clip-text text-transparent">Talent Board</span>
            </h1>
            <p className="text-white/40 mb-1">{challengeTitle}</p>
            <p className="text-sm text-white/25">Top performers who opted in to showcase their innovation skills</p>
          </div>

          {talents.length === 0 ? (
            <Card className="p-12 bg-white/[0.02] border-white/5 text-center">
              <div className="text-4xl mb-4">🌟</div>
              <h2 className="text-xl font-bold mb-2">No Talents Yet</h2>
              <p className="text-white/40">Participants can opt in from their dashboard to appear here.</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {talents.map((t) => (
                <motion.div key={t.rank} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: t.rank * 0.03 }}
                  className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
                    t.rank <= 3 ? 'bg-gradient-to-r from-amber-500/5 to-transparent border-amber-500/20' : 'bg-white/[0.02] border-white/5'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg ${
                    t.rank === 1 ? 'bg-amber-500/20 text-amber-400' : t.rank === 2 ? 'bg-gray-400/20 text-gray-300' : t.rank === 3 ? 'bg-orange-500/20 text-orange-400' : 'bg-white/5 text-white/20'
                  }`}>
                    {t.rank <= 3 ? <TrophyIcon className="w-5 h-5" /> : t.rank}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-white truncate">{t.name}</h3>
                    <p className="text-xs text-white/30">
                      Round {t.currentRound} · {t.roundsCompleted} completed · {t.status === 'WINNER' ? '🏆 Champion' : t.status}
                    </p>
                  </div>

                  <div className="text-right hidden sm:block">
                    <div className="text-sm font-bold text-white/60">{t.accuracy}%</div>
                    <div className="text-[10px] text-white/25">Accuracy</div>
                  </div>

                  <div className="text-right">
                    <div className="text-lg font-black text-amber-400">{t.totalScore}</div>
                    <div className="text-[10px] text-white/25">Score</div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          <div className="mt-12 text-center">
            <Card className="inline-block p-6 bg-white/[0.02] border-violet-500/10">
              <h3 className="font-bold text-white mb-1">🔍 Recruiter Access</h3>
              <p className="text-sm text-white/40 mb-3">Browse top VSC performers for your organization</p>
              <p className="text-2xl font-black bg-gradient-to-r from-violet-400 to-purple-500 bg-clip-text text-transparent">₹2,999/month</p>
              <p className="text-xs text-white/25 mt-1">Contact us for enterprise access</p>
            </Card>
          </div>

          <div className="text-center mt-8">
            <Link href="/vsc/register" className="text-sm text-violet-400 hover:text-violet-300 transition-colors">
              Want to appear here? Join the challenge →
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
