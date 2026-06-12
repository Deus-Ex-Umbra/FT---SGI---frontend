import { useMemo, useState, useId } from 'react';
import { ModalBase } from './modal-base';
import { useInventario } from '@/contextos/ContextoInventario';
import { Boton } from '@/componentes/ui/button';
import { Input } from '@/componentes/ui/input';
import { Label } from '@/componentes/ui/label';
import { Textarea } from '@/componentes/ui/textarea';
import type { EstadoHerramienta } from '@/tipos/inventario';
import { useCierreSeguro } from '@/hooks/use-cierre-seguro';
import { etiquetaEstadoItem } from '@/utilidades/estados-activo';
import { ScrollArea } from '@/componentes/ui/scroll-area';
import {
    Combobox,
    ComboboxContent,
    ComboboxEmpty,
    ComboboxInput,
    ComboboxItem,
    ComboboxList,
} from '@/componentes/ui/combobox';

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
                        <Boton
                            type="button"
                            variant="outline"
                            onClick={solicitarCierre}
                            className="h-9 px-4 text-sm"
                        >
                            Cancelar
                        </Boton>
                        <Boton form={formId} type="submit" className="h-9 px-5 text-sm">
                            Registrar activo fijo
                        </Boton>
                    </div>
                }
            >
                <form id={formId} onSubmit={manejarEnvio} className="flex h-full min-h-0 flex-col">
                    <ScrollArea className="scroll-elegante flex-1 px-5 py-5">
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex flex-col gap-1.5">
                                    <Label>Codigo inventario *</Label>
                                    <Input
                                        type="text"
                                        value={campos.codigoInventario}
                                        onChange={e => { actualizar('codigoInventario', e.target.value); setError(''); }}
                                        placeholder="Ej: TL-011"
                                        className="font-mono"
                                    />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <Label>Categoría *</Label>
                                    <Combobox
                                        items={categorias}
                                        value={campos.categoria}
                                        onValueChange={(val) => actualizar('categoria', val)}
                                    >
                                        <ComboboxInput placeholder="Buscar categoría..." />
                                        <ComboboxContent>
                                            <ComboboxList>
                                                {(item: string) => (
                                                    <ComboboxItem key={item} value={item}>
                                                        {item}
                                                    </ComboboxItem>
                                                )}
                                            </ComboboxList>
                                            <ComboboxEmpty>Sin resultados</ComboboxEmpty>
                                        </ComboboxContent>
                                    </Combobox>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex flex-col gap-1.5">
                                    <Label>Nombre / descripción *</Label>
                                    <Input
                                        type="text"
                                        value={campos.nombre}
                                        onChange={e => { actualizar('nombre', e.target.value); setError(''); }}
                                        placeholder="Ej: Taladro percutor 18V"
                                    />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <Label>U.E.</Label>
                                    <Combobox
                                        items={unidades}
                                        value={campos.ue}
                                        onValueChange={(val) => actualizar('ue', val)}
                                    >
                                        <ComboboxInput placeholder="Buscar unidad..." />
                                        <ComboboxContent>
                                            <ComboboxList>
                                                {(item: string) => (
                                                    <ComboboxItem key={item} value={item}>
                                                        {item}
                                                    </ComboboxItem>
                                                )}
                                            </ComboboxList>
                                            <ComboboxEmpty>Sin resultados</ComboboxEmpty>
                                        </ComboboxContent>
                                    </Combobox>
                                </div>
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <Label>Estado inicial</Label>
                                <div className="flex gap-2">
                                    {(['disponible', 'en_mantenimiento'] as EstadoHerramienta[]).map(est => (
                                        <Boton
                                            key={est}
                                            type="button"
                                            variant="outline"
                                            onClick={() => actualizar('estado', est)}
                                            className={`h-9 flex-1 text-sm font-medium transition-colors ${campos.estado === est
                                                ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                                                : 'border-slate-200 text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:text-slate-400'
                                                }`}
                                        >
                                            {etiquetaEstadoItem(est)}
                                        </Boton>
                                    ))}
                                </div>
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <Label>Descripción</Label>
                                <Textarea
                                    value={campos.descripcion}
                                    onChange={e => actualizar('descripcion', e.target.value)}
                                    placeholder="Características técnicas del equipo..."
                                    rows={2}
                                    className="min-h-[72px] resize-none text-sm"
                                />
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <Label>Observación</Label>
                                <Input
                                    type="text"
                                    value={campos.observaciones}
                                    onChange={e => actualizar('observaciones', e.target.value)}
                                    placeholder="Notas adicionales sobre el equipo..."
                                />
                            </div>

                            {error && (
                                <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-600 dark:border-red-800 dark:bg-red-950 dark:text-red-400">{error}</p>
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

