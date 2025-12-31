'use client';

import React, { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { SearchBar } from '@/components/company/SearchBar';
import { CompanyReportView } from '@/components/company/CompanyReport';
import { CompanyCard } from '@/components/company/CompanyCard';
import { Spinner } from '@/components/ui/Spinner';
import { Card, CardContent } from '@/components/ui/Card';
import { CompanyReport } from '@/types';
import { Search, Shield, Sparkles } from 'lucide-react';

export default function HomePage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentReport, setCurrentReport] = useState<CompanyReport | null>(null);
  const [recentSearches, setRecentSearches] = useState<CompanyReport[]>([]);

  const handleSearch = async (query: string) => {
    setIsLoading(true);
    setError(null);
    setCurrentReport(null);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyName: query }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Analysis failed');
      }

      setCurrentReport(data.data);
      setRecentSearches((prev) => {
        const filtered = prev.filter((r) => r.company.name !== data.data.company.name);
        return [data.data, ...filtered].slice(0, 5);
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="space-y-8">
        {/* Hero Section */}
        <div className="text-center py-8 md:py-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Discover Company
            <span className="text-blue-600"> Politics</span>
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-8">
            Search any company to uncover their political donations, public positions,
            and affiliations based on public records and news.
          </p>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto">
            <SearchBar
              onSearch={handleSearch}
              isLoading={isLoading}
              placeholder="Enter a company name (e.g., Apple, Amazon, Tesla...)"
            />
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <Spinner size="lg" />
            <div className="text-center">
              <p className="text-lg font-medium text-gray-900 dark:text-white">
                Analyzing company...
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Searching public records, news, and donation databases
              </p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <Card className="max-w-2xl mx-auto border-red-200 dark:border-red-800">
            <CardContent className="p-6 text-center">
              <p className="text-red-600 dark:text-red-400">{error}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                Please try again or search for a different company.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Current Report */}
        {currentReport && !isLoading && (
          <div className="mt-8">
            <CompanyReportView report={currentReport} />
          </div>
        )}

        {/* Empty State / Features */}
        {!currentReport && !isLoading && !error && (
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto mt-12">
            <Card className="text-center p-6">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Search className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                Deep Research
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                AI-powered analysis of political donations, public statements, and affiliations.
              </p>
            </Card>

            <Card className="text-center p-6">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Shield className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                Public Sources
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                All data sourced from FEC records, news articles, and public statements.
              </p>
            </Card>

            <Card className="text-center p-6">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                Save & Organize
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Create lists to track companies you support, oppose, or want to monitor.
              </p>
            </Card>
          </div>
        )}

        {/* Recent Searches */}
        {recentSearches.length > 0 && !currentReport && !isLoading && (
          <div className="mt-12">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Recent Searches
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recentSearches.map((report) => (
                <CompanyCard
                  key={report.id || report.company.name}
                  report={report}
                  onClick={() => setCurrentReport(report)}
                  showAddToList={false}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
