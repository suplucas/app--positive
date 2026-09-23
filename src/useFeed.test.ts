import { describe, it, expect, vi, beforeEach } from "vitest";
import { act, create, ReactTestRenderer } from "react-test-renderer";
import { createElement } from "react";
import { useFeed } from "./useFeed.js";
import { getFeed } from "./api.js";
import type { FeedResponse } from "./types.js";

vi.mock("./api.js", () => ({ getFeed: vi.fn() }));

const getFeedMock = vi.mocked(getFeed);

const page20 = (page: number) => ({
  page,
  limit: 20,
  results: Array.from({ length: 20 }, (_, i) => ({
    id: page * 100 + i,
    userId: "u",
    restaurantCnpj: null,
    rating: 5,
    comment: null,
    likes: 0,
    createdAt: "2026-01-01T00:00:00.000Z",
  })),
});

function renderHook(initialUser: string) {
  let api: ReturnType<typeof useFeed>;
  const Probe = ({ user }: { user: string }) => {
    api = useFeed(user);
    return null;
  };
  let r: ReactTestRenderer;
  act(() => {
    r = create(createElement(Probe, { user: initialUser }));
  });
  return {
    get: () => api,
    setUser: (user: string) =>
      act(() => {
        r.update(createElement(Probe, { user }));
      }),
    act,
  };
}

beforeEach(() => {
  getFeedMock.mockReset();
});

describe("useFeed", () => {
  it("primeira carga: loading → items + hasMore", async () => {
    getFeedMock.mockResolvedValue(page20(1));
    const h = renderHook("user_1");
    await act(async () => {});
    expect(h.get().items).toHaveLength(20);
    expect(h.get().status).toBe("idle");
    expect(h.get().hasMore).toBe(true);
    expect(getFeedMock).toHaveBeenCalledWith("user_1", 1, 20);
  });

  it("página parcial (< limit) → hasMore false; loadMore no-op", async () => {
    getFeedMock.mockResolvedValue({
      page: 1,
      limit: 20,
      results: [page20(1).results[0]!],
    });
    const h = renderHook("user_1");
    await act(async () => {});
    expect(h.get().hasMore).toBe(false);
    const calls = getFeedMock.mock.calls.length;
    await act(async () => {
      await h.get().loadMore();
    });
    expect(getFeedMock.mock.calls.length).toBe(calls);
  });

  it("primeira carga vazia → status empty", async () => {
    getFeedMock.mockResolvedValue({ page: 1, limit: 20, results: [] });
    const h = renderHook("user_nobody");
    await act(async () => {});
    expect(h.get().status).toBe("empty");
    expect(h.get().items).toEqual([]);
    expect(h.get().hasMore).toBe(false);
  });

  it("erro de rede na primeira carga → status error, mensagem presente", async () => {
    getFeedMock.mockRejectedValue(new Error("network down"));
    const h = renderHook("user_1");
    await act(async () => {});
    expect(h.get().status).toBe("error");
    expect(h.get().error).toMatch(/network down/);
    expect(h.get().items).toEqual([]);
  });

  it("erro em loadMore após sucesso → error mas items preservados", async () => {
    getFeedMock
      .mockResolvedValueOnce(page20(1))
      .mockRejectedValueOnce(new Error("boom"));
    const h = renderHook("user_1");
    await act(async () => {});
    await act(async () => {
      await h.get().loadMore();
    });
    expect(h.get().status).toBe("error");
    expect(h.get().items).toHaveLength(20);
    expect(h.get().hasMore).toBe(true);
  });

  it("troca de usuário descarta resposta antiga (race)", async () => {
    const slowFeed: FeedResponse = {
      page: 1,
      limit: 20,
      results: Array.from({ length: 20 }, (_, i) => ({
        id: 900 + i,
        userId: "user_slow",
        restaurantCnpj: null,
        rating: 5,
        comment: null,
        likes: 0,
        createdAt: "2026-01-01T00:00:00.000Z",
      })),
    };
    const fastFeed: FeedResponse = {
      page: 1,
      limit: 20,
      results: Array.from({ length: 20 }, (_, i) => ({
        id: 100 + i,
        userId: "user_fast",
        restaurantCnpj: null,
        rating: 5,
        comment: null,
        likes: 0,
        createdAt: "2026-01-01T00:00:00.000Z",
      })),
    };
    let resolveFirst: (v: FeedResponse) => void = () => {};
    getFeedMock
      .mockImplementationOnce(
        () =>
          new Promise((res) => {
            resolveFirst = res;
          }),
      )
      .mockResolvedValueOnce(fastFeed);
    const h = renderHook("user_slow");
    // second user loads fully
    h.setUser("user_fast");
    await act(async () => {});
    expect(h.get().items).toHaveLength(20);
    expect(h.get().items.every((r) => r.userId === "user_fast")).toBe(true);
    // late response for user_slow arrives
    await act(async () => {
      resolveFirst(slowFeed);
      await Promise.resolve();
    });
    // must still be user_fast data — stale slow payload discarded
    expect(getFeedMock).toHaveBeenLastCalledWith("user_fast", 1, 20);
    expect(h.get().items).toHaveLength(20);
    expect(h.get().items.every((r) => r.userId === "user_fast")).toBe(true);
    expect(h.get().items.some((r) => Number(r.id) >= 900)).toBe(false);
  });

  it("refresh zeta e recarrega page 1", async () => {
    getFeedMock.mockResolvedValueOnce(page20(1)).mockResolvedValueOnce({
      page: 1,
      limit: 20,
      results: [page20(1).results[0]!],
    });
    const h = renderHook("user_1");
    await act(async () => {});
    expect(h.get().items).toHaveLength(20);
    await act(async () => {
      await h.get().refresh();
    });
    expect(h.get().items).toHaveLength(1);
    expect(h.get().hasMore).toBe(false);
    expect(getFeedMock).toHaveBeenNthCalledWith(2, "user_1", 1, 20);
  });

  it("loadMore anexa página seguinte", async () => {
    getFeedMock
      .mockResolvedValueOnce(page20(1))
      .mockResolvedValueOnce(page20(2));
    const h = renderHook("user_1");
    await act(async () => {});
    await act(async () => {
      await h.get().loadMore();
    });
    expect(h.get().items).toHaveLength(40);
    expect(getFeedMock).toHaveBeenNthCalledWith(2, "user_1", 2, 20);
  });
});
