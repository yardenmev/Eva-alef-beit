// Small standalone UI helpers used by App.tsx (card, header, buttons, routing, saved state).
import React, { useCallback, useEffect, useState } from 'react';
import { HashRouter, Link as RRLink, Routes, Route } from 'react-router-dom';
import './ui.css';

export { Routes, Route };

export function Router({ children }: { children: React.ReactNode }) {
  // HashRouter works on GitHub Pages without server rewrites (URLs look like /#/maze).
  return <HashRouter>{children}</HashRouter>;
}

export function FileCard({ children }: { children: React.ReactNode }) {
  return <main className="file-card">{children}</main>;
}

export function Header({ title }: { title: string }) {
  return <header className="file-header"><h1 className="file-title">{title}</h1></header>;
}

export function Closing({ children }: { children?: React.ReactNode }) {
  return <footer className="file-closing">{children}</footer>;
}

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost';
  compact?: boolean;
  selected?: boolean;
};

export function FileButton({ variant = 'secondary', compact, selected, className, children, ...rest }: ButtonProps) {
  const cls = ['file-button', compact && 'is-compact', className].filter(Boolean).join(' ');
  return <button type="button" {...rest} className={cls} data-variant={variant} aria-pressed={selected}>{children}</button>;
}

export const Link = RRLink;

const PREFIX = 'eva-alef-beit:';

/** Like useState, but saved in this browser's localStorage. Third value says when loading is done. */
export function useLocalState<T>(key: string, initial: T): [T, (v: T) => void, { ready: boolean; message: string }] {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = window.localStorage.getItem(PREFIX + key);
      return raw === null ? initial : (JSON.parse(raw) as T);
    } catch {
      return initial;
    }
  });
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  const set = useCallback((v: T) => {
    setValue(v);
    try { window.localStorage.setItem(PREFIX + key, JSON.stringify(v)); } catch { /* private mode: ignore */ }
  }, [key]);
  return [value, set, { ready, message: 'ההתקדמות נשמרת בדפדפן של המכשיר הזה.' }];
}
