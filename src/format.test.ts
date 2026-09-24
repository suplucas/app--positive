import { describe, it, expect } from "vitest";
import {
  getNote,
  formatRelative,
  avatarColor,
  restaurantName,
  searchRestaurants,
} from "./format";

describe("getNote", () => {
  it("converte rating 0-5 da API para nota 0-10 (1 casa)", () => {
    expect(getNote(5)).toBe("10.0");
    expect(getNote(4.5)).toBe("9.0");
    expect(getNote(0)).toBe("0.0");
  });

  it("rating ausente vira traço", () => {
    expect(getNote(null)).toBe("—");
  });
});

describe("formatRelative", () => {
  const now = Date.parse("2026-09-24T12:00:00.000Z");
  const iso = (ms: number) => new Date(now - ms).toISOString();

  it("mostra minutos, horas e dias", () => {
    expect(formatRelative(iso(3 * 60_000 + 100), now)).toBe("3m");
    expect(formatRelative(iso(5 * 3_600_000 + 100), now)).toBe("5h");
    expect(formatRelative(iso(2 * 86_400_000 + 100), now)).toBe("2d");
  });

  it('recém-publicado vira "agora"', () => {
    expect(formatRelative(iso(10_000), now)).toBe("agora");
    expect(formatRelative(iso(-10_000), now)).toBe("agora");
  });
});

describe("avatarColor", () => {
  it("retorna sempre a mesma cor da paleta por usuário", () => {
    const palette = ["#F2A93B", "#E63E75", "#7A9A3D"];
    expect(palette).toContain(avatarColor("user_1"));
    expect(avatarColor("user_1")).toBe(avatarColor("user_1"));
    expect(palette).toContain(avatarColor("mogli"));
  });
});

describe("restaurantName", () => {
  it("resolve nome pelo mapa e faz fallback pro CNPJ", () => {
    const map = { "12345678000190": "Boteco da Ana" };
    expect(restaurantName("12345678000190", map)).toBe("Boteco da Ana");
    expect(restaurantName("999", map)).toBe("999");
  });

  it('sem CNPJ devolve null (omitir trecho "em ...")', () => {
    expect(restaurantName(null, {})).toBe(null);
  });
});

describe("searchRestaurants", () => {
  const map = {
    "111": "Sushi Kaza",
    "222": "Padaria Sol",
    "333": "RIPA NA BRASA RESTAURANTE",
  };

  it("filtra por nome parcial sem diferenciar maiúsculas", () => {
    expect(searchRestaurants("sushi", map)).toEqual([
      { cnpj: "111", nome: "Sushi Kaza" },
    ]);
    expect(searchRestaurants("RIPA", map)).toHaveLength(1);
  });

  it("consulta vazia devolve a lista, busca sem match devolve vazio", () => {
    expect(searchRestaurants("", map)).toHaveLength(3);
    expect(searchRestaurants("zzz", map)).toEqual([]);
  });

  it("respeita o limite de resultados", () => {
    expect(searchRestaurants("", map, 2)).toHaveLength(2);
  });
});
