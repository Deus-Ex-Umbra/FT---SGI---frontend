import { useEffect, useState } from 'react';
import { ModalBase } from './modal-base';
import { useInventario } from '@/contextos/ContextoInventario';
import { Boton } from '@/componentes/ui/button';
import { Input } from '@/componentes/ui/input';
import { Label } from '@/componentes/ui/label';
import { Plus, Trash2, GraduationCap, Hash, AlertCircle } from 'lucide-react';
import type { Estudiante, Carrera } from '@/tipos/inventario';
import { toast } from 'sonner';
import {
    Combobox,
    ComboboxContent,
    ComboboxEmpty,
    ComboboxInput,
    ComboboxItem,
    ComboboxList,
} from '@/componentes/ui/combobox';

interface Props {
    estudiante: Estudiante;
    onCerrar: () => void;
}

interface AsignacionLocal {
    idInterno: string;
    carreraId: string;
    carreraNombre: string;
    cu: string;
    prefijoCu: string | null;
}

export const DialogoAsignacionCarreras = ({ estudiante, onCerrar }: Props) => {
    const { carreras, editarEstudiante } = useInventario();
    const [asignaciones, setAsignaciones] = useState<AsignacionLocal[]>([]);
    const [nuevaCarreraId, setNuevaCarreraId] = useState('');
    const [nuevoCuCodigo, setNuevoCuCodigo] = useState('');
    const [guardando, setGuardando] = useState(false);

    useEffect(() => {
        if (estudiante.asignacionesCarrera) {
            setAsignaciones(estudiante.asignacionesCarrera.map((a, index) => ({
                idInterno: `existente-${index}`,
                carreraId: a.carreraId || '',
                carreraNombre: a.carrera,
                cu: a.cu,
                prefijoCu: a.prefijoCu ?? null
            })));
        } else if (estudiante.carrera && estudiante.cu) {
             setAsignaciones([{
                idInterno: 'legado-0',
                carreraId: estudiante.carreraId || '',
                carreraNombre: estudiante.carrera,
                cu: estudiante.cu,
                prefijoCu: null
            }]);
        }
    }, [estudiante]);

    const carreraSeleccionada = carreras.find(c => c.id === nuevaCarreraId);

    const agregarAsignacion = () => {
        if (!nuevaCarreraId || !nuevoCuCodigo.trim()) {
            toast.error('Selecciona una carrera e ingresa un CU.');
            return;
        }

        if (asignaciones.some(a => a.carreraId === nuevaCarreraId)) {
            toast.error('El estudiante ya tiene asignada esta carrera.');
            return;
        }

        const prefijo = carreraSeleccionada?.prefijoCu || '111';
        const cuFinal = `${prefijo}-${nuevoCuCodigo.trim().toUpperCase()}`;

        if (asignaciones.some(a => a.cu === cuFinal)) {
            toast.error('Este CU ya está en la lista de asignaciones.');
            return;
        }

        setAsignaciones(prev => [...prev, {
            idInterno: `nuevo-${Date.now()}`,
            carreraId: nuevaCarreraId,
            carreraNombre: carreraSeleccionada?.nombre || '',
            cu: cuFinal,
            prefijoCu: prefijo
        }]);

        setNuevaCarreraId('');
        setNuevoCuCodigo('');
    };

    const eliminarAsignacion = (idInterno: string) => {
        setAsignaciones(prev => prev.filter(a => a.idInterno !== idInterno));
    };

    const manejarGuardar = async () => {
        if (!estudiante.id) return;

        setGuardando(true);
        try {
            const payload: Partial<Estudiante> = {
                asignacionesCarrera: asignaciones.map(a => ({
                    carreraId: a.carreraId,
                    carrera: a.carreraNombre,
                    cu: a.cu,
                    prefijoCu: a.prefijoCu
                }))
            };
            
            await editarEstudiante(estudiante.id, payload);
            toast.success('Carreras y CUs actualizados correctamente.');
            onCerrar();
        } catch (err: any) {
            toast.error(err?.message || 'Error al guardar las asignaciones.');
        } finally {
            setGuardando(false);
        }
    };

    return (
        <ModalBase titulo={`Asignar Carreras - ${estudiante.nombre} ${estudiante.apellido}`} onCerrar={onCerrar} ancho="max-w-md">
            <div className="space-y-6">
                <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-900/50">
                    <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">Nueva Asignación</h3>
                    <div className="space-y-4">
                        <div className="flex flex-col gap-1.5">
                            <Label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Carrera</Label>
                            <Combobox
                                items={carreras}
                                value={nuevaCarreraId}
                                onValueChange={(val) => {
                                    setNuevaCarreraId(val);
                                    setNuevoCuCodigo('');
                                }}
                                getItemValue={(c) => c.id}
                                getItemLabel={(c) => c.nombre}
                            >
                                <ComboboxInput placeholder="Seleccionar carrera..." />
                                <ComboboxContent>
                                    <ComboboxEmpty>No se encontraron carreras.</ComboboxEmpty>
                                    <ComboboxList<Carrera>>
                                        {(c) => (
                                            <ComboboxItem key={c.id} value={c.id}>
                                                {c.nombre}
                                            </ComboboxItem>
                                        )}
                                    </ComboboxList>
                                </ComboboxContent>
                            </Combobox>
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <Label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Carnet Universitario (CU)</Label>
                            <div className="flex gap-2">
                                <div className="flex flex-1 items-center gap-2">
                                    <div className="flex h-9 min-w-[60px] items-center justify-center rounded-md border border-slate-200 bg-slate-100 px-3 text-sm font-bold text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
                                        {carreraSeleccionada?.prefijoCu || '111'}
                                    </div>
                                    <span className="text-slate-400">-</span>
                                    <Input
                                        value={nuevoCuCodigo}
                                        onChange={e => setNuevoCuCodigo(e.target.value.toUpperCase())}
                                        placeholder="Código (XYZ)"
                                        className="h-9 font-mono text-sm uppercase"
                                    />
                                </div>
                                <Boton type="button" onClick={agregarAsignacion} variant="secondary" className="h-9 px-3">
                                    <Plus className="h-4 w-4" />
                                </Boton>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Carreras Asignadas ({asignaciones.length})</h3>
                    
                    {asignaciones.length === 0 ? (
                        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 py-8 dark:border-slate-700">
                            <AlertCircle className="mb-2 h-8 w-8 text-slate-300 dark:text-slate-600" />
                            <p className="text-sm text-slate-400">No hay carreras asignadas todavía.</p>
                        </div>
                    ) : (
                        <div className="max-h-60 space-y-2 overflow-y-auto pr-1">
                            {asignaciones.map((a) => (
                                <div key={a.idInterno} className="flex items-center justify-between rounded-md border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                                            <GraduationCap className="h-4 w-4" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{a.carreraNombre}</p>
                                            <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                                                <Hash className="h-3 w-3" />
                                                <span className="font-mono font-medium">{a.cu}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => eliminarAsignacion(a.idInterno)}
                                        className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/30"
                                        title="Eliminar asignación"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                <div className="flex justify-end gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
                    <Boton variant="outline" onClick={onCerrar} className="h-9 px-4 text-xs">
                        Cancelar
                    </Boton>
                    <Boton onClick={manejarGuardar} disabled={guardando} className="h-9 px-5 text-xs bg-blue-600 hover:bg-blue-700 text-white">
                        {guardando ? 'Guardando...' : 'Guardar Cambios'}
                    </Boton>
                </div>
            </div>
        </ModalBase>
    );
};
