import { AccionesFilaUi } from '@/componentes/ui/acciones-fila';

interface Props {
    onEditar: () => void;
    onEliminar: () => void;
    deshabilitado?: boolean;
}

export const AccionesFilaAdmin = ({ onEditar, onEliminar, deshabilitado = false }: Props) => {
    return (
        <AccionesFilaUi onEditar={onEditar} onEliminar={onEliminar} deshabilitado={deshabilitado} />
    );
};