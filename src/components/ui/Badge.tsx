'use client';

import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'left' | 'center-left' | 'center' | 'center-right' | 'right' | 'success' | 'warning' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Badge({ children, variant = 'default', size = 'md', className = '' }: BadgeProps) {
  const variants = {
    default: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
    // Left leaning - blue/purple
    left: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300',
    'center-left': 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300',
    // Center - purple
    center: 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300',
    // Right leaning - red/purple
    'center-right': 'bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-900/50 dark:text-fuchsia-300',
    right: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300',
    // Utility variants
    success: 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300',
    warning: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300',
    danger: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base',
  };

  return (
    <span className={`inline-flex items-center font-medium rounded-full ${variants[variant]} ${sizes[size]} ${className}`}>
      {children}
    </span>
  );
}

export function PoliticalLeaningBadge({ leaning }: { leaning: string }) {
  const leaningMap: Record<string, BadgeProps['variant']> = {
    Left: 'left',
    'Center-Left': 'center-left',
    Center: 'center',
    'Center-Right': 'center-right',
    Right: 'right',
    Unknown: 'default',
  };

  return <Badge variant={leaningMap[leaning] || 'default'}>{leaning}</Badge>;
}
