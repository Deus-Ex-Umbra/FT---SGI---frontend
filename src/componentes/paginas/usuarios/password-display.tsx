import { Copy, Check } from 'lucide-react';
import { Boton } from '@/componentes/ui/button';
import { useState } from 'react';

interface Props {
    password: string;
    label?: string;
}

export const PasswordDisplay = ({ password, label = 'Contraseña' }: Props) => {
    const [copiado, setCopiado] = useState(false);

    const copiar = () => {
        void navigator.clipboard.writeText(password);
        setCopiado(true);
        setTimeout(() => setCopiado(false), 2000);
    };

    return (
        <div className="space-y-1.5">
            {label && <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</p>}
            <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50/50 p-2.5 dark:border-slate-800 dark:bg-slate-900/50">
                <code className="flex-1 font-mono text-sm font-bold tracking-wider text-blue-600 dark:text-blue-400 break-all select-all">
                    {password}
                </code>
                <Boton
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0 hover:bg-slate-200 dark:hover:bg-slate-800"
                    onClick={copiar}
                    title="Copiar contraseña"
                >
                    {copiado ? (
                        <Check className="h-4 w-4 text-emerald-500" />
                    ) : (
                        <Copy className="h-4 w-4 text-slate-500" />
                    )}
                </Boton>
            </div>
            {copiado && (
                <p className="text-xs font-medium text-emerald-600 dark:text-emerald-500 animate-in fade-in slide-in-from-top-1">
                    ¡Copiado al portapapeles!
                </p>
            )}
        </div>
    );
};
