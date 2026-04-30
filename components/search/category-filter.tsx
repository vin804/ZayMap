"use client";

import { useCallback } from "react";

export const SHOP_CATEGORIES = [
  { id: "clothes", name: "Clothes", icon: "👕" },
  { id: "electronics", name: "Electronics", icon: "📱" },
  { id: "food", name: "Food", icon: "🍜" },
  { id: "cosmetics", name: "Cosmetics", icon: "💄" },
  { id: "second_hand", name: "Second-hand", icon: "♻️" },
  { id: "other", name: "Other", icon: "🏪" },
];

interface CategoryFilterProps {
  selectedCategories: string[];
  onChange: (categories: string[]) => void;
}

export function CategoryFilter({ selectedCategories, onChange }: CategoryFilterProps) {
  const toggleCategory = useCallback((categoryId: string) => {
    if (selectedCategories.includes(categoryId)) {
      onChange(selectedCategories.filter((id) => id !== categoryId));
    } else {
      onChange([...selectedCategories, categoryId]);
    }
  }, [selectedCategories, onChange]);

  const clearAll = useCallback(() => {
    onChange([]);
  }, [onChange]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-black">Categories</h3>
        {selectedCategories.length > 0 && (
          <button
            onClick={clearAll}
            className="text-xs font-medium text-[#667eea] hover:text-[#5a67d8] transition-colors"
          >
            Clear all
          </button>
        )}
      </div>
      
      <div className="flex flex-wrap gap-2">
        {SHOP_CATEGORIES.map((category) => {
          const isSelected = selectedCategories.includes(category.id);
          
          return (
            <button
              key={category.id}
              onClick={() => toggleCategory(category.id)}
              className={`
                inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium
                transition-all duration-200 border
                ${isSelected
                  ? "bg-[#667eea] text-white border-[#667eea] shadow-sm"
                  : "bg-white text-black border-gray-200 hover:border-[#667eea]/50 hover:bg-gray-50"
                }
              `}
            >
              <span className="text-base">{category.icon}</span>
              <span>{category.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
