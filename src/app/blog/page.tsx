'use client';

import { motion } from 'framer-motion';
import { Card, Button } from '@/components/ui';
import Link from 'next/link';

const posts = [
  {
    title: 'How Innovation Platforms are Transforming Indian Startups',
    excerpt: 'Discover how community-powered platforms are enabling grassroots innovation across India, from tier-2 cities to rural areas.',
    date: 'Jan 15, 2025',
    category: 'Innovation',
    readTime: '5 min read',
    image: '🚀',
  },
  {
    title: '10 Tips for Launching a Successful Startup',
    excerpt: 'Learn proven strategies from founders who built thriving startups on our platform. From storytelling to building the right team.',
    date: 'Jan 10, 2025',
    category: 'Guides',
    readTime: '8 min read',
    image: '💡',
  },
  {
    title: 'AI and the Future of Innovation Platforms',
    excerpt: 'How artificial intelligence is helping match innovators with the right collaborators and mentors.',
    date: 'Jan 5, 2025',
    category: 'Technology',
    readTime: '6 min read',
    image: '🤖',
  },
  {
    title: 'Spotlight: CleanTech Startups Making a Difference',
    excerpt: 'Five clean technology startups on Vishvakarma Hub that are tackling climate change with innovative solutions.',
    date: 'Dec 28, 2024',
    category: 'Spotlight',
    readTime: '7 min read',
    image: '🌍',
  },
  {
    title: 'Building Trust in Innovation Platforms: Our Approach',
    excerpt: 'How Vishvakarma Hub ensures transparency, accountability, and trust between innovators and the community.',
    date: 'Dec 20, 2024',
    category: 'Platform',
    readTime: '4 min read',
    image: '🛡️',
  },
  {
    title: 'From Idea to IPO: Success Stories of 2024',
    excerpt: 'Celebrating the startups that went from a simple idea submission to raising institutional investment.',
    date: 'Dec 15, 2024',
    category: 'Success Stories',
    readTime: '10 min read',
    image: '🏆',
  },
];

export default function BlogPage() {
  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            The Innovation <span className="gradient-text">Blog</span>
          </h1>
          <p className="text-lg text-muted max-w-2xl mx-auto">
            Stories, guides, and insights from the world of startup innovation.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post, i) => (
            <motion.div
              key={post.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className="p-6 h-full flex flex-col">
                <div className="text-4xl mb-4">{post.image}</div>
                <span className="text-xs font-medium text-blue mb-2">{post.category}</span>
                <h3 className="text-lg font-semibold text-foreground mb-2">{post.title}</h3>
                <p className="text-sm text-muted flex-1">{post.excerpt}</p>
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/10">
                  <span className="text-xs text-muted">{post.date}</span>
                  <span className="text-xs text-muted">{post.readTime}</span>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="text-center mt-12">
          <p className="text-muted">More articles coming soon. Stay tuned!</p>
        </div>
      </div>
    </div>
  );
}
