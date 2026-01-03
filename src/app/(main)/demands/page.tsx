'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MainLayout } from '@/components/layout/MainLayout';
import { Input } from '@/components/ui/Input';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LoadingScreen } from '@/components/ui/Spinner';
import { DemandCard } from '@/components/demands/DemandCard';
import { CreateDemandModal } from '@/components/demands/CreateDemandModal';
import { useAuth } from '@/contexts/AuthContext';
import { Demand, DemandCategory } from '@/types';
import {
  Search,
  Filter,
  TrendingUp,
  Clock,
  RefreshCw,
  Plus,
  Megaphone,
  Flame,
} from 'lucide-react';

const CATEGORIES: (DemandCategory | 'All')[] = [
  'All',
  // Business & Customer
  'Pricing',
  'Products & Services',
  'Locations',
  'Customer Experience',
  'Policies',
  'Partnerships',
  'Employee Treatment',
  // Social & Political
  'Environmental',
  'Labor Rights',
  'Corporate Governance',
  'Consumer Protection',
  'Social Justice',
  'Political Transparency',
  'Privacy & Data',
  'Other',
];

export default function DemandsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [demands, setDemands] = useState<Demand[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<DemandCategory | 'All'>('All');
  const [sortBy, setSortBy] = useState<'recent' | 'popular' | 'trending'>('popular');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  useEffect(() => {
    loadDemands();
  }, [sortBy, selectedCategory]);

  const loadDemands = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        sortBy,
        limit: '50',
      });
      if (selectedCategory !== 'All') {
        params.set('category', selectedCategory);
      }
      if (searchQuery) {
        params.set('search', searchQuery);
      }

      const response = await fetch(`/api/demands?${params}`);
      const data = await response.json();

      if (data.success && data.data?.demands) {
        setDemands(data.data.demands);
      } else {
        setDemands([]);
      }
    } catch (error) {
      console.error('Failed to load demands:', error);
      setDemands([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadDemands();
  };

  const handleCreateClick = () => {
    if (!user) {
      setShowLoginPrompt(true);
      return;
    }
    setShowCreateModal(true);
  };

  const handleCreateDemand = async (data: {
    title: string;
    category: DemandCategory;
    description: string;
    targetCompany?: string;
    resolutionItems: string[];
  }) => {
    const response = await fetch('/api/demands', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...data,
        authorId: user!.uid,
        authorName: user!.displayName || user!.email || 'Anonymous',
        authorPhotoURL: user!.photoURL,
      }),
    });

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.error || 'Failed to create demand');
    }

    // Navigate to the new demand
    router.push(`/demands/${result.data.id}`);
  };

  const handleDemandClick = (demand: Demand) => {
    router.push(`/demands/${demand.id}`);
  };

  // Filter demands by search query (client-side for instant feedback)
  const filteredDemands = searchQuery
    ? demands.filter(
        (d) =>
          d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          d.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          d.targetCompany?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : demands;

  if (isLoading) {
    return (
      <MainLayout>
        <LoadingScreen message="Loading demands..." />
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-3 md:space-y-6">
        {/* Page Title - Mobile */}
        <div className="md:hidden">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Demands</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Join or create petitions for change
          </p>
        </div>

        {/* Search, Filters, and Create */}
        <Card>
          <CardContent className="p-3 md:p-4">
            <div className="flex flex-col md:flex-row gap-2 md:gap-4">
              <form onSubmit={handleSearch} className="flex-1">
                <Input
                  placeholder="Search demands..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  icon={<Search className="h-4 w-4" />}
                />
              </form>

              <div className="flex gap-2 overflow-x-auto pb-1 md:pb-0">
                <div className="flex items-center gap-1">
                  <Filter className="h-4 w-4 text-gray-400 hidden md:block" />
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value as DemandCategory | 'All')}
                    className="px-2 md:px-3 py-1.5 md:py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs md:text-sm"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat === 'All' ? 'All Categories' : cat}
                      </option>
                    ))}
                  </select>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => loadDemands()}
                  className="p-1.5 md:p-2"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>

                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleCreateClick}
                  className="whitespace-nowrap"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  <span className="hidden sm:inline">Create</span> Demand
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sort Toggle */}
        <div className="flex items-center justify-between">
          <h2 className="text-sm md:text-lg font-semibold text-gray-900 dark:text-white">
            {filteredDemands.length} {filteredDemands.length === 1 ? 'Demand' : 'Demands'}
          </h2>
          <div className="flex items-center gap-1 md:gap-2">
            <Button
              variant={sortBy === 'popular' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setSortBy('popular')}
              className="text-xs md:text-sm px-2 md:px-3"
            >
              <TrendingUp className="h-3 w-3 md:h-4 md:w-4 mr-0.5 md:mr-1" />
              Popular
            </Button>
            <Button
              variant={sortBy === 'trending' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setSortBy('trending')}
              className="text-xs md:text-sm px-2 md:px-3"
            >
              <Flame className="h-3 w-3 md:h-4 md:w-4 mr-0.5 md:mr-1" />
              Trending
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
        {filteredDemands.length === 0 ? (
          <Card>
            <CardContent className="p-8 md:p-12 text-center">
              <Megaphone className="h-10 w-10 md:h-12 md:w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3 md:mb-4" />
              <h3 className="text-base md:text-lg font-medium text-gray-900 dark:text-white mb-2">
                {demands.length === 0 ? 'No demands yet' : 'No demands match your search'}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                {demands.length === 0
                  ? 'Be the first to create a demand and rally others to your cause!'
                  : 'Try adjusting your search or filters.'}
              </p>
              {demands.length === 0 && (
                <Button variant="primary" onClick={handleCreateClick}>
                  <Plus className="h-4 w-4 mr-1" />
                  Create First Demand
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
            {filteredDemands.map((demand) => (
              <DemandCard
                key={demand.id}
                demand={demand}
                onClick={() => handleDemandClick(demand)}
              />
            ))}
          </div>
        )}

        {/* Create Modal */}
        <CreateDemandModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateDemand}
        />

        {/* Login Prompt Modal */}
        {showLoginPrompt && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <Card className="w-full max-w-sm">
              <CardContent className="p-6 text-center">
                <Megaphone className="h-10 w-10 text-[#741b47] mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Sign in to Create Demands
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  You need an account to create and co-sign demands.
                </p>
                <div className="flex gap-3">
                  <Button
                    variant="ghost"
                    onClick={() => setShowLoginPrompt(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    onClick={() => router.push('/login')}
                    className="flex-1"
                  >
                    Sign In
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
