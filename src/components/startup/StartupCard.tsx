'use client';

import Link from 'next/link';
import { Card, ProgressBar, Badge } from '@/components/ui';
import { formatCurrency, calculateProgress, calculateDaysLeft } from '@/lib/utils';

interface StartupCardProps {
  startup: {
    id: string;
    slug: string;
    title: string;
    shortDescription: string;
    category: string;
    logo?: string | null;
    productStage: string;
    founder: {
      firstName: string;
      lastName: string;
    };
    campaign?: {
      fundingGoal: number;
      raisedAmount: number;
      supporterCount: number;
      endDate: string;
    } | null;
  };
}

export default function StartupCard({ startup }: StartupCardProps) {
  const progress = startup.campaign
    ? calculateProgress(startup.campaign.raisedAmount, startup.campaign.fundingGoal)
    : 0;
  const daysLeft = startup.campaign ? calculateDaysLeft(new Date(startup.campaign.endDate)) : 0;

  return (
    <Link href={`/startup/${startup.slug}`}>
      <Card hover glow className="h-full">
        {/* Logo / Image */}
        <div className="h-48 bg-gradient-to-br from-blue/10 to-purple/10 flex items-center justify-center relative overflow-hidden">
          {startup.logo ? (
            <img src={startup.logo} alt={startup.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue to-purple flex items-center justify-center">
              <span className="text-2xl font-bold text-white">{startup.title[0]}</span>
            </div>
          )}
          <div className="absolute top-3 right-3">
            <Badge variant="info">{startup.category}</Badge>
          </div>
        </div>

        {/* Content */}
        <div className="p-5">
          <h3 className="text-lg font-semibold text-foreground mb-1 line-clamp-1">{startup.title}</h3>
          <p className="text-sm text-muted mb-3 line-clamp-2">{startup.shortDescription}</p>
          
          <div className="flex items-center text-xs text-muted mb-4">
            <span>by {startup.founder.firstName} {startup.founder.lastName}</span>
            <span className="mx-2">·</span>
            <Badge variant="default">{startup.productStage}</Badge>
          </div>

          {startup.campaign && (
            <>
              <ProgressBar progress={progress} className="mb-3" />
              <div className="flex items-center justify-between text-xs">
                <span className="text-foreground font-medium">
                  {formatCurrency(startup.campaign.raisedAmount)}
                </span>
                <span className="text-muted">
                  {startup.campaign.supporterCount} supporters
                </span>
                <span className="text-muted">{daysLeft} days left</span>
              </div>
            </>
          )}
        </div>
      </Card>
    </Link>
  );
}
