import { restaurantFor } from "./restaurantMock";
import { restaurantNames } from "./restaurantNames";
import { palette } from "./theme";

// Dados do mapa (docs/16). O mapa é real (OSM/CARTO via Leaflet no
// WebView), mas as coordenadas ainda são mock: derivadas do CNPJ para o
// pin cair sempre no mesmo lugar. Trocar por lat/lng da API quando o
// endpoint de restaurante expuser endereço.

export type MapPlace = {
  cnpj: string;
  nome: string;
  nota: number; // 0-10
  bairro: string;
  distanciaKm: number;
  x: number; // 0.1–0.9 (fração da largura)
  y: number; // 0.12–0.8 (fração da altura)
  lat: number; // coordenada mock (mapa real)
  lng: number;
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
export function pinColor(nota: number): string {
  if (nota >= 8.5) return palette.mostarda;
  if (nota >= 6.5) return palette.lambeLambe;
  return palette.picles;
}

// Centro do mapa mock (São Paulo). As coordenadas reais virão da API;
// por enquanto derivamos do CNPJ para o pin ficar sempre no mesmo lugar.
export const MAP_CENTER = { lat: -23.5614, lng: -46.6559 };

// Centros aproximados dos bairros usados pelo mock. O pin nasce perto
// do centro do bairro (com jitter determinístico) para o mapa fazer
// sentido geográfico mesmo sem endereço real.
export const BAIRRO_CENTERS: Record<string, { lat: number; lng: number }> = {
  "Vila Madalena": { lat: -23.5545, lng: -46.6905 },
  Pinheiros: { lat: -23.5675, lng: -46.7 },
  Moema: { lat: -23.6015, lng: -46.6655 },
  Centro: { lat: -23.5485, lng: -46.636 },
  Sumaré: { lat: -23.5455, lng: -46.68 },
  "Vila Mariana": { lat: -23.589, lng: -46.634 },
};

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
    const centro = BAIRRO_CENTERS[d.bairro] ?? MAP_CENTER;
    return {
      cnpj,
      nome: d.nome,
      nota: Number(d.notaMedia.toFixed(1)),
      bairro: d.bairro,
      distanciaKm: Number(d.distanciaKm.toFixed(1)),
      x: 0.14 + (h % 72) / 100,
      y: 0.18 + ((h >>> 7) % 55) / 100,
      lat: centro.lat + (((h >>> 11) % 1000) / 1000 - 0.5) * 0.024,
      lng: centro.lng + (((h >>> 21) % 1000) / 1000 - 0.5) * 0.024,
      cor: pinColor(d.notaMedia),
    };
  });
}
