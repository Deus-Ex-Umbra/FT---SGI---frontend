import { Loader2 } from 'lucide-react';

export const PantallaCarga = () => {
    return (
        <div className="flex h-screen w-full flex-col items-center justify-center bg-slate-50 dark:bg-slate-900">
            <div className="flex flex-col items-center space-y-4">
                <Loader2 className="h-12 w-12 animate-spin text-blue-600 dark:text-blue-400" />
                <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-200">
                    Cargando Sistema...
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                    Preparando módulos de inventario
                </p>
            </div>
        </div>
    );
};
