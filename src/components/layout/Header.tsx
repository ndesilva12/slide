'use client';

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { User, Settings } from 'lucide-react';
import Link from 'next/link';

interface HeaderProps {
  title?: string;
  subtitle?: string;
}

export function Header({ title, subtitle }: HeaderProps) {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-50 bg-white/95 dark:bg-black/95 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800 md:hidden">
      <div className="px-4 py-2">
        <div className="flex items-center justify-between h-10">
          {/* Always show logo */}
          <Link href="/" className="flex items-center h-full">
            <img
              src="/demand-light.png"
              alt="Demand"
              className="h-full max-h-8 dark:hidden"
            />
            <img
              src="/demand-dark.png"
              alt="Demand"
              className="h-full max-h-8 hidden dark:block"
            />
          </Link>

          {user ? (
            <div className="flex items-center space-x-2">
              <button className="p-1.5 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
                <Settings className="h-4 w-4" />
              </button>
              <div className="w-7 h-7 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                {user.photoURL ? (
                  <img src={user.photoURL} alt="Profile" className="w-7 h-7 rounded-full" />
                ) : (
                  <User className="h-3.5 w-3.5 text-gray-600 dark:text-gray-400" />
                )}
              </div>
            </div>
          ) : (
            <Link href="/login" className="text-sm text-[#741b47] dark:text-[#d4619a] font-medium">
              Sign In
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
