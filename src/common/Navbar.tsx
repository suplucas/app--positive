import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View, Animated, Easing } from 'react-native';
import { Home, MapPin, Plus, Search, User } from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import { palette, useTheme } from './theme';

export type Screen = 'feed' | 'busca' | 'mapa' | 'perfil' | 'compose';

// Pill flutuante (spec D13): absoluta com bottom 16 + safe-area, left/right
// 16, altura 64, raio 32, fundo translúcido do tema e borda da linha. No
// estado `mini` (scroll pra baixo): left/right 72, altura 48, bottom 12.
// A transição é Animated.timing de 280ms interpolando as dimensões.
const NORMAL = { left: 16, right: 16, height: 64, bottom: 16 };
const MINI = { left: 72, right: 72, height: 48, bottom: 12 };

// `t.bg` com leve transparência (POC: rgba(251,242,228,.72)).
function translucent(hex: string, alpha: number): string {
  const m = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!m) return hex;
  const n = parseInt(m[1]!, 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

export function Navbar({
  active,
  onNavigate,
  onCompose,
  mini = false,
}: {
  active: Screen;
  onNavigate: (s: Screen) => void;
  onCompose: () => void;
  // Estado encolhido ao descer o feed (useTabBarMinimize no App).
  mini?: boolean;
}) {
  const t = useTheme();
  const dims = mini ? MINI : NORMAL;
  const [anim] = useState(() => ({
    left: new Animated.Value(dims.left),
    right: new Animated.Value(dims.right),
    height: new Animated.Value(dims.height),
    bottom: new Animated.Value(dims.bottom),
  }));

  useEffect(() => {
    const to = mini ? MINI : NORMAL;
    const timing = (value: Animated.Value, toValue: number) =>
      Animated.timing(value, {
        toValue,
        duration: 280,
        easing: Easing.bezier(0.2, 0.8, 0.2, 1),
        useNativeDriver: false,
      });
    timing(anim.left, to.left).start();
    timing(anim.right, to.right).start();
    timing(anim.height, to.height).start();
    timing(anim.bottom, to.bottom).start();
  }, [anim, mini]);

  return (
    <Animated.View
      style={[
        s.bar,
        {
          position: 'absolute',
          left: anim.left,
          right: anim.right,
          height: anim.height,
          bottom: anim.bottom,
          backgroundColor: translucent(t.bg, 0.72),
          borderColor: t.line,
        },
      ]}
    >
      <NavItem
        icon={Home}
        active={active === 'feed'}
        label="feed"
        onPress={() => onNavigate('feed')}
      />
      <NavItem
        icon={Search}
        active={active === 'busca'}
        label="buscar"
        onPress={() => onNavigate('busca')}
      />
      <Pressable
        style={s.addHit}
        onPress={onCompose}
        accessibilityRole="button"
        accessibilityLabel="avaliar restaurante"
      >
        <View testID="navbar-compose" style={s.add}>
          <Plus size={24} color={palette.papel} strokeWidth={2.5} />
        </View>
      </Pressable>
      <NavItem
        icon={MapPin}
        active={active === 'mapa'}
        label="mapa"
        onPress={() => onNavigate('mapa')}
      />
      <NavItem
        icon={User}
        active={active === 'perfil'}
        label="perfil"
        onPress={() => onNavigate('perfil')}
        testID="navbar-perfil"
      />
    </Animated.View>
  );
}

function NavItem({
  icon,
  active,
  disabled = false,
  label,
  onPress,
  testID,
}: {
  icon: LucideIcon;
  active: boolean;
  disabled?: boolean;
  label: string;
  onPress: () => void;
  testID?: string;
}) {
  const t = useTheme();
  const opacity = disabled ? 0.3 : active ? 1 : 0.6;
  // prop `icon` é minúscula: alias capitalizado para o JSX tratar como
  // componente
  const IconCmp = icon;
  return (
    <Pressable
      style={[s.item, active && { backgroundColor: t.line }]}
      disabled={disabled}
      onPress={onPress}
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: active, disabled }}
    >
      <View style={{ opacity }}>
        <IconCmp size={24} color={t.ink} />
      </View>
    </Pressable>
  );
}

const s = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 32,
    // sombra do POC: 0 8px 28px rgba(36,26,34,.14)
    shadowColor: palette.berinjela,
    shadowOpacity: 0.14,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  item: {
    width: 52,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addHit: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  add: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: palette.lambeLambe,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
