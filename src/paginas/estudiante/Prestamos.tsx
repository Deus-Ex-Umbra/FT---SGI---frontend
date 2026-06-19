import { LayoutPagina } from '@/componentes/layout/layout-pagina';
import { Boton } from '@/componentes/ui/button';
import type { PropsPaginaBase } from '@/tipos/paginas';
import type { EstadoPrestamo } from '@/tipos/inventario';
import type { DashboardEstudiante } from '@/tipos/api';
import { descargarPdfCanastaEstudiante } from '@/lib/servicio-prestamos';
import { Clock, Check, Play, AlertTriangle, CheckCircle2, CalendarClock, X, Download, Package2, Users, UserRound, Eye } from 'lucide-react';
import { formatearFechaHora } from '@/utilidades/fechas';
import { useState, useMemo, useCallback } from 'react';
import { useDashboardEstudiante } from './use-dashboard-estudiante';
import { useBusquedaPaginacion } from '@/hooks/use-busqueda-paginacion';
import { DatePicker } from '@/componentes/ui/date-picker';
import { BarraFiltros } from '@/componentes/layout/barra-filtros';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/componentes/ui/tabs';
import { ModalBase } from '@/componentes/paginas/inventario/modal-base';

const colorEstadoCanasta = (estado: EstadoPrestamo) => {
    if (estado === 'solicitado') return 'text-amber-700 bg-amber-50 border-amber-200 dark:text-amber-300 dark:bg-amber-950/30 dark:border-amber-850';
    if (estado === 'aceptado') return 'text-purple-700 bg-purple-50 border-purple-200 dark:text-purple-300 dark:bg-purple-950/30 dark:border-purple-800';
    if (estado === 'rechazado') return 'text-rose-700 bg-rose-50 border-rose-200 dark:text-rose-300 dark:bg-rose-950/30 dark:border-rose-800';
    if (estado === 'despachado' || estado === 'activo' || estado === 'pendiente') return 'text-blue-700 bg-blue-50 border-blue-200 dark:text-blue-300 dark:bg-blue-950/30 dark:border-blue-800';
    if (estado === 'devuelto' || estado === 'devuelto_fuera_de_fecha_limite') return 'text-emerald-700 bg-emerald-50 border-emerald-200 dark:text-emerald-300 dark:bg-emerald-950/30 dark:border-emerald-800';
    return 'text-red-700 bg-red-50 border-red-200 dark:text-red-300 dark:bg-red-950/30 dark:border-red-800';
};

export const Prestamos = ({ onNavegar, onCerrarSesion }: PropsPaginaBase) => {
    const { cargando, error, datos, recargar } = useDashboardEstudiante(onCerrarSesion);
    const [descargandoId, setDescargandoId] = useState<string | null>(null);
    const [errorDescarga, setErrorDescarga] = useState<string | null>(null);
    const [modalVerActivos, setModalVerActivos] = useState<typeof prestamos[number] | null>(null);

    const [busqueda, setBusqueda] = useState('');
    const [fechaDesde, setFechaDesde] = useState('');
    const [fechaHasta, setFechaHasta] = useState('');
    const [tabEstado, setTabEstado] = useState<EstadoPrestamo>('solicitado');

    const renderEstadoPrestamo = (estado: EstadoPrestamo) => {
        return (
            <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase ${colorEstadoCanasta(estado)}`}>
                {estado === 'devuelto_fuera_de_fecha_limite' ? 'dev. fuera plazo' : estado}
            </span>
        );
    };

    const obtenerNombrePrestamo = (prestamo: DashboardEstudiante['prestamosResumen'][number]) => {
        if (prestamo.materiaNombre) {
            return prestamo.grupoPrestamoCodigo
                ? `${prestamo.materiaNombre} · ${prestamo.grupoPrestamoCodigo}`
                : prestamo.materiaNombre;
        }
        if (prestamo.esPrestamoGrupal) {
            return prestamo.grupoPrestamoNombre || prestamo.grupoPrestamoCodigo || `Préstamo grupal ${prestamo.grupoCanasta || prestamo.id}`;
        }
        if ((prestamo.cosas?.length ?? 0) === 1) return prestamo.cosas?.[0]?.nombre || 'Activo';
        if ((prestamo.cosas?.length ?? 0) > 1) return `${prestamo.cosas?.length} activos en préstamo`;
        if ((prestamo.consumibles?.length ?? 0) > 0) return `${prestamo.consumibles?.length} consumible(s) en préstamo`;
        return 'Préstamo';
    };

    const descargarBlob = (blob: Blob, filename: string) => {
        const url = URL.createObjectURL(blob);
        const enlace = document.createElement('a');
        enlace.href = url;
        enlace.download = filename;
        document.body.appendChild(enlace);
        enlace.click();
        enlace.remove();
        URL.revokeObjectURL(url);
    };

    const manejarDescargaPdf = async (prestamo: DashboardEstudiante['prestamosResumen'][number]) => {
        try {
            setDescargandoId(prestamo.id);
            setErrorDescarga(null);
            const blob = await descargarPdfCanastaEstudiante(prestamo.id);
            const nombre = `${prestamo.grupoPrestamoCodigo || prestamo.materiaCodigo || 'prestamo'}-${prestamo.id}.pdf`;
            descargarBlob(blob, nombre);
        } catch (errorActual) {
            setErrorDescarga(errorActual instanceof Error ? errorActual.message : 'No se pudo descargar el comprobante.');
        } finally {
            setDescargandoId(null);
        }
    };

    const aFecha = (valor: string, finDia = false) => {
        if (!valor) return null;
        if (valor.includes('T')) return new Date(valor);
        return new Date(`${valor}T${finDia ? '23:59:59' : '00:00:00'}`);
    };

    const prestamos = useMemo(() => datos?.prestamosResumen ?? [], [datos]);

    const prestamosFiltradosBase = useMemo(() => {
        const desde = aFecha(fechaDesde, false);
        const hasta = aFecha(fechaHasta, true);

        return prestamos.filter((p) => {
            const fechaP = aFecha(p.fechaPrestamo);
            const coincideFechaDesde = !desde || (!!fechaP && fechaP >= desde);
            const coincideFechaHasta = !hasta || (!!fechaP && fechaP <= hasta);
            return coincideFechaDesde && coincideFechaHasta;
        });
    }, [prestamos, fechaDesde, fechaHasta]);

    const obtenerTextoBusqueda = useCallback((p: typeof prestamos[number]) => {
        return [
            p.codigo || '',
            p.id || '',
            p.docente || '',
            obtenerNombrePrestamo(p) || '',
        ].join(' ');
    }, []);

    const { items_filtrados: prestamosFiltrados } = useBusquedaPaginacion({
        items: prestamosFiltradosBase,
        busqueda,
        obtenerTexto: obtenerTextoBusqueda,
    });

    const canastasSolicitadas = useMemo(
        () => prestamosFiltrados.filter((p) => p.estado === 'solicitado'),
        [prestamosFiltrados],
    );

    const canastasAceptadas = useMemo(
        () => prestamosFiltrados.filter((p) => p.estado === 'aceptado'),
        [prestamosFiltrados],
    );

    const canastasDespachadas = useMemo(
        () => prestamosFiltrados.filter((p) => ['despachado', 'activo', 'pendiente'].includes(p.estado)),
        [prestamosFiltrados],
    );

    const canastasVencidas = useMemo(
        () => prestamosFiltrados.filter((p) => p.estado === 'vencido'),
        [prestamosFiltrados],
    );

    const canastasDevueltas = useMemo(
        () => prestamosFiltrados.filter((p) => p.estado === 'devuelto'),
        [prestamosFiltrados],
    );

    const canastasDevueltasFueraPlazo = useMemo(
        () => prestamosFiltrados.filter((p) => p.estado === 'devuelto_fuera_de_fecha_limite'),
        [prestamosFiltrados],
    );

    const canastasRechazadas = useMemo(
        () => prestamosFiltrados.filter((p) => p.estado === 'rechazado'),
        [prestamosFiltrados],
    );

    const renderTablaEstudiante = (lista: typeof prestamos) => {
        return (
            <div className="rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800">
                    <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                        Listado de Préstamos
                        <span className="ml-2 text-xs font-normal text-slate-400">({lista.length} registros)</span>
                    </h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                        <thead>
                            <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/50">
                                <th className="px-6 py-3 text-left font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Código</th>
                                <th className="px-6 py-3 text-left font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Descripción / Préstamo</th>
                                <th className="px-6 py-3 text-left font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Docente</th>
                                <th className="px-6 py-3 text-center font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Fecha préstamo</th>
                                <th className="px-6 py-3 text-center font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Fecha devolución</th>
                                <th className="px-6 py-3 text-center font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Detalles</th>
                                <th className="px-6 py-3 text-center font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Estado</th>
                                <th className="px-6 py-3 text-right font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {lista.map((p) => (
                                <tr key={p.id} className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/40">
                                    <td className="px-6 py-3 font-mono text-slate-800 dark:text-slate-100 font-bold">{p.codigo ?? p.id}</td>
                                    <td className="px-6 py-3 text-slate-700 dark:text-slate-355 font-semibold">{obtenerNombrePrestamo(p)}</td>
                                    <td className="px-6 py-3 text-slate-600 dark:text-slate-400">{p.docente}</td>
                                    <td className="px-6 py-3 text-center text-slate-550 dark:text-slate-400">{formatearFechaHora(p.fechaPrestamo)}</td>
                                    <td className="px-6 py-3 text-center text-slate-550 dark:text-slate-400">{p.fechaDevolucion ? formatearFechaHora(p.fechaDevolucion) : '—'}</td>
                                    <td className="px-6 py-3">
                                        <div className="flex flex-wrap gap-2 justify-center text-[10px] text-slate-500">
                                            <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-1.5 py-0.5 dark:bg-slate-800 dark:text-slate-300">
                                                <Package2 className="h-3 w-3" /> {p.totalActivos ?? 0} Activos
                                            </span>
                                            <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-1.5 py-0.5 dark:bg-slate-800 dark:text-slate-300">
                                                <Users className="h-3 w-3" /> {p.estudiantes?.length ?? 0} Integrantes
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-3 text-center">{renderEstadoPrestamo(p.estado as EstadoPrestamo)}</td>
                                    <td className="px-6 py-3 text-right">
                                        <div className="flex justify-end gap-2">
                                            <Boton 
                                                type="button"
                                                variant="outline" 
                                                size="sm" 
                                                className="h-7 text-[10px] gap-1 px-2 border-slate-200 hover:bg-slate-50 dark:border-slate-800"
                                                onClick={() => setModalVerActivos(p)}
                                            >
                                                <Eye className="h-3 w-3" /> Ver activos
                                            </Boton>
                                            {p.esPrestamoGrupal && p.puedeDescargarPdf && (
                                                <Boton 
                                                    type="button" 
                                                    variant="outline" 
                                                    size="sm" 
                                                    className="h-7 text-[10px] gap-1 px-2 border-slate-200 hover:bg-slate-50 dark:border-slate-800"
                                                    onClick={() => void manejarDescargaPdf(p)} 
                                                    disabled={descargandoId === p.id}
                                                >
                                                    <Download className="h-3 w-3" />
                                                    {descargandoId === p.id ? 'Descargando...' : 'PDF'}
                                                </Boton>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {lista.length === 0 && (
                                <tr>
                                    <td colSpan={8} className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
                                        No hay registros de préstamos en esta sección.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    if (cargando && !datos) {
        return (
            <LayoutPagina paginaActiva="prestamos" titulo="Mis préstamos" subtitulo="Cargando tus movimientos..." onNavegar={onNavegar} onCerrarSesion={onCerrarSesion}>
                <div className="flex h-40 items-center justify-center">
                    <p className="animate-pulse text-sm text-slate-500 dark:text-slate-400">Obteniendo historial de préstamos...</p>
                </div>
            </LayoutPagina>
        );
    }

    if (error || !datos) {
        return (
            <LayoutPagina paginaActiva="prestamos" titulo="Mis préstamos" subtitulo="Préstamos activos e historial" onNavegar={onNavegar} onCerrarSesion={onCerrarSesion} onRecargar={recargar} recargando={cargando}>
                <div className="rounded-xl border border-red-200 bg-red-50 p-6 dark:border-red-900/40 dark:bg-red-900/10">
                    <p className="text-sm font-medium text-red-800 dark:text-red-400">No se pudieron cargar tus préstamos.</p>
                    <p className="mt-1 text-sm text-red-600 dark:text-red-300">{error}</p>
                </div>
            </LayoutPagina>
        );
    }

    return (
        <LayoutPagina paginaActiva="prestamos" titulo="Mis préstamos" subtitulo="Revisa tus préstamos actuales y tu historial reciente" onNavegar={onNavegar} onCerrarSesion={onCerrarSesion} onRecargar={recargar} recargando={cargando}>
            <div className="space-y-6">
                {errorDescarga && (
                    <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-900/10 dark:text-red-300">
                        {errorDescarga}
                    </div>
                )}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 rounded-xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                    <div className="flex items-center gap-4">
                        <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 shrink-0">
                            <UserRound className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wide">Estudiante</p>
                            <h3 className="text-base font-bold text-slate-900 dark:text-slate-50">{datos.perfil.nombre} {datos.perfil.apellido}</h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">C.I. {datos.perfil.carnet}</p>
                        </div>
                    </div>
                    <div className="flex flex-col justify-center border-t sm:border-t-0 sm:border-l border-slate-105 dark:border-slate-800 sm:pl-4">
                        <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wide">Carreras / C.U.</p>
                        <div className="mt-1 space-y-1">
                            {(datos.perfil.asignacionesCarrera ?? []).map((asig, index) => (
                                <div key={index} className="text-xs text-slate-700 dark:text-slate-300">
                                    <span className="font-semibold">{asig.carrera}:</span> <span className="font-mono text-blue-600 dark:text-blue-400">{asig.cu}</span>
                                </div>
                            ))}
                            {(!datos.perfil.asignacionesCarrera || datos.perfil.asignacionesCarrera.length === 0) && (
                                <div className="text-xs text-slate-700 dark:text-slate-300">
                                    <span className="font-semibold">{datos.perfil.carrera}:</span> <span className="font-mono text-blue-600 dark:text-blue-400">{datos.perfil.cu || 'No registrado'}</span>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-3 border-t lg:border-t-0 lg:border-l border-slate-105 dark:border-slate-800 lg:pl-4 sm:col-span-2 lg:col-span-1">
                        <div className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold uppercase ${datos.perfil.carnetRetenido ? 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/30 dark:text-red-300 dark:border-red-900' : 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-900'}`}>
                            {datos.perfil.carnetRetenido ? 'Carnet Retenido' : 'Carnet Habilitado'}
                        </div>
                    </div>
                </div>

                <Tabs value={tabEstado} onValueChange={(val) => setTabEstado(val as EstadoPrestamo)}>
                    <TabsList className="flex flex-wrap gap-1 p-1 rounded-lg bg-slate-100/60 dark:bg-slate-800/40 w-full justify-start h-auto">
                        <TabsTrigger value="solicitado" className="gap-1.5 text-sm font-semibold px-3 py-1.5 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950">
                            <Clock className="h-3.5 w-3.5 text-amber-500" />
                            Solicitado ({canastasSolicitadas.length})
                        </TabsTrigger>
                        <TabsTrigger value="aceptado" className="gap-1.5 text-sm font-semibold px-3 py-1.5 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950">
                            <Check className="h-3.5 w-3.5 text-purple-500" />
                            Aceptado ({canastasAceptadas.length})
                        </TabsTrigger>
                        <TabsTrigger value="despachado" className="gap-1.5 text-sm font-semibold px-3 py-1.5 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950">
                            <Play className="h-3.5 w-3.5 text-blue-500" />
                            Despachado ({canastasDespachadas.length})
                        </TabsTrigger>
                        <TabsTrigger value="vencido" className="gap-1.5 text-sm font-semibold px-3 py-1.5 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950">
                            <AlertTriangle className="h-3.5 w-3.5 text-rose-500" />
                            Vencido ({canastasVencidas.length})
                        </TabsTrigger>
                        <TabsTrigger value="devuelto" className="gap-1.5 text-sm font-semibold px-3 py-1.5 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                            Devuelto ({canastasDevueltas.length})
                        </TabsTrigger>
                        <TabsTrigger value="devuelto_fuera_de_fecha_limite" className="gap-1.5 text-sm font-semibold px-3 py-1.5 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950">
                            <CalendarClock className="h-3.5 w-3.5 text-amber-600" />
                            Dev. Fuera de Plazo ({canastasDevueltasFueraPlazo.length})
                        </TabsTrigger>
                        <TabsTrigger value="rechazado" className="gap-1.5 text-sm font-semibold px-3 py-1.5 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950">
                            <X className="h-3.5 w-3.5 text-red-500" />
                            Rechazado ({canastasRechazadas.length})
                        </TabsTrigger>
                    </TabsList>
                    <div className="mt-4 mb-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-slate-50/40 dark:bg-slate-900/10 p-3 rounded-xl border border-slate-100 dark:border-slate-800/60 shadow-2xs">
                        <div className="flex-1">
                            <BarraFiltros
                                busqueda={busqueda}
                                onBusquedaChange={setBusqueda}
                                placeholder="Filtrar por código..."
                                filtrosActivos={!!fechaDesde || !!fechaHasta}
                                onLimpiarFiltros={() => { setBusqueda(''); setFechaDesde(''); setFechaHasta(''); }}
                                buscadorDerecha={true}
                                grande={true}
                            >
                                <DatePicker
                                    value={fechaDesde}
                                    onChange={setFechaDesde}
                                    placeholder="Desde"
                                    title="Desde"
                                    className="h-10 w-[200px] px-3 text-sm"
                                />
                                <DatePicker
                                    value={fechaHasta}
                                    onChange={setFechaHasta}
                                    placeholder="Hasta"
                                    title="Hasta"
                                    className="h-10 w-[200px] px-3 text-sm"
                                />
                            </BarraFiltros>
                        </div>
                    </div>

                    <TabsContent value="solicitado" className="mt-4">{renderTablaEstudiante(canastasSolicitadas)}</TabsContent>
                    <TabsContent value="aceptado" className="mt-4">{renderTablaEstudiante(canastasAceptadas)}</TabsContent>
                    <TabsContent value="despachado" className="mt-4">{renderTablaEstudiante(canastasDespachadas)}</TabsContent>
                    <TabsContent value="vencido" className="mt-4">{renderTablaEstudiante(canastasVencidas)}</TabsContent>
                    <TabsContent value="devuelto" className="mt-4">{renderTablaEstudiante(canastasDevueltas)}</TabsContent>
                    <TabsContent value="devuelto_fuera_de_fecha_limite" className="mt-4">{renderTablaEstudiante(canastasDevueltasFueraPlazo)}</TabsContent>
                    <TabsContent value="rechazado" className="mt-4">{renderTablaEstudiante(canastasRechazadas)}</TabsContent>
                </Tabs>
            </div>

            {modalVerActivos && (
                <ModalBase
                    titulo={`Detalle de activos - Préstamo ${modalVerActivos.codigo ?? modalVerActivos.id}`}
                    onCerrar={() => setModalVerActivos(null)}
                    ancho="max-w-md"
                >
                    <div className="space-y-4 p-4 text-xs">
                        <div>
                            <h4 className="font-semibold text-slate-800 dark:text-slate-200 mb-2">Activos Fijos:</h4>
                            {modalVerActivos.cosas && modalVerActivos.cosas.length > 0 ? (
                                <ul className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-150 dark:border-slate-800 rounded-lg overflow-hidden">
                                    {modalVerActivos.cosas.map((item, idx) => (
                                        <li key={idx} className="px-3 py-2 bg-slate-50/50 dark:bg-slate-900/30 flex items-center justify-between">
                                            <div>
                                                <span className="font-mono font-semibold text-blue-600 dark:text-blue-400">[{item.codigoInventario || 'Sin asignar'}]</span>{' '}
                                                <span className="text-slate-705 dark:text-slate-300">{item.nombre}</span>
                                            </div>
                                            {item.registrado === false ? (
                                                <span className="inline-flex items-center rounded-full bg-rose-50 border border-rose-200 px-2 py-0.5 text-[9px] font-bold text-rose-700 dark:bg-rose-950/30 dark:border-rose-900/40 dark:text-rose-300 shrink-0">
                                                    No despachado
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[9px] font-bold text-emerald-700 dark:bg-emerald-950/30 dark:border-emerald-900/40 dark:text-emerald-300 shrink-0">
                                                    Prestado
                                                </span>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-slate-400 italic">Ningún activo fijo solicitado.</p>
                            )}
                        </div>

                        <div>
                            <h4 className="font-semibold text-slate-800 dark:text-slate-200 mb-2">Activos Fungibles (Consumibles):</h4>
                            {modalVerActivos.consumibles && modalVerActivos.consumibles.length > 0 ? (
                                <ul className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-150 dark:border-slate-800 rounded-lg overflow-hidden">
                                    {modalVerActivos.consumibles.map((item: any, idx: number) => (
                                        <li key={idx} className="px-3 py-2 bg-slate-50/50 dark:bg-slate-900/30 flex justify-between items-center">
                                            <div>
                                                <span className="text-slate-707 dark:text-slate-300 font-medium">{item.material}</span>
                                                {item.lote && <p className="text-[10px] text-slate-500">Lote/Serie: {item.lote}</p>}
                                            </div>
                                            <span className="font-mono bg-blue-50 text-blue-705 px-2 py-0.5 rounded text-[10px] font-bold dark:bg-blue-950/40 dark:text-blue-300">
                                                Cant: {['solicitado', 'aceptado'].includes(modalVerActivos.estado) ? item.cantidadSolicitada : (item.cantidadDespachada ?? item.cantidadSolicitada ?? item.cantidad ?? 0)}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-slate-400 italic">Ningún material fungible solicitado.</p>
                            )}
                        </div>

                        <div className="flex justify-end pt-2">
                            <Boton type="button" onClick={() => setModalVerActivos(null)}>Cerrar</Boton>
                        </div>
                    </div>
                </ModalBase>
            )}
        </LayoutPagina>
    );
};
