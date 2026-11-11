import { describe, it, expect, vi } from 'vitest';
import { create } from 'react-test-renderer';
import { createElement } from 'react';
import { Text } from 'react-native';
import { SlideOver } from './SlideOver';

describe('SlideOver (painel que desliza da direita)', () => {
  it('invisível não renderiza nada', () => {
    const r = create(
      createElement(SlideOver, {
        visible: false,
        onClose: () => {},
        testID: 'so',
        children: 'conteúdo',
      }),
    );
    expect(r.toJSON()).toBeNull();
  });

  it('visível renderiza o children sobre o backdrop', () => {
    const r = create(
      createElement(SlideOver, {
        visible: true,
        onClose: () => {},
        testID: 'so',
        children: createElement(Text, null, 'painel aqui'),
      }),
    );
    expect(
      r.root.findAllByType(Text).map((n) => n.props.children),
    ).toContain('painel aqui');
    expect(r.root.findByProps({ testID: 'so-backdrop' })).toBeDefined();
  });

  it('backdrop fecha com onClose', () => {
    const onClose = vi.fn();
    const r = create(
      createElement(SlideOver, {
        visible: true,
        onClose,
        testID: 'so',
        children: 'conteúdo',
      }),
    );
    r.root.findByProps({ testID: 'so-backdrop' }).props.onPress();
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
