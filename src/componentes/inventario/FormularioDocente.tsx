import { useState } from 'react';
import { ModalBase } from './ModalBase';
import { useInventario } from '../../contextos/ContextoInventario';
import { Boton } from '../ui/button';
import type { Docente } from '../../tipos/inventario';

interface Props {
    onCerrar: () => void;
    docente?: Docente | null;
}

export const FormularioDocente = ({ onCerrar, docente }: Props) => {
    const { agregarDocente, editarDocente } = useInventario();
    const [campos, setCampos] = useState({
        codigo: docente?.codigo ?? '',
        nombre: docente?.nombre ?? '',
        apellido: docente?.apellido ?? '',
        materia: docente?.materia ?? '',
        carnet: docente?.carnet ?? '',
    });
    const [error, setError] = useState('');
    const [guardando, setGuardando] = useState(false);

    const manejarEnvio = async (e: React.FormEvent) => {
        e.preventDefault();
        setGuardando(true);
        setError('');
        try {
            const payload = {
                codigo: campos.codigo.trim(),
                nombre: campos.nombre.trim(),
                apellido: campos.apellido.trim(),
                materia: campos.materia.trim(),
                carnet: campos.carnet.trim(),
            };

            if (docente?.id) {
                await editarDocente(docente.id, payload);
            } else {
                await agregarDocente(payload);
            }
            onCerrar();
        } catch (err: any) {
            setError(err?.message ?? 'No se pudo guardar el docente.');
        } finally {
            setGuardando(false);
        }
    };

    return (
        <ModalBase titulo={docente ? 'Editar docente' : 'Registrar docente'} onCerrar={onCerrar}>
            <form onSubmit={manejarEnvio} className="space-y-3">
                <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Código *</label>
                    <input
                        type="text"
                        value={campos.codigo}
                        onChange={e => { setCampos(prev => ({ ...prev, codigo: e.target.value })); setError(''); }}
                        required
                        title="Código del docente"
                        className="h-9 rounded-md border border-slate-200 bg-white px-3 text-xs text-slate-800 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    />
                </div>
                <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Nombres *</label>
                    <input
                        type="text"
                        value={campos.nombre}
                        onChange={e => { setCampos(prev => ({ ...prev, nombre: e.target.value })); setError(''); }}
                        required
                        title="Nombres del docente"
                        className="h-9 rounded-md border border-slate-200 bg-white px-3 text-xs text-slate-800 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    />
                </div>
                <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Apellidos *</label>
                    <input
                        type="text"
                        value={campos.apellido}
                        onChange={e => { setCampos(prev => ({ ...prev, apellido: e.target.value })); setError(''); }}
                        required
                        title="Apellidos del docente"
                        className="h-9 rounded-md border border-slate-200 bg-white px-3 text-xs text-slate-800 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    />
                </div>
                <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Materia *</label>
                    <input
                        type="text"
                        value={campos.materia}
                        onChange={e => { setCampos(prev => ({ ...prev, materia: e.target.value })); setError(''); }}
                        required
                        placeholder="Ej: SIS245"
                        className="h-9 rounded-md border border-slate-200 bg-white px-3 text-xs text-slate-800 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    />
                </div>
                <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Carnet de Identidad *</label>
                    <input
                        type="text"
                        value={campos.carnet}
                        onChange={e => { setCampos(prev => ({ ...prev, carnet: e.target.value })); setError(''); }}
                        required
                        title="Carnet de identidad del docente"
                        className="h-9 rounded-md border border-slate-200 bg-white px-3 text-xs text-slate-800 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    />
                </div>
                {error && <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600 dark:border-red-800 dark:bg-red-950 dark:text-red-400">{error}</p>}
                <div className="flex justify-end gap-2 pt-1">
                    <button type="button" onClick={onCerrar} className="h-9 rounded-md border border-slate-200 px-4 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400">
                        Cancelar
                    </button>
                    <Boton type="submit" className="h-9 px-5 text-xs" disabled={guardando}>
                        {guardando ? 'Guardando...' : (docente ? 'Guardar cambios' : 'Guardar docente')}
                    </Boton>
                </div>
            </form>
        </ModalBase>
    );
};
