import { describe, it, expect } from 'vitest';
import { create } from 'react-test-renderer';
import { createElement } from 'react';
import { Text } from 'react-native';
import { PageTitle } from './PageTitle';

describe('PageTitle (header das páginas)', () => {
  it('usa 22px com lineHeight 26', () => {
    const r = create(createElement(PageTitle, null, 'mapa'));
    const text = r.root.findAllByType(Text)[0]!;
    const style = (text.props.style as object[]).find(
      (s) => s && typeof s === 'object' && 'fontSize' in s,
    ) as { fontSize: number; lineHeight: number };
    expect(style.fontSize).toBe(22);
    expect(style.lineHeight).toBe(26);
  });
});
