import type { LucideIcon } from 'lucide-react';

interface Atributo {
    label: string;
    value: string | number;
    icon?: LucideIcon;
}

interface Props {
    titulo: string;
    subtitulo?: string;
    atributos: Atributo[];
    badge?: {
        text: string;
        color: 'blue' | 'green' | 'red' | 'orange' | 'slate';
    };
    Icono?: LucideIcon;
    onVerDetalles?: () => void;
}

export const TarjetaDato = ({ titulo, subtitulo, atributos, badge, Icono, onVerDetalles }: Props) => {
    const colores = {
        blue: 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 border-blue-100 dark:border-blue-800',
        green: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800',
        red: 'bg-rose-50 text-rose-700 dark:bg-rose-900/20 dark:text-rose-400 border-rose-100 dark:border-rose-800',
        orange: 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400 border-amber-100 dark:border-amber-800',
        slate: 'bg-slate-50 text-slate-700 dark:bg-slate-900/20 dark:text-slate-400 border-slate-100 dark:border-slate-800'
    };

    return (
        <div className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:border-blue-400 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-500">
            <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                    {Icono && (
                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-500 transition-colors group-hover:bg-blue-50 group-hover:text-blue-600 dark:bg-slate-800 dark:text-slate-400 dark:group-hover:bg-blue-900/30">
                            <Icono className="h-5 w-5" />
                        </div>
                    )}
                    <div className="min-w-0">
                        <h3 className="truncate text-sm font-bold text-slate-800 dark:text-slate-200">{titulo}</h3>
                        {subtitulo && <p className="truncate text-xs text-slate-500 dark:text-slate-400">{subtitulo}</p>}
                    </div>
                </div>
                {badge && (
                    <span className={`flex-shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${colores[badge.color]}`}>
                        {badge.text}
                    </span>
                )}
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
                {atributos.map((at, idx) => (
                    <div key={idx} className="flex flex-col gap-0.5">
                        <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 dark:text-slate-500">{at.label}</span>
                        <div className="flex items-center gap-1.5 overflow-hidden">
                            {at.icon && <at.icon className="h-3 w-3 text-slate-400 flex-shrink-0" />}
                            <span className="truncate text-xs font-medium text-slate-600 dark:text-slate-300">{at.value}</span>
                        </div>
                    </div>
                ))}
            </div>

            {onVerDetalles && (
                <button
                    onClick={onVerDetalles}
                    className="mt-4 w-full rounded-lg bg-slate-50 py-2 text-xs font-bold text-slate-600 transition-colors hover:bg-blue-600 hover:text-white dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-blue-600"
                >
                    Ver Detalles
                </button>
            )}
        </div>
    );
};
