import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, create, ReactTestRenderer } from 'react-test-renderer';
import { createElement } from 'react';
import { NotificationScreen } from './NotificationScreen';
import {
  getNotifications,
  markNotificationRead,
} from './api/comment';

vi.mock('./api/comment.js', () => ({
  getNotifications: vi.fn(),
  markNotificationRead: vi.fn(),
}));

const items = [
  {
    id: 1,
    type: 'like',
    actorId: 'caio.garfo',
    reviewId: 10,
    cnpj: '64523266000100',
    readAt: null,
    createdAt: new Date(Date.now() - 2 * 3_600_000).toISOString(),
  },
  {
    id: 2,
    type: 'follow',
    actorId: 'isa.mastiga',
    reviewId: null,
    cnpj: null,
    readAt: null,
    createdAt: new Date(Date.now() - 30 * 3_600_000).toISOString(),
  },
];

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
    page: 1,
    limit: 20,
    total: items.length,
    results: items,
  });
  vi.mocked(markNotificationRead).mockReset().mockResolvedValue({ read: true });
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
    expect(markNotificationRead).toHaveBeenCalledWith('u', 1);
  });

  it('linha sem cnpj marca como lida', async () => {
    const { r } = await render();
    await act(async () => {
      r.root.findByProps({ testID: 'notif-2' }).props.onPress();
    });
    expect(markNotificationRead).toHaveBeenCalledWith('u', 2);
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
