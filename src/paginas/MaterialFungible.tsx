import { useState } from 'react';
import { Package, Layers, AlertCircle } from 'lucide-react';
import type { PaginaApp } from '@/tipos/navegacion';
import { LayoutPagina } from '@/componentes/layout/layout-pagina';
import { BarraFiltros } from '@/componentes/layout/barra-filtros';
import { TarjetaMetrica } from '@/componentes/ui/tarjeta-metrica';
import { JerarquiaMaterialFungible } from '@/componentes/inventario/jerarquia-material-fungible';
import { FormularioEdicionJerarquia } from '@/componentes/inventario/formulario-edicion-jerarquia';
import { useInventario } from '@/contextos/ContextoInventario';
import { DatePicker } from '@/componentes/ui/date-picker';

interface Props {
    onNavegar: (pagina: PaginaApp) => void;
    onCerrarSesion: () => void;
}

export const MaterialFungible = ({ onNavegar, onCerrarSesion }: Props) => {
    const { contenedoresMateriales, agregarMaterialFungible } = useInventario();
    const [busqueda, setBusqueda] = useState('');
    const [soloBajoStock, setSoloBajoStock] = useState(false);
    const [fechaDesde, setFechaDesde] = useState('');
    const [fechaHasta, setFechaHasta] = useState('');
    const [modalNuevoActivoFungible, setModalNuevoActivoFungible] = useState(false);
    const [vistaJerarquia, setVistaJerarquia] = useState<'tabla' | 'cajas'>('tabla');

    const fechaEnRango = (fecha?: string) => {
        if (!fechaDesde && !fechaHasta) return true;
        if (!fecha) return false;
        const desdeOk = !fechaDesde || fecha >= fechaDesde;
        const hastaOk = !fechaHasta || fecha <= fechaHasta;
        return desdeOk && hastaOk;
    };

    const totalContenedores = contenedoresMateriales.length;
    const totalArticulos = contenedoresMateriales.reduce(
        (acc, c) => acc + c.materiales.reduce((sum, m) => sum + (m.subinstancias?.length ?? 0), 0),
        0,
    );

    let artículosBajoStock = 0;
    contenedoresMateriales.forEach(c => {
        c.materiales.forEach(m => {
            const totalDisp = m.subinstancias.reduce((sum, s) => sum + s.cantidadDisponible, 0);
            if (m.stockMinimoHabilitado && totalDisp <= m.stockMinimo) artículosBajoStock++;
        });
    });

    const contenedoresFiltrados = contenedoresMateriales.filter(c => {
        const term = busqueda.toLowerCase();
        const filtroFechaActivo = !!fechaDesde || !!fechaHasta;

        const tieneBajoStock = !soloBajoStock || c.materiales.some(m => {
            const totalDisp = m.subinstancias.reduce((sum, s) => sum + s.cantidadDisponible, 0);
            return m.stockMinimoHabilitado && totalDisp <= m.stockMinimo;
        });

        if (!tieneBajoStock) return false;

        if (filtroFechaActivo) {
            const tieneFechaEnRango = c.materiales.some(m => m.subinstancias.some(sub => fechaEnRango(sub.fechaRetiro || sub.fechaEntrega)));
            if (!tieneFechaEnRango) return false;
        }

        if (!term) return true;
        if (c.nombre.toLowerCase().includes(term) || c.descripcion.toLowerCase().includes(term)) return true;

        return c.materiales.some(m =>
            m.nombre.toLowerCase().includes(term) ||
            m.subinstancias.some(sub => String(sub.lote ?? sub.serie ?? '').toLowerCase().includes(term))
        );
    }).sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));


    return (
        <LayoutPagina
            paginaActiva="material"
            titulo="Gestión de Activos Fungibles"
            subtitulo="Jerarquía de contenedores, productos y lotes consumibles"
            alertas={artículosBajoStock}
            onNavegar={onNavegar}
            onCerrarSesion={onCerrarSesion}
        >
            <div className="grid grid-cols-3 gap-4">
                <TarjetaMetrica titulo="Contenedores" valor={totalContenedores} Icono={Package} colorBase="indigo" />
                <TarjetaMetrica titulo="Artículos (Instancias)" valor={totalArticulos} Icono={Layers} colorBase="emerald" />
                <TarjetaMetrica titulo="Alerta Stock Bajo" valor={artículosBajoStock} Icono={AlertCircle} colorBase="amber" />
            </div>

            {modalNuevoActivoFungible && (
                <FormularioEdicionJerarquia
                    titulo="Crear activo fungible"
                    mensajeExito="Activo fungible creado correctamente."
                    mensajeError="No se pudo crear el activo fungible."
                    camposIniciales={[
                        { key: 'nombre', label: 'Nombre del activo fungible', value: '' },
                        { key: 'descripcion', label: 'Descripción', value: '', type: 'textarea', required: false, rows: 4 },
                        { key: 'unidad', label: 'Unidad', value: 'Unidades', inputClassName: 'max-w-[10rem]' },
                        {
                            key: 'tipoIdentificacion',
                            label: 'Identificación de instancias',
                            value: 'simple',
                            type: 'select',
                            options: [
                                { value: 'simple', label: 'Sin lote/serie (simple)' },
                                { value: 'lote', label: 'Por lote' },
                                { value: 'serie', label: 'Por serie' },
                            ],
                        },
                        {
                            key: 'stockMinimoHabilitado',
                            label: '¿Usa stock mínimo?',
                            value: 'no',
                            type: 'select',
                            options: [
                                { value: 'no', label: 'No' },
                                { value: 'si', label: 'Sí' },
                            ],
                        },
                        {
                            key: 'stockMinimo',
                            label: 'Stock mínimo',
                            value: '0',
                            type: 'number',
                            requiredWhen: (v) => v.stockMinimoHabilitado === 'si',
                            visibleWhen: (v) => v.stockMinimoHabilitado === 'si',
                            defaultValueWhenVisible: '0',
                            inputClassName: 'max-w-[10rem]',
                        },
                    ]}
                    onGuardar={async (valores) => {
                        await agregarMaterialFungible({
                            nombre: valores.nombre.trim(),
                            categoria: 'Fungible',
                            descripcion: valores.descripcion.trim(),
                            unidad: valores.unidad.trim() || 'Unidades',
                            stockMinimoHabilitado: valores.stockMinimoHabilitado === 'si',
                            stockMinimo: Number(valores.stockMinimo ?? 0),
                            tipoIdentificacion: (valores.tipoIdentificacion as any) || 'simple',
                        });
                    }}
                    onCerrar={() => setModalNuevoActivoFungible(false)}
                />
            )}

            <BarraFiltros
                busqueda={busqueda}
                onBusquedaChange={setBusqueda}
                placeholder="Buscar por contenedor, artículo o lote..."
                filtrosActivos={soloBajoStock || !!fechaDesde || !!fechaHasta}
                onLimpiarFiltros={() => { setBusqueda(''); setSoloBajoStock(false); setFechaDesde(''); setFechaHasta(''); }}
                unaLinea
            >
                <label className="flex cursor-pointer items-center gap-2 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
                    <input
                        type="checkbox"
                        checked={soloBajoStock}
                        onChange={e => setSoloBajoStock(e.target.checked)}
                        className="accent-amber-500"
                    />
                    Solo stock bajo
                </label>

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
                    {vistaJerarquia !== 'cajas' && (
                        <button
                            onClick={() => setModalNuevoActivoFungible(true)}
                            className="inline-flex h-8 items-center gap-1.5 rounded-md bg-emerald-600 px-3 text-xs font-semibold text-white hover:bg-emerald-500"
                        >
                            <Package className="h-3.5 w-3.5" />
                            Crear activo fungible
                        </button>
                    )}
                </div>
            </BarraFiltros>

            <JerarquiaMaterialFungible contenedores={contenedoresFiltrados} onVistaChange={setVistaJerarquia} />
        </LayoutPagina>
    );
};

