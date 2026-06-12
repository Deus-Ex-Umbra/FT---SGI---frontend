import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Plus, Edit } from 'lucide-react';
import { Boton } from '@/componentes/ui/button';
import { Checkbox } from '@/componentes/ui/checkbox';
import { Input } from '@/componentes/ui/input';
import { Label } from '@/componentes/ui/label';
import { Textarea } from '@/componentes/ui/textarea';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
    DialogDescription,
} from '@/componentes/ui/dialog';
import { crearInventario, editarInventario } from '@/lib/servicio-autenticacion';
import type { InventarioGestion } from '@/tipos/autenticacion';

interface Props {
    inventario?: InventarioGestion;
    onExito?: () => void;
    trigger?: React.ReactNode;
}

export const DialogoInventario = ({ inventario, onExito, trigger }: Props) => {
    const [abierto, setAbierto] = useState(false);
    const [nombre, setNombre] = useState(inventario?.nombre ?? '');
    const [descripcion, setDescripcion] = useState(inventario?.descripcion ?? '');
    const [puedeEditarFijos, setPuedeEditarFijos] = useState(inventario?.puedeEditarFijos ?? false);
    const [puedeEditarFungibles, setPuedeEditarFungibles] = useState(inventario?.puedeEditarFungibles ?? false);
    const [cargando, setCargando] = useState(false);

    useEffect(() => {
        if (abierto) {
            setNombre(inventario?.nombre ?? '');
            setDescripcion(inventario?.descripcion ?? '');
            setPuedeEditarFijos(inventario?.puedeEditarFijos ?? false);
            setPuedeEditarFungibles(inventario?.puedeEditarFungibles ?? false);
        }
    }, [abierto, inventario]);

    const manejarEnvio = async (e: React.FormEvent) => {
        e.preventDefault();
        const nombreLimpio = nombre.trim();
        if (!nombreLimpio) {
            toast.error('El nombre del inventario es obligatorio.');
            return;
        }

        setCargando(true);
        try {
            if (inventario) {
                await editarInventario(inventario.id, { 
                    nombre: nombreLimpio, 
                    descripcion: descripcion.trim(),
                    puedeEditarFijos,
                    puedeEditarFungibles,
                });
                toast.success('Inventario actualizado.');
            } else {
                await crearInventario({ 
                    nombre: nombreLimpio, 
                    descripcion: descripcion.trim() || undefined,
                    puedeEditarFijos,
                    puedeEditarFungibles,
                });
                toast.success('Inventario creado.');
            }
            setAbierto(false);
            onExito?.();
        } catch (err: any) {
            toast.error(err?.message || 'Error al procesar el inventario.');
        } finally {
            setCargando(false);
        }
    };

    return (
        <Dialog open={abierto} onOpenChange={setAbierto}>
            <DialogTrigger asChild>
                {trigger || (
                    <Boton variant={inventario ? 'outline' : 'default'} size={inventario ? 'sm' : 'default'} className="gap-2">
                        {inventario ? <Edit className="h-3.5 w-3.5" /> : <Plus className="h-4 w-4" />}
                        {inventario ? 'Editar' : 'Nuevo Inventario'}
                    </Boton>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[460px]">
                <DialogHeader>
                    <DialogTitle>{inventario ? 'Editar Inventario' : 'Crear Nuevo Inventario'}</DialogTitle>
                    <DialogDescription>
                        {inventario 
                            ? 'Actualiza los datos principales del inventario seleccionado.' 
                            : 'Registra un nuevo contenedor global de inventario en el sistema.'}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={manejarEnvio} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="nombre" className="text-xs font-semibold">
                            Nombre del inventario <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="nombre"
                            value={nombre}
                            onChange={(e) => setNombre(e.target.value)}
                            placeholder="Ej: Laboratorio de Hidrología"
                            className="h-9 text-sm"
                            autoFocus
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="descripcion" className="text-xs font-semibold">
                            Descripción (opcional)
                        </Label>
                        <Textarea
                            id="descripcion"
                            value={descripcion}
                            onChange={(e) => setDescripcion(e.target.value)}
                            placeholder="Ej: Ubicado en el segundo piso, bloque A..."
                            rows={4}
                            className="text-sm resize-none"
                        />
                    </div>
                    <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50/70 p-3 dark:border-slate-700 dark:bg-slate-800/40">
                        <div>
                            <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">Permisos del inventario</p>
                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                Los encargados heredan estos permisos cuando se les asigna este inventario.
                            </p>
                        </div>
                        <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                            <Checkbox
                                checked={puedeEditarFijos}
                                onChange={(e) => setPuedeEditarFijos(e.target.checked)}
                                disabled={cargando}
                            />
                            Permitir gestión de activos fijos
                        </label>
                        <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                            <Checkbox
                                checked={puedeEditarFungibles}
                                onChange={(e) => setPuedeEditarFungibles(e.target.checked)}
                                disabled={cargando}
                            />
                            Permitir gestión de materiales fungibles
                        </label>
                    </div>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Boton type="button" variant="outline" onClick={() => setAbierto(false)} disabled={cargando} className="h-9">
                            Cancelar
                        </Boton>
                        <Boton type="submit" disabled={cargando} className="h-9 px-6">
                            {cargando ? 'Guardando...' : inventario ? 'Guardar Cambios' : 'Crear Inventario'}
                        </Boton>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};
