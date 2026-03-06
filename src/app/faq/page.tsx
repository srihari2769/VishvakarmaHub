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
        a: 'Vishvakarma Hub is a startup creation and public funding platform that connects innovators with supporters. It enables anyone to submit startup ideas, launch funding campaigns, and receive contributions from the public.',
      },
      {
        q: 'How does public funding work?',
        a: 'Founders create campaigns with funding goals and reward tiers. Supporters browse startups and contribute funds. If a campaign reaches its goal, the full funds are released to the founder. Even if a campaign does not reach its full goal, the partial funds raised are still provided to the founder to continue development.',
      },
      {
        q: 'Is Vishvakarma Hub free to use?',
        a: 'Creating an account and browsing startups is completely free. We charge a small platform fee (5%) only on successfully funded campaigns.',
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
        q: 'How do I create a funding campaign?',
        a: 'After your idea is approved, you can create a campaign by setting a funding goal, deadline, description, and reward tiers for supporters.',
      },
      {
        q: 'When do I receive the funds?',
        a: 'Funds are released within 7-10 business days after a campaign successfully reaches its funding goal and the deadline passes.',
      },
      {
        q: 'What documents do I need to submit?',
        a: 'You will need to submit identity verification, a pitch deck or business plan, and any relevant prototypes or demos. Specific requirements vary by campaign size.',
      },
    ],
  },
  {
    category: 'For Supporters',
    questions: [
      {
        q: 'Is my contribution safe?',
        a: 'All payments are processed securely through Razorpay and Stripe. We never store your payment card details on our servers.',
      },
      {
        q: 'Can I get a refund?',
        a: 'Yes, refunds are provided if a campaign is cancelled, or is found to be fraudulent. If a campaign does not reach its funding goal, the partial funds are released to the founder and are not refunded. See our Refund Policy for details.',
      },
      {
        q: 'Do I get equity for my contribution?',
        a: 'No. Contributions are support-based, similar to crowdfunding. You may receive rewards set by the campaign creator, but contributions do not confer equity or ownership.',
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
        a: 'Yes. Contact support@vishvakarmahub.com to request account deletion. Note that active campaign obligations must be fulfilled before deletion.',
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
            <span className="text-blue">support@vishvakarmahub.com</span>
          </p>
        </div>
      </div>
    </div>
  );
}
