import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, create } from 'react-test-renderer';
import { createElement } from 'react';
import { usePlaces } from './usePlaces';
import { getPlaces } from '../api/place';

vi.mock('../api/place', () => ({ getPlaces: vi.fn() }));
const getPlacesMock = vi.mocked(getPlaces);

function render(bbox: Parameters<typeof usePlaces>[0]) {
  let api: ReturnType<typeof usePlaces>;
  const Probe = () => {
    api = usePlaces(bbox);
    return null;
  };
  act(() => {
    create(createElement(Probe));
  });
  return { get: () => api! };
}

beforeEach(() => getPlacesMock.mockReset());

describe('usePlaces', () => {
  it('carrega os pins da bbox', async () => {
    getPlacesMock.mockResolvedValue([
      {
        id: '1',
        nome: 'X',
        lat: 1,
        lng: 2,
        nota: null,
        bairro: null,
        source: 'overpass',
      },
    ]);
    const bbox = { minLng: 0, minLat: 0, maxLng: 1, maxLat: 1 };
    const h = render(bbox);
    await act(async () => {});
    expect(getPlacesMock).toHaveBeenCalledWith(bbox);
    expect(h.get().pins).toHaveLength(1);
  });

  it('erro mantém os pins atuais', async () => {
    getPlacesMock.mockResolvedValueOnce([
      {
        id: '1',
        nome: 'X',
        lat: 1,
        lng: 2,
        nota: null,
        bairro: null,
        source: 'overpass',
      },
    ]);
    const bbox = { minLng: 0, minLat: 0, maxLng: 1, maxLat: 1 };
    const h = render(bbox);
    await act(async () => {});
    getPlacesMock.mockRejectedValueOnce(new Error('net'));
    await act(async () => {
      await h.get().refresh();
    });
    expect(h.get().pins).toHaveLength(1);
    expect(h.get().status).toBe('error');
  });
});
