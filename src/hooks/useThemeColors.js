import { useContext, useMemo } from 'react';
import { ThemeCtx } from '../contexts';

export function useThemeColors() {
  const theme = useContext(ThemeCtx);
  const isDark = theme === 'dark';
  return useMemo(() => ({
    isDark,
    bg: isDark ? '#06080c' : '#f0f2f5',
    card: isDark ? 'rgba(255,255,255,0.025)' : 'rgba(255,255,255,0.85)',
    cardBorder: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)',
    textP: isDark ? '#e8eaed' : '#111318',
    textS: isDark ? '#9aa0a8' : '#5f6672',
    textM: isDark ? '#484e58' : '#a0a6b0',
    inputBg: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
    inputBorder: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)',
  }), [isDark]);
}
