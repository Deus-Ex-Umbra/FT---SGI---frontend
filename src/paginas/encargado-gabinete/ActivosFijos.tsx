import { useState } from 'react';
import { Package, Wrench, Boxes } from 'lucide-react';
import type { PropsPaginaBase } from '@/tipos/paginas';
import { LayoutPagina } from '@/componentes/layout/layout-pagina';
import { BarraFiltros } from '@/componentes/layout/barra-filtros';
import { TarjetaMetrica } from '@/componentes/ui/tarjeta-metrica';
import { JerarquiaActivos } from '@/componentes/paginas/inventario/jerarquia-activos';
import { FormularioEdicionJerarquia } from '@/componentes/paginas/inventario/formulario-edicion-jerarquia';
import { useInventario } from '@/contextos/ContextoInventario';
import { DatePicker } from '@/componentes/ui/date-picker';
import { Skeleton } from '@/componentes/ui/skeleton';
import type { EstadoHerramienta } from '@/tipos/inventario';
import { etiquetaEstadoItem, normalizarEstadoItem } from '@/utilidades/estados-activo';
import { construirUrlApi } from '@/lib/api';
import { obtenerToken, obtenerUsuarioActual } from '@/lib/servicio-autenticacion';

export const Activos = ({ onNavegar, onCerrarSesion }: PropsPaginaBase) => {
    const { contenedoresHerramientas, agregarCajaActivo, cargando } = useInventario();
    const usuario = obtenerUsuarioActual();
    const puedeEditar = usuario?.rol === 'administrador' || (usuario?.rol === 'encargado_inventario' && usuario?.puedeEditarFijos);
    const [busqueda, setBusqueda] = useState('');
    const [filtroEstado, setFiltroEstado] = useState<EstadoHerramienta | ''>('');
    const [fechaDesde, setFechaDesde] = useState('');
    const [fechaHasta, setFechaHasta] = useState('');
    const [modalNuevoActivo, setModalNuevoActivo] = useState(false);
    const [, setVistaJerarquia] = useState<'cajas' | 'tabla'>('tabla');
    const vistaBackend = false;

    const fechaEnRango = (fecha?: string) => {
        if (!fechaDesde && !fechaHasta) return true;
        if (!fecha) return false;
        const fechaComparable = String(fecha).slice(0, 10);
        const desdeOk = !fechaDesde || fechaComparable >= fechaDesde;
        const hastaOk = !fechaHasta || fechaComparable <= fechaHasta;
        return desdeOk && hastaOk;
    };

    const totalContenedores = contenedoresHerramientas.length;
    const totalInstancias = contenedoresHerramientas.reduce((acc, c) => acc + c.herramientas.length, 0);
    const totalSubinstancias = contenedoresHerramientas.reduce((acc, c) =>
        acc + c.herramientas.reduce((acc2, h) => acc2 + h.subinstancias.length, 0), 0);

    const contenedoresFiltrados = contenedoresHerramientas
        .filter(c => {
            const term = busqueda.toLowerCase();
            const coincideTexto = !term ||
                c.nombre.toLowerCase().includes(term) ||
                c.descripcion.toLowerCase().includes(term) ||
                c.herramientas.some(h =>
                    h.nombre.toLowerCase().includes(term) ||
                    h.categoria.toLowerCase().includes(term) ||
                    h.subinstancias.some(sub =>
                        (sub.codigoInventario ?? '').toLowerCase().includes(term) ||
                        (sub.codigoUnico ?? '').toLowerCase().includes(term)
                    )
                );

            const filtroCanonico = normalizarEstadoItem(filtroEstado);
            const coincideEstado = !filtroEstado || c.herramientas.some(h => h.subinstancias.some(sub => normalizarEstadoItem(sub.estado) === filtroCanonico));
            const coincideFecha = (!fechaDesde && !fechaHasta) || c.herramientas.some(h => h.subinstancias.some(sub => fechaEnRango(sub.fechaRetiro || sub.fechaEntrega)));
            return coincideTexto && coincideEstado && coincideFecha;
        })
        .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));


    return (
        <LayoutPagina
            paginaActiva="activos"
            titulo="Gestión de Activos"
            subtitulo="Jerarquía de contenedores, tipos de activo e ítems rastreables"
            alertas={0}
            onNavegar={onNavegar}
            onCerrarSesion={onCerrarSesion}
        >
            <div className="grid grid-cols-3 gap-4">
                <TarjetaMetrica titulo="Contenedores" valor={totalContenedores} Icono={Package} colorBase="indigo" cargando={cargando} />
                <TarjetaMetrica titulo="Tipos de activo" valor={totalInstancias} Icono={Wrench} colorBase="blue" cargando={cargando} />
                <TarjetaMetrica titulo="Ítems físicos" valor={totalSubinstancias} Icono={Boxes} colorBase="emerald" cargando={cargando} />
            </div>

            {modalNuevoActivo && (
                <FormularioEdicionJerarquia
                    titulo="Crear tipo de activo fijo"
                    mensajeExito="Tipo de activo creado correctamente."
                    mensajeError="No se pudo crear el tipo de activo."
                    camposIniciales={[
                        { key: 'nombre', label: 'Tipo o modelo del activo', value: '' },
                        { key: 'descripcion', label: 'Descripción breve', value: '', required: false },
                    ]}
                    onGuardar={async (valores) => {
                        await agregarCajaActivo('0', {
                            nombre: valores.nombre.trim(),
                            categoria: 'General',
                            descripcion: valores.descripcion.trim(),
                        });
                    }}
                    onCerrar={() => setModalNuevoActivo(false)}
                />
            )}

            <BarraFiltros
                busqueda={busqueda}
                onBusquedaChange={setBusqueda}
                placeholder="Buscar por contenedor, tipo o código..."
                filtrosActivos={!!filtroEstado || !!fechaDesde || !!fechaHasta}
                onLimpiarFiltros={() => { setBusqueda(''); setFiltroEstado(''); setFechaDesde(''); setFechaHasta(''); }}
                unaLinea
            >
                <div className="flex flex-wrap items-center gap-1.5 border border-slate-150 dark:border-slate-800 rounded-lg p-0.5 bg-slate-50/50 dark:bg-slate-900/40">
                    {([
                        'disponible',
                        'en_prestamo',
                        'en_mantenimiento',
                        'extraviado',
                        'dado_de_baja',
                    ] as EstadoHerramienta[]).map((estado) => {
                        const activo = filtroEstado === estado;
                        return (
                            <button
                                type="button"
                                key={estado}
                                onClick={() => setFiltroEstado(activo ? '' : estado)}
                                className={`h-7 px-2.5 text-[10px] font-semibold rounded-md border transition-all ${
                                    activo
                                        ? 'bg-blue-50 text-blue-600 border-blue-250 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-900 shadow-sm'
                                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800'
                                }`}
                            >
                                {etiquetaEstadoItem(estado)}
                            </button>
                        );
                    })}
                </div>
                <DatePicker
                    value={fechaDesde}
                    onChange={setFechaDesde}
                    placeholder="Fecha desde"
                    title="Fecha desde"
                    className="h-8 w-[140px] px-3 text-xs"
                />
                <DatePicker
                    value={fechaHasta}
                    onChange={setFechaHasta}
                    placeholder="Fecha hasta"
                    title="Fecha hasta"
                    className="h-8 w-[140px] px-3 text-xs"
                />
                <div className="ml-auto flex items-center gap-2">
                    {puedeEditar && !vistaBackend && (
                        <button
                            onClick={() => setModalNuevoActivo(true)}
                            className="inline-flex h-8 items-center gap-1.5 rounded-md bg-blue-600 px-3 text-xs font-semibold text-white hover:bg-blue-500 transition-colors"
                        >
                            <Package className="h-3.5 w-3.5" />
                            Crear tipo de activo
                        </button>
                    )}
                </div>
            </BarraFiltros>

            {cargando ? (
                <div className="space-y-4 mt-6">
                    {Array.from({ length: 3 }).map((_, idx) => (
                        <div key={idx} className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 space-y-3">
                            <div className="flex justify-between items-center">
                                <Skeleton className="h-5 w-48" />
                                <Skeleton className="h-4 w-24" />
                            </div>
                            <div className="pl-6 space-y-2">
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-5/6" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : vistaBackend ? (
                <VistaActivosItems />
            ) : (
                <JerarquiaActivos
                    contenedores={contenedoresFiltrados}
                    onNavegar={onNavegar}
                    onVistaChange={setVistaJerarquia}
                />
            )}
        </LayoutPagina>
    );
};

import { useEffect } from 'react';

export function VistaActivosItems() {
    const [items, setItems] = useState<any[]>([]);
    const [cargando, setCargando] = useState(true);

    useEffect(() => {
        const obtenerItemsDesdeAPI = async () => {
            try {
                const token = obtenerToken();
                if (!token) throw new Error('Tu sesión expiró. Inicia sesión nuevamente.');

                const respuesta = await fetch(construirUrlApi('/activos/items'), {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                if (!respuesta.ok) throw new Error("Error en la petición de red");
                const data = await respuesta.json();
                setItems(data);
            } catch (error) {
                console.error("Error al obtener items de activos:", error);
            } finally {
                setCargando(false);
            }
        };
        obtenerItemsDesdeAPI();
    }, []);

    if (cargando) {
        return (
            <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
                        <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-800/50 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
                            <tr>
                                <th className="px-4 py-3 font-semibold">Inventario</th>
                                <th className="px-4 py-3 font-semibold">Único</th>
                                <th className="px-4 py-3 font-semibold">Activo Asociado</th>
                                <th className="px-4 py-3 font-semibold">Estado</th>
                                <th className="px-4 py-3 font-semibold">Descripción/U.E.</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                            {Array.from({ length: 5 }).map((_, idx) => (
                                <tr key={idx}>
                                    <td className="px-4 py-3"><Skeleton className="h-4 w-16" /></td>
                                    <td className="px-4 py-3"><Skeleton className="h-4 w-16" /></td>
                                    <td className="px-4 py-3"><Skeleton className="h-4 w-32" /></td>
                                    <td className="px-4 py-3"><Skeleton className="h-6 w-20 rounded-full" /></td>
                                    <td className="px-4 py-3"><Skeleton className="h-4 w-40" /></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    }

    return (
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
                    <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-800/50 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
                        <tr>
                            <th className="px-4 py-3 font-semibold">Inventario</th>
                            <th className="px-4 py-3 font-semibold">Único</th>
                            <th className="px-4 py-3 font-semibold">Activo Asociado</th>
                            <th className="px-4 py-3 font-semibold">Estado</th>
                            <th className="px-4 py-3 font-semibold">Descripción/U.E.</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                        {items.length === 0 && (
                            <tr>
                                <td colSpan={5} className="py-4 text-center text-slate-500">No hay datos en la base de datos local (PostgreSQL).</td>
                            </tr>
                        )}
                        {items.map((item) => {
                            const canonico = normalizarEstadoItem(item.estado);
                            const claseEstado = canonico === 'disponible'
                                ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/20'
                                : canonico === 'en_mantenimiento'
                                    ? 'bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-500/20'
                                    : canonico === 'en_prestamo'
                                        ? 'bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-500/10 dark:text-blue-400 dark:ring-blue-500/20'
                                        : canonico === 'extraviado'
                                            ? 'bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-500/10 dark:text-red-400 dark:ring-red-500/20'
                                            : canonico === 'dado_de_baja'
                                                ? 'bg-slate-100 text-slate-700 ring-slate-500/20 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-400/20'
                                                : 'bg-slate-100 text-slate-700 ring-slate-500/20 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-400/20';

                            return (
                                <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">
                                        <span className="rounded bg-slate-100 px-2 py-0.5 font-mono text-xs dark:bg-slate-800">
                                            {String(item.codigoInventario ?? '').trim() || '—'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">
                                        <span className="rounded bg-slate-100 px-2 py-0.5 font-mono text-xs dark:bg-slate-800">
                                            {String(item.codigoUnico ?? '').trim() || '—'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">{item.activo?.nombre || 'N/A'}</td>
                                    <td className="px-4 py-3">
                                        <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset ${claseEstado}`}>
                                            {etiquetaEstadoItem(item.estado)}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-xs text-slate-500">
                                        {item.descripcion || item.ue || '-'}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

