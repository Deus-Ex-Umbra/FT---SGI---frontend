import { useMemo, useState, useEffect, useId, useRef } from 'react';
import { toast } from 'sonner';
import { ModalBase } from './modal-base';
import { Boton } from '@/componentes/ui/button';
import { Combobox, ComboboxContent, ComboboxEmpty, ComboboxInput, ComboboxItem, ComboboxList } from '@/componentes/ui/combobox';
import { DatePicker } from '@/componentes/ui/date-picker';
import { DateTimePicker } from '@/componentes/ui/date-time-picker';
import { useCierreSeguro } from '@/hooks/use-cierre-seguro';
import { ScrollArea } from '@/componentes/ui/scroll-area';
import { Switch } from '@/componentes/ui/switch';

type ValoresFormulario = Record<string, string>;

type CampoFormulario = {
    key: string;
    label: string;
    value: string;
    type?: 'text' | 'number' | 'date' | 'datetime-local' | 'select' | 'combobox' | 'textarea' | 'switch';
    required?: boolean;
    requiredWhen?: (values: ValoresFormulario) => boolean;
    visibleWhen?: (values: ValoresFormulario) => boolean;
    defaultValueWhenVisible?: string | ((values: ValoresFormulario) => string);
    options?: { value: string; label: string }[];
    containerClassName?: string;
    inputClassName?: string;
    rows?: number;
};

interface Props {
    titulo: string;
    camposIniciales: CampoFormulario[];
    onGuardar: (valores: ValoresFormulario) => void | Promise<void>;
    onCerrar: () => void;
    mensajeExito?: string;
    mensajeError?: string;
}

export const FormularioEdicionJerarquia = ({ titulo, camposIniciales, onGuardar, onCerrar, mensajeExito, mensajeError }: Props) => {
    const [valores, setValores] = useState<ValoresFormulario>({});
    const [guardando, setGuardando] = useState(false);
    const [error, setError] = useState('');
    const [erroresCampos, setErroresCampos] = useState<Record<string, boolean>>({});
    const reactId = useId();
    const formId = useMemo(() => `form-${reactId.replace(/:/g, '')}`, [reactId]);
    const defaultsAplicadosRef = useRef<Set<string>>(new Set());

    const valoresIniciales = useMemo(() => {
        const init: ValoresFormulario = {};
        camposIniciales.forEach((c) => {
            init[c.key] = c.value;
        });
        return init;
    }, [camposIniciales]);

    const estaSucio = useMemo(() => {
        return Object.keys(valoresIniciales).some((key) => (valores[key] ?? '') !== (valoresIniciales[key] ?? ''));
    }, [valores, valoresIniciales]);

    const {
        solicitarCierre,
        confirmacionAbierta,
        cancelarCierre,
        confirmarCierre,
        mensajeConfirmacion,
    } = useCierreSeguro({
        estaSucio,
        estaCargando: guardando,
        alCerrar: onCerrar,
        mensajeConfirmacion: 'Hay cambios sin guardar. ¿Deseas cerrar y descartarlos?',
    });

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
        defaultsAplicadosRef.current = new Set();
        const init: ValoresFormulario = {};
        camposIniciales.forEach(c => init[c.key] = c.value);
        setValores(init);
        setErroresCampos({});
        setError('');
    }, [camposIniciales]);

    const esVisible = (campo: CampoFormulario, values: ValoresFormulario) => {
        return campo.visibleWhen ? Boolean(campo.visibleWhen(values)) : true;
    };

    const esRequerido = (campo: CampoFormulario, values: ValoresFormulario) => {
        if (campo.requiredWhen) return Boolean(campo.requiredWhen(values));
        return campo.required ?? true;
    };

    const camposVisibles = useMemo(() => {
        return camposIniciales.filter((c) => esVisible(c, valores));
    }, [camposIniciales, valores]);

    useEffect(() => {
        let cambio = false;
        const next = { ...valores };

        for (const campo of camposIniciales) {
            if (!esVisible(campo, valores)) continue;
            if (!campo.defaultValueWhenVisible) continue;
            if (defaultsAplicadosRef.current.has(campo.key)) continue;

            const actual = String(next[campo.key] ?? '').trim();
            if (actual) {
                defaultsAplicadosRef.current.add(campo.key);
                continue;
            }

            const def =
                typeof campo.defaultValueWhenVisible === 'function'
                    ? campo.defaultValueWhenVisible(valores)
                    : campo.defaultValueWhenVisible;

            if (String(def ?? '').trim()) {
                next[campo.key] = String(def);
                cambio = true;
            }

            defaultsAplicadosRef.current.add(campo.key);
        }

        if (cambio) setValores(next);
    }, [camposIniciales, valores]);

    const manejarEnvio = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setErroresCampos({});

        const faltantes: Record<string, boolean> = {};
        for (const campo of camposVisibles) {
            if (!esRequerido(campo, valores)) continue;
            const v = String(valores[campo.key] ?? '').trim();
            if (!v) faltantes[campo.key] = true;
        }
        if (Object.keys(faltantes).length > 0) {
            setErroresCampos(faltantes);
            setError('Completa los campos obligatorios resaltados.');
            return;
        }

        try {
            setGuardando(true);
            await onGuardar(valores);
            toast.success(mensajeExito ?? 'Operación completada correctamente.');
            onCerrar();
        } catch (err: any) {
            const mensaje = err?.message ?? mensajeError ?? 'No se pudieron guardar los cambios.';
            setError(mensaje);
            toast.error(mensaje);
        } finally {
            setGuardando(false);
        }
    };

    return (
        <>
            <ModalBase
                titulo={titulo}
                onCerrar={solicitarCierre}
                ancho="max-w-md"
                bodyClassName="p-0"
                footer={
                    <div className="flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={solicitarCierre}
                            className="h-9 rounded-md border border-slate-200 px-4 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400"
                        >
                            Cancelar
                        </button>
                        <Boton form={formId} type="submit" className="h-9 px-5 text-xs" disabled={guardando}>
                            {guardando ? 'Guardando...' : 'Guardar cambios'}
                        </Boton>
                    </div>
                }
            >
                <form id={formId} onSubmit={manejarEnvio} className="flex h-full min-h-0 flex-col">
                    <ScrollArea className="scroll-elegante flex-1 px-4 py-4">
                        <div className="space-y-4">
                            {camposVisibles.map(campo => {
                                const requerido = esRequerido(campo, valores);
                                const tieneError = Boolean(erroresCampos[campo.key]);
                                const etiqueta = obtenerEtiqueta(campo);
                                const clasesInputBase =
                                    'h-9 rounded-md border bg-white px-3 text-sm text-slate-800 outline-none dark:bg-slate-800 dark:text-slate-100';
                                const clasesBordeOk =
                                    'border-slate-200 focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:border-slate-700';
                                const clasesBordeError =
                                    'border-red-300 focus:border-red-400 focus:ring-1 focus:ring-red-400 dark:border-red-700';

                                return (
                                <div key={campo.key} className={`flex flex-col gap-1 ${campo.containerClassName ?? ''}`}>
                                    <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                                        {etiqueta}
                                        {requerido ? <span className="ml-1 text-red-500">*</span> : null}
                                    </label>
                                    {campo.type === 'combobox' ? (
                                        <Combobox<{ value: string; label: string }>
                                            items={campo.options ?? []}
                                            value={valores[campo.key] || ''}
                                            onValueChange={(value) => {
                                                setValores({ ...valores, [campo.key]: value });
                                                if (erroresCampos[campo.key]) {
                                                    setErroresCampos((prev) => ({ ...prev, [campo.key]: false }));
                                                    setError('');
                                                }
                                            }}
                                            getItemValue={(opt) => opt.value}
                                            getItemLabel={(opt) => opt.label}
                                        >
                                            <ComboboxInput
                                                placeholder={`Selecciona ${etiqueta.toLowerCase()}`}
                                                showClear
                                            />
                                            <ComboboxContent>
                                                <ComboboxEmpty>No se encontraron opciones.</ComboboxEmpty>
                                                <ComboboxList<{ value: string; label: string }>>
                                                    {(opt) => (
                                                        <ComboboxItem key={opt.value} value={opt.value}>
                                                            {opt.label}
                                                        </ComboboxItem>
                                                    )}
                                                </ComboboxList>
                                            </ComboboxContent>
                                        </Combobox>
                                    ) : campo.type === 'select' ? (
                                        <select
                                            title={etiqueta}
                                            value={valores[campo.key] || ''}
                                            onChange={e => {
                                                setValores({ ...valores, [campo.key]: e.target.value });
                                                if (erroresCampos[campo.key]) {
                                                    setErroresCampos((prev) => ({ ...prev, [campo.key]: false }));
                                                    setError('');
                                                }
                                            }}
                                            required={requerido}
                                            className={`${clasesInputBase} ${tieneError ? clasesBordeError : clasesBordeOk}`}
                                        >
                                            {(campo.options ?? []).map((opt) => (
                                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                                            ))}
                                        </select>
                                    ) : campo.type === 'date' ? (
                                        <DatePicker
                                            value={valores[campo.key] || ''}
                                            onChange={(value) => {
                                                setValores({ ...valores, [campo.key]: value });
                                                if (erroresCampos[campo.key]) {
                                                    setErroresCampos((prev) => ({ ...prev, [campo.key]: false }));
                                                    setError('');
                                                }
                                            }}
                                            placeholder={`Selecciona ${etiqueta.toLowerCase()}`}
                                            title={etiqueta}
                                            className={`w-full justify-between ${tieneError ? 'border-red-300 hover:border-red-400' : ''}`}
                                        />
                                    ) : campo.type === 'datetime-local' ? (
                                        <DateTimePicker
                                            value={valores[campo.key] || ''}
                                            onChange={(value) => {
                                                setValores({ ...valores, [campo.key]: value });
                                                if (erroresCampos[campo.key]) {
                                                    setErroresCampos((prev) => ({ ...prev, [campo.key]: false }));
                                                    setError('');
                                                }
                                            }}
                                            placeholder={`Selecciona ${etiqueta.toLowerCase()}`}
                                            title={etiqueta}
                                            className="w-full"
                                            dateButtonClassName={`w-full ${tieneError ? 'border-red-300 hover:border-red-400' : ''}`}
                                        />
                                    ) : campo.type === 'textarea' ? (
                                        <textarea
                                            title={etiqueta}
                                            value={valores[campo.key] || ''}
                                            onChange={e => {
                                                setValores({ ...valores, [campo.key]: e.target.value });
                                                if (erroresCampos[campo.key]) {
                                                    setErroresCampos((prev) => ({ ...prev, [campo.key]: false }));
                                                    setError('');
                                                }
                                            }}
                                            required={requerido}
                                            rows={campo.rows ?? 4}
                                            className={`rounded-md border bg-white px-3 py-2 text-sm text-slate-800 outline-none resize-none dark:bg-slate-800 dark:text-slate-100 ${tieneError ? clasesBordeError : clasesBordeOk} ${campo.inputClassName ?? ''}`}
                                        />
                                    ) : campo.type === 'switch' ? (
                                        <div className="flex items-center gap-2 py-1">
                                            <Switch
                                                id={campo.key}
                                                checked={valores[campo.key] === 'true'}
                                                onCheckedChange={(checked) => {
                                                    setValores({ ...valores, [campo.key]: checked ? 'true' : 'false' });
                                                    if (erroresCampos[campo.key]) {
                                                        setErroresCampos((prev) => ({ ...prev, [campo.key]: false }));
                                                        setError('');
                                                    }
                                                }}
                                            />
                                            <span className="text-xs text-slate-500">
                                                {valores[campo.key] === 'true' ? 'Sí' : 'No'}
                                            </span>
                                        </div>
                                    ) : (
                                        <input
                                            title={etiqueta}
                                            type={campo.type || 'text'}
                                            value={valores[campo.key] || ''}
                                            onChange={e => {
                                                setValores({ ...valores, [campo.key]: e.target.value });
                                                if (erroresCampos[campo.key]) {
                                                    setErroresCampos((prev) => ({ ...prev, [campo.key]: false }));
                                                    setError('');
                                                }
                                            }}
                                            required={requerido}
                                            className={`${clasesInputBase} ${tieneError ? clasesBordeError : clasesBordeOk} ${campo.inputClassName ?? ''}`}
                                        />
                                    )}

                                    {tieneError ? (
                                        <p className="text-[11px] font-medium text-red-600">Obligatorio</p>
                                    ) : null}
                                </div>
                                );
                            })}

                            {error && (
                                <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
                                    {error}
                                </p>
                            )}
                        </div>
                    </ScrollArea>
                </form>
            </ModalBase>

            {confirmacionAbierta && (
                <ModalBase
                    titulo="Descartar cambios"
                    onCerrar={cancelarCierre}
                    ancho="max-w-sm"
                    footer={
                        <div className="flex justify-end gap-2">
                            <Boton type="button" variant="outline" onClick={cancelarCierre}>
                                Seguir editando
                            </Boton>
                            <Boton type="button" variant="destructive" onClick={confirmarCierre}>
                                Descartar
                            </Boton>
                        </div>
                    }
                >
                    <div className="space-y-4">
                        <p className="text-sm text-slate-600 dark:text-slate-300">{mensajeConfirmacion}</p>
                    </div>
                </ModalBase>
            )}
        </>
    );
};

export default FormularioEdicionJerarquia;
