import { useState } from 'react';
import { Package, Plus, ChevronRight, ChevronDown, Layers, AlertTriangle, Edit2, Search, FileText, List as ListIcon, Table as TableIcon } from 'lucide-react';
import type { ContenedorMateriales, MaterialFungible } from '../../tipos/inventario';
import { FormularioEdicionJerarquia } from './FormularioEdicionJerarquia';
import { useInventario } from '../../contextos/ContextoInventario';

interface Props {
    contenedores: ContenedorMateriales[];
}

export const JerarquiaMaterialFungible = ({ contenedores }: Props) => {
    const {
        agregarContenedorMateriales, editarContenedorMateriales, agregarCajaMateriales, editarInstanciaMaterial,
        agregarSubinstanciaMaterial, editarSubinstanciaMaterial
    } = useInventario();

    const [contenedoresExpandidos, setContenedoresExpandidos] = useState<Record<string, boolean>>({});
    const [vistasTabla, setVistasTabla] = useState<Record<string, boolean>>({});
    const [instanciasExpandidas, setInstanciasExpandidas] = useState<Record<string, boolean>>({});
    const [busquedas, setBusquedas] = useState<Record<string, string>>({});
    const [modal, setModal] = useState<{ tipo: string; idCon?: string; idInst?: string; idSub?: string; props: any } | null>(null);

    const toggleContenedor = (id: string) => setContenedoresExpandidos(prev => ({ ...prev, [id]: !prev[id] }));
    const toggleVistaTabla = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        setVistasTabla(prev => ({ ...prev, [id]: !prev[id] }));
        if (!contenedoresExpandidos[id]) {
            setContenedoresExpandidos(prev => ({ ...prev, [id]: true }));
        }
    };
    const toggleInstancia = (id: string) => setInstanciasExpandidas(prev => ({ ...prev, [id]: !prev[id] }));

    return (
        <div className="rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            {modal && (
                <FormularioEdicionJerarquia
                    titulo={modal.props.titulo}
                    camposIniciales={modal.props.campos}
                    onGuardar={valores => {
                        if (modal.tipo === 'nuevo_contenedor') agregarContenedorMateriales({ nombre: valores.nombre, ubicacion: valores.ubicacion });
                        if (modal.tipo === 'editar_contenedor') editarContenedorMateriales(modal.idCon!, { nombre: valores.nombre, ubicacion: valores.ubicacion });
                        if (modal.tipo === 'nueva_caja') agregarCajaMateriales(modal.idCon!, { nombre: valores.nombre, categoria: 'Fungible', descripcion: valores.descripcion, unidad: 'Unidades', stockMinimo: 0 });
                        if (modal.tipo === 'editar_instancia') editarInstanciaMaterial(modal.idCon!, modal.idInst!, { nombre: valores.nombre, descripcion: valores.descripcion });
                        if (modal.tipo === 'nueva_subinstancia') {
                            if (valores.unidad?.trim()) {
                                editarInstanciaMaterial(modal.idCon!, modal.idInst!, { unidad: valores.unidad.trim() });
                            }
                            agregarSubinstanciaMaterial(modal.idCon!, modal.idInst!, {
                                lote: valores.lote,
                                fechaEntrega: valores.fechaEntrega || undefined,
                                fechaRetiro: valores.fechaRetiro || undefined,
                                cantidadDisponible: parseInt(valores.cantidad) || 0,
                                fechaCaducidad: valores.caducidad || undefined,
                                precio: parseFloat(valores.precio) || 0
                            });
                        }
                        if (modal.tipo === 'editar_subinstancia') {
                            if (valores.unidad?.trim()) {
                                editarInstanciaMaterial(modal.idCon!, modal.idInst!, { unidad: valores.unidad.trim() });
                            }
                            editarSubinstanciaMaterial(modal.idCon!, modal.idInst!, modal.idSub!, {
                                lote: valores.lote,
                                fechaEntrega: valores.fechaEntrega || undefined,
                                fechaRetiro: valores.fechaRetiro || undefined,
                                cantidadDisponible: parseInt(valores.cantidad) || 0,
                                fechaCaducidad: valores.caducidad || undefined,
                                precio: parseFloat(valores.precio) || 0
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
                    <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                        Estructura de Material Fungible
                    </h2>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setModal({
                            tipo: 'nuevo_contenedor',
                            props: { titulo: 'Nuevo Contenedor', campos: [{ key: 'nombre', label: 'Nombre', value: '' }, { key: 'ubicacion', label: 'Ubicación', value: '' }] }
                        })}
                        className="flex items-center gap-1.5 rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                        + Contenedor
                    </button>
                </div>
            </div>

            <div className="flex flex-col gap-4 p-4 bg-slate-50/50 dark:bg-slate-900/50">
                {contenedores.map(c => (
                    <div key={c.id} className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-hidden transition-all duration-200">
                        <div className="flex w-full items-center justify-between px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 group text-left border-b border-transparent data-[expanded=true]:border-slate-100 dark:data-[expanded=true]:border-slate-800" data-expanded={contenedoresExpandidos[c.id]}>
                            <button onClick={() => toggleContenedor(c.id)} className="flex items-center gap-2 flex-1 text-left">
                                {contenedoresExpandidos[c.id] ? <ChevronDown className="h-5 w-5 text-slate-400" /> : <ChevronRight className="h-5 w-5 text-slate-400" />}
                                <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500">
                                    <Package className="h-4 w-4" />
                                </div>
                                <div>
                                    <span className="font-semibold text-slate-700 dark:text-slate-200 block">{c.nombre}</span>
                                    <span className="text-[11px] text-slate-400 flex items-center gap-1">📍 {c.ubicacion}</span>
                                </div>
                            </button>
                            <div className="flex items-center gap-3">
                                <span className="text-xs px-2 py-1 rounded-md bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400 font-medium">
                                    Total: Bs. {c.materiales.reduce((acc, m) => acc + m.subinstancias.reduce((acc2, s) => acc2 + (s.cantidadDisponible * (s.precio || 0)), 0), 0).toLocaleString('es-BO', { minimumFractionDigits: 2 })}
                                </span>
                                <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                                    {c.materiales.length} cajas
                                </span>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setModal({
                                            tipo: 'nueva_caja', idCon: c.id,
                                            props: { titulo: 'Crear caja', campos: [{ key: 'nombre', label: 'Nombre de Caja', value: '' }, { key: 'descripcion', label: 'Descripción', value: '' }] }
                                        });
                                    }}
                                    className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 px-2 py-1.5 rounded-md hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors"
                                >
                                    <Plus className="h-3 w-3" />
                                    Crear caja
                                </button>
                                <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-1"></div>
                                <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg">
                                    <button
                                        onClick={(e) => toggleVistaTabla(e, c.id)}
                                        className={`p-1.5 rounded-md flex items-center justify-center transition-colors ${!vistasTabla[c.id] ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600 dark:text-blue-400' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                                        title="Vista de Lista"
                                    >
                                        <ListIcon className="h-3.5 w-3.5" />
                                    </button>
                                    <button
                                        onClick={(e) => toggleVistaTabla(e, c.id)}
                                        className={`p-1.5 rounded-md flex items-center justify-center transition-colors ${vistasTabla[c.id] ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600 dark:text-blue-400' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                                        title="Vista de Tabla"
                                    >
                                        <TableIcon className="h-3.5 w-3.5" />
                                    </button>
                                </div>
                                <button onClick={() => setModal({
                                    tipo: 'editar_contenedor', idCon: c.id,
                                    props: { titulo: 'Editar Contenedor', campos: [{ key: 'nombre', label: 'Nombre', value: c.nombre }, { key: 'ubicacion', label: 'Ubicación', value: c.ubicacion }] }
                                })} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md text-slate-400 hover:text-slate-600 transition-colors ml-1"><Edit2 className="h-4 w-4" /></button>
                            </div>
                        </div>

                        {contenedoresExpandidos[c.id] && (
                            <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800/50">
                                {(() => {
                                    const termino = busquedas[c.id]?.toLowerCase() || '';
                                    const materialesFiltrados = c.materiales.map(m => {
                                        const subinstanciasFiltradas = m.subinstancias.filter(sub =>
                                            !termino ||
                                            sub.lote.toLowerCase().includes(termino)
                                        );
                                        const coincideInstancia = !termino ||
                                            m.nombre.toLowerCase().includes(termino) ||
                                            m.categoria.toLowerCase().includes(termino) ||
                                            (m.descripcion && m.descripcion.toLowerCase().includes(termino));

                                        if (coincideInstancia || subinstanciasFiltradas.length > 0) {
                                            return { ...m, subinstancias: coincideInstancia ? m.subinstancias : subinstanciasFiltradas };
                                        }
                                        return null;
                                    }).filter(Boolean) as MaterialFungible[];

                                    return (
                                        <>
                                            <div className="mb-4 flex items-center relative max-w-md">
                                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                                <input
                                                    type="text"
                                                    placeholder={`Buscar en "${c.nombre}" (item, artículo)...`}
                                                    value={busquedas[c.id] || ''}
                                                    onChange={e => setBusquedas(prev => ({ ...prev, [c.id]: e.target.value }))}
                                                    className="w-full rounded-lg border border-slate-200 bg-slate-50 dark:bg-slate-800/50 pl-9 pr-4 py-2 text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-emerald-400 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-emerald-400/20 dark:border-slate-700 dark:text-slate-100 transition-all font-medium"
                                                />
                                            </div>

                                            {vistasTabla[c.id] ? (
                                                <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
                                                    <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300 border-collapse">
                                                        <thead className="bg-slate-50 dark:bg-slate-800/80 text-xs uppercase text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 font-semibold tracking-wider">
                                                            <tr>
                                                                <th className="px-4 py-3 min-w-[120px]">Item</th>
                                                                <th className="px-4 py-3">Artículo / Categoría</th>
                                                                <th className="px-4 py-3 min-w-[130px]">Disponibilidad</th>
                                                                <th className="px-4 py-3 min-w-[130px]">Valor (Bs)</th>
                                                                <th className="px-4 py-3 text-center">Acciones</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                                                            {materialesFiltrados.flatMap(m => m.subinstancias.map(sub => {
                                                                return (
                                                                    <tr key={sub.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group">
                                                                        <td className="px-4 py-3">
                                                                            <span className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                                                                                {sub.lote}
                                                                            </span>
                                                                        </td>
                                                                        <td className="px-4 py-3">
                                                                            <p className="font-medium text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                                                                                <Layers className="h-3 w-3 text-emerald-500" /> {m.nombre}
                                                                            </p>
                                                                            <p className="text-[11px] text-slate-400">
                                                                                <span className="font-semibold">{m.categoria}</span>
                                                                                {m.descripcion ? ` · ${m.descripcion}` : ''}
                                                                                {sub.fechaCaducidad ? ` · Caduca: ${sub.fechaCaducidad}` : ''}
                                                                            </p>
                                                                        </td>
                                                                        <td className="px-4 py-3">
                                                                            <span className={`inline-flex font-bold text-xs px-2 py-1 rounded-md ${sub.cantidadDisponible <= 0 ? 'bg-red-50 text-red-600 dark:bg-red-900/30' : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30'}`}>
                                                                                {sub.cantidadDisponible} {m.unidad}
                                                                            </span>
                                                                        </td>
                                                                        <td className="px-4 py-3">
                                                                            <div className="flex flex-col">
                                                                                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                                                                    Unidad: Bs. {(sub.precio || 0).toLocaleString('es-BO', { minimumFractionDigits: 2 })}
                                                                                </span>
                                                                                <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold bg-blue-50 dark:bg-blue-900/20 px-1 py-0.5 rounded mt-0.5 w-fit">
                                                                                    Subtotal: Bs. {((sub.precio || 0) * sub.cantidadDisponible).toLocaleString('es-BO', { minimumFractionDigits: 2 })}
                                                                                </span>
                                                                            </div>
                                                                        </td>
                                                                        <td className="px-4 py-3 text-center">
                                                                            <button onClick={() => setModal({
                                                                                tipo: 'editar_subinstancia', idCon: c.id, idInst: m.id, idSub: sub.id,
                                                                                props: { titulo: 'Editar item', campos: [{ key: 'lote', label: 'Código item', value: sub.lote }, { key: 'unidad', label: 'Unidad de medida', value: m.unidad || '' }, { key: 'fechaEntrega', label: 'Fecha entrega', value: sub.fechaEntrega || '', type: 'date', required: false }, { key: 'fechaRetiro', label: 'Fecha retiro', value: sub.fechaRetiro || '', type: 'date', required: false }, { key: 'cantidad', label: 'Cantidad', value: sub.cantidadDisponible.toString(), type: 'number' }, { key: 'precio', label: 'Precio Unitario (Bs.)', value: sub.precio?.toString() || '0', type: 'number' }, { key: 'caducidad', label: 'Caducidad (opcional)', value: sub.fechaCaducidad || '', type: 'date', required: false }] }
                                                                            })} className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors inline-flex"><Edit2 className="h-4 w-4" /></button>
                                                                        </td>
                                                                    </tr>
                                                                );
                                                            }))}
                                                            {materialesFiltrados.length === 0 && (
                                                                <tr>
                                                                    <td colSpan={5} className="px-4 py-8 text-center text-sm text-slate-500 bg-slate-50 dark:bg-slate-800/30">
                                                                        No se encontraron items que coincidan con la búsqueda.
                                                                    </td>
                                                                </tr>
                                                            )}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            ) : (
                                                <div className="space-y-3">
                                                    {materialesFiltrados.map(m => {
                                                        const totalDisp = m.subinstancias.reduce((acc, sub) => acc + sub.cantidadDisponible, 0);
                                                        const bajoStock = totalDisp <= m.stockMinimo;

                                                        return (
                                                            <div key={m.id} className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
                                                                <div className="flex w-full items-center justify-between px-3 py-2.5 bg-slate-50/50 dark:bg-slate-800/30 group text-left border-b border-slate-100 dark:border-slate-800">
                                                                    <button onClick={() => toggleInstancia(m.id)} className="flex items-center gap-2 flex-1 text-left">
                                                                        {instanciasExpandidas[m.id] ? <ChevronDown className="h-4 w-4 text-slate-400" /> : <ChevronRight className="h-4 w-4 text-slate-400" />}
                                                                        <Layers className="h-4 w-4 text-emerald-500" />
                                                                        <span className="font-semibold text-slate-700 dark:text-slate-200">{m.nombre}</span>
                                                                        <span className="text-xs text-slate-400 font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800">{m.categoria}</span>
                                                                    </button>
                                                                    <div className="flex items-center gap-2">
                                                                        {bajoStock && (
                                                                            <span className="flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-400">
                                                                                <AlertTriangle className="h-3 w-3" /> Stock bajo
                                                                            </span>
                                                                        )}
                                                                        <span className={`text-[10px] font-bold px-2 py-1 rounded-md min-w-[4rem] text-center ${bajoStock ? 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400' : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'}`}>
                                                                            Tot: {totalDisp} {m.unidad}
                                                                        </span>
                                                                        <span className="text-[11px] font-semibold px-2 py-1 rounded-md border border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
                                                                            Bs. {m.subinstancias.reduce((acc, sub) => acc + (sub.cantidadDisponible * (sub.precio || 0)), 0).toLocaleString('es-BO', { minimumFractionDigits: 2 })}
                                                                        </span>
                                                                        <div className="flex items-center gap-1 ml-1 border-l pl-2 dark:border-slate-700 border-slate-200">
                                                                            <button onClick={() => setModal({
                                                                                tipo: 'editar_instancia', idCon: c.id, idInst: m.id,
                                                                                props: { titulo: 'Editar Caja', campos: [{ key: 'nombre', label: 'Nombre de Caja', value: m.nombre }, { key: 'descripcion', label: 'Descripción', value: m.descripcion || '' }] }
                                                                            })} className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md text-slate-400 transition-colors"><Edit2 className="h-4 w-4" /></button>
                                                                            <button onClick={() => setModal({
                                                                                tipo: 'nueva_subinstancia', idCon: c.id, idInst: m.id,
                                                                                props: { titulo: 'Crear item', campos: [{ key: 'lote', label: 'Código item', value: '' }, { key: 'unidad', label: 'Unidad de medida', value: m.unidad || '' }, { key: 'fechaEntrega', label: 'Fecha entrega', value: '', type: 'date', required: false }, { key: 'fechaRetiro', label: 'Fecha retiro', value: '', type: 'date', required: false }, { key: 'cantidad', label: 'Cantidad', value: '0', type: 'number' }, { key: 'precio', label: 'Precio Unitario (Bs.)', value: '0', type: 'number' }, { key: 'caducidad', label: 'Fecha de Caducidad (opcional)', value: '', type: 'date', required: false }] }
                                                                            })} className="text-xs px-2.5 py-1.5 rounded-md bg-emerald-50 dark:bg-emerald-900/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400 font-semibold transition-colors">Crear item</button>
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                {instanciasExpandidas[m.id] && (
                                                                    <div className="p-3 bg-white dark:bg-slate-900">
                                                                        {m.descripcion && (
                                                                            <div className="flex items-start gap-2 px-3 py-2 text-xs text-slate-600 dark:text-slate-400 mb-3 border-l-2 border-emerald-200 dark:border-emerald-900 bg-emerald-50/50 dark:bg-emerald-900/10 rounded-r">
                                                                                <FileText className="h-3.5 w-3.5 shrink-0 mt-0.5 text-emerald-400" />
                                                                                <p className="leading-relaxed">
                                                                                    <span className="font-semibold text-slate-700 dark:text-slate-300">Descripción: </span>
                                                                                    {m.descripcion}
                                                                                </p>
                                                                            </div>
                                                                        )}
                                                                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-2">
                                                                            {m.subinstancias.map(sub => {
                                                                                const precioBob = (sub.precio || 0).toFixed(2);
                                                                                const totalLote = ((sub.precio || 0) * sub.cantidadDisponible).toFixed(2);
                                                                                return (
                                                                                    <div key={sub.id} className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2.5 dark:border-slate-800 dark:bg-slate-800/50 hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors shadow-sm">
                                                                                        <div className="flex items-start justify-between">
                                                                                            <div className="flex items-center gap-3 flex-wrap">
                                                                                                <span className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200">
                                                                                                    <span className="text-slate-400 dark:text-slate-500 font-semibold mr-1.5 text-[9px] uppercase tracking-wider">ITEM:</span>
                                                                                                    {sub.lote}
                                                                                                </span>
                                                                                                <div className="flex items-center gap-1.5 border-l border-slate-200 dark:border-slate-700 pl-3">
                                                                                                    <div className={`h-2 w-2 rounded-full shadow-sm ${sub.cantidadDisponible <= 0 ? 'bg-red-500' : 'bg-emerald-500'}`} />
                                                                                                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                                                                                                        {sub.cantidadDisponible} {m.unidad}
                                                                                                    </span>
                                                                                                </div>
                                                                                                <div className="flex items-center gap-1.5 border-l border-slate-200 dark:border-slate-700 pl-3">
                                                                                                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">U: Bs. {precioBob}</span>
                                                                                                </div>
                                                                                            </div>
                                                                                            <div className="flex items-center gap-2">
                                                                                                <button onClick={() => setModal({
                                                                                                    tipo: 'editar_subinstancia', idCon: c.id, idInst: m.id, idSub: sub.id,
                                                                                                    props: { titulo: 'Editar item', campos: [{ key: 'lote', label: 'Código item', value: sub.lote }, { key: 'unidad', label: 'Unidad de medida', value: m.unidad || '' }, { key: 'fechaEntrega', label: 'Fecha entrega', value: sub.fechaEntrega || '', type: 'date', required: false }, { key: 'fechaRetiro', label: 'Fecha retiro', value: sub.fechaRetiro || '', type: 'date', required: false }, { key: 'cantidad', label: 'Cantidad', value: sub.cantidadDisponible.toString(), type: 'number' }, { key: 'precio', label: 'Precio Unitario (Bs.)', value: sub.precio?.toString() || '0', type: 'number' }, { key: 'caducidad', label: 'Caducidad (opcional)', value: sub.fechaCaducidad || '', type: 'date', required: false }] }
                                                                                                })} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-400 hover:text-emerald-600 transition-colors"><Edit2 className="h-3.5 w-3.5" /></button>
                                                                                            </div>
                                                                                        </div>

                                                                                        <div className="flex items-center justify-between mt-1.5 pt-2 border-t border-slate-100 dark:border-slate-700/50">
                                                                                            <div className="flex items-center gap-3">
                                                                                                {sub.fechaCaducidad && (
                                                                                                    <span className="text-[10px] bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded font-medium">
                                                                                                        Vence: {sub.fechaCaducidad}
                                                                                                    </span>
                                                                                                )}
                                                                                            </div>
                                                                                            <div className="text-[10px] font-bold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded inline-flex">
                                                                                                SUBTOTAL: Bs. {totalLote}
                                                                                            </div>
                                                                                        </div>
                                                                                    </div>
                                                                                );
                                                                            })}
                                                                        </div>
                                                                        {m.subinstancias.length === 0 && (
                                                                            <div className="px-3 py-6 text-xs text-slate-400 bg-slate-50 dark:bg-slate-800/30 rounded-lg border border-dashed border-slate-200 dark:border-slate-700 text-center">
                                                                                No hay items registrados para este artículo. Haz clic en "Crear item" para empezar.
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </>
                                    );
                                })()}
                                {c.materiales.length === 0 && (
                                    <div className="px-3 py-2 text-sm text-slate-400">Contenedor vacío.</div>
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};
