import { useCallback } from "react";
import { useSearchParams } from "react-router-dom";

export function useApiaryParam(): [number | null, (id: number | null) => void] {
  const [params, setParams] = useSearchParams();
  const raw = params.get("apiary_id");
  const apiaryId = raw ? Number(raw) : null;

  const setApiaryId = useCallback(
    (id: number | null) => {
      setParams((prev) => {
        const next = new URLSearchParams(prev);
        if (id == null) next.delete("apiary_id");
        else next.set("apiary_id", String(id));
        return next;
      });
    },
    [setParams],
  );

  return [Number.isFinite(apiaryId) ? apiaryId : null, setApiaryId];
}
