import { Search, X as ClearIcon } from 'lucide-react';
import type { ReactNode } from 'react';

interface Props {
    busqueda: string;
    onBusquedaChange: (val: string) => void;
    placeholder?: string;
    children?: ReactNode;
    filtrosActivos?: boolean;
    onLimpiarFiltros?: () => void;
    textoResultados?: string;
    unaLinea?: boolean;
}

export const BarraFiltros = ({
    busqueda,
    onBusquedaChange,
    placeholder = "Buscar...",
    children,
    filtrosActivos = false,
    onLimpiarFiltros,
    textoResultados,
    unaLinea = false,
}: Props) => {
    const hayFiltrosActivos = busqueda !== '' || filtrosActivos;

    return (
        <div
            className={`flex items-center gap-2 ${
                unaLinea ? 'flex-nowrap overflow-x-auto py-1 pr-1 min-h-10' : 'flex-wrap'
            }`}
        >
            <div className={`relative flex-1 ${unaLinea ? 'min-w-[220px]' : ''} max-w-sm`}>
                <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                <input
                    type="text"
                    placeholder={placeholder}
                    value={busqueda}
                    onChange={e => onBusquedaChange(e.target.value)}
                    className="h-8 w-full rounded-md border border-slate-200 bg-white pl-8 pr-8 text-xs text-slate-800 placeholder-slate-400 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                />
                {busqueda && (
                    <button onClick={() => onBusquedaChange('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                        <ClearIcon className="h-3.5 w-3.5" />
                    </button>
                )}
            </div>

            {children}

            {hayFiltrosActivos && onLimpiarFiltros && (
                <button
                    onClick={onLimpiarFiltros}
                    className="shrink-0 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                    Limpiar filtros
                </button>
            )}

            {textoResultados && (
                <span className="ml-auto shrink-0 text-xs text-slate-400">{textoResultados}</span>
            )}
        </div>
    );
};
