'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Demand } from '@/types';
import { Users, MessageSquare, Clock, Building2 } from 'lucide-react';

interface DemandCardProps {
  demand: Demand;
  onClick?: () => void;
}

export function DemandCard({ demand, onClick }: DemandCardProps) {
  const formatDate = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - new Date(date).getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return new Date(date).toLocaleDateString();
  };

  const getCategoryVariant = (category: string) => {
    switch (category) {
      // Business categories
      case 'Pricing':
        return 'warning';
      case 'Products & Services':
        return 'center';
      case 'Locations':
        return 'default';
      case 'Customer Experience':
        return 'center-left';
      case 'Policies':
        return 'center-right';
      case 'Partnerships':
        return 'right';
      case 'Employee Treatment':
        return 'left';
      // Social/Political categories
      case 'Environmental':
        return 'success';
      case 'Labor Rights':
        return 'center-left';
      case 'Corporate Governance':
        return 'center';
      case 'Consumer Protection':
        return 'warning';
      case 'Social Justice':
        return 'left';
      case 'Political Transparency':
        return 'center-right';
      case 'Privacy & Data':
        return 'right';
      default:
        return 'default';
    }
  };

  return (
    <Card hover onClick={onClick} className="cursor-pointer">
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Header with category and status */}
          <div className="flex items-start justify-between gap-2">
            <Badge variant={getCategoryVariant(demand.category) as any}>
              {demand.category}
            </Badge>
            {demand.status !== 'active' && (
              <Badge variant={demand.status === 'achieved' ? 'success' : 'default'}>
                {demand.status === 'achieved' ? 'Achieved' : 'Closed'}
              </Badge>
            )}
          </div>

          {/* Title */}
          <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-2">
            {demand.title}
          </h3>

          {/* Target company if any */}
          {demand.targetCompany && (
            <div className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400">
              <Building2 className="h-3.5 w-3.5" />
              <span className="truncate">{demand.targetCompany}</span>
            </div>
          )}

          {/* Description preview */}
          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
            {demand.description}
          </p>

          {/* Footer with stats */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
              <span className="flex items-center gap-1">
                <Users className="h-3.5 w-3.5 text-[#741b47]" />
                <span className="font-medium text-[#741b47] dark:text-[#d4619a]">
                  {demand.coSignCount.toLocaleString()}
                </span>
              </span>
              <span className="flex items-center gap-1">
                <MessageSquare className="h-3.5 w-3.5" />
                {demand.commentCount}
              </span>
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-400">
              <Clock className="h-3 w-3" />
              {formatDate(demand.createdAt)}
            </div>
          </div>

          {/* Author */}
          <div className="flex items-center gap-2">
            {demand.authorPhotoURL ? (
              <img
                src={demand.authorPhotoURL}
                alt={demand.authorName}
                className="w-5 h-5 rounded-full"
              />
            ) : (
              <div className="w-5 h-5 rounded-full bg-[#741b47]/20 flex items-center justify-center">
                <span className="text-xs font-medium text-[#741b47]">
                  {demand.authorName.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <span className="text-xs text-gray-500 dark:text-gray-400">
              by {demand.authorName}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
