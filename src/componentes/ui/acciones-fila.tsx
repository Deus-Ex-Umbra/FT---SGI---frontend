import { Pencil, Trash2 } from 'lucide-react';
import { Boton } from '@/componentes/ui/button';

interface Props {
    onEditar: () => void;
    onEliminar: () => void;
    deshabilitado?: boolean;
    textoEditar?: string;
    textoEliminar?: string;
}

export const AccionesFilaUi = ({
    onEditar,
    onEliminar,
    deshabilitado = false,
    textoEditar = 'Editar',
    textoEliminar = 'Eliminar',
}: Props) => {
    return (
        <div className="flex items-center justify-center gap-2">
            <Boton
                type="button"
                variant="outline"
                size="sm"
                onClick={onEditar}
                disabled={deshabilitado}
                className="h-7 px-2 text-[11px]"
            >
                <Pencil className="mr-1 h-3 w-3" />
                {textoEditar}
            </Boton>

            <Boton
                type="button"
                variant="destructive"
                size="sm"
                onClick={onEliminar}
                disabled={deshabilitado}
                className="h-7 px-2 text-[11px]"
            >
                <Trash2 className="mr-1 h-3 w-3" />
                {textoEliminar}
            </Boton>
        </div>
    );
};