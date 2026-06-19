import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import type { PropsPaginaBase } from '@/tipos/paginas';
import { LayoutPagina } from '@/componentes/layout/layout-pagina';
import { BarraFiltros } from '@/componentes/layout/barra-filtros';
import { FormularioCanastaPrestamo } from '@/componentes/paginas/prestamos/dialogo-canasta-prestamo';
import { useInventario } from '@/contextos/ContextoInventario';
import { useConfirmacion } from '@/contextos/ContextoConfirmacion';
import type { EstadoPrestamo, PrestamoCanastaRegistro } from '@/tipos/inventario';
import { ClipboardList, CheckCircle2, MessageSquare, ShoppingBasket, Play, Check, X, ShieldAlert, Eye } from 'lucide-react';
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
import type { SolicitudMaterialDocencia } from '@/tipos/docencia';
import { aprobarSolicitudAlmacen, listarSolicitudesDocencia, listarSolicitudesPendientesAlmacen, rechazarSolicitudAlmacen } from '@/lib/servicio-docencia';
import { obtenerUsuarioActual } from '@/lib/servicio-autenticacion';
import {
    cargarCanastasPrestamoDesdeBackend,
    extenderCanastaPrestamoEnBackend,
    devolverCanastaPrestamoEnBackend,
    eliminarCanastaPrestamoEnBackend,
    aceptarCanastaEnBackend,
    rechazarCanastaEnBackend,
    despacharCanastaEnBackend,
} from '@/lib/servicio-prestamos';

interface FiltroPrestamoDesdeActivos {
    idHerramienta: string;
    carnetEstudiante: string;
    estado: EstadoPrestamo;
}

const opcionesEstado: { valor: EstadoPrestamo | ''; etiqueta: string }[] = [
    { valor: '', etiqueta: 'Todos los estados' },
    { valor: 'solicitado', etiqueta: 'Solicitado' },
    { valor: 'aceptado', etiqueta: 'Aceptado' },
    { valor: 'rechazado', etiqueta: 'Rechazado' },
    { valor: 'despachado', etiqueta: 'Despachado' },
    { valor: 'vencido', etiqueta: 'Vencido' },
    { valor: 'devuelto', etiqueta: 'Devuelto' },
    { valor: 'devuelto_fuera_de_fecha_limite', etiqueta: 'Devuelto fuera de fecha límite' },
];

const CLAVE_FILTRO_PRESTAMO_ITEM = 'sgi-filtro-prestamo-item';

const colorEstadoCanasta = (estado: EstadoPrestamo) => {
    if (estado === 'solicitado') return 'text-amber-700 bg-amber-50 border-amber-200 dark:text-amber-300 dark:bg-amber-950/30 dark:border-amber-850';
    if (estado === 'aceptado') return 'text-purple-700 bg-purple-50 border-purple-200 dark:text-purple-300 dark:bg-purple-950/30 dark:border-purple-800';
    if (estado === 'rechazado') return 'text-rose-700 bg-rose-50 border-rose-200 dark:text-rose-300 dark:bg-rose-950/30 dark:border-rose-800';
    if (estado === 'despachado' || estado === 'activo' || estado === 'pendiente') return 'text-blue-700 bg-blue-50 border-blue-200 dark:text-blue-300 dark:bg-blue-950/30 dark:border-blue-800';
    if (estado === 'devuelto' || estado === 'devuelto_fuera_de_fecha_limite') return 'text-emerald-700 bg-emerald-50 border-emerald-200 dark:text-emerald-300 dark:bg-emerald-950/30 dark:border-emerald-800';
    return 'text-red-700 bg-red-50 border-red-200 dark:text-red-300 dark:bg-red-950/30 dark:border-red-800';
};

export const Prestamos = ({ onNavegar, onCerrarSesion }: PropsPaginaBase) => {
    const { prestamos, recargarDatos, herramientas, estudiantes, docentes, cargando } = useInventario();
    const { confirmar } = useConfirmacion();
    const usuarioActual = obtenerUsuarioActual();
    const esDocente = usuarioActual?.rol === 'docente';
    
    const [busqueda, setBusqueda] = useState('');
    const [filtroEstado, setFiltroEstado] = useState<EstadoPrestamo | ''>('');
    const [fechaDesde, setFechaDesde] = useState('');
    const [fechaHasta, setFechaHasta] = useState('');
    const [filtroIdHerramienta, setFiltroIdHerramienta] = useState('');
    
    const [tabPrincipalDocente, setTabPrincipalDocente] = useState<'mis_prestamos' | 'mis_solicitudes'>('mis_prestamos');
    const [tabDocentePrestamos, setTabDocentePrestamos] = useState<'solicitados' | 'activos' | 'historial'>('activos');
    const [tabDevoluciones, setTabDevoluciones] = useState<'solicitudes' | 'por_despachar' | 'activos' | 'historial' | 'solicitudes_docentes'>('activos');
    
    const [canastas, setCanastas] = useState<PrestamoCanastaRegistro[]>([]);
    const [cargandoCanastas, setCargandoCanastas] = useState(false);
    const [errorCanastas, setErrorCanastas] = useState('');
    
    const [modalEditarFechas, setModalEditarFechas] = useState<PrestamoCanastaRegistro | null>(null);
    const [modalEditarCanasta, setModalEditarCanasta] = useState<PrestamoCanastaRegistro | null>(null);
    const [mostrarCanasta, setMostrarCanasta] = useState(false);
    
    const [modalDespacharCanasta, setModalDespacharCanasta] = useState<PrestamoCanastaRegistro | null>(null);
    const [modalDevolverCanasta, setModalDevolverCanasta] = useState<PrestamoCanastaRegistro | null>(null);
    const [modalRechazarCanasta, setModalRechazarCanasta] = useState<PrestamoCanastaRegistro | null>(null);
    const [modalVerActivos, setModalVerActivos] = useState<PrestamoCanastaRegistro | null>(null);
    const [modalAceptarCanasta, setModalAceptarCanasta] = useState<PrestamoCanastaRegistro | null>(null);
    const [motivoRechazo, setMotivoRechazo] = useState('');

    const [solicitudesDocentes, setSolicitudesDocentes] = useState<SolicitudMaterialDocencia[]>([]);
    const [cargandoSolicitudesDocentes, setCargandoSolicitudesDocentes] = useState(false);
    const [errorSolicitudesDocentes, setErrorSolicitudesDocentes] = useState('');

    const docenteActual = useMemo(() => {
        const correoActual = String(usuarioActual?.correo ?? '').trim().toLowerCase();
        if (!correoActual) return null;
        return docentes.find((docente) => String(docente.correo ?? '').trim().toLowerCase() === correoActual) ?? null;
    }, [docentes, usuarioActual?.correo]);

    const canastasDelDocente = useMemo(() => {
        if (!esDocente) return canastas;
        if (!usuarioActual?.id) return [];
        return canastas.filter((canasta) => String(canasta.idDocente ?? '') === String(usuarioActual.id));
    }, [canastas, usuarioActual?.id, esDocente]);

    const activos = esDocente
        ? canastasDelDocente.filter((canasta) => ['despachado', 'vencido', 'activo', 'pendiente'].includes(canasta.estado)).length
        : prestamos.filter(p => ['despachado', 'vencido', 'activo', 'pendiente'].includes(p.estado)).length;
    
    const vencidos = esDocente
        ? canastasDelDocente.filter((canasta) => canasta.estado === 'vencido').length
        : prestamos.filter(p => p.estado === 'vencido').length;

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

    const cargarSolicitudesDocentes = async () => {
        try {
            setCargandoSolicitudesDocentes(true);
            setErrorSolicitudesDocentes('');
            const data = esDocente ? await listarSolicitudesDocencia() : await listarSolicitudesPendientesAlmacen();
            setSolicitudesDocentes(data);
        } catch (err: any) {
            setErrorSolicitudesDocentes(err?.message ?? 'No se pudieron cargar las solicitudes de docentes.');
        } finally {
            setCargandoSolicitudesDocentes(false);
        }
    };

    useEffect(() => {
        if (esDocente) {
            if (tabPrincipalDocente !== 'mis_solicitudes') return;
        } else if (tabDevoluciones !== 'solicitudes_docentes') {
            return;
        }
        void cargarSolicitudesDocentes();
    }, [esDocente, tabDevoluciones, tabPrincipalDocente]);

    const aprobarSolicitud = async (id: string) => {
        try {
            await aprobarSolicitudAlmacen(id);
            setSolicitudesDocentes((prev) => prev.filter((s) => s.id !== id));
            toast.success('Solicitud aprobada por almacén.');
        } catch (err: any) {
            toast.error(err?.message ?? 'No se pudo aprobar la solicitud.');
        }
    };

    const rechazarSolicitud = async (id: string) => {
        const ok = await confirmar({
            titulo: 'Rechazar solicitud',
            descripcion: '¿Deseas rechazar esta solicitud? (quedará como rechazada por almacén)',
            textoConfirmar: 'Rechazar',
            textoCancelar: 'Cancelar',
            varianteConfirmar: 'destructive',
        });
        if (!ok) return;

        try {
            await rechazarSolicitudAlmacen(id);
            setSolicitudesDocentes((prev) => prev.filter((s) => s.id !== id));
            toast.success('Solicitud rechazada.');
        } catch (err: any) {
            toast.error(err?.message ?? 'No se pudo rechazar la solicitud.');
        }
    };

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
        } catch {
        } finally {
            sessionStorage.removeItem(CLAVE_FILTRO_PRESTAMO_ITEM);
        }
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
        const base = esDocente ? canastasDelDocente : canastas;

        return base.filter((c) => {
            const coincideEstado = filtroEstado === '' || c.estado === filtroEstado;
            const coincideHerramienta = filtroIdHerramienta === '' || (c.cosas?.some((i) => i.idHerramienta === filtroIdHerramienta) ?? false);
            const fechaPrestamo = aFecha(c.fechaPrestamo);
            const coincideFechaDesde = !desde || (!!fechaPrestamo && fechaPrestamo >= desde);
            const coincideFechaHasta = !hasta || (!!fechaPrestamo && fechaPrestamo <= hasta);
            return coincideEstado && coincideHerramienta && coincideFechaDesde && coincideFechaHasta;
        });
    }, [canastas, canastasDelDocente, esDocente, fechaDesde, fechaHasta, filtroEstado, filtroIdHerramienta]);

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

    const canastasActivas = useMemo(
        () => canastasFiltradas.filter((c) => ['despachado', 'vencido', 'activo', 'pendiente'].includes(c.estado)),
        [canastasFiltradas],
    );

    const canastasHistorial = useMemo(
        () => canastasFiltradas.filter((c) => ['devuelto', 'devuelto_fuera_de_fecha_limite', 'rechazado'].includes(c.estado)),
        [canastasFiltradas],
    );


    const obtenerNombreResponsable = useCallback((id?: number | null) => {
        if (!id) return '—';
        const estudiante = estudiantes.find((item) => Number(item.id) === Number(id));
        return estudiante ? `${estudiante.apellido}, ${estudiante.nombre}` : `ID ${id}`;
    }, [estudiantes]);

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
        const permitirGestion = !esDocente;
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
                                Array.from({ length: 5 }).map((_, idx) => (
                                    <tr key={idx} className="border-b border-slate-100 dark:border-slate-800">
                                        <td className="px-4 py-3"><Skeleton className="h-4 w-12" /></td>
                                        <td className="px-4 py-3"><Skeleton className="h-4 w-16" /></td>
                                        <td className="px-4 py-3"><Skeleton className="h-4 w-28" /></td>
                                        <td className="px-4 py-3"><Skeleton className="h-4 w-24" /></td>
                                        <td className="px-4 py-3"><Skeleton className="h-4 w-36" /></td>
                                        <td className="px-4 py-3"><Skeleton className="h-4 w-24" /></td>
                                        <td className="px-4 py-3"><Skeleton className="h-4 w-24" /></td>
                                        <td className="px-4 py-3"><Skeleton className="h-4 w-12" /></td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex gap-2 justify-end">
                                                <Skeleton className="h-6 w-12" />
                                                <Skeleton className="h-6 w-12" />
                                            </div>
                                        </td>
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
                                                             <span className="font-semibold">Fijos:</span> {c.cosas.map(i => `${i.registrado ? '✓' : '✗'} [${i.codigoInventario || 'Sin asignar'}] ${i.nombre}`).join(', ')}
                                                        </div>
                                                    )}
                                                    {c.consumibles && c.consumibles.length > 0 && (
                                                        <div className="truncate text-[10px] text-slate-500">
                                                            <span className="font-semibold text-slate-600 dark:text-slate-450">Fungibles:</span> {c.consumibles.map(pc => `${pc.material} (Cant: ${['solicitado', 'aceptado'].includes(c.estado) ? pc.cantidadSolicitada : (pc.cantidadDespachada ?? pc.cantidadSolicitada ?? 0)})`).join(', ')}
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
                                                    <Boton onClick={() => setModalVerActivos(c)} size="sm" variant="outline" className="h-7 gap-1 px-2 text-[10px]">
                                                        <Eye className="h-3 w-3" /> Ver activos
                                                    </Boton>
                                                    {c.estado === 'solicitado' && permitirGestion && (
                                                        <>
                                                            <Boton onClick={() => setModalAceptarCanasta(c)} size="sm" className="h-7 gap-1 px-2 text-[10px] bg-emerald-600 hover:bg-emerald-700">
                                                                <Check className="h-3 w-3" /> Aceptar
                                                            </Boton>
                                                            <Boton onClick={() => setModalRechazarCanasta(c)} size="sm" variant="destructive" className="h-7 gap-1 px-2 text-[10px]">
                                                                <X className="h-3 w-3" /> Rechazar
                                                            </Boton>
                                                        </>
                                                    )}
                                                    {c.estado === 'aceptado' && permitirGestion && (
                                                        <Boton onClick={() => setModalDespacharCanasta(c)} size="sm" className="h-7 gap-1 px-2 text-[10px] bg-violet-600 hover:bg-violet-700">
                                                            <Play className="h-3 w-3" /> Despachar
                                                        </Boton>
                                                    )}
                                                    {['despachado', 'vencido', 'activo', 'pendiente'].includes(c.estado) && (
                                                        <>
                                                            {permitirGestion && (
                                                                <>
                                                                    <Boton onClick={() => setModalEditarCanasta(c)} variant="outline" size="sm" className="h-7 text-[10px] px-2">Editar</Boton>
                                                                    <Boton onClick={() => setModalEditarFechas(c)} variant="outline" size="sm" className="h-7 text-[10px] px-2 text-blue-600 border-blue-200 hover:bg-blue-50/50">Extender</Boton>
                                                                    <Boton onClick={() => setModalDevolverCanasta(c)} size="sm" className="h-7 text-[10px] px-2 bg-emerald-600 hover:bg-emerald-700 text-white">
                                                                        Devolver
                                                                    </Boton>
                                                                </>
                                                            )}
                                                        </>
                                                    )}
                                                    {permitirGestion && (
                                                        <Boton
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => { void eliminarCanasta(c.id); }}
                                                            className="h-7 text-[10px] px-2 text-red-500 hover:bg-red-50/50 hover:text-red-600"
                                                        >
                                                            Eliminar
                                                        </Boton>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {lista.length === 0 && (
                                        <tr>
                                            <td colSpan={9} className="px-4 py-4 text-center text-slate-500 dark:text-slate-400">
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

    const renderSolicitudesDocentes = () => {
        return (
            <div className="space-y-4">
                <div className="flex justify-end">
                    <button
                        onClick={() => { void cargarSolicitudesDocentes(); }}
                        className="inline-flex h-8 items-center rounded-md border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                    >
                        Actualizar
                    </button>
                </div>

                <div className="rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                    <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800">
                        <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                            {esDocente ? 'Mis solicitudes' : 'Solicitudes de docentes'}
                            <span className="ml-2 text-xs font-normal text-slate-400">({solicitudesDocentes.length}{esDocente ? '' : ' pendientes'})</span>
                        </h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                            <thead>
                                <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/50">
                                    <th className="px-4 py-2.5 text-left font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Materia</th>
                                    <th className="px-4 py-2.5 text-left font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Responsable</th>
                                    {esDocente && <th className="px-4 py-2.5 text-left font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Estado</th>}
                                    <th className="px-4 py-2.5 text-center font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">PDF</th>
                                    <th className="px-4 py-2.5 text-left font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Detalle</th>
                                    {!esDocente && <th className="px-4 py-2.5 text-right font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Acciones</th>}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {(cargando || cargandoSolicitudesDocentes) ? (
                                    Array.from({ length: 3 }).map((_, idx) => (
                                        <tr key={idx} className="border-b border-slate-100 dark:border-slate-800">
                                            <td className="px-4 py-3"><Skeleton className="h-4 w-28" /></td>
                                            <td className="px-4 py-3"><Skeleton className="h-4 w-32" /></td>
                                            {esDocente && <td className="px-4 py-3"><Skeleton className="h-4 w-16" /></td>}
                                            <td className="px-4 py-3"><Skeleton className="h-4 w-12 mx-auto" /></td>
                                            <td className="px-4 py-3"><Skeleton className="h-4 w-40" /></td>
                                            {!esDocente && (
                                                <td className="px-4 py-3 text-right">
                                                    <div className="flex gap-2 justify-end">
                                                        <Skeleton className="h-6 w-16" />
                                                        <Skeleton className="h-6 w-16" />
                                                    </div>
                                                </td>
                                            )}
                                        </tr>
                                    ))
                                ) : (
                                    <>
                                        {solicitudesDocentes.map((s) => (
                                            <tr key={s.id} className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/40">
                                                <td className="px-4 py-2.5 text-slate-700 dark:text-slate-300">{s.grupo?.materia ?? '—'}</td>
                                                <td className="px-4 py-2.5 text-slate-700 dark:text-slate-300">{obtenerNombreResponsable(s.responsableEstudianteId)}</td>
                                                {esDocente && <td className="px-4 py-2.5 text-slate-700 dark:text-slate-300">{s.estado}</td>}
                                                <td className="px-4 py-2.5 text-center text-slate-600 dark:text-slate-400">{s.pdfPath ? 'Subido' : '—'}</td>
                                                <td className="px-4 py-2.5 text-slate-700 dark:text-slate-300">{s.detalle?.trim() || '—'}</td>
                                                {!esDocente && (
                                                    <td className="px-4 py-2.5">
                                                        <div className="flex justify-end gap-2">
                                                            <button
                                                                onClick={() => { void aprobarSolicitud(s.id); }}
                                                                className="h-7 rounded-md border border-emerald-200 px-2 text-[11px] text-emerald-700 dark:border-emerald-800 dark:text-emerald-300"
                                                            >
                                                                Aprobar
                                                            </button>
                                                            <button
                                                                onClick={() => { void rechazarSolicitud(s.id); }}
                                                                className="h-7 rounded-md border border-red-200 px-2 text-[11px] text-red-700 dark:border-red-800 dark:text-red-300"
                                                            >
                                                                Rechazar
                                                            </button>
                                                        </div>
                                                    </td>
                                                )}
                                            </tr>
                                        ))}
                                        {solicitudesDocentes.length === 0 && (
                                            <tr>
                                                <td colSpan={esDocente ? 5 : 5} className="px-4 py-4 text-center text-slate-500 dark:text-slate-400">
                                                    {errorSolicitudesDocentes || 'Sin solicitudes pendientes.'}
                                                </td>
                                            </tr>
                                        )}
                                    </>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <LayoutPagina
            paginaActiva="prestamos"
            titulo={esDocente ? 'Mis Préstamos' : 'Préstamos de Activos y Consumibles'}
            subtitulo={esDocente
                ? `${activos} préstamo(s) activo(s) · ${vencidos} vencido(s) · ${canastasDelDocente.length} registrado(s) a tu nombre`
                : `${activos} activos en préstamo · ${vencidos} vencidos · ${canastas.length} préstamos en total`}
            alertas={vencidos}
            onNavegar={onNavegar}
            onCerrarSesion={onCerrarSesion}
        >
            {esDocente && !docenteActual && (
                <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-700 dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-200">
                    No se pudo identificar tu perfil docente para filtrar los préstamos. Verifica que tu usuario tenga correo asociado al perfil docente.
                </div>
            )}

            <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-slate-50/40 dark:bg-slate-900/10 p-3 rounded-xl border border-slate-100 dark:border-slate-800/60 shadow-2xs">
                <div className="flex-1">
                    <BarraFiltros
                        busqueda={busqueda}
                        onBusquedaChange={setBusqueda}
                        placeholder="Buscar por carnet, estudiante, activo, código..."
                        filtrosActivos={filtroEstado !== '' || !!fechaDesde || !!fechaHasta || filtroIdHerramienta !== ''}
                        onLimpiarFiltros={() => { setBusqueda(''); setFiltroEstado(''); setFechaDesde(''); setFechaHasta(''); setFiltroIdHerramienta(''); }}
                    >
                        <div className="flex flex-wrap items-center gap-1 border border-slate-200 dark:border-slate-850 rounded-lg p-0.5 bg-white dark:bg-slate-950">
                            {opcionesEstado.filter(o => o.valor !== '').map((o) => {
                                const activo = filtroEstado === o.valor;
                                return (
                                    <button
                                        type="button"
                                        key={o.valor}
                                        onClick={() => setFiltroEstado(activo ? '' : o.valor)}
                                        className={`h-7 px-2.5 text-[10px] font-semibold rounded-md border transition-all ${
                                            activo
                                                ? 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-900 shadow-xs'
                                                : 'bg-transparent text-slate-600 border-transparent hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-900'
                                        }`}
                                    >
                                        {o.etiqueta}
                                    </button>
                                );
                            })}
                        </div>
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
                </div>

                <div className="flex h-9 items-center shrink-0">
                    <Boton onClick={() => setMostrarCanasta(true)} className="inline-flex h-8 items-center rounded-md bg-emerald-600 px-4 text-xs font-bold text-white transition-colors hover:bg-emerald-700 shadow-sm gap-1">
                        Nuevo préstamo
                    </Boton>
                </div>
            </div>

            {esDocente ? (
                <Tabs value={tabPrincipalDocente} onValueChange={(value) => setTabPrincipalDocente(value as 'mis_prestamos' | 'mis_solicitudes')}>
                    <TabsList>
                        <TabsTrigger value="mis_prestamos">
                            <ShoppingBasket className="h-4 w-4" />
                            Mis Préstamos ({canastasFiltradas.length})
                        </TabsTrigger>
                        <TabsTrigger value="mis_solicitudes">
                            <MessageSquare className="h-4 w-4" />
                            Solicitudes Docencia ({solicitudesDocentes.length})
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="mis_prestamos" className="space-y-4">
                        <Tabs value={tabDocentePrestamos} onValueChange={(val) => setTabDocentePrestamos(val as any)}>
                            <TabsList>
                                <TabsTrigger value="solicitados">
                                    Solicitudes ({canastasSolicitadas.length + canastasPorDespachar.length})
                                </TabsTrigger>
                                <TabsTrigger value="activos">
                                    Activos ({canastasActivas.length})
                                </TabsTrigger>
                                <TabsTrigger value="historial">
                                    Historial ({canastasHistorial.length})
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="solicitados">{renderCanastas([...canastasSolicitadas, ...canastasPorDespachar])}</TabsContent>
                            <TabsContent value="activos">{renderCanastas(canastasActivas)}</TabsContent>
                            <TabsContent value="historial">{renderCanastas(canastasHistorial)}</TabsContent>
                        </Tabs>
                    </TabsContent>

                    <TabsContent value="mis_solicitudes">{renderSolicitudesDocentes()}</TabsContent>
                </Tabs>
            ) : (
                <Tabs
                    value={tabDevoluciones}
                    onValueChange={(value) => setTabDevoluciones(value as any)}
                >
                    <TabsList>
                        <TabsTrigger value="solicitudes" className="gap-1.5">
                            <MessageSquare className="h-4 w-4" />
                            Solicitudes ({canastasSolicitadas.length})
                        </TabsTrigger>
                        <TabsTrigger value="por_despachar" className="gap-1.5">
                            <Play className="h-4 w-4" />
                            Por Despachar ({canastasPorDespachar.length})
                        </TabsTrigger>
                        <TabsTrigger value="activos" className="gap-1.5">
                            <ClipboardList className="h-4 w-4" />
                            Despachados / Activos ({canastasActivas.length})
                        </TabsTrigger>
                        <TabsTrigger value="historial" className="gap-1.5">
                            <CheckCircle2 className="h-4 w-4" />
                            Historial ({canastasHistorial.length})
                        </TabsTrigger>
                        <TabsTrigger value="solicitudes_docentes" className="gap-1.5">
                            <ShieldAlert className="h-4 w-4" />
                            Solicitudes Docentes ({solicitudesDocentes.length})
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="solicitudes">{renderCanastas(canastasSolicitadas)}</TabsContent>
                    <TabsContent value="por_despachar">{renderCanastas(canastasPorDespachar)}</TabsContent>
                    <TabsContent value="activos">{renderCanastas(canastasActivas)}</TabsContent>
                    <TabsContent value="historial">{renderCanastas(canastasHistorial)}</TabsContent>
                    <TabsContent value="solicitudes_docentes">{renderSolicitudesDocentes()}</TabsContent>
                </Tabs>
            )}

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
                                    {modalVerActivos.consumibles.map((item, idx) => (
                                        <li key={idx} className="px-3 py-2 bg-slate-50/50 dark:bg-slate-900/30 flex justify-between items-center">
                                            <div>
                                                <span className="text-slate-707 dark:text-slate-300 font-medium">{item.material}</span>
                                                {item.lote && <p className="text-[10px] text-slate-500">Lote/Serie: {item.lote}</p>}
                                            </div>
                                            <span className="font-mono bg-blue-50 text-blue-705 px-2 py-0.5 rounded text-[10px] font-bold dark:bg-blue-950/40 dark:text-blue-300">
                                                Cant: {['solicitado', 'aceptado'].includes(modalVerActivos.estado) ? item.cantidadSolicitada : (item.cantidadDespachada ?? item.cantidadSolicitada ?? 0)}
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
                                <div className="mt-0.5 font-medium text-slate-800 dark:text-slate-200">
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
                                             [{item.codigoInventario || 'Sin asignar'}] {item.nombre}
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
