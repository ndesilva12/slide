'use client';

import React from 'react';
import { Building2, ExternalLink, Plus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { PoliticalLeaningBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { CompanyReport } from '@/types';

interface CompanyCardProps {
  report: CompanyReport;
  onClick?: () => void;
  onAddToList?: () => void;
  showAddToList?: boolean;
}

export function CompanyCard({ report, onClick, onAddToList, showAddToList = true }: CompanyCardProps) {
  const { company, analysis } = report;

  return (
    <Card hover onClick={onClick} className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-xl flex items-center justify-center flex-shrink-0">
              {company.logoUrl ? (
                <img src={company.logoUrl} alt={company.name} className="w-8 h-8 object-contain" />
              ) : (
                <Building2 className="w-6 h-6 text-gray-400" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                {company.name}
              </h3>
              {company.ticker && (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {company.ticker}
                </p>
              )}
              {company.industry && (
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  {company.industry}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <PoliticalLeaningBadge leaning={analysis.overallLeaning} />
          </div>
        </div>

        <p className="mt-3 text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
          {analysis.summary}
        </p>

        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
            <span>Confidence: {analysis.confidenceScore}%</span>
            <span>{analysis.donations.length} donations</span>
          </div>

          <div className="flex items-center space-x-2">
            {showAddToList && onAddToList && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onAddToList();
                }}
                className="p-1"
              >
                <Plus className="h-4 w-4" />
              </Button>
            )}
            {company.website && (
              <a
                href={company.website}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="p-1 text-gray-400 hover:text-blue-500 transition-colors"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
