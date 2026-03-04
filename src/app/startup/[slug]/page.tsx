'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button, Card, ProgressBar, Badge } from '@/components/ui';
import { formatCurrency, calculateProgress, calculateDaysLeft } from '@/lib/utils';
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
} from '@heroicons/react/24/outline';

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
  const { isAuthenticated } = useAuthStore();
  const [startup, setStartup] = useState<StartupDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'milestones' | 'comments'>('overview');

  useEffect(() => {
    async function fetchStartup() {
      try {
        const res = await fetch(`/api/startups/${slug}`);
        const data = await res.json();
        if (data.success) {
          setStartup(data.data);
        }
      } catch (error) {
        console.error('Error fetching startup:', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchStartup();
  }, [slug]);

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

  const progress = startup.campaign
    ? calculateProgress(startup.campaign.raisedAmount, startup.campaign.fundingGoal)
    : 0;
  const daysLeft = startup.campaign ? calculateDaysLeft(new Date(startup.campaign.endDate)) : 0;

  return (
    <div className="min-h-screen pt-20 pb-16">
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
              <Button variant="outline" size="sm">
                <ShareIcon className="w-4 h-4 mr-1" /> Share
              </Button>
              <Button variant="outline" size="sm">
                <HeartIcon className="w-4 h-4 mr-1" /> Save
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

                {/* AI Score */}
                {startup.aiScore && (
                  <Card className="p-6 bg-gradient-to-br from-blue/5 to-purple/5">
                    <h2 className="text-xl font-semibold text-foreground mb-4">AI Evaluation</h2>
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
                {startup.milestones.map((milestone, index) => (
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
                        </div>
                        <p className="text-sm text-muted mt-1">{milestone.description}</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </motion.div>
            )}

            {activeTab === 'comments' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                {isAuthenticated ? (
                  <Card className="p-5">
                    <textarea
                      placeholder="Share your thoughts..."
                      className="w-full bg-input border border-border rounded-xl px-4 py-3 text-foreground placeholder-muted text-sm focus:outline-none focus:border-blue resize-none"
                      rows={3}
                    />
                    <div className="flex justify-end mt-3">
                      <Button size="sm">Post Comment</Button>
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

          {/* Sidebar — Funding */}
          <div className="space-y-6">
            {startup.campaign && (
              <Card className="p-6 sticky top-24">
                <div className="mb-6">
                  <p className="text-3xl font-bold text-foreground">
                    {formatCurrency(startup.campaign.raisedAmount)}
                  </p>
                  <p className="text-sm text-muted">
                    raised of {formatCurrency(startup.campaign.fundingGoal)} goal
                  </p>
                  <ProgressBar progress={progress} className="mt-4" />
                </div>

                <div className="grid grid-cols-3 gap-4 mb-6 text-center">
                  <div>
                    <p className="text-xl font-bold text-foreground">{startup.campaign.supporterCount}</p>
                    <p className="text-xs text-muted">Supporters</p>
                  </div>
                  <div>
                    <p className="text-xl font-bold text-foreground">{daysLeft}</p>
                    <p className="text-xs text-muted">Days Left</p>
                  </div>
                  <div>
                    <p className="text-xl font-bold gradient-text">{progress}%</p>
                    <p className="text-xs text-muted">Funded</p>
                  </div>
                </div>

                {/* Reward Tiers */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-foreground">Support This Startup</h3>
                  {startup.campaign.rewardTiers.map((tier) => (
                    <div
                      key={tier.id}
                      className="border border-border rounded-xl p-4 hover:border-blue/30 transition-colors cursor-pointer group"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-foreground">{tier.name}</span>
                        <span className="text-blue font-bold">{formatCurrency(tier.amount)}</span>
                      </div>
                      <p className="text-xs text-muted mb-3">{tier.description}</p>
                      {tier.maxClaims && (
                        <p className="text-xs text-muted">
                          {tier.maxClaims - tier.claimedCount} of {tier.maxClaims} remaining
                        </p>
                      )}
                      <Button size="sm" className="w-full mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        Select This Tier
                      </Button>
                    </div>
                  ))}
                </div>

                <Button className="w-full mt-4" size="lg">
                  Back This Startup
                </Button>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
