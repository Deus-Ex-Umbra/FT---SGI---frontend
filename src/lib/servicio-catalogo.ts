import { API_BASE_URL } from './api';
import { obtenerToken } from './servicio-autenticacion';
import type { 
    MateriaApi, 
    CarreraApi 
} from '@/tipos/api';
import type { Materia, Carrera } from '@/tipos/inventario';
import type { CarreraRegistroPublico, CarreraRegistroApi } from '@/tipos/autenticacion';

const API_BASE = API_BASE_URL;

const authHeaders = () => {
    const token = obtenerToken();
    if (!token) {
        throw new Error('Tu sesión expiró. Inicia sesión nuevamente.');
    }
    return { Authorization: `Bearer ${token}` };
};

export const cargarMateriasDesdeBackend = async (): Promise<Materia[]> => {
    const resp = await fetch(`${API_BASE}/prestamos/materias`, {
        headers: authHeaders(),
    });
    if (!resp.ok) throw new Error('No se pudo cargar materias desde backend');
    const apiMaterias = (await resp.json()) as MateriaApi[];

    return apiMaterias.map((m) => ({
        id: String(m.id),
        codigo: m.codigo,
        nombre: m.nombre ?? '',
        descripcion: m.descripcion ?? '',
        carrerasIds: (m.carrerasIds ?? []).map(String),
        docentesIds: (m.docentesIds ?? []).map(String),
        carrerasHabilitadas: (m.carrerasHabilitadas ?? []).map((c) => ({
            id: String(c.id),
            nombre: c.nombre,
            prefijoCu: c.prefijoCu ?? null,
        })),
        docentesAsignados: (m.docentesAsignados ?? []).map((d) => ({
            id: String(d.id),
            codigo: d.codigo,
            nombre: d.nombre,
            apellido: d.apellido,
            correo: d.correo ?? '',
        })),
    }));
};

export const crearMateriaEnBackend = async (payload: {
    codigo: string;
    nombre?: string | null;
    descripcion?: string | null;
    carrerasIds?: string[];
    docentesIds?: string[];
}): Promise<Materia> => {
    const resp = await fetch(`${API_BASE}/administrador/catalogo/materias`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify(payload),
    });

    if (!resp.ok) {
        const txt = await resp.text();
        throw new Error(txt || 'No se pudo crear materia');
    }

    const m = (await resp.json()) as MateriaApi;
    return {
        id: String(m.id),
        codigo: m.codigo,
        nombre: m.nombre ?? '',
        descripcion: m.descripcion ?? '',
        carrerasIds: (m.carrerasIds ?? []).map(String),
        docentesIds: (m.docentesIds ?? []).map(String),
        carrerasHabilitadas: (m.carrerasHabilitadas ?? []).map((c) => ({
            id: String(c.id),
            nombre: c.nombre,
            prefijoCu: c.prefijoCu ?? null,
        })),
        docentesAsignados: (m.docentesAsignados ?? []).map((d) => ({
            id: String(d.id),
            codigo: d.codigo,
            nombre: d.nombre,
            apellido: d.apellido,
            correo: d.correo ?? '',
        })),
    };
};

export const editarMateriaEnBackend = async (
    id: string,
    payload: Partial<{ nombre: string | null; descripcion: string | null; carrerasIds: string[]; docentesIds: string[] }>,
): Promise<Materia> => {
    const resp = await fetch(`${API_BASE}/administrador/catalogo/materias/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify(payload),
    });

    if (!resp.ok) {
        const txt = await resp.text();
        throw new Error(txt || 'No se pudo editar materia');
    }

    const m = (await resp.json()) as MateriaApi;
    return {
        id: String(m.id),
        codigo: m.codigo,
        nombre: m.nombre ?? '',
        descripcion: m.descripcion ?? '',
        carrerasIds: (m.carrerasIds ?? []).map(String),
        docentesIds: (m.docentesIds ?? []).map(String),
        carrerasHabilitadas: (m.carrerasHabilitadas ?? []).map((c) => ({
            id: String(c.id),
            nombre: c.nombre,
            prefijoCu: c.prefijoCu ?? null,
        })),
        docentesAsignados: (m.docentesAsignados ?? []).map((d) => ({
            id: String(d.id),
            codigo: d.codigo,
            nombre: d.nombre,
            apellido: d.apellido,
            correo: d.correo ?? '',
        })),
    };
};

export const eliminarMateriaEnBackend = async (id: string): Promise<void> => {
    const resp = await fetch(`${API_BASE}/administrador/catalogo/materias/${id}`, {
        method: 'DELETE',
        headers: authHeaders(),
    });

    if (!resp.ok) {
        const txt = await resp.text();
        throw new Error(txt || 'No se pudo eliminar materia');
    }
};

export const cargarCarrerasDesdeBackend = async (): Promise<Carrera[]> => {
    const resp = await fetch(`${API_BASE}/prestamos/carreras`, {
        headers: authHeaders(),
    });
    if (!resp.ok) throw new Error('No se pudo cargar carreras desde backend');
    const apiCarreras = (await resp.json()) as CarreraApi[];

    return apiCarreras.map((c) => ({
        id: String(c.id),
        nombre: c.nombre,
        prefijoCu: c.prefijoCu || '',
        inventarios: c.inventarios ?? [],
        inventariosIds: c.inventariosIds ?? (c.inventarios ?? []).map(i => Number(i.id)),
    }));
};

export const crearCarreraEnBackend = async (payload: { nombre: string; prefijoCu: string; inventariosIds?: number[] }): Promise<Carrera> => {
    const resp = await fetch(`${API_BASE}/administrador/catalogo/carreras`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify(payload),
    });

    if (!resp.ok) {
        const txt = await resp.text();
        throw new Error(txt || 'No se pudo crear carrera');
    }

    const c = (await resp.json()) as CarreraApi;
    return {
        id: String(c.id),
        nombre: c.nombre,
        prefijoCu: c.prefijoCu || '',
        inventarios: c.inventarios ?? [],
        inventariosIds: c.inventariosIds ?? (c.inventarios ?? []).map(i => Number(i.id)),
    };
};

export const editarCarreraEnBackend = async (id: string, payload: Partial<{ nombre: string; prefijoCu: string; inventariosIds: number[] }>): Promise<Carrera> => {
    const resp = await fetch(`${API_BASE}/administrador/catalogo/carreras/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify(payload),
    });

    if (!resp.ok) {
        const txt = await resp.text();
        throw new Error(txt || 'No se pudo editar carrera');
    }

    const c = (await resp.json()) as CarreraApi;
    return {
        id: String(c.id),
        nombre: c.nombre,
        prefijoCu: c.prefijoCu || '',
        inventarios: c.inventarios ?? [],
        inventariosIds: c.inventariosIds ?? (c.inventarios ?? []).map(i => Number(i.id)),
    };
};

export const eliminarCarreraEnBackend = async (id: string): Promise<void> => {
    const resp = await fetch(`${API_BASE}/administrador/catalogo/carreras/${id}`, {
        method: 'DELETE',
        headers: authHeaders(),
    });

    if (!resp.ok) {
        const txt = await resp.text();
        throw new Error(txt || 'No se pudo eliminar carrera');
    }
};

export const obtenerCarrerasRegistroPublico = async (): Promise<CarreraRegistroPublico[]> => {
    const respuesta = await fetch(`${API_BASE}/prestamos/carreras`);

    if (!respuesta.ok) {
        const texto = await respuesta.text();
        throw new Error(texto || 'No se pudieron cargar las carreras.');
    }

    const carreras = (await respuesta.json()) as CarreraRegistroApi[];
    return carreras.map((carrera) => ({
        id: String(carrera.id),
        nombre: carrera.nombre,
        prefijoCu: String(carrera.prefijoCu ?? '').trim(),
    }));
};

