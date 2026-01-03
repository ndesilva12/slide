'use client';

import React, { useState, useEffect } from 'react';
import {
  Building2,
  DollarSign,
  MessageSquare,
  ExternalLink,
  ThumbsUp,
  ThumbsDown,
  ChevronDown,
  ChevronUp,
  PieChart,
  Network,
  Target,
  Newspaper,
  Users,
  Megaphone,
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Badge, PoliticalLeaningBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { CompanyReport as CompanyReportType, Demand } from '@/types';
import Link from 'next/link';
import { useUserLists } from '@/contexts/UserListsContext';
import { useAuth } from '@/contexts/AuthContext';
import { createCompanyKey } from '@/lib/company-utils';
import { PoliticalCompass } from './PoliticalCompass';

interface CompanyReportProps {
  report: CompanyReportType;
}

export function CompanyReportView({ report }: CompanyReportProps) {
  const { company, analysis } = report;
  const { user } = useAuth();
  const { isInSupport, isInOppose, addToList, removeFromList } = useUserLists();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [endorseCount, setEndorseCount] = useState<number>(0);
  const [boycottCount, setBoycottCount] = useState<number>(0);
  const [companyDemands, setCompanyDemands] = useState<Demand[]>([]);

  const companyKey = report.companyKey || createCompanyKey(company.name);
  const inSupport = isInSupport(companyKey);
  const inOppose = isInOppose(companyKey);

  // Fetch endorsement/boycott counts
  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const response = await fetch(`/api/rankings/counts?companyKey=${encodeURIComponent(companyKey)}`);
        const data = await response.json();
        if (data.success) {
          setEndorseCount(data.data.supportCount || 0);
          setBoycottCount(data.data.opposeCount || 0);
        }
      } catch (err) {
        // Silently fail - counts are optional
      }
    };
    fetchCounts();
  }, [companyKey]);

  // Fetch demands targeting this company
  useEffect(() => {
    const fetchDemands = async () => {
      try {
        const response = await fetch(`/api/demands?targetCompanyKey=${encodeURIComponent(companyKey)}&status=active&sortBy=popular`);
        const data = await response.json();
        if (data.success && data.data?.demands) {
          setCompanyDemands(data.data.demands);
        }
      } catch (err) {
        // Silently fail - demands are optional
      }
    };
    fetchDemands();
  }, [companyKey]);

  const handleListAction = async (listType: 'support' | 'oppose') => {
    if (!user) {
      setShowLoginModal(true);
      return;
    }

    const isInList = listType === 'support' ? inSupport : inOppose;
    if (isInList) {
      await removeFromList(listType, companyKey);
    } else {
      await addToList(listType, companyKey, company.name);
    }
  };

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    news: true,
    donations: true,
    statements: true,
    relatedCompanies: true,
    revenue: true,
    demands: true,
  });

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const totalDonations = analysis.donations.reduce((sum, d) => sum + d.amount, 0);
  const partyBreakdown = analysis.donations.reduce(
    (acc, d) => {
      acc[d.party] = (acc[d.party] || 0) + d.amount;
      return acc;
    },
    {} as Record<string, number>
  );
  const donorTypeBreakdown = analysis.donations.reduce(
    (acc, d) => {
      const type = d.donorType || 'Other';
      acc[type] = (acc[type] || 0) + d.amount;
      return acc;
    },
    {} as Record<string, number>
  );

  const revenueLabels: Record<string, string> = {
    executiveCompensation: 'Executive Compensation',
    employeeWages: 'Employee Wages & Benefits',
    operatingExpenses: 'Operating Expenses',
    researchAndDevelopment: 'Research & Development',
    marketing: 'Marketing & Advertising',
    stockBuybacks: 'Stock Buybacks',
    dividends: 'Dividends',
    capitalExpenditures: 'Capital Expenditures',
    charitableDonations: 'Charitable Donations',
    lobbyingAndPolitical: 'Lobbying & Political',
    netProfit: 'Net Profit Retained',
    other: 'Other',
  };

  // Combine subsidiaries and affiliates for the Related Companies section
  const allRelatedCompanies = [
    ...(analysis.subsidiaries || []).map(s => ({
      name: s.name,
      type: s.type,
      description: s.description,
      ownership: s.ownershipPercent ? `${s.ownershipPercent}% owned` : 'Owned',
    })),
    ...(analysis.affiliates || []).map(a => ({
      name: a.name,
      type: a.relationshipType.replace('_', ' '),
      description: a.description,
      ownership: a.ownershipPercent ? `${a.ownershipPercent}% stake` : undefined,
    })),
  ];

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Company Summary Card */}
      <Card>
        <CardContent className="p-4 md:p-6">
          <div className="flex flex-col md:flex-row items-start justify-between gap-4 md:gap-6">
            {/* Left side - Company info */}
            <div className="flex-1 w-full">
              <div className="flex items-start space-x-3 md:space-x-4">
                <div className="w-12 h-12 md:w-16 md:h-16 bg-gray-100 dark:bg-gray-700 rounded-xl md:rounded-2xl flex items-center justify-center flex-shrink-0">
                  {company.logoUrl ? (
                    <img src={company.logoUrl} alt={company.name} className="w-8 h-8 md:w-10 md:h-10 object-contain" />
                  ) : (
                    <Building2 className="w-6 h-6 md:w-8 md:h-8 text-gray-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 md:gap-3 flex-wrap">
                    <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">{company.name}</h1>
                    <PoliticalLeaningBadge leaning={analysis.overallLeaning} />
                  </div>
                  <div className="flex items-center space-x-2 md:space-x-3 mt-1 flex-wrap gap-y-1">
                    {company.ticker && (
                      <span className="text-sm text-gray-500 dark:text-gray-400">{company.ticker}</span>
                    )}
                    {company.industry && (
                      <Badge variant="default" size="sm">{company.industry}</Badge>
                    )}
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {analysis.confidenceScore}% confidence
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">•</span>
                    <span className="flex items-center gap-1 text-sm text-green-600 dark:text-green-400">
                      <ThumbsUp className="h-3.5 w-3.5" />
                      {endorseCount}
                    </span>
                    <span className="flex items-center gap-1 text-sm text-red-600 dark:text-red-400">
                      <ThumbsDown className="h-3.5 w-3.5" />
                      {boycottCount}
                    </span>
                  </div>
                </div>
              </div>

              {/* Summary paragraph */}
              <p className="mt-3 md:mt-4 text-sm md:text-base text-gray-700 dark:text-gray-300">
                {analysis.summary}
              </p>

              {/* Action buttons - outline style when selected */}
              <div className="flex items-center gap-2 md:gap-3 mt-3 md:mt-4 flex-wrap">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleListAction('support')}
                  className={
                    inSupport
                      ? 'border-green-500 text-green-600 dark:border-green-400 dark:text-green-400'
                      : user
                        ? 'hover:border-green-500 hover:text-green-600'
                        : 'opacity-50 border-gray-300 text-gray-400'
                  }
                >
                  <ThumbsUp className="h-4 w-4 mr-1.5" />
                  {inSupport ? 'Endorsed' : 'Endorse'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleListAction('oppose')}
                  className={
                    inOppose
                      ? 'border-red-500 text-red-600 dark:border-red-400 dark:text-red-400'
                      : user
                        ? 'hover:border-red-500 hover:text-red-600'
                        : 'opacity-50 border-gray-300 text-gray-400'
                  }
                >
                  <ThumbsDown className="h-4 w-4 mr-1.5" />
                  {inOppose ? 'Boycotting' : 'Boycott'}
                </Button>
                {company.website && (
                  <a href={company.website} target="_blank" rel="noopener noreferrer">
                    <Button variant="ghost" size="sm">
                      <ExternalLink className="h-4 w-4 mr-1" />
                      Website
                    </Button>
                  </a>
                )}
              </div>
            </div>

            {/* Right side - Political Compass */}
            {analysis.politicalCompass && (
              <div className="flex-shrink-0 self-center">
                <PoliticalCompass
                  compass={analysis.politicalCompass}
                  size="lg"
                  leaning={analysis.overallLeaning}
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Positions & Affiliates Section */}
      {((analysis.positions && analysis.positions.length > 0) || (analysis.keyAffiliates && analysis.keyAffiliates.length > 0)) && (
        <Card>
          <CardContent className="p-4 md:p-6">
            <div className="grid md:grid-cols-2 gap-4 md:gap-6">
              {/* Positions Column */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Target className="h-5 w-5 text-[#741b47]" />
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Positions</h2>
                </div>
                <ul className="space-y-2">
                  {(analysis.positions || []).slice(0, 5).map((position, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="text-[#741b47] leading-5">•</span>
                      <span className="text-sm text-gray-700 dark:text-gray-300 leading-5">
                        {position.stance}
                      </span>
                    </li>
                  ))}
                  {(!analysis.positions || analysis.positions.length === 0) && (
                    <li className="text-sm text-gray-400 italic">No positions available</li>
                  )}
                </ul>
              </div>

              {/* Affiliates Column */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Network className="h-5 w-5 text-teal-500" />
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Affiliates</h2>
                </div>
                <div className="space-y-2">
                  {(analysis.keyAffiliates || []).slice(0, 5).map((affiliate, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-gray-100 dark:bg-gray-700 rounded flex items-center justify-center flex-shrink-0">
                        {affiliate.logoUrl ? (
                          <img src={affiliate.logoUrl} alt={affiliate.name} className="w-4 h-4 object-contain" />
                        ) : (
                          <Building2 className="w-3 h-3 text-gray-400" />
                        )}
                      </div>
                      <span className="text-sm text-gray-700 dark:text-gray-300 truncate">
                        {affiliate.name}
                      </span>
                      <span className="text-xs text-gray-400 dark:text-gray-500">
                        {affiliate.relationship}
                      </span>
                    </div>
                  ))}
                  {(!analysis.keyAffiliates || analysis.keyAffiliates.length === 0) && (
                    <p className="text-sm text-gray-400 italic">No affiliates available</p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* News Section */}
      {analysis.newsItems && analysis.newsItems.length > 0 && (
        <Card>
          <CardHeader>
            <button
              onClick={() => toggleSection('news')}
              className="w-full flex items-center justify-between"
            >
              <div className="flex items-center space-x-2">
                <Newspaper className="h-5 w-5 text-orange-500" />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  News
                </h2>
                <Badge variant="default">{analysis.newsItems.length}</Badge>
              </div>
              {expandedSections.news ? (
                <ChevronUp className="h-5 w-5 text-gray-400" />
              ) : (
                <ChevronDown className="h-5 w-5 text-gray-400" />
              )}
            </button>
          </CardHeader>

          {expandedSections.news && (
            <CardContent className="p-4 md:p-6 pt-0">
              <div className="space-y-2">
                {analysis.newsItems.map((item, i) => (
                  <a
                    key={i}
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-[#741b47] dark:hover:border-[#9b2761] transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2">
                        {item.headline}
                      </p>
                      <ExternalLink className="h-4 w-4 text-gray-400 flex-shrink-0 mt-0.5" />
                    </div>
                    <div className="flex items-center gap-2 mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                      <span>{item.source}</span>
                      {item.date && (
                        <>
                          <span>•</span>
                          <span>{item.date}</span>
                        </>
                      )}
                      {item.topic && (
                        <Badge variant="default" size="sm">{item.topic}</Badge>
                      )}
                    </div>
                  </a>
                ))}
              </div>
            </CardContent>
          )}
        </Card>
      )}

      {/* Public Statements Section */}
      {analysis.publicStatements.length > 0 && (
        <Card>
          <CardHeader>
            <button
              onClick={() => toggleSection('statements')}
              className="w-full flex items-center justify-between"
            >
              <div className="flex items-center space-x-2">
                <MessageSquare className="h-5 w-5 text-blue-500" />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Public Statements
                </h2>
                <Badge variant="default">{analysis.publicStatements.length}</Badge>
              </div>
              {expandedSections.statements ? (
                <ChevronUp className="h-5 w-5 text-gray-400" />
              ) : (
                <ChevronDown className="h-5 w-5 text-gray-400" />
              )}
            </button>
          </CardHeader>

          {expandedSections.statements && (
            <CardContent className="p-4 md:p-6 pt-0">
              <div className="space-y-3 md:space-y-4">
                {analysis.publicStatements.map((statement, i) => (
                  <div
                    key={i}
                    className="p-3 md:p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {statement.speaker}
                        </p>
                        <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400">
                          {statement.role} • {statement.date}
                        </p>
                      </div>
                      <Badge variant="default" size="sm">{statement.topic}</Badge>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 italic">
                      &ldquo;{statement.statement}&rdquo;
                    </p>
                    <div className="mt-2 flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                      <span>Source: {statement.source}</span>
                      {statement.url && (
                        <a
                          href={statement.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:underline"
                        >
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          )}
        </Card>
      )}

      {/* Revenue Breakdown Section */}
      {analysis.revenueBreakdown && (
        <Card>
          <CardHeader>
            <button
              onClick={() => toggleSection('revenue')}
              className="w-full flex items-center justify-between"
            >
              <div className="flex items-center space-x-2">
                <PieChart className="h-5 w-5 text-[#741b47]" />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Revenue Allocation
                </h2>
              </div>
              {expandedSections.revenue ? (
                <ChevronUp className="h-5 w-5 text-gray-400" />
              ) : (
                <ChevronDown className="h-5 w-5 text-gray-400" />
              )}
            </button>
          </CardHeader>

          {expandedSections.revenue && (
            <CardContent className="p-4 md:p-6 pt-0">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                Where does the company&apos;s money go? (as % of revenue)
              </p>
              <div className="space-y-3">
                {Object.entries(analysis.revenueBreakdown)
                  .filter(([key, value]) =>
                    typeof value === 'number' &&
                    value > 0 &&
                    key !== 'fiscalYear'
                  )
                  .sort(([, a], [, b]) => (b as number) - (a as number))
                  .map(([key, value]) => (
                    <div key={key}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs md:text-sm text-gray-700 dark:text-gray-300">
                          {revenueLabels[key] || key}
                        </span>
                        <span className="text-xs md:text-sm font-medium text-gray-900 dark:text-white">
                          {value}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-[#741b47] h-2 rounded-full transition-all"
                          style={{ width: `${Math.min(value as number, 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
              </div>
              {analysis.revenueBreakdown.source && (
                <p className="mt-4 text-xs text-gray-400 dark:text-gray-500">
                  Source: {analysis.revenueBreakdown.source}
                  {analysis.revenueBreakdown.fiscalYear && ` (FY${analysis.revenueBreakdown.fiscalYear})`}
                </p>
              )}
            </CardContent>
          )}
        </Card>
      )}

      {/* Donations Section */}
      {analysis.donations.length > 0 && (
        <Card>
          <CardHeader>
            <button
              onClick={() => toggleSection('donations')}
              className="w-full flex items-center justify-between"
            >
              <div className="flex items-center space-x-2">
                <DollarSign className="h-5 w-5 text-green-500" />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Political Donations
                </h2>
                <Badge variant="default">{analysis.donations.length}</Badge>
              </div>
              {expandedSections.donations ? (
                <ChevronUp className="h-5 w-5 text-gray-400" />
              ) : (
                <ChevronDown className="h-5 w-5 text-gray-400" />
              )}
            </button>
          </CardHeader>

          {expandedSections.donations && (
            <CardContent className="p-4 md:p-6 pt-0">
              {/* Breakdowns */}
              <div className="grid md:grid-cols-2 gap-3 md:gap-4 mb-4">
                {/* Party breakdown */}
                <div className="p-3 md:p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                    By Party
                  </h3>
                  <div className="space-y-2">
                    {Object.entries(partyBreakdown).map(([party, amount]) => (
                      <div key={party} className="flex items-center justify-between">
                        <span className="text-sm text-gray-700 dark:text-gray-300">{party}</span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {formatCurrency(amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Donor type breakdown */}
                <div className="p-3 md:p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                    By Source
                  </h3>
                  <div className="space-y-2">
                    {Object.entries(donorTypeBreakdown).map(([type, amount]) => (
                      <div key={type} className="flex items-center justify-between">
                        <span className="text-sm text-gray-700 dark:text-gray-300">{type}</span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {formatCurrency(amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Individual donations */}
              <div className="space-y-2 md:space-y-3">
                {analysis.donations.map((donation, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-2 md:p-3 border border-gray-200 dark:border-gray-700 rounded-lg"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{donation.recipient}</p>
                      <div className="flex items-center flex-wrap gap-1 md:gap-2 mt-1">
                        <Badge
                          variant={
                            donation.party === 'Democrat'
                              ? 'left'
                              : donation.party === 'Republican'
                              ? 'right'
                              : 'default'
                          }
                          size="sm"
                        >
                          {donation.party}
                        </Badge>
                        {donation.donorType && (
                          <Badge variant="default" size="sm">
                            {donation.donorType}
                          </Badge>
                        )}
                        <span className="text-xs text-gray-500 dark:text-gray-400">{donation.year}</span>
                      </div>
                    </div>
                    <p className="text-sm md:text-lg font-bold text-gray-900 dark:text-white">
                      {formatCurrency(donation.amount)}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          )}
        </Card>
      )}

      {/* Related Companies Section - Combined subsidiaries and affiliates */}
      {allRelatedCompanies.length > 0 && (
        <Card>
          <CardHeader>
            <button
              onClick={() => toggleSection('relatedCompanies')}
              className="w-full flex items-center justify-between"
            >
              <div className="flex items-center space-x-2">
                <Network className="h-5 w-5 text-indigo-500" />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Related Companies
                </h2>
                <Badge variant="default">{allRelatedCompanies.length}</Badge>
              </div>
              {expandedSections.relatedCompanies ? (
                <ChevronUp className="h-5 w-5 text-gray-400" />
              ) : (
                <ChevronDown className="h-5 w-5 text-gray-400" />
              )}
            </button>
          </CardHeader>

          {expandedSections.relatedCompanies && (
            <CardContent className="p-4 md:p-6 pt-0">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                Subsidiaries, owned brands, and business partners
              </p>
              <div className="grid gap-2 md:gap-3 sm:grid-cols-2">
                {allRelatedCompanies.map((item, i) => (
                  <div
                    key={i}
                    className="p-3 md:p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-medium text-sm md:text-base text-gray-900 dark:text-white">
                        {item.name}
                      </p>
                      <Badge variant="default" size="sm">
                        {item.type}
                      </Badge>
                    </div>
                    {item.ownership && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                        {item.ownership}
                      </p>
                    )}
                    {item.description && (
                      <p className="text-xs md:text-sm text-gray-600 dark:text-gray-300">
                        {item.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          )}
        </Card>
      )}

      {/* Active Demands Section */}
      {companyDemands.length > 0 && (
        <Card>
          <CardHeader>
            <button
              onClick={() => toggleSection('demands')}
              className="w-full flex items-center justify-between"
            >
              <div className="flex items-center space-x-2">
                <Megaphone className="h-5 w-5 text-[#741b47]" />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Active Demands
                </h2>
                <Badge variant="center">{companyDemands.length}</Badge>
              </div>
              {expandedSections.demands ? (
                <ChevronUp className="h-5 w-5 text-gray-400" />
              ) : (
                <ChevronDown className="h-5 w-5 text-gray-400" />
              )}
            </button>
          </CardHeader>

          {expandedSections.demands && (
            <CardContent className="p-4 md:p-6 pt-0">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                Petitions and demands from users targeting this company
              </p>
              <div className="space-y-3">
                {companyDemands.map((demand) => (
                  <Link
                    key={demand.id}
                    href={`/demands/${demand.id}`}
                    className="block p-3 md:p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-[#741b47]/50 dark:hover:border-[#741b47]/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-sm md:text-base text-gray-900 dark:text-white line-clamp-2">
                          {demand.title}
                        </h3>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <Badge variant="default" size="sm">{demand.category}</Badge>
                          <span className="flex items-center gap-1 text-xs text-[#741b47] dark:text-[#d4619a]">
                            <Users className="h-3 w-3" />
                            {demand.coSignCount.toLocaleString()} co-signed
                          </span>
                        </div>
                        <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 mt-2 line-clamp-2">
                          {demand.description}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
              <Link
                href={`/demands?search=${encodeURIComponent(company.name)}`}
                className="inline-flex items-center gap-1 mt-4 text-sm text-[#741b47] dark:text-[#d4619a] hover:underline"
              >
                View all demands
                <ExternalLink className="h-3 w-3" />
              </Link>
            </CardContent>
          )}
        </Card>
      )}

      {/* Sources */}
      {analysis.sources.length > 0 && (
        <Card>
          <CardContent className="p-4 md:p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Sources</h2>
            <ul className="space-y-1">
              {analysis.sources.map((source, i) => (
                <li key={i} className="text-xs md:text-sm text-gray-500 dark:text-gray-400">
                  {typeof source === 'string' ? (
                    source
                  ) : typeof source === 'object' && source !== null ? (
                    (source as { name?: string; url?: string }).url ? (
                      <a
                        href={(source as { url: string }).url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        {(source as { name?: string }).name || (source as { url: string }).url}
                      </a>
                    ) : (
                      (source as { name?: string }).name || JSON.stringify(source)
                    )
                  ) : (
                    String(source)
                  )}
                </li>
              ))}
            </ul>
            <p className="mt-4 text-xs text-gray-400 dark:text-gray-500">
              Last updated: {new Date(analysis.lastUpdated).toLocaleDateString()}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Login Modal */}
      <Modal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} title="Sign In Required" size="sm">
        <div className="text-center">
          <div className="w-12 h-12 bg-[#741b47]/10 dark:bg-[#741b47]/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <ThumbsUp className="h-6 w-6 text-[#741b47] dark:text-[#d4619a]" />
          </div>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Create a free account to endorse or boycott companies and track your preferences.
          </p>
          <div className="flex flex-col gap-3">
            <Link href="/signup" onClick={() => setShowLoginModal(false)}>
              <Button className="w-full">Create Free Account</Button>
            </Link>
            <Link href="/login" onClick={() => setShowLoginModal(false)}>
              <Button variant="outline" className="w-full">Sign In</Button>
            </Link>
          </div>
        </div>
      </Modal>
    </div>
  );
}
