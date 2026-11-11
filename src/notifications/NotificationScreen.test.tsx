import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, create, ReactTestRenderer } from 'react-test-renderer';
import { createElement } from 'react';
import { Text } from 'react-native';
import { NotificationScreen } from './NotificationScreen';
import { getNotifications } from '../api/comment';
import { followUser } from '../api/user';
import type { AppNotification } from '../api/types';

vi.mock('../api/comment', () => ({
  getNotifications: vi.fn(),
  markNotificationsRead: vi.fn(),
}));
vi.mock('../api/user', () => ({
  followUser: vi.fn(),
}));

const H = 3_600_000;
const at = (hoursAgo: number) =>
  new Date(Date.now() - hoursAgo * H).toISOString();

// Âncora no início do dia civil (à prova de teste rodando de madrugada:
// "2h atrás" cruzaria a meia-noite e cairia em "esta semana").
const todayAt = (minutesIntoDay: number) => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setMinutes(minutesIntoDay);
  return d.toISOString();
};

const notif = (
  id: string,
  type: string,
  createdAt: string,
  over: Partial<AppNotification> = {},
): AppNotification => ({
  id,
  ids: [id],
  type,
  actorId: 'bea',
  actors: [{ id: 'bea', name: 'Bea', handle: 'bea_come_tudo', photoUrl: null }],
  count: 1,
  reviewId: 10,
  restaurantId: '123',
  previewText: null,
  readAt: null,
  createdAt,
  ...over,
});

const results = [
  notif('n1', 'like', todayAt(1), {
    restaurant: { id: '123', name: 'Boteco da Ana', location: null },
  }),
  notif('n2', 'follow', at(24 * 3), { restaurantId: null, reviewId: null }),
  notif('n3', 'milestone', at(24 * 10), {
    restaurantId: null,
    reviewId: null,
    previewText: '50º registro',
  }),
];

async function render(
  props: Partial<Parameters<typeof NotificationScreen>[0]> = {},
) {
  const onOpen = props.onOpen ?? vi.fn();
  const onClose = props.onClose ?? vi.fn();
  const r = create(
    createElement(NotificationScreen, {
      userId: 'u1',
      onOpen,
      onClose,
      ...props,
    }),
  ) as ReactTestRenderer;
  await act(async () => {});
  return { r, onOpen, onClose };
}

const allText = (r: ReactTestRenderer) =>
  r.root
    .findAllByType(Text)
    .map((n) =>
      Array.isArray(n.props.children)
        ? n.props.children.join('')
        : String(n.props.children ?? ''),
    )
    .join(' ');

beforeEach(() => {
  vi.mocked(getNotifications).mockReset().mockResolvedValue({
    total: results.length,
    unreadCount: 2,
    withinDays: 30,
    results,
  });
  vi.mocked(followUser).mockReset().mockResolvedValue({ following: true });
});

describe('NotificationScreen (painel, spec 8.5)', () => {
  it('header: ← notificações e botão volta com onClose', async () => {
    const { r, onClose } = await render();
    expect(allText(r)).toContain('notificações');
    act(() => {
      r.root.findByProps({ testID: 'notif-voltar' }).props.onPress();
    });
    expect(onClose).toHaveBeenCalled();
  });

  it('agrupa em hoje / esta semana / antes com headers de grupo', async () => {
    const { r } = await render();
    const text = allText(r);
    expect(text).toContain('hoje');
    expect(text).toContain('esta semana');
    expect(text).toContain('antes');
    // ordem dos grupos na lista
    const groups = r.root
      .findAllByType(Text)
      .filter((n) =>
        ['hoje', 'esta semana', 'antes'].includes(
          String(n.props.children),
        ),
      )
      .map((n) => String(n.props.children));
    expect(groups).toEqual(['hoje', 'esta semana', 'antes']);
  });

  it('renderiza uma row por notificação (order do grupo)', async () => {
    const { r } = await render();
    expect(
      r.root.findByProps({ testID: 'notif-row-n1' }),
    ).toBeTruthy();
    expect(
      r.root.findByProps({ testID: 'notif-row-n2' }),
    ).toBeTruthy();
    expect(
      r.root.findByProps({ testID: 'notif-row-n3' }),
    ).toBeTruthy();
  });

  it('tap na row chama onOpen com o item', async () => {
    const { r, onOpen } = await render();
    act(() => {
      r.root.findByProps({ testID: 'notif-row-n1' }).props.onPress();
    });
    expect(onOpen).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'n1' }),
    );
  });

  it('rodapé: isso é tudo dos últimos 30 dias', async () => {
    const { r } = await render();
    expect(allText(r)).toContain('isso é tudo dos últimos 30 dias');
  });

  it('estado loading: carregando…', async () => {
    vi.mocked(getNotifications).mockReturnValue(
      new Promise(() => {}) as never,
    );
    const { r } = await render();
    expect(allText(r)).toContain('carregando…');
  });

  it('estado erro: copy + tentar de novo recarrega', async () => {
    vi.mocked(getNotifications).mockRejectedValueOnce(
      new Error('GET /notifications failed: 500'),
    );
    const { r } = await render();
    expect(allText(r)).toContain(
      'não consegui carregar as notificações.',
    );
    // tentar de novo: agora resolve
    await act(async () => {
      r.root.findByProps({ testID: 'notif-tentar' }).props.onPress();
    });
    expect(allText(r)).toContain('hoje');
  });

  it('estado vazio: nenhuma notificação por aqui.', async () => {
    vi.mocked(getNotifications).mockResolvedValue({
      total: 0,
      unreadCount: 0,
      withinDays: 30,
      results: [],
    });
    const { r } = await render();
    expect(allText(r)).toContain('nenhuma notificação por aqui.');
  });

  it('seguir de volta na row de follow dispara followUser', async () => {
    const { r } = await render();
    act(() => {
      r.root.findByProps({ testID: 'notif-follow-n2' }).props.onPress();
    });
    await act(async () => {});
    expect(followUser).toHaveBeenCalledWith('u1', 'bea');
  });
});
