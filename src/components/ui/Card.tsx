'use client';

import clsx from 'clsx';
import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  glow?: boolean;
  onClick?: () => void;
}

export default function Card({ children, className, hover = false, glow = false, onClick }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={clsx(
        'bg-card border border-border rounded-2xl overflow-hidden transition-all duration-300',
        hover && 'hover:-translate-y-1 hover:border-blue/30 cursor-pointer',
        glow && 'card-glow',
        onClick && 'cursor-pointer',
        className
      )}
    >
      {children}
    </div>
  );
}
