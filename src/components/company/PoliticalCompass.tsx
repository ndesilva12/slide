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
    <div className="flex flex-col items-center">
      <div className={`${sizeClasses[size]} relative`}>
        {/* Background quadrants */}
        <div className="absolute inset-0 grid grid-cols-2 grid-rows-2">
          {/* Top-left: Left + Freedom (Libertarian Left) */}
          <div className="bg-green-100 dark:bg-green-900/30 rounded-tl-lg" />
          {/* Top-right: Right + Freedom (Libertarian Right) */}
          <div className="bg-purple-100 dark:bg-purple-900/30 rounded-tr-lg" />
          {/* Bottom-left: Left + Safety (Authoritarian Left) */}
          <div className="bg-red-100 dark:bg-red-900/30 rounded-bl-lg" />
          {/* Bottom-right: Right + Safety (Authoritarian Right) */}
          <div className="bg-blue-100 dark:bg-blue-900/30 rounded-br-lg" />
        </div>

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

        {/* Axis labels */}
        {showLabels && (
          <>
            {/* Freedom (top) */}
            <span className={`absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full pb-0.5 ${labelSizes[size]} text-gray-500 dark:text-gray-400 font-medium`}>
              Freedom
            </span>
            {/* Safety (bottom) */}
            <span className={`absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full pt-0.5 ${labelSizes[size]} text-gray-500 dark:text-gray-400 font-medium`}>
              Safety
            </span>
            {/* Left */}
            <span className={`absolute left-0 top-1/2 -translate-y-1/2 -translate-x-full pr-1 ${labelSizes[size]} text-gray-500 dark:text-gray-400 font-medium`}>
              Left
            </span>
            {/* Right */}
            <span className={`absolute right-0 top-1/2 -translate-y-1/2 translate-x-full pl-1 ${labelSizes[size]} text-gray-500 dark:text-gray-400 font-medium`}>
              Right
            </span>
          </>
        )}
      </div>

      {/* Coordinates display */}
      <div className={`mt-2 ${labelSizes[size]} text-gray-400 dark:text-gray-500`}>
        ({compass.x.toFixed(1)}, {compass.y.toFixed(1)})
      </div>
    </div>
  );
}
