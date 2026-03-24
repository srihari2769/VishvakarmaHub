'use client';

import { motion } from 'framer-motion';

export default function RefundPage() {
  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-4xl font-bold text-foreground mb-2">Refund Policy</h1>
          <p className="text-muted mb-8">Last updated: January 1, 2025</p>

          <div className="prose-custom space-y-8 text-muted">
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">1. Overview</h2>
              <p>This Refund Policy outlines the conditions under which refunds may be issued for any payments made through the Vishvakarma Hub platform, including premium services, event registrations, and other paid features.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">2. Refund Eligibility</h2>
              <p className="mb-2">Refunds may be issued in the following circumstances:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong className="text-foreground">Duplicate Payment:</strong> If a technical error results in duplicate charges, the duplicate amount will be refunded within 7-10 business days.</li>
                <li><strong className="text-foreground">Unauthorized Transaction:</strong> If a payment was made without your authorization, contact us immediately for investigation and potential refund.</li>
                <li><strong className="text-foreground">Service Not Delivered:</strong> If a paid service was not delivered as described, you may be eligible for a full or partial refund.</li>
                <li><strong className="text-foreground">Event Cancellation:</strong> If an event organized by Vishvakarma Hub is cancelled, registered participants may receive a refund as per event-specific terms.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">3. Non-Refundable Situations</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>Change of mind after purchasing a service or registering for an event</li>
                <li>Failure to use a purchased service within the specified validity period</li>
                <li>Platform fees on processed transactions</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">4. How to Request a Refund</h2>
              <ol className="list-decimal pl-6 space-y-2">
                <li>Log in to your Vishvakarma Hub account</li>
                <li>Navigate to your transaction history in your dashboard</li>
                <li>Contact our support team with your transaction ID and reason for the refund</li>
                <li>Our team will review and respond within 3-5 business days</li>
              </ol>
              <p className="mt-3">Alternatively, email us at contact@trinetrashaktiinnovations.com with your transaction ID and reason for the refund.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">5. Refund Processing</h2>
              <ul className="list-disc pl-6 space-y-1">
                <li>Approved refunds are processed within 5-7 business days</li>
                <li>Refunds are credited to the original payment method</li>
                <li>Bank processing times may add 3-5 additional business days</li>
                <li>Payment gateway fees may be deducted from the refund amount</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">6. Dispute Resolution</h2>
              <p>If you have a dispute regarding any transaction, please contact our support team at contact@trinetrashaktiinnovations.com. We will work to resolve your concern promptly.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">7. Contact Us</h2>
              <p>For refund-related inquiries, contact us at contact@trinetrashaktiinnovations.com or visit our Help Center.</p>
            </section>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
