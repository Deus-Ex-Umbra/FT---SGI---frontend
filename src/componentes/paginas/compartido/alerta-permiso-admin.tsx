import { ShieldAlert } from 'lucide-react';
import { MensajeEstado } from '@/componentes/ui/mensaje-estado';

interface Props {
    mensaje: string;
}

export const AlertaPermisoAdmin = ({ mensaje }: Props) => {
    return (
        <MensajeEstado mensaje={mensaje} variante="advertencia" icono={ShieldAlert} />
    );
};