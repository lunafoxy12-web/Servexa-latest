import React, { createContext, useContext, useState, useEffect } from 'react';

export type ThemeId = 'multi-shade' | 'servexa-classic' | 'mint-breeze' | 'ocean-cyan' | 'sunset-glow';

export interface ThemeConfig {
  id: ThemeId;
  name: string;
  description: string;
  previewGradient: string; // CSS gradient string
  navbarBg: string;
  navbarBorder: string;
  bottomNavBg: string;
  bottomNavBorder: string;
  headerGradient: string;
  accentColor: string;
  accentBg: string;
  accentHover: string;
  badgeBg: string;
  badgeText: string;
  cardBorderHover: string;
  pageBackground: string;
  btnPrimary: string;
  btnPrimaryHover: string;
  btnOutline: string;
}

export const THEME_CONFIGS: Record<ThemeId, ThemeConfig> = {
  'multi-shade': {
    id: 'multi-shade',
    name: 'Multi-Shade Aurora',
    description: 'Tranquil multi-shade gradient from mint green to aqua cyan and periwinkle sky blue',
    previewGradient: 'linear-gradient(to right, #a7f3d0, #a5f3fc, #bfdbfe, #93c5fd)',
    navbarBg: 'bg-gradient-to-r from-[#a7f3d0] via-[#a5f3fc] to-[#bfdbfe]',
    navbarBorder: 'border-[#6ee7b7]/70',
    bottomNavBg: 'bg-gradient-to-r from-[#a7f3d0]/95 via-[#a5f3fc]/95 to-[#bfdbfe]/95 backdrop-blur-md',
    bottomNavBorder: 'border-[#6ee7b7]/70',
    headerGradient: 'from-[#d1fae5] via-[#cffafe] to-[#dbeafe]',
    accentColor: '#0d9488',
    accentBg: 'bg-gradient-to-r from-emerald-600 via-teal-600 to-sky-600',
    accentHover: 'hover:from-emerald-700 hover:via-teal-700 hover:to-sky-700',
    badgeBg: 'bg-emerald-100 text-teal-900 border-emerald-300',
    badgeText: 'text-teal-800',
    cardBorderHover: 'hover:border-teal-400 hover:ring-2 hover:ring-teal-100',
    pageBackground: 'bg-gradient-to-b from-[#e6fffa] via-[#f0f9ff] to-[#eff6ff]',
    btnPrimary: 'bg-gradient-to-r from-emerald-600 via-teal-600 to-sky-600 text-white shadow-xs',
    btnPrimaryHover: 'hover:from-emerald-700 hover:via-teal-700 hover:to-sky-700',
    btnOutline: 'border-teal-500 text-teal-700 hover:bg-teal-50'
  },
  'servexa-classic': {
    id: 'servexa-classic',
    name: 'Servexa Classic Indigo',
    description: 'Original Royal Indigo and soft Periwinkle blue theme',
    previewGradient: 'linear-gradient(to right, #cbd5ff, #818cf8, #6366f1)',
    navbarBg: 'bg-gradient-to-r from-[#e0e7ff] via-[#cbd5ff] to-[#c7d2fe]',
    navbarBorder: 'border-indigo-200/90',
    bottomNavBg: 'bg-gradient-to-r from-[#e0e7ff]/95 via-[#cbd5ff]/95 to-[#c7d2fe]/95 backdrop-blur-md',
    bottomNavBorder: 'border-indigo-200/90',
    headerGradient: 'from-[#edf2ff] via-[#f8fafc] to-[#e8edff]',
    accentColor: '#4f46e5',
    accentBg: 'bg-indigo-600',
    accentHover: 'hover:bg-indigo-700',
    badgeBg: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    badgeText: 'text-indigo-800',
    cardBorderHover: 'hover:border-indigo-400 hover:ring-2 hover:ring-indigo-100',
    pageBackground: 'bg-gradient-to-b from-[#edf2ff] via-[#f8fafc] to-[#e8edff]',
    btnPrimary: 'bg-indigo-600 text-white shadow-xs',
    btnPrimaryHover: 'hover:bg-indigo-700',
    btnOutline: 'border-indigo-500 text-indigo-700 hover:bg-indigo-50'
  },
  'mint-breeze': {
    id: 'mint-breeze',
    name: 'Emerald Mint Oasis',
    description: 'Refreshing organic emerald and spearmint tones',
    previewGradient: 'linear-gradient(to right, #6ee7b7, #10b981, #047857)',
    navbarBg: 'bg-gradient-to-r from-[#d1fae5] via-[#a7f3d0] to-[#6ee7b7]',
    navbarBorder: 'border-emerald-300',
    bottomNavBg: 'bg-gradient-to-r from-[#d1fae5]/95 via-[#a7f3d0]/95 to-[#6ee7b7]/95 backdrop-blur-md',
    bottomNavBorder: 'border-emerald-300',
    headerGradient: 'from-[#ecfdf5] via-[#f0fdf4] to-[#e6fffa]',
    accentColor: '#059669',
    accentBg: 'bg-emerald-600',
    accentHover: 'hover:bg-emerald-700',
    badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    badgeText: 'text-emerald-800',
    cardBorderHover: 'hover:border-emerald-400 hover:ring-2 hover:ring-emerald-100',
    pageBackground: 'bg-gradient-to-b from-[#ecfdf5] via-[#f0fdf4] to-[#f7fee7]',
    btnPrimary: 'bg-emerald-600 text-white shadow-xs',
    btnPrimaryHover: 'hover:bg-emerald-700',
    btnOutline: 'border-emerald-500 text-emerald-700 hover:bg-emerald-50'
  },
  'ocean-cyan': {
    id: 'ocean-cyan',
    name: 'Deep Ocean Cyan',
    description: 'Vibrant Caribbean turquoise and deep ocean azure',
    previewGradient: 'linear-gradient(to right, #67e8f9, #06b6d4, #0284c7)',
    navbarBg: 'bg-gradient-to-r from-[#cffafe] via-[#a5f3fc] to-[#7dd3fc]',
    navbarBorder: 'border-cyan-300',
    bottomNavBg: 'bg-gradient-to-r from-[#cffafe]/95 via-[#a5f3fc]/95 to-[#7dd3fc]/95 backdrop-blur-md',
    bottomNavBorder: 'border-cyan-300',
    headerGradient: 'from-[#ecfeff] via-[#f0fdfa] to-[#e0f2fe]',
    accentColor: '#0891b2',
    accentBg: 'bg-cyan-600',
    accentHover: 'hover:bg-cyan-700',
    badgeBg: 'bg-cyan-100 text-cyan-800 border-cyan-200',
    badgeText: 'text-cyan-800',
    cardBorderHover: 'hover:border-cyan-400 hover:ring-2 hover:ring-cyan-100',
    pageBackground: 'bg-gradient-to-b from-[#ecfeff] via-[#f0fdfa] to-[#e0f2fe]',
    btnPrimary: 'bg-cyan-600 text-white shadow-xs',
    btnPrimaryHover: 'hover:bg-cyan-700',
    btnOutline: 'border-cyan-500 text-cyan-700 hover:bg-cyan-50'
  },
  'sunset-glow': {
    id: 'sunset-glow',
    name: 'Sunset Coral & Amber',
    description: 'Warm tropical peach, apricot and golden amber',
    previewGradient: 'linear-gradient(to right, #fed7aa, #fb923c, #f97316)',
    navbarBg: 'bg-gradient-to-r from-[#ffedd5] via-[#fed7aa] to-[#fdba74]',
    navbarBorder: 'border-orange-300',
    bottomNavBg: 'bg-gradient-to-r from-[#ffedd5]/95 via-[#fed7aa]/95 to-[#fdba74]/95 backdrop-blur-md',
    bottomNavBorder: 'border-orange-300',
    headerGradient: 'from-[#fff7ed] via-[#fefce8] to-[#fff1f2]',
    accentColor: '#ea580c',
    accentBg: 'bg-orange-600',
    accentHover: 'hover:bg-orange-700',
    badgeBg: 'bg-orange-100 text-orange-800 border-orange-200',
    badgeText: 'text-orange-800',
    cardBorderHover: 'hover:border-orange-400 hover:ring-2 hover:ring-orange-100',
    pageBackground: 'bg-gradient-to-b from-[#fff7ed] via-[#fefce8] to-[#fff1f2]',
    btnPrimary: 'bg-orange-600 text-white shadow-xs',
    btnPrimaryHover: 'hover:bg-orange-700',
    btnOutline: 'border-orange-500 text-orange-700 hover:bg-orange-50'
  }
};

interface ThemeContextType {
  activeThemeId: ThemeId;
  theme: ThemeConfig;
  setTheme: (id: ThemeId) => void;
  isThemeModalOpen: boolean;
  setIsThemeModalOpen: (open: boolean) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeThemeId, setActiveThemeId] = useState<ThemeId>(() => {
    try {
      const saved = localStorage.getItem('servexa_theme') as ThemeId;
      if (saved && THEME_CONFIGS[saved]) {
        return saved;
      }
    } catch {
      // fallback
    }
    // Default to the user's requested multi-shade style!
    return 'multi-shade';
  });

  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);

  const setTheme = (id: ThemeId) => {
    if (THEME_CONFIGS[id]) {
      setActiveThemeId(id);
      try {
        localStorage.setItem('servexa_theme', id);
      } catch {
        // ignore
      }
    }
  };

  const theme = THEME_CONFIGS[activeThemeId] || THEME_CONFIGS['multi-shade'];

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.style.setProperty('--theme-accent', theme.accentColor);
      document.documentElement.setAttribute('data-theme', theme.id);
    }
  }, [theme]);

  return (
    <ThemeContext.Provider
      value={{
        activeThemeId,
        theme,
        setTheme,
        isThemeModalOpen,
        setIsThemeModalOpen
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
