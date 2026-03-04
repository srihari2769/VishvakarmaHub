'use client';

import { motion } from 'framer-motion';
import { Card, Button } from '@/components/ui';

const openings = [
  {
    title: 'Full-Stack Developer',
    department: 'Engineering',
    location: 'Hyderabad / Remote',
    type: 'Full-time',
    description: 'Build and scale our platform using Next.js, Node.js, and PostgreSQL. Work on real-time funding systems and startup management tools.',
  },
  {
    title: 'UI/UX Designer',
    department: 'Design',
    location: 'Hyderabad / Remote',
    type: 'Full-time',
    description: 'Design intuitive user experiences for innovators, founders, and supporters. Create design systems and prototypes for new features.',
  },
  {
    title: 'Community Manager',
    department: 'Growth',
    location: 'Remote',
    type: 'Full-time',
    description: 'Build and nurture our community of innovators and supporters. Manage social media, events, and founder success programs.',
  },
  {
    title: 'DevOps Engineer',
    department: 'Engineering',
    location: 'Hyderabad / Remote',
    type: 'Full-time',
    description: 'Manage cloud infrastructure on AWS, CI/CD pipelines, monitoring, and security. Ensure platform reliability and scalability.',
  },
  {
    title: 'Content Writer',
    department: 'Marketing',
    location: 'Remote',
    type: 'Part-time',
    description: 'Write compelling content about startups, innovation, and platform updates. Manage blog, case studies, and newsletter.',
  },
  {
    title: 'Business Development',
    department: 'Growth',
    location: 'Hyderabad',
    type: 'Full-time',
    description: 'Drive partnerships with incubators, accelerators, and investors. Identify growth opportunities and strategic alliances.',
  },
];

const perks = [
  { icon: '🏠', title: 'Remote-First', desc: 'Work from anywhere in India' },
  { icon: '📈', title: 'Equity Options', desc: 'Own a piece of the mission' },
  { icon: '📚', title: 'Learning Budget', desc: '₹50K/year for courses & conferences' },
  { icon: '🏥', title: 'Health Insurance', desc: 'Comprehensive coverage for you & family' },
  { icon: '🏖️', title: 'Flexible PTO', desc: 'Unlimited paid time off' },
  { icon: '💻', title: 'Latest Gear', desc: 'MacBook Pro & accessories provided' },
];

export default function CareersPage() {
  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Join the <span className="gradient-text">Mission</span>
          </h1>
          <p className="text-lg text-muted max-w-2xl mx-auto">
            Help us build the future of innovation funding. We&apos;re looking for passionate people
            who want to make a difference.
          </p>
        </motion.div>

        {/* Perks */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <h2 className="text-2xl font-bold text-foreground text-center mb-8">Why Vishvakarma Hub?</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {perks.map((perk) => (
              <Card key={perk.title} className="p-4 text-center">
                <div className="text-3xl mb-2">{perk.icon}</div>
                <h3 className="text-sm font-semibold text-foreground">{perk.title}</h3>
                <p className="text-xs text-muted mt-1">{perk.desc}</p>
              </Card>
            ))}
          </div>
        </motion.div>

        {/* Openings */}
        <h2 className="text-2xl font-bold text-foreground text-center mb-8">Open Positions</h2>
        <div className="space-y-4 max-w-4xl mx-auto">
          {openings.map((job, i) => (
            <motion.div
              key={job.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className="p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-foreground">{job.title}</h3>
                    <div className="flex flex-wrap gap-3 mt-2 text-sm text-muted">
                      <span>🏢 {job.department}</span>
                      <span>📍 {job.location}</span>
                      <span>⏰ {job.type}</span>
                    </div>
                    <p className="text-muted mt-3 text-sm">{job.description}</p>
                  </div>
                  <Button variant="outline" className="flex-shrink-0">
                    Apply Now
                  </Button>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mt-16"
        >
          <Card className="p-8">
            <h2 className="text-2xl font-bold text-foreground mb-3">Don&apos;t see a role that fits?</h2>
            <p className="text-muted mb-6">
              Send us your resume at <span className="text-blue">careers@vishvakarmahub.com</span> and we&apos;ll reach out when the right opportunity opens up.
            </p>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
