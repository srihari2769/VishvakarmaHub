import { NextRequest, NextResponse } from 'next/server';

export function successResponse<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

export function errorResponse(message: string, status = 400) {
  return NextResponse.json({ success: false, error: message }, { status });
}

export function getTokenFromRequest(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }
  return request.cookies.get('token')?.value || null;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .concat('-', Date.now().toString(36));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function calculateDaysLeft(endDate: Date): number {
  const now = new Date();
  const diff = new Date(endDate).getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export function calculateProgress(raised: number, goal: number): number {
  if (goal <= 0) return 0;
  return Math.min(100, Math.round((raised / goal) * 100));
}

export const CATEGORIES = [
  { name: 'AI & Machine Learning', slug: 'ai', icon: '🤖' },
  { name: 'Robotics', slug: 'robotics', icon: '🦾' },
  { name: 'HealthTech', slug: 'healthtech', icon: '🏥' },
  { name: 'EdTech', slug: 'edtech', icon: '📚' },
  { name: 'FinTech', slug: 'fintech', icon: '💰' },
  { name: 'AgriTech', slug: 'agritech', icon: '🌾' },
  { name: 'CleanTech', slug: 'cleantech', icon: '🌱' },
  { name: 'SpaceTech', slug: 'spacetech', icon: '🚀' },
  { name: 'IoT', slug: 'iot', icon: '📡' },
  { name: 'Blockchain', slug: 'blockchain', icon: '⛓️' },
  { name: 'Gaming', slug: 'gaming', icon: '🎮' },
  { name: 'Social Impact', slug: 'social-impact', icon: '🌍' },
  { name: 'Cybersecurity', slug: 'cybersecurity', icon: '🔒' },
  { name: 'E-Commerce', slug: 'ecommerce', icon: '🛒' },
  { name: 'SaaS', slug: 'saas', icon: '☁️' },
  { name: 'PropTech', slug: 'proptech', icon: '🏠' },
  { name: 'LegalTech', slug: 'legaltech', icon: '⚖️' },
  { name: 'FoodTech', slug: 'foodtech', icon: '🍽️' },
  { name: 'InsurTech', slug: 'insurtech', icon: '🛡️' },
  { name: 'HRTech', slug: 'hrtech', icon: '👥' },
  { name: 'Logistics & Supply Chain', slug: 'logistics', icon: '🚚' },
  { name: 'AR / VR / Metaverse', slug: 'ar-vr', icon: '🥽' },
  { name: 'Quantum Computing', slug: 'quantum', icon: '⚛️' },
  { name: 'BioTech', slug: 'biotech', icon: '🧬' },
  { name: 'Drone Technology', slug: 'drones', icon: '🛸' },
  { name: 'Electric Vehicles', slug: 'ev', icon: '⚡' },
  { name: '3D Printing', slug: '3d-printing', icon: '🖨️' },
  { name: 'Wearable Tech', slug: 'wearables', icon: '⌚' },
  { name: 'MediaTech', slug: 'mediatech', icon: '📺' },
  { name: 'TravelTech', slug: 'traveltech', icon: '✈️' },
  { name: 'GovTech', slug: 'govtech', icon: '🏛️' },
  { name: 'DeepTech', slug: 'deeptech', icon: '🔬' },
  { name: 'Mental Health & Wellness', slug: 'mental-health', icon: '🧠' },
  { name: 'Renewable Energy', slug: 'renewable-energy', icon: '☀️' },
  { name: 'MarTech', slug: 'martech', icon: '📣' },
  { name: 'Nanotechnology', slug: 'nanotech', icon: '🔩' },
  { name: 'Smart Cities', slug: 'smart-cities', icon: '🏙️' },
  { name: 'Data Analytics', slug: 'data-analytics', icon: '📊' },
  { name: 'DevTools', slug: 'devtools', icon: '🛠️' },
  { name: 'Pet Tech', slug: 'pettech', icon: '🐾' },
] as const;
