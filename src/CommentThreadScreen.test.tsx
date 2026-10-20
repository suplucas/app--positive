import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, create, ReactTestRenderer } from 'react-test-renderer';
import { createElement } from 'react';
import { CommentThreadScreen } from './CommentThreadScreen';
import { addComment, getComments } from './api/comment';
import type { Review } from './types';

vi.mock('./api/comment.js', () => ({
  getComments: vi.fn(),
  addComment: vi.fn(),
}));

const review: Review = {
  id: 'mock-1',
  userId: 'bea_come_tudo',
  restaurantCnpj: '09597505000150',
  rating: 4.55,
  comment: 'Pedi o mesmo prato três vezes só pra confirmar que não foi acidente.',
  likes: 128,
  createdAt: new Date(Date.now() - 3 * 3_600_000).toISOString(),
};

const comments = [
  {
    id: 'c1',
    reviewId: 'mock-1',
    userId: 'ana',
    text: 'também amei',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'c2',
    reviewId: 'mock-1',
    userId: 'bia',
    text: 'volto sim',
    createdAt: new Date().toISOString(),
  },
];

async function render(
  props: Partial<Parameters<typeof CommentThreadScreen>[0]> = {},
) {
  const r = create(
    createElement(CommentThreadScreen, {
      review,
      authorId: 'mogli',
      onBack: vi.fn(),
      ...props,
    }),
  ) as ReactTestRenderer;
  await act(async () => {});
  return r;
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
      n.props.testID.startsWith('comentario-c'),
  ).length;
}

beforeEach(() => {
  vi.mocked(getComments).mockReset().mockResolvedValue({
    page: 1,
    limit: 50,
    total: comments.length,
    results: comments,
  });
  vi.mocked(addComment).mockReset();
});

describe('CommentThreadScreen (docs/12)', () => {
  it('renderiza a review original e os comentários da API', async () => {
    const r = await render();
    expect(r.root.findByProps({ testID: 'comentario-original' })).toBeTruthy();
    const text = allText(r);
    expect(text).toContain('bea_come_tudo');
    expect(text).toContain('BAR DO LECO');
    expect(commentCount(r)).toBe(comments.length);
  });

  it('comentar envia para a API e adiciona à thread', async () => {
    vi.mocked(addComment).mockResolvedValue({
      id: 'c3',
      reviewId: 'mock-1',
      userId: 'mogli',
      text: 'passaria lá semana que vem!',
      createdAt: new Date().toISOString(),
    });
    const r = await render();
    act(() => {
      r.root
        .findByProps({ testID: 'comentario-novo' })
        .props.onChangeText('passaria lá semana que vem!');
    });
    await act(async () => {
      r.root.findByProps({ testID: 'comentar' }).props.onPress();
    });
    expect(addComment).toHaveBeenCalledWith(
      'mock-1',
      'mogli',
      'passaria lá semana que vem!',
    );
    expect(commentCount(r)).toBe(comments.length + 1);
    expect(allText(r)).toContain('passaria lá semana que vem!');
    expect(
      r.root.findByProps({ testID: 'comentario-novo' }).props.value,
    ).toBe('');
  });

  it('input vazio: botão desabilitado', async () => {
    const r = await render();
    expect(
      r.root.findByProps({ testID: 'comentar' }).props.accessibilityState
        .disabled,
    ).toBe(true);
  });

  it('voltar chama onBack', async () => {
    const onBack = vi.fn();
    const r = await render({ onBack });
    act(() => {
      r.root.findByProps({ testID: 'voltar' }).props.onPress();
    });
    expect(onBack).toHaveBeenCalled();
  });
});
