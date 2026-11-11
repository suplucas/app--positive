import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, create, ReactTestRenderer } from 'react-test-renderer';
import { createElement } from 'react';
import { NotificationScreen } from './NotificationScreen';
import { getNotifications, markNotificationsRead } from '../api/comment';

vi.mock('../api/comment', () => ({
  getNotifications: vi.fn(),
  markNotificationsRead: vi.fn(),
}));

// Shape antigo (campo cnpj) + campos obrigatórios do painel v1 — esta
// tela/teste é substituída na Task 29.
const items = [
  {
    id: 1,
    ids: [1],
    type: 'like',
    actorId: 'caio.garfo',
    actors: [],
    count: 1,
    reviewId: 10,
    restaurantId: null,
    previewText: null,
    cnpj: '64523266000100',
    readAt: null,
    createdAt: new Date(Date.now() - 2 * 3_600_000).toISOString(),
  },
  {
    id: 2,
    ids: [2],
    type: 'follow',
    actorId: 'isa.mastiga',
    actors: [],
    count: 1,
    reviewId: null,
    restaurantId: null,
    previewText: null,
    cnpj: null,
    readAt: null,
    createdAt: new Date(Date.now() - 30 * 3_600_000).toISOString(),
  },
] as unknown as import('../api/types').AppNotification[];

async function render(
  props: Partial<Parameters<typeof NotificationScreen>[0]> = {},
) {
  const onOpenRestaurant = props.onOpenRestaurant ?? vi.fn();
  const r = create(
    createElement(NotificationScreen, {
      userId: 'u',
      onOpenRestaurant,
      ...props,
    }),
  ) as ReactTestRenderer;
  await act(async () => {});
  return { r, onOpenRestaurant };
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

beforeEach(() => {
  vi.mocked(getNotifications).mockReset().mockResolvedValue({
    total: items.length,
    unreadCount: items.length,
    withinDays: 30,
    results: items,
  });
  vi.mocked(markNotificationsRead)
    .mockReset()
    .mockResolvedValue({ read: true, updated: 1 });
});

describe('NotificationScreen (docs/09)', () => {
  it('renderiza as notificações da API', async () => {
    const { r } = await render();
    for (const n of items) {
      expect(r.root.findByProps({ testID: `notif-${n.id}` })).toBeTruthy();
    }
  });

  it('copy de produto: autor e ação legíveis', async () => {
    const { r } = await render();
    const text = allText(r);
    expect(text).toContain('caio.garfo');
    expect(text).toContain('curtiu sua avaliação');
    expect(text).toContain('começou a seguir você');
  });

  it('linha com cnpj abre a página e marca como lida', async () => {
    const { r, onOpenRestaurant } = await render();
    await act(async () => {
      r.root.findByProps({ testID: 'notif-1' }).props.onPress();
    });
    expect(onOpenRestaurant).toHaveBeenCalledWith('64523266000100');
    expect(markNotificationsRead).toHaveBeenCalledWith('u', [1]);
  });

  it('linha sem cnpj marca como lida', async () => {
    const { r } = await render();
    await act(async () => {
      r.root.findByProps({ testID: 'notif-2' }).props.onPress();
    });
    expect(markNotificationsRead).toHaveBeenCalledWith('u', [2]);
  });

  it('com onBack: botão voltar', async () => {
    const onBack = vi.fn();
    const { r } = await render({ onBack });
    act(() => {
      r.root.findByProps({ testID: 'voltar' }).props.onPress();
    });
    expect(onBack).toHaveBeenCalled();
  });

  it('tempo relativo em cada linha', async () => {
    const { r } = await render();
    expect(allText(r)).toContain('2h');
  });
});
