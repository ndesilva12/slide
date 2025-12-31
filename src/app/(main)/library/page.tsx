'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { SortableRankingList } from '@/components/company/SortableRankingList';
import { useAuth } from '@/contexts/AuthContext';
import { useUserLists } from '@/contexts/UserListsContext';
import {
  ThumbsUp,
  ThumbsDown,
  ChevronRight,
  Lock,
  ArrowLeft,
  GripVertical,
  Trash2,
} from 'lucide-react';
import Link from 'next/link';

type ListType = 'support' | 'oppose';

interface RankingItem {
  companyKey: string;
  companyName: string;
  rank: number;
}

export default function LibraryPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { lists, loading: listsLoading, reorderList, removeFromList } = useUserLists();
  const [selectedList, setSelectedList] = useState<ListType | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const handleListClick = (listType: ListType) => {
    setSelectedList(listType);
    setIsEditing(false);
  };

  const handleBack = () => {
    setSelectedList(null);
    setIsEditing(false);
  };

  const handleItemClick = (item: RankingItem) => {
    // Store company info and navigate to home page to show report
    sessionStorage.setItem('selectedReport', JSON.stringify({
      companyKey: item.companyKey,
      company: { name: item.companyName, id: item.companyKey },
      analysis: { overallLeaning: 'Unknown' },
    }));
    router.push('/?fromBrowse=true');
  };

  const handleReorder = async (orderedKeys: string[]) => {
    if (selectedList) {
      await reorderList(selectedList, orderedKeys);
    }
  };

  const handleRemove = async (companyKey: string) => {
    if (selectedList && confirm('Remove this company from the list?')) {
      await removeFromList(selectedList, companyKey);
    }
  };

  if (authLoading) {
    return (
      <MainLayout title="Library" subtitle="Organize companies into lists">
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      </MainLayout>
    );
  }

  // Not logged in state
  if (!user) {
    return (
      <MainLayout title="Library" subtitle="Organize companies into lists">
        <Card className="max-w-md mx-auto mt-12">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="h-8 w-8 text-gray-400" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Sign in to access your library
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              Create lists to organize companies you support, oppose, or want to track.
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
      </MainLayout>
    );
  }

  // Detailed list view
  if (selectedList) {
    const listItems: RankingItem[] = (selectedList === 'support' ? lists.support : lists.oppose).map(
      (item, index) => ({
        companyKey: item.companyKey,
        companyName: item.companyName,
        rank: index + 1,
      })
    );

    const listConfig = {
      support: {
        title: 'Support List',
        description: 'Companies you support based on their values',
        icon: <ThumbsUp className="h-6 w-6 text-green-600" />,
        color: 'bg-green-50 dark:bg-green-900/20',
      },
      oppose: {
        title: 'Oppose List',
        description: 'Companies you oppose based on their values',
        icon: <ThumbsDown className="h-6 w-6 text-red-600" />,
        color: 'bg-red-50 dark:bg-red-900/20',
      },
    };

    const config = listConfig[selectedList];

    return (
      <MainLayout title="Library" subtitle="Organize companies into lists">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={handleBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Library
            </Button>

            <Button
              variant={isEditing ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setIsEditing(!isEditing)}
            >
              <GripVertical className="h-4 w-4 mr-1" />
              {isEditing ? 'Done' : 'Reorder'}
            </Button>
          </div>

          {/* List Header */}
          <Card className={config.color}>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                {config.icon}
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    {config.title}
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    {config.description}
                  </p>
                </div>
                <Badge variant={selectedList === 'support' ? 'success' : 'danger'} className="ml-auto">
                  {listItems.length} companies
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* List Content */}
          <Card>
            <CardContent className="p-4">
              {listsLoading ? (
                <div className="flex justify-center py-8">
                  <Spinner />
                </div>
              ) : (
                <div className="space-y-2">
                  {listItems.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500 dark:text-gray-400">
                        No companies in this list yet.
                      </p>
                      <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                        Search for companies and add them to this list.
                      </p>
                    </div>
                  ) : (
                    listItems.map((item, index) => (
                      <div
                        key={item.companyKey}
                        className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                      >
                        {isEditing && (
                          <div className="cursor-grab">
                            <GripVertical className="h-5 w-5 text-gray-400" />
                          </div>
                        )}

                        <div className="flex items-center justify-center w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-full text-sm font-bold text-gray-600 dark:text-gray-300">
                          {index + 1}
                        </div>

                        <div
                          className="flex-1 cursor-pointer"
                          onClick={() => !isEditing && handleItemClick(item)}
                        >
                          <span className="font-medium text-gray-900 dark:text-white">
                            {item.companyName}
                          </span>
                        </div>

                        {isEditing && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemove(item.companyKey)}
                            className="p-1 text-gray-400 hover:text-red-500"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}

                        {!isEditing && (
                          <ChevronRight className="h-4 w-4 text-gray-400" />
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  // Main library view
  return (
    <MainLayout title="Library" subtitle="Organize companies into lists">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Your Lists
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {lists.support.length + lists.oppose.length} companies across 2 lists
          </p>
        </div>

        {/* Lists Grid */}
        <div className="grid md:grid-cols-2 gap-4">
          {/* Support List Card */}
          <Card
            hover
            onClick={() => handleListClick('support')}
            className="border-2 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
          >
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <ThumbsUp className="h-6 w-6 text-green-600" />
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
                      Support
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {lists.support.length} companies
                    </p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400" />
              </div>

              <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                Companies you support based on their values
              </p>

              {lists.support.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {lists.support.slice(0, 3).map((item) => (
                    <Badge key={item.companyKey} variant="success" size="sm">
                      {item.companyName}
                    </Badge>
                  ))}
                  {lists.support.length > 3 && (
                    <Badge variant="default" size="sm">
                      +{lists.support.length - 3} more
                    </Badge>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Oppose List Card */}
          <Card
            hover
            onClick={() => handleListClick('oppose')}
            className="border-2 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
          >
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <ThumbsDown className="h-6 w-6 text-red-600" />
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
                      Oppose
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {lists.oppose.length} companies
                    </p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400" />
              </div>

              <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                Companies you oppose based on their values
              </p>

              {lists.oppose.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {lists.oppose.slice(0, 3).map((item) => (
                    <Badge key={item.companyKey} variant="danger" size="sm">
                      {item.companyName}
                    </Badge>
                  ))}
                  {lists.oppose.length > 3 && (
                    <Badge variant="default" size="sm">
                      +{lists.oppose.length - 3} more
                    </Badge>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
