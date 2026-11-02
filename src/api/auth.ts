import { apiFetch } from "./client";

export type AuthUser = {
  id: string;
  name: string;
  email: string | null;
};

export type AuthResponse = { token: string; user: AuthUser };

export async function register(input: {
  email: string;
  password: string;
  name: string;
  inviteCode?: string;
}): Promise<AuthResponse> {
  return apiFetch<AuthResponse>("/auth/register", {
    method: "POST",
    body: input,
  });
}

export async function login(input: {
  email: string;
  password: string;
}): Promise<AuthResponse> {
  return apiFetch<AuthResponse>("/auth/login", {
    method: "POST",
    body: input,
  });
}

export async function me(token: string): Promise<AuthUser> {
  return apiFetch<AuthUser>("/auth/me", { token });
}
