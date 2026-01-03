'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent } from '@/components/ui/Card';
import { DemandCategory } from '@/types';
import { X, Megaphone, Plus, Trash2, CheckSquare } from 'lucide-react';

// Organized categories
const CATEGORY_GROUPS = {
  'Business & Customer': [
    'Pricing',
    'Products & Services',
    'Locations',
    'Customer Experience',
    'Policies',
    'Partnerships',
    'Employee Treatment',
  ] as DemandCategory[],
  'Social & Political': [
    'Environmental',
    'Labor Rights',
    'Corporate Governance',
    'Consumer Protection',
    'Social Justice',
    'Political Transparency',
    'Privacy & Data',
    'Other',
  ] as DemandCategory[],
};

interface CreateDemandModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    title: string;
    category: DemandCategory;
    description: string;
    targetCompany?: string;
    resolutionItems: string[];
  }) => Promise<void>;
}

export function CreateDemandModal({ isOpen, onClose, onSubmit }: CreateDemandModalProps) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<DemandCategory>('Other');
  const [description, setDescription] = useState('');
  const [targetCompany, setTargetCompany] = useState('');
  const [resolutionItems, setResolutionItems] = useState<string[]>(['']);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleAddResolutionItem = () => {
    if (resolutionItems.length < 10) {
      setResolutionItems([...resolutionItems, '']);
    }
  };

  const handleRemoveResolutionItem = (index: number) => {
    if (resolutionItems.length > 1) {
      setResolutionItems(resolutionItems.filter((_, i) => i !== index));
    }
  };

  const handleResolutionItemChange = (index: number, value: string) => {
    const updated = [...resolutionItems];
    updated[index] = value;
    setResolutionItems(updated);
  };

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

    // Filter out empty resolution items
    const validResolutions = resolutionItems.filter((item) => item.trim());
    if (validResolutions.length === 0) {
      setError('At least one resolution item is required');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        title: title.trim(),
        category,
        description: description.trim(),
        targetCompany: targetCompany.trim() || undefined,
        resolutionItems: validResolutions.map((item) => item.trim()),
      });
      // Reset form
      setTitle('');
      setCategory('Other');
      setDescription('');
      setTargetCompany('');
      setResolutionItems(['']);
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
                {Object.entries(CATEGORY_GROUPS).map(([groupName, categories]) => (
                  <optgroup key={groupName} label={groupName}>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </optgroup>
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
                rows={5}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#741b47]/50 resize-none"
                maxLength={5000}
              />
              <p className="text-xs text-gray-400 mt-1">
                {description.length}/5000 characters (minimum 50)
              </p>
            </div>

            {/* Resolution Items */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <CheckSquare className="h-4 w-4 text-[#741b47]" />
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Resolution Items *
                </label>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                List the specific actions that must be taken for this demand to be considered met.
              </p>
              <div className="space-y-2">
                {resolutionItems.map((item, index) => (
                  <div key={index} className="flex gap-2">
                    <div className="flex-shrink-0 w-6 h-9 flex items-center justify-center text-xs text-gray-400">
                      {index + 1}.
                    </div>
                    <Input
                      placeholder={`Action item ${index + 1}...`}
                      value={item}
                      onChange={(e) => handleResolutionItemChange(index, e.target.value)}
                      maxLength={200}
                    />
                    {resolutionItems.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveResolutionItem(index)}
                        className="flex-shrink-0 p-2 text-gray-400 hover:text-red-500 rounded"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              {resolutionItems.length < 10 && (
                <button
                  type="button"
                  onClick={handleAddResolutionItem}
                  className="mt-2 flex items-center gap-1 text-sm text-[#741b47] dark:text-[#d4619a] hover:underline"
                >
                  <Plus className="h-3 w-3" />
                  Add another item
                </button>
              )}
              <p className="text-xs text-gray-400 mt-1">
                {resolutionItems.filter((i) => i.trim()).length}/10 items
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
