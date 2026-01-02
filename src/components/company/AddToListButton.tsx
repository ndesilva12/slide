'use client';

import React, { useState } from 'react';
import { ThumbsUp, ThumbsDown, Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthContext';

interface AddToListButtonProps {
  companyId: string;
  companyName: string;
  isInSupport?: boolean;
  isInOppose?: boolean;
  onAdd: (listType: 'support' | 'oppose') => Promise<void>;
  onRemove: (listType: 'support' | 'oppose') => Promise<void>;
  size?: 'sm' | 'md';
  showLabels?: boolean;
}

export function AddToListButton({
  companyId,
  companyName,
  isInSupport = false,
  isInOppose = false,
  onAdd,
  onRemove,
  size = 'md',
  showLabels = true,
}: AddToListButtonProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState<'support' | 'oppose' | null>(null);

  if (!user) {
    return null;
  }

  const handleClick = async (listType: 'support' | 'oppose') => {
    setLoading(listType);
    try {
      const isInList = listType === 'support' ? isInSupport : isInOppose;
      if (isInList) {
        await onRemove(listType);
      } else {
        // If adding to one list, remove from the other
        const otherList = listType === 'support' ? 'oppose' : 'support';
        const isInOther = listType === 'support' ? isInOppose : isInSupport;
        if (isInOther) {
          await onRemove(otherList);
        }
        await onAdd(listType);
      }
    } catch (error) {
      console.error('Failed to update list:', error);
    } finally {
      setLoading(null);
    }
  };

  const buttonSize = size === 'sm' ? 'sm' : 'md';
  const iconSize = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5';

  return (
    <div className="flex items-center gap-2">
      <Button
        variant={isInSupport ? 'primary' : 'outline'}
        size={buttonSize}
        onClick={() => handleClick('support')}
        disabled={loading !== null}
        className={`${isInSupport ? 'bg-green-600 hover:bg-green-700' : 'hover:border-green-500 hover:text-green-600'}`}
      >
        {isInSupport ? (
          <Check className={iconSize} />
        ) : (
          <ThumbsUp className={iconSize} />
        )}
        {showLabels && <span className="ml-1">{isInSupport ? 'Endorsed' : 'Endorse'}</span>}
      </Button>

      <Button
        variant={isInOppose ? 'primary' : 'outline'}
        size={buttonSize}
        onClick={() => handleClick('oppose')}
        disabled={loading !== null}
        className={`${isInOppose ? 'bg-red-600 hover:bg-red-700' : 'hover:border-red-500 hover:text-red-600'}`}
      >
        {isInOppose ? (
          <Check className={iconSize} />
        ) : (
          <ThumbsDown className={iconSize} />
        )}
        {showLabels && <span className="ml-1">{isInOppose ? 'Boycotting' : 'Boycott'}</span>}
      </Button>
    </div>
  );
}
