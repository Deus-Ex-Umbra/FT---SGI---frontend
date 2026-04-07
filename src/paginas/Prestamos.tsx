import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import type { PaginaApp } from '@/tipos/navegacion';
import { LayoutPagina } from '@/componentes/layout/layout-pagina';
import { BarraFiltros } from '@/componentes/layout/barra-filtros';
import { FormularioCanastaPrestamo } from '@/componentes/prestamos/dialogo-canasta-prestamo';
import { useInventario } from '@/contextos/ContextoInventario';
import { useConfirmacion } from '@/contextos/ContextoConfirmacion';
import type { EstadoPrestamo, PrestamoCanastaRegistro } from '@/tipos/inventario';
import { LayoutGrid, ListIcon } from 'lucide-react';
import { FormularioEdicionJerarquia } from '@/componentes/inventario/formulario-edicion-jerarquia';
import { formatearFechaHora } from '@/lib/formato-fecha';
import { DatePicker } from '@/componentes/ui/date-picker';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/componentes/ui/tabs';
import { useBusquedaPaginacion } from '@/hooks/use-busqueda-paginacion';
import { DialogoDevolverCanasta } from '@/componentes/prestamos/dialogo-devolver-canasta';
import { normalizarEstadoFisicoItem } from '@/lib/estados-fisico-activo';
import {
    cargarCanastasPrestamoDesdeBackend,
    editarCanastaPrestamoEnBackend,
    editarItemActivoEnBackend,
    extenderCanastaPrestamoEnBackend,
    devolverCanastaPrestamoEnBackend,
    eliminarCanastaPrestamoEnBackend,
} from '@/lib/servicio-inventario';

interface Props {
    onNavegar: (pagina: PaginaApp) => void;
    onCerrarSesion: () => void;
}

interface FiltroPrestamoDesdeActivos {
    idHerramienta: string;
    carnetEstudiante: string;
    estado: EstadoPrestamo;
}

const opcionesEstado: { valor: EstadoPrestamo | ''; etiqueta: string }[] = [
    { valor: '', etiqueta: 'Todos los estados' },
    { valor: 'activo', etiqueta: 'Activo' },
    { valor: 'pendiente', etiqueta: 'Pendiente' },
    { valor: 'devuelto', etiqueta: 'Devuelto' },
    { valor: 'devuelto_fuera_de_fecha_limite', etiqueta: 'Devuelto fuera de fecha limite' },
    { valor: 'vencido', etiqueta: 'Vencido' },
];

const CLAVE_FILTRO_PRESTAMO_ITEM = 'sgi-filtro-prestamo-item';

const colorEstadoCanasta = (estado: EstadoPrestamo) => {
    if (estado === 'activo' || estado === 'pendiente') return 'text-blue-700 bg-blue-50 border-blue-200 dark:text-blue-300 dark:bg-blue-950/30 dark:border-blue-800';
    if (estado === 'devuelto' || estado === 'devuelto_fuera_de_fecha_limite') return 'text-emerald-700 bg-emerald-50 border-emerald-200 dark:text-emerald-300 dark:bg-emerald-950/30 dark:border-emerald-800';
    return 'text-red-700 bg-red-50 border-red-200 dark:text-red-300 dark:bg-red-950/30 dark:border-red-800';
};

export const Prestamos = ({ onNavegar, onCerrarSesion }: Props) => {
    const { prestamos, docentes, recargarDatos, herramientas } = useInventario();
    const { confirmar } = useConfirmacion();
    const [busqueda, setBusqueda] = useState('');
    const [filtroEstado, setFiltroEstado] = useState<EstadoPrestamo | ''>('');
    const [fechaDesde, setFechaDesde] = useState('');
    const [fechaHasta, setFechaHasta] = useState('');
    const [filtroIdHerramienta, setFiltroIdHerramienta] = useState('');
    const [vistaTabla, setVistaTabla] = useState(true);
    const [tabDevoluciones, setTabDevoluciones] = useState<'no_devueltos' | 'devueltos'>('no_devueltos');
    const [canastas, setCanastas] = useState<PrestamoCanastaRegistro[]>([]);
    const [cargandoCanastas, setCargandoCanastas] = useState(false);
    const [errorCanastas, setErrorCanastas] = useState('');
    const [modalEditarFechas, setModalEditarFechas] = useState<PrestamoCanastaRegistro | null>(null);
    const [modalEditarCanasta, setModalEditarCanasta] = useState<PrestamoCanastaRegistro | null>(null);
    const [mostrarCanasta, setMostrarCanasta] = useState(false);
    const [modalDevolverCanasta, setModalDevolverCanasta] = useState<PrestamoCanastaRegistro | null>(null);

    const activos = prestamos.filter(p => p.estado === 'activo' || p.estado === 'pendiente').length;
    const vencidos = prestamos.filter(p => p.estado === 'vencido').length;

    const cargarCanastas = async () => {
        try {
            setCargandoCanastas(true);
            setErrorCanastas('');
            const data = await cargarCanastasPrestamoDesdeBackend();
            setCanastas(data);
        } catch (err: any) {
            setErrorCanastas(err?.message ?? 'No se pudieron cargar las canastas.');
        } finally {
            setCargandoCanastas(false);
        }
    };

    useEffect(() => {
        void cargarCanastas();
    }, []);

    useEffect(() => {
        const payload = sessionStorage.getItem(CLAVE_FILTRO_PRESTAMO_ITEM);
        if (!payload) return;

        try {
            const filtro = JSON.parse(payload) as FiltroPrestamoDesdeActivos;
            if (filtro?.idHerramienta) {
                setFiltroIdHerramienta(filtro.idHerramienta);
            }
            if (filtro?.carnetEstudiante) {
                setBusqueda(filtro.carnetEstudiante);
            }
            if (filtro?.estado) {
                setFiltroEstado(filtro.estado);
            }
            setVistaTabla(true);
        } catch {
        } finally {
            sessionStorage.removeItem(CLAVE_FILTRO_PRESTAMO_ITEM);
        }
    }, []);

    const obtenerTextoEstudiantes = useCallback((canasta: PrestamoCanastaRegistro) => {
        if (canasta.estudiantes.length > 0) {
            return canasta.estudiantes.map((estudiante) => `${estudiante.apellido}, ${estudiante.nombre}`).join(' · ');
        }

        return canasta.carnetsEstudiantes.join(' · ') || canasta.carnetEstudiante;
    }, []);

    const obtenerTextoCarnets = useCallback((canasta: PrestamoCanastaRegistro) => {
        return canasta.carnetsEstudiantes.join(', ') || canasta.carnetEstudiante;
    }, []);

    const aFecha = (valor: string, finDia = false) => {
        if (!valor) return null;
        if (valor.includes('T')) return new Date(valor);
        return new Date(`${valor}T${finDia ? '23:59:59' : '00:00:00'}`);
    };

    const canastasFiltradasBase = useMemo(() => {
        const desde = aFecha(fechaDesde, false);
        const hasta = aFecha(fechaHasta, true);

        return canastas.filter((c) => {
            const coincideEstado = filtroEstado === '' || c.estado === filtroEstado;
            const coincideHerramienta = filtroIdHerramienta === '' || c.cosas.some((i) => i.idHerramienta === filtroIdHerramienta);
            const fechaPrestamo = aFecha(c.fechaPrestamo);
            const coincideFechaDesde = !desde || (!!fechaPrestamo && fechaPrestamo >= desde);
            const coincideFechaHasta = !hasta || (!!fechaPrestamo && fechaPrestamo <= hasta);
            return coincideEstado && coincideHerramienta && coincideFechaDesde && coincideFechaHasta;
        });
    }, [canastas, fechaDesde, fechaHasta, filtroEstado, filtroIdHerramienta]);

    const obtenerTextoBusqueda = useCallback(
        (c: PrestamoCanastaRegistro) => {
            const textoEstudiantes = obtenerTextoEstudiantes(c);
            const textoCarnets = obtenerTextoCarnets(c);
            const textoEquipos = c.cosas.map((i) => `${i.codigoInventario} ${i.nombre}`).join(' ');
            return [
                textoCarnets,
                textoEstudiantes,
                c.docente,
                textoEquipos,
                c.observaciones,
                c.fechaPrestamo,
            ].join(' ');
        },
        [obtenerTextoCarnets, obtenerTextoEstudiantes],
    );

    const { items_filtrados: canastasFiltradas } = useBusquedaPaginacion({
        items: canastasFiltradasBase,
        busqueda,
        obtenerTexto: obtenerTextoBusqueda,
    });

    const canastasDevueltas = useMemo(
        () => canastasFiltradas.filter((c) => c.estado === 'devuelto' || c.estado === 'devuelto_fuera_de_fecha_limite'),
        [canastasFiltradas],
    );

    const canastasNoDevueltas = useMemo(
        () => canastasFiltradas.filter((c) => !(c.estado === 'devuelto' || c.estado === 'devuelto_fuera_de_fecha_limite')),
        [canastasFiltradas],
    );

    const totalTabActual = tabDevoluciones === 'devueltos' ? canastasDevueltas.length : canastasNoDevueltas.length;

    const renderCanastas = (lista: PrestamoCanastaRegistro[], soloEliminar = false) => {
        if (vistaTabla) {
            return (
                <div className="space-y-4">
                    <div className="flex justify-end">
                        <button onClick={() => setMostrarCanasta(true)} className="inline-flex h-8 items-center rounded-md bg-emerald-600 px-3 text-xs font-bold text-white transition-colors hover:bg-emerald-700">
                            Nueva canasta
                        </button>
                    </div>

                    <div className="rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800">
                            <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                                Canastas
                                <span className="ml-2 text-xs font-normal text-slate-400">({lista.length} registros)</span>
                            </h2>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs">
                                <thead>
                                    <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/50">
                                        <th className="px-4 py-2.5 text-left font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Canasta</th>
                                        <th className="px-4 py-2.5 text-left font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Carnet</th>
                                        <th className="px-4 py-2.5 text-left font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Estudiante</th>
                                        <th className="px-4 py-2.5 text-left font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Docente</th>
                                        <th className="px-4 py-2.5 text-left font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Equipos</th>
                                        <th className="px-4 py-2.5 text-center font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Fecha préstamo</th>
                                        <th className="px-4 py-2.5 text-center font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Fecha devolución</th>
                                        <th className="px-4 py-2.5 text-center font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Estado</th>
                                        <th className="px-4 py-2.5 text-right font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {lista.map((c) => (
                                        <tr key={c.id} className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/40">
                                            <td className="px-4 py-2.5 font-mono text-slate-500 dark:text-slate-400">{c.id}</td>
                                            <td className="px-4 py-2.5 font-mono font-semibold text-blue-600 dark:text-blue-400">{obtenerTextoCarnets(c)}</td>
                                            <td className="px-4 py-2.5 text-slate-700 dark:text-slate-300">{obtenerTextoEstudiantes(c) || '—'}</td>
                                            <td className="px-4 py-2.5 text-slate-700 dark:text-slate-300">{c.docente}</td>
                                            <td className="px-4 py-2.5 text-slate-700 dark:text-slate-300">
                                                <div>{c.totalActivos} activo(s) · {c.cosas.map((i) => `[${i.codigoInventario}] ${i.nombre}`).join(', ') || '—'}</div>
                                            </td>
                                            <td className="px-4 py-2.5 text-center text-slate-600 dark:text-slate-400">{formatearFechaHora(c.fechaPrestamo)}</td>
                                            <td className="px-4 py-2.5 text-center text-slate-600 dark:text-slate-400">{c.fechaDevolucion ? formatearFechaHora(c.fechaDevolucion) : 'Pendiente'}</td>
                                            <td className="px-4 py-2.5 text-center text-slate-700 dark:text-slate-300">{c.estado}</td>
                                            <td className="px-4 py-2.5">
                                                <div className="flex justify-end gap-2">
                                                    {!soloEliminar && (
                                                        <>
                                                            <button onClick={() => setModalEditarCanasta(c)} className="h-7 rounded-md border border-slate-200 px-2 text-[11px] text-slate-700 dark:border-slate-700 dark:text-slate-200">Editar</button>
                                                            <button onClick={() => setModalEditarFechas(c)} className="h-7 rounded-md border border-blue-200 px-2 text-[11px] text-blue-700 dark:border-blue-800 dark:text-blue-300">Extender</button>
                                                            <button
                                                                onClick={() => setModalDevolverCanasta(c)}
                                                                className="h-7 rounded-md border border-emerald-200 px-2 text-[11px] text-emerald-700 dark:border-emerald-800 dark:text-emerald-300"
                                                            >
                                                                Devolver
                                                            </button>
                                                        </>
                                                    )}
                                                    <button
                                                        onClick={() => { void eliminarCanasta(c.id); }}
                                                        className="h-7 rounded-md border border-red-200 px-2 text-[11px] text-red-700 dark:border-red-800 dark:text-red-300"
                                                    >
                                                        Eliminar
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {lista.length === 0 && (
                                        <tr>
                                            <td colSpan={9} className="px-4 py-4 text-center text-slate-500 dark:text-slate-400">
                                                {cargandoCanastas ? 'Cargando canastas...' : errorCanastas || 'Sin canastas para los filtros actuales.'}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            );
        }

        return (
            <div className="space-y-4">
                <div className="flex justify-end">
                    <button onClick={() => setMostrarCanasta(true)} className="inline-flex h-8 items-center rounded-md bg-emerald-600 px-3 text-xs font-bold text-white transition-colors hover:bg-emerald-700">
                        Nueva canasta
                    </button>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {lista.map((c) => {
                        return (
                            <article key={c.id} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                                <div className="mb-3 flex items-start justify-between gap-2">
                                    <div>
                                        <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400">{c.id}</p>
                                        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">{obtenerTextoEstudiantes(c)}</h3>
                                        <p className="text-[11px] font-mono text-blue-600 dark:text-blue-400">{obtenerTextoCarnets(c)}</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">Docente: {c.docente}</p>
                                    </div>
                                    <span className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold uppercase ${colorEstadoCanasta(c.estado)}`}>
                                        {c.estado}
                                    </span>
                                </div>

                                <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
                                    <p><span className="font-semibold">Préstamo:</span> {formatearFechaHora(c.fechaPrestamo)}</p>
                                    <p><span className="font-semibold">Devolución:</span> {c.fechaDevolucion ? formatearFechaHora(c.fechaDevolucion) : 'Pendiente'}</p>
                                    <p><span className="font-semibold">Activos:</span> {c.totalActivos}</p>
                                    <p className="line-clamp-2"><span className="font-semibold">Detalle activos:</span> {c.cosas.map((i) => `[${i.codigoInventario}] ${i.nombre}`).join(', ') || 'Sin activos'}</p>
                                </div>

                                <div className="mt-4 flex flex-wrap gap-2">
                                    {!soloEliminar && (
                                        <>
                                            <button onClick={() => setModalEditarCanasta(c)} className="h-7 rounded-md border border-slate-200 px-2 text-[11px] text-slate-700 dark:border-slate-700 dark:text-slate-200">Editar</button>
                                            <button onClick={() => setModalEditarFechas(c)} className="h-7 rounded-md border border-blue-200 px-2 text-[11px] text-blue-700 dark:border-blue-800 dark:text-blue-300">Extender</button>
                                            <button onClick={() => setModalDevolverCanasta(c)} className="h-7 rounded-md border border-emerald-200 px-2 text-[11px] text-emerald-700 dark:border-emerald-800 dark:text-emerald-300">Devolver</button>
                                        </>
                                    )}
                                    <button onClick={() => { void eliminarCanasta(c.id); }} className="h-7 rounded-md border border-red-200 px-2 text-[11px] text-red-700 dark:border-red-800 dark:text-red-300">Eliminar</button>
                                </div>
                            </article>
                        );
                    })}

                    {lista.length === 0 && (
                        <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
                            {cargandoCanastas ? 'Cargando canastas...' : errorCanastas || 'Sin canastas para los filtros actuales.'}
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const confirmarDevolucionCanasta = async (
        canasta: PrestamoCanastaRegistro,
        payload: {
            estados: Array<{ idHerramienta: string; estadoDespachado: string; estadoActual: string }>;
            observaciones: string;
        },
    ) => {
        if (canasta.estado === 'devuelto' || canasta.estado === 'devuelto_fuera_de_fecha_limite') return;

        const estaVencida = canasta.estado === 'vencido';
        if (estaVencida) {
            const ok = await confirmar({
                titulo: 'Canasta vencida',
                descripcion:
                    'Esta canasta está VENCIDA. Puedes devolverla igual; quedará registrada como devuelta fuera de la fecha límite. ¿Deseas continuar?',
                textoConfirmar: 'Devolver',
                textoCancelar: 'Cancelar',
            });
            if (!ok) return;
        }

        // 1) Aplicar cambios de estado físico por activo (si hay)
        const cambios = (payload.estados ?? []).filter((e) => String(e.estadoDespachado) !== String(e.estadoActual));
        for (const cambio of cambios) {
            const fisico = normalizarEstadoFisicoItem(String(cambio.estadoActual)) ?? 'bueno';
            await editarItemActivoEnBackend(cambio.idHerramienta, { estadoFisico: fisico });
        }

        // 2) Guardar observaciones (pre-escritas) antes de devolver.
        const obsNueva = String(payload.observaciones ?? '').trim();
        if (obsNueva !== String(canasta.observaciones ?? '').trim()) {
            const actualizada = await editarCanastaPrestamoEnBackend(canasta.id, { observaciones: obsNueva });
            setCanastas((prev) => prev.map((c) => (c.id === canasta.id ? actualizada : c)));
        }

        // 3) Devolver canasta
        const res = await devolverCanastaPrestamoEnBackend(canasta.id);
        toast.success(
            res.estado === 'devuelto_fuera_de_fecha_limite'
                ? 'Canasta devuelta (fuera de fecha límite).'
                : 'Canasta devuelta.',
        );
        setTabDevoluciones('devueltos');
        await recargarDatos();
        await cargarCanastas();
    };

    const eliminarCanasta = async (idCanasta: string) => {
        const ok = await confirmar({
            titulo: 'Eliminar canasta',
            descripcion: '¿Eliminar esta canasta de préstamo?',
            textoConfirmar: 'Eliminar',
            textoCancelar: 'Cancelar',
            varianteConfirmar: 'destructive',
        });
        if (!ok) return;
        await eliminarCanastaPrestamoEnBackend(idCanasta);
        await recargarDatos();
        await cargarCanastas();
    };

    const canastaParaDevolver = modalDevolverCanasta;


    return (
        <LayoutPagina
            paginaActiva="prestamos"
            titulo="Préstamos de Activos Fijos"
            subtitulo={`${activos} activos · ${vencidos} vencidos · ${canastas.length} canastas en total`}
            alertas={vencidos}
            onNavegar={onNavegar}
            onCerrarSesion={onCerrarSesion}
        >
            <div className="mb-6 flex items-center justify-between">
                <BarraFiltros
                    busqueda={busqueda}
                    onBusquedaChange={setBusqueda}
                    placeholder="Buscar por carnet, estudiante, activo..."
                    filtrosActivos={filtroEstado !== '' || !!fechaDesde || !!fechaHasta || filtroIdHerramienta !== ''}
                    onLimpiarFiltros={() => { setBusqueda(''); setFiltroEstado(''); setFechaDesde(''); setFechaHasta(''); setFiltroIdHerramienta(''); }}
                    textoResultados={`${totalTabActual} de ${canastasFiltradas.length}`}
                >
                    <select
                        title="Filtrar por estado"
                        value={filtroEstado}
                        onChange={e => setFiltroEstado(e.target.value as EstadoPrestamo | '')}
                        className="h-8 rounded-md border border-slate-200 bg-white px-3 text-xs text-slate-700 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                    >
                        {opcionesEstado.map(o => <option key={o.valor} value={o.valor}>{o.etiqueta}</option>)}
                    </select>
                    <DatePicker
                        value={fechaDesde}
                        onChange={setFechaDesde}
                        placeholder="Desde"
                        title="Desde"
                        className="h-8 w-[140px] px-3 text-xs"
                    />
                    <DatePicker
                        value={fechaHasta}
                        onChange={setFechaHasta}
                        placeholder="Hasta"
                        title="Hasta"
                        className="h-8 w-[140px] px-3 text-xs"
                    />
                </BarraFiltros>

                <div className="ml-4 flex h-9 flex-shrink-0 items-center gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-800">
                    <button
                        onClick={() => setVistaTabla(true)}
                        className={`inline-flex h-7 items-center gap-1.5 rounded-md px-2.5 text-xs font-bold transition-all ${vistaTabla ? 'bg-white text-blue-600 shadow-sm dark:bg-slate-700 dark:text-blue-400' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'}`}
                    >
                        <ListIcon className="h-3.5 w-3.5" />
                        Tabla
                    </button>
                    <button
                        onClick={() => setVistaTabla(false)}
                        className={`inline-flex h-7 items-center gap-1.5 rounded-md px-2.5 text-xs font-bold transition-all ${!vistaTabla ? 'bg-white text-blue-600 shadow-sm dark:bg-slate-700 dark:text-blue-400' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'}`}
                    >
                        <LayoutGrid className="h-3.5 w-3.5" />
                        Bloques
                    </button>
                </div>
            </div>

            <Tabs
                value={tabDevoluciones}
                onValueChange={(value) => setTabDevoluciones(value as 'no_devueltos' | 'devueltos')}
            >
                <TabsList>
                    <TabsTrigger value="no_devueltos">No devueltos ({canastasNoDevueltas.length})</TabsTrigger>
                    <TabsTrigger value="devueltos">Devueltos ({canastasDevueltas.length})</TabsTrigger>
                </TabsList>

                <TabsContent value="no_devueltos">{renderCanastas(canastasNoDevueltas)}</TabsContent>
                <TabsContent value="devueltos">{renderCanastas(canastasDevueltas, true)}</TabsContent>
            </Tabs>

            {mostrarCanasta && (
                <FormularioCanastaPrestamo
                    onCerrar={() => {
                        setMostrarCanasta(false);
                        void cargarCanastas();
                    }}
                />
            )}

            {modalEditarCanasta && (
                <FormularioEdicionJerarquia
                    titulo={`Editar canasta (${modalEditarCanasta.id})`}
                    camposIniciales={[
                        {
                            key: 'idDocente',
                            label: 'Docente',
                            value: modalEditarCanasta.idDocente ?? '',
                            type: 'combobox',
                            options: docentes.map((d) => ({ value: d.id, label: `[${d.codigo}] ${d.apellido}, ${d.nombre}` })),
                        },
                        { key: 'fechaPrestamo', label: 'Fecha/hora de préstamo', value: modalEditarCanasta.fechaPrestamo, type: 'datetime-local' },
                        { key: 'fechaDevolucion', label: 'Fecha/hora límite de devolución', value: modalEditarCanasta.fechaDevolucion ?? '', type: 'datetime-local', required: false },
                        { key: 'observaciones', label: 'Observaciones', value: modalEditarCanasta.observaciones, type: 'text', required: false },
                    ]}
                    onGuardar={(valores) => {
                        void (async () => {
                            if (!valores.idDocente) {
                                throw new Error('Debes seleccionar un docente.');
                            }
                            await editarCanastaPrestamoEnBackend(modalEditarCanasta.id, {
                                carnetsEstudiantes: modalEditarCanasta.carnetsEstudiantes,
                                idDocente: Number(valores.idDocente),
                                fechaPrestamo: valores.fechaPrestamo,
                                fechaDevolucion: valores.fechaDevolucion || null,
                                observaciones: valores.observaciones,
                            });
                            setModalEditarCanasta(null);
                            await recargarDatos();
                            await cargarCanastas();
                        })();
                    }}
                    onCerrar={() => setModalEditarCanasta(null)}
                />
            )}

            {modalEditarFechas && (
                <FormularioEdicionJerarquia
                    titulo={`Extender canasta (${modalEditarFechas.id})`}
                    camposIniciales={[
                        { key: 'fechaDevolucion', label: 'Fecha/hora límite de devolución', value: modalEditarFechas.fechaDevolucion ?? '', type: 'datetime-local', required: false },
                    ]}
                    onGuardar={(valores) => {
                        if (!valores.fechaDevolucion) return;
                        void (async () => {
                            await extenderCanastaPrestamoEnBackend(modalEditarFechas.id, valores.fechaDevolucion);
                            setModalEditarFechas(null);
                            await recargarDatos();
                            await cargarCanastas();
                        })();
                    }}
                    onCerrar={() => setModalEditarFechas(null)}
                />
            )}

            {canastaParaDevolver && (
                <DialogoDevolverCanasta
                    canasta={canastaParaDevolver}
                    herramientas={herramientas}
                    onCerrar={() => setModalDevolverCanasta(null)}
                    onConfirmar={(payload) => confirmarDevolucionCanasta(canastaParaDevolver, payload)}
                />
            )}

        </LayoutPagina>
    );
};
