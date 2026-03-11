import { useState } from 'react';
import { Package, Layers, AlertCircle } from 'lucide-react';
import { type PaginaApp } from '../componentes/inventario/MenuLateral';
import { LayoutPagina } from '../componentes/layout/LayoutPagina';
import { BarraFiltros } from '../componentes/layout/BarraFiltros';
import { TarjetaMetrica } from '../componentes/ui/tarjeta-metrica';
import { JerarquiaMaterialFungible } from '../componentes/inventario/JerarquiaMaterialFungible';
import { useInventario } from '../contextos/ContextoInventario';
import { BotonesAuditoria } from '../componentes/layout/BotonesAuditoria';
import { cargarKardexMaterialEnBackend } from '../lib/servicio-inventario';
import type { KardexMaterial } from '../tipos/inventario';
import { ModalBase } from '../componentes/inventario/ModalBase';

interface Props {
    onNavegar: (pagina: PaginaApp) => void;
    onCerrarSesion: () => void;
}

export const MaterialFungible = ({ onNavegar, onCerrarSesion }: Props) => {
    const { contenedoresMateriales } = useInventario();
    const [busqueda, setBusqueda] = useState('');
    const [soloBajoStock, setSoloBajoStock] = useState(false);
    const [fechaDesde, setFechaDesde] = useState('');
    const [fechaHasta, setFechaHasta] = useState('');
    const [vistaBackend, setVistaBackend] = useState(false);
    const [kardexAbierto, setKardexAbierto] = useState<KardexMaterial | null>(null);
    const [kardexError, setKardexError] = useState('');

    const abrirKardex = async (idMaterial: string) => {
        setKardexError('');
        try {
            const data = await cargarKardexMaterialEnBackend(idMaterial);
            setKardexAbierto(data);
        } catch (err: any) {
            setKardexError(err?.message ?? 'No se pudo cargar el kardex.');
        }
    };

    const fechaEnRango = (fecha?: string) => {
        if (!fechaDesde && !fechaHasta) return true;
        if (!fecha) return false;
        const desdeOk = !fechaDesde || fecha >= fechaDesde;
        const hastaOk = !fechaHasta || fecha <= fechaHasta;
        return desdeOk && hastaOk;
    };

    const totalContenedores = contenedoresMateriales.length;
    const totalArticulos = contenedoresMateriales.reduce((acc, c) => acc + c.materiales.length, 0);

    // Contar bajo stock
    let artículosBajoStock = 0;
    contenedoresMateriales.forEach(c => {
        c.materiales.forEach(m => {
            const totalDisp = m.subinstancias.reduce((sum, s) => sum + s.cantidadDisponible, 0);
            if (totalDisp <= m.stockMinimo) artículosBajoStock++;
        });
    });

    const contenedoresFiltrados = contenedoresMateriales.filter(c => {
        const term = busqueda.toLowerCase();

        // Filtro por bajo stock: Si soloBajoStock está activo, el contenedor debe tener al menos un material bajo stock
        const tieneBajoStock = !soloBajoStock || c.materiales.some(m => {
            const totalDisp = m.subinstancias.reduce((sum, s) => sum + s.cantidadDisponible, 0);
            return totalDisp <= m.stockMinimo;
        });

        if (!tieneBajoStock) return false;

        const tieneFechaEnRango = c.materiales.some(m => m.subinstancias.some(sub => fechaEnRango(sub.fechaRetiro || sub.fechaEntrega)));

        if (!tieneFechaEnRango) return false;

        if (!term) return true;
        if (c.nombre.toLowerCase().includes(term) || c.ubicacion.toLowerCase().includes(term)) return true;

        return c.materiales.some(m =>
            m.nombre.toLowerCase().includes(term) ||
            m.categoria.toLowerCase().includes(term) ||
            m.subinstancias.some(sub => sub.lote.toLowerCase().includes(term))
        );
    });

    const itemsFiltrados = contenedoresFiltrados.flatMap(c =>
        c.materiales.flatMap(m =>
            m.subinstancias
                .filter(sub => {
                    return fechaEnRango(sub.fechaRetiro || sub.fechaEntrega);
                })
                .map(sub => ({ contenedor: c.nombre, material: m, sub }))
        )
    );

    const descargarExcelMateriales = () => {
        const encabezados = ['Contenedor', 'Articulo', 'Categoria', 'Item', 'FechaEntrega', 'FechaRetiro', 'Unidad', 'Cantidad', 'PrecioUnitario', 'Caducidad'];
        const filas = itemsFiltrados.map(({ contenedor, material, sub }) => [
            contenedor,
            material.nombre,
            material.categoria,
            sub.lote,
            sub.fechaEntrega ?? '',
            sub.fechaRetiro ?? '',
            material.unidad,
            sub.cantidadDisponible,
            sub.precio ?? 0,
            sub.fechaCaducidad ?? ''
        ]);

        const csv = [encabezados, ...filas]
            .map(fila => fila.map(valor => `"${String(valor).replace(/"/g, '""')}"`).join(';'))
            .join('\n');

        const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `auditoria_materiales_filtrados_${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const generarPdfMateriales = () => {
        const filas = itemsFiltrados.map(({ contenedor, material, sub }) => `
            <tr>
                <td>${contenedor}</td>
                <td>${material.nombre}</td>
                <td>${material.categoria}</td>
                <td>${sub.lote}</td>
                <td>${sub.fechaEntrega ?? '-'}</td>
                <td>${sub.fechaRetiro ?? '-'}</td>
                <td>${material.unidad}</td>
                <td>${sub.cantidadDisponible}</td>
                <td>${sub.precio ?? 0}</td>
                <td>${sub.fechaCaducidad ?? '-'}</td>
            </tr>
        `).join('');

        const ventana = window.open('', '_blank', 'width=1200,height=800');
        if (!ventana) return;
        ventana.document.write(`
            <html><head><title>Auditoria Materiales</title>
            <style>body{font-family:Arial;padding:24px}table{width:100%;border-collapse:collapse;font-size:12px}th,td{border:1px solid #d1d5db;padding:6px;text-align:left}th{background:#f3f4f6}</style>
            </head><body>
            <h1>Reporte de Auditoria - Materiales Fungibles</h1>
            <p>Generado: ${new Date().toLocaleString('es-BO')} · Registros: ${itemsFiltrados.length}</p>
            <table><thead><tr><th>Contenedor</th><th>Artículo</th><th>Categoría</th><th>Item</th><th>Entrega</th><th>Retiro</th><th>Unidad</th><th>Cantidad</th><th>Precio</th><th>Caducidad</th></tr></thead><tbody>${filas}</tbody></table>
            </body></html>
        `);
        ventana.document.close();
        ventana.focus();
        ventana.print();
    };

    return (
        <LayoutPagina
            paginaActiva="material"
            titulo="Gestión de Material Fungible"
            subtitulo="Jerarquía de Contenedores y Artículos Consumibles"
            alertas={artículosBajoStock}
            onNavegar={onNavegar}
            onCerrarSesion={onCerrarSesion}
        >
            <div className="grid grid-cols-3 gap-4">
                <TarjetaMetrica titulo="Contenedores" valor={totalContenedores} Icono={Package} colorBase="indigo" />
                <TarjetaMetrica titulo="Artículos (Instancias)" valor={totalArticulos} Icono={Layers} colorBase="emerald" />
                <TarjetaMetrica titulo="Alerta Stock Bajo" valor={artículosBajoStock} Icono={AlertCircle} colorBase="amber" />
            </div>

            <BarraFiltros
                busqueda={busqueda}
                onBusquedaChange={setBusqueda}
                placeholder="Buscar por contenedor, artículo o lote..."
                filtrosActivos={soloBajoStock || !!fechaDesde || !!fechaHasta}
                onLimpiarFiltros={() => { setBusqueda(''); setSoloBajoStock(false); setFechaDesde(''); setFechaHasta(''); }}
                textoResultados={`${contenedoresFiltrados.length} contenedores`}
            >
                <label className="flex cursor-pointer items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
                    <input
                        type="checkbox"
                        checked={soloBajoStock}
                        onChange={e => setSoloBajoStock(e.target.checked)}
                        className="accent-amber-500"
                    />
                    Solo stock bajo
                </label>

                <input
                    type="date"
                    value={fechaDesde}
                    onChange={e => setFechaDesde(e.target.value)}
                    className="h-8 rounded-md border border-slate-200 bg-white px-2 text-xs text-slate-700 outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                    title="Fecha desde"
                />
                <input
                    type="date"
                    value={fechaHasta}
                    onChange={e => setFechaHasta(e.target.value)}
                    className="h-8 rounded-md border border-slate-200 bg-white px-2 text-xs text-slate-700 outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                    title="Fecha hasta"
                />
                <BotonesAuditoria onExcel={descargarExcelMateriales} onPdf={generarPdfMateriales} />

                <button
                    onClick={() => setVistaBackend(!vistaBackend)}
                    className="ml-auto rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500"
                >
                    {vistaBackend ? 'Ver Jerarquía Original' : 'Test API (Cajas)'}
                </button>
            </BarraFiltros>

            {vistaBackend ? (
                <VistaMaterialesCajas onVerKardex={abrirKardex} />
            ) : (
                <JerarquiaMaterialFungible contenedores={contenedoresFiltrados} />
            )}

            {kardexError && (
                <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">{kardexError}</div>
            )}

            {kardexAbierto && (
                <ModalBase titulo={`Kardex - ${kardexAbierto.materialNombre ?? `Material #${kardexAbierto.materialId}`}`} onCerrar={() => setKardexAbierto(null)} ancho="max-w-3xl">
                    <div className="max-h-[65vh] overflow-auto rounded-md border border-slate-200 dark:border-slate-700">
                        <table className="w-full text-xs">
                            <thead className="bg-slate-50 dark:bg-slate-800/70">
                                <tr>
                                    <th className="px-3 py-2 text-left">Fecha</th>
                                    <th className="px-3 py-2 text-left">Lote</th>
                                    <th className="px-3 py-2 text-left">Tipo</th>
                                    <th className="px-3 py-2 text-right">Cantidad</th>
                                    <th className="px-3 py-2 text-left">Motivo</th>
                                    <th className="px-3 py-2 text-left">Referencia</th>
                                </tr>
                            </thead>
                            <tbody>
                                {kardexAbierto.movimientos.length === 0 && (
                                    <tr><td className="px-3 py-3 text-slate-500" colSpan={6}>Sin movimientos registrados.</td></tr>
                                )}
                                {kardexAbierto.movimientos.map((m) => (
                                    <tr key={m.id} className="border-t border-slate-100 dark:border-slate-800">
                                        <td className="px-3 py-2">{new Date(m.fecha).toLocaleString('es-BO')}</td>
                                        <td className="px-3 py-2">{m.lote}</td>
                                        <td className="px-3 py-2">
                                            <span className={`rounded-full px-2 py-0.5 ${m.tipo === 'entrada' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{m.tipo}</span>
                                        </td>
                                        <td className="px-3 py-2 text-right font-semibold">{m.cantidad}</td>
                                        <td className="px-3 py-2">{m.motivo}</td>
                                        <td className="px-3 py-2">{m.referencia ?? '-'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </ModalBase>
            )}
        </LayoutPagina>
    );
};

import { useEffect } from 'react';

export function VistaMaterialesCajas({ onVerKardex }: { onVerKardex: (idMaterial: string) => void }) {
    const [cajas, setCajas] = useState<any[]>([]);
    const [cargando, setCargando] = useState(true);

    useEffect(() => {
        const obtenerCajasDesdeAPI = async () => {
            try {
                const respuesta = await fetch('http://localhost:3001/materiales/cajas');
                if (!respuesta.ok) throw new Error("Error en la petición de red");
                const data = await respuesta.json();
                setCajas(data);
            } catch (error) {
                console.error("Error al obtener cajas:", error);
            } finally {
                setCargando(false);
            }
        };
        obtenerCajasDesdeAPI();
    }, []);

    if (cargando) return <div className="p-8 text-center text-slate-500">Cargando inventario de cajas desde el backend...</div>;

    return (
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
                    <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-800/50 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
                        <tr>
                            <th className="px-4 py-3 font-semibold">Nombre del Material</th>
                            <th className="px-4 py-3 font-semibold">Categoría</th>
                            <th className="px-4 py-3 font-semibold">Unidad</th>
                            <th className="px-4 py-3 font-semibold text-center">Stock Mín.</th>
                            <th className="px-4 py-3 font-semibold text-center">Lotes Asociados</th>
                            <th className="px-4 py-3 font-semibold text-center">Kardex</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                        {cajas.length === 0 && (
                            <tr>
                                <td colSpan={6} className="py-4 text-center text-slate-500">No hay datos en la base de datos local (PostgreSQL).</td>
                            </tr>
                        )}
                        {cajas.map((caja) => (
                            <tr key={caja.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{caja.nombre}</td>
                                <td className="px-4 py-3">{caja.categoria}</td>
                                <td className="px-4 py-3">{caja.unidad}</td>
                                <td className="px-4 py-3 text-center">{caja.stockMinimo}</td>
                                <td className="px-4 py-3 text-center">
                                    <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10 dark:bg-blue-900/20 dark:text-blue-400 dark:ring-blue-400/20">
                                        {caja.lotes ? caja.lotes.length : 0} Lote(s)
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-center">
                                    <button
                                        onClick={() => onVerKardex(String(caja.id))}
                                        className="rounded-md bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
                                    >
                                        Ver Kardex
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

