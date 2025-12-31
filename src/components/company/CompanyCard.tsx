'use client';

import React from 'react';
import { Building2, ExternalLink, ThumbsUp, ThumbsDown, Check } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { PoliticalLeaningBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { CompanyReport } from '@/types';
import { useUserLists } from '@/contexts/UserListsContext';
import { useAuth } from '@/contexts/AuthContext';
import { createCompanyKey } from '@/lib/company-utils';

interface CompanyCardProps {
  report: CompanyReport;
  onClick?: () => void;
  showListButtons?: boolean;
}

export function CompanyCard({ report, onClick, showListButtons = true }: CompanyCardProps) {
  const { company, analysis } = report;
  const { user } = useAuth();
  const { isInSupport, isInOppose, addToList, removeFromList } = useUserLists();

  const companyKey = report.companyKey || createCompanyKey(company.name);
  const inSupport = isInSupport(companyKey);
  const inOppose = isInOppose(companyKey);

  const handleListAction = async (e: React.MouseEvent, listType: 'support' | 'oppose') => {
    e.stopPropagation();
    const isInList = listType === 'support' ? inSupport : inOppose;

    if (isInList) {
      await removeFromList(listType, companyKey);
    } else {
      await addToList(listType, companyKey, company.name);
    }
  };

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
            {showListButtons && user && (
              <>
                <Button
                  variant={inSupport ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={(e) => handleListAction(e, 'support')}
                  className={`p-1.5 ${inSupport ? 'bg-green-600 hover:bg-green-700' : 'hover:text-green-600'}`}
                  title={inSupport ? 'Remove from Support' : 'Add to Support'}
                >
                  {inSupport ? <Check className="h-4 w-4" /> : <ThumbsUp className="h-4 w-4" />}
                </Button>
                <Button
                  variant={inOppose ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={(e) => handleListAction(e, 'oppose')}
                  className={`p-1.5 ${inOppose ? 'bg-red-600 hover:bg-red-700' : 'hover:text-red-600'}`}
                  title={inOppose ? 'Remove from Oppose' : 'Add to Oppose'}
                >
                  {inOppose ? <Check className="h-4 w-4" /> : <ThumbsDown className="h-4 w-4" />}
                </Button>
              </>
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
