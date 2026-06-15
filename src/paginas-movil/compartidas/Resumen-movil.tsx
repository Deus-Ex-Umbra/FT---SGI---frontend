import { useEffect, useMemo, useState } from 'react';
import { 
    Wrench, 
    AlertTriangle, 
    ClipboardList, 
    GraduationCap, 
    Package, 
    Activity, 
    Users, 
    Clock, 
    CheckCircle2, 
    Play, 
    Eye, 
    EyeOff 
} from 'lucide-react';
import type { PropsPaginaBase } from '@/tipos/paginas';
import { LayoutPagina } from '@/componentes/layout/layout-pagina';
import { TarjetaMetrica } from '@/componentes/ui/tarjeta-metrica';
import { PanelRegistroEstudiante } from '@/componentes/paginas/configuracion/panel-registro-estudiante';
import { useInventario } from '@/contextos/ContextoInventario';
import { Skeleton } from '@/componentes/ui/skeleton';
import { obtenerUsuarioActual } from '@/lib/servicio-autenticacion';
import { listarUsuarios } from '@/lib/servicio-administrador';
import { normalizarEstadoItem } from '@/utilidades/estados-activo';
import { cargarCanastasPrestamoDesdeBackend } from '@/lib/servicio-prestamos';
import type { PrestamoCanastaRegistro } from '@/tipos/inventario';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/componentes/ui/tabs';

export const ResumenMovil = ({ onNavegar, onCerrarSesion }: PropsPaginaBase) => {
    const { herramientas, prestamos, estudiantes, docentes, materiales, cargando } = useInventario();
    const usuarioActual = useMemo(() => obtenerUsuarioActual(), []);
    const esAdministrador = usuarioActual?.rol === 'administrador';
    const esDocente = usuarioActual?.rol === 'docente';
    const [totalUsuarios, setTotalUsuarios] = useState(0);
    const [mostrarValorTotal, setMostrarValorTotal] = useState(false);

    const [canastasDocente, setCanastasDocente] = useState<PrestamoCanastaRegistro[]>([]);
    const [cargandoCanastasDocente, setCargandoCanastasDocente] = useState(false);

    useEffect(() => {
        if (!esDocente) return;
        const cargarDatosDocente = async () => {
            try {
                setCargandoCanastasDocente(true);
                const data = await cargarCanastasPrestamoDesdeBackend();
                setCanastasDocente(data);
            } catch (err) {
                console.error('Error cargando canastas para docente:', err);
            } finally {
                setCargandoCanastasDocente(false);
            }
        };
        void cargarDatosDocente();
    }, [esDocente]);

    const canastasDelDocente = useMemo(() => {
        if (!usuarioActual?.id) return [];
        return canastasDocente.filter((c) => String(c.idDocente ?? '') === String(usuarioActual.id));
    }, [canastasDocente, usuarioActual?.id]);

    const canastasDocenteSolicitadas = useMemo(() => {
        return canastasDelDocente.filter((c) => c.estado === 'solicitado');
    }, [canastasDelDocente]);

    const canastasDocenteDespachadas = useMemo(() => {
        return canastasDelDocente.filter((c) => ['despachado', 'activo', 'pendiente'].includes(c.estado));
    }, [canastasDelDocente]);

    const canastasDocenteDevueltas = useMemo(() => {
        return canastasDelDocente.filter((c) => ['devuelto', 'devuelto_fuera_de_fecha_limite'].includes(c.estado));
    }, [canastasDelDocente]);

    const ordenarPorFechaReciente = (lista: PrestamoCanastaRegistro[]) => {
        return [...lista].sort((a, b) => {
            const dateA = new Date(a.fechaPrestamo).getTime();
            const dateB = new Date(b.fechaPrestamo).getTime();
            return dateB - dateA;
        });
    };

    const solicitadosRecientes = useMemo(() => {
        return ordenarPorFechaReciente(canastasDocenteSolicitadas).slice(0, 5);
    }, [canastasDocenteSolicitadas]);

    const despachadosRecientes = useMemo(() => {
        return ordenarPorFechaReciente(canastasDocenteDespachadas).slice(0, 5);
    }, [canastasDocenteDespachadas]);

    const devueltosRecientes = useMemo(() => {
        return ordenarPorFechaReciente(canastasDocenteDevueltas).slice(0, 5);
    }, [canastasDocenteDevueltas]);

    const totalEstudiantesDocente = useMemo(() => {
        const uniqueEst = new Set<string>();
        canastasDelDocente.forEach((c) => {
            if (c.carnetEstudiante) uniqueEst.add(c.carnetEstudiante);
            c.carnetsEstudiantes?.forEach((carnet) => uniqueEst.add(carnet));
        });
        return uniqueEst.size;
    }, [canastasDelDocente]);

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

    const renderResumen = (titulo: string, subtitulo: string, alertas?: number) => (
        <LayoutPagina
            paginaActiva="resumen"
            titulo={titulo}
            subtitulo={subtitulo}
            alertas={alertas}
            onNavegar={onNavegar}
            onCerrarSesion={onCerrarSesion}
        >
            {esAdministrador ? (
                <div className="space-y-5">
                    <div className="grid grid-cols-1 gap-4">
                        <TarjetaMetrica titulo="Usuarios del sistema" valor={totalUsuarios} Icono={Users} colorBase="blue" cargando={cargando} />
                        <TarjetaMetrica titulo="Estudiantes" valor={estudiantes.length} Icono={GraduationCap} colorBase="amber" cargando={cargando} />
                        <TarjetaMetrica titulo="Docentes" valor={docentes.length} Icono={Users} colorBase="emerald" cargando={cargando} />
                    </div>

                    <div className="grid gap-4 grid-cols-1">
                        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Prioridades del administrador</h3>
                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                La gestión completa se realiza desde el menú lateral.
                            </p>
                            <div className="mt-4 grid grid-cols-1 gap-2 text-xs text-slate-600 dark:text-slate-300">
                                <div className="rounded-md border border-slate-200 px-3 py-2 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-955/20">1. Carreras, Estudiantes y Docentes</div>
                                <div className="rounded-md border border-slate-200 px-3 py-2 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-955/20">2. Usuarios</div>
                                <div className="rounded-md border border-slate-200 px-3 py-2 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-955/20">3. Inscripción de nuevos estudiantes</div>
                            </div>
                        </div>

                        <PanelRegistroEstudiante />
                    </div>
                </div>
            ) : esDocente ? (
                <div className="space-y-5">
                    <div className="grid grid-cols-2 gap-3">
                        <TarjetaMetrica
                            titulo="Solicitados"
                            valor={canastasDocenteSolicitadas.length}
                            Icono={Clock}
                            colorBase="amber"
                            cargando={cargandoCanastasDocente}
                        />
                        <TarjetaMetrica
                            titulo="Despachados"
                            valor={canastasDocenteDespachadas.length}
                            Icono={Play}
                            colorBase="blue"
                            cargando={cargandoCanastasDocente}
                        />
                        <TarjetaMetrica
                            titulo="Devueltos"
                            valor={canastasDocenteDevueltas.length}
                            Icono={CheckCircle2}
                            colorBase="emerald"
                            cargando={cargandoCanastasDocente}
                        />
                        <TarjetaMetrica
                            titulo="Estudiantes"
                            valor={totalEstudiantesDocente}
                            Icono={GraduationCap}
                            colorBase="indigo"
                            cargando={cargandoCanastasDocente}
                        />
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
                            <ClipboardList className="h-4 w-4 text-primary" />
                            Historial de Préstamos
                        </h3>
                        
                        <Tabs defaultValue="solicitados" className="w-full">
                            <TabsList className="grid grid-cols-3 w-full border-b dark:border-slate-800">
                                <TabsTrigger value="solicitados" className="text-center py-2 text-xs">
                                    Solicitados ({canastasDocenteSolicitadas.length})
                                </TabsTrigger>
                                <TabsTrigger value="despachados" className="text-center py-2 text-xs">
                                    Activos ({canastasDocenteDespachadas.length})
                                </TabsTrigger>
                                <TabsTrigger value="devueltos" className="text-center py-2 text-xs">
                                    Devueltos ({canastasDocenteDevueltas.length})
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="solicitados" className="space-y-3 pt-2">
                                {cargandoCanastasDocente ? (
                                    Array.from({ length: 3 }).map((_, idx) => (
                                        <div key={idx} className="p-3 border border-slate-150 rounded-lg space-y-2 dark:border-slate-800">
                                            <Skeleton className="h-4 w-20" />
                                            <Skeleton className="h-3 w-40" />
                                        </div>
                                    ))
                                ) : solicitadosRecientes.length === 0 ? (
                                    <p className="text-center text-xs text-slate-400 py-6">No hay solicitudes pendientes.</p>
                                ) : (
                                    solicitadosRecientes.map((c) => (
                                        <div key={c.id} className="p-3 border border-slate-200 rounded-xl bg-slate-50/50 dark:border-slate-850 dark:bg-slate-950/40 space-y-2">
                                            <div className="flex justify-between items-center text-xs">
                                                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{c.codigo || c.id}</span>
                                                <span className="text-slate-400">{c.fechaPrestamo}</span>
                                            </div>
                                            <div className="text-xs text-slate-600 dark:text-slate-350">
                                                <strong>Estudiante:</strong> {c.estudiantes?.map(e => `${e.apellido}, ${e.nombre}`).join(' · ') || c.carnetEstudiante}
                                            </div>
                                            <div className="text-[11px] text-slate-500 dark:text-slate-400">
                                                <strong>Contenido:</strong>{' '}
                                                {c.cosas && c.cosas.length > 0 && `Activos: ${c.cosas.map(i => i.nombre).join(', ')}`}
                                                {c.consumibles && c.consumibles.length > 0 && ` Fungibles: ${c.consumibles.map(pc => pc.material).join(', ')}`}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </TabsContent>

                            <TabsContent value="despachados" className="space-y-3 pt-2">
                                {cargandoCanastasDocente ? (
                                    Array.from({ length: 3 }).map((_, idx) => (
                                        <div key={idx} className="p-3 border border-slate-150 rounded-lg space-y-2 dark:border-slate-800">
                                            <Skeleton className="h-4 w-20" />
                                            <Skeleton className="h-3 w-40" />
                                        </div>
                                    ))
                                ) : despachadosRecientes.length === 0 ? (
                                    <p className="text-center text-xs text-slate-400 py-6">No hay préstamos despachados activos.</p>
                                ) : (
                                    despachadosRecientes.map((c) => (
                                        <div key={c.id} className="p-3 border border-slate-200 rounded-xl bg-slate-50/50 dark:border-slate-850 dark:bg-slate-955/40 space-y-2">
                                            <div className="flex justify-between items-center text-xs">
                                                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{c.codigo || c.id}</span>
                                                <span className="text-slate-400">Límite: {c.fechaDevolucion || '—'}</span>
                                            </div>
                                            <div className="text-xs text-slate-600 dark:text-slate-350">
                                                <strong>Estudiante:</strong> {c.estudiantes?.map(e => `${e.apellido}, ${e.nombre}`).join(' · ') || c.carnetEstudiante}
                                            </div>
                                            <div className="text-[11px] text-slate-500 dark:text-slate-400">
                                                <strong>Contenido:</strong>{' '}
                                                {c.cosas && c.cosas.length > 0 && `Activos: ${c.cosas.map(i => i.nombre).join(', ')}`}
                                                {c.consumibles && c.consumibles.length > 0 && ` Fungibles: ${c.consumibles.map(pc => pc.material).join(', ')}`}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </TabsContent>

                            <TabsContent value="devueltos" className="space-y-3 pt-2">
                                {cargandoCanastasDocente ? (
                                    Array.from({ length: 3 }).map((_, idx) => (
                                        <div key={idx} className="p-3 border border-slate-150 rounded-lg space-y-2 dark:border-slate-800">
                                            <Skeleton className="h-4 w-20" />
                                            <Skeleton className="h-3 w-40" />
                                        </div>
                                    ))
                                ) : devueltosRecientes.length === 0 ? (
                                    <p className="text-center text-xs text-slate-400 py-6">No hay préstamos devueltos recientemente.</p>
                                ) : (
                                    devueltosRecientes.map((c) => (
                                        <div key={c.id} className="p-3 border border-slate-200 rounded-xl bg-slate-50/50 dark:border-slate-850 dark:bg-slate-955/40 space-y-2">
                                            <div className="flex justify-between items-center text-xs">
                                                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{c.codigo || c.id}</span>
                                                <span className="text-slate-400">Retorno: {c.fechaDevolucion || '—'}</span>
                                            </div>
                                            <div className="text-xs text-slate-600 dark:text-slate-355">
                                                <strong>Estudiante:</strong> {c.estudiantes?.map(e => `${e.apellido}, ${e.nombre}`).join(' · ') || c.carnetEstudiante}
                                            </div>
                                            <div className="text-[11px] text-slate-500 dark:text-slate-400">
                                                <strong>Contenido:</strong>{' '}
                                                {c.cosas && c.cosas.length > 0 && `Activos: ${c.cosas.map(i => i.nombre).join(', ')}`}
                                                {c.consumibles && c.consumibles.length > 0 && ` Fungibles: ${c.consumibles.map(pc => pc.material).join(', ')}`}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </TabsContent>
                        </Tabs>
                    </div>
                </div>
            ) : (
                <div className="space-y-5">
                    <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-5 shadow-sm dark:border-blue-900/50 dark:bg-blue-900/10 flex flex-col gap-3">
                        <div className="flex items-center gap-2">
                            <h2 className="text-xs font-bold text-blue-800 dark:text-blue-300 uppercase tracking-wider flex items-center gap-1.5">
                                <Activity className="h-4 w-4" /> Valor Total del Inventario
                            </h2>
                            {!cargando && (
                                <button
                                    onClick={() => setMostrarValorTotal(!mostrarValorTotal)}
                                    className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200 focus:outline-none transition-colors"
                                >
                                    {mostrarValorTotal ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                                </button>
                            )}
                        </div>
                        {cargando ? (
                            <Skeleton className="h-6 w-32" />
                        ) : (
                            <span 
                                onClick={() => setMostrarValorTotal(!mostrarValorTotal)}
                                className={`text-xl font-black text-blue-900 dark:text-blue-100 tracking-tight transition-all duration-300 cursor-pointer ${!mostrarValorTotal ? 'blur-sm select-none' : ''}`}
                            >
                                Bs. {valorTotalBob.toLocaleString('es-BO', { minimumFractionDigits: 2 })}
                            </span>
                        )}
                        {!cargando && mostrarValorTotal && (
                            <p className="text-[11px] text-blue-600/70 dark:text-blue-400/70">
                                Activos: {valorActivosBob.toLocaleString('es-BO', { minimumFractionDigits: 2 })} Bs. <br />
                                Materiales: {valorMaterialesBob.toLocaleString('es-BO', { minimumFractionDigits: 2 })} Bs.
                            </p>
                        )}
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                            <TarjetaMetrica titulo="Total Activos Fijos" valor={totalHerramientas} Icono={Wrench} colorBase="blue" cargando={cargando} />
                            <div className="mt-3 flex items-center text-xs">
                                {cargando ? (
                                    <Skeleton className="h-4 w-24" />
                                ) : herramientasAlerta > 0 ? (
                                    <span className="flex items-center text-amber-600 dark:text-amber-500 font-medium">
                                        <AlertTriangle className="mr-1 h-3.5 w-3.5" />
                                        {herramientasAlerta} requieren atención
                                    </span>
                                ) : (
                                    <span className="text-emerald-600 dark:text-emerald-500 font-medium">Todo en orden</span>
                                )}
                            </div>
                        </div>

                        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                            <TarjetaMetrica titulo="Préstamos Activos" valor={prestamosActivos} Icono={ClipboardList} colorBase="indigo" cargando={cargando} />
                            <div className="mt-3 grid gap-1 text-xs">
                                {cargando ? (
                                    <Skeleton className="h-4 w-24" />
                                ) : (
                                    <>
                                        <div className="flex items-center justify-between text-slate-500">
                                            <span>Vencidos</span>
                                            <span className={prestamosVencidos > 0 ? 'font-semibold text-red-600 dark:text-red-500' : 'font-semibold text-slate-600 dark:text-slate-355'}>
                                                {prestamosVencidos}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between text-slate-500">
                                            <span>Por vencer ({DIAS_POR_VENCER} días)</span>
                                            <span className={prestamosPorVencer > 0 ? 'font-semibold text-amber-600 dark:text-amber-500' : 'font-semibold text-slate-600'}>
                                                {prestamosPorVencer}
                                            </span>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                            <TarjetaMetrica titulo="Tipos de Materiales" valor={materiales.length} Icono={Package} colorBase="emerald" cargando={cargando} />
                            <div className="mt-3 flex items-center text-xs">
                                {cargando ? (
                                    <Skeleton className="h-4 w-24" />
                                ) : materialBajoStock > 0 ? (
                                    <span className="flex items-center text-red-600 dark:text-red-500 font-medium">
                                        <AlertTriangle className="mr-1 h-3.5 w-3.5" />
                                        {materialBajoStock} bajo stock mínimo
                                    </span>
                                ) : (
                                    <span className="text-emerald-600 dark:text-emerald-500 font-medium">Stock suficiente</span>
                                )}
                            </div>
                        </div>

                        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                            <TarjetaMetrica titulo="Estudiantes" valor={totalEstudiantes} Icono={GraduationCap} colorBase="amber" cargando={cargando} />
                            <div className="mt-3 text-xs text-slate-500">
                                {cargando ? <Skeleton className="h-4 w-24" /> : <span>Registrados en el sistema</span>}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 flex items-center mb-3">
                                <Activity className="mr-2 h-4 w-4 text-blue-500" />
                                Estado del Inventario
                            </h3>
                            {cargando ? (
                                <Skeleton className="h-16 w-full" />
                            ) : (
                                <div className="space-y-3">
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
                            )}
                        </div>

                        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 flex flex-col items-center justify-center text-center">
                            <div className="flex h-12 w-12 mb-3 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                                <ClipboardList className="h-6 w-6 text-slate-400" />
                            </div>
                            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-2">Próximos Vencimientos</h3>
                            {cargando ? (
                                <Skeleton className="h-8 w-24" />
                            ) : (
                                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs leading-relaxed">
                                    {prestamosVencidos > 0
                                        ? `Tienes ${prestamosVencidos} préstamo(s) vencido(s).`
                                        : prestamosPorVencer > 0
                                            ? `Tienes ${prestamosPorVencer} préstamo(s) por vencer en los próximos ${DIAS_POR_VENCER} días.`
                                            : "No hay vencimientos inmediatos."}
                                </p>
                            )}
                            <button onClick={() => onNavegar('prestamos')} className="mt-3 rounded-md bg-blue-50 px-4 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition-colors dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50">
                                Ver préstamos
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </LayoutPagina>
    );

    if (esAdministrador) {
        return renderResumen('Inicio administrador', 'Supervisión de usuarios y registros académicos');
    }

    if (esDocente) {
        return renderResumen('Inicio Docente', 'Supervisión de clases, estudiantes y préstamos');
    }

    return renderResumen('Resumen General', 'Vista general del sistema de laboratorios', herramientasAlerta + prestamosVencidos + materialBajoStock);
};
