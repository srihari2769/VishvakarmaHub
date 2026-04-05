'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Button, Card, Badge } from '@/components/ui';
import { useAuthStore } from '@/store/authStore';
import { formatCurrency } from '@/lib/utils';
import {
  ShieldCheckIcon,
  UsersIcon,
  RocketLaunchIcon,
  CurrencyRupeeIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
  ChartBarIcon,
  EyeIcon,
  BanknotesIcon,
  ArrowTrendingUpIcon,
  TrashIcon,
  XMarkIcon,
  Cog6ToothIcon,
  TrophyIcon,
  PencilSquareIcon,
  TicketIcon,
  CreditCardIcon,
  AcademicCapIcon,
  UserGroupIcon,
  ArrowDownTrayIcon,
  BoltIcon,
  FireIcon,
  PlayIcon,
  LockClosedIcon,
  LockOpenIcon,
} from '@heroicons/react/24/outline';

interface PendingStartup {
  id: string;
  title: string;
  slug: string;
  category: string;
  description?: string;
  createdAt: string;
  founder: { firstName: string; lastName: string; email: string };
}

interface PlatformUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  _count?: { startups: number; contributions: number };
}

interface WithdrawalRequest {
  id: string;
  amount: number;
  status: string;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  accountHolder: string;
  note?: string;
  adminNote?: string;
  createdAt: string;
  user: { firstName: string; lastName: string; email: string };
  campaign: { startup: { title: string; slug: string } };
}

interface AllStartup {
  id: string;
  title: string;
  slug: string;
  category: string;
  status: string;
  createdAt: string;
  founder: { firstName: string; lastName: string; email: string };
  campaign: { fundingGoal: number; raisedAmount: number; supporterCount: number; status: string } | null;
}

interface ReportData {
  totalUsers: number;
  totalStartups: number;
  totalCampaigns: number;
  totalFunding: number;
  avgFunding: number;
  totalContributions: number;
  startupsByStatus: { status: string; count: number }[];
  campaignsByStatus: { status: string; count: number }[];
  withdrawalStats: { status: string; count: number; amount: number }[];
}

type Tab = 'overview' | 'pending' | 'startups' | 'users' | 'withdrawals' | 'contacts' | 'reports' | 'competition' | 'vsc' | 'settings';

interface CompetitionEntryItem {
  id: string;
  status: string;
  upvotes: number;
  totalScore: number | null;
  createdAt: string;
  startup: { id: string; title: string; slug: string; category: string; logo: string | null };
  user: { firstName: string; lastName: string; email: string };
  _count: { votes: number };
}

interface CitizenPassItem {
  id: string;
  passNumber: string;
  name: string;
  phone: string;
  email: string | null;
  idProofType: string;
  idProofNumber: string;
  fee: number;
  paymentStatus: string;
  razorpayPaymentId: string | null;
  createdAt: string;
}

interface CompetitionData {
  id: string;
  name: string;
  tagline: string;
  description: string;
  currentPhase: string;
  studentFee: number;
  founderFee: number;
  boothPrice: number;
  boothDescription: string | null;
  manualRegistrations: number;
  registrationStart: string;
  registrationEnd: string;
  screeningEnd: string;
  votingEnd: string;
  finalsDate: string;
  pageContent: Record<string, unknown> | null;
  showSponsorPrices: boolean;
  showFinalDate: boolean;
  entries: CompetitionEntryItem[];
  judges: CompetitionJudgeItem[];
  sponsors: CompetitionSponsorItem[];
  campusPartners: CampusPartnerItem[];
  citizenPasses: CitizenPassItem[];
  participants: CompetitionParticipantItem[];
  freeEntries: FreeEntryItem[];
  _count: { entries: number; citizenPasses: number; participants: number; freeEntries: number };
}

interface FreeEntryReferralItem {
  id: string;
  paymentVerified: boolean;
  createdAt: string;
  referredUser: { firstName: string; lastName: string; email: string };
}

interface FreeEntryItem {
  id: string;
  phone: string;
  participantType: string;
  college: string | null;
  company: string | null;
  city: string;
  state: string;
  videoUrl: string | null;
  videoPlatform: string | null;
  videoDescription: string | null;
  referralCode: string;
  referralCount: number;
  videoStatus: string;
  adminNotes: string | null;
  status: string;
  freeEntryGranted: boolean;
  createdAt: string;
  user: { firstName: string; lastName: string; email: string };
  referrals: FreeEntryReferralItem[];
}

interface CompetitionJudgeItem {
  id: string;
  name: string;
  title: string;
  organization: string;
  avatar: string | null;
}

interface CompetitionSponsorItem {
  id: string;
  tier: string;
  name: string;
  logo: string | null;
  price: number;
  benefits: string;
}

interface CampusPartnerItem {
  id: string;
  name: string;
  logo: string | null;
  website: string | null;
}

interface CompetitionParticipantItem {
  id: string;
  phone: string;
  participantType: string;
  participationMode: string;
  college: string | null;
  company: string | null;
  designation: string | null;
  city: string;
  state: string;
  teamName: string | null;
  teamSize: number;
  teamMembers: { name: string; email: string; role?: string }[] | null;
  ideaTitle: string | null;
  ideaDescription: string | null;
  ideaCategory: string | null;
  problemStatement: string | null;
  solution: string | null;
  targetAudience: string | null;
  uniqueness: string | null;
  productStage: string | null;
  pitchDeck: string | null;
  demoVideo: string | null;
  totalFee: number | null;
  paymentStatus: string;
  razorpayOrderId: string | null;
  razorpayPaymentId: string | null;
  status: string;
  createdAt: string;
  user: { firstName: string; lastName: string; email: string };
}

interface ContactSubmission {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

interface VSCRoundItem {
  id: string;
  roundNumber: number;
  title: string;
  description: string;
  roundType: string;
  timeLimit: number;
  passingPercent: number;
  isActive: boolean;
  isLocked: boolean;
  questionPool: { id: string; question: string; options?: string[]; correctAnswer?: string; points: number; category?: string }[] | null;
  prompt: string | null;
  scoringCriteria: { criterion: string; weight: number; maxScore: number }[] | null;
  startsAt: string | null;
  endsAt: string | null;
}

interface VSCParticipantItem {
  id: string;
  name: string;
  phone: string;
  email: string;
  college: string | null;
  city: string;
  state: string;
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
  createdAt: string;
  user: { firstName: string; lastName: string; email: string };
  attempts: { roundId: string; score: number; maxScore: number; passed: boolean; completedAt: string | null }[];
  powerUps: { type: string; paymentStatus: string; isUsed: boolean }[];
}

interface VSCData {
  id: string;
  name: string;
  tagline: string;
  description: string;
  isActive: boolean;
  entryFee: number;
  secondChanceFee: number;
  thirdChanceFee: number;
  skipRoundPrice: number;
  extraTimePrice: number;
  revivePrice: number;
  leaderboardBoostPrice: number;
  manualRegistrations: number;
  rounds: VSCRoundItem[];
  participants: VSCParticipantItem[];
  _count: { participants: number; rounds: number };
}

const ROUND_TYPES = [
  { value: 'SPEED_IQ', label: 'Speed IQ Test' },
  { value: 'DECISION_MAKING', label: 'Decision Making' },
  { value: 'CREATIVITY', label: 'Creativity Challenge' },
  { value: 'EXECUTION', label: 'Execution Simulation' },
  { value: 'PRESSURE', label: 'Pressure Round' },
  { value: 'SOCIAL_PROOF', label: 'Social Proof' },
  { value: 'VIDEO_PITCH', label: 'Final Pitch' },
];

export default function AdminPage() {
  const router = useRouter();
  const { user, isAuthenticated, checkAuth, isLoading } = useAuthStore();
  const [tab, setTab] = useState<Tab>('overview');
  const [pendingStartups, setPendingStartups] = useState<PendingStartup[]>([]);
  const [allStartups, setAllStartups] = useState<AllStartup[]>([]);
  const [users, setUsers] = useState<PlatformUser[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [contacts, setContacts] = useState<ContactSubmission[]>([]);
  const [reports, setReports] = useState<ReportData | null>(null);
  const [stats, setStats] = useState({ totalUsers: 0, totalStartups: 0, totalFunding: 0, pendingReview: 0, pendingWithdrawals: 0 });
  const [searchQuery, setSearchQuery] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [withdrawalNote, setWithdrawalNote] = useState('');
  const [viewUser, setViewUser] = useState<PlatformUser | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'startup' | 'user'; id: string; name: string } | null>(null);
  const [comingSoon, setComingSoon] = useState(false);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [razorpayKeyId, setRazorpayKeyId] = useState('');
  const [razorpayKeySecret, setRazorpayKeySecret] = useState('');
  const [razorpayHasKeys, setRazorpayHasKeys] = useState(false);
  const [razorpayKeySource, setRazorpayKeySource] = useState<string>('none');
  const [razorpaySaving, setRazorpaySaving] = useState(false);
  const [competitionSeeded, setCompetitionSeeded] = useState(false);
  const [seedingCompetition, setSeedingCompetition] = useState(false);
  const [competitionData, setCompetitionData] = useState<CompetitionData | null>(null);
  const [entryStatusLoading, setEntryStatusLoading] = useState<string | null>(null);
  const [compEditMode, setCompEditMode] = useState(false);
  const [compForm, setCompForm] = useState<Record<string, string | number>>({});
  const [compSaving, setCompSaving] = useState(false);
  const [compSubTab, setCompSubTab] = useState<'entries' | 'participants' | 'details' | 'sponsors' | 'campus-partners' | 'judges' | 'citizen-passes' | 'free-entries' | 'page-content'>('entries');
  const [freeEntryNotes, setFreeEntryNotes] = useState<Record<string, string>>({});
  const [participantStatusLoading, setParticipantStatusLoading] = useState<string | null>(null);
  const [selectedParticipant, setSelectedParticipant] = useState<CompetitionParticipantItem | null>(null);
  const [sponsorForm, setSponsorForm] = useState({ tier: 'TITLE', sponsorName: '', price: '', benefits: '', logo: '' });
  const [editingSponsor, setEditingSponsor] = useState<string | null>(null);
  const [editSponsorForm, setEditSponsorForm] = useState({ tier: '', sponsorName: '', price: '', benefits: '', logo: '' });
  const [partnerForm, setPartnerForm] = useState({ partnerName: '', partnerLogo: '', partnerWebsite: '' });
  const [editingPartner, setEditingPartner] = useState<string | null>(null);
  const [editPartnerForm, setEditPartnerForm] = useState({ partnerName: '', partnerLogo: '', partnerWebsite: '' });
  const [judgeForm, setJudgeForm] = useState({ judgeName: '', judgeTitle: '', judgeOrganization: '', judgeAvatar: '' });
  const [editingJudge, setEditingJudge] = useState<string | null>(null);
  const [editJudgeForm, setEditJudgeForm] = useState({ judgeName: '', judgeTitle: '', judgeOrganization: '', judgeAvatar: '' });
  const [pageContentForm, setPageContentForm] = useState<Record<string, unknown>>({});
  const [pageContentSaving, setPageContentSaving] = useState(false);
  const [passSearch, setPassSearch] = useState('');

  // VSC State
  const [vscData, setVscData] = useState<VSCData | null>(null);
  const [vscSubTab, setVscSubTab] = useState<'details' | 'rounds' | 'participants' | 'questions'>('details');
  const [vscEditMode, setVscEditMode] = useState(false);
  const [vscForm, setVscForm] = useState<Record<string, string | number>>({});
  const [vscSaving, setVscSaving] = useState(false);
  const [vscCreating, setVscCreating] = useState(false);
  const [vscRoundForm, setVscRoundForm] = useState({ roundNumber: '', title: '', description: '', roundType: 'SPEED_IQ', timeLimit: '600', passingPercent: '60', prompt: '' });
  const [vscEditingRound, setVscEditingRound] = useState<string | null>(null);
  const [vscEditRoundForm, setVscEditRoundForm] = useState<Record<string, string>>({});
  const [vscSelectedRound, setVscSelectedRound] = useState<string | null>(null);
  const [vscQuestionForm, setVscQuestionForm] = useState({ question: '', optionA: '', optionB: '', optionC: '', optionD: '', correctAnswer: '', points: '10', category: '' });
  const [vscParticipantSearch, setVscParticipantSearch] = useState('');

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login?redirect=/admin');
    }
    if (!isLoading && isAuthenticated && user?.role !== 'ADMIN') {
      router.push('/dashboard');
    }
  }, [isLoading, isAuthenticated, user, router]);

  useEffect(() => {
    if (isAuthenticated && user?.role === 'ADMIN') {
      fetchAdmin('stats');
      fetchAdmin('pending-startups');
      fetchAdmin('all-startups');
      fetchAdmin('users');
      fetchAdmin('withdrawals');
      fetchAdmin('contacts');
      fetchAdmin('reports');
      fetchSiteSettings();
      fetchCompetitionEntries();
      fetchVscData();
    }
  }, [isAuthenticated, user]);

  const fetchSiteSettings = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/site-settings', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (data.success) {
        setComingSoon(data.data.comingSoon);
        if (data.data.razorpayKeyId !== undefined) {
          setRazorpayKeyId(data.data.razorpayKeyId);
          setRazorpayKeySecret(data.data.razorpayKeySecret);
          setRazorpayHasKeys(data.data.hasRazorpayKeys);
          setRazorpayKeySource(data.data.razorpayKeySource || 'none');
        }
      }
    } catch {}
  };

  const toggleComingSoon = async () => {
    setSettingsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/site-settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ comingSoon: !comingSoon }),
      });
      const data = await res.json();
      if (data.success) setComingSoon(data.data.comingSoon);
    } catch {}
    setSettingsLoading(false);
  };

  const seedCompetition = async () => {
    setSeedingCompetition(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/competition/seed', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setCompetitionSeeded(true);
      else alert(data.error || 'Failed to seed competition');
    } catch {}
    setSeedingCompetition(false);
  };

  const fetchCompetitionEntries = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/admin?action=competition-entries', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success && data.data) setCompetitionData(data.data);
    } catch {}
  };

  // ─── VSC Functions ───

  const fetchVscData = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/admin?action=vsc-data', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setVscData(data.data);
    } catch {}
  };

  const vscAction = async (actionName: string, payload: Record<string, unknown>) => {
    const token = localStorage.getItem('token');
    const res = await fetch('/api/admin', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ action: actionName, ...payload }),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Action failed');
    return data;
  };

  const createVscChallenge = async () => {
    setVscCreating(true);
    try {
      await vscAction('vsc-create-challenge', {
        name: 'Vishvakarma Survival Challenge',
        tagline: 'Survive 7 Rounds. Prove Your Worth.',
        description: 'The ultimate elimination challenge for innovators and entrepreneurs.',
      });
      fetchVscData();
    } catch (e) { alert((e as Error).message); }
    setVscCreating(false);
  };

  const saveVscChallenge = async () => {
    if (!vscData) return;
    setVscSaving(true);
    try {
      await vscAction('vsc-update-challenge', { challengeId: vscData.id, ...vscForm });
      setVscEditMode(false);
      fetchVscData();
    } catch (e) { alert((e as Error).message); }
    setVscSaving(false);
  };

  const addVscRound = async () => {
    if (!vscData || !vscRoundForm.title || !vscRoundForm.roundNumber) return alert('Round number and title required');
    setVscSaving(true);
    try {
      await vscAction('vsc-add-round', { challengeId: vscData.id, ...vscRoundForm });
      setVscRoundForm({ roundNumber: '', title: '', description: '', roundType: 'SPEED_IQ', timeLimit: '600', passingPercent: '60', prompt: '' });
      fetchVscData();
    } catch (e) { alert((e as Error).message); }
    setVscSaving(false);
  };

  const updateVscRound = async (roundId: string, data: Record<string, unknown>) => {
    setVscSaving(true);
    try {
      await vscAction('vsc-update-round', { roundId, ...data });
      setVscEditingRound(null);
      fetchVscData();
    } catch (e) { alert((e as Error).message); }
    setVscSaving(false);
  };

  const deleteVscRound = async (roundId: string, title: string) => {
    if (!confirm(`Delete round "${title}"? All attempts will be deleted.`)) return;
    try {
      await vscAction('vsc-delete-round', { roundId });
      fetchVscData();
    } catch (e) { alert((e as Error).message); }
  };

  const addQuestionToPool = async (roundId: string) => {
    const round = vscData?.rounds.find(r => r.id === roundId);
    if (!round) return;
    if (!vscQuestionForm.question || !vscQuestionForm.correctAnswer) return alert('Question and correct answer required');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pool: any[] = Array.isArray(round.questionPool) ? [...round.questionPool] : [];
    const newQ: Record<string, unknown> = {
      id: `q_${Date.now()}`,
      question: vscQuestionForm.question,
      correctAnswer: vscQuestionForm.correctAnswer,
      points: parseInt(vscQuestionForm.points) || 10,
      category: vscQuestionForm.category || 'General',
    };
    if (vscQuestionForm.optionA) {
      newQ.options = [vscQuestionForm.optionA, vscQuestionForm.optionB, vscQuestionForm.optionC, vscQuestionForm.optionD].filter(Boolean);
    }
    pool.push(newQ);
    try {
      await vscAction('vsc-update-round', { roundId, questionPool: pool });
      setVscQuestionForm({ question: '', optionA: '', optionB: '', optionC: '', optionD: '', correctAnswer: '', points: '10', category: '' });
      fetchVscData();
    } catch (e) { alert((e as Error).message); }
  };

  const removeQuestionFromPool = async (roundId: string, questionId: string) => {
    const round = vscData?.rounds.find(r => r.id === roundId);
    if (!round || !Array.isArray(round.questionPool)) return;
    const pool = round.questionPool.filter((q: { id: string }) => q.id !== questionId);
    try {
      await vscAction('vsc-update-round', { roundId, questionPool: pool });
      fetchVscData();
    } catch (e) { alert((e as Error).message); }
  };

  const eliminateVscParticipant = async (participantId: string, roundNumber: number) => {
    if (!confirm('Eliminate this participant?')) return;
    try {
      await vscAction('vsc-eliminate-participant', { participantId, roundNumber });
      fetchVscData();
    } catch (e) { alert((e as Error).message); }
  };

  const reviveVscParticipant = async (participantId: string) => {
    try {
      await vscAction('vsc-revive-participant', { participantId });
      fetchVscData();
    } catch (e) { alert((e as Error).message); }
  };

  const deleteVscParticipant = async (participantId: string, name: string) => {
    if (!confirm(`Delete participant "${name}"? This cannot be undone.`)) return;
    try {
      await vscAction('vsc-delete-participant', { participantId });
      fetchVscData();
    } catch (e) { alert((e as Error).message); }
  };

  const updateEntryStatus = async (entryId: string, status: string) => {
    setEntryStatusLoading(entryId);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/admin', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: 'update-entry-status', entryId, status }),
      });
      const data = await res.json();
      if (data.success) fetchCompetitionEntries();
    } catch {}
    setEntryStatusLoading(null);
  };

  const updateParticipantStatus = async (participantId: string, status: string) => {
    setParticipantStatusLoading(participantId);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/admin', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: 'update-participant-status', participantId, status }),
      });
      const data = await res.json();
      if (data.success) fetchCompetitionEntries();
    } catch {}
    setParticipantStatusLoading(null);
  };

  const updateParticipantMode = async (participantId: string, participationMode: string) => {
    setParticipantStatusLoading(participantId);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/admin', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: 'update-participant-mode', participantId, participationMode }),
      });
      const data = await res.json();
      if (data.success) fetchCompetitionEntries();
    } catch {}
    setParticipantStatusLoading(null);
  };

  const deleteParticipant = async (participantId: string, name: string) => {
    if (!confirm(`Delete participant "${name}"? This cannot be undone.`)) return;
    setParticipantStatusLoading(participantId);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/admin', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: 'delete-participant', participantId }),
      });
      const data = await res.json();
      if (data.success) fetchCompetitionEntries();
    } catch {}
    setParticipantStatusLoading(null);
  };

  const exportParticipantsCSV = () => {
    if (!competitionData?.participants?.length) return;
    const headers = ['Name', 'Email', 'Phone', 'Type', 'Participation Mode', 'College/Company', 'Designation', 'City', 'State', 'Team Name', 'Team Size', 'Team Members', 'Idea Title', 'Category', 'Idea Description', 'Problem Statement', 'Solution', 'Target Audience', 'Uniqueness', 'Product Stage', 'Pitch Deck', 'Demo Video', 'Total Fee', 'Payment Status', 'Razorpay Payment ID', 'Status', 'Registered On'];
    const escape = (val: string | null | undefined) => {
      if (!val) return '';
      const s = String(val).replace(/"/g, '""');
      return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s}"` : s;
    };
    const rows = competitionData.participants.map((p) => [
      escape(`${p.user.firstName} ${p.user.lastName}`),
      escape(p.user.email),
      escape(p.phone),
      escape(p.participantType),
      escape(p.participationMode === 'EVENT_ACCESS' ? 'Event Access' : 'Idea Submission'),
      escape(p.participantType === 'STUDENT' ? p.college : p.company),
      escape(p.designation),
      escape(p.city),
      escape(p.state),
      escape(p.teamName),
      String(p.teamSize),
      escape(p.teamMembers ? p.teamMembers.map((m: { name: string; email: string; role?: string }) => `${m.name} (${m.email}${m.role ? `, ${m.role}` : ''})`).join('; ') : ''),
      escape(p.ideaTitle),
      escape(p.ideaCategory),
      escape(p.ideaDescription),
      escape(p.problemStatement),
      escape(p.solution),
      escape(p.targetAudience),
      escape(p.uniqueness),
      escape(p.productStage),
      escape(p.pitchDeck),
      escape(p.demoVideo),
      p.totalFee != null ? String(p.totalFee) : '',
      escape(p.paymentStatus),
      escape(p.razorpayPaymentId),
      escape(p.status),
      new Date(p.createdAt).toLocaleDateString(),
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `competition-participants-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const saveCompetitionDetails = async () => {
    setCompSaving(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/admin', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: 'update-competition', competitionId: competitionData?.id, ...compForm }),
      });
      const data = await res.json();
      if (data.success) {
        setCompEditMode(false);
        fetchCompetitionEntries();
      } else {
        alert(data.error || 'Failed to save');
      }
    } catch {}
    setCompSaving(false);
  };

  const addSponsor = async () => {
    if (!sponsorForm.sponsorName || !sponsorForm.price) return alert('Sponsor name and price are required');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/admin', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          action: 'add-sponsor',
          competitionId: competitionData?.id,
          tier: sponsorForm.tier,
          sponsorName: sponsorForm.sponsorName,
          logo: sponsorForm.logo || undefined,
          price: parseFloat(sponsorForm.price),
          benefits: sponsorForm.benefits ? sponsorForm.benefits.split(',').map((b: string) => b.trim()).filter(Boolean) : [],
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSponsorForm({ tier: 'TITLE', sponsorName: '', price: '', benefits: '', logo: '' });
        fetchCompetitionEntries();
      } else {
        alert(data.error || 'Failed to add sponsor');
      }
    } catch {
      alert('Failed to add sponsor');
    }
  };

  const deleteSponsor = async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/admin', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: 'delete-sponsor', sponsorId: id }),
      });
      const data = await res.json();
      if (data.success) fetchCompetitionEntries();
    } catch {}
  };

  const editSponsor = async (id: string) => {
    if (!editSponsorForm.sponsorName || !editSponsorForm.price) return alert('Name and price are required');
    try {
      const token = localStorage.getItem('token');
      const benefits = editSponsorForm.benefits ? editSponsorForm.benefits.split(',').map(b => b.trim()).filter(Boolean) : [];
      const res = await fetch('/api/admin', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: 'edit-sponsor', sponsorId: id, tier: editSponsorForm.tier, sponsorName: editSponsorForm.sponsorName, logo: editSponsorForm.logo || undefined, price: editSponsorForm.price, benefits }),
      });
      const data = await res.json();
      if (data.success) { setEditingSponsor(null); fetchCompetitionEntries(); }
    } catch {}
  };

  const addCampusPartner = async () => {
    if (!partnerForm.partnerName) return alert('Partner name is required');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/admin', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: 'add-campus-partner', competitionId: competitionData?.id, ...partnerForm }),
      });
      const data = await res.json();
      if (data.success) { setPartnerForm({ partnerName: '', partnerLogo: '', partnerWebsite: '' }); fetchCompetitionEntries(); }
    } catch {}
  };

  const deleteCampusPartner = async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/admin', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: 'delete-campus-partner', partnerId: id }),
      });
      const data = await res.json();
      if (data.success) fetchCompetitionEntries();
    } catch {}
  };

  const editCampusPartner = async (id: string) => {
    if (!editPartnerForm.partnerName) return alert('Partner name is required');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/admin', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: 'edit-campus-partner', partnerId: id, ...editPartnerForm }),
      });
      const data = await res.json();
      if (data.success) { setEditingPartner(null); fetchCompetitionEntries(); }
    } catch {}
  };

  const addJudge = async () => {
    if (!judgeForm.judgeName || !judgeForm.judgeTitle || !judgeForm.judgeOrganization) return alert('Name, title, and organization are required');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/admin', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          action: 'add-judge',
          competitionId: competitionData?.id,
          judgeName: judgeForm.judgeName,
          judgeTitle: judgeForm.judgeTitle,
          judgeOrganization: judgeForm.judgeOrganization,
          judgeAvatar: judgeForm.judgeAvatar || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setJudgeForm({ judgeName: '', judgeTitle: '', judgeOrganization: '', judgeAvatar: '' });
        fetchCompetitionEntries();
      } else {
        alert(data.error || 'Failed to add judge');
      }
    } catch {
      alert('Failed to add judge');
    }
  };

  const editJudge = async (id: string) => {
    if (!editJudgeForm.judgeName || !editJudgeForm.judgeTitle || !editJudgeForm.judgeOrganization) return alert('Name, title, and organization are required');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/admin', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          action: 'edit-judge',
          judgeId: id,
          judgeName: editJudgeForm.judgeName,
          judgeTitle: editJudgeForm.judgeTitle,
          judgeOrganization: editJudgeForm.judgeOrganization,
          judgeAvatar: editJudgeForm.judgeAvatar || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setEditingJudge(null);
        fetchCompetitionEntries();
      } else {
        alert(data.error || 'Failed to update judge');
      }
    } catch {
      alert('Failed to update judge');
    }
  };

  const deleteJudge = async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/admin', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: 'delete-judge', judgeId: id }),
      });
      const data = await res.json();
      if (data.success) fetchCompetitionEntries();
    } catch {}
  };

  const initPageContentForm = () => {
    const defaults = {
      heroBadgeText: 'Registrations Open — Join Now!',
      heroTitleLine1: "India's Biggest",
      heroTitleLine2: 'Startup Competition',
      heroDescription: 'We invite students, founders, engineers, and innovators from every corner of India to showcase their groundbreaking ideas on the national stage.',
      heroQuote: 'Your idea deserves the spotlight. This is your moment.',
      topSelected: 200,
      finalistCount: 20,
      pitchDuration: '5 min',
      bannerText: "You're Invited! India's Biggest Startup Competition is LIVE",
      bannerButtonText: "Register Now — It's Almost Free!",
      invitationTitle: 'Dear Innovators, This is Your Invitation',
      invitationDescription: "Whether you're a college student with a brilliant idea, a founder building the next big thing, or an engineer who wants to solve real problems — Vishvakarma Innovation Challenge 2026 is the platform where your startup journey begins.",
      invitationSubtext: 'We believe every idea matters. No matter how big or small, your innovation can change the world. Join thousands of dreamers who are turning ideas into reality.',
      invitationHighlights: 'Open to all Indians, Starting at just ₹199, National stage exposure, Meet investors & mentors',
      prizeSectionTitle: 'What You Win',
      prizeSectionSubtitle: 'More than just prizes — a launchpad for your startup career',
      firstPrizeTitle: 'Grand Winner',
      firstPrizeSubtitle: 'The top startup takes it all',
      firstPrizeBenefits: 'Cash prize + Trophy, Investor pitch meetings, 1-year incubation support, Media & PR coverage',
      secondPrizeTitle: 'Runner Up',
      secondPrizeSubtitle: 'Outstanding innovation runner',
      secondPrizeBenefits: 'Cash prize + Trophy, Mentorship program, Networking access',
      thirdPrizeTitle: 'Second Runner Up',
      thirdPrizeSubtitle: 'Remarkable innovation',
      thirdPrizeBenefits: 'Cash prize + Trophy, Platform spotlight, Certificate of excellence',
      participantBenefits: 'Certificate of Participation, Networking with Founders, Startup Visibility, Mentorship Access',
      screeningCriteria: 'Innovation:30%, Market Potential:30%, Execution Feasibility:20%, Impact:20%',
      participantCategories: 'Students:College & university students, Engineers:Technical professionals, Founders:Early-stage founders, Innovators:Creative problem solvers, Researchers:Academic researchers',
      boothTitle: 'Standard Exhibition Booth',
      boothFeatures: 'Product Demo Space, Branded Backdrop, Power & Wi-Fi, Visitor Footfall',
      sponsorPackageTitle: 'Become a Sponsor',
      sponsorPackageSubtitle: "Partner with us and get unparalleled visibility in India's biggest startup competition",
      titleSponsorPrice: '₹7,50,000',
      titleSponsorBenefits: 'Event named "powered by [Sponsor]", Exclusive category rights — no competitors in your industry, Logo on stage backdrop & all banners, 5–10 min keynote speech + closing ceremony address, Dedicated hiring zone at venue, Jury panel seat in finals, Premium branding across website & all media (press, reels, banners), Media coverage & press release mention, Premium startup exhibition booth, Direct access to top startups & talent pipeline',
      presentingSponsorPrice: '₹5,00,000',
      presentingSponsorBenefits: 'Co-host branding — not just a logo, full event co-presentation, Sponsored challenge track (e.g., "AI Challenge powered by [You]"), Logo on stage backdrop & event banners, 5 min keynote slot, Premium branding on website & social media, Media coverage & press mention, VIP booth at startup exhibition, Networking access with top founders',
      diamondSponsorPrice: '₹3,50,000',
      diamondSponsorBenefits: 'Access to live startup pitching sessions, Investor roundtable invite with top founders, Lead capture system (QR code / digital cards), Logo on event banners and stage, Featured website section with company profile, Social media promotion across all channels, Premium exhibition booth, VIP networking access, Award ceremony mention & brand visibility',
      platinumSponsorPrice: '₹1,00,000',
      platinumSponsorBenefits: 'Logo on event banners, Featured website placement, Social media promotion, Booth at startup exhibition, VIP networking access',
      goldSponsorPrice: '₹50,000',
      goldSponsorBenefits: 'Logo on website, Social media promotion, Startup booth, Event mention during ceremony',
      silverSponsorPrice: '₹35,000',
      silverSponsorBenefits: 'Logo on sponsor section, Event promotion mention, Networking access',
      startupPartnerPrice: '₹25,000',
      startupPartnerBenefits: 'Logo on competition page, Social media mention, Access to startup database',
      innovationPartnerPrice: '₹15,000',
      innovationPartnerBenefits: 'Logo on event website, Social media posts mention',
      communityPartnerPrice: '₹10,000',
      communityPartnerBenefits: 'Brand mention, Website listing',
      stageSponsorTitle: 'Stage Sponsor',
      stageSponsorPrice: '₹40,000',
      stageSponsorDesc: 'Branding on main stage backdrop',
      mediaSponsorTitle: 'Media Sponsor',
      mediaSponsorPrice: '₹30,000',
      mediaSponsorDesc: 'Logo in all videos and livestream',
      awardSponsorTitle: 'Award Sponsor',
      awardSponsorPrice: '₹20,000',
      awardSponsorDesc: 'Sponsor name on winner trophies',
      strategicPackagesSubtitle: 'Purpose-built partnerships targeting specific departments — engineering, HR, and marketing teams each have separate budgets',
      trackSponsorPrice: '₹2,00,000 – ₹5,00,000',
      trackSponsorBenefits: 'Naming rights for your chosen track, Direct access to niche startup talent, Judging rights in track finals, Track winner announced as "[Your Brand] Award", Dedicated branding in track area, Featured company profile on track page',
      hiringPartnerPrice: '₹3,00,000+',
      hiringPartnerBenefits: 'Full resume database access of all participants, On-spot interview booth at venue, Branded as Official Hiring Partner, Job board placement on event website, Priority access to winning teams, Talent pipeline for internships & full-time roles',
      digitalReachPrice: '₹1,00,000 – ₹3,00,000',
      digitalReachBenefits: 'Logo & branding in all Instagram reels & stories, YouTube coverage with brand integration, Influencer integration & co-created content, Branded hashtag campaign, Post-event highlight reel with sponsor branding, Social media analytics report shared post-event',
      ctaTitle: "Don't Just Watch.",
      ctaHighlight: 'Be Part of It.',
      ctaDescription: "This is more than a competition — it's a movement. Join the next generation of Indian innovators and put your startup on the national map.",
      ctaFooter: "No idea is too small. No dream is too big.",
      ctaFooterHighlight: "We're waiting for you.",
    };
    const existing = (competitionData?.pageContent as Record<string, unknown>) || {};
    setPageContentForm({ ...defaults, ...existing });
  };

  const savePageContent = async () => {
    setPageContentSaving(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/admin', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: 'update-competition', competitionId: competitionData?.id, pageContent: pageContentForm }),
      });
      const data = await res.json();
      if (data.success) {
        alert('Page content saved successfully!');
        fetchCompetitionEntries();
      } else {
        alert(data.error || 'Failed to save page content');
      }
    } catch {
      alert('Failed to save page content');
    }
    setPageContentSaving(false);
  };

  const fetchAdmin = async (action: string) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/admin?action=${action}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        if (action === 'stats') setStats(data.data);
        if (action === 'pending-startups') setPendingStartups(data.data);
        if (action === 'all-startups') setAllStartups(data.data);
        if (action === 'users') setUsers(data.data);
        if (action === 'withdrawals') setWithdrawals(data.data);
        if (action === 'contacts') setContacts(data.data);
        if (action === 'reports') setReports(data.data);
      }
    } catch (error) {
      console.error(`Failed to fetch ${action}:`, error);
    }
  };

  const handleStartupAction = async (startupId: string, action: 'approve-startup' | 'reject-startup') => {
    setActionLoading(startupId);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/admin', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action, startupId }),
      });
      const data = await res.json();
      if (data.success) {
        setPendingStartups((prev) => prev.filter((s) => s.id !== startupId));
        fetchAdmin('stats');
        fetchAdmin('all-startups');
      }
    } catch (error) {
      console.error('Action failed:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleSuspendUser = async (userId: string) => {
    setActionLoading(userId);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/admin', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: 'suspend-user', userId }),
      });
      const data = await res.json();
      if (data.success) {
        setUsers((prev) =>
          prev.map((u) => u.id === userId ? { ...u, isActive: data.data.isActive } : u)
        );
      }
    } catch (error) {
      console.error('Suspend failed:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteStartup = async (startupId: string) => {
    setActionLoading(startupId);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/admin', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: 'delete-startup', startupId }),
      });
      const data = await res.json();
      if (data.success) {
        setPendingStartups((prev) => prev.filter((s) => s.id !== startupId));
        setAllStartups((prev) => prev.filter((s) => s.id !== startupId));
        fetchAdmin('stats');
        setDeleteConfirm(null);
      } else {
        alert(data.error || 'Failed to delete startup');
      }
    } catch (error) {
      console.error('Delete startup failed:', error);
      alert('Failed to delete startup');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    setActionLoading(userId);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/admin', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: 'delete-user', userId }),
      });
      const data = await res.json();
      if (data.success) {
        setUsers((prev) => prev.filter((u) => u.id !== userId));
        fetchAdmin('stats');
        fetchAdmin('all-startups');
        fetchAdmin('pending-startups');
        setDeleteConfirm(null);
      } else {
        alert(data.error || 'Failed to delete user');
      }
    } catch (error) {
      console.error('Delete user failed:', error);
      alert('Failed to delete user');
    } finally {
      setActionLoading(null);
    }
  };

  const handleWithdrawalAction = async (withdrawalId: string, action: 'approve-withdrawal' | 'reject-withdrawal') => {
    setActionLoading(withdrawalId);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/admin', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action, withdrawalId, adminNote: withdrawalNote }),
      });
      const data = await res.json();
      if (data.success) {
        fetchAdmin('withdrawals');
        fetchAdmin('stats');
        setWithdrawalNote('');
      }
    } catch (error) {
      console.error('Withdrawal action failed:', error);
    } finally {
      setActionLoading(null);
    }
  };

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-blue border-t-transparent rounded-full" />
      </div>
    );
  }

  const filteredUsers = users.filter(
    (u) =>
      u.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center gap-3 mb-1">
            <ShieldCheckIcon className="w-7 h-7 text-blue" />
            <h1 className="text-2xl font-bold text-foreground">Admin Panel</h1>
          </div>
          <p className="text-muted text-sm">Platform moderation and management</p>
        </motion.div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Users', value: stats.totalUsers, icon: UsersIcon, color: 'text-blue' },
            { label: 'Total Startups', value: stats.totalStartups, icon: RocketLaunchIcon, color: 'text-purple' },
            { label: 'Total Funding', value: formatCurrency(stats.totalFunding), icon: CurrencyRupeeIcon, color: 'text-emerald-400' },
            { label: 'Pending Review', value: stats.pendingReview, icon: ExclamationTriangleIcon, color: 'text-orange' },
          ].map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.label} className="p-5">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg bg-card-hover flex items-center justify-center ${stat.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xl font-bold text-foreground">{stat.value}</p>
                    <p className="text-xs text-muted">{stat.label}</p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-border mb-8 overflow-x-auto">
          {([
            { id: 'overview' as Tab, label: 'Overview' },
            { id: 'pending' as Tab, label: `Pending (${pendingStartups.length})` },
            { id: 'startups' as Tab, label: `All Startups (${allStartups.length})` },
            { id: 'users' as Tab, label: 'Users' },
            { id: 'withdrawals' as Tab, label: `Withdrawals (${withdrawals.filter(w => w.status === 'PENDING').length})` },
            { id: 'contacts' as Tab, label: `Contacts (${contacts.filter(c => !c.isRead).length})` },
            { id: 'reports' as Tab, label: 'Reports' },
            { id: 'competition' as Tab, label: `Competition (${competitionData?._count?.entries || 0})` },
            { id: 'vsc' as Tab, label: `VSC (${vscData?._count?.participants || 0})` },
            { id: 'settings' as Tab, label: 'Settings' },
          ]).map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                tab === t.id
                  ? 'border-blue text-blue'
                  : 'border-transparent text-muted hover:text-foreground'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Overview */}
        {tab === 'overview' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid md:grid-cols-2 gap-6">
            <Card className="p-6">
              <h2 className="font-semibold text-foreground mb-4">Pending Approvals</h2>
              {pendingStartups.length === 0 ? (
                <p className="text-muted text-sm">No startups pending review</p>
              ) : (
                <div className="space-y-3">
                  {pendingStartups.slice(0, 5).map((s) => (
                    <div key={s.id} className="flex items-center justify-between p-3 rounded-xl bg-card-hover">
                      <div>
                        <p className="font-medium text-foreground text-sm">{s.title}</p>
                        <p className="text-xs text-muted">{s.founder.firstName} {s.founder.lastName}</p>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => router.push(`/startup/${s.slug}`)}
                          className="p-1.5 rounded-lg hover:bg-blue/10 text-blue"
                          title="View startup"
                        >
                          <EyeIcon className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleStartupAction(s.id, 'approve-startup')}
                          disabled={actionLoading === s.id}
                          className="p-1.5 rounded-lg hover:bg-emerald-500/10 text-emerald-400"
                        >
                          <CheckCircleIcon className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleStartupAction(s.id, 'reject-startup')}
                          disabled={actionLoading === s.id}
                          className="p-1.5 rounded-lg hover:bg-red-500/10 text-red-400"
                        >
                          <XCircleIcon className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <Card className="p-6">
              <h2 className="font-semibold text-foreground mb-4">Recent Users</h2>
              {users.length === 0 ? (
                <p className="text-muted text-sm">No users yet</p>
              ) : (
                <div className="space-y-3">
                  {users.slice(0, 5).map((u) => (
                    <div key={u.id} className="flex items-center justify-between p-3 rounded-xl bg-card-hover">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue to-purple flex items-center justify-center text-white text-xs font-bold">
                          {u.firstName[0]}
                        </div>
                        <div>
                          <p className="font-medium text-foreground text-sm">{u.firstName} {u.lastName}</p>
                          <p className="text-xs text-muted">{u.email}</p>
                        </div>
                      </div>
                      <Badge variant={u.role === 'ADMIN' ? 'info' : u.role === 'FOUNDER' ? 'success' : 'default'}>
                        {u.role}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </motion.div>
        )}

        {/* Pending */}
        {tab === 'pending' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {pendingStartups.length === 0 ? (
              <Card className="p-12 text-center">
                <CheckCircleIcon className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
                <p className="text-foreground font-medium">All caught up!</p>
                <p className="text-muted text-sm">No startups pending review</p>
              </Card>
            ) : (
              <div className="space-y-4">
                {pendingStartups.map((s) => (
                  <Card key={s.id} className="p-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <h3 className="font-semibold text-foreground">{s.title}</h3>
                        <p className="text-sm text-muted">
                          Category: {s.category} &bull; By: {s.founder.firstName} {s.founder.lastName} ({s.founder.email})
                        </p>
                        <p className="text-xs text-muted mt-1">
                          Submitted {new Date(s.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/startup/${s.slug}`)}
                        >
                          <EyeIcon className="w-4 h-4 mr-1" /> View
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleStartupAction(s.id, 'approve-startup')}
                          isLoading={actionLoading === s.id}
                        >
                          <CheckCircleIcon className="w-4 h-4 mr-1" /> Approve
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleStartupAction(s.id, 'reject-startup')}
                          isLoading={actionLoading === s.id}
                        >
                          <XCircleIcon className="w-4 h-4 mr-1" /> Reject
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteConfirm({ type: 'startup', id: s.id, name: s.title })}
                          className="!text-red-400 hover:!bg-red-500/10"
                        >
                          <TrashIcon className="w-4 h-4 mr-1" /> Delete
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* All Startups */}
        {tab === 'startups' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {allStartups.length === 0 ? (
              <Card className="p-12 text-center">
                <RocketLaunchIcon className="w-12 h-12 text-muted mx-auto mb-3" />
                <p className="text-foreground font-medium">No startups on the platform</p>
                <p className="text-muted text-sm">Startups will appear here once founders submit ideas.</p>
              </Card>
            ) : (
              <Card className="overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-card">
                        <th className="px-4 py-3 text-left text-muted font-medium">Startup</th>
                        <th className="px-4 py-3 text-left text-muted font-medium">Founder</th>
                        <th className="px-4 py-3 text-left text-muted font-medium">Category</th>
                        <th className="px-4 py-3 text-left text-muted font-medium">Status</th>
                        <th className="px-4 py-3 text-left text-muted font-medium">Funding</th>
                        <th className="px-4 py-3 text-left text-muted font-medium">Submitted</th>
                        <th className="px-4 py-3 text-left text-muted font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allStartups.map((s) => (
                        <tr key={s.id} className="border-b border-border/50 hover:bg-card-hover transition-colors">
                          <td className="px-4 py-3 font-medium text-foreground">{s.title}</td>
                          <td className="px-4 py-3 text-muted">{s.founder.firstName} {s.founder.lastName}</td>
                          <td className="px-4 py-3 text-muted">{s.category}</td>
                          <td className="px-4 py-3">
                            <Badge variant={
                              s.status === 'APPROVED' ? 'success' :
                              s.status === 'PENDING' ? 'warning' :
                              s.status === 'REJECTED' ? 'danger' : 'default'
                            }>
                              {s.status}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-foreground">
                            {s.campaign
                              ? `${formatCurrency(s.campaign.raisedAmount)} / ${formatCurrency(s.campaign.fundingGoal)}`
                              : 'No campaign'}
                          </td>
                          <td className="px-4 py-3 text-muted">{new Date(s.createdAt).toLocaleDateString()}</td>
                          <td className="px-4 py-3">
                            <div className="flex gap-1">
                              <button
                                onClick={() => router.push(`/startup/${s.slug}`)}
                                className="p-1.5 rounded-lg hover:bg-blue/10 text-blue"
                                title="View"
                              >
                                <EyeIcon className="w-4 h-4" />
                              </button>
                              {s.status === 'PENDING' && (
                                <>
                                  <button
                                    onClick={() => handleStartupAction(s.id, 'approve-startup')}
                                    disabled={actionLoading === s.id}
                                    className="p-1.5 rounded-lg hover:bg-emerald-500/10 text-emerald-400"
                                    title="Approve"
                                  >
                                    <CheckCircleIcon className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleStartupAction(s.id, 'reject-startup')}
                                    disabled={actionLoading === s.id}
                                    className="p-1.5 rounded-lg hover:bg-red-500/10 text-red-400"
                                    title="Reject"
                                  >
                                    <XCircleIcon className="w-4 h-4" />
                                  </button>
                                </>
                              )}
                              <button
                                onClick={() => setDeleteConfirm({ type: 'startup', id: s.id, name: s.title })}
                                className="p-1.5 rounded-lg hover:bg-red-500/10 text-red-400"
                                title="Delete"
                              >
                                <TrashIcon className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}
          </motion.div>
        )}

        {/* Users */}
        {tab === 'users' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="mb-4">
              <div className="relative max-w-md">
                <MagnifyingGlassIcon className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search users..."
                  className="w-full bg-input border border-border rounded-xl pl-10 pr-4 py-2.5 text-foreground placeholder-muted text-sm focus:outline-none focus:border-blue"
                />
              </div>
            </div>
            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-card">
                      <th className="px-4 py-3 text-left text-muted font-medium">User</th>
                      <th className="px-4 py-3 text-left text-muted font-medium">Email</th>
                      <th className="px-4 py-3 text-left text-muted font-medium">Role</th>
                      <th className="px-4 py-3 text-left text-muted font-medium">Status</th>
                      <th className="px-4 py-3 text-left text-muted font-medium">Joined</th>
                      <th className="px-4 py-3 text-left text-muted font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((u) => (
                      <tr key={u.id} className="border-b border-border/50 hover:bg-card-hover transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue to-purple flex items-center justify-center text-white text-xs font-bold">
                              {u.firstName[0]}
                            </div>
                            <span className="font-medium text-foreground">{u.firstName} {u.lastName}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-muted">{u.email}</td>
                        <td className="px-4 py-3">
                          <Badge variant={u.role === 'ADMIN' ? 'info' : u.role === 'FOUNDER' ? 'success' : 'default'}>
                            {u.role}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={u.isActive ? 'success' : 'danger'}>
                            {u.isActive ? 'Active' : 'Suspended'}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-muted">{new Date(u.createdAt).toLocaleDateString()}</td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1 items-center">
                            <button
                              onClick={() => setViewUser(u)}
                              className="p-1.5 rounded-lg hover:bg-blue/10 text-blue"
                              title="View user"
                            >
                              <EyeIcon className="w-4 h-4" />
                            </button>
                            {u.role !== 'ADMIN' && (
                              <>
                                <button
                                  onClick={() => handleSuspendUser(u.id)}
                                  disabled={actionLoading === u.id}
                                  className={`text-xs px-2 py-1 rounded-lg ${u.isActive ? 'text-orange hover:bg-orange/10' : 'text-emerald-400 hover:bg-emerald-500/10'}`}
                                >
                                  {u.isActive ? 'Suspend' : 'Reactivate'}
                                </button>
                                <button
                                  onClick={() => setDeleteConfirm({ type: 'user', id: u.id, name: `${u.firstName} ${u.lastName}` })}
                                  className="p-1.5 rounded-lg hover:bg-red-500/10 text-red-400"
                                  title="Delete user"
                                >
                                  <TrashIcon className="w-4 h-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Withdrawals */}
        {tab === 'withdrawals' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {withdrawals.length === 0 ? (
              <Card className="p-12 text-center">
                <BanknotesIcon className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
                <p className="text-foreground font-medium">No withdrawal requests</p>
                <p className="text-muted text-sm">Withdrawal requests from founders will appear here</p>
              </Card>
            ) : (
              <div className="space-y-4">
                {withdrawals.map((w) => (
                  <Card key={w.id} className="p-5">
                    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-foreground">
                            {formatCurrency(w.amount)}
                          </h3>
                          <Badge
                            variant={
                              w.status === 'APPROVED' ? 'success' :
                              w.status === 'REJECTED' ? 'danger' :
                              w.status === 'COMPLETED' ? 'info' : 'warning'
                            }
                          >
                            {w.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted mb-1">
                          <span className="text-foreground font-medium">{w.user.firstName} {w.user.lastName}</span>
                          {' '}&bull; {w.user.email}
                        </p>
                        <p className="text-sm text-muted mb-2">
                          Campaign: <span className="text-foreground">{w.campaign.startup.title}</span>
                        </p>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-muted bg-card-hover rounded-lg p-3">
                          <div><span className="font-medium text-foreground">Bank:</span> {w.bankName}</div>
                          <div><span className="font-medium text-foreground">A/C:</span> {w.accountNumber}</div>
                          <div><span className="font-medium text-foreground">IFSC:</span> {w.ifscCode}</div>
                          <div><span className="font-medium text-foreground">Holder:</span> {w.accountHolder}</div>
                        </div>
                        {w.note && <p className="text-xs text-muted mt-2">Note: {w.note}</p>}
                        <p className="text-xs text-muted mt-1">
                          Requested: {new Date(w.createdAt).toLocaleString()}
                        </p>
                      </div>
                      {w.status === 'PENDING' && (
                        <div className="flex flex-col gap-2 shrink-0 min-w-[200px]">
                          <input
                            type="text"
                            placeholder="Admin note (optional)"
                            value={withdrawalNote}
                            onChange={(e) => setWithdrawalNote(e.target.value)}
                            className="w-full px-3 py-2 bg-input border border-border rounded-lg text-sm text-foreground placeholder-muted focus:outline-none focus:border-blue"
                          />
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleWithdrawalAction(w.id, 'approve-withdrawal')}
                              isLoading={actionLoading === w.id}
                              className="flex-1"
                            >
                              <CheckCircleIcon className="w-4 h-4 mr-1" /> Approve
                            </Button>
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => handleWithdrawalAction(w.id, 'reject-withdrawal')}
                              isLoading={actionLoading === w.id}
                              className="flex-1"
                            >
                              <XCircleIcon className="w-4 h-4 mr-1" /> Reject
                            </Button>
                          </div>
                        </div>
                      )}
                      {w.adminNote && (
                        <p className="text-xs text-muted italic">Admin: {w.adminNote}</p>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Reports */}
        {tab === 'reports' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            {reports ? (
              <>
                {/* Key Metrics */}
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    { label: 'Total Users', value: reports.totalUsers, icon: UsersIcon, color: 'text-blue' },
                    { label: 'Total Startups', value: reports.totalStartups, icon: RocketLaunchIcon, color: 'text-purple' },
                    { label: 'Total Campaigns', value: reports.totalCampaigns, icon: ArrowTrendingUpIcon, color: 'text-orange' },
                    { label: 'Total Funding', value: formatCurrency(reports.totalFunding), icon: CurrencyRupeeIcon, color: 'text-emerald-400' },
                    { label: 'Avg per Campaign', value: formatCurrency(reports.avgFunding), icon: ChartBarIcon, color: 'text-cyan-400' },
                    { label: 'Total Contributions', value: reports.totalContributions, icon: BanknotesIcon, color: 'text-yellow-400' },
                  ].map((m) => {
                    const Icon = m.icon;
                    return (
                      <Card key={m.label} className="p-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-lg bg-card-hover flex items-center justify-center ${m.color}`}>
                            <Icon className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-lg font-bold text-foreground">{m.value}</p>
                            <p className="text-xs text-muted">{m.label}</p>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>

                {/* Startups by Status */}
                <div className="grid md:grid-cols-2 gap-6">
                  <Card className="p-6">
                    <h3 className="font-semibold text-foreground mb-4">Startups by Status</h3>
                    {reports.startupsByStatus.length === 0 ? (
                      <p className="text-muted text-sm">No startup data yet</p>
                    ) : (
                      <div className="space-y-3">
                        {reports.startupsByStatus.map((s) => (
                          <div key={s.status} className="flex items-center justify-between p-3 rounded-lg bg-card-hover">
                            <Badge
                              variant={
                                s.status === 'APPROVED' ? 'success' :
                                s.status === 'REJECTED' ? 'danger' :
                                s.status === 'PENDING' ? 'warning' : 'default'
                              }
                            >
                              {s.status}
                            </Badge>
                            <span className="font-bold text-foreground">{s.count}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </Card>

                  <Card className="p-6">
                    <h3 className="font-semibold text-foreground mb-4">Campaigns by Status</h3>
                    {reports.campaignsByStatus.length === 0 ? (
                      <p className="text-muted text-sm">No campaign data yet</p>
                    ) : (
                      <div className="space-y-3">
                        {reports.campaignsByStatus.map((c) => (
                          <div key={c.status} className="flex items-center justify-between p-3 rounded-lg bg-card-hover">
                            <Badge
                              variant={
                                c.status === 'ACTIVE' ? 'success' :
                                c.status === 'COMPLETED' ? 'info' :
                                c.status === 'FAILED' ? 'danger' : 'default'
                              }
                            >
                              {c.status}
                            </Badge>
                            <span className="font-bold text-foreground">{c.count}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </Card>
                </div>

                {/* Withdrawal Summary */}
                <Card className="p-6">
                  <h3 className="font-semibold text-foreground mb-4">Withdrawal Summary</h3>
                  {reports.withdrawalStats.length === 0 ? (
                    <p className="text-muted text-sm">No withdrawals yet</p>
                  ) : (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      {reports.withdrawalStats.map((w) => (
                        <div key={w.status} className="p-4 rounded-xl bg-card-hover text-center">
                          <Badge
                            variant={
                              w.status === 'APPROVED' || w.status === 'COMPLETED' ? 'success' :
                              w.status === 'REJECTED' ? 'danger' : 'warning'
                            }
                          >
                            {w.status}
                          </Badge>
                          <p className="text-lg font-bold text-foreground mt-2">{w.count}</p>
                          <p className="text-xs text-muted">{formatCurrency(w.amount)}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              </>
            ) : (
              <Card className="p-12 text-center">
                <div className="animate-spin w-8 h-8 border-2 border-blue border-t-transparent rounded-full mx-auto" />
                <p className="text-muted mt-4">Loading reports...</p>
              </Card>
            )}
          </motion.div>
        )}

        {/* Contacts */}
        {tab === 'contacts' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            {contacts.length === 0 ? (
              <Card className="p-12 text-center">
                <p className="text-muted">No contact submissions yet.</p>
              </Card>
            ) : (
              contacts.map((c) => (
                <Card key={c.id} className={`p-5 ${!c.isRead ? 'border-blue/30 bg-blue/5' : ''}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-foreground">{c.subject}</h3>
                        {!c.isRead && <span className="text-xs bg-blue/20 text-blue px-2 py-0.5 rounded-full">New</span>}
                      </div>
                      <p className="text-sm text-muted mb-2">From: {c.name} &lt;{c.email}&gt;</p>
                      <p className="text-sm text-foreground whitespace-pre-wrap">{c.message}</p>
                      <p className="text-xs text-muted mt-2">{new Date(c.createdAt).toLocaleString('en-IN')}</p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      {!c.isRead && (
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={actionLoading === c.id}
                          onClick={async () => {
                            setActionLoading(c.id);
                            try {
                              const token = localStorage.getItem('token');
                              await fetch('/api/admin', {
                                method: 'PATCH',
                                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                                body: JSON.stringify({ action: 'mark-contact-read', contactId: c.id }),
                              });
                              setContacts(prev => prev.map(x => x.id === c.id ? { ...x, isRead: true } : x));
                            } catch {}
                            setActionLoading(null);
                          }}
                        >
                          Mark Read
                        </Button>
                      )}
                      <Button
                        variant="danger"
                        size="sm"
                        disabled={actionLoading === c.id}
                        onClick={async () => {
                          setActionLoading(c.id);
                          try {
                            const token = localStorage.getItem('token');
                            await fetch('/api/admin', {
                              method: 'DELETE',
                              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                              body: JSON.stringify({ action: 'delete-contact', contactId: c.id }),
                            });
                            setContacts(prev => prev.filter(x => x.id !== c.id));
                          } catch {}
                          setActionLoading(null);
                        }}
                      >
                        <TrashIcon className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </motion.div>
        )}

        {/* Competition Tab */}
        {tab === 'competition' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            {competitionData ? (
              <>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">{competitionData.name}</h3>
                    <p className="text-sm text-muted">
                      Phase: <span className="text-blue font-medium">{competitionData.currentPhase}</span> &middot; {competitionData._count.entries} entries &middot; {competitionData._count.participants || 0} participants &middot; {competitionData._count.citizenPasses || 0} passes
                    </p>
                  </div>
                  <Button size="sm" variant="ghost" onClick={fetchCompetitionEntries}>Refresh</Button>
                </div>

                {/* Sub-tabs */}
                <div className="flex gap-1 bg-card rounded-lg p-1 flex-wrap">
                  {(['entries', 'participants', 'details', 'sponsors', 'campus-partners', 'judges', 'citizen-passes', 'free-entries', 'page-content'] as const).map((st) => (
                    <button
                      key={st}
                      onClick={() => { setCompSubTab(st); if (st === 'page-content') initPageContentForm(); }}
                      className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors capitalize whitespace-nowrap ${
                        compSubTab === st ? 'bg-blue text-white' : 'text-muted hover:text-foreground'
                      }`}
                    >
                      {st === 'page-content' ? 'Page Content' : st === 'citizen-passes' ? `Passes (${competitionData?.citizenPasses?.length || 0})` : st === 'campus-partners' ? 'Campus Partners' : st === 'participants' ? `Participants (${competitionData?.participants?.length || 0})` : st === 'free-entries' ? `Free Entry (${competitionData?.freeEntries?.length || 0})` : st}
                    </button>
                  ))}
                </div>

                {/* Entries Sub-tab */}
                {compSubTab === 'entries' && (
                  <>
                    {competitionData.entries.length === 0 ? (
                      <Card className="p-8 text-center">
                        <TrophyIcon className="w-12 h-12 mx-auto text-muted mb-3" />
                        <p className="text-muted">No entries registered yet.</p>
                      </Card>
                    ) : (
                      <div className="space-y-3">
                        {competitionData.entries.map((entry) => (
                          <Card key={entry.id} className="p-4">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-lg bg-card-hover flex items-center justify-center overflow-hidden flex-shrink-0">
                                {entry.startup.logo ? (
                                  <img src={entry.startup.logo} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  <RocketLaunchIcon className="w-6 h-6 text-muted" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-foreground truncate">{entry.startup.title}</h4>
                                <p className="text-xs text-muted">
                                  {entry.user.firstName} {entry.user.lastName} &middot; {entry.user.email}
                                </p>
                                <p className="text-xs text-muted mt-0.5">
                                  {entry.startup.category} &middot; Registered {new Date(entry.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                              <div className="text-right flex-shrink-0 space-y-1">
                                <Badge variant={
                                  entry.status === 'WINNER' ? 'success' :
                                  entry.status === 'ELIMINATED' ? 'danger' :
                                  entry.status === 'FINALIST' ? 'info' :
                                  entry.status === 'SUBMITTED' ? 'default' : 'warning'
                                }>
                                  {entry.status}
                                </Badge>
                                <p className="text-xs text-muted">{entry.upvotes} votes</p>
                              </div>
                              <div className="flex-shrink-0">
                                <select
                                  className="text-xs bg-card border border-border rounded px-2 py-1.5 text-foreground"
                                  value={entry.status}
                                  disabled={entryStatusLoading === entry.id}
                                  onChange={(e) => updateEntryStatus(entry.id, e.target.value)}
                                >
                                  <option value="SUBMITTED">Submitted</option>
                                  <option value="SHORTLISTED">Shortlisted</option>
                                  <option value="SELECTED_TOP200">Top 200</option>
                                  <option value="PUBLIC_VOTING">Public Voting</option>
                                  <option value="FINALIST">Finalist</option>
                                  <option value="WINNER">Winner</option>
                                  <option value="ELIMINATED">Eliminated</option>
                                </select>
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    )}
                  </>
                )}

                {/* Participants Sub-tab */}
                {compSubTab === 'participants' && (
                  <>
                    {(!competitionData.participants || competitionData.participants.length === 0) ? (
                      <Card className="p-8 text-center">
                        <UserGroupIcon className="w-12 h-12 mx-auto text-muted mb-3" />
                        <p className="text-muted">No participants registered yet.</p>
                      </Card>
                    ) : (
                      <>
                        {/* Summary stats */}
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
                          <Card className="p-3 text-center">
                            <p className="text-2xl font-bold text-foreground">{competitionData.participants.length}</p>
                            <p className="text-xs text-muted">Total</p>
                          </Card>
                          <Card className="p-3 text-center">
                            <p className="text-2xl font-bold text-green-400">{competitionData.participants.filter((p) => p.paymentStatus === 'PAID').length}</p>
                            <p className="text-xs text-muted">Paid</p>
                          </Card>
                          <Card className="p-3 text-center">
                            <p className="text-2xl font-bold text-blue">{competitionData.participants.filter((p) => p.ideaTitle).length}</p>
                            <p className="text-xs text-muted">Ideas Submitted</p>
                          </Card>
                          <Card className="p-3 text-center">
                            <p className="text-2xl font-bold text-amber-400">{competitionData.participants.filter((p) => p.participationMode === 'EVENT_ACCESS').length}</p>
                            <p className="text-xs text-muted">Event Access</p>
                          </Card>
                          <Card className="p-3 text-center">
                            <p className="text-2xl font-bold text-foreground">₹{competitionData.participants.filter((p) => p.paymentStatus === 'PAID').reduce((sum, p) => sum + (p.totalFee || 0), 0).toLocaleString()}</p>
                            <p className="text-xs text-muted">Revenue</p>
                          </Card>
                        </div>

                        {/* Download CSV button */}
                        <div className="flex justify-end mb-3">
                          <Button size="sm" variant="ghost" onClick={exportParticipantsCSV}>
                            <ArrowDownTrayIcon className="w-4 h-4 mr-1" /> Download CSV
                          </Button>
                        </div>

                        <div className="space-y-3">
                          {competitionData.participants.map((p) => (
                            <Card key={p.id} className="p-4">
                              <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-purple/20 flex items-center justify-center text-sm font-bold text-purple flex-shrink-0">
                                  {p.user.firstName[0]}{p.user.lastName[0]}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-medium text-foreground truncate">{p.user.firstName} {p.user.lastName}</h4>
                                  <p className="text-xs text-muted">{p.user.email} &middot; {p.phone}</p>
                                  <p className="text-xs text-muted mt-0.5">
                                    {p.participantType === 'STUDENT' ? `Student — ${p.college}` : `Professional${p.company ? ` — ${p.company}` : ''}`}
                                    {p.designation && ` · ${p.designation}`}
                                    {' '}&middot; {p.city}, {p.state}
                                    {' '}&middot; <span className={p.participationMode === 'EVENT_ACCESS' ? 'text-amber-400' : 'text-purple'}>{p.participationMode === 'EVENT_ACCESS' ? '🎫 Event Access' : '💡 Idea Submission'}</span>
                                  </p>
                                  {p.ideaTitle && (
                                    <p className="text-xs text-blue mt-0.5">💡 {p.ideaTitle} ({p.ideaCategory}) &middot; Team: {p.teamSize}</p>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                  <button
                                    className="p-1.5 rounded-md hover:bg-card-hover text-muted hover:text-foreground transition-colors"
                                    title="View Details"
                                    onClick={() => setSelectedParticipant(p)}
                                  >
                                    <EyeIcon className="w-4 h-4" />
                                  </button>
                                  <button
                                    className="p-1.5 rounded-md hover:bg-red-500/10 text-muted hover:text-red-400 transition-colors"
                                    title="Delete Participant"
                                    disabled={participantStatusLoading === p.id}
                                    onClick={() => deleteParticipant(p.id, `${p.user.firstName} ${p.user.lastName}`)}
                                  >
                                    <TrashIcon className="w-4 h-4" />
                                  </button>
                                  <div className="text-right space-y-1">
                                    <Badge variant={p.paymentStatus === 'PAID' ? 'success' : 'danger'}>
                                      {p.paymentStatus === 'PAID' ? `₹${p.totalFee} Paid` : 'Unpaid'}
                                    </Badge>
                                    <p className="text-xs text-muted">{new Date(p.createdAt).toLocaleDateString()}</p>
                                  </div>
                                  <select
                                    className="text-xs bg-card border border-border rounded px-2 py-1.5 text-foreground"
                                    value={p.status}
                                    disabled={participantStatusLoading === p.id}
                                    onChange={(e) => updateParticipantStatus(p.id, e.target.value)}
                                  >
                                    <option value="REGISTERED">Registered</option>
                                    <option value="IDEA_SUBMITTED">Idea Submitted</option>
                                    <option value="SHORTLISTED">Shortlisted</option>
                                    <option value="SELECTED">Selected</option>
                                    <option value="FINALIST">Finalist</option>
                                    <option value="WINNER">Winner</option>
                                    <option value="ELIMINATED">Eliminated</option>
                                  </select>
                                  <select
                                    className={`text-xs border rounded px-2 py-1.5 ${p.participationMode === 'EVENT_ACCESS' ? 'bg-amber-400/10 border-amber-400/30 text-amber-400' : 'bg-purple/10 border-purple/30 text-purple'}`}
                                    value={p.participationMode || 'IDEA_SUBMISSION'}
                                    disabled={participantStatusLoading === p.id}
                                    onChange={(e) => updateParticipantMode(p.id, e.target.value)}
                                  >
                                    <option value="IDEA_SUBMISSION">💡 Idea Submission</option>
                                    <option value="EVENT_ACCESS">🎫 Event Access</option>
                                  </select>
                                </div>
                              </div>
                            </Card>
                          ))}
                        </div>
                      </>
                    )}

                    {/* Participant Detail Modal */}
                    {selectedParticipant && (
                      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelectedParticipant(null)}>
                        <div className="bg-card rounded-xl border border-border w-full max-w-3xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                          <div className="sticky top-0 bg-card border-b border-border p-4 flex items-center justify-between z-10">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-purple/20 flex items-center justify-center text-sm font-bold text-purple">
                                {selectedParticipant.user.firstName[0]}{selectedParticipant.user.lastName[0]}
                              </div>
                              <div>
                                <h3 className="font-semibold text-foreground">{selectedParticipant.user.firstName} {selectedParticipant.user.lastName}</h3>
                                <p className="text-xs text-muted">{selectedParticipant.user.email}</p>
                              </div>
                            </div>
                            <button onClick={() => setSelectedParticipant(null)} className="p-1 hover:bg-card-hover rounded-md">
                              <XMarkIcon className="w-5 h-5 text-muted" />
                            </button>
                          </div>

                          <div className="p-4 space-y-5">
                            {/* Profile Info */}
                            <div>
                              <h4 className="text-sm font-semibold text-foreground mb-2 border-b border-border pb-1">Profile Information</h4>
                              <div className="grid grid-cols-2 gap-3 text-sm">
                                <div><span className="text-muted">Phone:</span> <span className="text-foreground">{selectedParticipant.phone}</span></div>
                                <div><span className="text-muted">Type:</span> <span className="text-foreground">{selectedParticipant.participantType}</span></div>
                                <div><span className="text-muted">Mode:</span> <span className={selectedParticipant.participationMode === 'EVENT_ACCESS' ? 'text-amber-400' : 'text-purple'}>{selectedParticipant.participationMode === 'EVENT_ACCESS' ? '🎫 Event Access' : '💡 Idea Submission'}</span></div>
                                {selectedParticipant.college && <div><span className="text-muted">College:</span> <span className="text-foreground">{selectedParticipant.college}</span></div>}
                                {selectedParticipant.company && <div><span className="text-muted">Company:</span> <span className="text-foreground">{selectedParticipant.company}</span></div>}
                                {selectedParticipant.designation && <div><span className="text-muted">Designation:</span> <span className="text-foreground">{selectedParticipant.designation}</span></div>}
                                <div><span className="text-muted">City:</span> <span className="text-foreground">{selectedParticipant.city}</span></div>
                                <div><span className="text-muted">State:</span> <span className="text-foreground">{selectedParticipant.state}</span></div>
                                <div><span className="text-muted">Registered:</span> <span className="text-foreground">{new Date(selectedParticipant.createdAt).toLocaleString()}</span></div>
                              </div>
                            </div>

                            {/* Idea Submission */}
                            {selectedParticipant.ideaTitle ? (
                              <div>
                                <h4 className="text-sm font-semibold text-foreground mb-2 border-b border-border pb-1">Idea Submission</h4>
                                <div className="space-y-3 text-sm">
                                  <div className="grid grid-cols-2 gap-3">
                                    <div><span className="text-muted">Title:</span> <span className="text-foreground font-medium">{selectedParticipant.ideaTitle}</span></div>
                                    <div><span className="text-muted">Category:</span> <span className="text-foreground">{selectedParticipant.ideaCategory}</span></div>
                                    <div><span className="text-muted">Product Stage:</span> <span className="text-foreground">{selectedParticipant.productStage || 'N/A'}</span></div>
                                  </div>
                                  {selectedParticipant.ideaDescription && (
                                    <div>
                                      <p className="text-muted mb-1">Description:</p>
                                      <p className="text-foreground bg-background rounded p-2 text-xs whitespace-pre-wrap break-words overflow-hidden">{selectedParticipant.ideaDescription}</p>
                                    </div>
                                  )}
                                  {selectedParticipant.problemStatement && (
                                    <div>
                                      <p className="text-muted mb-1">Problem Statement:</p>
                                      <p className="text-foreground bg-background rounded p-2 text-xs whitespace-pre-wrap break-words overflow-hidden">{selectedParticipant.problemStatement}</p>
                                    </div>
                                  )}
                                  {selectedParticipant.solution && (
                                    <div>
                                      <p className="text-muted mb-1">Solution:</p>
                                      <p className="text-foreground bg-background rounded p-2 text-xs whitespace-pre-wrap break-words overflow-hidden">{selectedParticipant.solution}</p>
                                    </div>
                                  )}
                                  {selectedParticipant.targetAudience && (
                                    <div>
                                      <p className="text-muted mb-1">Target Audience:</p>
                                      <p className="text-foreground bg-background rounded p-2 text-xs whitespace-pre-wrap break-words overflow-hidden">{selectedParticipant.targetAudience}</p>
                                    </div>
                                  )}
                                  {selectedParticipant.uniqueness && (
                                    <div>
                                      <p className="text-muted mb-1">What makes it unique:</p>
                                      <p className="text-foreground bg-background rounded p-2 text-xs whitespace-pre-wrap break-words overflow-hidden">{selectedParticipant.uniqueness}</p>
                                    </div>
                                  )}
                                  <div className="grid grid-cols-2 gap-3">
                                    {selectedParticipant.pitchDeck && (
                                      <div>
                                        <span className="text-muted">Pitch Deck:</span>{' '}
                                        <a href={selectedParticipant.pitchDeck} target="_blank" rel="noopener noreferrer" className="text-blue hover:underline">View</a>
                                      </div>
                                    )}
                                    {selectedParticipant.demoVideo && (
                                      <div>
                                        <span className="text-muted">Demo Video:</span>{' '}
                                        <a href={selectedParticipant.demoVideo} target="_blank" rel="noopener noreferrer" className="text-blue hover:underline">Watch</a>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div>
                                <h4 className="text-sm font-semibold text-foreground mb-2 border-b border-border pb-1">Idea Submission</h4>
                                <p className="text-sm text-muted italic">No idea submitted yet.</p>
                              </div>
                            )}

                            {/* Team Info */}
                            <div>
                              <h4 className="text-sm font-semibold text-foreground mb-2 border-b border-border pb-1">Team ({selectedParticipant.teamSize} member{selectedParticipant.teamSize > 1 ? 's' : ''})</h4>
                              {selectedParticipant.teamName && <p className="text-sm text-foreground mb-2">Team Name: <span className="font-medium">{selectedParticipant.teamName}</span></p>}
                              <div className="space-y-2">
                                <div className="flex items-center gap-2 text-sm bg-background rounded p-2">
                                  <div className="w-7 h-7 rounded-full bg-gold/20 flex items-center justify-center text-xs font-bold text-gold">👑</div>
                                  <div>
                                    <p className="text-foreground font-medium">{selectedParticipant.user.firstName} {selectedParticipant.user.lastName} <span className="text-xs text-muted">(Leader)</span></p>
                                    <p className="text-xs text-muted">{selectedParticipant.user.email}</p>
                                  </div>
                                </div>
                                {selectedParticipant.teamMembers && selectedParticipant.teamMembers.map((m: { name: string; email: string; role?: string }, i: number) => (
                                  <div key={i} className="flex items-center gap-2 text-sm bg-background rounded p-2">
                                    <div className="w-7 h-7 rounded-full bg-cyan/20 flex items-center justify-center text-xs font-bold text-cyan">{m.name[0]}</div>
                                    <div>
                                      <p className="text-foreground">{m.name} {m.role && <span className="text-xs text-muted">({m.role})</span>}</p>
                                      <p className="text-xs text-muted">{m.email}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Payment Info */}
                            <div>
                              <h4 className="text-sm font-semibold text-foreground mb-2 border-b border-border pb-1">Payment</h4>
                              <div className="grid grid-cols-2 gap-3 text-sm">
                                <div><span className="text-muted">Total Fee:</span> <span className="text-foreground font-medium">{selectedParticipant.totalFee != null ? `₹${selectedParticipant.totalFee}` : 'N/A'}</span></div>
                                <div><span className="text-muted">Status:</span> <Badge variant={selectedParticipant.paymentStatus === 'PAID' ? 'success' : 'danger'}>{selectedParticipant.paymentStatus}</Badge></div>
                                {selectedParticipant.razorpayOrderId && <div><span className="text-muted">Order ID:</span> <span className="text-foreground text-xs font-mono">{selectedParticipant.razorpayOrderId}</span></div>}
                                {selectedParticipant.razorpayPaymentId && <div><span className="text-muted">Payment ID:</span> <span className="text-foreground text-xs font-mono">{selectedParticipant.razorpayPaymentId}</span></div>}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* Details Sub-tab */}
                {compSubTab === 'details' && (
                  <Card className="p-6 space-y-6">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-foreground">Competition Details</h4>
                      {!compEditMode ? (
                        <Button size="sm" onClick={() => {
                          setCompForm({
                            name: competitionData.name,
                            tagline: competitionData.tagline || '',
                            description: competitionData.description || '',
                            currentPhase: competitionData.currentPhase,
                            studentFee: competitionData.studentFee,
                            founderFee: competitionData.founderFee,
                            boothPrice: competitionData.boothPrice,
                            boothDescription: competitionData.boothDescription || '',
                            manualRegistrations: competitionData.manualRegistrations || 0,
                            showSponsorPrices: competitionData.showSponsorPrices ? 1 : 0,
                            showFinalDate: competitionData.showFinalDate ? 1 : 0,
                            registrationStart: competitionData.registrationStart?.slice(0, 10) || '',
                            registrationEnd: competitionData.registrationEnd?.slice(0, 10) || '',
                            screeningEnd: competitionData.screeningEnd?.slice(0, 10) || '',
                            votingEnd: competitionData.votingEnd?.slice(0, 10) || '',
                            finalsDate: competitionData.finalsDate?.slice(0, 10) || '',
                          });
                          setCompEditMode(true);
                        }}>Edit</Button>
                      ) : (
                        <div className="flex gap-2">
                          <Button size="sm" variant="ghost" onClick={() => setCompEditMode(false)}>Cancel</Button>
                          <Button size="sm" onClick={saveCompetitionDetails} isLoading={compSaving}>Save</Button>
                        </div>
                      )}
                    </div>

                    {compEditMode ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                          <label className="block text-xs text-muted mb-1">Name</label>
                          <input className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground" value={compForm.name || ''} onChange={(e) => setCompForm({ ...compForm, name: e.target.value })} />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-xs text-muted mb-1">Tagline</label>
                          <input className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground" value={compForm.tagline || ''} onChange={(e) => setCompForm({ ...compForm, tagline: e.target.value })} />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-xs text-muted mb-1">Description</label>
                          <textarea rows={3} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground" value={compForm.description || ''} onChange={(e) => setCompForm({ ...compForm, description: e.target.value })} />
                        </div>
                        <div>
                          <label className="block text-xs text-muted mb-1">Current Phase</label>
                          <select className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground" value={compForm.currentPhase || ''} onChange={(e) => setCompForm({ ...compForm, currentPhase: e.target.value })}>
                            <option value="REGISTRATION">Registration</option>
                            <option value="SCREENING">Screening</option>
                            <option value="PUBLIC_VOTING">Public Voting</option>
                            <option value="FINALS">Finals</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs text-muted mb-1">Student Fee (₹)</label>
                          <input type="number" className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground" value={compForm.studentFee || ''} onChange={(e) => setCompForm({ ...compForm, studentFee: parseFloat(e.target.value) || 0 })} />
                        </div>
                        <div>
                          <label className="block text-xs text-muted mb-1">Founder Fee (₹)</label>
                          <input type="number" className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground" value={compForm.founderFee || ''} onChange={(e) => setCompForm({ ...compForm, founderFee: parseFloat(e.target.value) || 0 })} />
                        </div>
                        <div>
                          <label className="block text-xs text-muted mb-1">Booth Price (₹)</label>
                          <input type="number" className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground" value={compForm.boothPrice || ''} onChange={(e) => setCompForm({ ...compForm, boothPrice: parseFloat(e.target.value) || 0 })} />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-xs text-muted mb-1">Booth Description</label>
                          <textarea rows={2} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground" value={compForm.boothDescription || ''} onChange={(e) => setCompForm({ ...compForm, boothDescription: e.target.value })} />
                        </div>
                        <div>
                          <label className="block text-xs text-muted mb-1">Manual Registrations Count</label>
                          <input type="number" min="0" className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground" value={compForm.manualRegistrations ?? 0} onChange={(e) => setCompForm({ ...compForm, manualRegistrations: parseInt(e.target.value) || 0 })} />
                          <p className="text-xs text-muted mt-1">Added to actual registration count on the public page</p>
                        </div>
                        <div className="flex items-center justify-between md:col-span-2 bg-background border border-border rounded-lg px-4 py-3">
                          <div>
                            <label className="block text-sm font-medium text-foreground">Show Sponsor Prices</label>
                            <p className="text-xs text-muted mt-0.5">Display sponsor tier prices on the public competition page</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setCompForm({ ...compForm, showSponsorPrices: compForm.showSponsorPrices ? 0 : 1 })}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${compForm.showSponsorPrices ? 'bg-green-500' : 'bg-gray-600'}`}
                          >
                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${compForm.showSponsorPrices ? 'translate-x-6' : 'translate-x-1'}`} />
                          </button>
                        </div>
                        <div className="flex items-center justify-between md:col-span-2 bg-background border border-border rounded-lg px-4 py-3">
                          <div>
                            <label className="block text-sm font-medium text-foreground">Show Final Date</label>
                            <p className="text-xs text-muted mt-0.5">When disabled, shows &quot;Final date will be announced soon&quot; on the competition page</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setCompForm({ ...compForm, showFinalDate: compForm.showFinalDate ? 0 : 1 })}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${compForm.showFinalDate ? 'bg-green-500' : 'bg-gray-600'}`}
                          >
                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${compForm.showFinalDate ? 'translate-x-6' : 'translate-x-1'}`} />
                          </button>
                        </div>
                        <div>
                          <label className="block text-xs text-muted mb-1">Registration Start</label>
                          <input type="date" className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground" value={compForm.registrationStart || ''} onChange={(e) => setCompForm({ ...compForm, registrationStart: e.target.value })} />
                        </div>
                        <div>
                          <label className="block text-xs text-muted mb-1">Registration End</label>
                          <input type="date" className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground" value={compForm.registrationEnd || ''} onChange={(e) => setCompForm({ ...compForm, registrationEnd: e.target.value })} />
                        </div>
                        <div>
                          <label className="block text-xs text-muted mb-1">Screening End</label>
                          <input type="date" className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground" value={compForm.screeningEnd || ''} onChange={(e) => setCompForm({ ...compForm, screeningEnd: e.target.value })} />
                        </div>
                        <div>
                          <label className="block text-xs text-muted mb-1">Voting End</label>
                          <input type="date" className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground" value={compForm.votingEnd || ''} onChange={(e) => setCompForm({ ...compForm, votingEnd: e.target.value })} />
                        </div>
                        <div>
                          <label className="block text-xs text-muted mb-1">Finals Date</label>
                          <input type="date" className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground" value={compForm.finalsDate || ''} onChange={(e) => setCompForm({ ...compForm, finalsDate: e.target.value })} />
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div className="md:col-span-2">
                          <span className="text-muted">Tagline:</span>
                          <p className="text-foreground">{competitionData.tagline || '—'}</p>
                        </div>
                        <div className="md:col-span-2">
                          <span className="text-muted">Description:</span>
                          <p className="text-foreground">{competitionData.description || '—'}</p>
                        </div>
                        <div>
                          <span className="text-muted">Student Fee:</span>
                          <p className="text-foreground font-medium">{formatCurrency(competitionData.studentFee)}</p>
                        </div>
                        <div>
                          <span className="text-muted">Founder Fee:</span>
                          <p className="text-foreground font-medium">{formatCurrency(competitionData.founderFee)}</p>
                        </div>
                        <div>
                          <span className="text-muted">Booth Price:</span>
                          <p className="text-foreground font-medium">{formatCurrency(competitionData.boothPrice)}</p>
                        </div>
                        <div className="md:col-span-2">
                          <span className="text-muted">Booth Description:</span>
                          <p className="text-foreground">{competitionData.boothDescription || '—'}</p>
                        </div>
                        <div>
                          <span className="text-muted">Manual Registrations:</span>
                          <p className="text-foreground font-medium">{competitionData.manualRegistrations || 0}</p>
                        </div>
                        <div>
                          <span className="text-muted">Sponsor Prices:</span>
                          <p className={`font-medium ${competitionData.showSponsorPrices ? 'text-green-500' : 'text-red-500'}`}>{competitionData.showSponsorPrices ? 'Visible' : 'Hidden'}</p>
                        </div>
                        <div>
                          <span className="text-muted">Final Date:</span>
                          <p className={`font-medium ${competitionData.showFinalDate ? 'text-green-500' : 'text-red-500'}`}>{competitionData.showFinalDate ? 'Visible' : 'Hidden ("Announced Soon")'}</p>
                        </div>
                        <div>
                          <span className="text-muted">Registration:</span>
                          <p className="text-foreground">{competitionData.registrationStart ? new Date(competitionData.registrationStart).toLocaleDateString() : '—'} → {competitionData.registrationEnd ? new Date(competitionData.registrationEnd).toLocaleDateString() : '—'}</p>
                        </div>
                        <div>
                          <span className="text-muted">Screening End:</span>
                          <p className="text-foreground">{competitionData.screeningEnd ? new Date(competitionData.screeningEnd).toLocaleDateString() : '—'}</p>
                        </div>
                        <div>
                          <span className="text-muted">Voting End:</span>
                          <p className="text-foreground">{competitionData.votingEnd ? new Date(competitionData.votingEnd).toLocaleDateString() : '—'}</p>
                        </div>
                        <div>
                          <span className="text-muted">Finals:</span>
                          <p className="text-foreground">{competitionData.finalsDate ? new Date(competitionData.finalsDate).toLocaleDateString() : '—'}</p>
                        </div>
                      </div>
                    )}
                  </Card>
                )}

                {/* Sponsors Sub-tab */}
                {compSubTab === 'sponsors' && (
                  <div className="space-y-4">
                    {competitionData.sponsors.length > 0 && (
                      <div className="space-y-3">
                        {competitionData.sponsors.map((s) => (
                          <Card key={s.id} className="p-4">
                            {editingSponsor === s.id ? (
                              <div className="space-y-3">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  <select className="bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground" value={editSponsorForm.tier} onChange={(e) => setEditSponsorForm({ ...editSponsorForm, tier: e.target.value })}>
                                    <option value="PRESENTING">Presenting Sponsor</option>
                                    <option value="DIAMOND">Diamond Sponsor</option>
                                    <option value="TITLE">Title Sponsor</option>
                                    <option value="PLATINUM">Platinum Sponsor</option>
                                    <option value="GOLD">Gold Sponsor</option>
                                    <option value="SILVER">Silver Sponsor</option>
                                    <option value="STARTUP_PARTNER">Startup Partner</option>
                                    <option value="INNOVATION_PARTNER">Innovation Partner</option>
                                    <option value="COMMUNITY_PARTNER">Community Partner</option>
                                    <option value="STAGE">Stage Sponsor</option>
                                    <option value="MEDIA">Media Sponsor</option>
                                    <option value="AWARD">Award Sponsor</option>
                                  </select>
                                  <input placeholder="Sponsor Name" className="bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground" value={editSponsorForm.sponsorName} onChange={(e) => setEditSponsorForm({ ...editSponsorForm, sponsorName: e.target.value })} />
                                  <input type="number" placeholder="Price (₹)" className="bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground" value={editSponsorForm.price} onChange={(e) => setEditSponsorForm({ ...editSponsorForm, price: e.target.value })} />
                                  <input placeholder="Logo URL (optional)" className="bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground" value={editSponsorForm.logo} onChange={(e) => setEditSponsorForm({ ...editSponsorForm, logo: e.target.value })} />
                                  <input placeholder="Benefits (comma-separated)" className="bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground col-span-full" value={editSponsorForm.benefits} onChange={(e) => setEditSponsorForm({ ...editSponsorForm, benefits: e.target.value })} />
                                </div>
                                <div className="flex gap-2">
                                  <Button size="sm" onClick={() => editSponsor(s.id)}>Save</Button>
                                  <Button size="sm" variant="outline" onClick={() => setEditingSponsor(null)}>Cancel</Button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-lg bg-card-hover flex items-center justify-center overflow-hidden flex-shrink-0">
                                  {s.logo ? <img src={s.logo} alt="" className="w-full h-full object-cover" /> : <BanknotesIcon className="w-5 h-5 text-muted" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-medium text-foreground">{s.name}</h4>
                                  <p className="text-xs text-muted">{s.tier.replace('_', ' ')} &middot; {formatCurrency(s.price)}</p>
                                </div>
                                <button onClick={() => { setEditingSponsor(s.id); setEditSponsorForm({ tier: s.tier, sponsorName: s.name, price: String(s.price), benefits: Array.isArray(s.benefits) ? s.benefits.join(', ') : '', logo: s.logo || '' }); }} className="text-blue-400 hover:text-blue-300 p-1">
                                  <PencilSquareIcon className="w-4 h-4" />
                                </button>
                                <button onClick={() => deleteSponsor(s.id)} className="text-red-400 hover:text-red-300 p-1">
                                  <TrashIcon className="w-4 h-4" />
                                </button>
                              </div>
                            )}
                          </Card>
                        ))}
                      </div>
                    )}
                    <Card className="p-4 space-y-3">
                      <h4 className="font-medium text-foreground text-sm">Add Sponsor</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <select className="bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground" value={sponsorForm.tier} onChange={(e) => setSponsorForm({ ...sponsorForm, tier: e.target.value })}>
                          <option value="PRESENTING">Presenting Sponsor</option>
                          <option value="DIAMOND">Diamond Sponsor</option>
                          <option value="TITLE">Title Sponsor</option>
                          <option value="PLATINUM">Platinum Sponsor</option>
                          <option value="GOLD">Gold Sponsor</option>
                          <option value="SILVER">Silver Sponsor</option>
                          <option value="STARTUP_PARTNER">Startup Partner</option>
                          <option value="INNOVATION_PARTNER">Innovation Partner</option>
                          <option value="COMMUNITY_PARTNER">Community Partner</option>
                          <option value="STAGE">Stage Sponsor</option>
                          <option value="MEDIA">Media Sponsor</option>
                          <option value="AWARD">Award Sponsor</option>
                        </select>
                        <input placeholder="Sponsor Name" className="bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground" value={sponsorForm.sponsorName} onChange={(e) => setSponsorForm({ ...sponsorForm, sponsorName: e.target.value })} />
                        <input type="number" placeholder="Price (₹)" className="bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground" value={sponsorForm.price} onChange={(e) => setSponsorForm({ ...sponsorForm, price: e.target.value })} />
                        <input placeholder="Logo URL (optional)" className="bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground" value={sponsorForm.logo} onChange={(e) => setSponsorForm({ ...sponsorForm, logo: e.target.value })} />
                        <input placeholder="Benefits (comma-separated)" className="bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground col-span-full" value={sponsorForm.benefits} onChange={(e) => setSponsorForm({ ...sponsorForm, benefits: e.target.value })} />
                      </div>
                      <Button size="sm" onClick={addSponsor}>Add Sponsor</Button>
                    </Card>
                  </div>
                )}

                {/* Campus Partners Sub-tab */}
                {compSubTab === 'campus-partners' && (
                  <div className="space-y-4">
                    {competitionData.campusPartners && competitionData.campusPartners.length > 0 && (
                      <div className="space-y-3">
                        {competitionData.campusPartners.map((cp) => (
                          <Card key={cp.id} className="p-4">
                            {editingPartner === cp.id ? (
                              <div className="space-y-3">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                  <input placeholder="Institution Name" className="bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground" value={editPartnerForm.partnerName} onChange={(e) => setEditPartnerForm({ ...editPartnerForm, partnerName: e.target.value })} />
                                  <input placeholder="Logo URL (optional)" className="bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground" value={editPartnerForm.partnerLogo} onChange={(e) => setEditPartnerForm({ ...editPartnerForm, partnerLogo: e.target.value })} />
                                  <input placeholder="Website URL (optional)" className="bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground" value={editPartnerForm.partnerWebsite} onChange={(e) => setEditPartnerForm({ ...editPartnerForm, partnerWebsite: e.target.value })} />
                                </div>
                                <div className="flex gap-2">
                                  <Button size="sm" onClick={() => editCampusPartner(cp.id)}>Save</Button>
                                  <Button size="sm" variant="outline" onClick={() => setEditingPartner(null)}>Cancel</Button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-lg bg-card-hover flex items-center justify-center overflow-hidden flex-shrink-0">
                                  {cp.logo ? <img src={cp.logo} alt="" className="w-full h-full object-cover" /> : <AcademicCapIcon className="w-5 h-5 text-muted" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-medium text-foreground">{cp.name}</h4>
                                  {cp.website && <p className="text-xs text-muted truncate">{cp.website}</p>}
                                </div>
                                <button onClick={() => { setEditingPartner(cp.id); setEditPartnerForm({ partnerName: cp.name, partnerLogo: cp.logo || '', partnerWebsite: cp.website || '' }); }} className="text-blue-400 hover:text-blue-300 p-1">
                                  <PencilSquareIcon className="w-4 h-4" />
                                </button>
                                <button onClick={() => deleteCampusPartner(cp.id)} className="text-red-400 hover:text-red-300 p-1">
                                  <TrashIcon className="w-4 h-4" />
                                </button>
                              </div>
                            )}
                          </Card>
                        ))}
                      </div>
                    )}
                    <Card className="p-4 space-y-3">
                      <h4 className="font-medium text-foreground text-sm">Add Campus Partner</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <input placeholder="Institution Name" className="bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground" value={partnerForm.partnerName} onChange={(e) => setPartnerForm({ ...partnerForm, partnerName: e.target.value })} />
                        <input placeholder="Logo URL (optional)" className="bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground" value={partnerForm.partnerLogo} onChange={(e) => setPartnerForm({ ...partnerForm, partnerLogo: e.target.value })} />
                        <input placeholder="Website URL (optional)" className="bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground" value={partnerForm.partnerWebsite} onChange={(e) => setPartnerForm({ ...partnerForm, partnerWebsite: e.target.value })} />
                      </div>
                      <Button size="sm" onClick={addCampusPartner}>Add Campus Partner</Button>
                    </Card>
                  </div>
                )}

                {/* Judges Sub-tab */}
                {compSubTab === 'judges' && (
                  <div className="space-y-4">
                    {competitionData.judges.length > 0 && (
                      <div className="space-y-3">
                        {competitionData.judges.map((j) => (
                          <Card key={j.id} className="p-4">
                            {editingJudge === j.id ? (
                              <div className="space-y-3">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  <input placeholder="Name" className="bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground" value={editJudgeForm.judgeName} onChange={(e) => setEditJudgeForm({ ...editJudgeForm, judgeName: e.target.value })} />
                                  <input placeholder="Title (e.g. CEO)" className="bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground" value={editJudgeForm.judgeTitle} onChange={(e) => setEditJudgeForm({ ...editJudgeForm, judgeTitle: e.target.value })} />
                                  <input placeholder="Organization" className="bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground" value={editJudgeForm.judgeOrganization} onChange={(e) => setEditJudgeForm({ ...editJudgeForm, judgeOrganization: e.target.value })} />
                                  <input placeholder="Avatar URL (optional)" className="bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground" value={editJudgeForm.judgeAvatar} onChange={(e) => setEditJudgeForm({ ...editJudgeForm, judgeAvatar: e.target.value })} />
                                </div>
                                <div className="flex gap-2">
                                  <Button size="sm" onClick={() => editJudge(j.id)}>Save</Button>
                                  <Button size="sm" variant="outline" onClick={() => setEditingJudge(null)}>Cancel</Button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-card-hover flex items-center justify-center overflow-hidden flex-shrink-0">
                                  {j.avatar ? <img src={j.avatar} alt="" className="w-full h-full object-cover" /> : <UsersIcon className="w-5 h-5 text-muted" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-medium text-foreground">{j.name}</h4>
                                  <p className="text-xs text-muted">{j.title}{j.organization ? ` at ${j.organization}` : ''}</p>
                                </div>
                                <button onClick={() => { setEditingJudge(j.id); setEditJudgeForm({ judgeName: j.name, judgeTitle: j.title, judgeOrganization: j.organization, judgeAvatar: j.avatar || '' }); }} className="text-blue-400 hover:text-blue-300 p-1">
                                  <PencilSquareIcon className="w-4 h-4" />
                                </button>
                                <button onClick={() => deleteJudge(j.id)} className="text-red-400 hover:text-red-300 p-1">
                                  <TrashIcon className="w-4 h-4" />
                                </button>
                              </div>
                            )}
                          </Card>
                        ))}
                      </div>
                    )}
                    <Card className="p-4 space-y-3">
                      <h4 className="font-medium text-foreground text-sm">Add Judge</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <input placeholder="Name" className="bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground" value={judgeForm.judgeName} onChange={(e) => setJudgeForm({ ...judgeForm, judgeName: e.target.value })} />
                        <input placeholder="Title (e.g. CEO)" className="bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground" value={judgeForm.judgeTitle} onChange={(e) => setJudgeForm({ ...judgeForm, judgeTitle: e.target.value })} />
                        <input placeholder="Organization" className="bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground" value={judgeForm.judgeOrganization} onChange={(e) => setJudgeForm({ ...judgeForm, judgeOrganization: e.target.value })} />
                        <input placeholder="Avatar URL (optional)" className="bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground" value={judgeForm.judgeAvatar} onChange={(e) => setJudgeForm({ ...judgeForm, judgeAvatar: e.target.value })} />
                      </div>
                      <Button size="sm" onClick={addJudge}>Add Judge</Button>
                    </Card>
                  </div>
                )}

                {/* Citizen Passes Sub-tab */}
                {compSubTab === 'citizen-passes' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-foreground">Citizen Entry Passes</h4>
                        <p className="text-xs text-muted">
                          {competitionData.citizenPasses?.filter(p => p.paymentStatus === 'PAID').length || 0} paid &middot;{' '}
                          {competitionData.citizenPasses?.filter(p => p.paymentStatus === 'PENDING').length || 0} pending &middot;{' '}
                          Total Revenue: ₹{(competitionData.citizenPasses?.filter(p => p.paymentStatus === 'PAID').reduce((sum, p) => sum + p.fee, 0) || 0).toLocaleString('en-IN')}
                        </p>
                      </div>
                      <Button size="sm" variant="ghost" onClick={fetchCompetitionEntries}>Refresh</Button>
                    </div>
                    {/* Search */}
                    <div className="relative">
                      <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                      <input
                        type="text"
                        placeholder="Search by name, phone, ID number, or pass number..."
                        value={passSearch}
                        onChange={(e) => setPassSearch(e.target.value)}
                        className="w-full bg-background border border-border rounded-lg pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-muted/60"
                      />
                      {passSearch && (
                        <button onClick={() => setPassSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground">
                          <XMarkIcon className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    {(!competitionData.citizenPasses || competitionData.citizenPasses.length === 0) ? (
                      <Card className="p-8 text-center">
                        <TicketIcon className="w-12 h-12 mx-auto text-muted mb-3" />
                        <p className="text-muted">No citizen passes issued yet.</p>
                      </Card>
                    ) : (() => {
                      const q = passSearch.toLowerCase().trim();
                      const filtered = q
                        ? competitionData.citizenPasses.filter(p =>
                            p.name.toLowerCase().includes(q) ||
                            p.phone.includes(q) ||
                            p.idProofNumber.toLowerCase().includes(q) ||
                            p.passNumber.toLowerCase().includes(q) ||
                            (p.email && p.email.toLowerCase().includes(q))
                          )
                        : competitionData.citizenPasses;
                      if (filtered.length === 0) {
                        return (
                          <Card className="p-8 text-center">
                            <MagnifyingGlassIcon className="w-12 h-12 mx-auto text-muted mb-3" />
                            <p className="text-muted">No passes found matching &ldquo;{passSearch}&rdquo;</p>
                          </Card>
                        );
                      }
                      return (
                        <div className="space-y-2">
                          {q && <p className="text-xs text-muted">Showing {filtered.length} of {competitionData.citizenPasses.length} passes</p>}
                          {filtered.map((pass) => (
                            <Card key={pass.id} className="p-4">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-mono text-xs text-blue bg-blue/10 px-2 py-0.5 rounded">{pass.passNumber}</span>
                                    <Badge variant={pass.paymentStatus === 'PAID' ? 'success' : pass.paymentStatus === 'PENDING' ? 'warning' : 'danger'}>
                                      {pass.paymentStatus}
                                    </Badge>
                                  </div>
                                  <p className="font-medium text-foreground mt-1">{pass.name}</p>
                                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted mt-1">
                                    <span>📱 {pass.phone}</span>
                                    {pass.email && <span>✉️ {pass.email}</span>}
                                    <span>🪪 {pass.idProofType}: {pass.idProofNumber}</span>
                                    <span>₹{pass.fee}</span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-3">
                                  <span className="text-xs text-muted whitespace-nowrap">
                                    {new Date(pass.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                  </span>
                                  <button
                                    onClick={async () => {
                                      if (!confirm(`Delete pass ${pass.passNumber} for ${pass.name}?`)) return;
                                      setActionLoading(pass.id);
                                      try {
                                        const token = document.cookie.split('; ').find(c => c.startsWith('token='))?.split('=')[1];
                                        const res = await fetch('/api/admin', {
                                          method: 'PATCH',
                                          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                                          body: JSON.stringify({ action: 'delete-citizen-pass', passId: pass.id }),
                                        });
                                        const data = await res.json();
                                        if (data.success) fetchCompetitionEntries();
                                      } catch (err) { console.error(err); }
                                      setActionLoading(null);
                                    }}
                                    disabled={actionLoading === pass.id}
                                    className="text-red-400 hover:text-red-300 p-1 transition-colors"
                                    title="Delete pass"
                                  >
                                    <TrashIcon className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            </Card>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* Free Entries Sub-tab */}
                {compSubTab === 'free-entries' && (
                  <div className="space-y-4">
                    {/* Summary */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <Card className="p-4 text-center">
                        <p className="text-2xl font-bold text-foreground">{competitionData?.freeEntries?.length || 0}</p>
                        <p className="text-xs text-muted">Total Applications</p>
                      </Card>
                      <Card className="p-4 text-center">
                        <p className="text-2xl font-bold text-amber-400">{competitionData?.freeEntries?.filter((f) => f.videoStatus === 'PENDING' && f.videoUrl).length || 0}</p>
                        <p className="text-xs text-muted">Pending Review</p>
                      </Card>
                      <Card className="p-4 text-center">
                        <p className="text-2xl font-bold text-green-400">{competitionData?.freeEntries?.filter((f) => f.freeEntryGranted).length || 0}</p>
                        <p className="text-xs text-muted">Granted</p>
                      </Card>
                      <Card className="p-4 text-center">
                        <p className="text-2xl font-bold text-red-400">{competitionData?.freeEntries?.filter((f) => f.status === 'REJECTED').length || 0}</p>
                        <p className="text-xs text-muted">Rejected</p>
                      </Card>
                    </div>

                    {/* Free Entry Cards */}
                    {competitionData?.freeEntries?.map((fe) => {
                      const verifiedCount = fe.referrals.filter((r) => r.paymentVerified).length;
                      return (
                        <Card key={fe.id} className="p-5">
                          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center gap-3 flex-wrap">
                                <h4 className="font-bold text-foreground">{fe.user.firstName} {fe.user.lastName}</h4>
                                <Badge variant={fe.freeEntryGranted ? 'success' : fe.status === 'REJECTED' ? 'danger' : fe.status === 'VIDEO_SUBMITTED' || fe.status === 'UNDER_REVIEW' ? 'warning' : 'info'}>
                                  {fe.freeEntryGranted ? 'Granted ✓' : fe.status}
                                </Badge>
                                <Badge variant={fe.participantType === 'STUDENT' ? 'info' : 'default'}>
                                  {fe.participantType}
                                </Badge>
                              </div>
                              <div className="text-sm text-muted space-y-1">
                                <p>{fe.user.email} | {fe.phone}</p>
                                <p>{fe.city}, {fe.state}{fe.college ? ` | ${fe.college}` : ''}{fe.company ? ` | ${fe.company}` : ''}</p>
                                <p className="font-medium">Referral Code: <span className="text-foreground">{fe.referralCode}</span></p>
                                <p className="font-medium">Referrals: <span className={verifiedCount >= 5 ? 'text-green-400' : 'text-amber-400'}>{verifiedCount}/5 verified</span> ({fe.referrals.length} total)</p>
                              </div>

                              {/* Video Info */}
                              {fe.videoUrl ? (
                                <div className="mt-2 p-3 rounded-lg bg-card border border-border text-sm space-y-1">
                                  <p className="text-muted">Video: <a href={fe.videoUrl} target="_blank" rel="noopener noreferrer" className="text-blue hover:underline">{fe.videoUrl}</a></p>
                                  <p className="text-muted">Platform: <span className="text-foreground">{fe.videoPlatform}</span></p>
                                  {fe.videoDescription && <p className="text-muted">Description: {fe.videoDescription}</p>}
                                  <p className="text-muted">Video Status: <Badge variant={fe.videoStatus === 'APPROVED' ? 'success' : fe.videoStatus === 'REJECTED' ? 'danger' : 'warning'}>{fe.videoStatus}</Badge></p>
                                </div>
                              ) : (
                                <p className="text-sm text-amber-400 italic mt-2">No video submitted yet</p>
                              )}

                              {/* Referrals List */}
                              {fe.referrals.length > 0 && (
                                <div className="mt-2">
                                  <p className="text-xs text-muted font-semibold uppercase mb-1">Referrals</p>
                                  <div className="space-y-1">
                                    {fe.referrals.map((r) => (
                                      <div key={r.id} className="flex items-center justify-between text-xs p-2 rounded bg-card border border-border">
                                        <span className="text-foreground">{r.referredUser.firstName} {r.referredUser.lastName} ({r.referredUser.email})</span>
                                        <Badge variant={r.paymentVerified ? 'success' : 'warning'} className="text-xs">{r.paymentVerified ? 'Paid' : 'Unpaid'}</Badge>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Admin Notes */}
                              {fe.adminNotes && (
                                <p className="text-xs text-muted mt-2">Admin notes: <span className="italic">{fe.adminNotes}</span></p>
                              )}
                            </div>

                            {/* Actions */}
                            <div className="flex flex-col gap-2 flex-shrink-0">
                              {/* Notes input */}
                              <input
                                type="text"
                                placeholder="Admin notes..."
                                value={freeEntryNotes[fe.id] || ''}
                                onChange={(e) => setFreeEntryNotes((prev) => ({ ...prev, [fe.id]: e.target.value }))}
                                className="px-3 py-1.5 rounded-lg text-xs border border-border bg-card text-foreground w-48"
                              />

                              {fe.videoUrl && fe.videoStatus === 'PENDING' && (
                                <>
                                  <Button size="sm" onClick={async () => {
                                    const t = localStorage.getItem('token');
                                    await fetch('/api/admin', {
                                      method: 'PATCH',
                                      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` },
                                      body: JSON.stringify({ action: 'approve-free-entry-video', freeEntryId: fe.id, adminNotes: freeEntryNotes[fe.id] || '' }),
                                    });
                                    fetchCompetitionEntries();
                                  }}>
                                    Approve Video
                                  </Button>
                                  <Button size="sm" variant="outline" className="text-red-400 border-red-400/30" onClick={async () => {
                                    const t = localStorage.getItem('token');
                                    await fetch('/api/admin', {
                                      method: 'PATCH',
                                      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` },
                                      body: JSON.stringify({ action: 'reject-free-entry-video', freeEntryId: fe.id, adminNotes: freeEntryNotes[fe.id] || '' }),
                                    });
                                    fetchCompetitionEntries();
                                  }}>
                                    Reject Video
                                  </Button>
                                </>
                              )}

                              {!fe.freeEntryGranted && fe.videoStatus === 'APPROVED' && (
                                <Button size="sm" className="bg-green-500 hover:bg-green-600" onClick={async () => {
                                  const t = localStorage.getItem('token');
                                  await fetch('/api/admin', {
                                    method: 'PATCH',
                                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` },
                                    body: JSON.stringify({ action: 'grant-free-entry', freeEntryId: fe.id }),
                                  });
                                  fetchCompetitionEntries();
                                }}>
                                  Grant Free Entry
                                </Button>
                              )}

                              <Button size="sm" variant="ghost" className="text-red-400" onClick={async () => {
                                if (!confirm('Delete this free entry application?')) return;
                                const t = localStorage.getItem('token');
                                await fetch('/api/admin', {
                                  method: 'PATCH',
                                  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` },
                                  body: JSON.stringify({ action: 'delete-free-entry', freeEntryId: fe.id }),
                                });
                                fetchCompetitionEntries();
                              }}>
                                Delete
                              </Button>
                            </div>
                          </div>
                        </Card>
                      );
                    })}

                    {(!competitionData?.freeEntries || competitionData.freeEntries.length === 0) && (
                      <Card className="p-8 text-center">
                        <p className="text-muted">No free entry applications yet.</p>
                      </Card>
                    )}
                  </div>
                )}

                {/* Page Content Sub-tab */}
                {compSubTab === 'page-content' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted">Edit all text content displayed on the public competition page.</p>
                      <Button size="sm" onClick={savePageContent} isLoading={pageContentSaving}>Save All Content</Button>
                    </div>

                    {/* Hero Section */}
                    <Card className="p-4 space-y-3">
                      <h4 className="font-semibold text-foreground text-sm border-b border-border pb-2">🚀 Hero Section</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs text-muted mb-1">Badge Text</label>
                          <input className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground" value={String(pageContentForm.heroBadgeText || '')} onChange={(e) => setPageContentForm({ ...pageContentForm, heroBadgeText: e.target.value })} />
                        </div>
                        <div>
                          <label className="block text-xs text-muted mb-1">Title Line 1</label>
                          <input className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground" value={String(pageContentForm.heroTitleLine1 || '')} onChange={(e) => setPageContentForm({ ...pageContentForm, heroTitleLine1: e.target.value })} />
                        </div>
                        <div>
                          <label className="block text-xs text-muted mb-1">Title Line 2 (Gradient)</label>
                          <input className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground" value={String(pageContentForm.heroTitleLine2 || '')} onChange={(e) => setPageContentForm({ ...pageContentForm, heroTitleLine2: e.target.value })} />
                        </div>
                        <div>
                          <label className="block text-xs text-muted mb-1">Quote</label>
                          <input className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground" value={String(pageContentForm.heroQuote || '')} onChange={(e) => setPageContentForm({ ...pageContentForm, heroQuote: e.target.value })} />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-xs text-muted mb-1">Description</label>
                          <textarea rows={2} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground" value={String(pageContentForm.heroDescription || '')} onChange={(e) => setPageContentForm({ ...pageContentForm, heroDescription: e.target.value })} />
                        </div>
                        <div>
                          <label className="block text-xs text-muted mb-1">Top Selected Count</label>
                          <input type="number" className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground" value={String(pageContentForm.topSelected || '')} onChange={(e) => setPageContentForm({ ...pageContentForm, topSelected: parseInt(e.target.value) || 0 })} />
                        </div>
                        <div>
                          <label className="block text-xs text-muted mb-1">Finalist Count</label>
                          <input type="number" className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground" value={String(pageContentForm.finalistCount || '')} onChange={(e) => setPageContentForm({ ...pageContentForm, finalistCount: parseInt(e.target.value) || 0 })} />
                        </div>
                        <div>
                          <label className="block text-xs text-muted mb-1">Pitch Duration</label>
                          <input className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground" value={String(pageContentForm.pitchDuration || '')} onChange={(e) => setPageContentForm({ ...pageContentForm, pitchDuration: e.target.value })} />
                        </div>
                      </div>
                    </Card>

                    {/* Floating Banner */}
                    <Card className="p-4 space-y-3">
                      <h4 className="font-semibold text-foreground text-sm border-b border-border pb-2">📢 Floating Banner</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs text-muted mb-1">Banner Text</label>
                          <input className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground" value={String(pageContentForm.bannerText || '')} onChange={(e) => setPageContentForm({ ...pageContentForm, bannerText: e.target.value })} />
                        </div>
                        <div>
                          <label className="block text-xs text-muted mb-1">Button Text</label>
                          <input className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground" value={String(pageContentForm.bannerButtonText || '')} onChange={(e) => setPageContentForm({ ...pageContentForm, bannerButtonText: e.target.value })} />
                        </div>
                      </div>
                    </Card>

                    {/* Invitation Section */}
                    <Card className="p-4 space-y-3">
                      <h4 className="font-semibold text-foreground text-sm border-b border-border pb-2">💌 Invitation Section</h4>
                      <div className="grid grid-cols-1 gap-3">
                        <div>
                          <label className="block text-xs text-muted mb-1">Title</label>
                          <input className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground" value={String(pageContentForm.invitationTitle || '')} onChange={(e) => setPageContentForm({ ...pageContentForm, invitationTitle: e.target.value })} />
                        </div>
                        <div>
                          <label className="block text-xs text-muted mb-1">Description</label>
                          <textarea rows={3} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground" value={String(pageContentForm.invitationDescription || '')} onChange={(e) => setPageContentForm({ ...pageContentForm, invitationDescription: e.target.value })} />
                        </div>
                        <div>
                          <label className="block text-xs text-muted mb-1">Subtext</label>
                          <textarea rows={2} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground" value={String(pageContentForm.invitationSubtext || '')} onChange={(e) => setPageContentForm({ ...pageContentForm, invitationSubtext: e.target.value })} />
                        </div>
                        <div>
                          <label className="block text-xs text-muted mb-1">Highlights (comma-separated)</label>
                          <input className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground" value={String(pageContentForm.invitationHighlights || '')} onChange={(e) => setPageContentForm({ ...pageContentForm, invitationHighlights: e.target.value })} />
                        </div>
                      </div>
                    </Card>

                    {/* Prizes */}
                    <Card className="p-4 space-y-3">
                      <h4 className="font-semibold text-foreground text-sm border-b border-border pb-2">🏆 Prizes & Rewards</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs text-muted mb-1">Section Title</label>
                          <input className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground" value={String(pageContentForm.prizeSectionTitle || '')} onChange={(e) => setPageContentForm({ ...pageContentForm, prizeSectionTitle: e.target.value })} />
                        </div>
                        <div>
                          <label className="block text-xs text-muted mb-1">Section Subtitle</label>
                          <input className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground" value={String(pageContentForm.prizeSectionSubtitle || '')} onChange={(e) => setPageContentForm({ ...pageContentForm, prizeSectionSubtitle: e.target.value })} />
                        </div>
                      </div>
                      <p className="text-xs text-muted font-semibold mt-2">1st Place</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs text-muted mb-1">Title</label>
                          <input className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground" value={String(pageContentForm.firstPrizeTitle || '')} onChange={(e) => setPageContentForm({ ...pageContentForm, firstPrizeTitle: e.target.value })} />
                        </div>
                        <div>
                          <label className="block text-xs text-muted mb-1">Subtitle</label>
                          <input className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground" value={String(pageContentForm.firstPrizeSubtitle || '')} onChange={(e) => setPageContentForm({ ...pageContentForm, firstPrizeSubtitle: e.target.value })} />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-xs text-muted mb-1">Benefits (comma-separated)</label>
                          <input className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground" value={String(pageContentForm.firstPrizeBenefits || '')} onChange={(e) => setPageContentForm({ ...pageContentForm, firstPrizeBenefits: e.target.value })} />
                        </div>
                      </div>
                      <p className="text-xs text-muted font-semibold mt-2">2nd Place</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs text-muted mb-1">Title</label>
                          <input className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground" value={String(pageContentForm.secondPrizeTitle || '')} onChange={(e) => setPageContentForm({ ...pageContentForm, secondPrizeTitle: e.target.value })} />
                        </div>
                        <div>
                          <label className="block text-xs text-muted mb-1">Subtitle</label>
                          <input className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground" value={String(pageContentForm.secondPrizeSubtitle || '')} onChange={(e) => setPageContentForm({ ...pageContentForm, secondPrizeSubtitle: e.target.value })} />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-xs text-muted mb-1">Benefits (comma-separated)</label>
                          <input className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground" value={String(pageContentForm.secondPrizeBenefits || '')} onChange={(e) => setPageContentForm({ ...pageContentForm, secondPrizeBenefits: e.target.value })} />
                        </div>
                      </div>
                      <p className="text-xs text-muted font-semibold mt-2">3rd Place</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs text-muted mb-1">Title</label>
                          <input className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground" value={String(pageContentForm.thirdPrizeTitle || '')} onChange={(e) => setPageContentForm({ ...pageContentForm, thirdPrizeTitle: e.target.value })} />
                        </div>
                        <div>
                          <label className="block text-xs text-muted mb-1">Subtitle</label>
                          <input className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground" value={String(pageContentForm.thirdPrizeSubtitle || '')} onChange={(e) => setPageContentForm({ ...pageContentForm, thirdPrizeSubtitle: e.target.value })} />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-xs text-muted mb-1">Benefits (comma-separated)</label>
                          <input className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground" value={String(pageContentForm.thirdPrizeBenefits || '')} onChange={(e) => setPageContentForm({ ...pageContentForm, thirdPrizeBenefits: e.target.value })} />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs text-muted mb-1 mt-2">All Participant Benefits (comma-separated)</label>
                        <input className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground" value={String(pageContentForm.participantBenefits || '')} onChange={(e) => setPageContentForm({ ...pageContentForm, participantBenefits: e.target.value })} />
                      </div>
                    </Card>

                    {/* Screening & Participants */}
                    <Card className="p-4 space-y-3">
                      <h4 className="font-semibold text-foreground text-sm border-b border-border pb-2">📋 Screening & Participants</h4>
                      <div>
                        <label className="block text-xs text-muted mb-1">Screening Criteria (format: Label:Weight%, comma-separated)</label>
                        <input className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground" value={String(pageContentForm.screeningCriteria || '')} onChange={(e) => setPageContentForm({ ...pageContentForm, screeningCriteria: e.target.value })} />
                        <p className="text-xs text-muted mt-1">Example: Innovation:30%, Market Potential:30%, Execution Feasibility:20%, Impact:20%</p>
                      </div>
                      <div>
                        <label className="block text-xs text-muted mb-1">Participant Categories (format: Label:Description, comma-separated)</label>
                        <input className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground" value={String(pageContentForm.participantCategories || '')} onChange={(e) => setPageContentForm({ ...pageContentForm, participantCategories: e.target.value })} />
                        <p className="text-xs text-muted mt-1">Example: Students:College & university students, Engineers:Technical professionals</p>
                      </div>
                    </Card>

                    {/* Booth */}
                    <Card className="p-4 space-y-3">
                      <h4 className="font-semibold text-foreground text-sm border-b border-border pb-2">🏢 Exhibition Booth</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs text-muted mb-1">Booth Title</label>
                          <input className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground" value={String(pageContentForm.boothTitle || '')} onChange={(e) => setPageContentForm({ ...pageContentForm, boothTitle: e.target.value })} />
                        </div>
                        <div>
                          <label className="block text-xs text-muted mb-1">Booth Features (comma-separated)</label>
                          <input className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground" value={String(pageContentForm.boothFeatures || '')} onChange={(e) => setPageContentForm({ ...pageContentForm, boothFeatures: e.target.value })} />
                        </div>
                      </div>
                    </Card>

                    {/* Sponsor Packages */}
                    <Card className="p-4 space-y-3">
                      <h4 className="font-semibold text-foreground text-sm border-b border-border pb-2">🤝 Sponsor Package Cards (Static Display)</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs text-muted mb-1">Section Title</label>
                          <input className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground" value={String(pageContentForm.sponsorPackageTitle || '')} onChange={(e) => setPageContentForm({ ...pageContentForm, sponsorPackageTitle: e.target.value })} />
                        </div>
                        <div>
                          <label className="block text-xs text-muted mb-1">Section Subtitle</label>
                          <input className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground" value={String(pageContentForm.sponsorPackageSubtitle || '')} onChange={(e) => setPageContentForm({ ...pageContentForm, sponsorPackageSubtitle: e.target.value })} />
                        </div>
                      </div>
                      <p className="text-xs text-muted font-semibold mt-2">Title Sponsor</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs text-muted mb-1">Price Display</label>
                          <input className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground" value={String(pageContentForm.titleSponsorPrice || '')} onChange={(e) => setPageContentForm({ ...pageContentForm, titleSponsorPrice: e.target.value })} />
                        </div>
                        <div>
                          <label className="block text-xs text-muted mb-1">Benefits (comma-separated)</label>
                          <input className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground" value={String(pageContentForm.titleSponsorBenefits || '')} onChange={(e) => setPageContentForm({ ...pageContentForm, titleSponsorBenefits: e.target.value })} />
                        </div>
                      </div>
                      <p className="text-xs text-muted font-semibold mt-2">Presenting Sponsor</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs text-muted mb-1">Price</label>
                          <input className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground" value={String(pageContentForm.presentingSponsorPrice || '')} onChange={(e) => setPageContentForm({ ...pageContentForm, presentingSponsorPrice: e.target.value })} />
                        </div>
                        <div>
                          <label className="block text-xs text-muted mb-1">Benefits (comma-separated)</label>
                          <input className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground" value={String(pageContentForm.presentingSponsorBenefits || '')} onChange={(e) => setPageContentForm({ ...pageContentForm, presentingSponsorBenefits: e.target.value })} />
                        </div>
                      </div>
                      <p className="text-xs text-muted font-semibold mt-2">Diamond Sponsor</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs text-muted mb-1">Price</label>
                          <input className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground" value={String(pageContentForm.diamondSponsorPrice || '')} onChange={(e) => setPageContentForm({ ...pageContentForm, diamondSponsorPrice: e.target.value })} />
                        </div>
                        <div>
                          <label className="block text-xs text-muted mb-1">Benefits (comma-separated)</label>
                          <input className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground" value={String(pageContentForm.diamondSponsorBenefits || '')} onChange={(e) => setPageContentForm({ ...pageContentForm, diamondSponsorBenefits: e.target.value })} />
                        </div>
                      </div>
                      <p className="text-xs text-muted font-semibold mt-2">Platinum Sponsor</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs text-muted mb-1">Price</label>
                          <input className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground" value={String(pageContentForm.platinumSponsorPrice || '')} onChange={(e) => setPageContentForm({ ...pageContentForm, platinumSponsorPrice: e.target.value })} />
                        </div>
                        <div>
                          <label className="block text-xs text-muted mb-1">Benefits (comma-separated)</label>
                          <input className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground" value={String(pageContentForm.platinumSponsorBenefits || '')} onChange={(e) => setPageContentForm({ ...pageContentForm, platinumSponsorBenefits: e.target.value })} />
                        </div>
                      </div>
                      <p className="text-xs text-muted font-semibold mt-2">Gold Sponsor</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs text-muted mb-1">Price</label>
                          <input className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground" value={String(pageContentForm.goldSponsorPrice || '')} onChange={(e) => setPageContentForm({ ...pageContentForm, goldSponsorPrice: e.target.value })} />
                        </div>
                        <div>
                          <label className="block text-xs text-muted mb-1">Benefits (comma-separated)</label>
                          <input className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground" value={String(pageContentForm.goldSponsorBenefits || '')} onChange={(e) => setPageContentForm({ ...pageContentForm, goldSponsorBenefits: e.target.value })} />
                        </div>
                      </div>
                      <p className="text-xs text-muted font-semibold mt-2">Silver Sponsor</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs text-muted mb-1">Price</label>
                          <input className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground" value={String(pageContentForm.silverSponsorPrice || '')} onChange={(e) => setPageContentForm({ ...pageContentForm, silverSponsorPrice: e.target.value })} />
                        </div>
                        <div>
                          <label className="block text-xs text-muted mb-1">Benefits (comma-separated)</label>
                          <input className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground" value={String(pageContentForm.silverSponsorBenefits || '')} onChange={(e) => setPageContentForm({ ...pageContentForm, silverSponsorBenefits: e.target.value })} />
                        </div>
                      </div>
                      <p className="text-xs text-muted font-semibold mt-2">Startup Partner</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs text-muted mb-1">Price</label>
                          <input className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground" value={String(pageContentForm.startupPartnerPrice || '')} onChange={(e) => setPageContentForm({ ...pageContentForm, startupPartnerPrice: e.target.value })} />
                        </div>
                        <div>
                          <label className="block text-xs text-muted mb-1">Benefits (comma-separated)</label>
                          <input className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground" value={String(pageContentForm.startupPartnerBenefits || '')} onChange={(e) => setPageContentForm({ ...pageContentForm, startupPartnerBenefits: e.target.value })} />
                        </div>
                      </div>
                      <p className="text-xs text-muted font-semibold mt-2">Innovation Partner</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs text-muted mb-1">Price</label>
                          <input className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground" value={String(pageContentForm.innovationPartnerPrice || '')} onChange={(e) => setPageContentForm({ ...pageContentForm, innovationPartnerPrice: e.target.value })} />
                        </div>
                        <div>
                          <label className="block text-xs text-muted mb-1">Benefits (comma-separated)</label>
                          <input className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground" value={String(pageContentForm.innovationPartnerBenefits || '')} onChange={(e) => setPageContentForm({ ...pageContentForm, innovationPartnerBenefits: e.target.value })} />
                        </div>
                      </div>
                      <p className="text-xs text-muted font-semibold mt-2">Community Partner</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs text-muted mb-1">Price</label>
                          <input className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground" value={String(pageContentForm.communityPartnerPrice || '')} onChange={(e) => setPageContentForm({ ...pageContentForm, communityPartnerPrice: e.target.value })} />
                        </div>
                        <div>
                          <label className="block text-xs text-muted mb-1">Benefits (comma-separated)</label>
                          <input className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground" value={String(pageContentForm.communityPartnerBenefits || '')} onChange={(e) => setPageContentForm({ ...pageContentForm, communityPartnerBenefits: e.target.value })} />
                        </div>
                      </div>
                      <p className="text-xs text-muted font-semibold mt-2">Strategic Packages (High-Value)</p>
                      <div className="grid grid-cols-1 gap-3">
                        <div>
                          <label className="block text-xs text-muted mb-1">Section Subtitle</label>
                          <input className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground" value={String(pageContentForm.strategicPackagesSubtitle || '')} onChange={(e) => setPageContentForm({ ...pageContentForm, strategicPackagesSubtitle: e.target.value })} />
                        </div>
                      </div>
                      <p className="text-xs text-muted font-semibold mt-1">Innovation Track Sponsor</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs text-muted mb-1">Price</label>
                          <input className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground" value={String(pageContentForm.trackSponsorPrice || '')} onChange={(e) => setPageContentForm({ ...pageContentForm, trackSponsorPrice: e.target.value })} />
                        </div>
                        <div>
                          <label className="block text-xs text-muted mb-1">Benefits (comma-separated)</label>
                          <input className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground" value={String(pageContentForm.trackSponsorBenefits || '')} onChange={(e) => setPageContentForm({ ...pageContentForm, trackSponsorBenefits: e.target.value })} />
                        </div>
                      </div>
                      <p className="text-xs text-muted font-semibold mt-1">Hiring Partner</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs text-muted mb-1">Price</label>
                          <input className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground" value={String(pageContentForm.hiringPartnerPrice || '')} onChange={(e) => setPageContentForm({ ...pageContentForm, hiringPartnerPrice: e.target.value })} />
                        </div>
                        <div>
                          <label className="block text-xs text-muted mb-1">Benefits (comma-separated)</label>
                          <input className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground" value={String(pageContentForm.hiringPartnerBenefits || '')} onChange={(e) => setPageContentForm({ ...pageContentForm, hiringPartnerBenefits: e.target.value })} />
                        </div>
                      </div>
                      <p className="text-xs text-muted font-semibold mt-1">Digital Reach Sponsor</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs text-muted mb-1">Price</label>
                          <input className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground" value={String(pageContentForm.digitalReachPrice || '')} onChange={(e) => setPageContentForm({ ...pageContentForm, digitalReachPrice: e.target.value })} />
                        </div>
                        <div>
                          <label className="block text-xs text-muted mb-1">Benefits (comma-separated)</label>
                          <input className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground" value={String(pageContentForm.digitalReachBenefits || '')} onChange={(e) => setPageContentForm({ ...pageContentForm, digitalReachBenefits: e.target.value })} />
                        </div>
                      </div>
                      <p className="text-xs text-muted font-semibold mt-2">Special Sponsorships</p>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-xs text-muted mb-1">Stage Title</label>
                          <input className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground" value={String(pageContentForm.stageSponsorTitle || '')} onChange={(e) => setPageContentForm({ ...pageContentForm, stageSponsorTitle: e.target.value })} />
                        </div>
                        <div>
                          <label className="block text-xs text-muted mb-1">Media Title</label>
                          <input className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground" value={String(pageContentForm.mediaSponsorTitle || '')} onChange={(e) => setPageContentForm({ ...pageContentForm, mediaSponsorTitle: e.target.value })} />
                        </div>
                        <div>
                          <label className="block text-xs text-muted mb-1">Award Title</label>
                          <input className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground" value={String(pageContentForm.awardSponsorTitle || '')} onChange={(e) => setPageContentForm({ ...pageContentForm, awardSponsorTitle: e.target.value })} />
                        </div>
                        <div>
                          <label className="block text-xs text-muted mb-1">Stage Price</label>
                          <input className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground" value={String(pageContentForm.stageSponsorPrice || '')} onChange={(e) => setPageContentForm({ ...pageContentForm, stageSponsorPrice: e.target.value })} />
                        </div>
                        <div>
                          <label className="block text-xs text-muted mb-1">Media Price</label>
                          <input className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground" value={String(pageContentForm.mediaSponsorPrice || '')} onChange={(e) => setPageContentForm({ ...pageContentForm, mediaSponsorPrice: e.target.value })} />
                        </div>
                        <div>
                          <label className="block text-xs text-muted mb-1">Award Price</label>
                          <input className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground" value={String(pageContentForm.awardSponsorPrice || '')} onChange={(e) => setPageContentForm({ ...pageContentForm, awardSponsorPrice: e.target.value })} />
                        </div>
                        <div>
                          <label className="block text-xs text-muted mb-1">Stage Description</label>
                          <input className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground" value={String(pageContentForm.stageSponsorDesc || '')} onChange={(e) => setPageContentForm({ ...pageContentForm, stageSponsorDesc: e.target.value })} />
                        </div>
                        <div>
                          <label className="block text-xs text-muted mb-1">Media Description</label>
                          <input className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground" value={String(pageContentForm.mediaSponsorDesc || '')} onChange={(e) => setPageContentForm({ ...pageContentForm, mediaSponsorDesc: e.target.value })} />
                        </div>
                        <div>
                          <label className="block text-xs text-muted mb-1">Award Description</label>
                          <input className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground" value={String(pageContentForm.awardSponsorDesc || '')} onChange={(e) => setPageContentForm({ ...pageContentForm, awardSponsorDesc: e.target.value })} />
                        </div>
                      </div>
                    </Card>

                    {/* CTA Section */}
                    <Card className="p-4 space-y-3">
                      <h4 className="font-semibold text-foreground text-sm border-b border-border pb-2">🔥 Final CTA</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs text-muted mb-1">Title</label>
                          <input className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground" value={String(pageContentForm.ctaTitle || '')} onChange={(e) => setPageContentForm({ ...pageContentForm, ctaTitle: e.target.value })} />
                        </div>
                        <div>
                          <label className="block text-xs text-muted mb-1">Highlight (Gradient Text)</label>
                          <input className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground" value={String(pageContentForm.ctaHighlight || '')} onChange={(e) => setPageContentForm({ ...pageContentForm, ctaHighlight: e.target.value })} />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-xs text-muted mb-1">Description</label>
                          <textarea rows={2} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground" value={String(pageContentForm.ctaDescription || '')} onChange={(e) => setPageContentForm({ ...pageContentForm, ctaDescription: e.target.value })} />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-xs text-muted mb-1">Footer Text</label>
                          <input className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground" value={String(pageContentForm.ctaFooter || '')} onChange={(e) => setPageContentForm({ ...pageContentForm, ctaFooter: e.target.value })} />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-xs text-muted mb-1">Footer Highlight (Purple Text)</label>
                          <input className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground" value={String(pageContentForm.ctaFooterHighlight || '')} onChange={(e) => setPageContentForm({ ...pageContentForm, ctaFooterHighlight: e.target.value })} />
                        </div>
                      </div>
                    </Card>

                    {/* Certificate Release */}
                    <Card className="p-4 space-y-3">
                      <h4 className="font-semibold text-foreground text-sm border-b border-border pb-2">🎓 Certificate of Participation</h4>
                      <p className="text-xs text-muted">Set the date &amp; time when participation certificates become visible and downloadable on participant dashboards.</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs text-muted mb-1">Release Date</label>
                          <input type="date" className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground" value={String(pageContentForm.certificateReleaseDate || '')} onChange={(e) => setPageContentForm({ ...pageContentForm, certificateReleaseDate: e.target.value })} />
                        </div>
                        <div>
                          <label className="block text-xs text-muted mb-1">Release Time (IST)</label>
                          <input type="time" className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground" value={String(pageContentForm.certificateReleaseTime || '')} onChange={(e) => setPageContentForm({ ...pageContentForm, certificateReleaseTime: e.target.value })} />
                        </div>
                      </div>
                      {typeof pageContentForm.certificateReleaseDate === 'string' && pageContentForm.certificateReleaseDate && (
                        <p className="text-xs text-green-400">
                          Certificates will be released on {pageContentForm.certificateReleaseDate} at {(pageContentForm.certificateReleaseTime as string) || '00:00'} IST
                        </p>
                      )}
                    </Card>

                    <div className="flex justify-end">
                      <Button onClick={savePageContent} isLoading={pageContentSaving}>Save All Content</Button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <Card className="p-8 text-center">
                <TrophyIcon className="w-12 h-12 mx-auto text-muted mb-3" />
                <p className="text-muted mb-4">No competition created yet.</p>
                <Button onClick={seedCompetition} disabled={seedingCompetition} size="sm">
                  {seedingCompetition ? 'Creating...' : 'Create Competition'}
                </Button>
              </Card>
            )}
          </motion.div>
        )}

        {/* VSC Tab */}
        {tab === 'vsc' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            {!vscData ? (
              <Card className="p-8 text-center">
                <BoltIcon className="w-12 h-12 mx-auto text-muted mb-3" />
                <p className="text-muted mb-4">No VSC Challenge created yet.</p>
                <Button onClick={createVscChallenge} disabled={vscCreating} size="sm">
                  {vscCreating ? 'Creating...' : 'Create VSC Challenge'}
                </Button>
              </Card>
            ) : (
              <>
                {/* VSC Sub-tabs */}
                <div className="flex gap-2 overflow-x-auto mb-2">
                  {([
                    { id: 'details' as const, label: 'Challenge Details', icon: Cog6ToothIcon },
                    { id: 'rounds' as const, label: `Rounds (${vscData.rounds.length})`, icon: PlayIcon },
                    { id: 'participants' as const, label: `Participants (${vscData._count.participants})`, icon: UsersIcon },
                    { id: 'questions' as const, label: 'Question Pool', icon: AcademicCapIcon },
                  ]).map(st => {
                    const StIcon = st.icon;
                    return (
                      <button key={st.id} onClick={() => setVscSubTab(st.id)} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors whitespace-nowrap ${vscSubTab === st.id ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'text-muted hover:text-foreground hover:bg-card-hover'}`}>
                        <StIcon className="w-4 h-4" />
                        {st.label}
                      </button>
                    );
                  })}
                </div>

                {/* Challenge Details Sub-tab */}
                {vscSubTab === 'details' && (
                  <Card className="p-6">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                          <FireIcon className="w-5 h-5 text-red-400" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground">{vscData.name}</h3>
                          <p className="text-sm text-muted">{vscData.tagline}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {vscEditMode ? (
                          <>
                            <Button size="sm" onClick={saveVscChallenge} isLoading={vscSaving}>Save</Button>
                            <Button size="sm" variant="ghost" onClick={() => setVscEditMode(false)}>Cancel</Button>
                          </>
                        ) : (
                          <Button size="sm" variant="ghost" onClick={() => {
                            setVscEditMode(true);
                            setVscForm({
                              name: vscData.name,
                              tagline: vscData.tagline,
                              description: vscData.description,
                              entryFee: vscData.entryFee,
                              secondChanceFee: vscData.secondChanceFee,
                              thirdChanceFee: vscData.thirdChanceFee,
                              skipRoundPrice: vscData.skipRoundPrice,
                              extraTimePrice: vscData.extraTimePrice,
                              revivePrice: vscData.revivePrice,
                              leaderboardBoostPrice: vscData.leaderboardBoostPrice,
                              manualRegistrations: vscData.manualRegistrations,
                              isActive: vscData.isActive ? 1 : 0,
                            });
                          }}>
                            <PencilSquareIcon className="w-4 h-4" /> Edit
                          </Button>
                        )}
                      </div>
                    </div>

                    {vscEditMode ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs text-muted mb-1">Name</label>
                            <input className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground" value={String(vscForm.name || '')} onChange={e => setVscForm({ ...vscForm, name: e.target.value })} />
                          </div>
                          <div>
                            <label className="block text-xs text-muted mb-1">Tagline</label>
                            <input className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground" value={String(vscForm.tagline || '')} onChange={e => setVscForm({ ...vscForm, tagline: e.target.value })} />
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs text-muted mb-1">Description</label>
                          <textarea className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground h-20" value={String(vscForm.description || '')} onChange={e => setVscForm({ ...vscForm, description: e.target.value })} />
                        </div>
                        <div className="flex items-center gap-3">
                          <label className="text-xs text-muted">Active</label>
                          <button onClick={() => setVscForm({ ...vscForm, isActive: vscForm.isActive === 1 ? 0 : 1 })} className={`w-10 h-6 rounded-full transition-colors ${vscForm.isActive === 1 ? 'bg-green-500' : 'bg-gray-600'}`}>
                            <div className={`w-4 h-4 rounded-full bg-white transition-transform mx-1 ${vscForm.isActive === 1 ? 'translate-x-4' : ''}`} />
                          </button>
                        </div>
                        <p className="text-xs text-muted font-semibold mt-2">Entry Fees (₹)</p>
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <label className="block text-xs text-muted mb-1">1st Attempt</label>
                            <input type="number" className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground" value={String(vscForm.entryFee || '')} onChange={e => setVscForm({ ...vscForm, entryFee: e.target.value })} />
                          </div>
                          <div>
                            <label className="block text-xs text-muted mb-1">2nd Chance</label>
                            <input type="number" className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground" value={String(vscForm.secondChanceFee || '')} onChange={e => setVscForm({ ...vscForm, secondChanceFee: e.target.value })} />
                          </div>
                          <div>
                            <label className="block text-xs text-muted mb-1">3rd+ Attempt</label>
                            <input type="number" className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground" value={String(vscForm.thirdChanceFee || '')} onChange={e => setVscForm({ ...vscForm, thirdChanceFee: e.target.value })} />
                          </div>
                        </div>
                        <p className="text-xs text-muted font-semibold mt-2">Power-up Prices (₹)</p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <label className="block text-xs text-muted mb-1">Skip Round</label>
                            <input type="number" className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground" value={String(vscForm.skipRoundPrice || '')} onChange={e => setVscForm({ ...vscForm, skipRoundPrice: e.target.value })} />
                          </div>
                          <div>
                            <label className="block text-xs text-muted mb-1">Extra Time</label>
                            <input type="number" className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground" value={String(vscForm.extraTimePrice || '')} onChange={e => setVscForm({ ...vscForm, extraTimePrice: e.target.value })} />
                          </div>
                          <div>
                            <label className="block text-xs text-muted mb-1">Revive</label>
                            <input type="number" className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground" value={String(vscForm.revivePrice || '')} onChange={e => setVscForm({ ...vscForm, revivePrice: e.target.value })} />
                          </div>
                          <div>
                            <label className="block text-xs text-muted mb-1">Leaderboard Boost</label>
                            <input type="number" className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground" value={String(vscForm.leaderboardBoostPrice || '')} onChange={e => setVscForm({ ...vscForm, leaderboardBoostPrice: e.target.value })} />
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs text-muted mb-1">Manual Registrations (added to count)</label>
                          <input type="number" className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground max-w-xs" value={String(vscForm.manualRegistrations || '')} onChange={e => setVscForm({ ...vscForm, manualRegistrations: e.target.value })} />
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="p-3 rounded-xl bg-card-hover">
                            <p className="text-xs text-muted">Participants</p>
                            <p className="text-xl font-bold text-foreground">{vscData._count.participants + vscData.manualRegistrations}</p>
                          </div>
                          <div className="p-3 rounded-xl bg-card-hover">
                            <p className="text-xs text-muted">Rounds</p>
                            <p className="text-xl font-bold text-foreground">{vscData.rounds.length}</p>
                          </div>
                          <div className="p-3 rounded-xl bg-card-hover">
                            <p className="text-xs text-muted">Active</p>
                            <p className="text-xl font-bold text-foreground">{vscData.participants.filter(p => !p.isEliminated && p.paymentStatus === 'PAID').length}</p>
                          </div>
                          <div className="p-3 rounded-xl bg-card-hover">
                            <p className="text-xs text-muted">Revenue</p>
                            <p className="text-xl font-bold text-foreground">{formatCurrency(vscData.participants.filter(p => p.paymentStatus === 'PAID').reduce((s, p) => s + p.entryFee, 0))}</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                          <div><span className="text-muted">Entry Fee:</span> <span className="text-foreground font-medium">₹{vscData.entryFee}</span></div>
                          <div><span className="text-muted">2nd Chance:</span> <span className="text-foreground font-medium">₹{vscData.secondChanceFee}</span></div>
                          <div><span className="text-muted">3rd+ Attempt:</span> <span className="text-foreground font-medium">₹{vscData.thirdChanceFee}</span></div>
                          <div><span className="text-muted">Skip Round:</span> <span className="text-foreground font-medium">₹{vscData.skipRoundPrice}</span></div>
                          <div><span className="text-muted">Extra Time:</span> <span className="text-foreground font-medium">₹{vscData.extraTimePrice}</span></div>
                          <div><span className="text-muted">Revive:</span> <span className="text-foreground font-medium">₹{vscData.revivePrice}</span></div>
                          <div><span className="text-muted">Leaderboard Boost:</span> <span className="text-foreground font-medium">₹{vscData.leaderboardBoostPrice}</span></div>
                          <div><span className="text-muted">Status:</span> <Badge variant={vscData.isActive ? 'success' : 'danger'}>{vscData.isActive ? 'Active' : 'Inactive'}</Badge></div>
                        </div>
                      </div>
                    )}
                  </Card>
                )}

                {/* Rounds Sub-tab */}
                {vscSubTab === 'rounds' && (
                  <div className="space-y-4">
                    {/* Add Round Form */}
                    <Card className="p-5">
                      <h3 className="font-semibold text-foreground text-sm mb-3">Add New Round</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                        <div>
                          <label className="block text-xs text-muted mb-1">Round #</label>
                          <input type="number" className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground" value={vscRoundForm.roundNumber} onChange={e => setVscRoundForm({ ...vscRoundForm, roundNumber: e.target.value })} placeholder="1" />
                        </div>
                        <div>
                          <label className="block text-xs text-muted mb-1">Title</label>
                          <input className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground" value={vscRoundForm.title} onChange={e => setVscRoundForm({ ...vscRoundForm, title: e.target.value })} placeholder="Speed IQ" />
                        </div>
                        <div>
                          <label className="block text-xs text-muted mb-1">Type</label>
                          <select className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground" value={vscRoundForm.roundType} onChange={e => setVscRoundForm({ ...vscRoundForm, roundType: e.target.value })}>
                            {ROUND_TYPES.map(rt => <option key={rt.value} value={rt.value}>{rt.label}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs text-muted mb-1">Time (sec)</label>
                          <input type="number" className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground" value={vscRoundForm.timeLimit} onChange={e => setVscRoundForm({ ...vscRoundForm, timeLimit: e.target.value })} />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <div>
                          <label className="block text-xs text-muted mb-1">Passing %</label>
                          <input type="number" className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground" value={vscRoundForm.passingPercent} onChange={e => setVscRoundForm({ ...vscRoundForm, passingPercent: e.target.value })} />
                        </div>
                        <div>
                          <label className="block text-xs text-muted mb-1">Description</label>
                          <input className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground" value={vscRoundForm.description} onChange={e => setVscRoundForm({ ...vscRoundForm, description: e.target.value })} placeholder="Round description" />
                        </div>
                      </div>
                      <div className="mb-3">
                        <label className="block text-xs text-muted mb-1">Prompt (for creative/pitch rounds)</label>
                        <textarea className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground h-16" value={vscRoundForm.prompt} onChange={e => setVscRoundForm({ ...vscRoundForm, prompt: e.target.value })} placeholder="Optional task prompt..." />
                      </div>
                      <Button size="sm" onClick={addVscRound} isLoading={vscSaving}>Add Round</Button>
                    </Card>

                    {/* Existing Rounds */}
                    {vscData.rounds.map(round => (
                      <Card key={round.id} className="p-5">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${round.isActive ? 'bg-green-500/10 text-green-400' : 'bg-gray-500/10 text-gray-400'}`}>
                              R{round.roundNumber}
                            </div>
                            <div>
                              <h4 className="font-semibold text-foreground text-sm">{round.title}</h4>
                              <p className="text-xs text-muted">{ROUND_TYPES.find(rt => rt.value === round.roundType)?.label || round.roundType} &middot; {round.timeLimit}s &middot; {round.passingPercent}% pass &middot; {Array.isArray(round.questionPool) ? round.questionPool.length : 0} questions</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={round.isActive ? 'success' : 'default'}>{round.isActive ? 'Active' : 'Inactive'}</Badge>
                            <Badge variant={round.isLocked ? 'warning' : 'info'}>{round.isLocked ? 'Locked' : 'Open'}</Badge>
                            <Button size="sm" variant="ghost" onClick={() => updateVscRound(round.id, { isActive: !round.isActive })}>
                              {round.isActive ? <XCircleIcon className="w-4 h-4" /> : <CheckCircleIcon className="w-4 h-4" />}
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => updateVscRound(round.id, { isLocked: !round.isLocked })}>
                              {round.isLocked ? <LockOpenIcon className="w-4 h-4" /> : <LockClosedIcon className="w-4 h-4" />}
                            </Button>
                            {vscEditingRound === round.id ? (
                              <>
                                <Button size="sm" onClick={() => updateVscRound(round.id, vscEditRoundForm)} isLoading={vscSaving}>Save</Button>
                                <Button size="sm" variant="ghost" onClick={() => setVscEditingRound(null)}>Cancel</Button>
                              </>
                            ) : (
                              <Button size="sm" variant="ghost" onClick={() => {
                                setVscEditingRound(round.id);
                                setVscEditRoundForm({
                                  title: round.title,
                                  description: round.description,
                                  roundType: round.roundType,
                                  timeLimit: String(round.timeLimit),
                                  passingPercent: String(round.passingPercent),
                                  prompt: round.prompt || '',
                                });
                              }}>
                                <PencilSquareIcon className="w-4 h-4" />
                              </Button>
                            )}
                            <Button size="sm" variant="ghost" onClick={() => deleteVscRound(round.id, round.title)}>
                              <TrashIcon className="w-4 h-4 text-red-400" />
                            </Button>
                          </div>
                        </div>
                        {vscEditingRound === round.id && (
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3 p-3 bg-card-hover rounded-xl">
                            <div>
                              <label className="block text-xs text-muted mb-1">Title</label>
                              <input className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground" value={vscEditRoundForm.title || ''} onChange={e => setVscEditRoundForm({ ...vscEditRoundForm, title: e.target.value })} />
                            </div>
                            <div>
                              <label className="block text-xs text-muted mb-1">Type</label>
                              <select className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground" value={vscEditRoundForm.roundType || ''} onChange={e => setVscEditRoundForm({ ...vscEditRoundForm, roundType: e.target.value })}>
                                {ROUND_TYPES.map(rt => <option key={rt.value} value={rt.value}>{rt.label}</option>)}
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs text-muted mb-1">Time (sec)</label>
                              <input type="number" className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground" value={vscEditRoundForm.timeLimit || ''} onChange={e => setVscEditRoundForm({ ...vscEditRoundForm, timeLimit: e.target.value })} />
                            </div>
                            <div>
                              <label className="block text-xs text-muted mb-1">Passing %</label>
                              <input type="number" className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground" value={vscEditRoundForm.passingPercent || ''} onChange={e => setVscEditRoundForm({ ...vscEditRoundForm, passingPercent: e.target.value })} />
                            </div>
                            <div className="col-span-2 md:col-span-4">
                              <label className="block text-xs text-muted mb-1">Prompt</label>
                              <textarea className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground h-16" value={vscEditRoundForm.prompt || ''} onChange={e => setVscEditRoundForm({ ...vscEditRoundForm, prompt: e.target.value })} />
                            </div>
                          </div>
                        )}
                      </Card>
                    ))}

                    {vscData.rounds.length === 0 && (
                      <Card className="p-6 text-center">
                        <p className="text-muted text-sm">No rounds created yet. Add your first round above.</p>
                      </Card>
                    )}
                  </div>
                )}

                {/* Participants Sub-tab */}
                {vscSubTab === 'participants' && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="relative flex-1 max-w-md">
                        <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                        <input className="w-full bg-background border border-border rounded-xl pl-9 pr-3 py-2 text-sm text-foreground" placeholder="Search by name, email, phone..." value={vscParticipantSearch} onChange={e => setVscParticipantSearch(e.target.value)} />
                      </div>
                      <Button size="sm" variant="ghost" onClick={() => {
                        const rows = vscData.participants.map(p => [p.name, p.email, p.phone, p.college || '', p.city, p.state, `R${p.currentRound}`, p.totalScore, p.isEliminated ? 'Eliminated' : 'Active', p.paymentStatus, p.referralCode, p.referralsCount, p.attemptNumber].join(','));
                        const csv = 'Name,Email,Phone,College,City,State,Round,Score,Status,Payment,Referral,Referrals,Attempt\n' + rows.join('\n');
                        const blob = new Blob([csv], { type: 'text/csv' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a'); a.href = url; a.download = 'vsc-participants.csv'; a.click();
                      }}>
                        <ArrowDownTrayIcon className="w-4 h-4" /> Export CSV
                      </Button>
                    </div>

                    {/* Stats Row */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                      <div className="p-3 rounded-xl bg-card-hover text-center">
                        <p className="text-lg font-bold text-foreground">{vscData.participants.filter(p => p.paymentStatus === 'PAID').length}</p>
                        <p className="text-xs text-muted">Paid</p>
                      </div>
                      <div className="p-3 rounded-xl bg-card-hover text-center">
                        <p className="text-lg font-bold text-green-400">{vscData.participants.filter(p => !p.isEliminated && p.paymentStatus === 'PAID').length}</p>
                        <p className="text-xs text-muted">Active</p>
                      </div>
                      <div className="p-3 rounded-xl bg-card-hover text-center">
                        <p className="text-lg font-bold text-red-400">{vscData.participants.filter(p => p.isEliminated).length}</p>
                        <p className="text-xs text-muted">Eliminated</p>
                      </div>
                      <div className="p-3 rounded-xl bg-card-hover text-center">
                        <p className="text-lg font-bold text-yellow-400">{vscData.participants.filter(p => p.paymentStatus === 'PENDING').length}</p>
                        <p className="text-xs text-muted">Pending Pay</p>
                      </div>
                      <div className="p-3 rounded-xl bg-card-hover text-center">
                        <p className="text-lg font-bold text-blue-400">{vscData.participants.reduce((s, p) => s + p.referralsCount, 0)}</p>
                        <p className="text-xs text-muted">Total Referrals</p>
                      </div>
                    </div>

                    {/* Participants Table */}
                    <Card className="overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-card-hover">
                            <tr>
                              <th className="text-left p-3 text-muted font-medium">Name</th>
                              <th className="text-left p-3 text-muted font-medium">Contact</th>
                              <th className="text-center p-3 text-muted font-medium">Round</th>
                              <th className="text-center p-3 text-muted font-medium">Score</th>
                              <th className="text-center p-3 text-muted font-medium">Status</th>
                              <th className="text-center p-3 text-muted font-medium">Payment</th>
                              <th className="text-center p-3 text-muted font-medium">Refs</th>
                              <th className="text-right p-3 text-muted font-medium">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {vscData.participants
                              .filter(p => {
                                if (!vscParticipantSearch) return true;
                                const q = vscParticipantSearch.toLowerCase();
                                return p.name.toLowerCase().includes(q) || p.email.toLowerCase().includes(q) || p.phone.includes(q) || (p.college && p.college.toLowerCase().includes(q));
                              })
                              .map(p => (
                                <tr key={p.id} className="border-t border-border hover:bg-card-hover/50">
                                  <td className="p-3">
                                    <p className="font-medium text-foreground">{p.name}</p>
                                    <p className="text-xs text-muted">{p.college || p.city} &middot; Attempt #{p.attemptNumber}</p>
                                  </td>
                                  <td className="p-3">
                                    <p className="text-foreground">{p.email}</p>
                                    <p className="text-xs text-muted">{p.phone}</p>
                                  </td>
                                  <td className="text-center p-3">
                                    <span className="font-bold text-foreground">R{p.currentRound}</span>
                                  </td>
                                  <td className="text-center p-3">
                                    <span className="font-bold text-foreground">{p.totalScore}</span>
                                  </td>
                                  <td className="text-center p-3">
                                    <Badge variant={p.isEliminated ? 'danger' : 'success'}>
                                      {p.isEliminated ? `Elim R${p.eliminatedAt || '?'}` : 'Active'}
                                    </Badge>
                                    {p.isBoosted && <Badge variant="info" className="ml-1">Boosted</Badge>}
                                  </td>
                                  <td className="text-center p-3">
                                    <Badge variant={p.paymentStatus === 'PAID' ? 'success' : 'warning'}>{p.paymentStatus}</Badge>
                                  </td>
                                  <td className="text-center p-3">{p.referralsCount}</td>
                                  <td className="text-right p-3">
                                    <div className="flex items-center justify-end gap-1">
                                      {p.isEliminated ? (
                                        <Button size="sm" variant="ghost" onClick={() => reviveVscParticipant(p.id)} title="Revive">
                                          <CheckCircleIcon className="w-4 h-4 text-green-400" />
                                        </Button>
                                      ) : (
                                        <Button size="sm" variant="ghost" onClick={() => eliminateVscParticipant(p.id, p.currentRound)} title="Eliminate">
                                          <XCircleIcon className="w-4 h-4 text-red-400" />
                                        </Button>
                                      )}
                                      <Button size="sm" variant="ghost" onClick={() => deleteVscParticipant(p.id, p.name)} title="Delete">
                                        <TrashIcon className="w-4 h-4 text-red-400" />
                                      </Button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                        {vscData.participants.length === 0 && (
                          <p className="text-center text-muted py-8 text-sm">No participants yet.</p>
                        )}
                      </div>
                    </Card>
                  </div>
                )}

                {/* Questions Sub-tab */}
                {vscSubTab === 'questions' && (
                  <div className="space-y-4">
                    {/* Select Round */}
                    <Card className="p-5">
                      <h3 className="font-semibold text-foreground text-sm mb-3">Select Round to Manage Questions</h3>
                      <div className="flex flex-wrap gap-2">
                        {vscData.rounds.map(r => (
                          <button key={r.id} onClick={() => setVscSelectedRound(r.id)} className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${vscSelectedRound === r.id ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'text-muted hover:text-foreground bg-card-hover'}`}>
                            R{r.roundNumber}: {r.title} ({Array.isArray(r.questionPool) ? r.questionPool.length : 0}q)
                          </button>
                        ))}
                      </div>
                    </Card>

                    {vscSelectedRound && (() => {
                      const round = vscData.rounds.find(r => r.id === vscSelectedRound);
                      if (!round) return null;
                      const isQuizType = ['SPEED_IQ', 'DECISION_MAKING', 'PRESSURE'].includes(round.roundType);

                      return (
                        <>
                          {/* Add Question Form */}
                          <Card className="p-5">
                            <h3 className="font-semibold text-foreground text-sm mb-3">
                              Add Question to R{round.roundNumber}: {round.title}
                              <span className="text-muted font-normal ml-2">({ROUND_TYPES.find(rt => rt.value === round.roundType)?.label})</span>
                            </h3>
                            <div className="space-y-3">
                              <div>
                                <label className="block text-xs text-muted mb-1">Question</label>
                                <textarea className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground h-16" value={vscQuestionForm.question} onChange={e => setVscQuestionForm({ ...vscQuestionForm, question: e.target.value })} placeholder="Enter question text..." />
                              </div>
                              {isQuizType && (
                                <div className="grid grid-cols-2 gap-3">
                                  <div>
                                    <label className="block text-xs text-muted mb-1">Option A</label>
                                    <input className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground" value={vscQuestionForm.optionA} onChange={e => setVscQuestionForm({ ...vscQuestionForm, optionA: e.target.value })} />
                                  </div>
                                  <div>
                                    <label className="block text-xs text-muted mb-1">Option B</label>
                                    <input className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground" value={vscQuestionForm.optionB} onChange={e => setVscQuestionForm({ ...vscQuestionForm, optionB: e.target.value })} />
                                  </div>
                                  <div>
                                    <label className="block text-xs text-muted mb-1">Option C</label>
                                    <input className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground" value={vscQuestionForm.optionC} onChange={e => setVscQuestionForm({ ...vscQuestionForm, optionC: e.target.value })} />
                                  </div>
                                  <div>
                                    <label className="block text-xs text-muted mb-1">Option D</label>
                                    <input className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground" value={vscQuestionForm.optionD} onChange={e => setVscQuestionForm({ ...vscQuestionForm, optionD: e.target.value })} />
                                  </div>
                                </div>
                              )}
                              <div className="grid grid-cols-3 gap-3">
                                <div>
                                  <label className="block text-xs text-muted mb-1">{isQuizType ? 'Correct Answer' : 'Expected Answer Hint'}</label>
                                  <input className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground" value={vscQuestionForm.correctAnswer} onChange={e => setVscQuestionForm({ ...vscQuestionForm, correctAnswer: e.target.value })} placeholder={isQuizType ? 'e.g. Option A text' : 'Evaluation criteria'} />
                                </div>
                                <div>
                                  <label className="block text-xs text-muted mb-1">Points</label>
                                  <input type="number" className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground" value={vscQuestionForm.points} onChange={e => setVscQuestionForm({ ...vscQuestionForm, points: e.target.value })} />
                                </div>
                                <div>
                                  <label className="block text-xs text-muted mb-1">Category</label>
                                  <input className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground" value={vscQuestionForm.category} onChange={e => setVscQuestionForm({ ...vscQuestionForm, category: e.target.value })} placeholder="General" />
                                </div>
                              </div>
                              <Button size="sm" onClick={() => addQuestionToPool(round.id)}>Add Question</Button>
                            </div>
                          </Card>

                          {/* Existing Questions */}
                          <Card className="p-5">
                            <h3 className="font-semibold text-foreground text-sm mb-3">
                              Questions ({Array.isArray(round.questionPool) ? round.questionPool.length : 0})
                            </h3>
                            {Array.isArray(round.questionPool) && round.questionPool.length > 0 ? (
                              <div className="space-y-2">
                                {(round.questionPool as { id: string; question: string; options?: string[]; correctAnswer?: string; points: number; category?: string }[]).map((q, idx) => (
                                  <div key={q.id} className="flex items-start justify-between p-3 rounded-xl bg-card-hover gap-3">
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm text-foreground font-medium">
                                        <span className="text-muted mr-2">Q{idx + 1}.</span>
                                        {q.question}
                                      </p>
                                      {q.options && q.options.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mt-1">
                                          {q.options.map((opt, oi) => (
                                            <span key={oi} className={`text-xs px-2 py-0.5 rounded ${opt === q.correctAnswer ? 'bg-green-500/10 text-green-400 font-medium' : 'bg-white/5 text-muted'}`}>
                                              {String.fromCharCode(65 + oi)}. {opt}
                                            </span>
                                          ))}
                                        </div>
                                      )}
                                      <p className="text-xs text-muted mt-1">{q.points} pts &middot; {q.category || 'General'}{q.correctAnswer && !q.options ? ` · Answer: ${q.correctAnswer}` : ''}</p>
                                    </div>
                                    <Button size="sm" variant="ghost" onClick={() => removeQuestionFromPool(round.id, q.id)}>
                                      <TrashIcon className="w-4 h-4 text-red-400" />
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-muted text-sm text-center py-4">No questions in this round&apos;s pool yet.</p>
                            )}
                          </Card>
                        </>
                      );
                    })()}

                    {!vscSelectedRound && (
                      <Card className="p-6 text-center">
                        <p className="text-muted text-sm">Select a round above to manage its question pool.</p>
                      </Card>
                    )}
                  </div>
                )}
              </>
            )}
          </motion.div>
        )}

        {/* Settings Tab */}
        {tab === 'settings' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 max-w-2xl">
            {/* Coming Soon Toggle */}
            <Card className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-orange/10 flex items-center justify-center flex-shrink-0">
                  <Cog6ToothIcon className="w-5 h-5 text-orange" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground mb-1">Coming Soon Mode</h3>
                  <p className="text-sm text-muted mb-4">
                    When enabled, the entire website will be inaccessible. Only the Competition event page
                    and the Admin panel will remain accessible.
                  </p>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={toggleComingSoon}
                      disabled={settingsLoading}
                      className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors ${
                        comingSoon ? 'bg-orange' : 'bg-border'
                      }`}
                    >
                      <span
                        className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                          comingSoon ? 'translate-x-8' : 'translate-x-1'
                        }`}
                      />
                    </button>
                    <span className={`text-sm font-medium ${comingSoon ? 'text-orange' : 'text-muted'}`}>
                      {comingSoon ? 'ENABLED — Site is in Coming Soon mode' : 'DISABLED — Site is live'}
                    </span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Razorpay Payment Gateway */}
            <Card className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                  <CreditCardIcon className="w-5 h-5 text-blue-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground mb-1">Razorpay Payment Gateway</h3>
                  <p className="text-sm text-muted mb-4">
                    Manage your Razorpay API keys for processing payments. Keys are stored securely and used across all payment flows.
                  </p>
                  {razorpayHasKeys && (
                    <div className="flex items-center gap-2 text-green-400 text-xs mb-3">
                      <CheckCircleIcon className="w-4 h-4" />
                      Keys configured {razorpayKeySource === 'environment' ? <span className="text-yellow-400">(from environment variables)</span> : <span>(from database)</span>}
                    </div>
                  )}
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs text-muted mb-1">Key ID</label>
                      <input
                        type="text"
                        className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground font-mono"
                        placeholder="rzp_live_xxxxxxxxxxxxxxx"
                        value={razorpayKeyId}
                        onChange={(e) => setRazorpayKeyId(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-muted mb-1">Key Secret</label>
                      <input
                        type="password"
                        className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground font-mono"
                        placeholder="Enter new secret to update"
                        value={razorpayKeySecret}
                        onChange={(e) => setRazorpayKeySecret(e.target.value)}
                      />
                      <p className="text-[10px] text-muted mt-1">Leave unchanged to keep existing secret. Only enter a new value to update.</p>
                    </div>
                    <Button
                      size="sm"
                      disabled={razorpaySaving || !razorpayKeyId.trim()}
                      onClick={async () => {
                        setRazorpaySaving(true);
                        try {
                          const token = localStorage.getItem('token');
                          const payload: Record<string, string> = { razorpayKeyId: razorpayKeyId.trim() };
                          if (razorpayKeySecret && !razorpayKeySecret.startsWith('••••')) {
                            payload.razorpayKeySecret = razorpayKeySecret.trim();
                          }
                          const res = await fetch('/api/site-settings', {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                            body: JSON.stringify(payload),
                          });
                          const data = await res.json();
                          if (data.success) {
                            setRazorpayKeyId(data.data.razorpayKeyId);
                            setRazorpayKeySecret(data.data.razorpayKeySecret);
                            setRazorpayHasKeys(data.data.hasRazorpayKeys);
                            setRazorpayKeySource(data.data.razorpayKeySource || 'database');
                            alert('Razorpay keys updated successfully!');
                          } else {
                            alert(data.error || 'Failed to update keys');
                          }
                        } catch { alert('Failed to save'); }
                        setRazorpaySaving(false);
                      }}
                    >
                      {razorpaySaving ? 'Saving...' : 'Save Razorpay Keys'}
                    </Button>
                  </div>
                </div>
              </div>
            </Card>

            {/* Competition Seeding */}
            <Card className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-purple/10 flex items-center justify-center flex-shrink-0">
                  <TrophyIcon className="w-5 h-5 text-purple" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground mb-1">Vishvakarma Innovation Challenge 2026</h3>
                  <p className="text-sm text-muted mb-4">
                    Initialize the national startup competition. This will create the competition record with all phases and dates configured.
                  </p>
                  {competitionSeeded ? (
                    <div className="flex items-center gap-2 text-green-400 text-sm">
                      <CheckCircleIcon className="w-5 h-5" />
                      Competition created successfully!
                    </div>
                  ) : (
                    <Button
                      onClick={seedCompetition}
                      disabled={seedingCompetition}
                      size="sm"
                    >
                      {seedingCompetition ? 'Creating...' : 'Create Competition'}
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </div>
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setDeleteConfirm(null)}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card border border-border rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
                <ExclamationTriangleIcon className="w-5 h-5 text-red-400" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">Confirm Delete</h3>
            </div>
            <p className="text-muted text-sm mb-1">
              Are you sure you want to permanently delete this {deleteConfirm.type}?
            </p>
            <p className="text-foreground font-medium mb-4">&quot;{deleteConfirm.name}&quot;</p>
            {deleteConfirm.type === 'user' && (
              <p className="text-xs text-red-400 mb-4">
                This will also delete all their startups, campaigns, contributions, and related data.
              </p>
            )}
            {deleteConfirm.type === 'startup' && (
              <p className="text-xs text-red-400 mb-4">
                This will also delete the campaign, contributions, milestones, comments, and all related data.
              </p>
            )}
            <div className="flex gap-3 justify-end">
              <Button variant="ghost" size="sm" onClick={() => setDeleteConfirm(null)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                isLoading={actionLoading === deleteConfirm.id}
                onClick={() => {
                  if (deleteConfirm.type === 'startup') handleDeleteStartup(deleteConfirm.id);
                  else handleDeleteUser(deleteConfirm.id);
                }}
              >
                <TrashIcon className="w-4 h-4 mr-1" /> Delete
              </Button>
            </div>
          </motion.div>
        </div>
      )}

      {/* User View Modal */}
      {viewUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setViewUser(null)}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card border border-border rounded-2xl p-6 w-full max-w-lg mx-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-foreground">User Details</h3>
              <button onClick={() => setViewUser(null)} className="p-1.5 rounded-lg hover:bg-card-hover text-muted">
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue to-purple flex items-center justify-center text-white text-xl font-bold">
                {viewUser.firstName[0]}
              </div>
              <div>
                <p className="text-lg font-semibold text-foreground">{viewUser.firstName} {viewUser.lastName}</p>
                <p className="text-sm text-muted">{viewUser.email}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="p-3 rounded-xl bg-card-hover">
                <p className="text-xs text-muted mb-1">Role</p>
                <Badge variant={viewUser.role === 'ADMIN' ? 'info' : viewUser.role === 'FOUNDER' ? 'success' : 'default'}>
                  {viewUser.role}
                </Badge>
              </div>
              <div className="p-3 rounded-xl bg-card-hover">
                <p className="text-xs text-muted mb-1">Status</p>
                <Badge variant={viewUser.isActive ? 'success' : 'danger'}>
                  {viewUser.isActive ? 'Active' : 'Suspended'}
                </Badge>
              </div>
              <div className="p-3 rounded-xl bg-card-hover">
                <p className="text-xs text-muted mb-1">Startups</p>
                <p className="text-foreground font-semibold">{viewUser._count?.startups ?? 0}</p>
              </div>
              <div className="p-3 rounded-xl bg-card-hover">
                <p className="text-xs text-muted mb-1">Contributions</p>
                <p className="text-foreground font-semibold">{viewUser._count?.contributions ?? 0}</p>
              </div>
            </div>
            <div className="p-3 rounded-xl bg-card-hover mb-6">
              <p className="text-xs text-muted mb-1">Joined</p>
              <p className="text-foreground text-sm">{new Date(viewUser.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            </div>
            <div className="flex gap-3 justify-end">
              {viewUser.role !== 'ADMIN' && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => { handleSuspendUser(viewUser.id); setViewUser(null); }}
                  >
                    {viewUser.isActive ? 'Suspend' : 'Reactivate'}
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => { setViewUser(null); setDeleteConfirm({ type: 'user', id: viewUser.id, name: `${viewUser.firstName} ${viewUser.lastName}` }); }}
                  >
                    <TrashIcon className="w-4 h-4 mr-1" /> Delete
                  </Button>
                </>
              )}
              <Button variant="ghost" size="sm" onClick={() => setViewUser(null)}>
                Close
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
