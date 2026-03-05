'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Button } from '@/components/ui';
import {
  LightBulbIcon,
  CpuChipIcon,
  RocketLaunchIcon,
  CurrencyRupeeIcon,
  CheckBadgeIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';

const STEPS = [
  {
    icon: LightBulbIcon,
    title: 'Submit Your Idea',
    description:
      'Share your innovative startup idea with the community. Fill out our guided submission form covering your problem statement, solution, target audience, and funding goals.',
    details: [
      'Describe the problem you\'re solving',
      'Explain your innovative solution',
      'Define your target market',
      'Set your funding campaign',
    ],
    color: 'from-blue to-cyan',
  },
  {
    icon: CpuChipIcon,
    title: 'Manual Evaluation',
    description:
      'Our expert team evaluates your idea across innovation score, market potential, execution risk, and startup potential to give supporters confidence in backing your project.',
    details: [
      'Innovation scoring review',
      'Market potential assessment',
      'Execution risk analysis',
      'Competitive landscape evaluation',
    ],
    color: 'from-purple to-pink-500',
  },
  {
    icon: CheckBadgeIcon,
    title: 'Community Review',
    description:
      'Your startup is reviewed by our admin team and the community. Approved campaigns go live where supporters can discover and evaluate your idea.',
    details: [
      'Admin moderation and approval',
      'Community feedback and comments',
      'Transparent review process',
      'Quality assurance standards',
    ],
    color: 'from-emerald-500 to-teal-500',
  },
  {
    icon: RocketLaunchIcon,
    title: 'Launch Campaign',
    description:
      'Once approved, your startup campaign goes live. Set reward tiers, share updates, and engage with your supporters as you build towards your funding goal.',
    details: [
      'Customizable reward tiers',
      'Campaign update posts',
      'Supporter engagement tools',
      'Milestone tracking',
    ],
    color: 'from-orange to-amber-500',
  },
  {
    icon: CurrencyRupeeIcon,
    title: 'Receive Funding',
    description:
      'Supporters contribute through secure payment gateways. Track your funding progress in real-time and celebrate milestones with your community.',
    details: [
      'Razorpay & Stripe integration',
      'Real-time funding tracker',
      'UPI, cards, and net banking',
      'Transparent fund disbursement',
    ],
    color: 'from-blue to-purple',
  },
  {
    icon: ChartBarIcon,
    title: 'Grow & Scale',
    description:
      'Use your funding to build and scale your startup. Share progress updates, hit milestones, and keep your supporters engaged as you grow from idea to innovation.',
    details: [
      'Milestone-based fund release',
      'Progress reporting tools',
      'Community of supporters',
      'Mentorship opportunities',
    ],
    color: 'from-cyan to-blue',
  },
];

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            How <span className="gradient-text">Vishvakarma Hub</span> Works
          </h1>
          <p className="text-lg text-muted max-w-2xl mx-auto">
            From submitting your idea to receiving funding — here&apos;s how our platform turns your innovation into reality.
          </p>
        </motion.div>

        {/* Steps */}
        <div className="space-y-12">
          {STEPS.map((step, index) => {
            const Icon = step.icon;
            const isEven = index % 2 === 0;
            return (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, x: isEven ? -30 : 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className={`flex flex-col md:flex-row ${
                  isEven ? '' : 'md:flex-row-reverse'
                } items-center gap-8`}
              >
                {/* Number + Icon */}
                <div className="shrink-0 text-center">
                  <div
                    className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center mx-auto mb-3`}
                  >
                    <Icon className="w-10 h-10 text-white" />
                  </div>
                  <span className="text-sm font-bold text-muted">Step {index + 1}</span>
                </div>

                {/* Content */}
                <div className="flex-1 bg-card border border-border rounded-2xl p-6 md:p-8">
                  <h2 className="text-xl font-bold text-foreground mb-3">{step.title}</h2>
                  <p className="text-muted mb-4">{step.description}</p>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {step.details.map((detail) => (
                      <li key={detail} className="flex items-center gap-2 text-sm text-muted">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue shrink-0" />
                        {detail}
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mt-16 bg-gradient-to-br from-blue/10 to-purple/10 border border-blue/20 rounded-2xl p-10"
        >
          <h2 className="text-2xl font-bold text-foreground mb-3">Ready to Get Started?</h2>
          <p className="text-muted mb-6">Join thousands of innovators building the future on Vishvakarma Hub.</p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/submit-idea">
              <Button size="lg">Submit Your Idea</Button>
            </Link>
            <Link href="/explore">
              <Button variant="outline" size="lg">
                Explore Startups
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
