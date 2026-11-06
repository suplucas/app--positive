import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { fonts, spacing, useTheme } from '../common/theme';
import { layout } from '../common/layout';

// Tela de configurações (acessada pelo perfil): tema e sair da conta.
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
  themeMode,
  onThemeChange,
  onBack,
  onSignOut,
}: {
  themeMode: ThemeMode;
  onThemeChange: (mode: ThemeMode) => void;
  onBack: () => void;
  onSignOut?: () => Promise<void>;
}) {
  const t = useTheme();
  return (
    <ScrollView
      style={{ backgroundColor: t.bg }}
      contentContainerStyle={s.scroll}
    >
      <View
        style={[layout.topbar, layout.divider, { borderBottomColor: t.line }]}
      >
        <Pressable
          testID="voltar"
          onPress={onBack}
          style={layout.backHit}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="voltar para o perfil"
        >
          <Text style={[layout.backIcon, { color: t.sub }]}>←</Text>
        </Pressable>
        <Text style={[s.title, { color: t.ink }]}>configurações</Text>
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
      {onSignOut ? (
        <View style={s.section}>
          <Pressable
            testID="sair"
            onPress={() => void onSignOut()}
            style={[
              s.chip,
              { backgroundColor: t.quietBg, alignSelf: 'flex-start' },
            ]}
            accessibilityRole="button"
          >
            <Text style={[s.chipText, { color: t.ink }]}>sair da conta</Text>
          </Pressable>
        </View>
      ) : null}
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
