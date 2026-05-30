export const RETURN_URL_KEY = "beeplan_return_to";

export function saveReturnUrl(path: string) {
  sessionStorage.setItem(RETURN_URL_KEY, path);
}

export function consumeReturnUrl(fallback = "/"): string {
  const stored = sessionStorage.getItem(RETURN_URL_KEY);
  sessionStorage.removeItem(RETURN_URL_KEY);
  return stored || fallback;
}

export function returnPathFromState(state: unknown): string | null {
  if (!state || typeof state !== "object") return null;
  const from = (state as { pathname?: string; search?: string }).pathname;
  if (!from) return null;
  const search = (state as { search?: string }).search ?? "";
  return from + search;
}
