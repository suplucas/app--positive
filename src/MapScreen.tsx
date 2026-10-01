import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { mapPlaces } from './mapMock';
import { SectionTitle } from './SectionTitle';
import { palette, spacing, fonts, useTheme } from './theme';

// Aba Mapa (mock docs/16). Sem SDK: "perto de você" é uma moldura
// estilizada com manchas de bairro, o ponto escuro central é "você" e
// cada pin colorido é um restaurante (cor pela faixa de nota). "Nessa
// área" é um carrossel de cards. Tocar em pin/card abre a página do
// restaurante. Mapa real usaria Google Maps/Mapbox por baixo.
export function MapScreen({
  onOpenRestaurant,
}: {
  onOpenRestaurant: (cnpj: string) => void;
}) {
  const t = useTheme();
  const places = mapPlaces();

  return (
    <ScrollView
      style={{ backgroundColor: t.bg }}
      contentContainerStyle={s.scroll}
    >
      <SectionTitle>perto de você</SectionTitle>

      <View
        testID="mapa-moldura"
        style={[s.map, { backgroundColor: t.quietBg, borderColor: t.line }]}
      >
        {/* manchas de bairro (sem lib de gradiente) */}
        <View style={[s.blob, s.blobA, { backgroundColor: 'rgba(122,154,61,0.18)' }]} />
        <View style={[s.blob, s.blobB, { backgroundColor: 'rgba(242,169,59,0.16)' }]} />

        {/* você */}
        <View
          testID="mapa-voce"
          style={[s.you, { backgroundColor: t.ink, borderColor: t.bg }]}
        />

        {places.map((p) => (
          <Pressable
            key={p.cnpj}
            testID={`mapa-pin-${p.cnpj}`}
            onPress={() => onOpenRestaurant(p.cnpj)}
            style={[
              s.pin,
              { left: `${p.x * 100}%`, top: `${p.y * 100}%` },
            ]}
            accessibilityRole="button"
            accessibilityLabel={`${p.nome}, nota ${p.nota.toFixed(1)}`}
          >
            <View style={[s.pinDot, { backgroundColor: p.cor }]}>
              <Text style={s.pinNote}>{p.nota.toFixed(1)}</Text>
            </View>
          </Pressable>
        ))}
      </View>

      <SectionTitle>nessa área</SectionTitle>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.carousel}
      >
        {places.map((p) => (
          <Pressable
            key={p.cnpj}
            testID={`mapa-card-${p.cnpj}`}
            onPress={() => onOpenRestaurant(p.cnpj)}
            style={({ pressed }) => [s.card, pressed && { opacity: 0.85 }]}
            accessibilityRole="button"
            accessibilityLabel={`abrir ${p.nome}`}
          >
            <View style={[s.cardPhoto, { backgroundColor: p.cor }]}>
              <View style={s.cardNote}>
                <Text style={s.cardNoteText}>{p.nota.toFixed(1)}</Text>
              </View>
            </View>
            <Text style={[s.cardName, { color: t.ink }]} numberOfLines={1}>
              {p.nome}
            </Text>
            <Text style={[s.cardMeta, { color: t.sub }]} numberOfLines={1}>
              {p.bairro} · {p.distanciaKm.toFixed(1)}km
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <Text style={[s.legend, { color: t.sub }]}>
        Pin colorido = restaurante avaliado na comunidade (cor pela faixa de
        nota). O ponto escuro no centro é “você”. Protótipo visual — o mapa
        real usaria um SDK (Google Maps/Mapbox) por baixo.
      </Text>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  scroll: { paddingBottom: spacing.bloco },
  map: {
    height: 340,
    marginHorizontal: spacing.padrao,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  blob: { position: 'absolute', borderRadius: 999 },
  blobA: { width: 190, height: 190, top: -30, left: -40 },
  blobB: { width: 220, height: 220, bottom: -60, right: -50 },
  you: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 3,
    marginLeft: -7,
    marginTop: -7,
  },
  // Pin gota: quadrado rotacionado; o número volta a -45º para ficar reto.
  pin: {
    position: 'absolute',
    width: 30,
    height: 30,
    marginLeft: -15,
    marginTop: -30,
  },
  pinDot: {
    width: 30,
    height: 30,
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    borderBottomRightRadius: 15,
    borderBottomLeftRadius: 0,
    transform: [{ rotate: '-45deg' }],
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinNote: {
    transform: [{ rotate: '45deg' }],
    fontFamily: fonts.display800,
    fontSize: 10,
    color: '#fff',
  },
  carousel: {
    gap: spacing.interno,
    paddingHorizontal: spacing.padrao,
    paddingBottom: spacing.interno,
  },
  card: { width: 150 },
  cardPhoto: {
    width: '100%',
    height: 90,
    borderRadius: 12,
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    padding: 5,
  },
  cardNote: {
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 5,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  cardNoteText: {
    color: '#fff',
    fontFamily: fonts.display800,
    fontSize: 10.5,
  },
  cardName: {
    fontFamily: fonts.display700,
    fontSize: 12.5,
    marginTop: 6,
  },
  cardMeta: { fontSize: 11, marginTop: 1 },
  legend: {
    fontSize: 12,
    lineHeight: 18,
    paddingHorizontal: spacing.padrao,
    paddingTop: spacing.padrao,
  },
});
