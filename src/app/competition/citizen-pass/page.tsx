'use client';

import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Button, Input, Select, Card } from '@/components/ui';
import Link from 'next/link';
import {
  TicketIcon,
  ArrowLeftIcon,
  ShieldCheckIcon,
  IdentificationIcon,
} from '@heroicons/react/24/outline';

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Razorpay: any;
  }
}

interface PassData {
  passNumber: string;
  name: string;
  phone: string;
  email?: string;
  idProofType: string;
  fee: number;
}

const ID_PROOF_OPTIONS = [
  { value: '', label: 'Select ID Proof Type' },
  { value: 'AADHAAR', label: 'Aadhaar Card' },
  { value: 'PAN', label: 'PAN Card' },
  { value: 'VOTER', label: 'Voter ID Card' },
];

const ID_PROOF_LABELS: Record<string, string> = {
  AADHAAR: 'Aadhaar Card',
  PAN: 'PAN Card',
  VOTER: 'Voter ID Card',
};

export default function CitizenEntryPage() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [idProofType, setIdProofType] = useState('');
  const [idProofNumber, setIdProofNumber] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [passData, setPassData] = useState<PassData | null>(null);
  const passRef = useRef<HTMLDivElement>(null);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = 'Name is required';
    if (!phone.trim()) newErrors.phone = 'Phone number is required';
    else if (!/^\+?\d{10,13}$/.test(phone.replace(/\s/g, ''))) newErrors.phone = 'Enter a valid phone number';
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = 'Enter a valid email';
    if (!idProofType) newErrors.idProofType = 'Select an ID proof type';
    if (!idProofNumber.trim()) newErrors.idProofNumber = 'ID proof number is required';
    else {
      const idClean = idProofNumber.trim();
      if (idProofType === 'AADHAAR' && !/^\d{12}$/.test(idClean)) newErrors.idProofNumber = 'Aadhaar must be 12 digits';
      if (idProofType === 'PAN' && !/^[A-Za-z]{5}\d{4}[A-Za-z]$/.test(idClean)) newErrors.idProofNumber = 'Invalid PAN format (e.g., ABCDE1234F)';
      if (idProofType === 'VOTER' && idClean.length < 6) newErrors.idProofNumber = 'Invalid Voter ID';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setIsSubmitting(true);
    setSubmitError('');

    try {
      const res = await fetch('/api/competition/citizen-pass', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, email: email || undefined, idProofType, idProofNumber: idProofNumber.trim() }),
      });

      const data = await res.json();
      if (!data.success) {
        setSubmitError(data.error || 'Failed to create order');
        setIsSubmitting(false);
        return;
      }

      const d = data.data;

      // Open Razorpay checkout
      const options = {
        key: d.keyId,
        amount: d.amount * 100,
        currency: d.currency,
        name: 'Vishvakarma Hub',
        description: `Citizens Entry Pass — ${d.competitionName}`,
        order_id: d.orderId,
        prefill: d.prefill,
        handler: async (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
          // Verify payment
          const verifyRes = await fetch('/api/competition/citizen-pass', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              passId: d.passId,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            }),
          });

          const verifyData = await verifyRes.json();
          if (verifyData.success) {
            setPassData({
              passNumber: d.passNumber,
              name,
              phone,
              email: email || undefined,
              idProofType,
              fee: d.amount,
            });
          } else {
            setSubmitError('Payment verification failed. Contact support.');
          }
        },
        theme: { color: '#6366f1' },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error(err);
      setSubmitError('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Event Pass view
  if (passData) {
    return (
      <div className="min-h-screen bg-background pt-24 pb-16 px-4">
        <div className="max-w-lg mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            {/* Event Pass Card */}
            <div ref={passRef} className="bg-gradient-to-br from-[#111827] to-[#1a1f36] rounded-3xl border border-indigo-500/30 overflow-hidden shadow-2xl shadow-indigo-500/10">
              {/* Pass Header */}
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4 text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <TicketIcon className="w-5 h-5 text-white/80" />
                  <span className="text-xs font-bold uppercase tracking-[0.2em] text-white/80">Event Entry Pass</span>
                </div>
                <h2 className="text-xl font-black text-white">Vishvakarma Innovation Challenge 2026</h2>
              </div>

              {/* Pass Number */}
              <div className="text-center py-4 border-b border-white/10">
                <span className="text-xs text-muted uppercase tracking-wider">Pass Number</span>
                <p className="text-2xl font-mono font-black text-indigo-400 tracking-wider mt-1">{passData.passNumber}</p>
              </div>

              {/* User Details */}
              <div className="px-6 py-5 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted uppercase tracking-wider">Name</span>
                  <span className="text-foreground font-bold text-sm">{passData.name}</span>
                </div>
                <div className="border-t border-white/5" />
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted uppercase tracking-wider">Phone</span>
                  <span className="text-foreground font-medium text-sm">{passData.phone}</span>
                </div>
                {passData.email && (
                  <>
                    <div className="border-t border-white/5" />
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted uppercase tracking-wider">Email</span>
                      <span className="text-foreground font-medium text-sm">{passData.email}</span>
                    </div>
                  </>
                )}
                <div className="border-t border-white/5" />
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted uppercase tracking-wider">ID Proof</span>
                  <span className="text-foreground font-medium text-sm">{ID_PROOF_LABELS[passData.idProofType] || passData.idProofType}</span>
                </div>
                <div className="border-t border-white/5" />
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted uppercase tracking-wider">Entry Fee</span>
                  <span className="text-green-400 font-bold text-sm">₹{passData.fee} PAID ✓</span>
                </div>
              </div>

              {/* Instructions */}
              <div className="mx-6 mb-5 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                <div className="flex items-start gap-2">
                  <ShieldCheckIcon className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-200/80 leading-relaxed">
                    Please bring your original <strong className="text-amber-300">{ID_PROOF_LABELS[passData.idProofType]}</strong> and show it along with this entry pass at the security checkpoint.
                  </p>
                </div>
              </div>

              {/* Stamp / Branding */}
              <div className="border-t border-white/10 px-6 py-5 text-center relative">
                <div className="inline-flex flex-col items-center">
                  <img src="/Stamp.png" alt="VH 2026 Verified Stamp" className="w-28 h-28 object-contain opacity-80" />
                  <p className="text-[10px] text-muted/60 mt-3">
                    An initiative by <span className="text-foreground/70 font-medium">Trinetrashakti Innovations Pvt Ltd</span>
                  </p>
                  <p className="text-[9px] text-muted/40">Startup India Recognized</p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
              <Link href="/competition">
                <Button size="lg">View Competition</Button>
              </Link>
              <Button
                variant="outline"
                size="lg"
                onClick={() => {
                  if (passRef.current) {
                    const printWindow = window.open('', '_blank');
                    if (printWindow) {
                      const html = passRef.current.outerHTML.replace('/Stamp.png', `${window.location.origin}/Stamp.png`);
                      printWindow.document.write(`
                        <html><head><title>Entry Pass - ${passData.passNumber}</title>
                        <style>
                          body { margin: 0; padding: 40px; background: #0B0F1A; display: flex; justify-content: center; }
                          @media print { body { background: white; } }
                        </style></head><body>
                        ${html}
                        <script>setTimeout(() => window.print(), 500);</script>
                        </body></html>
                      `);
                      printWindow.document.close();
                    }
                  }
                }}
              >
                Print / Save Pass
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-16 px-4">
      <div className="max-w-lg mx-auto">
        {/* Back link */}
        <Link href="/competition" className="inline-flex items-center text-sm text-muted hover:text-foreground mb-6 transition-colors">
          <ArrowLeftIcon className="w-4 h-4 mr-1" /> Back to Competition
        </Link>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium mb-4">
              <TicketIcon className="w-4 h-4" />
              Citizens Entry Pass
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Get Your Entry Pass</h1>
            <p className="text-muted">Attend the Vishvakarma Innovation Challenge 2026 as a visitor</p>
            <p className="text-2xl font-bold text-green-400 mt-3">₹99 Only</p>
          </div>

          <Card className="p-6 md:p-8">
            <div className="flex items-center gap-2 mb-6">
              <IdentificationIcon className="w-5 h-5 text-blue" />
              <h2 className="text-lg font-semibold text-foreground">Your Details</h2>
            </div>

            <div className="space-y-4">
              <Input
                label="Full Name"
                value={name}
                onChange={(e) => { setName(e.target.value); setErrors((p) => ({ ...p, name: '' })); }}
                error={errors.name}
                placeholder="Enter your full name"
              />
              <Input
                label="Phone Number"
                type="tel"
                value={phone}
                onChange={(e) => { setPhone(e.target.value); setErrors((p) => ({ ...p, phone: '' })); }}
                error={errors.phone}
                placeholder="e.g., 9876543210"
              />
              <Input
                label="Email Address (optional)"
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setErrors((p) => ({ ...p, email: '' })); }}
                error={errors.email}
                placeholder="you@example.com"
              />
              <Select
                label="ID Proof Type"
                value={idProofType}
                onChange={(e) => { setIdProofType(e.target.value); setErrors((p) => ({ ...p, idProofType: '' })); }}
                error={errors.idProofType}
                options={ID_PROOF_OPTIONS}
              />
              <Input
                label="ID Proof Number"
                value={idProofNumber}
                onChange={(e) => { setIdProofNumber(e.target.value); setErrors((p) => ({ ...p, idProofNumber: '' })); }}
                error={errors.idProofNumber}
                placeholder={
                  idProofType === 'AADHAAR' ? 'Enter 12-digit Aadhaar number' :
                  idProofType === 'PAN' ? 'Enter PAN (e.g., ABCDE1234F)' :
                  idProofType === 'VOTER' ? 'Enter Voter ID number' :
                  'Select ID proof type first'
                }
              />
            </div>

            {/* Important Note */}
            <div className="mt-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
              <div className="flex items-start gap-2">
                <ShieldCheckIcon className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-amber-200/80 font-medium mb-1">Important</p>
                  <p className="text-xs text-amber-200/60 leading-relaxed">
                    You must bring your original ID proof to the event. The ID proof and entry pass will be verified at the security checkpoint.
                  </p>
                </div>
              </div>
            </div>

            {submitError && (
              <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm text-center">
                {submitError}
              </div>
            )}

            <Button className="w-full mt-6" size="lg" onClick={handleSubmit} isLoading={isSubmitting}>
              Pay ₹99 & Get Entry Pass
            </Button>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
