'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Card, Button } from '@/components/ui';
import {
  VideoCameraIcon,
  ShareIcon,
  UserGroupIcon,
  CheckBadgeIcon,
  GiftIcon,
  SparklesIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  StarIcon,
  RocketLaunchIcon,
} from '@heroicons/react/24/outline';

const STEPS = [
  {
    icon: VideoCameraIcon,
    title: 'Create a Video',
    description: 'Make a creative video about the Vishvakarma Innovation Challenge 2026. Show your creativity and passion for innovation!',
    color: 'text-purple',
    bg: 'bg-purple/10',
    border: 'border-purple/20',
  },
  {
    icon: ShareIcon,
    title: 'Post on Social Media',
    description: 'Share your video on Instagram, YouTube, LinkedIn, Twitter or Facebook. Make it public so we can verify it.',
    color: 'text-blue',
    bg: 'bg-blue/10',
    border: 'border-blue/20',
  },
  {
    icon: UserGroupIcon,
    title: 'Refer 5 Members',
    description: 'Share your unique referral link. At least 5 people must register and complete payment (Student, Professional, or Visitor Entry).',
    color: 'text-green-400',
    bg: 'bg-green-400/10',
    border: 'border-green-400/20',
  },
  {
    icon: CheckBadgeIcon,
    title: 'Admin Approval',
    description: 'Our team will review your video and verify your referrals. Once approved, you get free entry with all benefits!',
    color: 'text-amber-400',
    bg: 'bg-amber-400/10',
    border: 'border-amber-400/20',
  },
];

const BENEFITS = [
  'Full access to the competition event',
  'Networking with founders & investors',
  'Workshop & seminar access',
  'Certificate of participation',
  'Startup expo access',
  'Mentorship sessions',
];

export default function FreeEntryPage() {
  return (
    <div className="min-h-screen bg-background pt-24 pb-16 px-4">
      <div className="max-w-4xl mx-auto">
        <Link href="/competition" className="inline-flex items-center gap-2 text-sm text-muted hover:text-foreground mb-6 transition-colors">
          <ArrowLeftIcon className="w-4 h-4" />
          Back to Competition
        </Link>

        {/* Hero */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-green-400/10 border border-green-400/20 text-green-400 text-sm font-medium mb-4">
            <GiftIcon className="w-4 h-4" />
            Free Entry Program
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Get <span className="bg-gradient-to-r from-green-400 to-emerald-400 text-transparent bg-clip-text">Free Entry</span> to the Competition
          </h1>
          <p className="text-lg text-muted max-w-2xl mx-auto">
            Create a video, share it on social media, refer 5 paid members, and get free access to India&apos;s Biggest Startup Competition!
          </p>
        </motion.div>

        {/* How it Works */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <h2 className="text-2xl font-bold text-foreground text-center mb-8">How It Works</h2>
          <div className="grid md:grid-cols-2 gap-6 mb-12">
            {STEPS.map((step, i) => (
              <Card key={step.title} className={`p-6 ${step.border} hover:scale-[1.02] transition-transform`}>
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl ${step.bg} flex items-center justify-center flex-shrink-0`}>
                    <step.icon className={`w-6 h-6 ${step.color}`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-bold ${step.color}`}>STEP {i + 1}</span>
                    </div>
                    <h3 className="text-lg font-bold text-foreground mb-1">{step.title}</h3>
                    <p className="text-sm text-muted">{step.description}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </motion.div>

        {/* Benefits */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="p-8 mb-12 border-green-400/20 bg-gradient-to-br from-green-400/5 to-emerald-400/5">
            <div className="text-center mb-6">
              <SparklesIcon className="w-8 h-8 text-green-400 mx-auto mb-2" />
              <h2 className="text-2xl font-bold text-foreground">What You Get</h2>
              <p className="text-muted text-sm mt-1">All these benefits absolutely free!</p>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              {BENEFITS.map((b) => (
                <div key={b} className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border">
                  <StarIcon className="w-5 h-5 text-green-400 flex-shrink-0" />
                  <span className="text-sm text-foreground">{b}</span>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* Important Rules */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="p-6 mb-12 border-amber-400/20">
            <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
              <RocketLaunchIcon className="w-5 h-5 text-amber-400" />
              Important Guidelines
            </h3>
            <ul className="space-y-2 text-sm text-muted">
              <li className="flex items-start gap-2">
                <span className="text-amber-400 mt-0.5">•</span>
                Video must be creative and about the Vishvakarma Innovation Challenge 2026.
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-400 mt-0.5">•</span>
                Video must be posted on a public social media account (Instagram, YouTube, LinkedIn, Twitter, or Facebook).
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-400 mt-0.5">•</span>
                You must refer at least 5 members who complete registration AND payment (Student, Professional, or Visitor Entry).
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-400 mt-0.5">•</span>
                Admin will review your video and verify referrals before granting free entry.
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-400 mt-0.5">•</span>
                Free entry cannot be transferred to another person.
              </li>
            </ul>
          </Card>
        </motion.div>

        {/* CTA */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="text-center">
          <Card className="p-8 bg-gradient-to-r from-purple/10 via-blue/10 to-green-400/10 border-purple/20">
            <h2 className="text-2xl font-bold text-foreground mb-2">Ready to Get Started?</h2>
            <p className="text-muted mb-6">Register now and start your journey to free entry!</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/competition/free-entry/register">
                <Button size="lg" className="w-full sm:w-auto">
                  Register for Free Entry
                  <ArrowRightIcon className="w-4 h-4 ml-2 inline" />
                </Button>
              </Link>
              <Link href="/competition/free-entry/login">
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  Already Registered? Login
                </Button>
              </Link>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
