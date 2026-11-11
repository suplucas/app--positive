import { useEffect, useRef, type ReactNode } from 'react';
import { Animated, Easing, Pressable, StyleSheet, View } from 'react-native';
import { palette, useTheme } from './theme';

const styles = StyleSheet.create({
  layer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  touch: { flex: 1 },
  content: {
    // desliza da direita: entra 100% fora da tela e para em 0
    borderTopLeftRadius: 0,
  },
});

// Painel deslizante da direita (spec D16): backdrop com fade + conteúdo
// com fundo do tema entrando por translateX. A saída é instantânea — o
// painel unmounta e revela o feed embaixo (scroll preservado).
export function SlideOver({
  visible,
  onClose,
  children,
  testID,
}: {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
  testID?: string;
}) {
  const t = useTheme();
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.timing(anim, {
        toValue: 1,
        duration: 280,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }).start();
    }
  }, [visible, anim]);

  if (!visible) return null;

  return (
    <View style={styles.layer} testID={testID}>
      <Animated.View
        style={[styles.layer, { backgroundColor: palette.overlay, opacity: anim }]}
      >
        <Pressable
          testID={testID ? `${testID}-backdrop` : undefined}
          style={styles.touch}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="fechar"
        />
      </Animated.View>
      <Animated.View
        style={[
          styles.layer,
          {
            backgroundColor: t.bg,
            transform: [
              {
                translateX: anim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['100%', '0%'],
                }),
              },
            ],
          },
        ]}
      >
        {children}
      </Animated.View>
    </View>
  );
}
