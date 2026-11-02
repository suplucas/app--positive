import { apiFetch } from "./client";
import type { PlaceHit } from "./types";

export async function searchPlaces(
  query: string,
  near?: { lat: number; lng: number },
  baseUrl?: string,
): Promise<PlaceHit[]> {
  const params = new URLSearchParams({ q: query, limit: "10" });
  if (near) {
    params.set("lat", String(near.lat));
    params.set("lng", String(near.lng));
  }
  const data = await apiFetch<{ query: string; results: PlaceHit[] }>(
    `/places/search?${params}`,
    { baseUrl },
  );
  return Array.isArray(data.results) ? data.results : [];
}

export type PlacePin = {
  id: string;
  nome: string;
  lat: number;
  lng: number;
  nota: number | null;
  bairro: string | null;
};

export async function getPlaces(
  bbox: { minLng: number; minLat: number; maxLng: number; maxLat: number },
  baseUrl?: string,
): Promise<PlacePin[]> {
  const params = new URLSearchParams({
    bbox: `${bbox.minLng},${bbox.minLat},${bbox.maxLng},${bbox.maxLat}`,
    limit: "200",
  });
  const data = await apiFetch<{ results: PlacePin[] }>(`/places?${params}`, {
    baseUrl,
  });
  return Array.isArray(data.results) ? data.results : [];
}

export async function importPlace(
  hit: {
    id: string;
    nome: string;
    endereco: string | null;
    categoria: string | null;
    lat: number | null;
    lng: number | null;
  },
  baseUrl?: string,
): Promise<{ id: string }> {
  return apiFetch<{ id: string }>('/places/import', {
    method: 'POST',
    baseUrl,
    body: {
      id: hit.id,
      nome: hit.nome,
      endereco: hit.endereco,
      categoria: hit.categoria,
      lat: hit.lat,
      lng: hit.lng,
    },
  });
}
