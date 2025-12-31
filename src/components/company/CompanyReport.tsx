'use client';

import React, { useState } from 'react';
import {
  Building2,
  DollarSign,
  MessageSquare,
  Users,
  TrendingUp,
  ExternalLink,
  Plus,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Badge, PoliticalLeaningBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { CompanyReport as CompanyReportType } from '@/types';

interface CompanyReportProps {
  report: CompanyReportType;
  onAddToList?: () => void;
}

export function CompanyReportView({ report, onAddToList }: CompanyReportProps) {
  const { company, analysis } = report;
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    donations: true,
    statements: true,
    partnerships: false,
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

  return (
    <div className="space-y-6">
      {/* Company Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-4">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-2xl flex items-center justify-center">
                {company.logoUrl ? (
                  <img src={company.logoUrl} alt={company.name} className="w-10 h-10 object-contain" />
                ) : (
                  <Building2 className="w-8 h-8 text-gray-400" />
                )}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{company.name}</h1>
                <div className="flex items-center space-x-3 mt-1">
                  {company.ticker && (
                    <span className="text-gray-500 dark:text-gray-400">{company.ticker}</span>
                  )}
                  {company.industry && (
                    <Badge variant="default">{company.industry}</Badge>
                  )}
                </div>
                {company.description && (
                  <p className="mt-2 text-gray-600 dark:text-gray-300 max-w-2xl">
                    {company.description}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {onAddToList && (
                <Button variant="outline" onClick={onAddToList}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add to List
                </Button>
              )}
              {company.website && (
                <a href={company.website} target="_blank" rel="noopener noreferrer">
                  <Button variant="ghost">
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </a>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Political Leaning Summary */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Political Analysis</h2>
            <PoliticalLeaningBadge leaning={analysis.overallLeaning} />
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
            {/* Party breakdown */}
            <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                Donation Breakdown by Party
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

            {/* Individual donations */}
            <div className="space-y-3">
              {analysis.donations.map((donation, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{donation.recipient}</p>
                    <div className="flex items-center space-x-2 mt-1">
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
