'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

export default function CompetitionRefundPolicyPage() {
  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <p className="text-sm text-amber-500 font-medium mb-1">Vishvakarma Innovation Challenge 2026</p>
          <h1 className="text-4xl font-bold text-foreground mb-2">Refund Policy</h1>
          <p className="text-muted mb-8">Last updated: March 25, 2026</p>

          <div className="prose-custom space-y-8 text-muted">
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">1. Overview</h2>
              <p>This Refund Policy applies specifically to the <strong className="text-foreground">Vishvakarma Innovation Challenge 2026</strong>, organized by Trinetrashakti Innovations Private Limited. This policy governs all payments made through the competition platform including registration fees and visitor passes.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">2. Non-Refundable Fees</h2>
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg mb-4">
                <p className="text-red-400 font-bold text-base mb-2">⚠️ All registration fees are non-refundable.</p>
                <p className="text-red-400/80 text-sm">By completing payment, you acknowledge and agree that no refunds will be issued under any circumstances for the fees listed below.</p>
              </div>
              <p className="mb-2">The following fees are strictly non-refundable once payment is completed:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong className="text-foreground">Student Registration Fee — ₹199:</strong> Non-refundable regardless of participation status, disqualification, or event cancellation.</li>
                <li><strong className="text-foreground">Professional/Founder Registration Fee — ₹499:</strong> Non-refundable regardless of participation status, disqualification, or event cancellation.</li>
                <li><strong className="text-foreground">Citizen Visitor Pass — ₹99:</strong> Non-refundable once issued. The pass is valid for the event date only.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">3. Situations Where No Refund Is Issued</h2>
              <p className="mb-2">To be absolutely clear, refunds will <strong className="text-foreground">not</strong> be issued in any of the following scenarios:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Change of mind or voluntary withdrawal from the competition</li>
                <li>Failure to submit an idea before the deadline</li>
                <li>Disqualification due to violation of terms, plagiarism, or misconduct</li>
                <li>Inability to attend the event on the scheduled date</li>
                <li>Dissatisfaction with competition results or judging decisions</li>
                <li>Duplicate accounts created by the same individual</li>
                <li>Technical difficulties on the participant&apos;s end (internet, device issues)</li>
                <li>Event rescheduling to a different date</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">4. Exceptional Circumstances</h2>
              <p className="mb-2">Refunds or credits may be considered <strong className="text-foreground">solely at the organizer&apos;s discretion</strong> in the following rare situations:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong className="text-foreground">Duplicate Payment:</strong> If a verified technical error results in the same participant being charged twice for the same registration, the duplicate amount will be refunded within 7–10 business days.</li>
                <li><strong className="text-foreground">Unauthorized Transaction:</strong> If a payment was made without the account holder&apos;s authorization (e.g., stolen card), the matter will be investigated. If found valid, a refund may be processed.</li>
                <li><strong className="text-foreground">Complete Event Cancellation:</strong> If the organizer permanently cancels the competition (not postpones/reschedules), a partial credit or refund may be issued after deducting administrative and payment processing costs.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">5. Refund Process (For Exceptional Cases Only)</h2>
              <p className="mb-2">If you believe you qualify for a refund under Section 4:</p>
              <ol className="list-decimal pl-6 space-y-2">
                <li>Email <a href="mailto:contact@trinetrashaktiinnovations.com" className="text-amber-500 hover:underline">contact@trinetrashaktiinnovations.com</a> with subject line: <strong className="text-foreground">&quot;Competition Refund Request — [Your Registration ID]&quot;</strong></li>
                <li>Include: your full name, registered email, phone number, payment receipt/transaction ID, and a detailed explanation of your request.</li>
                <li>Our team will review your request within <strong className="text-foreground">5–7 business days</strong>.</li>
                <li>If approved, the refund will be credited to the original payment method within <strong className="text-foreground">10–15 business days</strong>.</li>
              </ol>
              <p className="mt-2 text-sm">Payment gateway processing fees charged by Razorpay are non-recoverable and will be deducted from any approved refund amount.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">6. Event Rescheduling vs. Cancellation</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong className="text-foreground">Rescheduling:</strong> If the event is postponed to a new date, all registrations remain valid for the new date. No refunds will be issued for rescheduled events.</li>
                <li><strong className="text-foreground">Cancellation:</strong> In the unlikely event of permanent cancellation, the organizer will notify all registered participants via email and determine refund eligibility on a case-by-case basis.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">7. Sponsor &amp; Partner Payments</h2>
              <p>Sponsor and partnership payments are governed by separate agreements between Trinetrashakti Innovations Pvt Ltd and the respective sponsor/partner entity. This refund policy does not apply to sponsorship contracts.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">8. Modifications</h2>
              <p>Trinetrashakti Innovations Pvt Ltd reserves the right to modify this Refund Policy at any time. Any changes will be updated on this page. Continued registration or participation after modifications constitutes acceptance of the updated policy.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">9. Governing Law</h2>
              <p>This Refund Policy shall be governed by and construed in accordance with the laws of India. Any disputes arising from refund claims shall be subject to the exclusive jurisdiction of the courts in <strong className="text-foreground">Vijayawada, Andhra Pradesh, India</strong>.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">10. Contact Us</h2>
              <p className="mb-2">For refund inquiries or payment-related issues:</p>
              <ul className="list-none space-y-1">
                <li><strong className="text-foreground">Organization:</strong> Trinetrashakti Innovations Private Limited</li>
                <li><strong className="text-foreground">Registered Office:</strong> 36-14-3/2, 4th Floor, HQ Vijayawada, Bricks &amp; Palms, Shanti Nagar, Labbipet, Vijayawada – 520010, Andhra Pradesh</li>
                <li><strong className="text-foreground">Operational Office:</strong> Tirupati, Andhra Pradesh</li>
                <li><strong className="text-foreground">Email:</strong> <a href="mailto:contact@trinetrashaktiinnovations.com" className="text-amber-500 hover:underline">contact@trinetrashaktiinnovations.com</a></li>
                <li><strong className="text-foreground">Phone:</strong> <a href="tel:+919032981675" className="text-amber-500 hover:underline">+91 90329 81675</a></li>
              </ul>
            </section>

            <section className="border-t border-border pt-6">
              <p className="text-sm text-muted/70">By registering for the Vishvakarma Innovation Challenge 2026, you acknowledge that you have read, understood, and agree to this Refund Policy.</p>
              <div className="flex gap-4 mt-4">
                <Link href="/competition" className="text-sm text-amber-500 hover:underline">← Back to Competition</Link>
                <Link href="/competition/terms-and-conditions" className="text-sm text-amber-500 hover:underline">Terms &amp; Conditions →</Link>
              </div>
            </section>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
