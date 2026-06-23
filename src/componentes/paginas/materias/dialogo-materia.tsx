import { useEffect, useState, useMemo } from 'react';
import { toast } from 'sonner';
import type { Materia } from '@/tipos/inventario';
import type { FormMateria } from '@/tipos/paginas';
import { Boton } from '@/componentes/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/componentes/ui/dialog';
import { FormularioMateria } from './formulario-materia';
import { useInventario } from '@/contextos/ContextoInventario';
import { obtenerUsuarioActual } from '@/lib/servicio-autenticacion';

const FORM_INICIAL: FormMateria = {
    codigo: '',
    nombre: '',
    descripcion: '',
    carrerasIds: [],
    docentesIds: [],
};

interface DialogoMateriaProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    materia?: Materia;
}

export const DialogoMateria = ({ open, onOpenChange, materia }: DialogoMateriaProps) => {
    const {
        carreras,
        docentes,
        agregarMateria,
        editarMateria,
    } = useInventario();

    const rol = obtenerUsuarioActual()?.rol;
    const esAdministrador = rol === 'administrador';

    const [valores, setValores] = useState<FormMateria>(FORM_INICIAL);
    const [guardando, setGuardando] = useState(false);

    const esEdicion = !!materia;

    const carrerasOrdenadas = useMemo(() => {
        return [...carreras].sort((a, b) => a.nombre.localeCompare(b.nombre));
    }, [carreras]);

    const docentesOrdenados = useMemo(() => {
        return [...docentes].sort((a, b) => `${a.apellido} ${a.nombre}`.localeCompare(`${b.apellido} ${b.nombre}`));
    }, [docentes]);

    useEffect(() => {
        if (open) {
            if (materia) {
                setValores({
                    codigo: materia.codigo,
                    nombre: materia.nombre ?? '',
                    descripcion: materia.descripcion ?? '',
                    carrerasIds: [...(materia.carrerasIds ?? [])],
                    docentesIds: [...(materia.docentesIds ?? [])],
                });
            } else {
                setValores(FORM_INICIAL);
            }
        }
    }, [materia, open]);

    const toggleSeleccion = (ids: string[], id: string) => {
        if (ids.includes(id)) return ids.filter((v) => v !== id);
        return [...ids, id];
    };

    const alternarCarrera = (id: string) => {
        setValores((prev) => ({
            ...prev,
            carrerasIds: toggleSeleccion(prev.carrerasIds, id),
        }));
    };

    const alternarDocente = (id: string) => {
        setValores((prev) => ({
            ...prev,
            docentesIds: toggleSeleccion(prev.docentesIds, id),
        }));
    };

    const guardar = async () => {
        if (!esAdministrador) return;

        const codigo = valores.codigo.trim().toUpperCase();
        if (!codigo && !esEdicion) {
            toast.error('El código de materia es obligatorio.');
            return;
        }
        if (valores.carrerasIds.length === 0) {
            toast.error('Debes habilitar al menos una carrera.');
            return;
        }

        setGuardando(true);
        try {
            if (esEdicion && materia) {
                await editarMateria(materia.id, {
                    nombre: valores.nombre.trim() || null,
                    descripcion: valores.descripcion.trim() || null,
                    carrerasIds: valores.carrerasIds,
                    docentesIds: valores.docentesIds,
                });
                toast.success('Materia editada con éxito.');
            } else {
                await agregarMateria({
                    codigo,
                    nombre: valores.nombre.trim() || null,
                    descripcion: valores.descripcion.trim() || null,
                    carrerasIds: valores.carrerasIds,
                    docentesIds: valores.docentesIds,
                });
                toast.success('Materia registrada con éxito.');
            }
            onOpenChange(false);
        } catch (e: any) {
            toast.error(e?.message ?? `No se pudo ${esEdicion ? 'editar' : 'registrar'} la materia.`);
        } finally {
            setGuardando(false);
        }
    };

    const titulo = esEdicion ? 'Editar materia' : 'Registrar materia';
    const descripcion = esEdicion
        ? 'Actualiza descripción, carreras habilitadas y docentes asignados.'
        : 'Define código, descripción, carreras habilitadas y docentes asignados.';

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>{titulo}</DialogTitle>
                    <DialogDescription>{descripcion}</DialogDescription>
                </DialogHeader>

                <FormularioMateria
                    valores={valores}
                    carreras={carrerasOrdenadas}
                    docentes={docentesOrdenados}
                    onCambiar={setValores}
                    onAlternarCarrera={alternarCarrera}
                    onAlternarDocente={alternarDocente}
                    codigoSoloLectura={esEdicion}
                />

                <DialogFooter>
                    <Boton type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={guardando}>
                        Cerrar
                    </Boton>
                    <Boton type="button" onClick={() => void guardar()} disabled={guardando}>
                        {guardando ? 'Guardando...' : esEdicion ? 'Guardar cambios' : 'Agregar'}
                    </Boton>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
