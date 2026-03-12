'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Card, Button, Badge } from '@/components/ui';
import { useAuthStore } from '@/store/authStore';
import {
  RocketLaunchIcon,
  TrophyIcon,
  UserGroupIcon,
  CalendarDaysIcon,
  ChartBarIcon,
  HandThumbUpIcon,
  ClockIcon,
  CheckCircleIcon,
  ArrowRightIcon,
  SparklesIcon,
  AcademicCapIcon,
  LightBulbIcon,
  PresentationChartBarIcon,
  StarIcon,
  FireIcon,
  BoltIcon,
  GlobeAltIcon,
  HeartIcon,
  MegaphoneIcon,
  MicrophoneIcon,
  VideoCameraIcon,
  ShareIcon,
  TicketIcon,
} from '@heroicons/react/24/outline';
import { HandThumbUpIcon as HandThumbUpSolid } from '@heroicons/react/24/solid';

interface SponsorData {
  id: string;
  tier: string;
  name: string;
  logo: string | null;
  price: number;
  benefits: string;
}

interface CampusPartnerData {
  id: string;
  name: string;
  logo: string | null;
  website: string | null;
}

interface CompetitionData {
  id: string;
  name: string;
  tagline: string;
  slug: string;
  description: string;
  currentPhase: string;
  studentFee: number;
  founderFee: number;
  boothPrice: number;
  boothDescription: string | null;
  registrationStart: string;
  registrationEnd: string;
  screeningEnd: string;
  votingEnd: string;
  finalsDate: string;
  isActive: boolean;
  pageContent: Record<string, unknown> | null;
  entries: CompetitionEntryData[];
  judges: JudgeData[];
  sponsors: SponsorData[];
  campusPartners: CampusPartnerData[];
  _count: { entries: number };
}

interface CompetitionEntryData {
  id: string;
  status: string;
  upvotes: number;
  totalScore: number | null;
  finalRank: number | null;
  startup: {
    id: string;
    title: string;
    slug: string;
    shortDescription: string;
    category: string;
    location: string;
    productStage: string;
    logo: string | null;
    thumbnail: string | null;
    founder: { firstName: string; lastName: string; avatar: string | null };
  };
  user: { firstName: string; lastName: string };
  _count: { votes: number };
}

interface JudgeData {
  id: string;
  name: string;
  title: string;
  organization: string;
  avatar: string | null;
}

const PHASE_INFO = {
  REGISTRATION: { label: 'Phase 1 — Registration Open', color: 'text-green-400', bg: 'bg-green-400/10 border-green-400/20' },
  SCREENING: { label: 'Phase 2 — Jury Screening', color: 'text-yellow-400', bg: 'bg-yellow-400/10 border-yellow-400/20' },
  VOTING: { label: 'Phase 3 — Public Voting', color: 'text-blue-400', bg: 'bg-blue-400/10 border-blue-400/20' },
  FINALS: { label: 'Phase 4 — Final Pitch Round', color: 'text-purple-400', bg: 'bg-purple-400/10 border-purple-400/20' },
  COMPLETED: { label: 'Competition Completed', color: 'text-gray-400', bg: 'bg-gray-400/10 border-gray-400/20' },
};

export default function CompetitionPage() {
  const { user, token, isAuthenticated } = useAuthStore();
  const [competition, setCompetition] = useState<CompetitionData | null>(null);
  const [votedEntries, setVotedEntries] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState<string | null>(null);
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [countdownLabel, setCountdownLabel] = useState('');
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [copied, setCopied] = useState(false);

  // Helper to get page content value with fallback
  const pc = (key: string, fallback: unknown = ''): unknown => {
    return competition?.pageContent?.[key] ?? fallback;
  };
  const pcs = (key: string, fallback: string = ''): string => {
    const val = competition?.pageContent?.[key];
    return typeof val === 'string' ? val : fallback;
  };
  const pcn = (key: string, fallback: number = 0): number => {
    const val = competition?.pageContent?.[key];
    return typeof val === 'number' ? val : fallback;
  };
  const pcList = (key: string, fallback: string): string[] => {
    const val = pcs(key, fallback);
    return val.split(',').map(s => s.trim()).filter(Boolean);
  };

  useEffect(() => {
    fetchCompetition();
  }, []);

  useEffect(() => {
    if (!competition) return;
    const now = Date.now();
    const regStart = new Date(competition.registrationStart).getTime();
    const regEnd = new Date(competition.registrationEnd).getTime();
    const screenEnd = competition.screeningEnd ? new Date(competition.screeningEnd).getTime() : 0;
    const voteEnd = competition.votingEnd ? new Date(competition.votingEnd).getTime() : 0;
    const finals = competition.finalsDate ? new Date(competition.finalsDate).getTime() : 0;

    let targetTime = 0;
    let label = '';

    if (now < regStart) {
      targetTime = regStart;
      label = 'Registration Opens In';
    } else if (competition.currentPhase === 'REGISTRATION' && now < regEnd) {
      targetTime = regEnd;
      label = 'Registration Closes In';
    } else if (competition.currentPhase === 'SCREENING' && screenEnd && now < screenEnd) {
      targetTime = screenEnd;
      label = 'Screening Ends In';
    } else if (competition.currentPhase === 'VOTING' && voteEnd && now < voteEnd) {
      targetTime = voteEnd;
      label = 'Voting Ends In';
    } else if (competition.currentPhase === 'FINALS' && finals && now < finals) {
      targetTime = finals;
      label = 'Finals Day In';
    }

    if (!targetTime) {
      setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      setCountdownLabel('');
      return;
    }

    setCountdownLabel(label);

    const tick = () => {
      const diff = targetTime - Date.now();
      if (diff <= 0) { setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 }); return; }
      setCountdown({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      });
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [competition]);

  const fetchCompetition = async () => {
    try {
      const res = await fetch('/api/competition');
      const data = await res.json();
      if (data.success) {
        setCompetition(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch competition:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (entryId: string) => {
    if (!token) return;
    setVoting(entryId);
    try {
      const res = await fetch('/api/competition/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ entryId }),
      });
      const data = await res.json();
      if (data.success) {
        setVotedEntries((prev) => {
          const next = new Set(prev);
          if (data.data.voted) next.add(entryId);
          else next.delete(entryId);
          return next;
        });
        fetchCompetition();
      }
    } catch {
      console.error('Vote failed');
    } finally {
      setVoting(null);
    }
  };

  const daysLeft = (dateStr: string) => {
    const diff = new Date(dateStr).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  const shareUrl = 'https://www.vishvakarmahub.com/competition';
  const applyUrl = 'https://www.vishvakarmahub.com/competition/register';
  const shareTitle = competition?.name || 'Vishvakarma Innovation Challenge 2026';
  const shareText = `${shareTitle} — ${competition?.tagline || "India's Biggest Startup Competition"}\n\n🚀 Register your startup and compete for amazing prizes!\n🎓 Students: ₹${competition?.studentFee || 199} | 💼 Founders: ₹${competition?.founderFee || 499}\n\nOrganized by Trinetrashakti Innovations Pvt Ltd (Startup India Recognized)\n\n🔗 Competition Page: ${shareUrl}\n✅ Apply Now: ${applyUrl}`;

  const shareLinks = [
    { name: 'WhatsApp', color: 'bg-green-500 hover:bg-green-600', icon: '💬', href: `https://wa.me/?text=${encodeURIComponent(shareText)}` },
    { name: 'X (Twitter)', color: 'bg-gray-800 hover:bg-gray-700', icon: '𝕏', href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareTitle + ' — Register now!')}&url=${encodeURIComponent(shareUrl)}` },
    { name: 'LinkedIn', color: 'bg-blue-600 hover:bg-blue-700', icon: '💼', href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}` },
    { name: 'Facebook', color: 'bg-blue-500 hover:bg-blue-600', icon: '📘', href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}` },
    { name: 'Telegram', color: 'bg-sky-500 hover:bg-sky-600', icon: '✈️', href: `https://t.me/share/url?url=${encodeURIComponent(applyUrl)}&text=${encodeURIComponent(shareText)}` },
  ];

  const copyLink = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-purple border-t-transparent rounded-full" />
      </div>
    );
  }

  const phase = competition?.currentPhase as keyof typeof PHASE_INFO;
  const registrationLive = competition ? Date.now() >= new Date(competition.registrationStart).getTime() : false;
  const phaseInfo = phase
    ? (phase === 'REGISTRATION' && !registrationLive
        ? { label: 'Registration Opens Soon', color: 'text-cyan-400', bg: 'bg-cyan-400/10 border-cyan-400/20' }
        : PHASE_INFO[phase])
    : PHASE_INFO.REGISTRATION;

  return (
    <div className="min-h-screen relative">

      {/* ═══ FLOATING CTA BANNER ═══ */}
      <div className="fixed bottom-0 left-0 right-0 z-50">
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-purple via-blue to-cyan-500" />
          <div className="absolute inset-0 bg-black/10 backdrop-blur-sm" />
          <div className="relative max-w-5xl mx-auto py-3.5 px-4 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4">
            <div className="flex items-center gap-2">
              <MegaphoneIcon className="w-5 h-5 text-white animate-bounce" />
              <span className="text-white font-bold text-sm sm:text-base tracking-wide">
                {pcs('bannerText', "You're Invited! India's Biggest Startup Competition is LIVE")}
              </span>
            </div>
            <Link href="/competition/register">
              <button className="px-6 py-2 bg-white text-purple font-bold rounded-full text-sm hover:bg-white/90 hover:scale-105 transition-all shadow-xl shadow-black/20 whitespace-nowrap">
                {pcs('bannerButtonText', "Register Now — From ₹199 Only!")}
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════ */}
      {/* ═══ ACT I — THE GRAND OPENING (HERO) ═══ */}
      {/* ═══════════════════════════════════════════ */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Multi-layered aurora background */}
        <div className="absolute inset-0 aurora-bg" />
        <div className="absolute inset-0 grid-bg opacity-20" />

        {/* Cinematic lighting — floating orbs */}
        <div className="absolute top-10 left-[8%] w-[700px] h-[700px] bg-purple/20 rounded-full blur-[200px] animate-float-slow" />
        <div className="absolute bottom-10 right-[10%] w-[600px] h-[600px] bg-blue/15 rounded-full blur-[180px] animate-float-slow" style={{ animationDelay: '3s' }} />
        <div className="absolute top-1/3 right-[20%] w-[400px] h-[400px] bg-cyan-500/10 rounded-full blur-[150px] animate-float-slow" style={{ animationDelay: '6s' }} />
        <div className="absolute bottom-1/3 left-[25%] w-[350px] h-[350px] bg-amber-500/[0.07] rounded-full blur-[140px] animate-float-slow" style={{ animationDelay: '4s' }} />

        {/* Floating particles */}
        <div className="absolute top-32 left-[12%] w-2 h-2 bg-purple/60 rounded-full animate-ping" />
        <div className="absolute top-48 right-[18%] w-1.5 h-1.5 bg-blue/50 rounded-full animate-ping" style={{ animationDelay: '0.5s' }} />
        <div className="absolute top-72 left-[65%] w-1 h-1 bg-cyan-400/40 rounded-full animate-ping" style={{ animationDelay: '1s' }} />
        <div className="absolute top-56 left-[80%] w-1.5 h-1.5 bg-amber-400/50 rounded-full animate-ping" style={{ animationDelay: '1.5s' }} />
        <div className="absolute bottom-40 left-[20%] w-1 h-1 bg-purple/30 rounded-full animate-ping" style={{ animationDelay: '2s' }} />
        <div className="absolute bottom-60 right-[30%] w-1.5 h-1.5 bg-blue/40 rounded-full animate-ping" style={{ animationDelay: '2.5s' }} />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 text-center pt-32 pb-24">
          {/* Live status badge — premium glass */}
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, ease: 'easeOut' }}>
            <motion.div
              animate={{ scale: [1, 1.03, 1] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="inline-flex items-center gap-3 px-6 py-3 rounded-full glass border-purple/20 mb-10"
            >
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500" />
              </span>
              <span className="text-sm font-semibold text-purple/90 tracking-[0.15em] uppercase">{pcs('heroBadgeText', 'Registrations Open — Join Now!')}</span>
            </motion.div>
          </motion.div>

          {/* Title — cinematic massive */}
          <motion.h1
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="text-5xl sm:text-7xl lg:text-8xl xl:text-[9rem] font-black leading-[0.9] tracking-[-0.04em] mb-8"
          >
            <span className="block text-foreground drop-shadow-[0_0_40px_rgba(139,92,246,0.15)]">
              {pcs('heroTitleLine1', "India's Biggest")}
            </span>
            <span className="block text-shimmer mt-2">
              {pcs('heroTitleLine2', 'Startup Competition')}
            </span>
          </motion.h1>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.5 }}
            className="text-xl sm:text-2xl lg:text-3xl text-muted/70 max-w-4xl mx-auto mb-6 leading-relaxed font-light"
          >
            {pcs('heroDescription', 'We invite students, founders, engineers, and innovators from every corner of India to showcase their groundbreaking ideas on the national stage.')}
          </motion.p>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="text-lg sm:text-xl text-purple/70 font-medium mb-14 italic"
          >
            &ldquo;{pcs('heroQuote', 'Your idea deserves the spotlight. This is your moment.')}&rdquo;
          </motion.p>

          {/* CTA Buttons — premium */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}
            className="flex flex-wrap gap-5 justify-center mb-16"
          >
            <Link href="/competition/register">
              <button className="group relative px-10 py-5 bg-gradient-to-r from-purple to-blue rounded-2xl text-white font-bold text-lg overflow-hidden transition-all hover:scale-105 hover:shadow-2xl hover:shadow-purple/25">
                <span className="relative z-10 flex items-center gap-2">
                  <FireIcon className="w-5 h-5" />
                  Register Your Startup
                  <ArrowRightIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-blue to-purple opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              </button>
            </Link>
            <Link href="/signup">
              <button className="px-10 py-5 rounded-2xl text-foreground font-bold text-lg glass border-white/10 hover:border-purple/30 hover:bg-white/5 transition-all duration-300">
                Create Account
              </button>
            </Link>
          </motion.div>

          {/* Countdown Timer — cinematic glass */}
          {countdownLabel && (countdown.days > 0 || countdown.hours > 0 || countdown.minutes > 0 || countdown.seconds > 0) && (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 1.2 }}>
              <p className="text-xs font-bold text-muted/50 uppercase tracking-[0.3em] mb-6">{countdownLabel}</p>
              <div className="flex justify-center gap-4 sm:gap-6">
                {[
                  { value: countdown.days, label: 'Days' },
                  { value: countdown.hours, label: 'Hours' },
                  { value: countdown.minutes, label: 'Minutes' },
                  { value: countdown.seconds, label: 'Seconds' },
                ].map((t) => (
                  <div key={t.label} className="glass-premium rounded-2xl px-5 sm:px-8 py-4 sm:py-6 min-w-[80px] sm:min-w-[100px] border-glow-animate">
                    <p className="text-4xl sm:text-5xl font-black bg-gradient-to-b from-foreground via-foreground/90 to-muted/40 bg-clip-text text-transparent tabular-nums">
                      {String(t.value).padStart(2, '0')}
                    </p>
                    <p className="text-[10px] sm:text-xs text-muted/40 font-semibold uppercase tracking-[0.2em] mt-1">{t.label}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Phase badge */}
          {competition && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }} className="mt-12">
              <div className={`inline-flex items-center gap-2 px-6 py-3 rounded-full font-semibold text-sm glass ${phaseInfo.color}`}>
                <SparklesIcon className="w-4 h-4" />
                {phaseInfo.label}
              </div>
            </motion.div>
          )}

          {/* Share Button */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.7 }} className="mt-10 relative inline-block">
            <button
              onClick={() => setShowShareMenu(!showShareMenu)}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full glass text-muted/60 hover:text-foreground hover:border-purple/30 transition-all text-sm font-medium"
            >
              <ShareIcon className="w-4 h-4" />
              Share This Event
            </button>

            {showShareMenu && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className="absolute top-full mt-3 left-1/2 -translate-x-1/2 z-50 glass-premium rounded-2xl p-5 shadow-2xl shadow-black/50 min-w-[300px]"
              >
                <p className="text-xs text-muted/50 uppercase tracking-[0.2em] font-semibold mb-3">Share via</p>
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {shareLinks.map((link) => (
                    <a
                      key={link.name}
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex flex-col items-center gap-1.5 p-3 rounded-xl ${link.color} text-white transition-all hover:scale-105`}
                      onClick={() => setShowShareMenu(false)}
                    >
                      <span className="text-lg">{link.icon}</span>
                      <span className="text-[10px] font-medium">{link.name}</span>
                    </a>
                  ))}
                  <button
                    onClick={() => { copyLink(); setShowShareMenu(false); }}
                    className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-purple/20 hover:bg-purple/30 text-purple transition-all hover:scale-105"
                  >
                    <span className="text-lg">{copied ? '✅' : '🔗'}</span>
                    <span className="text-[10px] font-medium">{copied ? 'Copied!' : 'Copy Link'}</span>
                  </button>
                </div>
                <button
                  onClick={() => setShowShareMenu(false)}
                  className="w-full text-xs text-muted/50 hover:text-foreground py-1.5 transition-colors"
                >
                  Close
                </button>
              </motion.div>
            )}
          </motion.div>
        </div>

        {/* Bottom gradient fade */}
        <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-[#0B0F1A] to-transparent" />
      </section>

      {/* ═══ STATS STRIP — Floating Glass Bar ═══ */}
      <section className="relative -mt-24 z-10 px-4 sm:px-6 pb-24">
        <div className="max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }}>
            <div className="glass-premium rounded-3xl p-2.5">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { label: 'Registrations', value: competition?._count?.entries || 0, icon: RocketLaunchIcon, gradient: 'from-purple/20 to-purple/5', color: 'text-purple' },
                  { label: 'Top Selected', value: pcn('topSelected', 200), icon: StarIcon, gradient: 'from-amber-400/20 to-amber-400/5', color: 'text-amber-400' },
                  { label: 'Finalists', value: pcn('finalistCount', 20), icon: TrophyIcon, gradient: 'from-orange-400/20 to-orange-400/5', color: 'text-orange-400' },
                  { label: 'Pitch Duration', value: pcs('pitchDuration', '5 min'), icon: ClockIcon, gradient: 'from-blue/20 to-blue/5', color: 'text-blue' },
                ].map((stat, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} viewport={{ once: true }}>
                    <div className={`bg-gradient-to-b ${stat.gradient} rounded-2xl p-6 sm:p-8 text-center`}>
                      <stat.icon className={`w-7 h-7 ${stat.color} mx-auto mb-3 opacity-70`} />
                      <p className="text-3xl sm:text-4xl font-black text-foreground">{stat.value}</p>
                      <p className="text-[10px] text-muted/50 font-semibold uppercase tracking-[0.15em] mt-1">{stat.label}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <div className="section-divider max-w-4xl mx-auto" />

      {/* ═══════════════════════════════════════════════ */}
      {/* ═══ ACT II — THE INVITATION ═══ */}
      {/* ═══════════════════════════════════════════════ */}
      <section className="py-28 sm:py-36 px-4 sm:px-6 cinematic-section">
        <div className="absolute inset-0 spotlight" />
        <div className="max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }}>
            <div className="glass-premium rounded-[2rem] p-10 sm:p-16 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-60 h-60 bg-purple/8 rounded-full blur-[80px]" />
              <div className="absolute bottom-0 right-0 w-60 h-60 bg-blue/8 rounded-full blur-[80px]" />
              <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-purple/30 to-transparent" />
              <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-blue/20 to-transparent" />

              <div className="relative text-center">
                <HeartIcon className="w-12 h-12 text-purple/50 mx-auto mb-6" />
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-foreground mb-6 leading-tight">
                  {pcs('invitationTitle', 'Dear Innovators, This is Your Invitation')}
                </h2>
                <p className="text-lg sm:text-xl text-muted/60 max-w-3xl mx-auto mb-6 leading-relaxed font-light">
                  {pcs('invitationDescription', "Whether you're a college student with a brilliant idea, a founder building the next big thing, or an engineer who wants to solve real problems — Vishvakarma Innovation Challenge 2026 is the platform where your startup journey begins.")}
                </p>
                <p className="text-base text-muted/40 max-w-2xl mx-auto mb-10">
                  {pcs('invitationSubtext', 'We believe every idea matters. No matter how big or small, your innovation can change the world. Join thousands of dreamers who are turning ideas into reality.')}
                </p>
                <div className="flex flex-wrap justify-center gap-x-8 gap-y-3 text-sm">
                  {pcList('invitationHighlights', 'Open to all Indians, Starting at just ₹199, National stage exposure, Meet investors & mentors').map((h, i) => (
                    <div key={i} className="flex items-center gap-2 text-green-400/70">
                      <CheckCircleIcon className="w-5 h-5" />
                      <span>{h}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <div className="section-divider max-w-4xl mx-auto" />

      {/* ═══════════════════════════════════════════════════ */}
      {/* ═══ ACT III — THE PRIZES (Award Ceremony) ═══ */}
      {/* ═══════════════════════════════════════════════════ */}
      <section className="py-28 sm:py-36 px-4 sm:px-6 cinematic-section">
        <div className="absolute inset-0 spotlight-gold" />
        <div className="absolute top-1/2 left-0 w-[600px] h-[600px] bg-amber-500/[0.04] rounded-full blur-[250px] -translate-y-1/2" />
        <div className="absolute top-1/2 right-0 w-[500px] h-[500px] bg-purple/[0.04] rounded-full blur-[200px] -translate-y-1/2" />

        <div className="max-w-6xl mx-auto relative">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-20">
            <motion.div initial={{ opacity: 0, scale: 0.8 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
              <TrophyIcon className="w-16 h-16 text-amber-400/50 mx-auto mb-6" />
            </motion.div>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-foreground mb-4">
              {pcs('prizeSectionTitle', 'What You Win')}
            </h2>
            <p className="text-lg text-muted/50 max-w-xl mx-auto">{pcs('prizeSectionSubtitle', 'More than just prizes — a launchpad for your startup career')}</p>
          </motion.div>

          {/* Prize Cards — Award Ceremony Layout */}
          <div className="grid md:grid-cols-3 gap-6 lg:gap-8 mb-12">
            {/* 1st Place — Gold Crown */}
            <motion.div initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1, duration: 0.7 }} className="md:-mt-8">
              <div className="glass-gold rounded-3xl p-8 sm:p-10 text-center relative overflow-hidden card-cinematic h-full gold-glow-animate">
                <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-b from-amber-400/[0.06] to-transparent" />
                <div className="relative">
                  <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-amber-400/25 to-orange-500/15 flex items-center justify-center mx-auto mb-6 border border-amber-400/20">
                    <TrophyIcon className="w-12 h-12 text-amber-400" />
                  </div>
                  <div className="mb-4">
                    <span className="gold-shimmer text-xs font-black tracking-[0.3em] uppercase">1st Place</span>
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-black text-foreground mb-2">{pcs('firstPrizeTitle', 'Grand Winner')}</h3>
                  <p className="text-sm text-muted/40 mb-8">{pcs('firstPrizeSubtitle', 'The top startup takes it all')}</p>
                  <div className="space-y-3 text-sm text-left">
                    {pcList('firstPrizeBenefits', 'Cash prize + Trophy, Investor pitch meetings, 1-year incubation support, Media & PR coverage').map((b, i) => (
                      <div key={i} className="flex items-center gap-3"><StarIcon className="w-4 h-4 text-amber-400/70 flex-shrink-0" /><span className="text-foreground/70">{b}</span></div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* 2nd Place — Silver */}
            <motion.div initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2, duration: 0.7 }}>
              <div className="glass-premium rounded-3xl p-8 sm:p-10 text-center relative overflow-hidden border-gray-400/15 card-cinematic h-full">
                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-gray-400 to-transparent" />
                <div className="relative">
                  <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-gray-300/15 to-gray-400/10 flex items-center justify-center mx-auto mb-6 border border-gray-400/15">
                    <TrophyIcon className="w-10 h-10 text-gray-300" />
                  </div>
                  <Badge variant="default">2nd Place</Badge>
                  <h3 className="text-2xl font-black text-foreground mt-3 mb-2">{pcs('secondPrizeTitle', 'Runner Up')}</h3>
                  <p className="text-sm text-muted/40 mb-8">{pcs('secondPrizeSubtitle', 'Outstanding innovation runner')}</p>
                  <div className="space-y-3 text-sm text-left">
                    {pcList('secondPrizeBenefits', 'Cash prize + Trophy, Mentorship program, Networking access').map((b, i) => (
                      <div key={i} className="flex items-center gap-3"><StarIcon className="w-4 h-4 text-gray-400/70 flex-shrink-0" /><span className="text-foreground/70">{b}</span></div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* 3rd Place — Bronze */}
            <motion.div initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.3, duration: 0.7 }}>
              <div className="glass-premium rounded-3xl p-8 sm:p-10 text-center relative overflow-hidden border-orange-600/15 card-cinematic h-full">
                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-orange-600 to-transparent" />
                <div className="relative">
                  <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-orange-600/15 to-orange-700/10 flex items-center justify-center mx-auto mb-6 border border-orange-600/15">
                    <TrophyIcon className="w-10 h-10 text-orange-600" />
                  </div>
                  <Badge variant="info">3rd Place</Badge>
                  <h3 className="text-2xl font-black text-foreground mt-3 mb-2">{pcs('thirdPrizeTitle', 'Second Runner Up')}</h3>
                  <p className="text-sm text-muted/40 mb-8">{pcs('thirdPrizeSubtitle', 'Remarkable innovation')}</p>
                  <div className="space-y-3 text-sm text-left">
                    {pcList('thirdPrizeBenefits', 'Cash prize + Trophy, Platform spotlight, Certificate of excellence').map((b, i) => (
                      <div key={i} className="flex items-center gap-3"><StarIcon className="w-4 h-4 text-orange-600/70 flex-shrink-0" /><span className="text-foreground/70">{b}</span></div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* All Participants Benefits */}
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <div className="glass rounded-3xl p-8 sm:p-10 border-purple/10">
              <div className="text-center mb-6">
                <GlobeAltIcon className="w-10 h-10 text-purple/40 mx-auto mb-3" />
                <h3 className="text-xl font-bold text-foreground">Every Participant Gets</h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center text-sm">
                {(() => {
                  const icons = [AcademicCapIcon, UserGroupIcon, BoltIcon, SparklesIcon];
                  return pcList('participantBenefits', 'Certificate of Participation, Networking with Founders, Startup Visibility, Mentorship Access').map((label, i) => {
                    const Icon = icons[i % icons.length];
                    return (
                      <div key={i} className="flex flex-col items-center gap-3 p-5 rounded-2xl bg-purple/[0.04] border border-purple/10">
                        <Icon className="w-7 h-7 text-purple/50" />
                        <span className="text-muted/50 font-medium text-xs">{label}</span>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <div className="section-divider max-w-4xl mx-auto" />

      {/* ═════════════════════════════════════════════════════ */}
      {/* ═══ ACT IV — COMPETITION PHASES ═══ */}
      {/* ═════════════════════════════════════════════════════ */}
      <section className="py-28 sm:py-36 px-4 sm:px-6 cinematic-section">
        <div className="absolute inset-0 spotlight" />

        <div className="max-w-6xl mx-auto relative">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-20">
            <CalendarDaysIcon className="w-14 h-14 text-blue/40 mx-auto mb-6" />
            <h2 className="text-4xl sm:text-5xl font-black text-foreground mb-4">Competition Phases</h2>
            <p className="text-lg text-muted/50 max-w-xl mx-auto">From registration to the final pitch — here&apos;s how the journey unfolds</p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
            {/* Phase 1 */}
            <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
              <div className={`glass-premium rounded-3xl p-8 h-full relative overflow-hidden card-cinematic ${phase === 'REGISTRATION' ? 'border-green-400/20' : ''}`}>
                {phase === 'REGISTRATION' && <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-green-400 to-transparent" />}
                <div className="flex items-start gap-5">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 ${phase === 'REGISTRATION' ? 'bg-green-400/10 text-green-400' : 'bg-white/5 text-muted/40'}`}>
                    <RocketLaunchIcon className="w-7 h-7" />
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-foreground">Phase 1 — Registration</h3>
                      {phase === 'REGISTRATION' && <Badge variant="success">ACTIVE</Badge>}
                    </div>
                    <p className="text-xs text-muted/40 mb-4">Duration: 30 days{competition && ` (${formatDate(competition.registrationStart)} – ${formatDate(competition.registrationEnd)})`}</p>
                    <p className="text-sm text-muted/50 mb-4">Open to students, engineers, founders, innovators, and researchers. Submit your startup via the Vishvakarma Hub wizard.</p>
                    <div className="text-xs text-muted/40">
                      <span className="font-medium text-foreground/70">Required:</span> Startup idea, problem statement, solution, market potential, product stage
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Phase 2 */}
            <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
              <div className={`glass-premium rounded-3xl p-8 h-full relative overflow-hidden card-cinematic ${phase === 'SCREENING' ? 'border-yellow-400/20' : ''}`}>
                {phase === 'SCREENING' && <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-yellow-400 to-transparent" />}
                <div className="flex items-start gap-5">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 ${phase === 'SCREENING' ? 'bg-yellow-400/10 text-yellow-400' : 'bg-white/5 text-muted/40'}`}>
                    <ChartBarIcon className="w-7 h-7" />
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-foreground">Phase 2 — Jury Screening</h3>
                      {phase === 'SCREENING' && <Badge variant="warning">ACTIVE</Badge>}
                    </div>
                    <p className="text-xs text-muted/40 mb-4">Top 200 startups selected</p>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {pcList('screeningCriteria', 'Innovation:30%, Market Potential:30%, Execution Feasibility:20%, Impact:20%').map((c) => {
                        const [label, weight] = c.split(':').map(s => s.trim());
                        return (
                          <div key={label} className="flex justify-between px-3 py-2 rounded-xl bg-white/[0.03] border border-white/5">
                            <span className="text-muted/50 text-xs">{label}</span>
                            <span className="text-foreground/70 font-semibold text-xs">{weight}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Phase 3 */}
            <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.1 }}>
              <div className={`glass-premium rounded-3xl p-8 h-full relative overflow-hidden card-cinematic ${phase === 'VOTING' ? 'border-blue-400/20' : ''}`}>
                {phase === 'VOTING' && <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-blue-400 to-transparent" />}
                <div className="flex items-start gap-5">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 ${phase === 'VOTING' ? 'bg-blue-400/10 text-blue-400' : 'bg-white/5 text-muted/40'}`}>
                    <HandThumbUpIcon className="w-7 h-7" />
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-foreground">Phase 3 — Public Voting</h3>
                      {phase === 'VOTING' && <Badge variant="info">ACTIVE</Badge>}
                    </div>
                    <p className="text-xs text-muted/40 mb-4">Community-driven engagement{competition && ` (Ends: ${formatDate(competition.votingEnd)})`}</p>
                    <p className="text-sm text-muted/50 mb-3">Top startups are displayed publicly. The community supports through:</p>
                    <div className="flex flex-wrap gap-2">
                      {['Upvotes', 'Comments', 'Bookmarking', 'Funding Interest'].map((a) => (
                        <span key={a} className="px-3 py-1.5 text-xs rounded-full bg-blue/[0.08] text-blue/80 border border-blue/15">{a}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Phase 4 */}
            <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.1 }}>
              <div className={`glass-premium rounded-3xl p-8 h-full relative overflow-hidden card-cinematic ${phase === 'FINALS' ? 'border-purple/20' : ''}`}>
                {phase === 'FINALS' && <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-purple to-transparent" />}
                <div className="flex items-start gap-5">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 ${phase === 'FINALS' ? 'bg-purple/10 text-purple' : 'bg-white/5 text-muted/40'}`}>
                    <PresentationChartBarIcon className="w-7 h-7" />
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-foreground">Phase 4 — Final Pitch</h3>
                      {phase === 'FINALS' && <Badge variant="info">ACTIVE</Badge>}
                    </div>
                    <p className="text-xs text-muted/40 mb-4">Top 20 startups present online{competition && ` (${formatDate(competition.finalsDate)})`}</p>
                    <p className="text-sm text-muted/50 mb-3">5-minute pitch to a panel of judges:</p>
                    <div className="flex flex-wrap gap-2">
                      {['Founders', 'Investors', 'Industry Experts'].map((j) => (
                        <span key={j} className="px-3 py-1.5 text-xs rounded-full bg-purple/[0.08] text-purple/80 border border-purple/15">{j}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <div className="section-divider max-w-4xl mx-auto" />

      {/* ═══════════════════════════════════════ */}
      {/* ═══ ACT V — WHO CAN PARTICIPATE ═══ */}
      {/* ═══════════════════════════════════════ */}
      <section className="py-28 sm:py-36 px-4 sm:px-6 cinematic-section">
        <div className="absolute inset-0 spotlight" />

        <div className="max-w-6xl mx-auto relative">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-16">
            <UserGroupIcon className="w-14 h-14 text-purple/40 mx-auto mb-6" />
            <h2 className="text-4xl sm:text-5xl font-black text-foreground mb-4">Who Can Participate?</h2>
            <p className="text-lg text-muted/50">Open to all innovators across India</p>
          </motion.div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 lg:gap-6">
            {(() => {
              const icons = [AcademicCapIcon, RocketLaunchIcon, LightBulbIcon, SparklesIcon, ChartBarIcon];
              return pcList('participantCategories', 'Students:College & university students, Engineers:Technical professionals, Founders:Early-stage founders, Innovators:Creative problem solvers, Researchers:Academic researchers').map((item, i) => {
                const [label, desc] = item.split(':').map(s => s.trim());
                const Icon = icons[i % icons.length];
                return (
                  <motion.div key={label} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} viewport={{ once: true }}>
                    <div className="glass-premium rounded-2xl p-6 text-center h-full card-cinematic">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple/15 to-blue/10 flex items-center justify-center mx-auto mb-4">
                        <Icon className="w-7 h-7 text-purple/60" />
                      </div>
                      <p className="text-sm font-bold text-foreground">{label}</p>
                      <p className="text-xs text-muted/40 mt-2">{desc}</p>
                    </div>
                  </motion.div>
                );
              });
            })()}
          </div>
        </div>
      </section>

      <div className="section-divider max-w-4xl mx-auto" />

      {/* ═══════════════════════════════════════════ */}
      {/* ═══ ACT VI — PARTICIPATION FEES ═══ */}
      {/* ═══════════════════════════════════════════ */}
      <section className="py-28 sm:py-36 px-4 sm:px-6 cinematic-section">
        <div className="absolute inset-0 spotlight" />

        <div className="max-w-6xl mx-auto relative">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-20">
            <BoltIcon className="w-14 h-14 text-purple/40 mx-auto mb-6" />
            <h2 className="text-4xl sm:text-5xl font-black text-foreground mb-4">Participation Fees</h2>
            <p className="text-lg text-muted/50 max-w-xl mx-auto">Affordable entry for students and founders alike</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6 lg:gap-8 max-w-5xl mx-auto">
            {/* Student */}
            <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0 }}>
              <div className="glass-premium rounded-3xl p-8 text-center relative overflow-hidden border-blue/15 card-cinematic h-full">
                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-blue to-transparent" />
                <div className="w-16 h-16 rounded-2xl bg-blue/10 flex items-center justify-center mx-auto mb-6">
                  <AcademicCapIcon className="w-8 h-8 text-blue" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-3">Student</h3>
                <p className="text-4xl font-black text-blue mb-2">₹{competition?.studentFee || 199}</p>
                <p className="text-sm text-muted/40 mb-6">Valid college/university ID required</p>
                <div className="space-y-3 text-sm text-left">
                  {['Full competition access', 'Mentorship sessions', 'Certificate of participation'].map((b, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <CheckCircleIcon className="w-4 h-4 text-green-400/60 flex-shrink-0" />
                      <span className="text-muted/50">{b}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Founder — Featured */}
            <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}>
              <div className="glass-premium rounded-3xl p-8 text-center relative overflow-hidden border-purple/20 card-cinematic h-full md:-mt-4">
                <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-transparent via-purple to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-b from-purple/[0.04] to-transparent" />
                <div className="relative">
                  <Badge variant="info" className="mb-4">Most Popular</Badge>
                  <div className="w-16 h-16 rounded-2xl bg-purple/10 flex items-center justify-center mx-auto mb-6">
                    <LightBulbIcon className="w-8 h-8 text-purple" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-3">Founder / Professional</h3>
                  <p className="text-4xl font-black text-purple mb-2">₹{competition?.founderFee || 499}</p>
                  <p className="text-sm text-muted/40 mb-6">For entrepreneurs and professionals</p>
                  <div className="space-y-3 text-sm text-left">
                    {['Full competition access', 'Investor networking opportunity', 'Priority pitch slot', 'Certificate of participation'].map((b, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <CheckCircleIcon className="w-4 h-4 text-green-400/60 flex-shrink-0" />
                        <span className="text-muted/50">{b}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Visitor */}
            <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }}>
              <div className="glass-premium rounded-3xl p-8 text-center relative overflow-hidden border-emerald-400/15 card-cinematic h-full">
                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent" />
                <div className="w-16 h-16 rounded-2xl bg-emerald-400/10 flex items-center justify-center mx-auto mb-6">
                  <TicketIcon className="w-8 h-8 text-emerald-400" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-3">Visitor Entry</h3>
                <p className="text-4xl font-black text-emerald-400 mb-2">₹99</p>
                <p className="text-sm text-muted/40 mb-6">For anyone who wants to attend</p>
                <div className="space-y-3 text-sm text-left mb-6">
                  {['Event access pass', 'Innovation showcase viewing'].map((b, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <CheckCircleIcon className="w-4 h-4 text-green-400/60 flex-shrink-0" />
                      <span className="text-muted/50">{b}</span>
                    </div>
                  ))}
                </div>
                <Link href="/competition/citizen-pass">
                  <button className="w-full px-4 py-3 rounded-xl glass border-emerald-400/20 text-emerald-400 font-semibold text-sm hover:bg-emerald-400/10 transition-all">
                    Get Entry Pass
                  </button>
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <div className="section-divider max-w-4xl mx-auto" />

      {/* ═══════════════════════════════════════════ */}
      {/* ═══ EXHIBITION BOOTHS ═══ */}
      {/* ═══════════════════════════════════════════ */}
      <section className="py-28 sm:py-36 px-4 sm:px-6 cinematic-section">
        <div className="max-w-5xl mx-auto relative">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-black text-foreground mb-4">Exhibition Booths</h2>
            <p className="text-lg text-muted/50 max-w-xl mx-auto">Showcase your product at the Vishvakarma Innovation Expo</p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <div className="glass-premium rounded-3xl p-10 sm:p-14 relative overflow-hidden border-cyan-400/15">
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />
              <div className="absolute top-0 right-0 w-60 h-60 bg-gradient-to-bl from-cyan-400/[0.06] to-transparent rounded-bl-full" />
              <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-8">
                <div>
                  <h3 className="text-2xl sm:text-3xl font-black text-foreground mb-4">{pcs('boothTitle', 'Standard Exhibition Booth')}</h3>
                  <p className="text-muted/50 mb-6 leading-relaxed">{competition?.boothDescription || '6x6 ft branded booth space with table, chairs, power outlet, and Wi-Fi. Perfect for product demos and live showcases.'}</p>
                  <div className="flex flex-wrap gap-3">
                    {pcList('boothFeatures', 'Product Demo Space, Branded Backdrop, Power & Wi-Fi, Visitor Footfall').map((f) => (
                      <span key={f} className="px-4 py-2 text-xs rounded-full bg-cyan-400/[0.08] text-cyan-400/80 border border-cyan-400/15 font-medium">{f}</span>
                    ))}
                  </div>
                </div>
                <div className="text-center md:text-right flex-shrink-0">
                  <p className="text-5xl font-black text-cyan-400">₹{(competition?.boothPrice || 5000).toLocaleString('en-IN')}</p>
                  <p className="text-sm text-muted/40 mt-1">per booth</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <div className="section-divider max-w-4xl mx-auto" />

      {/* ═══════════════════════════════════════ */}
      {/* ═══ OUR SPONSORS (Existing) ═══ */}
      {/* ═══════════════════════════════════════ */}
      {competition?.sponsors && competition.sponsors.length > 0 && (
        <section className="py-28 sm:py-36 px-4 sm:px-6 cinematic-section">
          <div className="absolute inset-0 spotlight-gold" />

          <div className="max-w-6xl mx-auto relative">
            <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-16">
              <StarIcon className="w-14 h-14 text-amber-400/40 mx-auto mb-6" />
              <h2 className="text-4xl sm:text-5xl font-black text-foreground mb-4">Our Sponsors</h2>
              <p className="text-lg text-muted/50 max-w-xl mx-auto">Backed by industry leaders driving innovation forward</p>
            </motion.div>

            {/* Title Sponsors */}
            {competition.sponsors.filter(s => s.tier === 'TITLE').length > 0 && (
              <div className="mb-14">
                <h3 className="text-center text-xs font-bold text-amber-400/60 uppercase tracking-[0.3em] mb-8">Title Sponsors</h3>
                <div className="grid sm:grid-cols-2 gap-6 lg:gap-8 max-w-4xl mx-auto">
                  {competition.sponsors.filter(s => s.tier === 'TITLE').map((s) => (
                    <motion.div key={s.id} initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}>
                      <div className="glass-gold rounded-3xl p-8 text-center card-cinematic gold-glow-animate">
                        <div className="w-24 h-24 rounded-3xl bg-amber-400/10 flex items-center justify-center mx-auto mb-5 overflow-hidden border border-amber-400/15">
                          {s.logo ? <img src={s.logo} alt={s.name} className="w-full h-full object-contain p-3" /> : <StarIcon className="w-12 h-12 text-amber-400" />}
                        </div>
                        <h4 className="text-xl font-black text-foreground">{s.name}</h4>
                        <div className="mt-2 mb-4"><span className="gold-shimmer text-xs font-bold tracking-[0.2em] uppercase">Title Sponsor</span></div>
                        {s.benefits && (
                          <div className="space-y-2 text-sm text-left">
                            {(() => { try { return JSON.parse(s.benefits); } catch { return s.benefits.split(','); } })().map((b: string, i: number) => (
                              <div key={i} className="flex items-center gap-2"><CheckCircleIcon className="w-3.5 h-3.5 text-amber-400/60 flex-shrink-0" /><span className="text-muted/50">{b.trim()}</span></div>
                            ))}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Platinum Sponsors */}
            {competition.sponsors.filter(s => s.tier === 'PLATINUM').length > 0 && (
              <div className="mb-14">
                <h3 className="text-center text-xs font-bold text-purple/60 uppercase tracking-[0.3em] mb-8">Platinum Sponsors</h3>
                <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                  {competition.sponsors.filter(s => s.tier === 'PLATINUM').map((s) => (
                    <motion.div key={s.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                      <div className="glass-premium rounded-2xl p-6 text-center border-purple/15 card-cinematic">
                        <div className="w-16 h-16 rounded-2xl bg-purple/10 flex items-center justify-center mx-auto mb-4 overflow-hidden border border-purple/15">
                          {s.logo ? <img src={s.logo} alt={s.name} className="w-full h-full object-contain p-2" /> : <StarIcon className="w-8 h-8 text-purple" />}
                        </div>
                        <h4 className="font-bold text-foreground">{s.name}</h4>
                        <p className="text-xs text-purple/60 mt-1 font-medium">Platinum Sponsor</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Gold Sponsors */}
            {competition.sponsors.filter(s => s.tier === 'GOLD').length > 0 && (
              <div className="mb-14">
                <h3 className="text-center text-xs font-bold text-orange-400/60 uppercase tracking-[0.3em] mb-8">Gold Sponsors</h3>
                <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-5 max-w-4xl mx-auto">
                  {competition.sponsors.filter(s => s.tier === 'GOLD').map((s) => (
                    <motion.div key={s.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                      <div className="glass-premium rounded-2xl p-5 text-center border-orange-400/15 card-cinematic">
                        <div className="w-14 h-14 rounded-xl bg-orange-400/10 flex items-center justify-center mx-auto mb-3 overflow-hidden">
                          {s.logo ? <img src={s.logo} alt={s.name} className="w-full h-full object-contain p-1" /> : <StarIcon className="w-7 h-7 text-orange-400" />}
                        </div>
                        <h4 className="font-semibold text-foreground">{s.name}</h4>
                        <p className="text-xs text-orange-400/60 mt-1">Gold Sponsor</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Startup Partners */}
            {competition.sponsors.filter(s => s.tier === 'STARTUP_PARTNER').length > 0 && (
              <div>
                <h3 className="text-center text-xs font-bold text-blue/60 uppercase tracking-[0.3em] mb-8">Startup Partners</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
                  {competition.sponsors.filter(s => s.tier === 'STARTUP_PARTNER').map((s) => (
                    <motion.div key={s.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                      <div className="glass rounded-xl p-4 text-center border-blue/10 card-cinematic">
                        <div className="w-12 h-12 rounded-lg bg-blue/10 flex items-center justify-center mx-auto mb-2 overflow-hidden">
                          {s.logo ? <img src={s.logo} alt={s.name} className="w-full h-full object-contain p-1" /> : <StarIcon className="w-6 h-6 text-blue" />}
                        </div>
                        <h4 className="text-sm font-semibold text-foreground">{s.name}</h4>
                        <p className="text-xs text-blue/50 mt-0.5">Startup Partner</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      <div className="section-divider max-w-4xl mx-auto" />

      {/* ═══════════════════════════════════════════════ */}
      {/* ═══ BECOME A SPONSOR (Packages) ═══ */}
      {/* ═══════════════════════════════════════════════ */}
      <section className="py-28 sm:py-36 px-4 sm:px-6 cinematic-section">
        <div className="absolute inset-0 spotlight" />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple/[0.04] rounded-full blur-[200px]" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue/[0.04] rounded-full blur-[200px]" />

        <div className="max-w-7xl mx-auto relative">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-20">
            <StarIcon className="w-14 h-14 text-purple/40 mx-auto mb-6" />
            <h2 className="text-4xl sm:text-5xl font-black text-foreground mb-4">Become a Sponsor</h2>
            <p className="text-lg text-muted/50 max-w-2xl mx-auto">Partner with us and get unparalleled visibility in India&apos;s biggest startup competition</p>
          </motion.div>

          {/* Title Sponsor — Hero Card */}
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-10">
            <div className="glass-gold rounded-3xl p-10 sm:p-14 relative overflow-hidden gold-glow-animate">
              <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent" />
              <div className="absolute top-0 right-0 w-60 h-60 bg-gradient-to-bl from-amber-400/[0.06] to-transparent rounded-bl-full" />
              <div className="relative flex flex-col md:flex-row md:items-start gap-8">
                <div className="flex-shrink-0">
                  <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-amber-400/20 to-orange-400/15 flex items-center justify-center border border-amber-400/20">
                    <StarIcon className="w-10 h-10 text-amber-400" />
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-2xl font-black text-foreground">Title Sponsor</h3>
                    <Badge variant="warning">Most Premium</Badge>
                  </div>
                  <p className="text-3xl font-black gold-shimmer mb-6">{pcs('titleSponsorPrice', '₹5,00,000')}</p>
                  <div className="grid sm:grid-cols-2 gap-3 text-sm text-muted/50">
                    {pcList('titleSponsorBenefits', 'Event named \u201cpowered by [Sponsor]\u201d, Logo on stage backdrop, 5–10 min keynote speech, Premium branding across website, Media coverage mention, Startup exhibition booth, Direct access to top startups').map((b, i) => (
                      <div key={i} className="flex items-center gap-2.5"><CheckCircleIcon className="w-4 h-4 text-amber-400/60 flex-shrink-0" /><span>{b}</span></div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Presenting + Diamond */}
          <div className="grid md:grid-cols-2 gap-6 lg:gap-8 mb-8">
            <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <div className="glass-premium rounded-3xl p-8 relative overflow-hidden border-rose-400/15 card-cinematic h-full">
                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-rose-400 to-transparent" />
                <StarIcon className="w-10 h-10 text-rose-400/60 mb-4" />
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-xl font-black text-foreground">Presenting Sponsor</h3>
                  <Badge variant="danger">Premium</Badge>
                </div>
                <p className="text-2xl font-black text-rose-400 mb-6">{pcs('presentingSponsorPrice', '₹3,00,000')}</p>
                <div className="space-y-2.5 text-sm text-muted/50">
                  {pcList('presentingSponsorBenefits', 'Co-branded event title, Logo on stage backdrop, 5 min keynote slot, Premium branding on website, Media coverage mention, VIP booth at exhibition').map((b, i) => (
                    <div key={i} className="flex items-center gap-2.5"><CheckCircleIcon className="w-4 h-4 text-rose-400/60 flex-shrink-0" /><span>{b}</span></div>
                  ))}
                </div>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}>
              <div className="glass-premium rounded-3xl p-8 relative overflow-hidden border-sky-400/15 card-cinematic h-full">
                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-sky-400 to-transparent" />
                <StarIcon className="w-10 h-10 text-sky-400/60 mb-4" />
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-xl font-black text-foreground">Diamond Sponsor</h3>
                  <Badge variant="info">Elite</Badge>
                </div>
                <p className="text-2xl font-black text-sky-400 mb-6">{pcs('diamondSponsorPrice', '₹2,00,000')}</p>
                <div className="space-y-2.5 text-sm text-muted/50">
                  {pcList('diamondSponsorBenefits', 'Logo on event banners and stage, Featured website section, Social media promotion, Exhibition booth, VIP networking access, Award ceremony mention').map((b, i) => (
                    <div key={i} className="flex items-center gap-2.5"><CheckCircleIcon className="w-4 h-4 text-sky-400/60 flex-shrink-0" /><span>{b}</span></div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>

          {/* Platinum + Gold */}
          <div className="grid md:grid-cols-2 gap-6 lg:gap-8 mb-8">
            <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <div className="glass-premium rounded-3xl p-8 relative overflow-hidden border-purple/15 card-cinematic h-full">
                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-purple to-transparent" />
                <StarIcon className="w-10 h-10 text-purple/60 mb-4" />
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-xl font-black text-foreground">Platinum Sponsor</h3>
                  <Badge variant="info">Popular</Badge>
                </div>
                <p className="text-2xl font-black text-purple mb-6">{pcs('platinumSponsorPrice', '₹1,00,000')}</p>
                <div className="space-y-2.5 text-sm text-muted/50">
                  {pcList('platinumSponsorBenefits', 'Logo on event banners, Featured website placement, Social media promotion, Booth at startup exhibition, VIP networking access').map((b, i) => (
                    <div key={i} className="flex items-center gap-2.5"><CheckCircleIcon className="w-4 h-4 text-purple/60 flex-shrink-0" /><span>{b}</span></div>
                  ))}
                </div>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}>
              <div className="glass-premium rounded-3xl p-8 relative overflow-hidden border-orange-400/15 card-cinematic h-full">
                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-orange-400 to-transparent" />
                <StarIcon className="w-10 h-10 text-orange-400/60 mb-4" />
                <h3 className="text-xl font-black text-foreground mb-2">Gold Sponsor</h3>
                <p className="text-2xl font-black text-orange-400 mb-6">{pcs('goldSponsorPrice', '₹50,000')}</p>
                <div className="space-y-2.5 text-sm text-muted/50">
                  {pcList('goldSponsorBenefits', 'Logo on website, Social media promotion, Startup booth, Event mention during ceremony').map((b, i) => (
                    <div key={i} className="flex items-center gap-2.5"><CheckCircleIcon className="w-4 h-4 text-orange-400/60 flex-shrink-0" /><span>{b}</span></div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>

          {/* Silver + Partners Row */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
            <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <div className="glass-premium rounded-2xl p-6 relative overflow-hidden border-gray-400/10 card-cinematic h-full">
                <div className="absolute top-0 inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-gray-400 to-transparent" />
                <StarIcon className="w-8 h-8 text-gray-300/50 mb-3" />
                <h3 className="text-base font-bold text-foreground mb-1">Silver Sponsor</h3>
                <p className="text-xl font-black text-gray-300 mb-4">{pcs('silverSponsorPrice', '₹35,000')}</p>
                <div className="space-y-2 text-sm text-muted/50">
                  {pcList('silverSponsorBenefits', 'Logo on sponsor section, Event promotion mention, Networking access').map((b, i) => (
                    <div key={i} className="flex items-center gap-2"><CheckCircleIcon className="w-3.5 h-3.5 text-gray-400/50 flex-shrink-0" /><span>{b}</span></div>
                  ))}
                </div>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.05 }}>
              <div className="glass-premium rounded-2xl p-6 relative overflow-hidden border-blue/10 card-cinematic h-full">
                <div className="absolute top-0 inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-blue to-transparent" />
                <RocketLaunchIcon className="w-8 h-8 text-blue/50 mb-3" />
                <h3 className="text-base font-bold text-foreground mb-1">Startup Partner</h3>
                <p className="text-xl font-black text-blue mb-4">{pcs('startupPartnerPrice', '₹25,000')}</p>
                <div className="space-y-2 text-sm text-muted/50">
                  {pcList('startupPartnerBenefits', 'Logo on competition page, Social media mention, Access to startup database').map((b, i) => (
                    <div key={i} className="flex items-center gap-2"><CheckCircleIcon className="w-3.5 h-3.5 text-blue/50 flex-shrink-0" /><span>{b}</span></div>
                  ))}
                </div>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}>
              <div className="glass-premium rounded-2xl p-6 relative overflow-hidden border-green-400/10 card-cinematic h-full">
                <div className="absolute top-0 inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-green-400 to-transparent" />
                <LightBulbIcon className="w-8 h-8 text-green-400/50 mb-3" />
                <h3 className="text-base font-bold text-foreground mb-1">Innovation Partner</h3>
                <p className="text-xl font-black text-green-400 mb-4">{pcs('innovationPartnerPrice', '₹15,000')}</p>
                <div className="space-y-2 text-sm text-muted/50">
                  {pcList('innovationPartnerBenefits', 'Logo on event website, Social media posts mention').map((b, i) => (
                    <div key={i} className="flex items-center gap-2"><CheckCircleIcon className="w-3.5 h-3.5 text-green-400/50 flex-shrink-0" /><span>{b}</span></div>
                  ))}
                </div>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.15 }}>
              <div className="glass-premium rounded-2xl p-6 relative overflow-hidden border-pink-400/10 card-cinematic h-full">
                <div className="absolute top-0 inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-pink-400 to-transparent" />
                <HeartIcon className="w-8 h-8 text-pink-400/50 mb-3" />
                <h3 className="text-base font-bold text-foreground mb-1">Community Partner</h3>
                <p className="text-xl font-black text-pink-400 mb-4">{pcs('communityPartnerPrice', '₹10,000')}</p>
                <div className="space-y-2 text-sm text-muted/50">
                  {pcList('communityPartnerBenefits', 'Brand mention, Website listing').map((b, i) => (
                    <div key={i} className="flex items-center gap-2"><CheckCircleIcon className="w-3.5 h-3.5 text-pink-400/50 flex-shrink-0" /><span>{b}</span></div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>

          {/* Special Sponsorships */}
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <div className="text-center mb-8">
              <h3 className="text-2xl font-black text-foreground mb-2">Special Sponsorship Opportunities</h3>
              <p className="text-sm text-muted/40">High-value niche sponsorships for maximum brand impact</p>
            </div>
            <div className="grid sm:grid-cols-3 gap-6">
              <div className="glass-premium rounded-2xl p-6 text-center border-cyan-400/10 card-cinematic h-full">
                <div className="w-14 h-14 rounded-2xl bg-cyan-400/10 flex items-center justify-center mx-auto mb-4">
                  <MicrophoneIcon className="w-7 h-7 text-cyan-400/70" />
                </div>
                <h4 className="font-bold text-foreground mb-1">🎤 {pcs('stageSponsorTitle', 'Stage Sponsor')}</h4>
                <p className="text-xl font-black text-cyan-400 mb-3">{pcs('stageSponsorPrice', '₹40,000')}</p>
                <p className="text-sm text-muted/40">{pcs('stageSponsorDesc', 'Branding on main stage backdrop')}</p>
              </div>

              <div className="glass-premium rounded-2xl p-6 text-center border-red-400/10 card-cinematic h-full">
                <div className="w-14 h-14 rounded-2xl bg-red-400/10 flex items-center justify-center mx-auto mb-4">
                  <VideoCameraIcon className="w-7 h-7 text-red-400/70" />
                </div>
                <h4 className="font-bold text-foreground mb-1">🎥 {pcs('mediaSponsorTitle', 'Media Sponsor')}</h4>
                <p className="text-xl font-black text-red-400 mb-3">{pcs('mediaSponsorPrice', '₹30,000')}</p>
                <p className="text-sm text-muted/40">{pcs('mediaSponsorDesc', 'Logo in all videos and livestream')}</p>
              </div>

              <div className="glass-premium rounded-2xl p-6 text-center border-amber-400/10 card-cinematic h-full">
                <div className="w-14 h-14 rounded-2xl bg-amber-400/10 flex items-center justify-center mx-auto mb-4">
                  <TrophyIcon className="w-7 h-7 text-amber-400/70" />
                </div>
                <h4 className="font-bold text-foreground mb-1">🏆 {pcs('awardSponsorTitle', 'Award Sponsor')}</h4>
                <p className="text-xl font-black text-amber-400 mb-3">{pcs('awardSponsorPrice', '₹20,000')}</p>
                <p className="text-sm text-muted/40">{pcs('awardSponsorDesc', 'Sponsor name on winner trophies')}</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <div className="section-divider max-w-4xl mx-auto" />

      {/* ═══════════════════════════════════ */}
      {/* ═══ REGISTER YOUR STARTUP ═══ */}
      {/* ═══════════════════════════════════ */}
      {competition?.currentPhase === 'REGISTRATION' && (
        <section className="py-28 sm:py-36 px-4 sm:px-6 cinematic-section">
          <div className="absolute inset-0 spotlight" />
          <div className="max-w-4xl mx-auto relative">
            <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <div className="glass-premium rounded-[2rem] p-12 sm:p-16 text-center relative overflow-hidden border-purple/15">
                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-purple to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-b from-purple/[0.04] to-transparent" />
                <div className="relative">
                  <RocketLaunchIcon className="w-16 h-16 text-purple/50 mx-auto mb-6" />
                  <h2 className="text-3xl sm:text-4xl font-black text-foreground mb-4">
                    {registrationLive ? 'Register Your Startup' : 'Registration Opens Soon'}
                  </h2>
                  <p className="text-lg text-muted/50 mb-8 max-w-2xl mx-auto">
                    {registrationLive
                      ? 'Submit your approved startup to compete in the Vishvakarma Innovation Challenge 2026'
                      : `Registration opens on ${formatDate(competition.registrationStart)}. Get your startup ready!`}
                  </p>
                  {registrationLive ? (
                    <Link href="/competition/register">
                      <button className="group relative px-10 py-5 bg-gradient-to-r from-purple to-blue rounded-2xl text-white font-bold text-lg overflow-hidden transition-all hover:scale-105 hover:shadow-2xl hover:shadow-purple/25">
                        <span className="relative z-10 flex items-center gap-2">
                          <RocketLaunchIcon className="w-5 h-5" />
                          Register Now
                        </span>
                        <div className="absolute inset-0 bg-gradient-to-r from-blue to-purple opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      </button>
                    </Link>
                  ) : (
                    <Link href="/submit-idea">
                      <button className="px-10 py-5 rounded-2xl text-foreground font-bold text-lg glass border-purple/20 hover:bg-purple/10 transition-all">
                        <RocketLaunchIcon className="w-5 h-5 mr-2 inline" />
                        Prepare Your Startup
                      </button>
                    </Link>
                  )}
                  <div className="mt-8 pt-6 border-t border-white/5">
                    <p className="text-xs text-muted/40">
                      {registrationLive
                        ? <>Registration closes on {formatDate(competition.registrationEnd)} · <span className="text-purple font-medium">{daysLeft(competition.registrationEnd)} days remaining</span></>
                        : <>Registration opens on {formatDate(competition.registrationStart)} · <span className="text-cyan-400 font-medium">{daysLeft(competition.registrationStart)} days to go</span></>}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      )}

      {/* ═══════════════════════════ */}
      {/* ═══ VOTING SECTION ═══ */}
      {/* ═══════════════════════════ */}
      {competition?.currentPhase === 'VOTING' && competition.entries.length > 0 && (
        <section className="py-28 sm:py-36 px-4 sm:px-6 cinematic-section">
          <div className="absolute inset-0 spotlight" />
          <div className="max-w-7xl mx-auto relative">
            <div className="text-center mb-16">
              <HandThumbUpIcon className="w-14 h-14 text-blue/40 mx-auto mb-6" />
              <h2 className="text-4xl sm:text-5xl font-black text-foreground mb-4">Vote for Your Favorites</h2>
              <p className="text-lg text-muted/50">Support the startups you believe in — every vote counts!</p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              {competition.entries.map((entry) => (
                <motion.div key={entry.id} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                  <div className="glass-premium rounded-3xl overflow-hidden card-cinematic h-full">
                    <div className="h-44 bg-gradient-to-br from-purple/20 via-blue/10 to-transparent relative overflow-hidden">
                      {(entry.startup.thumbnail || entry.startup.logo) ? (
                        <img src={entry.startup.thumbnail || entry.startup.logo!} alt={entry.startup.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-5xl font-black text-purple/20">{entry.startup.title[0]}</span>
                        </div>
                      )}
                    </div>
                    <div className="p-6">
                      <Link href={`/startup/${entry.startup.slug}`}>
                        <h3 className="text-lg font-bold text-foreground hover:text-purple transition-colors mb-2">{entry.startup.title}</h3>
                      </Link>
                      <p className="text-sm text-muted/50 mb-4 line-clamp-2">{entry.startup.shortDescription}</p>
                      <div className="flex flex-wrap gap-2 mb-5">
                        <span className="px-3 py-1 text-xs rounded-full bg-purple/[0.08] text-purple/70 border border-purple/15">{entry.startup.category}</span>
                        <span className="px-3 py-1 text-xs rounded-full bg-blue/[0.08] text-blue/70 border border-blue/15">{entry.startup.productStage.replace('_', ' ')}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted/40">by {entry.startup.founder.firstName} {entry.startup.founder.lastName}</span>
                        <button
                          onClick={() => handleVote(entry.id)}
                          disabled={!isAuthenticated || voting === entry.id}
                          className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                            votedEntries.has(entry.id)
                              ? 'bg-purple text-white shadow-lg shadow-purple/20'
                              : 'glass text-purple/80 hover:bg-purple/10 border-purple/15'
                          } disabled:opacity-50`}
                        >
                          {votedEntries.has(entry.id) ? <HandThumbUpSolid className="w-4 h-4" /> : <HandThumbUpIcon className="w-4 h-4" />}
                          {entry.upvotes}
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════════════ */}
      {/* ═══ JUDGES ═══ */}
      {/* ═══════════════════════ */}
      {competition?.judges && competition.judges.length > 0 && (
        <section className="py-28 sm:py-36 px-4 sm:px-6 cinematic-section">
          <div className="absolute inset-0 spotlight" />
          <div className="max-w-6xl mx-auto relative">
            <div className="text-center mb-16">
              <UserGroupIcon className="w-14 h-14 text-purple/40 mx-auto mb-6" />
              <h2 className="text-4xl sm:text-5xl font-black text-foreground mb-4">Our Judges</h2>
              <p className="text-lg text-muted/50">Industry leaders evaluating your innovations</p>
            </div>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {competition.judges.map((judge, i) => (
                <motion.div key={judge.id} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} viewport={{ once: true }}>
                  <div className="glass-premium rounded-3xl p-6 text-center card-cinematic">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple/15 to-blue/10 flex items-center justify-center mx-auto mb-4 overflow-hidden border border-purple/15">
                      {judge.avatar ? (
                        <img src={judge.avatar} alt={judge.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-2xl font-black text-purple/50">{judge.name[0]}</span>
                      )}
                    </div>
                    <p className="font-bold text-foreground">{judge.name}</p>
                    <p className="text-xs text-muted/40 mt-1">{judge.title}</p>
                    <p className="text-xs text-purple/50 font-medium">{judge.organization}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      <div className="section-divider max-w-4xl mx-auto" />

      {/* ══════════════════════════════════════════════════ */}
      {/* ═══ EVENT TIMELINE — Cinematic Vertical ═══ */}
      {/* ══════════════════════════════════════════════════ */}
      <section className="py-28 sm:py-36 px-4 sm:px-6 cinematic-section">
        <div className="absolute inset-0 spotlight" />
        <div className="absolute top-1/2 left-0 w-[500px] h-[500px] bg-purple/[0.04] rounded-full blur-[200px] -translate-y-1/2" />
        <div className="absolute top-1/2 right-0 w-[500px] h-[500px] bg-blue/[0.04] rounded-full blur-[200px] -translate-y-1/2" />

        <div className="max-w-6xl mx-auto relative">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-20">
            <Badge variant="info" className="mb-4">📅 Mark Your Calendar</Badge>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-foreground mb-4">Event Timeline</h2>
            <p className="text-lg text-muted/50 max-w-xl mx-auto">From registration to the grand finale — your roadmap to innovation glory.</p>
          </motion.div>

          {/* Desktop Timeline */}
          <div className="hidden md:block relative">
            <div className="absolute left-1/2 top-0 bottom-0 w-px -translate-x-1/2 bg-gradient-to-b from-green-400/40 via-purple/30 to-blue/20" />

            {competition && [
              { label: 'Registration Opens', date: competition.registrationStart, phase: 'REGISTRATION', icon: '🚀', desc: 'Submit your startup and secure your spot' },
              { label: 'Registration Closes', date: competition.registrationEnd, phase: 'REGISTRATION', icon: '⏰', desc: 'Last chance to register — don\'t miss out!' },
              { label: 'Screening Complete', date: competition.screeningEnd, phase: 'SCREENING', icon: '🔍', desc: 'Expert jury reviews all submissions' },
              { label: 'Public Voting Ends', date: competition.votingEnd, phase: 'VOTING', icon: '🗳️', desc: 'Community votes for the best startups' },
              { label: 'Grand Finale', date: competition.finalsDate, phase: 'FINALS', icon: '🏆', desc: 'Live pitch day — winners announced!' },
            ].map((item, i) => {
              const isPast = new Date(item.date) < new Date();
              const isCurrent = item.phase === competition.currentPhase;
              const isLeft = i % 2 === 0;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: isLeft ? -50 : 50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1, duration: 0.6 }}
                  viewport={{ once: true }}
                  className={`relative flex items-center mb-16 last:mb-0 ${isLeft ? 'justify-start' : 'justify-end'}`}
                >
                  <div className="absolute left-1/2 -translate-x-1/2 z-10">
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center text-xl border-2 ${
                      isPast ? 'bg-green-400/15 border-green-400/40 shadow-lg shadow-green-400/10' :
                      isCurrent ? 'bg-purple/15 border-purple/40 shadow-lg shadow-purple/10 border-glow-animate' :
                      'bg-white/[0.03] border-white/10'
                    }`}>
                      {isPast ? <CheckCircleIcon className="w-7 h-7 text-green-400" /> : <span>{item.icon}</span>}
                    </div>
                  </div>

                  <div className={`w-[calc(50%-3.5rem)] ${isLeft ? 'pr-6 text-right' : 'pl-6 ml-auto text-left'}`}>
                    <div className={`glass-premium p-6 rounded-2xl transition-all hover:scale-[1.02] ${
                      isCurrent ? 'border-purple/20 shadow-lg shadow-purple/5' :
                      isPast ? 'border-green-400/10' : ''
                    }`}>
                      <p className={`text-sm font-black uppercase tracking-[0.15em] mb-1 ${
                        isCurrent ? 'text-purple' : isPast ? 'text-green-400/70' : 'text-muted/40'
                      }`}>{item.label}</p>
                      <p className="text-xl font-black text-foreground">{formatDate(item.date)}</p>
                      <p className="text-xs text-muted/40 mt-1.5">{item.desc}</p>
                      {isCurrent && (
                        <span className="inline-block mt-3 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] bg-purple/15 text-purple border border-purple/20 animate-pulse">
                          Current Phase
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Mobile Timeline */}
          <div className="md:hidden space-y-0">
            {competition && [
              { label: 'Registration Opens', date: competition.registrationStart, phase: 'REGISTRATION', icon: '🚀', desc: 'Submit your startup and secure your spot' },
              { label: 'Registration Closes', date: competition.registrationEnd, phase: 'REGISTRATION', icon: '⏰', desc: 'Last chance to register — don\'t miss out!' },
              { label: 'Screening Complete', date: competition.screeningEnd, phase: 'SCREENING', icon: '🔍', desc: 'Expert jury reviews all submissions' },
              { label: 'Public Voting Ends', date: competition.votingEnd, phase: 'VOTING', icon: '🗳️', desc: 'Community votes for the best startups' },
              { label: 'Grand Finale', date: competition.finalsDate, phase: 'FINALS', icon: '🏆', desc: 'Live pitch day — winners announced!' },
            ].map((item, i) => {
              const isPast = new Date(item.date) < new Date();
              const isCurrent = item.phase === competition.currentPhase;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  viewport={{ once: true }}
                  className="flex gap-5 items-start"
                >
                  <div className="flex flex-col items-center">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-base border-2 flex-shrink-0 ${
                      isPast ? 'bg-green-400/15 border-green-400/40' :
                      isCurrent ? 'bg-purple/15 border-purple/40 border-glow-animate' :
                      'bg-white/[0.03] border-white/10'
                    }`}>
                      {isPast ? <CheckCircleIcon className="w-5 h-5 text-green-400" /> : <span>{item.icon}</span>}
                    </div>
                    {i < 4 && <div className={`w-px h-16 ${isPast ? 'bg-gradient-to-b from-green-400/30 to-green-400/5' : isCurrent ? 'bg-gradient-to-b from-purple/30 to-purple/5' : 'bg-white/5'}`} />}
                  </div>
                  <div className="pb-8 pt-1">
                    <p className={`font-black text-sm uppercase tracking-[0.15em] ${isCurrent ? 'text-purple' : isPast ? 'text-green-400/70' : 'text-muted/40'}`}>{item.label}</p>
                    <p className="text-lg font-bold text-foreground">{formatDate(item.date)}</p>
                    <p className="text-xs text-muted/40 mt-1">{item.desc}</p>
                    {isCurrent && (
                      <span className="inline-block mt-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] bg-purple/15 text-purple border border-purple/20 animate-pulse">
                        Current Phase
                      </span>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════ */}
      {/* ═══ SPONSOR LOGOS MARQUEE ═══ */}
      {/* ════════════════════════════════════════ */}
      {competition && (() => {
        const sponsorsWithLogo = competition.sponsors.filter(s => s.logo);
        if (sponsorsWithLogo.length === 0) return null;
        const shouldScroll = sponsorsWithLogo.length > 4;
        return (
          <section className="py-24 px-4 sm:px-6 cinematic-section">
            <div className="absolute inset-0 spotlight-gold" />
            <div className="relative max-w-6xl mx-auto">
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
                <Badge variant="warning" className="mb-4">🤝 Our Sponsors</Badge>
                <h2 className="text-4xl sm:text-5xl font-black text-foreground mb-3">Powered By</h2>
                <p className="text-muted/40 max-w-lg mx-auto text-sm">Backed by visionary organizations fueling India&apos;s innovation ecosystem.</p>
              </motion.div>
              {shouldScroll ? (
                <div className="relative overflow-hidden">
                  <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-[#0B0F1A] to-transparent z-10" />
                  <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-[#0B0F1A] to-transparent z-10" />
                  <div className="flex animate-marquee gap-14 items-center">
                    {[...sponsorsWithLogo, ...sponsorsWithLogo].map((sponsor, i) => (
                      <div key={`sponsor-${i}`} className="flex-shrink-0 group">
                        <div className="w-40 h-24 sm:w-48 sm:h-28 rounded-2xl glass-premium flex items-center justify-center p-5 transition-all duration-500 group-hover:bg-white/[0.06] group-hover:border-white/15 group-hover:scale-105">
                          <img src={sponsor.logo!} alt={sponsor.name} className="max-w-full max-h-full object-contain filter brightness-90 group-hover:brightness-110 transition-all" />
                        </div>
                        <p className="text-[10px] text-muted/30 text-center mt-2 font-semibold uppercase tracking-[0.2em]">{sponsor.name}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap justify-center gap-10">
                  {sponsorsWithLogo.map((sponsor) => (
                    <motion.div key={sponsor.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="group">
                      <div className="w-40 h-24 sm:w-48 sm:h-28 rounded-2xl glass-premium flex items-center justify-center p-5 transition-all duration-500 group-hover:bg-white/[0.06] group-hover:border-white/15 group-hover:scale-105">
                        <img src={sponsor.logo!} alt={sponsor.name} className="max-w-full max-h-full object-contain filter brightness-90 group-hover:brightness-110 transition-all" />
                      </div>
                      <p className="text-[10px] text-muted/30 text-center mt-2 font-semibold uppercase tracking-[0.2em]">{sponsor.name}</p>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </section>
        );
      })()}

      {/* ════════════════════════════════════════════ */}
      {/* ═══ CAMPUS PARTNERS LOGOS MARQUEE ═══ */}
      {/* ════════════════════════════════════════════ */}
      {competition && competition.campusPartners && (() => {
        const partnersWithLogo = competition.campusPartners.filter(cp => cp.logo);
        if (partnersWithLogo.length === 0) return null;
        const shouldScroll = partnersWithLogo.length > 4;
        const renderPartnerCard = (partner: CampusPartnerData) => {
          const card = (
            <div className="w-40 h-24 sm:w-48 sm:h-28 rounded-2xl glass-premium flex items-center justify-center p-5 transition-all duration-500 group-hover:bg-white/[0.06] group-hover:border-blue/20 group-hover:scale-105">
              <img src={partner.logo!} alt={partner.name} className="max-w-full max-h-full object-contain filter brightness-90 group-hover:brightness-110 transition-all" />
            </div>
          );
          return partner.website ? <a href={partner.website} target="_blank" rel="noopener noreferrer">{card}</a> : card;
        };
        return (
          <section className="py-24 px-4 sm:px-6 cinematic-section">
            <div className="absolute inset-0 spotlight" />
            <div className="relative max-w-6xl mx-auto">
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
                <Badge variant="info" className="mb-4">🏛️ Campus Partners</Badge>
                <h2 className="text-4xl sm:text-5xl font-black text-foreground mb-3">Campus Network</h2>
                <p className="text-muted/40 max-w-lg mx-auto text-sm">Leading institutions empowering the next generation of innovators.</p>
              </motion.div>
              {shouldScroll ? (
                <div className="relative overflow-hidden">
                  <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-[#0B0F1A] to-transparent z-10" />
                  <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-[#0B0F1A] to-transparent z-10" />
                  <div className="flex animate-marquee-slow gap-14 items-center">
                    {[...partnersWithLogo, ...partnersWithLogo].map((partner, i) => (
                      <div key={`partner-${i}`} className="flex-shrink-0 group">
                        {renderPartnerCard(partner)}
                        <p className="text-[10px] text-muted/30 text-center mt-2 font-semibold uppercase tracking-[0.2em]">{partner.name}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap justify-center gap-10">
                  {partnersWithLogo.map((partner) => (
                    <motion.div key={partner.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="group">
                      {renderPartnerCard(partner)}
                      <p className="text-[10px] text-muted/30 text-center mt-2 font-semibold uppercase tracking-[0.2em]">{partner.name}</p>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </section>
        );
      })()}

      {/* ══════════════════════════════════════════════════════════ */}
      {/* ═══ FINALE — EPIC CINEMATIC CLOSING CTA ═══ */}
      {/* ══════════════════════════════════════════════════════════ */}
      <section className="py-32 sm:py-44 px-4 sm:px-6 mb-16 cinematic-section">
        <div className="absolute inset-0 aurora-bg opacity-50" />
        <div className="absolute bottom-0 left-1/4 w-[700px] h-[500px] bg-purple/10 rounded-full blur-[200px]" />
        <div className="absolute bottom-0 right-1/4 w-[700px] h-[500px] bg-blue/10 rounded-full blur-[200px]" />
        <div className="absolute top-1/3 left-1/2 w-[400px] h-[400px] bg-amber-400/[0.04] rounded-full blur-[180px] -translate-x-1/2" />

        <div className="relative max-w-5xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }}>
            <motion.div
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="inline-block mb-8"
            >
              <FireIcon className="w-20 h-20 text-orange-400/60" />
            </motion.div>

            <h2 className="text-4xl sm:text-5xl lg:text-7xl font-black text-foreground mb-6 leading-[0.95]">
              {pcs('ctaTitle', "Don't Just Watch.")}{' '}
              <span className="text-shimmer">{pcs('ctaHighlight', 'Be Part of It.')}</span>
            </h2>

            <p className="text-lg sm:text-xl lg:text-2xl text-muted/50 mb-4 max-w-3xl mx-auto leading-relaxed font-light">
              {pcs('ctaDescription', "This is more than a competition \u2014 it's a movement. Join the next generation of Indian innovators and put your startup on the national map.")}
            </p>

            {competition?.currentPhase === 'REGISTRATION' && (
              <motion.p
                animate={{ opacity: [1, 0.5, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="text-lg font-bold text-orange-400/80 mb-10"
              >
                {registrationLive
                  ? `⚡ Hurry! Only ${countdown.days} days, ${countdown.hours} hours left to register!`
                  : `🚀 Registration opens in ${countdown.days} days, ${countdown.hours} hours!`}
              </motion.p>
            )}

            <div className="flex flex-wrap gap-5 justify-center mb-10">
              {competition?.currentPhase === 'REGISTRATION' ? (
                <>
                  <Link href="/competition/register">
                    <button className="group relative px-10 py-5 bg-gradient-to-r from-purple to-blue rounded-2xl text-white font-bold text-lg overflow-hidden transition-all hover:scale-105 hover:shadow-2xl hover:shadow-purple/25">
                      <span className="relative z-10 flex items-center gap-2">
                        <RocketLaunchIcon className="w-5 h-5" />
                        Register Now — From ₹199 Only
                        <ArrowRightIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </span>
                      <div className="absolute inset-0 bg-gradient-to-r from-blue to-purple opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    </button>
                  </Link>
                  <Link href="/signup">
                    <button className="px-10 py-5 rounded-2xl text-foreground font-bold text-lg glass border-white/10 hover:border-purple/30 hover:bg-white/5 transition-all">
                      Create Account
                    </button>
                  </Link>
                </>
              ) : (
                <Link href="/explore">
                  <button className="group relative px-10 py-5 bg-gradient-to-r from-purple to-blue rounded-2xl text-white font-bold text-lg overflow-hidden transition-all hover:scale-105 hover:shadow-2xl hover:shadow-purple/25">
                    <span className="relative z-10">Explore Startups</span>
                    <div className="absolute inset-0 bg-gradient-to-r from-blue to-purple opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  </button>
                </Link>
              )}
            </div>

            <p className="text-sm text-muted/40">
              {pcs('ctaFooter', "No idea is too small. No dream is too big.")} <span className="text-purple/60 font-semibold">{pcs('ctaFooterHighlight', "We're waiting for you.")}</span>
            </p>

            <div className="mt-10 pt-8 border-t border-white/5">
              <p className="text-sm text-muted/40">
                Vishvakarma Hub Platform &amp; Event is conducted by{' '}
                <span className="text-shimmer font-bold">Trinetrashakti Innovations Private Limited</span>
              </p>
              <p className="text-xs text-muted/30 mt-1.5">
                Recognized by <span className="text-green-400/60 font-semibold">Startup India</span>, Government of India
              </p>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
