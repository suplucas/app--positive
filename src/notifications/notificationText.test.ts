import { describe, expect, it } from 'vitest';
import { notificationSegments } from './notificationText';
import type { AppNotification } from '../api/types';

const base: AppNotification = {
  id: 'n1',
  ids: ['n1'],
  type: 'like',
  actorId: 'bea',
  actors: [{ id: 'bea', name: 'Bea', handle: 'bea_come_tudo', photoUrl: null }],
  count: 1,
  reviewId: 10,
  restaurantId: '123',
  previewText: null,
  readAt: null,
  createdAt: '2026-01-01T00:00:00.000Z',
};

const over = (o: Partial<AppNotification> = {}): AppNotification => ({
  ...base,
  ...o,
});

// Junta os segmentos num texto corrido p/ conferir a copy inteira.
const joined = (n: AppNotification) =>
  notificationSegments(n)
    .map((s) => s.text)
    .join('');

describe('notificationSegments (spec 8.1/§9 — copy dos 6 tipos)', () => {
  it('like count 1: handle + curtiu sua visita no + nome (strong)', () => {
    const segs = notificationSegments(
      over({
        type: 'like',
        count: 1,
        restaurant: { id: '123', name: 'Boteco da Ana', location: null },
      }),
    );
    expect(joined(over())).toContain('@bea_come_tudo curtiu sua visita no');
    expect(segs[0]).toEqual({ text: '@bea_come_tudo' });
    expect(segs.at(-1)).toEqual({
      text: 'Boteco da Ana',
      emphasis: 'strong',
    });
  });

  it('like count 2+: e mais {count-1} curtiram', () => {
    const n = over({
      type: 'like',
      count: 5,
      restaurant: { id: '123', name: 'Mocotó', location: null },
    });
    expect(joined(n)).toBe(
      '@bea_come_tudo e mais 4 curtiram sua visita no Mocotó',
    );
    expect(notificationSegments(n).at(-1)).toEqual({
      text: 'Mocotó',
      emphasis: 'strong',
    });
  });

  it('comment: handle comentou: + "previewText" (strong)', () => {
    const n = over({
      type: 'comment',
      previewText: 'o pastel é o de queijo? preciso saber',
    });
    expect(joined(n)).toBe(
      '@bea_come_tudo comentou: "o pastel é o de queijo? preciso saber"',
    );
    expect(notificationSegments(n).at(-1)).toEqual({
      text: '"o pastel é o de queijo? preciso saber"',
      emphasis: 'strong',
    });
  });

  it('follow: começou a seguir você', () => {
    const n = over({ type: 'follow' });
    expect(joined(n)).toBe('@bea_come_tudo começou a seguir você');
  });

  it('save count 1: 1 pessoa salvou o + nome (strong) + quero ir', () => {
    const n = over({
      type: 'save',
      count: 1,
      restaurant: { id: '123', name: 'Mocotó', location: null },
    });
    expect(joined(n)).toBe(
      '1 pessoa salvou o Mocotó no quero ir depois da sua visita',
    );
    expect(notificationSegments(n)[1]).toEqual({
      text: 'Mocotó',
      emphasis: 'strong',
    });
  });

  it('save count 2+: {count} pessoas salvaram o…', () => {
    const n = over({
      type: 'save',
      count: 3,
      restaurant: { id: '123', name: 'Cora', location: null },
    });
    expect(joined(n)).toBe(
      '3 pessoas salvaram o Cora no quero ir depois da sua visita',
    );
  });

  it('network_visit: foi ao nome (strong), nota com vírgula (4,5)', () => {
    const n = over({
      type: 'network_visit',
      restaurant: { id: '123', name: 'Tan Tan', location: null },
      review: { id: 10, rating: 2.25, photoUrl: null },
    });
    expect(joined(n)).toBe(
      '@bea_come_tudo foi ao Tan Tan, que está no seu quero ir, e deu 4,5',
    );
    const segs = notificationSegments(n);
    expect(segs[2]).toEqual({ text: 'Tan Tan', emphasis: 'strong' });
    expect(segs.at(-1)).toEqual({ text: '4,5', emphasis: 'strong' });
  });

  it('milestone: Tim! + Seu {previewText}.', () => {
    const n = over({ type: 'milestone', previewText: '50º registro' });
    expect(joined(n)).toBe('Tim! Seu 50º registro.');
  });

  it('handle: actors[0] vence; sem actors usa actorId', () => {
    const n = over({
      type: 'follow',
      actors: [
        { id: 'lu', name: 'Lu', handle: 'lu.janta', photoUrl: null },
        { id: 'bea', name: 'Bea', handle: 'bea_come_tudo', photoUrl: null },
      ],
    });
    expect(joined(n)).toBe('@lu.janta começou a seguir você');

    const n2 = over({ type: 'follow', actors: [], actorId: 'mari.garfo' });
    expect(joined(n2)).toBe('@mari.garfo começou a seguir você');
  });

  it('sem restaurant: usa restaurantName(restaurantId) como fallback', () => {
    const n = over({ type: 'like', restaurantId: '123', restaurant: null });
    const segs = notificationSegments(n);
    // mockData resolve o CNPJ 123 → nome conhecido (não vazio)
    expect(segs.at(-1)?.emphasis).toBe('strong');
    expect(segs.at(-1)?.text).not.toBe('');
  });
});
