'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search, LayoutGrid, User, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';

const navItems = [
  { href: '/', label: 'Search', icon: Search },
  { href: '/browse', label: 'Browse', icon: LayoutGrid },
];

// Custom Templar Cross / Cross Pattée icon with gradient
function GradientCrossIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      className={className}
    >
      <defs>
        <linearGradient id="crossGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="50%" stopColor="#7c3aed" />
          <stop offset="100%" stopColor="#dc2626" />
        </linearGradient>
      </defs>
      {/* Cross Pattée - arms flare outward with flat ends */}
      <path
        fill="url(#crossGradient)"
        d="M12 2 L14 2 L14 8 L15.5 6 L18 6 L18 8 L22 8 L22 10 L18 10 L18 12 L15.5 12 L14 10 L14 14 L15.5 12 L18 12 L18 14 L22 14 L22 16 L18 16 L18 18 L15.5 18 L14 16 L14 22 L12 22 L10 22 L10 16 L8.5 18 L6 18 L6 16 L2 16 L2 14 L6 14 L6 12 L8.5 12 L10 14 L10 10 L8.5 12 L6 12 L6 10 L2 10 L2 8 L6 8 L6 6 L8.5 6 L10 8 L10 2 L12 2 Z"
      />
    </svg>
  );
}

// Simpler Cross Pattée design
function TemplarCrossIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      className={className}
    >
      <defs>
        <linearGradient id="templarGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="50%" stopColor="#7c3aed" />
          <stop offset="100%" stopColor="#dc2626" />
        </linearGradient>
      </defs>
      {/* Cross Pattée - flared arms */}
      <path
        fill="url(#templarGradient)"
        d="M42 5 L58 5 L58 35 L68 25 L80 25 L80 42 L95 42 L95 58 L80 58 L80 75 L68 75 L58 65 L58 95 L42 95 L42 65 L32 75 L20 75 L20 58 L5 58 L5 42 L20 42 L20 25 L32 25 L42 35 Z"
      />
    </svg>
  );
}

export function Navigation() {
  const pathname = usePathname();
  const { user, signOut } = useAuth();

  return (
    <nav className="fixed bottom-0 left-0 right-0 md:top-0 md:bottom-auto bg-white dark:bg-gray-900 border-t md:border-b md:border-t-0 border-gray-200 dark:border-gray-700 z-40">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo - Desktop only */}
          <Link href="/" className="hidden md:flex items-center space-x-3">
            <TemplarCrossIcon className="h-10 w-10" />
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-red-600 bg-clip-text text-transparent">
              Scale
            </span>
          </Link>

          {/* Navigation Items */}
          <div className="flex items-center justify-around md:justify-center flex-1 md:flex-initial md:space-x-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`
                    flex flex-col md:flex-row items-center justify-center px-4 py-2 rounded-lg
                    transition-colors
                    ${isActive
                      ? 'text-violet-700 dark:text-violet-400 bg-violet-100 dark:bg-violet-900/30'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
                    }
                  `}
                >
                  <Icon className="h-5 w-5 md:mr-2" />
                  <span className="text-xs md:text-sm mt-1 md:mt-0">{item.label}</span>
                </Link>
              );
            })}
          </div>

          {/* User Menu - Desktop */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <>
                <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                  <User className="h-4 w-4" />
                  <span>{user.displayName || user.email}</span>
                </div>
                <Button variant="ghost" size="sm" onClick={() => signOut()}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </>
            ) : (
              <div className="flex items-center space-x-2">
                <Link href="/login">
                  <Button variant="ghost" size="sm">Sign In</Button>
                </Link>
                <Link href="/signup">
                  <Button size="sm">Sign Up</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
