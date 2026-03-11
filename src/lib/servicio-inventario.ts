import type { CanastaPrestamo, ContenedorHerramientas, ContenedorMateriales, Herramienta, KardexMaterial, MaterialFungible, SubinstanciaHerramienta, SubinstanciaMaterial, Estudiante, Docente, Prestamo } from '../tipos/inventario';
import { apiDateTimeAInputLocal } from './fecha-local';

const API_BASE = 'http://localhost:3001';

interface ActivoFijoApi {
    id: string | number;
    nombre: string;
    items?: Array<{
        id: string | number;
        codigoInventario: string;
        fechaEntrega?: string;
        fechaRetiro?: string;
        estado: string;
        observaciones?: string;
        precio?: number;
    }>;
}

interface EditarItemActivoApi {
    codigoInventario?: string;
    fechaEntrega?: string | null;
    fechaRetiro?: string | null;
    estado?: string;
    observaciones?: string;
    justificacion?: string;
    precio?: number;
}

interface MaterialApi {
    id: string | number;
    nombre: string;
    categoria: string;
    descripcion?: string;
    unidad: string;
    stockMinimo: number;
    contenedor?: {
        id: string | number;
        nombre: string;
        ubicacion: string;
    };
    lotes?: Array<{
        id: string | number;
        lote: string;
        fechaEntrega?: string;
        fechaRetiro?: string;
        cantidadDisponible: number;
        fechaCaducidad?: string;
        precio?: number;
    }>;
}

const soloFecha = (fecha?: string) => (fecha ? String(fecha).slice(0, 10) : undefined);

interface EstudianteApi {
    id: string | number;
    carnet: string;
    nombre: string;
    apellido: string;
    carrera: string;
    semestre: number;
    carnetRetenido?: boolean;
}

interface DocenteApi {
    id: string | number;
    codigo: string;
    nombre: string;
    apellido: string;
    materia: string;
    carnet: string;
}

interface PrestamoApi {
    id: string | number;
    carnetEstudiante: string;
    idHerramienta: string;
    fechaPrestamo: string;
    fechaDevolucion?: string | null;
    estado: 'pendiente' | 'activo' | 'devuelto' | 'vencido';
    docente: string;
    idDocente?: string | number;
    observaciones?: string;
}

interface CrearPrestamoApi {
    carnetEstudiante: string;
    idDocente: number;
    idHerramienta: string;
    fechaPrestamo: string;
    fechaDevolucion: string;
    observaciones?: string;
}

const normalizarFechaHora = (valor?: string | null) => apiDateTimeAInputLocal(valor) || null;

export const cargarActivosDesdeBackend = async (): Promise<ContenedorHerramientas[]> => {
    const resp = await fetch(`${API_BASE}/activos/fijos`);
    if (!resp.ok) throw new Error('No se pudo cargar activos desde backend');
    const fijos = (await resp.json()) as ActivoFijoApi[];

    const herramientas: Herramienta[] = fijos.map((fijo) => {
        const subinstancias: SubinstanciaHerramienta[] = (fijo.items ?? []).map((item) => ({
            id: String(item.id),
            codigoInventario: item.codigoInventario,
            fechaEntrega: soloFecha(item.fechaEntrega),
            fechaRetiro: soloFecha(item.fechaRetiro),
            estado: (item.estado as SubinstanciaHerramienta['estado']) ?? 'buen_estado',
            observaciones: item.observaciones ?? '',
            ue: '',
            descripcion: '',
            precio: Number(item.precio ?? 0),
        }));

        return {
            id: String(fijo.id),
            nombre: fijo.nombre,
            categoria: 'General',
            descripcion: '',
            ue: '',
            subinstancias,
        };
    });

    return [{
        id: 'CH-BD-1',
        nombre: 'Inventario Activos (BD)',
        ubicacion: 'PostgreSQL',
        herramientas,
    }];
};

export const editarActivoFijoEnBackend = async (id: string, payload: Partial<{ nombre: string }>): Promise<void> => {
    const resp = await fetch(`${API_BASE}/activos/fijos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });

    if (!resp.ok) {
        const txt = await resp.text();
        throw new Error(txt || 'No se pudo editar activo fijo');
    }
};

export const editarItemActivoEnBackend = async (id: string, payload: EditarItemActivoApi): Promise<void> => {
    const resp = await fetch(`${API_BASE}/activos/items/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });

    if (!resp.ok) {
        const txt = await resp.text();
        throw new Error(txt || 'No se pudo editar item de activo');
    }
};

export const cargarMaterialesDesdeBackend = async (): Promise<ContenedorMateriales[]> => {
    const resp = await fetch(`${API_BASE}/materiales/cajas`);
    if (!resp.ok) throw new Error('No se pudo cargar materiales desde backend');
    const materiales = (await resp.json()) as MaterialApi[];

    const porContenedor = new Map<string, ContenedorMateriales>();

    materiales.forEach((mat) => {
        const idCont = mat.contenedor?.id ?? 'CM-BD-1';
        const idContStr = String(idCont);
        const nombreCont = mat.contenedor?.nombre ?? 'Contenedor BD';
        const ubicacionCont = mat.contenedor?.ubicacion ?? 'PostgreSQL';

        if (!porContenedor.has(idContStr)) {
            porContenedor.set(idContStr, {
                id: idContStr,
                nombre: nombreCont,
                ubicacion: ubicacionCont,
                materiales: [],
            });
        }

        const subinstancias: SubinstanciaMaterial[] = (mat.lotes ?? []).map((lote) => ({
            id: String(lote.id),
            lote: lote.lote,
            fechaEntrega: soloFecha(lote.fechaEntrega),
            fechaRetiro: soloFecha(lote.fechaRetiro),
            cantidadDisponible: Number(lote.cantidadDisponible ?? 0),
            fechaCaducidad: soloFecha(lote.fechaCaducidad),
            precio: Number(lote.precio ?? 0),
        }));

        const material: MaterialFungible = {
            id: String(mat.id),
            nombre: mat.nombre,
            categoria: mat.categoria,
            descripcion: mat.descripcion,
            unidad: mat.unidad,
            stockMinimo: Number(mat.stockMinimo ?? 0),
            subinstancias,
        };

        porContenedor.get(idContStr)?.materiales.push(material);
    });

    return Array.from(porContenedor.values());
};

export const cargarEstudiantesDesdeBackend = async (): Promise<Estudiante[]> => {
    const resp = await fetch(`${API_BASE}/prestamos/estudiantes`);
    if (!resp.ok) throw new Error('No se pudo cargar estudiantes desde backend');
    const data = (await resp.json()) as EstudianteApi[];

    return data.map((e) => ({
        id: String(e.id),
        carnet: e.carnet,
        nombre: e.nombre,
        apellido: e.apellido,
        carrera: e.carrera,
        semestre: Number(e.semestre ?? 0),
           carnetRetenido: Boolean(e.carnetRetenido),
    }));
};

export const cargarDocentesDesdeBackend = async (): Promise<Docente[]> => {
    const resp = await fetch(`${API_BASE}/prestamos/docentes`);
    if (!resp.ok) throw new Error('No se pudo cargar docentes desde backend');
    const data = (await resp.json()) as DocenteApi[];

    return data.map((d) => ({
        id: String(d.id),
        codigo: d.codigo,
        nombre: d.nombre,
        apellido: d.apellido,
        materia: d.materia,
        carnet: d.carnet,
    }));
};

export const cargarPrestamosDesdeBackend = async (): Promise<Prestamo[]> => {
    const resp = await fetch(`${API_BASE}/prestamos`);
    if (!resp.ok) throw new Error('No se pudo cargar prestamos desde backend');
    const data = (await resp.json()) as PrestamoApi[];

    return data.map((p) => ({
        id: String(p.id),
        carnetEstudiante: p.carnetEstudiante,
        idHerramienta: p.idHerramienta,
        fechaPrestamo: normalizarFechaHora(p.fechaPrestamo) ?? p.fechaPrestamo,
        fechaDevolucion: normalizarFechaHora(p.fechaDevolucion ?? undefined),
        estado: p.estado === 'activo' ? 'pendiente' : p.estado,
        docente: p.docente,
        observaciones: p.observaciones ?? '',
    }));
};

export const crearPrestamoEnBackend = async (payload: CrearPrestamoApi): Promise<Prestamo> => {
    const resp = await fetch(`${API_BASE}/prestamos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
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
        fechaPrestamo: normalizarFechaHora(p.fechaPrestamo) ?? p.fechaPrestamo,
        fechaDevolucion: normalizarFechaHora(p.fechaDevolucion ?? undefined),
        estado: p.estado === 'activo' ? 'pendiente' : p.estado,
        docente: p.docente,
        observaciones: p.observaciones ?? '',
    };
};

export const editarPrestamoEnBackend = async (
    id: string,
    payload: Partial<{
        carnetEstudiante: string;
        idHerramienta: string;
        fechaPrestamo: string;
        fechaDevolucion: string | null;
        observaciones: string;
        idDocente: number;
        estado: 'pendiente' | 'devuelto' | 'vencido' | 'activo'
    }>,
): Promise<Prestamo> => {
    const resp = await fetch(`${API_BASE}/prestamos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
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
        fechaPrestamo: normalizarFechaHora(p.fechaPrestamo) ?? p.fechaPrestamo,
        fechaDevolucion: normalizarFechaHora(p.fechaDevolucion ?? undefined),
        estado: p.estado === 'activo' ? 'pendiente' : p.estado,
        docente: p.docente,
        observaciones: p.observaciones ?? '',
    };
};

export const extenderPrestamoEnBackend = async (id: string, fechaDevolucion: string): Promise<Prestamo> => {
    const resp = await fetch(`${API_BASE}/prestamos/${id}/extender`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fechaDevolucion }),
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
        fechaPrestamo: normalizarFechaHora(p.fechaPrestamo) ?? p.fechaPrestamo,
        fechaDevolucion: normalizarFechaHora(p.fechaDevolucion ?? undefined),
        estado: p.estado === 'activo' ? 'pendiente' : p.estado,
        docente: p.docente,
        observaciones: p.observaciones ?? '',
    };
};

export const devolverPrestamoEnBackend = async (id: string): Promise<Prestamo> => {
    const resp = await fetch(`${API_BASE}/prestamos/${id}/devolver`, { method: 'POST' });
    if (!resp.ok) {
        const txt = await resp.text();
        throw new Error(txt || 'No se pudo marcar devolución');
    }
    const p = (await resp.json()) as PrestamoApi;
    return {
        id: String(p.id),
        carnetEstudiante: p.carnetEstudiante,
        idHerramienta: p.idHerramienta,
        fechaPrestamo: normalizarFechaHora(p.fechaPrestamo) ?? p.fechaPrestamo,
        fechaDevolucion: normalizarFechaHora(p.fechaDevolucion ?? undefined),
        estado: p.estado === 'activo' ? 'pendiente' : p.estado,
        docente: p.docente,
        observaciones: p.observaciones ?? '',
    };
};

export const crearCanastaPrestamoEnBackend = async (payload: CanastaPrestamo): Promise<void> => {
    const resp = await fetch(`${API_BASE}/prestamos/canasta`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            carnetEstudiante: payload.carnetEstudiante,
            idDocente: Number(payload.idDocente),
            fechaPrestamo: payload.fechaPrestamo,
            fechaDevolucion: payload.fechaDevolucion,
            observaciones: payload.observaciones ?? '',
            equipos: payload.equipos,
            consumibles: payload.consumibles.map((c) => ({
                idLote: Number(c.idLote),
                cantidad: Number(c.cantidad),
                motivo: c.motivo,
            })),
        }),
    });

    if (!resp.ok) {
        const txt = await resp.text();
        throw new Error(txt || 'No se pudo registrar la canasta de préstamo');
    }
};

export const cargarKardexMaterialEnBackend = async (idMaterial: string): Promise<KardexMaterial> => {
    const resp = await fetch(`${API_BASE}/materiales/${idMaterial}/kardex`);
    if (!resp.ok) {
        const txt = await resp.text();
        throw new Error(txt || 'No se pudo cargar el kardex del material');
    }

    const data = await resp.json();
    return {
        materialId: String(data.materialId),
        materialNombre: data.materialNombre ?? null,
        movimientos: (data.movimientos ?? []).map((m: any) => ({
            id: String(m.id),
            fecha: String(m.fecha),
            tipo: m.tipo,
            cantidad: Number(m.cantidad ?? 0),
            motivo: String(m.motivo ?? ''),
            referencia: m.referencia ? String(m.referencia) : undefined,
            lote: String(m.lote ?? ''),
        })),
    };
};

export const crearEstudianteEnBackend = async (payload: Omit<Estudiante, 'id'>): Promise<Estudiante> => {
    const resp = await fetch(`${API_BASE}/prestamos/estudiantes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });

    if (!resp.ok) {
        const txt = await resp.text();
        throw new Error(txt || 'No se pudo registrar estudiante');
    }

    const e = (await resp.json()) as { id: string | number; carnet: string; nombre: string; apellido: string; carrera: string; semestre: number; carnetRetenido?: boolean };
    return {
        id: String(e.id),
        carnet: e.carnet,
        nombre: e.nombre,
        apellido: e.apellido,
        carrera: e.carrera,
        semestre: Number(e.semestre),
        carnetRetenido: Boolean(e.carnetRetenido),
    };
};

export const editarEstudianteEnBackend = async (id: string, payload: Partial<Omit<Estudiante, 'id'>>): Promise<Estudiante> => {
    const resp = await fetch(`${API_BASE}/prestamos/estudiantes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });

    if (!resp.ok) {
        const txt = await resp.text();
        throw new Error(txt || 'No se pudo editar estudiante');
    }

    const e = (await resp.json()) as { id: string | number; carnet: string; nombre: string; apellido: string; carrera: string; semestre: number; carnetRetenido?: boolean };
    return {
        id: String(e.id),
        carnet: e.carnet,
        nombre: e.nombre,
        apellido: e.apellido,
        carrera: e.carrera,
        semestre: Number(e.semestre),
        carnetRetenido: Boolean(e.carnetRetenido),
    };
};

export const eliminarEstudianteEnBackend = async (id: string): Promise<void> => {
    const resp = await fetch(`${API_BASE}/prestamos/estudiantes/${id}`, { method: 'DELETE' });
    if (!resp.ok) {
        const txt = await resp.text();
        throw new Error(txt || 'No se pudo eliminar estudiante');
    }
};

export const crearDocenteEnBackend = async (payload: Omit<Docente, 'id'>): Promise<Docente> => {
    const resp = await fetch(`${API_BASE}/prestamos/docentes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });

    if (!resp.ok) {
        const txt = await resp.text();
        throw new Error(txt || 'No se pudo registrar docente');
    }

    const d = (await resp.json()) as { id: string | number; codigo: string; nombre: string; apellido: string; materia: string; carnet: string };
    return {
        id: String(d.id),
        codigo: d.codigo,
        nombre: d.nombre,
        apellido: d.apellido,
        materia: d.materia,
        carnet: d.carnet,
    };
};

export const editarDocenteEnBackend = async (id: string, payload: Partial<Omit<Docente, 'id'>>): Promise<Docente> => {
    const resp = await fetch(`${API_BASE}/prestamos/docentes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });

    if (!resp.ok) {
        const txt = await resp.text();
        throw new Error(txt || 'No se pudo editar docente');
    }

    const d = (await resp.json()) as { id: string | number; codigo: string; nombre: string; apellido: string; materia: string; carnet: string };
    return {
        id: String(d.id),
        codigo: d.codigo,
        nombre: d.nombre,
        apellido: d.apellido,
        materia: d.materia,
        carnet: d.carnet,
    };
};

export const eliminarDocenteEnBackend = async (id: string): Promise<void> => {
    const resp = await fetch(`${API_BASE}/prestamos/docentes/${id}`, { method: 'DELETE' });
    if (!resp.ok) {
        const txt = await resp.text();
        throw new Error(txt || 'No se pudo eliminar docente');
    }
};
