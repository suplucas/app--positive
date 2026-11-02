import { describe, it, expect, vi, beforeEach } from "vitest";
import { act, create } from "react-test-renderer";
import { createElement } from "react";
import { usePlaces } from "./usePlaces";
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
});
