import { Wrench, AlertTriangle, ClipboardList, GraduationCap, Package, Activity } from 'lucide-react';
import { type PaginaApp } from '../componentes/inventario/MenuLateral';
import { LayoutPagina } from '../componentes/layout/LayoutPagina';
import { TarjetaMetrica } from '../componentes/ui/tarjeta-metrica';
import { useInventario } from '../contextos/ContextoInventario';

interface Props {
    onNavegar: (pagina: PaginaApp) => void;
    onCerrarSesion: () => void;
}

export const Resumen = ({ onNavegar, onCerrarSesion }: Props) => {
    const { herramientas, prestamos, estudiantes, materiales } = useInventario();

    // Cálculos de métricas
    const totalHerramientas = herramientas.length;
    const herramientasAlerta = herramientas.filter(h => h.estado === 'danado' || h.estado === 'en_mantenimiento').length;
    const prestamosActivos = prestamos.filter(p => p.estado === 'activo').length;
    const prestamosVencidos = prestamos.filter(p => p.estado === 'vencido').length;
    const totalEstudiantes = estudiantes.length;
    const materialBajoStock = materiales.filter(m => {
        const total = m.subinstancias.reduce((acc, sub) => acc + sub.cantidadDisponible, 0);
        return total <= m.stockMinimo;
    }).length;

    // Cálculos monetarios
    const valorActivosBob = herramientas.reduce((acc, h) => acc + h.subinstancias.reduce((sAcc, s) => sAcc + (s.precio || 0), 0), 0);
    const valorMaterialesBob = materiales.reduce((acc, m) => acc + m.subinstancias.reduce((sAcc, s) => sAcc + (s.cantidadDisponible * (s.precio || 0)), 0), 0);
    const valorTotalBob = valorActivosBob + valorMaterialesBob;
    const tc = 6.96;
    const valorTotalUsd = valorTotalBob / tc;

    return (
        <LayoutPagina
            paginaActiva="resumen"
            titulo="Resumen General"
            subtitulo="Vista general del sistema de laboratorios"
            alertas={herramientasAlerta + prestamosVencidos + materialBajoStock}
            onNavegar={onNavegar}
            onCerrarSesion={onCerrarSesion}
        >
            {/* Ojo: Banner de Inversión Global */}
            <div className="mb-6 rounded-xl border border-blue-200 bg-blue-50/50 p-5 shadow-sm dark:border-blue-900/50 dark:bg-blue-900/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-sm font-bold text-blue-800 dark:text-blue-300 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                        <Activity className="h-4 w-4" /> Capital de Inversión Total
                    </h2>
                    <p className="text-xs text-blue-600/80 dark:text-blue-400/80">
                        ({valorActivosBob.toLocaleString('es-BO', { minimumFractionDigits: 2 })} Bs. en Activos + {valorMaterialesBob.toLocaleString('es-BO', { minimumFractionDigits: 2 })} Bs. en Materiales)
                    </p>
                </div>
                <div className="flex flex-col items-end text-right">
                    <span className="text-2xl font-black text-blue-900 dark:text-blue-100 tracking-tight">
                        Bs. {valorTotalBob.toLocaleString('es-BO', { minimumFractionDigits: 2 })}
                    </span>
                    <span className="text-xs font-semibold text-blue-600/70 dark:text-blue-400/70">
                        ≈ USD {(valorTotalUsd).toLocaleString('es-BO', { minimumFractionDigits: 2 })}
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Tarjeta Herramientas */}
                <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <TarjetaMetrica titulo="Total Activos Fijos" valor={totalHerramientas} Icono={Wrench} colorBase="blue" />
                    <div className="mt-4 flex items-center text-xs">
                        {herramientasAlerta > 0 ? (
                            <span className="flex items-center text-amber-600 dark:text-amber-500 font-medium">
                                <AlertTriangle className="mr-1 h-3.5 w-3.5" />
                                {herramientasAlerta} requieren atención
                            </span>
                        ) : (
                            <span className="text-emerald-600 dark:text-emerald-500 font-medium">Todo en orden</span>
                        )}
                    </div>
                </div>

                {/* Tarjeta Préstamos */}
                <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <TarjetaMetrica titulo="Préstamos Activos" valor={prestamosActivos} Icono={ClipboardList} colorBase="indigo" />
                    <div className="mt-4 flex items-center text-xs">
                        {prestamosVencidos > 0 ? (
                            <span className="flex items-center text-red-600 dark:text-red-500 font-medium">
                                <AlertTriangle className="mr-1 h-3.5 w-3.5" />
                                {prestamosVencidos} vencidos
                            </span>
                        ) : (
                            <span className="text-slate-500 dark:text-slate-400">Al día</span>
                        )}
                    </div>
                </div>

                {/* Tarjeta Material Fungible */}
                <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <TarjetaMetrica titulo="Tipos de Materiales" valor={materiales.length} Icono={Package} colorBase="emerald" />
                    <div className="mt-4 flex items-center text-xs">
                        {materialBajoStock > 0 ? (
                            <span className="flex items-center text-red-600 dark:text-red-500 font-medium">
                                <AlertTriangle className="mr-1 h-3.5 w-3.5" />
                                {materialBajoStock} bajo stock mínimo
                            </span>
                        ) : (
                            <span className="text-emerald-600 dark:text-emerald-500 font-medium">Stock suficiente</span>
                        )}
                    </div>
                </div>

                {/* Tarjeta Estudiantes */}
                <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <TarjetaMetrica titulo="Estudiantes" valor={totalEstudiantes} Icono={GraduationCap} colorBase="amber" />
                    <div className="mt-4 flex items-center text-xs">
                        <span className="text-slate-500 dark:text-slate-400">Registrados en el sistema</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 flex items-center">
                            <Activity className="mr-2 h-4 w-4 text-blue-500" />
                            Estado del Inventario
                        </h3>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <div className="flex justify-between text-xs mb-1">
                                <span className="font-medium text-slate-700 dark:text-slate-300">Buen Estado</span>
                                <span className="text-slate-500">{herramientas.filter(h => h.estado === 'buen_estado').length}</span>
                            </div>
                            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                                <div className="h-full bg-emerald-500 transition-all" style={{ width: `${totalHerramientas > 0 ? (herramientas.filter(h => h.estado === 'buen_estado').length / totalHerramientas) * 100 : 0}%` }}></div>
                            </div>
                        </div>
                        <div>
                            <div className="flex justify-between text-xs mb-1">
                                <span className="font-medium text-slate-700 dark:text-slate-300">Regular</span>
                                <span className="text-slate-500">{herramientas.filter(h => h.estado === 'regular').length}</span>
                            </div>
                            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                                <div className="h-full bg-blue-500 transition-all" style={{ width: `${totalHerramientas > 0 ? (herramientas.filter(h => h.estado === 'regular').length / totalHerramientas) * 100 : 0}%` }}></div>
                            </div>
                        </div>
                        <div>
                            <div className="flex justify-between text-xs mb-1">
                                <span className="font-medium text-slate-700 dark:text-slate-300">En Mantenimiento</span>
                                <span className="text-slate-500">{herramientas.filter(h => h.estado === 'en_mantenimiento').length}</span>
                            </div>
                            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                                <div className="h-full bg-amber-500 transition-all" style={{ width: `${totalHerramientas > 0 ? (herramientas.filter(h => h.estado === 'en_mantenimiento').length / totalHerramientas) * 100 : 0}%` }}></div>
                            </div>
                        </div>
                        <div>
                            <div className="flex justify-between text-xs mb-1">
                                <span className="font-medium text-slate-700 dark:text-slate-300">Dañado</span>
                                <span className="text-slate-500">{herramientas.filter(h => h.estado === 'danado').length}</span>
                            </div>
                            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                                <div className="h-full bg-red-500 transition-all" style={{ width: `${totalHerramientas > 0 ? (herramientas.filter(h => h.estado === 'danado').length / totalHerramientas) * 100 : 0}%` }}></div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 flex flex-col items-center justify-center text-center">
                    <div className="flex h-16 w-16 mb-4 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                        <ClipboardList className="h-8 w-8 text-slate-400" />
                    </div>
                    <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-2">Próximos Vencimientos</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs leading-relaxed">
                        {prestamosActivos > 0
                            ? `Actualmente tienes ${prestamosActivos} préstamo(s) activo(s). Revisa la pestaña de Préstamos para ver los detalles y fechas de devolución.`
                            : "No hay préstamos activos en este momento."}
                    </p>
                    <button onClick={() => onNavegar('prestamos')} className="mt-4 rounded-md bg-blue-50 px-4 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition-colors dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50">
                        Ver préstamos
                    </button>
                </div>
            </div>
        </LayoutPagina>
    );
};
