import { LayoutPagina } from '@/componentes/layout/layout-pagina';
import type { PropsPaginaBase } from '@/tipos/paginas';
import { 
    BookOpen, 
    GraduationCap, 
    Layers3, 
    Users, 
    Plus, 
    ChevronDown, 
    ChevronUp, 
    Clock, 
    Calendar, 
    CalendarClock, 
    Package2, 
    Eye
} from 'lucide-react';
import { useDashboardEstudiante } from './use-dashboard-estudiante';
import { useState } from 'react';
import { Boton } from '@/componentes/ui/button';
import { ModalBase } from '@/componentes/paginas/inventario/modal-base';
import { Input } from '@/componentes/ui/input';
import { Checkbox } from '@/componentes/ui/checkbox';
import {
    inscribirseMateriaPorCodigo,
    listarEstudiantesInscritosMateria,
    actualizarCompanerosSubgrupoLider,
} from '@/lib/servicio-docencia';
import { toast } from 'sonner';
import { formatearFechaHora } from '@/utilidades/fechas';
import {
    Combobox,
    ComboboxContent,
    ComboboxEmpty,
    ComboboxInput,
    ComboboxItem,
    ComboboxList,
} from '@/componentes/ui/combobox';

const colorEstadoCanasta = (estado: string) => {
    if (estado === 'solicitado') return 'text-amber-700 bg-amber-50 border-amber-200 dark:text-amber-300 dark:bg-amber-950/30 dark:border-amber-850';
    if (estado === 'aceptado') return 'text-purple-700 bg-purple-50 border-purple-200 dark:text-purple-300 dark:bg-purple-950/30 dark:border-purple-800';
    if (estado === 'rechazado') return 'text-rose-700 bg-rose-50 border-rose-200 dark:text-rose-300 dark:bg-rose-950/30 dark:border-rose-800';
    if (estado === 'despachado' || estado === 'activo' || estado === 'pendiente') return 'text-blue-700 bg-blue-50 border-blue-200 dark:text-blue-300 dark:bg-blue-950/30 dark:border-blue-800';
    if (estado === 'devuelto' || estado === 'devuelto_fuera_de_fecha_limite') return 'text-emerald-700 bg-emerald-50 border-emerald-200 dark:text-emerald-300 dark:bg-emerald-950/30 dark:border-emerald-800';
    return 'text-red-700 bg-red-50 border-red-200 dark:text-red-300 dark:bg-red-950/30 dark:border-red-800';
};

export const MisMaterias = ({ onNavegar, onCerrarSesion }: PropsPaginaBase) => {
    const { cargando, error, datos, recargar } = useDashboardEstudiante(onCerrarSesion);
    const [modalAbierto, setModalAbierto] = useState(false);
    const [expandidos, setExpandidos] = useState<Record<string, boolean>>({});
    const [modalVerActivos, setModalVerActivos] = useState<any | null>(null);
    const [carreraFiltro, setCarreraFiltro] = useState<string>('todas');

    const toggleExpandido = (grupoId: string) => {
        setExpandidos((prev) => ({ ...prev, [grupoId]: !prev[grupoId] }));
    };

    const [codigo, setCodigo] = useState('');
    const [inscribiendo, setInscribiendo] = useState(false);
    const [tipoInscripcion, setTipoInscripcion] = useState<'todas' | 'una'>('todas');
    const [carreraSeleccionada, setCarreraSeleccionada] = useState<string>('');

    const [modalCompanerosAbierto, setModalCompanerosAbierto] = useState(false);
    const [subgrupoSeleccionado, setSubgrupoSeleccionado] = useState<{ id: string; codigo: string; maxLimit: number; currentMemberIds: number[] } | null>(null);
    const [companerosMateria, setCompanerosMateria] = useState<Array<{ id: number; nombre: string; apellido: string; carnet: string; carrera: string }>>([]);
    const [cargandoCompaneros, setCargandoCompaneros] = useState(false);
    const [seleccionados, setSeleccionados] = useState<number[]>([]);
    const [guardandoCompaneros, setGuardandoCompaneros] = useState(false);

    const abrirSelectorCompaneros = async (grupoMateriaId: string, subgrupo: any) => {
        const limit = datos?.materias.find(m => m.grupoId === grupoMateriaId)?.maxEstudiantesGrupo ?? 3;
        setSubgrupoSeleccionado({
            id: subgrupo.id,
            codigo: subgrupo.codigo,
            maxLimit: limit,
            currentMemberIds: subgrupo.estudianteIds ?? [],
        });
        setSeleccionados(subgrupo.estudianteIds ?? []);
        setCompanerosMateria([]);
        setModalCompanerosAbierto(true);
        setCargandoCompaneros(true);

        try {
            const data = await listarEstudiantesInscritosMateria(grupoMateriaId);
            setCompanerosMateria(data);
        } catch (err: any) {
            toast.error(err?.message ?? 'No se pudieron cargar los compañeros inscritos.');
        } finally {
            setCargandoCompaneros(false);
        }
    };

    const handleGuardarCompaneros = async () => {
        if (!subgrupoSeleccionado) return;

        setGuardandoCompaneros(true);
        try {
            await actualizarCompanerosSubgrupoLider(subgrupoSeleccionado.id, seleccionados);
            toast.success('Compañeros de grupo actualizados correctamente.');
            setModalCompanerosAbierto(false);
            setSubgrupoSeleccionado(null);
            setSeleccionados([]);
            await recargar();
        } catch (err: any) {
            toast.error(err?.message ?? 'No se pudieron actualizar los compañeros.');
        } finally {
            setGuardandoCompaneros(false);
        }
    };

    if (cargando) {
        return (
            <LayoutPagina paginaActiva="mis-materias" titulo="Mis materias" subtitulo="Cargando tus materias inscritas..." onNavegar={onNavegar} onCerrarSesion={onCerrarSesion}>
                <div className="flex h-40 items-center justify-center">
                    <p className="animate-pulse text-sm text-slate-500 dark:text-slate-400">Consultando materias del estudiante...</p>
                </div>
            </LayoutPagina>
        );
    }

    if (error || !datos) {
        return (
            <LayoutPagina paginaActiva="mis-materias" titulo="Mis materias" subtitulo="Detalle de materias y grupos" onNavegar={onNavegar} onCerrarSesion={onCerrarSesion}>
                <div className="rounded-xl border border-red-200 bg-red-50 p-6 dark:border-red-900/40 dark:bg-red-900/10">
                    <p className="text-sm font-medium text-red-800 dark:text-red-400">No se pudieron cargar tus materias.</p>
                    <p className="mt-1 text-sm text-red-600 dark:text-red-300">{error}</p>
                </div>
            </LayoutPagina>
        );
    }

    const { perfil, materias } = datos;
    const asignaciones = perfil.asignacionesCarrera ?? [];
    const carrerasMostrar = asignaciones.length > 0 ? asignaciones : [
        {
            carreraId: null,
            carrera: perfil.carrera,
            cu: perfil.cu || 'No registrado',
            prefijoCu: null
        }
    ].filter(c => c.carrera);

    const opcionesFiltro = [
        { id: 'todas', nombre: 'Todas las carreras' },
        ...carrerasMostrar.map(c => ({ id: c.carrera, nombre: c.carrera }))
    ];

    const materiasFiltradas = materias.filter((materia) => {
        if (carreraFiltro === 'todas') return true;
        return materia.carreras?.some(c => c.carrera === carreraFiltro);
    });

    const handleInscribirse = async () => {
        const codeClean = codigo.trim().toUpperCase();
        if (!codeClean) {
            toast.error('Por favor ingresa un código de inscripción.');
            return;
        }
        if (codeClean.length < 4) {
            toast.error('El código de inscripción debe tener al menos 4 caracteres.');
            return;
        }

        let carreras: string[] | undefined = undefined;
        if (carrerasMostrar.length > 1) {
            if (tipoInscripcion === 'todas') {
                carreras = carrerasMostrar.map(c => c.carrera);
            } else {
                carreras = [carreraSeleccionada || carrerasMostrar[0].carrera];
            }
        }

        setInscribiendo(true);
        try {
            const resp = await inscribirseMateriaPorCodigo(codeClean, carreras);
            toast.success(resp.message || `Inscripción registrada correctamente.`);
            setCodigo('');
            setTipoInscripcion('todas');
            setCarreraSeleccionada('');
            setModalAbierto(false);
            await recargar();
        } catch (err: any) {
            toast.error(err?.message ?? 'Ocurrió un error al registrar tu inscripción.');
        } finally {
            setInscribiendo(false);
        }
    };

    return (
        <LayoutPagina paginaActiva="mis-materias" titulo="Mis materias" subtitulo="Consulta tus materias inscritas, grupos y docentes" onNavegar={onNavegar} onCerrarSesion={onCerrarSesion}>
            <div className="space-y-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-500 dark:text-slate-400">
                        <div className="flex items-center gap-2">
                            <BookOpen className="h-4.5 w-4.5 text-emerald-500" />
                            <span>Materias Inscritas: <strong className="text-slate-800 dark:text-slate-200">{materias.length}</strong></span>
                        </div>
                        <div className="h-4 w-[1px] bg-slate-200 dark:bg-slate-800 hidden sm:block" />
                        <div className="flex items-center gap-2">
                            <GraduationCap className="h-4.5 w-4.5 text-blue-500" />
                            <span>Carreras Habilitadas: <strong className="text-slate-800 dark:text-slate-200">{carrerasMostrar.length}</strong></span>
                        </div>
                    </div>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                        {carrerasMostrar.length > 0 && (
                            <div className="flex items-center gap-2 w-full sm:w-72">
                                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 shrink-0">Filtrar por carrera:</span>
                                <div className="flex-1">
                                    <Combobox
                                        items={opcionesFiltro}
                                        value={carreraFiltro}
                                        onValueChange={(val) => setCarreraFiltro(val || 'todas')}
                                        getItemValue={(item) => item.id}
                                        getItemLabel={(item) => item.nombre}
                                    >
                                        <ComboboxInput placeholder="Filtrar por carrera..." showClear />
                                        <ComboboxContent>
                                            <ComboboxEmpty>No se encontraron carreras.</ComboboxEmpty>
                                            <ComboboxList<typeof opcionesFiltro[number]>>
                                                {(item) => (
                                                    <ComboboxItem key={item.id} value={item.id}>
                                                        {item.nombre}
                                                    </ComboboxItem>
                                                )}
                                            </ComboboxList>
                                        </ComboboxContent>
                                    </Combobox>
                                </div>
                            </div>
                        )}

                        <Boton onClick={() => setModalAbierto(true)} className="h-10 px-5 text-xs font-semibold rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer">
                            <Plus className="h-4 w-4" />
                            Inscribirme en una Materia
                        </Boton>
                    </div>
                </div>


                {materias.length === 0 ? (
                    <div className="flex h-40 flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                        <p className="text-base font-medium text-slate-700 dark:text-slate-200">No estás inscrito en ninguna materia.</p>
                        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Cuando tu inscripción sea registrada, aparecerá aquí.</p>
                    </div>
                ) : materiasFiltradas.length === 0 ? (
                    <div className="flex h-40 flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                        <p className="text-base font-medium text-slate-700 dark:text-slate-200">No hay materias para mostrar.</p>
                        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">No estás inscrito en ninguna materia de la carrera "{carreraFiltro}".</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="grid gap-4 grid-cols-1">
                            {materiasFiltradas.map((materia) => (
                                <article key={materia.grupoId} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-colors hover:border-emerald-200 hover:bg-emerald-50/40 dark:border-slate-800 dark:bg-slate-950/40 dark:hover:border-emerald-900/40 dark:hover:bg-emerald-950/10">
                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-3 mb-4 dark:border-slate-800/60">
                                        <div className="flex flex-wrap items-center gap-3">
                                            <span className="rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400">
                                                {materia.materiaCodigo || 'Sin código'}
                                            </span>
                                            <h4 className="text-base font-bold text-slate-800 dark:text-slate-100">
                                                {materia.materiaNombre || 'Materia sin nombre'}
                                            </h4>
                                            {materia.grupo && (
                                                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                                                    Grupo {materia.grupo}
                                                </span>
                                            )}
                                            {materia.carreras && materia.carreras.map((c, i) => (
                                                <span key={i} className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-300">
                                                    {c.carrera}
                                                </span>
                                            ))}
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-455 self-start sm:self-auto">
                                            <span className="font-semibold text-slate-400 uppercase tracking-wider text-[10px]">Docente:</span>
                                            <span className="font-bold text-slate-800 dark:text-slate-200">{materia.docente || 'Pendiente de asignación'}</span>
                                        </div>
                                    </div>

                                    {(() => {
                                        const isExpandido = !!expandidos[materia.grupoId];
                                        const prestamoActual = datos.prestamosResumen?.find(
                                            (p) => p.materiaGrupoId === materia.grupoId && ['solicitado', 'aceptado', 'despachado', 'activo', 'pendiente', 'vencido'].includes(p.estado)
                                        );

                                        return (
                                            <div className="mt-4">
                                                <button
                                                    type="button"
                                                    onClick={() => toggleExpandido(materia.grupoId)}
                                                    className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-xs font-semibold text-slate-700 transition-all hover:bg-slate-105 hover:text-indigo-650 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-300 dark:hover:bg-slate-800/80 cursor-pointer"
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <Layers3 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                                                        <span>Grupo y Préstamo Actual</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        {!isExpandido && (
                                                            <div className="flex items-center gap-1.5 text-[10px]">
                                                                {materia.gruposPrestamo.length > 0 ? (
                                                                    <span className="rounded-full bg-emerald-50 px-2 py-0.5 font-medium text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400">
                                                                        Grupo: {materia.gruposPrestamo[0].codigo}
                                                                    </span>
                                                                ) : (
                                                                    <span className="rounded-full bg-slate-100 px-2 py-0.5 font-medium text-slate-555 dark:bg-slate-800 dark:text-slate-400">
                                                                        Sin Grupo
                                                                    </span>
                                                                )}
                                                                {prestamoActual ? (
                                                                    <span className="rounded-full bg-amber-50 px-2 py-0.5 font-medium text-amber-600 dark:bg-amber-950/30 dark:text-amber-400">
                                                                        Préstamo Activo
                                                                    </span>
                                                                ) : (
                                                                    <span className="rounded-full bg-slate-100 px-2 py-0.5 font-medium text-slate-400 dark:bg-slate-800 dark:text-slate-505">
                                                                        Sin Préstamo
                                                                    </span>
                                                                )}
                                                            </div>
                                                        )}
                                                        {isExpandido ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                                    </div>
                                                </button>

                                                {isExpandido && (
                                                    <div className="mt-4 grid gap-5 border-t border-slate-100 pt-4 dark:border-slate-800 md:grid-cols-2">
                                                        <div>
                                                            <h5 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-505 flex items-center gap-1 mb-2">
                                                                <Users className="h-3 w-3 text-slate-400" />
                                                                Grupo de Préstamo
                                                            </h5>
                                                            {materia.gruposPrestamo.length === 0 ? (
                                                                <p className="text-xs text-slate-500 dark:text-slate-400 bg-slate-50/30 p-3 rounded-lg border border-slate-100 dark:bg-slate-900/20 dark:border-slate-800/60">
                                                                    No estás incluido en grupos de préstamo para esta materia.
                                                                </p>
                                                            ) : (
                                                                <div className="space-y-3">
                                                                    {materia.gruposPrestamo.map((grupoPrestamo) => (
                                                                        <div key={grupoPrestamo.id} className="rounded-lg border border-emerald-100 bg-emerald-50/5 p-3 dark:border-emerald-900/20 dark:bg-slate-950/40">
                                                                            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2 mb-2 dark:border-slate-800">
                                                                                <div className="flex flex-wrap items-center gap-2">
                                                                                    <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                                                                                        {grupoPrestamo.codigo}
                                                                                    </span>
                                                                                    {grupoPrestamo.nombre && (
                                                                                        <span className="text-xs font-medium text-slate-800 dark:text-slate-100">
                                                                                            {grupoPrestamo.nombre}
                                                                                        </span>
                                                                                    )}
                                                                                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                                                                                        grupoPrestamo.esResponsable 
                                                                                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' 
                                                                                            : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                                                                                    }`}>
                                                                                        {grupoPrestamo.esResponsable ? 'Responsable' : 'Integrante'}
                                                                                    </span>
                                                                                </div>
                                                                            </div>
                                                                            <div className="flex flex-wrap items-center justify-between gap-2.5">
                                                                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                                                                    {grupoPrestamo.cantidadIntegrantes} de {materia.maxEstudiantesGrupo ?? 3} integrante(s)
                                                                                    {grupoPrestamo.descripcion ? ` · ${grupoPrestamo.descripcion}` : ''}
                                                                                </p>
                                                                                {grupoPrestamo.esResponsable && (
                                                                                    <Boton
                                                                                        type="button"
                                                                                        size="sm"
                                                                                        onClick={() => abrirSelectorCompaneros(materia.grupoId, grupoPrestamo)}
                                                                                        className="bg-indigo-650 hover:bg-indigo-755 text-white font-semibold text-[10px] h-7 px-2.5 rounded-lg flex items-center gap-1 shadow-sm transition-all"
                                                                                    >
                                                                                        <Users className="h-3 w-3" />
                                                                                        Elegir Compañeros
                                                                                    </Boton>
                                                                                )}
                                                                            </div>
                                                                            {grupoPrestamo.integrantes && (grupoPrestamo.integrantes as any[]).length > 0 && (
                                                                                <div className="mt-3 border-t border-slate-100 pt-2.5 dark:border-slate-800/60">
                                                                                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-505 mb-1.5 flex items-center gap-1">
                                                                                        <Users className="h-3 w-3 text-slate-400" />
                                                                                        Conformación del Grupo
                                                                                    </p>
                                                                                    <div className="grid gap-1.5 sm:grid-cols-2">
                                                                                        {(grupoPrestamo.integrantes as any[]).map((int: any) => (
                                                                                            <div key={int.id} className="flex items-center justify-between rounded bg-slate-50/50 px-2.5 py-1 text-xs border border-slate-100 dark:bg-slate-900/60 dark:border-slate-800/40">
                                                                                                <span className="font-medium text-slate-700 dark:text-slate-355">
                                                                                                    {int.nombre} {int.apellido}
                                                                                                </span>
                                                                                                <div className="flex items-center gap-1">
                                                                                                    <span className="font-mono text-[9px] text-slate-450">
                                                                                                        {int.carnet}
                                                                                                    </span>
                                                                                                    {int.esResponsable && (
                                                                                                        <span className="rounded bg-amber-50 dark:bg-amber-950/45 px-1 py-0.2 text-[8px] font-semibold text-amber-700 dark:text-amber-300 border border-amber-200/50 dark:border-amber-900/50">
                                                                                                            Líder
                                                                                                        </span>
                                                                                                    )}
                                                                                                </div>
                                                                                            </div>
                                                                                        ))}
                                                                                    </div>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div>
                                                            <h5 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-505 flex items-center gap-1 mb-2">
                                                                <Clock className="h-3 w-3 text-slate-400" />
                                                                Préstamo Actual
                                                            </h5>
                                                            {prestamoActual ? (
                                                                <div className="rounded-lg border border-slate-250/60 bg-slate-50/30 p-3 dark:border-slate-800 dark:bg-slate-900/20">
                                                                    <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2 mb-2 dark:border-slate-800">
                                                                        <div>
                                                                            <p className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                                                                                Código: {prestamoActual.codigo ?? prestamoActual.id}
                                                                            </p>
                                                                            <p className="text-[11px] text-slate-550 dark:text-slate-400 mt-0.5">
                                                                                Autorizado por {prestamoActual.docente}
                                                                            </p>
                                                                        </div>
                                                                        <span className={`inline-flex rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase ${colorEstadoCanasta(prestamoActual.estado)}`}>
                                                                            {prestamoActual.estado}
                                                                        </span>
                                                                    </div>

                                                                    <div className="space-y-1 text-xs text-slate-600 dark:text-slate-355">
                                                                        <div className="flex items-center gap-1 text-[11px]">
                                                                            <Package2 className="h-3.5 w-3.5 text-slate-400" />
                                                                            <span>{prestamoActual.totalCosas || prestamoActual.cosas?.length || 0} activo(s) en préstamo</span>
                                                                        </div>
                                                                        <div className="flex items-center gap-1 text-[11px]">
                                                                            <Calendar className="h-3.5 w-3.5 text-slate-400" />
                                                                            <span>
                                                                                Desde: {formatearFechaHora(prestamoActual.fechaPrestamo)}
                                                                            </span>
                                                                        </div>
                                                                        {prestamoActual.fechaDevolucion && (
                                                                            <div className="flex items-center gap-1 text-[11px]">
                                                                                <CalendarClock className="h-3.5 w-3.5 text-slate-400" />
                                                                                <span>
                                                                                    Devolución: {formatearFechaHora(prestamoActual.fechaDevolucion)}
                                                                                </span>
                                                                            </div>
                                                                        )}
                                                                    </div>

                                                                    <div className="mt-2.5 flex justify-end">
                                                                        <Boton
                                                                            type="button"
                                                                            variant="outline"
                                                                            size="sm"
                                                                            className="h-7 text-[10px] gap-1 px-2 border-slate-200 hover:bg-slate-50 dark:border-slate-800"
                                                                            onClick={() => setModalVerActivos(prestamoActual)}
                                                                        >
                                                                            <Eye className="h-3 w-3" />
                                                                            Ver activos
                                                                        </Boton>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <p className="text-xs text-slate-500 dark:text-slate-400 bg-slate-50/30 p-3 rounded-lg border border-slate-100 dark:bg-slate-900/20 dark:border-slate-800/60">
                                                                    No tienes préstamos activos en esta materia actualmente.
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })()}
                                </article>
                            ))}
                        </div>
                    </div>
                )}
            </div>
            {modalAbierto && (
                <ModalBase titulo="Inscribirme en una Materia" onCerrar={() => { setModalAbierto(false); setCodigo(''); setTipoInscripcion('todas'); setCarreraSeleccionada(''); }} ancho="max-w-md">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Código de Inscripción</label>
                            <Input
                                value={codigo}
                                onChange={(e) => setCodigo(e.target.value.toUpperCase())}
                                placeholder="EJEMPLO: MAT101"
                                className="h-11 font-mono tracking-widest text-center text-lg border-2 focus:border-indigo-500 rounded-xl"
                                disabled={inscribiendo}
                                maxLength={20}
                            />
                            <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-tight">
                                Introduce el código alfanumérico de 4 o más caracteres provisto por tu docente para matricularte inmediatamente.
                            </p>
                        </div>

                        {carrerasMostrar.length > 1 && (
                            <div className="space-y-3 border-t border-slate-100 pt-3 dark:border-slate-800">
                                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                    Inscribirse con:
                                </label>
                                <div className="flex gap-4">
                                    <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="tipoInscripcion"
                                            value="todas"
                                            checked={tipoInscripcion === 'todas'}
                                            onChange={() => setTipoInscripcion('todas')}
                                            className="accent-indigo-650"
                                        />
                                        Todas las carreras
                                    </label>
                                    <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="tipoInscripcion"
                                            value="una"
                                            checked={tipoInscripcion === 'una'}
                                            onChange={() => setTipoInscripcion('una')}
                                            className="accent-indigo-650"
                                        />
                                        Solamente una
                                    </label>
                                </div>
                                {tipoInscripcion === 'una' && (
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                                            Seleccionar carrera:
                                        </label>
                                        <select
                                            value={carreraSeleccionada || carrerasMostrar[0]?.carrera || ''}
                                            onChange={(e) => setCarreraSeleccionada(e.target.value)}
                                            className="w-full text-xs h-9 px-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
                                        >
                                            {carrerasMostrar.map((c, i) => (
                                                <option key={i} value={c.carrera}>
                                                    {c.carrera} (CU {c.cu})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                            <Boton type="button" variant="outline" onClick={() => { setModalAbierto(false); setCodigo(''); setTipoInscripcion('todas'); setCarreraSeleccionada(''); }} className="rounded-xl h-10 px-5 text-xs font-semibold" disabled={inscribiendo}>
                                Cancelar
                            </Boton>
                            <Boton type="button" onClick={() => { void handleInscribirse(); }} disabled={inscribiendo} className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white h-10 px-6 text-xs font-semibold shadow-md hover:shadow-lg transition-all">
                                {inscribiendo ? 'Inscribiendo...' : 'Confirmar Inscripción'}
                            </Boton>
                        </div>
                    </div>
                </ModalBase>
            )}


            {modalCompanerosAbierto && subgrupoSeleccionado && (
                <ModalBase titulo={`Elegir Compañeros - Grupo ${subgrupoSeleccionado.codigo}`} onCerrar={() => { setModalCompanerosAbierto(false); setSubgrupoSeleccionado(null); }} ancho="max-w-xl">
                    <div className="space-y-4">
                        <div className="rounded-lg border border-indigo-50 bg-indigo-50/30 px-3 py-2 text-xs text-indigo-700 dark:border-indigo-900/40 dark:bg-indigo-950/20 dark:text-indigo-300">
                            Como responsable de este grupo de préstamo, puedes seleccionar a tus compañeros de equipo (límite máximo de {subgrupoSeleccionado.maxLimit} integrantes incluyendo al líder).
                        </div>

                        <div className="space-y-2 rounded-md border border-slate-200 p-3 dark:border-slate-800 bg-slate-50/50">
                            <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2 dark:border-slate-800">
                                <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">Compañeros inscritos</p>
                                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                                    Seleccionados: {seleccionados.length} de {subgrupoSeleccionado.maxLimit}
                                </span>
                            </div>

                            {cargandoCompaneros ? (
                                <div className="py-6 text-center text-xs text-slate-500">Cargando compañeros...</div>
                            ) : companerosMateria.length === 0 ? (
                                <div className="py-6 text-center text-xs text-slate-500">No hay estudiantes inscritos en esta materia.</div>
                            ) : (
                                <div className="space-y-2 max-h-60 overflow-y-auto">
                                    {companerosMateria.map((est) => {
                                        const isSelf = est.id === perfil.id;
                                        const marcado = seleccionados.includes(est.id);
                                        return (
                                            <label key={est.id} className="flex items-center justify-between gap-3 rounded-md border border-slate-200 px-3 py-2 text-xs dark:border-slate-800 bg-white dark:bg-slate-900 cursor-pointer">
                                                <div className="flex items-center gap-3">
                                                    <Checkbox
                                                        checked={marcado}
                                                        disabled={isSelf}
                                                        onChange={(e) => {
                                                            const checked = e.target.checked;
                                                            if (checked && seleccionados.length >= subgrupoSeleccionado.maxLimit) {
                                                                toast.error(`El grupo de préstamo no puede exceder el límite de ${subgrupoSeleccionado.maxLimit} estudiantes.`);
                                                                return;
                                                            }
                                                            setSeleccionados((prev) => {
                                                                if (checked) {
                                                                    return Array.from(new Set([...prev, est.id]));
                                                                } else {
                                                                    return prev.filter((id) => id !== est.id);
                                                                }
                                                            });
                                                        }}
                                                    />
                                                    <span>[{est.carnet}] {est.apellido}, {est.nombre} {est.carrera ? `(${est.carrera})` : ''}</span>
                                                </div>
                                                {isSelf && <span className="text-[10px] bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 px-2 py-0.5 rounded font-semibold">Tú (Líder)</span>}
                                            </label>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                            <Boton type="button" variant="outline" onClick={() => { setModalCompanerosAbierto(false); setSubgrupoSeleccionado(null); }} className="rounded-xl h-10 px-5 text-xs font-semibold" disabled={guardandoCompaneros}>
                                Cancelar
                            </Boton>
                            <Boton type="button" onClick={() => { void handleGuardarCompaneros(); }} disabled={guardandoCompaneros || cargandoCompaneros} className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white h-10 px-6 text-xs font-semibold shadow-md hover:shadow-lg transition-all">
                                {guardandoCompaneros ? 'Guardando...' : 'Guardar Compañeros'}
                            </Boton>
                        </div>
                    </div>
                </ModalBase>
            )}

            {modalVerActivos && (
                <ModalBase
                    titulo={`Detalle de activos - Préstamo ${modalVerActivos.codigo ?? modalVerActivos.id}`}
                    onCerrar={() => setModalVerActivos(null)}
                    ancho="max-w-md"
                >
                    <div className="space-y-4 p-4 text-xs">
                        <div>
                            <h4 className="font-semibold text-slate-800 dark:text-slate-200 mb-2">Activos Fijos:</h4>
                            {modalVerActivos.cosas && modalVerActivos.cosas.length > 0 ? (
                                <ul className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-150 dark:border-slate-800 rounded-lg overflow-hidden">
                                    {modalVerActivos.cosas.map((item: any, idx: number) => (
                                        <li key={idx} className="px-3 py-2 bg-slate-50/50 dark:bg-slate-900/30 flex items-center justify-between">
                                            <div>
                                                <span className="font-mono font-semibold text-blue-600 dark:text-blue-400">[{item.codigoInventario}]</span>{' '}
                                                <span className="text-slate-705 dark:text-slate-300">{item.nombre}</span>
                                            </div>
                                            {item.registrado === false ? (
                                                <span className="inline-flex items-center rounded-full bg-rose-50 border border-rose-200 px-2 py-0.5 text-[9px] font-bold text-rose-700 dark:bg-rose-950/30 dark:border-rose-900/40 dark:text-rose-300 shrink-0">
                                                    No despachado
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[9px] font-bold text-emerald-700 dark:bg-emerald-950/30 dark:border-emerald-900/40 dark:text-emerald-300 shrink-0">
                                                    Prestado
                                                </span>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-slate-400 italic">Ningún activo fijo solicitado.</p>
                            )}
                        </div>

                        <div>
                            <h4 className="font-semibold text-slate-800 dark:text-slate-200 mb-2">Activos Fungibles (Consumibles):</h4>
                            {modalVerActivos.consumibles && modalVerActivos.consumibles.length > 0 ? (
                                <ul className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-150 dark:border-slate-800 rounded-lg overflow-hidden">
                                    {modalVerActivos.consumibles.map((item: any, idx: number) => (
                                        <li key={idx} className="px-3 py-2 bg-slate-50/50 dark:bg-slate-900/30 flex justify-between items-center">
                                            <div>
                                                <span className="text-slate-707 dark:text-slate-300 font-medium">{item.material}</span>
                                                {item.lote && <p className="text-[10px] text-slate-500">Lote/Serie: {item.lote}</p>}
                                            </div>
                                            <span className="font-mono bg-blue-50 text-blue-705 px-2 py-0.5 rounded text-[10px] font-bold dark:bg-blue-950/40 dark:text-blue-300">
                                                Cant: {item.cantidadDespachada ?? item.cantidadSolicitada ?? item.cantidad}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-slate-400 italic">Ningún material fungible solicitado.</p>
                            )}
                        </div>

                        <div className="flex justify-end pt-2">
                            <Boton type="button" onClick={() => setModalVerActivos(null)}>Cerrar</Boton>
                        </div>
                    </div>
                </ModalBase>
            )}
        </LayoutPagina>
    );
};