import { Component, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { fonts, palette, spacing } from './theme';

// Error boundary global (E3/docs/14): um erro de render em qualquer
// tela não derruba o app inteiro — vira fallback de produto com
// "tentar de novo". O retry **remonta** as crianças (key muda), o que
// também limpa estado interno corrompido — só esconder o fallback
// não resolveria.
export class ErrorBoundary extends Component<
  { children: ReactNode },
  { failed: boolean; resetKey: number }
> {
  state = { failed: false, resetKey: 0 };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    // Só logging — a UI não expõe detalhes técnicos (copy de produto).
    console.error('[tim] erro de render capturado:', error);
  }

  render() {
    if (!this.state.failed) {
      return <View key={this.state.resetKey}>{this.props.children}</View>;
    }
    return (
      <View
        testID="erro-boundary"
        style={[s.wrap, { backgroundColor: palette.papel }]}
        accessibilityRole="alert"
      >
        <Text style={[s.title, { color: palette.berinjela }]}>
          Ops, algo quebrou aqui.
        </Text>
        <Text style={[s.sub, { color: palette.berinjela, opacity: 0.7 }]}>
          Nada do que você fez se perdeu. Tente de novo — se persistir,
          sai e reabre o app.
        </Text>
        <Pressable
          testID="erro-boundary-retry"
          onPress={() =>
            this.setState((prev) => ({ failed: false, resetKey: prev.resetKey + 1 }))
          }
          style={[s.btn, { backgroundColor: palette.lambeLambe }]}
          accessibilityRole="button"
        >
          <Text style={s.btnText}>tentar de novo</Text>
        </Pressable>
      </View>
    );
  }
}

const s = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.bloco,
  },
  title: {
    fontFamily: fonts.display800,
    fontSize: 22,
    textAlign: 'center',
  },
  sub: {
    fontSize: 13,
    lineHeight: 19,
    marginTop: spacing.interno,
    textAlign: 'center',
  },
  btn: {
    marginTop: spacing.secao,
    minHeight: 44,
    borderRadius: 12,
    paddingHorizontal: spacing.padrao,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: {
    color: palette.papel,
    fontFamily: fonts.corpo600,
    fontWeight: '600',
    fontSize: 14,
  },
});
