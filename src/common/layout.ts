import { StyleSheet } from 'react-native';
import { spacing } from './theme';

// Base das topbars de sub-tela (docs/01 §3): 16/8, gap 8, alvo 44.
export const layout = StyleSheet.create({
  topbar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.interno,
    paddingHorizontal: spacing.padrao,
    paddingTop: spacing.padrao,
    paddingBottom: spacing.interno,
  },
  backHit: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: { fontSize: 20 },
  actionHit: { minHeight: 44, justifyContent: 'center' },
  // Separador da topbar; a cor vem do tema na tela (`borderBottomColor`).
  divider: { borderBottomWidth: StyleSheet.hairlineWidth },
});
