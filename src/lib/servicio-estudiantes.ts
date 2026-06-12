import { API_BASE_URL } from './api';
import { obtenerToken } from './servicio-autenticacion';
import type { 
    EstudianteApi 
} from '@/tipos/api';
import type { Estudiante, EstudianteCarreraNormalizada } from '@/tipos/inventario';
import type { CrearUsuarioEstudiantePayload, UsuarioSesion } from '@/tipos/autenticacion';

const API_BASE = API_BASE_URL;

const authHeaders = () => {
    const token = obtenerToken();
    if (!token) {
        throw new Error('Tu sesión expiró. Inicia sesión nuevamente.');
    }
    return { Authorization: `Bearer ${token}` };
};

const mapEstudianteApi = (e: EstudianteApi): Estudiante => {
    const asignacionesCarrera: EstudianteCarreraNormalizada[] = (e.asignacionesCarrera ?? [])
        .map((asignacion: any): EstudianteCarreraNormalizada | null => {
            const carreraVal = asignacion.carrera;
            const carreraNombre = typeof carreraVal === 'object' && carreraVal !== null
                ? String(carreraVal.nombre ?? '').trim()
                : typeof carreraVal === 'string'
                    ? carreraVal.trim()
                    : '';
            
            const cu = String(asignacion.cu ?? '').trim().toUpperCase();
            if (!carreraNombre || !cu) return null;

            const carreraId = typeof carreraVal === 'object' && carreraVal !== null && carreraVal.id != null
                ? String(carreraVal.id)
                : asignacion.carreraId != null
                    ? String(asignacion.carreraId)
                    : undefined;

            const prefijoCu = typeof carreraVal === 'object' && carreraVal !== null
                ? (carreraVal.prefijoCu ?? null)
                : asignacion.prefijoCu != null
                    ? String(asignacion.prefijoCu)
                    : null;

            return {
                carreraId,
                carrera: carreraNombre,
                cu,
                prefijoCu,
            };
        })
        .filter((asignacion): asignacion is EstudianteCarreraNormalizada => asignacion !== null);

    const asignacionesNormalizadas: EstudianteCarreraNormalizada[] = asignacionesCarrera.length > 0
        ? asignacionesCarrera
        : (() => {
            const carrera = String(e.carreraRef?.nombre ?? e.carrera ?? '').trim();
            const cu = String(e.cu ?? '').trim().toUpperCase();
            if (!carrera || !cu) return [];
            return [{
                carreraId: e.carreraRef?.id != null ? String(e.carreraRef.id) : undefined,
                carrera,
                cu,
                prefijoCu: e.carreraRef?.prefijoCu ?? null,
            }];
        })();

    return {
        id: String(e.id),
        carnet: e.carnet,
        cu: asignacionesNormalizadas[0]?.cu ?? (e.cu ? String(e.cu).trim().toUpperCase() : undefined),
        nombre: e.nombre,
        apellido: e.apellido,
        carrera: asignacionesNormalizadas[0]?.carrera ?? e.carrera,
        carreras: asignacionesNormalizadas.map((asignacion) => asignacion.carrera),
        cus: asignacionesNormalizadas.map((asignacion) => asignacion.cu),
        asignacionesCarrera: asignacionesNormalizadas,

        carnetRetenido: Boolean(e.carnetRetenido),
        carnetRetenidoOverride: typeof e.carnetRetenidoOverride === 'boolean' ? e.carnetRetenidoOverride : null,
        correo: e.correo,
        fechaNacimiento: e.fechaNacimiento,
        estadoAprobacion: e.estadoAprobacion,
    };
};

export const cargarEstudiantesDesdeBackend = async (): Promise<Estudiante[]> => {
    const resp = await fetch(`${API_BASE}/prestamos/estudiantes`, {
        headers: authHeaders(),
    });
    if (!resp.ok) throw new Error('No se pudo cargar estudiantes desde backend');
    const apiEstudiantes = (await resp.json()) as EstudianteApi[];

    return apiEstudiantes.map(mapEstudianteApi);
};

export const crearEstudianteEnBackend = async (payload: Omit<Estudiante, 'id'>): Promise<Estudiante> => {
    const { carnet, ...resto } = payload;
    const body = { ...resto, ci: (payload as any).ci ?? carnet };
    const resp = await fetch(`${API_BASE}/prestamos/estudiantes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify(body),
    });

    if (!resp.ok) {
        const txt = await resp.text();
        throw new Error(txt || 'No se pudo crear estudiante');
    }

    const e = (await resp.json()) as EstudianteApi;
    return mapEstudianteApi(e);
};

export const editarEstudianteEnBackend = async (id: string, payload: Partial<Omit<Estudiante, 'id'>>): Promise<Estudiante> => {
    const { carnet, ...resto } = payload;
    const body = { ...resto, ci: (payload as any).ci ?? carnet };
    const resp = await fetch(`${API_BASE}/prestamos/estudiantes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify(body),
    });

    if (!resp.ok) {
        const txt = await resp.text();
        throw new Error(txt || 'No se pudo editar estudiante');
    }

    const e = (await resp.json()) as EstudianteApi;
    return mapEstudianteApi(e);
};

export const eliminarEstudianteEnBackend = async (id: string): Promise<void> => {
    const resp = await fetch(`${API_BASE}/prestamos/estudiantes/${id}`, {
        method: 'DELETE',
        headers: authHeaders(),
    });

    if (!resp.ok) {
        const txt = await resp.text();
        throw new Error(txt || 'No se pudo eliminar estudiante');
    }
};

export const actualizarRetencionCueEnBackend = async (
    id: string,
    payload: { carnetRetenido?: boolean; carnetRetenidoOverride?: boolean | null }
): Promise<Estudiante> => {
    const resp = await fetch(`${API_BASE}/prestamos/estudiantes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify(payload),
    });

    if (!resp.ok) {
        const txt = await resp.text();
        throw new Error(txt || 'No se pudo actualizar la retención de CU');
    }

    const e = (await resp.json()) as EstudianteApi;
    return mapEstudianteApi(e);
};

export const crearUsuarioEstudiantePorAdministrador = async (payload: CrearUsuarioEstudiantePayload): Promise<UsuarioSesion> => {
    const resp = await fetch(`${API_BASE}/prestamos/estudiantes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify(payload),
    });

    if (!resp.ok) {
        if (resp.status === 403) throw new Error('No tienes permisos para crear estudiantes.');
        if (resp.status === 401) throw new Error('Tu sesión expiró. Inicia sesión nuevamente.');
        const txt = await resp.text();
        throw new Error(txt || 'No se pudo crear el usuario estudiante.');
    }

    return resp.json();
};

export const cargarSolicitudesPendientesEstudiantes = async (): Promise<Estudiante[]> => {
    const resp = await fetch(`${API_BASE}/prestamos/estudiantes/solicitudes`, {
        headers: authHeaders(),
    });
    if (!resp.ok) throw new Error('No se pudo cargar las solicitudes de estudiantes');
    const apiEstudiantes = (await resp.json()) as EstudianteApi[];

    return apiEstudiantes.map(mapEstudianteApi);
};

export const aprobarEstudianteEnBackend = async (id: string): Promise<void> => {
    const resp = await fetch(`${API_BASE}/prestamos/estudiantes/${id}/aprobar`, {
        method: 'POST',
        headers: authHeaders(),
    });
    if (!resp.ok) {
        const txt = await resp.text();
        throw new Error(txt || 'No se pudo aprobar al estudiante');
    }
};

export const rechazarEstudianteEnBackend = async (id: string): Promise<void> => {
    const resp = await fetch(`${API_BASE}/prestamos/estudiantes/${id}/rechazar`, {
        method: 'POST',
        headers: authHeaders(),
    });
    if (!resp.ok) {
        const txt = await resp.text();
        throw new Error(txt || 'No se pudo rechazar al estudiante');
    }
};


