import { Pressable, StyleSheet, Text, View } from 'react-native';
import { fonts, palette, radius, spacing, type, useTheme } from './theme';

// Estado vazio reutilizável (feed, listas). Título + subtítulo + ação
// opcional. Sem dependência de dados — só apresentação.
export function EmptyState({
  emoji,
  title,
  subtitle,
  actionLabel,
  onAction,
  testID,
}: {
  emoji?: string;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
  testID?: string;
}) {
  const t = useTheme();
  const showAction = Boolean(actionLabel && onAction);
  return (
    <View style={s.wrap} testID={testID}>
      {emoji ? <Text style={s.emoji}>{emoji}</Text> : null}
      <Text style={[s.title, { color: t.ink }]}>{title}</Text>
      {subtitle ? (
        <Text style={[s.sub, { color: t.sub }]}>{subtitle}</Text>
      ) : null}
      {showAction ? (
        <Pressable
          testID={testID ? `${testID}-acao` : undefined}
          onPress={onAction}
          style={[s.btn, { backgroundColor: palette.lambeLambe }]}
          accessibilityRole="button"
        >
          <Text style={s.btnText}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    paddingHorizontal: spacing.bloco,
    paddingTop: spacing.bloco * 2,
    paddingBottom: spacing.bloco,
    gap: spacing.interno,
  },
  emoji: { fontSize: 32 },
  title: {
    fontFamily: fonts.display800,
    fontSize: 17,
    textAlign: 'center',
  },
  sub: {
    fontSize: type.body,
    lineHeight: 19,
    textAlign: 'center',
  },
  btn: {
    marginTop: spacing.interno,
    borderRadius: radius.panel,
    paddingHorizontal: spacing.padrao,
    paddingVertical: spacing.medio,
  },
  btnText: {
    color: palette.papel,
    fontFamily: fonts.display700,
    fontSize: type.body,
  },
});
