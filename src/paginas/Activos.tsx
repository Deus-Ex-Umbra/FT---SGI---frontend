import { useState } from 'react';
import { Package, Wrench, Boxes } from 'lucide-react';
import { type PaginaApp } from '../componentes/inventario/MenuLateral';
import { LayoutPagina } from '../componentes/layout/LayoutPagina';
import { BarraFiltros } from '../componentes/layout/BarraFiltros';
import { TarjetaMetrica } from '../componentes/ui/tarjeta-metrica';
import { JerarquiaActivos } from '../componentes/inventario/JerarquiaActivos';
import { useInventario } from '../contextos/ContextoInventario';
import type { EstadoHerramienta } from '../tipos/inventario';

interface Props {
    onNavegar: (pagina: PaginaApp) => void;
    onCerrarSesion: () => void;
}

export const Activos = ({ onNavegar, onCerrarSesion }: Props) => {
    const { contenedoresHerramientas } = useInventario();
    const [busqueda, setBusqueda] = useState('');
    const [filtroEstado, setFiltroEstado] = useState<EstadoHerramienta | ''>('');
    const [fechaDesde, setFechaDesde] = useState('');
    const [fechaHasta, setFechaHasta] = useState('');
    const vistaBackend = false;

    const fechaEnRango = (fecha?: string) => {
        if (!fechaDesde && !fechaHasta) return true;
        if (!fecha) return false;
        const desdeOk = !fechaDesde || fecha >= fechaDesde;
        const hastaOk = !fechaHasta || fecha <= fechaHasta;
        return desdeOk && hastaOk;
    };

    const totalContenedores = contenedoresHerramientas.length;
    const totalInstancias = contenedoresHerramientas.reduce((acc, c) => acc + c.herramientas.length, 0);
    const totalSubinstancias = contenedoresHerramientas.reduce((acc, c) =>
        acc + c.herramientas.reduce((acc2, h) => acc2 + h.subinstancias.length, 0), 0);

    // Búsqueda muy basica a nivel de contenedor e instancia
    const contenedoresFiltrados = contenedoresHerramientas.filter(c => {
        const term = busqueda.toLowerCase();
        const coincideTexto = !term ||
            c.nombre.toLowerCase().includes(term) ||
            c.ubicacion.toLowerCase().includes(term) ||
            c.herramientas.some(h =>
                h.nombre.toLowerCase().includes(term) ||
                h.categoria.toLowerCase().includes(term) ||
                h.subinstancias.some(sub => sub.codigoInventario.toLowerCase().includes(term))
            );

        const coincideEstado = !filtroEstado || c.herramientas.some(h => h.subinstancias.some(sub => sub.estado === filtroEstado));
        const coincideFecha = c.herramientas.some(h => h.subinstancias.some(sub => fechaEnRango(sub.fechaRetiro || sub.fechaEntrega)));
        return coincideTexto && coincideEstado && coincideFecha;
    });


    return (
        <LayoutPagina
            paginaActiva="activos"
            titulo="Gestión de Activos"
            subtitulo="Jerarquía de Contenedores, Cajas y Subítems"
            alertas={0}
            onNavegar={onNavegar}
            onCerrarSesion={onCerrarSesion}
        >
            <div className="grid grid-cols-3 gap-4">
                <TarjetaMetrica titulo="Contenedores" valor={totalContenedores} Icono={Package} colorBase="indigo" />
                <TarjetaMetrica titulo="Cajas (Instancias)" valor={totalInstancias} Icono={Wrench} colorBase="blue" />
                <TarjetaMetrica titulo="Ítems Físicos (Subinstancias)" valor={totalSubinstancias} Icono={Boxes} colorBase="emerald" />
            </div>

            <BarraFiltros
                busqueda={busqueda}
                onBusquedaChange={setBusqueda}
                placeholder="Buscar por contenedor, modelo o código..."
                filtrosActivos={!!filtroEstado || !!fechaDesde || !!fechaHasta}
                onLimpiarFiltros={() => { setBusqueda(''); setFiltroEstado(''); setFechaDesde(''); setFechaHasta(''); }}
                textoResultados={`${contenedoresFiltrados.length} contenedores`}
            >
                <select
                    value={filtroEstado}
                    onChange={e => setFiltroEstado(e.target.value as EstadoHerramienta | '')}
                    title="Filtrar por estado"
                    className="h-8 rounded-md border border-slate-200 bg-white px-3 text-xs text-slate-700 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                >
                    <option value="">Todos los estados</option>
                    <option value="buen_estado">Buen estado</option>
                    <option value="regular">Regular</option>
                    <option value="en_mantenimiento">En mantenimiento</option>
                    <option value="danado">Dañado</option>
                </select>
                <input
                    type="date"
                    value={fechaDesde}
                    onChange={e => setFechaDesde(e.target.value)}
                    className="h-8 rounded-md border border-slate-200 bg-white px-2 text-xs text-slate-700 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                    title="Fecha desde"
                />
                <input
                    type="date"
                    value={fechaHasta}
                    onChange={e => setFechaHasta(e.target.value)}
                    className="h-8 rounded-md border border-slate-200 bg-white px-2 text-xs text-slate-700 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                    title="Fecha hasta"
                />
            </BarraFiltros>

            {vistaBackend ? (
                <VistaActivosItems />
            ) : (
                <JerarquiaActivos
                    contenedores={contenedoresFiltrados}
                    onNavegar={onNavegar}
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
                const respuesta = await fetch('http://localhost:3001/activos/items');
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

    if (cargando) return <div className="p-8 text-center text-slate-500">Cargando ítems desde el backend...</div>;

    return (
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
                    <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-800/50 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
                        <tr>
                            <th className="px-4 py-3 font-semibold">Código Inventario</th>
                            <th className="px-4 py-3 font-semibold">Activo Asociado</th>
                            <th className="px-4 py-3 font-semibold">Estado</th>
                            <th className="px-4 py-3 font-semibold">Descripción/U.E.</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                        {items.length === 0 && (
                            <tr>
                                <td colSpan={4} className="py-4 text-center text-slate-500">No hay datos en la base de datos local (PostgreSQL).</td>
                            </tr>
                        )}
                        {items.map((item) => (
                            <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">
                                    <span className="rounded bg-slate-100 px-2 py-0.5 font-mono text-xs dark:bg-slate-800">
                                        {item.codigoInventario}
                                    </span>
                                </td>
                                <td className="px-4 py-3">{item.activo?.nombre || 'N/A'}</td>
                                <td className="px-4 py-3">
                                    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset ${item.estado === 'buen_estado' ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/20' :
                                        item.estado === 'regular' ? 'bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-500/20' :
                                            'bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-500/10 dark:text-red-400 dark:ring-red-500/20'
                                        }`}>
                                        {item.estado.replace('_', ' ').toUpperCase()}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-xs text-slate-500">
                                    {item.descripcion || item.ue || '-'}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
