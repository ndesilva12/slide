'use client';

import React, { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { LoadingScreen } from '@/components/ui/Spinner';
import { useAuth } from '@/contexts/AuthContext';
import { UserList, ListType } from '@/types';
import {
  Plus,
  ThumbsUp,
  ThumbsDown,
  FolderPlus,
  Trash2,
  Edit2,
  ChevronRight,
  Lock,
} from 'lucide-react';
import Link from 'next/link';

const DEFAULT_LISTS: Omit<UserList, 'id' | 'userId' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: 'Support',
    type: 'support',
    description: 'Companies I choose to support based on their values',
    companyIds: [],
  },
  {
    name: 'Oppose',
    type: 'oppose',
    description: 'Companies I choose to avoid based on their values',
    companyIds: [],
  },
];

export default function LibraryPage() {
  const { user, loading: authLoading } = useAuth();
  const [lists, setLists] = useState<UserList[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [newListDescription, setNewListDescription] = useState('');

  useEffect(() => {
    if (user) {
      loadUserLists();
    } else {
      setIsLoading(false);
    }
  }, [user]);

  const loadUserLists = async () => {
    setIsLoading(true);
    try {
      // In production, fetch from Firestore
      // For now, use default lists as demo
      const demoLists: UserList[] = DEFAULT_LISTS.map((list, i) => ({
        ...list,
        id: `default-${i}`,
        userId: user!.uid,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));
      setLists(demoLists);
    } catch (error) {
      console.error('Failed to load lists:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateList = async () => {
    if (!newListName.trim() || !user) return;

    const newList: UserList = {
      id: `custom-${Date.now()}`,
      userId: user.uid,
      name: newListName.trim(),
      type: 'custom',
      description: newListDescription.trim() || undefined,
      companyIds: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setLists((prev) => [...prev, newList]);
    setNewListName('');
    setNewListDescription('');
    setShowCreateModal(false);

    // In production, save to Firestore
  };

  const handleDeleteList = async (listId: string) => {
    if (confirm('Are you sure you want to delete this list?')) {
      setLists((prev) => prev.filter((l) => l.id !== listId));
      // In production, delete from Firestore
    }
  };

  const getListIcon = (type: ListType) => {
    switch (type) {
      case 'support':
        return <ThumbsUp className="h-5 w-5 text-green-500" />;
      case 'oppose':
        return <ThumbsDown className="h-5 w-5 text-red-500" />;
      default:
        return <FolderPlus className="h-5 w-5 text-blue-500" />;
    }
  };

  const getListColor = (type: ListType) => {
    switch (type) {
      case 'support':
        return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
      case 'oppose':
        return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
      default:
        return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
    }
  };

  if (authLoading) {
    return (
      <MainLayout title="Library" subtitle="Organize companies into lists">
        <LoadingScreen message="Loading..." />
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

  if (isLoading) {
    return (
      <MainLayout title="Library" subtitle="Organize companies into lists">
        <LoadingScreen message="Loading your lists..." />
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Library" subtitle="Organize companies into lists">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Your Lists
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {lists.length} lists • {lists.reduce((sum, l) => sum + l.companyIds.length, 0)} companies
            </p>
          </div>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New List
          </Button>
        </div>

        {/* Lists Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {lists.map((list) => (
            <Card
              key={list.id}
              className={`border-2 ${getListColor(list.type)} hover:shadow-md transition-all cursor-pointer`}
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    {getListIcon(list.type)}
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {list.name}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {list.companyIds.length} companies
                      </p>
                    </div>
                  </div>

                  {list.type === 'custom' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteList(list.id);
                      }}
                      className="p-1 text-gray-400 hover:text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                {list.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                    {list.description}
                  </p>
                )}

                <div className="flex items-center justify-between">
                  <Badge variant={list.type === 'support' ? 'success' : list.type === 'oppose' ? 'danger' : 'default'}>
                    {list.type}
                  </Badge>
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Add New List Card */}
          <Card
            className="border-2 border-dashed border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500 transition-colors cursor-pointer"
            onClick={() => setShowCreateModal(true)}
          >
            <CardContent className="p-5 flex flex-col items-center justify-center h-full min-h-[160px]">
              <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center mb-3">
                <Plus className="h-6 w-6 text-gray-400" />
              </div>
              <p className="font-medium text-gray-600 dark:text-gray-400">
                Create New List
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Create List Modal */}
        <Modal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          title="Create New List"
          size="md"
        >
          <div className="space-y-4">
            <Input
              label="List Name"
              placeholder="e.g., Tech Companies to Watch"
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description (optional)
              </label>
              <textarea
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="What is this list for?"
                rows={3}
                value={newListDescription}
                onChange={(e) => setNewListDescription(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateList} disabled={!newListName.trim()}>
                Create List
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </MainLayout>
  );
}
