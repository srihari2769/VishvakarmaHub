'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

export default function CompetitionTermsPage() {
  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <p className="text-sm text-amber-500 font-medium mb-1">Vishvakarma Innovation Challenge 2026</p>
          <h1 className="text-4xl font-bold text-foreground mb-2">Terms &amp; Conditions</h1>
          <p className="text-muted mb-8">Last updated: March 24, 2026</p>

          <div className="prose-custom space-y-8 text-muted">
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">1. Organizer</h2>
              <p>The Vishvakarma Innovation Challenge 2026 (&quot;the Competition&quot;) is organized and conducted by <strong className="text-foreground">Trinetrashakti Innovations Private Limited</strong>, a company incorporated under the Companies Act, 2013, and recognized under the Startup India initiative of the Government of India.</p>
              <ul className="list-disc pl-6 space-y-1 mt-2">
                <li><strong className="text-foreground">Registered Office:</strong> Tirupati, Andhra Pradesh, India</li>
                <li><strong className="text-foreground">Email:</strong> support@vishvakarmahub.com</li>
                <li><strong className="text-foreground">Phone:</strong> +91 98765 43210</li>
                <li><strong className="text-foreground">Website:</strong> <Link href="https://www.vishvakarmahub.com" className="text-amber-500 hover:underline">www.vishvakarmahub.com</Link></li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">2. Eligibility</h2>
              <ul className="list-disc pl-6 space-y-1">
                <li>The Competition is open to Indian citizens and residents aged 16 years and above.</li>
                <li>Participants under 18 must have consent from a parent or legal guardian.</li>
                <li>Students, professionals, entrepreneurs, and startup founders are all eligible to participate.</li>
                <li>Teams may consist of 1–5 members. Each team must designate one Team Lead who registers on behalf of the team.</li>
                <li>Employees, directors, and immediate family members of Trinetrashakti Innovations Pvt Ltd are not eligible to participate.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">3. Registration &amp; Fees</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong className="text-foreground">Student Registration Fee:</strong> ₹199 per participant</li>
                <li><strong className="text-foreground">Professional/Founder Registration Fee:</strong> ₹499 per participant</li>
                <li><strong className="text-foreground">Citizen Visitor Pass:</strong> ₹99 per person (for event-day attendance only)</li>
              </ul>
              <div className="mt-3 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                <p className="text-red-400 font-semibold text-sm">⚠️ All registration fees are non-refundable. By completing payment, you acknowledge and agree that no refunds will be issued under any circumstances.</p>
              </div>
              <p className="mt-2">Registration is confirmed only upon successful payment via Razorpay. A confirmation email with your registration ID and competition details will be sent to your registered email address.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">4. Competition Timeline</h2>
              <ul className="list-disc pl-6 space-y-1">
                <li><strong className="text-foreground">Registration Period:</strong> March 23, 2026 – May 23, 2026</li>
                <li><strong className="text-foreground">Idea Submission Deadline:</strong> May 23, 2026</li>
                <li><strong className="text-foreground">AI + Expert Screening:</strong> By June 5, 2026</li>
                <li><strong className="text-foreground">Public Voting Phase:</strong> June 5, 2026 – July 10, 2026</li>
                <li><strong className="text-foreground">Grand Finals:</strong> July 23, 2026</li>
              </ul>
              <p className="mt-2">The organizer reserves the right to modify the timeline with prior notice to all registered participants.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">5. Idea Submission</h2>
              <ul className="list-disc pl-6 space-y-1">
                <li>Each participant or team may submit one idea per registration.</li>
                <li>Submissions must be original and not infringe upon any third-party intellectual property rights.</li>
                <li>Submissions must include: idea title, problem statement, proposed solution, target audience, and innovation/uniqueness factor.</li>
                <li>Plagiarized, copied, or AI-generated-without-attribution submissions will be disqualified.</li>
                <li>Late submissions will not be accepted under any circumstances.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">6. Evaluation &amp; Judging</h2>
              <ul className="list-disc pl-6 space-y-1">
                <li>All submissions will undergo a multi-stage evaluation: AI screening, expert panel review, public voting, and final jury judging.</li>
                <li>AI evaluation scores are indicative and used for shortlisting only — final decisions rest with the human jury panel.</li>
                <li>Public voting carries a defined weightage in the overall scoring but does not solely determine winners.</li>
                <li>The jury panel&apos;s decision is final and binding. No appeals or disputes regarding results will be entertained.</li>
                <li>Judges may include industry experts, investors, entrepreneurs, and representatives of sponsor organizations.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">7. Intellectual Property</h2>
              <ul className="list-disc pl-6 space-y-1">
                <li>All intellectual property rights to submitted ideas remain with the original creator(s).</li>
                <li>By participating, you grant Trinetrashakti Innovations Pvt Ltd a non-exclusive, royalty-free license to use your idea title, summary, and presentation materials for promotional and marketing purposes related to the Competition.</li>
                <li>The organizer will not claim ownership over any submitted idea, prototype, or business plan.</li>
                <li>Participants are advised to protect their IP through appropriate filings before public disclosure.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">8. Prizes &amp; Awards</h2>
              <ul className="list-disc pl-6 space-y-1">
                <li>Prize details, amounts, and special awards will be announced on the Competition page and updated periodically.</li>
                <li>Prizes are subject to applicable taxes. Winners are responsible for all tax obligations.</li>
                <li>Prize money will be disbursed via bank transfer within 30 business days of the finals.</li>
                <li>The organizer reserves the right to substitute prizes of equivalent or greater value.</li>
                <li>Unclaimed prizes will be forfeited after 60 days of notification.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">9. Code of Conduct</h2>
              <ul className="list-disc pl-6 space-y-1">
                <li>Participants must conduct themselves professionally at all times during the Competition and at the event venue.</li>
                <li>Any form of harassment, discrimination, abusive language, or threatening behaviour will result in immediate disqualification.</li>
                <li>Participants must not engage in vote manipulation, bribery, or any unfair means to influence results.</li>
                <li>Respect for fellow participants, judges, organizers, and venue staff is mandatory.</li>
                <li>Violation of the code of conduct will result in disqualification without refund.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">10. Data Privacy &amp; Consent</h2>
              <ul className="list-disc pl-6 space-y-1">
                <li>By registering, you consent to the collection and processing of your personal data (name, email, phone, institution/company) for competition-related communications.</li>
                <li>Your data may be shared with competition sponsors and partners for networking and recruitment purposes unless you opt out.</li>
                <li>We will not sell your personal data to third parties unrelated to the Competition.</li>
                <li>Photography, videography, and live streaming will take place at the event. By attending, you consent to your image being captured and used in promotional materials.</li>
                <li>Refer to our <Link href="/privacy" className="text-amber-500 hover:underline">Privacy Policy</Link> for complete details on data handling.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">11. Disqualification</h2>
              <p className="mb-2">The organizer reserves the right to disqualify any participant who:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Provides false or misleading information during registration</li>
                <li>Submits plagiarized or stolen work</li>
                <li>Engages in vote manipulation or unfair practices</li>
                <li>Violates the code of conduct</li>
                <li>Tampers with the competition platform or systems</li>
                <li>Fails to comply with any of these terms and conditions</li>
              </ul>
              <p className="mt-2">Disqualified participants will not be eligible for any refund of registration fees.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">12. Limitation of Liability</h2>
              <ul className="list-disc pl-6 space-y-1">
                <li>Trinetrashakti Innovations Pvt Ltd shall not be liable for any direct, indirect, incidental, or consequential damages arising from participation in the Competition.</li>
                <li>The organizer is not responsible for any technical failures, internet disruptions, or payment gateway issues that may affect registration or submission.</li>
                <li>The organizer shall not be liable for any loss or damage to personal property at the event venue.</li>
                <li>Participation in the Competition is entirely at the participant&apos;s own risk.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">13. Force Majeure</h2>
              <p>The organizer shall not be held responsible for any delay or failure in conducting the Competition due to events beyond its reasonable control, including but not limited to natural disasters, pandemics, government orders, civil unrest, or technical infrastructure failures. In such cases, the organizer may reschedule, modify, or cancel the Competition with appropriate notice.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">14. Modifications</h2>
              <p>Trinetrashakti Innovations Pvt Ltd reserves the right to amend, modify, or update these Terms &amp; Conditions at any time. Updated terms will be published on this page and notified to registered participants via email. Continued participation after modifications constitutes acceptance of the revised terms.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">15. Governing Law &amp; Jurisdiction</h2>
              <p>These Terms &amp; Conditions shall be governed by and construed in accordance with the laws of India. Any disputes arising out of or in connection with the Competition shall be subject to the exclusive jurisdiction of the courts in <strong className="text-foreground">Tirupati, Andhra Pradesh, India</strong>.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">16. Contact Us</h2>
              <p className="mb-2">For any questions or concerns regarding these Terms &amp; Conditions, please contact us:</p>
              <ul className="list-none space-y-1">
                <li><strong className="text-foreground">Organization:</strong> Trinetrashakti Innovations Private Limited</li>
                <li><strong className="text-foreground">Address:</strong> Tirupati, Andhra Pradesh, India</li>
                <li><strong className="text-foreground">Email:</strong> <a href="mailto:support@vishvakarmahub.com" className="text-amber-500 hover:underline">support@vishvakarmahub.com</a></li>
                <li><strong className="text-foreground">Phone:</strong> <a href="tel:+919876543210" className="text-amber-500 hover:underline">+91 98765 43210</a></li>
                <li><strong className="text-foreground">Website:</strong> <Link href="https://www.vishvakarmahub.com" className="text-amber-500 hover:underline">www.vishvakarmahub.com</Link></li>
              </ul>
            </section>

            <section className="border-t border-border pt-6">
              <p className="text-sm text-muted/70">By registering for the Vishvakarma Innovation Challenge 2026, you acknowledge that you have read, understood, and agree to abide by these Terms &amp; Conditions.</p>
              <div className="flex gap-4 mt-4">
                <Link href="/competition" className="text-sm text-amber-500 hover:underline">← Back to Competition</Link>
                <Link href="/competition/refund-policy" className="text-sm text-amber-500 hover:underline">Refund Policy →</Link>
              </div>
            </section>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
