import { type ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import {
    Bell,
    AlertTriangle,
    LayoutDashboard,
    GraduationCap,
    BookOpen,
    Layers,
    Users,
    Shield,
    Archive,
    Settings,
    Wrench,
    Package,
    ClipboardList,
    IdCard,
    RefreshCw,
    type LucideIcon,
} from 'lucide-react';
import { useInventario } from '@/contextos/ContextoInventario';
import { formatearFechaHora } from '@/utilidades/fechas';
import { obtenerUsuarioActual } from '@/lib/servicio-autenticacion';
import type { PaginaApp } from '@/tipos/navegacion';

const ICONOS_PAGINA: Record<PaginaApp, LucideIcon> = {
    login: Shield,
    resumen: LayoutDashboard,
    'mi-perfil': IdCard,
    'mis-estudiantes': GraduationCap,
    'mis-materias': BookOpen,
    carreras: GraduationCap,
    materias: BookOpen,
    'grupos-materia': Layers,
    activos: Wrench,
    contenedores: Archive,
    prestamos: ClipboardList,
    estudiantes: GraduationCap,
    docentes: Users,
    material: Package,
    auditoria: Shield,
    inventarios: Archive,
    usuarios: Users,
    configuracion: Settings,
};

interface Props {
    paginaActiva?: PaginaApp;
    titulo: string;
    subtitulo: string;
    alertas?: number;
    cantidad?: number;
    accionInicio?: ReactNode;
    onRecargar?: () => void;
    recargando?: boolean;
}

export const BarraSuperior = ({ paginaActiva, titulo, subtitulo, alertas = 0, cantidad, accionInicio, onRecargar, recargando }: Props) => (
    <BarraSuperiorContenido
        paginaActiva={paginaActiva}
        titulo={titulo}
        subtitulo={subtitulo}
        alertas={alertas}
        cantidad={cantidad}
        accionInicio={accionInicio}
        onRecargar={onRecargar}
        recargando={recargando}
    />
);

const parseFecha = (valor?: string | null) => {
    if (!valor) return null;
    const texto = String(valor);
    const normalizado = texto.includes('T') ? texto : texto.replace(' ', 'T');
    const fecha = new Date(normalizado);
    return Number.isNaN(fecha.getTime()) ? null : fecha;
};

const BarraSuperiorContenido = ({ paginaActiva, titulo, subtitulo: _subtitulo, alertas: _alertas = 0, cantidad: _cantidad, accionInicio, onRecargar, recargando }: Props) => {
    const {
        prestamos,
        estudiantes,
        herramientas,
    } = useInventario();
    const esAdministrador = obtenerUsuarioActual()?.rol === 'administrador';
    const [abierto, setAbierto] = useState(false);
    const panelRef = useRef<HTMLDivElement | null>(null);

    const prestamosExpirados = useMemo(() => {
        const ahora = Date.now();
        return prestamos.filter((p) => {
            if (p.estado === 'devuelto' || p.estado === 'devuelto_fuera_de_fecha_limite') return false;
            if (p.estado === 'vencido') return true;
            const fechaDevolucion = parseFecha(p.fechaDevolucion);
            return !!fechaDevolucion && fechaDevolucion.getTime() < ahora;
        });
    }, [prestamos]);

    const totalAlertas = prestamosExpirados.length;

    useEffect(() => {
        const onClickFuera = (event: MouseEvent) => {
            if (!panelRef.current) return;
            if (!panelRef.current.contains(event.target as Node)) {
                setAbierto(false);
            }
        };

        if (abierto) {
            document.addEventListener('mousedown', onClickFuera);
        }

        return () => {
            document.removeEventListener('mousedown', onClickFuera);
        };
    }, [abierto]);


    const Icono = paginaActiva ? ICONOS_PAGINA[paginaActiva] : undefined;

    return (
        <header className="flex h-16 flex-shrink-0 items-center justify-between border-b border-slate-200 bg-white px-6 dark:border-slate-800 dark:bg-slate-950">
            <div className="flex items-center gap-4">
                {accionInicio}
                <div className="flex items-center gap-3">
                    {Icono && (
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-50 text-slate-500 border border-slate-100 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800 shadow-sm transition-all duration-300 hover:scale-105">
                            <Icono className="h-4.5 w-4.5" />
                        </div>
                    )}
                    <div className="flex items-center gap-2">
                        <h1 className="text-base font-bold text-slate-800 dark:text-slate-100 sm:text-lg">{titulo}</h1>
                    </div>
                </div>
            </div>
            <div className="flex items-center gap-3">
                {onRecargar && (
                    <button
                        title="Recargar datos"
                        onClick={onRecargar}
                        disabled={recargando}
                        className="rounded-md p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-300 disabled:opacity-50"
                    >
                        <RefreshCw className={`h-[18px] w-[18px] ${recargando ? 'animate-spin' : ''}`} />
                    </button>
                )}
                {!esAdministrador && (
                    <div className="relative flex items-center gap-3" ref={panelRef}>
                        <button
                            title="Notificaciones de préstamos"
                            onClick={() => setAbierto((v) => !v)}
                            className="relative rounded-md p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-300"
                        >
                            <Bell className="h-[18px] w-[18px]" />
                            {totalAlertas > 0 && (
                                <>
                                    <span className="absolute right-0.5 top-0.5 flex h-2 w-2 rounded-full bg-red-500" />
                                    <span className="absolute -right-1 -top-1 inline-flex min-w-[16px] items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">
                                        {totalAlertas > 99 ? '99+' : totalAlertas}
                                    </span>
                                </>
                            )}
                        </button>

                        {abierto && (
                            <div className="absolute right-0 top-11 z-50 w-[360px] rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900 animate-in slide-in-from-top-2 fade-in-0 duration-150">
                                <div className="border-b border-slate-200 px-4 py-2.5 dark:border-slate-700">
                                    <p className="text-[12px] font-bold uppercase tracking-wide text-slate-700 dark:text-slate-200">
                                        Préstamos expirados
                                    </p>
                                    <p className="text-[12px] text-slate-500 dark:text-slate-400">
                                        {prestamosExpirados.length} préstamo(s) con fecha de devolución expirada
                                    </p>
                                </div>
                                <div className="max-h-72 overflow-y-auto p-2">
                                    {prestamosExpirados.length === 0 && (
                                        <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-[12px] text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
                                            No hay préstamos expirados.
                                        </div>
                                    )}

                                    {prestamosExpirados.map((p) => {
                                        const est = estudiantes.find((e) => e.carnet === p.carnetEstudiante);
                                        const herr = herramientas.find((h) => h.id === p.idHerramienta);
                                        return (
                                            <div key={p.id} className="mb-2 rounded-md border border-red-200 bg-red-50 p-2.5 last:mb-0 dark:border-red-800 dark:bg-red-950/30">
                                                <div className="mb-1 flex items-center gap-1.5 text-[11px] font-bold text-red-700 dark:text-red-300">
                                                    <AlertTriangle className="h-3.5 w-3.5" />
                                                    Vencido
                                                </div>
                                                <p className="text-[13px] font-semibold text-slate-800 dark:text-slate-100">#{p.id} · {est ? `${est.nombre} ${est.apellido}` : p.carnetEstudiante}</p>
                                                <p className="text-[12px] text-slate-600 dark:text-slate-300">Activo: {herr?.nombre ?? p.idHerramienta}</p>
                                                <p className="text-[12px] text-slate-600 dark:text-slate-300">Vencimiento: {p.fechaDevolucion ? formatearFechaHora(p.fechaDevolucion) : 'Sin fecha registrada'}</p>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </header>
    );
};
