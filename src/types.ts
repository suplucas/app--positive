export type Review = {
  id: string | number;
  userId: string;
  restaurantCnpj: string | null;
  rating: number | null;
  comment: string | null;
  likes: number;
  createdAt: string;
};

export type FeedResponse = {
  page: number;
  limit: number;
  results: Review[];
};

export type FeedStatus =
  "idle" | "loading" | "loading-more" | "error" | "empty";
