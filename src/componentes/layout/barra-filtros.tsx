import { Search, X as ClearIcon } from 'lucide-react';
import type { ReactNode } from 'react';

interface Props {
    busqueda: string;
    onBusquedaChange: (val: string) => void;
    placeholder?: string;
    children?: ReactNode;
    filtrosActivos?: boolean;
    onLimpiarFiltros?: () => void;
    unaLinea?: boolean;
    buscadorDerecha?: boolean;
    grande?: boolean;
}

export const BarraFiltros = ({
    busqueda,
    onBusquedaChange,
    placeholder = "Buscar...",
    children,
    filtrosActivos = false,
    onLimpiarFiltros,
    unaLinea = false,
    buscadorDerecha = false,
    grande = false,
}: Props) => {
    const hayFiltrosActivos = busqueda !== '' || filtrosActivos;

    const renderBuscador = () => (
        <div className={`relative flex-1 ${unaLinea ? 'min-w-[220px]' : ''} max-w-sm ${buscadorDerecha ? 'md:ml-auto' : ''}`}>
            <Search className={`absolute ${grande ? 'left-3.5 h-4 w-4' : 'left-2.5 h-3.5 w-3.5'} top-1/2 -translate-y-1/2 text-slate-400`} />
            <input
                type="text"
                placeholder={placeholder}
                value={busqueda}
                onChange={e => onBusquedaChange(e.target.value)}
                className={`${grande ? 'h-10 pl-10 pr-10 text-sm' : 'h-8 pl-8 pr-8 text-xs'} w-full rounded-md border border-slate-200 bg-white text-slate-800 placeholder-slate-400 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100`}
            />
            {busqueda && (
                <button onClick={() => onBusquedaChange('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    <ClearIcon className={grande ? 'h-4 w-4' : 'h-3.5 w-3.5'} />
                </button>
            )}
        </div>
    );

    return (
        <div
            className={`flex items-center gap-2 w-full ${
                unaLinea ? 'flex-nowrap overflow-x-auto py-1 pr-1 min-h-10' : 'flex-wrap'
            }`}
        >
            {!buscadorDerecha && renderBuscador()}

            {children}

            {buscadorDerecha && renderBuscador()}

            {hayFiltrosActivos && onLimpiarFiltros && (
                <button
                    onClick={onLimpiarFiltros}
                    className={`shrink-0 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 ${grande ? 'text-sm' : 'text-xs'}`}
                >
                    Limpiar filtros
                </button>
            )}
        </div>
    );
};
