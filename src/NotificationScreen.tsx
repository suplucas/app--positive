import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { formatRelative } from './format';
import { MOCK_NOTIF } from './notificationMock';
import { fonts, spacing, useTheme } from './theme';

// Tela de notificações (mock, docs/09). Linhas com cnpj abrem a página
// do restaurante; as demais são informativas. Rodapé deixa claro que é
// mock até existir endpoint real.
export function NotificationScreen({
  onOpenRestaurant,
  onBack,
}: {
  onOpenRestaurant?: (cnpj: string) => void;
  // docs/16: virou camada aberta pelo sino do perfil (saiu da navbar).
  onBack?: () => void;
}) {
  const t = useTheme();
  return (
    <ScrollView
      style={{ backgroundColor: t.bg }}
      contentContainerStyle={s.scroll}
    >
      {onBack ? (
        <View style={s.topbar}>
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
      ) : null}
      {MOCK_NOTIF.map((n) => {
        const row = (
          <>
            <Text style={[s.icon, { color: t.ink }]}>{n.icone}</Text>
            <View style={s.body}>
              <Text style={[s.text, { color: t.ink }]}>{n.texto}</Text>
            </View>
            <Text style={[s.time, { color: t.sub }]}>
              {formatRelative(n.createdAt)}
            </Text>
          </>
        );
        return n.cnpj ? (
          <Pressable
            key={n.id}
            testID={`notif-${n.id}`}
            onPress={() => onOpenRestaurant?.(n.cnpj!)}
            style={({ pressed }) => [
              s.row,
              { borderBottomColor: t.line },
              pressed && { opacity: 0.85 },
            ]}
            accessibilityRole="button"
            accessibilityLabel={n.texto}
          >
            {row}
          </Pressable>
        ) : (
          <View key={n.id} testID={`notif-${n.id}`} style={[s.row, { borderBottomColor: t.line }]}>
            {row}
          </View>
        );
      })}

      <Text style={[s.footer, { color: t.sub }]}>
        Notificações mock — entram com endpoint real.
      </Text>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  scroll: { paddingTop: spacing.interno, paddingBottom: spacing.bloco },
  topbar: { paddingBottom: spacing.interno, paddingHorizontal: spacing.padrao },
  tbtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tbtnText: { fontSize: 14 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: spacing.padrao,
    paddingVertical: 13,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  icon: { fontSize: 15, width: 22, textAlign: 'center' },
  body: { flex: 1, minWidth: 0 },
  text: { fontSize: 13, fontFamily: fonts.corpo500, lineHeight: 19 },
  time: { fontSize: 11.5, flexShrink: 0 },
  footer: {
    fontSize: 12,
    lineHeight: 18,
    paddingHorizontal: spacing.padrao,
    paddingTop: spacing.padrao,
  },
});
