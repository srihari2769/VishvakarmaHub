'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Button, Input, Textarea, Select, MultiSelect, FileUpload, Card } from '@/components/ui';
import { useAuthStore } from '@/store/authStore';
import { CATEGORIES } from '@/lib/utils';
import {
  ArrowLeftIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';

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
  logo: UploadedFile[];
  thumbnail: UploadedFile[];
  pitchDeck: UploadedFile[];
  screenshots: UploadedFile[];
  demoVideo: string;
}

export default function EditStartupPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const router = useRouter();
  const { token, isAuthenticated, isLoading: authLoading } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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
    logo: [],
    thumbnail: [],
    pitchDeck: [],
    screenshots: [],
    demoVideo: '',
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }
    if (!token) return;

    async function fetchStartup() {
      try {
        const res = await fetch(`/api/startups/${slug}`);
        const data = await res.json();
        if (!data.success) {
          setError('Startup not found');
          return;
        }
        const s = data.data;
        setForm({
          title: s.title || '',
          shortDescription: s.shortDescription || '',
          categories: s.category ? s.category.split(', ') : [],
          location: s.location || '',
          problemDescription: s.problemDescription || '',
          targetAudience: s.targetAudience || '',
          solutionExplanation: s.solutionExplanation || '',
          innovationUniqueness: s.innovationUniqueness || '',
          productStage: s.productStage || 'IDEA',
          logo: s.logo ? [{ url: s.logo, name: 'logo', size: 0, type: 'image/png' }] : [],
          thumbnail: s.thumbnail ? [{ url: s.thumbnail, name: 'thumbnail', size: 0, type: 'image/png' }] : [],
          pitchDeck: s.pitchDeck ? [{ url: s.pitchDeck, name: 'pitch-deck', size: 0, type: 'application/pdf' }] : [],
          screenshots: (s.screenshots || []).map((url: string, i: number) => ({
            url, name: `screenshot-${i + 1}`, size: 0, type: 'image/png',
          })),
          demoVideo: s.demoVideo || '',
        });
      } catch {
        setError('Failed to load startup');
      } finally {
        setLoading(false);
      }
    }

    fetchStartup();
  }, [slug, token, authLoading, isAuthenticated, router]);

  const updateField = <K extends keyof FormData>(key: K, value: FormData[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setError('');
    setSuccess('');

    if (!form.title.trim()) {
      setError('Title is required');
      return;
    }

    setSaving(true);

    try {
      const res = await fetch(`/api/startups/${slug}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: form.title,
          shortDescription: form.shortDescription,
          problemDescription: form.problemDescription,
          targetAudience: form.targetAudience,
          solutionExplanation: form.solutionExplanation,
          innovationUniqueness: form.innovationUniqueness,
          category: form.categories.join(', '),
          location: form.location,
          productStage: form.productStage,
          logo: form.logo[0]?.url || null,
          thumbnail: form.thumbnail[0]?.url || null,
          pitchDeck: form.pitchDeck[0]?.url || null,
          demoVideo: form.demoVideo || null,
          screenshots: form.screenshots.map((f) => f.url),
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSuccess('Startup updated successfully!');
        setTimeout(() => router.push('/startup-dashboard'), 1500);
      } else {
        setError(data.error || 'Failed to update startup');
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen pt-24 pb-16 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-blue border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <button onClick={() => router.back()} className="text-muted hover:text-foreground">
              <ArrowLeftIcon className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">Edit Startup</h1>
              <p className="text-muted">Update your startup details</p>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-danger/10 border border-danger/30 rounded-xl text-danger text-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-sm">
              {success}
            </div>
          )}

          <div className="space-y-8">
            {/* Basic Info */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">Basic Information</h2>
              <div className="space-y-4">
                <Input
                  label="Startup Title"
                  value={form.title}
                  onChange={(e) => updateField('title', e.target.value)}
                  placeholder="Enter your startup name"
                />
                <Textarea
                  label="Short Description"
                  value={form.shortDescription}
                  onChange={(e) => updateField('shortDescription', e.target.value)}
                  placeholder="One-line pitch for your startup"
                  rows={2}
                />
                <MultiSelect
                  label="Categories"
                  options={CATEGORIES.map((c) => ({ value: c.name, label: `${c.icon} ${c.name}` }))}
                  selected={form.categories}
                  onChange={(val) => updateField('categories', val)}
                  placeholder="Select categories"
                />
                <Input
                  label="Location"
                  value={form.location}
                  onChange={(e) => updateField('location', e.target.value)}
                  placeholder="City, Country"
                />
                <Select
                  label="Product Stage"
                  value={form.productStage}
                  onChange={(e) => updateField('productStage', e.target.value)}
                  options={PRODUCT_STAGES}
                />


              </div>
            </Card>

            {/* Problem & Solution */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">Problem & Solution</h2>
              <div className="space-y-4">
                <Textarea
                  label="Problem Description"
                  value={form.problemDescription}
                  onChange={(e) => updateField('problemDescription', e.target.value)}
                  placeholder="What problem does your startup solve?"
                  rows={4}
                />
                <Textarea
                  label="Target Audience"
                  value={form.targetAudience}
                  onChange={(e) => updateField('targetAudience', e.target.value)}
                  placeholder="Who are your target users/customers?"
                  rows={3}
                />
                <Textarea
                  label="Solution Explanation"
                  value={form.solutionExplanation}
                  onChange={(e) => updateField('solutionExplanation', e.target.value)}
                  placeholder="How does your solution address the problem?"
                  rows={4}
                />
                <Textarea
                  label="Innovation & Uniqueness"
                  value={form.innovationUniqueness}
                  onChange={(e) => updateField('innovationUniqueness', e.target.value)}
                  placeholder="What makes your approach unique?"
                  rows={4}
                />
              </div>
            </Card>

            {/* Media */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">Media & Files</h2>
              <div className="space-y-6">
                <FileUpload
                  label="Startup Logo"
                  accept="image/*"
                  maxFiles={1}
                  files={form.logo}
                  onChange={(files) => updateField('logo', files)}
                  hint="Square image recommended (PNG, JPG)"
                />
                <FileUpload
                  label="Card Thumbnail"
                  accept="image/*"
                  maxFiles={1}
                  files={form.thumbnail}
                  onChange={(files) => updateField('thumbnail', files)}
                  hint="Recommended size: 480 × 270 pixels — landscape (PNG, JPG, WebP)"
                />
                <FileUpload
                  label="Pitch Deck"
                  accept=".pdf"
                  maxFiles={1}
                  files={form.pitchDeck}
                  onChange={(files) => updateField('pitchDeck', files)}
                  hint="PDF format, max 10MB"
                />
                <FileUpload
                  label="Screenshots"
                  accept="image/*"
                  multiple
                  maxFiles={5}
                  files={form.screenshots}
                  onChange={(files) => updateField('screenshots', files)}
                  hint="Up to 5 product screenshots"
                />
                <Input
                  label="Demo Video URL"
                  value={form.demoVideo}
                  onChange={(e) => updateField('demoVideo', e.target.value)}
                  placeholder="https://youtube.com/watch?v=..."
                />
              </div>
            </Card>

            {/* Save Button */}
            <div className="flex justify-end gap-4">
              <Button variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                    Saving...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <CheckIcon className="w-4 h-4" />
                    Save Changes
                  </span>
                )}
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
