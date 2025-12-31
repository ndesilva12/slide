'use client';

import React, { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Input } from '@/components/ui/Input';
import { Card, CardContent } from '@/components/ui/Card';
import { CompanyCard } from '@/components/company/CompanyCard';
import { LoadingScreen } from '@/components/ui/Spinner';
import { Badge } from '@/components/ui/Badge';
import { CompanyReport } from '@/types';
import { Search, Filter, TrendingUp } from 'lucide-react';

const INDUSTRIES = [
  'All',
  'Technology',
  'Finance',
  'Healthcare',
  'Energy',
  'Retail',
  'Media',
  'Manufacturing',
  'Food & Beverage',
];

const LEANINGS = [
  'All',
  'Left',
  'Center-Left',
  'Center',
  'Center-Right',
  'Right',
];

export default function BrowsePage() {
  const [reports, setReports] = useState<CompanyReport[]>([]);
  const [filteredReports, setFilteredReports] = useState<CompanyReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState('All');
  const [selectedLeaning, setSelectedLeaning] = useState('All');

  useEffect(() => {
    loadRecentReports();
  }, []);

  useEffect(() => {
    filterReports();
  }, [reports, searchQuery, selectedIndustry, selectedLeaning]);

  const loadRecentReports = async () => {
    setIsLoading(true);
    try {
      // For demo purposes, we'll show some sample data
      // In production, this would fetch from Firestore
      const sampleReports: CompanyReport[] = [
        {
          id: '1',
          company: { id: '1', name: 'Apple Inc.', ticker: 'AAPL', industry: 'Technology' },
          analysis: {
            overallLeaning: 'Center-Left',
            confidenceScore: 75,
            summary: 'Apple has historically supported progressive causes and Democratic candidates.',
            donations: [],
            publicStatements: [],
            partnerships: [],
            keyTopics: ['Privacy', 'Environment', 'Immigration'],
            lastUpdated: new Date(),
            sources: [],
          },
          createdAt: new Date(),
          updatedAt: new Date(),
          generatedBy: 'cache',
        },
        {
          id: '2',
          company: { id: '2', name: 'Walmart', ticker: 'WMT', industry: 'Retail' },
          analysis: {
            overallLeaning: 'Center-Right',
            confidenceScore: 70,
            summary: 'Walmart has a mixed political donation history with slight conservative lean.',
            donations: [],
            publicStatements: [],
            partnerships: [],
            keyTopics: ['Labor', 'Trade', 'Healthcare'],
            lastUpdated: new Date(),
            sources: [],
          },
          createdAt: new Date(),
          updatedAt: new Date(),
          generatedBy: 'cache',
        },
        {
          id: '3',
          company: { id: '3', name: 'JPMorgan Chase', ticker: 'JPM', industry: 'Finance' },
          analysis: {
            overallLeaning: 'Center',
            confidenceScore: 80,
            summary: 'JPMorgan donates to both parties and focuses on financial regulation issues.',
            donations: [],
            publicStatements: [],
            partnerships: [],
            keyTopics: ['Financial Regulation', 'Economy', 'Climate'],
            lastUpdated: new Date(),
            sources: [],
          },
          createdAt: new Date(),
          updatedAt: new Date(),
          generatedBy: 'cache',
        },
      ];
      setReports(sampleReports);
    } catch (error) {
      console.error('Failed to load reports:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterReports = () => {
    let filtered = [...reports];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.company.name.toLowerCase().includes(query) ||
          r.company.ticker?.toLowerCase().includes(query) ||
          r.company.industry?.toLowerCase().includes(query)
      );
    }

    if (selectedIndustry !== 'All') {
      filtered = filtered.filter((r) => r.company.industry === selectedIndustry);
    }

    if (selectedLeaning !== 'All') {
      filtered = filtered.filter((r) => r.analysis.overallLeaning === selectedLeaning);
    }

    setFilteredReports(filtered);
  };

  const handleCompanyClick = (report: CompanyReport) => {
    // Navigate to company detail page or open modal
    window.location.href = `/?company=${encodeURIComponent(report.company.name)}`;
  };

  if (isLoading) {
    return (
      <MainLayout title="Browse" subtitle="Explore company political profiles">
        <LoadingScreen message="Loading companies..." />
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Browse" subtitle="Explore company political profiles">
      <div className="space-y-6">
        {/* Search and Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search companies..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  icon={<Search className="h-4 w-4" />}
                />
              </div>

              <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-gray-400" />
                  <select
                    value={selectedIndustry}
                    onChange={(e) => setSelectedIndustry(e.target.value)}
                    className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
                  >
                    {INDUSTRIES.map((industry) => (
                      <option key={industry} value={industry}>
                        {industry}
                      </option>
                    ))}
                  </select>
                </div>

                <select
                  value={selectedLeaning}
                  onChange={(e) => setSelectedLeaning(e.target.value)}
                  className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
                >
                  {LEANINGS.map((leaning) => (
                    <option key={leaning} value={leaning}>
                      {leaning === 'All' ? 'All Leanings' : leaning}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {filteredReports.length} Companies
            </h2>
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <TrendingUp className="h-4 w-4" />
              <span>Recently analyzed</span>
            </div>
          </div>

          {filteredReports.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Search className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No companies found
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Try adjusting your search or filters, or search for a new company on the home page.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredReports.map((report) => (
                <CompanyCard
                  key={report.id}
                  report={report}
                  onClick={() => handleCompanyClick(report)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
