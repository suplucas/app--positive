import { describe, it, expect, vi, beforeEach } from "vitest";
import { act, create } from "react-test-renderer";
import { createElement } from "react";
import { useSession } from "./useSession";
import { login, me, register } from "./api/auth";

vi.mock("./api/auth.js", () => ({
  login: vi.fn(),
  register: vi.fn(),
  me: vi.fn(),
}));
vi.mock("./api/client.js", () => ({
  setAuthToken: vi.fn(),
  apiFetch: vi.fn(),
}));

const loginMock = vi.mocked(login);
const meMock = vi.mocked(me);
const registerMock = vi.mocked(register);

function renderHook() {
  let api: ReturnType<typeof useSession>;
  function Probe() {
    api = useSession();
    return null;
  }
  act(() => {
    create(createElement(Probe));
  });
  return { get: () => api };
}

beforeEach(() => {
  loginMock.mockReset();
  meMock.mockReset();
  registerMock.mockReset();
});

describe("useSession", () => {
  it("signIn guarda token e usuário", async () => {
    loginMock.mockResolvedValue({
      token: "t1",
      user: { id: "u1", name: "A", email: "a@b.com" },
    });
    const h = renderHook();
    await act(async () => {});
    await act(async () => {
      await h.get().signIn("a@b.com", "12345678");
    });
    expect(h.get().status).toBe("ready");
    expect(h.get().user?.id).toBe("u1");
    expect(h.get().token).toBe("t1");
  });

  it("signUp guarda a sessão", async () => {
    registerMock.mockResolvedValue({
      token: "t2",
      user: { id: "u2", name: "B", email: "b@b.com" },
    });
    const h = renderHook();
    await act(async () => {});
    await act(async () => {
      await h.get().signUp({
        name: "B",
        email: "b@b.com",
        password: "12345678",
      });
    });
    expect(h.get().status).toBe("ready");
    expect(h.get().user?.id).toBe("u2");
  });

  it("signOut limpa a sessão", async () => {
    loginMock.mockResolvedValue({
      token: "t1",
      user: { id: "u1", name: "A", email: "a@b.com" },
    });
    const h = renderHook();
    await act(async () => {});
    await act(async () => {
      await h.get().signIn("a@b.com", "12345678");
    });
    await act(async () => {
      await h.get().signOut();
    });
    expect(h.get().status).toBe("signed-out");
    expect(h.get().user).toBeNull();
  });
});
