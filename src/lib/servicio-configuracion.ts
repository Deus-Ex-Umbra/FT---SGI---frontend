import { obtenerToken } from './servicio-autenticacion';
import { API_BASE_URL } from './api';
import type {
  ActualizarConfiguracionIAPayload,
  ActualizarConfiguracionRegistroEstudiantePayload,
  ConfiguracionIA,
  ConfiguracionRegistroEstudiante,
} from '@/tipos/configuracion';


export const obtenerConfiguracionIA = async (): Promise<ConfiguracionIA> => {
  const token = obtenerToken();
  if (!token) throw new Error('Tu sesión expiró. Inicia sesión nuevamente.');

  const resp = await fetch(`${API_BASE_URL}/configuracion/ia`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!resp.ok) {
    if (resp.status === 401) throw new Error('Tu sesión expiró. Inicia sesión nuevamente.');
    throw new Error('No se pudo cargar la configuración de IA.');
  }
  return resp.json();
};

export const actualizarConfiguracionIA = async (payload: ActualizarConfiguracionIAPayload) => {
  const token = obtenerToken();
  if (!token) throw new Error('Tu sesión expiró. Inicia sesión nuevamente.');

  const resp = await fetch(`${API_BASE_URL}/configuracion/ia`, {
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
    throw new Error(txt || 'No se pudo actualizar la configuración de IA.');
  }
  return resp.json();
};

export const obtenerConfiguracionRegistroEstudiante = async (): Promise<ConfiguracionRegistroEstudiante> => {
  const token = obtenerToken();
  if (!token) throw new Error('Tu sesión expiró. Inicia sesión nuevamente.');

  const resp = await fetch(`${API_BASE_URL}/configuracion/registro-estudiante`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!resp.ok) {
    if (resp.status === 401) throw new Error('Tu sesión expiró. Inicia sesión nuevamente.');
    if (resp.status === 403) throw new Error('No tienes permisos para ver esta configuración.');
    throw new Error('No se pudo cargar la configuración de registro de estudiantes.');
  }
  return resp.json();
};

export const actualizarConfiguracionRegistroEstudiante = async (
  payload: ActualizarConfiguracionRegistroEstudiantePayload,
): Promise<ConfiguracionRegistroEstudiante> => {
  const token = obtenerToken();
  if (!token) throw new Error('Tu sesión expiró. Inicia sesión nuevamente.');

  const resp = await fetch(`${API_BASE_URL}/configuracion/registro-estudiante`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  if (!resp.ok) {
    if (resp.status === 401) throw new Error('Tu sesión expiró. Inicia sesión nuevamente.');
    if (resp.status === 403) throw new Error('No tienes permisos para modificar esta configuración.');
    const txt = await resp.text();
    throw new Error(txt || 'No se pudo actualizar la configuración de registro de estudiantes.');
  }
  return resp.json();
};
