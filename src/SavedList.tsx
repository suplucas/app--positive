import { Pressable, StyleSheet, Text, View } from 'react-native';
import { restaurantFor } from './restaurantMock';
import { fonts, spacing, useTheme } from './theme';

// Lista "quero ir" (docs/16): vira a aba do perfil. Fonte única é o
// `savedCnpjs` do App; aqui só renderiza (linha = miniatura + nome +
// meta + ★ remover). Sem ScrollView próprio (mora dentro do perfil).
export function SavedList({
  cnpjs,
  onRemove,
  onOpenRestaurant,
}: {
  cnpjs: string[];
  onRemove: (cnpj: string) => void;
  onOpenRestaurant: (cnpj: string) => void;
}) {
  const t = useTheme();

  if (cnpjs.length === 0) {
    return (
      <View testID="salvo-vazio" style={s.emptyWrap}>
        <Text style={[s.empty, { color: t.ink }]}>
          Você ainda não salvou nenhum restaurante.
        </Text>
        <Text style={[s.emptyHint, { color: t.sub }]}>
          Toque em “quero ir” na página de um restaurante pra guardá-lo aqui.
        </Text>
      </View>
    );
  }

  return (
    <>
      {cnpjs.map((cnpj) => {
        const d = restaurantFor(cnpj);
        return (
          <View key={cnpj} style={[s.row, { borderBottomColor: t.line }]}>
            <View style={[s.thumb, { backgroundColor: d.capa }]} />
            <Pressable
              testID={`salvo-linha-${cnpj}`}
              onPress={() => onOpenRestaurant(cnpj)}
              style={({ pressed }) => [s.rowBody, pressed && { opacity: 0.85 }]}
              accessibilityRole="button"
              accessibilityLabel={`abrir ${d.nome}`}
            >
              <Text style={[s.name, { color: t.ink }]} numberOfLines={1}>
                {d.nome}
              </Text>
              <Text style={[s.meta, { color: t.sub }]} numberOfLines={1}>
                {d.bairro} · a {d.distanciaKm.toFixed(1)}km
              </Text>
            </Pressable>
            <Pressable
              testID={`salvo-tirar-${cnpj}`}
              onPress={() => onRemove(cnpj)}
              style={[s.remove, { borderColor: t.line }]}
              hitSlop={6}
              accessibilityRole="button"
              accessibilityLabel={`remover ${d.nome} da lista`}
            >
              <Text style={[s.removeText, { color: t.sub }]}>★</Text>
            </Pressable>
          </View>
        );
      })}
    </>
  );
}

const s = StyleSheet.create({
  emptyWrap: { paddingHorizontal: spacing.padrao, paddingTop: spacing.secao },
  empty: { fontFamily: fonts.display700, fontSize: 15, lineHeight: 21 },
  emptyHint: { fontSize: 12.5, lineHeight: 18, marginTop: spacing.interno },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: spacing.padrao,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  thumb: { width: 52, height: 52, borderRadius: 10, flexShrink: 0 },
  rowBody: { flex: 1, minWidth: 0 },
  name: { fontFamily: fonts.display700, fontSize: 14 },
  meta: { fontSize: 12, marginTop: 2 },
  remove: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  removeText: { fontSize: 14 },
});
