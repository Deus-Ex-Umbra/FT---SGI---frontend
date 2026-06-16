import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import type { PropsPaginaBase } from '@/tipos/paginas';
import { LayoutPagina } from '@/componentes/layout/layout-pagina';
import { BarraFiltros } from '@/componentes/layout/barra-filtros';
import { FormularioCanastaPrestamo } from '@/componentes/paginas/prestamos/dialogo-canasta-prestamo';
import { useInventario } from '@/contextos/ContextoInventario';
import { useConfirmacion } from '@/contextos/ContextoConfirmacion';
import type { EstadoPrestamo, PrestamoCanastaRegistro } from '@/tipos/inventario';
import { CheckCircle2, Play, Check, X, Clock, CalendarClock, AlertTriangle } from 'lucide-react';
import { FormularioEdicionJerarquia } from '@/componentes/paginas/inventario/formulario-edicion-jerarquia';
import { formatearFechaHora } from '@/utilidades/fechas';
import { DatePicker } from '@/componentes/ui/date-picker';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/componentes/ui/tabs';
import { Skeleton } from '@/componentes/ui/skeleton';
import { useBusquedaPaginacion } from '@/hooks/use-busqueda-paginacion';
import { DialogoDevolverCanasta } from '@/componentes/paginas/prestamos/dialogo-devolver-canasta';
import { DialogoDespacharCanasta } from '@/componentes/paginas/prestamos/dialogo-despachar-canasta';
import { ModalBase } from '@/componentes/paginas/inventario/modal-base';
import { Label } from '@/componentes/ui/label';
import { Textarea } from '@/componentes/ui/textarea';
import { Boton } from '@/componentes/ui/button';

import {
    cargarCanastasPrestamoDesdeBackend,
    extenderCanastaPrestamoEnBackend,
    devolverCanastaPrestamoEnBackend,
    eliminarCanastaPrestamoEnBackend,
    aceptarCanastaEnBackend,
    rechazarCanastaEnBackend,
    despacharCanastaEnBackend,
} from '@/lib/servicio-prestamos';

const colorEstadoCanasta = (estado: EstadoPrestamo) => {
    if (estado === 'solicitado') return 'text-amber-700 bg-amber-50 border-amber-200 dark:text-amber-300 dark:bg-amber-950/30 dark:border-amber-850';
    if (estado === 'aceptado') return 'text-purple-700 bg-purple-50 border-purple-200 dark:text-purple-300 dark:bg-purple-950/30 dark:border-purple-800';
    if (estado === 'rechazado') return 'text-rose-700 bg-rose-50 border-rose-200 dark:text-rose-300 dark:bg-rose-950/30 dark:border-rose-800';
    if (estado === 'despachado' || estado === 'activo' || estado === 'pendiente') return 'text-blue-700 bg-blue-50 border-blue-200 dark:text-blue-300 dark:bg-blue-950/30 dark:border-blue-800';
    if (estado === 'devuelto' || estado === 'devuelto_fuera_de_fecha_limite') return 'text-emerald-700 bg-emerald-50 border-emerald-200 dark:text-emerald-300 dark:bg-emerald-950/30 dark:border-emerald-800';
    return 'text-red-700 bg-red-50 border-red-200 dark:text-red-300 dark:bg-red-950/30 dark:border-red-800';
};

export const Prestamos = ({ onNavegar, onCerrarSesion }: PropsPaginaBase) => {
    const { recargarDatos, herramientas, estudiantes, cargando } = useInventario();
    const { confirmar } = useConfirmacion();
    
    const [busqueda, setBusqueda] = useState('');
    const [fechaDesde, setFechaDesde] = useState('');
    const [fechaHasta, setFechaHasta] = useState('');
    const [filtroIdHerramienta, setFiltroIdHerramienta] = useState('');
    
    const [tabDevoluciones, setTabDevoluciones] = useState<EstadoPrestamo>('solicitado');
    
    const [canastas, setCanastas] = useState<PrestamoCanastaRegistro[]>([]);
    const [cargandoCanastas, setCargandoCanastas] = useState(false);
    const [errorCanastas, setErrorCanastas] = useState('');
    
    const [modalEditarFechas, setModalEditarFechas] = useState<PrestamoCanastaRegistro | null>(null);
    const [modalEditarCanasta, setModalEditarCanasta] = useState<PrestamoCanastaRegistro | null>(null);
    const [mostrarCanasta, setMostrarCanasta] = useState(false);
    
    const [modalDespacharCanasta, setModalDespacharCanasta] = useState<PrestamoCanastaRegistro | null>(null);
    const [modalDevolverCanasta, setModalDevolverCanasta] = useState<PrestamoCanastaRegistro | null>(null);
    const [modalRechazarCanasta, setModalRechazarCanasta] = useState<PrestamoCanastaRegistro | null>(null);
    const [modalAceptarCanasta, setModalAceptarCanasta] = useState<PrestamoCanastaRegistro | null>(null);
    const [motivoRechazo, setMotivoRechazo] = useState('');


    const cargarCanastas = async (silencioso = false) => {
        try {
            if (!silencioso) setCargandoCanastas(true);
            setErrorCanastas('');
            const data = await cargarCanastasPrestamoDesdeBackend();
            setCanastas(data);
        } catch (err: any) {
            setErrorCanastas(err?.message ?? 'No se pudieron cargar las canastas.');
        } finally {
            if (!silencioso) setCargandoCanastas(false);
        }
    };

    useEffect(() => {
        void cargarCanastas();
    }, []);



    const obtenerTextoEstudiantes = useCallback((canasta: PrestamoCanastaRegistro) => {
        if (canasta.estudiantes && canasta.estudiantes.length > 0) {
            return canasta.estudiantes.map((estudiante) => `${estudiante.apellido}, ${estudiante.nombre}`).join(' · ');
        }
        return canasta.carnetsEstudiantes?.join(' · ') || canasta.carnetEstudiante;
    }, []);

    const obtenerTextoCarnets = useCallback((canasta: PrestamoCanastaRegistro) => {
        return canasta.carnetsEstudiantes?.join(', ') || canasta.carnetEstudiante;
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
            const coincideHerramienta = filtroIdHerramienta === '' || (c.cosas?.some((i) => i.idHerramienta === filtroIdHerramienta) ?? false);
            const fechaPrestamo = aFecha(c.fechaPrestamo);
            const coincideFechaDesde = !desde || (!!fechaPrestamo && fechaPrestamo >= desde);
            const coincideFechaHasta = !hasta || (!!fechaPrestamo && fechaPrestamo <= hasta);
            return coincideHerramienta && coincideFechaDesde && coincideFechaHasta;
        });
    }, [canastas, fechaDesde, fechaHasta, filtroIdHerramienta]);

    const obtenerTextoBusqueda = useCallback(
        (c: PrestamoCanastaRegistro) => {
            const textoEstudiantes = obtenerTextoEstudiantes(c);
            const textoCarnets = obtenerTextoCarnets(c);
            const textoEquipos = c.cosas?.map((i) => `${i.codigoInventario} ${i.nombre}`).join(' ') || '';
            return [
                c.codigo || '',
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

    const canastasSolicitadas = useMemo(
        () => canastasFiltradas.filter((c) => c.estado === 'solicitado'),
        [canastasFiltradas],
    );

    const canastasPorDespachar = useMemo(
        () => canastasFiltradas.filter((c) => c.estado === 'aceptado'),
        [canastasFiltradas],
    );

    const canastasDespachadas = useMemo(
        () => canastasFiltradas.filter((c) => ['despachado', 'activo', 'pendiente'].includes(c.estado)),
        [canastasFiltradas],
    );

    const canastasVencidas = useMemo(
        () => canastasFiltradas.filter((c) => c.estado === 'vencido'),
        [canastasFiltradas],
    );

    const canastasDevueltas = useMemo(
        () => canastasFiltradas.filter((c) => c.estado === 'devuelto'),
        [canastasFiltradas],
    );

    const canastasDevueltasFueraPlazo = useMemo(
        () => canastasFiltradas.filter((c) => c.estado === 'devuelto_fuera_de_fecha_limite'),
        [canastasFiltradas],
    );

    const canastasRechazadas = useMemo(
        () => canastasFiltradas.filter((c) => c.estado === 'rechazado'),
        [canastasFiltradas],
    );


    const handleAceptarCanasta = async (id: string) => {
        try {
            await aceptarCanastaEnBackend(id);
            toast.success('Solicitud de préstamo aceptada.');
            await cargarCanastas();
            await recargarDatos();
        } catch (err: any) {
            toast.error(err?.message ?? 'No se pudo aceptar la solicitud.');
        }
    };

    const handleRechazarCanasta = async (id: string, motivo: string) => {
        const motivoLimpio = motivo.trim();
        if (!motivoLimpio) {
            toast.error('Debes proporcionar un motivo de rechazo.');
            return;
        }
        try {
            await rechazarCanastaEnBackend(id, motivoLimpio);
            toast.success('Solicitud de préstamo rechazada.');
            setModalRechazarCanasta(null);
            setMotivoRechazo('');
            await cargarCanastas();
            await recargarDatos();
        } catch (err: any) {
            toast.error(err?.message ?? 'No se pudo rechazar la solicitud.');
        }
    };

    const handleConfirmarDespacho = async (id: string, payload: any) => {
        try {
            await despacharCanastaEnBackend(id, payload);
            toast.success('Préstamo despachado / entregado físicamente.');
            setModalDespacharCanasta(null);
            await cargarCanastas();
            await recargarDatos();
        } catch (err: any) {
            toast.error(err?.message ?? 'No se pudo despachar la canasta.');
            throw err;
        }
    };

    const handleConfirmarDevolucion = async (
        canasta: PrestamoCanastaRegistro,
        payload: {
            equipos: Array<{ idHerramienta: string; estadoFisicoDevolucion: string; devuelto: boolean }>;
            consumibles: Array<{ idLote: string; cantidadDevuelta: number; estadoDevuelto?: string }>;
            carnetsDevueltos: string[];
            observaciones: string;
        },
    ): Promise<boolean> => {
        if (canasta.estado === 'devuelto' || canasta.estado === 'devuelto_fuera_de_fecha_limite') return false;

        const estaVencida = canasta.estado === 'vencido';
        if (estaVencida) {
            const ok = await confirmar({
                titulo: 'Canasta vencida',
                descripcion: 'Esta canasta está VENCIDA. La devolución quedará registrada fuera de la fecha límite. ¿Deseas continuar?',
                textoConfirmar: 'Devolver',
                textoCancelar: 'Cancelar',
            });
            if (!ok) return false;
        }

        try {
            await devolverCanastaPrestamoEnBackend(canasta.id, payload);
            toast.success('Devolución registrada con éxito.');
            setModalDevolverCanasta(null);
            await cargarCanastas();
            await recargarDatos();
            return true;
        } catch (err: any) {
            toast.error(err?.message ?? 'No se pudo registrar la devolución.');
            return false;
        }
    };

    const eliminarCanasta = async (idCanasta: string) => {
        const ok = await confirmar({
            titulo: 'Eliminar préstamo',
            descripcion: '¿Eliminar este registro de préstamo? (Soft delete)',
            textoConfirmar: 'Eliminar',
            textoCancelar: 'Cancelar',
            varianteConfirmar: 'destructive',
        });
        if (!ok) return;
        try {
            await eliminarCanastaPrestamoEnBackend(idCanasta);
            toast.success('Préstamo eliminado.');
            await recargarDatos();
            await cargarCanastas();
        } catch (err: any) {
            toast.error(err?.message ?? 'No se pudo eliminar el préstamo.');
        }
    };

    const renderCanastas = (lista: PrestamoCanastaRegistro[]) => {
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
                                <th className="px-4 py-2.5 text-left font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Código</th>
                                <th className="px-4 py-2.5 text-left font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Carnet</th>
                                <th className="px-4 py-2.5 text-left font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Estudiante(s)</th>
                                <th className="px-4 py-2.5 text-left font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Docente</th>
                                <th className="px-4 py-2.5 text-left font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Contenido prestado</th>
                                <th className="px-4 py-2.5 text-center font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Fecha préstamo</th>
                                <th className="px-4 py-2.5 text-center font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Fecha devolución</th>
                                <th className="px-4 py-2.5 text-center font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Estado</th>
                                <th className="px-4 py-2.5 text-right font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {(cargandoCanastas || cargando) ? (
                                Array.from({ length: 4 }).map((_, idx) => (
                                    <tr key={idx} className="border-b border-slate-100 dark:border-slate-800">
                                        <td className="px-4 py-3"><Skeleton className="h-4 w-12" /></td>
                                        <td className="px-4 py-3"><Skeleton className="h-4 w-16" /></td>
                                        <td className="px-4 py-3"><Skeleton className="h-4 w-28" /></td>
                                        <td className="px-4 py-3"><Skeleton className="h-4 w-24" /></td>
                                        <td className="px-4 py-3"><Skeleton className="h-4 w-36" /></td>
                                        <td className="px-4 py-3"><Skeleton className="h-4 w-24" /></td>
                                        <td className="px-4 py-3"><Skeleton className="h-4 w-24" /></td>
                                        <td className="px-4 py-3"><Skeleton className="h-4 w-12" /></td>
                                        <td className="px-4 py-3 text-right"><Skeleton className="h-6 w-20 ml-auto" /></td>
                                    </tr>
                                ))
                            ) : (
                                <>
                                    {lista.map((c) => (
                                        <tr key={c.id} className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/40">
                                            <td className="px-4 py-2.5 font-mono text-slate-800 dark:text-slate-100 font-semibold">{c.codigo ?? c.id}</td>
                                            <td className="px-4 py-2.5 font-mono font-semibold text-blue-600 dark:text-blue-400">{obtenerTextoCarnets(c)}</td>
                                            <td className="px-4 py-2.5 text-slate-700 dark:text-slate-300">
                                                {obtenerTextoEstudiantes(c) || '—'}
                                                {c.estudiantes?.some(e => e.carnetRetenido) && (
                                                    <span className="ml-2 rounded bg-amber-100 px-1 text-[9px] font-bold text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                                                        Carnet retenido
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-2.5 text-slate-700 dark:text-slate-300">{c.docente}</td>
                                            <td className="px-4 py-2.5 text-slate-700 dark:text-slate-300">
                                                <div className="max-w-xs space-y-1">
                                                    {c.cosas && c.cosas.length > 0 && (
                                                        <div className="truncate">
                                                            <span className="font-semibold">Fijos:</span> {c.cosas.map(i => `${i.registrado ? '✓' : '✗'} [${i.codigoInventario}] ${i.nombre}`).join(', ')}
                                                        </div>
                                                    )}
                                                    {c.consumibles && c.consumibles.length > 0 && (
                                                        <div className="truncate text-[10px] text-slate-500">
                                                            <span className="font-semibold text-slate-600 dark:text-slate-450">Fungibles:</span> {c.consumibles.map(pc => `${pc.material} (Cant: ${pc.cantidadDespachada ?? pc.cantidadSolicitada})`).join(', ')}
                                                        </div>
                                                    )}
                                                    {(!c.cosas || c.cosas.length === 0) && (!c.consumibles || c.consumibles.length === 0) && (
                                                        <span>—</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-2.5 text-center text-slate-600 dark:text-slate-400">{formatearFechaHora(c.fechaPrestamo)}</td>
                                            <td className="px-4 py-2.5 text-center text-slate-600 dark:text-slate-400">{c.fechaDevolucion ? formatearFechaHora(c.fechaDevolucion) : '—'}</td>
                                            <td className="px-4 py-2.5 text-center">
                                                <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase ${colorEstadoCanasta(c.estado)}`}>
                                                    {c.estado}
                                                </span>
                                                {c.estado === 'rechazado' && c.motivoRechazo && (
                                                    <div className="text-[10px] text-rose-500 italic mt-0.5 max-w-[120px] truncate" title={c.motivoRechazo}>
                                                        Rechazo: {c.motivoRechazo}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-4 py-2.5">
                                                <div className="flex justify-end gap-2">
                                                    {c.estado === 'solicitado' && (
                                                        <>
                                                            <Boton onClick={() => setModalAceptarCanasta(c)} size="sm" className="h-7 gap-1 px-2 text-[10px] bg-emerald-600 hover:bg-emerald-700">
                                                                <Check className="h-3 w-3" /> Aceptar
                                                            </Boton>
                                                            <Boton onClick={() => setModalRechazarCanasta(c)} size="sm" variant="destructive" className="h-7 gap-1 px-2 text-[10px]">
                                                                <X className="h-3 w-3" /> Rechazar
                                                            </Boton>
                                                        </>
                                                    )}
                                                    {c.estado === 'aceptado' && (
                                                        <Boton onClick={() => setModalDespacharCanasta(c)} size="sm" className="h-7 gap-1 px-2 text-[10px] bg-violet-600 hover:bg-violet-700">
                                                            <Play className="h-3 w-3" /> Despachar
                                                        </Boton>
                                                    )}
                                                    {['despachado', 'vencido', 'activo', 'pendiente'].includes(c.estado) && (
                                                        <>
                                                            <Boton onClick={() => setModalEditarCanasta(c)} variant="outline" size="sm" className="h-7 text-[10px] px-2">Editar</Boton>
                                                            <Boton onClick={() => setModalEditarFechas(c)} variant="outline" size="sm" className="h-7 text-[10px] px-2 text-blue-600 border-blue-200 hover:bg-blue-50/50">Extender</Boton>
                                                            <Boton onClick={() => setModalDevolverCanasta(c)} size="sm" className="h-7 text-[10px] px-2 bg-emerald-600 hover:bg-emerald-700 text-white">
                                                                Devolver
                                                            </Boton>
                                                        </>
                                                    )}
                                                    <Boton
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => { void eliminarCanasta(c.id); }}
                                                        className="h-7 text-[10px] px-2 text-red-500 hover:bg-red-50/50 hover:text-red-600"
                                                    >
                                                        Eliminar
                                                    </Boton>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {lista.length === 0 && (
                                        <tr>
                                            <td colSpan={9} className="px-4 py-6 text-center text-slate-500 dark:text-slate-400">
                                                {errorCanastas || 'Sin préstamos para esta pestaña.'}
                                            </td>
                                        </tr>
                                    )}
                                </>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };


    const activosCount = canastas.filter((canasta) => ['despachado', 'vencido', 'activo', 'pendiente'].includes(canasta.estado)).length;
    const vencidosCount = canastas.filter((canasta) => canasta.estado === 'vencido').length;

    return (
        <LayoutPagina
            paginaActiva="prestamos"
            titulo="Préstamos de Activos y Consumibles"
            subtitulo={`${activosCount} activos en préstamo · ${vencidosCount} vencidos · ${canastas.length} en total`}
            alertas={vencidosCount}
            onNavegar={onNavegar}
            onCerrarSesion={onCerrarSesion}
            onRecargar={() => { void cargarCanastas(); void recargarDatos(); }}
            recargando={cargandoCanastas || cargando}
        >
            <Tabs value={tabDevoluciones} onValueChange={(value) => setTabDevoluciones(value as any)}>
                <TabsList className="flex flex-wrap gap-1 p-1 rounded-lg bg-slate-100/60 dark:bg-slate-800/40 w-full justify-start h-auto animate-fade-in">
                    <TabsTrigger value="solicitado" className="gap-1.5 text-xs font-semibold px-3 py-1.5 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950">
                        <Clock className="h-3.5 w-3.5 text-amber-500" />
                        Solicitudes Docente ({canastasSolicitadas.length})
                    </TabsTrigger>
                    <TabsTrigger value="aceptado" className="gap-1.5 text-xs font-semibold px-3 py-1.5 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950">
                        <Check className="h-3.5 w-3.5 text-purple-500" />
                        Aceptado ({canastasPorDespachar.length})
                    </TabsTrigger>
                    <TabsTrigger value="despachado" className="gap-1.5 text-xs font-semibold px-3 py-1.5 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950">
                        <Play className="h-3.5 w-3.5 text-blue-500" />
                        Despachado ({canastasDespachadas.length})
                    </TabsTrigger>
                    <TabsTrigger value="vencido" className="gap-1.5 text-xs font-semibold px-3 py-1.5 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950">
                        <AlertTriangle className="h-3.5 w-3.5 text-rose-500" />
                        Vencido ({canastasVencidas.length})
                    </TabsTrigger>
                    <TabsTrigger value="devuelto" className="gap-1.5 text-xs font-semibold px-3 py-1.5 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                        Devuelto ({canastasDevueltas.length})
                    </TabsTrigger>
                    <TabsTrigger value="devuelto_fuera_de_fecha_limite" className="gap-1.5 text-xs font-semibold px-3 py-1.5 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950">
                        <CalendarClock className="h-3.5 w-3.5 text-amber-600" />
                        Dev. Fuera de Plazo ({canastasDevueltasFueraPlazo.length})
                    </TabsTrigger>
                    <TabsTrigger value="rechazado" className="gap-1.5 text-xs font-semibold px-3 py-1.5 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950">
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
                            filtrosActivos={!!fechaDesde || !!fechaHasta || filtroIdHerramienta !== ''}
                            onLimpiarFiltros={() => { setBusqueda(''); setFechaDesde(''); setFechaHasta(''); setFiltroIdHerramienta(''); }}
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
                    
                    <div className="flex h-10 items-center shrink-0">
                        <Boton onClick={() => setMostrarCanasta(true)} className="inline-flex h-10 items-center rounded-md bg-emerald-600 px-4 text-sm font-bold text-white transition-colors hover:bg-emerald-700 shadow-sm gap-1">
                            Nuevo préstamo
                        </Boton>
                    </div>
                </div>

                <TabsContent value="solicitado" className="mt-4">{renderCanastas(canastasSolicitadas)}</TabsContent>
                <TabsContent value="aceptado" className="mt-4">{renderCanastas(canastasPorDespachar)}</TabsContent>
                <TabsContent value="despachado" className="mt-4">{renderCanastas(canastasDespachadas)}</TabsContent>
                <TabsContent value="vencido" className="mt-4">{renderCanastas(canastasVencidas)}</TabsContent>
                <TabsContent value="devuelto" className="mt-4">{renderCanastas(canastasDevueltas)}</TabsContent>
                <TabsContent value="devuelto_fuera_de_fecha_limite" className="mt-4">{renderCanastas(canastasDevueltasFueraPlazo)}</TabsContent>
                <TabsContent value="rechazado" className="mt-4">{renderCanastas(canastasRechazadas)}</TabsContent>

            </Tabs>

            {mostrarCanasta && (
                <FormularioCanastaPrestamo
                    onCerrar={() => {
                        setMostrarCanasta(false);
                        void cargarCanastas();
                    }}
                    onGuardado={() => {
                        void cargarCanastas();
                        void recargarDatos();
                    }}
                />
            )}

            {modalEditarCanasta && (
                <FormularioCanastaPrestamo
                    canasta={modalEditarCanasta}
                    onCerrar={() => setModalEditarCanasta(null)}
                    onGuardado={() => {
                        void cargarCanastas();
                        void recargarDatos();
                    }}
                />
            )}

            {modalEditarFechas && (
                <FormularioEdicionJerarquia
                    titulo={`Extender préstamo (${modalEditarFechas.codigo ?? modalEditarFechas.id})`}
                    camposIniciales={[
                        { key: 'fechaDevolucion', label: 'Fecha/hora límite de devolución', value: modalEditarFechas.fechaDevolucion ?? '', type: 'datetime-local', required: true },
                    ]}
                    onGuardar={(valores) => {
                        if (!valores.fechaDevolucion) return;
                        void (async () => {
                            try {
                                await extenderCanastaPrestamoEnBackend(modalEditarFechas.id, valores.fechaDevolucion);
                                toast.success('Fecha de devolución extendida.');
                                setModalEditarFechas(null);
                                await recargarDatos();
                                await cargarCanastas();
                            } catch (err: any) {
                                toast.error(err?.message ?? 'No se pudo extender el préstamo.');
                            }
                        })();
                    }}
                    onCerrar={() => setModalEditarFechas(null)}
                />
            )}

            {modalDespacharCanasta && (
                <DialogoDespacharCanasta
                    canasta={modalDespacharCanasta}
                    herramientas={herramientas}
                    estudiantes={estudiantes}
                    onCerrar={() => setModalDespacharCanasta(null)}
                    onConfirmar={(payload) => handleConfirmarDespacho(modalDespacharCanasta.id, payload)}
                />
            )}

            {modalDevolverCanasta && (
                <DialogoDevolverCanasta
                    canasta={modalDevolverCanasta}
                    herramientas={herramientas}
                    estudiantes={estudiantes}
                    onCerrar={() => setModalDevolverCanasta(null)}
                    onConfirmar={(payload) => handleConfirmarDevolucion(modalDevolverCanasta, payload)}
                />
            )}

            {modalRechazarCanasta && (
                <ModalBase
                    titulo={`Rechazar Solicitud de Préstamo #${modalRechazarCanasta.codigo ?? modalRechazarCanasta.id}`}
                    onCerrar={() => { setModalRechazarCanasta(null); setMotivoRechazo(''); }}
                    ancho="max-w-md"
                    footer={
                        <div className="flex justify-end gap-2">
                            <Boton type="button" variant="outline" onClick={() => { setModalRechazarCanasta(null); setMotivoRechazo(''); }}>
                                Cancelar
                            </Boton>
                            <Boton type="button" variant="destructive" onClick={() => handleRechazarCanasta(modalRechazarCanasta.id, motivoRechazo)}>
                                Rechazar Solicitud
                            </Boton>
                        </div>
                    }
                >
                    <div className="space-y-3 p-4">
                        <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Motivo del Rechazo</Label>
                        <Textarea
                            value={motivoRechazo}
                            onChange={(e) => setMotivoRechazo(e.target.value)}
                            placeholder="Escribe la razón por la cual rechazas esta solicitud..."
                            rows={4}
                            className="text-xs"
                            required
                        />
                    </div>
                </ModalBase>
            )}

            {modalAceptarCanasta && (
                <ModalBase
                    titulo={`Confirmar Aceptación de Préstamo - #${modalAceptarCanasta.codigo ?? modalAceptarCanasta.id}`}
                    onCerrar={() => setModalAceptarCanasta(null)}
                    ancho="max-w-md"
                    footer={
                        <div className="flex justify-end gap-2">
                            <Boton type="button" variant="outline" onClick={() => setModalAceptarCanasta(null)} className="h-9 px-4 text-xs">
                                Cancelar
                            </Boton>
                            <Boton type="button" className="h-9 px-5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white animate-pulse-subtle" onClick={async () => {
                                const id = modalAceptarCanasta.id;
                                setModalAceptarCanasta(null);
                                await handleAceptarCanasta(id);
                            }}>
                                Confirmar y Aceptar
                            </Boton>
                        </div>
                    }
                >
                    <div className="space-y-4 p-4 text-xs">
                        <div className="rounded-lg border border-slate-100 bg-slate-50/50 p-2.5 space-y-1.5 dark:border-slate-800 dark:bg-slate-900/30">
                            <div>
                                <span className="font-semibold text-slate-500">Estudiante(s):</span>
                                <div className="mt-0.5 font-medium text-slate-800 dark:text-slate-205">
                                    {obtenerTextoEstudiantes(modalAceptarCanasta)}
                                </div>
                            </div>
                            <div>
                                <span className="font-semibold text-slate-500">Docente:</span>
                                <div className="mt-0.5 font-medium text-slate-800 dark:text-slate-200">
                                    {modalAceptarCanasta.docente}
                                </div>
                            </div>
                            {modalAceptarCanasta.observaciones && (
                                <div>
                                    <span className="font-semibold text-slate-500">Observaciones:</span>
                                    <div className="mt-0.5 italic text-slate-600 dark:text-slate-300">
                                        {modalAceptarCanasta.observaciones}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div>
                            <h4 className="font-semibold text-slate-800 dark:text-slate-200 mb-2">Activos Fijos Solicitados:</h4>
                            {modalAceptarCanasta.cosas && modalAceptarCanasta.cosas.length > 0 ? (
                                <ul className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-150 dark:border-slate-800 rounded-lg overflow-hidden bg-white dark:bg-slate-950">
                                    {modalAceptarCanasta.cosas.map((item, idx) => (
                                        <li key={idx} className="px-3 py-2 text-slate-700 dark:text-slate-300">
                                            [{item.codigoInventario}] {item.nombre}
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-slate-400 italic pl-1">Ninguno</p>
                            )}
                        </div>

                        {modalAceptarCanasta.consumibles && modalAceptarCanasta.consumibles.length > 0 && (
                            <div>
                                <h4 className="font-semibold text-slate-800 dark:text-slate-200 mb-2">Materiales Fungibles Solicitados:</h4>
                                <ul className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-150 dark:border-slate-800 rounded-lg overflow-hidden bg-white dark:bg-slate-950">
                                    {modalAceptarCanasta.consumibles.map((item, idx) => (
                                        <li key={idx} className="px-3 py-2 text-slate-700 dark:text-slate-300 flex justify-between">
                                            <span>{item.material} <span className="text-slate-400 font-normal text-[10px]">({item.lote})</span></span>
                                            <span className="font-semibold text-slate-800 dark:text-slate-200">{item.cantidadSolicitada}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                </ModalBase>
            )}
        </LayoutPagina>
    );
};
