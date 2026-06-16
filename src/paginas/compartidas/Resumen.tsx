import { useEffect, useMemo, useState } from 'react';
import { Wrench, AlertTriangle, ClipboardList, GraduationCap, Package, Activity, Users, Clock, CheckCircle2, Play, Eye, EyeOff } from 'lucide-react';
import type { PropsPaginaBase } from '@/tipos/paginas';
import { LayoutPagina } from '@/componentes/layout/layout-pagina';
import { TarjetaMetrica } from '@/componentes/ui/tarjeta-metrica';
import { PanelRegistroEstudiante } from '@/componentes/paginas/configuracion/panel-registro-estudiante';
import { PanelRegistroDocente } from '@/componentes/paginas/configuracion/panel-registro-docente';
import { useInventario } from '@/contextos/ContextoInventario';
import { Skeleton } from '@/componentes/ui/skeleton';
import { obtenerUsuarioActual } from '@/lib/servicio-autenticacion';
import { listarUsuarios } from '@/lib/servicio-administrador';
import { normalizarEstadoItem } from '@/utilidades/estados-activo';
import { cargarCanastasPrestamoDesdeBackend } from '@/lib/servicio-prestamos';
import type { PrestamoCanastaRegistro } from '@/tipos/inventario';

export const Resumen = ({ onNavegar, onCerrarSesion }: PropsPaginaBase) => {
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
                <div className="space-y-6">
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                        <TarjetaMetrica titulo="Usuarios del sistema" valor={totalUsuarios} Icono={Users} colorBase="blue" cargando={cargando} />
                        <TarjetaMetrica titulo="Estudiantes" valor={estudiantes.length} Icono={GraduationCap} colorBase="amber" cargando={cargando} />
                        <TarjetaMetrica titulo="Docentes" valor={docentes.length} Icono={Users} colorBase="emerald" cargando={cargando} />
                    </div>

                    <div className="grid gap-6 lg:grid-cols-2">
                        <PanelRegistroDocente />
                        <PanelRegistroEstudiante />
                    </div>
                </div>
            ) : esDocente ? (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
                        <TarjetaMetrica
                            titulo="Préstamos Solicitados"
                            valor={canastasDocenteSolicitadas.length}
                            Icono={Clock}
                            colorBase="amber"
                            cargando={cargandoCanastasDocente}
                        />
                        <TarjetaMetrica
                            titulo="Préstamos Despachados"
                            valor={canastasDocenteDespachadas.length}
                            Icono={Play}
                            colorBase="blue"
                            cargando={cargandoCanastasDocente}
                        />
                        <TarjetaMetrica
                            titulo="Préstamos Devueltos"
                            valor={canastasDocenteDevueltas.length}
                            Icono={CheckCircle2}
                            colorBase="emerald"
                            cargando={cargandoCanastasDocente}
                        />
                        <TarjetaMetrica
                            titulo="Estudiantes Involucrados"
                            valor={totalEstudiantesDocente}
                            Icono={GraduationCap}
                            colorBase="indigo"
                            cargando={cargandoCanastasDocente}
                        />
                    </div>
                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 flex flex-col h-[480px]">
                            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-4 shrink-0">
                                <Clock className="h-4 w-4 text-amber-500" />
                                Solicitados Recientes
                                <span className="text-xs font-normal text-slate-400">({canastasDocenteSolicitadas.length} en total)</span>
                            </h3>
                            <div className="flex-1 overflow-y-auto pr-1 space-y-3">
                                {cargandoCanastasDocente ? (
                                    Array.from({ length: 3 }).map((_, idx) => (
                                        <div key={idx} className="p-3 border border-slate-150 rounded-lg space-y-2 dark:border-slate-800">
                                            <Skeleton className="h-4 w-20" />
                                            <Skeleton className="h-3 w-40" />
                                            <Skeleton className="h-3.5 w-full" />
                                        </div>
                                    ))
                                ) : solicitadosRecientes.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-full text-center text-xs text-slate-400 py-10">
                                        No hay solicitudes pendientes.
                                    </div>
                                ) : (
                                    solicitadosRecientes.map((c) => (
                                        <div key={c.id} className="p-3 border border-slate-200 rounded-xl bg-slate-50/50 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950/40 dark:hover:bg-slate-950/80 transition-colors space-y-2">
                                            <div className="flex justify-between items-center">
                                                <span className="font-mono font-bold text-xs text-slate-800 dark:text-slate-200">
                                                    {c.codigo || c.id}
                                                </span>
                                                <span className="text-[10px] text-slate-450 dark:text-slate-500">
                                                    {c.fechaPrestamo}
                                                </span>
                                            </div>
                                            <div className="text-xs text-slate-650 dark:text-slate-300">
                                                <strong className="font-semibold text-slate-800 dark:text-slate-200">Estudiante(s):</strong>{' '}
                                                {c.estudiantes?.map(e => `${e.apellido}, ${e.nombre}`).join(' · ') || c.carnetEstudiante}
                                            </div>
                                            <div className="text-[11px] text-slate-500 dark:text-slate-400 max-h-[40px] overflow-hidden text-ellipsis">
                                                <strong className="font-semibold text-slate-600 dark:text-slate-350">Contenido:</strong>{' '}
                                                {c.cosas && c.cosas.length > 0 && `Activos: ${c.cosas.map(i => i.nombre).join(', ')}`}
                                                {c.consumibles && c.consumibles.length > 0 && ` Fungibles: ${c.consumibles.map(pc => pc.material).join(', ')}`}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 flex flex-col h-[480px]">
                            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-4 shrink-0">
                                <Play className="h-4 w-4 text-blue-500" />
                                Despachados Recientes
                                <span className="text-xs font-normal text-slate-400">({canastasDocenteDespachadas.length} en total)</span>
                            </h3>
                            <div className="flex-1 overflow-y-auto pr-1 space-y-3">
                                {cargandoCanastasDocente ? (
                                    Array.from({ length: 3 }).map((_, idx) => (
                                        <div key={idx} className="p-3 border border-slate-150 rounded-lg space-y-2 dark:border-slate-800">
                                            <Skeleton className="h-4 w-20" />
                                            <Skeleton className="h-3 w-40" />
                                            <Skeleton className="h-3.5 w-full" />
                                        </div>
                                    ))
                                ) : despachadosRecientes.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-full text-center text-xs text-slate-400 py-10">
                                        No hay préstamos despachados activos.
                                    </div>
                                ) : (
                                    despachadosRecientes.map((c) => (
                                        <div key={c.id} className="p-3 border border-slate-200 rounded-xl bg-slate-50/50 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-955/40 dark:hover:bg-slate-950/80 transition-colors space-y-2">
                                            <div className="flex justify-between items-center">
                                                <span className="font-mono font-bold text-xs text-slate-800 dark:text-slate-200">
                                                    {c.codigo || c.id}
                                                </span>
                                                <span className="text-[10px] text-slate-450 dark:text-slate-500">
                                                    Límite: {c.fechaDevolucion || '—'}
                                                </span>
                                            </div>
                                            <div className="text-xs text-slate-650 dark:text-slate-300">
                                                <strong className="font-semibold text-slate-800 dark:text-slate-200">Estudiante(s):</strong>{' '}
                                                {c.estudiantes?.map(e => `${e.apellido}, ${e.nombre}`).join(' · ') || c.carnetEstudiante}
                                            </div>
                                            <div className="text-[11px] text-slate-500 dark:text-slate-400 max-h-[40px] overflow-hidden text-ellipsis">
                                                <strong className="font-semibold text-slate-600 dark:text-slate-350">Contenido:</strong>{' '}
                                                {c.cosas && c.cosas.length > 0 && `Activos: ${c.cosas.map(i => i.nombre).join(', ')}`}
                                                {c.consumibles && c.consumibles.length > 0 && ` Fungibles: ${c.consumibles.map(pc => pc.material).join(', ')}`}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 flex flex-col h-[480px]">
                            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-4 shrink-0">
                                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                Devueltos Recientes
                                <span className="text-xs font-normal text-slate-400">({canastasDocenteDevueltas.length} en total)</span>
                            </h3>
                            <div className="flex-1 overflow-y-auto pr-1 space-y-3">
                                {cargandoCanastasDocente ? (
                                    Array.from({ length: 3 }).map((_, idx) => (
                                        <div key={idx} className="p-3 border border-slate-150 rounded-lg space-y-2 dark:border-slate-800">
                                            <Skeleton className="h-4 w-20" />
                                            <Skeleton className="h-3 w-40" />
                                            <Skeleton className="h-3.5 w-full" />
                                        </div>
                                    ))
                                ) : devueltosRecientes.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-full text-center text-xs text-slate-400 py-10">
                                        No hay préstamos devueltos recientemente.
                                    </div>
                                ) : (
                                    devueltosRecientes.map((c) => (
                                        <div key={c.id} className="p-3 border border-slate-200 rounded-xl bg-slate-50/50 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-955/40 dark:hover:bg-slate-950/80 transition-colors space-y-2">
                                            <div className="flex justify-between items-center">
                                                <span className="font-mono font-bold text-xs text-slate-800 dark:text-slate-200">
                                                    {c.codigo || c.id}
                                                </span>
                                                <span className="text-[10px] text-slate-450 dark:text-slate-500">
                                                    Retorno: {c.fechaDevolucion || '—'}
                                                </span>
                                            </div>
                                            <div className="text-xs text-slate-650 dark:text-slate-300">
                                                <strong className="font-semibold text-slate-800 dark:text-slate-200">Estudiante(s):</strong>{' '}
                                                {c.estudiantes?.map(e => `${e.apellido}, ${e.nombre}`).join(' · ') || c.carnetEstudiante}
                                            </div>
                                            <div className="text-[11px] text-slate-500 dark:text-slate-400 max-h-[40px] overflow-hidden text-ellipsis">
                                                <strong className="font-semibold text-slate-600 dark:text-slate-350">Contenido:</strong>{' '}
                                                {c.cosas && c.cosas.length > 0 && `Activos: ${c.cosas.map(i => i.nombre).join(', ')}`}
                                                {c.consumibles && c.consumibles.length > 0 && ` Fungibles: ${c.consumibles.map(pc => pc.material).join(', ')}`}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="space-y-6">
                    <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-6 shadow-sm dark:border-blue-900/50 dark:bg-blue-900/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <h2 className="text-sm font-bold text-blue-800 dark:text-blue-300 uppercase tracking-wider flex items-center gap-1.5">
                                    <Activity className="h-4 w-4" /> Valor Total del Inventario
                                </h2>
                                {!cargando && (
                                    <button
                                        onClick={() => setMostrarValorTotal(!mostrarValorTotal)}
                                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200 focus:outline-none transition-colors"
                                        title={mostrarValorTotal ? "Ocultar valor" : "Mostrar valor"}
                                    >
                                        {mostrarValorTotal ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                )}
                            </div>
                            {cargando ? (
                                <Skeleton className="h-4 w-64 mt-1" />
                            ) : (
                                <p
                                    onClick={() => setMostrarValorTotal(!mostrarValorTotal)}
                                    className={`text-xs text-blue-600/80 dark:text-blue-400/80 transition-all duration-300 cursor-pointer ${!mostrarValorTotal ? 'blur-sm select-none' : ''}`}
                                    title={!mostrarValorTotal ? "Hacer clic para mostrar" : "Hacer clic para ocultar"}
                                >
                                    ({valorActivosBob.toLocaleString('es-BO', { minimumFractionDigits: 2 })} Bs. en Activos + {valorMaterialesBob.toLocaleString('es-BO', { minimumFractionDigits: 2 })} Bs. en Materiales)
                                </p>
                            )}
                        </div>
                        <div className="flex flex-col items-end text-right">
                            {cargando ? (
                                <Skeleton className="h-8 w-48" />
                            ) : (
                                <span
                                    onClick={() => setMostrarValorTotal(!mostrarValorTotal)}
                                    className={`text-2xl font-black text-blue-900 dark:text-blue-100 tracking-tight transition-all duration-300 cursor-pointer ${!mostrarValorTotal ? 'blur-sm select-none' : ''}`}
                                    title={!mostrarValorTotal ? "Hacer clic para mostrar" : "Hacer clic para ocultar"}
                                >
                                    Bs. {valorTotalBob.toLocaleString('es-BO', { minimumFractionDigits: 2 })}
                                </span>
                            )}
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                            <TarjetaMetrica titulo="Total Activos Fijos" valor={totalHerramientas} Icono={Wrench} colorBase="blue" cargando={cargando} />
                            <div className="mt-4 flex items-center text-xs">
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
                        <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                            <TarjetaMetrica titulo="Préstamos Activos" valor={prestamosActivos} Icono={ClipboardList} colorBase="indigo" cargando={cargando} />
                            <div className="mt-4 grid gap-1 text-xs">
                                {cargando ? (
                                    <div className="space-y-1 w-full">
                                        <Skeleton className="h-3.5 w-full" />
                                        <Skeleton className="h-3.5 w-full" />
                                    </div>
                                ) : (
                                    <>
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
                                    </>
                                )}
                            </div>
                        </div>
                        <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                            <TarjetaMetrica titulo="Tipos de Materiales" valor={materiales.length} Icono={Package} colorBase="emerald" cargando={cargando} />
                            <div className="mt-4 flex items-center text-xs">
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
                        <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                            <TarjetaMetrica titulo="Estudiantes" valor={totalEstudiantes} Icono={GraduationCap} colorBase="amber" cargando={cargando} />
                            <div className="mt-4 flex items-center text-xs">
                                {cargando ? (
                                    <Skeleton className="h-4 w-32" />
                                ) : (
                                    <span className="text-slate-500 dark:text-slate-400">Registrados en el sistema</span>
                                )}
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
                            {cargando ? (
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Skeleton className="h-3.5 w-24" />
                                        <Skeleton className="h-2 w-full rounded-full" />
                                    </div>
                                    <div className="space-y-2">
                                        <Skeleton className="h-3.5 w-24" />
                                        <Skeleton className="h-2 w-full rounded-full" />
                                    </div>
                                    <div className="space-y-2">
                                        <Skeleton className="h-3.5 w-24" />
                                        <Skeleton className="h-2 w-full rounded-full" />
                                    </div>
                                </div>
                            ) : (
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
                            )}
                        </div>

                        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 flex flex-col items-center justify-center text-center">
                            <div className="flex h-16 w-16 mb-4 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                                <ClipboardList className="h-8 w-8 text-slate-400" />
                            </div>
                            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-2">Próximos Vencimientos</h3>
                            {cargando ? (
                                <div className="space-y-1.5 w-full flex flex-col items-center">
                                    <Skeleton className="h-3.5 w-48" />
                                    <Skeleton className="h-3.5 w-40" />
                                </div>
                            ) : (
                                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs leading-relaxed">
                                    {prestamosVencidos > 0
                                        ? `Tienes ${prestamosVencidos} préstamo(s) vencido(s). Revisa Préstamos para ver el detalle y regularizar devoluciones.`
                                        : prestamosPorVencer > 0
                                            ? `Tienes ${prestamosPorVencer} préstamo(s) por vencer en los próximos ${DIAS_POR_VENCER} días.`
                                            : prestamosActivos > 0
                                                ? `Actualmente tienes ${prestamosActivos} préstamo(s) activo(s). Revisa la pestaña de Préstamos para ver fechas de devolución.`
                                                : "No hay préstamos activos en este momento."}
                                </p>
                            )}
                            <button onClick={() => onNavegar('prestamos')} className="mt-4 rounded-md bg-blue-50 px-4 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition-colors dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50">
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

