import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, create, ReactTestRenderer } from 'react-test-renderer';
import { createElement } from 'react';
import { Text } from 'react-native';
import { Bookmark, Heart, Star } from 'lucide-react-native';
import { PostDetailScreen } from './PostDetailScreen';
import { addComment, getComments } from '../api/comment';
import { formatShortDate } from '../common/format';
import { fonts, palette } from '../common/theme';
import type { Review } from '../common/types';

vi.mock('../api/comment', () => ({
  getComments: vi.fn(),
  addComment: vi.fn(),
}));

const review: Review = {
  id: 'mock-1',
  userId: 'bea_come_tudo',
  restaurantId: '09597505000150',
  rating: 4.55,
  title: 'Pastel que dobra o estômago e a alma',
  comment:
    'Pedi o mesmo prato três vezes só pra confirmar que não foi acidente.',
  likes: 128,
  commentCount: 2,
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
  props: Partial<Parameters<typeof PostDetailScreen>[0]> = {},
  item: Review = review,
) {
  const onBack = props.onBack ?? vi.fn();
  const r = create(
    createElement(PostDetailScreen, {
      review: item,
      authorId: 'mogli',
      onBack,
      ...props,
    }),
  ) as ReactTestRenderer;
  await act(async () => {});
  return { r, onBack };
}

function allText(r: ReactTestRenderer): string {
  return r.root
    .findAllByType(Text)
    .map((n) =>
      Array.isArray(n.props.children)
        ? n.props.children.join('')
        : String(n.props.children ?? ''),
    )
    .join(' ');
}

const flat = (style: unknown): Record<string, unknown>[] =>
  Array.isArray(style)
    ? style.flatMap(flat)
    : style && typeof style === 'object'
      ? [style as Record<string, unknown>]
      : [];

const merged = (style: unknown): Record<string, unknown> =>
  Object.assign({}, ...flat(style));

beforeEach(() => {
  vi.mocked(getComments).mockReset().mockResolvedValue({
    page: 1,
    limit: 50,
    total: comments.length,
    results: comments,
  });
  vi.mocked(addComment).mockReset().mockResolvedValue({
    id: 'c3',
    reviewId: 'mock-1',
    userId: 'mogli',
    text: 'top',
    createdAt: new Date().toISOString(),
  });
});

describe('PostDetailScreen (spec 8.4 — visita expandida)', () => {
  it('header: ← visita e onBack no botão', async () => {
    const { r, onBack } = await render();
    expect(allText(r)).toContain('visita');
    act(() => {
      r.root.findByProps({ testID: 'voltar' }).props.onPress();
    });
    expect(onBack).toHaveBeenCalled();
  });

  it('autor como no feed: @handle + restaurante + estrelas', async () => {
    const { r } = await render();
    const text = allText(r);
    expect(text).toContain('@bea_come_tudo');
    expect(r.root.findAllByType(Star).length).toBeGreaterThan(0);
  });

  it('hero quote: card colorido raio 18 com título 23 e descrição 15', async () => {
    const { r } = await render();
    const card = r.root.findByProps({ testID: 'post-quote-card' });
    expect(merged(card.props.style).borderRadius).toBe(18);

    const title = r.root.findByProps({ testID: 'post-quote-title' });
    const ts = merged(title.props.style);
    expect(ts.fontSize).toBe(23);
    expect(ts.fontFamily).toBe(fonts.display700);

    const desc = r.root.findByProps({ testID: 'post-quote-desc' });
    expect(merged(desc.props.style).fontSize).toBe(15);
    expect(allText(r)).toContain(
      'Pedi o mesmo prato três vezes só pra confirmar que não foi acidente.',
    );
  });

  it('hero photo: foto 4:5 + scrim + título display700 17', async () => {
    const photoReview: Review = {
      ...review,
      id: 'mock-2',
      photoUrl: '/hero.jpg',
    };
    const { r } = await render({}, photoReview);
    const img = r.root.findByProps({ testID: 'post-hero-img' });
    expect(String((img.props.source as { uri: string }).uri)).toContain(
      '/hero.jpg',
    );
    expect(r.root.findByProps({ testID: 'post-hero-scrim' })).toBeTruthy();
    const title = r.root.findByProps({ testID: 'post-hero-title' });
    const ts = merged(title.props.style);
    expect(ts.fontSize).toBe(17);
    expect(ts.fontFamily).toBe(fonts.display700);

    // descrição inteira abaixo do hero (photo): display500 15/22
    const desc = r.root.findByProps({ testID: 'post-desc' });
    const ds = merged(desc.props.style);
    expect(ds.fontFamily).toBe(fonts.corpo500);
    expect(ds.fontSize).toBe(15);
    expect(ds.lineHeight).toBe(22);
    expect(allText(r)).toContain(
      'Pedi o mesmo prato três vezes só pra confirmar que não foi acidente.',
    );
  });

  it('sem título: comment vira o título (fallback D1) e não duplica', async () => {
    const noTitle: Review = {
      ...review,
      title: null,
      comment: 'comida de gente boa',
    };
    const { r } = await render({}, noTitle);
    const title = r.root.findByProps({ testID: 'post-quote-title' });
    expect(String(title.props.children)).toBe('comida de gente boa');
    expect(r.root.findAllByProps({ testID: 'post-quote-desc' })).toHaveLength(
      0,
    );
  });

  it('data: formatShortDate · há 3h', async () => {
    const { r } = await render();
    const date = r.root.findByProps({ testID: 'post-date' });
    expect(String(date.props.children)).toBe(
      `${formatShortDate(review.createdAt)} · há 3h`,
    );
  });

  it('ações: curtir trava, comentários mostram count, salvar', async () => {
    const { r } = await render();
    const like = r.root.findByProps({ testID: 'like-post-mock-1' });
    act(() => {
      like.props.onPress();
    });
    expect(like.findByType(Heart).props.fill).toBe(palette.lambeLambe);
    expect(allText(r)).toContain('129');
    expect(allText(r)).toContain('2');
    const save = r.root.findByProps({ testID: 'salvar-post-mock-1' });
    act(() => {
      save.props.onPress();
    });
    expect(save.findByType(Bookmark).props.fill).toBe(palette.mostarda);
  });

  it('comentários renderizam com tempo', async () => {
    const { r } = await render();
    expect(r.root.findByProps({ testID: 'comentario-c1' })).toBeTruthy();
    expect(r.root.findByProps({ testID: 'comentario-c2' })).toBeTruthy();
    const text = allText(r);
    expect(text).toContain('@ana');
    expect(text).toContain('também amei');
    expect(text).toContain('comentários');
  });

  it('composer envia: addComment + limpa o campo', async () => {
    const { r } = await render();
    const input = r.root.findByProps({ testID: 'comentario-novo' });
    act(() => {
      input.props.onChangeText('top');
    });
    await act(async () => {
      r.root.findByProps({ testID: 'comentar' }).props.onPress();
    });
    expect(addComment).toHaveBeenCalledWith('mock-1', 'mogli', 'top');
    expect(
      String(
        r.root.findByProps({ testID: 'comentario-novo' }).props.value,
      ),
    ).toBe('');
    // comentário novo aparece na lista
    expect(allText(r)).toContain('@mogli');
  });

  it('erro de envio: copy de produto', async () => {
    vi.mocked(addComment).mockRejectedValueOnce(
      new Error('POST failed: 500'),
    );
    const { r } = await render();
    act(() => {
      r.root.findByProps({ testID: 'comentario-novo' }).props.onChangeText(
        'top',
      );
    });
    await act(async () => {
      r.root.findByProps({ testID: 'comentar' }).props.onPress();
    });
    expect(allText(r)).toContain(
      'Não consegui comentar agora. Tente de novo.',
    );
    // draft não se perde
    expect(
      String(
        r.root.findByProps({ testID: 'comentario-novo' }).props.value,
      ),
    ).toBe('top');
  });

  it('erro de envio usa cor lambeLambe', async () => {
    vi.mocked(addComment).mockRejectedValueOnce(
      new Error('POST failed: 500'),
    );
    const { r } = await render();
    act(() => {
      r.root.findByProps({ testID: 'comentario-novo' }).props.onChangeText(
        'x',
      );
    });
    await act(async () => {
      r.root.findByProps({ testID: 'comentar' }).props.onPress();
    });
    const err = r.root.findByProps({ testID: 'comentario-erro' });
    expect(merged(err.props.style).color).toBe(palette.lambeLambe);
  });
});
