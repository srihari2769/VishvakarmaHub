'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Button, Input, Textarea, Card } from '@/components/ui';
import { useAuthStore } from '@/store/authStore';
import {
  UserCircleIcon,
  CameraIcon,
  CheckIcon,
  ArrowLeftIcon,
} from '@heroicons/react/24/outline';

interface ProfileData {
  firstName: string;
  lastName: string;
  email: string;
  avatar: string;
  bio: string;
  linkedIn: string;
  phone: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const { token, user, isAuthenticated, isLoading: authLoading, setUser } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<ProfileData>({
    firstName: '',
    lastName: '',
    email: '',
    avatar: '',
    bio: '',
    linkedIn: '',
    phone: '',
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }
    if (!token) return;

    async function fetchProfile() {
      try {
        const res = await fetch('/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success) {
          setForm({
            firstName: data.data.firstName || '',
            lastName: data.data.lastName || '',
            email: data.data.email || '',
            avatar: data.data.avatar || '',
            bio: data.data.bio || '',
            linkedIn: data.data.linkedIn || '',
            phone: data.data.phone || '',
          });
        }
      } catch {
        setError('Failed to load profile');
      } finally {
        setLoading(false);
      }
    }

    fetchProfile();
  }, [token, authLoading, isAuthenticated, router]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError('Photo must be less than 5MB');
      return;
    }

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    setUploading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await res.json();
      if (data.success) {
        setForm((prev) => ({ ...prev, avatar: data.data.url }));
      } else {
        setError(data.error || 'Upload failed');
      }
    } catch {
      setError('Photo upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    setError('');
    setSuccess('');

    if (!form.firstName.trim() || !form.lastName.trim()) {
      setError('First name and last name are required');
      return;
    }

    setSaving(true);

    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          firstName: form.firstName,
          lastName: form.lastName,
          avatar: form.avatar || null,
          bio: form.bio || null,
          linkedIn: form.linkedIn || null,
          phone: form.phone || null,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSuccess('Profile updated successfully!');
        // Update auth store with new user data
        if (user && token) {
          setUser({ ...user, firstName: form.firstName, lastName: form.lastName, avatar: form.avatar || undefined }, token);
        }
      } else {
        setError(data.error || 'Failed to update profile');
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
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <button onClick={() => router.back()} className="text-muted hover:text-foreground">
              <ArrowLeftIcon className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">Profile Settings</h1>
              <p className="text-muted">Manage your personal information</p>
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

          <div className="space-y-6">
            {/* Avatar Section */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">Profile Photo</h2>
              <div className="flex items-center gap-6">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full overflow-hidden bg-gradient-to-br from-blue to-purple flex items-center justify-center">
                    {form.avatar ? (
                      <img src={form.avatar} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <UserCircleIcon className="w-16 h-16 text-white/70" />
                    )}
                  </div>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="absolute bottom-0 right-0 w-8 h-8 bg-blue rounded-full flex items-center justify-center text-white shadow-lg hover:bg-blue/80 transition-colors disabled:opacity-50"
                  >
                    {uploading ? (
                      <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                    ) : (
                      <CameraIcon className="w-4 h-4" />
                    )}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                  />
                </div>
                <div>
                  <p className="text-sm text-foreground font-medium">
                    {form.firstName} {form.lastName}
                  </p>
                  <p className="text-xs text-muted">{form.email}</p>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="text-xs text-blue hover:text-blue/80 mt-1 disabled:opacity-50"
                  >
                    {uploading ? 'Uploading...' : 'Change photo'}
                  </button>
                </div>
              </div>
            </Card>

            {/* Personal Info */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">Personal Information</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="First Name"
                    value={form.firstName}
                    onChange={(e) => setForm((prev) => ({ ...prev, firstName: e.target.value }))}
                  />
                  <Input
                    label="Last Name"
                    value={form.lastName}
                    onChange={(e) => setForm((prev) => ({ ...prev, lastName: e.target.value }))}
                  />
                </div>
                <Input label="Email" value={form.email} disabled />
                <Input
                  label="Phone"
                  value={form.phone}
                  onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
                  placeholder="+91 9876543210"
                />
              </div>
            </Card>

            {/* Bio & Links */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">About You</h2>
              <div className="space-y-4">
                <Textarea
                  label="Bio"
                  value={form.bio}
                  onChange={(e) => setForm((prev) => ({ ...prev, bio: e.target.value }))}
                  placeholder="Tell others about yourself..."
                  rows={4}
                />
                <Input
                  label="LinkedIn Profile"
                  value={form.linkedIn}
                  onChange={(e) => setForm((prev) => ({ ...prev, linkedIn: e.target.value }))}
                  placeholder="https://linkedin.com/in/your-profile"
                />
              </div>
            </Card>

            {/* Save */}
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
                    Save Profile
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
