export const themes = {
  default: {
    name: 'Default',
    colors: {
      bg: '#1a1a2e',
      bgSecondary: '#16213e',
      surface: '#0f3460',
      primary: '#e94560',
      secondary: '#533483',
      text: '#eaeaea',
      textMuted: '#a0a0a0',
      border: '#2a2a4e',
      accent: '#e94560',
      success: '#4ade80',
      warning: '#fbbf24',
      error: '#ef4444',
    },
  },
  ocean: {
    name: 'Ocean',
    colors: {
      bg: '#0f172a',
      bgSecondary: '#1e293b',
      surface: '#334155',
      primary: '#0ea5e9',
      secondary: '#8b5cf6',
      text: '#f1f5f9',
      textMuted: '#94a3b8',
      border: '#334155',
      accent: '#0ea5e9',
      success: '#22c55e',
      warning: '#eab308',
      error: '#ef4444',
    },
  },
  forest: {
    name: 'Forest',
    colors: {
      bg: '#1a1f16',
      bgSecondary: '#262c20',
      surface: '#3a422a',
      primary: '#84cc16',
      secondary: '#65a30d',
      text: '#e7e5e4',
      textMuted: '#a3a18d',
      border: '#3a422a',
      accent: '#84cc16',
      success: '#4ade80',
      warning: '#fbbf24',
      error: '#ef4444',
    },
  },
  sunset: {
    name: 'Sunset',
    colors: {
      bg: '#1f1510',
      bgSecondary: '#2d1f18',
      surface: '#3d2a22',
      primary: '#f97316',
      secondary: '#ea580c',
      text: '#fafaf9',
      textMuted: '#a8a29e',
      border: '#3d2a22',
      accent: '#f97316',
      success: '#22c55e',
      warning: '#fbbf24',
      error: '#ef4444',
    },
  },
  lavender: {
    name: 'Lavender',
    colors: {
      bg: '#1a1625',
      bgSecondary: '#251f38',
      surface: '#322c4a',
      primary: '#a78bfa',
      secondary: '#7c3aed',
      text: '#f5f3ff',
      textMuted: '#a5b4fc',
      border: '#322c4a',
      accent: '#a78bfa',
      success: '#4ade80',
      warning: '#fbbf24',
      error: '#ef4444',
    },
  },
  cherry: {
    name: 'Cherry',
    colors: {
      bg: '#251a1a',
      bgSecondary: '#381f1f',
      surface: '#4a2525',
      primary: '#fb7185',
      secondary: '#e11d48',
      text: '#fff1f2',
      textMuted: '#fda4af',
      border: '#4a2525',
      accent: '#fb7185',
      success: '#4ade80',
      warning: '#fbbf24',
      error: '#ef4444',
    },
  },
  mint: {
    name: 'Mint',
    colors: {
      bg: '#151f1a',
      bgSecondary: '#1f2c26',
      surface: '#2a3d32',
      primary: '#34d399',
      secondary: '#059669',
      text: '#ecfdf5',
      textMuted: '#6ee7b7',
      border: '#2a3d32',
      accent: '#34d399',
      success: '#22c55e',
      warning: '#eab308',
      error: '#ef4444',
    },
  },
};

export type ThemeName = keyof typeof themes;

export function getThemeColors(themeName: string) {
  return themes[themeName as ThemeName]?.colors || themes.default.colors;
}

export function applyTheme(themeName: string) {
  const colors = getThemeColors(themeName);
  const root = document.documentElement;
  
  Object.entries(colors).forEach(([key, value]) => {
    root.style.setProperty(`--color-${key}`, value);
  });
}