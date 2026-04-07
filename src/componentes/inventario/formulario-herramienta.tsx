import { useMemo, useState, useId } from 'react';
import { ModalBase } from './modal-base';
import { useInventario } from '@/contextos/ContextoInventario';
import { Boton } from '@/componentes/ui/button';
import type { EstadoHerramienta } from '@/tipos/inventario';
import { useCierreSeguro } from '@/hooks/use-cierre-seguro';
import { etiquetaEstadoItem } from '@/lib/estados-activo';
import { ScrollArea } from '@/componentes/ui/scroll-area';

interface Props {
    onCerrar: () => void;
}

const categorias = ['Taladros', 'Soldadura', 'Esmeriles', 'Medición', 'Compresores', 'Sierras', 'Otro'];
const unidades = ['Electrónica', 'Industrial', 'Mecánica', 'Civil', 'Sistemas', 'Química', 'Otra'];

export const FormularioHerramienta = ({ onCerrar }: Props) => {
    const { agregarHerramienta, herramientas } = useInventario();
    const reactId = useId();
    const formId = useMemo(() => `form-herramienta-${reactId.replace(/:/g, '')}`, [reactId]);
    const inicial = useMemo(() => ({
        codigoInventario: '',
        nombre: '',
        categoria: '',
        ue: '',
        estado: 'disponible' as EstadoHerramienta,
        descripcion: '',
        observaciones: '',
    }), []);

    const [campos, setCampos] = useState({
        codigoInventario: '',
        nombre: '',
        categoria: '',
        ue: '',
        estado: 'disponible' as EstadoHerramienta,
        descripcion: '',
        observaciones: '',
    });
    const [error, setError] = useState('');

    const estaSucio = useMemo(() => {
        const normalizar = (v: string) => v.trim();
        return (
            normalizar(campos.codigoInventario) !== normalizar(inicial.codigoInventario) ||
            normalizar(campos.nombre) !== normalizar(inicial.nombre) ||
            campos.categoria !== inicial.categoria ||
            campos.ue !== inicial.ue ||
            campos.estado !== inicial.estado ||
            normalizar(campos.descripcion) !== normalizar(inicial.descripcion) ||
            normalizar(campos.observaciones) !== normalizar(inicial.observaciones)
        );
    }, [campos, inicial]);

    const {
        solicitarCierre,
        confirmacionAbierta,
        cancelarCierre,
        confirmarCierre,
        mensajeConfirmacion,
    } = useCierreSeguro({
        estaSucio,
        alCerrar: onCerrar,
        mensajeConfirmacion: 'Hay datos ingresados en el activo fijo. ¿Deseas cerrar y descartarlos?',
    });

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
            nombre: campos.nombre,
            categoria: campos.categoria,
            estado: campos.estado,
            descripcion: campos.descripcion,
            observaciones: campos.observaciones,
            subinstancias: [
                {
                    id: `TMP-${Date.now()}`,
                    codigoInventario: campos.codigoInventario.trim().toUpperCase(),
                    estado: campos.estado,
                    ue: campos.ue,
                    observaciones: campos.observaciones,
                },
            ]
        });
        onCerrar();
    };

    return (
        <>
            <ModalBase
                titulo="Registrar activo fijo"
                onCerrar={solicitarCierre}
                ancho="max-w-xl"
                bodyClassName="p-0"
                footer={
                    <div className="flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={solicitarCierre}
                            className="h-9 rounded-md border border-slate-200 px-4 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400"
                        >
                            Cancelar
                        </button>
                        <Boton form={formId} type="submit" className="h-9 px-5 text-xs">
                            Registrar activo fijo
                        </Boton>
                    </div>
                }
            >
                <form id={formId} onSubmit={manejarEnvio} className="flex h-full min-h-0 flex-col">
                    <ScrollArea className="scroll-elegante flex-1 px-4 py-4">
                        <div className="space-y-3">
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
                                    {(['disponible', 'en_mantenimiento'] as EstadoHerramienta[]).map(est => (
                                        <button
                                            key={est}
                                            type="button"
                                            onClick={() => actualizar('estado', est)}
                                            className={`flex-1 rounded-md border py-1.5 text-xs font-medium transition-colors ${campos.estado === est
                                                ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                                                : 'border-slate-200 text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:text-slate-400'
                                                }`}
                                        >
                                            {etiquetaEstadoItem(est)}
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

                            {error && (
                                <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600 dark:border-red-800 dark:bg-red-950 dark:text-red-400">{error}</p>
                            )}
                        </div>
                    </ScrollArea>
                </form>
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
