import { useState, useEffect } from 'react';
import { ModalBase } from './ModalBase';
import { Boton } from '../ui/button';

interface Props {
    titulo: string;
    camposIniciales: {
        key: string;
        label: string;
        value: string;
        type?: 'text' | 'number' | 'date' | 'datetime-local' | 'select';
        required?: boolean;
        options?: { value: string; label: string }[];
    }[];
    onGuardar: (valores: Record<string, string>) => void | Promise<void>;
    onCerrar: () => void;
}

export const FormularioEdicionJerarquia = ({ titulo, camposIniciales, onGuardar, onCerrar }: Props) => {
    const [valores, setValores] = useState<Record<string, string>>({});
    const [guardando, setGuardando] = useState(false);
    const [error, setError] = useState('');

    const abreviarUnidad = (unidad: string) => {
        const normalizada = unidad.trim().toLowerCase();
        if (!normalizada) return 'u';
        if (normalizada.startsWith('metro')) return 'm';
        if (normalizada.startsWith('unidad')) return 'u';
        if (normalizada.startsWith('litro')) return 'l';
        if (normalizada.startsWith('kilo') || normalizada.startsWith('kilogram')) return 'kg';
        if (normalizada.startsWith('gram')) return 'g';
        if (normalizada.startsWith('centimetro')) return 'cm';
        return normalizada.slice(0, 3);
    };

    const obtenerEtiqueta = (campo: Props['camposIniciales'][number]) => {
        if (campo.key !== 'precio') return campo.label;
        const unidad = valores.unidad?.trim();
        if (!unidad) return campo.label;
        return `Precio Unitario (Bs/${abreviarUnidad(unidad)})`;
    };

    useEffect(() => {
        const init: Record<string, string> = {};
        camposIniciales.forEach(c => init[c.key] = c.value);
        setValores(init);
    }, [camposIniciales]);

    const manejarEnvio = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        try {
            setGuardando(true);
            await onGuardar(valores);
            onCerrar();
        } catch (err: any) {
            setError(err?.message ?? 'No se pudieron guardar los cambios.');
        } finally {
            setGuardando(false);
        }
    };

    return (
        <ModalBase titulo={titulo} onCerrar={onCerrar} ancho="max-w-md">
            <form onSubmit={manejarEnvio} className="space-y-4">
                {camposIniciales.map(campo => (
                    <div key={campo.key} className="flex flex-col gap-1">
                        <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                            {obtenerEtiqueta(campo)}
                        </label>
                        {campo.type === 'select' ? (
                            <select
                                title={obtenerEtiqueta(campo)}
                                value={valores[campo.key] || ''}
                                onChange={e => setValores({ ...valores, [campo.key]: e.target.value })}
                                required={campo.required ?? true}
                                className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                            >
                                {(campo.options ?? []).map((opt) => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                        ) : (
                            <input
                                title={obtenerEtiqueta(campo)}
                                type={campo.type || 'text'}
                                value={valores[campo.key] || ''}
                                onChange={e => setValores({ ...valores, [campo.key]: e.target.value })}
                                required={campo.required ?? true}
                                className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                            />
                        )}
                    </div>
                ))}

                {error && (
                    <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
                        {error}
                    </p>
                )}

                <div className="flex justify-end gap-2 pt-2">
                    <button type="button" onClick={onCerrar} className="h-9 rounded-md border border-slate-200 px-4 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400">
                        Cancelar
                    </button>
                    <Boton type="submit" className="h-9 px-5 text-xs" disabled={guardando}>
                        {guardando ? 'Guardando...' : 'Guardar cambios'}
                    </Boton>
                </div>
            </form>
        </ModalBase>
    );
};
