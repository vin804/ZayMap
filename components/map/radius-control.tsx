"use client";

import { useState, useEffect } from "react";

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

  // Sync input value when radius prop changes externally
  useEffect(() => {
    setInputValue(radius.toString());
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
    <div className="flex items-center gap-3 rounded-lg bg-white px-3 py-2 shadow-sm">
      <label htmlFor="radius" className="text-sm font-medium text-[var(--text-dark)]">
        Radius:
      </label>
      <input
        id="radius"
        type="range"
        min={min}
        max={max}
        step={1}
        value={radius}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-2 w-32 cursor-pointer appearance-none rounded-lg bg-gray-200 accent-[#667eea]"
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
          className="w-16 rounded border border-gray-300 px-2 py-1 text-center text-sm text-gray-900 focus:border-[#667eea] focus:outline-none"
        />
        <span className="text-sm text-[var(--text-gray)]">km</span>
      </div>
    </div>
  );
}
