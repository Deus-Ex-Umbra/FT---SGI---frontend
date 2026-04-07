import { Fragment, useMemo, useState } from 'react';
import { Package, ChevronRight, ChevronDown, Wrench, Edit2, Trash2, Search, List as ListIcon, Table as TableIcon } from 'lucide-react';
import { toast } from 'sonner';
import type { ContenedorHerramientas, SubinstanciaHerramienta } from '@/tipos/inventario';
import FormularioEdicionJerarquia from './formulario-edicion-jerarquia';
import { useInventario } from '@/contextos/ContextoInventario';
import { useConfirmacion } from '@/contextos/ContextoConfirmacion';
import type { PaginaApp } from '@/tipos/navegacion';
import { ESTADOS_ITEM_ACTIVO, etiquetaEstadoItem, normalizarEstadoItem } from '@/lib/estados-activo';
import { ESTADOS_FISICOS_ITEM, etiquetaEstadoFisicoItem, normalizarEstadoFisicoItem } from '@/lib/estados-fisico-activo';
import { obtenerTransicionesPermitidasItemActivoEnBackend } from '@/lib/servicio-inventario';
import { ahoraInputLocal } from '@/lib/fecha-local';

interface Props {
    contenedores: ContenedorHerramientas[];
    onNavegar?: (pagina: PaginaApp) => void;
    onVistaChange?: (vista: 'cajas' | 'tabla') => void;
}

const obtenerIdentificadorItem = (item: SubinstanciaHerramienta): string => {
    const inv = String(item.codigoInventario ?? '').trim();
    const uni = String(item.codigoUnico ?? '').trim();
    if (!inv && !uni) return '';
    return `I: ${inv || '—'} | U: ${uni || '—'}`;
};

export const JerarquiaActivos = ({ contenedores, onNavegar: _onNavegar, onVistaChange }: Props) => {
    const {
        editarInstanciaActivo,
        agregarSubinstanciaActivo,
        editarSubinstanciaActivo,
        eliminarInstanciaActivo,
        eliminarSubinstanciaActivo
    } = useInventario();

    const { confirmar } = useConfirmacion();

    const [contenedoresExpandidos, setContenedoresExpandidos] = useState<Record<string, boolean>>({});
    const [instanciasExpandidas, setInstanciasExpandidas] = useState<Record<string, boolean>>({});
    const [busquedas, setBusquedas] = useState<Record<string, string>>({});
    const [modal, setModal] = useState<{ tipo: string; idCon?: string; idInst?: string; idSub?: string; props: any } | null>(null);
    const [vista, setVista] = useState<'cajas' | 'tabla'>('tabla');

    const [guardandoEstadoItem, setGuardandoEstadoItem] = useState<Record<string, boolean>>({});
    const [guardandoEstadoFisicoItem, setGuardandoEstadoFisicoItem] = useState<Record<string, boolean>>({});
    const [transicionesItem, setTransicionesItem] = useState<Record<string, { estadoDesde: string; estadoActual: string; requiereJustificacionPorEstado: Record<string, boolean>; permitidos: Set<string> }>>({});

    const cargarTransiciones = async (
        itemId: string,
        estadoFallback: string,
    ): Promise<{ estadoDesde: string; estadoActual: string; requiereJustificacionPorEstado: Record<string, boolean>; permitidos: Set<string> }> => {
        const cached = transicionesItem[itemId];
        if (cached && cached.estadoDesde === estadoFallback) return cached;
        try {
            const resp = await obtenerTransicionesPermitidasItemActivoEnBackend(itemId);
            const estadoActual = String(resp.estadoActual ?? '').trim() || estadoFallback;
            const requiereJustificacionPorEstado: Record<string, boolean> = {};
            const permitidos = new Set<string>();
            for (const t of resp.transiciones ?? []) {
                const destino = String(t.estadoDestino ?? '').trim();
                if (!destino) continue;
                if (destino === 'en_revision') continue;
                permitidos.add(destino);
                requiereJustificacionPorEstado[destino] = Boolean(t.requiereJustificacion);
            }
            const data = { estadoDesde: estadoFallback, estadoActual, requiereJustificacionPorEstado, permitidos };
            setTransicionesItem((prev) => ({ ...prev, [itemId]: data }));
            return data;
        } catch {
            const data: { estadoDesde: string; estadoActual: string; requiereJustificacionPorEstado: Record<string, boolean>; permitidos: Set<string> } = {
                estadoDesde: estadoFallback,
                estadoActual: estadoFallback,
                requiereJustificacionPorEstado: {},
                permitidos: new Set<string>(),
            };
            setTransicionesItem((prev) => ({ ...prev, [itemId]: data }));
            return data;
        }
    };

    const setVistaYNotificar = (next: 'cajas' | 'tabla') => {
        setVista(next);
        onVistaChange?.(next);
    };

    const contenedoresOrdenados = useMemo(() => {
        return [...contenedores].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
    }, [contenedores]);

    const opcionesUbicacion = useMemo(() => {
        const ordenados = [...contenedores].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
        return [
            { value: '', label: 'Sin ubicación' },
            ...ordenados.map((c) => ({ value: c.nombre, label: c.nombre })),
        ];
    }, [contenedores]);

    const toggleContenedor = (id: string) => setContenedoresExpandidos(prev => ({ ...prev, [id]: !prev[id] }));
    const toggleInstancia = (id: string) => setInstanciasExpandidas(prev => ({ ...prev, [id]: !prev[id] }));

    const abrirModalEditarSubinstancia = async (input: {
        idCon: string;
        idInst: string;
        sub: SubinstanciaHerramienta;
    }) => {
        const estadoOriginal = normalizarEstadoItem(input.sub.estado) ?? 'disponible';
        const estadoFisicoOriginal = normalizarEstadoFisicoItem(input.sub.estadoFisico) ?? 'bueno';

        try {
            const resp = await obtenerTransicionesPermitidasItemActivoEnBackend(input.sub.id);
            const estadoActual = normalizarEstadoItem(resp.estadoActual) ?? estadoOriginal;

            const requiereJustificacionPorEstado: Record<string, boolean> = {};
            for (const t of resp.transiciones ?? []) {
                requiereJustificacionPorEstado[t.estadoDestino] = Boolean(t.requiereJustificacion);
            }

            const opcionesEstado = [
                { value: estadoActual, label: `Actual: ${etiquetaEstadoItem(estadoActual)}` },
                ...(resp.transiciones ?? []).map((t) => ({
                    value: t.estadoDestino,
                    label: etiquetaEstadoItem(t.estadoDestino),
                })),
            ]
                .filter((o) => String(o.value ?? '').trim() !== 'en_revision')
                .filter((o, idx, arr) => arr.findIndex((x) => x.value === o.value) === idx);

            setModal({
                tipo: 'editar_subinstancia',
                idCon: input.idCon,
                idInst: input.idInst,
                idSub: input.sub.id,
                props: {
                    titulo: 'Editar item',
                    fechaRetiroOriginal: input.sub.fechaRetiro || '',
                    estadoOriginal: estadoActual,
                    estadoFisicoOriginal,
                    requiereJustificacionPorEstado,
                    campos: [
                        { key: 'codigoUnico', label: 'Código único (serie)', value: input.sub.codigoUnico || '' },
                        { key: 'codigoInventario', label: 'Código inventario', value: input.sub.codigoInventario || '', required: false },
                        { key: 'fechaCreacion', label: 'Fecha de creación', value: input.sub.fechaEntrega || '', type: 'datetime-local', required: false },
                        { key: 'estado', label: 'Estado operacional', value: estadoActual, type: 'select', options: opcionesEstado },
                        {
                            key: 'fechaRetiro',
                            label: 'Fecha y hora de retiro',
                            value: input.sub.fechaRetiro || '',
                            type: 'datetime-local',
                            required: false,
                            visibleWhen: (values: Record<string, string>) => String(values.estado ?? '').trim() === 'dado_de_baja',
                            requiredWhen: (values: Record<string, string>) => String(values.estado ?? '').trim() === 'dado_de_baja',
                            defaultValueWhenVisible: () => ahoraInputLocal(),
                        },
                        {
                            key: 'estadoFisico',
                            label: 'Estado físico',
                            value: estadoFisicoOriginal,
                            type: 'select',
                            options: ESTADOS_FISICOS_ITEM.map((e) => ({ value: e, label: etiquetaEstadoFisicoItem(e) })),
                        },
                        {
                            key: 'justificacion',
                            label: 'Justificación',
                            value: '',
                            type: 'textarea',
                            required: false,
                            rows: 3,
                            visibleWhen: (values: Record<string, string>) => {
                                const estadoSeleccionado = String(values.estado ?? '').trim();
                                if (!estadoSeleccionado) return false;
                                if (estadoSeleccionado === estadoActual) return false;
                                return Boolean(requiereJustificacionPorEstado?.[estadoSeleccionado]) || ['extraviado', 'dado_de_baja'].includes(estadoSeleccionado);
                            },
                            requiredWhen: (values: Record<string, string>) => {
                                const estadoSeleccionado = String(values.estado ?? '').trim();
                                if (!estadoSeleccionado) return false;
                                if (estadoSeleccionado === estadoActual) return false;
                                return Boolean(requiereJustificacionPorEstado?.[estadoSeleccionado]) || ['extraviado', 'dado_de_baja'].includes(estadoSeleccionado);
                            },
                        },
                        { key: 'ubicacion', label: 'Ubicación', value: input.sub.ubicacion || '', type: 'combobox', options: opcionesUbicacion, required: false },
                        { key: 'ue', label: 'U.E.', value: input.sub.ue || '' },
                        { key: 'descripcion', label: 'Descripción', value: input.sub.descripcion || '', type: 'textarea', required: false, rows: 4 },
                        { key: 'obs', label: 'Observaciones', value: input.sub.observaciones || '' },
                        { key: 'precio', label: 'Precio (Bs.)', value: input.sub.precio?.toString() || '0', type: 'number' },
                    ],
                },
            });
        } catch {
            setModal({
                tipo: 'editar_subinstancia',
                idCon: input.idCon,
                idInst: input.idInst,
                idSub: input.sub.id,
                props: {
                    titulo: 'Editar item',
                    fechaRetiroOriginal: input.sub.fechaRetiro || '',
                    estadoOriginal,
                    estadoFisicoOriginal,
                    requiereJustificacionPorEstado: {},
                    campos: [
                        { key: 'codigoUnico', label: 'Código único (serie)', value: input.sub.codigoUnico || '' },
                        { key: 'codigoInventario', label: 'Código inventario', value: input.sub.codigoInventario || '', required: false },
                        { key: 'fechaCreacion', label: 'Fecha de creación', value: input.sub.fechaEntrega || '', type: 'datetime-local', required: false },
                        { key: 'estado', label: 'Estado operacional', value: estadoOriginal, type: 'select', options: [{ value: estadoOriginal, label: `Actual: ${etiquetaEstadoItem(estadoOriginal)}` }] },
                        {
                            key: 'fechaRetiro',
                            label: 'Fecha y hora de retiro',
                            value: input.sub.fechaRetiro || '',
                            type: 'datetime-local',
                            required: false,
                            visibleWhen: (values: Record<string, string>) => String(values.estado ?? '').trim() === 'dado_de_baja',
                            requiredWhen: (values: Record<string, string>) => String(values.estado ?? '').trim() === 'dado_de_baja',
                            defaultValueWhenVisible: () => ahoraInputLocal(),
                        },
                        {
                            key: 'estadoFisico',
                            label: 'Estado físico',
                            value: estadoFisicoOriginal,
                            type: 'select',
                            options: ESTADOS_FISICOS_ITEM.map((e) => ({ value: e, label: etiquetaEstadoFisicoItem(e) })),
                        },
                        {
                            key: 'justificacion',
                            label: 'Justificación',
                            value: '',
                            type: 'textarea',
                            required: false,
                            rows: 3,
                            visibleWhen: (values: Record<string, string>) => {
                                const estadoSeleccionado = String(values.estado ?? '').trim();
                                if (!estadoSeleccionado) return false;
                                if (estadoSeleccionado === estadoOriginal) return false;
                                return ['extraviado', 'dado_de_baja'].includes(estadoSeleccionado);
                            },
                            requiredWhen: (values: Record<string, string>) => {
                                const estadoSeleccionado = String(values.estado ?? '').trim();
                                if (!estadoSeleccionado) return false;
                                if (estadoSeleccionado === estadoOriginal) return false;
                                return ['extraviado', 'dado_de_baja'].includes(estadoSeleccionado);
                            },
                        },
                        { key: 'ubicacion', label: 'Ubicación', value: input.sub.ubicacion || '', type: 'combobox', options: opcionesUbicacion, required: false },
                        { key: 'ue', label: 'U.E.', value: input.sub.ue || '' },
                        { key: 'descripcion', label: 'Descripción', value: input.sub.descripcion || '', type: 'textarea', required: false, rows: 4 },
                        { key: 'obs', label: 'Observaciones', value: input.sub.observaciones || '' },
                        { key: 'precio', label: 'Precio (Bs.)', value: input.sub.precio?.toString() || '0', type: 'number' },
                    ],
                },
            });
        }
    };

    const filasTabla = useMemo(() => {
        const filas = contenedores.flatMap((c) => c.herramientas.map((h) => ({ contenedor: c, herramienta: h })));
        return filas.sort((a, b) => {
            const porContenedor = a.contenedor.nombre.localeCompare(b.contenedor.nombre, 'es');
            if (porContenedor !== 0) return porContenedor;
            return a.herramienta.nombre.localeCompare(b.herramienta.nombre, 'es');
        });
    }, [contenedores]);

    const opcionesActivosGlobales = useMemo(() => {
        const mapa = new Map<string, { value: string; label: string }>();
        contenedores.forEach((c) => {
            c.herramientas.forEach((h) => {
                if (mapa.has(h.id)) return;
                mapa.set(h.id, {
                    value: h.id,
                    // Incluir códigos para que el buscador del combobox encuentre por nombre
                    label: `${h.nombre}${h.categoria ? ` · ${h.categoria}` : ''}`,
                });
            });
        });
        return [...mapa.values()].sort((a, b) => a.label.localeCompare(b.label, 'es'));
    }, [contenedores]);

    const itemsConUbicacionEfectiva = useMemo(() => {
        return contenedores.flatMap((cOrigen) =>
            cOrigen.herramientas.flatMap((h) =>
                h.subinstancias.map((sub) => ({
                    cOrigen,
                    h,
                    sub,
                    ubicacionEfectiva: (sub.ubicacion ?? '').trim() || cOrigen.nombre,
                }))
            )
        );
    }, [contenedores]);

    return (
        <div className="rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            {modal && (
                <FormularioEdicionJerarquia
                    titulo={modal.props.titulo}
                    camposIniciales={modal.props.campos}
                    onGuardar={async valores => {
                        if (modal.tipo === 'editar_instancia') {
                            await editarInstanciaActivo(modal.idCon!, modal.idInst!, {
                                nombre: String(valores.nombre ?? '').trim(),
                                categoria: valores.categoria || 'General',
                                descripcion: String(valores.descripcion ?? '').trim(),
                            });
                        }
                        if (modal.tipo === 'nueva_subinstancia') {
                            await agregarSubinstanciaActivo(modal.idCon!, modal.idInst!, {
                                codigoUnico: String(valores.codigoUnico ?? '').trim(),
                                codigoInventario: String(valores.codigoInventario ?? '').trim(),
                                fechaEntrega: valores.fechaCreacion || ahoraInputLocal(),
                                fechaRetiro: undefined,
                                estado: 'disponible',
                                estadoFisico: 'bueno',
                                ubicacion: valores.ubicacion || '',
                                observaciones: '',
                                ue: valores.ue,
                                descripcion: valores.descripcion,
                                precio: parseFloat(valores.precio) || 0,
                            });
                        }
                        if (modal.tipo === 'nueva_subinstancia_en_contenedor') {
                            const idActivo = valores.idActivo?.trim();
                            if (!idActivo) throw new Error('Selecciona un activo.');

                            const nombreContenedor = contenedores.find((c) => c.id === modal.idCon)?.nombre ?? '';

                            await agregarSubinstanciaActivo(modal.idCon!, idActivo, {
                                codigoUnico: String(valores.codigoUnico ?? '').trim(),
                                codigoInventario: String(valores.codigoInventario ?? '').trim(),
                                fechaEntrega: valores.fechaCreacion || ahoraInputLocal(),
                                fechaRetiro: undefined,
                                estado: 'disponible',
                                estadoFisico: 'bueno',
                                ubicacion: nombreContenedor,
                                observaciones: '',
                                ue: valores.ue,
                                descripcion: valores.descripcion,
                                precio: parseFloat(valores.precio) || 0,
                            });
                        }
                        if (modal.tipo === 'editar_subinstancia') {
                            const estadoOriginal = String(modal.props?.estadoOriginal ?? '').trim();
                            const estadoNuevo = String(valores.estado ?? '').trim();
                            const estadoParaEnviar = estadoNuevo && estadoNuevo !== estadoOriginal ? estadoNuevo : undefined;

                            const estadoEfectivo = (estadoParaEnviar ?? estadoOriginal) as any;

                            const estadoFisicoOriginal = String(modal.props?.estadoFisicoOriginal ?? '').trim();
                            const estadoFisicoNuevo = String(valores.estadoFisico ?? '').trim();
                            const estadoFisicoParaEnviar = estadoFisicoNuevo && estadoFisicoNuevo !== estadoFisicoOriginal ? estadoFisicoNuevo : undefined;

                            const justificacion = String(valores.justificacion ?? '').trim();
                            const requiereJustificacion =
                                !!estadoParaEnviar &&
                                (Boolean(modal.props?.requiereJustificacionPorEstado?.[estadoParaEnviar]) || ['extraviado', 'dado_de_baja'].includes(estadoParaEnviar));
                            if (requiereJustificacion && !justificacion) {
                                throw new Error('Debes ingresar una justificación para este cambio de estado.');
                            }

                            const fisicoEfectivo = normalizarEstadoFisicoItem(estadoFisicoParaEnviar ?? estadoFisicoOriginal) ?? 'bueno';
                            if (estadoParaEnviar === 'dado_de_baja' && fisicoEfectivo !== 'malo') {
                                throw new Error('Para dar de baja el equipo, el estado físico debe ser "malo".');
                            }

                            const fechaRetiroValor = String(valores.fechaRetiro ?? '').trim();
                            const requiereFechaRetiro = estadoEfectivo === 'dado_de_baja';
                            if (requiereFechaRetiro && !fechaRetiroValor) {
                                throw new Error('Debes registrar fecha y hora de retiro para estado "dado_de_baja".');
                            }

                            await editarSubinstanciaActivo(modal.idCon!, modal.idInst!, modal.idSub!, {
                                codigoUnico: String(valores.codigoUnico ?? '').trim(),
                                codigoInventario: String(valores.codigoInventario ?? '').trim(),
                                fechaEntrega: valores.fechaCreacion || undefined,
                                fechaRetiro: requiereFechaRetiro ? fechaRetiroValor : undefined,
                                estado: estadoParaEnviar as any,
                                estadoFisico: estadoFisicoParaEnviar as any,
                                ubicacion: valores.ubicacion || '',
                                observaciones: valores.obs,
                                justificacion: justificacion || undefined,
                                ue: valores.ue,
                                descripcion: valores.descripcion,
                                precio: parseFloat(valores.precio) || 0,
                            });
                        }

                        if (modal.tipo === 'cambiar_estado_inline') {
                            const estadoDestino = String(modal.props?.estadoDestino ?? '').trim();
                            const estadoOrigen = String(modal.props?.estadoOrigen ?? '').trim();
                            if (!estadoDestino || estadoDestino === estadoOrigen) {
                                setModal(null);
                                return;
                            }
                            const justificacion = String(valores.justificacion ?? '').trim();
                            if (!justificacion) {
                                throw new Error('Debes ingresar una justificación para este cambio de estado.');
                            }
                            await editarSubinstanciaActivo(modal.idCon!, modal.idInst!, modal.idSub!, {
                                estado: estadoDestino as any,
                                justificacion,
                            });
                        }
                    }}
                    onCerrar={() => setModal(null)}
                />
            )}

            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800">
                <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-slate-500" />
                    <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                        Estructura de Contenedores, Activos e Ítems
                    </h2>
                </div>

                <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg">
                    <button
                            onClick={() => setVistaYNotificar('cajas')}
                        className={`p-1.5 rounded-md flex items-center justify-center transition-colors ${vista === 'cajas' ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600 dark:text-blue-400' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                        title="Vista por contenedores"
                        type="button"
                    >
                        <ListIcon className="h-3.5 w-3.5" />
                    </button>
                    <button
                            onClick={() => setVistaYNotificar('tabla')}
                        className={`p-1.5 rounded-md flex items-center justify-center transition-colors ${vista === 'tabla' ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600 dark:text-blue-400' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                        title="Vista de tabla"
                        type="button"
                    >
                        <TableIcon className="h-3.5 w-3.5" />
                    </button>
                </div>
            </div>

            {vista === 'tabla' ? (
                <div className="p-4 bg-slate-50/50 dark:bg-slate-900/50">
                    <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                        <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300 border-collapse">
                            <thead className="bg-slate-50 dark:bg-slate-800/80 text-xs uppercase text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 font-semibold tracking-wider">
                                <tr>
                                    <th className="px-4 py-3">Tipo / modelo</th>
                                    <th className="px-4 py-3">Contenedor</th>
                                    <th className="px-4 py-3 text-center min-w-[90px]">Ítems</th>
                                    <th className="px-4 py-3 text-right min-w-[160px]">Valor total (Bs)</th>
                                    <th className="px-4 py-3 text-center min-w-[160px]">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                                {filasTabla.map(({ contenedor: c, herramienta: h }) => {
                                    const expandida = !!instanciasExpandidas[h.id];
                                    const totalValor = h.subinstancias.reduce((acc, s) => acc + (s.precio || 0), 0);

                                    return (
                                        <Fragment key={h.id}>
                                            <tr className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                                                <td className="px-4 py-3">
                                                    <button
                                                        type="button"
                                                        onClick={() => toggleInstancia(h.id)}
                                                        className="flex items-center gap-2 text-left"
                                                        title={expandida ? 'Contraer ítems' : 'Ver ítems'}
                                                    >
                                                        {expandida ? <ChevronDown className="h-4 w-4 text-slate-400" /> : <ChevronRight className="h-4 w-4 text-slate-400" />}
                                                        <Wrench className="h-4 w-4 text-blue-500" />
                                                        <div className="flex flex-col">
                                                            <span className="font-semibold text-slate-800 dark:text-slate-100 leading-tight">{h.nombre}</span>
                                                            <span className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">{h.categoria || 'Sin categoría'}</span>
                                                        </div>
                                                    </button>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 leading-tight">{c.nombre}</span>
                                                        <span className="text-[11px] text-slate-400 leading-tight">{c.descripcion || 'Sin descripción'}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <span className="text-[10px] font-bold px-2 py-1 rounded-md bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 inline-flex min-w-[3.5rem] justify-center">
                                                        {h.subinstancias.length} UND
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                                        {totalValor.toLocaleString('es-BO', { minimumFractionDigits: 2 })}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <div className="inline-flex items-center justify-center gap-2">
                                                        <button
                                                            type="button"
                                                            title="Editar activo"
                                                            onClick={() =>
                                                                setModal({
                                                                    tipo: 'editar_instancia',
                                                                    idCon: c.id,
                                                                    idInst: h.id,
                                                                    props: {
                                                                        titulo: 'Editar activo fijo',
                                                                        campos: [

                                                                            { key: 'nombre', label: 'Nombre', value: h.nombre },
                                                                            { key: 'descripcion', label: 'Descripción', value: h.descripcion || '' },
                                                                        ],
                                                                    },
                                                                })
                                                            }
                                                            className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors inline-flex"
                                                        >
                                                            <Edit2 className="h-4 w-4" />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            title="Eliminar activo"
                                                            onClick={async () => {
                                                                const ok = await confirmar({
                                                                    titulo: 'Eliminar activo',
                                                                    descripcion: `¿Eliminar el activo "${h.nombre}" y todos sus ítems?`,
                                                                    textoConfirmar: 'Eliminar',
                                                                    textoCancelar: 'Cancelar',
                                                                    varianteConfirmar: 'destructive',
                                                                });
                                                                if (!ok) return;
                                                                await eliminarInstanciaActivo(c.id, h.id);
                                                            }}
                                                            className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-md text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors inline-flex"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                setModal({
                                                                    tipo: 'nueva_subinstancia',
                                                                    idCon: c.id,
                                                                    idInst: h.id,
                                                                    props: {
                                                                        titulo: 'Crear item',
                                                                        campos: [
                                                                            { key: 'codigoUnico', label: 'Código único (serie)', value: '' },
                                                                          { key: 'codigoInventario', label: 'Código de inventario', value: '', required: false },
                                                                            { key: 'fechaCreacion', label: 'Fecha de creación', value: ahoraInputLocal(), type: 'datetime-local', required: false },
                                                                            { key: 'ubicacion', label: 'Ubicación', value: c.nombre, type: 'combobox', options: opcionesUbicacion, required: false },
                                                                            { key: 'ue', label: 'U.E.', value: '' },
                                                                            { key: 'descripcion', label: 'Descripción', value: '', type: 'textarea', required: false, rows: 4 },
                                                                            { key: 'precio', label: 'Precio (Bs.)', value: '0', type: 'number' },
                                                                        ],
                                                                    },
                                                                })
                                                            }
                                                            className="text-xs px-2.5 py-1.5 rounded-md bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-400 font-semibold transition-colors"
                                                        >
                                                            Crear item
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>

                                            {expandida && (
                                                <tr className="bg-slate-50/50 dark:bg-slate-900/50">
                                                    <td colSpan={5} className="px-4 py-3">
                                                        <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                                                            <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300 border-collapse">
                                                                <thead className="bg-slate-50 dark:bg-slate-800/80 text-[10px] uppercase text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 font-semibold tracking-wider">
                                                                    <tr>
                                                                        <th className="px-3 py-2 min-w-[120px]">Inventario</th>
                                                                        <th className="px-3 py-2 min-w-[140px]">Único</th>
                                                                        <th className="px-3 py-2 min-w-[160px]">Fecha creación</th>
                                                                        <th className="px-3 py-2 min-w-[100px]">U.E.</th>
                                                                        <th className="px-3 py-2 min-w-[150px]">Estado operacional</th>
                                                                        <th className="px-3 py-2 min-w-[110px]">Estado físico</th>
                                                                        <th className="px-3 py-2">Descripción / Obs.</th>
                                                                        <th className="px-3 py-2 text-right min-w-[120px]">Precio (Bs)</th>
                                                                        <th className="px-3 py-2 text-center min-w-[80px]">Acción</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                                                                    {h.subinstancias.map((sub) => {
                                                                        const fechaMostrar = (sub.fechaEntrega || '').replace('T', ' ').slice(0, 16);

                                                                        return (
                                                                            <tr key={sub.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                                                                                <td className="px-3 py-2">
                                                                                    <span className="font-mono text-[10px] text-slate-700 dark:text-slate-300" title="Código inventario">
                                                                                        {sub.codigoInventario || '—'}
                                                                                    </span>
                                                                                </td>
                                                                                <td className="px-3 py-2">
                                                                                    <span className="font-mono text-[10px] text-slate-700 dark:text-slate-300" title="Código único (serie)">
                                                                                        {sub.codigoUnico || '—'}
                                                                                    </span>
                                                                                </td>
                                                                                <td className="px-3 py-2 text-[11px] text-slate-500 dark:text-slate-400">
                                                                                    {fechaMostrar || '—'}
                                                                                </td>
                                                                                <td className="px-3 py-2">
                                                                                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                                                                                        {sub.ue || 'N/A'}
                                                                                    </span>
                                                                                </td>
                                                                                <td className="px-3 py-2">
                                                                                    {(() => {
                                                                                        const estadoCanonico = normalizarEstadoItem(sub.estado) ?? 'disponible';
                                                                                        const guardando = !!guardandoEstadoItem[sub.id];
                                                                                        const data = transicionesItem[sub.id];

                                                                                        const opciones = (() => {
                                                                                            if (data?.permitidos && data.permitidos.size > 0) {
                                                                                                const lista = [estadoCanonico, ...Array.from(data.permitidos)];
                                                                                                return lista.filter((v, idx, arr) => arr.findIndex((x) => x === v) === idx);
                                                                                            }
                                                                                            return ESTADOS_ITEM_ACTIVO;
                                                                                        })();

                                                                                        const claseDot =
                                                                                            estadoCanonico === 'disponible'
                                                                                                ? 'bg-emerald-500 shadow-emerald-500/20'
                                                                                                : estadoCanonico === 'en_mantenimiento'
                                                                                                ? 'bg-amber-500 shadow-amber-500/20'
                                                                                                : 'bg-blue-500 shadow-blue-500/20';

                                                                                        return (
                                                                                            <div className="flex items-center gap-2">
                                                                                                <div className={`h-2.5 w-2.5 rounded-full shadow-sm ${claseDot}`} />
                                                                                                <select
                                                                                                    title="Cambiar estado operacional"
                                                                                                    value={estadoCanonico}
                                                                                                    disabled={guardando}
                                                                                                    onFocus={() => {
                                                                                                        void cargarTransiciones(sub.id, estadoCanonico);
                                                                                                    }}
                                                                                                    onChange={async (e) => {
                                                                                                        const estadoDestino = String(e.target.value ?? '').trim();
                                                                                                        if (!estadoDestino || estadoDestino === estadoCanonico) return;
                                                                                                        if (estadoDestino === 'dado_de_baja') {
                                                                                                            toast.error('Para dar de baja un item, usa "Editar item" (requiere fecha de retiro y estado físico).');
                                                                                                            return;
                                                                                                        }

                                                                                                        setGuardandoEstadoItem((prev) => ({ ...prev, [sub.id]: true }));
                                                                                                        try {
                                                                                                            const info = await cargarTransiciones(sub.id, estadoCanonico);
                                                                                                            if (info.permitidos.size > 0 && !info.permitidos.has(estadoDestino)) {
                                                                                                                toast.error('Transición no permitida desde el backend.');
                                                                                                                return;
                                                                                                            }

                                                                                                            const requiereJustificacion = Boolean(info.requiereJustificacionPorEstado?.[estadoDestino]) || estadoDestino === 'extraviado';
                                                                                                            if (requiereJustificacion) {
                                                                                                                setModal({
                                                                                                                    tipo: 'cambiar_estado_inline',
                                                                                                                    idCon: c.id,
                                                                                                                    idInst: h.id,
                                                                                                                    idSub: sub.id,
                                                                                                                    props: {
                                                                                                                        titulo: `Justificación: ${etiquetaEstadoItem(estadoCanonico)} → ${etiquetaEstadoItem(estadoDestino)}`,
                                                                                                                        estadoOrigen: estadoCanonico,
                                                                                                                        estadoDestino,
                                                                                                                        campos: [
                                                                                                                            {
                                                                                                                                key: 'justificacion',
                                                                                                                                label: 'Justificación *',
                                                                                                                                value: '',
                                                                                                                                type: 'textarea',
                                                                                                                                required: true,
                                                                                                                                rows: 3,
                                                                                                                            },
                                                                                                                        ],
                                                                                                                    },
                                                                                                                });
                                                                                                                return;
                                                                                                            }

                                                                                                            await editarSubinstanciaActivo(c.id, h.id, sub.id, { estado: estadoDestino as any });
                                                                                                            toast.success('Estado actualizado.');
                                                                                                        } catch (err) {
                                                                                                            toast.error(err instanceof Error ? err.message : 'No se pudo actualizar el estado.');
                                                                                                        } finally {
                                                                                                            setGuardandoEstadoItem((prev) => ({ ...prev, [sub.id]: false }));
                                                                                                        }
                                                                                                    }}
                                                                                                    className="h-7 rounded-md border border-slate-200 bg-white px-2 text-[11px] font-semibold text-slate-700 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                                                                                                >
                                                                                                    {opciones.map((op) => (
                                                                                                        <option key={op} value={op}>
                                                                                                            {etiquetaEstadoItem(op)}
                                                                                                        </option>
                                                                                                    ))}
                                                                                                </select>
                                                                                            </div>
                                                                                        );
                                                                                    })()}
                                                                                </td>
                                                                                <td className="px-3 py-2">
                                                                                    {(() => {
                                                                                        const fisico = normalizarEstadoFisicoItem(sub.estadoFisico) ?? 'bueno';
                                                                                        const clase = fisico === 'bueno' ? 'bg-emerald-500' : fisico === 'regular' ? 'bg-amber-500' : 'bg-red-500';
                                                                                        const guardando = !!guardandoEstadoFisicoItem[sub.id];
                                                                                        return (
                                                                                            <div className="flex items-center gap-2">
                                                                                                <div className={`h-2.5 w-2.5 rounded-full shadow-sm ${clase}`} />
                                                                                                <select
                                                                                                    title="Cambiar estado físico"
                                                                                                    value={fisico}
                                                                                                    disabled={guardando}
                                                                                                    onChange={async (e) => {
                                                                                                        const destino = normalizarEstadoFisicoItem(String(e.target.value ?? '').trim()) ?? 'bueno';
                                                                                                        if (!destino || destino === fisico) return;
                                                                                                        setGuardandoEstadoFisicoItem((prev) => ({ ...prev, [sub.id]: true }));
                                                                                                        try {
                                                                                                            await editarSubinstanciaActivo(c.id, h.id, sub.id, { estadoFisico: destino as any });
                                                                                                            toast.success('Estado físico actualizado.');
                                                                                                        } catch (err) {
                                                                                                            toast.error(err instanceof Error ? err.message : 'No se pudo actualizar el estado físico.');
                                                                                                        } finally {
                                                                                                            setGuardandoEstadoFisicoItem((prev) => ({ ...prev, [sub.id]: false }));
                                                                                                        }
                                                                                                    }}
                                                                                                    className="h-7 rounded-md border border-slate-200 bg-white px-2 text-[11px] font-semibold text-slate-700 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                                                                                                >
                                                                                                    {ESTADOS_FISICOS_ITEM.map((op) => (
                                                                                                        <option key={op} value={op}>
                                                                                                            {etiquetaEstadoFisicoItem(op)}
                                                                                                        </option>
                                                                                                    ))}
                                                                                                </select>
                                                                                            </div>
                                                                                        );
                                                                                    })()}
                                                                                </td>
                                                                                <td className="px-3 py-2 text-[11px] text-slate-500 dark:text-slate-400">
                                                                                    {sub.descripcion || sub.observaciones ? (
                                                                                        <span>
                                                                                            {sub.descripcion || ''}
                                                                                            {sub.descripcion && sub.observaciones ? ' · ' : ''}
                                                                                            {sub.observaciones ? `Obs: ${sub.observaciones}` : ''}
                                                                                        </span>
                                                                                    ) : (
                                                                                        '—'
                                                                                    )}
                                                                                </td>
                                                                                <td className="px-3 py-2 text-right">
                                                                                    <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200">
                                                                                        {(sub.precio || 0).toLocaleString('es-BO', { minimumFractionDigits: 2 })}
                                                                                    </span>
                                                                                </td>
                                                                                <td className="px-3 py-2 text-center">
                                                                                    <div className="inline-flex items-center justify-center gap-1">
                                                                                        <button
                                                                                            type="button"
                                                                                            title="Editar item"
                                                                                            onClick={() => void abrirModalEditarSubinstancia({ idCon: c.id, idInst: h.id, sub })}
                                                                                            className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors inline-flex"
                                                                                        >
                                                                                            <Edit2 className="h-4 w-4" />
                                                                                        </button>
                                                                                        <button
                                                                                            type="button"
                                                                                            title="Eliminar item"
                                                                                            onClick={async () => {
                                                                                                const ok = await confirmar({
                                                                                                    titulo: 'Eliminar ítem',
                                                                                                    descripcion: `¿Eliminar el item "${obtenerIdentificadorItem(sub) || sub.id}"?`,
                                                                                                    textoConfirmar: 'Eliminar',
                                                                                                    textoCancelar: 'Cancelar',
                                                                                                    varianteConfirmar: 'destructive',
                                                                                                });
                                                                                                if (!ok) return;
                                                                                                await eliminarSubinstanciaActivo(c.id, h.id, sub.id);
                                                                                            }}
                                                                                            className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-md text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors inline-flex"
                                                                                        >
                                                                                            <Trash2 className="h-4 w-4" />
                                                                                        </button>
                                                                                    </div>
                                                                                </td>
                                                                            </tr>
                                                                        );
                                                                    })}

                                                                    {h.subinstancias.length === 0 && (
                                                                        <tr>
                                                                            <td
                                                                                colSpan={9}
                                                                                className="px-3 py-6 text-center text-xs text-slate-500 bg-slate-50 dark:bg-slate-800/30"
                                                                            >
                                                                                No hay ítems registrados para este activo.
                                                                            </td>
                                                                        </tr>
                                                                    )}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </Fragment>
                                    );
                                })}

                                {filasTabla.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-4 py-10 text-center text-sm text-slate-500 bg-slate-50 dark:bg-slate-800/30">
                                            No hay tipos de activo para mostrar.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col gap-4 p-4 bg-slate-50/50 dark:bg-slate-900/50">
                    {contenedoresOrdenados.map(c => (
                        <div key={c.id} className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-hidden transition-all duration-200">
                            <div className="flex w-full items-center justify-between px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 group text-left border-b border-transparent data-[expanded=true]:border-slate-100 dark:data-[expanded=true]:border-slate-800" data-expanded={contenedoresExpandidos[c.id]}>
                                <button onClick={() => toggleContenedor(c.id)} className="flex items-center gap-2 flex-1 text-left">
                                    {contenedoresExpandidos[c.id] ? <ChevronDown className="h-5 w-5 text-slate-400" /> : <ChevronRight className="h-5 w-5 text-slate-400" />}
                                    <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 text-indigo-500">
                                        <Package className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <span className="font-semibold text-slate-700 dark:text-slate-200 block">{c.nombre}</span>
                                        <span className="text-[11px] text-slate-400 flex items-center gap-1">{c.descripcion || 'Sin descripción'}</span>
                                    </div>
                                </button>
                                <div className="flex items-center gap-3">
                                    {(() => {
                                        const itemsEnContenedor = itemsConUbicacionEfectiva
                                            .filter((it) => it.ubicacionEfectiva === c.nombre);
                                        const total = itemsEnContenedor.reduce((acc, it) => acc + (it.sub.precio || 0), 0);
                                        const cantidad = itemsEnContenedor.length;
                                        return (
                                            <>
                                    <span className="text-xs px-2 py-1 rounded-md bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400 font-medium">
                                        Total: Bs. {total.toLocaleString('es-BO', { minimumFractionDigits: 2 })}
                                    </span>
                                    <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                                        {cantidad} ítems
                                    </span>
                                            </>
                                        );
                                    })()}
                                </div>
                            </div>

                            {contenedoresExpandidos[c.id] && (
                                <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800/50">
                                    {(() => {
                                        const termino = busquedas[c.id]?.toLowerCase() || '';
                                        const items = itemsConUbicacionEfectiva
                                            .filter((it) => it.ubicacionEfectiva === c.nombre)
                                            .map(({ h, sub }) => ({ h, sub }))
                                            .sort((a, b) => {
                                                const porActivo = a.h.nombre.localeCompare(b.h.nombre, 'es');
                                                if (porActivo !== 0) return porActivo;
                                                return (a.sub.codigoInventario ?? '').localeCompare(b.sub.codigoInventario ?? '', 'es');
                                            });

                                        const itemsFiltrados = items.filter(({ h, sub }) => {
                                            if (!termino) return true;
                                            return (
                                                h.nombre.toLowerCase().includes(termino) ||
                                                h.categoria.toLowerCase().includes(termino) ||
                                                (h.descripcion && h.descripcion.toLowerCase().includes(termino)) ||
                                                ((sub.codigoUnico ?? '').toLowerCase().includes(termino)) ||
                                                ((sub.codigoInventario ?? '').toLowerCase().includes(termino)) ||
                                                etiquetaEstadoItem(sub.estado).toLowerCase().includes(termino) ||
                                                (sub.ubicacion && sub.ubicacion.toLowerCase().includes(termino)) ||
                                                (sub.observaciones && sub.observaciones.toLowerCase().includes(termino))
                                            );
                                        });

                                        const opcionesActivos = opcionesActivosGlobales;

                                        return (
                                            <>
                                                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                                    <div className="flex items-center relative max-w-md w-full">
                                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                                        <input
                                                            type="text"
                                                            placeholder={`Buscar en "${c.nombre}" (código, activo, estado, ubicación)...`}
                                                            value={busquedas[c.id] || ''}
                                                            onChange={(e) => setBusquedas((prev) => ({ ...prev, [c.id]: e.target.value }))}
                                                            className="w-full rounded-lg border border-slate-200 bg-slate-50 dark:bg-slate-800/50 pl-9 pr-4 py-2 text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-blue-400 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-blue-400/20 dark:border-slate-700 dark:text-slate-100 transition-all font-medium"
                                                        />
                                                    </div>

                                                    <button
                                                        type="button"
                                                        disabled={opcionesActivos.length === 0}
                                                        onClick={() =>
                                                            setModal({
                                                                tipo: 'nueva_subinstancia_en_contenedor',
                                                                idCon: c.id,
                                                                props: {
                                                                    titulo: 'Crear item',
                                                                    campos: [
                                                                        {
                                                                            key: 'idActivo',
                                                                            label: 'Tipo de activo',
                                                                            value: '',
                                                                            type: 'combobox',
                                                                            options: [
                                                                                { value: '', label: 'Selecciona un tipo de activo' },
                                                                                ...opcionesActivos,
                                                                            ],
                                                                        },
                                                                        { key: 'codigoUnico', label: 'Código único (serie)', value: '', required: false },
                                                                        { key: 'codigoInventario', label: 'Código de inventario', value: '', required: false },
                                                                        { key: 'fechaCreacion', label: 'Fecha de creación', value: ahoraInputLocal(), type: 'datetime-local', required: false },
                                                                        { key: 'ue', label: 'U.E.', value: '' },
                                                                        { key: 'descripcion', label: 'Descripción', value: '', type: 'textarea', required: false, rows: 4 },
                                                                        { key: 'precio', label: 'Precio (Bs.)', value: '0', type: 'number' },
                                                                    ],
                                                                },
                                                            })
                                                        }
                                                        className="inline-flex h-9 items-center justify-center rounded-lg bg-blue-600 px-3 text-xs font-semibold text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
                                                        title={opcionesActivos.length === 0 ? 'Primero crea al menos un tipo de activo fijo.' : 'Crear item dentro de este contenedor'}
                                                    >
                                                        Crear item
                                                    </button>
                                                </div>

                                                <div className="grid grid-cols-1 gap-2">
                                                    {itemsFiltrados.map(({ h, sub }) => {
                                                        const precioBob = (sub.precio || 0).toFixed(2);

                                                        return (
                                                            <div key={sub.id} className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2.5 dark:border-slate-800 dark:bg-slate-800/50 hover:border-blue-300 dark:hover:border-blue-700 transition-colors shadow-sm">
                                                                <div className="flex items-start justify-between">
                                                                    <div className="flex items-center gap-3 flex-wrap">
                                                                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">{h.nombre}</span>
                                                                        <span className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200">
                                                                            <span className="text-slate-400 dark:text-slate-500 font-semibold mr-1.5 text-[9px] uppercase tracking-wider">CÓDIGO:</span>
                                                                            {obtenerIdentificadorItem(sub) || '—'}
                                                                        </span>
                                                                        <div className="flex items-center gap-1.5 border-l border-slate-200 dark:border-slate-700 pl-3">
                                                                            {(() => {
                                                                                const estadoCanonico = normalizarEstadoItem(sub.estado) ?? 'disponible';
                                                                                const clase =
                                                                                    estadoCanonico === 'disponible'
                                                                                        ? 'bg-emerald-500'
                                                                                        : estadoCanonico === 'en_mantenimiento'
                                                                                        ? 'bg-amber-500'
                                                                                        : 'bg-red-500';
                                                                                return (
                                                                                    <>
                                                                                        <div className={`h-2 w-2 rounded-full shadow-sm ${clase}`} />
                                                                                        <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                                                                                            {etiquetaEstadoItem(estadoCanonico)}
                                                                                        </span>
                                                                                    </>
                                                                                );
                                                                            })()}
                                                                        </div>
                                                                        <div className="flex items-center gap-1.5 border-l border-slate-200 dark:border-slate-700 pl-3">
                                                                            {(() => {
                                                                                const fisico = normalizarEstadoFisicoItem(sub.estadoFisico) ?? 'bueno';
                                                                                const clase = fisico === 'bueno' ? 'bg-emerald-500' : fisico === 'regular' ? 'bg-amber-500' : 'bg-red-500';
                                                                                return (
                                                                                    <>
                                                                                        <div className={`h-2 w-2 rounded-full shadow-sm ${clase}`} />
                                                                                        <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                                                                                            {etiquetaEstadoFisicoItem(fisico)}
                                                                                        </span>
                                                                                    </>
                                                                                );
                                                                            })()}
                                                                        </div>
                                                                        <div className="flex items-center gap-1.5 border-l border-slate-200 dark:border-slate-700 pl-3">
                                                                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">U.E. {sub.ue || 'N/A'}</span>
                                                                        </div>
                                                                        <div className="flex items-center gap-1.5 border-l border-slate-200 dark:border-slate-700 pl-3">
                                                                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Bs. {precioBob}</span>
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex items-center gap-2">
                                                                        <button
                                                                            title="Editar item"
                                                                            onClick={() => void abrirModalEditarSubinstancia({ idCon: c.id, idInst: h.id, sub })}
                                                                            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-400 hover:text-blue-600 transition-colors"
                                                                        >
                                                                            <Edit2 className="h-3.5 w-3.5" />
                                                                        </button>
                                                                        <button
                                                                            title="Eliminar item"
                                                                            onClick={async () => {
                                                                                const ok = await confirmar({
                                                                                    titulo: 'Eliminar ítem',
                                                                                    descripcion: `¿Eliminar el item "${obtenerIdentificadorItem(sub) || sub.id}"?`,
                                                                                    textoConfirmar: 'Eliminar',
                                                                                    textoCancelar: 'Cancelar',
                                                                                    varianteConfirmar: 'destructive',
                                                                                });
                                                                                if (!ok) return;
                                                                                await eliminarSubinstanciaActivo(c.id, h.id, sub.id);
                                                                            }}
                                                                            className="p-1 hover:bg-red-50 dark:hover:bg-red-900/30 rounded text-slate-400 hover:text-red-600 transition-colors"
                                                                        >
                                                                            <Trash2 className="h-3.5 w-3.5" />
                                                                        </button>
                                                                    </div>
                                                                </div>

                                                                <div className="flex flex-col gap-1.5 mt-1.5 pt-2 border-t border-slate-100 dark:border-slate-700/50">
                                                                    {sub.descripcion && (
                                                                        <div className="flex items-center">
                                                                            <span className="text-[9px] font-bold text-blue-400 dark:text-blue-500 mr-2 uppercase tracking-wider">DESCRIPCIÓN:</span>
                                                                            <span className="text-xs font-medium text-slate-600 dark:text-slate-400">{sub.descripcion}</span>
                                                                        </div>
                                                                    )}
                                                                    <div className="flex items-center justify-between">
                                                                        <div className="flex items-center">
                                                                            <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 mr-2 uppercase tracking-wider">OBSERVACIÓN:</span>
                                                                            <span className="text-xs font-medium text-slate-600 dark:text-slate-400 italic truncate max-w-[150px] sm:max-w-xs">
                                                                                {sub.observaciones || 'Ninguna'}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>

                                                {itemsFiltrados.length === 0 && (
                                                    <div className="px-3 py-4 text-xs text-slate-500 text-center italic bg-slate-50 dark:bg-slate-800/30 rounded border border-dashed border-slate-200 dark:border-slate-700 mt-2">
                                                        {termino
                                                            ? `No se encontraron resultados para \"${busquedas[c.id]}\".`
                                                            : c.herramientas.length === 0
                                                                ? 'No hay tipos de activo registrados en este contenedor.'
                                                                : 'No hay ítems registrados en este contenedor.'}
                                                    </div>
                                                )}
                                            </>
                                        );
                                    })()}
                                    {c.herramientas.length === 0 && <div className="px-3 py-2 text-sm text-slate-400">Contenedor vacío.</div>}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
