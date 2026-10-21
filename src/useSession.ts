import { useCallback, useEffect, useState } from "react";
import * as SecureStore from "expo-secure-store";
import { login, me, register, type AuthUser } from "./api/auth";
import { setAuthToken } from "./api/client";

const TOKEN_KEY = "tim.token";

export type SessionStatus = "loading" | "ready" | "signed-out";

export function useSession() {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<SessionStatus>("loading");

  useEffect(() => {
    let active = true;
    (async () => {
      const stored = await SecureStore.getItemAsync(TOKEN_KEY);
      if (!stored) {
        if (active) setStatus("signed-out");
        return;
      }
      setAuthToken(stored);
      try {
        const profile = await me(stored);
        if (!active) return;
        setToken(stored);
        setUser(profile);
        setStatus("ready");
      } catch {
        setAuthToken(null);
        await SecureStore.deleteItemAsync(TOKEN_KEY);
        if (active) setStatus("signed-out");
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const apply = useCallback(
    async (result: { token: string; user: AuthUser }) => {
      setAuthToken(result.token);
      await SecureStore.setItemAsync(TOKEN_KEY, result.token);
      setToken(result.token);
      setUser(result.user);
      setStatus("ready");
    },
    [],
  );

  const signIn = useCallback(
    async (email: string, password: string) => {
      await apply(await login({ email, password }));
    },
    [apply],
  );

  const signUp = useCallback(
    async (input: {
      email: string;
      password: string;
      name: string;
      inviteCode?: string;
    }) => {
      await apply(await register(input));
    },
    [apply],
  );

  const signOut = useCallback(async () => {
    setAuthToken(null);
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    setToken(null);
    setUser(null);
    setStatus("signed-out");
  }, []);

  return { token, user, status, signIn, signUp, signOut };
}
