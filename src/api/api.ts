import { ApiError, apiBaseUrl, apiFetch } from "./client";
import type { FeedResponse, Review } from "../common/types";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

// Cliente S3 direto para upload de imagens (bucket Railway / t3.storageapi.dev).
// Credenciais vêm de EXPO_PUBLIC_S3_* (definidas no app.config / .env do Expo).
const s3Client = new S3Client({
  region: "us-east-1",
  endpoint: process.env.EXPO_PUBLIC_S3_ENDPOINT,
  forcePathStyle: true, // necessário p/ endpoints S3-compatíveis (t3.storageapi.dev)
  credentials: {
    accessKeyId: process.env.EXPO_PUBLIC_S3_ACCESS_KEY_ID ?? "",
    secretAccessKey: process.env.EXPO_PUBLIC_S3_SECRET_ACCESS_KEY ?? "",
  },
});

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
  const key = `uploads/${userId}/${path.replace(/^\//, "")}/${Date.now()}${ext}`;

  // React Native não aceita {uri,name,type} como body de fetch direto;
  // busca o arquivo como blob e envia PUT via SDK do S3.
  const blobRes = await fetch(uri);
  const blob = await blobRes.blob();

  await s3Client.send(
    new PutObjectCommand({
      Bucket: process.env.EXPO_PUBLIC_S3_BUCKET ?? "",
      Key: key,
      Body: blob,
      ContentType: mime,
    }),
  );

  console.log(
    JSON.stringify({
      event: "uploadPhoto.done",
      path,
      key,
      bucket: process.env.EXPO_PUBLIC_S3_BUCKET,
    }),
  );

  return `${process.env.EXPO_PUBLIC_S3_ENDPOINT ?? ""}/${process.env.EXPO_PUBLIC_S3_BUCKET ?? ""}/${key}`;
}
