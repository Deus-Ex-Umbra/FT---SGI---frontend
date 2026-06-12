import { API_BASE_URL } from './api';
import { obtenerToken } from './servicio-autenticacion';
import type { 
    DocenteApi 
} from '@/tipos/api';
import type { Docente } from '@/tipos/inventario';
import type { CrearUsuarioDocentePayload, UsuarioSesion } from '@/tipos/autenticacion';

const API_BASE = API_BASE_URL;

const authHeaders = () => {
    const token = obtenerToken();
    if (!token) {
        throw new Error('Tu sesión expiró. Inicia sesión nuevamente.');
    }
    return { Authorization: `Bearer ${token}` };
};

const soloFecha = (iso?: string | null): string | null => {
    if (!iso) return null;
    const parts = iso.split('T');
    return parts[0] || null;
};

const mapDocenteApi = (d: DocenteApi): Docente => {
    const materiasDesdeCatalogo = (d.materias ?? []).map((materia) => ({
        id: String(materia.id),
        codigo: String(materia.codigo),
        nombre: materia.nombre ?? null,
    }));

    const codigosAsignados = Array.isArray(d.materiasAsignadas)
        ? d.materiasAsignadas.map((c) => String(c).trim().toUpperCase()).filter(Boolean)
        : [];

    const materiasDesdeCodigos = codigosAsignados.map((codigo) => ({
        id: codigo,
        codigo,
        nombre: null,
    }));

    return {
        id: String(d.id),
        correo: String(d.correo ?? ''),
        codigo: String(d.codigo ?? '').trim(),
        nombre: String(d.nombre ?? '').trim(),
        apellido: String(d.apellido ?? '').trim(),
        materia: String(d.materia ?? '').trim(),
        carnet: String(d.carnet ?? d.ci ?? '').trim(),
        materias: materiasDesdeCatalogo.length > 0 ? materiasDesdeCatalogo : materiasDesdeCodigos,
        fechaNacimiento: soloFecha(d.fechaNacimiento) ?? undefined,
        carreras: (d.carreras ?? []).map((c) => ({
            id: String(c.id),
            nombre: c.nombre,
            prefijoCu: c.prefijoCu ?? '',
        })),
        carrerasIds: d.carrerasIds ?? (d.carreras ?? []).map((c) => Number(c.id)),
    };
};

export const cargarDocentesDesdeBackend = async (): Promise<Docente[]> => {
    const resp = await fetch(`${API_BASE}/prestamos/docentes`, {
        headers: authHeaders(),
    });
    if (!resp.ok) throw new Error('No se pudo cargar docentes desde backend');
    const apiDocentes = (await resp.json()) as DocenteApi[];

    return apiDocentes.map(mapDocenteApi);
};

export const crearDocenteEnBackend = async (payload: Omit<Docente, 'id'>): Promise<Docente> => {
    const { carnet, ...resto } = payload;
    const body = { ...resto, ci: carnet };
    const resp = await fetch(`${API_BASE}/prestamos/docentes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify(body),
    });

    if (!resp.ok) {
        const txt = await resp.text();
        throw new Error(txt || 'No se pudo crear docente');
    }

    const d = (await resp.json()) as DocenteApi;
    return mapDocenteApi(d);
};

export const editarDocenteEnBackend = async (id: string, payload: Partial<Omit<Docente, 'id'>>): Promise<Docente> => {
    const { carnet, ...resto } = payload;
    const body = carnet !== undefined ? { ...resto, ci: carnet } : resto;
    const resp = await fetch(`${API_BASE}/prestamos/docentes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify(body),
    });

    if (!resp.ok) {
        const txt = await resp.text();
        throw new Error(txt || 'No se pudo editar docente');
    }

    const d = (await resp.json()) as DocenteApi;
    return mapDocenteApi(d);
};

export const eliminarDocenteEnBackend = async (id: string): Promise<void> => {
    const resp = await fetch(`${API_BASE}/prestamos/docentes/${id}`, {
        method: 'DELETE',
        headers: authHeaders(),
    });

    if (!resp.ok) {
        const txt = await resp.text();
        throw new Error(txt || 'No se pudo eliminar docente');
    }
};

export const listarDocentesAdmin = async (): Promise<UsuarioSesion[]> => {
    const respuesta = await fetch(`${API_BASE}/prestamos/docentes`, {
        headers: authHeaders(),
    });
    if (!respuesta.ok) {
        if (respuesta.status === 403) throw new Error('No tienes permisos para ver docentes.');
        if (respuesta.status === 401) throw new Error('Tu sesión expiró. Inicia sesión nuevamente.');
        throw new Error('No se pudo cargar la lista de docentes.');
    }
    return respuesta.json();
};

export const crearUsuarioDocentePorAdministrador = async (payload: CrearUsuarioDocentePayload): Promise<UsuarioSesion> => {
    const respuesta = await fetch(`${API_BASE}/prestamos/docentes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify(payload),
    });
    if (!respuesta.ok) {
        if (respuesta.status === 403) throw new Error('No tienes permisos para crear docentes.');
        if (respuesta.status === 401) throw new Error('Tu sesión expiró. Inicia sesión nuevamente.');
        const txt = await respuesta.text();
        throw new Error(txt || 'No se pudo crear el usuario docente.');
    }
    return respuesta.json();
};

