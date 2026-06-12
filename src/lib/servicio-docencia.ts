import { obtenerToken } from './servicio-autenticacion';
import { API_BASE_URL } from './api';
import type {
  EstadoAprobacionGrupoDocencia,
  GrupoMateriaDocencia,
  MateriaAsignadaDocencia,
  SolicitudMaterialDocencia,
  SubgrupoPrestamoDocencia,
  UrlFirmadaPdfDocencia,
} from '@/tipos/docencia';

const API_BASE = API_BASE_URL;

const authHeaders = () => {
  const token = obtenerToken();
  if (!token) {
    throw new Error('Tu sesión expiró. Inicia sesión nuevamente.');
  }
  return { Authorization: `Bearer ${token}` };
};

export const listarGruposDocencia = async (): Promise<GrupoMateriaDocencia[]> => {
  const resp = await fetch(`${API_BASE}/docencia/materias`, {
    headers: {
      ...authHeaders(),
    },
  });
  if (!resp.ok) throw new Error('No se pudieron cargar las materias.');
  return resp.json();
};

export const listarMateriasAsignadasDocencia = async (): Promise<MateriaAsignadaDocencia[]> => {
  const resp = await fetch(`${API_BASE}/docencia/materias-asignadas`, {
    headers: {
      ...authHeaders(),
    },
  });
  if (!resp.ok) throw new Error('No se pudieron cargar las materias asignadas.');
  return resp.json();
};

export const crearGrupoDocencia = async (dto: {
  sigla: string;
  nombre: string;
  descripcion: string;
  gestion: string;
  fechaInicioInscripcion: string;
  fechaFinInscripcion: string;
  fechaInicioGestion: string;
  fechaFinGestion: string;
  grupo: string | number;
  codigoInscripcion?: string;
  estudianteIds?: number[];
}): Promise<GrupoMateriaDocencia> => {
  const resp = await fetch(`${API_BASE}/docencia/materias`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
    },
    body: JSON.stringify(dto),
  });
  if (!resp.ok) {
    const txt = await resp.text();
    throw new Error(txt || 'No se pudo registrar la solicitud de grupo.');
  }
  return resp.json();
};

export const listarSolicitudesGrupoDocencia = async (
  estado: EstadoAprobacionGrupoDocencia = 'pendiente',
): Promise<GrupoMateriaDocencia[]> => {
  const resp = await fetch(`${API_BASE}/administrador/docencia/solicitudes-grupo?estado=${encodeURIComponent(estado)}`, {
    headers: {
      ...authHeaders(),
    },
  });
  if (!resp.ok) throw new Error('No se pudieron cargar las solicitudes de grupo.');
  return resp.json();
};

export const listarGruposAdministracionDocencia = async (
  estado: 'todos' | EstadoAprobacionGrupoDocencia = 'todos',
): Promise<GrupoMateriaDocencia[]> => {
  const estados = estado === 'todos' ? (['pendiente', 'aprobado', 'rechazado'] as const) : [estado];
  const resultados = await Promise.all(estados.map((item) => listarSolicitudesGrupoDocencia(item)));

  const mapa = new Map<string, GrupoMateriaDocencia>();
  for (const lista of resultados) {
    for (const grupo of lista) {
      mapa.set(grupo.id, grupo);
    }
  }

  return Array.from(mapa.values()).sort((a, b) => {
    const fechaA = new Date(String(a.createdAt ?? '')).getTime();
    const fechaB = new Date(String(b.createdAt ?? '')).getTime();
    const aValida = Number.isFinite(fechaA);
    const bValida = Number.isFinite(fechaB);
    if (aValida && bValida && fechaA !== fechaB) return fechaB - fechaA;
    return String(b.id ?? '').localeCompare(String(a.id ?? ''));
  });
};

export const crearGrupoAdministracionDocencia = async (dto: {
  docenteUsuarioId: number;
  sigla: string;
  nombre: string;
  descripcion: string;
  gestion?: string;
  fechaInicioInscripcion?: string;
  fechaFinInscripcion?: string;
  fechaInicioGestion?: string;
  fechaFinGestion?: string;
  grupo: string | number;
  codigoInscripcion?: string;
}): Promise<GrupoMateriaDocencia> => {
  const resp = await fetch(`${API_BASE}/administrador/docencia/grupos`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
    },
    body: JSON.stringify(dto),
  });
  if (!resp.ok) {
    const txt = await resp.text();
    throw new Error(txt || 'No se pudo crear el grupo por administración.');
  }
  return resp.json();
};

export const aprobarSolicitudGrupoDocencia = async (id: string): Promise<GrupoMateriaDocencia> => {
  const resp = await fetch(`${API_BASE}/administrador/docencia/solicitudes-grupo/${id}/aprobar`, {
    method: 'POST',
    headers: {
      ...authHeaders(),
    },
  });

  if (!resp.ok) {
    const txt = await resp.text();
    throw new Error(txt || 'No se pudo aprobar la solicitud.');
  }

  return resp.json();
};

export const rechazarSolicitudGrupoDocencia = async (id: string, motivo?: string): Promise<GrupoMateriaDocencia> => {
  const resp = await fetch(`${API_BASE}/administrador/docencia/solicitudes-grupo/${id}/rechazar`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
    },
    body: JSON.stringify({ motivo: motivo?.trim() || null }),
  });

  if (!resp.ok) {
    const txt = await resp.text();
    throw new Error(txt || 'No se pudo rechazar la solicitud.');
  }

  return resp.json();
};

export const editarGrupoDocencia = async (
  id: string,
  dto: {
    sigla?: string;
    nombre?: string;
    descripcion?: string;
    gestion?: string;
    codigoInscripcion?: string;
    fechaInicioInscripcion?: string;
    fechaFinInscripcion?: string;
    fechaInicioGestion?: string;
    fechaFinGestion?: string;
    grupo?: string | number;
    maxEstudiantesGrupo?: number;
    activo?: boolean;
    permitirInscripcion?: boolean;
  },
): Promise<GrupoMateriaDocencia> => {
  const resp = await fetch(`${API_BASE}/docencia/materias/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
    },
    body: JSON.stringify(dto),
  });
  if (!resp.ok) {
    const txt = await resp.text();
    throw new Error(txt || 'No se pudo editar la materia.');
  }
  return resp.json();
};

export const eliminarGrupoDocencia = async (id: string): Promise<void> => {
  const resp = await fetch(`${API_BASE}/docencia/materias/${id}`, {
    method: 'DELETE',
    headers: {
      ...authHeaders(),
    },
  });
  if (!resp.ok) throw new Error('No se pudo eliminar la materia.');
};



export const listarSubgruposPrestamoDocencia = async (id: string): Promise<SubgrupoPrestamoDocencia[]> => {
  const resp = await fetch(`${API_BASE}/docencia/materias/${id}/subgrupos`, {
    headers: {
      ...authHeaders(),
    },
  });

  if (!resp.ok) {
    const txt = await resp.text();
    throw new Error(txt || 'No se pudieron cargar los subgrupos.');
  }

  return resp.json();
};

export const crearSubgrupoPrestamoDocencia = async (
  id: string,
  dto: {
    codigo: string;
    nombre?: string;
    descripcion?: string;
    estudianteIds?: number[];
    responsableEstudianteId?: number | null;
  },
): Promise<SubgrupoPrestamoDocencia> => {
  const resp = await fetch(`${API_BASE}/docencia/materias/${id}/subgrupos`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
    },
    body: JSON.stringify(dto),
  });

  if (!resp.ok) {
    const txt = await resp.text();
    throw new Error(txt || 'No se pudo crear el subgrupo.');
  }

  return resp.json();
};

export const editarSubgrupoPrestamoDocencia = async (
  id: string,
  subgrupoId: string,
  dto: {
    codigo?: string;
    nombre?: string;
    descripcion?: string;
    habilitado?: boolean;
    estudianteIds?: number[];
    responsableEstudianteId?: number | null;
  },
): Promise<SubgrupoPrestamoDocencia> => {
  const resp = await fetch(`${API_BASE}/docencia/materias/${id}/subgrupos/${subgrupoId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
    },
    body: JSON.stringify(dto),
  });

  if (!resp.ok) {
    const txt = await resp.text();
    throw new Error(txt || 'No se pudo editar el subgrupo.');
  }

  return resp.json();
};

export const eliminarSubgrupoPrestamoDocencia = async (id: string, subgrupoId: string): Promise<void> => {
  const resp = await fetch(`${API_BASE}/docencia/materias/${id}/subgrupos/${subgrupoId}`, {
    method: 'DELETE',
    headers: {
      ...authHeaders(),
    },
  });

  if (!resp.ok) {
    const txt = await resp.text();
    throw new Error(txt || 'No se pudo eliminar el subgrupo.');
  }
};

export const inscribirseMateriaPorCodigo = async (codigo: string, carreras?: string[]): Promise<{ ok: boolean; message?: string }> => {
  const resp = await fetch(`${API_BASE}/docencia/materias/inscribir-codigo`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
    },
    body: JSON.stringify({ codigo, carreras }),
  });
  if (!resp.ok) {
    const data = await resp.json().catch(() => null);
    throw new Error(data?.message || 'No se pudo registrar la inscripción.');
  }
  return resp.json();
};

export const inscribirseMateriaPublicaPorCodigo = async (codigo: string, carnet: string, carreras?: string[]): Promise<{ ok: boolean; message?: string }> => {
  const resp = await fetch(`${API_BASE}/docencia/materias/inscribir-codigo-publico`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ codigo, carnet, carreras }),
  });
  if (!resp.ok) {
    const data = await resp.json().catch(() => null);
    throw new Error(data?.message || 'No se pudo registrar la inscripción.');
  }
  return resp.json();
};

export const listarSolicitudesDocencia = async (): Promise<SolicitudMaterialDocencia[]> => {
  const resp = await fetch(`${API_BASE}/docencia/solicitudes`, {
    headers: {
      ...authHeaders(),
    },
  });
  if (!resp.ok) throw new Error('No se pudieron cargar las solicitudes.');
  return resp.json();
};

export const crearSolicitudDocencia = async (dto: {
  grupoId?: string | null;
  responsableEstudianteId?: number | null;
  detalle?: string | null;
}): Promise<SolicitudMaterialDocencia> => {
  const resp = await fetch(`${API_BASE}/docencia/solicitudes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
    },
    body: JSON.stringify(dto),
  });
  if (!resp.ok) {
    const txt = await resp.text();
    throw new Error(txt || 'No se pudo crear la solicitud.');
  }
  return resp.json();
};

export const aprobarSolicitudDocencia = async (id: string): Promise<SolicitudMaterialDocencia> => {
  const resp = await fetch(`${API_BASE}/docencia/solicitudes/${id}/aprobar`, {
    method: 'POST',
    headers: {
      ...authHeaders(),
    },
  });
  if (!resp.ok) {
    const txt = await resp.text();
    throw new Error(txt || 'No se pudo aprobar la solicitud.');
  }
  return resp.json();
};

export const generarUrlFirmadaSolicitudPdf = async (id: string): Promise<UrlFirmadaPdfDocencia> => {
  const resp = await fetch(`${API_BASE}/docencia/solicitudes/${id}/url-firmada`, {
    method: 'POST',
    headers: {
      ...authHeaders(),
    },
  });
  if (!resp.ok) throw new Error('No se pudo generar la URL firmada.');
  return resp.json();
};

export const subirPdfSolicitudFirmada = async (params: {
  id: string;
  rid: string;
  exp: string;
  sig: string;
  archivo: File;
}): Promise<{ ok: boolean; message?: string }> => {
  const form = new FormData();
  form.append('archivo', params.archivo);

  const url = `${API_BASE}/docencia/solicitudes/${encodeURIComponent(params.id)}/subir-pdf?rid=${encodeURIComponent(params.rid)}&exp=${encodeURIComponent(params.exp)}&sig=${encodeURIComponent(params.sig)}`;

  const resp = await fetch(url, {
    method: 'POST',
    body: form,
  });

  try {
    return await resp.json();
  } catch {
    return { ok: false, message: 'No se pudo subir el PDF.' };
  }
};

export const listarSolicitudesPendientesAlmacen = async (): Promise<SolicitudMaterialDocencia[]> => {
  const resp = await fetch(`${API_BASE}/docencia/almacen/solicitudes`, {
    headers: {
      ...authHeaders(),
    },
  });
  if (!resp.ok) throw new Error('No se pudieron cargar solicitudes pendientes.');
  return resp.json();
};

export const aprobarSolicitudAlmacen = async (id: string): Promise<SolicitudMaterialDocencia> => {
  const resp = await fetch(`${API_BASE}/docencia/almacen/solicitudes/${id}/aprobar`, {
    method: 'POST',
    headers: {
      ...authHeaders(),
    },
  });
  if (!resp.ok) throw new Error('No se pudo aprobar la solicitud.');
  return resp.json();
};

export const rechazarSolicitudAlmacen = async (id: string, motivo?: string): Promise<SolicitudMaterialDocencia> => {
  const resp = await fetch(`${API_BASE}/docencia/almacen/solicitudes/${id}/rechazar`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
    },
    body: JSON.stringify({ motivo }),
  });
  if (!resp.ok) throw new Error('No se pudo rechazar la solicitud.');
  return resp.json();
};

export const generarSubgruposAlAzarDocencia = async (id: string): Promise<SubgrupoPrestamoDocencia[]> => {
  const resp = await fetch(`${API_BASE}/docencia/materias/${id}/subgrupos/generar-azar`, {
    method: 'POST',
    headers: {
      ...authHeaders(),
    },
  });

  if (!resp.ok) {
    const txt = await resp.text();
    throw new Error(txt || 'No se pudieron generar los subgrupos al azar.');
  }

  return resp.json();
};

export const eliminarTodosSubgruposPrestamoDocencia = async (id: string): Promise<void> => {
  const resp = await fetch(`${API_BASE}/docencia/materias/${id}/subgrupos`, {
    method: 'DELETE',
    headers: {
      ...authHeaders(),
    },
  });

  if (!resp.ok) {
    const txt = await resp.text();
    throw new Error(txt || 'No se pudieron eliminar los subgrupos.');
  }
};

export const listarEstudiantesInscritosMateria = async (id: string): Promise<Array<{ id: number; nombre: string; apellido: string; carnet: string; carrera: string }>> => {
  const resp = await fetch(`${API_BASE}/docencia/materias/${id}/estudiantes-inscritos`, {
    headers: {
      ...authHeaders(),
    },
  });

  if (!resp.ok) {
    const txt = await resp.text();
    throw new Error(txt || 'No se pudieron cargar los estudiantes inscritos.');
  }

  return resp.json();
};

export const actualizarCompanerosSubgrupoLider = async (subgrupoId: string, estudianteIds: number[]): Promise<SubgrupoPrestamoDocencia> => {
  const resp = await fetch(`${API_BASE}/docencia/subgrupos/${subgrupoId}/companeros`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
    },
    body: JSON.stringify({ estudianteIds }),
  });

  if (!resp.ok) {
    const txt = await resp.text();
    throw new Error(txt || 'No se pudieron actualizar los compañeros.');
  }

  return resp.json();
};
export const desinscribirEstudianteMateria = async (id: string, estudianteId: number, carrera?: string): Promise<void> => {
  const url = carrera
    ? `${API_BASE}/docencia/materias/${id}/estudiantes/${estudianteId}?carrera=${encodeURIComponent(carrera)}`
    : `${API_BASE}/docencia/materias/${id}/estudiantes/${estudianteId}`;
  const resp = await fetch(url, {
    method: 'DELETE',
    headers: {
      ...authHeaders(),
    },
  });
  if (!resp.ok) {
    const txt = await resp.text();
    throw new Error(txt || 'No se pudo quitar al estudiante de la materia.');
  }
};

export const desinscribirTodosEstudiantesMateria = async (id: string): Promise<void> => {
  const resp = await fetch(`${API_BASE}/docencia/materias/${id}/estudiantes`, {
    method: 'DELETE',
    headers: {
      ...authHeaders(),
    },
  });
  if (!resp.ok) {
    const txt = await resp.text();
    throw new Error(txt || 'No se pudieron quitar los estudiantes de la materia.');
  }
};


