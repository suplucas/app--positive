// DTOs da API usados pelos hooks/telas. Espelham os responses do
// backend; manter em sincronia com a spec de integração total.
import type { Review, ReviewAuthor, ReviewRestaurant } from '../common/types';

export type { Review, ReviewAuthor, ReviewRestaurant };

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
  source: 'local' | 'osm';
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
  username: string | null;
  bio: string | null;
  photoUrl?: string | null;
  isFollowing: boolean;
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

// Notificação do painel v1 (spec 6.5): GET /notifications devolve itens
// já colapsados (likes/saves num único item com actors/count) e
// enriquecidos (author, restaurante, review com rating/foto).
export type AppNotification = {
  id: string | number;
  ids: (string | number)[];
  type: string;
  actorId: string | null;
  actors: ReviewAuthor[];
  count: number;
  reviewId: string | number | null;
  review?: {
    id: string | number;
    rating: number | null;
    photoUrl: string | null;
  } | null;
  restaurantId: string | null;
  restaurant?: ReviewRestaurant | null;
  previewText: string | null;
  readAt: string | null;
  createdAt: string;
};

export type NotificationsResponse = {
  total: number;
  unreadCount: number;
  withinDays: number;
  results: AppNotification[];
};
