// Helpers de apresentação: nota na escala 0-10, tempo relativo,
// cor de avatar por usuário e resolução de nome de restaurante.
import { restaurantNames } from "./restaurantNames";
import { palette } from "./theme";

// API guarda rating 0-5; a marca (protótipo/identidade) usa notas 0-10.
export function getNote(rating: number | null): string {
  return rating == null ? "—" : (rating * 2).toFixed(1);
}

export function formatRelative(iso: string, now: number = Date.now()): string {
  const diff = now - Date.parse(iso);
  if (!Number.isFinite(diff) || diff < 60_000) return "agora";
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

const AVATAR_COLORS = [palette.mostarda, palette.lambeLambe, palette.picles];

export function avatarColor(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = (hash * 31 + userId.charCodeAt(i)) >>> 0;
  }
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

// A API não expõe nome do restaurante (só CNPJ): mapa mock com os dados
// reais do seed. Sem CNPJ → null (componente omite o trecho "em ...").
export function restaurantName(
  cnpj: string | null,
  map: Record<string, string> = restaurantNames,
): string | null {
  if (!cnpj) return null;
  return map[cnpj] ?? cnpj;
}

export type RestaurantHit = { cnpj: string; nome: string };

// Busca por nome na tela de composição (fonte: mesmo mapa do seed).
export function searchRestaurants(
  query: string,
  map: Record<string, string> = restaurantNames,
  limit: number = 8,
): RestaurantHit[] {
  const q = query.trim().toLowerCase();
  const hits: RestaurantHit[] = [];
  for (const [cnpj, nome] of Object.entries(map)) {
    if (!q || nome.toLowerCase().includes(q)) {
      hits.push({ cnpj, nome });
      if (hits.length >= limit) break;
    }
  }
  return hits;
}
