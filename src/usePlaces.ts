import { useCallback, useEffect, useRef, useState } from "react";
import { getPlaces, type PlacePin } from "./api/place";

export type PlacesStatus = "loading" | "idle" | "error";

export type Bbox = {
  minLng: number;
  minLat: number;
  maxLng: number;
  maxLat: number;
};

// Centro de São Paulo (mock). A API devolve só restaurantes com review
// e coordenadas dentro da bbox.
export const DEFAULT_BBOX: Bbox = {
  minLng: -46.78,
  minLat: -23.66,
  maxLng: -46.53,
  maxLat: -23.46,
};

export function usePlaces(bbox: Bbox = DEFAULT_BBOX) {
  const [pins, setPins] = useState<PlacePin[]>([]);
  const [status, setStatus] = useState<PlacesStatus>("loading");
  const [error, setError] = useState<string | null>(null);
  const { minLng, minLat, maxLng, maxLat } = bbox;
  // Cada carregamento ganha um id; uma resposta de bbox antiga que
  // chegue depois não pode sobrescrever os pins da área atual.
  const requestId = useRef(0);

  const load = useCallback(async () => {
    const id = ++requestId.current;
    setStatus("loading");
    setError(null);
    try {
      const results = await getPlaces({ minLng, minLat, maxLng, maxLat });
      // Resolução obsoleta: outra bbox já foi pedida depois desta.
      if (id !== requestId.current) return;
      setPins(results);
      setStatus("idle");
    } catch (e) {
      if (id !== requestId.current) return;
      setError(e instanceof Error ? e.message : String(e));
      // Mantém os pins anteriores: a última área carregada continua no
      // mapa enquanto a nova tentativa falha (só o status muda).
      setStatus("error");
    }
  }, [minLng, minLat, maxLng, maxLat]);

  useEffect(() => {
    void load();
  }, [load]);

  return { pins, status, error, refresh: load };
}
