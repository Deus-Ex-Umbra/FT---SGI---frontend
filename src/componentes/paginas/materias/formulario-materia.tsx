import type { Carrera, Docente } from '@/tipos/inventario';
import type { FormMateria } from '@/tipos/paginas';
import { Checkbox } from '@/componentes/ui/checkbox';
import { Input } from '@/componentes/ui/input';
import { Label } from '@/componentes/ui/label';
import { Textarea } from '@/componentes/ui/textarea';

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

            <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-md border border-slate-200 p-2 dark:border-slate-700">
                    <div className="mb-2 text-xs font-semibold text-slate-700 dark:text-slate-200">Carreras habilitadas *</div>
                    <div className="max-h-44 space-y-1 overflow-auto pr-1">
                        {carreras.map((carrera) => (
                            <label key={carrera.id} className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1 text-xs text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-700/50">
                                <Checkbox
                                    checked={valores.carrerasIds.includes(carrera.id)}
                                    onChange={() => onAlternarCarrera(carrera.id)}
                                />
                                <span>{carrera.nombre}</span>
                            </label>
                        ))}
                    </div>
                </div>

                <div className="rounded-md border border-slate-200 p-2 dark:border-slate-700">
                    <div className="mb-2 text-xs font-semibold text-slate-700 dark:text-slate-200">Docentes asignados</div>
                    <div className="max-h-44 space-y-1 overflow-auto pr-1">
                        {docentes.map((docente) => (
                            <label key={docente.id} className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1 text-xs text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-700/50">
                                <Checkbox
                                    checked={valores.docentesIds.includes(docente.id)}
                                    onChange={() => onAlternarDocente(docente.id)}
                                />
                                <span>{docente.codigo} - {docente.nombre} {docente.apellido}</span>
                            </label>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};