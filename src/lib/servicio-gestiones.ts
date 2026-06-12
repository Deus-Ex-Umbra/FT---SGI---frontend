import { API_BASE_URL } from './api';
import { obtenerToken } from './servicio-autenticacion';

const API_BASE = API_BASE_URL;

const authHeaders = () => {
  const token = obtenerToken();
  if (!token) {
    throw new Error('Tu sesión expiró. Inicia sesión nuevamente.');
  }
  return { Authorization: `Bearer ${token}` };
};

const leerError = async (respuesta: Response, mensajeBase: string) => {
  const texto = await respuesta.text();
  return texto || mensajeBase;
};

import type { Gestion } from '@/tipos/gestiones';

export const servicioGestiones = {
  obtenerGestiones: async (): Promise<Gestion[]> => {
    const respuesta = await fetch(`${API_BASE}/administrador/gestiones`, {
      headers: authHeaders(),
    });

    if (!respuesta.ok) {
      if (respuesta.status === 403) throw new Error('No tienes permisos para ver gestiones.');
      if (respuesta.status === 401) throw new Error('Tu sesión expiró. Inicia sesión nuevamente.');
      throw new Error(await leerError(respuesta, 'No se pudo cargar la lista de gestiones.'));
    }

    return respuesta.json();
  },

  crearGestion: async (datos: { 
    nombre: string; 
    estado?: 'abierta' | 'cerrada';
    fechaInicio?: string | null;
    fechaFin?: string | null;
  }): Promise<Gestion> => {
    const respuesta = await fetch(`${API_BASE}/administrador/gestiones`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(datos),
    });

    if (!respuesta.ok) {
      if (respuesta.status === 403) throw new Error('No tienes permisos para crear gestiones.');
      if (respuesta.status === 401) throw new Error('Tu sesión expiró. Inicia sesión nuevamente.');
      throw new Error(await leerError(respuesta, 'No se pudo crear la gestión.'));
    }

    return respuesta.json();
  },

  editarGestion: async (id: number, datos: Partial<{ 
    nombre: string; 
    estado: 'abierta' | 'cerrada';
    fechaInicio: string | null;
    fechaFin: string | null;
  }>): Promise<Gestion> => {
    const respuesta = await fetch(`${API_BASE}/administrador/gestiones/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(datos),
    });

    if (!respuesta.ok) {
      if (respuesta.status === 403) throw new Error('No tienes permisos para editar gestiones.');
      if (respuesta.status === 401) throw new Error('Tu sesión expiró. Inicia sesión nuevamente.');
      if (respuesta.status === 404) throw new Error('No se encontró la gestión seleccionada.');
      throw new Error(await leerError(respuesta, 'No se pudo actualizar la gestión.'));
    }

    return respuesta.json();
  },

  eliminarGestion: async (id: number): Promise<void> => {
    const respuesta = await fetch(`${API_BASE}/administrador/gestiones/${id}`, {
      method: 'DELETE',
      headers: authHeaders(),
    });

    if (!respuesta.ok) {
      if (respuesta.status === 403) throw new Error('No tienes permisos para eliminar gestiones.');
      if (respuesta.status === 401) throw new Error('Tu sesión expiró. Inicia sesión nuevamente.');
      if (respuesta.status === 404) throw new Error('No se encontró la gestión seleccionada.');
      throw new Error(await leerError(respuesta, 'No se pudo eliminar la gestión.'));
    }
  },
};
