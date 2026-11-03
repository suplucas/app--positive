import { ApiError } from "../api/client";

// Traduz a falha de login/cadastro numa copy acionável. Antes a tela
// mostrava uma mensagem genérica para qualquer erro, escondendo a causa
// real (convite inválido, email já cadastrado, senha curta...).
export function friendlyAuthError(
  error: unknown,
  mode: "login" | "register",
): string {
  const status = error instanceof ApiError ? error.status : null;

  if (mode === "register") {
    if (status === 409) {
      return "Email ou username já está em uso. Tente outro.";
    }
    if (status === 403) {
      return "Código de convite inválido.";
    }
    if (status === 400) {
      return "Confira os dados: email válido e senha com ao menos 8 caracteres.";
    }
    return "Não consegui criar a conta. Verifique a conexão e tente de novo.";
  }

  if (status === 401) {
    return "Email ou senha incorretos.";
  }
  return "Não consegui entrar. Verifique a conexão e tente de novo.";
}
