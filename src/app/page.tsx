'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import Button from '@/components/ui/Button';
import { Card } from '@/components/ui';
import StartupCard from '@/components/startup/StartupCard';
import { CATEGORIES } from '@/lib/utils';
import {
  RocketLaunchIcon,
  LightBulbIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  ShieldCheckIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 },
};

const staggerContainer = {
  animate: { transition: { staggerChildren: 0.1 } },
};

const stats = [
  { label: 'Startups Launched', value: '500+', icon: RocketLaunchIcon },
  { label: 'Ideas Submitted', value: '2,000+', icon: LightBulbIcon },
  { label: 'Active Supporters', value: '15,000+', icon: UserGroupIcon },
  { label: 'Funds Raised', value: '₹10Cr+', icon: CurrencyDollarIcon },
];

const howItWorks = [
  {
    step: '01',
    title: 'Submit Your Idea',
    description: 'Share your innovative startup idea with our community. Fill in the details about your problem, solution, and vision.',
    icon: LightBulbIcon,
  },
  {
    step: '02',
    title: 'AI Evaluation',
    description: 'Our AI system analyzes market potential, competition, feasibility, and innovation to give your idea a score.',
    icon: ChartBarIcon,
  },
  {
    step: '03',
    title: 'Launch Campaign',
    description: 'Create a funding campaign with reward tiers. Set your goal and timeline to bring your vision to life.',
    icon: RocketLaunchIcon,
  },
  {
    step: '04',
    title: 'Get Funded',
    description: 'The public supports your startup through contributions. Track progress, hit milestones, and grow.',
    icon: CurrencyDollarIcon,
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden animated-gradient grid-bg">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue/5 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple/5 rounded-full blur-3xl" />
          <div className="absolute top-1/3 right-1/3 w-64 h-64 bg-cyan/5 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 text-center">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <div className="inline-flex items-center px-4 py-1.5 rounded-full border border-blue/30 bg-blue/5 mb-8">
              <span className="text-xs font-medium text-blue">
                🚀 India&apos;s Premier Innovation Platform
              </span>
            </div>

            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-6">
              <span className="text-foreground">From Idea to</span>
              <br />
              <span className="gradient-text">Innovation.</span>
            </h1>

            <p className="text-lg md:text-xl text-muted max-w-2xl mx-auto mb-10 leading-relaxed">
              A platform where innovators submit ideas, teams form, the public supports
              projects, and startups are launched into the world.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/submit-idea">
                <Button size="lg" className="min-w-[200px]">
                  Submit Your Idea
                  <ArrowRightIcon className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Link href="/explore">
                <Button variant="outline" size="lg" className="min-w-[200px]">
                  Explore Startups
                </Button>
              </Link>
            </div>
          </motion.div>

          <motion.div
            className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-6"
            variants={staggerContainer}
            initial="initial"
            animate="animate"
          >
            {stats.map((stat) => (
              <motion.div
                key={stat.label}
                variants={fadeInUp}
                className="bg-card/50 backdrop-blur-sm border border-border rounded-2xl p-6 text-center"
              >
                <stat.icon className="w-8 h-8 text-blue mx-auto mb-3" />
                <p className="text-2xl md:text-3xl font-bold gradient-text">{stat.value}</p>
                <p className="text-sm text-muted mt-1">{stat.label}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
              How It <span className="gradient-text">Works</span>
            </h2>
            <p className="text-lg text-muted max-w-2xl mx-auto">
              From a spark of an idea to a funded startup — here&apos;s your journey on Vishvakarma Hub.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {howItWorks.map((item, index) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.15 }}
              >
                <Card className="p-6 h-full relative group" hover glow>
                  <div className="absolute -top-3 -right-3 w-12 h-12 rounded-xl bg-gradient-to-br from-blue to-purple flex items-center justify-center text-white text-sm font-bold opacity-80 group-hover:opacity-100 transition-opacity">
                    {item.step}
                  </div>
                  <item.icon className="w-10 h-10 text-cyan mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">{item.title}</h3>
                  <p className="text-sm text-muted leading-relaxed">{item.description}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-24 bg-card/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
              Innovation <span className="gradient-text">Categories</span>
            </h2>
            <p className="text-lg text-muted max-w-2xl mx-auto">
              Explore startups across diverse sectors transforming the future.
            </p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {CATEGORIES.map((category, index) => (
              <motion.div
                key={category.slug}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
              >
                <Link href={`/explore?category=${category.slug}`}>
                  <Card hover glow className="p-6 text-center group">
                    <span className="text-3xl mb-3 block group-hover:scale-110 transition-transform">
                      {category.icon}
                    </span>
                    <h3 className="text-sm font-medium text-foreground">{category.name}</h3>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Startups */}
      <section className="py-24 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="flex items-center justify-between mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div>
              <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-2">
                Featured <span className="gradient-text">Startups</span>
              </h2>
              <p className="text-lg text-muted">Discover the most promising innovations on our platform.</p>
            </div>
            <Link href="/explore">
              <Button variant="outline">
                View All
                <ArrowRightIcon className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </motion.div>

          <FeaturedStartups />
        </div>
      </section>

      {/* Community Impact */}
      <section className="py-24 bg-card/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
              Community <span className="gradient-text">Impact</span>
            </h2>
            <p className="text-lg text-muted max-w-2xl mx-auto">
              Together, we&apos;re building the future of Indian innovation.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: ShieldCheckIcon,
                title: 'Trusted Platform',
                description: 'AI-powered evaluation, document verification, and secure payments ensure trust and transparency.',
              },
              {
                icon: UserGroupIcon,
                title: 'Vibrant Community',
                description: 'Connect with innovators, investors, mentors, and supporters building the next big thing.',
              },
              {
                icon: RocketLaunchIcon,
                title: 'Launch & Scale',
                description: 'From idea submission to funded startup — we provide the tools and community to help you scale.',
              },
            ].map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.15 }}
              >
                <Card className="p-8 text-center h-full" hover glow>
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue/20 to-purple/20 flex items-center justify-center mx-auto mb-5">
                    <feature.icon className="w-7 h-7 text-cyan" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-3">{feature.title}</h3>
                  <p className="text-sm text-muted leading-relaxed">{feature.description}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-background relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-blue/10 to-purple/10 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-6">
              Ready to Build the <span className="gradient-text">Future?</span>
            </h2>
            <p className="text-lg text-muted max-w-2xl mx-auto mb-10">
              Whether you&apos;re an innovator with a breakthrough idea or a supporter looking to back the next big thing — Vishvakarma Hub is where it begins.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/signup">
                <Button size="lg" className="min-w-[200px]">
                  Join Now — It&apos;s Free
                </Button>
              </Link>
              <Link href="/explore">
                <Button variant="outline" size="lg" className="min-w-[200px]">
                  Browse Innovations
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-16 bg-card border-t border-border">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h3 className="text-xl font-semibold text-foreground mb-2">Stay in the Loop</h3>
          <p className="text-sm text-muted mb-6">Get updates on trending startups, new innovations, and platform news.</p>
          <form className="flex flex-col sm:flex-row gap-3">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-4 py-2.5 bg-input border border-border rounded-xl text-foreground placeholder-muted text-sm focus:outline-none focus:border-blue"
            />
            <Button type="submit" className="whitespace-nowrap">
              Subscribe
            </Button>
          </form>
        </div>
      </section>
    </div>
  );
}

function FeaturedStartups() {
  const [startups, setStartups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/startups?limit=6')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setStartups(data.data.startups || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <div className="h-48 bg-border/30" />
            <div className="p-5 space-y-3">
              <div className="h-5 bg-border/30 rounded w-3/4" />
              <div className="h-4 bg-border/30 rounded w-full" />
              <div className="h-4 bg-border/30 rounded w-1/2" />
              <div className="h-2.5 bg-border/30 rounded-full w-full" />
              <div className="flex justify-between">
                <div className="h-3 bg-border/30 rounded w-20" />
                <div className="h-3 bg-border/30 rounded w-16" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (startups.length === 0) {
    return (
      <div className="text-center py-12 bg-card/50 rounded-2xl border border-border/50">
        <RocketLaunchIcon className="w-12 h-12 text-muted mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-foreground mb-1">No startups yet</h3>
        <p className="text-muted text-sm mb-4">Be the first to launch your innovation on our platform.</p>
        <Link href="/submit-idea">
          <Button>Submit Your Idea</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {startups.map((startup: any, i: number) => (
        <motion.div
          key={startup.id}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.1 }}
        >
          <StartupCard startup={startup} />
        </motion.div>
      ))}
    </div>
  );
}
