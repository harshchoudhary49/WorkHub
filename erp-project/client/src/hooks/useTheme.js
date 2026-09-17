import { useEffect, useState } from 'react';

/**
 * useTheme — manages dark/light mode.
 * Reads preference from localStorage and applies the 'dark' class to <html>.
 *
 * Returns: { isDark, toggle }
 */
export function useTheme() {
  const [isDark, setIsDark] = useState(() => {
    try {
      return localStorage.getItem('theme') === 'dark';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  // Apply saved preference on first load (before React renders)
  useEffect(() => {
    const saved = localStorage.getItem('theme');
    if (saved === 'dark') {
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggle = () => setIsDark((d) => !d);

  return { isDark, toggle };
}
