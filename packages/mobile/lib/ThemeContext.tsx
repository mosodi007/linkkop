import React, { createContext, useContext } from 'react';

/**
 * App theme colors.
 * Main: #41C28A (primary / accent)
 * Secondary: #000000 (button background, dark surfaces)
 */
export const themeColors = {
  // Brand
  primary: '#41C28A',
  secondary: '#000000',

  // Aliases for common usage
  main: '#41C28A',
  buttonBackground: '#000000',

  // Semantic
  text: {
    primary: '#0f172a',
    secondary: '#64748b',
    muted: '#94a3b8',
    inverse: '#ffffff',
  },
  border: {
    default: '#e2e8f0',
    light: '#f1f5f9',
  },
  background: {
    screen: '#f1f5f9',
    card: '#ffffff',
    input: '#f8fafc',
    muted: '#e2e8f0',
  },
  tabBar: {
    active: '#41C28A',
    inactive: '#64748b',
    border: '#e2e8f0',
    background: '#ffffff',
  },
} as const;

export type Theme = typeof themeColors;

const ThemeContext = createContext<Theme>(themeColors);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <ThemeContext.Provider value={themeColors}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): Theme {
  const context = useContext(ThemeContext);
  if (!context) {
    return themeColors;
  }
  return context;
}
