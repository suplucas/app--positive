import { useEffect, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { searchPlaces } from './api/place';
import type { PlaceHit } from './api/types';
import type { RestaurantHit } from './format';
import { fonts, palette, spacing, useTheme } from './theme';

// Busca/explorar: sempre na API. Resultados locais (cadastro) e OSM
// (fallback por nome) chegam no mesmo shape `PlaceHit`.
export function SearchScreen({
  onOpenRestaurant,
  onOpenPlace,
  onPick,
  onBack,
}: {
  onOpenRestaurant: (cnpj: string) => void;
  // Resultado OSM: o App guarda o hit para abrir o perfil sem CNPJ.
  onOpenPlace?: (hit: PlaceHit) => void;
  // Modo picker (fluxo "trocar" da avaliação): só resultados locais.
  onPick?: (hit: RestaurantHit) => void;
  onBack?: () => void;
}) {
  const t = useTheme();
  const [query, setQuery] = useState('');
  const [hits, setHits] = useState<PlaceHit[]>([]);
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setHits([]);
      setStatus('idle');
      return;
    }
    let active = true;
    setStatus('loading');
    const timer = setTimeout(() => {
      searchPlaces(q)
        .then((results) => {
          if (!active) return;
          setHits(onPick ? results.filter((hit) => hit.source === 'local') : results);
          setStatus('idle');
        })
        .catch(() => {
          if (!active) return;
          setHits([]);
          setStatus('error');
        });
    }, 250);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [query, onPick]);

  const choose = (hit: PlaceHit) => {
    if (hit.source === 'osm' && onOpenPlace) {
      onOpenPlace(hit);
    } else if (onPick) {
      onPick({ cnpj: hit.id, nome: hit.nome });
    } else {
      onOpenRestaurant(hit.id);
    }
  };

  return (
    <ScrollView
      style={{ backgroundColor: t.bg }}
      contentContainerStyle={s.scroll}
    >
      <View style={[s.header, { borderBottomColor: t.line }]}>
        {onBack ? (
          <Pressable
            testID="busca-voltar"
            onPress={onBack}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="voltar"
          >
            <Text style={[s.back, { color: t.sub }]}>‹</Text>
          </Pressable>
        ) : null}
        <TextInput
          testID="busca-input"
          value={query}
          onChangeText={setQuery}
          placeholder="Buscar restaurante, bairro, tipo de comida…"
          placeholderTextColor={t.sub}
          autoCapitalize="none"
          autoCorrect={false}
          style={[
            s.input,
            { backgroundColor: t.bg, color: t.ink, borderColor: t.line },
          ]}
          accessibilityLabel="buscar restaurante"
        />
      </View>

      <Text style={[s.title, { color: t.sub }]}>resultados</Text>

      {query.trim().length < 2 ? (
        <Text style={[s.empty, { color: t.sub }]}>
          Digite ao menos 2 letras para buscar.
        </Text>
      ) : status === 'loading' ? (
        <Text style={[s.empty, { color: t.sub }]}>buscando…</Text>
      ) : status === 'error' ? (
        <Text style={[s.empty, { color: t.sub }]}>
          Não consegui buscar agora. Tente de novo.
        </Text>
      ) : hits.length === 0 ? (
        <Text testID="busca-vazio" style={[s.empty, { color: t.sub }]}>
          Não encontramos “{query}” por aqui. Tente outro nome ou bairro.
        </Text>
      ) : (
        hits.map((hit) => {
          const meta =
            [hit.categoria, hit.bairro ?? hit.endereco]
              .filter(Boolean)
              .join(' · ') + (hit.source === 'osm' ? ' · osm' : '');
          return (
            <Pressable
              key={hit.id}
              testID={`busca-hit-${hit.id}`}
              onPress={() => choose(hit)}
              style={({ pressed }) => [
                s.row,
                { borderBottomColor: t.line },
                pressed && { opacity: 0.85 },
              ]}
              accessibilityRole="button"
              accessibilityLabel={`abrir ${hit.nome}`}
            >
              <View style={[s.thumb, { backgroundColor: palette.picles }]} />
              <View style={s.rowBody}>
                <Text style={[s.name, { color: t.ink }]} numberOfLines={1}>
                  {hit.nome}
                </Text>
                <Text style={[s.meta, { color: t.sub }]} numberOfLines={1}>
                  {meta}
                </Text>
              </View>
              {hit.nota != null ? (
                <Text style={[s.note, { color: t.ink }]}>
                  {hit.nota.toFixed(1)}
                </Text>
              ) : null}
            </Pressable>
          );
        })
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  scroll: { paddingBottom: spacing.bloco },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: spacing.padrao,
    paddingTop: spacing.interno,
    paddingBottom: spacing.interno,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  back: { fontSize: 22, lineHeight: 24 },
  input: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: 14,
    paddingHorizontal: spacing.padrao,
    paddingVertical: 10,
    fontSize: 14,
    fontFamily: fonts.corpo,
    minHeight: 42,
  },
  title: {
    fontFamily: fonts.display700,
    fontSize: 13,
    paddingHorizontal: spacing.padrao,
    paddingTop: spacing.padrao,
    paddingBottom: spacing.interno,
  },
  empty: {
    fontSize: 13,
    lineHeight: 19,
    paddingHorizontal: spacing.padrao,
    paddingTop: spacing.interno,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: spacing.padrao,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  thumb: { width: 52, height: 52, borderRadius: 10 },
  rowBody: { flex: 1, minWidth: 0 },
  name: { fontFamily: fonts.display700, fontSize: 14 },
  meta: { fontSize: 12, marginTop: 2 },
  note: { fontFamily: fonts.display800, fontSize: 14, flexShrink: 0 },
});
