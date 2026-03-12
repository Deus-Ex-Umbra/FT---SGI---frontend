import { useState } from 'react';
import { Package, Plus, ChevronRight, ChevronDown, Wrench, Edit2, Search, FileText, UserCircle2, List as ListIcon, Table as TableIcon } from 'lucide-react';
import type { ContenedorHerramientas, Herramienta } from '../../tipos/inventario';
import { FormularioEdicionJerarquia } from './FormularioEdicionJerarquia';
import { useInventario } from '../../contextos/ContextoInventario';
import type { PaginaApp } from './MenuLateral';
import { OPCIONES_ESTADO_FISICO } from '../../lib/estados-activo';
import type { EstadoPrestamo } from '../../tipos/inventario';

const CLAVE_FILTRO_PRESTAMO_ITEM = 'sgi-filtro-prestamo-item';

interface FiltroPrestamoDesdeActivos {
    idHerramienta: string;
    carnetEstudiante: string;
    estado: EstadoPrestamo;
}

interface Props {
    contenedores: ContenedorHerramientas[];
    onNavegar?: (pagina: PaginaApp) => void;
}

export const JerarquiaActivos = ({ contenedores, onNavegar }: Props) => {
    const {
        agregarContenedorActivos, editarContenedorActivos, agregarCajaActivo, editarInstanciaActivo,
        agregarSubinstanciaActivo, editarSubinstanciaActivo, prestamos
    } = useInventario();

    const [contenedoresExpandidos, setContenedoresExpandidos] = useState<Record<string, boolean>>({});
    const [vistasTabla, setVistasTabla] = useState<Record<string, boolean>>({});
    const [instanciasExpandidas, setInstanciasExpandidas] = useState<Record<string, boolean>>({});
    const [busquedas, setBusquedas] = useState<Record<string, string>>({});
    const [modal, setModal] = useState<{ tipo: string; idCon?: string; idInst?: string; idSub?: string; props: any } | null>(null);

    const opcionesEstadoFisico = OPCIONES_ESTADO_FISICO.map((o) => ({ value: o.value, label: o.label }));

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
                    onGuardar={async valores => {
                        if (modal.tipo === 'nuevo_contenedor') {
                            await agregarContenedorActivos({ nombre: valores.nombre, ubicacion: valores.ubicacion });
                        }
                        if (modal.tipo === 'editar_contenedor') {
                            await editarContenedorActivos(modal.idCon!, { nombre: valores.nombre, ubicacion: valores.ubicacion });
                        }
                        if (modal.tipo === 'nueva_caja') {
                            await agregarCajaActivo(modal.idCon!, { nombre: valores.nombre, categoria: 'General', descripcion: valores.descripcion, ue: '' });
                        }
                        if (modal.tipo === 'editar_instancia') {
                            await editarInstanciaActivo(modal.idCon!, modal.idInst!, {
                                nombre: valores.nombre,
                                categoria: valores.categoria || 'General',
                                descripcion: valores.descripcion,
                                ue: valores.ue || '',
                            });
                        }
                        if (modal.tipo === 'nueva_subinstancia') {
                            await agregarSubinstanciaActivo(modal.idCon!, modal.idInst!, {
                                codigoInventario: valores.codigo,
                                fechaEntrega: valores.fechaEntrega || undefined,
                                fechaRetiro: valores.fechaRetiro || undefined,
                                estado: valores.estado as any,
                                observaciones: valores.obs,
                                ue: valores.ue,
                                descripcion: valores.descripcion,
                                precio: parseFloat(valores.precio) || 0,
                            });
                        }
                        if (modal.tipo === 'editar_subinstancia') {
                            await editarSubinstanciaActivo(modal.idCon!, modal.idInst!, modal.idSub!, {
                                codigoInventario: valores.codigo,
                                fechaEntrega: valores.fechaEntrega || undefined,
                                fechaRetiro: valores.fechaRetiro || undefined,
                                estado: valores.estado as any,
                                observaciones: valores.obs,
                                ue: valores.ue,
                                descripcion: valores.descripcion,
                                precio: parseFloat(valores.precio) || 0,
                            });
                        }
                    }}
                    onCerrar={() => setModal(null)}
                />
            )}

            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800">
                <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-slate-500" />
                    <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                        Estructura de Activos Fijos
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
                                <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 text-indigo-500">
                                    <Package className="h-4 w-4" />
                                </div>
                                <div>
                                    <span className="font-semibold text-slate-700 dark:text-slate-200 block">{c.nombre}</span>
                                    <span className="text-[11px] text-slate-400 flex items-center gap-1">📍 {c.ubicacion}</span>
                                </div>
                            </button>
                            <div className="flex items-center gap-3">
                                <span className="text-xs px-2 py-1 rounded-md bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400 font-medium">
                                    Total: Bs. {c.herramientas.reduce((acc, h) => acc + h.subinstancias.reduce((acc2, s) => acc2 + (s.precio || 0), 0), 0).toLocaleString('es-BO', { minimumFractionDigits: 2 })}
                                </span>
                                <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                                    {c.herramientas.length} cajas
                                </span>
                                <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-1"></div>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setModal({
                                            tipo: 'nueva_caja', idCon: c.id,
                                            props: { titulo: 'Crear caja', campos: [{ key: 'nombre', label: 'Nombre de Caja', value: '' }, { key: 'descripcion', label: 'Descripción', value: '' }] }
                                        });
                                    }}
                                    className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 px-2 py-1.5 rounded-md hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
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
                                <button title="Editar contenedor" onClick={() => setModal({
                                    tipo: 'editar_contenedor', idCon: c.id,
                                    props: { titulo: 'Editar Contenedor', campos: [{ key: 'nombre', label: 'Nombre', value: c.nombre }, { key: 'ubicacion', label: 'Ubicación', value: c.ubicacion }] }
                                })} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md text-slate-400 hover:text-slate-600 transition-colors ml-1"><Edit2 className="h-4 w-4" /></button>
                            </div>
                        </div>

                        {contenedoresExpandidos[c.id] && (
                            <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800/50">
                                {(() => {
                                    const termino = busquedas[c.id]?.toLowerCase() || '';
                                    const herramientasFiltradas = c.herramientas.map(h => {
                                        const subinstanciasFiltradas = h.subinstancias.filter(sub =>
                                            !termino ||
                                            sub.codigoInventario.toLowerCase().includes(termino) ||
                                            sub.estado.replace('_', ' ').toLowerCase().includes(termino) ||
                                            (sub.observaciones && sub.observaciones.toLowerCase().includes(termino))
                                        );
                                        const coincideHerramienta = !termino ||
                                            h.nombre.toLowerCase().includes(termino) ||
                                            h.categoria.toLowerCase().includes(termino) ||
                                            (h.descripcion && h.descripcion.toLowerCase().includes(termino));

                                        if (coincideHerramienta || subinstanciasFiltradas.length > 0) {
                                            return { ...h, subinstancias: coincideHerramienta ? h.subinstancias : subinstanciasFiltradas };
                                        }
                                        return null;
                                    }).filter(Boolean) as Herramienta[];

                                    return (
                                        <>
                                            <div className="mb-4 flex items-center relative max-w-md">
                                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                                <input
                                                    type="text"
                                                    placeholder={`Buscar en "${c.nombre}" (código, artículo, estado)...`}
                                                    value={busquedas[c.id] || ''}
                                                    onChange={e => setBusquedas(prev => ({ ...prev, [c.id]: e.target.value }))}
                                                    className="w-full rounded-lg border border-slate-200 bg-slate-50 dark:bg-slate-800/50 pl-9 pr-4 py-2 text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-blue-400 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-blue-400/20 dark:border-slate-700 dark:text-slate-100 transition-all font-medium"
                                                />
                                            </div>

                                            {vistasTabla[c.id] ? (
                                                <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
                                                    <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300 border-collapse">
                                                        <thead className="bg-slate-50 dark:bg-slate-800/80 text-xs uppercase text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 font-semibold tracking-wider">
                                                            <tr>
                                                                <th className="px-4 py-3 min-w-[120px]">Código</th>
                                                                <th className="px-4 py-3">Artículo / Descripción</th>
                                                                <th className="px-4 py-3">U.E.</th>
                                                                <th className="px-4 py-3 min-w-[130px]">Estado Préstamo</th>
                                                                <th className="px-4 py-3 min-w-[130px]">Condición Física</th>
                                                                <th className="px-4 py-3 text-right">Valor Unit. (Bs)</th>
                                                                <th className="px-4 py-3 text-center">Acciones</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                                                            {herramientasFiltradas.flatMap(h => h.subinstancias.map(sub => {
                                                                const prestamoActivo = prestamos?.find(p => p.idHerramienta === sub.id && (p.estado === 'activo' || p.estado === 'pendiente' || p.estado === 'vencido'));
                                                                const tc = 6.96;

                                                                return (
                                                                    <tr key={sub.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group">
                                                                        <td className="px-4 py-3">
                                                                            <span className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                                                                                {sub.codigoInventario}
                                                                            </span>
                                                                        </td>
                                                                        <td className="px-4 py-3">
                                                                            <p className="font-medium text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                                                                                <Wrench className="h-3 w-3 text-blue-500" /> {h.nombre}
                                                                            </p>
                                                                            <p className="text-[11px] text-slate-400">
                                                                                <span className="font-semibold">{h.categoria}</span>
                                                                                {sub.descripcion ? ` · ${sub.descripcion}` : ''}
                                                                                {sub.observaciones ? ` · Obs: ${sub.observaciones}` : ''}
                                                                            </p>
                                                                        </td>
                                                                        <td className="px-4 py-3">
                                                                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">{sub.ue || 'N/A'}</span>
                                                                        </td>
                                                                        <td className="px-4 py-3">
                                                                            {prestamoActivo ? (
                                                                                <div className="inline-flex items-center gap-1.5 bg-amber-50 dark:bg-amber-900/10 px-2 py-1.5 rounded-md border border-amber-200/60 dark:border-amber-800/60">
                                                                                    <UserCircle2 className="h-3.5 w-3.5 text-amber-600 dark:text-amber-500" />
                                                                                    <div className="flex flex-col">
                                                                                        <span className={`text-[10px] font-bold uppercase tracking-wider ${prestamoActivo.estado === 'vencido' ? 'text-red-600' : 'text-amber-700 dark:text-amber-500'}`}>
                                                                                            {prestamoActivo.estado === 'vencido' ? 'VENCIDO' : 'PRESTADO'}
                                                                                        </span>
                                                                                        {onNavegar && (
                                                                                            <button
                                                                                                onClick={(e) => {
                                                                                                    e.stopPropagation();
                                                                                                    const filtro: FiltroPrestamoDesdeActivos = {
                                                                                                        idHerramienta: sub.id,
                                                                                                        carnetEstudiante: prestamoActivo.carnetEstudiante,
                                                                                                        estado: prestamoActivo.estado,
                                                                                                    };
                                                                                                    sessionStorage.setItem(CLAVE_FILTRO_PRESTAMO_ITEM, JSON.stringify(filtro));
                                                                                                    onNavegar('prestamos');
                                                                                                }}
                                                                                                className="text-[9px] font-semibold text-blue-600 dark:text-blue-400 hover:underline text-left leading-tight"
                                                                                            >
                                                                                                Ver detalle &rarr;
                                                                                            </button>
                                                                                        )}
                                                                                    </div>
                                                                                </div>
                                                                            ) : (
                                                                                <span className="inline-flex items-center gap-1 text-xs text-slate-400 px-2 py-1">
                                                                                    <div className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600"></div> En Estante
                                                                                </span>
                                                                            )}
                                                                        </td>
                                                                        <td className="px-4 py-3">
                                                                            <div className="flex items-center gap-2">
                                                                                <div className={`h-2.5 w-2.5 rounded-full shadow-sm ${sub.estado === 'buen_estado' ? 'bg-emerald-500 shadow-emerald-500/20' :
                                                                                    sub.estado === 'en_mantenimiento' ? 'bg-amber-500 shadow-amber-500/20' : 'bg-red-500 shadow-red-500/20'
                                                                                    }`} />
                                                                                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                                                                    {sub.estado.replace('_', ' ').toUpperCase()}
                                                                                </span>
                                                                            </div>
                                                                        </td>
                                                                        <td className="px-4 py-3 text-right">
                                                                            <div className="flex flex-col items-end">
                                                                                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{(sub.precio || 0).toLocaleString('es-BO', { minimumFractionDigits: 2 })}</span>
                                                                                <span className="text-[10px] text-slate-400">~ $ {((sub.precio || 0) / tc).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                                                                            </div>
                                                                        </td>
                                                                        <td className="px-4 py-3 text-center">
                                                                            <button title="Editar item" onClick={() => setModal({
                                                                                tipo: 'editar_subinstancia', idCon: c.id, idInst: h.id, idSub: sub.id,
                                                                                props: { titulo: 'Editar item', campos: [{ key: 'codigo', label: 'Código item', value: sub.codigoInventario }, { key: 'fechaEntrega', label: 'Fecha entrega', value: sub.fechaEntrega || '', type: 'date', required: false }, { key: 'fechaRetiro', label: 'Fecha retiro', value: sub.fechaRetiro || '', type: 'date', required: false }, { key: 'estado', label: 'Estado físico', value: sub.estado, type: 'select', options: opcionesEstadoFisico }, { key: 'ue', label: 'U.E.', value: sub.ue }, { key: 'descripcion', label: 'Descripción', value: sub.descripcion }, { key: 'obs', label: 'Observaciones', value: sub.observaciones }, { key: 'precio', label: 'Precio (Bs.)', value: sub.precio?.toString() || '0', type: 'number' }] }
                                                                            })} className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors inline-flex"><Edit2 className="h-4 w-4" /></button>
                                                                        </td>
                                                                    </tr>
                                                                );
                                                            }))}
                                                            {herramientasFiltradas.length === 0 && (
                                                                <tr>
                                                                    <td colSpan={6} className="px-4 py-8 text-center text-sm text-slate-500 bg-slate-50 dark:bg-slate-800/30">
                                                                        No se encontraron ítems físicos que coincidan con la búsqueda.
                                                                    </td>
                                                                </tr>
                                                            )}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            ) : (
                                                <div className="space-y-3">
                                                    {herramientasFiltradas.map(h => (
                                                        <div key={h.id} className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
                                                            <div className="flex w-full items-center justify-between px-3 py-2.5 bg-slate-50/50 dark:bg-slate-800/30 group text-left border-b border-slate-100 dark:border-slate-800">
                                                                <button onClick={() => toggleInstancia(h.id)} className="flex items-center gap-2 flex-1 text-left">
                                                                    {instanciasExpandidas[h.id] ? <ChevronDown className="h-4 w-4 text-slate-400" /> : <ChevronRight className="h-4 w-4 text-slate-400" />}
                                                                    <Wrench className="h-4 w-4 text-blue-500" />
                                                                    <span className="font-semibold text-slate-700 dark:text-slate-200">{h.nombre}</span>
                                                                    <span className="text-xs text-slate-400 font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800">{h.categoria}</span>
                                                                </button>
                                                                <div className="flex items-center gap-2">
                                                                    <button title="Editar caja" onClick={() => setModal({
                                                                        tipo: 'editar_instancia', idCon: c.id, idInst: h.id,
                                                                        props: { titulo: 'Editar Caja', campos: [{ key: 'nombre', label: 'Nombre', value: h.nombre }, { key: 'descripcion', label: 'Descripción', value: h.descripcion || '' }] }
                                                                    })} className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md text-slate-400 transition-colors opacity-0 group-hover:opacity-100"><Edit2 className="h-4 w-4" /></button>
                                                                    <button onClick={() => setModal({
                                                                        tipo: 'nueva_subinstancia', idCon: c.id, idInst: h.id,
                                                                        props: { titulo: 'Crear item', campos: [{ key: 'codigo', label: 'Código', value: '' }, { key: 'fechaEntrega', label: 'Fecha entrega', value: '', type: 'date', required: false }, { key: 'fechaRetiro', label: 'Fecha retiro', value: '', type: 'date', required: false }, { key: 'estado', label: 'Estado físico', value: 'buen_estado', type: 'select', options: opcionesEstadoFisico }, { key: 'ue', label: 'U.E.', value: '' }, { key: 'descripcion', label: 'Descripción', value: '' }, { key: 'obs', label: 'Observaciones', value: '' }, { key: 'precio', label: 'Precio (Bs.)', value: '0', type: 'number' }] }
                                                                    })} className="text-xs px-2.5 py-1.5 rounded-md bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-400 font-semibold transition-colors">Crear item</button>
                                                                    <span className="text-[10px] font-bold px-2 py-1 rounded-md bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 min-w-[3.5rem] text-center">
                                                                        {h.subinstancias.length} UND
                                                                    </span>
                                                                </div>
                                                            </div>

                                                            {instanciasExpandidas[h.id] && (
                                                                <div className="p-3 bg-white dark:bg-slate-900">
                                                                    {h.descripcion && (
                                                                        <div className="flex items-start gap-2 px-3 py-2 text-xs text-slate-600 dark:text-slate-400 mb-3 border-l-2 border-blue-200 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-900/10 rounded-r">
                                                                            <FileText className="h-3.5 w-3.5 shrink-0 mt-0.5 text-blue-400" />
                                                                            <p className="leading-relaxed">
                                                                                <span className="font-semibold text-slate-700 dark:text-slate-300">Descripción: </span>
                                                                                {h.descripcion}
                                                                            </p>
                                                                        </div>
                                                                    )}
                                                                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-2">
                                                                        {h.subinstancias.map(sub => {
                                                                            const prestamoActivo = prestamos?.find(p => p.idHerramienta === sub.id && (p.estado === 'activo' || p.estado === 'pendiente' || p.estado === 'vencido'));
                                                                            const tc = 6.96;
                                                                            const precioBob = (sub.precio || 0).toFixed(2);
                                                                            const precioUsd = ((sub.precio || 0) / tc).toFixed(2);

                                                                            return (
                                                                                <div key={sub.id} className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2.5 dark:border-slate-800 dark:bg-slate-800/50 hover:border-blue-300 dark:hover:border-blue-700 transition-colors shadow-sm">
                                                                                    <div className="flex items-start justify-between">
                                                                                        <div className="flex items-center gap-3 flex-wrap">
                                                                                            <span className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200">
                                                                                                <span className="text-slate-400 dark:text-slate-500 font-semibold mr-1.5 text-[9px] uppercase tracking-wider">CÓDIGO:</span>
                                                                                                {sub.codigoInventario}
                                                                                            </span>
                                                                                            <div className="flex items-center gap-1.5 border-l border-slate-200 dark:border-slate-700 pl-3">
                                                                                                <div className={`h-2 w-2 rounded-full shadow-sm ${sub.estado === 'buen_estado' ? 'bg-emerald-500' :
                                                                                                    sub.estado === 'en_mantenimiento' ? 'bg-amber-500' : 'bg-red-500'
                                                                                                    }`} />
                                                                                                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                                                                                                    {sub.estado.replace('_', ' ').toUpperCase()}
                                                                                                </span>
                                                                                            </div>
                                                                                            <div className="flex items-center gap-1.5 border-l border-slate-200 dark:border-slate-700 pl-3">
                                                                                                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">U.E. {sub.ue || 'N/A'}</span>
                                                                                            </div>
                                                                                            <div className="flex items-center gap-1.5 border-l border-slate-200 dark:border-slate-700 pl-3">
                                                                                                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Bs. {precioBob}</span>
                                                                                                <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500">(~ $ {precioUsd})</span>
                                                                                            </div>
                                                                                        </div>
                                                                                        <div className="flex items-center gap-2">
                                                                                            <button title="Editar subinstancia" onClick={() => setModal({
                                                                                                tipo: 'editar_subinstancia', idCon: c.id, idInst: h.id, idSub: sub.id,
                                                                                                props: { titulo: 'Editar item', campos: [{ key: 'codigo', label: 'Código item', value: sub.codigoInventario }, { key: 'fechaEntrega', label: 'Fecha entrega', value: sub.fechaEntrega || '', type: 'date', required: false }, { key: 'fechaRetiro', label: 'Fecha retiro', value: sub.fechaRetiro || '', type: 'date', required: false }, { key: 'estado', label: 'Estado físico', value: sub.estado, type: 'select', options: opcionesEstadoFisico }, { key: 'ue', label: 'U.E.', value: sub.ue }, { key: 'descripcion', label: 'Descripción', value: sub.descripcion }, { key: 'obs', label: 'Observaciones', value: sub.observaciones }, { key: 'precio', label: 'Precio (Bs.)', value: sub.precio?.toString() || '0', type: 'number' }] }
                                                                                            })} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-400 hover:text-blue-600 transition-colors"><Edit2 className="h-3.5 w-3.5" /></button>
                                                                                        </div>
                                                                                    </div>

                                                                                    <div className="flex flex-col gap-1.5 mt-1.5 pt-2 border-t border-slate-100 dark:border-slate-700/50">
                                                                                        {sub.descripcion && (
                                                                                            <div className="flex items-center">
                                                                                                <span className="text-[9px] font-bold text-blue-400 dark:text-blue-500 mr-2 uppercase tracking-wider">DESCRIPCIÓN:</span>
                                                                                                <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                                                                                                    {sub.descripcion}
                                                                                                </span>
                                                                                            </div>
                                                                                        )}
                                                                                        <div className="flex items-center justify-between">
                                                                                            <div className="flex items-center">
                                                                                                <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 mr-2 uppercase tracking-wider">OBSERVACIÓN:</span>
                                                                                                <span className="text-xs font-medium text-slate-600 dark:text-slate-400 italic truncate max-w-[150px] sm:max-w-xs">
                                                                                                    {sub.observaciones || 'Ninguna'}
                                                                                                </span>
                                                                                            </div>
                                                                                            {prestamoActivo ? (
                                                                                                <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-900/10 px-2 py-1.5 rounded-md border border-amber-200/50 dark:border-amber-800/50">
                                                                                                    <div className="flex items-center gap-1 text-amber-700 dark:text-amber-500">
                                                                                                        <UserCircle2 className="h-3.5 w-3.5" />
                                                                                                        <span className={`text-[9px] font-bold uppercase tracking-wider ${prestamoActivo.estado === 'vencido' ? 'text-red-600' : ''}`}>
                                                                                                            {prestamoActivo.estado === 'vencido' ? 'Vencido' : 'Prestado'}
                                                                                                        </span>
                                                                                                    </div>
                                                                                                    {onNavegar && (
                                                                                                        <button
                                                                                                            onClick={(e) => {
                                                                                                                e.stopPropagation();
                                                                                                                const filtro: FiltroPrestamoDesdeActivos = {
                                                                                                                    idHerramienta: sub.id,
                                                                                                                    carnetEstudiante: prestamoActivo.carnetEstudiante,
                                                                                                                    estado: prestamoActivo.estado,
                                                                                                                };
                                                                                                                sessionStorage.setItem(CLAVE_FILTRO_PRESTAMO_ITEM, JSON.stringify(filtro));
                                                                                                                onNavegar('prestamos');
                                                                                                            }}
                                                                                                            className="text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:underline border-l border-amber-200 dark:border-amber-800 pl-2 ml-1"
                                                                                                        >
                                                                                                            Ver &rarr;
                                                                                                        </button>
                                                                                                    )}
                                                                                                </div>
                                                                                            ) : (
                                                                                                <div className="text-[9px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded uppercase tracking-wider border border-slate-200 dark:border-slate-700">
                                                                                                    En Estante
                                                                                                </div>
                                                                                            )}
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                    {
                                                                        h.subinstancias.length === 0 && (
                                                                            <div className="px-3 py-6 text-xs text-slate-400 bg-slate-50 dark:bg-slate-800/30 rounded-lg border border-dashed border-slate-200 dark:border-slate-700 text-center">
                                                                                No hay ítems registrados para este artículo. Haz clic en "+ Ítem Físico" para empezar.
                                                                            </div>
                                                                        )
                                                                    }
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                            {herramientasFiltradas.length === 0 && c.herramientas.length > 0 && (
                                                <div className="px-3 py-4 text-xs text-slate-500 text-center italic bg-slate-50 dark:bg-slate-800/30 rounded border border-dashed border-slate-200 dark:border-slate-700 mt-2">
                                                    No se encontraron resultados para "{busquedas[c.id]}".
                                                </div>
                                            )}
                                        </>
                                    );
                                })()}
                                {c.herramientas.length === 0 && (
                                    <div className="px-3 py-2 text-sm text-slate-400">Contenedor vacío.</div>
                                )}
                            </div >
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};
