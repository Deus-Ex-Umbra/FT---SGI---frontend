import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import type { PropsPaginaBase } from '@/tipos/paginas';
import { LayoutPagina } from '@/componentes/layout/layout-pagina';
import { TablaEstudiantes } from '@/componentes/paginas/inventario/tabla-estudiantes';
import { FormularioEstudiante } from '@/componentes/paginas/inventario/formulario-estudiante';
import { DialogoAsignacionCarreras } from '@/componentes/paginas/inventario/dialogo-asignacion-carreras';
import { useInventario } from '@/contextos/ContextoInventario';
import { useConfirmacion } from '@/contextos/ContextoConfirmacion';
import { Plus } from 'lucide-react';
import { Boton } from '@/componentes/ui/button';
import { Input } from '@/componentes/ui/input';
import { Combobox, ComboboxContent, ComboboxEmpty, ComboboxInput, ComboboxItem, ComboboxList } from '@/componentes/ui/combobox';

export const Estudiantes = ({ onNavegar, onCerrarSesion }: PropsPaginaBase) => {
    const { estudiantes, eliminarEstudiante, actualizarRetencionCue, cargando, carreras } = useInventario();
    const { confirmar } = useConfirmacion();

    const [filtroNombre, setFiltroNombre] = useState('');
    const [filtroCarnet, setFiltroCarnet] = useState('');
    const [filtroCarrera, setFiltroCarrera] = useState('');

    const opcionesCarrera = useMemo(() => {
        return (carreras ?? []).map((c) => ({
            value: c.nombre,
            label: c.nombre,
        }));
    }, [carreras]);

    const [mostrarFormulario, setMostrarFormulario] = useState(false);
    const [estudianteEdicion, setEstudianteEdicion] = useState<(typeof estudiantes)[number] | null>(null);
    const [estudianteAsignacion, setEstudianteAsignacion] = useState<(typeof estudiantes)[number] | null>(null);

    const obtenerCarrerasEstudiante = (estudiante: (typeof estudiantes)[number]) => {
        const carrerasEstudiante = estudiante.carreras?.filter(Boolean) ?? [];
        return carrerasEstudiante.length > 0
            ? carrerasEstudiante
            : (estudiante.carrera ? [estudiante.carrera] : []);
    };

    const abrirRegistro = () => {
        setEstudianteEdicion(null);
        setMostrarFormulario(true);
    };

    const abrirEdicion = (estudiante: (typeof estudiantes)[number]) => {
        setEstudianteEdicion(estudiante);
        setMostrarFormulario(true);
    };

    const borrar = async (estudiante: (typeof estudiantes)[number]) => {
        if (!estudiante.id) return;
        const ok = await confirmar({
            titulo: 'Descartar estudiante',
            descripcion: `¿Deseas descartar al estudiante ${estudiante.nombre} ${estudiante.apellido}? (borrado blando)`,
            textoConfirmar: 'Descartar',
            textoCancelar: 'Cancelar',
            varianteConfirmar: 'destructive',
        });
        if (!ok) return;
        try {
            await eliminarEstudiante(estudiante.id);
            toast.success('Estudiante descartado correctamente.');
        } catch (err: any) {
            toast.error(err?.message ?? 'No se pudo descartar el estudiante.');
        }
    };

    const toggleRetencion = async (estudiante: (typeof estudiantes)[number]) => {
        if (!estudiante.id) return;
        const nuevoEstado = !estudiante.carnetRetenido;
        const ok = await confirmar({
            titulo: nuevoEstado ? 'Retener CU/Carnet' : 'Liberar CU/Carnet',
            descripcion: nuevoEstado
                ? `¿Deseas retener manualmente el carnet de ${estudiante.nombre} ${estudiante.apellido}?`
                : `¿Deseas liberar manualmente la retención del carnet de ${estudiante.nombre} ${estudiante.apellido}?`,
            textoConfirmar: nuevoEstado ? 'Retener' : 'Liberar',
            textoCancelar: 'Cancelar',
            varianteConfirmar: nuevoEstado ? 'destructive' : 'default',
        });
        if (!ok) return;

        try {
            await actualizarRetencionCue(estudiante.id, { carnetRetenidoOverride: nuevoEstado });
            toast.success(nuevoEstado ? 'Carnet retenido manualmente.' : 'Carnet liberado manualmente.');
        } catch (err: any) {
            toast.error(err?.message ?? 'No se pudo actualizar el estado del CU.');
        }
    };

    const restablecerRetencion = async (estudiante: (typeof estudiantes)[number]) => {
        if (!estudiante.id) return;
        const ok = await confirmar({
            titulo: 'Restablecer cálculo automático',
            descripcion: `¿Deseas volver a calcular automáticamente el estado del carnet de ${estudiante.nombre} ${estudiante.apellido} según sus préstamos activos?`,
            textoConfirmar: 'Restablecer',
            textoCancelar: 'Cancelar',
        });
        if (!ok) return;

        try {
            await actualizarRetencionCue(estudiante.id, { carnetRetenidoOverride: null });
            toast.success('Cálculo automático de retención restablecido.');
        } catch (err: any) {
            toast.error(err?.message ?? 'No se pudo restablecer el cálculo automático.');
        }
    };

    const estudiantesAprobados = useMemo(() => {
        return estudiantes.filter(e => e.estadoAprobacion !== 'pendiente');
    }, [estudiantes]);

    const estudiantesFiltrados = useMemo(() => {
        const nombreTerm = filtroNombre.toLowerCase().trim();
        const carnetTerm = filtroCarnet.toLowerCase().trim();
        const carreraTerm = filtroCarrera.toLowerCase().trim();
        return estudiantesAprobados.filter(e => {
            const carrerasEstudiante = obtenerCarrerasEstudiante(e);
            const coincideNombre = nombreTerm === '' ||
                e.nombre.toLowerCase().includes(nombreTerm) ||
                e.apellido.toLowerCase().includes(nombreTerm);
            const coincideCarnet = carnetTerm === '' ||
                e.carnet.toLowerCase().includes(carnetTerm);
            const coincideCarrera = carreraTerm === '' ||
                carrerasEstudiante.some(c => c.toLowerCase().includes(carreraTerm));
            return coincideNombre && coincideCarnet && coincideCarrera;
        });
    }, [filtroNombre, filtroCarnet, estudiantesAprobados, filtroCarrera]);

    return (
        <LayoutPagina
            paginaActiva="estudiantes"
            titulo="Estudiantes registrados"
            subtitulo={cargando ? 'Cargando estudiantes...' : `${estudiantesAprobados.length} estudiantes habilitados para préstamos`}
            onNavegar={onNavegar}
            onCerrarSesion={onCerrarSesion}
        >
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
                    <Input
                        placeholder="Nombre..."
                        value={filtroNombre}
                        onChange={(e) => setFiltroNombre(e.target.value)}
                        className="h-8 max-w-[200px] text-xs bg-white dark:bg-slate-900"
                    />
                    <Input
                        placeholder="Carnet..."
                        value={filtroCarnet}
                        onChange={(e) => setFiltroCarnet(e.target.value)}
                        className="h-8 max-w-[150px] text-xs bg-white dark:bg-slate-900"
                    />
                    <div className="max-w-[200px] w-full">
                        <Combobox<{ value: string; label: string }>
                            items={opcionesCarrera}
                            value={filtroCarrera}
                            onValueChange={setFiltroCarrera}
                            getItemValue={(opt) => opt.value}
                            getItemLabel={(opt) => opt.label}
                        >
                            <ComboboxInput
                                placeholder="Carrera..."
                                showClear
                                className="h-8 text-xs bg-white dark:bg-slate-900"
                            />
                            <ComboboxContent>
                                <ComboboxEmpty>No se encontraron carreras.</ComboboxEmpty>
                                <ComboboxList<{ value: string; label: string }>>
                                    {(opt) => (
                                        <ComboboxItem key={opt.value} value={opt.value}>
                                            {opt.label}
                                        </ComboboxItem>
                                    )}
                                </ComboboxList>
                            </ComboboxContent>
                        </Combobox>
                    </div>
                    {(filtroNombre || filtroCarnet || filtroCarrera) && (
                        <button
                            onClick={() => {
                                setFiltroNombre('');
                                setFiltroCarnet('');
                                setFiltroCarrera('');
                            }}
                            className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                        >
                            Limpiar
                        </button>
                    )}
                </div>
                <Boton onClick={abrirRegistro} disabled={cargando} size="sm" className="h-8 px-3 text-xs font-semibold gap-1.5 rounded-lg">
                    <Plus className="h-3.5 w-3.5" />
                    Registrar estudiante
                </Boton>
            </div>

            <TablaEstudiantes
                estudiantes={estudiantesFiltrados}
                onEditar={abrirEdicion}
                onEliminar={borrar}
                onAsignarCarrera={setEstudianteAsignacion}
                onToggleRetencion={toggleRetencion}
                onRestablecerRetencion={restablecerRetencion}
                puedeAdministrar={true}
                cargando={cargando}
            />

            {mostrarFormulario && (
                <FormularioEstudiante
                    estudiante={estudianteEdicion}
                    onCerrar={() => {
                        setMostrarFormulario(false);
                        setEstudianteEdicion(null);
                    }}
                />
            )}
            {estudianteAsignacion && (
                <DialogoAsignacionCarreras
                    estudiante={estudianteAsignacion}
                    onCerrar={() => setEstudianteAsignacion(null)}
                />
            )}
        </LayoutPagina>
    );
};
