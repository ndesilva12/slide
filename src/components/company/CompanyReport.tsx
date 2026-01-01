'use client';

import React, { useState } from 'react';
import {
  Building2,
  DollarSign,
  MessageSquare,
  Users,
  TrendingUp,
  ExternalLink,
  ThumbsUp,
  ThumbsDown,
  Check,
  ChevronDown,
  ChevronUp,
  PieChart,
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Badge, PoliticalLeaningBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { CompanyReport as CompanyReportType } from '@/types';
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

  const companyKey = report.companyKey || createCompanyKey(company.name);
  const inSupport = isInSupport(companyKey);
  const inOppose = isInOppose(companyKey);

  const handleListAction = async (listType: 'support' | 'oppose') => {
    const isInList = listType === 'support' ? inSupport : inOppose;
    if (isInList) {
      await removeFromList(listType, companyKey);
    } else {
      await addToList(listType, companyKey, company.name);
    }
  };
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    donations: true,
    statements: true,
    partnerships: false,
    revenue: true,
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

  return (
    <div className="space-y-6">
      {/* Company Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-start justify-between gap-6">
            {/* Left side - Company info and actions */}
            <div className="flex-1">
              <div className="flex items-start space-x-4">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-2xl flex items-center justify-center flex-shrink-0">
                  {company.logoUrl ? (
                    <img src={company.logoUrl} alt={company.name} className="w-10 h-10 object-contain" />
                  ) : (
                    <Building2 className="w-8 h-8 text-gray-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{company.name}</h1>
                    <PoliticalLeaningBadge leaning={analysis.overallLeaning} />
                  </div>
                  <div className="flex items-center space-x-3 mt-1">
                    {company.ticker && (
                      <span className="text-gray-500 dark:text-gray-400">{company.ticker}</span>
                    )}
                    {company.industry && (
                      <Badge variant="default">{company.industry}</Badge>
                    )}
                  </div>
                  {company.description && (
                    <p className="mt-2 text-gray-600 dark:text-gray-300">
                      {company.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-3 mt-4 flex-wrap">
                {user && (
                  <>
                    <Button
                      variant={inSupport ? 'primary' : 'outline'}
                      onClick={() => handleListAction('support')}
                      className={inSupport ? 'bg-green-600 hover:bg-green-700' : 'hover:border-green-500 hover:text-green-600'}
                    >
                      {inSupport ? <Check className="h-4 w-4 mr-2" /> : <ThumbsUp className="h-4 w-4 mr-2" />}
                      {inSupport ? 'Supporting' : 'Support'}
                    </Button>
                    <Button
                      variant={inOppose ? 'primary' : 'outline'}
                      onClick={() => handleListAction('oppose')}
                      className={inOppose ? 'bg-red-600 hover:bg-red-700' : 'hover:border-red-500 hover:text-red-600'}
                    >
                      {inOppose ? <Check className="h-4 w-4 mr-2" /> : <ThumbsDown className="h-4 w-4 mr-2" />}
                      {inOppose ? 'Opposing' : 'Oppose'}
                    </Button>
                  </>
                )}
                {company.website && (
                  <a href={company.website} target="_blank" rel="noopener noreferrer">
                    <Button variant="ghost">
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
                <PoliticalCompass compass={analysis.politicalCompass} size="lg" />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Political Leaning Summary */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Political Analysis</h2>
          </div>

          <p className="text-gray-700 dark:text-gray-300 mb-4">{analysis.summary}</p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
              <div className="flex items-center space-x-2 text-gray-500 dark:text-gray-400 mb-1">
                <TrendingUp className="h-4 w-4" />
                <span className="text-sm">Confidence</span>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {analysis.confidenceScore}%
              </p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
              <div className="flex items-center space-x-2 text-gray-500 dark:text-gray-400 mb-1">
                <DollarSign className="h-4 w-4" />
                <span className="text-sm">Total Donations</span>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(totalDonations)}
              </p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
              <div className="flex items-center space-x-2 text-gray-500 dark:text-gray-400 mb-1">
                <MessageSquare className="h-4 w-4" />
                <span className="text-sm">Statements</span>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {analysis.publicStatements.length}
              </p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
              <div className="flex items-center space-x-2 text-gray-500 dark:text-gray-400 mb-1">
                <Users className="h-4 w-4" />
                <span className="text-sm">Partnerships</span>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {analysis.partnerships.length}
              </p>
            </div>
          </div>

          {/* Key Topics */}
          {analysis.keyTopics.length > 0 && (
            <div className="mt-4">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Key Topics</h3>
              <div className="flex flex-wrap gap-2">
                {analysis.keyTopics.map((topic, i) => (
                  <Badge key={i} variant="default">{topic}</Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Donations Section */}
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
          <CardContent className="p-6 pt-0">
            {/* Breakdowns */}
            <div className="grid md:grid-cols-2 gap-4 mb-4">
              {/* Party breakdown */}
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                  By Party
                </h3>
                <div className="space-y-2">
                  {Object.entries(partyBreakdown).map(([party, amount]) => (
                    <div key={party} className="flex items-center justify-between">
                      <span className="text-gray-700 dark:text-gray-300">{party}</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {formatCurrency(amount)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Donor type breakdown */}
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                  By Source
                </h3>
                <div className="space-y-2">
                  {Object.entries(donorTypeBreakdown).map(([type, amount]) => (
                    <div key={type} className="flex items-center justify-between">
                      <span className="text-gray-700 dark:text-gray-300">{type}</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {formatCurrency(amount)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Individual donations */}
            <div className="space-y-3">
              {analysis.donations.map((donation, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{donation.recipient}</p>
                    <div className="flex items-center flex-wrap gap-2 mt-1">
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
                      <span className="text-sm text-gray-500 dark:text-gray-400">{donation.year}</span>
                    </div>
                  </div>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    {formatCurrency(donation.amount)}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        )}
      </Card>

      {/* Public Statements Section */}
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
          <CardContent className="p-6 pt-0">
            <div className="space-y-4">
              {analysis.publicStatements.map((statement, i) => (
                <div
                  key={i}
                  className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {statement.speaker}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {statement.role} • {statement.date}
                      </p>
                    </div>
                    <Badge variant="default" size="sm">{statement.topic}</Badge>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 italic">
                    &ldquo;{statement.statement}&rdquo;
                  </p>
                  <div className="mt-2 flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
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

      {/* Partnerships Section */}
      <Card>
        <CardHeader>
          <button
            onClick={() => toggleSection('partnerships')}
            className="w-full flex items-center justify-between"
          >
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-purple-500" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Notable Partnerships
              </h2>
              <Badge variant="default">{analysis.partnerships.length}</Badge>
            </div>
            {expandedSections.partnerships ? (
              <ChevronUp className="h-5 w-5 text-gray-400" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-400" />
            )}
          </button>
        </CardHeader>

        {expandedSections.partnerships && (
          <CardContent className="p-6 pt-0">
            <div className="space-y-3">
              {analysis.partnerships.map((partner, i) => (
                <div
                  key={i}
                  className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {partner.partnerName}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {partner.partnerType}
                      </p>
                    </div>
                    {partner.politicalLeaning && (
                      <Badge variant="default">{partner.politicalLeaning}</Badge>
                    )}
                  </div>
                  <p className="mt-2 text-gray-600 dark:text-gray-300">{partner.relevance}</p>
                </div>
              ))}
            </div>
          </CardContent>
        )}
      </Card>

      {/* Revenue Breakdown Section */}
      {analysis.revenueBreakdown && (
        <Card>
          <CardHeader>
            <button
              onClick={() => toggleSection('revenue')}
              className="w-full flex items-center justify-between"
            >
              <div className="flex items-center space-x-2">
                <PieChart className="h-5 w-5 text-amber-500" />
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
            <CardContent className="p-6 pt-0">
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
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          {revenueLabels[key] || key}
                        </span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {value}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-amber-500 h-2 rounded-full transition-all"
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

      {/* Sources */}
      {analysis.sources.length > 0 && (
        <Card>
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Sources</h2>
            <ul className="space-y-1">
              {analysis.sources.map((source, i) => (
                <li key={i} className="text-sm text-gray-500 dark:text-gray-400">
                  {source}
                </li>
              ))}
            </ul>
            <p className="mt-4 text-xs text-gray-400 dark:text-gray-500">
              Last updated: {new Date(analysis.lastUpdated).toLocaleDateString()}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
