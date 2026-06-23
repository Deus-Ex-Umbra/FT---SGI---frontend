import { useState } from 'react';
import { ClipboardList, Plus } from 'lucide-react';
import { AccionesFilaPrestamoUi } from '@/componentes/ui/acciones-fila-prestamo';
import { Boton } from '@/componentes/ui/button';
import type { Prestamo, EstadoPrestamo, ItemActivoResumen, Estudiante } from '@/tipos/inventario';
import { formatearFechaHora } from '@/utilidades/fechas';
import { DialogoDetallesPrestamo } from './dialogo-detalles-prestamo';


interface Props {
    prestamos: Prestamo[];
    herramientas: ItemActivoResumen[];
    estudiantes: Estudiante[];
    onRegistrar: () => void;
    onDevolver: (prestamo: Prestamo) => void;
    onExtender: (prestamo: Prestamo) => void;
    onEditar: (prestamo: Prestamo) => void;
}

const configEstado: Record<EstadoPrestamo, { etiqueta: string; clase: string }> = {
    solicitado: {
        etiqueta: 'Solicitado',
        clase: 'text-amber-700 bg-amber-50 border-amber-200 dark:text-amber-400 dark:bg-amber-950 dark:border-amber-855',
    },
    aceptado: {
        etiqueta: 'Aceptado',
        clase: 'text-purple-700 bg-purple-50 border-purple-200 dark:text-purple-400 dark:bg-purple-950 dark:border-purple-800',
    },
    rechazado: {
        etiqueta: 'Rechazado',
        clase: 'text-rose-700 bg-rose-50 border-rose-200 dark:text-rose-400 dark:bg-rose-950 dark:border-rose-800',
    },
    despachado: {
        etiqueta: 'Despachado',
        clase: 'text-blue-700 bg-blue-50 border-blue-200 dark:text-blue-400 dark:bg-blue-950 dark:border-blue-800',
    },
    pendiente: {
        etiqueta: 'Pendiente',
        clase: 'text-blue-700 bg-blue-50 border-blue-200 dark:text-blue-400 dark:bg-blue-950 dark:border-blue-800',
    },
    activo: {
        etiqueta: 'Activo',
        clase: 'text-blue-700 bg-blue-50 border-blue-200 dark:text-blue-400 dark:bg-blue-950 dark:border-blue-800',
    },
    devuelto: {
        etiqueta: 'Devuelto',
        clase: 'text-emerald-700 bg-emerald-50 border-emerald-200 dark:text-emerald-400 dark:bg-emerald-950 dark:border-emerald-800',
    },
    vencido: {
        etiqueta: 'Vencido',
        clase: 'text-red-700 bg-red-50 border-red-200 dark:text-red-400 dark:bg-red-950 dark:border-red-800',
    },
    devuelto_fuera_de_fecha_limite: {
        etiqueta: 'Devuelto fuera de fecha limite',
        clase: 'text-amber-700 bg-amber-50 border-amber-200 dark:text-amber-300 dark:bg-amber-950 dark:border-amber-800',
    },
};

export const TablaPrestamos = ({
    prestamos,
    herramientas,
    estudiantes,
    onRegistrar,
    onDevolver,
    onExtender,
    onEditar,
}: Props) => {
    const [prestamoParaVer, setPrestamoParaVer] = useState<Prestamo | null>(null);
    const resolverHerramienta = (id: string) => herramientas.find(h => h.id === id);
    const resolverEstudiante = (carnet: string) => estudiantes.find(e => e.carnet === carnet);

    const activos = prestamos.filter(p => p.estado === 'activo' || p.estado === 'pendiente').length;

    return (
        <div className="rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800">
                <div className="flex items-center gap-2">
                    <ClipboardList className="h-4 w-4 text-slate-500" />
                    <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                        Préstamos
                        <span className="ml-2 text-xs font-normal text-slate-400">({activos} activos · {prestamos.length} totales)</span>
                    </h2>
                </div>
                <Boton onClick={onRegistrar} className="h-8 gap-1.5 px-3 py-1.5 text-xs font-medium">
                    <Plus className="h-3.5 w-3.5" />
                    Registrar préstamo
                </Boton>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-xs">
                    <thead>
                        <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/50">
                            <th className="px-4 py-2.5 text-left font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">#</th>
                            <th className="px-4 py-2.5 text-left font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Carnet</th>
                            <th className="px-4 py-2.5 text-left font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Estudiante</th>
                            <th className="px-4 py-2.5 text-left font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Docente</th>
                            <th className="px-4 py-2.5 text-left font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Activo Fijo</th>
                            <th className="px-4 py-2.5 text-center font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Fecha préstamo</th>
                            <th className="px-4 py-2.5 text-center font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Fecha devolución</th>
                            <th className="px-4 py-2.5 text-left font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Observaciones</th>
                            <th className="px-4 py-2.5 text-center font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Estado</th>
                            <th className="px-4 py-2.5 text-center font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {prestamos.map((p, idx) => {
                            const herramienta = resolverHerramienta(p.idHerramienta);
                            const estudiante = resolverEstudiante(p.carnetEstudiante);
                            const cfg = configEstado[p.estado];
                            const esVencido = p.estado === 'vencido';
                            return (
                                <tr
                                    key={p.id}
                                    className={`transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/40 ${esVencido ? 'bg-red-50/60 dark:bg-red-950/20' : ''}`}
                                >
                                    <td className="px-4 py-2.5 text-slate-400">{idx + 1}</td>
                                    <td className="px-4 py-2.5 font-mono font-semibold text-blue-600 dark:text-blue-400">{p.carnetEstudiante}</td>
                                    <td className="px-4 py-2.5 font-medium text-slate-800 dark:text-slate-100 min-w-0">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <span className="truncate max-w-[150px]" title={estudiante ? `${estudiante.apellido}, ${estudiante.nombre}` : ''}>
                                                {estudiante ? `${estudiante.apellido}, ${estudiante.nombre}` : '—'}
                                            </span>
                                            {estudiante && (
                                                <span
                                                    className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold shrink-0 ${
                                                        estudiante.carnetRetenido
                                                            ? 'border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300'
                                                            : 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                                                    }`}
                                                >
                                                    {estudiante.carnetRetenido ? 'Carnet retenido' : 'Carnet libre'}
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-4 py-2.5 text-slate-700 dark:text-slate-300 max-w-[125px] truncate" title={p.docente}>
                                        {p.docente}
                                    </td>
                                    <td className="px-4 py-2.5 text-slate-700 dark:text-slate-300 max-w-[220px] truncate" title={
                                        herramienta
                                            ? (() => {
                                                const inv = String(herramienta.codigoInventario ?? '').trim();
                                                const uni = String(herramienta.codigoUnico ?? '').trim();
                                                const etiqueta = inv || uni
                                                    ? `I: ${inv || '—'} | U: ${uni || '—'}`
                                                    : 'SIN-CODIGO';
                                                return `[${etiqueta}] ${herramienta.nombre}`;
                                            })()
                                            : '—'
                                    }>
                                        {herramienta
                                            ? (() => {
                                                const inv = String(herramienta.codigoInventario ?? '').trim();
                                                const uni = String(herramienta.codigoUnico ?? '').trim();
                                                const etiqueta = inv || uni
                                                    ? `I: ${inv || '—'} | U: ${uni || '—'}`
                                                    : 'SIN-CODIGO';
                                                return `[${etiqueta}] ${herramienta.nombre}`;
                                            })()
                                            : '—'}
                                    </td>
                                    <td className="px-4 py-2.5 text-center text-slate-600 dark:text-slate-400">{formatearFechaHora(p.fechaPrestamo)}</td>
                                    <td className="px-4 py-2.5 text-center text-slate-600 dark:text-slate-400">
                                        {p.fechaDevolucion ? formatearFechaHora(p.fechaDevolucion) : <span className="text-slate-300 dark:text-slate-600">Pendiente</span>}
                                    </td>
                                    <td className="max-w-[160px] truncate px-4 py-2.5 text-slate-500 dark:text-slate-400" title={p.observaciones || ''}>
                                        {p.observaciones || '—'}
                                    </td>
                                    <td className="px-4 py-2.5">
                                        <div className="flex justify-center">
                                            <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${cfg.clase}`}>
                                                {cfg.etiqueta}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-2.5">
                                        <AccionesFilaPrestamoUi
                                            onEditar={() => onEditar(p)}
                                            onExtender={() => onExtender(p)}
                                            onDevolver={() => onDevolver(p)}
                                            onVer={() => setPrestamoParaVer(p)}
                                            deshabilitarExtenderYDevolver={p.estado === 'devuelto' || p.estado === 'devuelto_fuera_de_fecha_limite'}
                                        />
                                    </td>
                                </tr>
                            );
import { useState } from 'react';
import { ClipboardList, Plus } from 'lucide-react';
import { AccionesFilaPrestamoUi } from '@/componentes/ui/acciones-fila-prestamo';
import { Boton } from '@/componentes/ui/button';
import type { Prestamo, EstadoPrestamo, ItemActivoResumen, Estudiante } from '@/tipos/inventario';
import { formatearFechaHora } from '@/utilidades/fechas';
import { DialogoDetallesPrestamo } from './dialogo-detalles-prestamo';


interface Props {
    prestamos: Prestamo[];
    herramientas: ItemActivoResumen[];
    estudiantes: Estudiante[];
    onRegistrar: () => void;
    onDevolver: (prestamo: Prestamo) => void;
    onExtender: (prestamo: Prestamo) => void;
    onEditar: (prestamo: Prestamo) => void;
}

const configEstado: Record<EstadoPrestamo, { etiqueta: string; clase: string }> = {
    solicitado: {
        etiqueta: 'Solicitado',
        clase: 'text-amber-700 bg-amber-50 border-amber-200 dark:text-amber-400 dark:bg-amber-950 dark:border-amber-855',
    },
    aceptado: {
        etiqueta: 'Aceptado',
        clase: 'text-purple-700 bg-purple-50 border-purple-200 dark:text-purple-400 dark:bg-purple-950 dark:border-purple-800',
    },
    rechazado: {
        etiqueta: 'Rechazado',
        clase: 'text-rose-700 bg-rose-50 border-rose-200 dark:text-rose-400 dark:bg-rose-950 dark:border-rose-800',
    },
    despachado: {
        etiqueta: 'Despachado',
        clase: 'text-blue-700 bg-blue-50 border-blue-200 dark:text-blue-400 dark:bg-blue-950 dark:border-blue-800',
    },
    pendiente: {
        etiqueta: 'Pendiente',
        clase: 'text-blue-700 bg-blue-50 border-blue-200 dark:text-blue-400 dark:bg-blue-950 dark:border-blue-800',
    },
    activo: {
        etiqueta: 'Activo',
        clase: 'text-blue-700 bg-blue-50 border-blue-200 dark:text-blue-400 dark:bg-blue-950 dark:border-blue-800',
    },
    devuelto: {
        etiqueta: 'Devuelto',
        clase: 'text-emerald-700 bg-emerald-50 border-emerald-200 dark:text-emerald-400 dark:bg-emerald-950 dark:border-emerald-800',
    },
    vencido: {
        etiqueta: 'Vencido',
        clase: 'text-red-700 bg-red-50 border-red-200 dark:text-red-400 dark:bg-red-950 dark:border-red-800',
    },
    devuelto_fuera_de_fecha_limite: {
        etiqueta: 'Devuelto fuera de fecha limite',
        clase: 'text-amber-700 bg-amber-50 border-amber-200 dark:text-amber-300 dark:bg-amber-950 dark:border-amber-800',
    },
};

export const TablaPrestamos = ({
    prestamos,
    herramientas,
    estudiantes,
    onRegistrar,
    onDevolver,
    onExtender,
    onEditar,
}: Props) => {
    const [prestamoParaVer, setPrestamoParaVer] = useState<Prestamo | null>(null);
    const resolverHerramienta = (id: string) => herramientas.find(h => h.id === id);
    const resolverEstudiante = (carnet: string) => estudiantes.find(e => e.carnet === carnet);

    const activos = prestamos.filter(p => p.estado === 'activo' || p.estado === 'pendiente').length;

    return (
        <div className="rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800">
                <div className="flex items-center gap-2">
                    <ClipboardList className="h-4 w-4 text-slate-500" />
                    <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                        Préstamos
                        <span className="ml-2 text-xs font-normal text-slate-400">({activos} activos · {prestamos.length} totales)</span>
                    </h2>
                </div>
                <Boton onClick={onRegistrar} className="h-8 gap-1.5 px-3 py-1.5 text-xs font-medium">
                    <Plus className="h-3.5 w-3.5" />
                    Registrar préstamo
                </Boton>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-xs">
                    <thead>
                        <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/50">
                            <th className="px-4 py-2.5 text-left font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">#</th>
                            <th className="px-4 py-2.5 text-left font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Carnet</th>
                            <th className="px-4 py-2.5 text-left font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Estudiante</th>
                            <th className="px-4 py-2.5 text-left font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Docente</th>
                            <th className="px-4 py-2.5 text-left font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Activo Fijo</th>
                            <th className="px-4 py-2.5 text-center font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Fecha préstamo</th>
                            <th className="px-4 py-2.5 text-center font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Fecha devolución</th>
                            <th className="px-4 py-2.5 text-left font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Observaciones</th>
                            <th className="px-4 py-2.5 text-center font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Estado</th>
                            <th className="px-4 py-2.5 text-center font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {prestamos.map((p, idx) => {
                            const herramienta = resolverHerramienta(p.idHerramienta);
                            const estudiante = resolverEstudiante(p.carnetEstudiante);
                            const cfg = configEstado[p.estado];
                            const esVencido = p.estado === 'vencido';
                            return (
                                <tr
                                    key={p.id}
                                    className={`transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/40 ${esVencido ? 'bg-red-50/60 dark:bg-red-950/20' : ''}`}
                                >
                                    <td className="px-4 py-2.5 text-slate-400">{idx + 1}</td>
                                    <td className="px-4 py-2.5 font-mono font-semibold text-blue-600 dark:text-blue-400">{p.carnetEstudiante}</td>
                                    <td className="px-4 py-2.5 font-medium text-slate-800 dark:text-slate-100 min-w-0">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <span className="truncate max-w-[150px]" title={estudiante ? `${estudiante.apellido}, ${estudiante.nombre}` : ''}>
                                                {estudiante ? `${estudiante.apellido}, ${estudiante.nombre}` : '—'}
                                            </span>
                                            {estudiante && (
                                                <span
                                                    className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold shrink-0 ${
                                                        estudiante.carnetRetenido
                                                            ? 'border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300'
                                                            : 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                                                    }`}
                                                >
                                                    {estudiante.carnetRetenido ? 'Carnet retenido' : 'Carnet libre'}
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-4 py-2.5 text-slate-700 dark:text-slate-300 max-w-[125px] truncate" title={p.docente}>
                                        {p.docente}
                                    </td>
                                    <td className="px-4 py-2.5 text-slate-700 dark:text-slate-300 max-w-[220px] truncate" title={
                                        herramienta
                                            ? (() => {
                                                const inv = String(herramienta.codigoInventario ?? '').trim();
                                                const uni = String(herramienta.codigoUnico ?? '').trim();
                                                const etiqueta = inv || uni
                                                    ? `I: ${inv || '—'} | U: ${uni || '—'}`
                                                    : 'SIN-CODIGO';
                                                return `[${etiqueta}] ${herramienta.nombre}`;
                                            })()
                                            : '—'
                                    }>
                                        {herramienta
                                            ? (() => {
                                                const inv = String(herramienta.codigoInventario ?? '').trim();
                                                const uni = String(herramienta.codigoUnico ?? '').trim();
                                                const etiqueta = inv || uni
                                                    ? `I: ${inv || '—'} | U: ${uni || '—'}`
                                                    : 'SIN-CODIGO';
                                                return `[${etiqueta}] ${herramienta.nombre}`;
                                            })()
                                            : '—'}
                                    </td>
                                    <td className="px-4 py-2.5 text-center text-slate-600 dark:text-slate-400">{formatearFechaHora(p.fechaPrestamo)}</td>
                                    <td className="px-4 py-2.5 text-center text-slate-600 dark:text-slate-400">
                                        {p.fechaDevolucion ? formatearFechaHora(p.fechaDevolucion) : <span className="text-slate-300 dark:text-slate-600">Pendiente</span>}
                                    </td>
                                    <td className="max-w-[160px] truncate px-4 py-2.5 text-slate-500 dark:text-slate-400" title={p.observaciones || ''}>
                                        {p.observaciones || '—'}
                                    </td>
                                    <td className="px-4 py-2.5">
                                        <div className="flex justify-center">
                                            <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${cfg.clase}`}>
                                                {cfg.etiqueta}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-2.5">
                                        <AccionesFilaPrestamoUi
                                            onEditar={() => onEditar(p)}
                                            onExtender={() => onExtender(p)}
                                            onDevolver={() => onDevolver(p)}
                                            onVer={() => setPrestamoParaVer(p)}
                                            deshabilitarExtenderYDevolver={p.estado === 'devuelto' || p.estado === 'devuelto_fuera_de_fecha_limite'}
                                        />
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {prestamoParaVer && (
                <DialogoDetallesPrestamo
                    prestamoId={prestamoParaVer.grupoCanasta ?? `IND-${prestamoParaVer.id}`}
                    onCerrar={() => setPrestamoParaVer(null)}
                />
            )}
        </div>
    );
};
