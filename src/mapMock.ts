import { restaurantFor } from "./restaurantMock";
import { restaurantNames } from "./restaurantNames";
import { palette } from "./theme";

// Dados do mapa (mock docs/16). Não há SDK de mapa: os "pins" são
// posições fracionárias dentro de uma moldura estilizada, geradas de
// forma determinística pelo CNPJ (mesmo lugar → mesmo pin). Trocar por
// Google Maps/Mapbox quando existir mapa de verdade.

export type MapPlace = {
  cnpj: string;
  nome: string;
  nota: number; // 0-10
  bairro: string;
  distanciaKm: number;
  x: number; // 0.1–0.9 (fração da largura)
  y: number; // 0.12–0.8 (fração da altura)
  cor: string;
};

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}

// Cor do pin pela faixa de nota (paleta de marca).
function pinColor(nota: number): string {
  if (nota >= 8.5) return palette.mostarda;
  if (nota >= 6.5) return palette.lambeLambe;
  return palette.picles;
}

// 5 lugares espalhados pelo mapa do seed (passo fixo → determinístico).
export function mapPlaces(): MapPlace[] {
  const keys = Object.keys(restaurantNames);
  const picked: string[] = [];
  for (let i = 0; i < keys.length && picked.length < 5; i += 29) {
    picked.push(keys[i]!);
  }
  return picked.map((cnpj) => {
    const d = restaurantFor(cnpj);
    const h = hash(cnpj);
    return {
      cnpj,
      nome: d.nome,
      nota: Number(d.notaMedia.toFixed(1)),
      bairro: d.bairro,
      distanciaKm: Number(d.distanciaKm.toFixed(1)),
      x: 0.14 + (h % 72) / 100,
      y: 0.18 + ((h >>> 7) % 55) / 100,
      cor: pinColor(d.notaMedia),
    };
  });
}
