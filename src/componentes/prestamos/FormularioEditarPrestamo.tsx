import { useState } from 'react';
import type { Docente, Estudiante, Herramienta, Prestamo } from '../../tipos/inventario';
import { ModalBase } from '../inventario/ModalBase';
import { useInventario } from '../../contextos/ContextoInventario';
import { Boton } from '../ui/button';
import { apiDateTimeAInputLocal } from '../../lib/fecha-local';

interface Props {
    prestamo: Prestamo;
    estudiantes: Estudiante[];
    docentes: Docente[];
    herramientas: Herramienta[];
    onCerrar: () => void;
}

export const FormularioEditarPrestamo = ({ prestamo, estudiantes, docentes, herramientas, onCerrar }: Props) => {
    const { editarPrestamo } = useInventario();
    const [campos, setCampos] = useState({
        carnetEstudiante: prestamo.carnetEstudiante,
        idHerramienta: prestamo.idHerramienta,
        docente: prestamo.docente,
        fechaPrestamo: apiDateTimeAInputLocal(prestamo.fechaPrestamo),
        fechaDevolucion: apiDateTimeAInputLocal(prestamo.fechaDevolucion),
        observaciones: prestamo.observaciones ?? '',
    });
    const [error, setError] = useState('');
    const [guardando, setGuardando] = useState(false);

    const actualizar = (clave: keyof typeof campos, valor: string) => {
        setCampos((prev) => ({ ...prev, [clave]: valor }));
    };

    const manejarGuardar = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!campos.carnetEstudiante || !campos.idHerramienta || !campos.docente.trim() || !campos.fechaPrestamo) {
            setError('Completa estudiante, activo, docente y fecha de préstamo.');
            return;
        }

        if (campos.fechaDevolucion && new Date(campos.fechaDevolucion).getTime() <= new Date(campos.fechaPrestamo).getTime()) {
            setError('La fecha/hora de devolución debe ser posterior al préstamo.');
            return;
        }

        try {
            setGuardando(true);
            await editarPrestamo(prestamo.id, {
                carnetEstudiante: campos.carnetEstudiante,
                idHerramienta: campos.idHerramienta,
                docente: campos.docente.trim(),
                fechaPrestamo: campos.fechaPrestamo,
                fechaDevolucion: campos.fechaDevolucion || null,
                observaciones: campos.observaciones.trim(),
            });
            onCerrar();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'No se pudo editar el préstamo.');
        } finally {
            setGuardando(false);
        }
    };

    return (
        <ModalBase titulo={`Editar préstamo #${prestamo.id}`} onCerrar={onCerrar} ancho="max-w-xl">
            <form onSubmit={manejarGuardar} className="space-y-3">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Estudiante *</label>
                        <select
                            title="Seleccionar estudiante"
                            value={campos.carnetEstudiante}
                            onChange={(e) => { actualizar('carnetEstudiante', e.target.value); setError(''); }}
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
                        <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Docente *</label>
                        <select
                            title="Seleccionar docente"
                            value={campos.docente}
                            onChange={(e) => { actualizar('docente', e.target.value); setError(''); }}
                            className="h-9 rounded-md border border-slate-200 bg-white px-3 text-xs text-slate-800 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                        >
                            <option value="">Seleccionar docente...</option>
                            {docentes.map((d) => {
                                const nombreCompleto = `${d.nombre} ${d.apellido}`.trim();
                                return (
                                    <option key={d.id} value={nombreCompleto}>
                                        [{d.codigo}] {d.apellido}, {d.nombre}
                                    </option>
                                );
                            })}
                        </select>
                    </div>
                </div>

                <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Activo fijo *</label>
                    <select
                        title="Seleccionar activo fijo"
                        value={campos.idHerramienta}
                        onChange={(e) => { actualizar('idHerramienta', e.target.value); setError(''); }}
                        className="h-9 rounded-md border border-slate-200 bg-white px-3 text-xs text-slate-800 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    >
                        <option value="">Seleccionar activo fijo...</option>
                        {herramientas.map((h) => (
                            <option key={h.id} value={h.id}>
                                [{h.codigoInventario}] {h.nombre}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Fecha y hora préstamo *</label>
                        <input
                            title="Fecha y hora de préstamo"
                            type="datetime-local"
                            value={campos.fechaPrestamo}
                            onChange={(e) => { actualizar('fechaPrestamo', e.target.value); setError(''); }}
                            className="h-9 rounded-md border border-slate-200 bg-white px-3 text-xs text-slate-800 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                        />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Fecha y hora devolución</label>
                        <input
                            title="Fecha y hora de devolución"
                            type="datetime-local"
                            value={campos.fechaDevolucion}
                            min={campos.fechaPrestamo || undefined}
                            onChange={(e) => { actualizar('fechaDevolucion', e.target.value); setError(''); }}
                            className="h-9 rounded-md border border-slate-200 bg-white px-3 text-xs text-slate-800 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
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
                        className="rounded-md border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 placeholder-slate-400 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 resize-none"
                    />
                </div>

                {error && <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600 dark:border-red-800 dark:bg-red-950 dark:text-red-400">{error}</p>}

                <div className="flex justify-end gap-2 pt-1">
                    <button type="button" onClick={onCerrar} className="h-9 rounded-md border border-slate-200 px-4 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400">
                        Cancelar
                    </button>
                    <Boton type="submit" className="h-9 px-5 text-xs">
                        {guardando ? 'Guardando...' : 'Guardar cambios'}
                    </Boton>
                </div>
            </form>
        </ModalBase>
    );
};
