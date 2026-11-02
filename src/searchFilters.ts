import { searchRestaurants, type RestaurantHit } from "./format";
import { restaurantFor } from "./restaurantMock";

// Filtros da tela de busca (mock docs/16). Fonte dos resultados: o
// mesmo mapa do seed do composer; a ordenação usa os agregados
// determinísticos de `restaurantFor`. Trocar por busca real (PostGIS/
// pg_trgm) quando existir backend.

export type SearchFilter = "todos" | "perto" | "avaliados" | "seguidos";

export const SEARCH_FILTERS: { id: SearchFilter; label: string }[] = [
  { id: "todos", label: "todos" },
  { id: "perto", label: "perto de mim" },
  { id: "avaliados", label: "mais bem avaliados" },
  { id: "seguidos", label: "seguidos já foram" },
];

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}

export function searchWithFilter(
  query: string,
  filter: SearchFilter,
  limit: number = 8,
): RestaurantHit[] {
  // Pega todo o conjunto do seed e ordena/filtra antes de cortar.
  let hits = searchRestaurants(query, undefined, 999);
  if (filter === "perto") {
    hits = [...hits].sort(
      (a, b) =>
        restaurantFor(a.cnpj).distanciaKm - restaurantFor(b.cnpj).distanciaKm,
    );
  } else if (filter === "avaliados") {
    hits = [...hits].sort(
      (a, b) =>
        restaurantFor(b.cnpj).notaMedia - restaurantFor(a.cnpj).notaMedia,
    );
  } else if (filter === "seguidos") {
    // Heurística mock: ~metade do seed representa "amigos já foram".
    hits = hits.filter((h) => hash(h.cnpj) % 2 === 0);
  }
  return hits.slice(0, limit);
}
