import { useState } from 'react';
import { ModalBase } from './ModalBase';
import { useInventario } from '../../contextos/ContextoInventario';
import { Boton } from '../ui/button';
import type { EstadoHerramienta } from '../../tipos/inventario';

interface Props {
    onCerrar: () => void;
}

const categorias = ['Taladros', 'Soldadura', 'Esmeriles', 'Medición', 'Compresores', 'Sierras', 'Otro'];
const unidades = ['Electrónica', 'Industrial', 'Mecánica', 'Civil', 'Sistemas', 'Química', 'Otra'];

export const FormularioHerramienta = ({ onCerrar }: Props) => {
    const { agregarHerramienta, herramientas } = useInventario();
    const [campos, setCampos] = useState({
        codigoInventario: '',
        nombre: '',
        categoria: '',
        ue: '',
        estado: 'buen_estado' as EstadoHerramienta,
        descripcion: '',
        observaciones: '',
    });
    const [error, setError] = useState('');

    const actualizar = (clave: string, valor: string) =>
        setCampos(prev => ({ ...prev, [clave]: valor }));

    const manejarEnvio = (e: React.FormEvent) => {
        e.preventDefault();
        if (!campos.codigoInventario.trim() || !campos.nombre.trim()) {
            setError('El código y el nombre son obligatorios.');
            return;
        }
        if (herramientas.some(h => h.codigoInventario === campos.codigoInventario.trim().toUpperCase())) {
            setError('El código de inventario ya existe.');
            return;
        }
        agregarHerramienta({
            ...campos,
            codigoInventario: campos.codigoInventario.trim().toUpperCase(),
            subinstancias: []
        });
        onCerrar();
    };

    return (
        <ModalBase titulo="Registrar activo fijo" onCerrar={onCerrar} ancho="max-w-xl">
            <form onSubmit={manejarEnvio} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Código inventario *</label>
                        <input
                            type="text"
                            value={campos.codigoInventario}
                            onChange={e => { actualizar('codigoInventario', e.target.value); setError(''); }}
                            placeholder="Ej: TL-011"
                            className="h-9 rounded-md border border-slate-200 bg-white px-3 font-mono text-xs text-slate-800 placeholder-slate-400 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                        />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Categoría *</label>
                        <select
                            value={campos.categoria}
                            onChange={e => actualizar('categoria', e.target.value)}
                            required
                            className="h-9 rounded-md border border-slate-200 bg-white px-3 text-xs text-slate-800 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                        >
                            <option value="">Seleccionar...</option>
                            {categorias.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Nombre / descripción *</label>
                        <input
                            type="text"
                            value={campos.nombre}
                            onChange={e => { actualizar('nombre', e.target.value); setError(''); }}
                            placeholder="Ej: Taladro percutor 18V"
                            className="h-9 rounded-md border border-slate-200 bg-white px-3 text-xs text-slate-800 placeholder-slate-400 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                        />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-medium text-slate-700 dark:text-slate-300">U.E.</label>
                        <select
                            value={campos.ue}
                            onChange={e => actualizar('ue', e.target.value)}
                            className="h-9 rounded-md border border-slate-200 bg-white px-3 text-xs text-slate-800 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                        >
                            <option value="">Seleccionar...</option>
                            {unidades.map(u => <option key={u} value={u}>{u}</option>)}
                        </select>
                    </div>
                </div>

                <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Estado inicial</label>
                    <div className="flex gap-2">
                        {(['buen_estado', 'regular', 'en_mantenimiento', 'danado'] as EstadoHerramienta[]).map(est => (
                            <button
                                key={est}
                                type="button"
                                onClick={() => actualizar('estado', est)}
                                className={`flex-1 rounded-md border py-1.5 text-xs font-medium transition-colors ${campos.estado === est
                                    ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                                    : 'border-slate-200 text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:text-slate-400'
                                    }`}
                            >
                                {est === 'buen_estado' ? 'Buen estado' : est === 'regular' ? 'Regular' : est === 'en_mantenimiento' ? 'Mantenimiento' : 'Dañado'}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Descripción</label>
                    <textarea
                        value={campos.descripcion}
                        onChange={e => actualizar('descripcion', e.target.value)}
                        placeholder="Características técnicas del equipo..."
                        rows={2}
                        className="rounded-md border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 placeholder-slate-400 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 resize-none"
                    />
                </div>

                <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Observación</label>
                    <input
                        type="text"
                        value={campos.observaciones}
                        onChange={e => actualizar('observaciones', e.target.value)}
                        placeholder="Notas adicionales sobre el equipo..."
                        className="h-9 rounded-md border border-slate-200 bg-white px-3 text-xs text-slate-800 placeholder-slate-400 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    />
                </div>

                {error && <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600 dark:border-red-800 dark:bg-red-950 dark:text-red-400">{error}</p>}

                <div className="flex justify-end gap-2 pt-1">
                    <button type="button" onClick={onCerrar} className="h-9 rounded-md border border-slate-200 px-4 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400">
                        Cancelar
                    </button>
                    <Boton type="submit" className="h-9 px-5 text-xs">
                        Registrar activo fijo
                    </Boton>
                </div>
            </form>
        </ModalBase>
    );
};
