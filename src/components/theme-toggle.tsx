'use client';

import { MoonStar, SunMedium } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';

const STORAGE_KEY = 'nodeinvoice-theme';

type ThemeMode = 'dark' | 'light';

function applyTheme(theme: ThemeMode) {
  const root = document.documentElement;
  if (theme === 'light') {
    root.classList.remove('dark');
  } else {
    root.classList.add('dark');
  }
}

export function ThemeToggle() {
  const [mode, setMode] = useState<ThemeMode>('dark');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      const initial: ThemeMode = saved === 'light' ? 'light' : 'dark';
      setMode(initial);
      applyTheme(initial);
    } catch {
      applyTheme('dark');
    }
    setReady(true);
  }, []);

  const toggle = () => {
    const next: ThemeMode = mode === 'dark' ? 'light' : 'dark';
    setMode(next);
    applyTheme(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Restricted context — toggle still works in-memory
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="border-border/70 bg-card/70 text-foreground"
      onClick={toggle}
      disabled={!ready}
      aria-label="Toggle theme"
    >
      {mode === 'dark' ? <SunMedium className="mr-2 h-4 w-4" /> : <MoonStar className="mr-2 h-4 w-4" />}
      {mode === 'dark' ? 'Light' : 'Dark'}
    </Button>
  );
}
