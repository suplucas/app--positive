import { describe, it, expect, vi } from 'vitest';
import { create, ReactTestRenderer, act } from 'react-test-renderer';
import { createElement } from 'react';
import { Text } from 'react-native';
import { NotificationRow } from './NotificationRow';
import type { AppNotification } from '../api/types';
import { lightTheme, palette } from '../common/theme';
import { avatarColor } from '../common/format';

const base: AppNotification = {
  id: 'n1',
  ids: ['n1'],
  type: 'like',
  actorId: 'bea',
  actors: [
    { id: 'bea', name: 'Bea', handle: 'bea_come_tudo', photoUrl: null },
  ],
  count: 1,
  reviewId: 10,
  restaurantId: '123',
  previewText: null,
  readAt: null,
  createdAt: new Date(Date.now() - 2 * 3_600_000).toISOString(),
};

const over = (o: Partial<AppNotification> = {}): AppNotification => ({
  ...base,
  ...o,
});

function render(
  props: Partial<Parameters<typeof NotificationRow>[0]> = {},
  item: AppNotification = base,
) {
  const r: ReactTestRenderer = create(
    createElement(NotificationRow, {
      item,
      following: false,
      onOpen: vi.fn(),
      onFollow: vi.fn(),
      ...props,
    }),
  );
  return r;
}

const flat = (style: unknown): Record<string, unknown>[] =>
  Array.isArray(style)
    ? style.flatMap(flat)
    : style && typeof style === 'object'
      ? [style as Record<string, unknown>]
      : [];

function allText(r: ReactTestRenderer): string {
  return r.root
    .findAllByType(Text)
    .map((n) =>
      Array.isArray(n.props.children)
        ? n.props.children.join('')
        : String(n.props.children ?? ''),
    )
    .join('');
}

// Cor do selo do tipo: acha o Text do glyph e sobe 2 níveis (Text-f →
// host View → View-f do tag) até o View que carrega o backgroundColor.
function tagColorOf(r: ReactTestRenderer, glyph: string): string | null {
  const glyphText = r.root
    .findAllByType(Text)
    .find((n) => String(n.props.children) === glyph);
  if (!glyphText?.parent?.parent) return null;
  const styles = flat(glyphText.parent.parent.props.style);
  const bg = styles.map((s) => s.backgroundColor).find(Boolean);
  return (bg as string) ?? null;
}

// Estilos da row inteira (Pressable raiz) — o style é função
// ({pressed}) => [...], resolvida com pressed=false.
function rowStyles(r: ReactTestRenderer): Record<string, unknown>[] {
  const style = r.root.findByProps({ testID: 'notif-row-n1' }).props
    .style as unknown;
  const resolved =
    typeof style === 'function'
      ? (style as (p: { pressed: boolean }) => unknown)({ pressed: false })
      : style;
  return flat(resolved);
}

describe('NotificationRow (spec 8.5 — row rica do painel)', () => {
  it('tap na row chama onOpen com o item', () => {
    const onOpen = vi.fn();
    const r = render({ onOpen });
    act(() => {
      r.root.findByProps({ testID: 'notif-row-n1' }).props.onPress();
    });
    expect(onOpen).toHaveBeenCalledWith(base);
  });

  it('não-lida: fundo unreadBg; lida: sem unreadBg', () => {
    const unread = render();
    expect(
      rowStyles(unread).some(
        (s) => s.backgroundColor === lightTheme.unreadBg,
      ),
    ).toBe(true);

    const read = render({}, over({ readAt: '2026-01-01T00:00:00.000Z' }));
    expect(
      rowStyles(read).some(
        (s) => s.backgroundColor === lightTheme.unreadBg,
      ),
    ).toBe(false);
  });

  it('selo por tipo: ♥ lambeLambe / 💬 berinjela / ＋ picles / 🔖 mostarda', () => {
    expect(tagColorOf(render({}, over({ type: 'like' })), '♥')).toBe(
      palette.lambeLambe,
    );
    expect(
      tagColorOf(render({}, over({ type: 'comment' })), '💬'),
    ).toBe(palette.berinjela);
    expect(tagColorOf(render({}, over({ type: 'follow' })), '＋')).toBe(
      palette.picles,
    );
    expect(tagColorOf(render({}, over({ type: 'save' })), '🔖')).toBe(
      palette.mostarda,
    );
    expect(
      tagColorOf(render({}, over({ type: 'network_visit' })), '🔖'),
    ).toBe(palette.mostarda);
  });

  it('milestone: círculo berinjela 44 com 🔔 (sem AvatarStack)', () => {
    const r = render(
      {},
      over({ type: 'milestone', previewText: '50º registro' }),
    );
    const bell = r.root.findAllByType(Text).find(
      (n) => String(n.props.children) === '🔔',
    );
    expect(bell).toBeTruthy();
    const circle = bell?.parent?.parent;
    const styles = flat(circle?.props.style);
    expect(
      styles.some(
        (s) =>
          s.backgroundColor === palette.berinjela &&
          s.width === 44 &&
          s.height === 44,
      ),
    ).toBe(true);
    expect(allText(r)).toContain('Tim! Seu 50º registro.');
  });

  it('AvatarStack usa os actors (2+ = stack de 2 círculos)', () => {
    const r = render(
      {},
      over({
        type: 'like',
        count: 3,
        actors: [
          { id: 'bea', name: 'Bea', handle: 'bea', photoUrl: null },
          { id: 'lu', name: 'Lu', handle: 'lu', photoUrl: null },
        ],
      }),
    );
    // 2 círculos de 32 no stack (initials B e L)
    const texts = r.root
      .findAllByType(Text)
      .filter((n) => n.props.style && flat(n.props.style).some((s) => s.color === palette.papel))
      .map((n) => String(n.props.children));
    expect(texts).toContain('B');
    expect(texts).toContain('L');
  });

  it('texto: copy dos segmentos + tempo · há 2h', () => {
    const r = render(
      {},
      over({
        restaurant: { id: '123', name: 'Boteco da Ana', location: null },
      }),
    );
    const text = allText(r);
    expect(text).toContain('@bea_come_tudo curtiu sua visita no');
    expect(text).toContain('Boteco da Ana');
    expect(text).toContain('· há 2h');
  });

  it('thumb: foto da review quando existe', () => {
    const r = render(
      {},
      over({
        review: { id: 10, rating: 4, photoUrl: '/f.jpg' },
      }),
    );
    const imgs = r.root.findAll(
      (n) =>
        n.props?.source &&
        typeof n.props.source === 'object' &&
        String(n.props.source.uri ?? '').includes('/f.jpg'),
    );
    expect(imgs.length).toBeGreaterThan(0);
  });

  it('thumb: tile colorido com inicial do restaurante quando sem foto', () => {
    const r = render(
      {},
      over({
        restaurant: { id: '123', name: 'Tan Tan', location: null },
        review: null,
      }),
    );
    const texts = r.root.findAllByType(Text);
    const initial = texts.find((n) => String(n.props.children) === 'T');
    expect(initial).toBeTruthy();
    const tile = initial?.parent?.parent;
    const merged = Object.assign(
      {},
      ...flat(tile?.props.style),
    ) as Record<string, unknown>;
    expect(merged.backgroundColor).toBe(avatarColor('123'));
    expect(merged.width).toBe(44);
    expect(merged.borderRadius).toBe(8);
  });

  it('sem review e sem restaurant: sem thumb', () => {
    const r = render(
      {},
      over({ type: 'follow', review: null, restaurantId: null }),
    );
    const texts = r.root
      .findAllByType(Text)
      .map((n) => String(n.props.children));
    // sem inicial de tile solta (o 'B' do avatar é do actor, não tile)
    expect(texts).not.toContain('T');
  });

  it('botão seguir só no follow: seguir de volta → onFollow(actorId)', () => {
    const onFollow = vi.fn();
    const r = render(
      { onFollow },
      over({ type: 'follow', restaurantId: null, review: null }),
    );
    const btn = r.root.findByProps({ testID: 'notif-follow-n1' });
    expect(allText(r)).toContain('seguir de volta');
    act(() => {
      btn.props.onPress();
    });
    expect(onFollow).toHaveBeenCalledWith('bea');
  });

  it('following: botão diz seguindo e desabilita', () => {
    const onFollow = vi.fn();
    const r = render(
      { following: true, onFollow },
      over({ type: 'follow', restaurantId: null, review: null }),
    );
    const btn = r.root.findByProps({ testID: 'notif-follow-n1' });
    expect(allText(r)).toContain('seguindo');
    expect(btn.props.disabled).toBe(true);
  });

  it('tipos sem follow não têm botão seguir', () => {
    const r = render({}, over({ type: 'like' }));
    expect(
      r.root.findAllByProps({ testID: 'notif-follow-n1' }),
    ).toHaveLength(0);
  });
});
