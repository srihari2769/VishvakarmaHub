'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button, Input, Textarea, Card } from '@/components/ui';

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate submission
    await new Promise(r => setTimeout(r, 1000));
    setSubmitted(true);
    setLoading(false);
  };

  const contactInfo = [
    { label: 'Email', value: 'support@vishvakarmahub.com', icon: '📧' },
    { label: 'Phone', value: '+91 98765 43210', icon: '📞' },
    { label: 'Location', value: 'Hyderabad, Telangana, India', icon: '📍' },
    { label: 'Hours', value: 'Mon - Fri, 9 AM - 6 PM IST', icon: '🕐' },
  ];

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Get in <span className="gradient-text">Touch</span>
          </h1>
          <p className="text-lg text-muted max-w-2xl mx-auto">
            Have a question, feedback, or partnership inquiry? We&apos;d love to hear from you.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contact Info */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-4"
          >
            {contactInfo.map((item) => (
              <Card key={item.label} className="p-5">
                <div className="flex items-start gap-4">
                  <span className="text-2xl">{item.icon}</span>
                  <div>
                    <h3 className="font-semibold text-foreground">{item.label}</h3>
                    <p className="text-muted text-sm">{item.value}</p>
                  </div>
                </div>
              </Card>
            ))}

            <Card className="p-5">
              <h3 className="font-semibold text-foreground mb-3">Follow Us</h3>
              <div className="flex gap-3">
                {['Twitter', 'LinkedIn', 'Instagram', 'YouTube'].map((social) => (
                  <span key={social} className="text-sm text-muted hover:text-blue cursor-pointer transition-colors">
                    {social}
                  </span>
                ))}
              </div>
            </Card>
          </motion.div>

          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2"
          >
            <Card className="p-6 md:p-8">
              {submitted ? (
                <div className="text-center py-12">
                  <div className="text-5xl mb-4">✅</div>
                  <h2 className="text-2xl font-bold text-foreground mb-2">Message Sent!</h2>
                  <p className="text-muted mb-6">We&apos;ll get back to you within 24-48 hours.</p>
                  <Button onClick={() => { setSubmitted(false); setForm({ name: '', email: '', subject: '', message: '' }); }}>
                    Send Another Message
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <Input label="Full Name" placeholder="Your name" required value={form.name} onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))} />
                    <Input label="Email Address" type="email" placeholder="you@example.com" required value={form.email} onChange={(e) => setForm(p => ({ ...p, email: e.target.value }))} />
                  </div>
                  <Input label="Subject" placeholder="What is this about?" required value={form.subject} onChange={(e) => setForm(p => ({ ...p, subject: e.target.value }))} />
                  <Textarea label="Message" placeholder="Tell us more..." rows={6} required value={form.message} onChange={(e) => setForm(p => ({ ...p, message: e.target.value }))} />
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'Sending...' : 'Send Message'}
                  </Button>
                </form>
              )}
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
