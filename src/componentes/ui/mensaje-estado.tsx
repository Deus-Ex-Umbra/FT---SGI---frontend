import type { ComponentType } from 'react';
import { AlertCircle } from 'lucide-react';
import { cn } from '@/utilidades/ui';

type VarianteMensajeEstado = 'info' | 'advertencia' | 'error';

interface Props {
    mensaje: string;
    variante?: VarianteMensajeEstado;
    icono?: ComponentType<{ className?: string }>;
    className?: string;
}

const estilosPorVariante: Record<VarianteMensajeEstado, string> = {
    info: 'border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-200',
    advertencia: 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200',
    error: 'border-red-200 bg-red-50 text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-200',
};

export const MensajeEstado = ({
    mensaje,
    variante = 'info',
    icono: Icono = AlertCircle,
    className,
}: Props) => {
    return (
        <div className={cn('flex items-start gap-2 rounded-md border px-3 py-2 text-xs', estilosPorVariante[variante], className)}>
            <Icono className="mt-0.5 h-4 w-4" />
            {mensaje}
        </div>
    );
};
