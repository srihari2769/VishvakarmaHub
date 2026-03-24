'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Button, Card, Badge } from '@/components/ui';
import { useAuthStore } from '@/store/authStore';
import {
  UserIcon,
  CalendarDaysIcon,
  MapPinIcon,
  LinkIcon,
  ChatBubbleLeftIcon,
  HeartIcon,
  ShareIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationCircleIcon,
  SparklesIcon,
  DocumentTextIcon,
  PhotoIcon,
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';

interface RewardTier {
  id: string;
  name: string;
  amount: number;
  description: string;
  maxClaims: number | null;
  claimedCount: number;
}

interface Milestone {
  id: string;
  title: string;
  description: string;
  status: string;
  targetDate: string | null;
  completedDate: string | null;
}

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  user: { firstName: string; lastName: string; avatar: string | null };
  replies: Comment[];
}

interface StartupDetail {
  id: string;
  title: string;
  slug: string;
  shortDescription: string;
  problemDescription: string;
  targetAudience: string;
  solutionExplanation: string;
  innovationUniqueness: string;
  category: string;
  location: string;
  productStage: string;
  status: string;
  logo: string | null;
  pitchDeck: string | null;
  demoVideo: string | null;
  screenshots: string[];
  aiScore: number | null;
  marketPotential: string | null;
  executionRisk: string | null;
  startupPotential: number | null;
  founder: {
    id: string;
    firstName: string;
    lastName: string;
    avatar: string | null;
    bio: string | null;
    linkedIn: string | null;
  };
  campaign: {
    id: string;
    fundingGoal: number;
    raisedAmount: number;
    supporterCount: number;
    startDate: string;
    endDate: string;
    status: string;
    rewardTiers: RewardTier[];
  } | null;
  milestones: Milestone[];
  comments: Comment[];
  _count: { comments: number; savedBy: number };
}

export default function StartupPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const justSubmitted = searchParams.get('submitted') === 'true';
  const { isAuthenticated, token, user } = useAuthStore();
  const [startup, setStartup] = useState<StartupDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'milestones' | 'comments'>('overview');

  // AI evaluation state
  const [aiEvaluating, setAiEvaluating] = useState(false);
  const [aiSummary, setAiSummary] = useState('');

  // Save state
  const [isSaved, setIsSaved] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);

  // Comment state
  const [commentText, setCommentText] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);

  useEffect(() => {
    async function fetchStartup() {
      try {
        const res = await fetch(`/api/startups/${slug}`);
        const data = await res.json();
        if (data.success) {
          setStartup(data.data);
          // If just submitted and no AI score yet, trigger AI evaluation
          if (justSubmitted && !data.data.aiScore && token) {
            setAiEvaluating(true);
            triggerAiEvaluation(data.data.id);
          }
        }
      } catch (error) {
        console.error('Error fetching startup:', error);
      } finally {
        setIsLoading(false);
      }
    }

    async function triggerAiEvaluation(startupId: string) {
      try {
        const res = await fetch('/api/ai-evaluate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ startupId }),
        });
        const data = await res.json();
        if (data.success) {
          // Scores returned directly - update startup state
          setStartup(prev => prev ? { ...prev, ...data.data } : prev);
        }
      } catch (err) {
        console.error('AI evaluation error:', err);
      } finally {
        setAiEvaluating(false);
      }
    }

    fetchStartup();

    // Check if user has saved this startup
    if (isAuthenticated && token) {
      fetch(`/api/startups/${slug}/save`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((r) => r.json())
        .then((d) => { if (d.success) setIsSaved(d.data.saved); })
        .catch(() => {});
    }
  }, [slug, justSubmitted, isAuthenticated, token]);

  const handlePostComment = async () => {
    if (!commentText.trim() || !startup) return;
    setCommentLoading(true);
    try {
      const res = await fetch(`/api/startups/${slug}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content: commentText }),
      });
      const data = await res.json();
      if (data.success) {
        setCommentText('');
        // Refresh to get updated comments
        const refreshRes = await fetch(`/api/startups/${slug}`);
        const refreshData = await refreshRes.json();
        if (refreshData.success) setStartup(refreshData.data);
      }
    } catch {
      // Silently fail
    } finally {
      setCommentLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen pt-24 pb-16 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-blue border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!startup) {
    return (
      <div className="min-h-screen pt-24 pb-16 flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold text-foreground mb-4">Startup Not Found</h1>
        <Link href="/explore">
          <Button>Browse Startups</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 pb-16">
      {/* Submission Success + AI Evaluation Banner */}
      {justSubmitted && (
        <div className="bg-gradient-to-r from-emerald-500/10 via-blue/10 to-purple/10 border-b border-emerald-500/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center gap-3">
              <CheckCircleIcon className="w-6 h-6 text-emerald-400 shrink-0" />
              <div className="flex-1">
                <p className="text-foreground font-medium">Startup submitted successfully!</p>
                {aiEvaluating ? (
                  <p className="text-sm text-muted flex items-center gap-2 mt-1">
                    <SparklesIcon className="w-4 h-4 text-purple animate-pulse" />
                    Evaluating your startup... This may take a few seconds.
                  </p>
                ) : startup?.aiScore ? (
                  <p className="text-sm text-muted mt-1">
                    Evaluation complete — scroll down to see your scores.
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-gradient-to-b from-blue/5 to-transparent border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col md:flex-row gap-8"
          >
            {/* Logo */}
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-blue to-purple flex items-center justify-center shrink-0">
              {startup.logo ? (
                <img src={startup.logo} alt={startup.title} className="w-full h-full rounded-2xl object-cover" />
              ) : (
                <span className="text-3xl font-bold text-white">{startup.title[0]}</span>
              )}
            </div>

            <div className="flex-1">
              <div className="flex flex-wrap gap-2 mb-3">
                <Badge variant="info">{startup.category}</Badge>
                <Badge variant={startup.status === 'APPROVED' ? 'success' : 'warning'}>
                  {startup.status}
                </Badge>
                <Badge variant="default">{startup.productStage}</Badge>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">{startup.title}</h1>
              <p className="text-lg text-muted mb-4">{startup.shortDescription}</p>
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted">
                <span className="flex items-center gap-1">
                  <UserIcon className="w-4 h-4" />
                  {startup.founder.firstName} {startup.founder.lastName}
                </span>
                <span className="flex items-center gap-1">
                  <MapPinIcon className="w-4 h-4" />
                  {startup.location}
                </span>
                {startup._count.savedBy > 0 && (
                  <span className="flex items-center gap-1">
                    <HeartIcon className="w-4 h-4" />
                    {startup._count.savedBy} saved
                  </span>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 shrink-0 self-start">
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  const url = window.location.href;
                  if (navigator.share) {
                    try {
                      await navigator.share({ title: startup.title, url });
                    } catch {}
                  } else {
                    await navigator.clipboard.writeText(url);
                    setShareSuccess(true);
                    setTimeout(() => setShareSuccess(false), 2000);
                  }
                }}
              >
                {shareSuccess ? (
                  <><CheckCircleIcon className="w-4 h-4 mr-1 text-green-400" /> Copied!</>
                ) : (
                  <><ShareIcon className="w-4 h-4 mr-1" /> Share</>
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={saveLoading}
                onClick={async () => {
                  if (!isAuthenticated) {
                    router.push('/login');
                    return;
                  }
                  setSaveLoading(true);
                  try {
                    const res = await fetch(`/api/startups/${slug}/save`, {
                      method: 'POST',
                      headers: { Authorization: `Bearer ${token}` },
                    });
                    const data = await res.json();
                    if (data.success) {
                      setIsSaved(data.data.saved);
                      if (startup) {
                        setStartup({
                          ...startup,
                          _count: {
                            ...startup._count,
                            savedBy: startup._count.savedBy + (data.data.saved ? 1 : -1),
                          },
                        });
                      }
                    }
                  } catch {}
                  setSaveLoading(false);
                }}
              >
                {isSaved ? (
                  <><HeartSolidIcon className="w-4 h-4 mr-1 text-red-500" /> Saved</>
                ) : (
                  <><HeartIcon className="w-4 h-4 mr-1" /> Save</>
                )}
              </Button>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Tabs */}
            <div className="flex border-b border-border">
              {(['overview', 'milestones', 'comments'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab
                      ? 'border-blue text-blue'
                      : 'border-transparent text-muted hover:text-foreground'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  {tab === 'comments' && ` (${startup._count.comments})`}
                </button>
              ))}
            </div>

            {activeTab === 'overview' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                {/* Problem */}
                <Card className="p-6">
                  <h2 className="text-xl font-semibold text-foreground mb-3">The Problem</h2>
                  <p className="text-muted leading-relaxed">{startup.problemDescription}</p>
                  <div className="mt-4">
                    <h3 className="text-sm font-medium text-foreground mb-1">Target Audience</h3>
                    <p className="text-sm text-muted">{startup.targetAudience}</p>
                  </div>
                </Card>

                {/* Solution */}
                <Card className="p-6">
                  <h2 className="text-xl font-semibold text-foreground mb-3">Our Solution</h2>
                  <p className="text-muted leading-relaxed">{startup.solutionExplanation}</p>
                </Card>

                {/* Innovation */}
                <Card className="p-6">
                  <h2 className="text-xl font-semibold text-foreground mb-3">What Makes Us Unique</h2>
                  <p className="text-muted leading-relaxed">{startup.innovationUniqueness}</p>
                </Card>

                {/* Pitch Deck & Screenshots */}
                {((startup.pitchDeck && user?.role === 'ADMIN') || startup.screenshots.length > 0) && (
                  <Card className="p-6">
                    <h2 className="text-xl font-semibold text-foreground mb-4">Project Files</h2>
                    {startup.pitchDeck && user?.role === 'ADMIN' && (
                      <div className="mb-4">
                        <h3 className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                          <DocumentTextIcon className="w-5 h-5 text-blue" /> Pitch Deck
                        </h3>
                        <a
                          href={startup.pitchDeck}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue/10 text-blue hover:bg-blue/20 transition-colors text-sm font-medium"
                        >
                          <DocumentTextIcon className="w-4 h-4" /> View Pitch Deck
                        </a>
                      </div>
                    )}
                    {startup.screenshots.length > 0 && (
                      <div>
                        <h3 className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                          <PhotoIcon className="w-5 h-5 text-purple" /> Screenshots
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {startup.screenshots.map((url, i) => (
                            <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="block rounded-lg overflow-hidden border border-border hover:border-blue transition-colors">
                              <img src={url} alt={`Screenshot ${i + 1}`} className="w-full h-40 object-cover" />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </Card>
                )}

                {/* Manual Evaluation Score */}
                {aiEvaluating && !startup.aiScore && (
                  <Card className="p-6 bg-gradient-to-br from-blue/5 to-purple/5 border-blue/20">
                    <div className="flex items-center gap-3">
                      <SparklesIcon className="w-6 h-6 text-purple animate-pulse" />
                      <div>
                        <h2 className="text-xl font-semibold text-foreground">Manual Evaluation in Progress</h2>
                        <p className="text-sm text-muted mt-1">Our team is evaluating your startup idea across innovation, market potential, execution risk, and overall viability...</p>
                      </div>
                    </div>
                    <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                      {['Innovation Score', 'Market Potential', 'Execution Risk', 'Startup Score'].map((label) => (
                        <div key={label} className="text-center">
                          <div className="h-8 w-16 mx-auto bg-border/50 rounded animate-pulse" />
                          <p className="text-xs text-muted mt-2">{label}</p>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}
                {startup.aiScore && (
                  <Card className="p-6 bg-gradient-to-br from-blue/5 to-purple/5">
                    <div className="flex items-center gap-2 mb-4">
                      <SparklesIcon className="w-5 h-5 text-purple" />
                      <h2 className="text-xl font-semibold text-foreground">Manual Evaluation</h2>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <p className="text-3xl font-bold gradient-text">{startup.aiScore}</p>
                        <p className="text-xs text-muted mt-1">Innovation Score</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-semibold text-foreground">{startup.marketPotential || 'N/A'}</p>
                        <p className="text-xs text-muted mt-1">Market Potential</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-semibold text-foreground">{startup.executionRisk || 'N/A'}</p>
                        <p className="text-xs text-muted mt-1">Execution Risk</p>
                      </div>
                      <div className="text-center">
                        <p className="text-3xl font-bold gradient-text">{startup.startupPotential || 'N/A'}</p>
                        <p className="text-xs text-muted mt-1">Startup Score</p>
                      </div>
                    </div>
                  </Card>
                )}

                {/* Founder */}
                <Card className="p-6">
                  <h2 className="text-xl font-semibold text-foreground mb-4">Meet the Founder</h2>
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue to-purple flex items-center justify-center text-white text-xl font-bold shrink-0">
                      {startup.founder.avatar ? (
                        <img src={startup.founder.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                      ) : (
                        startup.founder.firstName[0]
                      )}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">
                        {startup.founder.firstName} {startup.founder.lastName}
                      </h3>
                      {startup.founder.bio && (
                        <p className="text-sm text-muted mt-1">{startup.founder.bio}</p>
                      )}
                      {startup.founder.linkedIn && (
                        <a
                          href={startup.founder.linkedIn}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-sm text-blue hover:text-blue/80 mt-2"
                        >
                          <LinkIcon className="w-4 h-4" /> LinkedIn Profile
                        </a>
                      )}
                    </div>
                  </div>
                </Card>
              </motion.div>
            )}

            {activeTab === 'milestones' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                {startup.milestones.map((milestone) => {
                  const isOwner = user?.id === startup.founder.id || user?.role === 'ADMIN';
                  return (
                  <Card key={milestone.id} className="p-5">
                    <div className="flex items-start gap-4">
                      <div className="shrink-0 mt-0.5">
                        {milestone.status === 'COMPLETED' ? (
                          <CheckCircleIcon className="w-6 h-6 text-emerald-400" />
                        ) : milestone.status === 'IN_PROGRESS' ? (
                          <ClockIcon className="w-6 h-6 text-orange" />
                        ) : (
                          <ExclamationCircleIcon className="w-6 h-6 text-muted" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium text-foreground">{milestone.title}</h3>
                          {isOwner ? (
                            <select
                              value={milestone.status}
                              onChange={async (e) => {
                                const newStatus = e.target.value;
                                try {
                                  const res = await fetch(`/api/milestones/${milestone.id}`, {
                                    method: 'PATCH',
                                    headers: {
                                      'Content-Type': 'application/json',
                                      Authorization: `Bearer ${token}`,
                                    },
                                    body: JSON.stringify({ status: newStatus }),
                                  });
                                  if (res.ok) {
                                    setStartup((prev) => prev ? {
                                      ...prev,
                                      milestones: prev.milestones.map((m) =>
                                        m.id === milestone.id ? { ...m, status: newStatus, completedDate: newStatus === 'COMPLETED' ? new Date().toISOString() : null } : m
                                      ),
                                    } : prev);
                                  }
                                } catch {}
                              }}
                              className="text-xs font-medium px-3 py-1.5 rounded-full border border-border bg-card text-foreground cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue"
                            >
                              <option value="PENDING">PENDING</option>
                              <option value="IN_PROGRESS">IN PROGRESS</option>
                              <option value="COMPLETED">COMPLETED</option>
                            </select>
                          ) : (
                          <Badge
                            variant={
                              milestone.status === 'COMPLETED'
                                ? 'success'
                                : milestone.status === 'IN_PROGRESS'
                                ? 'warning'
                                : 'default'
                            }
                          >
                            {milestone.status.replace('_', ' ')}
                          </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted mt-1">{milestone.description}</p>
                      </div>
                    </div>
                  </Card>
                  );
                })}
              </motion.div>
            )}

            {activeTab === 'comments' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                {isAuthenticated ? (
                  <Card className="p-5">
                    <textarea
                      placeholder="Share your thoughts..."
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      className="w-full bg-input border border-border rounded-xl px-4 py-3 text-foreground placeholder-muted text-sm focus:outline-none focus:border-blue resize-none"
                      rows={3}
                    />
                    <div className="flex justify-end mt-3">
                      <Button size="sm" onClick={handlePostComment} disabled={commentLoading || !commentText.trim()}>
                        {commentLoading ? 'Posting...' : 'Post Comment'}
                      </Button>
                    </div>
                  </Card>
                ) : (
                  <Card className="p-5 text-center">
                    <p className="text-muted mb-3">Sign in to join the discussion</p>
                    <Link href="/login">
                      <Button size="sm">Sign In</Button>
                    </Link>
                  </Card>
                )}

                {startup.comments.length === 0 ? (
                  <div className="text-center py-12">
                    <ChatBubbleLeftIcon className="w-12 h-12 text-muted mx-auto mb-3" />
                    <p className="text-muted">No comments yet. Be the first to share your thoughts!</p>
                  </div>
                ) : (
                  startup.comments.map((comment) => (
                    <Card key={comment.id} className="p-5">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue to-purple flex items-center justify-center text-white text-sm font-bold shrink-0">
                          {comment.user.firstName[0]}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-foreground text-sm">
                              {comment.user.firstName} {comment.user.lastName}
                            </span>
                            <span className="text-xs text-muted">
                              {new Date(comment.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-sm text-muted">{comment.content}</p>
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </motion.div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
          </div>
        </div>
      </div>
    </div>
  );
}
