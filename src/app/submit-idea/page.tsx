'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Button, Input, Textarea, Select, MultiSelect, FileUpload, Card } from '@/components/ui';
import { useAuthStore } from '@/store/authStore';
import { CATEGORIES } from '@/lib/utils';
import {
  LightBulbIcon,
  ExclamationTriangleIcon,
  BeakerIcon,
  RocketLaunchIcon,
  PhotoIcon,
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

interface UploadedFile {
  url: string;
  name: string;
  size: number;
  type: string;
}

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
  logo: UploadedFile[];
  thumbnail: UploadedFile[];
  pitchDeck: UploadedFile[];
  screenshots: UploadedFile[];
  fundingGoal: string;
  endDate: string;
  rewardTiers: { name: string; amount: string; description: string; maxClaims: string }[];
  lookingForCofounder: boolean;
  cofounderRoles: string[];
}

export default function SubmitIdeaPage() {
  const router = useRouter();
  const { isAuthenticated, checkAuth, isLoading } = useAuthStore();
  const STORAGE_KEY = 'vishvakarma_submit_idea_draft';

  const defaultForm: FormData = {
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
    logo: [],
    thumbnail: [],
    pitchDeck: [],
    screenshots: [],
    fundingGoal: '',
    endDate: '',
    rewardTiers: [{ name: 'Early Supporter', amount: '500', description: 'Thank you for your early support!', maxClaims: '' }],
    lookingForCofounder: false,
    cofounderRoles: [],
  };

  const [step, setStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState('');
  const [form, setForm] = useState<FormData>(defaultForm);

  // Load saved draft on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.form) setForm(parsed.form);
        if (typeof parsed.step === 'number') setStep(parsed.step);
      }
    } catch {
      // ignore corrupted data
    }
  }, []);

  // Save draft on every form/step change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ form, step }));
    } catch {
      // storage full or unavailable
    }
  }, [form, step]);

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
      const logoUrl = form.logo[0]?.url;
      const thumbnailUrl = form.thumbnail[0]?.url;
      const pitchDeckUrl = form.pitchDeck[0]?.url;
      const screenshotUrls = form.screenshots.map((f) => f.url);

      // Reject base64 data URLs — they bloat the payload and cause 413 errors
      const allUrls = [logoUrl, thumbnailUrl, pitchDeckUrl, ...screenshotUrls].filter(Boolean);
      if (allUrls.some((u) => u?.startsWith('data:'))) {
        setSubmitError('Some files failed to upload properly. Please re-upload your files and try again.');
        setIsSubmitting(false);
        return;
      }

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
        logo: logoUrl || undefined,
        thumbnail: thumbnailUrl || undefined,
        pitchDeck: pitchDeckUrl || undefined,
        screenshots: screenshotUrls,
        fundingGoal: Number(form.fundingGoal),
        endDate: form.endDate,
        lookingForCofounder: form.lookingForCofounder,
        cofounderRoles: form.cofounderRoles,
        rewardTiers: form.rewardTiers
          .filter((t) => t.name && t.amount)
          .map((t) => ({
            name: t.name,
            amount: Number(t.amount),
            description: t.description,
            maxClaims: t.maxClaims ? Number(t.maxClaims) : undefined,
          })),
      };

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 25000);

      const res = await fetch('/api/startups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        console.error('Non-JSON response:', text.substring(0, 200));
        setSubmitError(res.status === 504 ? 'Server timed out. Please try again.' : `Server error (${res.status}). Please try again.`);
        return;
      }
      if (data.success) {
        localStorage.removeItem(STORAGE_KEY);
        router.push(`/startup/${data.data.slug}?submitted=true`);
      } else {
        setSubmitError(data.error || data.message || 'Failed to submit');
      }
    } catch (err) {
      console.error('Submit error:', err);
      if (err instanceof DOMException && err.name === 'AbortError') {
        setSubmitError('Request timed out. Please try again — the server may be starting up.');
      } else {
        setSubmitError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      }
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
                      Your product stage helps the community understand where you are in development.
                      Be honest — this builds trust with your community.
                    </p>
                  </div>

                  {/* Co-founder Section */}
                  <div className="pt-4 border-t border-border">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.lookingForCofounder}
                        onChange={(e) => setForm((f) => ({ ...f, lookingForCofounder: e.target.checked }))}
                        className="w-5 h-5 rounded border-border text-blue focus:ring-blue bg-card"
                      />
                      <div>
                        <span className="text-foreground font-medium">Looking for a co-founder?</span>
                        <p className="text-xs text-muted">Your startup will appear on the Co-Founders page for people to discover</p>
                      </div>
                    </label>

                    {form.lookingForCofounder && (
                      <div className="mt-4">
                        <label className="block text-sm font-medium text-foreground mb-2">Roles you need</label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {['Developer', 'Designer', 'Marketer', 'Business Strategist', 'Sales', 'Operations', 'Data Scientist', 'Product Manager', 'Finance'].map((role) => (
                            <label key={role} className="flex items-center gap-2 p-2 rounded-lg border border-border hover:border-blue/30 cursor-pointer transition-colors">
                              <input
                                type="checkbox"
                                checked={form.cofounderRoles.includes(role)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setForm((f) => ({ ...f, cofounderRoles: [...f.cofounderRoles, role] }));
                                  } else {
                                    setForm((f) => ({ ...f, cofounderRoles: f.cofounderRoles.filter((r) => r !== role) }));
                                  }
                                }}
                                className="w-4 h-4 rounded border-border text-blue focus:ring-blue bg-card"
                              />
                              <span className="text-sm text-foreground">{role}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}
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
                  <FileUpload
                    label="Startup Logo"
                    accept="image/*"
                    multiple={false}
                    maxFiles={1}
                    maxSizeMB={5}
                    files={form.logo}
                    onChange={(files) => setForm((f) => ({ ...f, logo: files }))}
                    hint="Square image recommended (PNG, JPG, WebP)"
                  />
                  <FileUpload
                    label="Card Thumbnail"
                    accept="image/*"
                    multiple={false}
                    maxFiles={1}
                    maxSizeMB={5}
                    files={form.thumbnail}
                    onChange={(files) => setForm((f) => ({ ...f, thumbnail: files }))}
                    hint="Recommended size: 480 × 270 pixels — landscape (PNG, JPG, WebP)"
                  />
                  <FileUpload
                    label="Pitch Deck (optional)"
                    accept=".pdf"
                    multiple={false}
                    maxFiles={1}
                    maxSizeMB={10}
                    files={form.pitchDeck}
                    onChange={(files) => setForm((f) => ({ ...f, pitchDeck: files }))}
                    hint="PDF format, max 10MB"
                  />
                  <FileUpload
                    label="Product Screenshots (optional)"
                    accept="image/*"
                    multiple={true}
                    maxFiles={5}
                    maxSizeMB={5}
                    files={form.screenshots}
                    onChange={(files) => setForm((f) => ({ ...f, screenshots: files }))}
                    hint="Upload up to 5 product images"
                  />
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
