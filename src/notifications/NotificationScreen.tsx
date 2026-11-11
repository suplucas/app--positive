import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { AppNotification } from '../api/types';
import { layout } from '../common/layout';
import {
  fonts,
  palette,
  spacing,
  type,
  useTheme,
} from '../common/theme';
import { groupNotifications } from './groupNotifications';
import { NotificationRow } from './NotificationRow';
import { useNotifications } from './useNotifications';

// Painel de notificações (spec 8.5): grupos hoje/esta semana/antes com
// rows ricas, rodapé da janela de 30d e estados de carga/erro/vazio. O
// tap numa row delega ao App via onOpen (markRead + navegação ficam lá).
export function NotificationScreen({
  userId,
  onOpen,
  onClose,
}: {
  userId: string;
  onOpen: (item: AppNotification) => void;
  onClose: () => void;
}) {
  const t = useTheme();
  const { items, status, refresh, followBack, following } =
    useNotifications(userId);
  const groups = useMemo(() => groupNotifications(items), [items]);

  return (
    <View style={[s.wrap, { backgroundColor: t.bg }]}>
      <View
        style={[layout.topbar, layout.divider, { borderBottomColor: t.line }]}
      >
        <Pressable
          testID="notif-voltar"
          onPress={onClose}
          style={[s.backBtn, { backgroundColor: palette.overlay }]}
          hitSlop={6}
          accessibilityRole="button"
          accessibilityLabel="fechar notificações"
        >
          <Text style={[layout.backIcon, { color: palette.papel }]}>←</Text>
        </Pressable>
        <Text style={[s.title, { color: t.ink }]}>notificações</Text>
      </View>

      {status === 'loading' ? (
        <Text style={[s.state, { color: t.sub }]}>carregando…</Text>
      ) : status === 'error' ? (
        <View style={s.errorBox}>
          <Text style={[s.state, { color: t.sub }]}>
            não consegui carregar as notificações.
          </Text>
          <Pressable
            testID="notif-tentar"
            onPress={() => void refresh()}
            style={[s.retry, { borderColor: t.ink }]}
            accessibilityRole="button"
            accessibilityLabel="tentar de novo"
          >
            <Text style={[s.retryTxt, { color: t.ink }]}>
              tentar de novo
            </Text>
          </Pressable>
        </View>
      ) : items.length === 0 ? (
        <Text style={[s.state, { color: t.sub }]}>
          nenhuma notificação por aqui.
        </Text>
      ) : (
        <ScrollView>
          {groups.map((group) => (
            <View key={group.label}>
              <Text style={[s.group, { color: t.sub }]}>{group.label}</Text>
              {group.items.map((item) => (
                <NotificationRow
                  key={String(item.id)}
                  item={item}
                  following={following.includes(String(item.actorId))}
                  onOpen={onOpen}
                  onFollow={(actorId) => void followBack(actorId)}
                />
              ))}
            </View>
          ))}
          <Text style={[s.end, { color: t.sub }]}>
            isso é tudo dos últimos 30 dias
          </Text>
        </ScrollView>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1 },
  backBtn: {
    minWidth: 44,
    minHeight: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: fonts.display800,
    fontSize: 19,
    lineHeight: 24,
  },
  group: {
    fontFamily: fonts.display700,
    fontSize: 13,
    paddingTop: 20,
    paddingHorizontal: spacing.padrao,
    paddingBottom: 8,
  },
  state: {
    padding: spacing.padrao,
    fontFamily: fonts.corpo,
    fontSize: type.body,
  },
  errorBox: { padding: spacing.padrao, gap: 12 },
  retry: {
    alignSelf: 'flex-start',
    borderWidth: 1.5,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  retryTxt: {
    fontFamily: fonts.display700,
    fontSize: 12,
  },
  end: {
    textAlign: 'center',
    fontSize: 12,
    fontFamily: fonts.corpo,
    paddingTop: 20,
    paddingHorizontal: spacing.padrao,
    paddingBottom: 28,
  },
});
