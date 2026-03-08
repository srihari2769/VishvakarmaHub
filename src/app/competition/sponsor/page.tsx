'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Button, Input, Card } from '@/components/ui';
import Link from 'next/link';
import {
  StarIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
  BuildingOffice2Icon,
  UserIcon,
  PhoneIcon,
  EnvelopeIcon,
  GlobeAltIcon,
} from '@heroicons/react/24/outline';

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Razorpay: any;
  }
}

const TIER_LABELS: Record<string, string> = {
  TITLE: 'Title Sponsor',
  PLATINUM: 'Platinum Sponsor',
  GOLD: 'Gold Sponsor',
  SILVER: 'Silver Sponsor',
  STARTUP_PARTNER: 'Startup Partner',
  INNOVATION_PARTNER: 'Innovation Partner',
  COMMUNITY_PARTNER: 'Community Partner',
  STAGE: 'Stage Sponsor',
  MEDIA: 'Media Sponsor',
  AWARD: 'Award Sponsor',
};

const TIER_COLORS: Record<string, { text: string; border: string; bg: string }> = {
  TITLE: { text: 'text-yellow-400', border: 'border-yellow-400/30', bg: 'bg-yellow-400/10' },
  PLATINUM: { text: 'text-purple', border: 'border-purple/30', bg: 'bg-purple/10' },
  GOLD: { text: 'text-orange-400', border: 'border-orange-400/30', bg: 'bg-orange-400/10' },
  SILVER: { text: 'text-gray-300', border: 'border-gray-300/20', bg: 'bg-gray-300/10' },
  STARTUP_PARTNER: { text: 'text-blue-400', border: 'border-blue-400/20', bg: 'bg-blue-400/10' },
  INNOVATION_PARTNER: { text: 'text-green-400', border: 'border-green-400/20', bg: 'bg-green-400/10' },
  COMMUNITY_PARTNER: { text: 'text-pink-400', border: 'border-pink-400/20', bg: 'bg-pink-400/10' },
  STAGE: { text: 'text-cyan-400', border: 'border-cyan-400/20', bg: 'bg-cyan-400/10' },
  MEDIA: { text: 'text-red-400', border: 'border-red-400/20', bg: 'bg-red-400/10' },
  AWARD: { text: 'text-yellow-400', border: 'border-yellow-400/20', bg: 'bg-yellow-400/10' },
};

interface SponsorData {
  sponsorId: string;
  companyName: string;
  contactPerson: string;
  designation: string;
  email: string;
  phone: string;
  tier: string;
  amount: number;
}

function SponsorRegistrationContent() {
  const searchParams = useSearchParams();
  const tierParam = searchParams.get('tier') || 'TITLE';

  const [tier, setTier] = useState(tierParam);
  const [companyName, setCompanyName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [designation, setDesignation] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [website, setWebsite] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [tierPrice, setTierPrice] = useState<number | null>(null);
  const [competitionName, setCompetitionName] = useState('');
  const [sponsorData, setSponsorData] = useState<SponsorData | null>(null);

  // Fetch tier price
  useEffect(() => {
    setTier(tierParam);
    async function fetchTierInfo() {
      try {
        const res = await fetch(`/api/competition/sponsor?tier=${tierParam}`);
        const data = await res.json();
        if (data.success) {
          setTierPrice(data.data.price);
          setCompetitionName(data.data.competitionName);
        }
      } catch { /* ignore */ }
    }
    fetchTierInfo();
  }, [tierParam]);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!companyName.trim()) errs.companyName = 'Company/Organization name is required';
    if (!contactPerson.trim()) errs.contactPerson = 'Contact person name is required';
    if (!designation.trim()) errs.designation = 'Designation is required';
    if (!email.trim()) errs.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) errs.email = 'Invalid email address';
    if (!phone.trim()) errs.phone = 'Phone number is required';
    else if (!/^\+?\d{10,13}$/.test(phone.replace(/\s/g, ''))) errs.phone = 'Invalid phone number';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);

    try {
      const res = await fetch('/api/competition/sponsor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tier,
          companyName: companyName.trim(),
          contactPerson: contactPerson.trim(),
          designation: designation.trim(),
          email: email.trim(),
          phone: phone.trim(),
          website: website.trim() || undefined,
          gstNumber: gstNumber.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        setErrors({ form: data.error || 'Something went wrong' });
        setLoading(false);
        return;
      }

      // Open Razorpay
      const options = {
        key: data.data.keyId,
        amount: data.data.amount * 100,
        currency: data.data.currency,
        name: 'Vishvakarma Hub',
        description: `${data.data.tierLabel} — ${data.data.competitionName}`,
        order_id: data.data.orderId,
        prefill: data.data.prefill,
        theme: { color: '#6C63FF' },
        handler: async (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
          try {
            const verifyRes = await fetch('/api/competition/sponsor', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                registrationId: data.data.registrationId,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });
            const verifyData = await verifyRes.json();
            if (verifyData.success) {
              setSponsorData({
                sponsorId: data.data.sponsorId,
                companyName: companyName.trim(),
                contactPerson: contactPerson.trim(),
                designation: designation.trim(),
                email: email.trim(),
                phone: phone.trim(),
                tier,
                amount: data.data.amount,
              });
            }
          } catch {
            setErrors({ form: 'Payment verification failed. Please contact support.' });
          }
          setLoading(false);
        },
        modal: {
          ondismiss: () => setLoading(false),
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch {
      setErrors({ form: 'Failed to initiate payment. Please try again.' });
      setLoading(false);
    }
  };

  const colors = TIER_COLORS[tier] || TIER_COLORS.TITLE;

  // Success Screen
  if (sponsorData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-lg">
          <Card className={`p-8 ${colors.border} text-center`}>
            <div className={`w-20 h-20 rounded-full ${colors.bg} flex items-center justify-center mx-auto mb-6`}>
              <CheckCircleIcon className={`w-10 h-10 ${colors.text}`} />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">Sponsorship Confirmed!</h1>
            <p className="text-muted mb-6">Thank you for sponsoring {competitionName}. Your support fuels innovation.</p>

            <div className={`border ${colors.border} rounded-xl p-6 text-left space-y-3 mb-6`}>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted">Sponsor ID</span>
                <span className={`font-mono font-bold text-sm ${colors.text}`}>{sponsorData.sponsorId}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted">Package</span>
                <span className="text-sm font-medium text-foreground">{TIER_LABELS[sponsorData.tier]}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted">Company</span>
                <span className="text-sm font-medium text-foreground">{sponsorData.companyName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted">Contact</span>
                <span className="text-sm text-foreground">{sponsorData.contactPerson}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted">Amount Paid</span>
                <span className="text-sm font-bold text-green-400">₹{sponsorData.amount.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <p className="text-xs text-muted mb-6">Our team will reach out within 48 hours with onboarding details and branding guidelines.</p>

            <Link href="/competition">
              <Button size="lg" className="w-full">
                <ArrowLeftIcon className="w-4 h-4 mr-2 inline" />
                Back to Competition
              </Button>
            </Link>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-3">
          <Link href="/competition" className="text-muted hover:text-foreground transition-colors">
            <ArrowLeftIcon className="w-5 h-5" />
          </Link>
          <div>
            <p className="text-xs text-muted">Vishvakarma Innovation Challenge 2026</p>
            <h1 className="text-xl font-bold text-foreground">Become a Sponsor</h1>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Form */}
          <div className="lg:col-span-2 space-y-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="p-6">
                <h2 className="text-lg font-bold text-foreground mb-1">Sponsor Package</h2>
                <p className="text-sm text-muted mb-4">Select your sponsorship tier</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {Object.entries(TIER_LABELS).map(([key, label]) => {
                    const c = TIER_COLORS[key];
                    return (
                      <button
                        key={key}
                        onClick={() => {
                          setTier(key);
                          // Fetch updated price for this tier
                          fetch(`/api/competition/sponsor?tier=${key}`)
                            .then(r => r.json())
                            .then(d => { if (d.success) setTierPrice(d.data.price); })
                            .catch(() => {});
                        }}
                        className={`px-3 py-2.5 rounded-xl border text-xs font-medium transition-all ${
                          tier === key
                            ? `${c.border} ${c.bg} ${c.text} border-2`
                            : 'border-border text-muted hover:border-border/60'
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <Card className="p-6 space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <BuildingOffice2Icon className="w-5 h-5 text-muted" />
                  <h2 className="text-lg font-bold text-foreground">Organization Details</h2>
                </div>

                <Input
                  label="Company / Organization Name *"
                  placeholder="Acme Corp Pvt Ltd"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  error={errors.companyName}
                />

                <Input
                  label="GST Number (Optional)"
                  placeholder="22AAAAA0000A1Z5"
                  value={gstNumber}
                  onChange={(e) => setGstNumber(e.target.value)}
                />

                <Input
                  label="Website (Optional)"
                  placeholder="https://yourcompany.com"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                />
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <Card className="p-6 space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <UserIcon className="w-5 h-5 text-muted" />
                  <h2 className="text-lg font-bold text-foreground">Contact Person</h2>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <Input
                    label="Full Name *"
                    placeholder="John Doe"
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    error={errors.contactPerson}
                  />
                  <Input
                    label="Designation *"
                    placeholder="CEO / Marketing Head"
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                    error={errors.designation}
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">
                      <EnvelopeIcon className="w-4 h-4 inline mr-1" /> Email *
                    </label>
                    <Input
                      type="email"
                      placeholder="contact@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      error={errors.email}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">
                      <PhoneIcon className="w-4 h-4 inline mr-1" /> Phone *
                    </label>
                    <Input
                      type="tel"
                      placeholder="9876543210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      error={errors.phone}
                    />
                  </div>
                </div>
              </Card>
            </motion.div>

            {errors.form && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-center">
                <p className="text-red-400 text-sm">{errors.form}</p>
              </div>
            )}
          </div>

          {/* Sidebar Summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                <Card className={`p-6 ${colors.border}`}>
                  <div className={`w-14 h-14 rounded-2xl ${colors.bg} flex items-center justify-center mb-4`}>
                    <StarIcon className={`w-7 h-7 ${colors.text}`} />
                  </div>
                  <h3 className={`text-lg font-bold ${colors.text} mb-1`}>{TIER_LABELS[tier]}</h3>
                  <p className="text-sm text-muted mb-4">{competitionName || 'Vishvakarma Innovation Challenge 2026'}</p>

                  <div className="border-t border-border pt-4 mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-muted">Sponsorship Fee</span>
                      <span className={`text-2xl font-bold ${colors.text}`}>
                        {tierPrice !== null ? `₹${tierPrice.toLocaleString('en-IN')}` : '...'}
                      </span>
                    </div>
                  </div>

                  <Button
                    size="lg"
                    className="w-full"
                    onClick={handleSubmit}
                    disabled={loading}
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                        Processing...
                      </span>
                    ) : (
                      <>Pay & Confirm Sponsorship</>
                    )}
                  </Button>

                  <div className="mt-4 space-y-2 text-xs text-muted">
                    <div className="flex items-start gap-2">
                      <GlobeAltIcon className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                      <span>Your brand will be featured across event materials</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircleIcon className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                      <span>Our team will contact you within 48 hours for onboarding</span>
                    </div>
                  </div>
                </Card>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SponsorRegistrationPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0B0F1A] flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-400" /></div>}>
      <SponsorRegistrationContent />
    </Suspense>
  );
}
