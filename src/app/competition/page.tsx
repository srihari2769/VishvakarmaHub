'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
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
  BriefcaseIcon,
  ComputerDesktopIcon,
  SignalIcon,
  BuildingOffice2Icon,
} from '@heroicons/react/24/outline';
import { HandThumbUpIcon as HandThumbUpSolid } from '@heroicons/react/24/solid';

gsap.registerPlugin(ScrollTrigger);

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

  const mainRef = useRef<HTMLDivElement>(null);

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

  // GSAP ScrollTrigger animations
  useEffect(() => {
    if (loading || !mainRef.current) return;

    const ctx = gsap.context(() => {
      // Animate all sections with reveal
      gsap.utils.toArray<HTMLElement>('.gsap-reveal').forEach((el) => {
        gsap.fromTo(el,
          { opacity: 0, y: 80 },
          {
            opacity: 1, y: 0,
            duration: 1,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: el,
              start: 'top 85%',
              end: 'top 50%',
              toggleActions: 'play none none none',
            },
          }
        );
      });

      // Parallax floating orbs
      gsap.utils.toArray<HTMLElement>('.parallax-orb').forEach((el) => {
        gsap.to(el, {
          y: -100,
          ease: 'none',
          scrollTrigger: {
            trigger: el.parentElement,
            start: 'top bottom',
            end: 'bottom top',
            scrub: 1,
          },
        });
      });

      // Stagger cards
      gsap.utils.toArray<HTMLElement>('.gsap-stagger-parent').forEach((parent) => {
        const children = parent.querySelectorAll('.gsap-stagger-child');
        gsap.fromTo(children,
          { opacity: 0, y: 50, scale: 0.95 },
          {
            opacity: 1, y: 0, scale: 1,
            duration: 0.7,
            stagger: 0.12,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: parent,
              start: 'top 80%',
              toggleActions: 'play none none none',
            },
          }
        );
      });

      // Hero title cinematic entrance
      const heroTitle = mainRef.current?.querySelector('.hero-title');
      if (heroTitle) {
        gsap.fromTo(heroTitle,
          { opacity: 0, y: 100, scale: 0.9 },
          { opacity: 1, y: 0, scale: 1, duration: 1.4, ease: 'power4.out', delay: 0.3 }
        );
      }

      // Hero subtitle slide in
      const heroSub = mainRef.current?.querySelector('.hero-subtitle');
      if (heroSub) {
        gsap.fromTo(heroSub,
          { opacity: 0, y: 40 },
          { opacity: 1, y: 0, duration: 1, ease: 'power3.out', delay: 0.8 }
        );
      }

      // Hero stats counter animation
      gsap.utils.toArray<HTMLElement>('.hero-stat').forEach((el, i) => {
        gsap.fromTo(el,
          { opacity: 0, y: 30, scale: 0.9 },
          { opacity: 1, y: 0, scale: 1, duration: 0.6, delay: 1.2 + i * 0.15, ease: 'back.out(1.7)' }
        );
      });

    }, mainRef);

    return () => ctx.revert();
  }, [loading]);

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
  const shareText = `${shareTitle} — ${competition?.tagline || "India's Biggest Startup Competition"}\n\n� Venue: Tirupati, Andhra Pradesh, India\n�🚀 Register your startup and compete for amazing prizes!\n🎓 Students: ₹${competition?.studentFee || 199} | 💼 Founders: ₹${competition?.founderFee || 499}\n\nOrganized by Trinetrashakti Innovations Pvt Ltd (Startup India Recognized)\n\n🔗 Competition Page: ${shareUrl}\n✅ Apply Now: ${applyUrl}`;

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
      <div className="min-h-screen flex items-center justify-center hero-cinematic">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-amber-400/70 font-display text-sm tracking-widest uppercase">Loading Experience</p>
        </div>
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
    <div ref={mainRef} className="min-h-screen bg-[#050A15] overflow-x-hidden">

      {/* ===== FLOATING BOTTOM BANNER ===== */}
      <div className="fixed bottom-0 left-0 right-0 z-50 cinematic-bar py-0.5">
        <div className="bg-[#050A15]/95 backdrop-blur-md py-3 px-4">
          <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4">
            <div className="flex items-center gap-2">
              <MegaphoneIcon className="w-5 h-5 text-amber-400 animate-bounce" />
              <span className="text-white font-semibold text-sm sm:text-base">
                {pcs('bannerText', "You're Invited! India's Biggest Startup Competition is LIVE")}
              </span>
            </div>
            {registrationLive ? (
              <Link href="/competition/register">
                <button className="px-5 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 text-black font-bold rounded-full text-sm hover:from-amber-400 hover:to-amber-500 transition-all whitespace-nowrap shadow-lg shadow-amber-500/25">
                  {pcs('bannerButtonText', "Register Now — From ₹199 Only!")}
                </button>
              </Link>
            ) : (
              <span className="px-5 py-1.5 bg-white/10 text-amber-400 font-bold rounded-full text-sm whitespace-nowrap border border-amber-400/20">
                Registration Opens Soon
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ===== HERO SECTION — CINEMATIC FULL SCREEN ===== */}
      <section className="relative min-h-screen flex items-center justify-center hero-cinematic starfield overflow-hidden">
        {/* Ambient orbs */}
        <div className="parallax-orb absolute top-[10%] left-[15%] w-[400px] h-[400px] bg-amber-500/8 rounded-full blur-[150px]" />
        <div className="parallax-orb absolute bottom-[10%] right-[10%] w-[500px] h-[500px] bg-cyan-500/6 rounded-full blur-[180px]" />
        <div className="parallax-orb absolute top-[40%] right-[25%] w-[300px] h-[300px] bg-amber-400/5 rounded-full blur-[120px]" />

        {/* Floating innovation elements */}
        <div className="absolute top-[20%] left-[8%] w-2 h-2 bg-amber-400 rounded-full animate-float opacity-60" style={{ animationDelay: '0s' }} />
        <div className="absolute top-[30%] right-[12%] w-1.5 h-1.5 bg-cyan-400 rounded-full animate-float opacity-50" style={{ animationDelay: '2s' }} />
        <div className="absolute top-[60%] left-[20%] w-1 h-1 bg-amber-300 rounded-full animate-float opacity-40" style={{ animationDelay: '4s' }} />
        <div className="absolute top-[15%] right-[30%] w-2.5 h-2.5 bg-amber-500 rounded-full animate-float-slow opacity-30" style={{ animationDelay: '1s' }} />
        <div className="absolute top-[70%] right-[20%] w-1.5 h-1.5 bg-cyan-300 rounded-full animate-float-slow opacity-40" style={{ animationDelay: '3s' }} />
        <div className="absolute top-[45%] left-[40%] w-1 h-1 bg-white rounded-full animate-float opacity-25" style={{ animationDelay: '5s' }} />
        {/* Circuit-like decorative lines */}
        <div className="absolute top-[25%] left-0 w-[200px] h-[1px] bg-gradient-to-r from-transparent via-amber-500/20 to-transparent" />
        <div className="absolute bottom-[30%] right-0 w-[200px] h-[1px] bg-gradient-to-l from-transparent via-cyan-400/20 to-transparent" />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 text-center pt-24 pb-32">
          {/* Live badge */}
          <motion.div
            animate={{ scale: [1, 1.03, 1] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full glass text-amber-400 text-sm font-bold mb-8 tracking-wider uppercase"
          >
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
            </span>
            {pcs('heroBadgeText', 'Registrations Open — Join Now!')}
          </motion.div>

          {/* Title */}
          <h1 className="hero-title font-display text-5xl sm:text-6xl lg:text-8xl font-black text-foreground mb-6 leading-[1.05] tracking-tight">
            <span className="block text-white/90">
              {pcs('heroTitleLine1', "India's Biggest")}
            </span>
            <span className="block gradient-gold mt-2">
              {pcs('heroTitleLine2', 'Startup Competition')}
            </span>
          </h1>

          {/* Subtitle */}
          <div className="hero-subtitle">
            <p className="text-lg sm:text-xl lg:text-2xl text-white/60 max-w-3xl mx-auto mb-4 font-light leading-relaxed">
              {pcs('heroDescription', 'We invite students, founders, engineers, and innovators from every corner of India to showcase their groundbreaking ideas on the national stage.')}
            </p>

            <p className="text-base sm:text-lg text-amber-400/80 font-medium mb-6 italic">
              &ldquo;{pcs('heroQuote', 'Your idea deserves the spotlight. This is your moment.')}&rdquo;
            </p>

            <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full glass text-white/60 text-sm font-medium mb-10">
              <GlobeAltIcon className="w-4 h-4 text-amber-400" />
              <span>📍 Tirupati, Andhra Pradesh, India</span>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-wrap gap-4 justify-center mb-14">
            {registrationLive ? (
              <>
                <Link href="/competition/register">
                  <button className="group relative px-8 py-4 bg-gradient-to-r from-amber-500 to-amber-600 text-black font-bold rounded-xl text-base hover:from-amber-400 hover:to-amber-500 transition-all shadow-lg shadow-amber-500/30 hover:shadow-amber-500/50 hover:scale-105 transform">
                    <span className="flex items-center gap-2">
                      <FireIcon className="w-5 h-5" />
                      Register Your Startup
                      <ArrowRightIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </button>
                </Link>
                <Link href="/competition/login">
                  <button className="px-8 py-4 glass text-white font-semibold rounded-xl text-base hover:bg-white/10 transition-all border border-white/10 hover:border-amber-400/30">
                    Already Registered? Login
                  </button>
                </Link>
              </>
            ) : (
              <>
                <button disabled className="px-8 py-4 bg-white/5 text-white/40 font-bold rounded-xl text-base cursor-not-allowed border border-white/10">
                  <span className="flex items-center gap-2">
                    <ClockIcon className="w-5 h-5" />
                    Registration Opens Soon
                  </span>
                </button>
              </>
            )}
          </div>

          {/* Countdown Timer */}
          {countdownLabel && (countdown.days > 0 || countdown.hours > 0 || countdown.minutes > 0 || countdown.seconds > 0) && (
            <div className="mb-14">
              <p className="text-xs font-display text-amber-400/60 uppercase tracking-[0.3em] mb-5">{countdownLabel}</p>
              <div className="flex justify-center gap-3 sm:gap-5">
                {[
                  { value: countdown.days, label: 'Days' },
                  { value: countdown.hours, label: 'Hours' },
                  { value: countdown.minutes, label: 'Minutes' },
                  { value: countdown.seconds, label: 'Seconds' },
                ].map((t) => (
                  <div
                    key={t.label}
                    className="glass rounded-2xl px-4 sm:px-7 py-4 sm:py-5 min-w-[72px] sm:min-w-[90px]"
                  >
                    <p className="text-3xl sm:text-5xl font-display font-black gradient-gold">
                      {String(t.value).padStart(2, '0')}
                    </p>
                    <p className="text-[10px] sm:text-xs text-white/40 font-medium uppercase tracking-widest mt-1">{t.label}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Phase badge */}
          {competition && (
            <div className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full border text-sm font-semibold ${phaseInfo.bg} ${phaseInfo.color}`}>
              <SparklesIcon className="w-4 h-4" />
              {phaseInfo.label}
            </div>
          )}

          {/* Share Button */}
          <div className="mt-8 relative inline-block">
            <button
              onClick={() => setShowShareMenu(!showShareMenu)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full glass text-white/50 hover:text-amber-400 hover:border-amber-400/30 transition-all text-sm font-medium"
            >
              <ShareIcon className="w-4 h-4" />
              Share This Event
            </button>

            {showShareMenu && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className="absolute top-full mt-3 left-1/2 -translate-x-1/2 z-50 glass rounded-2xl p-5 shadow-2xl shadow-black/60 min-w-[300px]"
              >
                <p className="text-xs text-amber-400/60 uppercase tracking-wider font-semibold mb-3">Share via</p>
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
                    className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 transition-all hover:scale-105"
                  >
                    <span className="text-lg">{copied ? '✅' : '🔗'}</span>
                    <span className="text-[10px] font-medium">{copied ? 'Copied!' : 'Copy Link'}</span>
                  </button>
                </div>
                <button
                  onClick={() => setShowShareMenu(false)}
                  className="w-full text-xs text-white/30 hover:text-white/60 py-1.5 transition-colors"
                >
                  Close
                </button>
              </motion.div>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-14 max-w-4xl mx-auto">
            {[
              { label: 'Registrations', value: competition?._count?.entries || 0, icon: RocketLaunchIcon, color: 'text-amber-400' },
              { label: 'Top Selected', value: pcn('topSelected', 200), icon: StarIcon, color: 'text-amber-300' },
              { label: 'Finalists', value: pcn('finalistCount', 20), icon: TrophyIcon, color: 'text-orange-400' },
              { label: 'Pitch Duration', value: pcs('pitchDuration', '5 min'), icon: ClockIcon, color: 'text-cyan-400' },
            ].map((stat, i) => (
              <div key={i} className="hero-stat">
                <div className="glass-card rounded-2xl p-5 text-center">
                  <stat.icon className={`w-7 h-7 ${stat.color} mx-auto mb-2`} />
                  <p className="text-3xl font-display font-black text-white">{stat.value}</p>
                  <p className="text-xs text-white/40 font-medium tracking-wider uppercase">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom gradient fade */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#050A15] to-transparent" />
      </section>

      {/* Decorative divider */}
      <div className="section-divider" />

      {/* ===== INVITATION MESSAGE ===== */}
      <section className="py-20 px-4 sm:px-6 relative">
        <div className="parallax-orb absolute top-0 right-[10%] w-[300px] h-[300px] bg-amber-500/5 rounded-full blur-[120px]" />
        <div className="max-w-5xl mx-auto gsap-reveal">
          <div className="relative glass rounded-3xl p-8 sm:p-14 overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-amber-500/40 to-transparent" />
            <div className="absolute top-0 left-0 w-40 h-40 bg-amber-500/5 rounded-full blur-[80px]" />
            <div className="absolute bottom-0 right-0 w-40 h-40 bg-cyan-400/5 rounded-full blur-[80px]" />
            <div className="relative text-center">
              <HeartIcon className="w-10 h-10 text-amber-400 mx-auto mb-4" />
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-white mb-5 tracking-wide">
                {pcs('invitationTitle', 'Dear Innovators, This is Your Invitation')}
              </h2>
              <p className="text-lg text-white/50 max-w-3xl mx-auto mb-4 leading-relaxed">
                {pcs('invitationDescription', "Whether you're a college student with a brilliant idea, a founder building the next big thing, or an engineer who wants to solve real problems — Vishvakarma Innovation Challenge 2026 is the platform where your startup journey begins.")}
              </p>
              <p className="text-base text-white/40 max-w-2xl mx-auto mb-6">
                {pcs('invitationSubtext', 'We believe every idea matters. No matter how big or small, your innovation can change the world. Join thousands of dreamers who are turning ideas into reality.')}
              </p>
              <div className="flex flex-wrap justify-center gap-4 sm:gap-6 text-sm">
                {pcList('invitationHighlights', 'Open to all Indians, Starting at just ₹199, National stage exposure, Meet investors & mentors').map((h, i) => (
                  <div key={i} className="flex items-center gap-2 text-amber-400/80">
                    <CheckCircleIcon className="w-5 h-5 text-amber-400" />
                    <span>{h}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="section-divider" />

      {/* ===== PRIZES & REWARDS ===== */}
      <section className="py-20 px-4 sm:px-6 relative">
        <div className="parallax-orb absolute top-[20%] left-[5%] w-[350px] h-[350px] bg-amber-500/5 rounded-full blur-[140px]" />
        <div className="max-w-5xl mx-auto">
          <div className="gsap-reveal text-center mb-14">
            <p className="font-display text-xs tracking-[0.3em] text-amber-400/60 uppercase mb-3">Rewards & Recognition</p>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-white mb-3 tracking-wide">{pcs('prizeSectionTitle', 'What You Win')}</h2>
            <div className="divine-line w-24 mx-auto mb-4" />
            <p className="text-white/40 max-w-xl mx-auto">{pcs('prizeSectionSubtitle', 'More than just prizes — a launchpad for your startup career')}</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-8 gsap-stagger-parent">
            {/* 1st Place */}
            <div className="gsap-stagger-child">
              <div className="glass-card rounded-2xl p-6 text-center relative overflow-hidden h-full">
                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-amber-400 to-orange-400" />
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-400/20 to-orange-400/20 flex items-center justify-center mx-auto mb-4">
                  <TrophyIcon className="w-8 h-8 text-amber-400" />
                </div>
                <Badge variant="warning">1st Place</Badge>
                <h3 className="text-2xl font-display font-black text-white mt-3 mb-2">{pcs('firstPrizeTitle', 'Grand Winner')}</h3>
                <p className="text-sm text-white/40 mb-4">{pcs('firstPrizeSubtitle', 'The top startup takes it all')}</p>
                <div className="space-y-2 text-sm text-left">
                  {pcList('firstPrizeBenefits', 'Cash prize + Trophy, Investor pitch meetings, 1-year incubation support, Media & PR coverage').map((b, i) => (
                    <div key={i} className="flex items-center gap-2 text-amber-400"><StarIcon className="w-4 h-4 flex-shrink-0" /><span className="text-white/70">{b}</span></div>
                  ))}
                </div>
              </div>
            </div>

            {/* 2nd Place */}
            <div className="gsap-stagger-child">
              <div className="glass-card rounded-2xl p-6 text-center relative overflow-hidden h-full">
                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-gray-300 to-gray-400" />
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gray-300/20 to-gray-400/20 flex items-center justify-center mx-auto mb-4">
                  <TrophyIcon className="w-8 h-8 text-gray-300" />
                </div>
                <Badge variant="default">2nd Place</Badge>
                <h3 className="text-2xl font-display font-black text-white mt-3 mb-2">{pcs('secondPrizeTitle', 'Runner Up')}</h3>
                <p className="text-sm text-white/40 mb-4">{pcs('secondPrizeSubtitle', 'Outstanding innovation runner')}</p>
                <div className="space-y-2 text-sm text-left">
                  {pcList('secondPrizeBenefits', 'Cash prize + Trophy, Mentorship program, Networking access').map((b, i) => (
                    <div key={i} className="flex items-center gap-2 text-gray-400"><StarIcon className="w-4 h-4 flex-shrink-0" /><span className="text-white/70">{b}</span></div>
                  ))}
                </div>
              </div>
            </div>

            {/* 3rd Place */}
            <div className="gsap-stagger-child">
              <div className="glass-card rounded-2xl p-6 text-center relative overflow-hidden h-full">
                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-orange-600 to-orange-700" />
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-600/20 to-orange-700/20 flex items-center justify-center mx-auto mb-4">
                  <TrophyIcon className="w-8 h-8 text-orange-600" />
                </div>
                <Badge variant="info">3rd Place</Badge>
                <h3 className="text-2xl font-display font-black text-white mt-3 mb-2">{pcs('thirdPrizeTitle', 'Second Runner Up')}</h3>
                <p className="text-sm text-white/40 mb-4">{pcs('thirdPrizeSubtitle', 'Remarkable innovation')}</p>
                <div className="space-y-2 text-sm text-left">
                  {pcList('thirdPrizeBenefits', 'Cash prize + Trophy, Platform spotlight, Certificate of excellence').map((b, i) => (
                    <div key={i} className="flex items-center gap-2 text-orange-600"><StarIcon className="w-4 h-4 flex-shrink-0" /><span className="text-white/70">{b}</span></div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* All Participants Benefits */}
          <div className="gsap-reveal">
            <div className="glass-card rounded-2xl p-6">
              <div className="text-center mb-4">
                <GlobeAltIcon className="w-8 h-8 text-amber-400 mx-auto mb-2" />
                <h3 className="text-lg font-display font-bold text-white">Every Participant Gets</h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center text-sm">
                {(() => {
                  const icons = [AcademicCapIcon, UserGroupIcon, BoltIcon, SparklesIcon];
                  return pcList('participantBenefits', 'Certificate of Participation, Networking with Founders, Startup Visibility, Mentorship Access').map((label, i) => {
                    const Icon = icons[i % icons.length];
                    return (
                      <div key={i} className="flex flex-col items-center gap-2 p-3 rounded-xl bg-amber-500/5 border border-amber-500/10">
                        <Icon className="w-6 h-6 text-amber-400" />
                        <span className="text-white/50 font-medium text-xs">{label}</span>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="section-divider" />

      {/* ===== COMPETITION PHASES TIMELINE ===== */}
      <section className="py-20 px-4 sm:px-6 relative">
        <div className="parallax-orb absolute bottom-[10%] right-[5%] w-[400px] h-[400px] bg-cyan-500/5 rounded-full blur-[150px]" />
        <div className="max-w-5xl mx-auto">
          <div className="gsap-reveal text-center mb-14">
            <p className="font-display text-xs tracking-[0.3em] text-amber-400/60 uppercase mb-3">The Journey</p>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-white mb-3 tracking-wide">Competition Phases</h2>
            <div className="divine-line w-24 mx-auto mb-4" />
            <p className="text-white/40 max-w-xl mx-auto">From registration to the final pitch — here&apos;s how the competition works</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 gsap-stagger-parent">
            {/* Phase 1 */}
            <div className="gsap-stagger-child">
              <div className={`glass-card rounded-2xl p-6 h-full border-l-4 ${phase === 'REGISTRATION' ? 'border-l-green-400' : 'border-l-white/10'}`}>
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${phase === 'REGISTRATION' ? 'bg-green-400/10 text-green-400' : 'bg-white/5 text-white/30'}`}>
                    <RocketLaunchIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-display font-bold text-white">Phase 1 — Startup Registration</h3>
                      {phase === 'REGISTRATION' && <Badge variant="success">ACTIVE</Badge>}
                    </div>
                    <p className="text-xs text-white/30 mb-3">Duration: 30 days{competition && ` (${formatDate(competition.registrationStart)} – ${formatDate(competition.registrationEnd)})`}</p>
                    <p className="text-sm text-white/50 mb-3">Open to students, engineers, founders, innovators, and researchers. Submit your startup via the Vishvakarma Hub startup wizard.</p>
                    <div className="text-xs text-white/30">
                      <span className="font-medium text-white/60">Required:</span> Startup idea, problem statement, solution, market potential, product stage
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Phase 2 */}
            <div className="gsap-stagger-child">
              <div className={`glass-card rounded-2xl p-6 h-full border-l-4 ${phase === 'SCREENING' ? 'border-l-yellow-400' : 'border-l-white/10'}`}>
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${phase === 'SCREENING' ? 'bg-yellow-400/10 text-yellow-400' : 'bg-white/5 text-white/30'}`}>
                    <ChartBarIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-display font-bold text-white">Phase 2 — Manual + Jury Screening</h3>
                      {phase === 'SCREENING' && <Badge variant="warning">ACTIVE</Badge>}
                    </div>
                    <p className="text-xs text-white/30 mb-3">Top 200 startups selected</p>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {pcList('screeningCriteria', 'Innovation:30%, Market Potential:30%, Execution Feasibility:20%, Impact:20%').map((c) => {
                        const [label, weight] = c.split(':').map(s => s.trim());
                        return (
                          <div key={label} className="flex justify-between px-3 py-1.5 rounded-lg bg-white/5">
                            <span className="text-white/30 text-xs">{label}</span>
                            <span className="text-amber-400 font-semibold text-xs">{weight}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Phase 3 */}
            <div className="gsap-stagger-child">
              <div className={`glass-card rounded-2xl p-6 h-full border-l-4 ${phase === 'VOTING' ? 'border-l-blue-400' : 'border-l-white/10'}`}>
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${phase === 'VOTING' ? 'bg-blue-400/10 text-blue-400' : 'bg-white/5 text-white/30'}`}>
                    <HandThumbUpIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-display font-bold text-white">Phase 3 — Public Voting</h3>
                      {phase === 'VOTING' && <Badge variant="info">ACTIVE</Badge>}
                    </div>
                    <p className="text-xs text-white/30 mb-3">Community-driven engagement{competition && ` (Ends: ${formatDate(competition.votingEnd)})`}</p>
                    <p className="text-sm text-white/50 mb-2">Top startups are displayed publicly. The community can support through:</p>
                    <div className="flex flex-wrap gap-2">
                      {['Upvotes', 'Comments', 'Bookmarking', 'Funding Interest'].map((a) => (
                        <span key={a} className="px-2 py-1 text-xs rounded-full bg-cyan-400/10 text-cyan-400 border border-cyan-400/15">{a}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Phase 4 */}
            <div className="gsap-stagger-child">
              <div className={`glass-card rounded-2xl p-6 h-full border-l-4 ${phase === 'FINALS' ? 'border-l-amber-400' : 'border-l-white/10'}`}>
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${phase === 'FINALS' ? 'bg-amber-400/10 text-amber-400' : 'bg-white/5 text-white/30'}`}>
                    <PresentationChartBarIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-display font-bold text-white">Phase 4 — Final Pitch Round</h3>
                      {phase === 'FINALS' && <Badge variant="info">ACTIVE</Badge>}
                    </div>
                    <p className="text-xs text-white/30 mb-3">Top 20 startups present online{competition && ` (${formatDate(competition.finalsDate)})`}</p>
                    <p className="text-sm text-white/50 mb-2">5-minute pitch to a panel of judges:</p>
                    <div className="flex flex-wrap gap-2">
                      {['Founders', 'Investors', 'Industry Experts'].map((j) => (
                        <span key={j} className="px-2 py-1 text-xs rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/15">{j}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="section-divider" />

      {/* ===== WHO CAN PARTICIPATE ===== */}
      <section className="py-20 px-4 sm:px-6 relative">
        <div className="max-w-5xl mx-auto">
          <div className="gsap-reveal text-center mb-14">
            <p className="font-display text-xs tracking-[0.3em] text-amber-400/60 uppercase mb-3">Open To All</p>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-white mb-3 tracking-wide">Who Can Participate?</h2>
            <div className="divine-line w-24 mx-auto mb-4" />
            <p className="text-white/40">Open to all innovators across India</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 gsap-stagger-parent">
            {(() => {
              const icons = [AcademicCapIcon, RocketLaunchIcon, LightBulbIcon, SparklesIcon, ChartBarIcon];
              return pcList('participantCategories', 'Students:College & university students, Engineers:Technical professionals, Founders:Early-stage founders, Innovators:Creative problem solvers, Researchers:Academic researchers').map((item, i) => {
                const [label, desc] = item.split(':').map(s => s.trim());
                const Icon = icons[i % icons.length];
                return (
                  <div key={label} className="gsap-stagger-child">
                    <div className="glass-card rounded-2xl p-5 text-center h-full">
                      <Icon className="w-8 h-8 text-amber-400 mx-auto mb-3" />
                      <p className="text-sm font-display font-semibold text-white">{label}</p>
                      <p className="text-xs text-white/40 mt-1">{desc}</p>
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </div>
      </section>

      <div className="section-divider" />

      {/* ===== PARTICIPATION FEES ===== */}
      <section className="py-20 px-4 sm:px-6 relative">
        <div className="parallax-orb absolute top-[30%] right-[5%] w-[300px] h-[300px] bg-amber-500/5 rounded-full blur-[130px]" />
        <div className="max-w-5xl mx-auto">
          <div className="gsap-reveal text-center mb-14">
            <p className="font-display text-xs tracking-[0.3em] text-amber-400/60 uppercase mb-3">Affordable Entry</p>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-white mb-3 tracking-wide">Participation Fees</h2>
            <div className="divine-line w-24 mx-auto mb-4" />
            <p className="text-white/40 max-w-xl mx-auto">Affordable entry for students and founders alike</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 gsap-stagger-parent">
            <div className="gsap-stagger-child">
              <div className="glass-card rounded-2xl p-6 text-center h-full hover:border-cyan-400/30">
                <AcademicCapIcon className="w-12 h-12 text-cyan-400 mx-auto mb-4" />
                <h3 className="text-lg font-display font-bold text-white mb-2">Student</h3>
                <p className="text-3xl font-display font-bold text-cyan-400 mb-2">₹{competition?.studentFee || 199}</p>
                <p className="text-sm text-white/40">Valid college/university ID required</p>
                <div className="mt-4 space-y-2 text-sm text-white/50 text-left">
                  <div className="flex items-center gap-2"><CheckCircleIcon className="w-4 h-4 text-green-400 flex-shrink-0" /><span>Full competition access</span></div>
                  <div className="flex items-center gap-2"><CheckCircleIcon className="w-4 h-4 text-green-400 flex-shrink-0" /><span>Mentorship sessions</span></div>
                  <div className="flex items-center gap-2"><CheckCircleIcon className="w-4 h-4 text-green-400 flex-shrink-0" /><span>Certificate of participation</span></div>
                </div>
              </div>
            </div>

            <div className="gsap-stagger-child">
              <div className="glass-card rounded-2xl p-6 text-center h-full hover:border-amber-400/30 relative">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-amber-500 to-amber-600 text-black text-xs font-bold rounded-full">POPULAR</div>
                <LightBulbIcon className="w-12 h-12 text-amber-400 mx-auto mb-4" />
                <h3 className="text-lg font-display font-bold text-white mb-2">Founder / Professional</h3>
                <p className="text-3xl font-display font-bold text-amber-400 mb-2">₹{competition?.founderFee || 499}</p>
                <p className="text-sm text-white/40">For entrepreneurs and working professionals</p>
                <div className="mt-4 space-y-2 text-sm text-white/50 text-left">
                  <div className="flex items-center gap-2"><CheckCircleIcon className="w-4 h-4 text-green-400 flex-shrink-0" /><span>Full competition access</span></div>
                  <div className="flex items-center gap-2"><CheckCircleIcon className="w-4 h-4 text-green-400 flex-shrink-0" /><span>Investor networking opportunity</span></div>
                  <div className="flex items-center gap-2"><CheckCircleIcon className="w-4 h-4 text-green-400 flex-shrink-0" /><span>Priority pitch slot</span></div>
                  <div className="flex items-center gap-2"><CheckCircleIcon className="w-4 h-4 text-green-400 flex-shrink-0" /><span>Certificate of participation</span></div>
                </div>
              </div>
            </div>

            <div className="gsap-stagger-child">
              <div className="glass-card rounded-2xl p-6 text-center h-full hover:border-emerald-400/30">
                <TicketIcon className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
                <h3 className="text-lg font-display font-bold text-white mb-2">Visitor Entry</h3>
                <p className="text-3xl font-display font-bold text-emerald-400 mb-2">₹99</p>
                <p className="text-sm text-white/40">For anyone who wants to attend the event</p>
                <div className="mt-4 space-y-2 text-sm text-white/50 text-left">
                  <div className="flex items-center gap-2"><CheckCircleIcon className="w-4 h-4 text-green-400 flex-shrink-0" /><span>Event access pass</span></div>
                  <div className="flex items-center gap-2"><CheckCircleIcon className="w-4 h-4 text-green-400 flex-shrink-0" /><span>Innovation showcase viewing</span></div>
                </div>
                <Link href="/competition/citizen-pass">
                  <button className="w-full mt-4 px-4 py-2 glass text-emerald-400 font-semibold rounded-xl text-sm hover:bg-emerald-400/10 transition-all border border-emerald-400/20">Get Entry Pass</button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="section-divider" />

      {/* ===== EXHIBITION BOOTHS ===== */}
      <section className="py-20 px-4 sm:px-6 relative">
        <div className="max-w-4xl mx-auto">
          <div className="gsap-reveal text-center mb-14">
            <p className="font-display text-xs tracking-[0.3em] text-amber-400/60 uppercase mb-3">Showcase Your Product</p>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-white mb-3 tracking-wide">Exhibition Booths</h2>
            <div className="divine-line w-24 mx-auto mb-4" />
            <p className="text-white/40 max-w-xl mx-auto">Showcase your product at the Vishvakarma Innovation Expo</p>
          </div>

          <div className="gsap-reveal">
            <div className="glass-card rounded-2xl p-8 relative overflow-hidden">
              <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent" />
              <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-cyan-400/5 to-transparent rounded-bl-full" />
              <div className="relative">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                  <div>
                    <h3 className="text-2xl font-display font-bold text-white mb-2">{pcs('boothTitle', 'Standard Exhibition Booth')}</h3>
                    <p className="text-white/40 mb-4">{competition?.boothDescription || '6x6 ft branded booth space with table, chairs, power outlet, and Wi-Fi. Perfect for product demos and live showcases.'}</p>
                    <div className="flex flex-wrap gap-2">
                      {pcList('boothFeatures', 'Product Demo Space, Branded Backdrop, Power & Wi-Fi, Visitor Footfall').map((f) => (
                        <span key={f} className="px-3 py-1 text-xs rounded-full bg-cyan-400/10 text-cyan-400 border border-cyan-400/15">{f}</span>
                      ))}
                    </div>
                  </div>
                  <div className="text-center md:text-right flex-shrink-0">
                    <p className="text-4xl font-display font-bold text-cyan-400">₹{(competition?.boothPrice || 5000).toLocaleString('en-IN')}</p>
                    <p className="text-sm text-white/30">per booth</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="section-divider" />

      {/* ===== OUR SPONSORS ===== */}
      {competition?.sponsors && competition.sponsors.length > 0 && (
        <section className="py-20 px-4 sm:px-6 relative">
          <div className="max-w-5xl mx-auto">
            <div className="gsap-reveal text-center mb-14">
              <p className="font-display text-xs tracking-[0.3em] text-amber-400/60 uppercase mb-3">Backed By Leaders</p>
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-white mb-3 tracking-wide">Our Sponsors</h2>
              <div className="divine-line w-24 mx-auto mb-4" />
              <p className="text-white/40 max-w-xl mx-auto">Backed by industry leaders driving innovation forward</p>
            </div>

            {competition.sponsors.filter(s => s.tier === 'TITLE').length > 0 && (
              <div className="mb-10 gsap-reveal">
                <h3 className="text-center text-sm font-display text-amber-400 uppercase tracking-[0.2em] mb-6">Title Sponsors</h3>
                <div className="grid sm:grid-cols-2 gap-6 max-w-3xl mx-auto">
                  {competition.sponsors.filter(s => s.tier === 'TITLE').map((s) => (
                    <div key={s.id} className="glass-card rounded-2xl p-6 text-center glow-gold">
                      <div className="w-20 h-20 rounded-2xl bg-amber-400/10 flex items-center justify-center mx-auto mb-4 overflow-hidden">
                        {s.logo ? <img src={s.logo} alt={s.name} className="w-full h-full object-contain p-2" /> : <StarIcon className="w-10 h-10 text-amber-400" />}
                      </div>
                      <h4 className="text-lg font-display font-bold text-white">{s.name}</h4>
                      <Badge variant="warning">Title Sponsor</Badge>
                      {s.benefits && (
                        <div className="mt-3 space-y-1 text-sm text-white/50 text-left">
                          {(() => { try { return JSON.parse(s.benefits); } catch { return s.benefits.split(','); } })().map((b: string, i: number) => (
                            <div key={i} className="flex items-center gap-2"><CheckCircleIcon className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" /><span>{b.trim()}</span></div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {competition.sponsors.filter(s => s.tier === 'GOLD').length > 0 && (
              <div className="mb-10 gsap-reveal">
                <h3 className="text-center text-sm font-display text-orange-400 uppercase tracking-[0.2em] mb-6">Gold Sponsors</h3>
                <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
                  {competition.sponsors.filter(s => s.tier === 'GOLD').map((s) => (
                    <div key={s.id} className="glass-card rounded-2xl p-5 text-center">
                      <div className="w-14 h-14 rounded-xl bg-orange-400/10 flex items-center justify-center mx-auto mb-3 overflow-hidden">
                        {s.logo ? <img src={s.logo} alt={s.name} className="w-full h-full object-contain p-1" /> : <StarIcon className="w-7 h-7 text-orange-400" />}
                      </div>
                      <h4 className="font-semibold text-white">{s.name}</h4>
                      <p className="text-xs text-orange-400 mt-1">Gold Sponsor</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {competition.sponsors.filter(s => s.tier === 'STARTUP_PARTNER').length > 0 && (
              <div className="gsap-reveal">
                <h3 className="text-center text-sm font-display text-cyan-400 uppercase tracking-[0.2em] mb-6">Startup Partners</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
                  {competition.sponsors.filter(s => s.tier === 'STARTUP_PARTNER').map((s) => (
                    <div key={s.id} className="glass-card rounded-2xl p-4 text-center">
                      <div className="w-12 h-12 rounded-lg bg-cyan-400/10 flex items-center justify-center mx-auto mb-2 overflow-hidden">
                        {s.logo ? <img src={s.logo} alt={s.name} className="w-full h-full object-contain p-1" /> : <StarIcon className="w-6 h-6 text-cyan-400" />}
                      </div>
                      <h4 className="text-sm font-semibold text-white">{s.name}</h4>
                      <p className="text-xs text-cyan-400 mt-0.5">Startup Partner</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      <div className="section-divider" />

      {/* ===== SPONSOR PACKAGES ===== */}
      <section className="py-20 px-4 sm:px-6 relative">
        <div className="parallax-orb absolute top-[10%] left-[5%] w-[400px] h-[400px] bg-amber-500/5 rounded-full blur-[160px]" />
        <div className="max-w-6xl mx-auto">
          <div className="gsap-reveal text-center mb-14">
            <p className="font-display text-xs tracking-[0.3em] text-amber-400/60 uppercase mb-3">Growth Partnerships</p>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-white mb-3 tracking-wide">Partner With Us to Grow Your Business</h2>
            <div className="divine-line w-24 mx-auto mb-4" />
            <p className="text-white/40 max-w-xl mx-auto">Strategic partnerships that deliver real ROI — brand visibility, talent access, and market reach at India&apos;s biggest startup competition</p>
          </div>

          {/* Title Sponsor — Featured */}
          <div className="gsap-reveal mb-8">
            <div className="glass-card rounded-2xl p-8 relative overflow-hidden glow-gold">
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-amber-400 via-orange-400 to-amber-400" />
              <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-amber-400/8 to-transparent rounded-bl-full" />
              <div className="relative flex flex-col md:flex-row md:items-start gap-6">
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400/20 to-orange-400/20 flex items-center justify-center">
                    <StarIcon className="w-8 h-8 text-amber-400" />
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-xl font-display font-bold text-white">Title Sponsor</h3>
                    <Badge variant="warning">Most Premium</Badge>
                  </div>
                  <p className="text-2xl font-display font-bold text-amber-400 mb-4">{pcs('titleSponsorPrice', '₹7,50,000')}</p>
                  <div className="grid sm:grid-cols-2 gap-2 text-sm text-white/50">
                    {pcList('titleSponsorBenefits', 'Event named \u201cpowered by [Sponsor]\u201d, Exclusive category rights — no competitors in your industry, Logo on stage backdrop & all banners, 5–10 min keynote speech + closing ceremony address, Dedicated hiring zone at venue, Jury panel seat in finals, Premium branding across website & all media (press\u002C reels\u002C banners), Media coverage & press release mention, Premium startup exhibition booth, Direct access to top startups & talent pipeline').map((b, i) => (
                      <div key={i} className="flex items-center gap-2"><CheckCircleIcon className="w-4 h-4 text-amber-400 flex-shrink-0" /><span>{b}</span></div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Presenting + Diamond */}
          <div className="grid md:grid-cols-2 gap-6 mb-6 gsap-stagger-parent">
            <div className="gsap-stagger-child">
              <div className="glass-card rounded-2xl p-6 relative overflow-hidden h-full">
                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-rose-400 via-pink-400 to-rose-400" />
                <StarIcon className="w-10 h-10 text-rose-400 mb-3" />
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-lg font-display font-bold text-white">Presenting Sponsor</h3>
                  <Badge variant="danger">Premium</Badge>
                </div>
                <p className="text-2xl font-display font-bold text-rose-400 mb-4">{pcs('presentingSponsorPrice', '₹5,00,000')}</p>
                <div className="space-y-2 text-sm text-white/50">
                  {pcList('presentingSponsorBenefits', 'Co-host branding — not just a logo\u002C full event co-presentation, Sponsored challenge track (e.g.\u002C \u201cAI Challenge powered by [You]\u201d), Logo on stage backdrop & event banners, 5 min keynote slot, Premium branding on website & social media, Media coverage & press mention, VIP booth at startup exhibition, Networking access with top founders').map((b, i) => (
                    <div key={i} className="flex items-center gap-2"><CheckCircleIcon className="w-4 h-4 text-rose-400 flex-shrink-0" /><span>{b}</span></div>
                  ))}
                </div>
              </div>
            </div>

            <div className="gsap-stagger-child">
              <div className="glass-card rounded-2xl p-6 relative overflow-hidden h-full">
                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-sky-400 via-blue-400 to-sky-400" />
                <StarIcon className="w-10 h-10 text-sky-400 mb-3" />
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-lg font-display font-bold text-white">Diamond Sponsor</h3>
                  <Badge variant="info">Elite</Badge>
                </div>
                <p className="text-2xl font-display font-bold text-sky-400 mb-4">{pcs('diamondSponsorPrice', '₹3,50,000')}</p>
                <div className="space-y-2 text-sm text-white/50">
                  {pcList('diamondSponsorBenefits', 'Access to live startup pitching sessions, Investor roundtable invite with top founders, Lead capture system (QR code / digital cards), Logo on event banners and stage, Featured website section with company profile, Social media promotion across all channels, Premium exhibition booth, VIP networking access, Award ceremony mention & brand visibility').map((b, i) => (
                    <div key={i} className="flex items-center gap-2"><CheckCircleIcon className="w-4 h-4 text-sky-400 flex-shrink-0" /><span>{b}</span></div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Platinum + Gold */}
          <div className="grid md:grid-cols-2 gap-6 mb-6 gsap-stagger-parent">
            <div className="gsap-stagger-child">
              <div className="glass-card rounded-2xl p-6 relative overflow-hidden h-full">
                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-purple to-violet-400" />
                <StarIcon className="w-10 h-10 text-purple mb-3" />
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-lg font-display font-bold text-white">Platinum Sponsor</h3>
                  <Badge variant="info">Popular</Badge>
                </div>
                <p className="text-2xl font-display font-bold text-purple mb-4">{pcs('platinumSponsorPrice', '₹1,00,000')}</p>
                <div className="space-y-2 text-sm text-white/50">
                  {pcList('platinumSponsorBenefits', 'Logo on event banners, Featured website placement, Social media promotion, Booth at startup exhibition, VIP networking access').map((b, i) => (
                    <div key={i} className="flex items-center gap-2"><CheckCircleIcon className="w-4 h-4 text-purple flex-shrink-0" /><span>{b}</span></div>
                  ))}
                </div>
              </div>
            </div>

            <div className="gsap-stagger-child">
              <div className="glass-card rounded-2xl p-6 relative overflow-hidden h-full">
                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-orange-400 to-yellow-500" />
                <StarIcon className="w-10 h-10 text-orange-400 mb-3" />
                <h3 className="text-lg font-display font-bold text-white mb-1">Gold Sponsor</h3>
                <p className="text-2xl font-display font-bold text-orange-400 mb-4">{pcs('goldSponsorPrice', '₹50,000')}</p>
                <div className="space-y-2 text-sm text-white/50">
                  {pcList('goldSponsorBenefits', 'Logo on website, Social media promotion, Startup booth, Event mention during ceremony').map((b, i) => (
                    <div key={i} className="flex items-center gap-2"><CheckCircleIcon className="w-4 h-4 text-orange-400 flex-shrink-0" /><span>{b}</span></div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Silver + Startup Partner + Innovation Partner + Community Partner */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8 gsap-stagger-parent">
            <div className="gsap-stagger-child">
              <div className="glass-card rounded-2xl p-5 relative overflow-hidden h-full">
                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-gray-300 to-gray-400" />
                <StarIcon className="w-8 h-8 text-gray-300 mb-2" />
                <h3 className="text-base font-display font-bold text-white mb-1">Silver Sponsor</h3>
                <p className="text-xl font-display font-bold text-gray-300 mb-3">{pcs('silverSponsorPrice', '₹35,000')}</p>
                <div className="space-y-1.5 text-sm text-white/50">
                  {pcList('silverSponsorBenefits', 'Logo on sponsor section, Event promotion mention, Networking access').map((b, i) => (
                    <div key={i} className="flex items-center gap-2"><CheckCircleIcon className="w-4 h-4 text-gray-400 flex-shrink-0" /><span>{b}</span></div>
                  ))}
                </div>
              </div>
            </div>

            <div className="gsap-stagger-child">
              <div className="glass-card rounded-2xl p-5 relative overflow-hidden h-full">
                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-blue-400 to-cyan-400" />
                <RocketLaunchIcon className="w-8 h-8 text-blue-400 mb-2" />
                <h3 className="text-base font-display font-bold text-white mb-1">Startup Partner</h3>
                <p className="text-xl font-display font-bold text-blue-400 mb-3">{pcs('startupPartnerPrice', '₹25,000')}</p>
                <div className="space-y-1.5 text-sm text-white/50">
                  {pcList('startupPartnerBenefits', 'Logo on competition page, Social media mention, Access to startup database').map((b, i) => (
                    <div key={i} className="flex items-center gap-2"><CheckCircleIcon className="w-4 h-4 text-blue-400 flex-shrink-0" /><span>{b}</span></div>
                  ))}
                </div>
              </div>
            </div>

            <div className="gsap-stagger-child">
              <div className="glass-card rounded-2xl p-5 relative overflow-hidden h-full">
                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-green-400 to-emerald-400" />
                <LightBulbIcon className="w-8 h-8 text-green-400 mb-2" />
                <h3 className="text-base font-display font-bold text-white mb-1">Innovation Partner</h3>
                <p className="text-xl font-display font-bold text-green-400 mb-3">{pcs('innovationPartnerPrice', '₹15,000')}</p>
                <div className="space-y-1.5 text-sm text-white/50">
                  {pcList('innovationPartnerBenefits', 'Logo on event website, Social media posts mention').map((b, i) => (
                    <div key={i} className="flex items-center gap-2"><CheckCircleIcon className="w-4 h-4 text-green-400 flex-shrink-0" /><span>{b}</span></div>
                  ))}
                </div>
              </div>
            </div>

            <div className="gsap-stagger-child">
              <div className="glass-card rounded-2xl p-5 relative overflow-hidden h-full">
                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-pink-400 to-rose-400" />
                <HeartIcon className="w-8 h-8 text-pink-400 mb-2" />
                <h3 className="text-base font-display font-bold text-white mb-1">Community Partner</h3>
                <p className="text-xl font-display font-bold text-pink-400 mb-3">{pcs('communityPartnerPrice', '₹10,000')}</p>
                <div className="space-y-1.5 text-sm text-white/50">
                  {pcList('communityPartnerBenefits', 'Brand mention, Website listing').map((b, i) => (
                    <div key={i} className="flex items-center gap-2"><CheckCircleIcon className="w-4 h-4 text-pink-400 flex-shrink-0" /><span>{b}</span></div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ── NEW: High-Value Strategic Packages ── */}
          <div className="gsap-reveal mb-10">
            <div className="text-center mb-8">
              <p className="font-display text-xs tracking-[0.3em] text-amber-400/60 uppercase mb-2">Strategic Partnerships</p>
              <h3 className="text-2xl font-display font-bold text-white mb-2">High-Value Packages</h3>
              <div className="divine-line w-16 mx-auto mb-3" />
              <p className="text-sm text-white/40 max-w-lg mx-auto">Purpose-built partnerships targeting specific departments — engineering, HR, and marketing teams each have separate budgets</p>
            </div>
            <div className="grid md:grid-cols-3 gap-6 gsap-stagger-parent">
              {/* Innovation Track Sponsor */}
              <div className="gsap-stagger-child">
                <div className="glass-card rounded-2xl p-6 relative overflow-hidden h-full">
                  <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-violet-400 via-purple to-indigo-400" />
                  <ComputerDesktopIcon className="w-10 h-10 text-violet-400 mb-3" />
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-display font-bold text-white">Innovation Track Sponsor</h3>
                  </div>
                  <p className="text-2xl font-display font-bold text-violet-400 mb-1">{pcs('trackSponsorPrice', '₹2,00,000 – ₹5,00,000')}</p>
                  <p className="text-xs text-white/30 mb-4">AI Track · Robotics Track · FinTech Track · HealthTech Track</p>
                  <div className="space-y-2 text-sm text-white/50">
                    {['Naming rights for your chosen track', 'Direct access to niche startup talent', 'Judging rights in track finals', 'Track winner announced as \u201c[Your Brand] Award\u201d', 'Dedicated branding in track area', 'Featured company profile on track page'].map((b, i) => (
                      <div key={i} className="flex items-center gap-2"><CheckCircleIcon className="w-4 h-4 text-violet-400 flex-shrink-0" /><span>{b}</span></div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Hiring Partner */}
              <div className="gsap-stagger-child">
                <div className="glass-card rounded-2xl p-6 relative overflow-hidden h-full">
                  <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-400 via-green-400 to-teal-400" />
                  <BriefcaseIcon className="w-10 h-10 text-emerald-400 mb-3" />
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-display font-bold text-white">Hiring Partner</h3>
                    <Badge variant="success">HR Budgets</Badge>
                  </div>
                  <p className="text-2xl font-display font-bold text-emerald-400 mb-1">{pcs('hiringPartnerPrice', '₹3,00,000+')}</p>
                  <p className="text-xs text-white/30 mb-4">Perfect for companies looking to recruit top talent</p>
                  <div className="space-y-2 text-sm text-white/50">
                    {['Full resume database access of all participants', 'On-spot interview booth at venue', 'Branded as Official Hiring Partner', 'Job board placement on event website', 'Priority access to winning teams', 'Talent pipeline for internships & full-time roles'].map((b, i) => (
                      <div key={i} className="flex items-center gap-2"><CheckCircleIcon className="w-4 h-4 text-emerald-400 flex-shrink-0" /><span>{b}</span></div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Digital Reach Sponsor */}
              <div className="gsap-stagger-child">
                <div className="glass-card rounded-2xl p-6 relative overflow-hidden h-full">
                  <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-pink-400 via-rose-400 to-red-400" />
                  <SignalIcon className="w-10 h-10 text-pink-400 mb-3" />
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-display font-bold text-white">Digital Reach Sponsor</h3>
                    <Badge variant="danger">Marketing</Badge>
                  </div>
                  <p className="text-2xl font-display font-bold text-pink-400 mb-1">{pcs('digitalReachPrice', '₹1,00,000 – ₹3,00,000')}</p>
                  <p className="text-xs text-white/30 mb-4">Maximize digital visibility across all platforms</p>
                  <div className="space-y-2 text-sm text-white/50">
                    {['Logo & branding in all Instagram reels & stories', 'YouTube coverage with brand integration', 'Influencer integration & co-created content', 'Branded hashtag campaign', 'Post-event highlight reel with sponsor branding', 'Social media analytics report shared post-event'].map((b, i) => (
                      <div key={i} className="flex items-center gap-2"><CheckCircleIcon className="w-4 h-4 text-pink-400 flex-shrink-0" /><span>{b}</span></div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Special Sponsorship Opportunities */}
          <div className="gsap-reveal">
            <div className="text-center mb-6">
              <h3 className="text-xl font-display font-bold text-white mb-1">Special Partnership Opportunities</h3>
              <p className="text-sm text-white/30">High-value niche partnerships for maximum business growth</p>
            </div>
            <div className="grid sm:grid-cols-3 gap-5 gsap-stagger-parent">
              <div className="gsap-stagger-child">
                <div className="glass-card rounded-2xl p-5 text-center h-full">
                  <div className="w-12 h-12 rounded-full bg-cyan-400/10 flex items-center justify-center mx-auto mb-3">
                    <MicrophoneIcon className="w-6 h-6 text-cyan-400" />
                  </div>
                  <h4 className="font-display font-bold text-white mb-1">🎤 {pcs('stageSponsorTitle', 'Stage Sponsor')}</h4>
                  <p className="text-lg font-display font-bold text-cyan-400 mb-2">{pcs('stageSponsorPrice', '₹40,000')}</p>
                  <p className="text-sm text-white/40">{pcs('stageSponsorDesc', 'Branding on main stage backdrop')}</p>
                </div>
              </div>

              <div className="gsap-stagger-child">
                <div className="glass-card rounded-2xl p-5 text-center h-full">
                  <div className="w-12 h-12 rounded-full bg-red-400/10 flex items-center justify-center mx-auto mb-3">
                    <VideoCameraIcon className="w-6 h-6 text-red-400" />
                  </div>
                  <h4 className="font-display font-bold text-white mb-1">🎥 {pcs('mediaSponsorTitle', 'Media Sponsor')}</h4>
                  <p className="text-lg font-display font-bold text-red-400 mb-2">{pcs('mediaSponsorPrice', '₹30,000')}</p>
                  <p className="text-sm text-white/40">{pcs('mediaSponsorDesc', 'Logo in all videos and livestream')}</p>
                </div>
              </div>

              <div className="gsap-stagger-child">
                <div className="glass-card rounded-2xl p-5 text-center h-full">
                  <div className="w-12 h-12 rounded-full bg-amber-400/10 flex items-center justify-center mx-auto mb-3">
                    <TrophyIcon className="w-6 h-6 text-amber-400" />
                  </div>
                  <h4 className="font-display font-bold text-white mb-1">🏆 {pcs('awardSponsorTitle', 'Award Sponsor')}</h4>
                  <p className="text-lg font-display font-bold text-amber-400 mb-2">{pcs('awardSponsorPrice', '₹20,000')}</p>
                  <p className="text-sm text-white/40">{pcs('awardSponsorDesc', 'Sponsor name on winner trophies')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="section-divider" />

      {/* ===== SPONSOR ROI PROJECTION ===== */}
      <section className="py-20 px-4 sm:px-6 relative">
        <div className="parallax-orb absolute bottom-[10%] right-[5%] w-[400px] h-[400px] bg-amber-500/5 rounded-full blur-[160px]" />
        <div className="max-w-5xl mx-auto">
          <div className="gsap-reveal text-center mb-14">
            <p className="font-display text-xs tracking-[0.3em] text-amber-400/60 uppercase mb-3">Why Partner With Us</p>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-white mb-3 tracking-wide">Your Partnership ROI</h2>
            <div className="divine-line w-24 mx-auto mb-4" />
            <p className="text-white/40 max-w-xl mx-auto">Real numbers, real impact — here&apos;s what your partnership investment translates to</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12 gsap-stagger-parent">
            {[
              { icon: UserGroupIcon, value: '10,000+', label: 'Expected Attendees', sub: 'Students, founders, investors', color: 'amber' },
              { icon: GlobeAltIcon, value: '10,00,000+', label: 'Digital Reach', sub: 'Social media impressions', color: 'sky' },
              { icon: RocketLaunchIcon, value: '500+', label: 'Startups & Ideas', sub: 'Across all innovation tracks', color: 'emerald' },
              { icon: BuildingOffice2Icon, value: '100+', label: 'Colleges & Institutions', sub: 'Pan-India participation', color: 'violet' },
            ].map((stat, i) => (
              <div key={i} className="gsap-stagger-child">
                <div className="glass-card rounded-2xl p-6 text-center h-full">
                  <div className={`w-14 h-14 rounded-2xl bg-${stat.color}-400/10 flex items-center justify-center mx-auto mb-4`}>
                    <stat.icon className={`w-7 h-7 text-${stat.color}-400`} />
                  </div>
                  <p className={`text-3xl font-display font-bold text-${stat.color}-400 mb-1`}>{stat.value}</p>
                  <p className="text-sm font-semibold text-white/70 mb-1">{stat.label}</p>
                  <p className="text-xs text-white/30">{stat.sub}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="gsap-reveal glass-card rounded-2xl p-8 relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-amber-400/50 via-amber-400 to-amber-400/50" />
            <h3 className="text-xl font-display font-bold text-white mb-6 text-center">What Partners Get</h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
              {[
                { icon: '🎯', title: 'Brand Visibility', desc: 'Logo placement across stage, banners, website, certificates, ID cards, and all event media' },
                { icon: '🎤', title: 'Speaking Opportunities', desc: 'Keynote slots, panel discussions, and closing ceremony addresses for premium tiers' },
                { icon: '💼', title: 'Talent Access', desc: 'Direct access to 500+ innovative minds — recruit interns, co-founders, and early employees' },
                { icon: '📊', title: 'Lead Generation', desc: 'QR-based lead capture, attendee database access, and post-event analytics report' },
                { icon: '📱', title: 'Digital Content', desc: 'Branded reels, YouTube coverage, social media posts reaching 10L+ impressions' },
                { icon: '🤝', title: 'Networking', desc: 'VIP access to investor roundtables, founder meetups, and exclusive after-event sessions' },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.02]">
                  <span className="text-2xl flex-shrink-0">{item.icon}</span>
                  <div>
                    <p className="font-semibold text-white/80 mb-1">{item.title}</p>
                    <p className="text-white/40 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="section-divider" />

      {/* ===== REGISTER SECTION ===== */}
      {competition?.currentPhase === 'REGISTRATION' && (
        <section className="py-20 px-4 sm:px-6 relative">
          <div className="max-w-3xl mx-auto gsap-reveal">
            <div className="glass-card rounded-3xl p-8 text-center relative overflow-hidden glow-gold">
              <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-amber-400/50 to-transparent" />
              <RocketLaunchIcon className="w-12 h-12 text-amber-400 mx-auto mb-4" />
              <h2 className="text-2xl font-display font-bold text-white mb-2">
                {registrationLive ? 'Register Your Startup' : 'Registration Opens Soon'}
              </h2>
              <p className="text-white/40 mb-6">
                {registrationLive
                  ? 'Submit your approved startup to compete in the Vishvakarma Innovation Challenge 2026'
                  : `Registration opens on ${formatDate(competition.registrationStart)}. Get your startup ready!`}
              </p>
              {registrationLive ? (
                <Link href={isAuthenticated ? "/competition/dashboard" : "/competition/register"}>
                  <button className="px-8 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-black font-bold rounded-xl text-base hover:from-amber-400 hover:to-amber-500 transition-all shadow-lg shadow-amber-500/25">
                    <RocketLaunchIcon className="w-5 h-5 mr-2 inline" />
                    Prepare Your Startup
                  </button>
                </Link>
              ) : (
                <button disabled className="px-8 py-3 glass text-white/40 font-bold rounded-xl text-base cursor-not-allowed border border-white/10">
                  <RocketLaunchIcon className="w-5 h-5 mr-2 inline" />
                  Prepare Your Startup
                </button>
              )}
              <div className="mt-6 pt-6 border-t border-white/10">
                <p className="text-xs text-white/30">
                  {registrationLive
                    ? <>Registration closes on {formatDate(competition.registrationEnd)} • <span className="text-amber-400 font-medium">{daysLeft(competition.registrationEnd)} days remaining</span></>
                    : <>Registration opens on {formatDate(competition.registrationStart)} • <span className="text-cyan-400 font-medium">{daysLeft(competition.registrationStart)} days to go</span></>}
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ===== VOTING SECTION (Phase 3) ===== */}
      {competition?.currentPhase === 'VOTING' && competition.entries.length > 0 && (
        <section className="py-20 px-4 sm:px-6 relative">
          <div className="max-w-6xl mx-auto">
            <div className="gsap-reveal text-center mb-14">
              <p className="font-display text-xs tracking-[0.3em] text-amber-400/60 uppercase mb-3">Community Power</p>
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-white mb-3 tracking-wide">Vote for Your Favorites</h2>
              <div className="divine-line w-24 mx-auto mb-4" />
              <p className="text-white/40">Support the startups you believe in — every vote counts!</p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 gsap-stagger-parent">
              {competition.entries.map((entry) => (
                <div key={entry.id} className="gsap-stagger-child">
                  <div className="glass-card rounded-2xl overflow-hidden h-full">
                    <div className="h-40 bg-gradient-to-br from-amber-500/10 via-cyan-400/5 to-transparent relative overflow-hidden">
                      {(entry.startup.thumbnail || entry.startup.logo) ? (
                        <img
                          src={entry.startup.thumbnail || entry.startup.logo!}
                          alt={entry.startup.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-4xl font-display font-bold text-amber-400/20">{entry.startup.title[0]}</span>
                        </div>
                      )}
                    </div>
                    <div className="p-5">
                      <Link href={`/startup/${entry.startup.slug}`}>
                        <h3 className="text-lg font-display font-bold text-white hover:text-amber-400 transition-colors mb-1">{entry.startup.title}</h3>
                      </Link>
                      <p className="text-sm text-white/40 mb-3 line-clamp-2">{entry.startup.shortDescription}</p>
                      <div className="flex flex-wrap gap-2 mb-4">
                        <span className="px-2 py-0.5 text-xs rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/15">{entry.startup.category}</span>
                        <span className="px-2 py-0.5 text-xs rounded-full bg-cyan-400/10 text-cyan-400 border border-cyan-400/15">{entry.startup.productStage.replace('_', ' ')}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-white/30">by {entry.startup.founder.firstName} {entry.startup.founder.lastName}</span>
                        </div>
                        <button
                          onClick={() => handleVote(entry.id)}
                          disabled={!isAuthenticated || voting === entry.id}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                            votedEntries.has(entry.id)
                              ? 'bg-amber-500 text-black'
                              : 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/20'
                          } disabled:opacity-50`}
                        >
                          {votedEntries.has(entry.id) ? (
                            <HandThumbUpSolid className="w-4 h-4" />
                          ) : (
                            <HandThumbUpIcon className="w-4 h-4" />
                          )}
                          {entry.upvotes}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ===== JUDGES SECTION ===== */}
      {competition?.judges && competition.judges.length > 0 && (
        <section className="py-20 px-4 sm:px-6 relative">
          <div className="max-w-5xl mx-auto">
            <div className="gsap-reveal text-center mb-14">
              <p className="font-display text-xs tracking-[0.3em] text-amber-400/60 uppercase mb-3">Expert Panel</p>
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-white mb-3 tracking-wide">Our Judges</h2>
              <div className="divine-line w-24 mx-auto mb-4" />
              <p className="text-white/40">Industry leaders evaluating your innovations</p>
            </div>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 gsap-stagger-parent">
              {competition.judges.map((judge) => (
                <div key={judge.id} className="gsap-stagger-child">
                  <div className="glass-card rounded-2xl p-5 text-center">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-400/20 to-cyan-400/20 flex items-center justify-center mx-auto mb-3 overflow-hidden">
                      {judge.avatar ? (
                        <img src={judge.avatar} alt={judge.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xl font-display font-bold text-amber-400">{judge.name[0]}</span>
                      )}
                    </div>
                    <p className="font-display font-semibold text-white">{judge.name}</p>
                    <p className="text-xs text-white/40">{judge.title}</p>
                    <p className="text-xs text-amber-400">{judge.organization}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <div className="section-divider" />

      {/* ===== EVENT TIMELINE ===== */}
      <section className="py-24 px-4 sm:px-6 relative overflow-hidden">
        <div className="parallax-orb absolute top-[30%] left-0 w-[400px] h-[400px] bg-amber-500/5 rounded-full blur-[150px]" />
        <div className="parallax-orb absolute top-[50%] right-0 w-[400px] h-[400px] bg-cyan-400/5 rounded-full blur-[150px]" />

        <div className="relative max-w-5xl mx-auto">
          <div className="gsap-reveal text-center mb-16">
            <p className="font-display text-xs tracking-[0.3em] text-amber-400/60 uppercase mb-3">📅 Mark Your Calendar</p>
            <h2 className="font-display text-3xl sm:text-4xl font-black text-white mb-3 tracking-wide">Event Timeline</h2>
            <div className="divine-line w-24 mx-auto mb-4" />
            <p className="text-white/40 max-w-xl mx-auto">From registration to the grand finale — here&apos;s your roadmap to innovation glory.</p>
          </div>

          {/* Desktop Timeline */}
          <div className="hidden md:block relative gsap-reveal">
            {/* Central Line */}
            <div className="absolute left-1/2 top-0 bottom-0 w-0.5 -translate-x-1/2 bg-gradient-to-b from-amber-400/40 via-amber-400/20 to-cyan-400/10" />

            {competition && [
              { label: 'Registration Opens', date: competition.registrationStart, phase: 'REGISTRATION', icon: '🚀', desc: 'Submit your startup and secure your spot' },
              { label: 'Registration Closes', date: competition.registrationEnd, phase: 'REGISTRATION', icon: '⏰', desc: 'Last chance to register — don\'t miss out!' },
              { label: 'Screening Complete', date: competition.screeningEnd, phase: 'SCREENING', icon: '🔍', desc: 'Expert jury reviews all submissions' },
              { label: 'Public Voting Ends', date: competition.votingEnd, phase: 'VOTING', icon: '🗳️', desc: 'Community votes for the best startups' },
              { label: 'Grand Finale', date: competition.finalsDate, phase: 'FINALS', icon: '🏆', desc: 'Live pitch day in Tirupati — winners announced!' },
            ].map((item, i) => {
              const isPast = new Date(item.date) < new Date();
              const isCurrent = item.phase === competition.currentPhase;
              const isLeft = i % 2 === 0;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: isLeft ? -40 : 40 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  viewport={{ once: true }}
                  className={`relative flex items-center mb-12 last:mb-0 ${isLeft ? 'justify-start' : 'justify-end'}`}
                >
                  {/* Center dot */}
                  <div className="absolute left-1/2 -translate-x-1/2 z-10">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl shadow-lg border-2 ${
                      isPast ? 'bg-green-400/20 border-green-400 shadow-green-400/20' :
                      isCurrent ? 'bg-amber-400/20 border-amber-400 shadow-amber-400/20' :
                      'bg-[#0A0F1E] border-white/10'
                    }`}>
                      {isPast ? <CheckCircleIcon className="w-6 h-6 text-green-400" /> : <span>{item.icon}</span>}
                    </div>
                  </div>

                  {/* Card */}
                  <div className={`w-[calc(50%-3rem)] ${isLeft ? 'pr-4 text-right' : 'pl-4 ml-auto text-left'}`}>
                    <div className={`glass-card p-5 rounded-2xl transition-all hover:scale-[1.02] ${
                      isCurrent ? '!border-amber-400/30 glow-gold' :
                      isPast ? '!border-green-400/20' : ''
                    }`}>
                      <p className={`text-sm font-display font-bold uppercase tracking-wider mb-1 ${
                        isCurrent ? 'text-amber-400' : isPast ? 'text-green-400' : 'text-white/30'
                      }`}>{item.label}</p>
                      <p className="text-lg font-bold text-white">{formatDate(item.date)}</p>
                      <p className="text-xs text-white/40 mt-1">{item.desc}</p>
                      {isCurrent && (
                        <span className="inline-block mt-2 px-2 py-0.5 rounded-full text-[10px] font-display font-bold uppercase tracking-wider bg-amber-400/20 text-amber-400 border border-amber-400/30 animate-pulse">
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
          <div className="md:hidden space-y-0 gsap-reveal">
            {competition && [
              { label: 'Registration Opens', date: competition.registrationStart, phase: 'REGISTRATION', icon: '🚀', desc: 'Submit your startup and secure your spot' },
              { label: 'Registration Closes', date: competition.registrationEnd, phase: 'REGISTRATION', icon: '⏰', desc: 'Last chance to register — don\'t miss out!' },
              { label: 'Screening Complete', date: competition.screeningEnd, phase: 'SCREENING', icon: '🔍', desc: 'Expert jury reviews all submissions' },
              { label: 'Public Voting Ends', date: competition.votingEnd, phase: 'VOTING', icon: '🗳️', desc: 'Community votes for the best startups' },
              { label: 'Grand Finale', date: competition.finalsDate, phase: 'FINALS', icon: '🏆', desc: 'Live pitch day in Tirupati — winners announced!' },
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
                  className="flex gap-4 items-start"
                >
                  <div className="flex flex-col items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-base border-2 flex-shrink-0 ${
                      isPast ? 'bg-green-400/20 border-green-400' :
                      isCurrent ? 'bg-amber-400/20 border-amber-400' :
                      'bg-[#0A0F1E] border-white/10'
                    }`}>
                      {isPast ? <CheckCircleIcon className="w-5 h-5 text-green-400" /> : <span>{item.icon}</span>}
                    </div>
                    {i < 4 && <div className={`w-0.5 h-16 ${isPast ? 'bg-gradient-to-b from-green-400/40 to-green-400/10' : isCurrent ? 'bg-gradient-to-b from-amber-400/40 to-amber-400/10' : 'bg-white/10'}`} />}
                  </div>
                  <div className="pb-6 pt-1">
                    <p className={`font-display font-bold text-sm uppercase tracking-wider ${isCurrent ? 'text-amber-400' : isPast ? 'text-green-400' : 'text-white/30'}`}>{item.label}</p>
                    <p className="text-base font-semibold text-white">{formatDate(item.date)}</p>
                    <p className="text-xs text-white/40 mt-0.5">{item.desc}</p>
                    {isCurrent && (
                      <span className="inline-block mt-1.5 px-2 py-0.5 rounded-full text-[10px] font-display font-bold uppercase tracking-wider bg-amber-400/20 text-amber-400 border border-amber-400/30 animate-pulse">
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

      <div className="section-divider" />

      {/* ===== SPONSOR LOGOS MARQUEE ===== */}
      {competition && (() => {
        const sponsorsWithLogo = competition.sponsors.filter(s => s.logo);
        if (sponsorsWithLogo.length === 0) return null;
        const shouldScroll = sponsorsWithLogo.length > 4;
        return (
          <section className="py-20 px-4 sm:px-6 relative overflow-hidden">
            <div className="relative max-w-6xl mx-auto">
              <div className="gsap-reveal text-center mb-10">
                <p className="font-display text-xs tracking-[0.3em] text-amber-400/60 uppercase mb-3">🤝 Our Sponsors</p>
                <h2 className="font-display text-3xl sm:text-4xl font-black text-white mb-2 tracking-wide">Powered By</h2>
                <div className="divine-line w-24 mx-auto mb-4" />
                <p className="text-white/40 max-w-lg mx-auto text-sm">Backed by visionary organizations fueling India&apos;s innovation ecosystem.</p>
              </div>
              {shouldScroll ? (
                <div className="relative overflow-hidden">
                  <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-[#050A15] to-transparent z-10" />
                  <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-[#050A15] to-transparent z-10" />
                  <div className="flex animate-marquee gap-12 items-center">
                    {[...sponsorsWithLogo, ...sponsorsWithLogo].map((sponsor, i) => (
                      <div key={`sponsor-${i}`} className="flex-shrink-0 group">
                        <div className="w-36 h-20 sm:w-44 sm:h-24 rounded-2xl glass-card flex items-center justify-center p-4">
                          <img src={sponsor.logo!} alt={sponsor.name} className="max-w-full max-h-full object-contain filter brightness-90 group-hover:brightness-110 transition-all" />
                        </div>
                        <p className="text-[10px] text-white/30 text-center mt-2 font-medium uppercase tracking-wider">{sponsor.name}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap justify-center gap-8 gsap-stagger-parent">
                  {sponsorsWithLogo.map((sponsor) => (
                    <div key={sponsor.id} className="group gsap-stagger-child">
                      <div className="w-36 h-20 sm:w-44 sm:h-24 rounded-2xl glass-card flex items-center justify-center p-4">
                        <img src={sponsor.logo!} alt={sponsor.name} className="max-w-full max-h-full object-contain filter brightness-90 group-hover:brightness-110 transition-all" />
                      </div>
                      <p className="text-[10px] text-white/30 text-center mt-2 font-medium uppercase tracking-wider">{sponsor.name}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        );
      })()}

      {/* ===== CAMPUS PARTNERS MARQUEE ===== */}
      {competition && competition.campusPartners && (() => {
        const partnersWithLogo = competition.campusPartners.filter(cp => cp.logo);
        if (partnersWithLogo.length === 0) return null;
        const shouldScroll = partnersWithLogo.length > 4;
        const renderPartnerCard = (partner: CampusPartnerData) => {
          const card = (
            <div className="w-36 h-20 sm:w-44 sm:h-24 rounded-2xl glass-card flex items-center justify-center p-4">
              <img src={partner.logo!} alt={partner.name} className="max-w-full max-h-full object-contain filter brightness-90 group-hover:brightness-110 transition-all" />
            </div>
          );
          return partner.website ? <a href={partner.website} target="_blank" rel="noopener noreferrer">{card}</a> : card;
        };
        return (
          <section className="py-20 px-4 sm:px-6 relative overflow-hidden">
            <div className="relative max-w-6xl mx-auto">
              <div className="gsap-reveal text-center mb-10">
                <p className="font-display text-xs tracking-[0.3em] text-amber-400/60 uppercase mb-3">🏛️ Campus Partners</p>
                <h2 className="font-display text-3xl sm:text-4xl font-black text-white mb-2 tracking-wide">Campus Network</h2>
                <div className="divine-line w-24 mx-auto mb-4" />
                <p className="text-white/40 max-w-lg mx-auto text-sm">Leading institutions empowering the next generation of innovators.</p>
              </div>
              {shouldScroll ? (
                <div className="relative overflow-hidden">
                  <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-[#050A15] to-transparent z-10" />
                  <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-[#050A15] to-transparent z-10" />
                  <div className="flex animate-marquee-slow gap-12 items-center">
                    {[...partnersWithLogo, ...partnersWithLogo].map((partner, i) => (
                      <div key={`partner-${i}`} className="flex-shrink-0 group">
                        {renderPartnerCard(partner)}
                        <p className="text-[10px] text-white/30 text-center mt-2 font-medium uppercase tracking-wider">{partner.name}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap justify-center gap-8 gsap-stagger-parent">
                  {partnersWithLogo.map((partner) => (
                    <div key={partner.id} className="group gsap-stagger-child">
                      {renderPartnerCard(partner)}
                      <p className="text-[10px] text-white/30 text-center mt-2 font-medium uppercase tracking-wider">{partner.name}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        );
      })()}

      <div className="section-divider" />

      {/* ===== FINAL CTA — CINEMATIC ===== */}
      <section className="py-24 px-4 sm:px-6 mb-16 relative overflow-hidden">
        <div className="absolute inset-0 hero-cinematic" />
        <div className="parallax-orb absolute bottom-0 left-1/3 w-[500px] h-[400px] bg-amber-500/8 rounded-full blur-[150px]" />
        <div className="parallax-orb absolute bottom-0 right-1/3 w-[500px] h-[400px] bg-cyan-400/6 rounded-full blur-[150px]" />

        <div className="relative max-w-4xl mx-auto text-center gsap-reveal">
          <motion.div
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="inline-block mb-6"
          >
            <FireIcon className="w-16 h-16 text-amber-400" />
          </motion.div>

          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-black text-white mb-4 tracking-wide">
            {pcs('ctaTitle', "Don't Just Watch.")}{' '}
            <span className="gradient-gold">{pcs('ctaHighlight', 'Be Part of It.')}</span>
          </h2>

          <p className="text-lg sm:text-xl text-white/40 mb-3 max-w-2xl mx-auto">
            {pcs('ctaDescription', "This is more than a competition \u2014 it's a movement. Join the next generation of Indian innovators and put your startup on the national map.")}
          </p>

          {competition?.currentPhase === 'REGISTRATION' && (
            <motion.p
              animate={{ opacity: [1, 0.5, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-lg font-display font-bold text-amber-400 mb-8"
            >
              {registrationLive
                ? `⚡ Hurry! Only ${countdown.days} days, ${countdown.hours} hours left to register!`
                : `🚀 Registration opens in ${countdown.days} days, ${countdown.hours} hours!`}
            </motion.p>
          )}

          <div className="flex flex-wrap gap-4 justify-center mb-8">
            {competition?.currentPhase === 'REGISTRATION' && registrationLive ? (
              <>
                <Link href="/competition/register">
                  <button className="group px-8 py-4 bg-gradient-to-r from-amber-500 to-amber-600 text-black font-bold rounded-xl text-base hover:from-amber-400 hover:to-amber-500 transition-all shadow-lg shadow-amber-500/30 hover:shadow-amber-500/50 hover:scale-105 transform">
                    <span className="flex items-center gap-2">
                      <RocketLaunchIcon className="w-5 h-5" />
                      Register Now — From ₹199 Only
                      <ArrowRightIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </button>
                </Link>
                <Link href="/competition/login">
                  <button className="px-8 py-4 glass text-white font-semibold rounded-xl text-base hover:bg-white/10 transition-all border border-white/10 hover:border-amber-400/30">
                    Already Registered? Login
                  </button>
                </Link>
              </>
            ) : competition?.currentPhase === 'REGISTRATION' && !registrationLive ? (
              <>
                <button disabled className="px-8 py-4 bg-white/5 text-white/40 font-bold rounded-xl text-base cursor-not-allowed border border-white/10">
                  <span className="flex items-center gap-2">
                    <ClockIcon className="w-5 h-5" />
                    Registration Opens Soon
                  </span>
                </button>
              </>
            ) : (
              <Link href="/explore">
                <button className="px-8 py-4 bg-gradient-to-r from-amber-500 to-amber-600 text-black font-bold rounded-xl text-base hover:from-amber-400 hover:to-amber-500 transition-all shadow-lg shadow-amber-500/25">
                  Explore Startups
                </button>
              </Link>
            )}
          </div>

          <p className="text-sm text-white/30">
            {pcs('ctaFooter', "No idea is too small. No dream is too big.")} <span className="text-amber-400 font-semibold">{pcs('ctaFooterHighlight', "We're waiting for you.")}</span>
          </p>

          <div className="mt-8 pt-6 border-t border-white/5">
            <p className="text-sm text-white/30">
              Vishvakarma Hub Platform &amp; Event is conducted by{' '}
              <span className="gradient-gold font-bold">Trinetrashakti Innovations Private Limited</span>
            </p>
            <p className="text-xs text-white/20 mt-1">
              📍 Event Venue: <span className="text-amber-400 font-medium">Tirupati, Andhra Pradesh, India</span>
            </p>
            <p className="text-xs text-white/20 mt-1">
              Recognized by <span className="text-green-400 font-semibold">Startup India</span>, Government of India
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
