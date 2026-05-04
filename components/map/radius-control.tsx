"use client";

import { useState, useEffect, useCallback } from "react";

interface RadiusControlProps {
  radius: number;
  onChange: (radius: number) => void;
  min?: number;
  max?: number;
}

export function RadiusControl({
  radius,
  onChange,
  min = 5,
  max = 1800,
}: RadiusControlProps) {
  const [inputValue, setInputValue] = useState(radius.toString());
  const [sliderValue, setSliderValue] = useState(radius);
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);

  // Sync input value when radius prop changes externally
  useEffect(() => {
    setInputValue(radius.toString());
    setSliderValue(radius);
  }, [radius]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    // Allow empty string or valid numbers during typing
    if (val === "" || /^\d*$/.test(val)) {
      setInputValue(val);
      // Only update parent if we have a valid number
      if (val !== "") {
        const numVal = Number(val);
        if (numVal >= min && numVal <= max) {
          onChange(numVal);
        }
      }
    }
  };

  const handleBlur = () => {
    // Clamp to min/max when user leaves the field
    let numVal = Number(inputValue) || min;
    numVal = Math.min(Math.max(numVal, min), max);
    setInputValue(numVal.toString());
    onChange(numVal);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleBlur();
    }
  };

  return (
    <div className="flex items-center gap-3 rounded-lg bg-[var(--card-bg)] px-3 py-2 border border-gray-200/20">
      <label htmlFor="radius" className="text-sm font-medium text-[var(--text-dark)]">
        Radius:
      </label>
      <input
        id="radius"
        type="range"
        min={min}
        max={max}
        step={1}
        value={sliderValue}
        onChange={(e) => {
          const newValue = Number(e.target.value);
          setSliderValue(newValue);
          
          // Debounce the onChange callback
          if (debounceTimer) {
            clearTimeout(debounceTimer);
          }
          const timer = setTimeout(() => {
            onChange(newValue);
          }, 150); // 150ms debounce
          setDebounceTimer(timer);
        }}
        onMouseUp={() => {
          // Immediately update on mouse release
          if (debounceTimer) {
            clearTimeout(debounceTimer);
            setDebounceTimer(null);
          }
          onChange(sliderValue);
        }}
        className="h-2 w-32 cursor-pointer appearance-none rounded-lg bg-gray-500/30 accent-[#667eea]"
      />
      <div className="flex items-center gap-1">
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className="w-16 rounded border border-gray-200/20 bg-[var(--card-bg)] px-2 py-1 text-center text-sm text-[var(--text-dark)] focus:border-[#667eea] focus:outline-none"
        />
        <span className="text-sm text-[var(--text-gray)]">km</span>
      </div>
    </div>
  );
}
