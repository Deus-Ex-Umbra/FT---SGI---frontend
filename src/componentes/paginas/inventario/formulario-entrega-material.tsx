import { useMemo, useState } from 'react';
import { ModalBase } from './modal-base';
import { useInventario } from '@/contextos/ContextoInventario';
import { Boton } from '@/componentes/ui/button';
import { Input } from '@/componentes/ui/input';
import { Label } from '@/componentes/ui/label';
import { Textarea } from '@/componentes/ui/textarea';
import { useCierreSeguro } from '@/hooks/use-cierre-seguro';
import {
    Combobox,
    ComboboxContent,
    ComboboxEmpty,
    ComboboxInput,
    ComboboxItem,
    ComboboxList,
} from '@/componentes/ui/combobox';
import type { MaterialFungible } from '@/tipos/inventario';

interface Props {
    onCerrar: () => void;
}

const Campo = ({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) => (
    <div className="flex flex-col gap-1.5">
        <Label>
            {label}{required && <span className="ml-0.5 text-red-500">*</span>}
        </Label>
        {children}
    </div>
);

export const FormularioEntregaMaterial = ({ onCerrar }: Props) => {
    const { materiales, registrarEntregaMaterial } = useInventario();
    const inicial = useMemo(() => ({
        idMaterial: '',
        cantidad: '',
        motivo: '',
    }), []);

    const [campos, setCampos] = useState({
        idMaterial: '',
        cantidad: '',
        motivo: '',
    });
    const [error, setError] = useState('');

    const estaSucio = useMemo(() => {
        const normalizar = (v: string) => v.trim();
        return (
            normalizar(campos.idMaterial) !== normalizar(inicial.idMaterial) ||
            normalizar(campos.cantidad) !== normalizar(inicial.cantidad) ||
            normalizar(campos.motivo) !== normalizar(inicial.motivo)
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
        mensajeConfirmacion: 'Hay datos ingresados en la entrega. ¿Deseas cerrar y descartarlos?',
    });

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
        <>
            <ModalBase titulo="Registrar entrega de material" onCerrar={solicitarCierre}>
                <form onSubmit={manejarEnvio} className="space-y-4">

                    <Campo label="Material" required>
                        <Combobox
                            items={materiales}
                            value={campos.idMaterial}
                            getItemValue={(m: MaterialFungible) => m.id}
                            getItemLabel={(m: MaterialFungible) => `${m.nombre} — Stock: ${m.cantidadDisponible} ${m.unidad}`}
                            onValueChange={(val) => {
                                actualizar('idMaterial', val);
                                actualizar('cantidad', '');
                                setError('');
                            }}
                        >
                            <ComboboxInput
                                placeholder="Buscar material..."
                                showClear={true}
                            />
                            <ComboboxContent>
                                <ComboboxList>
                                    {(item: MaterialFungible) => (
                                        <ComboboxItem key={item.id} value={item.id}>
                                            <span className="font-medium">{item.nombre}</span>
                                            <span className="ml-2 text-slate-400 text-[12px]">Stock: {item.cantidadDisponible} {item.unidad}</span>
                                        </ComboboxItem>
                                    )}
                                </ComboboxList>
                                <ComboboxEmpty>No se encontró el material</ComboboxEmpty>
                            </ComboboxContent>
                        </Combobox>
                    </Campo>

                    <div className="grid grid-cols-2 gap-3">
                        <Campo label={`Cantidad${materialSeleccionado ? ` (máx. ${materialSeleccionado.cantidadDisponible} ${materialSeleccionado.unidad})` : ''}`} required>
                            <Input
                                type="number"
                                min={1}
                                max={materialSeleccionado?.cantidadDisponible ?? undefined}
                                value={campos.cantidad}
                                onChange={e => { actualizar('cantidad', e.target.value); setError(''); }}
                                placeholder="0"
                            />
                        </Campo>
                        <Campo label="Unidad">
                            <Input
                                type="text"
                                value={materialSeleccionado?.unidad ?? ''}
                                readOnly
                                className="bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                            />
                        </Campo>
                    </div>

                    <Campo label="Motivo / Observaciones">
                        <Textarea
                            value={campos.motivo}
                            onChange={e => actualizar('motivo', e.target.value)}
                            placeholder="Ej: Práctica de soldadura MIG — Proyecto integrador..."
                            rows={2}
                            className="min-h-[72px] resize-none text-sm"
                        />
                    </Campo>

                    {error && <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-600 dark:border-red-800 dark:bg-red-950 dark:text-red-400">{error}</p>}

                    <div className="flex justify-end gap-2 pt-1">
                        <Boton type="button" variant="outline" onClick={solicitarCierre} className="h-9 px-4 text-sm">
                            Cancelar
                        </Boton>
                        <Boton type="submit" className="h-9 px-5 text-sm">
                            Registrar entrega
                        </Boton>
                    </div>
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
