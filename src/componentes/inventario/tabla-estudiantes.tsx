import { GraduationCap, Pencil, Plus, Trash2 } from 'lucide-react';
import type { Estudiante } from '@/tipos/inventario';

interface Props {
    estudiantes: Estudiante[];
    onRegistrar: () => void;
    onEditar: (estudiante: Estudiante) => void;
    onEliminar: (estudiante: Estudiante) => void;
}

export const TablaEstudiantes = ({ estudiantes, onRegistrar, onEditar, onEliminar }: Props) => (
    <div className="rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800">
            <div className="flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-slate-500" />
                <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                    Estudiantes registrados
                    <span className="ml-2 text-xs font-normal text-slate-400">({estudiantes.length} registros)</span>
                </h2>
            </div>
            <button onClick={onRegistrar} className="flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-blue-700">
                <Plus className="h-3.5 w-3.5" />
                Registrar estudiante
            </button>
        </div>
        <div className="overflow-x-auto">
            <table className="w-full text-xs">
                <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/50">
                        <th className="px-4 py-2.5 text-left font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Carnet</th>
                        <th className="px-4 py-2.5 text-left font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Nombre completo</th>
                        <th className="px-4 py-2.5 text-left font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Carrera</th>
                        <th className="px-4 py-2.5 text-center font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Semestre</th>
                        <th className="px-4 py-2.5 text-center font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Carnet retenido</th>
                        <th className="px-4 py-2.5 text-center font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Acciones</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {estudiantes.map((est) => (
                        <tr key={est.carnet} className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/40">
                            <td className="px-4 py-2.5 font-mono font-semibold text-blue-600 dark:text-blue-400">{est.carnet}</td>
                            <td className="px-4 py-2.5 font-medium text-slate-800 dark:text-slate-100">
                                {est.apellido}, {est.nombre}
                            </td>
                            <td className="px-4 py-2.5 text-slate-600 dark:text-slate-400">{est.carrera}</td>
                            <td className="px-4 py-2.5 text-center text-slate-600 dark:text-slate-400">{est.semestre}°</td>
                            <td className="px-4 py-2.5 text-center">
                                <span
                                    className={`rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${
                                        est.carnetRetenido
                                            ? 'border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300'
                                            : 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                                    }`}
                                >
                                    {est.carnetRetenido ? 'Si' : 'No'}
                                </span>
                            </td>
                            <td className="px-4 py-2.5">
                                <div className="flex items-center justify-center gap-2">
                                    <button
                                        onClick={() => onEditar(est)}
                                        className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                                    >
                                        <Pencil className="h-3 w-3" />
                                        Editar
                                    </button>
                                    <button
                                        onClick={() => onEliminar(est)}
                                        className="inline-flex items-center gap-1 rounded-md border border-red-200 px-2 py-1 text-[11px] font-medium text-red-600 hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950"
                                    >
                                        <Trash2 className="h-3 w-3" />
                                        Descartar
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
);
