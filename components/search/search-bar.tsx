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
    if (onSearch) onSearch(query.trim());
  }, [query, onSearch]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch();
  };

  const handleClear = () => {
    setQuery("");
    if (onSearch) onSearch("");
  };

  return (
    <div className="absolute top-4 left-4 right-4 z-[1000]">
      <div className="flex items-center gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-[var(--fg-muted)]" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search shops..."
            className="w-full pl-11 pr-10 py-3 bg-[var(--bg-elevated)]/80 backdrop-blur-xl shadow-lg border border-[var(--border)] rounded-2xl text-[var(--fg)] placeholder-[var(--fg-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/40 focus:border-[var(--accent)] transition-all"
          />
          {query && (
            <button onClick={handleClear} className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-full hover:bg-[var(--bg-hover)]/60 transition-colors">
              <X className="h-4 w-4 text-[var(--fg-muted)]" />
            </button>
          )}
        </div>
        <button onClick={onFilterClick}
          className="p-3 bg-[var(--bg-elevated)]/80 backdrop-blur-xl shadow-lg rounded-2xl border border-[var(--border)] text-[var(--fg-muted)] hover:text-[var(--accent)] hover:border-[var(--border-hover)] transition-all">
          <SlidersHorizontal className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}