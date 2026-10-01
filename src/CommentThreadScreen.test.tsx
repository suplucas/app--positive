import { describe, it, expect, vi } from 'vitest';
import { act, create, ReactTestRenderer } from 'react-test-renderer';
import { createElement } from 'react';
import { CommentThreadScreen } from './CommentThreadScreen';
import { commentsFor } from './commentMock';
import type { Review } from './types';

const review: Review = {
  id: 'mock-1',
  userId: 'bea_come_tudo',
  restaurantCnpj: '09597505000150', // BAR DO LECO
  rating: 4.55,
  comment: 'Pedi o mesmo prato três vezes só pra confirmar que não foi acidente.',
  likes: 128,
  createdAt: new Date(Date.now() - 3 * 3_600_000).toISOString(),
};

function render(props: Partial<Parameters<typeof CommentThreadScreen>[0]> = {}) {
  const r = create(
    createElement(CommentThreadScreen, {
      review,
      authorId: 'mogli',
      onBack: vi.fn(),
      ...props,
    }),
  );
  return r as ReactTestRenderer;
}

function allText(r: ReactTestRenderer): string {
  return r.root
    .findAll((n) => String(n.type) === 'Text')
    .map((n) =>
      Array.isArray(n.props.children)
        ? n.props.children.join('')
        : String(n.props.children ?? ''),
    )
    .join(' ');
}

function commentCount(r: ReactTestRenderer): number {
  return r.root.findAll(
    (n) =>
      typeof n.props.testID === 'string' &&
      n.props.testID.startsWith('comentario-mock-1-'),
  ).length;
}

describe('CommentThreadScreen (docs/12)', () => {
  it('renderiza a review original e os comentários mock', () => {
    const r = render();
    expect(r.root.findByProps({ testID: 'comentario-original' })).toBeTruthy();
    const text = allText(r);
    expect(text).toContain('bea_come_tudo');
    expect(text).toContain('BAR DO LECO');
    expect(commentCount(r)).toBe(commentsFor('mock-1').length);
  });

  it('comentar adiciona localmente (autor = authorId)', () => {
    const before = commentCount(render());
    const r = render();
    act(() => {
      r.root.findByProps({ testID: 'comentario-novo' }).props.onChangeText(
        'passaria lá semana que vem!',
      );
    });
    act(() => {
      r.root.findByProps({ testID: 'comentar' }).props.onPress();
    });
    expect(commentCount(r)).toBe(before + 1);
    expect(allText(r)).toContain('passaria lá semana que vem!');
    expect(allText(r)).toContain('mogli');
    // input limpo após comentar
    expect(
      r.root.findByProps({ testID: 'comentario-novo' }).props.value,
    ).toBe('');
  });

  it('input vazio: botão desabilitado', () => {
    const r = render();
    expect(
      r.root.findByProps({ testID: 'comentar' }).props.accessibilityState
        .disabled,
    ).toBe(true);
  });

  it('voltar chama onBack', () => {
    const onBack = vi.fn();
    const r = render({ onBack });
    act(() => {
      r.root.findByProps({ testID: 'voltar' }).props.onPress();
    });
    expect(onBack).toHaveBeenCalled();
  });

  it('rodapé deixa claro que é demo', () => {
    expect(allText(render())).toContain('modo demo');
  });
});
