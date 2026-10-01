import { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { searchRestaurants } from './format';
import { restaurantFor } from './restaurantMock';
import { SectionTitle } from './SectionTitle';
import { fonts, spacing, useTheme } from './theme';

// Tela de busca (lupa da navbar; docs/01 §04 "Feed → Buscar"). Fonte:
// busca textual no mapa do seed (mesma fonte do composer). Query vazia =
// sugestões (primeiros 8 do mapa). Seleção → página do restaurante
// (fluxo "Busca → Página Canonical").
export function SearchScreen({
  onOpenRestaurant,
}: {
  onOpenRestaurant: (cnpj: string) => void;
}) {
  const t = useTheme();
  const [query, setQuery] = useState('');
  const hits = searchRestaurants(query);

  return (
    <ScrollView style={{ backgroundColor: t.bg }} contentContainerStyle={s.scroll}>
      <View style={s.inputWrap}>
        <View style={[s.inputRow, { backgroundColor: t.quietBg, borderColor: t.line }]}>
        <Text style={[s.icon, { color: t.sub }]}>⌕</Text>
        <TextInput
          testID="busca-input"
          value={query}
          onChangeText={setQuery}
          placeholder="restaurante ou bairro"
          placeholderTextColor={t.sub}
          autoCapitalize="none"
          autoCorrect={false}
          style={[s.input, { color: t.ink }]}
          accessibilityLabel="buscar restaurante"
        />
        </View>
      </View>

      <SectionTitle>{query ? 'resultados' : 'sugestões'}</SectionTitle>

      {hits.length === 0 ? (
        <Text testID="busca-vazio" style={[s.empty, { color: t.sub }]}>
          Não encontramos “{query}” por aqui. Tente outro nome ou bairro.
        </Text>
      ) : (
        hits.map((hit) => {
          const d = restaurantFor(hit.cnpj);
          return (
            <Pressable
              key={hit.cnpj}
              testID={`busca-hit-${hit.cnpj}`}
              onPress={() => onOpenRestaurant(hit.cnpj)}
              style={({ pressed }) => [
                s.row,
                { borderBottomColor: t.line },
                pressed && { opacity: 0.85 },
              ]}
              accessibilityRole="button"
              accessibilityLabel={`abrir ${hit.nome}`}
            >
              <View style={s.rowBody}>
                <Text style={[s.name, { color: t.ink }]} numberOfLines={1}>
                  {hit.nome}
                </Text>
                <Text style={[s.meta, { color: t.sub }]} numberOfLines={1}>
                  {d.categoria} · {d.bairro} · {d.preco} · a{' '}
                  {d.distanciaKm.toFixed(1)}km
                </Text>
              </View>
              <Text style={[s.chev, { color: t.sub }]}>→</Text>
            </Pressable>
          );
        })
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  scroll: { paddingBottom: spacing.bloco },
  inputWrap: {
    paddingHorizontal: spacing.padrao,
    paddingTop: spacing.interno,
    marginBottom: spacing.interno,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 12,
    borderWidth: 1,
    height: 44,
    paddingHorizontal: spacing.padrao,
  },
  icon: { fontSize: 16 },
  input: { flex: 1, fontSize: 14, fontFamily: fonts.corpo, padding: 0 },
  empty: {
    fontSize: 13,
    lineHeight: 19,
    paddingHorizontal: spacing.padrao,
    paddingTop: spacing.interno,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.interno,
    paddingHorizontal: spacing.padrao,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowBody: { flex: 1, minWidth: 0 },
  name: { fontFamily: fonts.display700, fontSize: 15 },
  meta: { fontSize: 11.5, marginTop: 2 },
  chev: { fontSize: 14 },
});
