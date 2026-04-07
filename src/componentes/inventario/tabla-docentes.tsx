import { Pencil, Trash2, Users } from 'lucide-react';
import type { Docente } from '@/tipos/inventario';

interface Props {
    docentes: Docente[];
    onRegistrar: () => void;
    onEditar: (docente: Docente) => void;
    onEliminar: (docente: Docente) => void;
}

export const TablaDocentes = ({ docentes, onRegistrar, onEditar, onEliminar }: Props) => {
    const textoMaterias = (d: Docente) => {
        const codigos = (d.materias ?? []).map((m) => m.codigo);
        const fallback = d.materia ? [d.materia] : [];
        const unicos = Array.from(new Set([...codigos, ...fallback].map((v) => v.trim()).filter(Boolean)));
        return unicos.join(', ');
    };

    return (
        <div className="rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800">
                <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-slate-500" />
                    <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                        Registro de Docentes
                    </h2>
                </div>
                <button onClick={onRegistrar} className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-blue-700">
                    Registrar docente
                </button>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-xs">
                    <thead>
                        <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/50">
                            <th className="px-4 py-2.5 text-left font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Código</th>
                            <th className="px-4 py-2.5 text-left font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Nombre Completo</th>
                            <th className="px-4 py-2.5 text-left font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Materias</th>
                            <th className="px-4 py-2.5 text-left font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Carnet de Identidad</th>
                            <th className="px-4 py-2.5 text-center font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {docentes.map(d => (
                            <tr key={d.id} className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/40">
                                <td className="px-4 py-2.5 font-mono font-semibold text-blue-600 dark:text-blue-400">{d.codigo}</td>
                                <td className="px-4 py-2.5 font-medium text-slate-800 dark:text-slate-100">
                                    {d.nombre} {d.apellido}
                                </td>
                                <td className="px-4 py-2.5 font-mono text-slate-600 dark:text-slate-400">{textoMaterias(d) || '—'}</td>
                                <td className="px-4 py-2.5 text-slate-600 dark:text-slate-400">{d.carnet}</td>
                                <td className="px-4 py-2.5">
                                    <div className="flex items-center justify-center gap-2">
                                        <button
                                            onClick={() => onEditar(d)}
                                            className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                                        >
                                            <Pencil className="h-3 w-3" />
                                            Editar
                                        </button>
                                        <button
                                            onClick={() => onEliminar(d)}
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
};
