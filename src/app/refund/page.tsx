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
              <p>Vishvakarma Hub facilitates contributions between supporters and startup campaigns. This Refund Policy outlines the conditions under which refunds may be issued for contributions made through our platform.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">2. Contribution Nature</h2>
              <p>Contributions made on Vishvakarma Hub are voluntary payments to support innovation and startup development. They are not purchases, investments, or loans. Contributors should understand that supporting a startup involves risk and outcomes are not guaranteed.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">3. Refund Eligibility</h2>
              <p className="mb-2">Refunds may be issued in the following circumstances:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong className="text-foreground">Campaign Cancelled:</strong> If a campaign is cancelled before reaching its funding goal, all contributions will be automatically refunded within 7-10 business days.</li>
                <li><strong className="text-foreground">Campaign Not Fully Funded:</strong> If a campaign does not reach its minimum funding goal by the deadline, the partial funds raised are still released to the founder to continue development. Contributors should understand that their contributions support innovation even if a campaign doesn&apos;t reach its full goal. No refunds are issued in this case.</li>
                <li><strong className="text-foreground">Fraudulent Campaign:</strong> If a campaign is found to be fraudulent and is removed by our team, all contributors will receive a full refund.</li>
                <li><strong className="text-foreground">Duplicate Payment:</strong> If a technical error results in duplicate charges, the duplicate amount will be refunded.</li>
                <li><strong className="text-foreground">Unauthorized Transaction:</strong> If a contribution was made without your authorization, contact us immediately for investigation and potential refund.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">4. Non-Refundable Situations</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>Contributions to successfully funded campaigns that have been disbursed to the campaign creator</li>
                <li>Contributions to campaigns that did not reach their funding goal — partial funds are released to founders</li>
                <li>Change of mind after contributing to an active campaign</li>
                <li>Dissatisfaction with campaign updates or progress (dispute resolution applies instead)</li>
                <li>Platform fees on processed transactions</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">5. How to Request a Refund</h2>
              <ol className="list-decimal pl-6 space-y-2">
                <li>Log in to your Vishvakarma Hub account</li>
                <li>Navigate to your contribution history in your dashboard</li>
                <li>Select the contribution and click &quot;Request Refund&quot;</li>
                <li>Provide the reason for your refund request</li>
                <li>Our team will review and respond within 3-5 business days</li>
              </ol>
              <p className="mt-3">Alternatively, email us at refunds@vishvakarmahub.com with your transaction ID and reason for the refund.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">6. Refund Processing</h2>
              <ul className="list-disc pl-6 space-y-1">
                <li>Approved refunds are processed within 5-7 business days</li>
                <li>Refunds are credited to the original payment method</li>
                <li>Bank processing times may add 3-5 additional business days</li>
                <li>Payment gateway fees may be deducted from the refund amount</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">7. Dispute Resolution</h2>
              <p>If you are dissatisfied with a funded campaign&apos;s progress, we encourage you to first communicate with the campaign creator through the platform. If the issue is not resolved, you may file a formal dispute with our support team at support@vishvakarmahub.com.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">8. Contact Us</h2>
              <p>For refund-related inquiries, contact us at refunds@vishvakarmahub.com or visit our Help Center.</p>
            </section>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
