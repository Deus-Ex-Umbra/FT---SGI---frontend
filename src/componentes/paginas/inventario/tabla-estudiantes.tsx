import { GraduationCap, Pencil, Trash2 } from 'lucide-react';
import type { Estudiante } from '@/tipos/inventario';
import { Skeleton } from '../../ui/skeleton';


interface Props {
    estudiantes: Estudiante[];
    onEditar?: (estudiante: Estudiante) => void;
    onEliminar?: (estudiante: Estudiante) => void;
    onAsignarCarrera?: (estudiante: Estudiante) => void;
    onToggleRetencion?: (estudiante: Estudiante) => void;
    onRestablecerRetencion?: (estudiante: Estudiante) => void;
    puedeAdministrar?: boolean;
    cargando?: boolean;
}

export const TablaEstudiantes = ({
    estudiantes,
    onEditar,
    onEliminar,
    onAsignarCarrera,
    onToggleRetencion,
    onRestablecerRetencion,
    puedeAdministrar = true,
    cargando = false
}: Props) => {


    return (
        <div className="rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            <div className="overflow-x-auto">
                <table className="w-full text-xs">
                    <thead>
                        <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/50">
                            <th className="px-4 py-2.5 text-left font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">CI</th>
                            <th className="px-4 py-2.5 text-left font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Nombre completo</th>
                            <th className="px-4 py-2.5 text-left font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Carrera</th>
                            <th className="px-4 py-2.5 text-center font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Carnet retenido</th>
                            {puedeAdministrar && (
                                <th className="px-4 py-2.5 text-center font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Acciones</th>
                            )}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {cargando ? (
                            Array.from({ length: 5 }).map((_, idx) => (
                                <tr key={idx} className="border-b border-slate-100 dark:border-slate-800">
                                    <td className="px-4 py-3"><Skeleton className="h-4 w-16" /></td>
                                    <td className="px-4 py-3"><Skeleton className="h-4 w-32" /></td>
                                    <td className="px-4 py-3"><Skeleton className="h-4 w-40" /></td>
                                    <td className="px-4 py-3"><Skeleton className="h-4 w-10 mx-auto" /></td>
                                    {puedeAdministrar && (
                                        <td className="px-4 py-3 text-center">
                                            <div className="flex gap-2 justify-center">
                                                <Skeleton className="h-6 w-16" />
                                                <Skeleton className="h-6 w-24" />
                                                <Skeleton className="h-6 w-16" />
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            ))
                        ) : (
                            <>
                                {estudiantes.map((est) => {
                                    const asignaciones = est.asignacionesCarrera?.length
                                        ? est.asignacionesCarrera
                                        : [{ carrera: est.carrera, cu: est.cu ?? '' }];
                                    
                                    return (
                                        <tr key={est.id || est.carnet} className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/40">
                                            <td className="px-4 py-2.5 font-mono font-semibold text-blue-600 dark:text-blue-400">{est.carnet}</td>
                                            <td className="px-4 py-2.5 font-medium text-slate-800 dark:text-slate-100">
                                                {est.apellido}, {est.nombre}
                                            </td>
                                            <td className="px-4 py-2.5 text-slate-600 dark:text-slate-400">
                                                <div className="flex flex-col gap-1.5">
                                                    {asignaciones.map((asig, idx) => (
                                                        <div key={idx} className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 dark:border-slate-700 dark:bg-slate-800/60">
                                                            <p className="font-medium text-slate-700 dark:text-slate-200">{asig.carrera}</p>
                                                            {asig.cu && (
                                                                <p className="font-mono text-[11px] text-slate-500 dark:text-slate-400">CU {asig.cu}</p>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </td>

                                            <td className="px-4 py-2.5 text-center">
                                                <div className="flex flex-col items-center justify-center gap-1.5">
                                                    <div className="flex flex-col gap-1.5 w-full items-center">
                                                        {asignaciones.map((asig, idx) => (
                                                            <div key={idx} className="flex flex-col items-center gap-1 py-1 px-2 border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 rounded-md w-full max-w-[140px]">
                                                                <span className="font-mono text-[9px] font-semibold text-slate-500 dark:text-slate-400">CU {asig.cu || 'S/N'}</span>
                                                                <div className="flex items-center gap-1.5">
                                                                    <span
                                                                        className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${
                                                                            est.carnetRetenido
                                                                                ? 'border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300'
                                                                                : 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                                                                        }`}
                                                                    >
                                                                        {est.carnetRetenido ? 'Si' : 'No'}
                                                                    </span>
                                                                    {onToggleRetencion && (
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => onToggleRetencion(est)}
                                                                            className="text-[10px] text-blue-600 hover:underline dark:text-blue-400 font-medium"
                                                                        >
                                                                            {est.carnetRetenido ? 'Liberar' : 'Retener'}
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                    {est.carnetRetenidoOverride !== null && onRestablecerRetencion && (
                                                        <button
                                                            type="button"
                                                            onClick={() => onRestablecerRetencion(est)}
                                                            className="text-[9px] text-slate-400 hover:underline dark:text-slate-500 font-normal mt-1"
                                                            title="Volver a calcular automáticamente según préstamos activos"
                                                        >
                                                            Restablecer automático
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                            {puedeAdministrar && (
                                                <td className="px-4 py-2.5">
                                                    <div className="flex items-center justify-center gap-2">
                                                        {onEditar && (
                                                            <button
                                                                onClick={() => onEditar(est)}
                                                                className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                                                            >
                                                                <Pencil className="h-3 w-3" />
                                                                Editar
                                                            </button>
                                                        )}
                                                        {onAsignarCarrera && (
                                                            <button
                                                                onClick={() => onAsignarCarrera(est)}
                                                                className="inline-flex items-center gap-1 rounded-md border border-blue-200 px-2 py-1 text-[11px] font-medium text-blue-600 hover:bg-blue-50 dark:border-blue-900 dark:text-blue-400 dark:hover:bg-blue-955"
                                                            >
                                                                <GraduationCap className="h-3 w-3" />
                                                                Asignar carrera
                                                            </button>
                                                        )}
                                                        {onEliminar && (
                                                            <button
                                                                onClick={() => onEliminar(est)}
                                                                className="inline-flex items-center gap-1 rounded-md border border-red-200 px-2 py-1 text-[11px] font-medium text-red-600 hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-955"
                                                            >
                                                                <Trash2 className="h-3 w-3" />
                                                                Descartar
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            )}
                                        </tr>
                                    );
                                })}
                            </>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

