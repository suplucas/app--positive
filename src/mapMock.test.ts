import { describe, it, expect } from "vitest";
import { BAIRRO_CENTERS, mapPlaces } from "./mapMock";
import { palette } from "./theme";

describe("mapPlaces (docs/16, mapa mock)", () => {
  it("retorna 4–6 lugares com campos preenchidos", () => {
    const pins = mapPlaces();
    expect(pins.length).toBeGreaterThanOrEqual(4);
    expect(pins.length).toBeLessThanOrEqual(6);
    for (const p of pins) {
      expect(p.cnpj).toBeTruthy();
      expect(p.nome).toBeTruthy();
      expect(p.bairro).toBeTruthy();
      expect(p.nota).toBeGreaterThan(0);
      expect(p.nota).toBeLessThanOrEqual(10);
      expect(p.distanciaKm).toBeGreaterThan(0);
    }
  });

  it("determinístico: mesmo CNPJ → mesma posição/cor", () => {
    expect(mapPlaces()).toEqual(mapPlaces());
  });

  it("posições fracionárias dentro do mapa (sem sair da moldura)", () => {
    for (const p of mapPlaces()) {
      expect(p.x).toBeGreaterThanOrEqual(0.1);
      expect(p.x).toBeLessThanOrEqual(0.9);
      expect(p.y).toBeGreaterThanOrEqual(0.12);
      expect(p.y).toBeLessThanOrEqual(0.8);
    }
  });

  it("coordenadas geográficas determinísticas ao redor do centro (mock)", () => {
    for (const p of mapPlaces()) {
      expect(p.lat).toBeGreaterThan(-23.62);
      expect(p.lat).toBeLessThan(-23.5);
      expect(p.lng).toBeGreaterThan(-46.72);
      expect(p.lng).toBeLessThan(-46.58);
    }
  });

  it("cor vem da paleta de marca", () => {
    const ok = [palette.mostarda, palette.lambeLambe, palette.picles];
    for (const p of mapPlaces()) expect(ok).toContain(p.cor);
  });

  it("cada pin fica perto do centro do seu bairro", () => {
    for (const p of mapPlaces()) {
      const centro = BAIRRO_CENTERS[p.bairro];
      expect(centro).toBeTruthy();
      expect(Math.abs(p.lat - centro!.lat)).toBeLessThanOrEqual(0.02);
      expect(Math.abs(p.lng - centro!.lng)).toBeLessThanOrEqual(0.02);
    }
  });
});
