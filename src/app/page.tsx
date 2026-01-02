'use client';

import React, { useState, useEffect, Suspense, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { MainLayout } from '@/components/layout/MainLayout';
import { SearchBar } from '@/components/company/SearchBar';
import { CompanyReportView } from '@/components/company/CompanyReport';
import { SortableRankingList } from '@/components/company/SortableRankingList';
import { Spinner } from '@/components/ui/Spinner';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { CompanyReport } from '@/types';
import { ArrowLeft, ThumbsUp, ThumbsDown, Globe, User, GripVertical } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useUserLists } from '@/contexts/UserListsContext';
import Link from 'next/link';

interface RankingItem {
  companyKey: string;
  companyName: string;
  rank: number;
  company?: {
    name: string;
    ticker?: string;
    industry?: string;
    logoUrl?: string;
  };
  analysis?: {
    overallLeaning?: string;
  };
  supportCount?: number;
  opposeCount?: number;
}

interface GlobalRankings {
  support: RankingItem[];
  oppose: RankingItem[];
}

function HomeContent() {
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { lists, reorderList, loading: listsLoading } = useUserLists();

  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [currentReport, setCurrentReport] = useState<CompanyReport | null>(null);
  const [viewMode, setViewMode] = useState<'my' | 'global'>('my');
  const [globalRankings, setGlobalRankings] = useState<GlobalRankings>({ support: [], oppose: [] });
  const [globalLoading, setGlobalLoading] = useState(false);
  const [editingList, setEditingList] = useState<'support' | 'oppose' | null>(null);
  const [enrichedMyRankings, setEnrichedMyRankings] = useState<{ support: RankingItem[]; oppose: RankingItem[] }>({ support: [], oppose: [] });

  // Check for report from Browse page on mount
  useEffect(() => {
    const fromBrowse = searchParams.get('fromBrowse');
    if (fromBrowse === 'true') {
      const storedReport = sessionStorage.getItem('selectedReport');
      if (storedReport) {
        try {
          const report = JSON.parse(storedReport);
          setCurrentReport(report);
          sessionStorage.removeItem('selectedReport');
          window.history.replaceState({}, '', '/');
        } catch (e) {
          console.error('Failed to parse stored report:', e);
        }
      }
    }
  }, [searchParams]);

  // If not logged in, show global view by default
  useEffect(() => {
    if (!user) {
      setViewMode('global');
    }
  }, [user]);

  // Fetch global rankings
  const fetchGlobalRankings = useCallback(async () => {
    setGlobalLoading(true);
    try {
      const response = await fetch('/api/rankings?limit=10');
      const data = await response.json();
      if (data.success) {
        setGlobalRankings(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch global rankings:', error);
    } finally {
      setGlobalLoading(false);
    }
  }, []);

  useEffect(() => {
    if (viewMode === 'global') {
      fetchGlobalRankings();
    }
  }, [viewMode, fetchGlobalRankings]);

  // Fetch enriched data for My Rankings (logos, tickers, etc.)
  useEffect(() => {
    const enrichMyRankings = async () => {
      if (!user || lists.support.length === 0 && lists.oppose.length === 0) {
        setEnrichedMyRankings({ support: [], oppose: [] });
        return;
      }

      // Get all unique company keys
      const allKeys = [...new Set([
        ...lists.support.map(item => item.companyKey),
        ...lists.oppose.map(item => item.companyKey),
      ])];

      // Fetch report data for all companies
      const reportData: Record<string, { company?: RankingItem['company']; analysis?: RankingItem['analysis'] }> = {};

      await Promise.all(
        allKeys.map(async (companyKey) => {
          try {
            const response = await fetch(`/api/report/${encodeURIComponent(companyKey)}`);
            const data = await response.json();
            if (data.success && data.data) {
              reportData[companyKey] = {
                company: {
                  name: data.data.company?.name,
                  ticker: data.data.company?.ticker,
                  industry: data.data.company?.industry,
                  logoUrl: data.data.company?.logoUrl,
                },
                analysis: {
                  overallLeaning: data.data.analysis?.overallLeaning,
                },
              };
            }
          } catch (err) {
            // Silently fail for individual companies
          }
        })
      );

      // Enrich the ranking items
      setEnrichedMyRankings({
        support: lists.support.slice(0, 10).map((item, index) => ({
          companyKey: item.companyKey,
          companyName: item.companyName,
          rank: index + 1,
          company: reportData[item.companyKey]?.company,
          analysis: reportData[item.companyKey]?.analysis,
        })),
        oppose: lists.oppose.slice(0, 10).map((item, index) => ({
          companyKey: item.companyKey,
          companyName: item.companyName,
          rank: index + 1,
          company: reportData[item.companyKey]?.company,
          analysis: reportData[item.companyKey]?.analysis,
        })),
      });
    };

    enrichMyRankings();
  }, [user, lists.support, lists.oppose]);

  const handleSearch = async (query: string) => {
    setIsLoading(true);
    setLoadingMessage('Analyzing company...');
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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  };

  const handleBack = () => {
    setCurrentReport(null);
    setError(null);
  };

  const handleItemClick = async (item: RankingItem) => {
    setIsLoading(true);
    setLoadingMessage('Loading report...');
    try {
      // First, try to fetch cached report by companyKey (fast, no regeneration)
      if (item.companyKey) {
        const cacheResponse = await fetch(`/api/report/${encodeURIComponent(item.companyKey)}`);
        const cacheData = await cacheResponse.json();
        if (cacheData.success) {
          setCurrentReport(cacheData.data);
          return;
        }
      }

      // Fallback: use analyze endpoint if no cached report found
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyName: item.companyName || item.company?.name }),
      });
      const data = await response.json();
      if (data.success) {
        setCurrentReport(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch report:', err);
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  };

  const handleReorder = async (listType: 'support' | 'oppose', orderedKeys: string[]) => {
    await reorderList(listType, orderedKeys);
  };

  // Use enriched rankings if available, otherwise fall back to basic list data
  const mySupport: RankingItem[] = enrichedMyRankings.support.length > 0
    ? enrichedMyRankings.support
    : lists.support.slice(0, 10).map((item, index) => ({
        companyKey: item.companyKey,
        companyName: item.companyName,
        rank: index + 1,
      }));

  const myOppose: RankingItem[] = enrichedMyRankings.oppose.length > 0
    ? enrichedMyRankings.oppose
    : lists.oppose.slice(0, 10).map((item, index) => ({
        companyKey: item.companyKey,
        companyName: item.companyName,
        rank: index + 1,
      }));

  const showRankings = !currentReport && !isLoading && !error;

  return (
    <MainLayout>
      <div className="space-y-4 md:space-y-6 overflow-x-hidden">
        {/* Search Bar - Always visible at top */}
        <div className="text-center pt-2 md:pt-4">
          <h1 className="text-2xl md:text-4xl font-bold text-gray-900 dark:text-white mb-1 md:mb-2">
            Discover Company{' '}
            <span className="bg-gradient-to-r from-indigo-500 via-purple-500 to-fuchsia-500 bg-clip-text text-transparent">
              Politics
            </span>
          </h1>
          <p className="text-sm md:text-base text-gray-500 dark:text-gray-400 mb-3 md:mb-6 px-2">
            Search for any company to see their political affiliations
          </p>
          <div className="max-w-2xl mx-auto">
            <SearchBar
              onSearch={handleSearch}
              isLoading={isLoading}
              placeholder="Search for a company..."
            />
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <Spinner size="lg" />
            <div className="text-center">
              <p className="text-lg font-medium text-gray-900 dark:text-white">
                {loadingMessage || 'Loading...'}
              </p>
              {loadingMessage === 'Analyzing company...' && (
                <>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Searching public records, news, and donation databases
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                    This can take up to 10 or 15 seconds
                  </p>
                </>
              )}
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
          <div>
            <div className="mb-4">
              <Button variant="ghost" onClick={handleBack}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </div>
            <CompanyReportView report={currentReport} />
          </div>
        )}

        {/* Rankings View */}
        {showRankings && (
          <div className="space-y-3 md:space-y-6">
            {/* View Toggle - Only my/global buttons */}
            <div className="flex justify-center gap-2">
              {user && (
                <Button
                  variant="ghost"
                  onClick={() => setViewMode('my')}
                  className={
                    viewMode === 'my'
                      ? 'border border-purple-300 dark:border-purple-600 bg-purple-50/50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300'
                      : ''
                  }
                >
                  <User className="h-4 w-4 mr-2" />
                  My Rankings
                </Button>
              )}
              <Button
                variant="ghost"
                onClick={() => setViewMode('global')}
                className={
                  viewMode === 'global'
                    ? 'border border-purple-300 dark:border-purple-600 bg-purple-50/50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300'
                    : ''
                }
              >
                <Globe className="h-4 w-4 mr-2" />
                Global
              </Button>
            </div>

            {/* Not logged in message for My Rankings */}
            {viewMode === 'my' && !user && (
              <Card>
                <CardContent className="p-8 text-center">
                  <User className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    Sign in to see your rankings
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-4">
                    Create personalized lists of companies you support or oppose.
                  </p>
                  <div className="flex justify-center gap-3">
                    <Link href="/login">
                      <Button variant="outline">Sign In</Button>
                    </Link>
                    <Link href="/signup">
                      <Button>Sign Up</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* My Rankings View */}
            {viewMode === 'my' && user && (
              <div className="grid md:grid-cols-2 gap-3 md:gap-6">
                {/* Support Column */}
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <ThumbsUp className="h-5 w-5 text-green-600" />
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          Support
                        </h3>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          ({lists.support.length})
                        </span>
                      </div>
                      <Button
                        variant={editingList === 'support' ? 'primary' : 'ghost'}
                        size="sm"
                        onClick={() => setEditingList(editingList === 'support' ? null : 'support')}
                      >
                        <GripVertical className="h-4 w-4 mr-1" />
                        {editingList === 'support' ? 'Done' : 'Reorder'}
                      </Button>
                    </div>
                    {listsLoading ? (
                      <div className="flex justify-center py-8">
                        <Spinner />
                      </div>
                    ) : (
                      <SortableRankingList
                        items={mySupport}
                        onReorder={(keys) => handleReorder('support', keys)}
                        onItemClick={handleItemClick}
                        isEditable={editingList === 'support'}
                        emptyMessage="No companies in your support list"
                      />
                    )}
                  </CardContent>
                </Card>

                {/* Oppose Column */}
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <ThumbsDown className="h-5 w-5 text-red-600" />
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          Oppose
                        </h3>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          ({lists.oppose.length})
                        </span>
                      </div>
                      <Button
                        variant={editingList === 'oppose' ? 'primary' : 'ghost'}
                        size="sm"
                        onClick={() => setEditingList(editingList === 'oppose' ? null : 'oppose')}
                      >
                        <GripVertical className="h-4 w-4 mr-1" />
                        {editingList === 'oppose' ? 'Done' : 'Reorder'}
                      </Button>
                    </div>
                    {listsLoading ? (
                      <div className="flex justify-center py-8">
                        <Spinner />
                      </div>
                    ) : (
                      <SortableRankingList
                        items={myOppose}
                        onReorder={(keys) => handleReorder('oppose', keys)}
                        onItemClick={handleItemClick}
                        isEditable={editingList === 'oppose'}
                        emptyMessage="No companies in your oppose list"
                      />
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Global Rankings View */}
            {viewMode === 'global' && (
              <div className="grid md:grid-cols-2 gap-3 md:gap-6">
                {/* Most Supported Column */}
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-4">
                      <ThumbsUp className="h-5 w-5 text-green-600" />
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Most Supported
                      </h3>
                    </div>
                    {globalLoading ? (
                      <div className="flex justify-center py-8">
                        <Spinner />
                      </div>
                    ) : (
                      <SortableRankingList
                        items={globalRankings.support}
                        onItemClick={handleItemClick}
                        isEditable={false}
                        emptyMessage="No companies ranked yet"
                        showCount
                        countType="support"
                      />
                    )}
                  </CardContent>
                </Card>

                {/* Most Opposed Column */}
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-4">
                      <ThumbsDown className="h-5 w-5 text-red-600" />
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Most Opposed
                      </h3>
                    </div>
                    {globalLoading ? (
                      <div className="flex justify-center py-8">
                        <Spinner />
                      </div>
                    ) : (
                      <SortableRankingList
                        items={globalRankings.oppose}
                        onItemClick={handleItemClick}
                        isEditable={false}
                        emptyMessage="No companies ranked yet"
                        showCount
                        countType="oppose"
                      />
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        )}
      </div>
    </MainLayout>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={
      <MainLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Spinner size="lg" />
        </div>
      </MainLayout>
    }>
      <HomeContent />
    </Suspense>
  );
}
