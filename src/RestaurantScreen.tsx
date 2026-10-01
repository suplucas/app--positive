import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { FeedCard } from './FeedCard';
import { FeedQuote } from './FeedQuote';
import { SectionTitle } from './SectionTitle';
import { restaurantFor } from './restaurantMock';
import { fonts, palette, spacing, useTheme } from './theme';

// Página do restaurante (docs_05): cover com selo de nota, stats,
// ações "avaliar"/"quero ir", social proof, flairs agregados
// ("o que a galera diz") e avaliações reaproveitando os componentes
// do feed (linha compacta + quote card intercalado). Dados mock.
export function RestaurantScreen({
  cnpj,
  onBack,
  onEvaluate,
}: {
  cnpj: string;
  onBack: () => void;
  onEvaluate: () => void;
}) {
  const t = useTheme();
  const data = restaurantFor(cnpj);
  const [saved, setSaved] = useState(false);

  return (
    <ScrollView style={{ backgroundColor: t.bg }}>
      <View style={[s.topbar, { backgroundColor: t.bg }]}>
        <Pressable
          testID="voltar"
          onPress={onBack}
          style={[s.tbtn, { backgroundColor: 'rgba(36,26,34,0.55)' }]}
          hitSlop={6}
          accessibilityRole="button"
          accessibilityLabel="voltar"
        >
          <Text style={[s.tbtnText, { color: '#fff' }]}>←</Text>
        </Pressable>
      </View>

      <View style={[s.cover, { backgroundColor: data.capa }]}>
        <View style={s.coverNote}>
          <Text style={s.coverNoteText}>{data.notaMedia.toFixed(1)}</Text>
        </View>
      </View>

      <View style={s.info}>
        <Text style={[s.name, { color: t.ink }]}>{data.nome}</Text>
        <Text style={[s.sub, { color: t.sub }]}>
          {data.categoria} · {data.bairro} · {data.preco} · a{' '}
          {data.distanciaKm.toFixed(1)}km de você
        </Text>
      </View>

      <View style={[s.stats, { borderBottomColor: t.line }]}>
        <Stat n={data.notaMedia.toFixed(1)} l="nota média" ink={t.ink} sub={t.sub} />
        <Stat n={String(data.totalAvaliacoes)} l="avaliações" ink={t.ink} sub={t.sub} />
        <Stat n={String(data.queroIr)} l="quero ir" ink={t.ink} sub={t.sub} />
      </View>

      <View style={s.actions}>
        <Pressable
          testID="avaliar-restaurante"
          onPress={onEvaluate}
          style={[s.btn, s.primary, { backgroundColor: palette.lambeLambe }]}
          accessibilityRole="button"
        >
          <Text style={[s.btnText, { color: t.bg }]}>avaliar</Text>
        </Pressable>
        <Pressable
          testID="quero-ir"
          onPress={() => setSaved((v) => !v)}
          style={[
            s.btn,
            s.secondary,
            { borderColor: t.ink },
            saved && { backgroundColor: t.ink },
          ]}
          accessibilityRole="button"
          accessibilityState={{ selected: saved }}
        >
          <Text
            style={[s.btnText, { color: saved ? t.bg : t.ink }]}
          >
            {saved ? '★ salvo' : '☆ quero ir'}
          </Text>
        </Pressable>
      </View>

      <Text style={[s.proof, { color: t.sub }]}>
        {data.totalAvaliacoes} pessoas que você segue já avaliaram aqui,
        incluindo{' '}
        <Text style={[s.proofBold, { color: t.ink }]}>
          {data.seguemAvaliaram[0]}
        </Text>{' '}
        e{' '}
        <Text style={[s.proofBold, { color: t.ink }]}>
          {data.seguemAvaliaram[1]}
        </Text>
        .
      </Text>

      <SectionTitle>o que a galera diz</SectionTitle>
      <View style={s.flairWrap}>
        {data.flairs.map((f, i) => (
          <View
            key={f.label}
            testID={i === 0 ? 'flair-chip-forte' : `flair-chip-${i + 1}`}
            style={[
              s.chip,
              i === 0
                ? { backgroundColor: palette.picles }
                : { backgroundColor: 'rgba(122,154,61,0.20)' },
            ]}
          >
            <Text style={[s.chipText, { color: i === 0 ? t.bg : '#4C6027' }]}>
              {f.label} · {f.count}
            </Text>
          </View>
        ))}
      </View>

      <SectionTitle>avaliações</SectionTitle>
      <View style={s.list}>
        {data.reviews.map((rv, i) =>
          i === 1 ? (
            <FeedQuote key={String(rv.id)} review={rv} tone="mostarda" />
          ) : (
            <FeedCard key={String(rv.id)} review={rv} />
          ),
        )}
      </View>

      <Text style={[s.legend, { color: t.sub }]}>
        A página reaproveita os componentes do feed (linha compacta, quote
        card) e soma os flairs de todo mundo numa prévia única — sem ler
        200 reviews p/ entender o consenso.
      </Text>
    </ScrollView>
  );
}

function Stat({ n, l, ink, sub }: { n: string; l: string; ink: string; sub: string }) {
  return (
    <View style={s.stat}>
      <Text style={[s.statN, { color: ink }]}>{n}</Text>
      <Text style={[s.statL, { color: sub }]}>{l}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  topbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.padrao,
    paddingHorizontal: spacing.padrao,
  },
  tbtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tbtnText: { fontSize: 14 },
  cover: { height: 200 },
  coverNote: {
    position: 'absolute',
    top: 14,
    right: 14,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  coverNoteText: {
    fontFamily: fonts.display800,
    fontSize: 16,
    color: '#fff',
  },
  info: { paddingHorizontal: spacing.padrao, paddingTop: spacing.padrao },
  name: { fontFamily: fonts.display800, fontSize: 21, lineHeight: 25 },
  sub: { fontSize: 12.5, marginTop: 4 },
  stats: {
    flexDirection: 'row',
    paddingHorizontal: spacing.padrao,
    paddingTop: spacing.padrao,
    paddingBottom: spacing.padrao,
    borderBottomWidth: StyleSheet.hairlineWidth,
    marginTop: spacing.interno,
  },
  stat: { flex: 1, alignItems: 'center' },
  statN: { fontFamily: fonts.display800, fontSize: 17 },
  statL: { fontSize: 11, marginTop: 1 },
  actions: { flexDirection: 'row', gap: spacing.interno, padding: spacing.padrao },
  btn: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 11,
    borderWidth: 1.5,
    alignItems: 'center',
  },
  primary: { borderColor: palette.lambeLambe },
  secondary: { backgroundColor: 'transparent' },
  btnText: { fontFamily: fonts.display700, fontSize: 13.5 },
  proof: { fontSize: 12.5, paddingHorizontal: spacing.padrao, lineHeight: 18 },
  proofBold: { fontFamily: fonts.corpo600, fontWeight: '600' },
  flairWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
    paddingHorizontal: spacing.padrao,
    paddingTop: spacing.interno,
  },
  chip: { borderRadius: 20, paddingHorizontal: 11, paddingVertical: 5 },
  chipText: { fontSize: 11.5, fontFamily: fonts.corpo500 },
  list: { borderTopWidth: StyleSheet.hairlineWidth, marginTop: 10 },
  legend: {
    fontSize: 12,
    lineHeight: 18,
    paddingHorizontal: spacing.padrao,
    paddingTop: spacing.padrao,
    paddingBottom: spacing.bloco,
  },
});
