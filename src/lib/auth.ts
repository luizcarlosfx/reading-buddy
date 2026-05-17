const USER_KEY = "leitura-tobias:user";

const listeners = new Set<(user: string | null) => void>();

export function getCurrentUser(): string | null {
  const v = localStorage.getItem(USER_KEY);
  return v && v.trim() ? v.trim() : null;
}

export function setCurrentUser(name: string): void {
  const trimmed = name.trim();
  if (!trimmed) return;
  localStorage.setItem(USER_KEY, trimmed);
  listeners.forEach((fn) => fn(trimmed));
}

export function clearCurrentUser(): void {
  localStorage.removeItem(USER_KEY);
  listeners.forEach((fn) => fn(null));
}

export function subscribeUser(fn: (user: string | null) => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
