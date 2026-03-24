'use client';

import { motion } from 'framer-motion';
import { Card } from '@/components/ui';

const team = [
  { name: 'Vision Team', role: 'Strategy & Direction', icon: '🎯' },
  { name: 'Engineering Team', role: 'Platform Development', icon: '⚙️' },
  { name: 'Community Team', role: 'Innovator Relations', icon: '🤝' },
  { name: 'Operations Team', role: 'Growth & Partnerships', icon: '📈' },
];

const values = [
  { title: 'Innovation First', description: 'We believe every idea deserves a chance to transform industries and improve lives.', icon: '💡' },
  { title: 'Transparency', description: 'Open processes, clear milestones, and honest communication between founders and the community.', icon: '🔍' },
  { title: 'Community Driven', description: 'The community helps shape which innovations gain visibility and momentum.', icon: '🌍' },
  { title: 'Security & Trust', description: 'Bank-grade security for payments and data protection for all platform users.', icon: '🛡️' },
];

const milestones = [
  { year: '2026', event: 'Vishvakarma Hub launches as India\'s premier startup innovation platform' },
  { year: '2026', event: 'First 100 startups onboarded across 40+ categories' },
  { year: '2026', event: 'Platform community crosses 10,000 active members' },
  { year: '2027', event: 'Expansion to international markets planned' },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            About <span className="gradient-text">Vishvakarma Hub</span>
          </h1>
          <p className="text-lg text-muted max-w-3xl mx-auto">
            Named after Vishvakarma — the divine architect and craftsman of the gods — we are building
            India&apos;s most powerful platform to connect innovators with the public who believe in them.
          </p>
        </motion.div>

        {/* Mission */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <Card className="p-8 md:p-12 text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">Our Mission</h2>
            <p className="text-lg text-muted max-w-3xl mx-auto leading-relaxed">
              To democratize innovation by creating a transparent, secure platform where anyone with a
              groundbreaking idea can launch a startup, and anyone who believes in that vision can help it grow.
              <span className="block mt-4 text-blue font-semibold text-xl">From Idea to Innovation.</span>
            </p>
          </Card>
        </motion.div>

        {/* Values */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <h2 className="text-3xl font-bold text-foreground text-center mb-8">Our Values</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {values.map((value, i) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="p-6 h-full">
                  <div className="text-3xl mb-3">{value.icon}</div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">{value.title}</h3>
                  <p className="text-muted">{value.description}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Team */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <h2 className="text-3xl font-bold text-foreground text-center mb-8">Our Team</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {team.map((member, i) => (
              <motion.div
                key={member.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="p-6 text-center">
                  <div className="text-4xl mb-3">{member.icon}</div>
                  <h3 className="text-lg font-semibold text-foreground">{member.name}</h3>
                  <p className="text-sm text-muted">{member.role}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Timeline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl font-bold text-foreground text-center mb-8">Our Journey</h2>
          <div className="max-w-2xl mx-auto space-y-6">
            {milestones.map((m, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="flex gap-4"
              >
                <div className="flex-shrink-0 w-16 h-16 rounded-full bg-blue/10 flex items-center justify-center">
                  <span className="text-blue font-bold text-sm">{m.year}</span>
                </div>
                <Card className="flex-1 p-4">
                  <p className="text-foreground">{m.event}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
