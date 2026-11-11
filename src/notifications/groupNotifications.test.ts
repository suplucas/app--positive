import { describe, expect, it } from 'vitest';
import { groupNotifications } from './groupNotifications';
import type { AppNotification } from '../api/types';

const NOW = new Date('2026-11-11T14:00:00').getTime();
const H = 3_600_000;

const notif = (id: string, createdAt: string): AppNotification => ({
  id,
  ids: [id],
  type: 'follow',
  actorId: 'bea',
  actors: [],
  count: 1,
  reviewId: null,
  restaurantId: null,
  previewText: null,
  readAt: null,
  createdAt,
});

const at = (hoursAgo: number) => new Date(NOW - hoursAgo * H).toISOString();

describe('groupNotifications (spec 8.4 — hoje / esta semana / antes)', () => {
  it('separa hoje, esta semana e antes na ordem certa', () => {
    const groups = groupNotifications(
      [
        notif('a1', at(2)), // hoje
        notif('w1', at(24 * 3)), // 3d → semana
        notif('o1', at(24 * 10)), // 10d → antes
        notif('a2', at(1)), // hoje
      ],
      NOW,
    );
    expect(groups.map((g) => g.label)).toEqual([
      'hoje',
      'esta semana',
      'antes',
    ]);
    expect(groups[0]?.items.map((i) => i.id)).toEqual(['a1', 'a2']);
    expect(groups[1]?.items.map((i) => i.id)).toEqual(['w1']);
    expect(groups[2]?.items.map((i) => i.id)).toEqual(['o1']);
  });

  it('mesmo dia civil = hoje mesmo com mais de 24h (madrugada)', () => {
    // agora 14h de 11/nov; 23h de 10/nov = 15h atrás, outro dia civil
    const lateNight = new Date('2026-11-10T23:00:00').toISOString();
    const groups = groupNotifications([notif('n1', lateNight)], NOW);
    expect(groups.map((g) => g.label)).toEqual(['esta semana']);
  });

  it('início do dia conta como hoje', () => {
    const dawn = new Date('2026-11-11T00:30:00').toISOString();
    const groups = groupNotifications([notif('n1', dawn)], NOW);
    expect(groups[0]?.label).toBe('hoje');
  });

  it('filtra itens mais velhos que 30d (defensivo)', () => {
    const groups = groupNotifications(
      [notif('old', at(24 * 31)), notif('ok', at(2))],
      NOW,
    );
    expect(groups).toHaveLength(1);
    expect(groups[0]?.items.map((i) => i.id)).toEqual(['ok']);
  });

  it('grupos vazios não aparecem', () => {
    const groups = groupNotifications([notif('a1', at(2))], NOW);
    expect(groups.map((g) => g.label)).toEqual(['hoje']);
  });

  it('lista vazia → sem grupos', () => {
    expect(groupNotifications([], NOW)).toEqual([]);
  });

  it('itens dentro de 7d mas de outro dia → esta semana', () => {
    const groups = groupNotifications(
      [notif('w1', at(24 * 6))], // 6d
      NOW,
    );
    expect(groups.map((g) => g.label)).toEqual(['esta semana']);
  });
});
