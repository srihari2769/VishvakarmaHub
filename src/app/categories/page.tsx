'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Card } from '@/components/ui';
import { CATEGORIES } from '@/lib/utils';

export default function CategoriesPage() {
  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Innovation <span className="gradient-text">Categories</span>
          </h1>
          <p className="text-lg text-muted max-w-2xl mx-auto">
            Explore startups across diverse sectors transforming the future.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {CATEGORIES.map((category, index) => (
            <motion.div
              key={category.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
            >
              <Link href={`/explore?category=${encodeURIComponent(category.name)}`}>
                <Card hover className="p-6 h-full group">
                  <div className="text-4xl mb-4">{category.icon}</div>
                  <h2 className="text-lg font-semibold text-foreground mb-2 group-hover:text-blue transition-colors">
                    {category.name}
                  </h2>
                  <p className="text-sm text-muted">
                    Discover startups innovating in {category.name.toLowerCase()}.
                  </p>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
