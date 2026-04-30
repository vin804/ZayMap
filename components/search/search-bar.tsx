"use client";

import { useState, useCallback } from "react";
import { Search, X, SlidersHorizontal } from "lucide-react";

interface SearchBarProps {
  onSearch?: (query: string) => void;
  onFilterClick?: () => void;
}

export function SearchBar({ onSearch, onFilterClick }: SearchBarProps) {
  const [query, setQuery] = useState("");

  const handleSearch = useCallback(() => {
    if (onSearch) {
      onSearch(query.trim());
    }
  }, [query, onSearch]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const handleClear = () => {
    setQuery("");
    if (onSearch) {
      onSearch("");
    }
  };

  return (
    <div className="absolute top-4 left-4 right-4 z-[1000]">
      <div className="flex items-center gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search shops..."
            className="w-full pl-10 pr-10 py-3 bg-white shadow-lg border-0 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#667eea]/50 transition-all"
          />
          {query && (
            <button
              onClick={handleClear}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-gray-100 transition-colors"
            >
              <X className="h-4 w-4 text-gray-500" />
            </button>
          )}
        </div>
        
        <button
          onClick={onFilterClick}
          className="p-3 bg-white shadow-lg rounded-xl text-gray-600 hover:text-[#667eea] transition-colors"
        >
          <SlidersHorizontal className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
