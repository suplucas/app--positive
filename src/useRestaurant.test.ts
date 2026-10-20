import { describe, it, expect, vi, beforeEach } from "vitest";
import { act, create } from "react-test-renderer";
import { createElement } from "react";
import { useRestaurant } from "./useRestaurant";
import { getRestaurant, getRestaurantReviews } from "./api/restaurant";

vi.mock("./api/restaurant.js", () => ({
  getRestaurant: vi.fn(),
  getRestaurantReviews: vi.fn(),
}));

const getRestaurantMock = vi.mocked(getRestaurant);
const getReviewsMock = vi.mocked(getRestaurantReviews);

const profile = {
  cnpj: "123",
  nome: "Pizza X",
  categoria: "Restaurante",
  bairro: null,
  municipio: "São Paulo",
  preco: null,
  endereco: "Rua A",
  lat: -23.5,
  lng: -46.6,
  notaMedia: 9,
  totalAvaliacoes: 1,
  queroIr: 0,
  flairs: [],
  seguemAvaliaram: [],
};

function renderHook(cnpj = "123") {
  let api: ReturnType<typeof useRestaurant>;
  function Probe() {
    api = useRestaurant(cnpj);
    return null;
  }
  act(() => {
    create(createElement(Probe));
  });
  return { get: () => api };
}

beforeEach(() => {
  getRestaurantMock.mockReset();
  getReviewsMock.mockReset();
});

describe("useRestaurant", () => {
  it("loading → data + reviews", async () => {
    getRestaurantMock.mockResolvedValue(profile);
    getReviewsMock.mockResolvedValue({
      page: 1,
      limit: 20,
      total: 0,
      results: [],
    });
    const h = renderHook();
    await act(async () => {});
    expect(h.get().status).toBe("idle");
    expect(h.get().data?.nome).toBe("Pizza X");
    expect(getRestaurantMock).toHaveBeenCalledWith("123", undefined);
  });

  it("erro vira status error com a mensagem", async () => {
    getRestaurantMock.mockRejectedValue(new Error("404"));
    getReviewsMock.mockResolvedValue({
      page: 1,
      limit: 20,
      total: 0,
      results: [],
    });
    const h = renderHook();
    await act(async () => {});
    expect(h.get().status).toBe("error");
    expect(h.get().error).toMatch(/404/);
  });
});
