import { describe, it, expect, vi, beforeEach } from "vitest";
import { act, create } from "react-test-renderer";
import { createElement } from "react";
import { useSaves } from "./useSaves";
import { addSave, getSaves, removeSave } from "./api/user";

vi.mock("./api/user.js", () => ({
  getSaves: vi.fn(),
  addSave: vi.fn(),
  removeSave: vi.fn(),
}));

const saves = [{ id: "1", nome: "Pizza X", bairro: "Pinheiros", nota: 9 }];

function renderHook() {
  let api: ReturnType<typeof useSaves>;
  function Probe() {
    api = useSaves("u");
    return null;
  }
  act(() => {
    create(createElement(Probe));
  });
  return { get: () => api };
}

beforeEach(() => {
  vi.mocked(getSaves).mockReset().mockResolvedValue(saves);
  vi.mocked(addSave).mockReset().mockResolvedValue({ saved: true });
  vi.mocked(removeSave).mockReset().mockResolvedValue({ saved: false });
});

describe("useSaves", () => {
  it("carrega e expõe ids", async () => {
    const h = renderHook();
    await act(async () => {});
    expect(h.get().items).toEqual(saves);
    expect(h.get().ids).toEqual(["1"]);
    expect(h.get().status).toBe("idle");
  });

  it("toggle salva quando não está salvo", async () => {
    const h = renderHook();
    await act(async () => {});
    await act(async () => {
      await h.get().toggle("2", "Pizza Y", false);
    });
    expect(addSave).toHaveBeenCalledWith("u", "2");
    expect(h.get().ids).toContain("2");
  });

  it("toggle remove quando já está salvo", async () => {
    const h = renderHook();
    await act(async () => {});
    await act(async () => {
      await h.get().toggle("1", "Pizza X", true);
    });
    expect(removeSave).toHaveBeenCalledWith("u", "1");
    expect(h.get().ids).not.toContain("1");
  });
});
