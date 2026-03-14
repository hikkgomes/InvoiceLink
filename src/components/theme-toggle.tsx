'use client';

import { MoonStar, SunMedium } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

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

interface ThemeToggleProps {
  compact?: boolean;
  labels?: {
    light: string;
    dark: string;
    aria: string;
  };
}

export function ThemeToggle({ compact = false, labels }: ThemeToggleProps) {
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

  const lightLabel = labels?.light ?? 'Light';
  const darkLabel = labels?.dark ?? 'Dark';
  const ariaLabel = labels?.aria ?? 'Toggle theme';

  return (
    <Button
      type="button"
      variant={compact ? 'ghost' : 'outline'}
      size="sm"
      className={cn(
        'text-foreground',
        compact ? 'h-8 gap-1 px-2 text-xs text-muted-foreground hover:text-foreground' : 'border-border/70 bg-card/70',
      )}
      onClick={toggle}
      disabled={!ready}
      aria-label={ariaLabel}
    >
      {mode === 'dark' ? <SunMedium className={cn('h-4 w-4', compact ? '' : 'mr-2')} /> : <MoonStar className={cn('h-4 w-4', compact ? '' : 'mr-2')} />}
      {compact ? (
        <span className="text-[11px] uppercase tracking-[0.12em]">{mode === 'dark' ? lightLabel : darkLabel}</span>
      ) : (
        <>{mode === 'dark' ? lightLabel : darkLabel}</>
      )}
    </Button>
  );
}
