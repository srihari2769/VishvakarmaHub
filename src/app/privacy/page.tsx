'use client';

import { motion } from 'framer-motion';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-4xl font-bold text-foreground mb-2">Privacy Policy</h1>
          <p className="text-muted mb-8">Last updated: January 1, 2025</p>

          <div className="prose-custom space-y-8 text-muted">
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">1. Introduction</h2>
              <p>Vishvakarma Hub (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) is committed to protecting your personal information and your right to privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our platform at vishvakarmahub.com and use our services.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">2. Information We Collect</h2>
              <p className="mb-2">We collect information that you provide directly to us, including:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Name, email address, and password when you create an account</li>
                <li>Profile information such as bio, location, and profile picture</li>
                <li>Startup details including idea submissions, campaign information, and pitch decks</li>
                <li>Payment information processed securely through Razorpay or Stripe</li>
                <li>Communications you send to us via contact forms or email</li>
                <li>Usage data including pages visited, features used, and interaction patterns</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">3. How We Use Your Information</h2>
              <ul className="list-disc pl-6 space-y-1">
                <li>To create and manage your account</li>
                <li>To process contributions and payments</li>
                <li>To enable startup campaigns and funding activities</li>
                <li>To send notifications about campaigns you support</li>
                <li>To improve our platform and develop new features</li>
                <li>To prevent fraud and ensure platform security</li>
                <li>To comply with legal obligations</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">4. Information Sharing</h2>
              <p>We do not sell your personal information. We may share your information with:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Payment processors (Razorpay, Stripe) to complete transactions</li>
                <li>Cloud service providers (AWS) for hosting and storage</li>
                <li>Analytics providers to improve platform performance</li>
                <li>Law enforcement when required by applicable law</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">5. Data Security</h2>
              <p>We implement industry-standard security measures including encryption of data in transit (TLS/SSL), hashed passwords using bcrypt, secure API authentication with JWT tokens, and regular security audits. However, no method of electronic transmission or storage is 100% secure.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">6. Cookies and Tracking</h2>
              <p>We use essential cookies for authentication and session management. We may also use analytics cookies to understand how users interact with our platform. You can control cookie preferences through your browser settings.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">7. Your Rights</h2>
              <ul className="list-disc pl-6 space-y-1">
                <li>Access and download your personal data</li>
                <li>Correct inaccurate information</li>
                <li>Delete your account and associated data</li>
                <li>Opt out of marketing communications</li>
                <li>Withdraw consent for data processing</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">8. Data Retention</h2>
              <p>We retain your personal information for as long as your account is active or as needed to provide services. Financial transaction records are retained as required by applicable tax and regulatory laws.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">9. Children&apos;s Privacy</h2>
              <p>Our platform is not intended for individuals under 18 years of age. We do not knowingly collect personal information from children.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">10. Changes to This Policy</h2>
              <p>We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new policy on this page and updating the &quot;Last updated&quot; date.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">11. Contact Us</h2>
              <p>If you have questions about this Privacy Policy, please contact us at:</p>
              <p className="mt-2">Email: privacy@vishvakarmahub.com</p>
              <p>Address: Hyderabad, Telangana, India</p>
            </section>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
