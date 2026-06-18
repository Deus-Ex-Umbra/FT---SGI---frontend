import { useMemo, useState } from 'react';
import {
    Package,
    ChevronRight,
    ChevronDown,
    AlertTriangle,
    Edit2,
    List as ListIcon,
    Table as TableIcon,
    Trash2,
} from 'lucide-react';
import type { ContenedorMateriales, MaterialFungible, SubinstanciaMaterial } from '@/tipos/inventario';
import FormularioEdicionJerarquia from './formulario-edicion-jerarquia';
import { useInventario } from '@/contextos/ContextoInventario';
import { useConfirmacion } from '@/contextos/ContextoConfirmacion';

interface Props {
    contenedores: ContenedorMateriales[];
    onVistaChange?: (vista: ModoVista) => void;
}

type ModoVista = 'tabla' | 'cajas';

const totalDisponible = (material: MaterialFungible): number =>
    material.subinstancias.reduce((sum, s) => sum + (Number(s.cantidadDisponible) || 0), 0);

const valorTotal = (material: MaterialFungible): number =>
    material.subinstancias.reduce((sum, s) => sum + (Number(s.cantidadDisponible) || 0) * (Number(s.precio) || 0), 0);

const subtotalLote = (sub: SubinstanciaMaterial): number =>
    (Number(sub.cantidadDisponible) || 0) * (Number(sub.precio) || 0);

export const JerarquiaMaterialFungible = ({ contenedores, onVistaChange }: Props) => {
    const {
        catalogoMaterialesFungibles,
        editarInstanciaMaterial,
        agregarSubinstanciaMaterial,
        editarSubinstanciaMaterial,
        eliminarInstanciaMaterial,
        eliminarSubinstanciaMaterial,
    } = useInventario();

    const { confirmar } = useConfirmacion();

    const [modoVista, setModoVista] = useState<ModoVista>('tabla');
    const setModoVistaYNotificar = (next: ModoVista) => {
        setModoVista(next);
        onVistaChange?.(next);
    };
    const [contenedoresExpandidos, setContenedoresExpandidos] = useState<Record<string, boolean>>({});
    const [materialesExpandidosTabla, setMaterialesExpandidosTabla] = useState<Record<string, boolean>>({});
    const [modal, setModal] = useState<
        | null
        | {
              tipo: 'editar_instancia' | 'nueva_subinstancia' | 'nueva_subinstancia_en_contenedor' | 'editar_subinstancia';
              idCon: string;
              idInst?: string;
              idSub?: string;
              props: any;
          }
    >(null);

    const contenedoresOrdenados = useMemo(() => {
        return [...contenedores].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
    }, [contenedores]);

    const toggleContenedor = (id: string) => setContenedoresExpandidos((prev) => ({ ...prev, [id]: !prev[id] }));
    const toggleMaterialTabla = (id: string) =>
        setMaterialesExpandidosTabla((prev) => ({ ...prev, [id]: !prev[id] }));

    const codigoInstancia = (sub: SubinstanciaMaterial): string => {
        if (sub.tipo === 'lote') return String(sub.lote ?? '').trim();
        if (sub.tipo === 'serie') return String(sub.serie ?? '').trim();
        return '';
    };

    const codigoVisible = (sub: SubinstanciaMaterial): string => {
        if (sub.tipo === 'simple') return 'SIN DATOS';
        const c = codigoInstancia(sub);
        return c || '—';
    };

    const filasTabla = useMemo(() => {
        const filas = contenedores.flatMap((c) =>
            c.materiales.map((m) => ({
                contenedor: c,
                material: m,
            })),
        );
        return filas.sort((a, b) => {
            const porContenedor = a.contenedor.nombre.localeCompare(b.contenedor.nombre, 'es');
            if (porContenedor !== 0) return porContenedor;
            return a.material.nombre.localeCompare(b.material.nombre, 'es');
        });
    }, [contenedores]);

    return (
        <div className="rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            {modal && (
                <FormularioEdicionJerarquia
                    titulo={modal.props.titulo}
                    camposIniciales={modal.props.campos}
                    onGuardar={async (valores) => {
                        if (modal.tipo === 'editar_instancia') {
                            await editarInstanciaMaterial(modal.idCon, modal.idInst!, {
                                nombre: valores.nombre,
                                descripcion: valores.descripcion,
                            });
                        }

                        if (modal.tipo === 'nueva_subinstancia') {
                            const tipo = (valores.tipo as SubinstanciaMaterial['tipo']) ?? 'simple';
                            await agregarSubinstanciaMaterial(modal.idCon, modal.idInst!, {
                                tipo,
                                lote: tipo === 'lote' ? String(valores.lote ?? '').trim() : null,
                                serie: tipo === 'serie' ? String(valores.serie ?? '').trim() : null,
                                fechaRetiro: undefined,
                                cantidadDisponible: parseInt(valores.cantidad) || 0,
                                fechaCaducidad: valores.caducidad || undefined,
                                precio: parseFloat(valores.precio) || 0,
                            });
                        }

                        if (modal.tipo === 'nueva_subinstancia_en_contenedor') {
                            const idMaterial = String(valores.idMaterial ?? '').trim();
                            if (!idMaterial) throw new Error('Selecciona un artículo/caja.');

                            const tipo = (valores.tipo as SubinstanciaMaterial['tipo']) ?? 'simple';

                            await agregarSubinstanciaMaterial(modal.idCon, idMaterial, {
                                tipo,
                                lote: tipo === 'lote' ? String(valores.lote ?? '').trim() : null,
                                serie: tipo === 'serie' ? String(valores.serie ?? '').trim() : null,
                                fechaRetiro: undefined,
                                cantidadDisponible: parseInt(valores.cantidad) || 0,
                                fechaCaducidad: valores.caducidad || undefined,
                                precio: parseFloat(valores.precio) || 0,
                            });
                        }

                        if (modal.tipo === 'editar_subinstancia') {
                            const tipo = (valores.tipo as SubinstanciaMaterial['tipo']) ?? 'simple';
                            await editarSubinstanciaMaterial(modal.idCon, modal.idInst!, modal.idSub!, {
                                tipo,
                                lote: tipo === 'lote' ? String(valores.lote ?? '').trim() : null,
                                serie: tipo === 'serie' ? String(valores.serie ?? '').trim() : null,
                                fechaRetiro: modal.props?.fechaRetiroOriginal || undefined,
                                cantidadDisponible: parseInt(valores.cantidad) || 0,
                                fechaCaducidad: valores.caducidad || undefined,
                                precio: parseFloat(valores.precio) || 0,
                            });
                        }

                        setModal(null);
                    }}
                    onCerrar={() => setModal(null)}
                />
            )}

            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800">
                <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-slate-500" />
                    <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Estructura de Activos Fungibles</h2>
                </div>

                <div className="flex items-center gap-2">
                    <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg">
                        <button
                            onClick={() => setModoVistaYNotificar('cajas')}
                            className={`p-1.5 rounded-md flex items-center justify-center transition-colors ${
                                modoVista === 'cajas'
                                    ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600 dark:text-blue-400'
                                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                            }`}
                            title="Vista por cajas"
                        >
                            <ListIcon className="h-3.5 w-3.5" />
                        </button>
                        <button
                            onClick={() => setModoVistaYNotificar('tabla')}
                            className={`p-1.5 rounded-md flex items-center justify-center transition-colors ${
                                modoVista === 'tabla'
                                    ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600 dark:text-blue-400'
                                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                            }`}
                            title="Vista de tabla"
                        >
                            <TableIcon className="h-3.5 w-3.5" />
                        </button>
                    </div>
                </div>
            </div>

            {modoVista === 'tabla' ? (
                <div className="p-4 bg-slate-50/50 dark:bg-slate-900/50">
                    <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                        <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300 border-collapse">
                            <thead className="bg-slate-50 dark:bg-slate-800/80 text-xs uppercase text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 font-semibold tracking-wider">
                                <tr>
                                    <th className="px-4 py-3 min-w-[270px]">Caja / Ubicación</th>
                                    <th className="px-4 py-3 min-w-[140px]">Unidad</th>
                                    <th className="px-4 py-3 min-w-[160px]">Stock</th>
                                    <th className="px-4 py-3 min-w-[160px]">Valor (Bs)</th>
                                    <th className="px-4 py-3 text-center min-w-[120px]">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                                {filasTabla.map(({ contenedor: c, material: m }) => {
                                    const total = totalDisponible(m);
                                    const bajoStock = Boolean(m.stockMinimoHabilitado) && total <= (m.stockMinimo ?? 0);
                                    const rowKey = `${c.id}__${m.id}`;
                                    const expanded = !!materialesExpandidosTabla[rowKey];

                                    return (
                                        <>
                                            <tr
                                                key={rowKey}
                                                className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                                            >
                                                <td className="px-4 py-3">
                                                    <button
                                                        onClick={() => toggleMaterialTabla(rowKey)}
                                                        className="inline-flex items-center gap-2 text-left"
                                                        title={expanded ? 'Ocultar lotes' : 'Ver lotes'}
                                                    >
                                                        {expanded ? (
                                                            <ChevronDown className="h-4 w-4 text-slate-400" />
                                                        ) : (
                                                            <ChevronRight className="h-4 w-4 text-slate-400" />
                                                        )}
                                                        <div className="flex flex-col">
                                                            <span className="font-semibold text-slate-800 dark:text-slate-100">{m.nombre}</span>
                                                            <span className="text-[11px] text-slate-400">
                                                                {c.nombre}{c.ubicacion ? ` · ${c.ubicacion}` : ''}
                                                            </span>
                                                        </div>
                                                    </button>
                                                    {m.descripcion ? (
                                                        <div className="mt-1 text-[11px] text-slate-400">
                                                            {m.descripcion}
                                                        </div>
                                                    ) : null}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                                                        {m.unidad}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-2">
                                                        {bajoStock && (
                                                            <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-400">
                                                                <AlertTriangle className="h-3 w-3" /> Stock bajo
                                                            </span>
                                                        )}
                                                        <span
                                                            className={`inline-flex font-bold text-xs px-2 py-1 rounded-md ${
                                                                total <= 0
                                                                    ? 'bg-red-50 text-red-600 dark:bg-red-900/30'
                                                                    : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30'
                                                            }`}
                                                        >
                                                            {total} {m.unidad}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                                        Bs. {valorTotal(m).toLocaleString('es-BO', { minimumFractionDigits: 2 })}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <div className="inline-flex items-center gap-1">
                                                        <button
                                                            title="Editar caja"
                                                            onClick={() =>
                                                                setModal({
                                                                    tipo: 'editar_instancia',
                                                                    idCon: c.id,
                                                                    idInst: m.id,
                                                                    props: {
                                                                        titulo: 'Editar caja',
                                                                        campos: [
                                                                            { key: 'nombre', label: 'Nombre de caja', value: m.nombre },
                                                                            {
                                                                                key: 'descripcion',
                                                                                label: 'Descripción',
                                                                                value: m.descripcion || '',
                                                                                type: 'textarea',
                                                                                required: false,
                                                                                rows: 4,
                                                                            },
                                                                        ],
                                                                    },
                                                                })
                                                            }
                                                            className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors inline-flex"
                                                        >
                                                            <Edit2 className="h-4 w-4" />
                                                        </button>
                                                        <button
                                                            title="Eliminar caja"
                                                            onClick={async () => {
                                                                const ok = await confirmar({
                                                                    titulo: 'Eliminar caja',
                                                                    descripcion: `¿Eliminar la caja "${m.nombre}" y sus items?`,
                                                                    textoConfirmar: 'Eliminar',
                                                                    textoCancelar: 'Cancelar',
                                                                    varianteConfirmar: 'destructive',
                                                                });
                                                                if (!ok) return;
                                                                await eliminarInstanciaMaterial(c.id, m.id);
                                                            }}
                                                            className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-md text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors inline-flex"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                        <button
                                                            title="Crear item"
                                                            onClick={() =>
                                                                setModal({
                                                                    tipo: 'nueva_subinstancia',
                                                                    idCon: c.id,
                                                                    idInst: m.id,
                                                                    props: {
                                                                        titulo: 'Crear item',
                                                                        campos: [
                                                                            {
                                                                                key: 'tipo',
                                                                                label: 'Tipo',
                                                                                value: m.tipoIdentificacion ?? 'simple',
                                                                                type: 'select',
                                                                                options: [
                                                                                    { value: 'simple', label: 'Sin lote/serie' },
                                                                                    { value: 'lote', label: 'Lote' },
                                                                                    { value: 'serie', label: 'Serie' },
                                                                                ],
                                                                            },
                                                                            {
                                                                                key: 'lote',
                                                                                label: 'Código de lote',
                                                                                value: '',
                                                                                requiredWhen: (v: any) => v.tipo === 'lote',
                                                                                visibleWhen: (v: any) => v.tipo === 'lote',
                                                                            },
                                                                            {
                                                                                key: 'serie',
                                                                                label: 'Código de serie',
                                                                                value: '',
                                                                                requiredWhen: (v: any) => v.tipo === 'serie',
                                                                                visibleWhen: (v: any) => v.tipo === 'serie',
                                                                            },
                                                                            { key: 'cantidad', label: 'Cantidad', value: '0', type: 'number' },
                                                                            {
                                                                                key: 'precio',
                                                                                label: 'Precio Unitario (Bs.)',
                                                                                value: '0',
                                                                                type: 'number',
                                                                            },
                                                                            {
                                                                                key: 'caducidad',
                                                                                label: 'Caducidad (opcional)',
                                                                                value: '',
                                                                                type: 'date',
                                                                                required: false,
                                                                            },
                                                                        ],
                                                                    },
                                                                })
                                                            }
                                                            className="px-2 py-1.5 rounded-md bg-emerald-50 dark:bg-emerald-900/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400 text-xs font-semibold transition-colors"
                                                        >
                                                            + Item
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>

                                            {expanded && (
                                                <tr key={`${rowKey}__sub`}>
                                                    <td colSpan={4} className="px-4 pb-4">
                                                        <div className="mt-2 overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
                                                            <table className="w-full text-left text-xs">
                                                                <thead className="bg-slate-50 dark:bg-slate-800/70">
                                                                    <tr>
                                                                        <th className="px-3 py-2">Item</th>
                                                                        <th className="px-3 py-2 text-right">Cantidad</th>
                                                                        <th className="px-3 py-2 text-right">Precio (Bs)</th>
                                                                        <th className="px-3 py-2">Caducidad</th>
                                                                        <th className="px-3 py-2 text-center">Acciones</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                                                    {m.subinstancias.map((sub) => (
                                                                        <tr key={sub.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                                                                            <td className="px-3 py-2">
                                                                                <span className="font-mono text-[11px] font-bold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                                                                                    {codigoVisible(sub)}
                                                                                </span>
                                                                            </td>
                                                                            <td className="px-3 py-2 text-right font-semibold">
                                                                                {sub.cantidadDisponible} {m.unidad}
                                                                            </td>
                                                                            <td className="px-3 py-2 text-right">
                                                                                <div className="flex flex-col items-end">
                                                                                    <span className="font-semibold">
                                                                                        {(sub.precio || 0).toLocaleString('es-BO', { minimumFractionDigits: 2 })}
                                                                                    </span>
                                                                                    <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold bg-blue-50 dark:bg-blue-900/20 px-1 py-0.5 rounded mt-0.5 w-fit">
                                                                                        Subtotal: {subtotalLote(sub).toLocaleString('es-BO', { minimumFractionDigits: 2 })}
                                                                                    </span>
                                                                                </div>
                                                                            </td>
                                                                            <td className="px-3 py-2 text-slate-500">{sub.fechaCaducidad || '-'}</td>
                                                                            <td className="px-3 py-2 text-center">
                                                                                <div className="inline-flex items-center gap-1">
                                                                                    <button
                                                                                        title="Editar item"
                                                                                        onClick={() =>
                                                                                            setModal({
                                                                                                tipo: 'editar_subinstancia',
                                                                                                idCon: c.id,
                                                                                                idInst: m.id,
                                                                                                idSub: sub.id,
                                                                                                props: {
                                                                                                    titulo: 'Editar item',
                                                                                                    fechaRetiroOriginal: sub.fechaRetiro || '',
                                                                                                    campos: [
                                                                                                        {
                                                                                                            key: 'tipo',
                                                                                                            label: 'Tipo',
                                                                                                            value: sub.tipo ?? 'simple',
                                                                                                            type: 'select',
                                                                                                            options: [
                                                                                                                { value: 'simple', label: 'Sin lote/serie' },
                                                                                                                { value: 'lote', label: 'Lote' },
                                                                                                                { value: 'serie', label: 'Serie' },
                                                                                                            ],
                                                                                                        },
                                                                                                        {
                                                                                                            key: 'lote',
                                                                                                            label: 'Código de lote',
                                                                                                            value: String(sub.lote ?? ''),
                                                                                                            requiredWhen: (v: any) => v.tipo === 'lote',
                                                                                                            visibleWhen: (v: any) => v.tipo === 'lote',
                                                                                                        },
                                                                                                        {
                                                                                                            key: 'serie',
                                                                                                            label: 'Código de serie',
                                                                                                            value: String(sub.serie ?? ''),
                                                                                                            requiredWhen: (v: any) => v.tipo === 'serie',
                                                                                                            visibleWhen: (v: any) => v.tipo === 'serie',
                                                                                                        },
                                                                                                        {
                                                                                                            key: 'cantidad',
                                                                                                            label: 'Cantidad',
                                                                                                            value: String(sub.cantidadDisponible),
                                                                                                            type: 'number',
                                                                                                        },
                                                                                                        {
                                                                                                            key: 'precio',
                                                                                                            label: 'Precio Unitario (Bs.)',
                                                                                                            value: String(sub.precio ?? 0),
                                                                                                            type: 'number',
                                                                                                        },
                                                                                                        {
                                                                                                            key: 'caducidad',
                                                                                                            label: 'Caducidad (opcional)',
                                                                                                            value: sub.fechaCaducidad || '',
                                                                                                            type: 'date',
                                                                                                            required: false,
                                                                                                        },
                                                                                                    ],
                                                                                                },
                                                                                            })
                                                                                        }
                                                                                        className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors inline-flex"
                                                                                    >
                                                                                        <Edit2 className="h-4 w-4" />
                                                                                    </button>
                                                                                    <button
                                                                                        title="Eliminar item"
                                                                                        onClick={async () => {
                                                                                            const ok = await confirmar({
                                                                                                titulo: 'Eliminar item',
                                                                                                descripcion: `¿Eliminar el item "${codigoVisible(sub)}"?`,
                                                                                                textoConfirmar: 'Eliminar',
                                                                                                textoCancelar: 'Cancelar',
                                                                                                varianteConfirmar: 'destructive',
                                                                                            });
                                                                                            if (!ok) return;
                                                                                            await eliminarSubinstanciaMaterial(c.id, m.id, sub.id);
                                                                                        }}
                                                                                        className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-md text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors inline-flex"
                                                                                    >
                                                                                        <Trash2 className="h-4 w-4" />
                                                                                    </button>
                                                                                </div>
                                                                            </td>
                                                                        </tr>
                                                                    ))}

                                                                    {m.subinstancias.length === 0 && (
                                                                        <tr>
                                                                            <td colSpan={5} className="px-3 py-4 text-center text-slate-500">
                                                                                Sin items registrados.
                                                                            </td>
                                                                        </tr>
                                                                    )}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </>
                                    );
                                })}

                                {filasTabla.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-4 py-8 text-center text-sm text-slate-500 bg-slate-50 dark:bg-slate-800/30">
                                            No hay activos fungibles para mostrar.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col gap-4 p-4 bg-slate-50/50 dark:bg-slate-900/50">
                    {contenedoresOrdenados.map((c) => {
                        const itemsPlano = c.materiales.flatMap((m) =>
                            (m.subinstancias ?? []).map((sub) => ({ material: m, sub })),
                        );
                        const itemsPlanoOrdenados = [...itemsPlano].sort((a, b) => {
                            const porMaterial = a.material.nombre.localeCompare(b.material.nombre, 'es');
                            if (porMaterial !== 0) return porMaterial;
                            return codigoVisible(a.sub).localeCompare(codigoVisible(b.sub), 'es');
                        });

                        return (
                            <div
                                key={c.id}
                                className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-hidden transition-all duration-200"
                            >
                                <div
                                    className="flex w-full items-center justify-between px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 group text-left border-b border-transparent data-[expanded=true]:border-slate-100 dark:data-[expanded=true]:border-slate-800"
                                    data-expanded={contenedoresExpandidos[c.id]}
                                >
                                    <button onClick={() => toggleContenedor(c.id)} className="flex items-center gap-2 flex-1 text-left">
                                        {contenedoresExpandidos[c.id] ? (
                                            <ChevronDown className="h-5 w-5 text-slate-400" />
                                        ) : (
                                            <ChevronRight className="h-5 w-5 text-slate-400" />
                                        )}
                                        <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500">
                                            <Package className="h-4 w-4" />
                                        </div>
                                        <div>
                                            <span className="font-semibold text-slate-700 dark:text-slate-200 block">{c.nombre}</span>
                                            <span className="text-[11px] text-slate-400 flex items-center gap-1">
                                                {c.ubicacion || c.descripcion || 'Sin ubicación'}
                                            </span>
                                        </div>
                                    </button>
                                    <div className="flex items-center gap-3">
                                        <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                                            {itemsPlano.length} items
                                        </span>
                                    </div>
                                </div>

                                {contenedoresExpandidos[c.id] && (
                                    <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800/50">
                                        <div className="mb-3 flex items-center justify-end">
                                            <button
                                                type="button"
                                                disabled={catalogoMaterialesFungibles.length === 0}
                                                onClick={() => {
                                                    const opciones = [...catalogoMaterialesFungibles]
                                                        .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
                                                        .map((m) => ({
                                                            value: m.id,
                                                            label: `${m.nombre}${m.descripcion ? ` · ${m.descripcion}` : ''}`,
                                                        }));

                                                    setModal({
                                                        tipo: 'nueva_subinstancia_en_contenedor',
                                                        idCon: c.id,
                                                        props: {
                                                            titulo: 'Crear item',
                                                            campos: [
                                                                {
                                                                    key: 'idMaterial',
                                                                    label: 'Artículo/Caja',
                                                                    value: '',
                                                                    type: 'combobox',
                                                                    options: [{ value: '', label: 'Selecciona un artículo/caja' }, ...opciones],
                                                                },
                                                                {
                                                                    key: 'tipo',
                                                                    label: 'Tipo',
                                                                    value: 'simple',
                                                                    type: 'select',
                                                                    options: [
                                                                        { value: 'simple', label: 'Sin lote/serie' },
                                                                        { value: 'lote', label: 'Lote' },
                                                                        { value: 'serie', label: 'Serie' },
                                                                    ],
                                                                },
                                                                {
                                                                    key: 'lote',
                                                                    label: 'Código de lote',
                                                                    value: '',
                                                                    requiredWhen: (v: any) => v.tipo === 'lote',
                                                                    visibleWhen: (v: any) => v.tipo === 'lote',
                                                                },
                                                                {
                                                                    key: 'serie',
                                                                    label: 'Código de serie',
                                                                    value: '',
                                                                    requiredWhen: (v: any) => v.tipo === 'serie',
                                                                    visibleWhen: (v: any) => v.tipo === 'serie',
                                                                },
                                                                { key: 'cantidad', label: 'Cantidad', value: '0', type: 'number' },
                                                                {
                                                                    key: 'precio',
                                                                    label: 'Precio Unitario (Bs.)',
                                                                    value: '0',
                                                                    type: 'number',
                                                                },
                                                                {
                                                                    key: 'caducidad',
                                                                    label: 'Caducidad (opcional)',
                                                                    value: '',
                                                                    type: 'date',
                                                                    required: false,
                                                                },
                                                            ],
                                                        },
                                                    });
                                                }}
                                                className="inline-flex h-8 items-center justify-center rounded-md bg-emerald-600 px-3 text-xs font-semibold text-white hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
                                                title={catalogoMaterialesFungibles.length === 0 ? 'Primero crea al menos un activo fungible.' : 'Crear item seleccionando el artículo'}
                                            >
                                                Crear item
                                            </button>
                                        </div>

                                        {itemsPlanoOrdenados.length === 0 ? (
                                            <div className="px-3 py-6 text-xs text-slate-400 bg-slate-50 dark:bg-slate-800/30 rounded-lg border border-dashed border-slate-200 dark:border-slate-700 text-center">
                                                No hay items registrados en este contenedor.
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-1 gap-2">
                                                {itemsPlanoOrdenados.map(({ material: m, sub }) => {
                                                    const precioBob = (sub.precio || 0).toFixed(2);
                                                    const totalLote = subtotalLote(sub).toFixed(2);

                                                    return (
                                                        <div
                                                            key={`${m.id}__${sub.id}`}
                                                            className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2.5 dark:border-slate-800 dark:bg-slate-800/50 hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors shadow-sm"
                                                        >
                                                            <div className="flex items-start justify-between">
                                                                <div className="flex items-center gap-3 flex-wrap">
                                                                    <span className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200">
                                                                        <span className="text-slate-400 dark:text-slate-500 font-semibold mr-1.5 text-[9px] uppercase tracking-wider">
                                                                            ITEM:
                                                                        </span>
                                                                        {codigoVisible(sub)}
                                                                    </span>
                                                                    <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                                                                        {m.nombre}
                                                                    </span>
                                                                    <div className="flex items-center gap-1.5 border-l border-slate-200 dark:border-slate-700 pl-3">
                                                                        <div
                                                                            className={`h-2 w-2 rounded-full shadow-sm ${
                                                                                sub.cantidadDisponible <= 0 ? 'bg-red-500' : 'bg-emerald-500'
                                                                            }`}
                                                                        />
                                                                        <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                                                                            {sub.cantidadDisponible} {m.unidad}
                                                                        </span>
                                                                    </div>
                                                                    <div className="flex items-center gap-1.5 border-l border-slate-200 dark:border-slate-700 pl-3">
                                                                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">U: Bs. {precioBob}</span>
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    <button
                                                                        title="Editar item"
                                                                        onClick={() =>
                                                                            setModal({
                                                                                tipo: 'editar_subinstancia',
                                                                                idCon: c.id,
                                                                                idInst: m.id,
                                                                                idSub: sub.id,
                                                                                props: {
                                                                                    titulo: 'Editar item',
                                                                                    fechaRetiroOriginal: sub.fechaRetiro || '',
                                                                                    campos: [
                                                                                        {
                                                                                            key: 'tipo',
                                                                                            label: 'Tipo',
                                                                                            value: sub.tipo ?? 'simple',
                                                                                            type: 'select',
                                                                                            options: [
                                                                                                { value: 'simple', label: 'Sin lote/serie' },
                                                                                                { value: 'lote', label: 'Lote' },
                                                                                                { value: 'serie', label: 'Serie' },
                                                                                            ],
                                                                                        },
                                                                                        {
                                                                                            key: 'lote',
                                                                                            label: 'Código de lote',
                                                                                            value: String(sub.lote ?? ''),
                                                                                            requiredWhen: (v: any) => v.tipo === 'lote',
                                                                                            visibleWhen: (v: any) => v.tipo === 'lote',
                                                                                        },
                                                                                        {
                                                                                            key: 'serie',
                                                                                            label: 'Código de serie',
                                                                                            value: String(sub.serie ?? ''),
                                                                                            requiredWhen: (v: any) => v.tipo === 'serie',
                                                                                            visibleWhen: (v: any) => v.tipo === 'serie',
                                                                                        },
                                                                                        {
                                                                                            key: 'cantidad',
                                                                                            label: 'Cantidad',
                                                                                            value: String(sub.cantidadDisponible),
                                                                                            type: 'number',
                                                                                        },
                                                                                        {
                                                                                            key: 'precio',
                                                                                            label: 'Precio Unitario (Bs.)',
                                                                                            value: String(sub.precio ?? 0),
                                                                                            type: 'number',
                                                                                        },
                                                                                        {
                                                                                            key: 'caducidad',
                                                                                            label: 'Caducidad (opcional)',
                                                                                            value: sub.fechaCaducidad || '',
                                                                                            type: 'date',
                                                                                            required: false,
                                                                                        },
                                                                                    ],
                                                                                },
                                                                            })
                                                                        }
                                                                        className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-400 hover:text-emerald-600 transition-colors"
                                                                    >
                                                                        <Edit2 className="h-3.5 w-3.5" />
                                                                    </button>
                                                                    <button
                                                                        title="Eliminar item"
                                                                        onClick={async () => {
                                                                            const ok = await confirmar({
                                                                                titulo: 'Eliminar item',
                                                                                descripcion: `¿Eliminar el item "${codigoVisible(sub)}"?`,
                                                                                textoConfirmar: 'Eliminar',
                                                                                textoCancelar: 'Cancelar',
                                                                                varianteConfirmar: 'destructive',
                                                                            });
                                                                            if (!ok) return;
                                                                            await eliminarSubinstanciaMaterial(c.id, m.id, sub.id);
                                                                        }}
                                                                        className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/30 rounded text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                                                                    >
                                                                        <Trash2 className="h-3.5 w-3.5" />
                                                                    </button>
                                                                </div>
                                                            </div>

                                                            <div className="flex items-center justify-between mt-1.5 pt-2 border-t border-slate-100 dark:border-slate-700/50">
                                                                <div className="flex items-center gap-3">
                                                                    {sub.fechaCaducidad ? (
                                                                        <span className="text-[10px] bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded font-medium">
                                                                            Vence: {sub.fechaCaducidad}
                                                                        </span>
                                                                    ) : null}
                                                                </div>
                                                                <div className="text-[10px] font-bold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded inline-flex">
                                                                    SUBTOTAL: Bs. {totalLote}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};
