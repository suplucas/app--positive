// Formato visual de um item do feed. A API não envia: feeds mock fixam o
// layout para reproduzir o mix de cards (foto / quote / linha).
export type ReviewLayout = 'photo' | 'quote' | 'row';

// Autor enriquecido pelo backend (spec 6.1): uma query batch por feed.
export type ReviewAuthor = {
  id: string;
  name: string;
  handle: string | null;
  photoUrl: string | null;
};

// Restaurante enriquecido pelo backend (spec 6.1): nome resolvido
// (nomeFantasia ?? razaoSocial ?? id) e município.
export type ReviewRestaurant = {
  id: string;
  name: string;
  location: string | null;
};

export type Review = {
  id: string | number;
  userId: string;
  restaurantId: string | null;
  rating: number | null;
  comment: string | null;
  likes: number;
  createdAt: string;
  // Índice da foto local (assets/posts) para feeds mock; a API não envia.
  photoIndex?: number | null;
  // 2+ fotos locais (assets/posts) → carrossel no card de foto (docs/15).
  photoIndexes?: number[] | null;
  // Layout fixo (feeds mock). Ausente → derivado (foto pela regra de
  // índice, quote para nota alta, senão linha).
  layout?: ReviewLayout | null;
  // Mídia/flairs persistidos na API (integração total).
  photoUrl?: string | null;
  flairs?: string[];
  // Feed v1 (spec 6.1): título obrigatório no compose e enriquecimento
  // em batch — autor, restaurante e contagem de comentários.
  title?: string | null;
  commentCount?: number | null;
  author?: ReviewAuthor | null;
  restaurant?: ReviewRestaurant | null;
};

export type FeedResponse = {
  page: number;
  limit: number;
  results: Review[];
};

export type FeedStatus =
  'idle' | 'loading' | 'loading-more' | 'error' | 'empty';
