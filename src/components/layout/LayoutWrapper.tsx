'use client';

import { usePathname } from 'next/navigation';
import { ReactNode } from 'react';

interface LayoutWrapperProps {
  header: ReactNode;
  footer: ReactNode;
  children: ReactNode;
}

export function LayoutWrapper({ header, footer, children }: LayoutWrapperProps) {
  const pathname = usePathname();
  const isComingSoon = pathname === '/coming-soon';

  if (isComingSoon) {
    return (
      <>
        {header}
        <main className="flex-1">{children}</main>
      </>
    );
  }

  return (
    <>
      {header}
      <main className="flex-1">{children}</main>
      {footer}
    </>
  );
}
