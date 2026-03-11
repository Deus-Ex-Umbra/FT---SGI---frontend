import type { ElementType } from 'react';

interface Props {
    titulo: string;
    valor: string | number;
    Icono: ElementType;
    colorBase: 'emerald' | 'blue' | 'amber' | 'red' | 'indigo';
}

const configColores = {
    emerald: {
        borde: 'border-emerald-200 dark:border-emerald-800',
        bgIcono: 'bg-emerald-100 dark:bg-emerald-950',
        textoIcono: 'text-emerald-600',
        textoValor: 'text-emerald-600'
    },
    blue: {
        borde: 'border-blue-200 dark:border-blue-800',
        bgIcono: 'bg-blue-100 dark:bg-blue-950',
        textoIcono: 'text-blue-600',
        textoValor: 'text-blue-600'
    },
    amber: {
        borde: 'border-amber-200 dark:border-amber-800',
        bgIcono: 'bg-amber-100 dark:bg-amber-950',
        textoIcono: 'text-amber-600',
        textoValor: 'text-amber-600'
    },
    red: {
        borde: 'border-red-200 dark:border-red-800',
        bgIcono: 'bg-red-100 dark:bg-red-950',
        textoIcono: 'text-red-600',
        textoValor: 'text-red-600'
    },
    indigo: {
        borde: 'border-indigo-200 dark:border-indigo-800',
        bgIcono: 'bg-indigo-100 dark:bg-indigo-950',
        textoIcono: 'text-indigo-600',
        textoValor: 'text-indigo-600'
    }
};

export const TarjetaMetrica = ({ titulo, valor, Icono, colorBase }: Props) => {
    const colores = configColores[colorBase];

    return (
        <div className={`flex items-center gap-3 rounded-lg border bg-white p-4 dark:bg-slate-900 ${colores.borde}`}>
            <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg ${colores.bgIcono}`}>
                <Icono className={`h-4 w-4 ${colores.textoIcono}`} />
            </div>
            <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">{titulo}</p>
                <p className={`text-xl font-bold ${colores.textoValor}`}>{valor}</p>
            </div>
        </div>
    );
};
