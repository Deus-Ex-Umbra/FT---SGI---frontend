import { useEffect, useMemo, useState } from 'react';
import { ModalBase } from '@/componentes/paginas/inventario/modal-base';
import { Boton } from '@/componentes/ui/button';
import { Label } from '@/componentes/ui/label';
import { Textarea } from '@/componentes/ui/textarea';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/componentes/ui/tabs';
import { listarMisInventarios, obtenerUsuarioActual } from '@/lib/servicio-autenticacion';
import { useInventario } from '@/contextos/ContextoInventario';
import type { EstadoFisicoItemActivo, ItemActivoResumen, PrestamoCanastaRegistro, Estudiante } from '@/tipos/inventario';
import { ESTADOS_FISICOS_ITEM, etiquetaEstadoFisicoItem, normalizarEstadoFisicoItem } from '@/utilidades/estados-fisico-activo';

interface ItemDevolucionFila {
    idHerramienta: string | null;
    codigoInventario: string;
    nombre: string;
    estadoDespachado: EstadoFisicoItemActivo;
    estadoActual: EstadoFisicoItemActivo;
    devuelto: boolean;
    registrado: boolean;
}

interface FungibleDevolucionFila {
    idLote: string;
    lote: string;
    material: string;
    cantidadDespachada: number;
    cantidadDevuelta: number;
    estadoDevuelto: EstadoFisicoItemActivo;
    consumidoTodo: boolean;
}

interface Props {
    canasta: PrestamoCanastaRegistro;
    herramientas: ItemActivoResumen[];
    estudiantes?: Estudiante[];
    onCerrar: () => void;
    onConfirmar: (payload: {
        equipos: Array<{ idHerramienta: string; estadoFisicoDevolucion: string; devuelto: boolean }>;
        consumibles: Array<{ idLote: string; cantidadDevuelta: number; estadoDevuelto?: string }>;
        carnetsDevueltos: string[];
        observaciones: string;
    }) => Promise<boolean | void>;
}

const construirBloqueCambios = (items: ItemDevolucionFila[]): string => {
    const cambios = items
        .filter((i) => i.devuelto && i.estadoDespachado !== i.estadoActual)
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

export const DialogoDevolverCanasta = ({ canasta, herramientas, estudiantes, onCerrar, onConfirmar }: Props) => {
    const [guardando, setGuardando] = useState(false);
    const [error, setError] = useState('');
    const { materiales } = useInventario();
    const [misInventarios, setMisInventarios] = useState<Array<{ id: number; nombre: string; puedeEditarFungibles?: boolean; puedeEditarFijos?: boolean }>>([]);

    useEffect(() => {
        const cargar = async () => {
            try {
                const lista = await listarMisInventarios();
                setMisInventarios(lista);
            } catch (err) {
                console.error(err);
            }
        };
        cargar();
    }, []);

    const tienePermisoFungibles = useMemo(() => {
        let idInv: number | null = null;
        if (canasta.cosas && canasta.cosas.length > 0) {
            for (const cosa of canasta.cosas) {
                if (cosa.idHerramienta) {
                    const h = herramientas.find(it => String(it.id) === String(cosa.idHerramienta));
                    if (h?.idInventario) {
                        idInv = Number(h.idInventario);
                        break;
                    }
                }
            }
        }
        if (!idInv && canasta.consumibles && canasta.consumibles.length > 0) {
            for (const cons of canasta.consumibles) {
                if (cons.idActivoFungible) {
                    const m = materiales.find(it => Number(it.id) === Number(cons.idActivoFungible));
                    if (m?.idInventario) {
                        idInv = Number(m.idInventario);
                        break;
                    }
                }
                if (cons.idLote) {
                    const m = materiales.find(m => m.subinstancias.some(sub => String(sub.id) === String(cons.idLote)));
                    if (m?.idInventario) {
                        idInv = Number(m.idInventario);
                        break;
                    }
                }
            }
        }
        
        const usuario = obtenerUsuarioActual();
        if (usuario?.rol === 'administrador') return true;
        
        let idAUsar = idInv;
        if (!idAUsar && misInventarios.length === 1) {
            idAUsar = misInventarios[0].id;
        }
        if (!idAUsar && usuario?.id_inventario) {
            idAUsar = usuario.id_inventario;
        }

        if (!idAUsar) return false;

        const inv = misInventarios.find(i => Number(i.id) === Number(idAUsar));
        if (inv?.puedeEditarFungibles !== undefined) return inv.puedeEditarFungibles === true;
        
        if (usuario?.id_inventario === Number(idAUsar)) return usuario?.puedeEditarFungibles === true;
        
        return false;
    }, [canasta, herramientas, materiales, misInventarios]);

    const tienePermisoFijos = useMemo(() => {
        let idInv: number | null = null;
        if (canasta.cosas && canasta.cosas.length > 0) {
            for (const cosa of canasta.cosas) {
                if (cosa.idHerramienta) {
                    const h = herramientas.find(it => String(it.id) === String(cosa.idHerramienta));
                    if (h?.idInventario) {
                        idInv = Number(h.idInventario);
                        break;
                    }
                }
            }
        }
        if (!idInv && canasta.consumibles && canasta.consumibles.length > 0) {
            for (const cons of canasta.consumibles) {
                if (cons.idActivoFungible) {
                    const m = materiales.find(it => Number(it.id) === Number(cons.idActivoFungible));
                    if (m?.idInventario) {
                        idInv = Number(m.idInventario);
                        break;
                    }
                }
                if (cons.idLote) {
                    const m = materiales.find(m => m.subinstancias.some(sub => String(sub.id) === String(cons.idLote)));
                    if (m?.idInventario) {
                        idInv = Number(m.idInventario);
                        break;
                    }
                }
            }
        }
        
        const usuario = obtenerUsuarioActual();
        if (usuario?.rol === 'administrador') return true;
        
        let idAUsar = idInv;
        if (!idAUsar && misInventarios.length === 1) {
            idAUsar = misInventarios[0].id;
        }
        if (!idAUsar && usuario?.id_inventario) {
            idAUsar = usuario.id_inventario;
        }

        if (!idAUsar) return false;

        const inv = misInventarios.find(i => Number(i.id) === Number(idAUsar));
        if (inv?.puedeEditarFijos !== undefined) return inv.puedeEditarFijos === true;
        
        if (usuario?.id_inventario === Number(idAUsar)) return usuario?.puedeEditarFijos === true;
        
        return false;
    }, [canasta, herramientas, materiales, misInventarios]);

    const tieneFijosSolicitados = canasta.cosas && canasta.cosas.length > 0;
    const tieneFungiblesSolicitados = canasta.consumibles && canasta.consumibles.length > 0;

    const mostrarTabs = tienePermisoFungibles || tienePermisoFijos;
    const estudiantesConCarnetRetenido = useMemo(() => {
        const CIs = canasta.carnetsEstudiantes?.length 
            ? canasta.carnetsEstudiantes 
            : (canasta.carnetEstudiante ? [canasta.carnetEstudiante] : []);
        
        return (estudiantes ?? []).filter(
            (e) => CIs.includes(e.carnet) && e.carnetRetenido === true
        );
    }, [canasta, estudiantes]);

    const [carnetsDevueltos, setCarnetsDevueltos] = useState<string[]>([]);

    useEffect(() => {
        setCarnetsDevueltos(estudiantesConCarnetRetenido.map(e => e.carnet));
    }, [estudiantesConCarnetRetenido]);
    const filasInicialesFijos = useMemo<ItemDevolucionFila[]>(() => {
        return (canasta.cosas ?? [])
            .map((cosa) => {
                const h = herramientas.find((it) => it.id === cosa.idHerramienta);
                const fisico = normalizarEstadoFisicoItem(h?.estadoFisico) ?? 'bueno';
                const registrado = cosa.registrado !== false;
                return {
                    idHerramienta: cosa.idHerramienta,
                    codigoInventario: String(cosa.codigoInventario ?? h?.codigoInventario ?? '').trim(),
                    nombre: String(cosa.nombre ?? h?.nombre ?? 'Activo').trim(),
                    estadoDespachado: fisico,
                    estadoActual: fisico,
                    devuelto: registrado,
                    registrado,
                };
            });
    }, [canasta.cosas, herramientas]);

    const [filasFijos, setFilasFijos] = useState<ItemDevolucionFila[]>(filasInicialesFijos);
    const filasInicialesFungibles = useMemo<FungibleDevolucionFila[]>(() => {
        return (canasta.consumibles ?? []).map((c) => {
            const cantidadDesp = Number(c.cantidadDespachada ?? c.cantidadSolicitada ?? 0);
            return {
                idLote: c.idLote || '',
                lote: c.lote || 'Lote',
                material: c.material || 'Material',
                cantidadDespachada: cantidadDesp,
                cantidadDevuelta: 0,
                estadoDevuelto: 'bueno',
                consumidoTodo: true,
            };
        });
    }, [canasta.consumibles]);

    const [filasFungibles, setFilasFungibles] = useState<FungibleDevolucionFila[]>(filasInicialesFungibles);

    const bloqueCambios = useMemo(() => construirBloqueCambios(filasFijos), [filasFijos]);

    const [observaciones, setObservaciones] = useState(() => mergeObservaciones(canasta.observaciones ?? '', bloqueCambios));
    const [observacionesEditadas, setObservacionesEditadas] = useState(false);

    useEffect(() => {
        setFilasFijos(filasInicialesFijos);
        setFilasFungibles(filasInicialesFungibles);
    }, [filasInicialesFijos, filasInicialesFungibles]);

    useEffect(() => {
        setError('');
        setObservacionesEditadas(false);
        setObservaciones(mergeObservaciones(canasta.observaciones ?? '', construirBloqueCambios(filasInicialesFijos)));
    }, [canasta.id, canasta.observaciones, filasInicialesFijos]);

    useEffect(() => {
        if (observacionesEditadas) return;
        setObservaciones((prev) => {
            const base = canasta.observaciones ?? '';
            const next = mergeObservaciones(base, bloqueCambios);
            return prev === next ? prev : next;
        });
    }, [bloqueCambios, canasta.observaciones, observacionesEditadas]);

    const handleToggleFijoDevuelto = (idHerramienta: string | null, devuelto: boolean) => {
        setFilasFijos((prev) =>
            prev.map((f) => (f.idHerramienta === idHerramienta ? { ...f, devuelto } : f))
        );
    };

    const handleEstadoActualChange = (idHerramienta: string | null, estado: EstadoFisicoItemActivo) => {
        setFilasFijos((prev) =>
            prev.map((f) => (f.idHerramienta === idHerramienta ? { ...f, estadoActual: estado } : f))
        );
    };

    const handleToggleConsumidoTodo = (idLote: string, checked: boolean) => {
        setFilasFungibles((prev) =>
            prev.map((f) => {
                if (f.idLote === idLote) {
                    return {
                        ...f,
                        consumidoTodo: checked,
                        cantidadDevuelta: checked ? 0 : f.cantidadDespachada,
                    };
                }
                return f;
            })
        );
    };

    const handleFungibleCantChange = (idLote: string, cant: number) => {
        setFilasFungibles((prev) =>
            prev.map((f) => (f.idLote === idLote ? { ...f, cantidadDevuelta: Math.max(0, Math.min(f.cantidadDespachada, cant)) } : f))
        );
    };

    const handleFungibleEstadoChange = (idLote: string, estado: EstadoFisicoItemActivo) => {
        setFilasFungibles((prev) =>
            prev.map((f) => (f.idLote === idLote ? { ...f, estadoDevuelto: estado } : f))
        );
    };

    const handleToggleCarnet = (carnet: string, checked: boolean) => {
        setCarnetsDevueltos((prev) =>
            checked ? [...prev, carnet] : prev.filter((c) => c !== carnet)
        );
    };

    const formId = `dialogo-devolver-canasta-${canasta.id}`;

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        try {
            setGuardando(true);
            const result = await onConfirmar({
                equipos: filasFijos
                    .filter((f) => f.registrado)
                    .map((f) => ({
                        idHerramienta: f.idHerramienta!,
                        estadoFisicoDevolucion: f.estadoActual,
                        devuelto: f.devuelto,
                    })),
                consumibles: filasFungibles.map((f) => ({
                    idLote: f.idLote,
                    cantidadDevuelta: f.cantidadDevuelta,
                    estadoDevuelto: f.estadoDevuelto,
                })),
                carnetsDevueltos,
                observaciones: observaciones.trim(),
            });
            if (result !== false) {
                onCerrar();
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'No se pudo devolver la canasta.');
        } finally {
            setGuardando(false);
        }
    };

    const renderFijosSeccion = () => {
        return (
            <div className="space-y-2">
                <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                    <table className="w-full text-xs">
                        <thead>
                            <tr className="border-b border-slate-200 bg-slate-50 text-[10px] uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
                                <th className="px-3 py-2 text-left w-12">Devolver</th>
                                <th className="px-3 py-2 text-left">Activo</th>
                                <th className="px-3 py-2 text-left w-24">Entregado</th>
                                <th className="px-3 py-2 text-left w-48">Estado devolución (modificar)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {filasFijos.map((fila) => {
                                const esNoDespachado = !fila.registrado;
                                return (
                                    <tr key={fila.idHerramienta} className={`hover:bg-slate-50 dark:hover:bg-slate-800/40 ${esNoDespachado ? 'opacity-50 bg-slate-50/50 dark:bg-slate-900/45' : ''}`}>
                                        <td className="px-3 py-2 text-center">
                                            <input
                                                type="checkbox"
                                                checked={fila.devuelto}
                                                disabled={esNoDespachado}
                                                onChange={(e) => handleToggleFijoDevuelto(fila.idHerramienta, e.target.checked)}
                                                className="h-4 w-4 cursor-pointer rounded border-slate-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                                title={esNoDespachado ? "No despachado" : "Marcar como devuelto"}
                                            />
                                        </td>
                                        <td className="px-3 py-2 min-w-0">
                                            <div className="font-semibold text-slate-800 dark:text-slate-100 max-w-[250px] truncate" title={`[${fila.codigoInventario || '—'}] ${fila.nombre}`}>
                                                [{fila.codigoInventario || '—'}] {fila.nombre}
                                                {esNoDespachado && (
                                                    <span className="ml-2 rounded-full bg-slate-200 px-2 py-0.5 text-[9px] font-semibold text-slate-650 dark:bg-slate-800 dark:text-slate-400">
                                                        No despachado
                                                    </span>
                                                )}
                                            </div>
                                            <div className="text-[10px] text-slate-400">ID: {fila.idHerramienta}</div>
                                        </td>
                                        <td className="px-3 py-2 text-slate-600 dark:text-slate-300">
                                            {esNoDespachado ? '—' : etiquetaEstadoFisicoItem(fila.estadoDespachado)}
                                        </td>
                                        <td className="px-3 py-2">
                                            <select
                                                title="Estado físico al devolver"
                                                value={fila.estadoActual}
                                                disabled={!fila.devuelto || esNoDespachado}
                                                onChange={(e) => handleEstadoActualChange(fila.idHerramienta, e.target.value as EstadoFisicoItemActivo)}
                                                className="h-8 w-full rounded-md border border-slate-200 bg-white px-2 text-xs text-slate-700 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 disabled:bg-slate-50 disabled:text-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:disabled:bg-slate-950"
                                            >
                                                {ESTADOS_FISICOS_ITEM.map((e) => (
                                                    <option key={e} value={e}>{etiquetaEstadoFisicoItem(e)}</option>
                                                ))}
                                            </select>
                                        </td>
                                    </tr>
                                );
                            })}
                            {filasFijos.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="px-3 py-4 text-center text-slate-500 dark:text-slate-400">
                                        No hay activos en esta canasta.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    const renderFungiblesSeccion = () => {
        return (
            <div className="space-y-2">
                <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                    <table className="w-full text-xs">
                        <thead>
                            <tr className="border-b border-slate-200 bg-slate-50 text-[10px] uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
                                <th className="px-3 py-2 text-left">Material / Lote</th>
                                <th className="px-3 py-2 text-center w-24">Despachado</th>
                                <th className="px-3 py-2 text-center w-32">Consumido todo</th>
                                <th className="px-3 py-2 text-center w-32">Cantidad Devuelta</th>
                                <th className="px-3 py-2 text-left w-48">Estado material devuelto</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {filasFungibles.map((fila) => (
                                <tr key={fila.idLote} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                                    <td className="px-3 py-2 min-w-0">
                                        <div className="font-semibold text-slate-800 dark:text-slate-100 max-w-[200px] truncate" title={fila.material}>{fila.material}</div>
                                        <div className="text-[10px] text-slate-400">Lote: {fila.lote} | ID: {fila.idLote}</div>
                                    </td>
                                    <td className="px-3 py-2 text-center text-slate-600 dark:text-slate-300">
                                        {fila.cantidadDespachada}
                                    </td>
                                    <td className="px-3 py-2 text-center">
                                        <input
                                            type="checkbox"
                                            checked={fila.consumidoTodo}
                                            onChange={(e) => handleToggleConsumidoTodo(fila.idLote, e.target.checked)}
                                            className="h-4 w-4 cursor-pointer rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                        />
                                    </td>
                                    <td className="px-3 py-2">
                                        <input
                                            type="number"
                                            title="Cantidad devuelta"
                                            value={fila.cantidadDevuelta}
                                            min={0}
                                            max={fila.cantidadDespachada}
                                            disabled={fila.consumidoTodo}
                                            onChange={(e) => handleFungibleCantChange(fila.idLote, Number(e.target.value))}
                                            className="h-8 w-full rounded-md border border-slate-200 bg-white px-2 text-center text-xs text-slate-700 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 disabled:bg-slate-50 disabled:text-slate-400"
                                        />
                                    </td>
                                    <td className="px-3 py-2">
                                        <select
                                            title="Estado del material devuelto"
                                            value={fila.estadoDevuelto}
                                            disabled={fila.cantidadDevuelta <= 0}
                                            onChange={(e) => handleFungibleEstadoChange(fila.idLote, e.target.value as EstadoFisicoItemActivo)}
                                            className="h-8 w-full rounded-md border border-slate-200 bg-white px-2 text-xs text-slate-700 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 disabled:bg-slate-50 disabled:text-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:disabled:bg-slate-950"
                                        >
                                            {ESTADOS_FISICOS_ITEM.map((e) => (
                                                <option key={e} value={e}>{etiquetaEstadoFisicoItem(e)}</option>
                                            ))}
                                        </select>
                                    </td>
                                </tr>
                            ))}
                            {filasFungibles.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-3 py-4 text-center text-slate-500 dark:text-slate-400">
                                        No hay materiales fungibles en esta canasta.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        );
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
                    <Boton
                        type="button"
                        variant="outline"
                        onClick={onCerrar}
                        disabled={guardando}
                        className="h-9 px-4 text-xs"
                    >
                        Cancelar
                    </Boton>
                    <Boton type="submit" form={formId} className="h-9 px-5 text-xs" disabled={guardando}>
                        {guardando ? 'Devolviendo...' : 'Confirmar devolución'}
                    </Boton>
                </div>
            }
        >
            <div className="flex-1 min-h-0 overflow-y-auto overflow-x-auto scroll-elegante">
                <form id={formId} onSubmit={submit} className="space-y-4 p-4 sm:p-6">
                    <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
                        <div className="grid grid-cols-1 gap-1 sm:grid-cols-3">
                            <div><span className="font-semibold">Estudiante:</span> {canasta.carnetsEstudiantes?.join(', ') || canasta.carnetEstudiante}</div>
                            <div><span className="font-semibold">Docente:</span> {canasta.docente}</div>
                            <div><span className="font-semibold">Estado:</span> <span className="capitalize">{canasta.estado}</span></div>
                        </div>
                    </div>
                    {mostrarTabs ? (
                        <Tabs defaultValue={tieneFijosSolicitados ? "equipos" : "materiales"} className="w-full">
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="equipos" className="text-xs">Activos Fijos (Equipos)</TabsTrigger>
                                <TabsTrigger value="materiales" className="text-xs">Materiales Fungibles</TabsTrigger>
                            </TabsList>
                            <TabsContent value="equipos" className="mt-4 space-y-4">
                                {renderFijosSeccion()}
                            </TabsContent>
                            <TabsContent value="materiales" className="mt-4 space-y-4">
                                {renderFungiblesSeccion()}
                            </TabsContent>
                        </Tabs>
                    ) : tienePermisoFungibles && tieneFungiblesSolicitados ? (
                        <div className="space-y-2">
                            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Materiales Fungibles</h3>
                            {renderFungiblesSeccion()}
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Activos Fijos (Equipos)</h3>
                            {renderFijosSeccion()}
                        </div>
                    )}
                    <div className="space-y-1">
                        <Label className="text-xs font-medium text-slate-700 dark:text-slate-300">Observaciones</Label>
                        <Textarea
                            value={observaciones}
                            onChange={(e) => {
                                setObservacionesEditadas(true);
                                setObservaciones(e.target.value);
                            }}
                            rows={4}
                            className="w-full text-xs"
                            placeholder="Observaciones de devolución..."
                        />
                        {bloqueCambios ? (
                            <p className="text-[11px] text-slate-400">Se generó automáticamente un resumen de cambios de estado físico.</p>
                        ) : (
                            <p className="text-[11px] text-slate-400">Sin cambios de estado físico detectados.</p>
                        )}
                    </div>
                    {estudiantesConCarnetRetenido.length > 0 && (
                        <div className="space-y-2">
                            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Devolución de Carnet / Credenciales</h3>
                            <div className="rounded-lg border border-amber-200 bg-amber-50/20 p-3 space-y-2 dark:border-amber-900/40 dark:bg-amber-950/10">
                                <p className="text-[11px] text-amber-700 dark:text-amber-300 mb-2">Marca los estudiantes a quienes se les está devolviendo/liberando su carnet retenido.</p>
                                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                    {estudiantesConCarnetRetenido.map((e) => {
                                        const checked = carnetsDevueltos.includes(e.carnet);
                                        return (
                                            <div key={e.carnet} className="flex items-center gap-2 rounded-md border border-slate-100 p-2 bg-white dark:border-slate-800 dark:bg-slate-900 hover:bg-slate-50/50 min-w-0">
                                                <input
                                                    type="checkbox"
                                                    id={`devolver-${e.carnet}`}
                                                    checked={checked}
                                                    onChange={(ev) => handleToggleCarnet(e.carnet, ev.target.checked)}
                                                    className="h-4 w-4 cursor-pointer rounded border-slate-300 text-blue-600 focus:ring-blue-500 shrink-0"
                                                />
                                                <Label htmlFor={`devolver-${e.carnet}`} className="cursor-pointer select-none text-xs font-medium text-slate-700 dark:text-slate-300 truncate max-w-[200px] sm:max-w-[280px]" title={`${e.nombre} ${e.apellido} (CI: ${e.carnet})`}>
                                                    {e.nombre} {e.apellido} (CI: {e.carnet})
                                                </Label>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}

                    {error ? (
                        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-300">
                            {error}
                        </div>
                    ) : null}
                </form>
            </div>
        </ModalBase>
    );
};
