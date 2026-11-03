import { StyleSheet, Text, View } from 'react-native';
import { PODIO } from './mockData';
import { SectionTitle } from './SectionTitle';
import { fonts, palette, spacing, useTheme } from './theme';

const PLATE_HEIGHT: Record<1 | 2 | 3, number> = { 1: 96, 2: 76, 3: 60 };
const PLATE_BG: Record<1 | 2 | 3, string> = {
  1: palette.mostarda,
  2: palette.lambeLambe,
  3: palette.picles,
};
const PLATE_INK: Record<1 | 2 | 3, string> = {
  1: palette.berinjela,
  2: palette.papel,
  3: palette.papel,
};

// Pódio "top da semana" — mock. Elemento de cor estrutural do feed.
export function Podium() {
  const t = useTheme();
  return (
    <View>
      <SectionTitle>top da semana</SectionTitle>
      <View style={[s.podium, { borderBottomColor: t.line }]}>
        {PODIO.map((p) => (
          <View key={p.name} style={s.pod}>
            <Text style={s.medal}>{p.medal}</Text>
            <View
              style={[s.plate, { height: PLATE_HEIGHT[p.place], backgroundColor: PLATE_BG[p.place] }]}
            />
            <Text style={[s.placeName, { color: t.ink }]}>{p.name}</Text>
            <Text style={[s.note, { color: t.ink }]}>{p.note}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  podium: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.interno,
    paddingHorizontal: spacing.padrao,
    paddingBottom: spacing.padrao,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  pod: { flex: 1, alignItems: 'center' },
  medal: { fontSize: 13, marginBottom: 2 },
  plate: {
    width: '100%',
    borderRadius: 10,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
  },
  placeName: {
    fontSize: 11.5,
    fontFamily: fonts.corpo600,
    fontWeight: '600',
    marginTop: spacing.micro,
    lineHeight: 14,
    textAlign: 'center',
  },
  note: {
    fontFamily: fonts.display800,
    fontSize: 14,
    marginTop: 2,
  },
});
