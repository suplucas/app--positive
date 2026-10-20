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
import { restaurantFor } from './restaurantMock';
import { SEARCH_FILTERS, searchWithFilter, type SearchFilter } from './searchFilters';
import { fonts, palette, spacing, useTheme } from './theme';

// Tela de busca/explorar (mock docs/16). Header com voltar + campo +
// chips de filtro; resultados com miniatura (cor da capa), nome, meta e
// nota. Dois modos: navegar (abre a página do restaurante) e **picker**
// (quando o `onPick` vem da avaliação: escolher preenche o local).
export function SearchScreen({
  onOpenRestaurant,
  onPick,
  onBack,
}: {
  onOpenRestaurant: (cnpj: string) => void;
  // Modo picker (fluxo "trocar" da avaliação): escolher devolve o hit.
  onPick?: (hit: RestaurantHit) => void;
  onBack?: () => void;
}) {
  const t = useTheme();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<SearchFilter>('todos');
  const [osmHits, setOsmHits] = useState<PlaceHit[]>([]);
  const localHits = searchWithFilter(query, filter);

  // Fallback OSM: só quando a busca local não encontra nada. A API
  // responde com resultados `local` (cadastro) ou `osm` (Nominatim).
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2 || localHits.length > 0) {
      setOsmHits([]);
      return;
    }
    let active = true;
    searchPlaces(q)
      .then((hits) => {
        if (active) setOsmHits(hits);
      })
      .catch(() => {
        if (active) setOsmHits([]);
      });
    return () => {
      active = false;
    };
  }, [query, localHits.length]);

  const display =
    localHits.length > 0
      ? localHits.map((hit) => {
          const d = restaurantFor(hit.cnpj);
          return {
            id: hit.cnpj,
            nome: hit.nome,
            meta: [d.categoria, d.bairro, d.preco].filter(Boolean).join(' · '),
            nota: d.notaMedia.toFixed(1),
            capa: d.capa,
            isOsm: false,
          };
        })
      : osmHits.map((hit) => ({
          id: hit.id,
          nome: hit.nome,
          meta: [hit.categoria, hit.bairro].filter(Boolean).join(' · '),
          nota: hit.nota == null ? null : hit.nota.toFixed(1),
          capa: palette.picles,
          isOsm: true,
        }));

  const choose = (id: string, nome: string) => {
    if (onPick) onPick({ cnpj: id, nome });
    else onOpenRestaurant(id);
  };

  return (
    <ScrollView style={{ backgroundColor: t.bg }} contentContainerStyle={s.scroll}>
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

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.chips}
      >
        {SEARCH_FILTERS.map((f) => {
          const on = filter === f.id;
          return (
            <Pressable
              key={f.id}
              testID={`busca-chip-${f.id}`}
              onPress={() => setFilter(f.id)}
              style={[
                s.chip,
                { borderColor: t.line },
                on && { backgroundColor: t.ink, borderColor: t.ink },
              ]}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
            >
              <Text style={[s.chipText, { color: on ? t.bg : t.sub }]}>
                {f.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <Text style={[s.title, { color: t.sub }]}>resultados</Text>

      {display.length === 0 ? (
        <Text testID="busca-vazio" style={[s.empty, { color: t.sub }]}>
          Não encontramos “{query}” por aqui. Tente outro nome ou bairro.
        </Text>
      ) : (
        display.map((hit) => (
          <Pressable
            key={hit.id}
            testID={`busca-hit-${hit.id}`}
            onPress={() => choose(hit.id, hit.nome)}
            style={({ pressed }) => [
              s.row,
              { borderBottomColor: t.line },
              pressed && { opacity: 0.85 },
            ]}
            accessibilityRole="button"
            accessibilityLabel={`abrir ${hit.nome}`}
          >
            <View style={[s.thumb, { backgroundColor: hit.capa }]} />
            <View style={s.rowBody}>
              <Text style={[s.name, { color: t.ink }]} numberOfLines={1}>
                {hit.nome}
              </Text>
              <Text style={[s.meta, { color: t.sub }]} numberOfLines={1}>
                {hit.meta}
                {hit.isOsm ? ' · osm' : ''}
              </Text>
            </View>
            {hit.nota ? (
              <Text style={[s.note, { color: t.ink }]}>{hit.nota}</Text>
            ) : null}
          </Pressable>
        ))
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
  chips: {
    gap: spacing.interno,
    paddingHorizontal: spacing.padrao,
    paddingTop: spacing.interno,
    paddingBottom: 2,
  },
  chip: {
    borderRadius: 20,
    borderWidth: 1.5,
    paddingHorizontal: 13,
    paddingVertical: 7,
  },
  chipText: { fontSize: 12, fontFamily: fonts.corpo600, fontWeight: '600' },
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
