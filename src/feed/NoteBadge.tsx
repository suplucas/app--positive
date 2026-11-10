import { StyleSheet, Text, View } from 'react-native';
import { fonts, palette, radius, spacing, useTheme } from '../common/theme';

// Nota numérica sempre visível ao lado do conteúdo (identidade §09).
// variant 'chip' fica nos quadrados da estante/diário do perfil.
export function NoteBadge({
  note,
  variant = 'plain',
}: {
  note: string;
  variant?: 'plain' | 'chip';
}) {
  const t = useTheme();
  if (variant === 'chip') {
    return (
      <View style={s.chip}>
        <Text style={s.chipText}>{note}</Text>
      </View>
    );
  }
  return <Text style={[s.plain, { color: t.ink }]}>{note}</Text>;
}

const s = StyleSheet.create({
  plain: {
    fontFamily: fonts.display800,
    fontSize: 15,
    flexShrink: 0,
    marginTop: 1,
  },
  chip: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    backgroundColor: palette.overlayStrong,
    borderRadius: radius.chip,
    paddingHorizontal: spacing.micro,
    paddingVertical: 1, // óptico: chip minúsculo de nota no canto da foto
  },
  chipText: {
    fontFamily: fonts.display800,
    fontSize: 10.5,
    color: palette.papel,
  },
});
