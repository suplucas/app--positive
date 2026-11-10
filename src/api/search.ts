import { apiFetch } from './client';
import type { Review } from '../common/types';
import type { PlaceHit } from './types';
import type { UserProfile } from './types';

export type SearchResult = {
  places: PlaceHit[];
  reviews: Review[];
  users: UserProfile[];
};

export async function searchGlobal(
  q: string,
  baseUrl?: string,
): Promise<SearchResult> {
  const [places, reviews, users] = await Promise.all([
    searchPlaces(q, undefined, baseUrl).catch(() => [] as PlaceHit[]),
    searchReviews(q, baseUrl).catch(() => [] as Review[]),
    searchUsers(q, baseUrl).catch(() => [] as UserProfile[]),
  ]);
  return { places, reviews, users };
}

export async function searchPlaces(
  q: string,
  near?: { lat: number; lng: number },
  baseUrl?: string,
): Promise<PlaceHit[]> {
  const params = new URLSearchParams({ q, limit: '10' });
  if (near) {
    params.set('lat', String(near.lat));
    params.set('lng', String(near.lng));
  }
  return apiFetch<{ results: PlaceHit[] }>(`/places/search?${params}`, {
    baseUrl,
  }).then((d) => (Array.isArray(d.results) ? d.results : []));
}

export async function searchReviews(
  q: string,
  baseUrl?: string,
): Promise<Review[]> {
  return apiFetch<{ results: Review[] }>(
    `/reviews/search?q=${encodeURIComponent(q)}`,
    { baseUrl },
  ).then((d) => (Array.isArray(d.results) ? d.results : []));
}

export async function searchUsers(
  q: string,
  baseUrl?: string,
): Promise<UserProfile[]> {
  return apiFetch<{ results: UserProfile[] }>(
    `/users/search?q=${encodeURIComponent(q)}`,
    { baseUrl },
  ).then((d) => (Array.isArray(d.results) ? d.results : []));
}
