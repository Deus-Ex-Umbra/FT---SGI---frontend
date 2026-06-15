import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/componentes/ui/dialog';
import { Boton } from '@/componentes/ui/button';
import { AlertTriangle, Package2, User, ChevronRight, Clock } from 'lucide-react';
import type { PrestamoCanastaRegistro } from '@/tipos/inventario';
import { formatearFechaHora } from '@/utilidades/fechas';

interface DialogoPrestamosVencidosProps {
    abierto: boolean;
    onClose: () => void;
    prestamos: PrestamoCanastaRegistro[];
    onIrAPrestamos: () => void;
}

export const DialogoPrestamosVencidos = ({
    abierto,
    onClose,
    prestamos,
    onIrAPrestamos,
}: DialogoPrestamosVencidosProps) => {
    const obtenerNombresActivos = (prestamo: PrestamoCanastaRegistro) => {
        const nombres: string[] = [];
        if (prestamo.cosas && prestamo.cosas.length > 0) {
            prestamo.cosas.forEach(item => {
                if (item.registrado !== false) {
                    nombres.push(item.nombre);
                }
            });
        }
        if (prestamo.consumibles && prestamo.consumibles.length > 0) {
            prestamo.consumibles.forEach(item => {
                const cantidad = item.cantidadDespachada ?? item.cantidadSolicitada ?? 0;
                nombres.push(`${item.material} (Cant: ${cantidad})`);
            });
        }
        return nombres.join(', ') || 'Activos sin especificar';
    };

    return (
        <Dialog open={abierto} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-md border-rose-200 dark:border-rose-950/40">
                <DialogHeader className="flex flex-col items-center text-center space-y-3">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 ring-4 ring-rose-50 dark:ring-rose-950/20">
                        <AlertTriangle className="h-7 w-7 animate-pulse" />
                    </div>
                    <div className="space-y-1">
                        <DialogTitle className="text-lg font-bold text-slate-900 dark:text-slate-50 flex items-center justify-center gap-1.5">
                            Préstamos Vencidos Detectados
                        </DialogTitle>
                        <DialogDescription className="text-xs text-slate-500 dark:text-slate-400 max-w-sm">
                            Tienes préstamos pendientes cuya fecha límite de devolución ha expirado. Por favor, devuélvelos lo antes posible.
                        </DialogDescription>
                    </div>
                </DialogHeader>

                <div className="my-3 space-y-2.5 max-h-[260px] overflow-y-auto pr-1">
                    {prestamos.map((p) => (
                        <div
                            key={p.id}
                            className="group relative rounded-xl border border-rose-100 bg-rose-50/20 p-3.5 transition-all hover:bg-rose-50/40 hover:border-rose-200 dark:border-rose-950/30 dark:bg-rose-950/5 dark:hover:bg-rose-950/10 dark:hover:border-rose-900"
                        >
                            <div className="flex items-start justify-between">
                                <div className="space-y-1.5 flex-1">
                                    <div className="flex items-center gap-2">
                                        <span className="font-mono text-xs font-bold text-rose-700 dark:text-rose-400">
                                            {p.codigo ?? p.id}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-350">
                                        <Package2 className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                                        <span className="font-medium truncate max-w-[280px]" title={obtenerNombresActivos(p)}>
                                            {obtenerNombresActivos(p)}
                                        </span>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-slate-500 dark:text-slate-400">
                                        <div className="flex items-center gap-1">
                                            <Clock className="h-3 w-3 text-rose-500 shrink-0" />
                                            <span>
                                                Venció: <span className="font-semibold text-rose-600 dark:text-rose-450">{p.fechaDevolucion ? formatearFechaHora(p.fechaDevolucion) : '—'}</span>
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <User className="h-3 w-3 text-slate-400 shrink-0" />
                                            <span className="truncate max-w-[120px]" title={p.docente}>
                                                Docente: {p.docente}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 mt-2">
                    <Boton
                        type="button"
                        variant="ghost"
                        onClick={onClose}
                        className="text-xs h-9 text-slate-650 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-slate-200"
                    >
                        Entendido
                    </Boton>
                    <Boton
                        type="button"
                        onClick={onIrAPrestamos}
                        className="text-xs h-9 bg-rose-600 hover:bg-rose-700 text-white dark:bg-rose-750 dark:hover:bg-rose-800 gap-1.5 shadow-sm font-semibold transition-all"
                    >
                        Ver mis préstamos
                        <ChevronRight className="h-4 w-4" />
                    </Boton>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
