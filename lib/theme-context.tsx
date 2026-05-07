"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  _isRealProvider: boolean;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "light",
  toggleTheme: () => {},
  setTheme: () => {},
  _isRealProvider: false,
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("light");
  const [mounted, setMounted] = useState(false);

  // Initialize theme from localStorage or system preference
  useEffect(() => {
    const savedTheme = localStorage.getItem("zaymap_theme") as Theme;
    if (savedTheme && (savedTheme === "light" || savedTheme === "dark")) {
      setThemeState(savedTheme);
    } else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      setThemeState("dark");
    }
    setMounted(true);
  }, []);

  // Apply theme to document
  useEffect(() => {
    if (!mounted) return;

    const root = document.documentElement;

    // Brief delay to allow previous paint to finish before removing transitions
    // This prevents a white flash when toggling from dark→light caused by CSS
    // custom properties changing before the browser can interpolate them
    root.classList.add("disable-transitions");

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (theme === "dark") {
          root.classList.add("dark");
          root.style.colorScheme = "dark";
        } else {
          root.classList.remove("dark");
          root.style.colorScheme = "light";
        }
        localStorage.setItem("zaymap_theme", theme);

        // Re-enable transitions on the next frame after the theme class has been applied
        requestAnimationFrame(() => {
          root.classList.remove("disable-transitions");
        });
      });
    });
  }, [theme, mounted]);

  const toggleTheme = () => {
    setThemeState((prev) => (prev === "light" ? "dark" : "light"));
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  const value = {
    theme,
    toggleTheme,
    setTheme,
    _isRealProvider: true,
  };

  // During SSR, render children with a default context to prevent errors
  // After hydration, the real provider value takes over
  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context._isRealProvider && typeof window !== "undefined") {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
