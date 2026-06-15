import { API_BASE_URL } from './api';
import { obtenerToken } from './servicio-autenticacion';
import type { 
    PrestamoApi, 
    PrestamoCanastaApi, 
    CrearPrestamoApi, 
    DashboardEstudiante,
    RegistroHistorialPrestamoApi
} from '@/tipos/api';
import type { Prestamo, EstadoPrestamo, PrestamoCanastaRegistro } from '@/tipos/inventario';
import { localToApiDateTime } from '@/utilidades/fechas';

const API_BASE = API_BASE_URL;

const authHeaders = () => {
    const token = obtenerToken();
    if (!token) {
        throw new Error('Tu sesión expiró. Inicia sesión nuevamente.');
    }
    return { Authorization: `Bearer ${token}` };
};

const soloFecha = (fecha?: string | null) => (fecha ? String(fecha) : null);

export const cargarPrestamosDesdeBackend = async (): Promise<Prestamo[]> => {
    const resp = await fetch(`${API_BASE}/prestamos`, {
        headers: authHeaders(),
    });
    if (!resp.ok) throw new Error('No se pudo cargar préstamos desde backend');
    const apiPrestamos = (await resp.json()) as PrestamoApi[];

    return apiPrestamos.map((p) => ({
        id: String(p.id),
        carnetEstudiante: p.carnetEstudiante,
        idHerramienta: p.idHerramienta,
        grupoCanasta: p.grupoCanasta,
        codigo: p.codigo,
        fechaPrestamo: soloFecha(p.fechaPrestamo) || '',
        fechaDevolucion: soloFecha(p.fechaDevolucion),
        estado: p.estado as EstadoPrestamo,
        docente: p.docente,
        observaciones: p.observaciones || '',
    }));
};

export const cargarCanastasPrestamoDesdeBackend = async (): Promise<PrestamoCanastaRegistro[]> => {
    const resp = await fetch(`${API_BASE}/prestamos/canastas`, {
        headers: authHeaders(),
    });
    if (!resp.ok) throw new Error('No se pudieron cargar las canastas de préstamo');
    const data = (await resp.json()) as PrestamoCanastaApi[];
    return data.map((c) => ({
        id: String(c.id),
        grupoCanasta: c.grupoCanasta,
        codigo: c.codigo,
        idsPrestamo: c.idsPrestamo,
        carnetEstudiante: c.carnetEstudiante,
        carnetsEstudiantes: c.carnetsEstudiantes,
        estudiantes: c.estudiantes?.map(e => ({
            ...e,
            carnetRetenido: (e as any).carnetRetenido,
        })),
        idDocente: c.idDocente,
        docente: c.docente,
        fechaPrestamo: soloFecha(c.fechaPrestamo) || '',
        fechaDevolucion: soloFecha(c.fechaDevolucion),
        estado: c.estado as EstadoPrestamo,
        observaciones: c.observaciones,
        totalActivos: c.totalActivos,
        totalConsumibles: c.totalConsumibles,
        totalCosas: c.totalCosas,
        cosas: c.cosas?.map((co) => ({
            idHerramienta: co.idHerramienta,
            codigoInventario: co.codigoInventario,
            nombre: co.nombre,
            registrado: co.registrado,
            estadoFisicoEntrega: (co as any).estadoFisicoEntrega,
            estadoFisicoDevolucion: (co as any).estadoFisicoDevolucion,
        })),
        consumibles: c.consumibles?.map((con) => ({
            idLote: con.idLote,
            lote: con.lote,
            material: con.material,
            cantidadSolicitada: (con as any).cantidadSolicitada ?? con.cantidad,
            cantidadDespachada: (con as any).cantidadDespachada ?? con.cantidad,
            cantidadDevuelta: (con as any).cantidadDevuelta,
            motivo: con.motivo,
            estadoDevuelto: (con as any).estadoDevuelto,
            fecha: con.fecha,
        })),
        motivoRechazo: (c as any).motivoRechazo,
    }));
};

export const crearPrestamoEnBackend = async (payload: CrearPrestamoApi): Promise<Prestamo> => {
    const body = {
        ...payload,
        fechaPrestamo: localToApiDateTime(payload.fechaPrestamo) || '',
        fechaDevolucion: localToApiDateTime(payload.fechaDevolucion) || '',
    };
    const resp = await fetch(`${API_BASE}/prestamos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify(body),
    });

    if (!resp.ok) {
        const txt = await resp.text();
        throw new Error(txt || 'No se pudo crear préstamo');
    }

    const p = (await resp.json()) as PrestamoApi;
    return {
        id: String(p.id),
        carnetEstudiante: p.carnetEstudiante,
        idHerramienta: p.idHerramienta,
        grupoCanasta: p.grupoCanasta,
        codigo: p.codigo,
        fechaPrestamo: soloFecha(p.fechaPrestamo) || '',
        fechaDevolucion: soloFecha(p.fechaDevolucion),
        estado: p.estado as EstadoPrestamo,
        docente: p.docente,
        observaciones: p.observaciones || '',
    };
};

export const editarPrestamoEnBackend = async (id: string, payload: Partial<{
    carnetEstudiante: string;
    idHerramienta: string;
    fechaPrestamo: string;
    fechaDevolucion: string | null;
    observaciones: string;
    idDocente: number;
    estado: EstadoPrestamo;
    carnetRetenido?: boolean;
}>): Promise<Prestamo> => {
    const body = { ...payload };
    if (body.fechaPrestamo !== undefined) body.fechaPrestamo = localToApiDateTime(body.fechaPrestamo);
    if (body.fechaDevolucion !== undefined && body.fechaDevolucion !== null) {
        body.fechaDevolucion = localToApiDateTime(body.fechaDevolucion);
    }
    const resp = await fetch(`${API_BASE}/prestamos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify(body),
    });

    if (!resp.ok) {
        const txt = await resp.text();
        throw new Error(txt || 'No se pudo editar préstamo');
    }

    const p = (await resp.json()) as PrestamoApi;
    return {
        id: String(p.id),
        carnetEstudiante: p.carnetEstudiante,
        idHerramienta: p.idHerramienta,
        grupoCanasta: p.grupoCanasta,
        codigo: p.codigo,
        fechaPrestamo: soloFecha(p.fechaPrestamo) || '',
        fechaDevolucion: soloFecha(p.fechaDevolucion),
        estado: p.estado as EstadoPrestamo,
        docente: p.docente,
        observaciones: p.observaciones || '',
    };
};

export const extenderPrestamoEnBackend = async (id: string, fechaDevolucion: string): Promise<Prestamo> => {
    const resp = await fetch(`${API_BASE}/prestamos/${id}/extender`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ fechaDevolucion: localToApiDateTime(fechaDevolucion) }),
    });

    if (!resp.ok) {
        const txt = await resp.text();
        throw new Error(txt || 'No se pudo extender préstamo');
    }

    const p = (await resp.json()) as PrestamoApi;
    return {
        id: String(p.id),
        carnetEstudiante: p.carnetEstudiante,
        idHerramienta: p.idHerramienta,
        grupoCanasta: p.grupoCanasta,
        codigo: p.codigo,
        fechaPrestamo: soloFecha(p.fechaPrestamo) || '',
        fechaDevolucion: soloFecha(p.fechaDevolucion),
        estado: p.estado as EstadoPrestamo,
        docente: p.docente,
        observaciones: p.observaciones || '',
    };
};

export const aceptarPrestamoEnBackend = async (id: string): Promise<Prestamo> => {
    const resp = await fetch(`${API_BASE}/prestamos/${id}/aceptar`, {
        method: 'PUT',
        headers: authHeaders(),
    });
    if (!resp.ok) throw new Error(await resp.text() || 'No se pudo aceptar el préstamo');
    const p = (await resp.json()) as PrestamoApi;
    return {
        id: String(p.id),
        carnetEstudiante: p.carnetEstudiante,
        idHerramienta: p.idHerramienta,
        grupoCanasta: p.grupoCanasta,
        codigo: p.codigo,
        fechaPrestamo: soloFecha(p.fechaPrestamo) || '',
        fechaDevolucion: soloFecha(p.fechaDevolucion),
        estado: p.estado as EstadoPrestamo,
        docente: p.docente,
        observaciones: p.observaciones || '',
    };
};

export const rechazarPrestamoEnBackend = async (id: string, motivo: string): Promise<Prestamo> => {
    const resp = await fetch(`${API_BASE}/prestamos/${id}/rechazar`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ motivo }),
    });
    if (!resp.ok) throw new Error(await resp.text() || 'No se pudo rechazar el préstamo');
    const p = (await resp.json()) as PrestamoApi;
    return {
        id: String(p.id),
        carnetEstudiante: p.carnetEstudiante,
        idHerramienta: p.idHerramienta,
        grupoCanasta: p.grupoCanasta,
        codigo: p.codigo,
        fechaPrestamo: soloFecha(p.fechaPrestamo) || '',
        fechaDevolucion: soloFecha(p.fechaDevolucion),
        estado: p.estado as EstadoPrestamo,
        docente: p.docente,
        observaciones: p.observaciones || '',
    };
};

export const despacharPrestamoEnBackend = async (id: string, payload: { estadoFisicoEntrega?: string; carnetRetenido?: boolean }): Promise<Prestamo> => {
    const resp = await fetch(`${API_BASE}/prestamos/${id}/despachar`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify(payload),
    });
    if (!resp.ok) throw new Error(await resp.text() || 'No se pudo despachar el préstamo');
    const p = (await resp.json()) as PrestamoApi;
    return {
        id: String(p.id),
        carnetEstudiante: p.carnetEstudiante,
        idHerramienta: p.idHerramienta,
        grupoCanasta: p.grupoCanasta,
        codigo: p.codigo,
        fechaPrestamo: soloFecha(p.fechaPrestamo) || '',
        fechaDevolucion: soloFecha(p.fechaDevolucion),
        estado: p.estado as EstadoPrestamo,
        docente: p.docente,
        observaciones: p.observaciones || '',
    };
};

export const devolverPrestamoEnBackend = async (id: string, payload: { estadoFisicoDevolucion?: string; carnetDevuelto?: boolean; observaciones?: string } = {}): Promise<Prestamo> => {
    const resp = await fetch(`${API_BASE}/prestamos/${id}/devolver`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify(payload),
    });

    if (!resp.ok) {
        const txt = await resp.text();
        throw new Error(txt || 'No se pudo devolver préstamo');
    }

    const p = (await resp.json()) as PrestamoApi;
    return {
        id: String(p.id),
        carnetEstudiante: p.carnetEstudiante,
        idHerramienta: p.idHerramienta,
        grupoCanasta: p.grupoCanasta,
        codigo: p.codigo,
        fechaPrestamo: soloFecha(p.fechaPrestamo) || '',
        fechaDevolucion: soloFecha(p.fechaDevolucion),
        estado: p.estado as EstadoPrestamo,
        docente: p.docente,
        observaciones: p.observaciones || '',
    };
};

export const crearCanastaPrestamoEnBackend = async (payload: {
    carnetEstudiante: string;
    carnetsEstudiantes?: string[];
    idDocente: number;
    items: Array<{ idItem: string; idHerramienta?: string; registrado?: boolean }>;
    materiales: Array<{ idLote: string; idMaterial?: string; cantidad: number; motivo: string }>;
    fechaPrestamo: string;
    fechaDevolucion: string;
    observaciones?: string;
    idInventario?: number;
    carnetsRetenidos?: string[];
}): Promise<void> => {
    const body = {
        ...payload,
        fechaPrestamo: localToApiDateTime(payload.fechaPrestamo) || '',
        fechaDevolucion: localToApiDateTime(payload.fechaDevolucion) || '',
    };
    const resp = await fetch(`${API_BASE}/prestamos/canastas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify(body),
    });

    if (!resp.ok) {
        const txt = await resp.text();
        throw new Error(txt || 'No se pudo crear canasta de préstamo');
    }
};

export const editarCanastaPrestamoEnBackend = async (id: string, payload: any): Promise<any> => {
    const body = { ...payload };
    if (body.fechaPrestamo !== undefined) body.fechaPrestamo = localToApiDateTime(body.fechaPrestamo);
    if (body.fechaDevolucion !== undefined && body.fechaDevolucion !== null) {
        body.fechaDevolucion = localToApiDateTime(body.fechaDevolucion);
    }
    const resp = await fetch(`${API_BASE}/prestamos/canastas/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify(body),
    });

    if (!resp.ok) {
        const txt = await resp.text();
        throw new Error(txt || 'No se pudo editar canasta de préstamo');
    }
    return resp.json();
};

export const extenderCanastaPrestamoEnBackend = async (id: string, fechaDevolucion: string): Promise<any> => {
    const resp = await fetch(`${API_BASE}/prestamos/canastas/${id}/extender`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ fechaDevolucion: localToApiDateTime(fechaDevolucion) }),
    });

    if (!resp.ok) {
        const txt = await resp.text();
        throw new Error(txt || 'No se pudo extender canasta de préstamo');
    }
    return resp.json();
};

export const aceptarCanastaEnBackend = async (id: string): Promise<any> => {
    const resp = await fetch(`${API_BASE}/prestamos/canastas/${id}/aceptar`, {
        method: 'PUT',
        headers: authHeaders(),
    });
    if (!resp.ok) throw new Error(await resp.text() || 'No se pudo aceptar la canasta');
    return resp.json();
};

export const rechazarCanastaEnBackend = async (id: string, motivo: string): Promise<any> => {
    const resp = await fetch(`${API_BASE}/prestamos/canastas/${id}/rechazar`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ motivo }),
    });
    if (!resp.ok) throw new Error(await resp.text() || 'No se pudo rechazar la canasta');
    return resp.json();
};

export const despacharCanastaEnBackend = async (id: string, payload: {
    equipos?: Array<{ idHerramienta: string; registrado: boolean; estadoFisicoEntrega?: string }>;
    consumibles?: Array<{ idLote: string; cantidad: number }>;
    carnetsRetenidos?: string[];
}): Promise<any> => {
    const resp = await fetch(`${API_BASE}/prestamos/canastas/${id}/despachar`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify(payload),
    });
    if (!resp.ok) throw new Error(await resp.text() || 'No se pudo despachar la canasta');
    return resp.json();
};

export const devolverCanastaPrestamoEnBackend = async (id: string, payload: {
    equipos?: Array<{ idHerramienta: string; estadoFisicoDevolucion: string; devuelto: boolean }>;
    consumibles?: Array<{ idLote: string; cantidadDevuelta: number; estadoDevuelto?: string }>;
    carnetsDevueltos?: string[];
    observaciones?: string;
}): Promise<any> => {
    const resp = await fetch(`${API_BASE}/prestamos/canastas/${id}/devolver`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify(payload),
    });

    if (!resp.ok) {
        const txt = await resp.text();
        throw new Error(txt || 'No se pudo devolver canasta de préstamo');
    }
    return resp.json();
};

export const eliminarCanastaPrestamoEnBackend = async (id: string): Promise<void> => {
    const resp = await fetch(`${API_BASE}/prestamos/canastas/${id}`, {
        method: 'DELETE',
        headers: authHeaders(),
    });

    if (!resp.ok) {
        const txt = await resp.text();
        throw new Error(txt || 'No se pudo eliminar canasta de préstamo');
    }
};

export const obtenerMiDashboardEstudiante = async (): Promise<DashboardEstudiante> => {
    const resp = await fetch(`${API_BASE}/prestamos/mi-dashboard`, {
        headers: authHeaders(),
    });

    if (!resp.ok) {
        const txt = await resp.text();
        throw new Error(txt || 'No se pudo obtener el dashboard del estudiante');
    }

    return (await resp.json()) as DashboardEstudiante;
};

export const descargarPdfCanastaEstudiante = async (canastaId: string): Promise<Blob> => {
    const resp = await fetch(`${API_BASE}/prestamos/canastas/${encodeURIComponent(canastaId)}/pdf-estudiante`, {
        headers: authHeaders(),
    });

    if (!resp.ok) {
        const txt = await resp.text();
        throw new Error(txt || 'No se pudo descargar el comprobante del préstamo.');
    }

    return await resp.blob();
};

export const cargarHistorialPrestamoDesdeBackend = async (id: string): Promise<RegistroHistorialPrestamoApi[]> => {
    const resp = await fetch(`${API_BASE}/prestamos/${id}/historial`, {
        headers: authHeaders(),
    });

    if (!resp.ok) {
        const txt = await resp.text();
        throw new Error(txt || 'No se pudo cargar el historial del préstamo');
    }

    return (await resp.json()) as RegistroHistorialPrestamoApi[];
};
