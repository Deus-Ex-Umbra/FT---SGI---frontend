import { LayoutPagina } from '@/componentes/layout/layout-pagina';
import { Boton } from '@/componentes/ui/button';
import type { PropsPaginaBase } from '@/tipos/paginas';
import {
    AlertOctagon,
    ArrowRight,
    BookMarked,
    Calendar,
    GraduationCap,
    IdCard,
    Landmark,
    UserRound,
    BadgeCheck,
    CircleAlert
} from 'lucide-react';
import { useDashboardEstudiante } from './use-dashboard-estudiante';

export const Resumen = ({ onNavegar, onCerrarSesion }: PropsPaginaBase) => {
    const { cargando, error, datos, recargar } = useDashboardEstudiante(onCerrarSesion);

    if (cargando && !datos) {
        return (
            <LayoutPagina paginaActiva="resumen" titulo="Mi Resumen" subtitulo="Cargando tus datos..." onNavegar={onNavegar} onCerrarSesion={onCerrarSesion}>
                <div className="flex h-40 items-center justify-center">
                    <p className="text-sm text-slate-500 dark:text-slate-400 animate-pulse">Obteniendo información...</p>
                </div>
            </LayoutPagina>
        );
    }

    if (error || !datos) {
        return (
            <LayoutPagina paginaActiva="resumen" titulo="Mi Resumen" subtitulo="Información académica y de préstamos" onNavegar={onNavegar} onCerrarSesion={onCerrarSesion} onRecargar={recargar} recargando={cargando}>
                <div className="rounded-xl border border-red-200 bg-red-50 p-6 dark:border-red-900/40 dark:bg-red-900/10">
                    <p className="text-sm font-medium text-red-800 dark:text-red-400">No se pudo cargar el resumen.</p>
                    <p className="mt-1 text-sm text-red-600 dark:text-red-300">{error}</p>
                </div>
            </LayoutPagina>
        );
    }

    const { perfil, materias } = datos;
    const prestamos = datos.prestamosResumen ?? [];
    const prestamosActivos = prestamos.filter(p => ['activo', 'pendiente', 'vencido'].includes(p.estado));
    const prestamosVencidos = prestamosActivos.filter((prestamo) => prestamo.estado === 'vencido').length;
    const asignacionesCarrera = perfil.asignacionesCarrera ?? [];
    const cusRetenidos = perfil.cusRetenidos ?? [];

    return (
        <LayoutPagina
            paginaActiva="resumen"
            titulo={`Hola, ${perfil.nombre}`}
            subtitulo="Consulta tus datos académicos, materias inscritas y estado de préstamos"
            onNavegar={onNavegar}
            onCerrarSesion={onCerrarSesion}
            onRecargar={recargar}
            recargando={cargando}
        >
            <div className="space-y-6">
                {perfil.carnetRetenido && (
                    <div className="flex items-start gap-4 rounded-xl border border-red-200 bg-red-50 p-5 shadow-sm dark:border-red-900/40 dark:bg-red-900/10">
                        <AlertOctagon className="h-6 w-6 text-red-600 mt-0.5 dark:text-red-500" />
                        <div>
                            <h3 className="text-sm font-semibold text-red-800 dark:text-red-400">
                                {cusRetenidos.length > 1 ? 'Uno o más CU retenidos' : 'CU retenido'}
                            </h3>
                            <p className="mt-1 text-sm text-red-600/90 dark:text-red-300/90">
                                {cusRetenidos.length > 0
                                    ? `Los siguientes CU aparecen retenidos: ${cusRetenidos.join(', ')}. Devuelve el material pendiente o comunícate con el encargado de gabinete.`
                                    : 'Tu carnet se encuentra retenido en el sistema. Asegúrate de devolver cualquier material o herramienta pendiente o comunícate con el encargado de gabinete.'}
                            </p>
                        </div>
                    </div>
                )}

                <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
                    <div className="space-y-6">
                        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                            <div className="flex items-start gap-4">
                                <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
                                    <UserRound className="h-6 w-6" />
                                </div>
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">Estudiante</p>
                                    <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">{perfil.nombre} {perfil.apellido}</h2>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{perfil.carrera}</p>
                                </div>
                            </div>

                            <dl className="mt-6 grid gap-4 sm:grid-cols-2">
                                <div className="rounded-lg border border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-950/40">
                                    <dt className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-450 dark:text-slate-500">
                                        <IdCard className="h-4 w-4 text-slate-400" /> C.I.
                                    </dt>
                                    <dd className="mt-1.5 text-base font-semibold text-slate-800 dark:text-slate-100">{perfil.carnet}</dd>
                                </div>
                                <div className="rounded-lg border border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-950/40">
                                    <dt className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-450 dark:text-slate-500">
                                        <BadgeCheck className="h-4 w-4 text-slate-400" /> C.U. principal
                                    </dt>
                                    <dd className="mt-1.5 text-base font-semibold text-slate-800 dark:text-slate-100">{perfil.cu || 'No registrado'}</dd>
                                </div>
                                <div className="rounded-lg border border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-950/40">
                                    <dt className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-450 dark:text-slate-500">
                                        <GraduationCap className="h-4 w-4 text-slate-400" /> Carrera principal
                                    </dt>
                                    <dd className="mt-1.5 text-base font-semibold text-slate-800 dark:text-slate-100">{perfil.carrera}</dd>
                                </div>
                                <div className="rounded-lg border border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-950/40">
                                    <dt className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-450 dark:text-slate-500">
                                        <Landmark className="h-4 w-4 text-slate-400" /> Estado del carnet
                                    </dt>
                                    <dd className={`mt-1.5 text-base font-semibold ${perfil.carnetRetenido ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                                        {perfil.carnetRetenido ? 'Retenido' : 'Habilitado'}
                                    </dd>
                                </div>
                            </dl>
                        </section>

                        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-250 mb-3">Asignaciones académicas</h3>
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[380px] text-left text-xs text-slate-600 dark:text-slate-355">
                                    <thead className="border-b border-slate-200 text-[10px] uppercase tracking-wider text-slate-400 dark:border-slate-800">
                                        <tr>
                                            <th className="pb-2 pr-4 font-semibold">Carrera</th>
                                            <th className="pb-2 px-4 font-semibold">C.U.</th>
                                            <th className="pb-2 pl-4 font-semibold text-right">Prefijo</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                                        {asignacionesCarrera.length > 0 ? asignacionesCarrera.map((asignacion, index) => (
                                            <tr key={`${asignacion.carrera}-${asignacion.cu}-${index}`} className="hover:bg-slate-50/30 dark:hover:bg-slate-950/20">
                                                <td className="py-2.5 pr-4 font-medium text-slate-800 dark:text-slate-200">{asignacion.carrera}</td>
                                                <td className="px-4 py-2.5 font-mono">{asignacion.cu}</td>
                                                <td className="py-2.5 pl-4 text-right font-mono text-slate-500">{asignacion.prefijoCu || '—'}</td>
                                            </tr>
                                        )) : (
                                            <tr>
                                                <td colSpan={3} className="py-6 text-center text-slate-400">No hay asignaciones de carrera registradas.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            <div className="mt-4 flex items-start gap-2.5 rounded-lg border border-amber-100 bg-amber-50/40 p-3 dark:border-amber-900/30 dark:bg-amber-950/20">
                                <CircleAlert className="h-4.5 w-4.5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                                <p className="text-[11px] text-amber-800 dark:text-amber-300 leading-tight">
                                    Si algún dato académico es incorrecto o falta alguna asignación, solicita la corrección al administrador o al encargado de gabinete.
                                </p>
                            </div>
                        </section>
                    </div>
                    <div className="space-y-4">
                        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between h-fit">
                            <div className="flex items-center gap-3">
                                <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400 shrink-0">
                                    <BookMarked className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">Materias inscritas</p>
                                    <p className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 mt-0.5">{materias.length}</p>
                                </div>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-4 leading-normal">
                                {materias.length === 0
                                    ? 'No estás inscrito en ninguna materia en este periodo.'
                                    : `Inscrito en ${materias.length} ${materias.length === 1 ? 'materia activa' : 'materias activas'}.`}
                            </p>
                            <Boton
                                type="button"
                                variant="outline"
                                className="mt-4 w-full text-sm font-semibold justify-between h-10 rounded-lg border-slate-200 dark:border-slate-800"
                                onClick={() => onNavegar('mis-materias')}
                            >
                                Mis Materias
                                <ArrowRight className="h-4 w-4" />
                            </Boton>
                        </div>
                        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between h-fit">
                            <div className="flex items-center gap-3">
                                <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400 shrink-0">
                                    <Calendar className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">Préstamos activos</p>
                                    <p className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 mt-0.5">{prestamosActivos.length}</p>
                                </div>
                            </div>
                            <div className="mt-4 text-xs">
                                {prestamosVencidos > 0 ? (
                                    <div className="flex items-center gap-1.5 text-red-600 dark:text-red-400 font-semibold">
                                        <AlertOctagon className="h-4 w-4 shrink-0" />
                                        <span>¡Tienes {prestamosVencidos} préstamo(s) vencido(s)!</span>
                                    </div>
                                ) : (
                                    <p className="text-slate-500 dark:text-slate-400 leading-normal">
                                        {prestamosActivos.length === 0
                                            ? 'No tienes préstamos pendientes de devolución.'
                                            : 'Tienes préstamos vigentes dentro de la fecha límite.'}
                                    </p>
                                )}
                            </div>
                            <Boton
                                type="button"
                                variant="outline"
                                className="mt-4 w-full text-sm font-semibold justify-between h-10 rounded-lg border-slate-200 dark:border-slate-800"
                                onClick={() => onNavegar('prestamos')}
                            >
                                Mis Préstamos
                                <ArrowRight className="h-4 w-4" />
                            </Boton>
                        </div>
                    </div>
                </div>
            </div>
        </LayoutPagina>
    );
};
