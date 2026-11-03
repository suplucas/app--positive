import { ApiError, apiBaseUrl, apiFetch } from "./client";
import type { FeedResponse, Review } from "../common/types";

export async function getFeed(
  userId: string,
  page: number,
  limit: number,
  baseUrl?: string,
): Promise<FeedResponse> {
  const data = await apiFetch<FeedResponse>(
    `/feed?page=${page}&limit=${limit}`,
    { userId, baseUrl },
  );
  if (
    typeof data !== "object" ||
    data === null ||
    !Array.isArray(data.results)
  ) {
    throw new Error("GET /feed: invalid payload");
  }
  return data;
}

export type NewReview = {
  restaurantId: string;
  // escala da API 0-5; a UI v2 envia float (nota 0-10 / 2).
  rating: number;
  comment: string | null;
  photoUrl?: string | null;
  flairs?: string[];
};

export async function postReview(
  userId: string,
  review: NewReview,
  baseUrl?: string,
): Promise<Review> {
  const data = await apiFetch<Review>("/reviews", {
    method: "POST",
    userId,
    baseUrl,
    body: review,
  });
  if (typeof data !== "object" || data === null || data.id === undefined) {
    throw new Error("POST /reviews: invalid payload");
  }
  return data;
}

// Campos editáveis da própria review (docs MVP). Só os campos presentes
// são alterados; `flairs` sempre substitui a lista (vazia limpa todos).
export type ReviewEdit = {
  rating?: number;
  comment?: string | null;
  photoUrl?: string | null;
  flairs?: string[];
};

// Tipo para arquivos no FormData do React Native.
// O FormData do RN aceita { uri, name, type } diretamente; o tipo padrão
// do TypeScript (string | Blob) não cobre isso, então usamos um tipo
// próprio e fazemos um cast seguro no ponto de uso.
type RNFile = {
  uri: string;
  name: string;
  type: string;
};

export async function updateReview(
  userId: string,
  id: string | number,
  review: ReviewEdit,
  baseUrl?: string,
): Promise<Review> {
  const data = await apiFetch<Review>(`/reviews/${id}`, {
    method: "PUT",
    userId,
    baseUrl,
    body: review,
  });
  if (typeof data !== "object" || data === null || data.id === undefined) {
    throw new Error("PUT /reviews/:id: invalid payload");
  }
  return data;
}

export async function deleteReview(
  userId: string,
  id: string | number,
  baseUrl?: string,
): Promise<void> {
  await apiFetch<void>(`/reviews/${id}`, {
    method: "DELETE",
    userId,
    baseUrl,
  });
}

// Incrementa o like da review no backend. O otimismo (+1) fica no hook.
export async function likeReview(
  userId: string,
  id: string | number,
  baseUrl?: string,
): Promise<{ id: number; likes: number }> {
  return apiFetch<{ id: number; likes: number }>(`/reviews/${id}/like`, {
    method: "POST",
    userId,
    baseUrl,
  });
}

// Sobe a foto da review (multipart) e devolve a URL pública salva no
// storage. Chamada antes do POST /reviews; a review guarda só a URL.
export async function uploadReviewPhoto(
  userId: string,
  uri: string,
  baseUrl?: string,
): Promise<string> {
  return uploadPhoto(userId, uri, "/uploads/review-photo", baseUrl);
}

// Sobe a foto de perfil (multipart) e devolve a URL salva no storage.
export async function uploadAvatarPhoto(
  userId: string,
  uri: string,
  baseUrl?: string,
): Promise<string> {
  return uploadPhoto(userId, uri, "/uploads/avatar", baseUrl);
}

async function uploadPhoto(
  userId: string,
  uri: string,
  path: string,
  baseUrl?: string,
): Promise<string> {
  const ext = uri.slice(uri.lastIndexOf(".")).toLowerCase();
  const mime =
    ext === ".heic" || ext === ".heif"
      ? "image/heic"
      : ext === ".png"
        ? "image/png"
        : "image/jpeg";
  const name = `photo${ext}`;
  const file: RNFile = { uri, name, type: mime };

  const form = new FormData();
  (form as { append: (name: string, value: unknown) => void }).append(
    "file",
    file,
  );

  console.log(
    JSON.stringify({
      event: "uploadPhoto.start",
      path,
      baseUrl: baseUrl ?? apiBaseUrl(),
      uri,
      uriType: typeof uri,
      uriStartsWith: uri?.slice(0, 20),
    }),
  );

  const res = await fetch(`${baseUrl ?? apiBaseUrl()}${path}`, {
    method: "POST",
    headers: { "x-user-id": userId },
    body: form,
  });

  console.log(
    JSON.stringify({
      event: "uploadPhoto.response",
      path,
      status: res.status,
      ok: res.ok,
    }),
  );

  if (!res.ok) {
    throw new ApiError(res.status, path);
  }
  const data = (await res.json()) as { url?: unknown };
  if (typeof data?.url !== "string") {
    throw new Error(`POST ${path}: invalid payload`);
  }
  console.log(
    JSON.stringify({
      event: "uploadPhoto.done",
      path,
      url: data.url,
    }),
  );
  return data.url;
}
