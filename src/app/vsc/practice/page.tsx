'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Card, Button } from '@/components/ui';
import { useAuthStore } from '@/store/authStore';
import { ArrowLeftIcon, SparklesIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Razorpay: any;
  }
}

interface Question {
  id: string;
  question: string;
  options: string[];
  points: number;
}

interface Plan {
  plan: string;
  price: number;
  label: string;
  duration: string;
  features?: string[];
}

export default function PracticeArenaPage() {
  const router = useRouter();
  const { token, loginContext } = useAuthStore();
  const [hasAccess, setHasAccess] = useState(false);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [category, setCategory] = useState('logic');
  const [categories] = useState(['logic', 'business', 'creative']);
  const [sessionId, setSessionId] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<{ score: number; maxScore: number; graded: Array<{ questionId: string; isCorrect: boolean; correctAnswer: string; points: number }> } | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [purchasing, setPurchasing] = useState(false);

  const loadQuestions = useCallback(async (cat: string) => {
    if (!token) return;
    setLoading(true);
    setResult(null);
    setAnswers({});
    try {
      const res = await fetch(`/api/vsc/practice?category=${cat}`, { headers: { Authorization: `Bearer ${token}` } });
      const d = await res.json();
      if (d.success) {
        if (d.data.hasAccess) {
          setHasAccess(true);
          setQuestions(d.data.questions);
          setSessionId(d.data.sessionId);
        } else {
          setHasAccess(false);
          setPlans(d.data.plans);
        }
      }
    } catch { /* ignore */ }
    setLoading(false);
  }, [token]);

  useEffect(() => {
    if (!token || loginContext !== 'vsc') { router.push('/vsc/login'); return; }
    loadQuestions(category);
  }, [token, loginContext, router, loadQuestions, category]);

  const handleSubmit = async () => {
    if (!token) return;
    setSubmitting(true);
    try {
      const answerArray = questions.map(q => ({ questionId: q.id, answer: answers[q.id] || '' }));
      const res = await fetch('/api/vsc/practice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ answers: answerArray, category, sessionId }),
      });
      const d = await res.json();
      if (d.success) setResult(d.data);
    } catch { /* ignore */ }
    setSubmitting(false);
  };

  const handleSubscribe = async (plan: string) => {
    if (!token) return;
    setPurchasing(true);
    try {
      const res = await fetch('/api/vsc/subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ plan }),
      });
      const d = await res.json();
      if (!d.success) { alert(d.error); setPurchasing(false); return; }

      const options = {
        key: d.data.keyId,
        amount: d.data.amount,
        currency: d.data.currency,
        name: 'VSC Practice Arena',
        description: `${plan} Subscription`,
        order_id: d.data.orderId,
        handler: async (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
          const verify = await fetch('/api/vsc/subscription', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ subscriptionId: d.data.subscriptionId, ...response }),
          });
          const v = await verify.json();
          if (v.success) { loadQuestions(category); }
          else alert('Payment verification failed');
        },
        theme: { color: '#7c3aed' },
      };
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch { alert('Payment failed'); }
    setPurchasing(false);
  };

  if (loading) return <div className="min-h-screen bg-[#050508] flex items-center justify-center"><div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-[#050508] text-white pt-20 pb-12 px-4">
      <script src="https://checkout.razorpay.com/v1/checkout.js" async />
      <div className="max-w-3xl mx-auto">
        <Link href="/vsc/dashboard" className="inline-flex items-center gap-2 text-sm text-white/30 hover:text-white/50 mb-6">
          <ArrowLeftIcon className="w-4 h-4" /> Back to Dashboard
        </Link>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-black mb-2 flex items-center gap-3">
            <SparklesIcon className="w-8 h-8 text-purple-400" /> Practice Arena
          </h1>
          <p className="text-white/40 mb-8">Unlimited practice rounds. No stakes. Pure improvement.</p>

          {!hasAccess ? (
            <div>
              <p className="text-sm text-white/50 mb-6">Subscribe to unlock unlimited practice:</p>
              <div className="grid sm:grid-cols-3 gap-4">
                {plans.map((p) => (
                  <Card key={p.plan} className={`p-6 bg-white/[0.02] border text-center transition-all ${p.plan === 'VIP_MONTHLY' ? 'border-amber-500/30 bg-amber-500/5' : 'border-white/5'}`}>
                    <h3 className="font-bold text-white mb-1">{p.label}</h3>
                    <div className="text-2xl font-black text-amber-400 mb-1">₹{p.price}</div>
                    <div className="text-xs text-white/30 mb-4">{p.duration}</div>
                    {p.features && (
                      <ul className="text-xs text-white/30 space-y-1 mb-4 text-left">
                        {p.features.map((f, i) => <li key={i}>✓ {f}</li>)}
                      </ul>
                    )}
                    <Button onClick={() => handleSubscribe(p.plan)} disabled={purchasing}
                      className="w-full py-2 bg-gradient-to-r from-purple-600 to-violet-500 rounded-lg text-sm font-bold disabled:opacity-50">
                      Subscribe
                    </Button>
                  </Card>
                ))}
              </div>
            </div>
          ) : result ? (
            <Card className="p-8 bg-white/[0.02] border-purple-500/20">
              <h2 className="text-xl font-bold mb-4 text-center">
                Score: <span className="text-purple-400">{result.score}</span>/{result.maxScore}
              </h2>
              <div className="space-y-3 mb-6">
                {result.graded.map((g, i) => (
                  <div key={i} className={`p-3 rounded-lg ${g.isCorrect ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-red-500/10 border border-red-500/20'}`}>
                    <span className="text-sm">{g.isCorrect ? '✅' : '❌'} Q{i + 1} — +{g.points} pts</span>
                    {!g.isCorrect && <p className="text-xs text-white/30 mt-1">Answer: {g.correctAnswer}</p>}
                  </div>
                ))}
              </div>
              <Button onClick={() => loadQuestions(category)} className="w-full py-3 bg-gradient-to-r from-purple-600 to-violet-500 rounded-xl font-bold">
                Practice Again
              </Button>
            </Card>
          ) : (
            <div>
              <div className="flex gap-2 mb-6">
                {categories.map(c => (
                  <button key={c} onClick={() => { setCategory(c); loadQuestions(c); }}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold capitalize transition-all ${
                      category === c ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'bg-white/[0.03] text-white/40 border border-white/5'
                    }`}>
                    {c}
                  </button>
                ))}
              </div>

              <div className="space-y-6">
                {questions.map((q, i) => (
                  <Card key={q.id} className="p-6 bg-white/[0.02] border-white/5">
                    <p className="text-sm font-semibold mb-3 text-white/80">Q{i + 1}. {q.question}</p>
                    <div className="grid grid-cols-2 gap-3">
                      {q.options.map((opt) => (
                        <button key={opt} onClick={() => setAnswers({ ...answers, [q.id]: opt })}
                          className={`p-3 rounded-lg text-sm text-left transition-all ${
                            answers[q.id] === opt ? 'bg-purple-500/20 border border-purple-500/40 text-purple-300' : 'bg-white/[0.03] border border-white/5 text-white/50 hover:bg-white/[0.05]'
                          }`}>
                          {opt}
                        </button>
                      ))}
                    </div>
                  </Card>
                ))}
                <Button onClick={handleSubmit} disabled={submitting || Object.keys(answers).length < questions.length}
                  className="w-full py-4 bg-gradient-to-r from-purple-600 to-violet-500 rounded-xl font-bold text-lg disabled:opacity-50">
                  {submitting ? 'Grading...' : 'Submit Answers'}
                </Button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
