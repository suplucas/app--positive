import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SectionTitle } from './SectionTitle';
import { restaurantFor } from './restaurantMock';
import { fonts, spacing, useTheme } from './theme';

// Lista "quero ir" (docs/10): o único lugar para ver/gestionar os
// saves de restaurante. Estado vive no App (`savedCnpjs`), compartilhado
// com o toggle "quero ir" da página do restaurante. Entrada: chip
// "quero ir · N" no perfil.
export function SavedScreen({
  cnpjs,
  onRemove,
  onOpenRestaurant,
  onBack,
}: {
  cnpjs: string[];
  onRemove: (cnpj: string) => void;
  onOpenRestaurant: (cnpj: string) => void;
  onBack: () => void;
}) {
  const t = useTheme();
  return (
    <ScrollView style={{ backgroundColor: t.bg }} contentContainerStyle={s.scroll}>
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

      <SectionTitle>{`quero ir · ${cnpjs.length}`}</SectionTitle>

      {cnpjs.length === 0 ? (
        <View testID="salvo-vazio" style={s.emptyWrap}>
          <Text style={[s.empty, { color: t.ink }]}>
            Você ainda não salvou nenhum restaurante.
          </Text>
          <Text style={[s.emptyHint, { color: t.sub }]}>
            Toque em “quero ir” na página de um restaurante pra guardá-lo
            aqui.
          </Text>
        </View>
      ) : (
        cnpjs.map((cnpj) => {
          const d = restaurantFor(cnpj);
          return (
            <View
              key={cnpj}
              style={[s.row, { borderBottomColor: t.line }]}
            >
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
                  {d.categoria} · {d.bairro} · {d.preco} · a{' '}
                  {d.distanciaKm.toFixed(1)}km
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
        })
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  scroll: { paddingBottom: spacing.bloco },
  topbar: { paddingTop: spacing.padrao, paddingHorizontal: spacing.padrao },
  tbtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tbtnText: { fontSize: 14 },
  emptyWrap: { paddingHorizontal: spacing.padrao, paddingTop: spacing.secao },
  empty: { fontFamily: fonts.display700, fontSize: 15, lineHeight: 21 },
  emptyHint: { fontSize: 12.5, lineHeight: 18, marginTop: spacing.interno },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: spacing.padrao,
    paddingVertical: 13,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowBody: { flex: 1, minWidth: 0 },
  name: { fontFamily: fonts.display800, fontSize: 18 },
  meta: { fontSize: 11.5, marginTop: 2 },
  remove: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeText: { fontSize: 14 },
});
