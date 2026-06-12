const normalizarBaseUrl = (value: string | undefined, fallback: string): string => {
  const raw = value?.trim() || fallback;
  const withProtocol = /^https?:\/\//i.test(raw) ? raw : `http://${raw}`;
  return withProtocol.replace(/\/+$/, '');
};

export const API_BASE_URL = normalizarBaseUrl(
  (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env?.VITE_API_BASE_URL,
  'http://localhost:3001',
);

export const construirUrlApi = (path: string): string => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
};