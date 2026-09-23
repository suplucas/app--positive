import { afterEach, describe, expect, it, vi } from "vitest";
import { getFeed } from "./api.js";

const okBody = {
  page: 1,
  limit: 20,
  results: [
    {
      id: 1,
      userId: "user_1",
      restaurantCnpj: "123",
      rating: 5,
      comment: "ok",
      likes: 0,
      createdAt: "2026-01-01T00:00:00.000Z",
    },
  ],
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("getFeed", () => {
  it("monta URL, headers e devolve JSON", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => okBody,
    });
    vi.stubGlobal("fetch", fetchMock);

    const res = await getFeed("user_1", 2, 20, "http://api.test");

    expect(fetchMock).toHaveBeenCalledWith(
      "http://api.test/feed?page=2&limit=20",
      expect.objectContaining({
        headers: expect.objectContaining({ "x-user-id": "user_1" }),
      }),
    );
    expect(res.results).toHaveLength(1);
    expect(res.page).toBe(1);
  });

  it("lança em non-2xx", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue({ ok: false, status: 500, json: async () => ({}) }),
    );
    await expect(getFeed("user_1", 1, 20, "http://api.test")).rejects.toThrow(
      /500/,
    );
  });

  it("lança quando JSON inválido", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => {
          throw new Error("bad json");
        },
      }),
    );
    await expect(getFeed("user_1", 1, 20, "http://api.test")).rejects.toThrow(
      /bad json/,
    );
  });

  it("usa EXPO_PUBLIC_API_URL por default", async () => {
    const prev = process.env.EXPO_PUBLIC_API_URL;
    process.env.EXPO_PUBLIC_API_URL = "http://from-env";
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => okBody,
    });
    vi.stubGlobal("fetch", fetchMock);
    await getFeed("user_1", 1, 20);
    expect(fetchMock.mock.calls[0][0]).toBe(
      "http://from-env/feed?page=1&limit=20",
    );
    if (prev === undefined) delete process.env.EXPO_PUBLIC_API_URL;
    else process.env.EXPO_PUBLIC_API_URL = prev;
  });
});
