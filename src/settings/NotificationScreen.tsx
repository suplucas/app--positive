import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { formatRelative } from '../common/format';
import {
  fonts,
  palette,
  radius,
  spacing,
  type,
  useTheme,
} from '../common/theme';
import { layout } from '../common/layout';
import { useNotifications } from '../comments/useNotifications';
import type { AppNotification } from '../api/types';

function iconFor(type: string): string {
  if (type === 'like') return '♥';
  if (type === 'follow') return '＋';
  if (type === 'review') return '✎';
  if (type === 'save') return '★';
  return '•';
}

function textFor(n: AppNotification): string {
  const actor = n.actorId ?? 'alguém';
  if (n.type === 'like') return `${actor} curtiu sua avaliação`;
  if (n.type === 'follow') return `${actor} começou a seguir você`;
  if (n.type === 'review') return `${actor} publicou uma avaliação`;
  if (n.type === 'save') return `uma avaliação nova no seu “quero ir”`;
  return n.type;
}

// Shape antigo da API (campo cnpj) — esta tela é substituída pelo painel
// v1; o cast existe só para compilar até lá (plano Task 19).
type LegacyNotification = AppNotification & { cnpj?: string | null };

// Notificações (docs/09) em camada aberta pelo sino do perfil.
export function NotificationScreen({
  userId,
  onOpenRestaurant,
  onBack,
}: {
  userId: string;
  onOpenRestaurant?: (cnpj: string) => void;
  // docs/16: virou camada aberta pelo sino do perfil (saiu da navbar).
  onBack?: () => void;
}) {
  const t = useTheme();
  const { items, status, markRead } = useNotifications(userId);

  return (
    <ScrollView
      style={{ backgroundColor: t.bg }}
      contentContainerStyle={s.scroll}
    >
      {onBack ? (
        <View
          style={[layout.topbar, layout.divider, { borderBottomColor: t.line }]}
        >
          <Pressable
            testID="voltar"
            onPress={onBack}
            style={[s.tbtn, { backgroundColor: palette.overlay }]}
            hitSlop={6}
            accessibilityRole="button"
            accessibilityLabel="voltar"
          >
            <Text style={[layout.backIcon, { color: palette.papel }]}>←</Text>
          </Pressable>
        </View>
      ) : null}

      {status === 'loading' ? (
        <Text style={[s.footer, { color: t.sub }]}>carregando…</Text>
      ) : items.length === 0 ? (
        <Text style={[s.footer, { color: t.sub }]}>
          nenhuma notificação por aqui.
        </Text>
      ) : null}

      {items.map((n) => {
        const legacy = n as LegacyNotification;
        const texto = textFor(n);
        const row = (
          <>
            <Text style={[s.icon, { color: t.ink }]}>{iconFor(n.type)}</Text>
            <View style={s.body}>
              <Text
                style={[
                  s.text,
                  { color: t.ink, fontWeight: n.readAt ? '400' : '600' },
                ]}
              >
                {texto}
              </Text>
            </View>
            <Text style={[s.time, { color: t.sub }]}>
              {formatRelative(n.createdAt)}
            </Text>
          </>
        );
        return legacy.cnpj ? (
          <Pressable
            key={n.id}
            testID={`notif-${n.id}`}
            onPress={() => {
              void markRead(n.id);
              onOpenRestaurant?.(legacy.cnpj!);
            }}
            style={({ pressed }) => [
              s.row,
              { borderBottomColor: t.line },
              pressed && { opacity: 0.85 },
            ]}
            accessibilityRole="button"
            accessibilityLabel={texto}
          >
            {row}
          </Pressable>
        ) : (
          <Pressable
            key={n.id}
            testID={`notif-${n.id}`}
            onPress={() => void markRead(n.id)}
            style={[s.row, { borderBottomColor: t.line }]}
            accessibilityRole="button"
            accessibilityLabel={texto}
          >
            {row}
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  scroll: { paddingTop: spacing.interno, paddingBottom: spacing.bloco },
  tbtn: {
    width: 32,
    height: 32,
    borderRadius: radius.panel,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: spacing.padrao,
    paddingVertical: spacing.medio,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  icon: { fontSize: 15, width: 22, textAlign: 'center' },
  body: { flex: 1, minWidth: 0 },
  text: { fontSize: type.body, fontFamily: fonts.corpo500, lineHeight: 19 },
  time: { fontSize: 11.5, flexShrink: 0 },
  footer: {
    fontSize: type.small,
    lineHeight: 18,
    paddingHorizontal: spacing.padrao,
    paddingTop: spacing.padrao,
  },
});
