'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import StartupCard from '@/components/startup/StartupCard';
import { Button, Input, Select } from '@/components/ui';
import { CATEGORIES } from '@/lib/utils';
import { MagnifyingGlassIcon, FunnelIcon } from '@heroicons/react/24/outline';

interface Startup {
  id: string;
  slug: string;
  title: string;
  shortDescription: string;
  category: string;
  logo: string | null;
  thumbnail: string | null;
  productStage: string;
  founder: { firstName: string; lastName: string };
  campaign: {
    fundingGoal: number;
    raisedAmount: number;
    supporterCount: number;
    endDate: string;
  } | null;
}

function ExploreContent() {
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get('category') || '';

  const [startups, setStartups] = useState<Startup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState(initialCategory);
  const [sort, setSort] = useState('newest');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchStartups = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (category) params.set('category', category);
      params.set('sort', sort);
      params.set('page', page.toString());
      params.set('limit', '12');

      const res = await fetch(`/api/startups?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setStartups(data.data.startups);
        setTotalPages(data.data.pagination.totalPages);
      }
    } catch (error) {
      console.error('Error fetching startups:', error);
    } finally {
      setIsLoading(false);
    }
  }, [search, category, sort, page]);

  useEffect(() => {
    const debounce = setTimeout(fetchStartups, 300);
    return () => clearTimeout(debounce);
  }, [fetchStartups]);

  const categoryOptions = [
    { value: '', label: 'All Categories' },
    ...CATEGORIES.map((c) => ({ value: c.slug, label: c.name })),
  ];

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Explore <span className="gradient-text">Startups</span>
          </h1>
          <p className="text-lg text-muted max-w-2xl mx-auto">
            Discover innovative startups and the ideas that matter to you.
          </p>
        </motion.div>

        {/* Filters */}
        <motion.div
          className="bg-card border border-border rounded-2xl p-6 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2 relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
              <input
                type="text"
                placeholder="Search startups..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="w-full pl-10 pr-4 py-2.5 bg-input border border-border rounded-xl text-foreground placeholder-muted text-sm focus:outline-none focus:border-blue"
              />
            </div>
            <Select
              value={category}
              onChange={(e) => { setCategory(e.target.value); setPage(1); }}
              options={categoryOptions}
              placeholder="All Categories"
            />
            <Select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              options={[
                { value: 'newest', label: 'Newest First' },
                { value: 'oldest', label: 'Oldest First' },
                { value: 'popular', label: 'Most Popular' },
                { value: 'popular', label: 'Most Popular' },
              ]}
            />
          </div>
        </motion.div>

        {/* Results */}
        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-card border border-border rounded-2xl animate-pulse">
                <div className="h-48 bg-border/30" />
                <div className="p-5 space-y-3">
                  <div className="h-5 bg-border/30 rounded w-3/4" />
                  <div className="h-4 bg-border/30 rounded w-full" />
                  <div className="h-2.5 bg-border/30 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        ) : startups.length > 0 ? (
          <>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {startups.map((startup, i) => (
                <motion.div
                  key={startup.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <StartupCard startup={startup} />
                </motion.div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-12">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                >
                  Previous
                </Button>
                <span className="text-sm text-muted px-4">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage(page + 1)}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-20">
            <FunnelIcon className="w-16 h-16 text-muted mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">No startups found</h3>
            <p className="text-muted mb-6">Try adjusting your search or filters.</p>
            <Button variant="outline" onClick={() => { setSearch(''); setCategory(''); }}>
              Clear Filters
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ExplorePage() {
  return (
    <Suspense fallback={<div className="min-h-screen pt-24 pb-16 flex items-center justify-center"><div className="animate-spin w-8 h-8 border-2 border-blue border-t-transparent rounded-full" /></div>}>
      <ExploreContent />
    </Suspense>
  );
}
