import { FilaTablaVaciaUi } from '@/componentes/ui/fila-tabla-vacia';

interface Props {
    colSpan: number;
    mensaje: string;
}

export const FilaTablaVacia = ({ colSpan, mensaje }: Props) => {
    return <FilaTablaVaciaUi colSpan={colSpan} mensaje={mensaje} />;
};