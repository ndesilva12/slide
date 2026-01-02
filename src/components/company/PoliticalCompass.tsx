'use client';

import React from 'react';
import { PoliticalCompass as PoliticalCompassType } from '@/types';

interface PoliticalCompassProps {
  compass: PoliticalCompassType;
  size?: 'sm' | 'md' | 'lg';
  showLabels?: boolean;
  leaning?: string;
}

// Get color based on political leaning
function getLeaningColor(leaning?: string): { bg: string; text: string; border: string } {
  switch (leaning) {
    case 'Left':
      return {
        bg: 'bg-blue-100 dark:bg-blue-900/30',
        text: 'text-blue-600 dark:text-blue-400',
        border: 'border-blue-300 dark:border-blue-700'
      };
    case 'Center-Left':
      return {
        bg: 'bg-indigo-100 dark:bg-indigo-900/30',
        text: 'text-indigo-600 dark:text-indigo-400',
        border: 'border-indigo-300 dark:border-indigo-700'
      };
    case 'Center':
      return {
        bg: 'bg-purple-100 dark:bg-purple-900/30',
        text: 'text-purple-600 dark:text-purple-400',
        border: 'border-purple-300 dark:border-purple-700'
      };
    case 'Center-Right':
      return {
        bg: 'bg-fuchsia-100 dark:bg-fuchsia-900/30',
        text: 'text-fuchsia-600 dark:text-fuchsia-400',
        border: 'border-fuchsia-300 dark:border-fuchsia-700'
      };
    case 'Right':
      return {
        bg: 'bg-red-100 dark:bg-red-900/30',
        text: 'text-red-600 dark:text-red-400',
        border: 'border-red-300 dark:border-red-700'
      };
    default:
      return {
        bg: 'bg-purple-50 dark:bg-purple-900/20',
        text: 'text-purple-600 dark:text-purple-400',
        border: 'border-purple-200 dark:border-purple-800'
      };
  }
}

export function PoliticalCompass({
  compass,
  size = 'md',
  showLabels = true,
  leaning
}: PoliticalCompassProps) {
  // Convert -3 to +3 range to 0-100% for positioning
  const xPercent = ((compass.x + 3) / 6) * 100;
  const yPercent = ((3 - compass.y) / 6) * 100; // Invert Y since CSS Y grows downward

  const sizeClasses = {
    sm: 'w-28 h-28',
    md: 'w-40 h-40',
    lg: 'w-56 h-56',
  };

  const dotSizes = {
    sm: 'w-2.5 h-2.5',
    md: 'w-3.5 h-3.5',
    lg: 'w-5 h-5',
  };

  const labelSizes = {
    sm: 'text-[9px]',
    md: 'text-[11px]',
    lg: 'text-sm',
  };

  const padding = {
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-5',
  };

  const colors = getLeaningColor(leaning);

  return (
    <div className="flex flex-col items-center">
      {/* Outer container with padding for labels */}
      <div className={`relative ${padding[size]}`}>
        {/* Glass container */}
        <div className={`${sizeClasses[size]} relative rounded-xl ${colors.bg} border ${colors.border} backdrop-blur-sm shadow-sm`}>
          {/* Axis lines */}
          <div className="absolute inset-0">
            {/* Vertical line (Left-Right axis) */}
            <div className="absolute left-1/2 top-2 bottom-2 w-px bg-gray-300/60 dark:bg-gray-600/60 -translate-x-1/2" />
            {/* Horizontal line (Freedom-Safety axis) */}
            <div className="absolute top-1/2 left-2 right-2 h-px bg-gray-300/60 dark:bg-gray-600/60 -translate-y-1/2" />
          </div>

          {/* Company dot */}
          <div
            className={`absolute ${dotSizes[size]} bg-gray-800 dark:bg-white rounded-full shadow-lg border-2 border-white dark:border-gray-700 transform -translate-x-1/2 -translate-y-1/2 z-10`}
            style={{
              left: `${xPercent}%`,
              top: `${yPercent}%`,
            }}
          />
        </div>

        {/* Axis labels - positioned outside the box */}
        {showLabels && (
          <>
            {/* Less Government (top) */}
            <span className={`absolute top-0 left-1/2 -translate-x-1/2 ${labelSizes[size]} text-gray-400 dark:text-gray-500 font-medium whitespace-nowrap`}>
              Less Gov
            </span>
            {/* More Government (bottom) */}
            <span className={`absolute bottom-0 left-1/2 -translate-x-1/2 ${labelSizes[size]} text-gray-400 dark:text-gray-500 font-medium whitespace-nowrap`}>
              More Gov
            </span>
            {/* Left */}
            <span className={`absolute left-0 top-1/2 -translate-y-1/2 ${labelSizes[size]} text-gray-400 dark:text-gray-500 font-medium`}>
              Left
            </span>
            {/* Right */}
            <span className={`absolute right-0 top-1/2 -translate-y-1/2 ${labelSizes[size]} text-gray-400 dark:text-gray-500 font-medium`}>
              Right
            </span>
          </>
        )}
      </div>

      {/* Coordinates display */}
      <div className={`mt-1 ${labelSizes[size]} text-gray-400 dark:text-gray-500`}>
        ({compass.x.toFixed(1)}, {compass.y.toFixed(1)})
      </div>
    </div>
  );
}
