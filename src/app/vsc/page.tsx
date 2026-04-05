'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/store/authStore';
import {
  BoltIcon,
  TrophyIcon,
  UserGroupIcon,
  ClockIcon,
  FireIcon,
  SparklesIcon,
  ChevronRightIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';

interface RoundData {
  id: string;
  roundNumber: number;
  title: string;
  description: string;
  roundType: string;
  timeLimit: number;
  passingPercent: number;
  isActive: boolean;
  isLocked: boolean;
  _count: { attempts: number };
}

interface ChallengeData {
  id: string;
  name: string;
  tagline: string;
  description: string;
  entryFee: number;
  secondChanceFee: number;
  thirdChanceFee: number;
  skipRoundPrice: number;
  extraTimePrice: number;
  revivePrice: number;
  leaderboardBoostPrice: number;
  manualRegistrations: number;
  rounds: RoundData[];
  _count: { participants: number };
}

const roundIcons: Record<string, string> = {
  SPEED_IQ: '⚡',
  DECISION_MAKING: '🧠',
  CREATIVITY: '💡',
  EXECUTION: '🛠️',
  PRESSURE: '⏱️',
  SOCIAL_PROOF: '🚀',
  VIDEO_PITCH: '🎤',
};

const roundColors: Record<string, string> = {
  SPEED_IQ: 'from-yellow-500 to-orange-600',
  DECISION_MAKING: 'from-blue-500 to-indigo-600',
  CREATIVITY: 'from-pink-500 to-rose-600',
  EXECUTION: 'from-green-500 to-emerald-600',
  PRESSURE: 'from-red-500 to-orange-600',
  SOCIAL_PROOF: 'from-purple-500 to-violet-600',
  VIDEO_PITCH: 'from-amber-500 to-yellow-600',
};

const defaultRounds = [
  { roundNumber: 1, title: 'Speed IQ Test', roundType: 'SPEED_IQ', description: '20 questions — logic + startup + general IQ. 10 minutes. Top 60% qualify.', passingPercent: 60, timeLimit: 600 },
  { roundNumber: 2, title: 'Decision Making', roundType: 'DECISION_MAKING', description: 'Scenario: "You have ₹10,000 to start a business in 24 hrs." Multiple choice + reasoning.', passingPercent: 60, timeLimit: 900 },
  { roundNumber: 3, title: 'Creativity Challenge', roundType: 'CREATIVITY', description: 'Create a startup idea in 100 words. Scored on uniqueness, feasibility, and impact.', passingPercent: 50, timeLimit: 1200 },
  { roundNumber: 4, title: 'Execution Simulation', roundType: 'EXECUTION', description: 'Solve a real problem — submit steps, budget, and timeline.', passingPercent: 50, timeLimit: 1800 },
  { roundNumber: 5, title: 'Pressure Round', roundType: 'PRESSURE', description: 'Real-time puzzle solving with a live leaderboard. Speed + accuracy.', passingPercent: 40, timeLimit: 600 },
  { roundNumber: 6, title: 'Social Proof Round', roundType: 'SOCIAL_PROOF', description: 'Share the challenge & bring 3–5 participants — fuel the movement!', passingPercent: 0, timeLimit: 0 },
  { roundNumber: 7, title: 'Final Pitch', roundType: 'VIDEO_PITCH', description: '1-minute video pitch. Judged by a panel. Winners take it all.', passingPercent: 0, timeLimit: 0 },
];

export default function VSCPage() {
  const [challenge, setChallenge] = useState<ChallengeData | null>(null);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    fetch('/api/vsc')
      .then(r => r.json())
      .then(d => { if (d.success) setChallenge(d.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const rounds = challenge?.rounds?.length ? challenge.rounds : defaultRounds;
  const totalParticipants = challenge ? (challenge._count.participants + (challenge.manualRegistrations || 0)) : 0;

  return (
    <main className="min-h-screen bg-[#050508] text-white overflow-x-hidden">
      {/* ===== HERO ===== */}
      <section className="relative min-h-screen flex items-center justify-center px-4 pt-20 pb-16">
        {/* Animated background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-500/8 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-orange-500/8 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40rem] h-[40rem] bg-amber-500/5 rounded-full blur-[150px]" />
          {/* Grid */}
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-red-500/30 bg-red-500/10 text-red-400 text-xs font-bold tracking-widest uppercase mb-6">
              <FireIcon className="w-4 h-4" />
              India&apos;s Most Intense Innovation Challenge
            </div>

            <h1 className="text-5xl sm:text-7xl lg:text-8xl font-black tracking-tight mb-6">
              <span className="block bg-gradient-to-r from-red-500 via-orange-400 to-amber-400 bg-clip-text text-transparent">VISHVAKARMA</span>
              <span className="block text-white">SURVIVAL</span>
              <span className="block bg-gradient-to-r from-amber-400 via-orange-500 to-red-500 bg-clip-text text-transparent">CHALLENGE</span>
            </h1>

            <p className="text-lg sm:text-xl text-white/50 max-w-2xl mx-auto mb-8 leading-relaxed">
              7 elimination rounds. Only the sharpest survive.
              <span className="text-amber-400 font-semibold"> Win startup funding</span> or a
              <span className="text-orange-400 font-semibold"> fast-track entry</span> to the Innovation Challenge finale.
            </p>

            <div className="flex flex-wrap justify-center gap-4 mb-12">
              <Link href={isAuthenticated ? '/vsc/register' : '/login?redirect=/vsc/register'}>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="group px-8 py-4 bg-gradient-to-r from-red-600 to-orange-500 rounded-xl text-white font-bold text-lg shadow-lg shadow-red-500/25 hover:shadow-red-500/40 transition-all"
                >
                  Enter the Arena — ₹{challenge?.entryFee || 99}
                  <ArrowRightIcon className="w-5 h-5 inline-block ml-2 group-hover:translate-x-1 transition-transform" />
                </motion.button>
              </Link>
              <Link href="#rounds">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  className="px-8 py-4 border border-white/10 rounded-xl text-white/70 font-semibold text-lg hover:bg-white/5 transition-all"
                >
                  See All Rounds
                </motion.button>
              </Link>
            </div>

            {/* Stats */}
            <div className="flex flex-wrap justify-center gap-8 sm:gap-16">
              {[
                { value: '7', label: 'Elimination Rounds' },
                { value: totalParticipants > 0 ? `${totalParticipants}+` : '∞', label: 'Competitors' },
                { value: '₹99', label: 'Entry Fee' },
                { value: '1', label: 'Survivor Wins' },
              ].map((s, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 + i * 0.1 }} className="text-center">
                  <div className="text-3xl sm:text-4xl font-black bg-gradient-to-b from-white to-white/50 bg-clip-text text-transparent">{s.value}</div>
                  <div className="text-xs text-white/30 uppercase tracking-wider mt-1">{s.label}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 rounded-full border-2 border-white/20 flex items-start justify-center pt-2">
            <div className="w-1 h-2 rounded-full bg-white/40" />
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section className="py-24 px-4 relative">
        <div className="max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <h2 className="text-3xl sm:text-5xl font-black mb-4">How It <span className="bg-gradient-to-r from-red-500 to-orange-400 bg-clip-text text-transparent">Works</span></h2>
            <div className="w-24 h-1 bg-gradient-to-r from-red-500 to-orange-500 mx-auto rounded-full mb-4" />
            <p className="text-white/40 max-w-xl mx-auto">A battle royale for the brain. Each round eliminates the weak. Only the brilliant survive.</p>
          </motion.div>

          <div className="grid sm:grid-cols-3 gap-6">
            {[
              { icon: <BoltIcon className="w-7 h-7" />, title: 'Register & Pay', desc: 'Sign up, pay ₹99 entry fee, and enter the arena. Each attempt gives you a fresh start.', color: 'text-amber-400 bg-amber-400/10 border-amber-400/20' },
              { icon: <ClockIcon className="w-7 h-7" />, title: 'Survive 7 Rounds', desc: 'Each round tests a different skill — IQ, creativity, execution, speed. Bottom performers are eliminated.', color: 'text-red-400 bg-red-400/10 border-red-400/20' },
              { icon: <TrophyIcon className="w-7 h-7" />, title: 'Win Big', desc: 'Final survivors get startup funding opportunities or fast-track entry to the Innovation Challenge finale.', color: 'text-green-400 bg-green-400/10 border-green-400/20' },
            ].map((item, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="relative p-6 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all group"
              >
                <div className="absolute top-4 right-4 text-6xl font-black text-white/[0.03]">{i + 1}</div>
                <div className={`w-14 h-14 rounded-xl border flex items-center justify-center mb-4 ${item.color}`}>
                  {item.icon}
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{item.title}</h3>
                <p className="text-sm text-white/40 leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== ROUND BREAKDOWN ===== */}
      <section id="rounds" className="py-24 px-4 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-red-500/[0.02] to-transparent" />
        <div className="max-w-5xl mx-auto relative z-10">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <h2 className="text-3xl sm:text-5xl font-black mb-4">The <span className="bg-gradient-to-r from-red-500 to-amber-400 bg-clip-text text-transparent">7 Rounds</span></h2>
            <div className="w-24 h-1 bg-gradient-to-r from-red-500 to-orange-500 mx-auto rounded-full mb-4" />
            <p className="text-white/40 max-w-xl mx-auto">Each round is different. Each round is harder. Every user gets a unique set of questions.</p>
          </motion.div>

          <div className="space-y-6">
            {(rounds as (RoundData | typeof defaultRounds[0])[]).map((round, i) => {
              const type = round.roundType;
              const icon = roundIcons[type] || '🎯';
              const gradient = roundColors[type] || 'from-gray-500 to-gray-600';
              const isActive = 'isActive' in round ? round.isActive : false;

              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: i % 2 === 0 ? -30 : 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  className={`group relative flex flex-col sm:flex-row items-start gap-6 p-6 rounded-2xl border transition-all ${
                    isActive ? 'border-red-500/30 bg-red-500/5' : 'border-white/5 bg-white/[0.02] hover:border-white/10'
                  }`}
                >
                  {/* Round number */}
                  <div className={`flex-shrink-0 w-16 h-16 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center text-3xl shadow-lg`}>
                    {icon}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-xs font-bold uppercase tracking-widest text-white/30">Round {round.roundNumber}</span>
                      {isActive && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse">
                          LIVE
                        </span>
                      )}
                      {'isLocked' in round && round.isLocked && !isActive && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/5 text-white/30 border border-white/10">
                          LOCKED
                        </span>
                      )}
                    </div>
                    <h3 className="text-xl font-bold text-white mb-1">{round.title}</h3>
                    <p className="text-sm text-white/40 leading-relaxed">{round.description}</p>

                    <div className="flex flex-wrap gap-4 mt-3">
                      {round.timeLimit > 0 && (
                        <span className="text-xs text-white/25 flex items-center gap-1">
                          <ClockIcon className="w-3.5 h-3.5" /> {Math.round(round.timeLimit / 60)} min
                        </span>
                      )}
                      {round.passingPercent > 0 && (
                        <span className="text-xs text-white/25 flex items-center gap-1">
                          <UserGroupIcon className="w-3.5 h-3.5" /> Top {round.passingPercent}% qualify
                        </span>
                      )}
                      {'_count' in round && (
                        <span className="text-xs text-white/25 flex items-center gap-1">
                          <BoltIcon className="w-3.5 h-3.5" /> {(round as RoundData)._count.attempts} attempts
                        </span>
                      )}
                    </div>
                  </div>

                  <ChevronRightIcon className="w-5 h-5 text-white/10 hidden sm:block flex-shrink-0 mt-4 group-hover:text-white/30 transition-colors" />
                </motion.div>
              );
            })}
          </div>

          <div className="text-center mt-8 text-sm text-white/25">
            <SparklesIcon className="w-4 h-4 inline mr-1" />
            Every user gets a <span className="text-amber-400/60 font-semibold">unique randomized question set</span> — no copying, no cheating.
          </div>
        </div>
      </section>

      {/* ===== POWER-UPS / MONETIZATION ===== */}
      <section className="py-24 px-4 relative">
        <div className="max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <h2 className="text-3xl sm:text-5xl font-black mb-4">Power-<span className="bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">Ups</span></h2>
            <div className="w-24 h-1 bg-gradient-to-r from-purple-500 to-pink-500 mx-auto rounded-full mb-4" />
            <p className="text-white/40 max-w-xl mx-auto">Eliminated? Need more time? Stack the odds in your favor.</p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: '⏭️', name: 'Skip Round Pass', price: challenge?.skipRoundPrice || 199, desc: 'Skip one elimination round entirely', color: 'border-purple-500/20 hover:border-purple-500/40' },
              { icon: '⏱️', name: 'Extra Time Boost', price: challenge?.extraTimePrice || 29, desc: '+2 minutes in any timed round', color: 'border-blue-500/20 hover:border-blue-500/40' },
              { icon: '💀', name: 'Revive Card', price: challenge?.revivePrice || 59, desc: 'Re-enter after elimination', color: 'border-red-500/20 hover:border-red-500/40' },
              { icon: '🔥', name: 'Leaderboard Boost', price: challenge?.leaderboardBoostPrice || 39, desc: 'Highlight your profile on the board', color: 'border-amber-500/20 hover:border-amber-500/40' },
            ].map((pu, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className={`p-6 rounded-2xl bg-white/[0.02] border transition-all text-center ${pu.color}`}
              >
                <div className="text-4xl mb-4">{pu.icon}</div>
                <h3 className="text-lg font-bold text-white mb-1">{pu.name}</h3>
                <p className="text-sm text-white/40 mb-4">{pu.desc}</p>
                <div className="text-2xl font-black bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">₹{pu.price}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== SECOND CHANCE PRICING ===== */}
      <section className="py-24 px-4 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-orange-500/[0.02] to-transparent" />
        <div className="max-w-4xl mx-auto relative z-10">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
            <h2 className="text-3xl sm:text-5xl font-black mb-4">Entry <span className="bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent">Pricing</span></h2>
            <div className="w-24 h-1 bg-gradient-to-r from-orange-500 to-red-500 mx-auto rounded-full mb-4" />
            <p className="text-white/40 max-w-lg mx-auto">Failed? Come back stronger. Each re-entry costs less — because we believe in second chances.</p>
          </motion.div>

          <div className="grid sm:grid-cols-3 gap-6">
            {[
              { attempt: '1st Entry', price: challenge?.entryFee || 99, highlight: true, desc: 'Your first shot at glory' },
              { attempt: '2nd Chance', price: challenge?.secondChanceFee || 49, highlight: false, desc: 'Come back with experience' },
              { attempt: '3rd+ Attempts', price: challenge?.thirdChanceFee || 19, highlight: false, desc: 'Never give up' },
            ].map((tier, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className={`p-6 rounded-2xl border text-center transition-all ${
                  tier.highlight ? 'border-orange-500/30 bg-orange-500/5 shadow-lg shadow-orange-500/5' : 'border-white/5 bg-white/[0.02]'
                }`}
              >
                <div className="text-xs font-bold uppercase tracking-widest text-white/30 mb-3">{tier.attempt}</div>
                <div className="text-4xl font-black bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent mb-2">₹{tier.price}</div>
                <p className="text-sm text-white/40">{tier.desc}</p>
                {tier.highlight && (
                  <div className="mt-4">
                    <Link href={isAuthenticated ? '/vsc/register' : '/login?redirect=/vsc/register'}>
                      <button className="px-6 py-2 bg-gradient-to-r from-red-600 to-orange-500 rounded-lg text-white font-bold text-sm shadow-lg shadow-red-500/20 hover:shadow-red-500/30 transition-all">
                        Register Now
                      </button>
                    </Link>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== WHAT YOU WIN ===== */}
      <section className="py-24 px-4 relative">
        <div className="max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <h2 className="text-3xl sm:text-5xl font-black mb-4">What <span className="bg-gradient-to-r from-emerald-400 to-green-500 bg-clip-text text-transparent">Winners</span> Get</h2>
            <div className="w-24 h-1 bg-gradient-to-r from-emerald-500 to-green-500 mx-auto rounded-full mb-4" />
          </motion.div>

          <div className="grid sm:grid-cols-2 gap-6">
            {[
              { icon: '💰', title: 'Startup Funding Opportunity', desc: 'Direct access to funding for your startup idea — real investment, not a certificate.', gradient: 'from-emerald-500/10 to-green-500/10 border-emerald-500/20' },
              { icon: '🚀', title: 'Fast-Track to Finale', desc: 'Skip straight to the Vishvakarma Innovation Challenge grand finale — no registration needed.', gradient: 'from-amber-500/10 to-orange-500/10 border-amber-500/20' },
              { icon: '🏆', title: 'Champion Recognition', desc: 'Featured on our platform, social media, and event stage as a VSC Champion.', gradient: 'from-purple-500/10 to-violet-500/10 border-purple-500/20' },
              { icon: '🤝', title: 'Mentor & Investor Access', desc: 'Connect directly with mentors, investors, and industry leaders in our network.', gradient: 'from-blue-500/10 to-cyan-500/10 border-blue-500/20' },
            ].map((item, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className={`p-6 rounded-2xl bg-gradient-to-br ${item.gradient} border transition-all`}
              >
                <div className="text-4xl mb-4">{item.icon}</div>
                <h3 className="text-xl font-bold text-white mb-2">{item.title}</h3>
                <p className="text-sm text-white/40 leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FINAL CTA ===== */}
      <section className="py-24 px-4 relative">
        <div className="absolute inset-0 bg-gradient-to-t from-red-500/[0.03] to-transparent" />
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <div className="text-6xl mb-6">🔥</div>
            <h2 className="text-3xl sm:text-5xl font-black mb-4">
              Think You Can <span className="bg-gradient-to-r from-red-500 to-orange-400 bg-clip-text text-transparent">Survive?</span>
            </h2>
            <p className="text-white/40 text-lg mb-8 max-w-lg mx-auto">
              7 rounds. Thousands enter. Only the sharpest mind wins. Your journey starts at just ₹99.
            </p>
            <Link href={isAuthenticated ? '/vsc/register' : '/login?redirect=/vsc/register'}>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="group px-10 py-5 bg-gradient-to-r from-red-600 via-orange-500 to-amber-500 rounded-xl text-white font-bold text-xl shadow-2xl shadow-red-500/25 hover:shadow-red-500/40 transition-all"
              >
                Enter the Arena Now
                <ArrowRightIcon className="w-6 h-6 inline-block ml-3 group-hover:translate-x-1 transition-transform" />
              </motion.button>
            </Link>

            <p className="text-xs text-white/20 mt-6">
              By registering, you agree to the challenge rules and terms of participation.
            </p>
          </motion.div>
        </div>
      </section>
    </main>
  );
}
