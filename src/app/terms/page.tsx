'use client';

import { motion } from 'framer-motion';

export default function TermsPage() {
  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-4xl font-bold text-foreground mb-2">Terms of Service</h1>
          <p className="text-muted mb-8">Last updated: January 1, 2025</p>

          <div className="prose-custom space-y-8 text-muted">
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">1. Agreement to Terms</h2>
              <p>By accessing or using Vishvakarma Hub (&quot;the Platform&quot;), you agree to be bound by these Terms of Service. If you do not agree to these terms, you may not use the Platform.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">2. Description of Service</h2>
              <p>Vishvakarma Hub is a startup creation and public funding platform that enables innovators to submit ideas, create campaigns, and receive contributions from the public. The Platform facilitates connections between founders and supporters but does not guarantee funding outcomes.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">3. User Accounts</h2>
              <ul className="list-disc pl-6 space-y-1">
                <li>You must be at least 18 years old to create an account</li>
                <li>You are responsible for maintaining the confidentiality of your account credentials</li>
                <li>You must provide accurate and complete information during registration</li>
                <li>You are responsible for all activities that occur under your account</li>
                <li>Notify us immediately of any unauthorized use of your account</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">4. Startup Campaigns</h2>
              <ul className="list-disc pl-6 space-y-1">
                <li>Campaign creators must provide truthful and accurate information about their startup</li>
                <li>All submitted ideas and campaigns are subject to review and approval</li>
                <li>Campaign creators are legally obligated to fulfill promises made to supporters</li>
                <li>The Platform reserves the right to remove campaigns that violate our guidelines</li>
                <li>Campaign creators must provide regular updates on project progress</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">5. Contributions</h2>
              <ul className="list-disc pl-6 space-y-1">
                <li>Contributions are voluntary payments to support startup campaigns</li>
                <li>Contributors understand that startup ventures carry inherent risks</li>
                <li>Contributions are not investments and do not confer equity or ownership</li>
                <li>Refund eligibility is governed by our Refund Policy</li>
                <li>The Platform is not responsible for the success or failure of funded campaigns</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">6. Prohibited Activities</h2>
              <ul className="list-disc pl-6 space-y-1">
                <li>Submitting fraudulent campaigns or false information</li>
                <li>Using the Platform for money laundering or illegal activities</li>
                <li>Harassing, threatening, or intimidating other users</li>
                <li>Attempting to circumvent platform fees or payment systems</li>
                <li>Scraping, crawling, or automated access without permission</li>
                <li>Impersonating another person or organization</li>
                <li>Posting content that infringes intellectual property rights</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">7. Intellectual Property</h2>
              <p>Campaign creators retain ownership of their intellectual property. By submitting content to the Platform, you grant Vishvakarma Hub a non-exclusive, worldwide license to display and promote your campaign on our platform and affiliated channels.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">8. Platform Fees</h2>
              <p>Vishvakarma Hub charges a platform fee on successfully funded campaigns. Fee structures are disclosed during campaign creation. Payment processing fees from third-party providers (Razorpay, Stripe) are additional.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">9. Limitation of Liability</h2>
              <p>Vishvakarma Hub is provided &quot;as is&quot; without warranties of any kind. We are not liable for any indirect, incidental, or consequential damages arising from your use of the Platform. Our total liability shall not exceed the fees paid by you in the 12 months preceding the claim.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">10. Termination</h2>
              <p>We may suspend or terminate your account at our discretion if you violate these terms. You may delete your account at any time. Upon termination, your obligation to fulfill funded campaigns remains in effect.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">11. Governing Law</h2>
              <p>These terms are governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of the courts in Hyderabad, Telangana.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">12. Contact</h2>
              <p>For questions about these Terms of Service, please contact us at legal@vishvakarmahub.com.</p>
            </section>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
