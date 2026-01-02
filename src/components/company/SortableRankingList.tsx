'use client';

import React from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Building2 } from 'lucide-react';
import { PoliticalLeaningBadge } from '@/components/ui/Badge';

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

interface SortableItemProps {
  item: RankingItem;
  index: number;
  onClick: () => void;
  isEditable: boolean;
  showCount?: boolean;
  countType?: 'support' | 'oppose';
}

function SortableItem({ item, index, onClick, isEditable, showCount, countType }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.companyKey, disabled: !isEditable });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
  };

  const count = countType === 'support' ? item.supportCount : item.opposeCount;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2"
    >
      {/* Rank number outside container */}
      <div className="flex-shrink-0 w-5 text-center text-sm font-bold text-gray-500 dark:text-gray-400">
        {index + 1}
      </div>

      {/* Main card container */}
      <div
        className={`
          flex-1 flex items-center gap-2 md:gap-3 p-2 md:p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700
          ${isDragging ? 'shadow-lg opacity-90' : 'shadow-sm'}
          ${isEditable ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer hover:border-blue-400'}
        `}
      >
        {isEditable && (
          <div {...attributes} {...listeners} className="touch-none">
            <GripVertical className="h-4 w-4 md:h-5 md:w-5 text-gray-400" />
          </div>
        )}

        {/* Company logo or fallback icon */}
        <div className="flex-shrink-0 w-8 h-8 md:w-10 md:h-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center overflow-hidden">
          {item.company?.logoUrl ? (
            <img
              src={item.company.logoUrl}
              alt={item.company?.name || item.companyName}
              className="w-full h-full object-cover"
            />
          ) : (
            <Building2 className="h-4 w-4 md:h-5 md:w-5 text-gray-400" />
          )}
        </div>

        <div
          className="flex-1 min-w-0 cursor-pointer"
          onClick={onClick}
        >
          <div className="flex items-center gap-1 md:gap-2">
            <span className="font-medium text-sm md:text-base text-gray-900 dark:text-white truncate">
              {item.company?.name || item.companyName}
            </span>
            {item.company?.ticker && (
              <span className="text-xs text-gray-500 dark:text-gray-400 hidden sm:inline">
                {item.company.ticker}
              </span>
            )}
          </div>
          {item.company?.industry && (
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {item.company.industry}
            </p>
          )}
        </div>

        {item.analysis?.overallLeaning && (
          <div className="hidden sm:block">
            <PoliticalLeaningBadge leaning={item.analysis.overallLeaning} />
          </div>
        )}

        {showCount && count !== undefined && (
          <div className="flex items-center justify-center min-w-[2rem] md:min-w-[2.5rem] h-5 md:h-6 bg-gray-100 dark:bg-gray-700 rounded-full text-xs font-medium text-gray-600 dark:text-gray-300">
            {count}
          </div>
        )}
      </div>
    </div>
  );
}

interface SortableRankingListProps {
  items: RankingItem[];
  onReorder?: (orderedKeys: string[]) => void;
  onItemClick: (item: RankingItem) => void;
  isEditable?: boolean;
  emptyMessage?: string;
  showCount?: boolean;
  countType?: 'support' | 'oppose';
}

export function SortableRankingList({
  items,
  onReorder,
  onItemClick,
  isEditable = false,
  emptyMessage = 'No companies ranked yet',
  showCount = false,
  countType,
}: SortableRankingListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex((item) => item.companyKey === active.id);
      const newIndex = items.findIndex((item) => item.companyKey === over.id);

      const newOrder = arrayMove(items, oldIndex, newIndex);
      onReorder?.(newOrder.map((item) => item.companyKey));
    }
  };

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <Building2 className="h-10 w-10 text-gray-300 dark:text-gray-600 mb-3" />
        <p className="text-gray-500 dark:text-gray-400">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={items.map((i) => i.companyKey)} strategy={verticalListSortingStrategy}>
        <div className="space-y-2">
          {items.map((item, index) => (
            <SortableItem
              key={item.companyKey}
              item={item}
              index={index}
              onClick={() => onItemClick(item)}
              isEditable={isEditable}
              showCount={showCount}
              countType={countType}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
