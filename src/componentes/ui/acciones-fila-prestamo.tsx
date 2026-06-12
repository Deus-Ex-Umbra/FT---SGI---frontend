import { RotateCcw } from 'lucide-react';
import { Boton } from '@/componentes/ui/button';

interface Props {
    onEditar: () => void;
    onExtender: () => void;
    onDevolver: () => void;
    deshabilitarExtenderYDevolver?: boolean;
}

export const AccionesFilaPrestamoUi = ({
    onEditar,
    onExtender,
    onDevolver,
    deshabilitarExtenderYDevolver = false,
}: Props) => {
    return (
        <div className="flex justify-center gap-1.5">
            <Boton
                type="button"
                variant="outline"
                size="sm"
                onClick={onEditar}
                className="h-7 border-blue-300 bg-blue-50 px-2 py-1 text-[11px] font-medium text-blue-700 hover:bg-blue-100 dark:border-blue-700 dark:bg-blue-950/50 dark:text-blue-300 dark:hover:bg-blue-900/60"
            >
                Editar
            </Boton>

            <Boton
                type="button"
                variant="outline"
                size="sm"
                onClick={onExtender}
                disabled={deshabilitarExtenderYDevolver}
                className="h-7 border-amber-300 bg-amber-50 px-2 py-1 text-[11px] font-medium text-amber-700 hover:bg-amber-100 dark:border-amber-700 dark:bg-amber-950/50 dark:text-amber-300 dark:hover:bg-amber-900/60"
            >
                Extender
            </Boton>

            <Boton
                type="button"
                variant="outline"
                size="sm"
                onClick={onDevolver}
                disabled={deshabilitarExtenderYDevolver}
                className="h-7 gap-1 px-2 py-1 text-[11px]"
            >
                <RotateCcw className="h-3 w-3" />
                Devolver
            </Boton>
        </div>
    );
};