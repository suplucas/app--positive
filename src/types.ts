// Formato visual de um item do feed. A API não envia: feeds mock fixam o
// layout para reproduzir o mix de cards (foto / quote / linha).
export type ReviewLayout = "photo" | "quote" | "row";

export type Review = {
  id: string | number;
  userId: string;
  restaurantCnpj: string | null;
  rating: number | null;
  comment: string | null;
  likes: number;
  createdAt: string;
  // Índice da foto local (assets/posts) para feeds mock; a API não envia.
  photoIndex?: number | null;
  // Layout fixo (feeds mock). Ausente → derivado (foto pela regra de
  // índice, quote para nota alta, senão linha).
  layout?: ReviewLayout | null;
};

export type FeedResponse = {
  page: number;
  limit: number;
  results: Review[];
};

export type FeedStatus =
  "idle" | "loading" | "loading-more" | "error" | "empty";
