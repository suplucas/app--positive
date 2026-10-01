import { describe, it, expect } from "vitest";
import { searchWithFilter, SEARCH_FILTERS } from "./searchFilters";
import { restaurantFor } from "./restaurantMock";

describe("searchWithFilter (docs/16)", () => {
  it("expõe os 4 filtros do mock (todos 1º)", () => {
    expect(SEARCH_FILTERS.map((f) => f.id)).toEqual([
      "todos",
      "perto",
      "avaliados",
      "seguidos",
    ]);
    expect(SEARCH_FILTERS.map((f) => f.label)).toEqual([
      "todos",
      "perto de mim",
      "mais bem avaliados",
      "seguidos já foram",
    ]);
  });

  it("todos: respeita o limite e a busca textual", () => {
    expect(searchWithFilter("", "todos").length).toBeLessThanOrEqual(8);
    const kyoto = searchWithFilter("kyoto", "todos");
    expect(kyoto).toHaveLength(1);
    expect(kyoto[0]!.nome).toContain("Kyoto");
  });

  it("perto de mim: distância não-decrescente", () => {
    const hits = searchWithFilter("", "perto");
    const km = hits.map((h) => restaurantFor(h.cnpj).distanciaKm);
    expect([...km].sort((a, b) => a - b)).toEqual(km);
  });

  it("mais bem avaliados: nota não-crescente", () => {
    const hits = searchWithFilter("", "avaliados");
    const notas = hits.map((h) => restaurantFor(h.cnpj).notaMedia);
    expect([...notas].sort((a, b) => b - a)).toEqual(notas);
  });

  it("seguidos já foram: subset do seed, ainda determinístico", () => {
    const a = searchWithFilter("", "seguidos");
    expect(a.length).toBeGreaterThan(0);
    expect(a.length).toBeLessThan(searchWithFilter("", "todos").length + 1);
    expect(a).toEqual(searchWithFilter("", "seguidos"));
  });
});
