'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import Button from '@/components/ui/Button';
import { Bars3Icon, XMarkIcon, BellIcon } from '@heroicons/react/24/outline';

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/explore', label: 'Explore' },
  { href: '/competition', label: 'Competition' },
  { href: '/vsc', label: 'Challenge' },
  { href: '/co-founders', label: 'Co-Founders' },
  { href: '/categories', label: 'Categories' },
  { href: '/how-it-works', label: 'How It Works' },
];

const comingSoonAllowed = ['/', '/competition'];

export default function Header() {
  const { user, isAuthenticated, logout, checkAuth } = useAuthStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isComingSoon, setIsComingSoon] = useState(false);
  const [registrationLive, setRegistrationLive] = useState(false);
  const [comingSoonToast, setComingSoonToast] = useState(false);

  const showComingSoonToast = () => {
    setComingSoonToast(true);
    setTimeout(() => setComingSoonToast(false), 2000);
  };

  useEffect(() => {
    checkAuth();
    fetch('/api/site-settings')
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setIsComingSoon(d.data.comingSoon === true);
          if (d.data.registrationStart) {
            setRegistrationLive(Date.now() >= new Date(d.data.registrationStart).getTime());
          }
        }
      })
      .catch(() => {});
  }, [checkAuth]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const getDashboardLink = () => {
    if (!user) return '/dashboard';
    switch (user.role) {
      case 'ADMIN': return '/admin';
      case 'FOUNDER': return '/startup-dashboard';
      default: return '/dashboard';
    }
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-background/80 backdrop-blur-xl border-b border-border'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <Image src="/Stamp.png" alt="Vishvakarma Hub" width={34} height={34} className="rounded-full" />
            <span className="text-lg font-bold text-foreground">
              Vishvakarma<span className="gradient-text"> Hub</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => {
              const blocked = isComingSoon && !comingSoonAllowed.includes(link.href);
              return blocked ? (
                <button
                  key={link.href}
                  onClick={showComingSoonToast}
                  className="text-sm text-muted/50 hover:text-muted transition-colors duration-200 cursor-default relative group"
                >
                  {link.label}
                  <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[10px] bg-amber-500/90 text-black px-1.5 py-0.5 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">Coming Soon</span>
                </button>
              ) : (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm text-muted hover:text-foreground transition-colors duration-200"
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Right Side */}
          <div className="hidden md:flex items-center space-x-4">
            {isComingSoon ? (
              isAuthenticated ? (
                <>
                  <Link href="/competition/dashboard">
                    <Button variant="ghost" size="sm">Dashboard</Button>
                  </Link>
                  <button onClick={logout} className="text-sm text-muted hover:text-danger transition-colors">
                    Logout
                  </button>
                </>
              ) : registrationLive ? (
                <>
                  <Link href="/competition/login">
                    <Button variant="ghost" size="sm">Login</Button>
                  </Link>
                  <Link href="/competition/register">
                    <Button size="sm">Register</Button>
                  </Link>
                </>
              ) : (
                <>
                  <button disabled className="text-sm text-muted/40 cursor-not-allowed">Login</button>
                  <button disabled className="px-4 py-1.5 text-sm font-medium rounded-lg bg-white/5 text-white/40 cursor-not-allowed border border-white/10">Register</button>
                </>
              )
            ) : (
              isAuthenticated ? (
                <>
                  <Link href="/submit-idea">
                    <Button size="sm">Submit Idea</Button>
                  </Link>
                  <Link href="/notifications" className="relative p-2 text-muted hover:text-foreground transition-colors">
                    <BellIcon className="w-5 h-5" />
                  </Link>
                  <Link href="/profile" title="Profile Settings">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue to-purple flex items-center justify-center text-white text-sm font-semibold cursor-pointer hover:ring-2 hover:ring-blue/50 transition-all">
                      {user?.firstName?.[0]?.toUpperCase() || 'U'}
                    </div>
                  </Link>
                  <Link href={getDashboardLink()} className="text-sm text-muted hover:text-foreground transition-colors">
                    Dashboard
                  </Link>
                  <button onClick={logout} className="text-sm text-muted hover:text-danger transition-colors">
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login">
                    <Button variant="ghost" size="sm">Login</Button>
                  </Link>
                  <Link href="/signup">
                    <Button size="sm">Get Started</Button>
                  </Link>
                </>
              )
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button
            className="md:hidden p-2 text-muted hover:text-foreground"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? (
              <XMarkIcon className="w-6 h-6" />
            ) : (
              <Bars3Icon className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-border bg-background/95 backdrop-blur-xl">
            <div className="py-4 space-y-2">
              {navLinks.map((link) => {
                const blocked = isComingSoon && !comingSoonAllowed.includes(link.href);
                return blocked ? (
                  <button
                    key={link.href}
                    onClick={showComingSoonToast}
                    className="block w-full text-left px-4 py-2 text-sm text-muted/50 rounded-lg"
                  >
                    {link.label} <span className="text-[10px] bg-amber-500/90 text-black px-1.5 py-0.5 rounded ml-1">Coming Soon</span>
                  </button>
                ) : (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="block px-4 py-2 text-sm text-muted hover:text-foreground hover:bg-card rounded-lg transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {link.label}
                  </Link>
                );
              })}
              <div className="border-t border-border pt-4 px-4 space-y-2">
                {isComingSoon ? (
                  isAuthenticated ? (
                    <>
                      <Link href="/competition/dashboard" onClick={() => setIsMobileMenuOpen(false)}>
                        <Button variant="outline" className="w-full" size="sm">Dashboard</Button>
                      </Link>
                      <button
                        onClick={() => { logout(); setIsMobileMenuOpen(false); }}
                        className="w-full text-left px-4 py-2 text-sm text-danger"
                      >
                        Logout
                      </button>
                    </>
                  ) : registrationLive ? (
                    <>
                      <Link href="/competition/login" onClick={() => setIsMobileMenuOpen(false)}>
                        <Button variant="outline" className="w-full" size="sm">Login</Button>
                      </Link>
                      <Link href="/competition/register" onClick={() => setIsMobileMenuOpen(false)}>
                        <Button className="w-full" size="sm">Register</Button>
                      </Link>
                    </>
                  ) : (
                    <>
                      <button disabled className="w-full px-4 py-2 text-sm text-muted/40 cursor-not-allowed">Login</button>
                      <button disabled className="w-full px-4 py-2 text-sm font-medium rounded-lg bg-white/5 text-white/40 cursor-not-allowed border border-white/10">Register</button>
                    </>
                  )
                ) : (
                  isAuthenticated ? (
                    <>
                      <Link href="/submit-idea" onClick={() => setIsMobileMenuOpen(false)}>
                        <Button className="w-full" size="sm">Submit Idea</Button>
                      </Link>
                      <Link href="/profile" onClick={() => setIsMobileMenuOpen(false)}>
                        <Button variant="outline" className="w-full" size="sm">Profile</Button>
                      </Link>
                      <Link href={getDashboardLink()} onClick={() => setIsMobileMenuOpen(false)}>
                        <Button variant="outline" className="w-full" size="sm">Dashboard</Button>
                      </Link>
                      <button
                        onClick={() => { logout(); setIsMobileMenuOpen(false); }}
                        className="w-full text-left px-4 py-2 text-sm text-danger"
                      >
                        Logout
                      </button>
                    </>
                  ) : (
                    <>
                      <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>
                        <Button variant="outline" className="w-full" size="sm">Login</Button>
                      </Link>
                      <Link href="/signup" onClick={() => setIsMobileMenuOpen(false)}>
                        <Button className="w-full" size="sm">Get Started</Button>
                      </Link>
                    </>
                  )
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Coming Soon Toast */}
      {comingSoonToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[60] bg-amber-500 text-black text-sm font-medium px-4 py-2 rounded-lg shadow-lg animate-pulse">
          🚀 Coming Soon — Stay tuned!
        </div>
      )}
    </header>
  );
}
