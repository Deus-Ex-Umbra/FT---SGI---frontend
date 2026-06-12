import { AlertCircle } from 'lucide-react';
import { MensajeEstado } from '@/componentes/ui/mensaje-estado';

interface Props {
    mensaje: string;
}

export const MensajeErrorModulo = ({ mensaje }: Props) => {
    return (
        <MensajeEstado mensaje={mensaje} variante="error" icono={AlertCircle} />
    );
};