import type { ReactNode } from 'react';
import { StyleSheet, Text } from 'react-native';
import { fonts, useTheme } from './theme';

// Título do header de cada página (feed/busca/mapa/perfil/avaliar).
// Tamanho consolidado em 22px; o wordmark do feed mantém o "im" rosa.
export function PageTitle({ children }: { children: ReactNode }) {
  const t = useTheme();
  return <Text style={[s.word, { color: t.ink }]}>{children}</Text>;
}

const s = StyleSheet.create({
  word: {
    fontFamily: fonts.display800,
    fontSize: 22,
    lineHeight: 26,
  },
});
