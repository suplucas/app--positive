import { useCallback, useEffect, useState } from "react";
import {
  addSave,
  getSaves,
  removeSave,
  type SavedRestaurant,
} from "./api/user";

export type SavesStatus = "loading" | "idle" | "error";

export function useSaves(userId: string) {
  const [items, setItems] = useState<SavedRestaurant[]>([]);
  const [status, setStatus] = useState<SavesStatus>("loading");
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setStatus("loading");
    setError(null);
    try {
      setItems(await getSaves(userId));
      setStatus("idle");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setStatus("error");
    }
  }, [userId]);

  useEffect(() => {
    void load();
  }, [load]);

  const ids = items.map((item) => item.id);

  const toggle = useCallback(
    async (cnpj: string, nome: string, saved: boolean) => {
      setItems((prev) =>
        saved
          ? prev.filter((item) => item.id !== cnpj)
          : [...prev, { id: cnpj, nome, bairro: null, nota: null }],
      );
      try {
        if (saved) await removeSave(userId, cnpj);
        else await addSave(userId, cnpj);
      } catch (e) {
        await load();
        throw e;
      }
    },
    [userId, load],
  );

  return { items, ids, status, error, refresh: load, toggle };
}
