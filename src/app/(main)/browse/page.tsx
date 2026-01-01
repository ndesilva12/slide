'use client';

import React, { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Input } from '@/components/ui/Input';
import { Card, CardContent } from '@/components/ui/Card';
import { CompanyCard } from '@/components/company/CompanyCard';
import { CompanyReportView } from '@/components/company/CompanyReport';
import { LoadingScreen } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/Button';
import { CompanyReport } from '@/types';
import { Search, Filter, TrendingUp, Clock, RefreshCw, ArrowLeft } from 'lucide-react';

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
  const [sortBy, setSortBy] = useState<'popular' | 'recent'>('popular');
  const [selectedReport, setSelectedReport] = useState<CompanyReport | null>(null);

  useEffect(() => {
    loadReports();
  }, [sortBy]);

  useEffect(() => {
    filterReports();
  }, [reports, searchQuery, selectedIndustry, selectedLeaning]);

  const loadReports = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/browse?sort=${sortBy}&limit=25`);
      const data = await response.json();

      if (data.success && data.data) {
        // Deduplicate by companyKey - keep the most recent entry for each company
        const seenKeys = new Map<string, CompanyReport>();
        for (const report of data.data) {
          const key = report.companyKey || report.company?.name?.toLowerCase().replace(/\s+/g, '_');
          if (!seenKeys.has(key)) {
            seenKeys.set(key, report);
          }
        }
        setReports(Array.from(seenKeys.values()));
      } else {
        setReports([]);
      }
    } catch (error) {
      console.error('Failed to load reports:', error);
      setReports([]);
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
    setSelectedReport(report);
  };

  const handleBack = () => {
    setSelectedReport(null);
  };

  if (isLoading) {
    return (
      <MainLayout>
        <LoadingScreen message="Loading companies..." />
      </MainLayout>
    );
  }

  // Show report view if a company is selected
  if (selectedReport) {
    return (
      <MainLayout>
        <div>
          <div className="mb-2 md:mb-4">
            <Button variant="ghost" onClick={handleBack} size="sm">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
          </div>
          <CompanyReportView report={selectedReport} />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-3 md:space-y-6">
        {/* Page Title - Mobile */}
        <div className="md:hidden">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Browse</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Explore company profiles</p>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardContent className="p-3 md:p-4">
            <div className="flex flex-col md:flex-row gap-2 md:gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Filter companies..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  icon={<Search className="h-4 w-4" />}
                />
              </div>

              <div className="flex gap-2 overflow-x-auto pb-1 md:pb-0">
                <div className="flex items-center gap-1">
                  <Filter className="h-4 w-4 text-gray-400 hidden md:block" />
                  <select
                    value={selectedIndustry}
                    onChange={(e) => setSelectedIndustry(e.target.value)}
                    className="px-2 md:px-3 py-1.5 md:py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs md:text-sm"
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
                  className="px-2 md:px-3 py-1.5 md:py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs md:text-sm"
                >
                  {LEANINGS.map((leaning) => (
                    <option key={leaning} value={leaning}>
                      {leaning === 'All' ? 'All Leanings' : leaning}
                    </option>
                  ))}
                </select>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => loadReports()}
                  className="p-1.5 md:p-2"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sort Toggle */}
        <div className="flex items-center justify-between">
          <h2 className="text-sm md:text-lg font-semibold text-gray-900 dark:text-white">
            {filteredReports.length} {filteredReports.length === 1 ? 'Company' : 'Companies'}
          </h2>
          <div className="flex items-center gap-1 md:gap-2">
            <Button
              variant={sortBy === 'popular' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setSortBy('popular')}
              className="text-xs md:text-sm px-2 md:px-3"
            >
              <TrendingUp className="h-3 w-3 md:h-4 md:w-4 mr-0.5 md:mr-1" />
              <span className="hidden sm:inline">Most </span>Searched
            </Button>
            <Button
              variant={sortBy === 'recent' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setSortBy('recent')}
              className="text-xs md:text-sm px-2 md:px-3"
            >
              <Clock className="h-3 w-3 md:h-4 md:w-4 mr-0.5 md:mr-1" />
              Recent
            </Button>
          </div>
        </div>

        {/* Results */}
        {filteredReports.length === 0 ? (
          <Card>
            <CardContent className="p-8 md:p-12 text-center">
              <Search className="h-10 w-10 md:h-12 md:w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3 md:mb-4" />
              <h3 className="text-base md:text-lg font-medium text-gray-900 dark:text-white mb-2">
                {reports.length === 0 ? 'No companies analyzed yet' : 'No companies match your filters'}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                {reports.length === 0
                  ? 'Search for a company on the Search tab to start building your database.'
                  : 'Try adjusting your search or filters.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
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
    </MainLayout>
  );
}
