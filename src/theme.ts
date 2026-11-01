// Tokens da identidade "tim" (identidade_visual.md). Fonte única dos tokens:
// cores, tipografia, escala de 4px e tema claro/escuro.
// Cores de marca (mostarda/lambe-lambe/picles) são idênticas nos dois modos.
import { createContext, useContext } from "react";

export const palette = {
  berinjela: "#241A22",
  papel: "#FBF2E4",
  mostarda: "#F2A93B",
  lambeLambe: "#E63E75",
  picles: "#7A9A3D",
} as const;

export const spacing = {
  micro: 4,
  interno: 8,
  padrao: 16,
  secao: 24,
  bloco: 32,
} as const;

export const fonts = {
  display700: "BricolageGrotesque_700Bold",
  display800: "BricolageGrotesque_800ExtraBold",
  corpo: "InstrumentSans_400Regular",
  corpo500: "InstrumentSans_500Medium",
  corpo600: "InstrumentSans_600SemiBold",
} as const;

export type Theme = {
  mode: "light" | "dark";
  bg: string;
  ink: string;
  sub: string;
  line: string;
  quietBg: string;
  chipActiveBg: string;
  chipActiveInk: string;
};

// Dark mode: fundo neutro #121212 (nunca berinjela), texto #F2F0EF.
export const lightTheme: Theme = {
  mode: "light",
  bg: palette.papel,
  ink: palette.berinjela,
  sub: "rgba(36,26,34,0.58)",
  line: "rgba(36,26,34,0.10)",
  quietBg: "rgba(36,26,34,0.06)",
  chipActiveBg: palette.berinjela,
  chipActiveInk: palette.papel,
};

export const darkTheme: Theme = {
  mode: "dark",
  bg: "#121212",
  ink: "#F2F0EF",
  sub: "rgba(242,240,239,0.55)",
  line: "rgba(242,240,239,0.09)",
  quietBg: "rgba(242,240,239,0.10)",
  chipActiveBg: "#F2F0EF",
  chipActiveInk: "#121212",
};

// Default claro para componentes renderizados fora do provider (testes).
export const ThemeContext = createContext<Theme>(lightTheme);

export function useTheme(): Theme {
  return useContext(ThemeContext);
}
