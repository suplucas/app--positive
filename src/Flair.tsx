import { StyleSheet, Text, View } from 'react-native';
import { fonts, palette, spacing, useTheme } from './theme';

// Flair real da review (um dos labels escolhidos no compose). Quieto
// por padrão; forte pinta a cor cheia (máx. 1 por tela — quem decide é
// o App). Nota numérica nunca substitui o flair, e o flair nunca
// substitui a nota (identidade §09).
export function Flair({
  label,
  strong = false,
}: {
  label: string;
  strong?: boolean;
}) {
  const t = useTheme();
  return (
    <View
      testID={strong ? 'flair-forte' : 'flair-quieto'}
      style={[s.base, { backgroundColor: strong ? palette.picles : t.quietBg }]}
    >
      <Text style={[s.text, { color: strong ? palette.papel : t.sub }]}>
        {label}
      </Text>
    </View>
  );
}

const s = StyleSheet.create({
  base: {
    borderRadius: 5,
    paddingHorizontal: spacing.interno,
    paddingVertical: 2,
    alignSelf: 'flex-start',
  },
  text: {
    fontFamily: fonts.corpo500,
    fontSize: 11,
  },
});
