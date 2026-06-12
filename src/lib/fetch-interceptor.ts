import { toast } from 'sonner';
import { API_BASE_URL } from './api';

type FetchInput = Parameters<typeof fetch>[0];

type OpcionesInterceptor = {
  apiBaseUrl?: string;
  intervaloMs?: number;
};

let instalado = false;
let ultimoAvisoMs = 0;

const ID_TOAST_CONEXION = 'conexion-servidor';
const MENSAJE_CONEXION = 'Sin conexión con el servidor.';
const DESCRIPCION_CONEXION = 'Revisa que el backend esté encendido y accesible.';
const MENSAJE_SERVIDOR = 'El servidor no está disponible en este momento.';
const DESCRIPCION_SERVIDOR = 'Puede ser un problema interno o de base de datos.';

const obtenerUrl = (input: FetchInput): string => {
  if (typeof input === 'string') return input;
  if (input instanceof URL) return input.toString();
  return input.url;
};

const esErrorDeRed = (err: unknown) => {
  if (!(err instanceof Error)) return false;
  if (err.name === 'AbortError') return false;

  const msg = (err.message || '').toLowerCase();
  return (
    err.name === 'TypeError' ||
    msg.includes('failed to fetch') ||
    msg.includes('fetch failed') ||
    msg.includes('networkerror') ||
    msg.includes('load failed') ||
    msg.includes('econnrefused')
  );
};

const esRequestApi = (url: string, apiBaseUrl: string) => {
  if (!url) return false;
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url.startsWith(apiBaseUrl);
  }

  return false;
};

const notificarSiCorresponde = (tipo: 'red' | 'servidor', intervaloMs: number) => {
  const ahora = Date.now();
  if (ahora - ultimoAvisoMs < intervaloMs) return;
  ultimoAvisoMs = ahora;

  if (tipo === 'red') {
    toast.error(MENSAJE_CONEXION, {
      id: ID_TOAST_CONEXION,
      description: DESCRIPCION_CONEXION,
    });
    return;
  }

  toast.error(MENSAJE_SERVIDOR, {
    id: ID_TOAST_CONEXION,
    description: DESCRIPCION_SERVIDOR,
  });
};

export const instalarInterceptorFetch = (opciones?: OpcionesInterceptor) => {
  if (instalado) return;
  if (typeof window === 'undefined') return;
  if (typeof window.fetch !== 'function') return;

  instalado = true;

  const apiBaseUrl = (opciones?.apiBaseUrl ?? API_BASE_URL).trim();
  const intervaloMs = opciones?.intervaloMs ?? 8000;

  const originalFetch = window.fetch.bind(window);

  window.fetch = (async (input: FetchInput, init?: RequestInit) => {
    const url = obtenerUrl(input);
    const esApi = esRequestApi(url, apiBaseUrl);

    try {
      const resp = await originalFetch(input as any, init);

      if (esApi && resp.status >= 500) {
        notificarSiCorresponde('servidor', intervaloMs);
        console.error('[API] Respuesta 5xx', { url, status: resp.status, statusText: resp.statusText });
      }

      return resp;
    } catch (err) {
      if (esApi && esErrorDeRed(err)) {
        notificarSiCorresponde('red', intervaloMs);
        console.error('[API] Error de red', { url, error: err });
      }

      throw err;
    }
  }) as typeof window.fetch;
};
