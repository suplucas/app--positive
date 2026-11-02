import { useCallback, useEffect, useState } from "react";
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

  const load = useCallback(async () => {
    setStatus("loading");
    setError(null);
    try {
      const results = await getPlaces({ minLng, minLat, maxLng, maxLat });
      setPins(results);
      setStatus("idle");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setPins([]);
      setStatus("error");
    }
  }, [minLng, minLat, maxLng, maxLat]);

  useEffect(() => {
    void load();
  }, [load]);

  return { pins, status, error, refresh: load };
}
