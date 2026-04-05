'use client';

import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Card, Button } from '@/components/ui';
import { useAuthStore } from '@/store/authStore';
import {
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  PaperAirplaneIcon,
} from '@heroicons/react/24/outline';

interface Question {
  id: string;
  question: string;
  options?: string[];
  points: number;
  category?: string;
}

interface RoundInfo {
  round: {
    id: string;
    roundNumber: number;
    title: string;
    roundType: string;
    timeLimit: number;
    passingPercent: number;
    prompt?: string;
    scoringCriteria?: { criterion: string; weight: number; maxScore: number }[];
  };
  attempt?: { id: string; startedAt: string };
  questions?: Question[];
  totalQuestions?: number;
  maxScore?: number;
  assignedCount?: number;
}

interface SubmitResult {
  score: number;
  maxScore: number;
  percentage: number;
  passed: boolean;
  timeTaken: number;
}

const roundTypeLabels: Record<string, string> = {
  SPEED_IQ: 'Speed IQ Test',
  DECISION_MAKING: 'Decision Making',
  CREATIVITY: 'Creativity Challenge',
  EXECUTION: 'Execution Simulation',
  PRESSURE: 'Pressure Round',
  SOCIAL_PROOF: 'Social Proof',
  VIDEO_PITCH: 'Final Pitch',
};

export default function VSCPlayPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500" /></div>}>
      <VSCPlayContent />
    </Suspense>
  );
}

function VSCPlayContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, token } = useAuthStore();
  const roundNumber = parseInt(searchParams.get('round') || '1');

  const [roundInfo, setRoundInfo] = useState<RoundInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Quiz state
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<SubmitResult | null>(null);

  // Text submission state
  const [textSubmission, setTextSubmission] = useState('');
  const [videoUrl, setVideoUrl] = useState('');

  // Timer
  const [timeLeft, setTimeLeft] = useState(0);
  const [startTime] = useState(Date.now());
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const fetchRound = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/vsc/rounds?roundNumber=${roundNumber}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setRoundInfo(data.data);
        setTimeLeft(data.data.timeLimit || data.data.round.timeLimit || 600);
      } else {
        setError(data.error || 'Failed to load round');
      }
    } catch {
      setError('Failed to load round');
    } finally {
      setLoading(false);
    }
  }, [token, roundNumber]);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login?redirect=/vsc/play?round=' + roundNumber);
      return;
    }
    fetchRound();
  }, [isAuthenticated, router, roundNumber, fetchRound]);

  // Timer countdown
  useEffect(() => {
    if (!roundInfo || result || timeLeft <= 0) return;

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          handleSubmit(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roundInfo, result]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const isQuizRound = roundInfo?.questions && roundInfo.questions.length > 0;
  const isTextRound = roundInfo?.round?.roundType === 'CREATIVITY' || roundInfo?.round?.roundType === 'EXECUTION';
  const isVideoRound = roundInfo?.round?.roundType === 'VIDEO_PITCH';

  const handleAnswerSelect = (questionId: string, answer: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }));
  };

  const handleSubmit = async (autoSubmit = false) => {
    if (!roundInfo || !token || submitting) return;
    setSubmitting(true);
    setError('');

    const timeTaken = Math.round((Date.now() - startTime) / 1000);

    try {
      const body: Record<string, unknown> = {
        attemptId: roundInfo.attempt?.id,
        timeTaken,
      };

      if (isQuizRound) {
        body.answers = Object.entries(answers).map(([questionId, answer]) => ({
          questionId,
          answer,
        }));
      } else {
        body.submission = textSubmission;
        body.videoUrl = videoUrl || undefined;
      }

      const res = await fetch('/api/vsc/rounds', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (data.success) {
        setResult(data.data);
        if (timerRef.current) clearInterval(timerRef.current);
      } else {
        setError(data.error || 'Submission failed');
        if (autoSubmit) {
          // Still try to show whatever we can
        }
      }
    } catch {
      setError('Failed to submit');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isAuthenticated) return null;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050508] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500 mx-auto mb-4" />
          <p className="text-white/40">Loading round...</p>
        </div>
      </div>
    );
  }

  if (error && !roundInfo) {
    return (
      <div className="min-h-screen bg-[#050508] pt-24 pb-16 px-4">
        <div className="max-w-lg mx-auto text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-white mb-3">{error}</h1>
          <Link href="/vsc/dashboard">
            <Button className="bg-white/5 border border-white/10 text-white/50">
              <ArrowLeftIcon className="w-4 h-4 mr-2" /> Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // ===== RESULT SCREEN =====
  if (result) {
    return (
      <div className="min-h-screen bg-[#050508] pt-24 pb-16 px-4">
        <div className="max-w-lg mx-auto text-center">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
            <div className={`w-24 h-24 rounded-full mx-auto mb-6 flex items-center justify-center ${
              result.passed ? 'bg-green-500/20 border-2 border-green-500/30' : 'bg-red-500/20 border-2 border-red-500/30'
            }`}>
              {result.passed
                ? <CheckCircleIcon className="w-12 h-12 text-green-400" />
                : <XCircleIcon className="w-12 h-12 text-red-400" />
              }
            </div>

            <h1 className="text-3xl font-black text-white mb-2">
              {result.passed ? 'Round Cleared! 🎉' : 'Eliminated 💀'}
            </h1>
            <p className="text-white/40 mb-8">
              {result.passed
                ? 'You survived this round. The next challenge awaits.'
                : 'You didn\'t make the cut this time. Use a Revive card or try again.'}
            </p>

            {/* Score breakdown */}
            <Card className="p-6 bg-white/[0.02] border-white/5 mb-6 text-left">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-white/30 uppercase tracking-wider mb-1">Score</div>
                  <div className="text-2xl font-black text-white">{result.score}/{result.maxScore}</div>
                </div>
                <div>
                  <div className="text-xs text-white/30 uppercase tracking-wider mb-1">Percentage</div>
                  <div className={`text-2xl font-black ${result.passed ? 'text-green-400' : 'text-red-400'}`}>
                    {result.percentage.toFixed(1)}%
                  </div>
                </div>
                <div>
                  <div className="text-xs text-white/30 uppercase tracking-wider mb-1">Time Taken</div>
                  <div className="text-2xl font-black text-white">{formatTime(result.timeTaken)}</div>
                </div>
                <div>
                  <div className="text-xs text-white/30 uppercase tracking-wider mb-1">Result</div>
                  <div className={`text-2xl font-black ${result.passed ? 'text-green-400' : 'text-red-400'}`}>
                    {result.passed ? 'PASSED' : 'FAILED'}
                  </div>
                </div>
              </div>
            </Card>

            <div className="flex flex-col gap-3">
              <Link href="/vsc/dashboard">
                <Button className="w-full bg-gradient-to-r from-red-600 to-orange-500 text-white font-bold py-3">
                  {result.passed ? 'Continue to Dashboard' : 'Back to Dashboard'}
                  <ArrowRightIcon className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  const questions = roundInfo?.questions || [];
  const currentQuestion = questions[currentQ];
  const totalQs = questions.length;
  const answered = Object.keys(answers).length;

  return (
    <div className="min-h-screen bg-[#050508] pt-20 pb-16 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header bar */}
        <div className="sticky top-16 z-30 bg-[#050508]/95 backdrop-blur-lg py-3 mb-6 border-b border-white/5">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold text-white">
                Round {roundInfo?.round.roundNumber}: {roundTypeLabels[roundInfo?.round.roundType || ''] || roundInfo?.round.title}
              </h1>
              {isQuizRound && (
                <p className="text-xs text-white/30">Question {currentQ + 1} of {totalQs} • {answered}/{totalQs} answered</p>
              )}
            </div>
            <div className={`flex items-center gap-2 px-4 py-2 rounded-xl font-mono font-bold text-lg ${
              timeLeft < 60 ? 'bg-red-500/20 text-red-400 animate-pulse' :
              timeLeft < 180 ? 'bg-amber-500/20 text-amber-400' :
              'bg-white/5 text-white/70'
            }`}>
              <ClockIcon className="w-5 h-5" />
              {formatTime(timeLeft)}
            </div>
          </div>

          {/* Progress bar */}
          {isQuizRound && (
            <div className="mt-3 h-1.5 bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-red-500 to-orange-500 transition-all duration-300 rounded-full"
                style={{ width: `${(answered / totalQs) * 100}%` }}
              />
            </div>
          )}
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-400/10 text-red-400 border border-red-400/20 text-sm">
            {error}
          </div>
        )}

        {/* ===== QUIZ ROUNDS ===== */}
        {isQuizRound && currentQuestion && (
          <motion.div key={currentQ} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.2 }}>
            <Card className="p-6 sm:p-8 bg-white/[0.02] border-white/5 mb-6">
              {currentQuestion.category && (
                <span className="text-xs text-amber-400/60 font-medium uppercase tracking-wider">{currentQuestion.category}</span>
              )}
              <h2 className="text-xl sm:text-2xl font-bold text-white mt-2 mb-6 leading-relaxed">
                {currentQuestion.question}
              </h2>

              {currentQuestion.options && (
                <div className="space-y-3">
                  {currentQuestion.options.map((option, oi) => {
                    const isSelected = answers[currentQuestion.id] === option;
                    return (
                      <button
                        key={oi}
                        onClick={() => handleAnswerSelect(currentQuestion.id, option)}
                        className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                          isSelected
                            ? 'border-red-500/50 bg-red-500/10 text-white'
                            : 'border-white/5 bg-white/[0.01] text-white/60 hover:border-white/15 hover:bg-white/[0.03]'
                        }`}
                      >
                        <span className={`inline-flex items-center justify-center w-7 h-7 rounded-lg mr-3 text-sm font-bold ${
                          isSelected ? 'bg-red-500/20 text-red-400' : 'bg-white/5 text-white/30'
                        }`}>
                          {String.fromCharCode(65 + oi)}
                        </span>
                        {option}
                      </button>
                    );
                  })}
                </div>
              )}

              <div className="text-xs text-white/20 mt-4 text-right">{currentQuestion.points} points</div>
            </Card>

            {/* Navigation */}
            <div className="flex items-center justify-between">
              <Button
                onClick={() => setCurrentQ(prev => Math.max(0, prev - 1))}
                disabled={currentQ === 0}
                className="bg-white/5 border border-white/10 text-white/50 disabled:opacity-30"
              >
                <ArrowLeftIcon className="w-4 h-4 mr-2" /> Previous
              </Button>

              <div className="flex flex-wrap gap-1.5 max-w-[200px] justify-center">
                {questions.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentQ(i)}
                    className={`w-7 h-7 rounded-md text-xs font-bold transition-all ${
                      i === currentQ ? 'bg-red-500 text-white' :
                      answers[q.id] ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                      'bg-white/5 text-white/20 border border-white/5'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>

              {currentQ < totalQs - 1 ? (
                <Button
                  onClick={() => setCurrentQ(prev => Math.min(totalQs - 1, prev + 1))}
                  className="bg-white/5 border border-white/10 text-white/50"
                >
                  Next <ArrowRightIcon className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button
                  onClick={() => handleSubmit(false)}
                  disabled={submitting || answered === 0}
                  className="bg-gradient-to-r from-red-600 to-orange-500 text-white font-bold disabled:opacity-40"
                >
                  {submitting ? 'Submitting...' : 'Submit'}
                  <PaperAirplaneIcon className="w-4 h-4 ml-2" />
                </Button>
              )}
            </div>

            {/* Submit button always visible */}
            {answered > 0 && currentQ < totalQs - 1 && (
              <div className="text-center mt-6">
                <Button
                  onClick={() => handleSubmit(false)}
                  disabled={submitting}
                  className="bg-gradient-to-r from-red-600 to-orange-500 text-white font-bold px-8 py-3 disabled:opacity-40"
                >
                  {submitting ? 'Submitting...' : `Submit All (${answered}/${totalQs} answered)`}
                  <PaperAirplaneIcon className="w-4 h-4 ml-2" />
                </Button>
              </div>
            )}
          </motion.div>
        )}

        {/* ===== TEXT SUBMISSION ROUNDS ===== */}
        {isTextRound && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="p-6 sm:p-8 bg-white/[0.02] border-white/5 mb-6">
              {roundInfo?.round.prompt && (
                <div className="mb-6">
                  <h2 className="text-lg font-bold text-white mb-2">Your Task</h2>
                  <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 text-amber-100/80 text-sm leading-relaxed whitespace-pre-wrap">
                    {roundInfo.round.prompt}
                  </div>
                </div>
              )}

              {roundInfo?.round.scoringCriteria && (
                <div className="mb-6">
                  <h3 className="text-sm font-bold text-white/50 uppercase tracking-wider mb-2">Scoring Criteria</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {roundInfo.round.scoringCriteria.map((c, i) => (
                      <div key={i} className="p-2 rounded-lg bg-white/[0.02] border border-white/5 text-center">
                        <div className="text-xs text-white/40">{c.criterion}</div>
                        <div className="text-sm font-bold text-white/70">{c.maxScore} pts</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-white/50 mb-2">Your Submission</label>
                <textarea
                  value={textSubmission}
                  onChange={e => setTextSubmission(e.target.value)}
                  placeholder="Write your response here..."
                  rows={12}
                  className="w-full p-4 rounded-xl bg-white/[0.03] border border-white/10 text-white placeholder-white/20 focus:border-red-500/30 focus:outline-none resize-y text-sm leading-relaxed"
                />
                <div className="text-xs text-white/20 mt-2 text-right">
                  {textSubmission.split(/\s+/).filter(Boolean).length} words
                </div>
              </div>
            </Card>

            <Button
              onClick={() => handleSubmit(false)}
              disabled={submitting || !textSubmission.trim()}
              className="w-full bg-gradient-to-r from-red-600 to-orange-500 text-white font-bold py-4 disabled:opacity-40"
            >
              {submitting ? 'Submitting...' : 'Submit Response'}
              <PaperAirplaneIcon className="w-5 h-5 ml-2" />
            </Button>
          </motion.div>
        )}

        {/* ===== VIDEO PITCH ROUND ===== */}
        {isVideoRound && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="p-6 sm:p-8 bg-white/[0.02] border-white/5 mb-6">
              {roundInfo?.round.prompt && (
                <div className="mb-6">
                  <h2 className="text-lg font-bold text-white mb-2">Your Pitch Brief</h2>
                  <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 text-amber-100/80 text-sm leading-relaxed whitespace-pre-wrap">
                    {roundInfo.round.prompt}
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white/50 mb-2">Video URL (YouTube / Google Drive / Loom)</label>
                  <input
                    type="url"
                    value={videoUrl}
                    onChange={e => setVideoUrl(e.target.value)}
                    placeholder="https://youtube.com/watch?v=..."
                    className="w-full p-3 rounded-xl bg-white/[0.03] border border-white/10 text-white placeholder-white/20 focus:border-red-500/30 focus:outline-none text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/50 mb-2">Pitch Summary (Optional)</label>
                  <textarea
                    value={textSubmission}
                    onChange={e => setTextSubmission(e.target.value)}
                    placeholder="Brief summary of your pitch..."
                    rows={4}
                    className="w-full p-3 rounded-xl bg-white/[0.03] border border-white/10 text-white placeholder-white/20 focus:border-red-500/30 focus:outline-none resize-y text-sm"
                  />
                </div>
              </div>
            </Card>

            <Button
              onClick={() => handleSubmit(false)}
              disabled={submitting || !videoUrl.trim()}
              className="w-full bg-gradient-to-r from-red-600 to-orange-500 text-white font-bold py-4 disabled:opacity-40"
            >
              {submitting ? 'Submitting...' : 'Submit Video Pitch'}
              <PaperAirplaneIcon className="w-5 h-5 ml-2" />
            </Button>
          </motion.div>
        )}

        {/* Social Proof Round */}
        {roundInfo?.round.roundType === 'SOCIAL_PROOF' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="p-8 bg-white/[0.02] border-white/5 text-center">
              <div className="text-6xl mb-4">🚀</div>
              <h2 className="text-2xl font-bold text-white mb-3">Social Proof Round</h2>
              <p className="text-white/40 mb-6 max-w-md mx-auto">
                Share the challenge with friends and bring 3–5 new participants. Your referral count is tracked automatically.
              </p>
              <p className="text-sm text-white/30 mb-6">
                This round is not timed. Go to your dashboard to share your referral code.
              </p>
              <Link href="/vsc/dashboard">
                <Button className="bg-gradient-to-r from-purple-600 to-pink-500 text-white font-bold px-8 py-3">
                  Go to Dashboard & Share
                  <ArrowRightIcon className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}
