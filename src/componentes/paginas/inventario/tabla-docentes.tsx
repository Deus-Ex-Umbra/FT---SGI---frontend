import { AccionesFilaUi } from '@/componentes/ui/acciones-fila';
import { Skeleton } from '../../ui/skeleton';
import type { Docente } from '@/tipos/inventario';

interface Props {
    docentes: Docente[];
    onEditar: (docente: Docente) => void;
    onEliminar: (docente: Docente) => void;
    puedeAdministrar?: boolean;
    cargando?: boolean;
}

export const TablaDocentes = ({ docentes, onEditar, onEliminar, puedeAdministrar = true, cargando = false }: Props) => {
    const textoMaterias = (d: Docente) => {
        const codigos = (d.materias ?? []).map((m) => m.codigo);
        const fallback = d.materia ? [d.materia] : [];
        const unicos = Array.from(new Set([...codigos, ...fallback].map((v) => v.trim()).filter(Boolean)));
        return unicos.join(', ');
    };

    const textoCarreras = (d: Docente) => {
        return (d.carreras ?? []).map((c) => c.nombre).join(', ');
    };

    return (
        <div className="rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            <div className="overflow-x-auto">
                <table className="w-full text-xs">
                    <thead>
                        <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/50">
                            <th className="px-4 py-2.5 text-left font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Código</th>
                            <th className="px-4 py-2.5 text-left font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Correo</th>
                            <th className="px-4 py-2.5 text-left font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Nombre Completo</th>
                            <th className="px-4 py-2.5 text-left font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Carreras</th>
                            <th className="px-4 py-2.5 text-left font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Materias</th>
                            <th className="px-4 py-2.5 text-left font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Carnet de Identidad</th>
                            {puedeAdministrar && (
                                <th className="px-4 py-2.5 text-center font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Acciones</th>
                            )}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {cargando ? (
                            Array.from({ length: 5 }).map((_, idx) => (
                                <tr key={idx} className="border-b border-slate-100 dark:border-slate-800">
                                    <td className="px-4 py-3"><Skeleton className="h-4 w-12" /></td>
                                    <td className="px-4 py-3"><Skeleton className="h-4 w-28" /></td>
                                    <td className="px-4 py-3"><Skeleton className="h-4 w-32" /></td>
                                    <td className="px-4 py-3"><Skeleton className="h-4 w-24" /></td>
                                    <td className="px-4 py-3"><Skeleton className="h-4 w-20" /></td>
                                    <td className="px-4 py-3"><Skeleton className="h-4 w-16" /></td>
                                    {puedeAdministrar && (
                                        <td className="px-4 py-3 text-center">
                                            <Skeleton className="h-6 w-16 mx-auto" />
                                        </td>
                                    )}
                                </tr>
                            ))
                        ) : (
                            <>
                                {docentes.map((d) => (
                                    <tr key={d.id} className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/40">
                                        <td className="px-4 py-2.5 font-mono font-semibold text-blue-600 dark:text-blue-400">{d.codigo}</td>
                                        <td className="px-4 py-2.5 text-slate-600 dark:text-slate-400">{d.correo || '—'}</td>
                                        <td className="px-4 py-2.5 font-medium text-slate-800 dark:text-slate-100">
                                            {d.nombre} {d.apellido}
                                        </td>
                                        <td className="px-4 py-2.5 text-slate-600 dark:text-slate-400">{textoCarreras(d) || '—'}</td>
                                        <td className="px-4 py-2.5 font-mono text-slate-600 dark:text-slate-400">{textoMaterias(d) || '—'}</td>
                                        <td className="px-4 py-2.5 text-slate-600 dark:text-slate-400">{d.carnet}</td>
                                        {puedeAdministrar && (
                                            <td className="px-4 py-2.5">
                                                <AccionesFilaUi onEditar={() => onEditar(d)} onEliminar={() => onEliminar(d)} textoEliminar="Descartar" />
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
