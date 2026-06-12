import { API_BASE_URL } from './api';
import { obtenerToken } from './servicio-autenticacion';
import { normalizarEstadoFisicoItem } from '@/utilidades/estados-fisico-activo';
import type { 
    ActivoFijoApi, 
    TransicionesPermitidasItemActivoApi, 
    CrearItemActivoApi, 
    EditarItemActivoApi,
    ContenedorCompartidoApi
} from '@/tipos/api';
import type { ContenedorHerramientas, Herramienta, SubinstanciaHerramienta, ContenedorMateriales, MaterialFungible, SubinstanciaMaterial } from '@/tipos/inventario';

const API_BASE = API_BASE_URL;

const authHeaders = () => {
    const token = obtenerToken();
    if (!token) {
        throw new Error('Tu sesión expiró. Inicia sesión nuevamente.');
    }
    return { Authorization: `Bearer ${token}` };
};

const soloFecha = (fecha?: string | null) => (fecha ? String(fecha).slice(0, 10) : undefined);

export const cargarActivosDesdeBackend = async (): Promise<ContenedorHerramientas[]> => {
    const resp = await fetch(`${API_BASE}/activos/fijos`, {
        headers: authHeaders(),
    });
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
            idInventario: fijo.idInventario,
        };

        porContenedor.get(idCont)?.herramientas.push(herramienta);
    });

    return Array.from(porContenedor.values());
};

export const obtenerTransicionesPermitidasItemActivoEnBackend = async (id: string) => {
    const resp = await fetch(`${API_BASE}/activos/items/${id}/transiciones-permitidas`, {
        headers: authHeaders(),
    });
    if (!resp.ok) {
        const txt = await resp.text();
        throw new Error(txt || 'No se pudieron obtener las transiciones permitidas del item');
    }

    return (await resp.json()) as TransicionesPermitidasItemActivoApi;
};

export const cargarContenedoresCompartidosDesdeBackend = async (): Promise<ContenedorCompartidoApi[]> => {
    const resp = await fetch(`${API_BASE}/contenedores`, {
        headers: authHeaders(),
    });
    if (!resp.ok) throw new Error('No se pudieron cargar los contenedores compartidos');
    return (await resp.json()) as ContenedorCompartidoApi[];
};

export const crearContenedorCompartidoEnBackend = async (payload: { nombre: string; descripcion: string }): Promise<void> => {
    const resp = await fetch(`${API_BASE}/contenedores`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
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
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
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
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
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
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
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
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
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
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
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
        headers: authHeaders(),
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
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
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
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
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
        headers: authHeaders(),
    });

    if (!resp.ok) {
        const txt = await resp.text();
        throw new Error(txt || 'No se pudo eliminar item de activo');
    }
};

export const crearItemActivoEnBackend = async (payload: CrearItemActivoApi): Promise<void> => {
    const resp = await fetch(`${API_BASE}/activos/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify(payload),
    });

    if (!resp.ok) {
        const txt = await resp.text();
        throw new Error(txt || 'No se pudo crear item de activo');
    }
};

export const cargarMaterialesDesdeBackend = async (): Promise<{ contenedores: ContenedorMateriales[]; catalogo: MaterialFungible[] }> => {
    const headers = authHeaders();
    const resp = await fetch(`${API_BASE}/activos/fungibles`, { headers });

    if (!resp.ok) {
        throw new Error('No se pudo cargar activos fungibles desde backend');
    }

    const materiales = (await resp.json()) as any[];

    const catalogo: MaterialFungible[] = materiales
        .map((mat) => ({
            id: String(mat.id),
            nombre: mat.nombre,
            categoria: mat.categoria,
            descripcion: mat.descripcion,
            unidad: mat.unidad,
            stockMinimoHabilitado: false,
            stockMinimo: 0,
            tipoIdentificacion: (mat.tipoIdentificacion ?? 'lote') as MaterialFungible['tipoIdentificacion'],
            subinstancias: [],
            idInventario: mat.idInventario,
        }))
        .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));

    const porContenedor = new Map<string, ContenedorMateriales>();

    const asegurarContenedor = (categoria: string) => {
        const idContStr = `cat-${categoria.toLowerCase().replace(/\s+/g, '-')}`;

        if (!porContenedor.has(idContStr)) {
            porContenedor.set(idContStr, {
                id: idContStr,
                nombre: categoria,
                descripcion: 'Almacén Virtual',
                ubicacion: 'General',
                materiales: [],
            });
        }

        return idContStr;
    };

    const asegurarMaterialEnContenedor = (idContStr: string, mat: any): MaterialFungible => {
        const matId = String(mat.id);
        const contenedor = porContenedor.get(idContStr)!;
        let existente = contenedor.materiales.find(m => m.id === matId);
        if (existente) return existente;

        const nuevo: MaterialFungible = {
            id: matId,
            nombre: mat.nombre,
            categoria: mat.categoria,
            descripcion: mat.descripcion,
            unidad: mat.unidad,
            stockMinimoHabilitado: false,
            stockMinimo: 0,
            tipoIdentificacion: (mat.tipoIdentificacion ?? 'lote') as MaterialFungible['tipoIdentificacion'],
            subinstancias: [],
            idInventario: mat.idInventario,
        };
        contenedor.materiales.push(nuevo);
        return nuevo;
    };

    materiales.forEach((mat) => {
        const lotes = mat.lotes ?? [];
        const idContStr = asegurarContenedor(mat.categoria || 'General');

        if (lotes.length === 0) {
            asegurarMaterialEnContenedor(idContStr, mat);
            return;
        }

        lotes.forEach((inst: any) => {
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

    const contenedores = Array.from(porContenedor.values());
    contenedores.forEach((c) => {
        c.materiales.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
        c.materiales.forEach((m) =>
            m.subinstancias.sort((a, b) => String(a.lote ?? a.serie ?? '').localeCompare(String(b.lote ?? b.serie ?? ''), 'es')),
        );
    });

    return { contenedores, catalogo };
};

export const crearContenedorMaterialEnBackend = async (_payload: { nombre: string; ubicacion?: string; descripcion?: string }): Promise<void> => {

};

export const editarContenedorMaterialEnBackend = async (_id: string, _payload: Partial<{ nombre: string; ubicacion: string; descripcion: string }>): Promise<void> => {

};

export const eliminarContenedorMaterialEnBackend = async (_id: string): Promise<void> => {

};

export const crearCajaMaterialEnBackend = async (payload: any): Promise<void> => {
    const resp = await fetch(`${API_BASE}/activos/fungibles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify(payload),
    });

    if (!resp.ok) {
        const txt = await resp.text();
        throw new Error(txt || 'No se pudo crear activo fungible');
    }
};

export const crearLoteMaterialEnBackend = async (payload: any): Promise<void> => {
    const resp = await fetch(`${API_BASE}/activos/fungibles/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify(payload),
    });

    if (!resp.ok) {
        const txt = await resp.text();
        throw new Error(txt || 'No se pudo crear lote de activo fungible');
    }
};

export const editarCajaMaterialEnBackend = async (id: string, payload: any): Promise<void> => {
    const resp = await fetch(`${API_BASE}/activos/fungibles/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify(payload),
    });

    if (!resp.ok) {
        const txt = await resp.text();
        throw new Error(txt || 'No se pudo editar activo fungible');
    }
};

export const editarLoteMaterialEnBackend = async (id: string, payload: any): Promise<void> => {
    const resp = await fetch(`${API_BASE}/activos/fungibles/items/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify(payload),
    });

    if (!resp.ok) {
        const txt = await resp.text();
        throw new Error(txt || 'No se pudo editar lote de activo fungible');
    }
};

export const eliminarLoteMaterialEnBackend = async (id: string): Promise<void> => {
    const resp = await fetch(`${API_BASE}/activos/fungibles/items/${id}`, {
        method: 'DELETE',
        headers: authHeaders(),
    });

    if (!resp.ok) {
        const txt = await resp.text();
        throw new Error(txt || 'No se pudo eliminar lote');
    }
};

export const eliminarCajaMaterialEnBackend = async (id: string): Promise<void> => {
    const resp = await fetch(`${API_BASE}/activos/fungibles/${id}`, {
        method: 'DELETE',
        headers: authHeaders(),
    });

    if (!resp.ok) {
        const txt = await resp.text();
        throw new Error(txt || 'No se pudo eliminar activo fungible');
    }
};

export const cargarKardexMaterialEnBackend = async (idMaterial: string): Promise<any> => {
    const resp = await fetch(`${API_BASE}/activos/fungibles/${idMaterial}/kardex`, {
        headers: authHeaders(),
    });
    if (!resp.ok) {
        const txt = await resp.text();
        throw new Error(txt || 'No se pudo cargar el kardex');
    }
    return await resp.json();
};
