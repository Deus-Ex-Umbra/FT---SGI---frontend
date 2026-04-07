import { obtenerToken } from './servicio-autenticacion';
import type {
  ActualizarReportePayload,
  CrearReportePayload,
  GenerarPreReporteIAPayload,
  ReporteDetalle,
  ReporteListado,
  ReportePdfListado,
} from '@/tipos/reportes';

const API_BASE_URL = 'http://localhost:3001';

export type {
  ActualizarReportePayload,
  CrearReportePayload,
  GenerarPreReporteIAPayload,
  ReporteDetalle,
  ReporteListado,
  ReportePdfListado,
  TipoReporte,
} from '@/tipos/reportes';

export const generarPreReporteIA = async (payload: GenerarPreReporteIAPayload) => {
  const token = obtenerToken();
  if (!token) throw new Error('Tu sesión expiró. Inicia sesión nuevamente.');

  const resp = await fetch(`${API_BASE_URL}/reportes/ia`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  if (!resp.ok) {
    if (resp.status === 401) throw new Error('Tu sesión expiró. Inicia sesión nuevamente.');
    const txt = await resp.text();
    throw new Error(txt || 'No se pudo generar el reporte con IA.');
  }
  return resp.json() as Promise<ReporteDetalle>;
};

export const crearReporte = async (payload: CrearReportePayload) => {
  const token = obtenerToken();
  if (!token) throw new Error('Tu sesión expiró. Inicia sesión nuevamente.');

  const resp = await fetch(`${API_BASE_URL}/reportes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  if (!resp.ok) {
    if (resp.status === 401) throw new Error('Tu sesión expiró. Inicia sesión nuevamente.');
    const txt = await resp.text();
    throw new Error(txt || 'No se pudo crear el reporte.');
  }
  return resp.json() as Promise<ReporteDetalle>;
};

export const actualizarReporte = async (id: number, payload: ActualizarReportePayload) => {
  const token = obtenerToken();
  if (!token) throw new Error('Tu sesión expiró. Inicia sesión nuevamente.');

  const resp = await fetch(`${API_BASE_URL}/reportes/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  if (!resp.ok) {
    if (resp.status === 401) throw new Error('Tu sesión expiró. Inicia sesión nuevamente.');
    const txt = await resp.text();
    throw new Error(txt || 'No se pudo actualizar el reporte.');
  }
  return resp.json() as Promise<ReporteDetalle | null>;
};

export const eliminarReporte = async (id: number) => {
  const token = obtenerToken();
  if (!token) throw new Error('Tu sesión expiró. Inicia sesión nuevamente.');

  const resp = await fetch(`${API_BASE_URL}/reportes/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!resp.ok) {
    if (resp.status === 401) throw new Error('Tu sesión expiró. Inicia sesión nuevamente.');
    const txt = await resp.text();
    throw new Error(txt || 'No se pudo eliminar el reporte.');
  }
  return resp.json() as Promise<{ ok: boolean }>;
};

export const listarReportes = async () => {
  const token = obtenerToken();
  if (!token) throw new Error('Tu sesión expiró. Inicia sesión nuevamente.');
  const resp = await fetch(`${API_BASE_URL}/reportes`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!resp.ok) {
    if (resp.status === 401) throw new Error('Tu sesión expiró. Inicia sesión nuevamente.');
    throw new Error('No se pudo listar reportes.');
  }
  return resp.json() as Promise<ReporteListado[]>;
};

export const obtenerReporte = async (id: number) => {
  const token = obtenerToken();
  if (!token) throw new Error('Tu sesión expiró. Inicia sesión nuevamente.');
  const resp = await fetch(`${API_BASE_URL}/reportes/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!resp.ok) {
    if (resp.status === 401) throw new Error('Tu sesión expiró. Inicia sesión nuevamente.');
    throw new Error('No se pudo obtener el reporte.');
  }
  return resp.json() as Promise<ReporteDetalle | null>;
};

export const descargarPdfDesdeHtml = async (payload: { html: string; config: any }) => {
  const token = obtenerToken();
  if (!token) throw new Error('Tu sesión expiró. Inicia sesión nuevamente.');

  const resp = await fetch(`${API_BASE_URL}/reportes/pdf`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  if (!resp.ok) {
    if (resp.status === 401) throw new Error('Tu sesión expiró. Inicia sesión nuevamente.');
    const txt = await resp.text();
    throw new Error(txt || 'No se pudo convertir a PDF.');
  }
  const blob = await resp.blob();
  return blob;
};

export const generarPdfDesdeReporteYDescargar = async (reporteId: number, payload: { config: any }) => {
  const token = obtenerToken();
  if (!token) throw new Error('Tu sesión expiró. Inicia sesión nuevamente.');

  const resp = await fetch(`${API_BASE_URL}/reportes/${reporteId}/pdf`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  if (!resp.ok) {
    if (resp.status === 401) throw new Error('Tu sesión expiró. Inicia sesión nuevamente.');
    const txt = await resp.text();
    throw new Error(txt || 'No se pudo generar el PDF.');
  }
  return await resp.blob();
};

export const listarPdfsGenerados = async () => {
  const token = obtenerToken();
  if (!token) throw new Error('Tu sesión expiró. Inicia sesión nuevamente.');
  const resp = await fetch(`${API_BASE_URL}/reportes/pdf/lista`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!resp.ok) {
    if (resp.status === 401) throw new Error('Tu sesión expiró. Inicia sesión nuevamente.');
    throw new Error('No se pudo listar PDFs.');
  }
  return resp.json() as Promise<ReportePdfListado[]>;
};

export const descargarPdfGenerado = async (pdfId: number) => {
  const token = obtenerToken();
  if (!token) throw new Error('Tu sesión expiró. Inicia sesión nuevamente.');
  const resp = await fetch(`${API_BASE_URL}/reportes/pdf/${pdfId}/descargar`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!resp.ok) {
    if (resp.status === 401) throw new Error('Tu sesión expiró. Inicia sesión nuevamente.');
    throw new Error('No se pudo descargar el PDF.');
  }
  return await resp.blob();
};
