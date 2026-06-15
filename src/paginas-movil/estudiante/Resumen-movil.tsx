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
import { useDashboardEstudiante } from '@/paginas/estudiante/use-dashboard-estudiante';

export const ResumenEstudianteMovil = ({ onNavegar, onCerrarSesion }: PropsPaginaBase) => {
    const { cargando, error, datos } = useDashboardEstudiante(onCerrarSesion);

    if (cargando) {
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
            <LayoutPagina paginaActiva="resumen" titulo="Mi Resumen" subtitulo="Información académica y de préstamos" onNavegar={onNavegar} onCerrarSesion={onCerrarSesion}>
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
            subtitulo="Consulta tus datos académicos, materias y préstamos"
            onNavegar={onNavegar}
            onCerrarSesion={onCerrarSesion}
        >
            <div className="space-y-5">
                {perfil.carnetRetenido && (
                    <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 shadow-sm dark:border-red-900/40 dark:bg-red-900/10">
                        <AlertOctagon className="h-5 w-5 text-red-600 mt-0.5 dark:text-red-500 shrink-0" />
                        <div>
                            <h3 className="text-xs font-semibold text-red-800 dark:text-red-400">
                                {cusRetenidos.length > 1 ? 'CU Retenidos' : 'CU Retenido'}
                            </h3>
                            <p className="mt-1 text-xs text-red-600/90 dark:text-red-300/90">
                                {cusRetenidos.length > 0
                                    ? `Los siguientes CU aparecen retenidos: ${cusRetenidos.join(', ')}. Devuelve el material pendiente o contacta al encargado.`
                                    : 'Tu carnet se encuentra retenido en el sistema. Asegúrate de devolver cualquier material pendiente.'}
                            </p>
                        </div>
                    </div>
                )}

                <div className="grid gap-5 grid-cols-1">
                    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                        <div className="flex items-start gap-3">
                            <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
                                <UserRound className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">Estudiante</p>
                                <h2 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">{perfil.nombre} {perfil.apellido}</h2>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{perfil.carrera}</p>
                            </div>
                        </div>

                        <dl className="mt-5 grid gap-3 grid-cols-2">
                            <div className="rounded-lg border border-slate-100 bg-slate-50/50 p-3 dark:border-slate-800 dark:bg-slate-950/40">
                                <dt className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                                    <IdCard className="h-3.5 w-3.5 text-slate-400" /> C.I.
                                </dt>
                                <dd className="mt-1 text-sm font-semibold text-slate-800 dark:text-slate-100">{perfil.carnet}</dd>
                            </div>
                            <div className="rounded-lg border border-slate-100 bg-slate-50/50 p-3 dark:border-slate-800 dark:bg-slate-950/40">
                                <dt className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                                    <BadgeCheck className="h-3.5 w-3.5 text-slate-400" /> C.U. principal
                                </dt>
                                <dd className="mt-1 text-sm font-semibold text-slate-800 dark:text-slate-100">{perfil.cu || 'No registrado'}</dd>
                            </div>
                            <div className="rounded-lg border border-slate-100 bg-slate-50/50 p-3 dark:border-slate-800 dark:bg-slate-955/40 col-span-2">
                                <dt className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                                    <GraduationCap className="h-3.5 w-3.5 text-slate-400" /> Carrera
                                </dt>
                                <dd className="mt-1 text-xs font-semibold text-slate-800 dark:text-slate-100 truncate">{perfil.carrera}</dd>
                            </div>
                            <div className="rounded-lg border border-slate-100 bg-slate-50/50 p-3 dark:border-slate-800 dark:bg-slate-955/40 col-span-2">
                                <dt className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                                    <Landmark className="h-3.5 w-3.5 text-slate-400" /> Estado del carnet
                                </dt>
                                <dd className={`mt-1 text-xs font-semibold ${perfil.carnetRetenido ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                                    {perfil.carnetRetenido ? 'Retenido - Bloqueado' : 'Habilitado - Activo'}
                                </dd>
                            </div>
                        </dl>
                    </section>

                    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-250 mb-3">Asignaciones académicas</h3>
                        <div className="space-y-2">
                            {asignacionesCarrera.length > 0 ? asignacionesCarrera.map((asignacion, index) => (
                                <div key={`${asignacion.carrera}-${asignacion.cu}-${index}`} className="p-3 border border-slate-100 rounded-xl bg-slate-50/50 dark:border-slate-800 dark:bg-slate-955/40 space-y-1">
                                    <div className="flex justify-between items-start text-xs">
                                        <span className="font-semibold text-slate-800 dark:text-slate-200">{asignacion.carrera}</span>
                                        <span className="font-mono text-[10px] text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">{asignacion.prefijoCu || '—'}</span>
                                    </div>
                                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                                        C.U.: <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">{asignacion.cu}</span>
                                    </div>
                                </div>
                            )) : (
                                <p className="text-center text-xs text-slate-450 py-4">No hay asignaciones de carrera registradas.</p>
                            )}
                        </div>

                        <div className="mt-4 flex items-start gap-2.5 rounded-lg border border-amber-100 bg-amber-50/40 p-3 dark:border-amber-900/30 dark:bg-amber-950/20">
                            <CircleAlert className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                            <p className="text-[10.5px] text-amber-800 dark:text-amber-300 leading-tight">
                                Para corregir algún dato académico, solicita el cambio al administrador o al encargado de gabinete.
                            </p>
                        </div>
                    </section>

                    <div className="grid grid-cols-1 gap-4">
                        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between">
                            <div className="flex items-center gap-3">
                                <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400 shrink-0">
                                    <BookMarked className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">Materias inscritas</p>
                                    <p className="text-xl font-extrabold text-slate-800 dark:text-slate-100 mt-0.5">{materias.length}</p>
                                </div>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 leading-normal">
                                {materias.length === 0 
                                    ? 'No estás inscrito en materias este periodo.' 
                                    : `Inscrito en ${materias.length} ${materias.length === 1 ? 'materia activa' : 'materias activas'}.`}
                            </p>
                            <Boton 
                                type="button" 
                                variant="outline" 
                                className="mt-4 w-full text-xs font-semibold justify-between h-9 rounded-lg border-slate-200 dark:border-slate-800"
                                onClick={() => onNavegar('mis-materias')}
                            >
                                Gestionar mis materias
                                <ArrowRight className="h-4 w-4" />
                            </Boton>
                        </div>

                        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between">
                            <div className="flex items-center gap-3">
                                <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400 shrink-0">
                                    <Calendar className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">Préstamos activos</p>
                                    <p className="text-xl font-extrabold text-slate-800 dark:text-slate-100 mt-0.5">{prestamosActivos.length}</p>
                                </div>
                            </div>
                            <div className="mt-3 text-xs">
                                {prestamosVencidos > 0 ? (
                                    <div className="flex items-center gap-1.5 text-red-600 dark:text-red-400 font-semibold">
                                        <AlertOctagon className="h-4 w-4 shrink-0" />
                                        <span>¡Tienes {prestamosVencidos} préstamo(s) vencido(s)!</span>
                                    </div>
                                ) : (
                                    <p className="text-slate-500 dark:text-slate-400 leading-normal">
                                        {prestamosActivos.length === 0 
                                            ? 'Sin préstamos pendientes de devolución.' 
                                            : 'Tienes préstamos vigentes dentro del plazo.'}
                                    </p>
                                )}
                            </div>
                            <Boton 
                                type="button" 
                                variant="outline" 
                                className="mt-4 w-full text-xs font-semibold justify-between h-9 rounded-lg border-slate-200 dark:border-slate-800"
                                onClick={() => onNavegar('prestamos')}
                            >
                                Ver mis préstamos
                                <ArrowRight className="h-4 w-4" />
                            </Boton>
                        </div>
                    </div>
                </div>
            </div>
        </LayoutPagina>
    );
};
