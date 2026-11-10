import { describe, it, expect } from 'vitest';
import { create } from 'react-test-renderer';
import { createElement } from 'react';
import { ComposeScreen } from './ComposeScreen';

function render() {
  return create(
    createElement(ComposeScreen, {
      userId: 'user_1',
      onCancel: () => {},
      onPosted: () => {},
    }),
  );
}

describe('ComposeScreen (versão final)', () => {
  it('renderiza o ComposeV2 sem seletor de versão', () => {
    const r = render();
    const text = JSON.stringify(r.toJSON());
    expect(text).toContain('flair (até 2)');
    expect(r.root.findAllByProps({ testID: 'avaliar-v1' })).toHaveLength(0);
    expect(r.root.findAllByProps({ testID: 'avaliar-v2' })).toHaveLength(0);
  });
});
