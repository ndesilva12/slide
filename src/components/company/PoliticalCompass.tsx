'use client';

import React from 'react';
import { PoliticalCompass as PoliticalCompassType } from '@/types';

interface PoliticalCompassProps {
  compass: PoliticalCompassType;
  size?: 'sm' | 'md' | 'lg';
  showLabels?: boolean;
}

export function PoliticalCompass({
  compass,
  size = 'md',
  showLabels = true
}: PoliticalCompassProps) {
  // Convert -2 to +2 range to 0-100% for positioning
  const xPercent = ((compass.x + 2) / 4) * 100;
  const yPercent = ((2 - compass.y) / 4) * 100; // Invert Y since CSS Y grows downward

  const sizeClasses = {
    sm: 'w-24 h-24',
    md: 'w-32 h-32',
    lg: 'w-48 h-48',
  };

  const dotSizes = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4',
  };

  const labelSizes = {
    sm: 'text-[8px]',
    md: 'text-[10px]',
    lg: 'text-xs',
  };

  return (
    <div className="relative">
      {/* Coordinates display - top left outside the compass */}
      <div className={`absolute -top-5 left-0 ${labelSizes[size]} text-gray-400 dark:text-gray-500`}>
        ({compass.x.toFixed(1)}, {compass.y.toFixed(1)})
      </div>

      <div className={`${sizeClasses[size]} relative`}>
        {/* Light purple gradient background */}
        <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-purple-50 via-purple-100/50 to-purple-50 dark:from-purple-900/20 dark:via-purple-800/15 dark:to-purple-900/20" />

        {/* Axis lines */}
        <div className="absolute inset-0">
          {/* Vertical line (Left-Right axis) */}
          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gray-400 dark:bg-gray-500 -translate-x-1/2" />
          {/* Horizontal line (Freedom-Safety axis) */}
          <div className="absolute top-1/2 left-0 right-0 h-px bg-gray-400 dark:bg-gray-500 -translate-y-1/2" />
        </div>

        {/* Company dot */}
        <div
          className={`absolute ${dotSizes[size]} bg-gray-900 dark:bg-white rounded-full shadow-lg border-2 border-white dark:border-gray-800 transform -translate-x-1/2 -translate-y-1/2 z-10`}
          style={{
            left: `${xPercent}%`,
            top: `${yPercent}%`,
          }}
        />

        {/* Axis labels - inside the box */}
        {showLabels && (
          <>
            {/* Freedom (top center, inside) */}
            <span className={`absolute top-1 left-1/2 -translate-x-1/2 ${labelSizes[size]} text-gray-500 dark:text-gray-400 font-medium`}>
              Freedom
            </span>
            {/* Safety (bottom center, inside) */}
            <span className={`absolute bottom-1 left-1/2 -translate-x-1/2 ${labelSizes[size]} text-gray-500 dark:text-gray-400 font-medium`}>
              Safety
            </span>
            {/* Left (left center, inside) */}
            <span className={`absolute left-1 top-1/2 -translate-y-1/2 ${labelSizes[size]} text-gray-500 dark:text-gray-400 font-medium`}>
              L
            </span>
            {/* Right (right center, inside) */}
            <span className={`absolute right-1 top-1/2 -translate-y-1/2 ${labelSizes[size]} text-gray-500 dark:text-gray-400 font-medium`}>
              R
            </span>
          </>
        )}
      </div>
    </div>
  );
}
