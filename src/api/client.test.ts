import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError, apiFetch } from "./client";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

function ok(body: unknown, status = 200): Response {
  return { ok: true, status, json: async () => body } as Response;
}

describe("apiFetch", () => {
  it("monta URL base, x-user-id, body JSON e devolve o payload", async () => {
    const fetchMock = vi.fn().mockResolvedValue(ok({ id: 1 }));
    vi.stubGlobal("fetch", fetchMock);

    const out = await apiFetch<{ id: number }>("/reviews", {
      method: "POST",
      userId: "user_1",
      baseUrl: "http://api.test",
      body: { rating: 4 },
    });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("http://api.test/reviews");
    expect(init).toMatchObject({ method: "POST" });
    expect(init.headers).toMatchObject({
      Accept: "application/json",
      "x-user-id": "user_1",
      "Content-Type": "application/json",
    });
    expect(init.body).toBe(JSON.stringify({ rating: 4 }));
    expect(out).toEqual({ id: 1 });
  });

  it("usa EXPO_PUBLIC_API_URL quando baseUrl não é passado", async () => {
    const prev = process.env.EXPO_PUBLIC_API_URL;
    process.env.EXPO_PUBLIC_API_URL = "http://env.test";
    const fetchMock = vi.fn().mockResolvedValue(ok({}));
    vi.stubGlobal("fetch", fetchMock);
    await apiFetch("/feed", {});
    expect(fetchMock.mock.calls[0][0]).toBe("http://env.test/feed");
    if (prev === undefined) delete process.env.EXPO_PUBLIC_API_URL;
    else process.env.EXPO_PUBLIC_API_URL = prev;
  });

  it("converte non-2xx em ApiError com status", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 404 } as Response),
    );
    await expect(
      apiFetch("/x", { baseUrl: "http://api.test" }),
    ).rejects.toMatchObject({
      status: 404,
    });
    await expect(
      apiFetch("/x", { baseUrl: "http://api.test" }),
    ).rejects.toBeInstanceOf(ApiError);
  });

  it("204 devolve undefined", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, status: 204 } as Response),
    );
    await expect(
      apiFetch("/x", { baseUrl: "http://api.test" }),
    ).resolves.toBeUndefined();
  });
});
