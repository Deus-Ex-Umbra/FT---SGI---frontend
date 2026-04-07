import type { CanastaPrestamo, ContenedorHerramientas, ContenedorMateriales, Herramienta, KardexMaterial, MaterialFungible, SubinstanciaHerramienta, SubinstanciaMaterial, Estudiante, Docente, Prestamo, PrestamoCanastaRegistro, Materia, Carrera } from '@/tipos/inventario';
import { apiDateTimeAInputLocal } from './fecha-local';
import { normalizarEstadoFisicoItem } from './estados-fisico-activo';

const API_BASE = 'http://localhost:3001';

interface ActivoFijoApi {
    id: string | number;
    nombre: string;
    categoria?: string;
    descripcion?: string;
    contenedor?: {
        id: string | number;
        nombre: string;
        ubicacion: string;
    } | null;
    items?: Array<{
        id: string | number;
        codigoInventario?: string | null;
        codigoUnico?: string | null;
        ubicacion?: string | null;
        ue?: string | null;
        descripcion?: string | null;
        fechaEntrega?: string;
        fechaRetiro?: string;
        estado: string;
        estadoFisico?: string;
        observaciones?: string;
        precio?: number;
    }>;
}

interface TransicionPermitidaItemActivoApi {
    estadoDestino: string;
    requiereJustificacion: boolean;
}

interface TransicionesPermitidasItemActivoApi {
    itemId: number;
    codigoInventario: string;
    estadoActual: string;
    estadoFisico: string;
    transiciones: TransicionPermitidaItemActivoApi[];
}

interface EditarItemActivoApi {
    codigoInventario?: string;
    codigoUnico?: string;
    ubicacion?: string;
    ue?: string;
    descripcion?: string;
    estadoFisico?: string;
    fechaEntrega?: string | null;
    fechaRetiro?: string | null;
    estado?: string;
    observaciones?: string;
    justificacion?: string;
    precio?: number;
}

interface CrearItemActivoApi {
    idActivo: number | string;
    codigoInventario?: string;
    codigoUnico?: string;
    ubicacion?: string;
    ue?: string;
    descripcion?: string;
    fechaEntrega?: string | null;
    fechaRetiro?: string | null;
    estado?: string;
    estadoFisico?: string;
    observaciones?: string;
    precio?: number;
}

interface MaterialApi {
    id: string | number;
    nombre: string;
    categoria: string;
    descripcion?: string;
    unidad: string;
    stockMinimoHabilitado?: boolean;
    stockMinimo: number;
    tipoIdentificacion?: 'lote' | 'serie' | 'simple';
    contenedor?: {
        id: string | number;
        nombre: string;
        ubicacion: string;
    };
    lotes?: Array<{
        id: string | number;
        tipo?: 'lote' | 'serie' | 'simple';
        lote?: string | null;
        serie?: string | null;
        contenedor?: {
            id: string | number;
            nombre: string;
            ubicacion: string;
        };
        fechaEntrega?: string;
        fechaRetiro?: string;
        cantidadDisponible: number;
        fechaCaducidad?: string;
        precio?: number;
    }>;
}

interface ContenedorMaterialApi {
    id: string | number;
    nombre: string;
    ubicacion: string;
}

interface ContenedorCompartidoApi {
    id: string;
    nombre: string;
    descripcion: string;
    idActivo?: number;
    idMaterial?: number;
}

interface MateriaApi {
    id: string | number;
    codigo: string;
    nombre?: string | null;
}

interface CarreraApi {
    id: string | number;
    nombre: string;
}

interface CrearCajaMaterialApi {
    idContenedor?: number;
    nombre: string;
    categoria?: string;
    descripcion?: string;
    unidad?: string;
    stockMinimoHabilitado?: boolean;
    stockMinimo?: number;
    tipoIdentificacion?: 'lote' | 'serie' | 'simple';
}

interface CrearLoteMaterialApi {
    idMaterial: number;
    idContenedor: number;
    tipo: 'lote' | 'serie' | 'simple';
    lote?: string | null;
    serie?: string | null;
    fechaEntrega?: string | null;
    fechaRetiro?: string | null;
    cantidadDisponible?: number;
    fechaCaducidad?: string | null;
    precio?: number;
}

interface EditarCajaMaterialApi {
    nombre?: string;
    categoria?: string;
    descripcion?: string;
    unidad?: string;
    stockMinimoHabilitado?: boolean;
    stockMinimo?: number;
    tipoIdentificacion?: 'lote' | 'serie' | 'simple';
}

interface EditarLoteMaterialApi {
    tipo?: 'lote' | 'serie' | 'simple';
    lote?: string | null;
    serie?: string | null;
    fechaEntrega?: string | null;
    fechaRetiro?: string | null;
    cantidadDisponible?: number;
    fechaCaducidad?: string | null;
    precio?: number;
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
    carnetRetenidoOverride?: boolean | null;
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
    grupoCanasta?: string | null;
    fechaPrestamo: string;
    fechaDevolucion?: string | null;
    estado: 'pendiente' | 'activo' | 'devuelto' | 'vencido' | 'devuelto_fuera_de_fecha_limite';
    docente: string;
    idDocente?: string | number;
    observaciones?: string;
}

interface PrestamoCanastaApi {
    id: string;
    grupoCanasta?: string | null;
    idsPrestamo: Array<string | number>;
    carnetEstudiante: string;
    carnetsEstudiantes?: string[];
    estudiantes?: Array<{
        id?: string | number;
        carnet: string;
        nombre: string;
        apellido: string;
    }>;
    idDocente?: string | number;
    docente: string;
    fechaPrestamo: string;
    fechaDevolucion?: string | null;
    estado: 'pendiente' | 'activo' | 'devuelto' | 'vencido' | 'devuelto_fuera_de_fecha_limite';
    observaciones?: string;
    totalActivos?: number;
    totalConsumibles?: number;
    totalCosas: number;
    cosas: Array<{
        idHerramienta: string;
        codigoInventario: string;
        nombre: string;
    }>;
    consumibles?: Array<{
        idLote: string;
        lote: string;
        material: string;
        cantidad: number;
        motivo: string;
        fecha: string;
    }>;
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

const mapCanastaPrestamoApi = (canasta: PrestamoCanastaApi): PrestamoCanastaRegistro => {
    const estudiantes = (canasta.estudiantes ?? []).map((estudiante) => ({
        id: estudiante.id != null ? String(estudiante.id) : undefined,
        carnet: String(estudiante.carnet ?? ''),
        nombre: String(estudiante.nombre ?? ''),
        apellido: String(estudiante.apellido ?? ''),
    }));

    const carnetsEstudiantes = (canasta.carnetsEstudiantes ?? estudiantes.map((estudiante) => estudiante.carnet))
        .map((carnet) => String(carnet ?? '').trim())
        .filter(Boolean);

    return {
        id: String(canasta.id),
        grupoCanasta: canasta.grupoCanasta ?? null,
        idsPrestamo: (canasta.idsPrestamo ?? []).map((id) => String(id)),
        carnetEstudiante: String(canasta.carnetEstudiante ?? carnetsEstudiantes[0] ?? ''),
        carnetsEstudiantes,
        estudiantes,
        idDocente: canasta.idDocente != null ? String(canasta.idDocente) : undefined,
        docente: String(canasta.docente ?? ''),
        fechaPrestamo: normalizarFechaHora(canasta.fechaPrestamo) ?? canasta.fechaPrestamo,
        fechaDevolucion: normalizarFechaHora(canasta.fechaDevolucion ?? undefined),
        estado: canasta.estado,
        observaciones: canasta.observaciones ?? '',
        totalActivos: Number(canasta.totalActivos ?? (canasta.cosas ?? []).length),
        totalConsumibles: Number(canasta.totalConsumibles ?? 0),
        totalCosas: Number(canasta.totalCosas ?? 0),
        cosas: (canasta.cosas ?? []).map((item) => ({
            idHerramienta: String(item.idHerramienta),
            codigoInventario: String(item.codigoInventario ?? ''),
            nombre: String(item.nombre ?? 'Activo'),
        })),
        consumibles: (canasta.consumibles ?? []).map((item) => ({
            idLote: String(item.idLote ?? '').trim(),
            lote: String(item.lote ?? ''),
            material: String(item.material ?? 'Material'),
            cantidad: Number(item.cantidad ?? 0),
            motivo: String(item.motivo ?? ''),
            fecha: normalizarFechaHora(item.fecha) ?? String(item.fecha ?? ''),
        })),
    };
};

export const cargarActivosDesdeBackend = async (): Promise<ContenedorHerramientas[]> => {
    const resp = await fetch(`${API_BASE}/activos/fijos`);
    if (!resp.ok) throw new Error('No se pudo cargar activos desde backend');
    const fijos = (await resp.json()) as ActivoFijoApi[];

    const porContenedor = new Map<string, ContenedorHerramientas>();

    fijos.forEach((fijo) => {
        const idCont = String(fijo.contenedor?.id ?? '0');
        const nombreCont = fijo.contenedor?.nombre ?? 'Sin contenedor';
        const ubicacionCont = fijo.contenedor?.ubicacion ?? 'N/D';

        if (!porContenedor.has(idCont)) {
            porContenedor.set(idCont, {
                id: idCont,
                nombre: nombreCont,
                descripcion: ubicacionCont,
                ubicacion: ubicacionCont,
                herramientas: [],
            });
        }

        const subinstancias: SubinstanciaHerramienta[] = (fijo.items ?? []).map((item) => ({
            id: String(item.id),
            codigoInventario: item.codigoInventario ?? undefined,
            codigoUnico: item.codigoUnico ?? undefined,
            ubicacion: item.ubicacion ?? undefined,
            ue: item.ue ?? undefined,
            descripcion: item.descripcion ?? undefined,
            estadoFisico: normalizarEstadoFisicoItem(item.estadoFisico) ?? 'bueno',
            fechaEntrega: soloFecha(item.fechaEntrega),
            fechaRetiro: soloFecha(item.fechaRetiro),
            estado: (item.estado as SubinstanciaHerramienta['estado']) || 'disponible',
            observaciones: item.observaciones ?? '',
            precio: Number(item.precio ?? 0),
        }));

        const herramienta: Herramienta = {
            id: String(fijo.id),
            nombre: fijo.nombre,
            categoria: fijo.categoria ?? 'General',
            descripcion: fijo.descripcion ?? '',
            subinstancias,
        };

        porContenedor.get(idCont)?.herramientas.push(herramienta);
    });

    return Array.from(porContenedor.values());
};

export const obtenerTransicionesPermitidasItemActivoEnBackend = async (id: string) => {
    const resp = await fetch(`${API_BASE}/activos/items/${id}/transiciones-permitidas`);
    if (!resp.ok) {
        const txt = await resp.text();
        throw new Error(txt || 'No se pudieron obtener las transiciones permitidas del item');
    }

    return (await resp.json()) as TransicionesPermitidasItemActivoApi;
};

export const cargarContenedoresCompartidosDesdeBackend = async (): Promise<ContenedorCompartidoApi[]> => {
    const resp = await fetch(`${API_BASE}/contenedores`);
    if (!resp.ok) throw new Error('No se pudieron cargar los contenedores compartidos');
    return (await resp.json()) as ContenedorCompartidoApi[];
};

export const crearContenedorCompartidoEnBackend = async (payload: { nombre: string; descripcion: string }): Promise<void> => {
    const resp = await fetch(`${API_BASE}/contenedores`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });

    if (!resp.ok) {
        const txt = await resp.text();
        throw new Error(txt || 'No se pudo crear contenedor compartido');
    }
};

export const editarContenedorCompartidoEnBackend = async (payload: {
    id: string;
    idActivo?: number;
    idMaterial?: number;
    nombre: string;
    descripcion: string;
}): Promise<void> => {
    const resp = await fetch(`${API_BASE}/contenedores/${encodeURIComponent(payload.id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });

    if (!resp.ok) {
        const txt = await resp.text();
        throw new Error(txt || 'No se pudo editar contenedor compartido');
    }
};

export const eliminarContenedorCompartidoEnBackend = async (payload: {
    id: string;
    idActivo?: number;
    idMaterial?: number;
}): Promise<void> => {
    const resp = await fetch(`${API_BASE}/contenedores/${encodeURIComponent(payload.id)}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idActivo: payload.idActivo, idMaterial: payload.idMaterial }),
    });

    if (!resp.ok) {
        const txt = await resp.text();
        throw new Error(txt || 'No se pudo eliminar contenedor compartido');
    }
};

export const crearContenedorActivoEnBackend = async (payload: { nombre: string; ubicacion?: string; descripcion?: string }): Promise<void> => {
    const resp = await fetch(`${API_BASE}/activos/contenedores`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            nombre: payload.nombre,
            ubicacion: payload.ubicacion ?? payload.descripcion ?? '',
        }),
    });

    if (!resp.ok) {
        const txt = await resp.text();
        throw new Error(txt || 'No se pudo crear contenedor de activos');
    }
};

export const editarContenedorActivoEnBackend = async (id: string, payload: Partial<{ nombre: string; ubicacion: string; descripcion: string }>): Promise<void> => {
    const resp = await fetch(`${API_BASE}/activos/contenedores/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            nombre: payload.nombre,
            ubicacion: payload.ubicacion ?? payload.descripcion,
        }),
    });

    if (!resp.ok) {
        const txt = await resp.text();
        throw new Error(txt || 'No se pudo editar contenedor de activos');
    }
};

export const editarActivoFijoEnBackend = async (
    id: string,
    payload: Partial<{ nombre: string; categoria: string; descripcion: string }>,
): Promise<void> => {
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

export const eliminarActivoFijoEnBackend = async (id: string): Promise<void> => {
    const resp = await fetch(`${API_BASE}/activos/fijos/${id}`, {
        method: 'DELETE',
    });

    if (!resp.ok) {
        const txt = await resp.text();
        throw new Error(txt || 'No se pudo eliminar activo fijo');
    }
};

export const crearActivoFijoEnBackend = async (
    payload: { nombre: string; idContenedor?: number; categoria?: string; descripcion?: string },
): Promise<void> => {
    const resp = await fetch(`${API_BASE}/activos/fijos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });

    if (!resp.ok) {
        const txt = await resp.text();
        throw new Error(txt || 'No se pudo crear activo fijo');
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

export const eliminarItemActivoEnBackend = async (id: string): Promise<void> => {
    const resp = await fetch(`${API_BASE}/activos/items/${id}`, {
        method: 'DELETE',
    });

    if (!resp.ok) {
        const txt = await resp.text();
        throw new Error(txt || 'No se pudo eliminar item de activo');
    }
};

export const crearItemActivoEnBackend = async (payload: CrearItemActivoApi): Promise<void> => {
    const resp = await fetch(`${API_BASE}/activos/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });

    if (!resp.ok) {
        const txt = await resp.text();
        throw new Error(txt || 'No se pudo crear item de activo');
    }
};

export const cargarMaterialesDesdeBackend = async (): Promise<{ contenedores: ContenedorMateriales[]; catalogo: MaterialFungible[] }> => {
    const [respContenedores, respCajas] = await Promise.all([
        fetch(`${API_BASE}/materiales/contenedores`),
        fetch(`${API_BASE}/materiales/cajas`),
    ]);

    if (!respContenedores.ok || !respCajas.ok) {
        throw new Error('No se pudo cargar materiales desde backend');
    }

    const contenedoresApi = (await respContenedores.json()) as ContenedorMaterialApi[];
    const materiales = (await respCajas.json()) as MaterialApi[];

    const catalogo: MaterialFungible[] = materiales
        .map((mat) => ({
            id: String(mat.id),
            nombre: mat.nombre,
            categoria: mat.categoria,
            descripcion: mat.descripcion,
            unidad: mat.unidad,
            stockMinimoHabilitado: Boolean(mat.stockMinimoHabilitado ?? false),
            stockMinimo: Number(mat.stockMinimo ?? 0),
            tipoIdentificacion: (mat.tipoIdentificacion ?? 'lote') as MaterialFungible['tipoIdentificacion'],
            subinstancias: [],
        }))
        .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));

    const porContenedor = new Map<string, ContenedorMateriales>();

    contenedoresApi.forEach((contenedor) => {
        const idCont = String(contenedor.id);
        porContenedor.set(idCont, {
            id: idCont,
            nombre: contenedor.nombre,
            descripcion: contenedor.ubicacion,
            ubicacion: contenedor.ubicacion,
            materiales: [],
        });
    });

    const materialesPorContenedor = new Map<string, Map<string, MaterialFungible>>();

    const asegurarContenedor = (payload?: { id: string | number; nombre: string; ubicacion: string } | null) => {
        if (!payload?.id) return null;
        const idContStr = String(payload.id);

        if (!porContenedor.has(idContStr)) {
            porContenedor.set(idContStr, {
                id: idContStr,
                nombre: payload.nombre ?? 'Contenedor',
                descripcion: payload.ubicacion ?? '',
                ubicacion: payload.ubicacion ?? '',
                materiales: [],
            });
        }

        return idContStr;
    };

    const asegurarMaterialEnContenedor = (idContStr: string, mat: MaterialApi): MaterialFungible => {
        const matId = String(mat.id);
        const mapa = materialesPorContenedor.get(idContStr) ?? new Map<string, MaterialFungible>();
        if (!materialesPorContenedor.has(idContStr)) materialesPorContenedor.set(idContStr, mapa);

        const existente = mapa.get(matId);
        if (existente) return existente;

        const nuevo: MaterialFungible = {
            id: matId,
            nombre: mat.nombre,
            categoria: mat.categoria,
            descripcion: mat.descripcion,
            unidad: mat.unidad,
            stockMinimoHabilitado: Boolean(mat.stockMinimoHabilitado ?? false),
            stockMinimo: Number(mat.stockMinimo ?? 0),
            tipoIdentificacion: (mat.tipoIdentificacion ?? 'lote') as MaterialFungible['tipoIdentificacion'],
            subinstancias: [],
        };
        mapa.set(matId, nuevo);
        return nuevo;
    };

    materiales.forEach((mat) => {
        const lotes = mat.lotes ?? [];

        if (lotes.length === 0) {
            // Legacy: si aún existe un contenedor en el padre, mantenemos la visualización sin instancias.
            const idLegacy = asegurarContenedor(mat.contenedor ?? null);
            if (idLegacy) {
                asegurarMaterialEnContenedor(idLegacy, mat);
            }
            return;
        }

        lotes.forEach((inst) => {
            const idContStr = asegurarContenedor(inst.contenedor ?? mat.contenedor ?? null);
            if (!idContStr) return;

            const materialEnCont = asegurarMaterialEnContenedor(idContStr, mat);
            materialEnCont.subinstancias.push({
                id: String(inst.id),
                tipo: (inst.tipo ?? mat.tipoIdentificacion ?? 'lote') as SubinstanciaMaterial['tipo'],
                lote: inst.lote ?? null,
                serie: inst.serie ?? null,
                fechaEntrega: soloFecha(inst.fechaEntrega),
                fechaRetiro: soloFecha(inst.fechaRetiro),
                cantidadDisponible: Number(inst.cantidadDisponible ?? 0),
                fechaCaducidad: soloFecha(inst.fechaCaducidad),
                precio: Number(inst.precio ?? 0),
            });
        });
    });

    const contenedores = Array.from(porContenedor.values()).map((c) => {
        const mats = Array.from(materialesPorContenedor.get(c.id)?.values() ?? []);
        mats.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
        mats.forEach((m) =>
            m.subinstancias.sort((a, b) => String(a.lote ?? a.serie ?? '').localeCompare(String(b.lote ?? b.serie ?? ''), 'es')),
        );
        return { ...c, materiales: mats };
    });

    return { contenedores, catalogo };
};

export const crearContenedorMaterialEnBackend = async (payload: { nombre: string; ubicacion?: string; descripcion?: string }): Promise<void> => {
    const resp = await fetch(`${API_BASE}/materiales/contenedores`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            nombre: payload.nombre,
            ubicacion: payload.ubicacion ?? payload.descripcion ?? '',
        }),
    });

    if (!resp.ok) {
        const txt = await resp.text();
        throw new Error(txt || 'No se pudo crear contenedor de materiales');
    }
};

export const editarContenedorMaterialEnBackend = async (id: string, payload: Partial<{ nombre: string; ubicacion: string; descripcion: string }>): Promise<void> => {
    const resp = await fetch(`${API_BASE}/materiales/contenedores/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            nombre: payload.nombre,
            ubicacion: payload.ubicacion ?? payload.descripcion,
        }),
    });

    if (!resp.ok) {
        const txt = await resp.text();
        throw new Error(txt || 'No se pudo editar contenedor de materiales');
    }
};

export const crearCajaMaterialEnBackend = async (payload: CrearCajaMaterialApi): Promise<void> => {
    const resp = await fetch(`${API_BASE}/materiales/cajas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });

    if (!resp.ok) {
        const txt = await resp.text();
        throw new Error(txt || 'No se pudo crear caja de material');
    }
};

export const crearLoteMaterialEnBackend = async (payload: CrearLoteMaterialApi): Promise<void> => {
    const resp = await fetch(`${API_BASE}/materiales/lotes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });

    if (!resp.ok) {
        const txt = await resp.text();
        throw new Error(txt || 'No se pudo crear lote de material');
    }
};

export const editarCajaMaterialEnBackend = async (id: string, payload: EditarCajaMaterialApi): Promise<void> => {
    const resp = await fetch(`${API_BASE}/materiales/cajas/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });

    if (!resp.ok) {
        const txt = await resp.text();
        throw new Error(txt || 'No se pudo editar caja de material');
    }
};

export const editarLoteMaterialEnBackend = async (id: string, payload: EditarLoteMaterialApi): Promise<void> => {
    const resp = await fetch(`${API_BASE}/materiales/lotes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });

    if (!resp.ok) {
        const txt = await resp.text();
        throw new Error(txt || 'No se pudo editar lote de material');
    }
};

export const eliminarLoteMaterialEnBackend = async (id: string): Promise<void> => {
    const resp = await fetch(`${API_BASE}/materiales/lotes/${id}`, {
        method: 'DELETE',
    });

    if (!resp.ok) {
        const txt = await resp.text();
        throw new Error(txt || 'No se pudo eliminar lote de material');
    }
};

export const eliminarContenedorMaterialEnBackend = async (id: string): Promise<void> => {
    const resp = await fetch(`${API_BASE}/materiales/contenedores/${id}`, {
        method: 'DELETE',
    });

    if (!resp.ok) {
        const txt = await resp.text();
        throw new Error(txt || 'No se pudo eliminar contenedor de materiales');
    }
};

export const eliminarCajaMaterialEnBackend = async (id: string): Promise<void> => {
    const resp = await fetch(`${API_BASE}/materiales/cajas/${id}`, {
        method: 'DELETE',
    });

    if (!resp.ok) {
        const txt = await resp.text();
        throw new Error(txt || 'No se pudo eliminar caja de material');
    }
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
        carnetRetenidoOverride: typeof e.carnetRetenidoOverride === 'boolean' ? e.carnetRetenidoOverride : null,
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

export const cargarMateriasDesdeBackend = async (): Promise<Materia[]> => {
    const resp = await fetch(`${API_BASE}/prestamos/materias`);
    if (!resp.ok) throw new Error('No se pudieron cargar las materias desde backend');
    const data = (await resp.json()) as MateriaApi[];

    return data.map((materia) => ({
        id: String(materia.id),
        codigo: materia.codigo,
        nombre: materia.nombre ?? null,
    }));
};

export const crearMateriaEnBackend = async (payload: { codigo: string; nombre?: string | null }): Promise<Materia> => {
    const resp = await fetch(`${API_BASE}/prestamos/materias`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });

    if (!resp.ok) {
        const txt = await resp.text();
        throw new Error(txt || 'No se pudo crear la materia');
    }

    const materia = (await resp.json()) as MateriaApi;
    return {
        id: String(materia.id),
        codigo: materia.codigo,
        nombre: materia.nombre ?? null,
    };
};

export const editarMateriaEnBackend = async (id: string, payload: Partial<{ codigo: string; nombre: string | null }>): Promise<Materia> => {
    const resp = await fetch(`${API_BASE}/prestamos/materias/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });

    if (!resp.ok) {
        const txt = await resp.text();
        throw new Error(txt || 'No se pudo editar la materia');
    }

    const materia = (await resp.json()) as MateriaApi;
    return {
        id: String(materia.id),
        codigo: materia.codigo,
        nombre: materia.nombre ?? null,
    };
};

export const eliminarMateriaEnBackend = async (id: string): Promise<void> => {
    const resp = await fetch(`${API_BASE}/prestamos/materias/${id}`, {
        method: 'DELETE',
    });

    if (!resp.ok) {
        const txt = await resp.text();
        throw new Error(txt || 'No se pudo eliminar la materia');
    }
};

export const cargarCarrerasDesdeBackend = async (): Promise<Carrera[]> => {
    const resp = await fetch(`${API_BASE}/prestamos/carreras`);
    if (!resp.ok) throw new Error('No se pudieron cargar las carreras desde backend');
    const data = (await resp.json()) as CarreraApi[];

    return data.map((carrera) => ({
        id: String(carrera.id),
        nombre: carrera.nombre,
    }));
};

export const crearCarreraEnBackend = async (payload: { nombre: string }): Promise<Carrera> => {
    const resp = await fetch(`${API_BASE}/prestamos/carreras`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });

    if (!resp.ok) {
        const txt = await resp.text();
        throw new Error(txt || 'No se pudo crear la carrera');
    }

    const carrera = (await resp.json()) as CarreraApi;
    return {
        id: String(carrera.id),
        nombre: carrera.nombre,
    };
};

export const editarCarreraEnBackend = async (id: string, payload: Partial<{ nombre: string }>): Promise<Carrera> => {
    const resp = await fetch(`${API_BASE}/prestamos/carreras/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });

    if (!resp.ok) {
        const txt = await resp.text();
        throw new Error(txt || 'No se pudo editar la carrera');
    }

    const carrera = (await resp.json()) as CarreraApi;
    return {
        id: String(carrera.id),
        nombre: carrera.nombre,
    };
};

export const eliminarCarreraEnBackend = async (id: string): Promise<void> => {
    const resp = await fetch(`${API_BASE}/prestamos/carreras/${id}`, {
        method: 'DELETE',
    });

    if (!resp.ok) {
        const txt = await resp.text();
        throw new Error(txt || 'No se pudo eliminar la carrera');
    }
};

export const cargarPrestamosDesdeBackend = async (): Promise<Prestamo[]> => {
    const resp = await fetch(`${API_BASE}/prestamos`);
    if (!resp.ok) throw new Error('No se pudo cargar prestamos desde backend');
    const data = (await resp.json()) as PrestamoApi[];

    return data.map((p) => ({
        id: String(p.id),
        carnetEstudiante: p.carnetEstudiante,
        idHerramienta: p.idHerramienta,
        grupoCanasta: p.grupoCanasta ?? null,
        fechaPrestamo: normalizarFechaHora(p.fechaPrestamo) ?? p.fechaPrestamo,
        fechaDevolucion: normalizarFechaHora(p.fechaDevolucion ?? undefined),
        estado: p.estado,
        docente: p.docente,
        observaciones: p.observaciones ?? '',
    }));
};

export const cargarCanastasPrestamoDesdeBackend = async (): Promise<PrestamoCanastaRegistro[]> => {
    const resp = await fetch(`${API_BASE}/prestamos/canastas`);
    if (!resp.ok) throw new Error('No se pudo cargar canastas de préstamos desde backend');
    const data = (await resp.json()) as PrestamoCanastaApi[];

    return data.map(mapCanastaPrestamoApi);
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
        grupoCanasta: p.grupoCanasta ?? null,
        fechaPrestamo: normalizarFechaHora(p.fechaPrestamo) ?? p.fechaPrestamo,
        fechaDevolucion: normalizarFechaHora(p.fechaDevolucion ?? undefined),
        estado: p.estado,
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
        estado: 'pendiente' | 'devuelto' | 'vencido' | 'activo' | 'devuelto_fuera_de_fecha_limite'
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
        grupoCanasta: p.grupoCanasta ?? null,
        fechaPrestamo: normalizarFechaHora(p.fechaPrestamo) ?? p.fechaPrestamo,
        fechaDevolucion: normalizarFechaHora(p.fechaDevolucion ?? undefined),
        estado: p.estado,
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
        grupoCanasta: p.grupoCanasta ?? null,
        fechaPrestamo: normalizarFechaHora(p.fechaPrestamo) ?? p.fechaPrestamo,
        fechaDevolucion: normalizarFechaHora(p.fechaDevolucion ?? undefined),
        estado: p.estado,
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
        grupoCanasta: p.grupoCanasta ?? null,
        fechaPrestamo: normalizarFechaHora(p.fechaPrestamo) ?? p.fechaPrestamo,
        fechaDevolucion: normalizarFechaHora(p.fechaDevolucion ?? undefined),
        estado: p.estado,
        docente: p.docente,
        observaciones: p.observaciones ?? '',
    };
};

export const crearCanastaPrestamoEnBackend = async (payload: CanastaPrestamo): Promise<void> => {
    const resp = await fetch(`${API_BASE}/prestamos/canasta`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            carnetEstudiante: payload.carnetEstudiante ?? payload.carnetsEstudiantes[0],
            carnetsEstudiantes: payload.carnetsEstudiantes,
            idDocente: Number(payload.idDocente),
            fechaPrestamo: payload.fechaPrestamo,
            fechaDevolucion: payload.fechaDevolucion,
            observaciones: payload.observaciones ?? '',
            equipos: payload.equipos,
            consumibles: payload.consumibles.map((c) => ({
                idLote: String(c.idLote ?? '').trim(),
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

export const editarCanastaPrestamoEnBackend = async (
    idCanasta: string,
    payload: Partial<{
        carnetEstudiante: string;
        carnetsEstudiantes: string[];
        fechaPrestamo: string;
        fechaDevolucion: string | null;
        observaciones: string;
        idDocente: number;
        estado: 'pendiente' | 'devuelto' | 'vencido' | 'activo' | 'devuelto_fuera_de_fecha_limite';
    }>,
): Promise<PrestamoCanastaRegistro> => {
    const resp = await fetch(`${API_BASE}/prestamos/canastas/${encodeURIComponent(idCanasta)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });

    if (!resp.ok) {
        const txt = await resp.text();
        throw new Error(txt || 'No se pudo editar la canasta de préstamo');
    }

    const c = (await resp.json()) as PrestamoCanastaApi;
    return mapCanastaPrestamoApi(c);
};

export const extenderCanastaPrestamoEnBackend = async (idCanasta: string, fechaDevolucion: string): Promise<PrestamoCanastaRegistro> => {
    const resp = await fetch(`${API_BASE}/prestamos/canastas/${encodeURIComponent(idCanasta)}/extender`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fechaDevolucion }),
    });

    if (!resp.ok) {
        const txt = await resp.text();
        throw new Error(txt || 'No se pudo extender la canasta de préstamo');
    }

    const c = (await resp.json()) as PrestamoCanastaApi;
    return mapCanastaPrestamoApi(c);
};

export const devolverCanastaPrestamoEnBackend = async (idCanasta: string): Promise<PrestamoCanastaRegistro> => {
    const resp = await fetch(`${API_BASE}/prestamos/canastas/${encodeURIComponent(idCanasta)}/devolver`, {
        method: 'POST',
    });

    if (!resp.ok) {
        const txt = await resp.text();
        throw new Error(txt || 'No se pudo marcar devolución de la canasta');
    }

    const c = (await resp.json()) as PrestamoCanastaApi;
    return mapCanastaPrestamoApi(c);
};

export const eliminarCanastaPrestamoEnBackend = async (idCanasta: string): Promise<void> => {
    const resp = await fetch(`${API_BASE}/prestamos/canastas/${encodeURIComponent(idCanasta)}`, {
        method: 'DELETE',
    });

    if (!resp.ok) {
        const txt = await resp.text();
        throw new Error(txt || 'No se pudo eliminar la canasta de préstamo');
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

    const e = (await resp.json()) as EstudianteApi;
    return {
        id: String(e.id),
        carnet: e.carnet,
        nombre: e.nombre,
        apellido: e.apellido,
        carrera: e.carrera,
        semestre: Number(e.semestre),
        carnetRetenido: Boolean(e.carnetRetenido),
        carnetRetenidoOverride: typeof e.carnetRetenidoOverride === 'boolean' ? e.carnetRetenidoOverride : null,
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

    const e = (await resp.json()) as EstudianteApi;
    return {
        id: String(e.id),
        carnet: e.carnet,
        nombre: e.nombre,
        apellido: e.apellido,
        carrera: e.carrera,
        semestre: Number(e.semestre),
        carnetRetenido: Boolean(e.carnetRetenido),
        carnetRetenidoOverride: typeof e.carnetRetenidoOverride === 'boolean' ? e.carnetRetenidoOverride : null,
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
