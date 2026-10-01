import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { DEMO_USERS } from './mockFeed';
import { fonts, spacing, useTheme } from './theme';

// Tela de configurações (acessada pelo perfil): trocar o usuário de
// demo e fixar o tema (sistema/claro/escuro). Substitui o seletor de
// usuários e o toggle de tema que moravam no header do feed.
export type ThemeMode = 'system' | 'light' | 'dark';

const THEME_OPTIONS: {
  mode: ThemeMode;
  testID: string;
  label: string;
  icon: string;
}[] = [
  { mode: 'system', testID: 'tema-sistema', label: 'sistema', icon: '◐' },
  { mode: 'light', testID: 'tema-claro', label: 'claro', icon: '☀️' },
  { mode: 'dark', testID: 'tema-escuro', label: 'escuro', icon: '🌙' },
];

export function SettingsScreen({
  userId,
  onUserChange,
  themeMode,
  onThemeChange,
  onBack,
}: {
  userId: string;
  onUserChange: (id: string) => void;
  themeMode: ThemeMode;
  onThemeChange: (mode: ThemeMode) => void;
  onBack: () => void;
}) {
  const t = useTheme();
  return (
    <ScrollView style={{ backgroundColor: t.bg }} contentContainerStyle={s.scroll}>
      <View style={[s.topbar, { borderBottomColor: t.line }]}>
        <Pressable
          testID="voltar"
          onPress={onBack}
          style={s.backHit}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="voltar para o perfil"
        >
          <Text style={[s.backText, { color: t.sub }]}>←</Text>
        </Pressable>
        <Text style={[s.title, { color: t.ink }]}>configurações</Text>
      </View>

      <View style={s.section}>
        <Text style={[s.label, { color: t.sub }]}>usuário</Text>
        <View style={s.chips}>
          {DEMO_USERS.map((u) => (
            <Chip
              key={u}
              chipTestID={`user-${u}`}
              label={u}
              active={u === userId}
              onPress={() => onUserChange(u)}
            />
          ))}
        </View>
      </View>

      <View style={s.section}>
        <Text style={[s.label, { color: t.sub }]}>tema</Text>
        <View style={s.chips}>
          {THEME_OPTIONS.map((o) => (
            <Chip
              key={o.mode}
              chipTestID={o.testID}
              label={`${o.icon} ${o.label}`}
              active={themeMode === o.mode}
              onPress={() => onThemeChange(o.mode)}
            />
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

// `chipTestID` (e não `testID`) no prop: testID viraria prop custom do
// componente e criaria 2 nós com o mesmo testID na árvore do teste.
function Chip({
  chipTestID,
  label,
  active,
  onPress,
}: {
  chipTestID: string;
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  const t = useTheme();
  return (
    <Pressable
      testID={chipTestID}
      onPress={onPress}
      style={[
        s.chip,
        { backgroundColor: t.quietBg },
        active && { backgroundColor: t.chipActiveBg },
      ]}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
    >
      <Text
        style={[
          s.chipText,
          { color: active ? t.chipActiveInk : t.sub },
          active && s.chipTextActive,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  scroll: { paddingBottom: spacing.bloco },
  topbar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.interno,
    paddingHorizontal: spacing.padrao,
    paddingTop: spacing.padrao,
    paddingBottom: spacing.interno,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backHit: { minWidth: 44, minHeight: 44, justifyContent: 'center' },
  backText: { fontSize: 18 },
  title: { fontFamily: fonts.display800, fontSize: 16 },
  section: {
    paddingHorizontal: spacing.padrao,
    paddingTop: spacing.padrao,
  },
  label: {
    fontFamily: fonts.display700,
    fontSize: 11.5,
    textTransform: 'uppercase',
    letterSpacing: 0.03,
    marginBottom: spacing.interno,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.interno },
  chip: {
    minHeight: 44,
    paddingHorizontal: spacing.padrao,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipText: { fontSize: 13, fontFamily: fonts.corpo500 },
  chipTextActive: { fontWeight: '600' },
});
