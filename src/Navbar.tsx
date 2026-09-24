import { Pressable, StyleSheet, Text, View } from 'react-native';
import { fonts, spacing, useTheme } from './theme';

export type Screen = 'feed' | 'perfil' | 'compose';

// Navbar: ativo com cor plena + peso 600; inativo com opacidade 50%
// (identidade §07). Alvo mínimo 44×44 (§09).
export function Navbar({
  active,
  onNavigate,
  onCompose,
}: {
  active: Screen;
  onNavigate: (s: Screen) => void;
  onCompose: () => void;
}) {
  const t = useTheme();
  return (
    <View style={[s.bar, { backgroundColor: t.bg, borderTopColor: t.line }]}>
      <NavItem label="feed" icon="⌂" active={active === 'feed'} onPress={() => onNavigate('feed')} />
      <NavItem label="buscar" icon="⌕" active={false} onPress={() => {}} />
      <Pressable
        style={s.addHit}
        onPress={onCompose}
        accessibilityRole="button"
        accessibilityLabel="avaliar restaurante"
      >
        <View style={s.add}>
          <Text style={s.addIcon}>+</Text>
        </View>
      </Pressable>
      <NavItem label="notif." icon="♡" active={false} onPress={() => {}} />
      <NavItem label="perfil" icon="●" active={active === 'perfil'} onPress={() => onNavigate('perfil')} />
    </View>
  );
}

function NavItem({
  label,
  icon,
  active,
  onPress,
}: {
  label: string;
  icon: string;
  active: boolean;
  onPress: () => void;
}) {
  const t = useTheme();
  return (
    <Pressable
      style={s.item}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
    >
      <Text style={[s.itemIcon, { color: t.ink, opacity: active ? 1 : 0.5 }]}>{icon}</Text>
      <Text
        style={[
          s.itemLabel,
          { color: t.ink, opacity: active ? 1 : 0.5, fontWeight: active ? '600' : '400' },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: spacing.interno,
    paddingHorizontal: spacing.interno,
    paddingBottom: spacing.interno,
  },
  item: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  itemIcon: { fontSize: 18, lineHeight: 20 },
  itemLabel: { fontSize: 10.5, fontFamily: fonts.corpo },
  addHit: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -16,
  },
  add: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#E63E75',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addIcon: { color: '#FBF2E4', fontSize: 18, lineHeight: 20, fontFamily: fonts.corpo500 },
});
