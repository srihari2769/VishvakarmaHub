'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Card, Badge, Button } from '@/components/ui';
import { useAuthStore } from '@/store/authStore';
import { BellIcon, CheckIcon } from '@heroicons/react/24/outline';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

export default function NotificationsPage() {
  const router = useRouter();
  const { isAuthenticated, checkAuth, isLoading } = useAuthStore();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login?redirect=/notifications');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-blue border-t-transparent rounded-full" />
      </div>
    );
  }

  const unread = notifications.filter((n) => !n.isRead);
  const read = notifications.filter((n) => n.isRead);

  const typeColor = (type: string) => {
    switch (type) {
      case 'CONTRIBUTION': return 'success';
      case 'CAMPAIGN_UPDATE': return 'info';
      case 'MILESTONE': return 'warning';
      case 'SYSTEM': return 'default';
      default: return 'default';
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Notifications</h1>
              <p className="text-muted text-sm">{unread.length} unread</p>
            </div>
            {unread.length > 0 && (
              <Button variant="outline" size="sm">
                <CheckIcon className="w-4 h-4 mr-1" /> Mark All Read
              </Button>
            )}
          </div>
        </motion.div>

        {notifications.length === 0 ? (
          <Card className="p-12 text-center">
            <BellIcon className="w-16 h-16 text-muted mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">No notifications yet</h2>
            <p className="text-muted">
              You&apos;ll receive notifications about campaign updates, contributions, and milestones here.
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {[...unread, ...read].map((n) => (
              <Card
                key={n.id}
                className={`p-4 ${!n.isRead ? 'border-blue/20 bg-blue/5' : ''}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-foreground text-sm">{n.title}</h3>
                      <Badge variant={typeColor(n.type) as 'success' | 'info' | 'warning' | 'default'}>
                        {n.type.replace('_', ' ')}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted">{n.message}</p>
                  </div>
                  <span className="text-xs text-muted whitespace-nowrap">
                    {new Date(n.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
