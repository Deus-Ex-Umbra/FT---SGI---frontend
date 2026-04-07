import { ShieldAlert, FileClock, Activity } from 'lucide-react';
import type { PaginaApp } from '@/tipos/navegacion';
import { LayoutPagina } from '@/componentes/layout/layout-pagina';

interface Props {
    onNavegar: (pagina: PaginaApp) => void;
    onCerrarSesion: () => void;
}

export const Auditoria = ({ onNavegar, onCerrarSesion }: Props) => {
    return (
        <LayoutPagina
            paginaActiva="auditoria"
            titulo="Auditoría"
            subtitulo="Logs y trazabilidad del sistema"
            onNavegar={onNavegar}
            onCerrarSesion={onCerrarSesion}
        >
            <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
                        <ShieldAlert className="h-4 w-4 text-blue-500" />
                        Seguridad
                    </div>
                    <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Intentos de acceso, bloqueos y cambios sensibles.</p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
                        <FileClock className="h-4 w-4 text-indigo-500" />
                        Eventos
                    </div>
                    <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Altas, bajas y modificaciones por módulo y usuario.</p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
                        <Activity className="h-4 w-4 text-emerald-500" />
                        Estado
                    </div>
                    <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Módulo en preparación. Se habilitará en una siguiente fase.</p>
                </div>
            </div>
        </LayoutPagina>
    );
};
