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
  entries: CompetitionEntryData[];
  judges: JudgeData[];
  sponsors: SponsorData[];
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

interface UserStartup {
  id: string;
  title: string;
  slug: string;
  status: string;
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
  const [userStartups, setUserStartups] = useState<UserStartup[]>([]);
  const [registeredStartups, setRegisteredStartups] = useState<Set<string>>(new Set());
  const [votedEntries, setVotedEntries] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState<string | null>(null);
  const [voting, setVoting] = useState<string | null>(null);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    fetchCompetition();
  }, []);

  useEffect(() => {
    if (!competition?.registrationEnd) return;
    const tick = () => {
      const diff = new Date(competition.registrationEnd).getTime() - Date.now();
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
  }, [competition?.registrationEnd]);

  useEffect(() => {
    if (isAuthenticated && token) {
      fetchUserStartups();
    }
  }, [isAuthenticated, token]);

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

  const fetchUserStartups = async () => {
    try {
      const res = await fetch('/api/startups?founder=me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        const approved = data.data.filter((s: UserStartup) => s.status === 'APPROVED' || s.status === 'ACTIVE');
        setUserStartups(approved);
      }
    } catch (error) {
      console.error('Failed to fetch user startups:', error);
    }
  };

  const registerStartup = async (startupId: string) => {
    if (!token) return;
    setRegistering(startupId);
    setMessage({ text: '', type: '' });
    try {
      const res = await fetch('/api/competition', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ startupId }),
      });
      const data = await res.json();
      if (data.success) {
        setRegisteredStartups((prev) => new Set(prev).add(startupId));
        setMessage({ text: 'Startup registered successfully!', type: 'success' });
        fetchCompetition();
      } else {
        setMessage({ text: data.error || 'Registration failed', type: 'error' });
      }
    } catch {
      setMessage({ text: 'Network error', type: 'error' });
    } finally {
      setRegistering(null);
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
  const phaseInfo = phase ? PHASE_INFO[phase] : PHASE_INFO.REGISTRATION;

  return (
    <div className="min-h-screen">
      {/* Floating Invitation Banner */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-r from-purple via-blue to-cyan-500 py-3 px-4 text-center shadow-2xl shadow-purple/20">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4">
          <div className="flex items-center gap-2">
            <MegaphoneIcon className="w-5 h-5 text-white animate-bounce" />
            <span className="text-white font-bold text-sm sm:text-base">
              You&apos;re Invited! India&apos;s Biggest Startup Competition is LIVE
            </span>
          </div>
          <Link href="/submit-idea">
            <button className="px-5 py-1.5 bg-white text-purple font-bold rounded-full text-sm hover:bg-white/90 transition-colors whitespace-nowrap">
              Register Now — It&apos;s Almost Free!
            </button>
          </Link>
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative pt-24 pb-20 overflow-hidden">
        {/* Animated background effects */}
        <div className="absolute inset-0 bg-gradient-to-b from-purple/10 via-blue/5 to-transparent" />
        <div className="absolute top-10 left-1/4 w-[500px] h-[500px] bg-purple/15 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-blue/15 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute top-40 right-10 w-[300px] h-[300px] bg-cyan-400/10 rounded-full blur-[100px]" />
        {/* Floating particles */}
        <div className="absolute top-32 left-[10%] w-2 h-2 bg-purple rounded-full animate-ping" />
        <div className="absolute top-48 right-[15%] w-2 h-2 bg-blue rounded-full animate-ping" style={{ animationDelay: '0.5s' }} />
        <div className="absolute top-64 left-[60%] w-1.5 h-1.5 bg-cyan-400 rounded-full animate-ping" style={{ animationDelay: '1s' }} />
        <div className="absolute top-28 left-[75%] w-1.5 h-1.5 bg-yellow-400 rounded-full animate-ping" style={{ animationDelay: '1.5s' }} />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            {/* Live badge */}
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-purple/20 to-blue/20 border border-purple/30 text-purple text-sm font-bold mb-6 backdrop-blur-sm"
            >
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
              </span>
              Registrations Open — Join Now!
            </motion.div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-foreground mb-6 leading-[1.1] tracking-tight">
              <motion.span initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                India&apos;s Biggest
              </motion.span>
              <br />
              <motion.span
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-gradient-to-r from-purple via-blue to-cyan-400 bg-clip-text text-transparent"
              >
                Startup Competition
              </motion.span>
            </h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="text-xl sm:text-2xl text-muted max-w-3xl mx-auto mb-4"
            >
              We invite <span className="text-foreground font-semibold">students, founders, engineers, and innovators</span> from
              every corner of India to showcase their groundbreaking ideas on the national stage.
            </motion.p>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="text-lg text-purple font-medium mb-10 italic"
            >
              &ldquo;Your idea deserves the spotlight. This is your moment.&rdquo;
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 }}
              className="flex flex-wrap gap-4 justify-center mb-12"
            >
              <Link href="/submit-idea">
                <Button size="lg">
                  <FireIcon className="w-5 h-5 mr-2 inline" />
                  Register Your Startup
                  <ArrowRightIcon className="w-4 h-4 ml-2 inline" />
                </Button>
              </Link>
              <Link href="/signup">
                <Button variant="outline" size="lg">
                  Create Free Account
                </Button>
              </Link>
            </motion.div>

            {/* Countdown Timer */}
            {competition?.currentPhase === 'REGISTRATION' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.2 }}
                className="mb-12"
              >
                <p className="text-sm font-semibold text-muted uppercase tracking-widest mb-4">Registration Closes In</p>
                <div className="flex justify-center gap-3 sm:gap-5">
                  {[
                    { value: countdown.days, label: 'Days' },
                    { value: countdown.hours, label: 'Hours' },
                    { value: countdown.minutes, label: 'Minutes' },
                    { value: countdown.seconds, label: 'Seconds' },
                  ].map((t) => (
                    <div
                      key={t.label}
                      className="bg-gradient-to-b from-card to-card/50 border border-border/50 rounded-2xl px-4 sm:px-6 py-3 sm:py-4 backdrop-blur-sm min-w-[72px]"
                    >
                      <p className="text-3xl sm:text-4xl font-black bg-gradient-to-b from-foreground to-muted bg-clip-text text-transparent">
                        {String(t.value).padStart(2, '0')}
                      </p>
                      <p className="text-[10px] sm:text-xs text-muted font-medium uppercase tracking-wider">{t.label}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Phase badge */}
            {competition && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.4 }}>
                <div className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full border text-sm font-semibold ${phaseInfo.bg} ${phaseInfo.color}`}>
                  <SparklesIcon className="w-4 h-4" />
                  {phaseInfo.label}
                </div>
              </motion.div>
            )}
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-14 max-w-4xl mx-auto"
          >
            {[
              { label: 'Registrations', value: competition?._count?.entries || 0, icon: RocketLaunchIcon, color: 'text-purple' },
              { label: 'Top Selected', value: 200, icon: StarIcon, color: 'text-yellow-400' },
              { label: 'Finalists', value: 20, icon: TrophyIcon, color: 'text-orange-400' },
              { label: 'Pitch Duration', value: '5 min', icon: ClockIcon, color: 'text-blue' },
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + i * 0.1 }}
              >
                <Card className="p-5 text-center border border-border/50 hover:border-purple/30 transition-all hover:shadow-lg hover:shadow-purple/5">
                  <stat.icon className={`w-7 h-7 ${stat.color} mx-auto mb-2`} />
                  <p className="text-3xl font-black text-foreground">{stat.value}</p>
                  <p className="text-xs text-muted font-medium">{stat.label}</p>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Invitation Message Banner */}
      <section className="py-12 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="relative bg-gradient-to-r from-purple/10 via-blue/10 to-cyan-400/10 rounded-3xl p-8 sm:p-12 border border-purple/20 overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-40 h-40 bg-purple/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-0 w-40 h-40 bg-blue/10 rounded-full blur-3xl" />
            <div className="relative text-center">
              <HeartIcon className="w-10 h-10 text-purple mx-auto mb-4" />
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">
                Dear Innovators, This is <span className="text-purple">Your Invitation</span>
              </h2>
              <p className="text-lg text-muted max-w-3xl mx-auto mb-4 leading-relaxed">
                Whether you&apos;re a college student with a brilliant idea, a founder building the next big thing,
                or an engineer who wants to solve real problems — <span className="text-foreground font-semibold">Vishvakarma Innovation Challenge 2026</span> is
                the platform where your startup journey begins.
              </p>
              <p className="text-base text-muted max-w-2xl mx-auto mb-6">
                We believe <span className="text-purple font-medium">every idea matters</span>. No matter how big or small,
                your innovation can change the world. Join thousands of dreamers who are turning ideas into reality.
              </p>
              <div className="flex flex-wrap justify-center gap-6 text-sm">
                <div className="flex items-center gap-2 text-green-400">
                  <CheckCircleIcon className="w-5 h-5" />
                  <span>Open to all Indians</span>
                </div>
                <div className="flex items-center gap-2 text-green-400">
                  <CheckCircleIcon className="w-5 h-5" />
                  <span>Starting at just ₹199</span>
                </div>
                <div className="flex items-center gap-2 text-green-400">
                  <CheckCircleIcon className="w-5 h-5" />
                  <span>National stage exposure</span>
                </div>
                <div className="flex items-center gap-2 text-green-400">
                  <CheckCircleIcon className="w-5 h-5" />
                  <span>Meet investors & mentors</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Prizes & Rewards */}
      <section className="py-16 px-4 sm:px-6 bg-gradient-to-b from-transparent via-yellow-400/5 to-transparent">
        <div className="max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-3">What You Win</h2>
            <p className="text-muted max-w-xl mx-auto">More than just prizes — a launchpad for your startup career</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6 mb-8">
            {/* 1st Place */}
            <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <Card className="p-6 text-center border-yellow-400/30 relative overflow-hidden h-full">
                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-yellow-400 to-orange-400" />
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-yellow-400/20 to-orange-400/20 flex items-center justify-center mx-auto mb-4">
                  <TrophyIcon className="w-8 h-8 text-yellow-400" />
                </div>
                <Badge variant="warning">1st Place</Badge>
                <h3 className="text-2xl font-black text-foreground mt-3 mb-2">Grand Winner</h3>
                <p className="text-sm text-muted mb-4">The top startup takes it all</p>
                <div className="space-y-2 text-sm text-left">
                  <div className="flex items-center gap-2 text-yellow-400"><StarIcon className="w-4 h-4 flex-shrink-0" /><span className="text-foreground">Cash prize + Trophy</span></div>
                  <div className="flex items-center gap-2 text-yellow-400"><StarIcon className="w-4 h-4 flex-shrink-0" /><span className="text-foreground">Investor pitch meetings</span></div>
                  <div className="flex items-center gap-2 text-yellow-400"><StarIcon className="w-4 h-4 flex-shrink-0" /><span className="text-foreground">1-year incubation support</span></div>
                  <div className="flex items-center gap-2 text-yellow-400"><StarIcon className="w-4 h-4 flex-shrink-0" /><span className="text-foreground">Media & PR coverage</span></div>
                </div>
              </Card>
            </motion.div>

            {/* 2nd Place */}
            <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <Card className="p-6 text-center border-gray-300/30 relative overflow-hidden h-full">
                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-gray-300 to-gray-400" />
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gray-300/20 to-gray-400/20 flex items-center justify-center mx-auto mb-4">
                  <TrophyIcon className="w-8 h-8 text-gray-300" />
                </div>
                <Badge variant="default">2nd Place</Badge>
                <h3 className="text-2xl font-black text-foreground mt-3 mb-2">Runner Up</h3>
                <p className="text-sm text-muted mb-4">Outstanding innovation runner</p>
                <div className="space-y-2 text-sm text-left">
                  <div className="flex items-center gap-2 text-gray-400"><StarIcon className="w-4 h-4 flex-shrink-0" /><span className="text-foreground">Cash prize + Trophy</span></div>
                  <div className="flex items-center gap-2 text-gray-400"><StarIcon className="w-4 h-4 flex-shrink-0" /><span className="text-foreground">Mentorship program</span></div>
                  <div className="flex items-center gap-2 text-gray-400"><StarIcon className="w-4 h-4 flex-shrink-0" /><span className="text-foreground">Networking access</span></div>
                </div>
              </Card>
            </motion.div>

            {/* 3rd Place */}
            <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <Card className="p-6 text-center border-orange-700/30 relative overflow-hidden h-full">
                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-orange-600 to-orange-700" />
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-600/20 to-orange-700/20 flex items-center justify-center mx-auto mb-4">
                  <TrophyIcon className="w-8 h-8 text-orange-600" />
                </div>
                <Badge variant="info">3rd Place</Badge>
                <h3 className="text-2xl font-black text-foreground mt-3 mb-2">Second Runner Up</h3>
                <p className="text-sm text-muted mb-4">Remarkable innovation</p>
                <div className="space-y-2 text-sm text-left">
                  <div className="flex items-center gap-2 text-orange-600"><StarIcon className="w-4 h-4 flex-shrink-0" /><span className="text-foreground">Cash prize + Trophy</span></div>
                  <div className="flex items-center gap-2 text-orange-600"><StarIcon className="w-4 h-4 flex-shrink-0" /><span className="text-foreground">Platform spotlight</span></div>
                  <div className="flex items-center gap-2 text-orange-600"><StarIcon className="w-4 h-4 flex-shrink-0" /><span className="text-foreground">Certificate of excellence</span></div>
                </div>
              </Card>
            </motion.div>
          </div>

          {/* All Participants Benefits */}
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}>
            <Card className="p-6 border-purple/20">
              <div className="text-center mb-4">
                <GlobeAltIcon className="w-8 h-8 text-purple mx-auto mb-2" />
                <h3 className="text-lg font-bold text-foreground">Every Participant Gets</h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center text-sm">
                {[
                  { icon: AcademicCapIcon, label: 'Certificate of Participation' },
                  { icon: UserGroupIcon, label: 'Networking with Founders' },
                  { icon: BoltIcon, label: 'Startup Visibility' },
                  { icon: SparklesIcon, label: 'Mentorship Access' },
                ].map((b, i) => (
                  <div key={i} className="flex flex-col items-center gap-2 p-3 rounded-xl bg-purple/5">
                    <b.icon className="w-6 h-6 text-purple" />
                    <span className="text-muted font-medium text-xs">{b.label}</span>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Competition Phases Timeline */}
      <section className="py-16 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-3">Competition Phases</h2>
            <p className="text-muted max-w-xl mx-auto">From registration to the final pitch — here&apos;s how the competition works</p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Phase 1 */}
            <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }}>
              <Card className={`p-6 h-full border-l-4 ${phase === 'REGISTRATION' ? 'border-l-green-400' : 'border-l-border'}`}>
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${phase === 'REGISTRATION' ? 'bg-green-400/10 text-green-400' : 'bg-card text-muted'}`}>
                    <RocketLaunchIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-bold text-foreground">Phase 1 — Startup Registration</h3>
                      {phase === 'REGISTRATION' && <Badge variant="success">ACTIVE</Badge>}
                    </div>
                    <p className="text-xs text-muted mb-3">Duration: 30 days{competition && ` (${formatDate(competition.registrationStart)} – ${formatDate(competition.registrationEnd)})`}</p>
                    <p className="text-sm text-muted mb-3">Open to students, engineers, founders, innovators, and researchers. Submit your startup via the Vishvakarma Hub startup wizard.</p>
                    <div className="text-xs text-muted">
                      <span className="font-medium text-foreground">Required:</span> Startup idea, problem statement, solution, market potential, product stage
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>

            {/* Phase 2 */}
            <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }}>
              <Card className={`p-6 h-full border-l-4 ${phase === 'SCREENING' ? 'border-l-yellow-400' : 'border-l-border'}`}>
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${phase === 'SCREENING' ? 'bg-yellow-400/10 text-yellow-400' : 'bg-card text-muted'}`}>
                    <ChartBarIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-bold text-foreground">Phase 2 — Manual + Jury Screening</h3>
                      {phase === 'SCREENING' && <Badge variant="warning">ACTIVE</Badge>}
                    </div>
                    <p className="text-xs text-muted mb-3">Top 200 startups selected</p>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {[
                        { label: 'Innovation', weight: '30%' },
                        { label: 'Market Potential', weight: '30%' },
                        { label: 'Execution Feasibility', weight: '20%' },
                        { label: 'Impact', weight: '20%' },
                      ].map((c) => (
                        <div key={c.label} className="flex justify-between px-3 py-1.5 rounded-lg bg-background/50">
                          <span className="text-muted text-xs">{c.label}</span>
                          <span className="text-foreground font-semibold text-xs">{c.weight}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>

            {/* Phase 3 */}
            <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }}>
              <Card className={`p-6 h-full border-l-4 ${phase === 'VOTING' ? 'border-l-blue-400' : 'border-l-border'}`}>
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${phase === 'VOTING' ? 'bg-blue-400/10 text-blue-400' : 'bg-card text-muted'}`}>
                    <HandThumbUpIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-bold text-foreground">Phase 3 — Public Voting</h3>
                      {phase === 'VOTING' && <Badge variant="info">ACTIVE</Badge>}
                    </div>
                    <p className="text-xs text-muted mb-3">Community-driven engagement{competition && ` (Ends: ${formatDate(competition.votingEnd)})`}</p>
                    <p className="text-sm text-muted mb-2">Top startups are displayed publicly. The community can support through:</p>
                    <div className="flex flex-wrap gap-2">
                      {['Upvotes', 'Comments', 'Bookmarking', 'Funding Interest'].map((a) => (
                        <span key={a} className="px-2 py-1 text-xs rounded-full bg-blue/10 text-blue border border-blue/20">{a}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>

            {/* Phase 4 */}
            <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }}>
              <Card className={`p-6 h-full border-l-4 ${phase === 'FINALS' ? 'border-l-purple-400' : 'border-l-border'}`}>
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${phase === 'FINALS' ? 'bg-purple/10 text-purple' : 'bg-card text-muted'}`}>
                    <PresentationChartBarIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-bold text-foreground">Phase 4 — Final Pitch Round</h3>
                      {phase === 'FINALS' && <Badge variant="info">ACTIVE</Badge>}
                    </div>
                    <p className="text-xs text-muted mb-3">Top 20 startups present online{competition && ` (${formatDate(competition.finalsDate)})`}</p>
                    <p className="text-sm text-muted mb-2">5-minute pitch to a panel of judges:</p>
                    <div className="flex flex-wrap gap-2">
                      {['Founders', 'Investors', 'Industry Experts'].map((j) => (
                        <span key={j} className="px-2 py-1 text-xs rounded-full bg-purple/10 text-purple border border-purple/20">{j}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Who Can Participate */}
      <section className="py-16 px-4 sm:px-6 bg-gradient-to-b from-transparent via-purple/5 to-transparent">
        <div className="max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-3">Who Can Participate?</h2>
            <p className="text-muted">Open to all innovators across India</p>
          </motion.div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {[
              { label: 'Students', icon: AcademicCapIcon, desc: 'College & university students' },
              { label: 'Engineers', icon: RocketLaunchIcon, desc: 'Technical professionals' },
              { label: 'Founders', icon: LightBulbIcon, desc: 'Early-stage founders' },
              { label: 'Innovators', icon: SparklesIcon, desc: 'Creative problem solvers' },
              { label: 'Researchers', icon: ChartBarIcon, desc: 'Academic researchers' },
            ].map((p, i) => (
              <motion.div key={p.label} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                <Card className="p-4 text-center h-full hover:border-purple/30 transition-colors">
                  <p.icon className="w-8 h-8 text-purple mx-auto mb-2" />
                  <p className="text-sm font-semibold text-foreground">{p.label}</p>
                  <p className="text-xs text-muted mt-1">{p.desc}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Participation Fees */}
      <section className="py-16 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-3">Participation Fees</h2>
            <p className="text-muted max-w-xl mx-auto">Affordable entry for students and founders alike</p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}>
              <Card className="p-6 text-center border-blue/20 hover:border-blue/40 transition-colors h-full">
                <AcademicCapIcon className="w-12 h-12 text-blue mx-auto mb-4" />
                <h3 className="text-lg font-bold text-foreground mb-2">Student</h3>
                <p className="text-3xl font-bold text-blue mb-2">₹{competition?.studentFee || 199}</p>
                <p className="text-sm text-muted">Valid college/university ID required</p>
                <div className="mt-4 space-y-2 text-sm text-muted text-left">
                  <div className="flex items-center gap-2"><CheckCircleIcon className="w-4 h-4 text-green-400 flex-shrink-0" /><span>Full competition access</span></div>
                  <div className="flex items-center gap-2"><CheckCircleIcon className="w-4 h-4 text-green-400 flex-shrink-0" /><span>Mentorship sessions</span></div>
                  <div className="flex items-center gap-2"><CheckCircleIcon className="w-4 h-4 text-green-400 flex-shrink-0" /><span>Certificate of participation</span></div>
                </div>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <Card className="p-6 text-center border-purple/20 hover:border-purple/40 transition-colors h-full">
                <LightBulbIcon className="w-12 h-12 text-purple mx-auto mb-4" />
                <h3 className="text-lg font-bold text-foreground mb-2">Founder / Professional</h3>
                <p className="text-3xl font-bold text-purple mb-2">₹{competition?.founderFee || 499}</p>
                <p className="text-sm text-muted">For entrepreneurs and working professionals</p>
                <div className="mt-4 space-y-2 text-sm text-muted text-left">
                  <div className="flex items-center gap-2"><CheckCircleIcon className="w-4 h-4 text-green-400 flex-shrink-0" /><span>Full competition access</span></div>
                  <div className="flex items-center gap-2"><CheckCircleIcon className="w-4 h-4 text-green-400 flex-shrink-0" /><span>Investor networking opportunity</span></div>
                  <div className="flex items-center gap-2"><CheckCircleIcon className="w-4 h-4 text-green-400 flex-shrink-0" /><span>Priority pitch slot</span></div>
                  <div className="flex items-center gap-2"><CheckCircleIcon className="w-4 h-4 text-green-400 flex-shrink-0" /><span>Certificate of participation</span></div>
                </div>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Exhibition Booths */}
      <section className="py-16 px-4 sm:px-6 bg-gradient-to-b from-transparent via-blue/5 to-transparent">
        <div className="max-w-4xl mx-auto">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-3">Exhibition Booths</h2>
            <p className="text-muted max-w-xl mx-auto">Showcase your product at the Vishvakarma Innovation Expo</p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}>
            <Card className="p-8 border-cyan-400/20 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-cyan-400/10 to-transparent rounded-bl-full" />
              <div className="relative">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                  <div>
                    <h3 className="text-2xl font-bold text-foreground mb-2">Standard Exhibition Booth</h3>
                    <p className="text-muted mb-4">{competition?.boothDescription || '6x6 ft branded booth space with table, chairs, power outlet, and Wi-Fi. Perfect for product demos and live showcases.'}</p>
                    <div className="flex flex-wrap gap-2">
                      {['Product Demo Space', 'Branded Backdrop', 'Power & Wi-Fi', 'Visitor Footfall'].map((f) => (
                        <span key={f} className="px-3 py-1 text-xs rounded-full bg-cyan-400/10 text-cyan-400 border border-cyan-400/20">{f}</span>
                      ))}
                    </div>
                  </div>
                  <div className="text-center md:text-right flex-shrink-0">
                    <p className="text-4xl font-bold text-cyan-400">₹{(competition?.boothPrice || 5000).toLocaleString('en-IN')}</p>
                    <p className="text-sm text-muted">per booth</p>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Sponsors Section */}
      {competition?.sponsors && competition.sponsors.length > 0 && (
        <section className="py-16 px-4 sm:px-6">
          <div className="max-w-5xl mx-auto">
            <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} className="text-center mb-12">
              <h2 className="text-3xl font-bold text-foreground mb-3">Our Sponsors</h2>
              <p className="text-muted max-w-xl mx-auto">Backed by industry leaders driving innovation forward</p>
            </motion.div>

            {competition.sponsors.filter(s => s.tier === 'TITLE').length > 0 && (
              <div className="mb-10">
                <h3 className="text-center text-sm font-semibold text-yellow-400 uppercase tracking-widest mb-6">Title Sponsors</h3>
                <div className="grid sm:grid-cols-2 gap-6 max-w-3xl mx-auto">
                  {competition.sponsors.filter(s => s.tier === 'TITLE').map((s) => (
                    <motion.div key={s.id} initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }}>
                      <Card className="p-6 border-yellow-400/20 text-center">
                        <div className="w-20 h-20 rounded-2xl bg-yellow-400/10 flex items-center justify-center mx-auto mb-4 overflow-hidden">
                          {s.logo ? <img src={s.logo} alt={s.name} className="w-full h-full object-contain p-2" /> : <StarIcon className="w-10 h-10 text-yellow-400" />}
                        </div>
                        <h4 className="text-lg font-bold text-foreground">{s.name}</h4>
                        <Badge variant="warning">Title Sponsor</Badge>
                        {s.benefits && (
                          <div className="mt-3 space-y-1 text-sm text-muted text-left">
                            {(() => { try { return JSON.parse(s.benefits); } catch { return s.benefits.split(','); } })().map((b: string, i: number) => (
                              <div key={i} className="flex items-center gap-2"><CheckCircleIcon className="w-3.5 h-3.5 text-yellow-400 flex-shrink-0" /><span>{b.trim()}</span></div>
                            ))}
                          </div>
                        )}
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {competition.sponsors.filter(s => s.tier === 'GOLD').length > 0 && (
              <div className="mb-10">
                <h3 className="text-center text-sm font-semibold text-orange-400 uppercase tracking-widest mb-6">Gold Sponsors</h3>
                <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
                  {competition.sponsors.filter(s => s.tier === 'GOLD').map((s) => (
                    <motion.div key={s.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}>
                      <Card className="p-5 border-orange-400/20 text-center">
                        <div className="w-14 h-14 rounded-xl bg-orange-400/10 flex items-center justify-center mx-auto mb-3 overflow-hidden">
                          {s.logo ? <img src={s.logo} alt={s.name} className="w-full h-full object-contain p-1" /> : <StarIcon className="w-7 h-7 text-orange-400" />}
                        </div>
                        <h4 className="font-semibold text-foreground">{s.name}</h4>
                        <p className="text-xs text-orange-400 mt-1">Gold Sponsor</p>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {competition.sponsors.filter(s => s.tier === 'STARTUP_PARTNER').length > 0 && (
              <div>
                <h3 className="text-center text-sm font-semibold text-blue-400 uppercase tracking-widest mb-6">Startup Partners</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
                  {competition.sponsors.filter(s => s.tier === 'STARTUP_PARTNER').map((s) => (
                    <motion.div key={s.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}>
                      <Card className="p-4 border-blue-400/20 text-center">
                        <div className="w-12 h-12 rounded-lg bg-blue-400/10 flex items-center justify-center mx-auto mb-2 overflow-hidden">
                          {s.logo ? <img src={s.logo} alt={s.name} className="w-full h-full object-contain p-1" /> : <StarIcon className="w-6 h-6 text-blue-400" />}
                        </div>
                        <h4 className="text-sm font-semibold text-foreground">{s.name}</h4>
                        <p className="text-xs text-blue-400 mt-0.5">Startup Partner</p>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Sponsor Packages */}
      <section className="py-16 px-4 sm:px-6 bg-gradient-to-b from-transparent via-purple/5 to-transparent">
        <div className="max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-3">Become a Sponsor</h2>
            <p className="text-muted max-w-xl mx-auto">Partner with us and get unparalleled visibility in India&apos;s biggest startup competition</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}>
              <Card className="p-6 border-yellow-400/30 relative overflow-hidden h-full">
                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-yellow-400/10 to-transparent rounded-bl-full" />
                <div className="relative">
                  <StarIcon className="w-10 h-10 text-yellow-400 mb-3" />
                  <h3 className="text-lg font-bold text-foreground mb-1">Title Sponsor</h3>
                  <p className="text-3xl font-bold text-yellow-400 mb-4">₹1,00,000</p>
                  <div className="space-y-2 text-sm text-muted">
                    <div className="flex items-center gap-2"><CheckCircleIcon className="w-4 h-4 text-yellow-400 flex-shrink-0" /><span>Prime branding across all channels</span></div>
                    <div className="flex items-center gap-2"><CheckCircleIcon className="w-4 h-4 text-yellow-400 flex-shrink-0" /><span>Logo on event backdrop & stage</span></div>
                    <div className="flex items-center gap-2"><CheckCircleIcon className="w-4 h-4 text-yellow-400 flex-shrink-0" /><span>5-min keynote speaking slot</span></div>
                    <div className="flex items-center gap-2"><CheckCircleIcon className="w-4 h-4 text-yellow-400 flex-shrink-0" /><span>Exclusive startup access & networking</span></div>
                    <div className="flex items-center gap-2"><CheckCircleIcon className="w-4 h-4 text-yellow-400 flex-shrink-0" /><span>Media coverage & press mentions</span></div>
                  </div>
                </div>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <Card className="p-6 border-orange-400/30 relative overflow-hidden h-full">
                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-orange-400/10 to-transparent rounded-bl-full" />
                <div className="relative">
                  <StarIcon className="w-10 h-10 text-orange-400 mb-3" />
                  <h3 className="text-lg font-bold text-foreground mb-1">Gold Sponsor</h3>
                  <p className="text-3xl font-bold text-orange-400 mb-4">₹50,000</p>
                  <div className="space-y-2 text-sm text-muted">
                    <div className="flex items-center gap-2"><CheckCircleIcon className="w-4 h-4 text-orange-400 flex-shrink-0" /><span>Logo on website & event materials</span></div>
                    <div className="flex items-center gap-2"><CheckCircleIcon className="w-4 h-4 text-orange-400 flex-shrink-0" /><span>Social media shoutouts</span></div>
                    <div className="flex items-center gap-2"><CheckCircleIcon className="w-4 h-4 text-orange-400 flex-shrink-0" /><span>VIP networking access</span></div>
                    <div className="flex items-center gap-2"><CheckCircleIcon className="w-4 h-4 text-orange-400 flex-shrink-0" /><span>Branded booth at exhibition</span></div>
                  </div>
                </div>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <Card className="p-6 border-blue-400/30 relative overflow-hidden h-full">
                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-blue-400/10 to-transparent rounded-bl-full" />
                <div className="relative">
                  <StarIcon className="w-10 h-10 text-blue-400 mb-3" />
                  <h3 className="text-lg font-bold text-foreground mb-1">Startup Partner</h3>
                  <p className="text-3xl font-bold text-blue-400 mb-4">₹25,000</p>
                  <div className="space-y-2 text-sm text-muted">
                    <div className="flex items-center gap-2"><CheckCircleIcon className="w-4 h-4 text-blue-400 flex-shrink-0" /><span>Logo on competition page</span></div>
                    <div className="flex items-center gap-2"><CheckCircleIcon className="w-4 h-4 text-blue-400 flex-shrink-0" /><span>Social media mentions</span></div>
                    <div className="flex items-center gap-2"><CheckCircleIcon className="w-4 h-4 text-blue-400 flex-shrink-0" /><span>Direct access to top startups</span></div>
                  </div>
                </div>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Register Section */}
      {competition?.currentPhase === 'REGISTRATION' && (
        <section className="py-16 px-4 sm:px-6">
          <div className="max-w-3xl mx-auto">
            <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }}>
              <Card className="p-8 border-purple/20">
                <div className="text-center mb-8">
                  <RocketLaunchIcon className="w-12 h-12 text-purple mx-auto mb-4" />
                  <h2 className="text-2xl font-bold text-foreground mb-2">Register Your Startup</h2>
                  <p className="text-muted">Submit your approved startup to compete in the Vishvakarma Innovation Challenge 2026</p>
                </div>

                {message.text && (
                  <div className={`mb-6 p-4 rounded-xl text-sm ${message.type === 'success' ? 'bg-green-400/10 text-green-400 border border-green-400/20' : 'bg-red-400/10 text-red-400 border border-red-400/20'}`}>
                    {message.text}
                  </div>
                )}

                {!isAuthenticated ? (
                  <div className="text-center">
                    <p className="text-muted mb-4">You need to be logged in and have an approved startup to register.</p>
                    <Link href="/login"><Button>Log In to Register</Button></Link>
                  </div>
                ) : userStartups.length === 0 ? (
                  <div className="text-center">
                    <p className="text-muted mb-4">You don&apos;t have any approved startups yet. Submit a startup idea first!</p>
                    <Link href="/submit-idea"><Button>Submit Your Idea</Button></Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {userStartups.map((startup) => (
                      <div key={startup.id} className="flex items-center justify-between p-4 rounded-xl bg-background/50 border border-border/50">
                        <div>
                          <p className="font-medium text-foreground">{startup.title}</p>
                          <p className="text-xs text-muted">Status: {startup.status}</p>
                        </div>
                        {registeredStartups.has(startup.id) ? (
                          <span className="flex items-center gap-1.5 text-sm text-green-400">
                            <CheckCircleIcon className="w-4 h-4" />
                            Registered
                          </span>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => registerStartup(startup.id)}
                            disabled={registering === startup.id}
                          >
                            {registering === startup.id ? 'Registering...' : 'Register'}
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-6 pt-6 border-t border-border text-center">
                  <p className="text-xs text-muted">
                    Registration closes on {competition?.registrationEnd && formatDate(competition.registrationEnd)} •{' '}
                    <span className="text-purple font-medium">{competition?.registrationEnd && daysLeft(competition.registrationEnd)} days remaining</span>
                  </p>
                </div>
              </Card>
            </motion.div>
          </div>
        </section>
      )}

      {/* Voting Section (Phase 3) */}
      {competition?.currentPhase === 'VOTING' && competition.entries.length > 0 && (
        <section className="py-16 px-4 sm:px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-foreground mb-3">Vote for Your Favorites</h2>
              <p className="text-muted">Support the startups you believe in — every vote counts!</p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {competition.entries.map((entry) => (
                <motion.div key={entry.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}>
                  <Card className="overflow-hidden h-full">
                    <div className="h-40 bg-gradient-to-br from-purple/20 via-blue/10 to-transparent relative overflow-hidden">
                      {(entry.startup.thumbnail || entry.startup.logo) ? (
                        <img
                          src={entry.startup.thumbnail || entry.startup.logo!}
                          alt={entry.startup.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-4xl font-bold text-purple/30">{entry.startup.title[0]}</span>
                        </div>
                      )}
                    </div>
                    <div className="p-5">
                      <Link href={`/startup/${entry.startup.slug}`}>
                        <h3 className="text-lg font-bold text-foreground hover:text-purple transition-colors mb-1">{entry.startup.title}</h3>
                      </Link>
                      <p className="text-sm text-muted mb-3 line-clamp-2">{entry.startup.shortDescription}</p>
                      <div className="flex flex-wrap gap-2 mb-4">
                        <span className="px-2 py-0.5 text-xs rounded-full bg-purple/10 text-purple border border-purple/20">{entry.startup.category}</span>
                        <span className="px-2 py-0.5 text-xs rounded-full bg-blue/10 text-blue border border-blue/20">{entry.startup.productStage.replace('_', ' ')}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted">by {entry.startup.founder.firstName} {entry.startup.founder.lastName}</span>
                        </div>
                        <button
                          onClick={() => handleVote(entry.id)}
                          disabled={!isAuthenticated || voting === entry.id}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                            votedEntries.has(entry.id)
                              ? 'bg-purple text-white'
                              : 'bg-purple/10 text-purple hover:bg-purple/20 border border-purple/20'
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
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Judges Section */}
      {competition?.judges && competition.judges.length > 0 && (
        <section className="py-16 px-4 sm:px-6">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-foreground mb-3">Our Judges</h2>
              <p className="text-muted">Industry leaders evaluating your innovations</p>
            </div>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {competition.judges.map((judge) => (
                <Card key={judge.id} className="p-5 text-center">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple/20 to-blue/20 flex items-center justify-center mx-auto mb-3 overflow-hidden">
                    {judge.avatar ? (
                      <img src={judge.avatar} alt={judge.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xl font-bold text-purple">{judge.name[0]}</span>
                    )}
                  </div>
                  <p className="font-semibold text-foreground">{judge.name}</p>
                  <p className="text-xs text-muted">{judge.title}</p>
                  <p className="text-xs text-purple">{judge.organization}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Timeline */}
      <section className="py-16 px-4 sm:px-6 bg-gradient-to-b from-transparent via-blue/5 to-transparent">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-3">Event Timeline</h2>
          </div>

          <div className="space-y-0">
            {competition && [
              { label: 'Registration Opens', date: competition.registrationStart, phase: 'REGISTRATION' },
              { label: 'Registration Closes', date: competition.registrationEnd, phase: 'REGISTRATION' },
              { label: 'Screening Complete', date: competition.screeningEnd, phase: 'SCREENING' },
              { label: 'Public Voting Ends', date: competition.votingEnd, phase: 'VOTING' },
              { label: 'Finals Day', date: competition.finalsDate, phase: 'FINALS' },
            ].map((item, i) => {
              const isPast = new Date(item.date) < new Date();
              const isCurrent = item.phase === competition.currentPhase;
              return (
                <div key={i} className="flex gap-4 items-start">
                  <div className="flex flex-col items-center">
                    <div className={`w-4 h-4 rounded-full border-2 ${isPast ? 'bg-green-400 border-green-400' : isCurrent ? 'bg-purple border-purple' : 'bg-transparent border-border'}`} />
                    {i < 4 && <div className={`w-0.5 h-12 ${isPast ? 'bg-green-400/30' : 'bg-border'}`} />}
                  </div>
                  <div className="pb-8">
                    <p className={`font-medium ${isCurrent ? 'text-purple' : isPast ? 'text-green-400' : 'text-muted'}`}>{item.label}</p>
                    <p className="text-xs text-muted">{formatDate(item.date)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Final CTA — Urgency & Invitation */}
      <section className="py-20 px-4 sm:px-6 mb-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-purple/10 via-blue/5 to-transparent" />
        <div className="absolute bottom-0 left-1/3 w-[500px] h-[400px] bg-purple/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/3 w-[500px] h-[400px] bg-blue/10 rounded-full blur-[120px]" />
        <div className="relative max-w-4xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}>
            <motion.div
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="inline-block mb-6"
            >
              <FireIcon className="w-16 h-16 text-orange-400" />
            </motion.div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-foreground mb-4">
              Don&apos;t Just Watch.{' '}
              <span className="bg-gradient-to-r from-purple to-blue bg-clip-text text-transparent">Be Part of It.</span>
            </h2>

            <p className="text-lg sm:text-xl text-muted mb-3 max-w-2xl mx-auto">
              This is more than a competition — it&apos;s a movement. Join the next generation of Indian innovators
              and put your startup on the national map.
            </p>

            {competition?.currentPhase === 'REGISTRATION' && (
              <motion.p
                animate={{ opacity: [1, 0.5, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="text-lg font-bold text-orange-400 mb-8"
              >
                ⚡ Hurry! Only {countdown.days} days, {countdown.hours} hours left to register!
              </motion.p>
            )}

            <div className="flex flex-wrap gap-4 justify-center mb-8">
              {competition?.currentPhase === 'REGISTRATION' ? (
                <>
                  <Link href="/submit-idea">
                    <Button size="lg">
                      <RocketLaunchIcon className="w-5 h-5 mr-2 inline" />
                      Register Now — From ₹199 Only
                      <ArrowRightIcon className="w-4 h-4 ml-2 inline" />
                    </Button>
                  </Link>
                  <Link href="/signup">
                    <Button variant="outline" size="lg">Create Free Account</Button>
                  </Link>
                </>
              ) : (
                <Link href="/explore">
                  <Button size="lg">Explore Startups</Button>
                </Link>
              )}
            </div>

            <p className="text-sm text-muted">
              No idea is too small. No dream is too big. <span className="text-purple font-semibold">We&apos;re waiting for you.</span>
            </p>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
