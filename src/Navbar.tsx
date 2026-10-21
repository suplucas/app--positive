import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { fonts, palette, spacing, useTheme } from './theme';

export type Screen = 'feed' | 'busca' | 'mapa' | 'perfil' | 'compose';

// Navbar flutuante: some quando rola para baixo, volte quando sobe.
// `navAnim` é um Animated.Value entre 0 (visível) e 1 (escondido).
export function Navbar({
  active,
  onNavigate,
  onCompose,
  navAnim,
}: {
  active: Screen;
  onNavigate: (s: Screen) => void;
  onCompose: () => void;
  navAnim: Animated.AnimatedValue;
}) {
  const t = useTheme();
  return (
    <Animated.View
      style={[
        s.bar,
        { backgroundColor: t.bg, borderTopColor: t.line },
        {
          transform: [{ translateY: navAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 56] }) }],
        },
      ]}
    >
      <NavItem label="feed" icon="⌂" active={active === 'feed'} onPress={() => onNavigate('feed')} />
      <NavItem label="buscar" icon="⌕" active={active === 'busca'} onPress={() => onNavigate('busca')} />
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
      <NavItem label="mapa" icon="📍" active={active === 'mapa'} onPress={() => onNavigate('mapa')} />
      <NavItem label="perfil" icon="●" active={active === 'perfil'} onPress={() => onNavigate('perfil')} />
    </Animated.View>
  );
}

function NavItem({
  label,
  icon,
  active,
  disabled = false,
  onPress,
}: {
  label: string;
  icon: string;
  active: boolean;
  disabled?: boolean;
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
      accessibilityState={{ selected: active, disabled }}
    >
      <Text style={[s.itemIcon, { color: t.ink, opacity }]}>{icon}</Text>
      <Text
        style={[
          s.itemLabel,
          { color: t.ink, opacity, fontWeight: active ? '600' : '400' },
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
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: palette.berinjela,
    paddingTop: spacing.interno,
    paddingHorizontal: spacing.interno,
    paddingBottom: spacing.interno + 4, // espaço para barra de gestos do Android
    backgroundColor: 'transparent',
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
