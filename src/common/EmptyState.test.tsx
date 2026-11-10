import { describe, it, expect, vi } from 'vitest';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { createElement } from 'react';
import { EmptyState } from './EmptyState';

function render(props: Partial<Parameters<typeof EmptyState>[0]> = {}) {
  const onAction = props.onAction ?? vi.fn();
  const r = create(
    createElement(EmptyState, {
      title: 'O feed tá vazio',
      subtitle: 'Siga gente ou avalie um lugar.',
      ...props,
      onAction,
    }),
  ) as ReactTestRenderer;
  return { r, onAction, text: JSON.stringify(r.toJSON()) };
}

function byID(r: ReactTestRenderer, id: string) {
  return r.root.findByProps({ testID: id });
}

describe('EmptyState', () => {
  it('mostra título e subtítulo', () => {
    const { text } = render();
    expect(text).toContain('O feed tá vazio');
    expect(text).toContain('Siga gente ou avalie um lugar.');
  });

  it('com ação: botão chama onAction', () => {
    const { r, onAction } = render({
      actionLabel: 'avaliar',
      testID: 'feed-vazio',
    });
    act(() => byID(r, 'feed-vazio-acao').props.onPress());
    expect(onAction).toHaveBeenCalled();
  });

  it('sem ação: nenhum botão', () => {
    const { r } = render({ testID: 'feed-vazio' });
    expect(r.root.findAllByProps({ testID: 'feed-vazio-acao' })).toHaveLength(
      0,
    );
  });
});
