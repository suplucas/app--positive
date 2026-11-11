// Tokens da identidade "tim" (identidade_visual.md). Fonte única dos tokens:
// cores, tipografia, escala de 4px e tema claro/escuro.
// Cores de marca (mostarda/lambe-lambe/picles) são idênticas nos dois modos.
import { createContext, useContext } from 'react';

export const palette = {
  berinjela: '#241A22',
  papel: '#FBF2E4',
  mostarda: '#F2A93B',
  lambeLambe: '#E63E75',
  picles: '#7A9A3D',
  piclesInk: '#4C6027',
  overlay: 'rgba(36,26,34,0.55)',
  overlayStrong: 'rgba(36,26,34,0.82)',
} as const;

export const spacing = {
  micro: 4,
  interno: 8,
  medio: 12,
  padrao: 16,
  grande: 20,
  secao: 24,
  bloco: 32,
} as const;

export const type = {
  caption: 11,
  small: 12,
  body: 13,
  bodyLarge: 14,
  title: 16,
  heading: 18,
  page: 22,
  hero: 30,
} as const;

export const radius = {
  chip: 5,
  thumb: 10,
  card: 12,
  panel: 16,
  pill: 999,
} as const;

export const fonts = {
  display700: 'BricolageGrotesque_700Bold',
  display800: 'BricolageGrotesque_800ExtraBold',
  corpo: 'InstrumentSans_400Regular',
  corpo500: 'InstrumentSans_500Medium',
  corpo600: 'InstrumentSans_600SemiBold',
} as const;

export type Theme = {
  mode: 'light' | 'dark';
  bg: string;
  ink: string;
  sub: string;
  line: string;
  quietBg: string;
  chipActiveBg: string;
  chipActiveInk: string;
  // Fundo da linha de notificação não-lida (POC painel).
  unreadBg: string;
};

// Dark mode: fundo neutro #121212 (nunca berinjela), texto #F2F0EF.
export const lightTheme: Theme = {
  mode: 'light',
  bg: palette.papel,
  ink: palette.berinjela,
  sub: 'rgba(36,26,34,0.58)',
  line: 'rgba(36,26,34,0.10)',
  quietBg: 'rgba(36,26,34,0.06)',
  chipActiveBg: palette.berinjela,
  chipActiveInk: palette.papel,
  unreadBg: 'rgba(242,169,59,0.14)',
};

export const darkTheme: Theme = {
  mode: 'dark',
  bg: '#121212',
  ink: '#F2F0EF',
  sub: 'rgba(242,240,239,0.55)',
  line: 'rgba(242,240,239,0.09)',
  quietBg: 'rgba(242,240,239,0.10)',
  chipActiveBg: '#F2F0EF',
  chipActiveInk: '#121212',
  unreadBg: 'rgba(242,169,59,0.09)',
};

// Default claro para componentes renderizados fora do provider (testes).
export const ThemeContext = createContext<Theme>(lightTheme);

export function useTheme(): Theme {
  return useContext(ThemeContext);
}
