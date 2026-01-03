'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Search, LayoutGrid, Megaphone, User, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';

const navItems = [
  { href: '/', label: 'Search', icon: Search },
  { href: '/browse', label: 'Browse', icon: LayoutGrid },
  { href: '/demands', label: 'Demands', icon: Megaphone },
];

export function Navigation() {
  const pathname = usePathname();
  const { user, signOut } = useAuth();

  return (
    <nav className="fixed bottom-0 left-0 right-0 md:top-0 md:bottom-auto bg-white/95 dark:bg-black/95 backdrop-blur-sm border-t md:border-b md:border-t-0 border-gray-200 dark:border-gray-800 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo - Desktop only */}
          <Link href="/" className="hidden md:flex items-center h-full py-2">
            {/* Light theme logo (black text) */}
            <img
              src="/demand-light.png"
              alt="Demand"
              className="h-full max-h-12 dark:hidden"
            />
            {/* Dark theme logo (white text) */}
            <img
              src="/demand-dark.png"
              alt="Demand"
              className="h-full max-h-12 hidden dark:block"
            />
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
                      ? 'text-[#741b47] dark:text-[#d4619a] bg-[#741b47]/10 dark:bg-[#741b47]/20'
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
