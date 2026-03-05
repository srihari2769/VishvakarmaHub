'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Button, Input, Textarea, Select, MultiSelect, Card } from '@/components/ui';
import { useAuthStore } from '@/store/authStore';
import { CATEGORIES } from '@/lib/utils';
import {
  LightBulbIcon,
  ExclamationTriangleIcon,
  BeakerIcon,
  RocketLaunchIcon,
  PhotoIcon,
  CurrencyRupeeIcon,
  CheckIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';

const STEPS = [
  { label: 'Idea Basics', icon: LightBulbIcon },
  { label: 'Problem Statement', icon: ExclamationTriangleIcon },
  { label: 'Solution', icon: BeakerIcon },
  { label: 'Product Stage', icon: RocketLaunchIcon },
  { label: 'Media', icon: PhotoIcon },
  { label: 'Funding', icon: CurrencyRupeeIcon },
];

const PRODUCT_STAGES = [
  { value: 'IDEA', label: 'Idea Stage' },
  { value: 'CONCEPT', label: 'Concept / Research' },
  { value: 'PROTOTYPE', label: 'Prototype' },
  { value: 'MVP', label: 'Minimum Viable Product' },
  { value: 'BETA', label: 'Beta / Early Access' },
  { value: 'LAUNCHED', label: 'Launched / Market Ready' },
  { value: 'GROWTH', label: 'Growth Stage' },
];

interface FormData {
  title: string;
  shortDescription: string;
  categories: string[];
  location: string;
  problemDescription: string;
  targetAudience: string;
  solutionExplanation: string;
  innovationUniqueness: string;
  productStage: string;
  demoVideo: string;
  fundingGoal: string;
  endDate: string;
  rewardTiers: { name: string; amount: string; description: string; maxClaims: string }[];
}

export default function SubmitIdeaPage() {
  const router = useRouter();
  const { isAuthenticated, checkAuth, isLoading } = useAuthStore();
  const [step, setStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState('');

  const [form, setForm] = useState<FormData>({
    title: '',
    shortDescription: '',
    categories: [],
    location: '',
    problemDescription: '',
    targetAudience: '',
    solutionExplanation: '',
    innovationUniqueness: '',
    productStage: 'IDEA',
    demoVideo: '',
    fundingGoal: '',
    endDate: '',
    rewardTiers: [{ name: 'Early Supporter', amount: '500', description: 'Thank you for your early support!', maxClaims: '' }],
  });

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login?redirect=/submit-idea');
    }
  }, [isLoading, isAuthenticated, router]);

  const updateField = (field: keyof FormData, value: string) => {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field]: '' }));
  };

  const validateStep = (): boolean => {
    const newErrors: Record<string, string> = {};
    switch (step) {
      case 0:
        if (!form.title.trim()) newErrors.title = 'Title is required';
        if (!form.shortDescription.trim()) newErrors.shortDescription = 'Short description is required';
        if (form.categories.length === 0) newErrors.categories = 'Select at least one category';
        if (!form.location.trim()) newErrors.location = 'Location is required';
        break;
      case 1:
        if (!form.problemDescription.trim()) newErrors.problemDescription = 'Problem description is required';
        if (!form.targetAudience.trim()) newErrors.targetAudience = 'Target audience is required';
        break;
      case 2:
        if (!form.solutionExplanation.trim()) newErrors.solutionExplanation = 'Solution is required';
        if (!form.innovationUniqueness.trim()) newErrors.innovationUniqueness = 'Uniqueness is required';
        break;
      case 3:
        if (!form.productStage) newErrors.productStage = 'Select a product stage';
        break;
      case 5:
        if (!form.fundingGoal || Number(form.fundingGoal) < 10000)
          newErrors.fundingGoal = 'Minimum funding goal is ₹10,000';
        if (!form.endDate) newErrors.endDate = 'End date is required';
        break;
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep()) setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const prevStep = () => setStep((s) => Math.max(s - 1, 0));

  const addRewardTier = () => {
    setForm((f) => ({
      ...f,
      rewardTiers: [...f.rewardTiers, { name: '', amount: '', description: '', maxClaims: '' }],
    }));
  };

  const updateRewardTier = (index: number, field: string, value: string) => {
    setForm((f) => ({
      ...f,
      rewardTiers: f.rewardTiers.map((t, i) => (i === index ? { ...t, [field]: value } : t)),
    }));
  };

  const removeRewardTier = (index: number) => {
    setForm((f) => ({ ...f, rewardTiers: f.rewardTiers.filter((_, i) => i !== index) }));
  };

  const handleSubmit = async () => {
    if (!validateStep()) return;
    setIsSubmitting(true);
    setSubmitError('');

    try {
      const token = localStorage.getItem('token');
      const payload = {
        title: form.title,
        shortDescription: form.shortDescription,
        category: form.categories.join(', '),
        location: form.location,
        problemDescription: form.problemDescription,
        targetAudience: form.targetAudience,
        solutionExplanation: form.solutionExplanation,
        innovationUniqueness: form.innovationUniqueness,
        productStage: form.productStage,
        demoVideo: form.demoVideo || undefined,
        fundingGoal: Number(form.fundingGoal),
        endDate: form.endDate,
        rewardTiers: form.rewardTiers
          .filter((t) => t.name && t.amount)
          .map((t) => ({
            name: t.name,
            amount: Number(t.amount),
            description: t.description,
            maxClaims: t.maxClaims ? Number(t.maxClaims) : undefined,
          })),
      };

      const res = await fetch('/api/startups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        router.push(`/startup/${data.data.slug}?submitted=true`);
      } else {
        setSubmitError(data.message || 'Failed to submit');
      }
    } catch {
      setSubmitError('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-blue border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">Submit Your Idea</h1>
          <p className="text-muted">Transform your innovation into reality</p>
        </motion.div>

        {/* Stepper */}
        <div className="flex items-center justify-between mb-10 overflow-x-auto pb-2">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const isActive = i === step;
            const isDone = i < step;
            return (
              <div key={s.label} className="flex items-center">
                <button
                  onClick={() => i < step && setStep(i)}
                  className={`flex flex-col items-center gap-1 min-w-[70px] ${
                    i > step ? 'cursor-default' : 'cursor-pointer'
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                      isDone
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : isActive
                        ? 'bg-blue/20 text-blue'
                        : 'bg-card text-muted'
                    }`}
                  >
                    {isDone ? <CheckIcon className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                  </div>
                  <span className={`text-[10px] ${isActive ? 'text-blue' : 'text-muted'}`}>{s.label}</span>
                </button>
                {i < STEPS.length - 1 && (
                  <div className={`w-8 h-0.5 mx-1 ${i < step ? 'bg-emerald-500' : 'bg-border'}`} />
                )}
              </div>
            );
          })}
        </div>

        {/* Form Steps */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.2 }}
          >
            <Card className="p-6 md:p-8">
              {/* Step 0: Idea Basics */}
              {step === 0 && (
                <div className="space-y-5">
                  <h2 className="text-xl font-semibold text-foreground mb-4">Tell us about your idea</h2>
                  <Input
                    label="Startup / Idea Title"
                    value={form.title}
                    onChange={(e) => updateField('title', e.target.value)}
                    error={errors.title}
                    placeholder="e.g., EcoTrack - Sustainable Delivery Platform"
                  />
                  <Textarea
                    label="Short Description"
                    value={form.shortDescription}
                    onChange={(e) => updateField('shortDescription', e.target.value)}
                    error={errors.shortDescription}
                    placeholder="A brief one-liner about your startup (max 200 characters)"
                    rows={3}
                  />
                  <MultiSelect
                    label="Categories"
                    selected={form.categories}
                    onChange={(selected) => {
                      setForm((f) => ({ ...f, categories: selected }));
                      setErrors((e) => ({ ...e, categories: '' }));
                    }}
                    error={errors.categories}
                    options={CATEGORIES.map((c) => ({ value: c.name, label: `${c.icon} ${c.name}` }))}
                    placeholder="Select categories"
                    maxSelections={5}
                  />
                  <Input
                    label="Location"
                    value={form.location}
                    onChange={(e) => updateField('location', e.target.value)}
                    error={errors.location}
                    placeholder="e.g., Bangalore, India"
                  />
                </div>
              )}

              {/* Step 1: Problem Statement */}
              {step === 1 && (
                <div className="space-y-5">
                  <h2 className="text-xl font-semibold text-foreground mb-4">What problem are you solving?</h2>
                  <Textarea
                    label="Problem Description"
                    value={form.problemDescription}
                    onChange={(e) => updateField('problemDescription', e.target.value)}
                    error={errors.problemDescription}
                    placeholder="Describe the problem your startup aims to solve..."
                    rows={5}
                  />
                  <Textarea
                    label="Target Audience"
                    value={form.targetAudience}
                    onChange={(e) => updateField('targetAudience', e.target.value)}
                    error={errors.targetAudience}
                    placeholder="Who faces this problem? Describe your ideal users..."
                    rows={3}
                  />
                </div>
              )}

              {/* Step 2: Solution */}
              {step === 2 && (
                <div className="space-y-5">
                  <h2 className="text-xl font-semibold text-foreground mb-4">How will you solve it?</h2>
                  <Textarea
                    label="Solution Explanation"
                    value={form.solutionExplanation}
                    onChange={(e) => updateField('solutionExplanation', e.target.value)}
                    error={errors.solutionExplanation}
                    placeholder="Explain your solution in detail..."
                    rows={5}
                  />
                  <Textarea
                    label="What makes your solution unique?"
                    value={form.innovationUniqueness}
                    onChange={(e) => updateField('innovationUniqueness', e.target.value)}
                    error={errors.innovationUniqueness}
                    placeholder="How is your innovation different from existing solutions?"
                    rows={4}
                  />
                </div>
              )}

              {/* Step 3: Product Stage */}
              {step === 3 && (
                <div className="space-y-5">
                  <h2 className="text-xl font-semibold text-foreground mb-4">Where are you in the journey?</h2>
                  <Select
                    label="Product Stage"
                    value={form.productStage}
                    onChange={(e) => updateField('productStage', e.target.value)}
                    error={errors.productStage}
                    options={PRODUCT_STAGES}
                  />
                  <div className="p-4 bg-blue/5 border border-blue/10 rounded-xl">
                    <p className="text-sm text-muted">
                      Your product stage helps supporters understand where you are in development.
                      Be honest — this builds trust with your community.
                    </p>
                  </div>
                </div>
              )}

              {/* Step 4: Media */}
              {step === 4 && (
                <div className="space-y-5">
                  <h2 className="text-xl font-semibold text-foreground mb-4">Showcase your idea</h2>
                  <Input
                    label="Demo Video URL (optional)"
                    value={form.demoVideo}
                    onChange={(e) => updateField('demoVideo', e.target.value)}
                    placeholder="https://youtube.com/watch?v=..."
                  />
                  <div className="border-2 border-dashed border-border rounded-xl p-8 text-center">
                    <PhotoIcon className="w-12 h-12 text-muted mx-auto mb-3" />
                    <p className="text-muted text-sm">File upload coming soon (requires S3 configuration)</p>
                    <p className="text-xs text-muted mt-1">Logo, pitch deck, product screenshots</p>
                  </div>
                </div>
              )}

              {/* Step 5: Funding */}
              {step === 5 && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold text-foreground mb-4">Set your funding goal</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Funding Goal (₹)"
                      type="number"
                      value={form.fundingGoal}
                      onChange={(e) => updateField('fundingGoal', e.target.value)}
                      error={errors.fundingGoal}
                      placeholder="100000"
                    />
                    <Input
                      label="Campaign End Date"
                      type="date"
                      value={form.endDate}
                      onChange={(e) => updateField('endDate', e.target.value)}
                      error={errors.endDate}
                    />
                  </div>

                  {/* Reward Tiers */}
                  <div>
                    <h3 className="font-medium text-foreground mb-3">Reward Tiers</h3>
                    {form.rewardTiers.map((tier, idx) => (
                      <div key={idx} className="border border-border rounded-xl p-4 mb-3">
                        <div className="flex justify-between items-center mb-3">
                          <span className="text-sm font-medium text-muted">Tier {idx + 1}</span>
                          {idx > 0 && (
                            <button
                              onClick={() => removeRewardTier(idx)}
                              className="text-xs text-red-400 hover:text-red-300"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-3 mb-2">
                          <Input
                            label="Tier Name"
                            value={tier.name}
                            onChange={(e) => updateRewardTier(idx, 'name', e.target.value)}
                            placeholder="e.g., Early Bird"
                          />
                          <Input
                            label="Amount (₹)"
                            type="number"
                            value={tier.amount}
                            onChange={(e) => updateRewardTier(idx, 'amount', e.target.value)}
                            placeholder="500"
                          />
                        </div>
                        <Input
                          label="Description"
                          value={tier.description}
                          onChange={(e) => updateRewardTier(idx, 'description', e.target.value)}
                          placeholder="What supporters get at this tier"
                        />
                        <Input
                          label="Max Claims (optional)"
                          type="number"
                          value={tier.maxClaims}
                          onChange={(e) => updateRewardTier(idx, 'maxClaims', e.target.value)}
                          placeholder="Leave empty for unlimited"
                          className="mt-2"
                        />
                      </div>
                    ))}
                    <button
                      onClick={addRewardTier}
                      className="text-sm text-blue hover:text-blue/80 font-medium"
                    >
                      + Add Another Tier
                    </button>
                  </div>
                </div>
              )}
            </Card>
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        {submitError && (
          <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm text-center">
            {submitError}
          </div>
        )}

        <div className="flex justify-between mt-6">
          <Button variant="ghost" onClick={prevStep} disabled={step === 0}>
            <ArrowLeftIcon className="w-4 h-4 mr-1" /> Back
          </Button>

          {step < STEPS.length - 1 ? (
            <Button onClick={nextStep}>
              Next <ArrowRightIcon className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} isLoading={isSubmitting}>
              Submit Idea
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
