import { useEffect, useMemo, useState } from 'react';
import type { Prestamo } from '@/tipos/inventario';
import { ModalBase } from '@/componentes/inventario/modal-base';
import { ScrollArea } from '@/componentes/ui/scroll-area';
import { Boton } from '@/componentes/ui/button';
import { DateTimePicker } from '@/componentes/ui/date-time-picker';
import { useInventario } from '@/contextos/ContextoInventario';
import { ahoraInputLocal, apiDateTimeAInputLocal, sumarHorasInputLocal } from '@/lib/fecha-local';
import { useCierreSeguro } from '@/hooks/use-cierre-seguro';
import { normalizarEstadoItem } from '@/lib/estados-activo';

interface Props {
    onCerrar: () => void;
    prestamo?: Prestamo;
}

const nombreCompletoDocente = (docente: { nombre: string; apellido: string }): string => `${docente.nombre} ${docente.apellido}`.trim();

export const DialogoPrestamo = ({ onCerrar, prestamo }: Props) => {
    const { agregarPrestamo, editarPrestamo, herramientas, estudiantes, docentes, prestamos } = useInventario();
    const esEdicion = !!prestamo;
    const inicio = ahoraInputLocal();
    const formId = 'dialogo-prestamo-form';

    const resolverIdDocentePorNombre = (nombre: string): string => {
        const buscado = nombre.trim().toLowerCase();
        const encontrado = docentes.find((d) => nombreCompletoDocente(d).toLowerCase() === buscado);
        return encontrado?.id ?? '';
    };

    const construirCamposIniciales = () => ({
        carnetEstudiante: prestamo?.carnetEstudiante ?? '',
        idHerramienta: prestamo?.idHerramienta ?? '',
        idDocente: prestamo ? resolverIdDocentePorNombre(prestamo.docente) : '',
        fechaPrestamo: prestamo ? apiDateTimeAInputLocal(prestamo.fechaPrestamo) : inicio,
        fechaDevolucion: prestamo
            ? apiDateTimeAInputLocal(prestamo.fechaDevolucion)
            : sumarHorasInputLocal(inicio, 24),
        observaciones: prestamo?.observaciones ?? '',
    });

    const [campos, setCampos] = useState(() => construirCamposIniciales());
    const [camposIniciales, setCamposIniciales] = useState(() => construirCamposIniciales());

    useEffect(() => {
        const inicioLocal = ahoraInputLocal();
        const siguientes = {
            carnetEstudiante: prestamo?.carnetEstudiante ?? '',
            idHerramienta: prestamo?.idHerramienta ?? '',
            idDocente: prestamo ? resolverIdDocentePorNombre(prestamo.docente) : '',
            fechaPrestamo: prestamo ? apiDateTimeAInputLocal(prestamo.fechaPrestamo) : inicioLocal,
            fechaDevolucion: prestamo
                ? apiDateTimeAInputLocal(prestamo.fechaDevolucion)
                : sumarHorasInputLocal(inicioLocal, 24),
            observaciones: prestamo?.observaciones ?? '',
        };
        setCampos(siguientes);
        setCamposIniciales(siguientes);
    }, [prestamo?.id]);

    useEffect(() => {
        if (!prestamo) return;
        setCampos((prev) => {
            if (prev.idDocente) return prev;
            const idDocente = resolverIdDocentePorNombre(prestamo.docente);
            return idDocente ? { ...prev, idDocente } : prev;
        });
    }, [docentes.length, prestamo?.id]);

    const [error, setError] = useState('');
    const [guardando, setGuardando] = useState(false);

    const estaSucio = useMemo(() => {
        const normalizar = (v: string) => v.trim();
        return (
            normalizar(campos.carnetEstudiante) !== normalizar(camposIniciales.carnetEstudiante) ||
            normalizar(campos.idHerramienta) !== normalizar(camposIniciales.idHerramienta) ||
            normalizar(campos.idDocente) !== normalizar(camposIniciales.idDocente) ||
            normalizar(campos.fechaPrestamo) !== normalizar(camposIniciales.fechaPrestamo) ||
            normalizar(campos.fechaDevolucion) !== normalizar(camposIniciales.fechaDevolucion) ||
            normalizar(campos.observaciones) !== normalizar(camposIniciales.observaciones)
        );
    }, [campos, camposIniciales]);

    const {
        solicitarCierre,
        confirmacionAbierta,
        cancelarCierre,
        confirmarCierre,
        mensajeConfirmacion,
    } = useCierreSeguro({
        estaSucio,
        estaCargando: guardando,
        alCerrar: onCerrar,
        mensajeConfirmacion: 'Hay cambios sin guardar en el préstamo. ¿Deseas cerrar y descartarlos?',
    });

    const actualizar = (clave: keyof typeof campos, valor: string) => {
        setCampos((prev) => ({ ...prev, [clave]: valor }));
    };

    const idsPrestados = useMemo(() => new Set(
        prestamos
            .filter((p) => p.estado !== 'devuelto' && p.estado !== 'devuelto_fuera_de_fecha_limite')
            .map((p) => p.idHerramienta)
    ), [prestamos]);

    const herramientasDisponibles = useMemo(() => herramientas.filter((h) => {
        const estado = normalizarEstadoItem(h.estado) ?? 'disponible';
        const esActual = prestamo?.idHerramienta === h.id;
        if (esActual) return true;
        return estado === 'disponible' && !idsPrestados.has(h.id);
    }), [herramientas, idsPrestados, prestamo?.idHerramienta]);

    const manejarGuardar = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!campos.carnetEstudiante || !campos.idHerramienta || !campos.idDocente || !campos.fechaPrestamo) {
            setError('Completa estudiante, activo fijo, docente y fecha de préstamo.');
            return;
        }

        if (!esEdicion && !campos.fechaDevolucion) {
            setError('Debes ingresar la fecha/hora límite de devolución.');
            return;
        }

        if (campos.fechaDevolucion && new Date(campos.fechaDevolucion).getTime() <= new Date(campos.fechaPrestamo).getTime()) {
            setError('La fecha/hora de devolución debe ser posterior al préstamo.');
            return;
        }

        const docente = docentes.find((d) => d.id === campos.idDocente);
        if (!docente) {
            setError('Selecciona un docente válido.');
            return;
        }

        try {
            setGuardando(true);
            if (prestamo) {
                await editarPrestamo(prestamo.id, {
                    carnetEstudiante: campos.carnetEstudiante,
                    idHerramienta: campos.idHerramienta,
                    docente: nombreCompletoDocente(docente),
                    fechaPrestamo: campos.fechaPrestamo,
                    fechaDevolucion: campos.fechaDevolucion || null,
                    observaciones: campos.observaciones.trim(),
                });
            } else {
                await agregarPrestamo({
                    carnetEstudiante: campos.carnetEstudiante,
                    idHerramienta: campos.idHerramienta,
                    docente: nombreCompletoDocente(docente),
                    fechaPrestamo: campos.fechaPrestamo,
                    fechaDevolucion: campos.fechaDevolucion,
                    observaciones: campos.observaciones.trim(),
                });
            }
            onCerrar();
        } catch (err) {
            setError(err instanceof Error ? err.message : (prestamo ? 'No se pudo editar el préstamo.' : 'No se pudo registrar el préstamo.'));
        } finally {
            setGuardando(false);
        }
    };

    const titulo = prestamo ? `Editar préstamo #${prestamo.id}` : 'Registrar préstamo';
    const textoGuardar = prestamo ? 'Guardar cambios' : 'Registrar préstamo';

    return (
        <>
            <ModalBase
                titulo={titulo}
                onCerrar={solicitarCierre}
                ancho="max-w-xl"
                dialogClassName="h-[90vh]"
                bodyClassName="flex min-h-0 flex-col p-0"
                footer={
                    <div className="flex justify-end gap-2">
                        <button type="button" onClick={solicitarCierre} className="h-9 rounded-md border border-slate-200 px-4 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400">
                            Cancelar
                        </button>
                        <Boton type="submit" form={formId} className="h-9 px-5 text-xs" disabled={guardando}>
                            {guardando ? 'Guardando...' : textoGuardar}
                        </Boton>
                    </div>
                }
            >
                <ScrollArea type="auto" className="flex-1 min-h-0">
                    <form id={formId} onSubmit={manejarGuardar} className="space-y-3 p-4 sm:p-6">
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Estudiante *</label>
                        <select
                            title="Seleccionar estudiante"
                            value={campos.carnetEstudiante}
                            onChange={(e) => { actualizar('carnetEstudiante', e.target.value); setError(''); }}
                            required
                            className="h-9 rounded-md border border-slate-200 bg-white px-3 text-xs text-slate-800 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                        >
                            <option value="">Seleccionar estudiante...</option>
                            {estudiantes.map((est) => (
                                <option key={est.carnet} value={est.carnet}>
                                    [{est.carnet}] {est.apellido}, {est.nombre}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                            Activo fijo *
                            <span className="ml-1 font-normal text-slate-400">(solo en buen estado)</span>
                        </label>
                        <select
                            title="Seleccionar activo fijo"
                            value={campos.idHerramienta}
                            onChange={(e) => { actualizar('idHerramienta', e.target.value); setError(''); }}
                            required
                            className="h-9 rounded-md border border-slate-200 bg-white px-3 text-xs text-slate-800 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                        >
                            <option value="">Seleccionar activo fijo...</option>
                            {herramientasDisponibles.map((h) => (
                                <option key={h.id} value={h.id}>
                                    {(() => {
                                        const inv = String(h.codigoInventario ?? '').trim();
                                        const uni = String(h.codigoUnico ?? '').trim();
                                        const etiqueta = inv || uni
                                            ? `I: ${inv || '—'} | U: ${uni || '—'}`
                                            : 'SIN-CODIGO';
                                        return `[${etiqueta}] ${h.nombre}`;
                                    })()}
                                </option>
                            ))}
                        </select>
                        {herramientasDisponibles.length === 0 && !prestamo ? (
                            <p className="text-xs text-amber-600 dark:text-amber-400">No hay activos fijos en buen estado disponibles.</p>
                        ) : null}
                    </div>

                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Docente que autoriza *</label>
                        <select
                            title="Seleccionar docente"
                            value={campos.idDocente}
                            onChange={(e) => { actualizar('idDocente', e.target.value); setError(''); }}
                            required
                            className="h-9 rounded-md border border-slate-200 bg-white px-3 text-xs text-slate-800 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                        >
                            <option value="">Seleccionar docente...</option>
                            {docentes.map((d) => (
                                <option key={d.id} value={d.id}>
                                    [{d.codigo}] {d.apellido}, {d.nombre}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Fecha y hora de préstamo *</label>
                            <DateTimePicker
                                title="Fecha y hora de préstamo"
                                value={campos.fechaPrestamo}
                                onChange={(value) => {
                                    actualizar('fechaPrestamo', value);
                                    setError('');
                                    if (!prestamo) {
                                        if (!campos.fechaDevolucion || new Date(campos.fechaDevolucion).getTime() <= new Date(value).getTime()) {
                                            actualizar('fechaDevolucion', sumarHorasInputLocal(value, 24));
                                        }
                                    }
                                }}
                                className="w-full"
                                dateButtonClassName="w-full"
                            />
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Fecha y hora devolución{prestamo ? '' : ' *'}</label>
                            <DateTimePicker
                                title="Fecha y hora de devolución"
                                value={campos.fechaDevolucion}
                                onChange={(value) => { actualizar('fechaDevolucion', value); setError(''); }}
                                className="w-full"
                                dateButtonClassName="w-full"
                            />
                        </div>
                    </div>

                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Observaciones</label>
                        <textarea
                            title="Observaciones del préstamo"
                            value={campos.observaciones}
                            onChange={(e) => actualizar('observaciones', e.target.value)}
                            rows={2}
                            placeholder={prestamo ? undefined : 'Motivo del préstamo u observaciones adicionales...'}
                            className="rounded-md border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 placeholder-slate-400 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 resize-none"
                        />
                    </div>

                    {error ? (
                        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600 dark:border-red-800 dark:bg-red-950 dark:text-red-400">{error}</p>
                    ) : null}
                    </form>
                </ScrollArea>
            </ModalBase>

            {confirmacionAbierta && (
                <ModalBase titulo="Descartar cambios" onCerrar={cancelarCierre} ancho="max-w-sm">
                    <div className="space-y-4">
                        <p className="text-sm text-slate-600 dark:text-slate-300">{mensajeConfirmacion}</p>
                        <div className="flex justify-end gap-2">
                            <Boton type="button" variant="outline" onClick={cancelarCierre}>
                                Seguir editando
                            </Boton>
                            <Boton type="button" variant="destructive" onClick={confirmarCierre}>
                                Descartar
                            </Boton>
                        </div>
                    </div>
                </ModalBase>
            )}
        </>
    );
};
