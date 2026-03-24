'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Card, Badge, Button } from '@/components/ui';

import {
  UserGroupIcon,
  MagnifyingGlassIcon,
  MapPinIcon,
  PaperAirplaneIcon,
} from '@heroicons/react/24/outline';

interface CofounderStartup {
  id: string;
  title: string;
  slug: string;
  shortDescription: string;
  category: string;
  location: string;
  productStage: string;
  logo: string | null;
  thumbnail: string | null;
  cofounderRoles: string[];
  founder: {
    firstName: string;
    lastName: string;
    avatar: string | null;
  };
  campaign: {
    fundingGoal: number;
    raisedAmount: number;
    supporterCount: number;
    endDate: string;
    status: string;
  } | null;
}

const ROLE_FILTERS = [
  'All',
  'Developer',
  'Designer',
  'Marketer',
  'Business Strategist',
  'Sales',
  'Operations',
  'Data Scientist',
  'Product Manager',
  'Finance',
];

export default function CoFoundersPage() {
  const [startups, setStartups] = useState<CofounderStartup[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');

  useEffect(() => {
    const fetchStartups = async () => {
      try {
        const res = await fetch('/api/startups?cofounder=true&limit=50');
        const data = await res.json();
        if (data.success) {
          setStartups(data.data.startups || []);
        }
      } catch (error) {
        console.error('Failed to fetch co-founder startups:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStartups();
  }, []);

  const filtered = startups.filter((s) => {
    const matchesSearch =
      !search ||
      s.title.toLowerCase().includes(search.toLowerCase()) ||
      s.shortDescription.toLowerCase().includes(search.toLowerCase()) ||
      s.location.toLowerCase().includes(search.toLowerCase());

    const matchesRole =
      roleFilter === 'All' || s.cofounderRoles.includes(roleFilter);

    return matchesSearch && matchesRole;
  });

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="w-16 h-16 rounded-2xl bg-purple/10 flex items-center justify-center mx-auto mb-4">
            <UserGroupIcon className="w-8 h-8 text-purple" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
            Find a Co-Founder
          </h1>
          <p className="text-muted max-w-2xl mx-auto">
            Browse startups looking for co-founders. Find the right team and build something amazing together.
          </p>
        </motion.div>

        {/* Search & Filters */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8 space-y-4"
        >
          <div className="relative max-w-xl mx-auto">
            <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
            <input
              type="text"
              placeholder="Search startups by name, description, or location..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-card border border-border rounded-xl text-foreground placeholder-muted focus:outline-none focus:border-blue transition-colors"
            />
          </div>

          <div className="flex flex-wrap justify-center gap-2">
            {ROLE_FILTERS.map((role) => (
              <button
                key={role}
                onClick={() => setRoleFilter(role)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  roleFilter === role
                    ? 'bg-purple text-white'
                    : 'bg-card border border-border text-muted hover:text-foreground hover:border-purple/30'
                }`}
              >
                {role}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Results */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin w-8 h-8 border-2 border-purple border-t-transparent rounded-full" />
          </div>
        ) : filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <UserGroupIcon className="w-16 h-16 text-muted mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">No startups found</h2>
            <p className="text-muted mb-6">
              {search || roleFilter !== 'All'
                ? 'Try adjusting your search or filters.'
                : 'No startups are currently looking for co-founders.'}
            </p>
            {(search || roleFilter !== 'All') && (
              <Button
                variant="outline"
                onClick={() => {
                  setSearch('');
                  setRoleFilter('All');
                }}
              >
                Clear Filters
              </Button>
            )}
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((startup, i) => {
              return (
                <motion.div
                  key={startup.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card className="overflow-hidden hover:border-purple/30 transition-colors group h-full flex flex-col">
                    {/* Image */}
                    <Link href={`/startup/${startup.slug}`}>
                      <div className="h-48 bg-gradient-to-br from-purple/10 to-blue/10 flex items-center justify-center relative overflow-hidden">
                        {startup.thumbnail || startup.logo ? (
                          <img
                            src={(startup.thumbnail || startup.logo)!}
                            alt={startup.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple to-blue flex items-center justify-center">
                            <span className="text-2xl font-bold text-white">{startup.title[0]}</span>
                          </div>
                        )}
                        <div className="absolute top-3 left-3">
                          <Badge variant="info">{startup.productStage.replace('_', ' ')}</Badge>
                        </div>
                      </div>
                    </Link>

                    <div className="p-5 flex flex-col flex-1">
                      <Link href={`/startup/${startup.slug}`}>
                        <h3 className="text-lg font-semibold text-foreground mb-1 group-hover:text-purple transition-colors">
                          {startup.title}
                        </h3>
                        <p className="text-sm text-muted line-clamp-2 mb-3">
                          {startup.shortDescription}
                        </p>
                      </Link>

                      {/* Founder Info */}
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-6 h-6 rounded-full bg-purple/20 flex items-center justify-center text-purple text-xs font-bold overflow-hidden">
                          {startup.founder.avatar ? (
                            <img
                              src={startup.founder.avatar}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            startup.founder.firstName[0]
                          )}
                        </div>
                        <span className="text-xs text-muted">
                          {startup.founder.firstName} {startup.founder.lastName}
                        </span>
                        {startup.location && (
                          <>
                            <span className="text-muted">·</span>
                            <span className="text-xs text-muted flex items-center gap-1">
                              <MapPinIcon className="w-3 h-3" />
                              {startup.location}
                            </span>
                          </>
                        )}
                      </div>

                      {/* Roles Needed */}
                      <div className="mb-3">
                        <p className="text-xs text-muted mb-1.5 font-medium">Looking for:</p>
                        <div className="flex flex-wrap gap-1.5">
                          {startup.cofounderRoles.map((role) => (
                            <span
                              key={role}
                              className="px-2 py-0.5 text-xs rounded-full bg-purple/10 text-purple border border-purple/20"
                            >
                              {role}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Apply Button */}
                      <div className="mt-auto pt-3">
                        <Link href={`/co-founders/apply/${startup.slug}`}>
                          <button className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-purple text-white hover:bg-purple/90 transition-colors">
                            <PaperAirplaneIcon className="w-4 h-4" />
                            Apply Now
                          </button>
                        </Link>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
