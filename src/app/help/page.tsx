'use client';

import { motion } from 'framer-motion';
import { Card } from '@/components/ui';
import Link from 'next/link';

const helpTopics = [
  {
    icon: '🚀',
    title: 'Getting Started',
    description: 'New to Vishvakarma Hub? Learn the basics of how our platform works.',
    links: [
      { label: 'Create an account', href: '/signup' },
      { label: 'How it works', href: '/how-it-works' },
      { label: 'Explore startups', href: '/explore' },
    ],
  },
  {
    icon: '💡',
    title: 'Submitting Ideas',
    description: 'Learn how to submit your startup idea and get it approved.',
    links: [
      { label: 'Submit your idea', href: '/submit-idea' },
      { label: 'Content guidelines', href: '/guidelines' },
      { label: 'Categories', href: '/categories' },
    ],
  },
  {
    icon: '💰',
    title: 'Campaigns & Funding',
    description: 'Everything about creating campaigns and managing funding.',
    links: [
      { label: 'Campaign tips', href: '/blog' },
      { label: 'Your dashboard', href: '/startup-dashboard' },
      { label: 'Refund policy', href: '/refund' },
    ],
  },
  {
    icon: '🤝',
    title: 'Supporting Startups',
    description: 'How to discover and contribute to innovative startups.',
    links: [
      { label: 'Browse startups', href: '/explore' },
      { label: 'Your contributions', href: '/dashboard' },
      { label: 'FAQ', href: '/faq' },
    ],
  },
  {
    icon: '🔒',
    title: 'Account & Security',
    description: 'Manage your account settings and security preferences.',
    links: [
      { label: 'Reset password', href: '/forgot-password' },
      { label: 'Privacy policy', href: '/privacy' },
      { label: 'Terms of service', href: '/terms' },
    ],
  },
  {
    icon: '📧',
    title: 'Contact Support',
    description: 'Need more help? Reach out to our support team.',
    links: [
      { label: 'Contact us', href: '/contact' },
      { label: 'Report an issue', href: '/contact' },
      { label: 'Send email', href: 'mailto:support@vishvakarmahub.com' },
    ],
  },
];

export default function HelpPage() {
  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Help <span className="gradient-text">Center</span>
          </h1>
          <p className="text-lg text-muted max-w-2xl mx-auto">
            Find guides, troubleshooting tips, and answers to get the most out of Vishvakarma Hub.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {helpTopics.map((topic, i) => (
            <motion.div
              key={topic.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className="p-6 h-full flex flex-col">
                <div className="text-3xl mb-3">{topic.icon}</div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{topic.title}</h3>
                <p className="text-sm text-muted mb-4">{topic.description}</p>
                <div className="mt-auto space-y-2">
                  {topic.links.map((link) => (
                    <Link
                      key={link.label}
                      href={link.href}
                      className="block text-sm text-blue hover:underline"
                    >
                      → {link.label}
                    </Link>
                  ))}
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mt-16"
        >
          <Card className="p-8">
            <h2 className="text-2xl font-bold text-foreground mb-3">Can&apos;t find what you need?</h2>
            <p className="text-muted mb-4">
              Our support team is available Monday to Friday, 9 AM – 6 PM IST.
            </p>
            <p className="text-muted">
              Email us at <span className="text-blue">support@vishvakarmahub.com</span> or call{' '}
              <span className="text-blue">+91 40 1234 5678</span>
            </p>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
