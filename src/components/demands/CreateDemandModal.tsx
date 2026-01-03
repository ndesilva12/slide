'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent } from '@/components/ui/Card';
import { DemandCategory } from '@/types';
import { X, Megaphone } from 'lucide-react';

const CATEGORIES: DemandCategory[] = [
  'Environmental',
  'Labor Rights',
  'Corporate Governance',
  'Consumer Protection',
  'Social Justice',
  'Political Transparency',
  'Privacy & Data',
  'Other',
];

interface CreateDemandModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    title: string;
    category: DemandCategory;
    description: string;
    targetCompany?: string;
  }) => Promise<void>;
}

export function CreateDemandModal({ isOpen, onClose, onSubmit }: CreateDemandModalProps) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<DemandCategory>('Other');
  const [description, setDescription] = useState('');
  const [targetCompany, setTargetCompany] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('Title is required');
      return;
    }
    if (!description.trim()) {
      setError('Description is required');
      return;
    }
    if (description.length < 50) {
      setError('Description must be at least 50 characters');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        title: title.trim(),
        category,
        description: description.trim(),
        targetCompany: targetCompany.trim() || undefined,
      });
      // Reset form
      setTitle('');
      setCategory('Other');
      setDescription('');
      setTargetCompany('');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create demand');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardContent className="p-4 md:p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Megaphone className="h-5 w-5 text-[#741b47]" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Create a Demand
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Demand Title *
              </label>
              <Input
                placeholder="What change do you want to see?"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={150}
              />
              <p className="text-xs text-gray-400 mt-1">{title.length}/150 characters</p>
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as DemandCategory)}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#741b47]/50"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Target Company (optional) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Target Company <span className="text-gray-400">(optional)</span>
              </label>
              <Input
                placeholder="Which company is this demand directed at?"
                value={targetCompany}
                onChange={(e) => setTargetCompany(e.target.value)}
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description *
              </label>
              <textarea
                placeholder="Explain your demand in detail. Why is this important? What specific changes are you asking for? Who does this affect?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={6}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#741b47]/50 resize-none"
                maxLength={5000}
              />
              <p className="text-xs text-gray-400 mt-1">
                {description.length}/5000 characters (minimum 50)
              </p>
            </div>

            {error && (
              <p className="text-sm text-red-500 dark:text-red-400">{error}</p>
            )}

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={onClose}
                className="flex-1"
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                className="flex-1"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Creating...' : 'Create Demand'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
