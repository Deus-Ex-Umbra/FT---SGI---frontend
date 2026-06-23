import { useEffect, useState } from 'react';
import { ModalBase } from '@/componentes/paginas/inventario/modal-base';
import { Boton } from '@/componentes/ui/button';
import type { PrestamoCanastaRegistro } from '@/tipos/inventario';
import { obtenerDetallesPrestamoEnBackend } from '@/lib/servicio-prestamos';
import { formatearFechaHora } from '@/utilidades/fechas';
import { 
    X, User, Users, Clipboard, AlertCircle, Clock, Calendar, 
    Package2, ShieldAlert, BadgeInfo 
} from 'lucide-react';

interface Props {
    prestamoId: string;
    onCerrar: () => void;
}

const colorEstadoCanasta = (estado: string) => {
    if (estado === 'solicitado') return 'text-amber-700 bg-amber-50 border-amber-200 dark:text-amber-300 dark:bg-amber-950/30 dark:border-amber-850';
    if (estado === 'aceptado') return 'text-purple-700 bg-purple-50 border-purple-200 dark:text-purple-300 dark:bg-purple-950/30 dark:border-purple-800';
    if (estado === 'rechazado') return 'text-rose-700 bg-rose-50 border-rose-200 dark:text-rose-300 dark:bg-rose-950/30 dark:border-rose-800';
    if (estado === 'despachado' || estado === 'activo' || estado === 'pendiente') return 'text-blue-700 bg-blue-50 border-blue-200 dark:text-blue-300 dark:bg-blue-950/30 dark:border-blue-800';
    if (estado === 'devuelto' || estado === 'devuelto_fuera_de_fecha_limite') return 'text-emerald-700 bg-emerald-50 border-emerald-200 dark:text-emerald-300 dark:bg-emerald-950/30 dark:border-emerald-800';
    return 'text-red-700 bg-red-50 border-red-200 dark:text-red-300 dark:bg-red-950/30 dark:border-red-800';
};

export const DialogoDetallesPrestamo = ({ prestamoId, onCerrar }: Props) => {
    const [detalles, setDetalles] = useState<PrestamoCanastaRegistro | null>(null);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const cargar = async () => {
            try {
                setCargando(true);
                setError('');
                const data = await obtenerDetallesPrestamoEnBackend(prestamoId);
                setDetalles(data);
            } catch (err: any) {
                setError(err?.message ?? 'No se pudieron cargar los detalles del préstamo.');
            } finally {
                setCargando(false);
            }
        };
        void cargar();
    }, [prestamoId]);

    const obtenerTextoEstudiantes = (c: PrestamoCanastaRegistro) => {
        if (c.estudiantes && c.estudiantes.length > 0) {
            return c.estudiantes.map((estudiante) => `${estudiante.apellido}, ${estudiante.nombre}`).join(' · ');
        }
        return c.carnetsEstudiantes?.join(' · ') || c.carnetEstudiante;
    };

    const cosas = detalles?.cosas ?? [];
    const fungibles = detalles?.consumibles ?? [];

    return (
        <ModalBase
            titulo="Detalle Completo del Préstamo"
            onCerrar={onCerrar}
            ancho="max-w-xl"
            footer={
                <div className="flex justify-end w-full sm:w-auto">
                    <Boton
                        type="button"
                        variant="outline"
                        onClick={onCerrar}
                        className="h-9 px-4 text-xs font-medium text-slate-650 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800"
                    >
                        <X className="mr-1.5 h-3.5 w-3.5" />
                        Cerrar
                    </Boton>
                </div>
            }
        >
            <div className="space-y-5 p-5 text-xs">
                {cargando ? (
                    <div className="flex flex-col items-center justify-center py-10 space-y-3">
                        <span className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                        <span className="text-slate-500 font-medium animate-pulse">Cargando detalles del préstamo...</span>
                    </div>
                ) : error ? (
                    <div className="rounded-lg border border-rose-250 bg-rose-50 p-4 flex items-start gap-2.5 text-rose-800 dark:border-rose-950 dark:bg-rose-950/30 dark:text-rose-300">
                        <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                        <span className="font-semibold">{error}</span>
                    </div>
                ) : detalles ? (
                    <>
                        {/* Status Card & Overview */}
                        <div className="relative overflow-hidden rounded-xl border border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-900/30">
                            <div className="flex items-center justify-between mb-3.5 pb-2.5 border-b border-slate-200/50 dark:border-slate-800/50">
                                <span className="font-bold text-slate-400 dark:text-slate-500 text-[10px] uppercase tracking-wider">
                                    Resumen del Préstamo
                                </span>
                                <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${colorEstadoCanasta(detalles.estado)}`}>
                                    {detalles.estado}
                                </span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 text-slate-700 dark:text-slate-350">
                                <div className="space-y-3">
                                    <div className="flex items-start gap-2">
                                        <BadgeInfo className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                                        <div>
                                            <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Código</span>
                                            <span className="font-semibold font-mono text-slate-900 dark:text-slate-100 text-[11px]">
                                                {detalles.codigo ?? detalles.id}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-2">
                                        <Users className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                                        <div>
                                            <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Estudiante(s)</span>
                                            <span className="font-medium text-slate-850 dark:text-slate-200">
                                                {obtenerTextoEstudiantes(detalles)}
                                            </span>
                                            {detalles.estudiantes?.map(e => e.carnetRetenido).includes(true) && (
                                                <span className="ml-2 inline-flex items-center rounded bg-amber-50 border border-amber-250/50 px-1 text-[8px] font-bold text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                                                    Carnet universitario retenido
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-2">
                                        <User className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                                        <div>
                                            <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Docente autorizador</span>
                                            <span className="font-medium text-slate-850 dark:text-slate-200">
                                                {detalles.docente}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex items-start gap-2">
                                        <Clock className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                                        <div>
                                            <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Fecha Préstamo</span>
                                            <span className="font-medium text-slate-850 dark:text-slate-200">
                                                {formatearFechaHora(detalles.fechaPrestamo)}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-2">
                                        <Calendar className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                                        <div>
                                            <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Fecha Devolución / Límite</span>
                                            <span className="font-medium text-slate-850 dark:text-slate-200">
                                                {detalles.fechaDevolucion ? (
                                                    formatearFechaHora(detalles.fechaDevolucion)
                                                ) : (
                                                    <span className="text-blue-500 italic">Pendiente de devolución</span>
                                                )}
                                            </span>
                                        </div>
                                    </div>

                                    {detalles.observaciones && (
                                        <div className="flex items-start gap-2">
                                            <Clipboard className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                                            <div>
                                                <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Observaciones</span>
                                                <span className="font-medium text-slate-600 dark:text-slate-350 italic">
                                                    {detalles.observaciones}
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Rejected Reason */}
                            {detalles.estado === 'rechazado' && detalles.motivoRechazo && (
                                <div className="mt-3.5 p-3 rounded-lg border border-rose-100 bg-rose-50/50 dark:border-rose-950/45 dark:bg-rose-950/15 flex gap-2">
                                    <ShieldAlert className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
                                    <div>
                                        <span className="block text-[9px] font-bold text-rose-600 uppercase tracking-wider">Motivo de Rechazo</span>
                                        <span className="text-slate-700 dark:text-slate-300 font-semibold">{detalles.motivoRechazo}</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Fixed Assets List */}
                        <div className="space-y-2">
                            <h3 className="font-bold text-slate-800 dark:text-slate-200 text-[10px] uppercase tracking-wider flex items-center gap-1.5">
                                <Package2 className="h-4 w-4 text-slate-500" />
                                <span>Activos Fijos</span>
                                <span className="text-[10px] font-normal text-slate-400">({cosas.length})</span>
                            </h3>

                            {cosas.length > 0 ? (
                                <div className="overflow-hidden border border-slate-150 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-950 shadow-2xs divide-y divide-slate-100 dark:divide-slate-900">
                                    {cosas.map((item, idx) => (
                                        <div key={idx} className="px-3.5 py-2.5 flex items-center justify-between hover:bg-slate-50/30 dark:hover:bg-slate-900/10">
                                            <div className="flex flex-col gap-0.5">
                                                <span className="font-semibold text-slate-800 dark:text-slate-200">
                                                    {item.nombre}
                                                </span>
                                                {item.estadoFisicoEntrega && (
                                                    <span className="text-[9px] text-slate-400">
                                                        Entregado en estado: <span className="font-medium capitalize text-slate-500">{item.estadoFisicoEntrega}</span>
                                                        {item.estadoFisicoDevolucion && (
                                                            <> · Devuelto en: <span className="font-medium capitalize text-slate-500">{item.estadoFisicoDevolucion}</span></>
                                                        )}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {item.registrado === false ? (
                                                    <span className="inline-flex items-center rounded-full bg-rose-50 border border-rose-200 px-2 py-0.5 text-[9px] font-bold text-rose-700 dark:bg-rose-950/30 dark:border-rose-900/40 dark:text-rose-300 shrink-0">
                                                        No entregado
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[9px] font-bold text-emerald-700 dark:bg-emerald-950/30 dark:border-emerald-900/40 dark:text-emerald-300 shrink-0">
                                                        Despachado
                                                    </span>
                                                )}
                                                <span className="font-mono text-[9px] font-bold bg-slate-100 text-slate-650 dark:bg-slate-900 dark:text-slate-400 px-2 py-0.5 rounded border border-slate-200/50 dark:border-slate-800">
                                                    {item.codigoInventario || 'Sin asignar'}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="rounded-xl border border-dashed border-slate-200 p-4 text-center text-slate-400 italic dark:border-slate-800">
                                    Ningún activo fijo solicitado.
                                </div>
                            )}
                        </div>

                        {/* Fungible Assets List */}
                        {fungibles.length > 0 && (
                            <div className="space-y-2">
                                <h3 className="font-bold text-slate-800 dark:text-slate-200 text-[10px] uppercase tracking-wider flex items-center gap-1.5">
                                    <Clipboard className="h-4 w-4 text-slate-500" />
                                    <span>Activos Fungibles (Consumibles)</span>
                                    <span className="text-[10px] font-normal text-slate-400">({fungibles.length})</span>
                                </h3>

                                <div className="overflow-hidden border border-slate-150 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-950 shadow-2xs divide-y divide-slate-100 dark:divide-slate-900">
                                    {fungibles.map((item, idx) => (
                                        <div key={idx} className="px-3.5 py-2.5 flex items-center justify-between hover:bg-slate-50/30 dark:hover:bg-slate-900/10">
                                            <div className="flex flex-col gap-0.5">
                                                <span className="font-semibold text-slate-800 dark:text-slate-200">{item.material}</span>
                                                <span className="text-[10px] text-slate-450 font-normal">
                                                    Lote/Serie: <span className="font-medium font-mono text-slate-600 dark:text-slate-400">{item.lote || 'Sistema'}</span>
                                                    {item.motivo && <span className="block text-[9px] italic text-slate-400 mt-0.5">Motivo: {item.motivo}</span>}
                                                </span>
                                            </div>
                                            <div className="flex flex-col items-end gap-1.5">
                                                <span className="font-mono bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-[10px] font-bold dark:bg-blue-950/40 dark:text-blue-300 border border-blue-150/40">
                                                    Solicitado: {item.cantidadSolicitada}
                                                </span>
                                                {item.cantidadDespachada !== undefined && item.cantidadDespachada > 0 && (
                                                    <span className="font-mono bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded text-[10px] font-bold dark:bg-indigo-950/40 dark:text-indigo-300 border border-indigo-150/40">
                                                        Despachado: {item.cantidadDespachada}
                                                    </span>
                                                )}
                                                {item.cantidadDevuelta !== undefined && item.cantidadDevuelta > 0 && (
                                                    <span className="font-mono bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded text-[10px] font-bold dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-150/40">
                                                        Devuelto: {item.cantidadDevuelta}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                ) : null}
            </div>
        </ModalBase>
    );
};
