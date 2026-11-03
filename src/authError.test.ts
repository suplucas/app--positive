import { describe, it, expect } from "vitest";
import { friendlyAuthError } from "./authError";
import { ApiError } from "./api/client";

describe("friendlyAuthError (register)", () => {
  it("409 → email já tem conta", () => {
    expect(
      friendlyAuthError(new ApiError(409, "/auth/register"), "register"),
    ).toMatch(/já tem conta/i);
  });
  it("403 → convite inválido", () => {
    expect(
      friendlyAuthError(new ApiError(403, "/auth/register"), "register"),
    ).toMatch(/convite inválido/i);
  });
  it("400 → confira os dados (senha/email)", () => {
    expect(
      friendlyAuthError(new ApiError(400, "/auth/register"), "register"),
    ).toMatch(/senha com ao menos 8/i);
  });
  it("erro de rede → copy de conexão", () => {
    expect(
      friendlyAuthError(new Error("Network request failed"), "register"),
    ).toMatch(/conexão/i);
  });
});

describe("friendlyAuthError (login)", () => {
  it("401 → email ou senha incorretos", () => {
    expect(
      friendlyAuthError(new ApiError(401, "/auth/login"), "login"),
    ).toMatch(/incorretos/i);
  });
  it("erro de rede → copy de conexão", () => {
    expect(friendlyAuthError(new Error("timeout"), "login")).toMatch(
      /conexão/i,
    );
  });
});
