import { useState } from 'react';
import { ModalBase } from '../inventario/ModalBase';
import { useInventario } from '../../contextos/ContextoInventario';
import { Boton } from '../ui/button';
import { ahoraInputLocal, sumarHorasInputLocal } from '../../lib/fecha-local';

interface Props {
    onCerrar: () => void;
}

export const FormularioPrestamo = ({ onCerrar }: Props) => {
    const { agregarPrestamo, herramientas, estudiantes, docentes, prestamos } = useInventario();
    const inicio = ahoraInputLocal();
    const [campos, setCampos] = useState({
        carnetEstudiante: '',
        idHerramienta: '',
        idDocente: '',
        fechaPrestamo: inicio,
        fechaDevolucion: sumarHorasInputLocal(inicio, 24),
        observaciones: '',
    });
    const [error, setError] = useState('');
    const [guardando, setGuardando] = useState(false);

    const actualizar = (clave: string, valor: string) =>
        setCampos(prev => ({ ...prev, [clave]: valor }));

    const idsPrestados = new Set(
        prestamos
            .filter((p) => p.estado !== 'devuelto' && p.estado !== 'devuelto_fuera_de_fecha_limite')
            .map((p) => p.idHerramienta),
    );

    const herramientasDisponibles = herramientas.filter(
        (h) => h.estado === 'buen_estado' && !idsPrestados.has(h.id),
    );

    const manejarEnvio = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!campos.carnetEstudiante || !campos.idHerramienta || !campos.idDocente || !campos.fechaDevolucion) {
            setError('Debes ingresar estudiante, activo fijo y docente.');
            return;
        }

        const docente = docentes.find(d => d.id === campos.idDocente);
        if (!docente) {
            setError('Selecciona un docente válido.');
            return;
        }

        if (new Date(campos.fechaDevolucion).getTime() <= new Date(campos.fechaPrestamo).getTime()) {
            setError('La fecha/hora de devolución debe ser posterior al préstamo.');
            return;
        }

        try {
            setGuardando(true);
            await agregarPrestamo({
                carnetEstudiante: campos.carnetEstudiante,
                idHerramienta: campos.idHerramienta,
                docente: `${docente.nombre} ${docente.apellido}`.trim(),
                fechaPrestamo: campos.fechaPrestamo,
                fechaDevolucion: campos.fechaDevolucion,
                observaciones: campos.observaciones.trim(),
            });
            onCerrar();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'No se pudo registrar el préstamo.');
        } finally {
            setGuardando(false);
        }
    };

    return (
        <ModalBase titulo="Registrar préstamo" onCerrar={onCerrar}>
            <form onSubmit={manejarEnvio} className="space-y-3">
                <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Estudiante *</label>
                    <select
                        title="Seleccionar estudiante"
                        value={campos.carnetEstudiante}
                        onChange={e => { actualizar('carnetEstudiante', e.target.value); setError(''); }}
                        required
                        className="h-9 rounded-md border border-slate-200 bg-white px-3 text-xs text-slate-800 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    >
                        <option value="">Seleccionar estudiante...</option>
                        {estudiantes.map(e => (
                            <option key={e.carnet} value={e.carnet}>
                                [{e.carnet}] {e.apellido}, {e.nombre}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                        Activo Fijo *
                        <span className="ml-1 font-normal text-slate-400">(solo en buen estado)</span>
                    </label>
                    <select
                        title="Seleccionar activo fijo"
                        value={campos.idHerramienta}
                        onChange={e => { actualizar('idHerramienta', e.target.value); setError(''); }}
                        required
                        className="h-9 rounded-md border border-slate-200 bg-white px-3 text-xs text-slate-800 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    >
                        <option value="">Seleccionar activo fijo...</option>
                        {herramientasDisponibles.map(h => (
                            <option key={h.id} value={h.id}>
                                [{h.codigoInventario}] {h.nombre}
                            </option>
                        ))}
                    </select>
                    {herramientasDisponibles.length === 0 && (
                        <p className="text-xs text-amber-600 dark:text-amber-400">No hay activos fijos en buen estado disponibles.</p>
                    )}
                </div>

                <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Docente que autoriza *</label>
                    <select
                        title="Seleccionar docente"
                        value={campos.idDocente}
                        onChange={e => { actualizar('idDocente', e.target.value); setError(''); }}
                        required
                        className="h-9 rounded-md border border-slate-200 bg-white px-3 text-xs text-slate-800 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    >
                        <option value="">Seleccionar docente...</option>
                        {docentes.map(d => (
                            <option key={d.id} value={d.id}>
                                [{d.codigo}] {d.apellido}, {d.nombre}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Fecha y hora de préstamo</label>
                    <input
                        title="Fecha y hora de préstamo"
                        type="datetime-local"
                        value={campos.fechaPrestamo}
                        onChange={e => {
                            const nuevaFecha = e.target.value;
                            actualizar('fechaPrestamo', nuevaFecha);
                            if (!campos.fechaDevolucion || new Date(campos.fechaDevolucion).getTime() <= new Date(nuevaFecha).getTime()) {
                                actualizar('fechaDevolucion', sumarHorasInputLocal(nuevaFecha, 24));
                            }
                        }}
                        className="h-9 rounded-md border border-slate-200 bg-white px-3 text-xs text-slate-800 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    />
                </div>

                <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Fecha y hora límite de devolución *</label>
                    <input
                        title="Fecha y hora límite de devolución"
                        type="datetime-local"
                        value={campos.fechaDevolucion}
                        min={campos.fechaPrestamo}
                        onChange={e => {
                            actualizar('fechaDevolucion', e.target.value);
                            setError('');
                        }}
                        className="h-9 rounded-md border border-slate-200 bg-white px-3 text-xs text-slate-800 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    />
                </div>

                <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Observaciones</label>
                    <textarea
                        value={campos.observaciones}
                        onChange={e => actualizar('observaciones', e.target.value)}
                        placeholder="Motivo del préstamo u observaciones adicionales..."
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
                        {guardando ? 'Registrando...' : 'Registrar préstamo'}
                    </Boton>
                </div>
            </form>
        </ModalBase>
    );
};
