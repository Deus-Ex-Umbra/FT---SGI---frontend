import { EspacioCarga } from './ui/espacio-carga';

export const PantallaCarga = () => {
    return (
        <div className="flex h-screen w-full flex-col items-center justify-center bg-slate-50 dark:bg-slate-900">
            <EspacioCarga
                titulo="Cargando Sistema..."
                descripcion="Preparando módulos de inventario"
            />
        </div>
    );
};
