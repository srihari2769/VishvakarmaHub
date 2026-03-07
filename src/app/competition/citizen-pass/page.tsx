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
import html2canvas from 'html2canvas-pro';

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

  const downloadPass = async () => {
    if (!passRef.current) return;
    try {
      const canvas = await html2canvas(passRef.current, {
        backgroundColor: '#0B0F1A',
        scale: 2,
        useCORS: true,
      });
      const link = document.createElement('a');
      link.download = `Entry-Pass-${passData?.passNumber || 'VH'}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('Download failed:', err);
    }
  };

  // Event Pass view
  if (passData) {
    return (
      <div className="min-h-screen bg-background pt-24 pb-16 px-4">
        <div className="max-w-2xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            {/* Ticket-style Entry Pass */}
            <div ref={passRef} className="flex rounded-2xl overflow-hidden shadow-2xl shadow-indigo-500/10 border border-indigo-500/20" style={{ minHeight: 320 }}>
              {/* Left Stub (Red) */}
              <div className="relative w-24 sm:w-28 flex-shrink-0 bg-gradient-to-b from-red-600 to-red-700 flex flex-col items-center justify-between py-6 px-2">
                {/* Perforated edge (right side of stub) */}
                <div className="absolute right-0 top-0 bottom-0 flex flex-col justify-between py-2">
                  {Array.from({ length: 14 }).map((_, i) => (
                    <div key={i} className="w-3 h-3 rounded-full bg-[#0B0F1A]" style={{ marginRight: -6 }} />
                  ))}
                </div>

                {/* Rotated Pass Number */}
                <div className="flex-1 flex items-center justify-center">
                  <span className="text-white font-mono font-bold text-xs tracking-wider" style={{ writingMode: 'vertical-rl', textOrientation: 'mixed', transform: 'rotate(180deg)' }}>
                    {passData.passNumber}
                  </span>
                </div>

                {/* Barcode-style lines */}
                <div className="flex gap-[2px] mt-3">
                  {Array.from({ length: 16 }).map((_, i) => (
                    <div key={i} className="bg-white/90" style={{ width: i % 3 === 0 ? 3 : 1.5, height: 40 + (i % 4) * 5 }} />
                  ))}
                </div>
              </div>

              {/* Main Ticket Body (Dark) */}
              <div className="flex-1 bg-gradient-to-br from-[#0f1729] to-[#1a1f36] flex flex-col">
                {/* Ticket header border */}
                <div className="mx-5 mt-5 mb-3 border-2 border-red-500/60 rounded-xl p-4">
                  {/* Top row */}
                  <div className="text-center">
                    <h2 className="text-2xl sm:text-3xl font-black tracking-wider" style={{ color: '#d4a843', fontFamily: 'Georgia, serif' }}>
                      ENTRY PASS
                    </h2>
                    <div className="flex items-center justify-center gap-2 mt-1">
                      <div className="h-[1px] w-12 bg-gradient-to-r from-transparent to-[#d4a843]" />
                      <span className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: '#d4a843' }}>Vishvakarma Innovation Challenge 2026</span>
                      <div className="h-[1px] w-12 bg-gradient-to-l from-transparent to-[#d4a843]" />
                    </div>
                  </div>

                  {/* Pass number badge */}
                  <div className="flex justify-center mt-3">
                    <div className="bg-[#1a1f36] border border-[#d4a843]/50 px-4 py-1 rounded">
                      <span className="text-xs font-mono font-bold tracking-widest" style={{ color: '#d4a843' }}>{passData.passNumber}</span>
                    </div>
                  </div>

                  {/* ADMIT ONE */}
                  <p className="text-center mt-2 text-sm font-bold uppercase tracking-[0.3em]" style={{ color: '#d4a843', fontFamily: 'Georgia, serif' }}>
                    Admit One
                  </p>
                </div>

                {/* User Details */}
                <div className="px-5 py-3 space-y-2 flex-1">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-muted uppercase tracking-wider font-medium">Name</span>
                    <span className="text-foreground font-bold text-sm">{passData.name}</span>
                  </div>
                  <div className="border-t border-white/5" />
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-muted uppercase tracking-wider font-medium">Phone</span>
                    <span className="text-foreground font-medium text-sm">{passData.phone}</span>
                  </div>
                  {passData.email && (
                    <>
                      <div className="border-t border-white/5" />
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] text-muted uppercase tracking-wider font-medium">Email</span>
                        <span className="text-foreground font-medium text-sm">{passData.email}</span>
                      </div>
                    </>
                  )}
                  <div className="border-t border-white/5" />
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-muted uppercase tracking-wider font-medium">ID Proof</span>
                    <span className="text-foreground font-medium text-sm">{ID_PROOF_LABELS[passData.idProofType] || passData.idProofType}</span>
                  </div>
                  <div className="border-t border-white/5" />
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-muted uppercase tracking-wider font-medium">Entry Fee</span>
                    <span className="text-green-400 font-bold text-sm">₹{passData.fee} PAID ✓</span>
                  </div>
                </div>

                {/* ID Warning */}
                <div className="mx-5 mb-3 p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                  <div className="flex items-start gap-2">
                    <ShieldCheckIcon className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                    <p className="text-[10px] text-amber-200/80 leading-relaxed">
                      Bring your original <strong className="text-amber-300">{ID_PROOF_LABELS[passData.idProofType]}</strong> to the venue for verification.
                    </p>
                  </div>
                </div>

                {/* Footer with stamp */}
                <div className="border-t border-white/10 px-5 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-[9px] text-muted/60">
                      An initiative by <span className="text-foreground/70 font-medium">Trinetrashakti Innovations Pvt Ltd</span>
                    </p>
                    <p className="text-[8px] text-muted/40">Startup India Recognized</p>
                  </div>
                  <img src="/Stamp.png" alt="Verified Stamp" className="w-16 h-16 object-contain opacity-70" />
                </div>
              </div>

              {/* Right edge - serrated */}
              <div className="w-4 flex-shrink-0 bg-gradient-to-b from-[#0f1729] to-[#1a1f36] relative">
                <div className="absolute right-0 top-0 bottom-0 flex flex-col justify-between py-2">
                  {Array.from({ length: 14 }).map((_, i) => (
                    <div key={i} className="w-3 h-3 rounded-full bg-[#0B0F1A]" style={{ marginRight: -6 }} />
                  ))}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
              <Link href="/competition">
                <Button size="lg">View Competition</Button>
              </Link>
              <Button variant="outline" size="lg" onClick={downloadPass}>
                Download Entry Pass
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
