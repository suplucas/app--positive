import { describe, expect, it } from 'vitest';
import { StyleSheet } from 'react-native';
import { layout } from './layout';

describe('layout compartilhado', () => {
  it('topbar usa 16/8 com gap 8', () => {
    expect(layout.topbar).toMatchObject({
      gap: 8,
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 8,
    });
  });

  it('alvos de toque têm 44px', () => {
    expect(layout.backHit).toMatchObject({ minWidth: 44, minHeight: 44 });
    expect(layout.actionHit).toMatchObject({ minHeight: 44 });
  });

  it('separador é hairline', () => {
    expect(layout.divider.borderBottomWidth).toBe(StyleSheet.hairlineWidth);
  });
});
