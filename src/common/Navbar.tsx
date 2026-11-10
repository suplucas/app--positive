import { Pressable, StyleSheet, Text, View } from 'react-native';
import { fonts, palette, spacing, type, useTheme } from './theme';

export type Screen = 'feed' | 'busca' | 'mapa' | 'perfil' | 'compose';

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
    <Animated.View
      style={[s.bar, { backgroundColor: t.bg, borderTopColor: t.line }]}
    >
      <NavItem icon="⌂" active={active === 'feed'} label="feed" onPress={() => onNavigate('feed')} />
      <NavItem icon="⌕" active={active === 'busca'} label="buscar" onPress={() => onNavigate('busca')} />
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
      {/* Pino de mapa com Views */}
      <Pressable
        style={s.item}
        onPress={() => onNavigate('mapa')}
        accessibilityRole="button"
        accessibilityState={{ selected: active === 'mapa' }}
        accessibilityLabel="mapa"
      >
        <PinIcon color={t.ink} bg={t.bg} opacity={active === 'mapa' ? 1 : 0.5} />
      </Pressable>
      <NavItem icon="●" active={active === 'perfil'} label="perfil" onPress={() => onNavigate('perfil')} />
    </Animated.View>
  );
}

function PinIcon({ color, bg, opacity }: { color: string; bg: string; opacity: number }) {
  return (
    <View style={{ alignItems: 'center', width: 22, height: 28, opacity }}>
      {/* Cabeça do pino */}
      <View style={[s.pinHead, { backgroundColor: color }]}>
        <View style={[s.pinHole, { backgroundColor: bg }]} />
      </View>
      {/* Cauda triangular */}
      <View style={[s.pinTail, { borderTopColor: color }]} />
    </View>
  );
}

function NavItem({
  icon,
  active,
  disabled = false,
  label,
  onPress,
}: {
  icon: string;
  active: boolean;
  disabled?: boolean;
  label: string;
  onPress: () => void;
}) {
  const t = useTheme();
  const opacity = disabled ? 0.3 : active ? 1 : 0.5;
  return (
    <Pressable
      style={s.item}
      disabled={disabled}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: active, disabled }}
    >
      <Text style={[s.itemIcon, { color: t.ink, opacity }]}>{icon}</Text>
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
    paddingBottom: spacing.interno + 4,
  },
  item: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemIcon: { fontSize: 24, lineHeight: 26 },
  addHit: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -16,
  },
  add: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E63E75',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addIcon: { color: '#FBF2E4', fontSize: 20, lineHeight: 22, fontFamily: fonts.corpo500 },
  pinHead: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinHole: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  pinTail: {
    width: 0,
    height: 0,
    borderLeftWidth: 5.5,
    borderRightWidth: 5.5,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    marginTop: -1,
  },
});
