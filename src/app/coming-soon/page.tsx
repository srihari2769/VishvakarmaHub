'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  RocketLaunchIcon,
  TrophyIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';

export default function ComingSoonPage() {
  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-purple/5 via-blue/5 to-transparent" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue/10 rounded-full blur-3xl" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-500/5 rounded-full blur-3xl" />

      <div className="relative z-10 max-w-3xl mx-auto px-4 text-center py-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          {/* Logo */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', duration: 0.6 }}
            className="inline-flex items-center gap-3 mb-8"
          >
            <div className="w-14 h-14 bg-gradient-to-br from-blue to-purple rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-purple/20">
              V
            </div>
            <div className="text-left">
              <span className="text-2xl font-bold text-foreground">
                Vishvakarma <span className="bg-gradient-to-r from-blue to-purple bg-clip-text text-transparent">Hub</span>
              </span>
              <p className="text-xs text-muted">From Idea to Innovation</p>
            </div>
          </motion.div>

          {/* Main heading */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
            Something Big is
            <br />
            <span className="bg-gradient-to-r from-purple via-blue to-cyan-400 bg-clip-text text-transparent">
              Coming Soon
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-muted max-w-xl mx-auto mb-10">
            We&apos;re building a platform where innovators launch startups and the public supports them.
            Stay tuned for our grand launch!
          </p>

          {/* Competition Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Link href="/competition">
              <div className="inline-block group cursor-pointer">
                <div className="bg-card border border-purple/20 rounded-2xl p-8 max-w-md mx-auto hover:border-purple/40 transition-all hover:shadow-lg hover:shadow-purple/10">
                  <div className="flex items-center justify-center gap-2 mb-4">
                    <TrophyIcon className="w-8 h-8 text-purple" />
                    <SparklesIcon className="w-5 h-5 text-yellow-400" />
                  </div>
                  <h2 className="text-xl font-bold text-foreground mb-2">
                    Vishvakarma Innovation Challenge 2026
                  </h2>
                  <p className="text-sm text-muted mb-4">
                    Our national startup competition is live! Register your startup and compete to be among the top innovations.
                  </p>
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple/10 text-purple text-sm font-semibold group-hover:bg-purple/20 transition-colors">
                    <RocketLaunchIcon className="w-4 h-4" />
                    View Competition
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>

          {/* Animated dots */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="flex items-center justify-center gap-2 mt-12"
          >
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-2.5 h-2.5 rounded-full bg-purple"
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.3 }}
              />
            ))}
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="text-xs text-muted/60 mt-16"
          >
            An initiative by <span className="text-foreground/70 font-medium">Trinetrashakti Innovations Private Limited</span>, a Startup India recognized company.
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
}
