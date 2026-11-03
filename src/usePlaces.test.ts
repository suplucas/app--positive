import { describe, it, expect, vi, beforeEach } from "vitest";
import { act, create } from "react-test-renderer";
import { createElement, useState } from "react";
import { usePlaces, type Bbox } from "./usePlaces";
import { getPlaces } from "./api/place";

vi.mock("./api/place.js", () => ({ getPlaces: vi.fn() }));

const getPlacesMock = vi.mocked(getPlaces);
const bbox = { minLng: -46.7, minLat: -23.6, maxLng: -46.6, maxLat: -23.5 };

function renderHook() {
  let api: ReturnType<typeof usePlaces>;
  function Probe() {
    api = usePlaces(bbox);
    return null;
  }
  act(() => {
    create(createElement(Probe));
  });
  return { get: () => api };
}

beforeEach(() => getPlacesMock.mockReset());

describe("usePlaces", () => {
  it("carrega os pins da API", async () => {
    getPlacesMock.mockResolvedValue([
      {
        id: "1",
        nome: "Pizza X",
        lat: -23.5,
        lng: -46.6,
        nota: 9,
        bairro: "Pinheiros",
        source: "local",
      },
    ]);
    const h = renderHook();
    await act(async () => {});
    expect(h.get().status).toBe("idle");
    expect(h.get().pins).toHaveLength(1);
    expect(getPlacesMock).toHaveBeenCalledWith(bbox);
  });

  it("lista vazia quando a API não tem pins", async () => {
    getPlacesMock.mockResolvedValue([]);
    const h = renderHook();
    await act(async () => {});
    expect(h.get().status).toBe("idle");
    expect(h.get().pins).toEqual([]);
  });

  it("mantém os pins quando a requisição falha", async () => {
    getPlacesMock.mockResolvedValue([
      {
        id: "1",
        nome: "Pizza X",
        lat: -23.5,
        lng: -46.6,
        nota: 9,
        bairro: "Pinheiros",
        source: "local",
      },
    ]);
    const h = renderHook();
    await act(async () => {});
    getPlacesMock.mockRejectedValueOnce(new Error("boom"));
    await act(async () => {
      await h.get().refresh();
    });
    expect(h.get().status).toBe("error");
    expect(h.get().pins).toHaveLength(1);
  });

  it("ignora a resposta obsoleta de uma bbox antiga", async () => {
    const bboxB: Bbox = {
      minLng: -46.5,
      minLat: -23.5,
      maxLng: -46.4,
      maxLat: -23.4,
    };
    let resolveA!: (value: unknown) => void;
    let resolveB!: (value: unknown) => void;
    const pA = new Promise((r) => {
      resolveA = r;
    });
    const pB = new Promise((r) => {
      resolveB = r;
    });
    getPlacesMock.mockImplementationOnce(() => pA as never);
    getPlacesMock.mockImplementationOnce(() => pB as never);

    let setBbox!: (b: Bbox) => void;
    let api!: ReturnType<typeof usePlaces>;
    function Probe() {
      const [b, set] = useState<Bbox>(bbox);
      setBbox = set;
      api = usePlaces(b);
      return null;
    }
    await act(async () => {
      create(createElement(Probe));
    });

    // Bbox muda antes de A resolver: A vira obsoleto.
    await act(async () => {
      setBbox(bboxB);
    });
    await act(async () => {
      resolveB([
        {
          id: "B",
          nome: "Nova",
          lat: -23.5,
          lng: -46.5,
          nota: 8,
          bairro: "Centro",
          source: "local",
        },
      ]);
    });
    expect(api.pins.map((p) => p.id)).toEqual(["B"]);

    // A chega atrasado e não pode sobrescrever os pins de B.
    await act(async () => {
      resolveA([
        {
          id: "A",
          nome: "Velha",
          lat: -23.6,
          lng: -46.7,
          nota: 7,
          bairro: "Bela Vista",
          source: "local",
        },
      ]);
    });
    expect(api.pins.map((p) => p.id)).toEqual(["B"]);
  });
});
