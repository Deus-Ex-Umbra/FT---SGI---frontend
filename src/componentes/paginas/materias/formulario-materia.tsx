import type { Carrera, Docente } from '@/tipos/inventario';
import type { FormMateria } from '@/tipos/paginas';
import { Input } from '@/componentes/ui/input';
import { Label } from '@/componentes/ui/label';
import { Textarea } from '@/componentes/ui/textarea';
import { X } from 'lucide-react';
import {
    Combobox,
    ComboboxContent,
    ComboboxEmpty,
    ComboboxInput,
    ComboboxItem,
    ComboboxList,
} from '@/componentes/ui/combobox';

interface Props {
    valores: FormMateria;
    carreras: Carrera[];
    docentes: Docente[];
    onCambiar: (valores: FormMateria) => void;
    onAlternarCarrera: (id: string) => void;
    onAlternarDocente: (id: string) => void;
    codigoSoloLectura?: boolean;
}

export const FormularioMateria = ({
    valores,
    carreras,
    docentes,
    onCambiar,
    onAlternarCarrera,
    onAlternarDocente,
    codigoSoloLectura = false,
}: Props) => {
    return (
        <div className="space-y-3">
            <div className="grid gap-3 md:grid-cols-2">
                <div className="flex flex-col gap-1">
                    <Label className="text-xs font-medium text-slate-700 dark:text-slate-300">Código {codigoSoloLectura ? '' : '*'}</Label>
                    <Input
                        value={valores.codigo}
                        onChange={(e) => onCambiar({ ...valores, codigo: e.target.value.toUpperCase() })}
                        placeholder="Ej: SIS245"
                        readOnly={codigoSoloLectura}
                        className={`h-9 text-xs ${codigoSoloLectura ? 'bg-slate-50 dark:bg-slate-800' : ''}`}
                    />
                </div>
                <div className="flex flex-col gap-1">
                    <Label className="text-xs font-medium text-slate-700 dark:text-slate-300">Nombre</Label>
                    <Input
                        value={valores.nombre}
                        onChange={(e) => onCambiar({ ...valores, nombre: e.target.value })}
                        placeholder="Ej: Taller de Sistemas"
                        className="h-9 text-xs"
                    />
                </div>
            </div>

            <div className="flex flex-col gap-1">
                <Label className="text-xs font-medium text-slate-700 dark:text-slate-300">Descripción</Label>
                <Textarea
                    value={valores.descripcion}
                    onChange={(e) => onCambiar({ ...valores, descripcion: e.target.value })}
                    rows={3}
                    className="min-h-[72px] text-xs"
                />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <div className="flex flex-col gap-1.5 rounded-md border border-slate-200 p-3 dark:border-slate-700 bg-slate-50/30 dark:bg-slate-900/30">
                    <div className="text-xs font-semibold text-slate-700 dark:text-slate-200">Carreras habilitadas *</div>
                    <Combobox<{ value: string; label: string }>
                        items={carreras
                            .filter((c) => !valores.carrerasIds.includes(c.id))
                            .map((c) => ({ value: c.id, label: c.nombre }))}
                        value=""
                        onValueChange={(val) => {
                            if (val) onAlternarCarrera(val);
                        }}
                        getItemValue={(item) => item.value}
                        getItemLabel={(item) => item.label}
                    >
                        <ComboboxInput placeholder="Agregar carrera..." showClear className="h-9 text-xs" />
                        <ComboboxContent>
                            <ComboboxEmpty>No se encontraron carreras.</ComboboxEmpty>
                            <ComboboxList<{ value: string; label: string }>>
                                {(opcion) => (
                                    <ComboboxItem key={opcion.value} value={opcion.value}>
                                        {opcion.label}
                                    </ComboboxItem>
                                )}
                            </ComboboxList>
                        </ComboboxContent>
                    </Combobox>
                    <div className="flex flex-wrap gap-1.5 mt-1.5 max-h-32 overflow-y-auto pr-1">
                        {valores.carrerasIds.map((id) => {
                            const carrera = carreras.find((c) => c.id === id);
                            if (!carrera) return null;
                            return (
                                <span
                                    key={id}
                                    className="inline-flex items-center gap-1 rounded bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-100 dark:border-blue-900/30"
                                >
                                    {carrera.nombre}
                                    <button
                                        type="button"
                                        onClick={() => onAlternarCarrera(id)}
                                        className="text-blue-500 hover:text-blue-700 transition-colors"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                </span>
                            );
                        })}
                        {valores.carrerasIds.length === 0 && (
                            <span className="text-xs text-slate-400 italic">Ninguna carrera habilitada.</span>
                        )}
                    </div>
                </div>

                <div className="flex flex-col gap-1.5 rounded-md border border-slate-200 p-3 dark:border-slate-700 bg-slate-50/30 dark:bg-slate-900/30">
                    <div className="text-xs font-semibold text-slate-700 dark:text-slate-200">Docentes asignados</div>
                    <Combobox<{ value: string; label: string }>
                        items={docentes
                            .filter((d) => !valores.docentesIds.includes(d.id))
                            .map((d) => ({ value: d.id, label: `[${d.codigo}] ${d.apellido}, ${d.nombre}` }))}
                        value=""
                        onValueChange={(val) => {
                            if (val) onAlternarDocente(val);
                        }}
                        getItemValue={(item) => item.value}
                        getItemLabel={(item) => item.label}
                    >
                        <ComboboxInput placeholder="Agregar docente..." showClear className="h-9 text-xs" />
                        <ComboboxContent>
                            <ComboboxEmpty>No se encontraron docentes.</ComboboxEmpty>
                            <ComboboxList<{ value: string; label: string }>>
                                {(opcion) => (
                                    <ComboboxItem key={opcion.value} value={opcion.value}>
                                        {opcion.label}
                                    </ComboboxItem>
                                )}
                            </ComboboxList>
                        </ComboboxContent>
                    </Combobox>
                    <div className="flex flex-wrap gap-1.5 mt-1.5 max-h-32 overflow-y-auto pr-1">
                        {valores.docentesIds.map((id) => {
                            const docente = docentes.find((d) => d.id === id);
                            if (!docente) return null;
                            return (
                                <span
                                    key={id}
                                    className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-350 border border-slate-200/60 dark:border-slate-700"
                                >
                                    {docente.codigo} - {docente.nombre} {docente.apellido}
                                    <button
                                        type="button"
                                        onClick={() => onAlternarDocente(id)}
                                        className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                </span>
                            );
                        })}
                        {valores.docentesIds.length === 0 && (
                            <span className="text-xs text-slate-400 italic">Ningún docente asignado.</span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};