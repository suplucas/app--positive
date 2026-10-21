// DTOs da API usados pelos hooks/telas. Espelham os responses do
// backend; manter em sincronia com a spec de integração total.
import type { Review } from "../types";

export type { Review };

export type FeedResponseDto = {
  page: number;
  limit: number;
  results: Review[];
};

export type RestaurantProfile = {
  id: string;
  cnpj: string | null;
  nome: string;
  categoria: string | null;
  bairro: string | null;
  municipio: string | null;
  preco: string | null;
  endereco: string | null;
  lat: number | null;
  lng: number | null;
  notaMedia: number | null;
  totalAvaliacoes: number;
  queroIr: number;
  flairs: { label: string; count: number }[];
  seguemAvaliaram: string[];
};

export type PlaceHit = {
  id: string;
  source: "local" | "osm";
  nome: string;
  endereco: string | null;
  categoria: string | null;
  lat: number | null;
  lng: number | null;
  nota?: number | null;
  bairro?: string | null;
};

export type UserProfile = {
  id: string;
  name: string;
  handle: string | null;
  bio: string | null;
  stats: {
    reviews: number;
    followers: number;
    following: number;
    notaMedia: number | null;
  };
};

export type ReviewComment = {
  id: string | number;
  reviewId: string | number;
  userId: string;
  text: string;
  createdAt: string;
};

export type AppNotification = {
  id: string | number;
  type: string;
  actorId: string | null;
  reviewId: string | number | null;
  cnpj: string | null;
  readAt: string | null;
  createdAt: string;
};
