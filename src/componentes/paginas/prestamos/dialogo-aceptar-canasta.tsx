import { useState } from 'react';
import { ModalBase } from '@/componentes/paginas/inventario/modal-base';
import { Boton } from '@/componentes/ui/button';
import type { PrestamoCanastaRegistro } from '@/tipos/inventario';
import { Check, X, User, Users, Clipboard, AlertCircle } from 'lucide-react';
import { useInventario } from '@/contextos/ContextoInventario';

interface Props {
    canasta: PrestamoCanastaRegistro;
    onCerrar: () => void;
    onConfirmar: () => Promise<void>;
}

export const DialogoAceptarCanasta = ({ canasta, onCerrar, onConfirmar }: Props) => {
    const { materiales, contenedoresMateriales } = useInventario();
    const [guardando, setGuardando] = useState(false);
    const [error, setError] = useState('');

    const obtenerTextoEstudiantes = (c: PrestamoCanastaRegistro) => {
        if (c.estudiantes && c.estudiantes.length > 0) {
            return c.estudiantes.map((estudiante) => `${estudiante.apellido}, ${estudiante.nombre}`).join(' · ');
        }
        return c.carnetsEstudiantes?.join(' · ') || c.carnetEstudiante;
    };

    const cosas = canasta.cosas ?? [];

    // Separate specific items and generic items
    const fijosEspecificos = cosas.filter(
        (item) => item.idHerramienta !== null && item.codigoInventario !== null
    );
    const fijosGenericos = cosas.filter(
        (item) => item.idHerramienta === null || item.codigoInventario === null
    );

    // Group generic requests by container
    const gruposGenericosMap: Record<string, { nombre: string; cantidad: number }> = {};
    fijosGenericos.forEach((item) => {
        const key = item.idContenedor ? String(item.idContenedor) : (item.nombreContenedor || item.nombre || 'Desconocido');
        const nombre = item.nombreContenedor || item.nombre || 'Contenedor';
        
        if (!gruposGenericosMap[key]) {
            gruposGenericosMap[key] = {
                nombre,
                cantidad: 0,
            };
        }
        gruposGenericosMap[key].cantidad += 1;
    });
    const gruposGenericos = Object.values(gruposGenericosMap);

    const obtenerCantidadFungible = (item: { cantidadSolicitada?: number; cantidad?: number }) => {
        return item.cantidadSolicitada ?? item.cantidad ?? 0;
    };

    const obtenerUnidadMedida = (item: any) => {
        const idAct = item.idActivoFungible ? Number(item.idActivoFungible) : null;
        if (idAct) {
            const mat = materiales.find(m => Number(m.id) === idAct);
            if (mat?.unidad) return mat.unidad;
        }
        if (item.idLote) {
            const mat = materiales.find(m => m.subinstancias.some(sub => String(sub.id) === String(item.idLote)));
            if (mat?.unidad) return mat.unidad;
        }
        for (const cont of contenedoresMateriales || []) {
            if (idAct) {
                const mat = cont.materiales.find(m => Number(m.id) === idAct);
                if (mat?.unidad) return mat.unidad;
            }
            if (item.idLote) {
                for (const mat of cont.materiales) {
                    if (mat.subinstancias.some(sub => String(sub.id) === String(item.idLote))) {
                        return mat.unidad;
                    }
                }
            }
        }
        return 'unidades';
    };

    const handleSubmit = async () => {
        setError('');
        try {
            setGuardando(true);
            await onConfirmar();
            onCerrar();
        } catch (err) {
            setError((err as { message?: string })?.message ?? 'No se pudo aceptar la solicitud.');
        } finally {
            setGuardando(false);
        }
    };

    return (
        <ModalBase
            titulo={`Aceptar Solicitud de Préstamo`}
            onCerrar={onCerrar}
            ancho="max-w-lg"
            footer={
                <div className="flex justify-end gap-2.5 w-full sm:w-auto">
                    <Boton
                        type="button"
                        variant="outline"
                        onClick={onCerrar}
                        disabled={guardando}
                        className="h-9 px-4 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800"
                    >
                        <X className="mr-1 h-3.5 w-3.5" />
                        Cancelar
                    </Boton>
                    <Boton
                        type="button"
                        disabled={guardando}
                        onClick={handleSubmit}
                        className="h-9 px-5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold transition-all shadow-md hover:shadow-lg dark:bg-emerald-700 dark:hover:bg-emerald-600"
                    >
                        {guardando ? (
                            <span className="flex items-center gap-1.5">
                                <span className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                Aceptando...
                            </span>
                        ) : (
                            <span className="flex items-center gap-1">
                                <Check className="h-3.5 w-3.5" />
                                Confirmar y Aceptar
                            </span>
                        )}
                    </Boton>
                </div>
            }
        >
            <div className="space-y-5 p-5 text-xs">
                {/* Header Information Card */}
                <div className="relative overflow-hidden rounded-xl border border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-900/30">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full -mr-8 -mt-8 pointer-events-none" />
                    
                    <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-slate-150/40 dark:border-slate-800/40">
                        <span className="font-semibold text-slate-400 dark:text-slate-500">Detalles de la Solicitud</span>
                        <span className="font-mono text-[10px] font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 px-2 py-0.5 rounded border border-indigo-100/50 dark:border-indigo-900/40">
                            #{canasta.codigo ?? canasta.id}
                        </span>
                    </div>

                    <div className="space-y-2.5">
                        <div className="flex items-start gap-2">
                            <Users className="h-3.5 w-3.5 text-slate-400 mt-0.5 shrink-0" />
                            <div>
                                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Estudiante(s)</span>
                                <span className="font-medium text-slate-800 dark:text-slate-200">
                                    {obtenerTextoEstudiantes(canasta)}
                                </span>
                            </div>
                        </div>

                        <div className="flex items-start gap-2">
                            <User className="h-3.5 w-3.5 text-slate-400 mt-0.5 shrink-0" />
                            <div>
                                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Docente autorizador</span>
                                <span className="font-medium text-slate-800 dark:text-slate-200">
                                    {canasta.docente}
                                </span>
                            </div>
                        </div>

                        {canasta.observaciones && (
                            <div className="flex items-start gap-2 pt-1 border-t border-dashed border-slate-200/50 dark:border-slate-800/50 mt-1">
                                <Clipboard className="h-3.5 w-3.5 text-slate-400 mt-0.5 shrink-0" />
                                <div>
                                    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Observaciones</span>
                                    <span className="italic text-slate-650 dark:text-slate-350">
                                        {canasta.observaciones}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Activos Fijos Section */}
                <div className="space-y-2.5">
                    <h4 className="font-bold text-slate-800 dark:text-slate-205 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                        <span>Activos Fijos Solicitados</span>
                        <span className="text-[10px] font-normal text-slate-400">({cosas.length})</span>
                    </h4>

                    {cosas.length > 0 ? (
                        <div className="space-y-3">
                            {/* Specific/Assigned tools list */}
                            {fijosEspecificos.length > 0 && (
                                <div className="space-y-1">
                                    <span className="text-[9px] font-semibold text-slate-450 uppercase tracking-wide">Equipos Específicos Asignados</span>
                                    <ul className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-150 dark:border-slate-800 rounded-lg overflow-hidden bg-white dark:bg-slate-950 shadow-2xs">
                                        {fijosEspecificos.map((item, idx) => (
                                            <li key={idx} className="px-3.5 py-2.5 text-slate-700 dark:text-slate-300 flex items-center justify-between hover:bg-slate-50/55 dark:hover:bg-slate-900/10">
                                                <span className="font-medium">{item.nombre}</span>
                                                <span className="font-mono text-[10px] font-bold bg-slate-100 text-slate-600 dark:bg-slate-900 dark:text-slate-400 px-2 py-0.5 rounded border border-slate-200/50 dark:border-slate-800">
                                                    {item.codigoInventario}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Generic container tools list (grouped) */}
                            {gruposGenericos.length > 0 && (
                                <div className="space-y-1">
                                    <span className="text-[9px] font-semibold text-slate-455 uppercase tracking-wide">Equipos Genéricos (Por Asignar en Despacho)</span>
                                    <ul className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-150 dark:border-slate-800 rounded-lg overflow-hidden bg-white dark:bg-slate-950 shadow-2xs">
                                        {gruposGenericos.map((grupo, idx) => (
                                            <li key={idx} className="px-3.5 py-2.5 text-slate-700 dark:text-slate-300 flex items-center justify-between hover:bg-slate-50/55 dark:hover:bg-slate-900/10">
                                                <div className="flex flex-col gap-0.5">
                                                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                                                        {grupo.nombre}
                                                    </span>
                                                    <span className="text-[10px] text-slate-400 italic">
                                                        Solicitado por contenedor
                                                    </span>
                                                </div>
                                                <span className="inline-flex items-center gap-1 rounded bg-indigo-50 px-2 py-1 text-[11px] font-bold text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 border border-indigo-100/50 dark:border-indigo-900/40 shadow-3xs">
                                                    Cantidad: {grupo.cantidad}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="rounded-lg border border-dashed border-slate-200 p-4 text-center text-slate-400 italic dark:border-slate-800">
                            Ninguno
                        </div>
                    )}
                </div>

                {/* Consumibles Section */}
                {canasta.consumibles && canasta.consumibles.length > 0 && (
                    <div className="space-y-2.5 pt-1">
                        <h4 className="font-bold text-slate-800 dark:text-slate-205 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                            <span>Materiales Fungibles Solicitados</span>
                            <span className="text-[10px] font-normal text-slate-400">({canasta.consumibles.length})</span>
                        </h4>

                        <ul className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-150 dark:border-slate-800 rounded-lg overflow-hidden bg-white dark:bg-slate-950 shadow-2xs">
                            {canasta.consumibles.map((item, idx) => (
                                <li key={idx} className="px-3.5 py-2.5 text-slate-700 dark:text-slate-300 flex items-center justify-between hover:bg-slate-50/55 dark:hover:bg-slate-900/10">
                                    <div className="flex flex-col gap-0.5">
                                        <span className="font-semibold text-slate-800 dark:text-slate-200">{item.material}</span>
                                        <span className="text-[10px] text-slate-450 font-normal">Lote: <span className="font-medium font-mono">{item.lote}</span></span>
                                    </div>
                                    <span className="rounded-md bg-amber-50 border border-amber-200/60 px-2.5 py-1 text-[11px] font-bold text-amber-800 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-900/60 shadow-3xs">
                                        Cant: {obtenerCantidadFungible(item)} {obtenerUnidadMedida(item)}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Error message */}
                {error && (
                    <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 flex items-start gap-2 text-rose-800 dark:border-rose-950 dark:bg-rose-950/30 dark:text-rose-300">
                        <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                        <span className="font-medium">{error}</span>
                    </div>
                )}
            </div>
        </ModalBase>
    );
};
