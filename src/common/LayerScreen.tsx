import { useEffect, useRef, type ReactNode } from 'react';
import { Animated, Easing, StyleSheet } from 'react-native';
import { useTheme } from './theme';

const styles = StyleSheet.create({
  layer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
});

// Camada de sub-tela: absoluto sobre o conteúdo principal, com fade +
// slide de 180ms na entrada (useNativeDriver). A saída é instantânea —
// a camada unmounta e revela o que estava embaixo.
export function LayerScreen({ children }: { children: ReactNode }) {
  const t = useTheme();
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 180,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, [anim]);
  return (
    <Animated.View
      style={[
        styles.layer,
        {
          backgroundColor: t.bg,
          opacity: anim,
          transform: [
            {
              translateY: anim.interpolate({
                inputRange: [0, 1],
                outputRange: [12, 0],
              }),
            },
          ],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}
