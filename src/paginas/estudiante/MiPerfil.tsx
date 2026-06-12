import { LayoutPagina } from '@/componentes/layout/layout-pagina';
import type { PropsPaginaBase } from '@/tipos/paginas';
import { BadgeCheck, CircleAlert, GraduationCap, IdCard, Landmark, UserRound } from 'lucide-react';
import { useDashboardEstudiante } from './use-dashboard-estudiante';

export const MiPerfil = ({ onNavegar, onCerrarSesion }: PropsPaginaBase) => {
    const { cargando, error, datos } = useDashboardEstudiante(onCerrarSesion);

    if (cargando) {
        return (
            <LayoutPagina paginaActiva="mi-perfil" titulo="Mis datos" subtitulo="Cargando tu información personal..." onNavegar={onNavegar} onCerrarSesion={onCerrarSesion}>
                <div className="flex h-40 items-center justify-center">
                    <p className="animate-pulse text-sm text-slate-500 dark:text-slate-400">Obteniendo datos del estudiante...</p>
                </div>
            </LayoutPagina>
        );
    }

    if (error || !datos) {
        return (
            <LayoutPagina paginaActiva="mi-perfil" titulo="Mis datos" subtitulo="Información académica y personal" onNavegar={onNavegar} onCerrarSesion={onCerrarSesion}>
                <div className="rounded-xl border border-red-200 bg-red-50 p-6 dark:border-red-900/40 dark:bg-red-900/10">
                    <p className="text-sm font-medium text-red-800 dark:text-red-400">No se pudo cargar tu perfil.</p>
                    <p className="mt-1 text-sm text-red-600 dark:text-red-300">{error}</p>
                </div>
            </LayoutPagina>
        );
    }

    const { perfil } = datos;
    const asignacionesCarrera = perfil.asignacionesCarrera ?? [];
    const carreras = perfil.carreras ?? [perfil.carrera].filter(Boolean);
    const cus = perfil.cus ?? [perfil.cu].filter((valor): valor is string => Boolean(valor));
    const cusRetenidos = perfil.cusRetenidos ?? [];

    return (
        <LayoutPagina paginaActiva="mi-perfil" titulo="Mis datos" subtitulo="Consulta tu información académica registrada" onNavegar={onNavegar} onCerrarSesion={onCerrarSesion}>
            <div className="space-y-6">
                <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
                    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                        <div className="flex items-start gap-4">
                            <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
                                <UserRound className="h-7 w-7" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Estudiante</p>
                                <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">{perfil.nombre} {perfil.apellido}</h2>
                                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{perfil.carrera}</p>
                            </div>
                        </div>

                        <dl className="mt-6 grid gap-4 sm:grid-cols-2">
                            <div className="rounded-lg border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/40">
                                <dt className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                    <IdCard className="h-4 w-4" /> C.I.
                                </dt>
                                <dd className="mt-2 text-lg font-semibold text-slate-800 dark:text-slate-100">{perfil.carnet}</dd>
                            </div>
                            <div className="rounded-lg border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/40">
                                <dt className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                    <BadgeCheck className="h-4 w-4" /> C.U. principal
                                </dt>
                                <dd className="mt-2 text-lg font-semibold text-slate-800 dark:text-slate-100">{perfil.cu || 'No registrado'}</dd>
                            </div>
                            <div className="rounded-lg border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/40">
                                <dt className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                    <GraduationCap className="h-4 w-4" /> Carrera principal
                                </dt>
                                <dd className="mt-2 text-lg font-semibold text-slate-800 dark:text-slate-100">{perfil.carrera}</dd>
                            </div>
                            <div className="rounded-lg border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/40">
                                <dt className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                    <Landmark className="h-4 w-4" /> Estado del carnet
                                </dt>
                                <dd className={`mt-2 text-lg font-semibold ${perfil.carnetRetenido ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                                    {perfil.carnetRetenido ? 'Retenido' : 'Habilitado'}
                                </dd>
                            </div>
                        </dl>
                    </section>

                    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                        <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100">Resumen institucional</h3>
                        <div className="mt-5 space-y-4 text-sm text-slate-600 dark:text-slate-300">

                            <div>
                                <p className="text-slate-500 dark:text-slate-400">Carreras registradas</p>
                                <div className="mt-2 flex flex-wrap gap-2">
                                    {carreras.length > 0 ? carreras.map((carrera) => (
                                        <span key={carrera} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">{carrera}</span>
                                    )) : <span className="text-sm text-slate-500 dark:text-slate-400">Sin carreras asociadas.</span>}
                                </div>
                            </div>
                            <div>
                                <p className="text-slate-500 dark:text-slate-400">Códigos universitarios</p>
                                <div className="mt-2 flex flex-wrap gap-2">
                                    {cus.length > 0 ? cus.map((cu) => (
                                        <span key={cu} className={`rounded-full px-3 py-1 text-xs font-medium ${cusRetenidos.includes(cu) ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' : 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300'}`}>{cu}{cusRetenidos.includes(cu) ? ' · retenido' : ''}</span>
                                    )) : <span className="text-sm text-slate-500 dark:text-slate-400">Sin C.U. registrados.</span>}
                                </div>
                            </div>
                        </div>
                    </section>
                </div>

                <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/40 dark:bg-amber-900/10">
                        <CircleAlert className="mt-0.5 h-5 w-5 text-amber-600 dark:text-amber-400" />
                        <p className="text-sm text-amber-800 dark:text-amber-200">Si algún dato no coincide con tu información real, solicita la corrección al administrador o al encargado de inventario.</p>
                    </div>

                    <div className="mt-6 overflow-x-auto">
                        <table className="w-full min-w-[520px] text-left text-sm text-slate-600 dark:text-slate-300">
                            <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:text-slate-400">
                                <tr>
                                    <th className="pb-3 pr-4 font-semibold">Carrera</th>
                                    <th className="pb-3 px-4 font-semibold">C.U.</th>
                                    <th className="pb-3 pl-4 font-semibold">Prefijo</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {asignacionesCarrera.length > 0 ? asignacionesCarrera.map((asignacion, indice) => (
                                    <tr key={`${asignacion.carrera}-${asignacion.cu}-${indice}`}>
                                        <td className="py-3 pr-4 font-medium text-slate-800 dark:text-slate-100">{asignacion.carrera}</td>
                                        <td className="px-4 py-3">{asignacion.cu}</td>
                                        <td className="py-3 pl-4">{asignacion.prefijoCu || '—'}</td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={3} className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">No hay asignaciones de carrera registradas.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>
        </LayoutPagina>
    );
};