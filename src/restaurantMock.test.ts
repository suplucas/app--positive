import { describe, it, expect } from "vitest";
import { restaurantFor } from "./restaurantMock";
import { restaurantNames } from "./restaurantNames";

const [cnpjSeed] = Object.entries(restaurantNames)[0];

describe("restaurantFor (mock p/ docs_05)", () => {
  it("nome do seed quando o CNPJ existe no mapa", () => {
    expect(restaurantFor(cnpjSeed).nome).toBe(restaurantNames[cnpjSeed]);
  });

  it("CNPJ desconhecido usa o próprio CNPJ como nome", () => {
    expect(restaurantFor("99999999000199").nome).toBe("99999999000199");
  });

  it("determinístico: mesmo CNPJ → mesma página", () => {
    const a = restaurantFor(cnpjSeed);
    const b = restaurantFor(cnpjSeed);
    expect(a.nome).toBe(b.nome);
    expect(a.notaMedia).toBe(b.notaMedia);
    expect(a.totalAvaliacoes).toBe(b.totalAvaliacoes);
    expect(a.reviews.map((r) => [r.id, r.userId, r.rating])).toEqual(
      b.reviews.map((r) => [r.id, r.userId, r.rating]),
    );
  });

  it("reviews: IDs únicos, todas do restaurante, 3+ itens", () => {
    const d = restaurantFor(cnpjSeed);
    expect(d.reviews.length).toBeGreaterThanOrEqual(3);
    expect(new Set(d.reviews.map((r) => r.id)).size).toBe(d.reviews.length);
    for (const r of d.reviews) {
      expect(r.restaurantId).toBe(cnpjSeed);
    }
  });

  it("stats coerentes: nota 0-10, totais positivos", () => {
    const d = restaurantFor(cnpjSeed);
    expect(d.notaMedia).toBeGreaterThanOrEqual(0);
    expect(d.notaMedia).toBeLessThanOrEqual(10);
    expect(d.totalAvaliacoes).toBeGreaterThan(0);
    expect(d.queroIr).toBeGreaterThan(0);
  });

  it("flairs agregados: 3+, com contagens positivas", () => {
    const d = restaurantFor(cnpjSeed);
    expect(d.flairs.length).toBeGreaterThanOrEqual(3);
    for (const f of d.flairs) expect(f.count).toBeGreaterThan(0);
  });
});
