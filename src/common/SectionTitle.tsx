import { StyleSheet, Text } from 'react-native';
import { fonts, spacing, useTheme } from './theme';

// Título de seção: display, 13px, cor secundária (identidade §02/§07).
export function SectionTitle({ children }: { children: string }) {
  const t = useTheme();
  return <Text style={[s.title, { color: t.sub }]}>{children}</Text>;
}

const s = StyleSheet.create({
  title: {
    fontFamily: fonts.display700,
    fontSize: 13,
    paddingTop: spacing.padrao,
    paddingHorizontal: spacing.padrao,
    paddingBottom: spacing.interno,
  },
});
