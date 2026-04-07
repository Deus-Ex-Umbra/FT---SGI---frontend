import { useEffect, useMemo, useState } from 'react';
import { Wrench, AlertTriangle, ClipboardList, GraduationCap, Package, Activity, Users, ShieldCheck, FileText, LayoutTemplate, Layers, ArrowLeftRight, Sparkles, Download } from 'lucide-react';
import type { PaginaApp } from '@/tipos/navegacion';
import { LayoutPagina } from '@/componentes/layout/layout-pagina';
import { TarjetaMetrica } from '@/componentes/ui/tarjeta-metrica';
import { useInventario } from '@/contextos/ContextoInventario';
import { listarUsuarios, obtenerUsuarioActual } from '@/lib/servicio-autenticacion';
import { normalizarEstadoItem } from '@/lib/estados-activo';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/componentes/ui/tabs';
import { obtenerConfiguracionIA } from '@/lib/servicio-configuracion';
import {
    actualizarReporte,
    crearReporte,
    eliminarReporte,
    generarPdfDesdeReporteYDescargar,
    listarReportes,
    obtenerReporte,
    type ReporteDetalle,
    type ReporteListado,
} from '@/lib/servicio-reportes';
import { EditorDocumento, type DocumentoConfig } from '@/componentes/ui/editor-documento';
import { RenderizadorHtml } from '@/componentes/ui/renderizador-html';
import { Switch } from '@/componentes/ui/switch';
import { DatePicker } from '@/componentes/ui/date-picker';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/componentes/ui/dialog';
import { useCierreSeguro } from '@/hooks/use-cierre-seguro';

interface Props {
    onNavegar: (pagina: PaginaApp) => void;
    onCerrarSesion: () => void;
}

export const Resumen = ({ onNavegar, onCerrarSesion }: Props) => {
    const { herramientas, prestamos, estudiantes, docentes, materiales } = useInventario();
    const usuarioActual = useMemo(() => obtenerUsuarioActual(), []);
    const esAdministrador = usuarioActual?.rol === 'administrador';
    const [totalUsuarios, setTotalUsuarios] = useState(0);

    const [descargandoPdf, setDescargandoPdf] = useState(false);
    const [errorPdf, setErrorPdf] = useState<string | null>(null);
    const [mostrarGuiasMargenPreview, setMostrarGuiasMargenPreview] = useState(true);

    useEffect(() => {
        if (!esAdministrador) return;

        const cargarUsuarios = async () => {
            try {
                const usuarios = await listarUsuarios();
                setTotalUsuarios(usuarios.length);
            } catch {
                setTotalUsuarios(0);
            }
        };

        void cargarUsuarios();
    }, [esAdministrador]);

    const totalHerramientas = herramientas.length;

    const estadoResumenHerramienta = useMemo(() => {
        return (h: (typeof herramientas)[number]) => {
            return normalizarEstadoItem(h.estado) ?? 'disponible';
        };
    }, [herramientas]);

    const herramientasAlerta = herramientas.filter((h) => {
        const estado = estadoResumenHerramienta(h);
        return estado === 'extraviado' || estado === 'en_mantenimiento';
    }).length;

    const DIAS_POR_VENCER = 3;
    const aFecha = (valor: string | null) => {
        if (!valor) return null;
        if (valor.includes('T')) return new Date(valor);
        return new Date(`${valor}T00:00:00`);
    };
    const ahora = new Date();
    const msDia = 24 * 60 * 60 * 1000;
    const limitePorVencer = new Date(ahora.getTime() + DIAS_POR_VENCER * msDia);

    const prestamosNoDevueltos = prestamos.filter((p) => p.estado === 'activo' || p.estado === 'pendiente' || p.estado === 'vencido');
    const prestamosActivos = prestamosNoDevueltos.filter((p) => p.estado === 'activo' || p.estado === 'pendiente').length;
    const prestamosVencidos = prestamosNoDevueltos.filter((p) => {
        if (p.estado === 'vencido') return true;
        const fecha = aFecha(p.fechaDevolucion);
        return Boolean(fecha && fecha.getTime() < ahora.getTime());
    }).length;
    const prestamosPorVencer = prestamosNoDevueltos.filter((p) => {
        if (p.estado === 'vencido') return false;
        const fecha = aFecha(p.fechaDevolucion);
        if (!fecha) return false;
        const t = fecha.getTime();
        return t >= ahora.getTime() && t <= limitePorVencer.getTime();
    }).length;
    const totalEstudiantes = estudiantes.length;
    const materialBajoStock = materiales.filter(m => {
        const total = m.subinstancias.reduce((acc, sub) => acc + sub.cantidadDisponible, 0);
        return total <= m.stockMinimo;
    }).length;

    const valorActivosBob = herramientas.reduce((acc, h) => acc + (h.precio || 0), 0);
    const valorMaterialesBob = materiales.reduce((acc, m) => acc + m.subinstancias.reduce((sAcc, s) => sAcc + (s.cantidadDisponible * (s.precio || 0)), 0), 0);
    const valorTotalBob = valorActivosBob + valorMaterialesBob;

    const [tab, setTab] = useState<'resumen' | 'reportes'>('resumen');
    const [reporteSeleccionado, setReporteSeleccionado] = useState<ReporteDetalle | null>(null);
    const [reporteHtml, setReporteHtml] = useState('<p></p>');
    const [cfgDoc, setCfgDoc] = useState<DocumentoConfig>({
        widthMm: 216,
        heightMm: 279,
        margenes: { top: 20, right: 20, bottom: 20, left: 20 },
    });
    const [generando, setGenerando] = useState(false);
    const [guardando, setGuardando] = useState(false);
    const [errorReporte, setErrorReporte] = useState<string | null>(null);

    const [listaReportes, setListaReportes] = useState<ReporteListado[]>([]);

    const [iaCfgCargando, setIaCfgCargando] = useState(false);
    const [iaKeyConfigurada, setIaKeyConfigurada] = useState<boolean | null>(null);

    const [dlgNuevoOpen, setDlgNuevoOpen] = useState(false);
    const [dlgVerOpen, setDlgVerOpen] = useState(false);
    const [dlgEditarOpen, setDlgEditarOpen] = useState(false);

    const [reporteAEliminar, setReporteAEliminar] = useState<ReporteListado | null>(null);
    const [eliminandoReporte, setEliminandoReporte] = useState(false);

    const eliminarSeguro = useCierreSeguro({
        estaSucio: true,
        estaCargando: eliminandoReporte,
        mensajeConfirmacion: '¿Eliminar este reporte? Esta acción no se puede deshacer.',
        alCerrar: () => {
            const objetivo = reporteAEliminar;
            if (!objetivo) return;
            setErrorReporte(null);
            setEliminandoReporte(true);
            void (async () => {
                try {
                    await eliminarReporte(objetivo.id);
                    await refrescarRegistro();
                } catch (e: any) {
                    if (esSesionExpirada(e)) {
                        onCerrarSesion();
                        return;
                    }
                    setErrorReporte(e?.message || 'No se pudo eliminar el reporte');
                } finally {
                    setEliminandoReporte(false);
                    setReporteAEliminar(null);
                }
            })();
        },
    });

    const [crearTituloBase, setCrearTituloBase] = useState('');
    const [crearTipo, setCrearTipo] = useState<'blanco' | 'precreado'>('blanco');

    const formatearYmdLocal = (d: Date) => {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
    };

    const limitesMesActual = () => {
        const now = new Date();
        const inicio = new Date(now.getFullYear(), now.getMonth(), 1);
        const fin = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        return { inicio: formatearYmdLocal(inicio), fin: formatearYmdLocal(fin) };
    };

    const [crearFechaInicio, setCrearFechaInicio] = useState(() => limitesMesActual().inicio);
    const [crearFechaFin, setCrearFechaFin] = useState(() => limitesMesActual().fin);
    const [crearAreas, setCrearAreas] = useState({ activos: true, materiales: true, movimientos: true });
    const [crearUsarIA, setCrearUsarIA] = useState(false);

    const tituloPreview = useMemo(() => {
        const hoy = new Date().toISOString().slice(0, 10);
        const base = (crearTituloBase ?? '').trim();
        return base ? `${base} - ${hoy}` : `Reporte - ${hoy}`;
    }, [crearTituloBase]);

    const resetCrearForm = () => {
        setCrearTituloBase('');
        setCrearTipo('blanco');
        const lim = limitesMesActual();
        setCrearFechaInicio(lim.inicio);
        setCrearFechaFin(lim.fin);
        setCrearAreas({ activos: true, materiales: true, movimientos: true });
        setCrearUsarIA(false);
        setErrorReporte(null);
    };

    const esSesionExpirada = (e: unknown) => {
        const msg = String((e as any)?.message ?? '');
        return msg.toLowerCase().includes('sesión expiró') || msg.toLowerCase().includes('inicia sesión');
    };

    const nombreArchivoSeguro = (titulo: string) => {
        const base = (titulo ?? '').trim() || 'reporte';
        return base
            .normalize('NFKD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-zA-Z0-9._ -]+/g, '_')
            .replace(/\s+/g, ' ')
            .trim()
            .slice(0, 80);
    };

    const descargarBlob = (blob: Blob, filename: string) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 250);
    };

    const cargarDisponibilidadIA = async () => {
        if (iaKeyConfigurada !== null) return iaKeyConfigurada;
        setIaCfgCargando(true);
        try {
            const cfg = await obtenerConfiguracionIA();
            const configurada = Boolean(cfg.geminiApiKeyConfigurada);
            setIaKeyConfigurada(configurada);
            return configurada;
        } catch (e: any) {
            if (esSesionExpirada(e)) {
                onCerrarSesion();
                return false;
            }
            // Si no se puede verificar, por seguridad deshabilitamos IA.
            setIaKeyConfigurada(false);
            return false;
        } finally {
            setIaCfgCargando(false);
        }
    };

    const refrescarRegistro = async () => {
        setErrorReporte(null);
        try {
            const r = await listarReportes();
            setListaReportes(r);
        } catch (e: any) {
            if (esSesionExpirada(e)) {
                onCerrarSesion();
                return;
            }
            setErrorReporte(e?.message || 'No se pudo cargar el registro.');
        }
    };

    useEffect(() => {
        if (tab !== 'reportes') return;
        void refrescarRegistro();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tab]);

    const renderResumen = (titulo: string, subtitulo: string, alertas?: number) => (
        <LayoutPagina
            paginaActiva="resumen"
            titulo={titulo}
            subtitulo={subtitulo}
            alertas={alertas}
            onNavegar={onNavegar}
            onCerrarSesion={onCerrarSesion}
        >
            <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
                <TabsList className="w-full grid grid-cols-2">
                    <TabsTrigger value="resumen" className="w-full">Resumen</TabsTrigger>
                    <TabsTrigger value="reportes" className="w-full">Reportes</TabsTrigger>
                </TabsList>

                <TabsContent value="resumen" className="mt-4">
                    {esAdministrador ? (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
                                <TarjetaMetrica titulo="Usuarios del sistema" valor={totalUsuarios} Icono={Users} colorBase="blue" />
                                <TarjetaMetrica titulo="Estudiantes" valor={estudiantes.length} Icono={GraduationCap} colorBase="amber" />
                                <TarjetaMetrica titulo="Docentes" valor={docentes.length} Icono={Users} colorBase="emerald" />
                                <TarjetaMetrica titulo="Auditoría" valor={'Pendiente'} Icono={ShieldCheck} colorBase="indigo" />
                            </div>

                            <div className="grid gap-6 lg:grid-cols-2">
                                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                                    <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Accesos rápidos de administración</h3>
                                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                        Gestiona cada módulo desde su página específica.
                                    </p>
                                    <div className="mt-4 grid grid-cols-2 gap-2">
                                        <button onClick={() => onNavegar('auditoria')} className="rounded-md border border-slate-200 px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">Auditoría</button>
                                        <button onClick={() => onNavegar('usuarios')} className="rounded-md border border-slate-200 px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">Usuarios</button>
                                        <button onClick={() => onNavegar('estudiantes')} className="rounded-md border border-slate-200 px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">Estudiantes</button>
                                        <button onClick={() => onNavegar('docentes')} className="rounded-md border border-slate-200 px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">Docentes</button>
                                    </div>
                                </div>

                                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                                    <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Estado de auditoría</h3>
                                    <p className="mt-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                                        El tablero de logs aún está en construcción. Mientras tanto, puedes continuar gestionando usuarios y registros desde sus módulos.
                                    </p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-6 shadow-sm dark:border-blue-900/50 dark:bg-blue-900/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-sm font-bold text-blue-800 dark:text-blue-300 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                        <Activity className="h-4 w-4" /> Capital de Inversión Total
                    </h2>
                    <p className="text-xs text-blue-600/80 dark:text-blue-400/80">
                        ({valorActivosBob.toLocaleString('es-BO', { minimumFractionDigits: 2 })} Bs. en Activos + {valorMaterialesBob.toLocaleString('es-BO', { minimumFractionDigits: 2 })} Bs. en Materiales)
                    </p>
                </div>
                <div className="flex flex-col items-end text-right">
                    <span className="text-2xl font-black text-blue-900 dark:text-blue-100 tracking-tight">
                        Bs. {valorTotalBob.toLocaleString('es-BO', { minimumFractionDigits: 2 })}
                    </span>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <TarjetaMetrica titulo="Total Activos Fijos" valor={totalHerramientas} Icono={Wrench} colorBase="blue" />
                    <div className="mt-4 flex items-center text-xs">
                        {herramientasAlerta > 0 ? (
                            <span className="flex items-center text-amber-600 dark:text-amber-500 font-medium">
                                <AlertTriangle className="mr-1 h-3.5 w-3.5" />
                                {herramientasAlerta} requieren atención
                            </span>
                        ) : (
                            <span className="text-emerald-600 dark:text-emerald-500 font-medium">Todo en orden</span>
                        )}
                    </div>
                </div>
                <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <TarjetaMetrica titulo="Préstamos Activos" valor={prestamosActivos} Icono={ClipboardList} colorBase="indigo" />
                    <div className="mt-4 grid gap-1 text-xs">
                        <div className="flex items-center justify-between">
                            <span className="text-slate-500 dark:text-slate-400">Vencidos</span>
                            <span className={prestamosVencidos > 0 ? 'font-semibold text-red-600 dark:text-red-500' : 'font-semibold text-slate-600 dark:text-slate-300'}>
                                {prestamosVencidos}
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-slate-500 dark:text-slate-400">Por vencer (próx. {DIAS_POR_VENCER} días)</span>
                            <span className={prestamosPorVencer > 0 ? 'font-semibold text-amber-600 dark:text-amber-500' : 'font-semibold text-slate-600 dark:text-slate-300'}>
                                {prestamosPorVencer}
                            </span>
                        </div>
                    </div>
                </div>
                <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <TarjetaMetrica titulo="Tipos de Materiales" valor={materiales.length} Icono={Package} colorBase="emerald" />
                    <div className="mt-4 flex items-center text-xs">
                        {materialBajoStock > 0 ? (
                            <span className="flex items-center text-red-600 dark:text-red-500 font-medium">
                                <AlertTriangle className="mr-1 h-3.5 w-3.5" />
                                {materialBajoStock} bajo stock mínimo
                            </span>
                        ) : (
                            <span className="text-emerald-600 dark:text-emerald-500 font-medium">Stock suficiente</span>
                        )}
                    </div>
                </div>
                <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <TarjetaMetrica titulo="Estudiantes" valor={totalEstudiantes} Icono={GraduationCap} colorBase="amber" />
                    <div className="mt-4 flex items-center text-xs">
                        <span className="text-slate-500 dark:text-slate-400">Registrados en el sistema</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 flex items-center">
                            <Activity className="mr-2 h-4 w-4 text-blue-500" />
                            Estado del Inventario
                        </h3>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <div className="flex justify-between text-xs mb-1">
                                <span className="font-medium text-slate-700 dark:text-slate-300">Disponible</span>
                                <span className="text-slate-500">{herramientas.filter(h => estadoResumenHerramienta(h) === 'disponible').length}</span>
                            </div>
                            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                                <div className="h-full bg-emerald-500 transition-all" style={{ width: `${totalHerramientas > 0 ? (herramientas.filter(h => estadoResumenHerramienta(h) === 'disponible').length / totalHerramientas) * 100 : 0}%` }}></div>
                            </div>
                        </div>
                        <div>
                            <div className="flex justify-between text-xs mb-1">
                                <span className="font-medium text-slate-700 dark:text-slate-300">En préstamo</span>
                                <span className="text-slate-500">{herramientas.filter(h => estadoResumenHerramienta(h) === 'en_prestamo').length}</span>
                            </div>
                            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                                <div className="h-full bg-blue-500 transition-all" style={{ width: `${totalHerramientas > 0 ? (herramientas.filter(h => estadoResumenHerramienta(h) === 'en_prestamo').length / totalHerramientas) * 100 : 0}%` }}></div>
                            </div>
                        </div>
                        <div>
                            <div className="flex justify-between text-xs mb-1">
                                <span className="font-medium text-slate-700 dark:text-slate-300">En mantenimiento</span>
                                <span className="text-slate-500">{herramientas.filter(h => estadoResumenHerramienta(h) === 'en_mantenimiento').length}</span>
                            </div>
                            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                                <div className="h-full bg-red-500 transition-all" style={{ width: `${totalHerramientas > 0 ? (herramientas.filter(h => estadoResumenHerramienta(h) === 'en_mantenimiento').length / totalHerramientas) * 100 : 0}%` }}></div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 flex flex-col items-center justify-center text-center">
                    <div className="flex h-16 w-16 mb-4 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                        <ClipboardList className="h-8 w-8 text-slate-400" />
                    </div>
                    <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-2">Próximos Vencimientos</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs leading-relaxed">
                        {prestamosVencidos > 0
                            ? `Tienes ${prestamosVencidos} préstamo(s) vencido(s). Revisa Préstamos para ver el detalle y regularizar devoluciones.`
                            : prestamosPorVencer > 0
                                ? `Tienes ${prestamosPorVencer} préstamo(s) por vencer en los próximos ${DIAS_POR_VENCER} días.`
                                : prestamosActivos > 0
                                    ? `Actualmente tienes ${prestamosActivos} préstamo(s) activo(s). Revisa la pestaña de Préstamos para ver fechas de devolución.`
                                    : "No hay préstamos activos en este momento."}
                    </p>
                    <button onClick={() => onNavegar('prestamos')} className="mt-4 rounded-md bg-blue-50 px-4 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition-colors dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50">
                        Ver préstamos
                    </button>
                </div>
            </div>
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="reportes" className="mt-4">
                    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
                        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                            <div>
                                <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Reportes</h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400">Cada acción se realiza en un dialog y queda registrada.</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <Dialog
                                    open={dlgNuevoOpen}
                                    onOpenChange={(open) => {
                                        setDlgNuevoOpen(open);
                                        if (open) {
                                            resetCrearForm();
                                            void cargarDisponibilidadIA();
                                        }
                                    }}
                                >
                                    <DialogTrigger asChild>
                                        <button className="rounded-md bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700">
                                            Crear reporte
                                        </button>
                                    </DialogTrigger>
                                    <DialogContent className="max-w-2xl">
                                        <DialogHeader>
                                            <DialogTitle>Crear reporte</DialogTitle>
                                            <DialogDescription>
                                                Crea un reporte en blanco o un reporte pre-creado a partir de un intervalo y áreas.
                                            </DialogDescription>
                                        </DialogHeader>

                                        <div className="grid grid-cols-1 gap-3">
                                            <div className="space-y-1">
                                                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">Nombre del reporte</label>
                                                <input
                                                    value={crearTituloBase}
                                                    onChange={(e) => setCrearTituloBase(e.target.value)}
                                                    placeholder="Ej: Informe de inventarios"
                                                    className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-900"
                                                />
                                                <p className="text-[11px] text-slate-500 dark:text-slate-400">Vista previa: {tituloPreview}</p>
                                            </div>

                                            <div className="space-y-1">
                                                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">Tipo</label>
                                                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => setCrearTipo('blanco')}
                                                        className={`flex w-full items-start gap-3 rounded-lg border-2 p-4 text-left transition-all duration-200 hover:shadow-sm active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/40 ${
                                                            crearTipo === 'blanco'
                                                                ? 'border-blue-500 bg-blue-50 shadow-sm ring-2 ring-blue-400/20 dark:bg-blue-950'
                                                                : 'border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-slate-600'
                                                        }`}
                                                    >
                                                        <div
                                                            className={`mt-0.5 flex h-10 w-10 items-center justify-center rounded-full ${
                                                                crearTipo === 'blanco' ? 'bg-blue-100 dark:bg-blue-900' : 'bg-white dark:bg-slate-800'
                                                            }`}
                                                        >
                                                            <FileText
                                                                className={`h-5 w-5 ${
                                                                    crearTipo === 'blanco' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400'
                                                                }`}
                                                            />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p
                                                                className={`text-sm font-semibold ${
                                                                    crearTipo === 'blanco' ? 'text-blue-700 dark:text-blue-300' : 'text-slate-700 dark:text-slate-200'
                                                                }`}
                                                            >
                                                                En blanco
                                                            </p>
                                                            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Documento vacío para escribir desde cero.</p>
                                                        </div>
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() => setCrearTipo('precreado')}
                                                        className={`flex w-full items-start gap-3 rounded-lg border-2 p-4 text-left transition-all duration-200 hover:shadow-sm active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/40 ${
                                                            crearTipo === 'precreado'
                                                                ? 'border-blue-500 bg-blue-50 shadow-sm ring-2 ring-blue-400/20 dark:bg-blue-950'
                                                                : 'border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-slate-600'
                                                        }`}
                                                    >
                                                        <div
                                                            className={`mt-0.5 flex h-10 w-10 items-center justify-center rounded-full ${
                                                                crearTipo === 'precreado' ? 'bg-blue-100 dark:bg-blue-900' : 'bg-white dark:bg-slate-800'
                                                            }`}
                                                        >
                                                            <LayoutTemplate
                                                                className={`h-5 w-5 ${
                                                                    crearTipo === 'precreado' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400'
                                                                }`}
                                                            />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p
                                                                className={`text-sm font-semibold ${
                                                                    crearTipo === 'precreado' ? 'text-blue-700 dark:text-blue-300' : 'text-slate-700 dark:text-slate-200'
                                                                }`}
                                                            >
                                                                Pre-creado
                                                            </p>
                                                            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                                                                Genera un borrador desde fechas y áreas (incluye préstamos).
                                                            </p>
                                                        </div>
                                                    </button>
                                                </div>
                                            </div>

                                            {crearTipo === 'precreado' && (
                                                <>
                                                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                                        <div className="space-y-1">
                                                            <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">Desde</label>
                                                            <DatePicker value={crearFechaInicio} onChange={setCrearFechaInicio} placeholder="Seleccionar fecha" title="Desde" />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">Hasta</label>
                                                            <DatePicker value={crearFechaFin} onChange={setCrearFechaFin} placeholder="Seleccionar fecha" title="Hasta" />
                                                        </div>
                                                    </div>

                                                    <div className="space-y-2">
                                                        <div className="flex items-center justify-between">
                                                            <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">Áreas</label>
                                                            <span className="text-[11px] text-slate-500 dark:text-slate-400">Préstamos es obligatorio</span>
                                                        </div>
                                                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
                                                            <button
                                                                type="button"
                                                                disabled
                                                                className="flex items-start gap-3 rounded-lg border-2 border-blue-500 bg-blue-50 p-4 text-left dark:bg-blue-950"
                                                            >
                                                                <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
                                                                    <ClipboardList className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <p className="text-sm font-semibold text-blue-700 dark:text-blue-300">Préstamos</p>
                                                                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Obligatorio</p>
                                                                </div>
                                                            </button>

                                                            <button
                                                                type="button"
                                                                onClick={() => setCrearAreas((prev) => ({ ...prev, activos: !prev.activos }))}
                                                                className={`flex items-start gap-3 rounded-lg border-2 p-4 text-left transition-all duration-200 hover:shadow-sm active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/40 ${
                                                                    crearAreas.activos
                                                                        ? 'border-blue-500 bg-blue-50 shadow-sm ring-2 ring-blue-400/20 dark:bg-blue-950'
                                                                        : 'border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-slate-600'
                                                                }`}
                                                            >
                                                                <div
                                                                    className={`mt-0.5 flex h-10 w-10 items-center justify-center rounded-full ${
                                                                        crearAreas.activos ? 'bg-blue-100 dark:bg-blue-900' : 'bg-white dark:bg-slate-800'
                                                                    }`}
                                                                >
                                                                    <Layers
                                                                        className={`h-5 w-5 ${
                                                                            crearAreas.activos ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400'
                                                                        }`}
                                                                    />
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <p
                                                                        className={`text-sm font-semibold ${
                                                                            crearAreas.activos ? 'text-blue-700 dark:text-blue-300' : 'text-slate-700 dark:text-slate-200'
                                                                        }`}
                                                                    >
                                                                        Activos
                                                                    </p>
                                                                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Resumen de activos fijos.</p>
                                                                </div>
                                                            </button>

                                                            <button
                                                                type="button"
                                                                onClick={() => setCrearAreas((prev) => ({ ...prev, materiales: !prev.materiales }))}
                                                                className={`flex items-start gap-3 rounded-lg border-2 p-4 text-left transition-all duration-200 hover:shadow-sm active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/40 ${
                                                                    crearAreas.materiales
                                                                        ? 'border-blue-500 bg-blue-50 shadow-sm ring-2 ring-blue-400/20 dark:bg-blue-950'
                                                                        : 'border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-slate-600'
                                                                }`}
                                                            >
                                                                <div
                                                                    className={`mt-0.5 flex h-10 w-10 items-center justify-center rounded-full ${
                                                                        crearAreas.materiales ? 'bg-blue-100 dark:bg-blue-900' : 'bg-white dark:bg-slate-800'
                                                                    }`}
                                                                >
                                                                    <Package
                                                                        className={`h-5 w-5 ${
                                                                            crearAreas.materiales ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400'
                                                                        }`}
                                                                    />
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <p
                                                                        className={`text-sm font-semibold ${
                                                                            crearAreas.materiales ? 'text-blue-700 dark:text-blue-300' : 'text-slate-700 dark:text-slate-200'
                                                                        }`}
                                                                    >
                                                                        Materiales
                                                                    </p>
                                                                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Stock y alertas.</p>
                                                                </div>
                                                            </button>

                                                            <button
                                                                type="button"
                                                                onClick={() => setCrearAreas((prev) => ({ ...prev, movimientos: !prev.movimientos }))}
                                                                className={`flex items-start gap-3 rounded-lg border-2 p-4 text-left transition-all duration-200 hover:shadow-sm active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/40 ${
                                                                    crearAreas.movimientos
                                                                        ? 'border-blue-500 bg-blue-50 shadow-sm ring-2 ring-blue-400/20 dark:bg-blue-950'
                                                                        : 'border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-slate-600'
                                                                }`}
                                                            >
                                                                <div
                                                                    className={`mt-0.5 flex h-10 w-10 items-center justify-center rounded-full ${
                                                                        crearAreas.movimientos ? 'bg-blue-100 dark:bg-blue-900' : 'bg-white dark:bg-slate-800'
                                                                    }`}
                                                                >
                                                                    <ArrowLeftRight
                                                                        className={`h-5 w-5 ${
                                                                            crearAreas.movimientos ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400'
                                                                        }`}
                                                                    />
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <p
                                                                        className={`text-sm font-semibold ${
                                                                            crearAreas.movimientos ? 'text-blue-700 dark:text-blue-300' : 'text-slate-700 dark:text-slate-200'
                                                                        }`}
                                                                    >
                                                                        Movimientos
                                                                    </p>
                                                                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Entradas y salidas.</p>
                                                                </div>
                                                            </button>
                                                        </div>
                                                    </div>

                                                    <div className="space-y-1">
                                                        <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">IA</label>
                                                        <button
                                                            type="button"
                                                            disabled={iaCfgCargando || iaKeyConfigurada === false}
                                                            onClick={async () => {
                                                                const ok = await cargarDisponibilidadIA();
                                                                if (!ok) return;
                                                                setCrearUsarIA((v) => !v);
                                                            }}
                                                            className={`flex w-full items-start justify-between gap-3 rounded-lg border-2 p-4 text-left transition-all duration-200 disabled:opacity-60 hover:shadow-sm active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/40 ${
                                                                crearUsarIA
                                                                    ? 'border-blue-500 bg-blue-50 shadow-sm ring-2 ring-blue-400/20 dark:bg-blue-950'
                                                                    : 'border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-slate-600'
                                                            }`}
                                                        >
                                                            <div className="flex items-start gap-3">
                                                                <div
                                                                    className={`mt-0.5 flex h-10 w-10 items-center justify-center rounded-full ${
                                                                        crearUsarIA ? 'bg-blue-100 dark:bg-blue-900' : 'bg-white dark:bg-slate-800'
                                                                    }`}
                                                                >
                                                                    <Sparkles
                                                                        className={`h-5 w-5 ${
                                                                            crearUsarIA ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400'
                                                                        }`}
                                                                    />
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <p
                                                                        className={`text-sm font-semibold ${
                                                                            crearUsarIA ? 'text-blue-700 dark:text-blue-300' : 'text-slate-700 dark:text-slate-200'
                                                                        }`}
                                                                    >
                                                                        Usar IA (Gemini)
                                                                    </p>
                                                                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                                                                        {iaCfgCargando
                                                                            ? 'Verificando configuración...'
                                                                            : iaKeyConfigurada === false
                                                                                ? 'No disponible: configura tu API Key en Configuración.'
                                                                                : 'Genera un texto más descriptivo automáticamente.'}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <div className="mt-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                                                                {crearUsarIA ? 'Activado' : 'Desactivado'}
                                                            </div>
                                                        </button>
                                                    </div>
                                                </>
                                            )}
                                        </div>

                                        {errorReporte && (
                                            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-200">
                                                {errorReporte}
                                            </div>
                                        )}

                                        <DialogFooter>
                                            <button
                                                onClick={() => setDlgNuevoOpen(false)}
                                                className="rounded-md border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                                            >
                                                Cancelar
                                            </button>
                                            <button
                                                onClick={async () => {
                                                    setGenerando(true);
                                                    setErrorReporte(null);
                                                    try {
                                                        if (crearTipo === 'precreado') {
                                                            if (!crearFechaInicio || !crearFechaFin) throw new Error('Selecciona un intervalo de fechas.');
                                                        }

                                                        if (crearTipo === 'precreado' && crearUsarIA) {
                                                            const okIA = await cargarDisponibilidadIA();
                                                            if (!okIA) {
                                                                setCrearUsarIA(false);
                                                                throw new Error('IA no disponible: configura tu API Key de Gemini en Configuración.');
                                                            }
                                                        }

                                                        const areas = ['prestamos'] as string[];
                                                        if (crearTipo === 'precreado') {
                                                            if (crearAreas.activos) areas.push('activos');
                                                            if (crearAreas.materiales) areas.push('materiales');
                                                            if (crearAreas.movimientos) areas.push('movimientos');
                                                        }

                                                        await crearReporte({
                                                            tituloBase: crearTituloBase,
                                                            tipo: crearTipo,
                                                            fechaInicio: crearTipo === 'precreado' ? crearFechaInicio : undefined,
                                                            fechaFin: crearTipo === 'precreado' ? crearFechaFin : undefined,
                                                            areas: crearTipo === 'precreado' ? areas : undefined,
                                                            usarIA: crearTipo === 'precreado' ? crearUsarIA : undefined,
                                                        });
                                                        setDlgNuevoOpen(false);
                                                        await refrescarRegistro();
                                                    } catch (e: any) {
                                                        if (esSesionExpirada(e)) {
                                                            onCerrarSesion();
                                                            return;
                                                        }
                                                        setErrorReporte(e?.message || 'No se pudo generar el reporte');
                                                    } finally {
                                                        setGenerando(false);
                                                    }
                                                }}
                                                disabled={generando}
                                                className="rounded-md bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                                            >
                                                {generando ? 'Creando...' : 'Crear'}
                                            </button>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>
                            </div>
                        </div>

                        {errorReporte && (
                            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-200">
                                {errorReporte}
                            </div>
                        )}

                        <div className="grid grid-cols-1 gap-4">
                            <div className="w-full rounded-lg border border-slate-200 p-4 dark:border-slate-800">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-100">Reportes creados</h4>
                                    <span className="text-[11px] text-slate-500 dark:text-slate-400">{listaReportes.length}</span>
                                </div>
                                <div className="mt-3 space-y-2">
                                    {listaReportes.length === 0 ? (
                                        <p className="text-xs text-slate-500 dark:text-slate-400">Aún no hay reportes.</p>
                                    ) : (
                                        listaReportes.slice(0, 10).map((r) => (
                                            <div key={r.id} className="w-full rounded-md border border-slate-200 px-3 py-3 dark:border-slate-800">
                                                <div className="flex w-full flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                                    <div className="min-w-0">
                                                        <div className="truncate text-xs font-semibold text-slate-800 dark:text-slate-100">{r.titulo}</div>
                                                        <div className="text-[11px] text-slate-500 dark:text-slate-400">{r.fechaInicio} → {r.fechaFin}</div>
                                                    </div>
                                                    <div className="flex w-full flex-wrap items-center justify-end gap-2 md:w-auto">
                                                    <button
                                                        onClick={async () => {
                                                            setErrorReporte(null);
                                                            try {
                                                                const det = await obtenerReporte(r.id);
                                                                if (!det) throw new Error('No se encontró el reporte.');
                                                                setReporteSeleccionado(det);
                                                                setDlgVerOpen(true);
                                                            } catch (e: any) {
                                                                if (esSesionExpirada(e)) {
                                                                    onCerrarSesion();
                                                                    return;
                                                                }
                                                                setErrorReporte(e?.message || 'No se pudo abrir el reporte');
                                                            }
                                                        }}
                                                        className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                                                    >
                                                        Ver
                                                    </button>
                                                    <button
                                                        onClick={async () => {
                                                            setErrorReporte(null);
                                                            try {
                                                                const det = await obtenerReporte(r.id);
                                                                if (!det) throw new Error('No se encontró el reporte.');
                                                                setReporteSeleccionado(det);
                                                                setReporteHtml(det.html);
                                                                setDlgEditarOpen(true);
                                                            } catch (e: any) {
                                                                if (esSesionExpirada(e)) {
                                                                    onCerrarSesion();
                                                                    return;
                                                                }
                                                                setErrorReporte(e?.message || 'No se pudo abrir el reporte');
                                                            }
                                                        }}
                                                        className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                                                    >
                                                        Editar
                                                    </button>
                                                    <button
                                                        onClick={async () => {
                                                            setReporteAEliminar(r);
                                                            eliminarSeguro.solicitarCierre();
                                                        }}
                                                        className="rounded-md border border-red-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-red-700 hover:bg-red-50 dark:border-red-900/40 dark:bg-slate-900 dark:text-red-200 dark:hover:bg-red-900/20"
                                                    >
                                                        Eliminar
                                                    </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>

                        <Dialog
                            open={eliminarSeguro.confirmacionAbierta}
                            onOpenChange={(open) => {
                                if (!open) {
                                    eliminarSeguro.cancelarCierre();
                                    setReporteAEliminar(null);
                                }
                            }}
                        >
                            <DialogContent className="max-w-md">
                                <DialogHeader>
                                    <DialogTitle>Confirmar eliminación</DialogTitle>
                                    <DialogDescription>
                                        {reporteAEliminar ? reporteAEliminar.titulo : 'Reporte'}
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="text-sm text-slate-700 dark:text-slate-200">
                                    {eliminarSeguro.mensajeConfirmacion}
                                </div>
                                <DialogFooter>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            eliminarSeguro.cancelarCierre();
                                            setReporteAEliminar(null);
                                        }}
                                        disabled={eliminandoReporte}
                                        className="rounded-md border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => eliminarSeguro.confirmarCierre()}
                                        disabled={eliminandoReporte || !reporteAEliminar}
                                        className="rounded-md border border-red-200 bg-red-50 px-4 py-2 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-60 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-200 dark:hover:bg-red-900/30"
                                    >
                                        {eliminandoReporte ? 'Eliminando...' : 'Eliminar'}
                                    </button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>

                        <Dialog
                            open={dlgVerOpen}
                            onOpenChange={(open) => {
                                setDlgVerOpen(open);
                                if (open) setErrorPdf(null);
                                if (!open) setReporteSeleccionado(null);
                            }}
                        >
                            <DialogContent className="max-w-5xl">
                                <DialogHeader>
                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                        <div className="min-w-0">
                                            <DialogTitle>Vista previa</DialogTitle>
                                            <DialogDescription>
                                                {reporteSeleccionado ? `${reporteSeleccionado.titulo} · ${reporteSeleccionado.fechaInicio} → ${reporteSeleccionado.fechaFin}` : 'Reporte'}
                                            </DialogDescription>
                                        </div>

                                        <div className="flex flex-row flex-wrap items-center justify-start gap-3 sm:justify-end">
                                            <button
                                                type="button"
                                                disabled={descargandoPdf || !reporteSeleccionado}
                                                onClick={() => {
                                                    if (!reporteSeleccionado) return;
                                                    setDescargandoPdf(true);
                                                    setErrorPdf(null);
                                                    void (async () => {
                                                        try {
                                                            const blob = await generarPdfDesdeReporteYDescargar(reporteSeleccionado.id, { config: cfgDoc });
                                                            const nombre = nombreArchivoSeguro(reporteSeleccionado.titulo);
                                                            const fecha = new Date().toISOString().slice(0, 10);
                                                            descargarBlob(blob, `${nombre}-${fecha}.pdf`);
                                                        } catch (e: any) {
                                                            if (esSesionExpirada(e)) {
                                                                onCerrarSesion();
                                                                return;
                                                            }
                                                            setErrorPdf(e?.message || 'No se pudo descargar el PDF.');
                                                        } finally {
                                                            setDescargandoPdf(false);
                                                        }
                                                    })();
                                                }}
                                                className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                                            >
                                                <Download className="h-4 w-4" />
                                                {descargandoPdf ? 'Descargando...' : 'Descargar PDF'}
                                            </button>

                                            <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                                                <Switch checked={mostrarGuiasMargenPreview} onCheckedChange={setMostrarGuiasMargenPreview} />
                                                Márgenes
                                            </label>
                                        </div>
                                    </div>
                                </DialogHeader>
                                <RenderizadorHtml
                                    contenido={reporteSeleccionado?.html ?? '<p></p>'}
                                    altura="560px"
                                    tamanoPersonalizado={{ widthMm: cfgDoc.widthMm, heightMm: cfgDoc.heightMm }}
                                    margenes={cfgDoc.margenes}
                                    mostrarGuiasMargen={mostrarGuiasMargenPreview}
                                />

                                {errorPdf && (
                                    <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-200">
                                        {errorPdf}
                                    </div>
                                )}
                            </DialogContent>
                        </Dialog>

                        <Dialog open={dlgEditarOpen} onOpenChange={setDlgEditarOpen}>
                            <DialogContent className="max-w-4xl">
                                <DialogHeader>
                                    <DialogTitle>Editar reporte</DialogTitle>
                                    <DialogDescription>
                                        {reporteSeleccionado ? reporteSeleccionado.titulo : 'Reporte'}
                                    </DialogDescription>
                                </DialogHeader>
                                <EditorDocumento
                                    valorHtml={reporteHtml}
                                    onChangeHtml={setReporteHtml}
                                    config={cfgDoc}
                                    onChangeConfig={setCfgDoc}
                                    minHeight="320px"
                                />
                                <DialogFooter>
                                    <button
                                        onClick={() => setDlgEditarOpen(false)}
                                        className="rounded-md border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                                    >
                                        Cerrar
                                    </button>
                                    <button
                                        onClick={async () => {
                                            if (!reporteSeleccionado) return;
                                            setGuardando(true);
                                            setErrorReporte(null);
                                            try {
                                                const actualizado = await actualizarReporte(reporteSeleccionado.id, { html: reporteHtml });
                                                if (!actualizado) throw new Error('No se pudo guardar el reporte.');
                                                setReporteSeleccionado(actualizado);
                                                await refrescarRegistro();
                                                setDlgEditarOpen(false);
                                            } catch (e: any) {
                                                if (esSesionExpirada(e)) {
                                                    onCerrarSesion();
                                                    return;
                                                }
                                                setErrorReporte(e?.message || 'No se pudo guardar el reporte');
                                            } finally {
                                                setGuardando(false);
                                            }
                                        }}
                                        disabled={guardando}
                                        className="rounded-md bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                                    >
                                        {guardando ? 'Guardando...' : 'Guardar'}
                                    </button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                </TabsContent>
            </Tabs>
        </LayoutPagina>
    );

    if (esAdministrador) {
        return renderResumen('Inicio administrador', 'Supervisión de auditoría, usuarios y registros académicos');
    }

    return renderResumen('Resumen General', 'Vista general del sistema de laboratorios', herramientasAlerta + prestamosVencidos + materialBajoStock);
};
