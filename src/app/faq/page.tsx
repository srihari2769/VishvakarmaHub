'use client';

import { motion } from 'framer-motion';
import { Card } from '@/components/ui';
import { useState } from 'react';

const faqs = [
  {
    category: 'General',
    questions: [
      {
        q: 'What is Vishvakarma Hub?',
        a: 'Vishvakarma Hub is a startup creation and innovation platform that connects innovators with experts, mentors, and collaborators. It enables anyone to submit startup ideas, get expert evaluation, and grow their venture.',
      },
      {
        q: 'How does the platform work?',
        a: 'Innovators submit their startup ideas through our platform. Each idea undergoes expert evaluation. Approved startups get listed on the platform where they gain visibility, connect with co-founders, and access resources to grow.',
      },
      {
        q: 'Is Vishvakarma Hub free to use?',
        a: 'Creating an account and browsing startups is completely free. Premium features and services may have associated fees.',
      },
    ],
  },
  {
    category: 'For Innovators',
    questions: [
      {
        q: 'How do I submit a startup idea?',
        a: 'Sign up for an account, then navigate to "Submit Idea" from the navigation menu. Fill out the form with your idea details, category, and any supporting documents.',
      },
      {
        q: 'What happens after I submit my idea?',
        a: 'Your idea goes through an expert evaluation process. Our team reviews it for viability, innovation, and market potential. You will be notified once the review is complete.',
      },
      {
        q: 'What documents do I need to submit?',
        a: 'You will need to submit identity verification, a pitch deck or business plan, and any relevant prototypes or demos. Specific requirements vary by startup category.',
      },
    ],
  },
  {
    category: 'Account & Security',
    questions: [
      {
        q: 'How do I reset my password?',
        a: 'Click "Forgot Password" on the login page, enter your email address, and follow the instructions sent to your email.',
      },
      {
        q: 'How is my data protected?',
        a: 'We use industry-standard encryption (TLS/SSL), bcrypt password hashing, and JWT-based authentication. See our Privacy Policy for more details.',
      },
      {
        q: 'Can I delete my account?',
        a: 'Yes. Contact contact@trinetrashaktiinnovations.com to request account deletion.',
      },
    ],
  },
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-white/10">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-4 text-left"
      >
        <span className="text-foreground font-medium pr-4">{q}</span>
        <span className="text-muted text-xl flex-shrink-0">{open ? '−' : '+'}</span>
      </button>
      {open && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="pb-4 text-muted text-sm"
        >
          {a}
        </motion.div>
      )}
    </div>
  );
}

export default function FAQPage() {
  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Frequently Asked <span className="gradient-text">Questions</span>
          </h1>
          <p className="text-lg text-muted max-w-2xl mx-auto">
            Quick answers to common questions about using Vishvakarma Hub.
          </p>
        </motion.div>

        <div className="space-y-8">
          {faqs.map((section) => (
            <motion.div
              key={section.category}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <Card className="p-6">
                <h2 className="text-lg font-semibold text-foreground mb-4">{section.category}</h2>
                <div>
                  {section.questions.map((item) => (
                    <FAQItem key={item.q} q={item.q} a={item.a} />
                  ))}
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="text-center mt-12">
          <p className="text-muted">
            Still have questions? Contact us at{' '}
            <span className="text-blue">contact@trinetrashaktiinnovations.com</span>
          </p>
        </div>
      </div>
    </div>
  );
}
