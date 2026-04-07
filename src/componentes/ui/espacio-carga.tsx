import { Loader2 } from 'lucide-react';

interface Props {
    titulo?: string;
    descripcion?: string;
    className?: string;
}

export const EspacioCarga = ({
    titulo = 'Cargando...',
    descripcion,
    className = '',
}: Props) => {
    return (
        <div className={`flex w-full flex-col items-center justify-center py-10 ${className}`.trim()}>
            <div className="flex flex-col items-center space-y-3">
                <Loader2 className="h-10 w-10 animate-spin text-blue-600 dark:text-blue-400" />
                {titulo && <h2 className="text-base font-semibold text-slate-700 dark:text-slate-200">{titulo}</h2>}
                {descripcion && <p className="text-sm text-slate-500 dark:text-slate-400">{descripcion}</p>}
            </div>
        </div>
    );
};
