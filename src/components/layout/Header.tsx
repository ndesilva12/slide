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
    <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 md:hidden">
      <div className="px-4 py-4">
        <div className="flex items-center justify-between">
          <div>
            {title ? (
              <>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h1>
                {subtitle && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>
                )}
              </>
            ) : (
              <Link href="/" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">P</span>
                </div>
                <span className="text-xl font-bold text-gray-900 dark:text-white">PolitiTrack</span>
              </Link>
            )}
          </div>

          {user ? (
            <div className="flex items-center space-x-3">
              <button className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
                <Settings className="h-5 w-5" />
              </button>
              <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                {user.photoURL ? (
                  <img src={user.photoURL} alt="Profile" className="w-8 h-8 rounded-full" />
                ) : (
                  <User className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                )}
              </div>
            </div>
          ) : (
            <Link href="/login" className="text-blue-600 dark:text-blue-400 font-medium">
              Sign In
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
