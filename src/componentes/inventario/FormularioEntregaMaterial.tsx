import { useState } from 'react';
import { ModalBase } from './ModalBase';
import { useInventario } from '../../contextos/ContextoInventario';
import { Boton } from '../ui/button';

interface Props {
    onCerrar: () => void;
}

export const FormularioEntregaMaterial = ({ onCerrar }: Props) => {
    const { materiales, registrarEntregaMaterial } = useInventario();
    const [campos, setCampos] = useState({
        idMaterial: '',
        cantidad: '',
        motivo: '',
    });
    const [error, setError] = useState('');

    const actualizar = (clave: string, valor: string) =>
        setCampos(prev => ({ ...prev, [clave]: valor }));

    const materialSeleccionado = materiales.find(m => m.id === campos.idMaterial);

    const manejarEnvio = (e: React.FormEvent) => {
        e.preventDefault();
        if (!campos.idMaterial) {
            setError('Debes seleccionar un material.');
            return;
        }
        const cantidad = parseInt(campos.cantidad);
        if (isNaN(cantidad) || cantidad <= 0) {
            setError('La cantidad debe ser un número mayor a 0.');
            return;
        }
        if (materialSeleccionado && cantidad > (materialSeleccionado.cantidadDisponible || 0)) {
            setError(`Stock insuficiente. Disponible: ${materialSeleccionado.cantidadDisponible} ${materialSeleccionado.unidad}.`);
            return;
        }
        registrarEntregaMaterial(campos.idMaterial, cantidad, '', campos.motivo.trim());
        onCerrar();
    };

    return (
        <ModalBase titulo="Registrar entrega de material" onCerrar={onCerrar}>
            <form onSubmit={manejarEnvio} className="space-y-3">


                <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Material *</label>
                    <select
                        value={campos.idMaterial}
                        onChange={e => { actualizar('idMaterial', e.target.value); actualizar('cantidad', ''); setError(''); }}
                        required
                        className="h-9 rounded-md border border-slate-200 bg-white px-3 text-xs text-slate-800 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    >
                        <option value="">Seleccionar material...</option>
                        {materiales.map(m => (
                            <option key={m.id} value={m.id}>
                                {m.nombre} — Stock: {m.cantidadDisponible} {m.unidad}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                            Cantidad *
                            {materialSeleccionado && (
                                <span className="ml-1 font-normal text-slate-400">
                                    (máx. {materialSeleccionado.cantidadDisponible} {materialSeleccionado.unidad})
                                </span>
                            )}
                        </label>
                        <input
                            type="number"
                            min={1}
                            max={materialSeleccionado?.cantidadDisponible ?? undefined}
                            value={campos.cantidad}
                            onChange={e => { actualizar('cantidad', e.target.value); setError(''); }}
                            placeholder="0"
                            className="h-9 rounded-md border border-slate-200 bg-white px-3 text-xs text-slate-800 placeholder-slate-400 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                        />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Unidad</label>
                        <input
                            type="text"
                            value={materialSeleccionado?.unidad ?? ''}
                            readOnly
                            className="h-9 rounded-md border border-slate-200 bg-slate-100 px-3 text-xs text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400"
                        />
                    </div>
                </div>

                <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Motivo / Observaciones</label>
                    <textarea
                        value={campos.motivo}
                        onChange={e => actualizar('motivo', e.target.value)}
                        placeholder="Ej: Práctica de soldadura MIG — Proyecto integrador..."
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
                        Registrar entrega
                    </Boton>
                </div>
            </form>
        </ModalBase>
    );
};
