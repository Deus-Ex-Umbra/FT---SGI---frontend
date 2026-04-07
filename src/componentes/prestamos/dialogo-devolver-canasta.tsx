import { useEffect, useMemo, useState } from 'react';
import { ModalBase } from '@/componentes/inventario/modal-base';
import { Boton } from '@/componentes/ui/button';
import { ScrollArea } from '@/componentes/ui/scroll-area';
import type { EstadoFisicoItemActivo, ItemActivoResumen, PrestamoCanastaRegistro } from '@/tipos/inventario';
import { ESTADOS_FISICOS_ITEM, etiquetaEstadoFisicoItem, normalizarEstadoFisicoItem } from '@/lib/estados-fisico-activo';

interface ItemDevolucionFila {
    idHerramienta: string;
    codigoInventario: string;
    nombre: string;
    estadoDespachado: EstadoFisicoItemActivo;
    estadoActual: EstadoFisicoItemActivo;
}

interface Props {
    canasta: PrestamoCanastaRegistro;
    herramientas: ItemActivoResumen[];
    onCerrar: () => void;
    onConfirmar: (payload: {
        estados: Array<{ idHerramienta: string; estadoDespachado: EstadoFisicoItemActivo; estadoActual: EstadoFisicoItemActivo }>;
        observaciones: string;
    }) => Promise<void>;
}

const construirBloqueCambios = (items: ItemDevolucionFila[]): string => {
    const cambios = items
        .filter((i) => i.estadoDespachado !== i.estadoActual)
        .map((i) => `- [${i.codigoInventario || '—'}] ${i.nombre}: ${etiquetaEstadoFisicoItem(i.estadoDespachado)} → ${etiquetaEstadoFisicoItem(i.estadoActual)}`);

    if (cambios.length === 0) return '';

    return `Devolución (estado físico):\n${cambios.join('\n')}`;
};

const mergeObservaciones = (base: string, bloque: string): string => {
    const baseLimpia = String(base ?? '').trim();
    const bloqueLimpio = String(bloque ?? '').trim();
    if (!baseLimpia) return bloqueLimpio;
    if (!bloqueLimpio) return baseLimpia;
    return `${baseLimpia}\n\n${bloqueLimpio}`;
};

export const DialogoDevolverCanasta = ({ canasta, herramientas, onCerrar, onConfirmar }: Props) => {
    const [guardando, setGuardando] = useState(false);
    const [error, setError] = useState('');

    const filasIniciales = useMemo<ItemDevolucionFila[]>(() => {
        return (canasta.cosas ?? []).map((cosa) => {
            const h = herramientas.find((it) => it.id === cosa.idHerramienta);
            const fisico = normalizarEstadoFisicoItem(h?.estadoFisico) ?? 'bueno';
            return {
                idHerramienta: cosa.idHerramienta,
                codigoInventario: String(cosa.codigoInventario ?? h?.codigoInventario ?? '').trim(),
                nombre: String(cosa.nombre ?? h?.nombre ?? 'Activo').trim(),
                estadoDespachado: fisico,
                estadoActual: fisico,
            };
        });
    }, [canasta.cosas, herramientas]);

    const [filas, setFilas] = useState<ItemDevolucionFila[]>(filasIniciales);

    useEffect(() => {
        setFilas(filasIniciales);
    }, [filasIniciales]);

    const bloqueCambios = useMemo(() => construirBloqueCambios(filas), [filas]);

    const [observaciones, setObservaciones] = useState(() => mergeObservaciones(canasta.observaciones, bloqueCambios));
    const [observacionesEditadas, setObservacionesEditadas] = useState(false);

    useEffect(() => {
        setError('');
        setObservacionesEditadas(false);
        setObservaciones(mergeObservaciones(canasta.observaciones, construirBloqueCambios(filasIniciales)));
    }, [canasta.id, canasta.observaciones, filasIniciales]);

    useEffect(() => {
        if (observacionesEditadas) return;
        setObservaciones((prev) => {
            // Si el usuario todavía no tocó el campo, lo mantenemos sincronizado con cambios.
            const base = canasta.observaciones;
            const next = mergeObservaciones(base, bloqueCambios);
            // Evitar re-renderes si no cambia.
            return prev === next ? prev : next;
        });
    }, [bloqueCambios, canasta.observaciones, observacionesEditadas]);

    const formId = `dialogo-devolver-canasta-${canasta.id}`;

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        try {
            setGuardando(true);
            await onConfirmar({
                estados: filas.map((f) => ({
                    idHerramienta: f.idHerramienta,
                    estadoDespachado: f.estadoDespachado,
                    estadoActual: f.estadoActual,
                })),
                observaciones: observaciones.trim(),
            });
            onCerrar();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'No se pudo devolver la canasta.');
        } finally {
            setGuardando(false);
        }
    };

    return (
        <ModalBase
            titulo={`Devolver canasta #${canasta.id}`}
            onCerrar={onCerrar}
            ancho="max-w-3xl"
            dialogClassName="h-[90vh]"
            bodyClassName="flex min-h-0 flex-col p-0"
            footer={
                <div className="flex items-center justify-end gap-2">
                    <button
                        type="button"
                        onClick={onCerrar}
                        disabled={guardando}
                        className="h-9 rounded-md border border-slate-200 px-4 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:text-slate-400"
                    >
                        Cancelar
                    </button>
                    <Boton type="submit" form={formId} className="h-9 px-5 text-xs" disabled={guardando}>
                        {guardando ? 'Devolviendo...' : 'Confirmar devolución'}
                    </Boton>
                </div>
            }
        >
            <ScrollArea type="auto" className="flex-1 min-h-0">
                <form id={formId} onSubmit={submit} className="space-y-4 p-4 sm:p-6">
                    <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
                        <div className="grid grid-cols-1 gap-1 sm:grid-cols-3">
                            <div><span className="font-semibold">Estudiante:</span> {canasta.carnetsEstudiantes.join(', ') || canasta.carnetEstudiante}</div>
                            <div><span className="font-semibold">Docente:</span> {canasta.docente}</div>
                            <div><span className="font-semibold">Estado:</span> {canasta.estado}</div>
                        </div>
                    </div>

                    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                        <table className="w-full text-xs">
                            <thead>
                                <tr className="border-b border-slate-200 bg-slate-50 text-[10px] uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
                                    <th className="px-3 py-2 text-left">Activo</th>
                                    <th className="px-3 py-2 text-left">Despachado</th>
                                    <th className="px-3 py-2 text-left">Estado actual (modificar)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {filas.map((fila) => (
                                    <tr key={fila.idHerramienta} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                                        <td className="px-3 py-2">
                                            <div className="font-semibold text-slate-800 dark:text-slate-100">[{fila.codigoInventario || '—'}] {fila.nombre}</div>
                                            <div className="text-[10px] text-slate-400">ID: {fila.idHerramienta}</div>
                                        </td>
                                        <td className="px-3 py-2 text-slate-600 dark:text-slate-300">
                                            {etiquetaEstadoFisicoItem(fila.estadoDespachado)}
                                        </td>
                                        <td className="px-3 py-2">
                                            <select
                                                title="Estado físico actual"
                                                value={fila.estadoActual}
                                                onChange={(e) => {
                                                    const v = String(e.target.value ?? '').trim() as EstadoFisicoItemActivo;
                                                    if (!v) return;
                                                    setFilas((prev) => prev.map((p) => p.idHerramienta === fila.idHerramienta ? { ...p, estadoActual: v } : p));
                                                }}
                                                className="h-8 w-full rounded-md border border-slate-200 bg-white px-2 text-xs text-slate-700 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                                            >
                                                {ESTADOS_FISICOS_ITEM.map((e) => (
                                                    <option key={e} value={e}>{etiquetaEstadoFisicoItem(e)}</option>
                                                ))}
                                            </select>
                                        </td>
                                    </tr>
                                ))}

                                {filas.length === 0 && (
                                    <tr>
                                        <td colSpan={3} className="px-3 py-4 text-center text-slate-500 dark:text-slate-400">
                                            No hay activos en esta canasta.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Observaciones</label>
                        <textarea
                            value={observaciones}
                            onChange={(e) => {
                                setObservacionesEditadas(true);
                                setObservaciones(e.target.value);
                            }}
                            rows={4}
                            className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                            placeholder="Observaciones de devolución..."
                        />
                        {bloqueCambios ? (
                            <p className="text-[11px] text-slate-400">Se generó automáticamente un resumen de cambios de estado físico.</p>
                        ) : (
                            <p className="text-[11px] text-slate-400">Sin cambios de estado físico detectados.</p>
                        )}
                    </div>

                    {error ? (
                        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-300">
                            {error}
                        </div>
                    ) : null}
                </form>
            </ScrollArea>
        </ModalBase>
    );
};
