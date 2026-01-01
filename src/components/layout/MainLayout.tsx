'use client';

import React from 'react';
import { Navigation } from './Navigation';
import { Header } from './Header';

interface MainLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  showHeader?: boolean;
}

export function MainLayout({ children, title, subtitle, showHeader = true }: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 overflow-x-hidden">
      <Navigation />

      {/* Main Content */}
      <main className="md:pt-16 pb-20 md:pb-8">
        {showHeader && <Header title={title} subtitle={subtitle} />}
        <div className="max-w-7xl mx-auto px-3 md:px-4 py-3 md:py-6">
          {children}
        </div>
      </main>
    </div>
  );
}
