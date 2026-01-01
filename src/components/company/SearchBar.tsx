'use client';

import React, { useState } from 'react';
import { Search, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface SearchBarProps {
  onSearch: (query: string) => void;
  isLoading?: boolean;
  placeholder?: string;
}

export function SearchBar({ onSearch, isLoading = false, placeholder = 'Search for a company...' }: SearchBarProps) {
  const [query, setQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim());
    }
  };

  const handleClear = () => {
    setQuery('');
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="relative flex items-center">
        <div className="absolute left-3 md:left-4 text-gray-400">
          <Search className="h-4 w-4 md:h-5 md:w-5" />
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="
            w-full pl-10 md:pl-12 pr-20 md:pr-24 py-3 md:py-4 text-base md:text-lg
            bg-white dark:bg-gray-800
            border-2 border-gray-200 dark:border-gray-700
            rounded-xl md:rounded-2xl
            text-gray-900 dark:text-white
            placeholder-gray-400 dark:placeholder-gray-500
            focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20
            transition-all
          "
          disabled={isLoading}
        />
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-16 md:right-20 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="h-4 w-4 md:h-5 md:w-5" />
          </button>
        )}
        <Button
          type="submit"
          size="sm"
          isLoading={isLoading}
          disabled={!query.trim()}
          className="absolute right-1.5 md:right-2 text-sm md:text-base px-3 md:px-4 py-1.5 md:py-2"
        >
          Search
        </Button>
      </div>
    </form>
  );
}
