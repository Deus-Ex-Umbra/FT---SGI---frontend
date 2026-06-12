import type { FormCarrera } from '@/tipos/paginas';
import { Input } from '@/componentes/ui/input';
import { Label } from '@/componentes/ui/label';
import { Checkbox } from '@/componentes/ui/checkbox';

interface Props {
    valores: FormCarrera;
    onCambiar: (valores: FormCarrera) => void;
    inventarios: Array<{ id: number; nombre: string }>;
}

export const FormularioCarrera = ({ valores, onCambiar, inventarios }: Props) => {
    const alternarInventario = (id: number) => {
        const ids = valores.inventariosIds ?? [];
        const nuevas = ids.includes(id)
            ? ids.filter((x) => x !== id)
            : [...ids, id];
        onCambiar({ ...valores, inventariosIds: nuevas });
    };

    return (
        <div className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
                <div className="flex flex-col gap-1 md:col-span-2">
                    <Label className="text-xs font-medium text-slate-700 dark:text-slate-300">Nombre *</Label>
                    <Input
                        value={valores.nombre}
                        onChange={(e) => onCambiar({ ...valores, nombre: e.target.value })}
                        placeholder="Ej: Ing. de Sistemas"
                        className="h-9 text-xs"
                    />
                </div>
                <div className="flex flex-col gap-1">
                    <Label className="text-xs font-medium text-slate-700 dark:text-slate-300">Prefijo CU *</Label>
                    <Input
                        value={valores.prefijoCu}
                        onChange={(e) => onCambiar({ ...valores, prefijoCu: e.target.value.toUpperCase().replace(/\s+/g, '') })}
                        placeholder="Ej: 35-"
                        className="h-9 text-xs"
                    />
                </div>
            </div>

            <div className="rounded-md border border-slate-200 p-3 dark:border-slate-700">
                <div className="mb-2 text-xs font-bold text-slate-700 dark:text-slate-200 font-semibold">Inventarios autorizados para esta carrera</div>
                <div className="max-h-36 space-y-1.5 overflow-auto pr-1">
                    {inventarios.map((inv) => (
                        <label key={inv.id} className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1 text-xs text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-700/50">
                            <Checkbox
                                checked={(valores.inventariosIds ?? []).includes(inv.id)}
                                onChange={() => alternarInventario(inv.id)}
                            />
                            <span>{inv.nombre}</span>
                        </label>
                    ))}
                    {inventarios.length === 0 && (
                        <p className="text-center text-xs text-slate-500">No hay inventarios registrados.</p>
                    )}
                </div>
            </div>
        </div>
    );
};