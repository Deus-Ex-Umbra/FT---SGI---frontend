import { useState } from 'react';
import { ModalBase } from './ModalBase';
import { useInventario } from '../../contextos/ContextoInventario';
import { Boton } from '../ui/button';
import { Switch } from '../ui/switch';
import type { Estudiante } from '../../tipos/inventario';

interface Props {
    onCerrar: () => void;
    estudiante?: Estudiante | null;
}

const carreras = ['Ing. Electrónica', 'Ing. Industrial', 'Ing. Mecánica', 'Ing. Civil', 'Ing. de Sistemas', 'Ing. Química', 'Otra'];

export const FormularioEstudiante = ({ onCerrar, estudiante }: Props) => {
    const { agregarEstudiante, editarEstudiante, estudiantes } = useInventario();
    const [campos, setCampos] = useState({
        carnet: estudiante?.carnet ?? '',
        nombre: estudiante?.nombre ?? '',
        apellido: estudiante?.apellido ?? '',
        carrera: estudiante?.carrera ?? '',
        semestre: estudiante ? String(estudiante.semestre) : '',
        carnetRetenido: Boolean(estudiante?.carnetRetenido),
    });
    const [error, setError] = useState('');
    const [guardando, setGuardando] = useState(false);

    const actualizar = (clave: string, valor: string) =>
        setCampos(prev => ({ ...prev, [clave]: valor }));

    const manejarEnvio = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!campos.carnet.trim() || !campos.nombre.trim() || !campos.apellido.trim()) {
            setError('Carnet, nombre y apellido son obligatorios.');
            return;
        }
        if (estudiantes.some(est => est.carnet === campos.carnet.trim() && est.id !== estudiante?.id)) {
            setError('El carnet ya está registrado en el sistema.');
            return;
        }
        const semestre = parseInt(campos.semestre);
        if (isNaN(semestre) || semestre < 1 || semestre > 10) {
            setError('El semestre debe ser un número entre 1 y 10.');
            return;
        }

        setGuardando(true);
        try {
            const payload = {
                carnet: campos.carnet.trim(),
                nombre: campos.nombre.trim(),
                apellido: campos.apellido.trim(),
                carrera: campos.carrera,
                semestre,
                carnetRetenido: campos.carnetRetenido,
            };

            if (estudiante?.id) {
                await editarEstudiante(estudiante.id, payload);
            } else {
                await agregarEstudiante(payload);
            }
            onCerrar();
        } catch (err: any) {
            setError(err?.message ?? 'No se pudo guardar el estudiante.');
        } finally {
            setGuardando(false);
        }
    };

    return (
        <ModalBase titulo={estudiante ? 'Editar estudiante' : 'Registrar estudiante'} onCerrar={onCerrar}>
            <form onSubmit={manejarEnvio} className="space-y-3">
                <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Carnet universitario *</label>
                    <input
                        type="text"
                        value={campos.carnet}
                        onChange={e => { actualizar('carnet', e.target.value); setError(''); }}
                        placeholder="Ej: 2024-12345"
                        className="h-9 rounded-md border border-slate-200 bg-white px-3 font-mono text-xs text-slate-800 placeholder-slate-400 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    />
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Nombre(s) *</label>
                        <input
                            type="text"
                            value={campos.nombre}
                            onChange={e => { actualizar('nombre', e.target.value); setError(''); }}
                            placeholder="Ej: Carlos Eduardo"
                            className="h-9 rounded-md border border-slate-200 bg-white px-3 text-xs text-slate-800 placeholder-slate-400 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                        />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Apellido(s) *</label>
                        <input
                            type="text"
                            value={campos.apellido}
                            onChange={e => { actualizar('apellido', e.target.value); setError(''); }}
                            placeholder="Ej: Mamani Quispe"
                            className="h-9 rounded-md border border-slate-200 bg-white px-3 text-xs text-slate-800 placeholder-slate-400 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                        />
                    </div>
                </div>

                <div className="flex items-center justify-between rounded-md border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-800/60">
                    <div>
                        <p className="text-xs font-medium text-slate-700 dark:text-slate-300">Carnet retenido fisicamente</p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">Activa este estado si el carnet universitario esta retenido.</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className={`text-[11px] font-semibold ${campos.carnetRetenido ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                            {campos.carnetRetenido ? 'Si' : 'No'}
                        </span>
                        <Switch
                            checked={campos.carnetRetenido}
                            onCheckedChange={(valor) => setCampos(prev => ({ ...prev, carnetRetenido: valor }))}
                            aria-label="Carnet retenido fisicamente"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Carrera *</label>
                        <select
                            value={campos.carrera}
                            onChange={e => actualizar('carrera', e.target.value)}
                            required
                            className="h-9 rounded-md border border-slate-200 bg-white px-3 text-xs text-slate-800 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                        >
                            <option value="">Seleccionar...</option>
                            {carreras.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Semestre *</label>
                        <input
                            type="number"
                            min={1}
                            max={10}
                            value={campos.semestre}
                            onChange={e => { actualizar('semestre', e.target.value); setError(''); }}
                            placeholder="1 – 10"
                            className="h-9 rounded-md border border-slate-200 bg-white px-3 text-xs text-slate-800 placeholder-slate-400 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                        />
                    </div>
                </div>

                {error && <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600 dark:border-red-800 dark:bg-red-950 dark:text-red-400">{error}</p>}

                <div className="flex justify-end gap-2 pt-1">
                    <button type="button" onClick={onCerrar} className="h-9 rounded-md border border-slate-200 px-4 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400">
                        Cancelar
                    </button>
                    <Boton type="submit" className="h-9 px-5 text-xs" disabled={guardando}>
                        {guardando ? 'Guardando...' : (estudiante ? 'Guardar cambios' : 'Registrar estudiante')}
                    </Boton>
                </div>
            </form>
        </ModalBase>
    );
};
