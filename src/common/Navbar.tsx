import { useEffect, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  Animated,
  Easing,
} from 'react-native';
import { fonts, palette, useTheme } from './theme';

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
        icon="⌂"
        active={active === 'feed'}
        label="feed"
        onPress={() => onNavigate('feed')}
      />
      <NavItem
        icon="⌕"
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
          <Text style={s.addIcon}>+</Text>
        </View>
      </Pressable>
      {/* pino de mapa com Views (D13: sem lib de ícones) */}
      <Pressable
        style={s.item}
        onPress={() => onNavigate('mapa')}
        accessibilityRole="button"
        accessibilityState={{ selected: active === 'mapa' }}
        accessibilityLabel="mapa"
      >
        <PinIcon color={t.ink} bg={translucent(t.bg, 0.72)} opacity={active === 'mapa' ? 1 : 0.5} />
      </Pressable>
      <Pressable
        style={s.item}
        onPress={() => onNavigate('perfil')}
        accessibilityRole="button"
        accessibilityState={{ selected: active === 'perfil' }}
        accessibilityLabel="perfil"
      >
        <View testID="navbar-perfil" style={s.me} />
      </Pressable>
    </Animated.View>
  );
}

function PinIcon({
  color,
  bg,
  opacity,
}: {
  color: string;
  bg: string;
  opacity: number;
}) {
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
  const opacity = disabled ? 0.3 : active ? 1 : 0.6;
  return (
    <Pressable
      style={[s.item, active && { backgroundColor: t.line }]}
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
  itemIcon: { fontSize: 24, lineHeight: 26 },
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
  addIcon: {
    color: palette.papel,
    fontSize: 24,
    lineHeight: 26,
    fontFamily: fonts.corpo500,
  },
  me: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: palette.lambeLambe,
  },
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
