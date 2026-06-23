import { useEffect, useMemo, useState } from 'react';
import { ModalBase } from '@/componentes/paginas/inventario/modal-base';
import { Boton } from '@/componentes/ui/button';
import { Label } from '@/componentes/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/componentes/ui/tabs';
import { Combobox, ComboboxContent, ComboboxEmpty, ComboboxInput, ComboboxItem, ComboboxList } from '@/componentes/ui/combobox';
import { listarMisInventarios, obtenerUsuarioActual } from '@/lib/servicio-autenticacion';
import { useInventario } from '@/contextos/ContextoInventario';
import type { EstadoFisicoItemActivo, ItemActivoResumen, PrestamoCanastaRegistro, Estudiante } from '@/tipos/inventario';
import { ESTADOS_FISICOS_ITEM, etiquetaEstadoFisicoItem, normalizarEstadoFisicoItem } from '@/utilidades/estados-fisico-activo';
import { Plus, Trash2 } from 'lucide-react';

interface Props {
    canasta: PrestamoCanastaRegistro;
    herramientas: ItemActivoResumen[];
    estudiantes?: Estudiante[];
    onCerrar: () => void;
    onConfirmar: (payload: {
        equipos?: Array<{ idPrestamo?: string | number | null; idHerramienta: string | null; registrado: boolean; estadoFisicoEntrega?: string }>;
        consumibles?: Array<{ idLote: string; cantidad: number }>;
        carnetsRetenidos: string[];
    }) => Promise<void>;
}

interface FilaDespachoFijo {
    idFila: string;
    idPrestamo?: string | number | null;
    idHerramienta: string | null;
    idContenedor?: number | null;
    nombreContenedor?: string | null;
    codigoInventario: string | null;
    nombre: string;
    registrado: boolean;
    estadoFisicoEntrega: EstadoFisicoItemActivo;
    esNuevo?: boolean;
}

interface FilaDespachoFungible {
    idFila: string;
    idPrestamo?: string | number | null;
    idLote: string | null;
    idActivoFungible: number | null;
    idContenedor: number | null;
    lote: string;
    material: string;
    cantidadSolicitada: number;
    cantidadDespachada: number;
    unidad?: string;
    tipoCantidad?: 'entero' | 'decimal';
}

export const DialogoDespacharCanasta = ({ canasta, herramientas, estudiantes, onCerrar, onConfirmar }: Props) => {
    const [guardando, setGuardando] = useState(false);
    const [error, setError] = useState('');
    const [herramientaSeleccionadaId, setHerramientaSeleccionadaId] = useState('');
    const [fungibleSeleccionadoId, setFungibleSeleccionadoId] = useState('');
    const { materiales, contenedoresMateriales } = useInventario();
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

    const idInventarioCalculado = useMemo(() => {
        let idInv: number | null = canasta.idInventario ? Number(canasta.idInventario) : null;
        if (!idInv && canasta.cosas && canasta.cosas.length > 0) {
            for (const cosa of canasta.cosas) {
                if (cosa.idHerramienta) {
                    const h = herramientas.find(it => String(it.id) === String(cosa.idHerramienta));
                    if (h?.idInventario) {
                        idInv = Number(h.idInventario);
                        break;
                    }
                }
                if (cosa.idContenedor) {
                    const h = herramientas.find(it => String(it.contenedorId) === String(cosa.idContenedor));
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
        return idInv;
    }, [canasta, herramientas, materiales]);

    const tienePermisoFungibles = useMemo(() => {
        const usuario = obtenerUsuarioActual();
        if (usuario?.rol === 'administrador') return true;
        if (!idInventarioCalculado) return false;
        if (usuario?.id_inventario === Number(idInventarioCalculado)) return usuario?.puedeEditarFungibles === true;
        
        const inv = misInventarios.find(i => Number(i.id) === Number(idInventarioCalculado));
        return inv ? inv.puedeEditarFungibles === true : false;
    }, [idInventarioCalculado, misInventarios]);

    const tienePermisoFijos = useMemo(() => {
        const usuario = obtenerUsuarioActual();
        if (usuario?.rol === 'administrador') return true;
        if (!idInventarioCalculado) return false;
        if (usuario?.id_inventario === Number(idInventarioCalculado)) return usuario?.puedeEditarFijos === true;
        
        const inv = misInventarios.find(i => Number(i.id) === Number(idInventarioCalculado));
        return inv ? inv.puedeEditarFijos === true : false;
    }, [idInventarioCalculado, misInventarios]);

    const tieneFijosSolicitados = canasta.cosas && canasta.cosas.length > 0;
    const tieneFungiblesSolicitados = canasta.consumibles && canasta.consumibles.length > 0;

    const mostrarTabs = tienePermisoFungibles || tienePermisoFijos;

    const estudiantesCanasta = useMemo(() => {
        const CIs = canasta.estudiantes?.length
            ? canasta.estudiantes.map(e => e.carnet)
            : (canasta.carnetsEstudiantes?.length
                ? canasta.carnetsEstudiantes
                : (canasta.carnetEstudiante ? [canasta.carnetEstudiante] : []));
        
        const found = (estudiantes ?? []).filter(e => CIs.includes(e.carnet));
        
        return CIs.map(carnet => {
            const matchSystem = found.find(e => e.carnet === carnet);
            if (matchSystem) return matchSystem;
            const matchCanasta = canasta.estudiantes?.find(e => e.carnet === carnet);
            return {
                carnet,
                nombre: matchCanasta?.nombre || '',
                apellido: matchCanasta?.apellido || '',
                carrera: matchCanasta?.carrera || '',
                cu: matchCanasta?.cu || '',
                carnetRetenido: matchCanasta?.carnetRetenido || false,
            } as Estudiante;
        });
    }, [canasta, estudiantes]);
    const [carnetsRetenidos, setCarnetsRetenidos] = useState<string[]>([]);

    useEffect(() => {
        setCarnetsRetenidos(estudiantesCanasta.map(e => e.carnet));
    }, [estudiantesCanasta]);
    const filasInicialesFijos = useMemo<FilaDespachoFijo[]>(() => {
        return (canasta.cosas ?? []).filter((cosa: any) => {
            if (cosa.idContenedor) {
                const isFungible = contenedoresMateriales?.some(c => String(c.id) === String(cosa.idContenedor));
                if (isFungible) return false;
            }
            return true;
        }).map((cosa: any) => {
            const h = cosa.idHerramienta ? herramientas.find((it) => it.id === cosa.idHerramienta) : null;
            const fisico = normalizarEstadoFisicoItem(h?.estadoFisico) ?? 'bueno';
            return {
                idFila: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(7),
                idPrestamo: cosa.idPrestamo,
                idHerramienta: cosa.idHerramienta,
                idContenedor: cosa.idContenedor,
                nombreContenedor: cosa.nombreContenedor,
                codigoInventario: cosa.codigoInventario ? String(cosa.codigoInventario).trim() : null,
                nombre: String(cosa.nombre ?? h?.nombre ?? 'Activo').trim(),
                registrado: cosa.registrado,
                estadoFisicoEntrega: fisico,
            };
        });
    }, [canasta.cosas, herramientas, contenedoresMateriales]);

    const [filasFijos, setFilasFijos] = useState<FilaDespachoFijo[]>(filasInicialesFijos);
    const filasInicialesFungibles = useMemo<FilaDespachoFungible[]>(() => {
        const consumiblesRows = (canasta.consumibles ?? []).map((c: any) => {
            const cantidadSol = Number(c.cantidadSolicitada ?? 0);
            let idActivoFungibleNum = c.idActivoFungible ? Number(c.idActivoFungible) : null;
            let unidad = 'uds';
            let tipoCantidad: 'entero' | 'decimal' | undefined = undefined;
            
            if (!idActivoFungibleNum && c.idLote) {
                const mat = materiales.find(m => m.subinstancias.some(sub => String(sub.id) === String(c.idLote)));
                if (mat) {
                    idActivoFungibleNum = Number(mat.id);
                    unidad = mat.unidad || 'uds';
                    tipoCantidad = mat.tipoCantidad;
                } else {
                    for (const cont of contenedoresMateriales || []) {
                        for (const mat of cont.materiales) {
                            if (mat.subinstancias.some(sub => String(sub.id) === String(c.idLote))) {
                                idActivoFungibleNum = Number(mat.id);
                                unidad = mat.unidad || 'uds';
                                tipoCantidad = mat.tipoCantidad;
                                break;
                            }
                        }
                    }
                }
            } else if (idActivoFungibleNum) {
                const mat = materiales.find(m => Number(m.id) === idActivoFungibleNum);
                if (mat) {
                    unidad = mat.unidad;
                    tipoCantidad = mat.tipoCantidad;
                } else {
                    for (const cont of contenedoresMateriales || []) {
                        const mat = cont.materiales.find(m => Number(m.id) === idActivoFungibleNum);
                        if (mat && mat.unidad) {
                            unidad = mat.unidad;
                            tipoCantidad = mat.tipoCantidad;
                            break;
                        }
                    }
                }
            }

            return {
                idFila: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(7),
                idPrestamo: null,
                idLote: c.idLote || null,
                idActivoFungible: idActivoFungibleNum,
                idContenedor: c.idContenedor ? Number(c.idContenedor) : null,
                lote: c.lote || (c.idLote ? 'Lote' : ''),
                material: c.material || 'Material',
                cantidadSolicitada: cantidadSol,
                cantidadDespachada: Number(c.cantidadDespachada ?? cantidadSol),
                unidad,
                tipoCantidad,
            } as FilaDespachoFungible;
        });

        const contenedorRows = (canasta.cosas ?? []).filter((cosa: any) => {
            if (cosa.idContenedor) {
                return contenedoresMateriales?.some(c => String(c.id) === String(cosa.idContenedor));
            }
            return false;
        }).map((cosa: any) => {
            return {
                idFila: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(7),
                idPrestamo: cosa.idPrestamo,
                idLote: null,
                idActivoFungible: null,
                idContenedor: cosa.idContenedor,
                lote: '',
                material: `Contenedor: ${cosa.nombreContenedor || 'Desconocido'}`,
                cantidadSolicitada: 1,
                cantidadDespachada: 0,
                unidad: 'uds',
                tipoCantidad: 'entero',
            } as FilaDespachoFungible;
        });

        return [...contenedorRows, ...consumiblesRows];
    }, [canasta.consumibles, canasta.cosas, materiales, contenedoresMateriales]);

    const [filasFungibles, setFilasFungibles] = useState<FilaDespachoFungible[]>(filasInicialesFungibles);

    const opcionesLotesFungiblesExtra = useMemo(() => {
        if (!idInventarioCalculado) return [];
        return materiales
            .filter(m => Number(m.idInventario) === Number(idInventarioCalculado))
            .flatMap(m => m.subinstancias.map(sub => ({
                value: String(sub.id),
                label: `[${sub.lote || sub.serie || 'Lote'}] ${m.nombre} - Stock: ${sub.cantidadDisponible}`,
                idActivoFungible: Number(m.id),
                material: m.nombre,
                idContenedor: m.contenedor?.id ?? null,
                unidad: m.unidad,
                tipoCantidad: m.tipoCantidad
            })))
            .filter(op => !filasFungibles.some(f => String(f.idLote) === op.value));
    }, [materiales, idInventarioCalculado, filasFungibles]);

    const handleAgregarFungibleExtra = () => {
        if (!fungibleSeleccionadoId) return;
        const opcion = opcionesLotesFungiblesExtra.find(o => o.value === fungibleSeleccionadoId);
        if (!opcion) return;

        setFilasFungibles(prev => [
            ...prev,
            {
                idFila: `extra-${Date.now()}-${Math.random()}`,
                idPrestamo: null,
                idLote: opcion.value,
                idActivoFungible: opcion.idActivoFungible,
                idContenedor: opcion.idContenedor,
                lote: opcion.label.split(']')[0].replace('[', ''),
                material: opcion.material,
                cantidadSolicitada: 0,
                cantidadDespachada: 1,
                unidad: opcion.unidad,
                tipoCantidad: opcion.tipoCantidad,
            }
        ]);
        setFungibleSeleccionadoId('');
    };

    useEffect(() => {
        setFilasFijos(filasInicialesFijos);
        setFilasFungibles(filasInicialesFungibles);
    }, [filasInicialesFijos, filasInicialesFungibles]);
    const itemsDisponibles = useMemo(() => {
        return herramientas.filter(
            (h) => h.estado === 'disponible' && !filasFijos.some((f) => f.idHerramienta === h.id)
        );
    }, [herramientas, filasFijos]);

    const opcionesActivosDisponibles = useMemo(() => {
        return itemsDisponibles.map((h) => {
            const inv = String(h.codigoInventario ?? '').trim();
            const uni = String(h.codigoUnico ?? '').trim();
            const etiqueta = inv || uni ? `I: ${inv || '—'} | U: ${uni || '—'}` : 'SIN-CODIGO';
            return {
                value: h.id,
                label: `[${etiqueta}] ${h.nombre} (${h.categoria})`,
            };
        });
    }, [itemsDisponibles]);

    const getOpcionesComboboxFila = (fila: FilaDespachoFijo) => {
        const term = (fila.nombreContenedor || fila.nombre || '')
            .toLowerCase()
            .replace(/[\(\[].*?[\)\]]/g, '')
            .trim();
        
        const singularizar = (w: string) => {
            let res = w;
            if (res.endsWith('es') && res.length > 3) res = res.slice(0, -2);
            else if (res.endsWith('s') && res.length > 2) res = res.slice(0, -1);
            if (res.endsWith('e') && res.length > 3) res = res.slice(0, -1);
            return res;
        };

        const cleanTerm = singularizar(term);
        const termWords = term.split(/\s+/).map(singularizar).filter(w => w.length > 2);

        const opciones = itemsDisponibles.map((h) => {
            const matchesContenedor = 
                (fila.idContenedor && h.contenedorId && String(h.contenedorId) === String(fila.idContenedor)) ||
                (fila.nombreContenedor && h.contenedorNombre && String(h.contenedorNombre).trim().toLowerCase() === String(fila.nombreContenedor).trim().toLowerCase());

            const hNombre = h.nombre.toLowerCase();
            const hCategoria = h.categoria.toLowerCase();
            
            const matchesNombre = cleanTerm && (
                hNombre.includes(cleanTerm) ||
                hCategoria.includes(cleanTerm) ||
                termWords.some(w => hNombre.includes(w) || hCategoria.includes(w))
            );

            const inv = String(h.codigoInventario ?? '').trim();
            const uni = String(h.codigoUnico ?? '').trim();
            const etiqueta = inv || uni ? `I: ${inv || '—'} | U: ${uni || '—'}` : 'SIN-CODIGO';
            
            let priority = 0;
            if (matchesContenedor) priority += 2;
            if (matchesNombre) priority += 1;

            return {
                value: h.id,
                label: `[${etiqueta}] ${h.nombre}`,
                priority
            };
        });

        return opciones.sort((a, b) => b.priority - a.priority).map(o => ({ value: o.value, label: o.label }));
    };

    const handleAgregarItem = () => {
        if (!herramientaSeleccionadaId) return;
        const item = herramientas.find((h) => h.id === herramientaSeleccionadaId);
        if (!item) return;

        setFilasFijos((prev) => [
            ...prev,
            {
                idFila: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(7),
                idHerramienta: item.id,
                codigoInventario: item.codigoInventario || '—',
                nombre: item.nombre,
                registrado: true,
                estadoFisicoEntrega: normalizarEstadoFisicoItem(item.estadoFisico) ?? 'bueno',
                esNuevo: true,
            },
        ]);
        setHerramientaSeleccionadaId('');
    };

    const handleQuitarFilaFijo = (idFila: string) => {
        setFilasFijos((prev) => prev.filter((f) => f.idFila !== idFila));
    };

    const handleToggleRegistrado = (idFila: string, verificado: boolean) => {
        setFilasFijos((prev) =>
            prev.map((f) => (f.idFila === idFila ? { ...f, registrado: verificado } : f))
        );
    };

    const handleEstadoEntregaChange = (idFila: string, estado: EstadoFisicoItemActivo) => {
        setFilasFijos((prev) =>
            prev.map((f) => (f.idFila === idFila ? { ...f, estadoFisicoEntrega: estado } : f))
        );
    };

    const handleAsignarFisico = (idFila: string, item: ItemActivoResumen) => {
        setFilasFijos((prev) =>
            prev.map((f) => {
                if (f.idFila === idFila) {
                    return {
                        ...f,
                        idHerramienta: item.id,
                        codigoInventario: item.codigoInventario || item.codigoUnico || '—',
                        nombre: item.nombre,
                        registrado: true,
                        estadoFisicoEntrega: normalizarEstadoFisicoItem(item.estadoFisico) ?? 'bueno',
                    };
                }
                return f;
            })
        );
    };

    const handleDesasignarFisico = (idFila: string) => {
        setFilasFijos((prev) =>
            prev.map((f) => {
                if (f.idFila === idFila) {
                    const originalCosa = (canasta.cosas ?? []).find((c) => c.idPrestamo !== undefined && c.idPrestamo !== null && String(c.idPrestamo) === String(f.idPrestamo));
                    return {
                        ...f,
                        idHerramienta: null,
                        codigoInventario: null,
                        nombre: originalCosa?.nombre ?? 'Activo (Solicitado)',
                        registrado: false,
                    };
                }
                return f;
            })
        );
    };

    const handleCantidadFungibleChange = (idFila: string, cantidad: number) => {
        setFilasFungibles((prev) =>
            prev.map((f) => (f.idFila === idFila ? { ...f, cantidadDespachada: Math.max(0, cantidad) } : f))
        );
    };

    const obtenerLotesDisponibles = (idActivoFungible: number | string | null | undefined, idContenedor: number | string | null | undefined) => {
        if (!idActivoFungible) return [];
        const lotes: Array<{ id: string; lote: string; serie: string; cantidadDisponible: number; nombreContenedor: string; idContenedor: string | null }> = [];
        
        const matGlobal = materiales?.find(m => String(m.id) === String(idActivoFungible));
        if (matGlobal) {
            for (const sub of matGlobal.subinstancias) {
                lotes.push({
                    id: sub.id,
                    lote: sub.lote || 'Sin lote',
                    serie: sub.serie || 'Sin serie',
                    cantidadDisponible: sub.cantidadDisponible || 0,
                    nombreContenedor: 'Inventario General',
                    idContenedor: null
                });
            }
        }

        for (const cont of contenedoresMateriales || []) {
            const mat = cont.materiales.find(m => String(m.id) === String(idActivoFungible));
            if (mat) {
                for (const sub of mat.subinstancias) {
                    lotes.push({
                        id: sub.id,
                        lote: sub.lote || 'Sin lote',
                        serie: sub.serie || 'Sin serie',
                        cantidadDisponible: sub.cantidadDisponible || 0,
                        nombreContenedor: cont.nombre,
                        idContenedor: cont.id
                    });
                }
            }
        }
        
        if (idContenedor) {
            lotes.sort((a, b) => {
                const aIsReq = String(a.idContenedor) === String(idContenedor);
                const bIsReq = String(b.idContenedor) === String(idContenedor);
                if (aIsReq && !bIsReq) return -1;
                if (!aIsReq && bIsReq) return 1;
                return 0;
            });
        }
        
        return lotes;
    };

    const getOpcionesLotesFungibles = (fila: FilaDespachoFungible) => {
        const lotes = obtenerLotesDisponibles(fila.idActivoFungible, fila.idContenedor);
        return lotes.map(l => ({
            value: l.id,
            label: `[Cont: ${l.nombreContenedor}] Lote: ${l.lote} | Serie: ${l.serie} (${l.cantidadDisponible} ${fila.unidad || 'uds'} disp.)`
        }));
    };

    const handleAsignarLoteFungible = (idFila: string, loteId: string) => {
        let loteNombre = 'Lote';
        
        const matGlobal = materiales?.find(m => m.subinstancias.some(s => String(s.id) === String(loteId)));
        if (matGlobal) {
            const sub = matGlobal.subinstancias.find(s => String(s.id) === String(loteId));
            if (sub) loteNombre = sub.lote || sub.serie || 'Lote';
        } else {
            for (const cont of contenedoresMateriales || []) {
                for (const mat of cont.materiales) {
                    const sub = mat.subinstancias.find(s => String(s.id) === String(loteId));
                    if (sub) {
                        loteNombre = sub.lote || sub.serie || 'Lote';
                        break;
                    }
                }
            }
        }
        
        setFilasFungibles((prev) =>
            prev.map((f) =>
                f.idFila === idFila
                    ? {
                          ...f,
                          idLote: loteId,
                          lote: loteNombre,
                      }
                    : f
            )
        );
    };

    const handleToggleCarnet = (carnet: string, retenido: boolean) => {
        setCarnetsRetenidos((prev) =>
            retenido ? [...prev, carnet] : prev.filter((c) => c !== carnet)
        );
    };

    const formId = `dialogo-despachar-canasta-${canasta.id}`;

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        const fijosRegistrados = tienePermisoFijos ? filasFijos.filter(f => f.registrado) : [];
        const fungiblesAVales = tienePermisoFungibles ? filasFungibles : [];

        if (tienePermisoFijos && tienePermisoFungibles) {
            if (fijosRegistrados.length === 0 && fungiblesAVales.length === 0) {
                setError('Debes despachar al menos un activo fijo o material fungible.');
                return;
            }
        } else if (tienePermisoFijos) {
            if (fijosRegistrados.length === 0) {
                setError('Debes despachar al menos un activo fijo.');
                return;
            }
        } else if (tienePermisoFungibles) {
            if (fungiblesAVales.length === 0) {
                setError('Debes despachar al menos un material fungible.');
                return;
            }
        }

        if (tienePermisoFijos) {
            const itemsSinFisico = filasFijos.filter(f => f.registrado && f.idHerramienta === null);
            if (itemsSinFisico.length > 0) {
                setError('Debes asignar un activo físico a todos los equipos solicitados antes de despachar.');
                return;
            }
        }

        if (tienePermisoFungibles) {
            const fungiblesSinLote = filasFungibles.filter(f => f.idLote === null);
            if (fungiblesSinLote.length > 0) {
                setError('Debes asignar un lote físico a todos los materiales fungibles solicitados antes de despachar.');
                return;
            }
        }

        if (carnetsRetenidos.length === 0) {
            setError('Debes validar que el CU se retenga (selecciona al menos un estudiante para la retención del CU).');
            return;
        }

        try {
            setGuardando(true);
            await onConfirmar({
                equipos: tienePermisoFijos ? filasFijos.map((f) => ({
                    idPrestamo: f.idPrestamo,
                    idHerramienta: f.idHerramienta,
                    registrado: f.registrado,
                    estadoFisicoEntrega: f.estadoFisicoEntrega,
                })) : undefined,
                consumibles: tienePermisoFungibles ? filasFungibles.map((f) => ({
                    idLote: f.idLote!,
                    cantidad: f.cantidadDespachada,
                })) : undefined,
                carnetsRetenidos,
            });
            onCerrar();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'No se pudo despachar la canasta.');
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
                                <th className="px-3 py-2 text-left w-8">Enviado</th>
                                <th className="px-3 py-2 text-left">Activo</th>
                                <th className="px-3 py-2 text-left w-48">Estado Físico Entrega</th>
                                <th className="px-3 py-2 text-center w-12">Acción</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {filasFijos.map((fila) => (
                                <tr key={fila.idFila} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                                    <td className="px-3 py-2 text-center">
                                        <input
                                            type="checkbox"
                                            checked={fila.registrado}
                                            disabled={fila.idHerramienta === null}
                                            onChange={(e) => handleToggleRegistrado(fila.idFila, e.target.checked)}
                                            className={`h-4 w-4 cursor-pointer rounded border-slate-300 text-blue-600 focus:ring-blue-500 ${fila.idHerramienta === null ? 'opacity-50 cursor-not-allowed' : ''}`}
                                            title={fila.idHerramienta === null ? 'Asigna un activo físico primero' : 'Incluir en el despacho'}
                                        />
                                    </td>
                                    <td className="px-3 py-2 min-w-0">
                                         {fila.idHerramienta === null ? (
                                             <div className="flex flex-col gap-1.5">
                                                 <span className="font-semibold text-slate-500 italic dark:text-slate-400">
                                                     [Solicitado] {fila.nombreContenedor || fila.nombre}
                                                 </span>
                                                 <div className="flex items-center gap-1.5 max-w-xs">
                                                     <Combobox<{ value: string; label: string }>
                                                         items={getOpcionesComboboxFila(fila)}
                                                         value=""
                                                         onValueChange={(val) => {
                                                             if (!val) return;
                                                             const matchedItem = herramientas.find((h) => h.id === val);
                                                             if (matchedItem) {
                                                                 handleAsignarFisico(fila.idFila, matchedItem);
                                                             }
                                                         }}
                                                         getItemValue={(item) => item.value}
                                                         getItemLabel={(item) => item.label}
                                                     >
                                                         <ComboboxInput placeholder="Asignar activo físico..." showClear className="h-8 text-xs" />
                                                         <ComboboxContent>
                                                             <ComboboxEmpty>No hay activos físicos disponibles.</ComboboxEmpty>
                                                             <ComboboxList<{ value: string; label: string }>>
                                                                 {(opcion) => (
                                                                     <ComboboxItem key={opcion.value} value={opcion.value}>
                                                                         {opcion.label}
                                                                     </ComboboxItem>
                                                                 )}
                                                             </ComboboxList>
                                                         </ComboboxContent>
                                                     </Combobox>
                                                 </div>
                                             </div>
                                         ) : (
                                             <div className="font-semibold text-slate-800 dark:text-slate-100 max-w-[240px] truncate" title={`[${fila.codigoInventario}] ${fila.nombre}`}>
                                                 {fila.idContenedor ? (
                                                     <span className="text-[10px] bg-slate-100 text-slate-650 px-1.5 py-0.5 rounded mr-1.5 border border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700">
                                                         {fila.nombreContenedor || 'Contenedor'}
                                                     </span>
                                                 ) : null}
                                                 [{fila.codigoInventario || '—'}] {fila.nombre}
                                                 {fila.esNuevo && (
                                                     <span className="ml-2 rounded-full bg-green-100 px-2 py-0.5 text-[9px] font-medium text-green-800 dark:bg-green-900/30 dark:text-green-300 shrink-0">
                                                         Nuevo
                                                     </span>
                                                 )}
                                                 <div className="text-[10px] text-slate-400">ID: {fila.idHerramienta}</div>
                                             </div>
                                         )}
                                     </td>
                                    <td className="px-3 py-2">
                                        <select
                                            title="Estado físico al entregar"
                                            value={fila.estadoFisicoEntrega}
                                            disabled={!fila.registrado}
                                            onChange={(e) => handleEstadoEntregaChange(fila.idFila, e.target.value as EstadoFisicoItemActivo)}
                                            className="h-8 w-full rounded-md border border-slate-200 bg-white px-2 text-xs text-slate-700 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 disabled:bg-slate-50 disabled:text-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:disabled:bg-slate-950"
                                        >
                                            {ESTADOS_FISICOS_ITEM.map((e) => (
                                                <option key={e} value={e}>{etiquetaEstadoFisicoItem(e)}</option>
                                            ))}
                                        </select>
                                    </td>
                                    <td className="px-3 py-2 text-center">
                                        {fila.idContenedor && fila.idHerramienta !== null ? (
                                            <Boton
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleDesasignarFisico(fila.idFila)}
                                                className="h-7 w-7 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/20"
                                                title="Desasignar activo físico"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Boton>
                                        ) : (
                                            <Boton
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleQuitarFilaFijo(fila.idFila)}
                                                disabled={false}
                                                className="h-7 w-7 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 disabled:opacity-30 disabled:hover:bg-transparent"
                                                title="Quitar de la lista"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Boton>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {filasFijos.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="px-3 py-4 text-center text-slate-500 dark:text-slate-400">
                                        No hay activos fijos solicitados.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                <div className="flex gap-2 rounded-md border border-slate-100 bg-slate-50/50 p-2 dark:border-slate-800 dark:bg-slate-900/30 items-center">
                    <div className="flex-1 min-w-0">
                        <Combobox<{ value: string; label: string }>
                            items={opcionesActivosDisponibles}
                            value={herramientaSeleccionadaId}
                            onValueChange={(val) => setHerramientaSeleccionadaId(val)}
                            getItemValue={(item) => item.value}
                            getItemLabel={(item) => item.label}
                        >
                            <ComboboxInput placeholder="Seleccionar activo adicional..." showClear />
                            <ComboboxContent>
                                <ComboboxEmpty>No se encontraron activos disponibles.</ComboboxEmpty>
                                <ComboboxList<{ value: string; label: string }>>
                                    {(opcion) => (
                                        <ComboboxItem key={opcion.value} value={opcion.value}>
                                            {opcion.label}
                                        </ComboboxItem>
                                    )}
                                </ComboboxList>
                            </ComboboxContent>
                        </Combobox>
                    </div>
                    <Boton
                        type="button"
                        onClick={handleAgregarItem}
                        disabled={!herramientaSeleccionadaId}
                        className="h-9 gap-1 text-xs shrink-0"
                    >
                        <Plus className="h-3.5 w-3.5" /> Agregar
                    </Boton>
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
                                <th className="px-3 py-2 text-center w-32">Solicitado</th>
                                <th className="px-3 py-2 text-center w-40">A Despachar (editar)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {filasFungibles.map((fila) => (
                                <tr key={fila.idFila} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                                     <td className="px-3 py-2 min-w-0">
                                         {fila.idLote === null && fila.idActivoFungible !== null ? (
                                             <div className="flex flex-col gap-1.5">
                                                 <span className="font-semibold text-slate-500 italic dark:text-slate-400">
                                                     [Solicitado Genérico] {fila.material}
                                                 </span>
                                                 <div className="flex items-center gap-1.5 max-w-xs">
                                                     <Combobox<{ value: string; label: string }>
                                                         items={getOpcionesLotesFungibles(fila)}
                                                         value=""
                                                         onValueChange={(val) => {
                                                             if (!val) return;
                                                             handleAsignarLoteFungible(fila.idFila, val);
                                                         }}
                                                         getItemValue={(item) => item.value}
                                                         getItemLabel={(item) => item.label}
                                                     >
                                                         <ComboboxInput placeholder="Asignar lote físico..." showClear className="h-8 text-xs" />
                                                         <ComboboxContent>
                                                             <ComboboxEmpty>No hay lotes físicos disponibles.</ComboboxEmpty>
                                                             <ComboboxList<{ value: string; label: string }>>
                                                                 {(opcion) => (
                                                                     <ComboboxItem key={opcion.value} value={opcion.value}>
                                                                         {opcion.label}
                                                                     </ComboboxItem>
                                                                 )}
                                                             </ComboboxList>
                                                         </ComboboxContent>
                                                     </Combobox>
                                                 </div>
                                             </div>
                                         ) : (
                                             <div className="flex flex-col">
                                                 <div className="font-semibold text-slate-800 dark:text-slate-100 max-w-[200px] truncate" title={fila.material}>
                                                     {fila.material}
                                                 </div>
                                                 <div className="flex items-center gap-2">
                                                     {fila.idLote !== null && (
                                                         <span className="text-[10px] text-slate-400">
                                                             Lote: {fila.lote} | ID: {fila.idLote}
                                                         </span>
                                                     )}
                                                     {fila.idActivoFungible !== null && (
                                                         <Boton
                                                             type="button"
                                                             variant="ghost"
                                                             size="icon"
                                                             onClick={() => {
                                                                 setFilasFungibles(prev => prev.map(f => f.idFila === fila.idFila ? { ...f, idLote: null, lote: '' } : f));
                                                             }}
                                                             className="h-4 w-4 p-0 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/20 rounded shrink-0"
                                                             title="Desasignar lote físico"
                                                         >
                                                             <Trash2 className="h-3 w-3" />
                                                         </Boton>
                                                     )}
                                                 </div>
                                                 {fila.idLote === null && fila.idContenedor !== null && (
                                                     <Boton
                                                         type="button"
                                                         variant="ghost"
                                                         size="icon"
                                                         onClick={() => {
                                                             setFilasFungibles(prev => prev.filter(f => f.idFila !== fila.idFila));
                                                         }}
                                                         className="mt-2 h-6 px-2 text-[10px] text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 rounded border border-red-200 dark:border-red-900/50 flex items-center justify-center gap-1"
                                                         title="Quitar contenedor de la lista"
                                                     >
                                                         <Trash2 className="h-3 w-3" /> Quitar
                                                     </Boton>
                                                 )}
                                             </div>
                                         )}
                                     </td>
                                    <td className="px-3 py-2 text-center font-medium text-slate-600 dark:text-slate-300">
                                         {fila.cantidadSolicitada} {fila.unidad || 'uds'}
                                    </td>
                                    <td className="px-3 py-2">
                                        <div className="flex items-center gap-1.5">
                                            <input
                                                type="number"
                                                title="Cantidad a entregar"
                                                value={fila.cantidadDespachada}
                                                min={fila.tipoCantidad === 'decimal' ? 0.01 : 1}
                                                step={fila.tipoCantidad === 'decimal' ? 'any' : '1'}
                                                onChange={(e) => handleCantidadFungibleChange(fila.idFila, Number(e.target.value))}
                                                className="h-8 w-20 rounded-md border border-slate-200 bg-white px-2 text-center text-xs text-slate-700 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                                            />
                                            <span className="text-xs text-slate-500 font-medium dark:text-slate-400">{fila.unidad || 'uds'}</span>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filasFungibles.length === 0 && (
                                <tr>
                                    <td colSpan={3} className="px-3 py-4 text-center text-slate-500 dark:text-slate-400">
                                        No hay materiales fungibles solicitados.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                <div className="mt-4 flex flex-col gap-2 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/30">
                    <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Añadir consumibles extra (opcional)
                    </Label>
                    <div className="flex w-full items-center gap-2">
                        <div className="flex-1 max-w-sm">
                            <Combobox<{ value: string; label: string }>
                                items={opcionesLotesFungiblesExtra}
                                value={fungibleSeleccionadoId}
                                onValueChange={setFungibleSeleccionadoId}
                                getItemValue={(item) => item.value}
                                getItemLabel={(item) => item.label}
                            >
                                <ComboboxInput
                                    placeholder="Buscar consumibles/lotes disponibles..."
                                    showClear
                                    className="h-9 w-full text-xs shadow-sm bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700"
                                />
                                <ComboboxContent className="w-[380px]">
                                    <ComboboxEmpty>No se encontraron consumibles disponibles en este inventario.</ComboboxEmpty>
                                    <ComboboxList<{ value: string; label: string }> className="max-h-60">
                                        {(opcion) => (
                                            <ComboboxItem key={opcion.value} value={opcion.value}>
                                                {opcion.label}
                                            </ComboboxItem>
                                        )}
                                    </ComboboxList>
                                </ComboboxContent>
                            </Combobox>
                        </div>
                        <Boton
                            type="button"
                            variant="default"
                            onClick={handleAgregarFungibleExtra}
                            disabled={!fungibleSeleccionadoId}
                            className="h-9 px-4 text-xs font-medium"
                        >
                            <Plus className="mr-1.5 h-4 w-4" /> Agregar
                        </Boton>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <ModalBase
            titulo={`Despachar canasta #${canasta.id}`}
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
                        {guardando ? 'Despachando...' : 'Confirmar y Despachar'}
                    </Boton>
                </div>
            }
        >
            <div className="flex-1 min-h-0 overflow-y-auto overflow-x-auto scroll-elegante">
                <form id={formId} onSubmit={submit} className="space-y-4 p-4 sm:p-6">
                    <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 items-center">
                            <div className="sm:col-span-3">
                                <span className="font-semibold text-slate-700 dark:text-slate-300">Estudiantes:</span>
                                <div className="mt-1 flex flex-wrap gap-1.5">
                                    {estudiantesCanasta.map(e => {
                                        const esLider = e.carnet === canasta.carnetEstudiante;
                                        return (
                                            <span 
                                                key={e.carnet} 
                                                className={`inline-flex items-center rounded-md px-2.5 py-0.5 text-[11px] font-medium border ${
                                                    esLider 
                                                        ? 'bg-blue-50 text-blue-750 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800 shadow-2xs' 
                                                        : 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                                                }`}
                                            >
                                                {e.nombre} {e.apellido} ({e.carnet})
                                                {esLider && <span className="ml-1.5 font-bold text-[9px] bg-blue-600 text-white dark:bg-blue-500 dark:text-slate-900 px-1 py-0.2 rounded uppercase tracking-wider">Líder</span>}
                                            </span>
                                        );
                                    })}
                                    {estudiantesCanasta.length === 0 && <span>{canasta.carnetEstudiante}</span>}
                                </div>
                            </div>
                            <div><span className="font-semibold text-slate-700 dark:text-slate-300">Docente:</span> <span className="text-slate-650 dark:text-slate-400">{canasta.docente}</span></div>
                            <div><span className="font-semibold text-slate-700 dark:text-slate-300">Estado actual:</span> <span className="capitalize text-slate-650 dark:text-slate-400">{canasta.estado}</span></div>
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
                    <div className="space-y-2">
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Retención de Carnet / Credenciales</h3>
                        <div className="rounded-lg border border-slate-200 bg-white p-3 space-y-2 dark:border-slate-800 dark:bg-slate-900">
                            <p className="text-[11px] text-slate-400 mb-2">Marca los estudiantes a los cuales se les retendrá físicamente su carnet para este préstamo.</p>
                            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                {estudiantesCanasta.map((e) => {
                                    const checked = carnetsRetenidos.includes(e.carnet);
                                    const estudianteCompleto = (estudiantes ?? []).find((est) => est.carnet === e.carnet);
                                    const asignaciones: Array<{ carrera: string; cu: string }> = estudianteCompleto?.asignacionesCarrera?.length
                                        ? estudianteCompleto.asignacionesCarrera.map(ac => ({ carrera: ac.carrera, cu: ac.cu }))
                                        : [{ carrera: estudianteCompleto?.carrera || '', cu: estudianteCompleto?.cu ?? '' }];
                                    const esLider = e.carnet === canasta.carnetEstudiante;
                                    return (
                                        <div key={e.carnet} className="flex flex-col gap-2 rounded-md border border-slate-100 p-2 dark:border-slate-800 hover:bg-slate-50/50 min-w-0">
                                            <div className="flex items-center gap-2 min-w-0">
                                                <input
                                                    type="checkbox"
                                                    id={`retener-${e.carnet}`}
                                                    checked={checked}
                                                    onChange={(ev) => handleToggleToggle(e.carnet, ev.target.checked)}
                                                    className="h-4 w-4 cursor-pointer rounded border-slate-300 text-blue-600 focus:ring-blue-500 shrink-0"
                                                />
                                                <Label htmlFor={`retener-${e.carnet}`} className="cursor-pointer select-none text-xs font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[200px] sm:max-w-[280px]" title={`${e.nombre} ${e.apellido} (CI: ${e.carnet})`}>
                                                    {e.nombre} {e.apellido} (CI: {e.carnet}) {esLider && <span className="ml-1 text-[9px] font-bold text-blue-650 dark:text-blue-450 uppercase tracking-wider">(Líder)</span>}
                                                </Label>
                                            </div>
                                            <div className="pl-6 space-y-1 min-w-0">
                                                {asignaciones.map((asig, idx) => (
                                                    <div key={idx} className="text-[10px] text-slate-500 dark:text-slate-400 truncate max-w-full" title={`${asig.carrera}: CU ${asig.cu || '—'}`}>
                                                        <span className="font-medium">{asig.carrera}:</span> CU <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">{asig.cu || '—'}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {error ? (
                        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-300">
                            {error}
                        </div>
                    ) : null}
                </form>
            </div>
        </ModalBase>
    );

    function handleToggleToggle(carnet: string, checked: boolean) {
        handleToggleCarnet(carnet, checked);
    }
};
