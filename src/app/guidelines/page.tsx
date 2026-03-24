'use client';

import { motion } from 'framer-motion';
import { Card } from '@/components/ui';

export default function GuidelinesPage() {
  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-4xl font-bold text-foreground mb-2">Community Guidelines</h1>
          <p className="text-muted mb-8">
            Our guidelines ensure Vishvakarma Hub remains a safe, trustworthy, and productive
            space for innovators and collaborators alike.
          </p>

          <div className="space-y-6">
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-foreground mb-3">🎯 Startup Submission Rules</h2>
              <ul className="list-disc pl-6 space-y-2 text-muted">
                <li>Submissions must represent genuine startup ideas or innovations</li>
                <li>All claims about your product, team, and progress must be truthful</li>
                <li>Provide realistic timelines and milestones</li>
                <li>Include clear descriptions of your product, vision, and goals</li>
                <li>Use original images and videos — do not use copyrighted material without permission</li>
                <li>Startups must fall within one of our approved innovation categories</li>
              </ul>
            </Card>

            <Card className="p-6">
              <h2 className="text-xl font-semibold text-foreground mb-3">🚫 Prohibited Content</h2>
              <ul className="list-disc pl-6 space-y-2 text-muted">
                <li>Fraudulent or deceptive campaigns</li>
                <li>Illegal products, services, or activities</li>
                <li>Weapons, drugs, or controlled substances</li>
                <li>Hate speech, discrimination, or harassment</li>
                <li>Adult or sexually explicit content</li>
                <li>Multi-level marketing or pyramid schemes</li>
                <li>Personal fundraising or charity requests (this is a startup platform)</li>
                <li>Political campaigns or lobbying activities</li>
              </ul>
            </Card>

            <Card className="p-6">
              <h2 className="text-xl font-semibold text-foreground mb-3">💬 Community Interaction</h2>
              <ul className="list-disc pl-6 space-y-2 text-muted">
                <li>Treat all community members with respect and professionalism</li>
                <li>Constructive feedback is encouraged; personal attacks are not tolerated</li>
                <li>Do not spam comments or send unsolicited promotional messages</li>
                <li>Report suspicious campaigns or inappropriate content to our team</li>
                <li>Support open dialogue and knowledge-sharing among innovators</li>
              </ul>
            </Card>

            <Card className="p-6">
              <h2 className="text-xl font-semibold text-foreground mb-3">📊 Startup Founder Responsibilities</h2>
              <ul className="list-disc pl-6 space-y-2 text-muted">
                <li>Provide regular project updates (at least monthly for listed startups)</li>
                <li>Respond to community questions in a timely manner</li>
                <li>Deliver on commitments and milestones as stated</li>
                <li>Notify the community immediately if there are delays or changes to the project</li>
                <li>Use platform resources responsibly</li>
                <li>Comply with all applicable laws and regulations</li>
              </ul>
            </Card>

            <Card className="p-6">
              <h2 className="text-xl font-semibold text-foreground mb-3">🔍 Review Process</h2>
              <ul className="list-disc pl-6 space-y-2 text-muted">
                <li>All startups undergo a review process before going live</li>
                <li>Reviews typically take 2-3 business days</li>
                <li>We may request additional information or documentation</li>
                <li>Startups violating guidelines will be rejected with explanation</li>
                <li>Repeat violations may result in account suspension</li>
              </ul>
            </Card>

            <Card className="p-6">
              <h2 className="text-xl font-semibold text-foreground mb-3">⚖️ Enforcement</h2>
              <ul className="list-disc pl-6 space-y-2 text-muted">
                <li><strong className="text-foreground">First violation:</strong> Warning and content removal</li>
                <li><strong className="text-foreground">Second violation:</strong> Temporary account suspension (7 days)</li>
                <li><strong className="text-foreground">Third violation:</strong> Permanent account ban</li>
                <li><strong className="text-foreground">Severe violations</strong> (fraud, illegal activity): Immediate permanent ban and potential legal action</li>
              </ul>
            </Card>
          </div>

          <div className="mt-8 text-center text-muted">
            <p>
              Questions about our guidelines? Contact us at{' '}
              <span className="text-blue">guidelines@vishvakarmahub.com</span>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
