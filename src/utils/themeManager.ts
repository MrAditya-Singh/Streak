export interface AppTheme {
  id: string;
  name: string;
  subtitle: string;
  tagline: string;
  archetype: string;
  badge: string;
  pattern: 'cyber-grid' | 'synth-scanlines' | 'matrix-rain' | 'solar-corona' | 'frost-crystals' | 'shadow-eclipse' | 'luxury-pinstripe' | 'parchment-vellum';
  iconName: string;
  emoji: string;
  isDark: boolean;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    bg: string;
    cardBg: string;
    border: string;
    text: string;
    subtext: string;
    glow: string;
    pillBg: string;
  };
  gradient: string;
  cardPreviewBg: string;
  headerStyle: {
    background: string;
    border: string;
  };
  bodyStyle: {
    background: string;
    color: string;
  };
  highlights: string[];
}

export const APP_THEMES: AppTheme[] = [
  {
    id: 'cyber-obsidian',
    name: 'Solo Leveling Obsidian',
    subtitle: 'Cyber Abyss & Electric Blue',
    tagline: 'Deep space obsidian infused with S-Rank hunter electric blue & neon cyan mana aura',
    archetype: 'HUNTER S-RANK',
    badge: '⚡ CYBER MANA',
    pattern: 'cyber-grid',
    iconName: 'Zap',
    emoji: '⚡',
    isDark: true,
    colors: {
      primary: '#38BDF8',
      secondary: '#818CF8',
      accent: '#06B6D4',
      bg: '#060a12',
      cardBg: '#0c1424',
      border: 'rgba(56, 189, 248, 0.35)',
      text: '#F8FAFC',
      subtext: '#94A3B8',
      glow: 'rgba(56, 189, 248, 0.45)',
      pillBg: 'rgba(56, 189, 248, 0.15)',
    },
    gradient: 'from-cyan-500 via-blue-600 to-indigo-600',
    cardPreviewBg: 'linear-gradient(135deg, #0c1424 0%, #060a12 100%)',
    headerStyle: {
      background: 'linear-gradient(135deg, rgba(12, 20, 36, 0.95), rgba(6, 10, 18, 0.98))',
      border: '1px solid rgba(56, 189, 248, 0.35)',
    },
    bodyStyle: {
      background: '#060a12',
      color: '#F8FAFC',
    },
    highlights: ['Holographic Cyber Grid', 'Electric Blue Mana Aura', 'Cold Sharp Glassmorphism'],
  },
  {
    id: 'emerald-matrix',
    name: 'Emerald Matrix Zen',
    subtitle: 'Cyber Grove & Radiant Mint',
    tagline: 'Deep velvet forest obsidian with luminous jade matrix rain and bioluminescent mint serenity',
    archetype: 'BIO-MATRIX ZEN',
    badge: '🌿 NEURAL GROVE',
    pattern: 'matrix-rain',
    iconName: 'Flame',
    emoji: '🌲',
    isDark: true,
    colors: {
      primary: '#10B981',
      secondary: '#34D399',
      accent: '#059669',
      bg: '#02150e',
      cardBg: '#062619',
      border: 'rgba(52, 211, 153, 0.35)',
      text: '#ECFDF5',
      subtext: '#6EE7B7',
      glow: 'rgba(16, 185, 129, 0.45)',
      pillBg: 'rgba(16, 185, 129, 0.16)',
    },
    gradient: 'from-emerald-400 via-teal-500 to-green-600',
    cardPreviewBg: 'linear-gradient(135deg, #062619 0%, #02150e 100%)',
    headerStyle: {
      background: 'linear-gradient(135deg, rgba(6, 38, 25, 0.95), rgba(2, 21, 14, 0.98))',
      border: '1px solid rgba(52, 211, 153, 0.38)',
    },
    bodyStyle: {
      background: '#02150e',
      color: '#ECFDF5',
    },
    highlights: ['Digital Rain Sheen', 'Bio-luminescent Mint Spores', 'Zen Mountain Calm'],
  },
  {
    id: 'arctic-frost',
    name: 'Arctic Glacier Frost',
    subtitle: 'Crystalline Cyan & Aurora Navy',
    tagline: 'Sub-zero oceanic crystalline navy with aurora borealis reflections and glacial cryo glazes',
    archetype: 'CRYO FROST -40°',
    badge: '❄️ POLAR AURORA',
    pattern: 'frost-crystals',
    iconName: 'ShieldAlert',
    emoji: '❄️',
    isDark: true,
    colors: {
      primary: '#38BDF8',
      secondary: '#2DD4BF',
      accent: '#818CF8',
      bg: '#040e1b',
      cardBg: '#091c34',
      border: 'rgba(56, 189, 248, 0.35)',
      text: '#F0F9FF',
      subtext: '#7DD3FC',
      glow: 'rgba(56, 189, 248, 0.45)',
      pillBg: 'rgba(56, 189, 248, 0.16)',
    },
    gradient: 'from-sky-400 via-teal-400 to-indigo-500',
    cardPreviewBg: 'linear-gradient(135deg, #091c34 0%, #040e1b 100%)',
    headerStyle: {
      background: 'linear-gradient(135deg, rgba(9, 28, 52, 0.95), rgba(4, 14, 27, 0.98))',
      border: '1px solid rgba(56, 189, 248, 0.38)',
    },
    bodyStyle: {
      background: '#040e1b',
      color: '#F0F9FF',
    },
    highlights: ['Glacial Ice Reflections', 'Aurora Borealis Waves', 'Sub-Zero Cryo Glass'],
  },
  {
    id: 'shadow-monarch',
    name: 'Shadow Monarch Crimson',
    subtitle: 'Vampire Velvet & Blood Rose',
    tagline: 'Gothic charcoal crypt abyss illuminated by vampire blood crimson and royal purple eclipse',
    archetype: 'SHADOW MONARCH',
    badge: '🩸 BLOOD ECLIPSE',
    pattern: 'shadow-eclipse',
    iconName: 'Moon',
    emoji: '👑',
    isDark: true,
    colors: {
      primary: '#EF4444',
      secondary: '#9333EA',
      accent: '#F59E0B',
      bg: '#0d0411',
      cardBg: '#1c0924',
      border: 'rgba(239, 68, 68, 0.38)',
      text: '#FEF2F2',
      subtext: '#F87171',
      glow: 'rgba(239, 68, 68, 0.5)',
      pillBg: 'rgba(239, 68, 68, 0.18)',
    },
    gradient: 'from-red-600 via-purple-700 to-rose-700',
    cardPreviewBg: 'linear-gradient(135deg, #1c0924 0%, #0d0411 100%)',
    headerStyle: {
      background: 'linear-gradient(135deg, rgba(28, 9, 36, 0.95), rgba(13, 4, 17, 0.98))',
      border: '1px solid rgba(239, 68, 68, 0.4)',
    },
    bodyStyle: {
      background: '#0d0411',
      color: '#FEF2F2',
    },
    highlights: ['Vampiric Crimson Velvet', 'Eclipse Shadow Smoke', 'Gothic Monarch Borders'],
  },
  {
    id: 'golden-luxury',
    name: '24K Golden Prestige',
    subtitle: 'Champagne Gold & Titanium Noir',
    tagline: 'Ultra-luxurious carbon titanium noir with 24K champagne gold borders and haute horlogerie sheen',
    archetype: '24K HAUTE PRESTIGE',
    badge: '⚜️ ROYAL GOLD',
    pattern: 'luxury-pinstripe',
    iconName: 'Sparkles',
    emoji: '⚜️',
    isDark: true,
    colors: {
      primary: '#FBBF24',
      secondary: '#EAB308',
      accent: '#F59E0B',
      bg: '#08080a',
      cardBg: '#141418',
      border: 'rgba(251, 191, 36, 0.38)',
      text: '#FFFBEB',
      subtext: '#FDE68A',
      glow: 'rgba(251, 191, 36, 0.45)',
      pillBg: 'rgba(251, 191, 36, 0.18)',
    },
    gradient: 'from-amber-300 via-yellow-400 to-amber-600',
    cardPreviewBg: 'linear-gradient(135deg, #141418 0%, #08080a 100%)',
    headerStyle: {
      background: 'linear-gradient(135deg, rgba(20, 20, 24, 0.95), rgba(8, 8, 10, 0.98))',
      border: '1px solid rgba(251, 191, 36, 0.4)',
    },
    bodyStyle: {
      background: '#08080a',
      color: '#FFFBEB',
    },
    highlights: ['24K Champagne Sheen', 'Brushed Titanium Noir', 'Haute Horlogerie Foil'],
  },
  {
    id: 'warm-parchment',
    name: 'Renaissance Parchment',
    subtitle: 'Italian Leather & Editorial Cream',
    tagline: 'Signature Florentine vellum paper with dark roast espresso typography and antique Tuscan gold',
    archetype: 'FLORENCE 1520',
    badge: '📜 ITALIAN VELLUM',
    pattern: 'parchment-vellum',
    iconName: 'Sun',
    emoji: '📜',
    isDark: false,
    colors: {
      primary: '#B45309',
      secondary: '#D97706',
      accent: '#1E3A8A',
      bg: '#F4EFE6',
      cardBg: '#FCFBF8',
      border: 'rgba(180, 83, 9, 0.25)',
      text: '#0F172A',
      subtext: '#64748B',
      glow: 'rgba(180, 83, 9, 0.25)',
      pillBg: 'rgba(180, 83, 9, 0.12)',
    },
    gradient: 'from-amber-700 via-amber-600 to-yellow-700',
    cardPreviewBg: 'linear-gradient(135deg, #FCFBF8 0%, #F4EFE6 100%)',
    headerStyle: {
      background: '#FCFBF8',
      border: '1px solid #E8E3D9',
    },
    bodyStyle: {
      background: '#F4EFE6',
      color: '#0F172A',
    },
    highlights: ['Florentine Vellum Paper', 'Dark Roast Espresso Type', 'Deckled Antique Borders'],
  },
];

export const DEFAULT_THEME_ID = 'cyber-obsidian';

export function getThemeById(themeId: string): AppTheme {
  return APP_THEMES.find((t) => t.id === themeId) || APP_THEMES[0];
}

export function applyThemeToDocument(theme: AppTheme) {
  const root = document.documentElement;

  // Set data-theme attribute
  root.setAttribute('data-theme', theme.id);

  if (theme.isDark) {
    root.classList.add('dark');
    root.classList.remove('light');
  } else {
    root.classList.remove('dark');
    root.classList.add('light');
  }

  // Set CSS Custom properties for dynamic themes
  root.style.setProperty('--theme-primary', theme.colors.primary);
  root.style.setProperty('--theme-secondary', theme.colors.secondary);
  root.style.setProperty('--theme-accent', theme.colors.accent);
  root.style.setProperty('--theme-bg', theme.colors.bg);
  root.style.setProperty('--theme-card-bg', theme.colors.cardBg);
  root.style.setProperty('--theme-border', theme.colors.border);
  root.style.setProperty('--theme-text', theme.colors.text);
  root.style.setProperty('--theme-subtext', theme.colors.subtext);
  root.style.setProperty('--theme-glow', theme.colors.glow);
  root.style.setProperty('--theme-pill-bg', theme.colors.pillBg);
}
