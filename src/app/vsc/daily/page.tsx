'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Card, Button } from '@/components/ui';
import { useAuthStore } from '@/store/authStore';
import { FireIcon, CheckCircleIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

interface Question {
  id: string;
  question: string;
  options: string[];
  points: number;
}

interface StreakData {
  streak: { currentStreak: number; longestStreak: number; totalPoints: number };
  questions: Question[];
  todayCompleted: boolean;
  todayScore?: number;
  recentAttempts: Array<{ date: string; score: number; maxScore: number }>;
  nextMilestone: { days: number; reward: string } | null;
}

export default function DailyStreakPage() {
  const router = useRouter();
  const { token, loginContext } = useAuthStore();
  const [data, setData] = useState<StreakData | null>(null);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ score: number; maxScore: number; graded: Array<{ questionId: string; isCorrect: boolean; correctAnswer: string; points: number }> } | null>(null);

  useEffect(() => {
    if (!token || loginContext !== 'vsc') { router.push('/vsc/login'); return; }
    fetch('/api/vsc/daily', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { if (d.success) setData(d.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token, loginContext, router]);

  const handleSubmit = async () => {
    if (!token || !data) return;
    const answerArray = data.questions.map(q => ({ questionId: q.id, answer: answers[q.id] || '' }));
    setSubmitting(true);
    try {
      const res = await fetch('/api/vsc/daily', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ answers: answerArray }),
      });
      const d = await res.json();
      if (d.success) setResult(d.data);
    } catch { /* ignore */ }
    setSubmitting(false);
  };

  if (loading) return <div className="min-h-screen bg-[#050508] flex items-center justify-center"><div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-[#050508] text-white pt-20 pb-12 px-4">
      <div className="max-w-3xl mx-auto">
        <Link href="/vsc/dashboard" className="inline-flex items-center gap-2 text-sm text-white/30 hover:text-white/50 mb-6">
          <ArrowLeftIcon className="w-4 h-4" /> Back to Dashboard
        </Link>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-black mb-2 flex items-center gap-3">
            <FireIcon className="w-8 h-8 text-emerald-400" /> Daily Streak
          </h1>

          {data && (
            <div className="flex flex-wrap gap-6 mb-8">
              <div className="text-center">
                <div className="text-2xl font-black text-emerald-400">{data.streak.currentStreak}</div>
                <div className="text-xs text-white/30">Current Streak</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-black text-amber-400">{data.streak.longestStreak}</div>
                <div className="text-xs text-white/30">Best Streak</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-black text-purple-400">{data.streak.totalPoints}</div>
                <div className="text-xs text-white/30">Total Points</div>
              </div>
              {data.nextMilestone && (
                <div className="text-center">
                  <div className="text-sm font-bold text-white/50">{data.nextMilestone.days - data.streak.currentStreak} days</div>
                  <div className="text-xs text-white/30">to {data.nextMilestone.reward}</div>
                </div>
              )}
            </div>
          )}

          {data?.todayCompleted ? (
            <Card className="p-8 bg-white/[0.02] border-emerald-500/20 text-center">
              <CheckCircleIcon className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
              <h2 className="text-xl font-bold mb-2">Today&apos;s Challenge Complete!</h2>
              <p className="text-white/40 mb-2">Score: {data.todayScore}/50</p>
              <p className="text-sm text-white/25">Come back tomorrow to continue your streak!</p>
            </Card>
          ) : result ? (
            <Card className="p-8 bg-white/[0.02] border-emerald-500/20">
              <h2 className="text-xl font-bold mb-4 text-center">
                Score: <span className="text-emerald-400">{result.score}</span>/{result.maxScore}
              </h2>
              <div className="space-y-3">
                {result.graded.map((g, i) => (
                  <div key={i} className={`p-3 rounded-lg ${g.isCorrect ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-red-500/10 border border-red-500/20'}`}>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">{g.isCorrect ? '✅' : '❌'} Question {i + 1}</span>
                      <span className="text-xs text-white/30">+{g.points} pts</span>
                    </div>
                    {!g.isCorrect && <p className="text-xs text-white/30 mt-1">Answer: {g.correctAnswer}</p>}
                  </div>
                ))}
              </div>
              <p className="text-center text-sm text-white/25 mt-4">Come back tomorrow!</p>
            </Card>
          ) : data?.questions ? (
            <div className="space-y-6">
              {data.questions.map((q, i) => (
                <Card key={q.id} className="p-6 bg-white/[0.02] border-white/5">
                  <p className="text-sm font-semibold mb-3 text-white/80">Q{i + 1}. {q.question}</p>
                  <div className="grid grid-cols-2 gap-3">
                    {q.options.map((opt) => (
                      <button
                        key={opt}
                        onClick={() => setAnswers({ ...answers, [q.id]: opt })}
                        className={`p-3 rounded-lg text-sm text-left transition-all ${
                          answers[q.id] === opt
                            ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300'
                            : 'bg-white/[0.03] border border-white/5 text-white/50 hover:bg-white/[0.05]'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </Card>
              ))}
              <Button
                onClick={handleSubmit}
                disabled={submitting || Object.keys(answers).length < data.questions.length}
                className="w-full py-4 bg-gradient-to-r from-emerald-600 to-green-500 rounded-xl font-bold text-lg disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Submit Answers'}
              </Button>
            </div>
          ) : null}

          {/* Recent History */}
          {data?.recentAttempts && data.recentAttempts.length > 0 && (
            <Card className="mt-8 p-6 bg-white/[0.02] border-white/5">
              <h3 className="text-sm font-bold text-white/50 mb-3">Recent Days</h3>
              <div className="flex gap-2 flex-wrap">
                {data.recentAttempts.map((a, i) => (
                  <div key={i} className="px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-center">
                    <div className="text-xs text-white/30">{a.date}</div>
                    <div className="text-sm font-bold text-emerald-400">{a.score}/{a.maxScore}</div>
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
