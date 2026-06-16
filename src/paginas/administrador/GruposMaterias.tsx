import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { BookOpen, X, Hourglass, Archive } from 'lucide-react';
import type { PropsPaginaBase } from '@/tipos/paginas';
import { LayoutPagina } from '@/componentes/layout/layout-pagina';
import { BarraFiltros } from '@/componentes/layout/barra-filtros';
import { Boton } from '@/componentes/ui/button';
import { AccionesFilaAdmin } from '@/componentes/paginas/compartido/acciones-fila-admin';
import { useDialogoEntrada } from '@/contextos/ContextoDialogoEntrada';
import { useConfirmacion } from '@/contextos/ContextoConfirmacion';
import type { EstadoAprobacionGrupoDocencia, GrupoMateriaDocencia } from '@/tipos/docencia';
import {
    aprobarSolicitudGrupoDocencia,
    listarGruposAdministracionDocencia,
    rechazarSolicitudGrupoDocencia,
    crearGrupoAdministracionDocencia,
    editarGrupoDocencia,
    eliminarGrupoDocencia,
    listarEstudiantesInscritosMateria,
} from '@/lib/servicio-docencia';
import { listarDocentesAdmin } from '@/lib/servicio-administrador';
import type { UsuarioSesion } from '@/tipos/autenticacion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/componentes/ui/tabs';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription
} from '@/componentes/ui/dialog';
import { Input } from '@/componentes/ui/input';
import { Label } from '@/componentes/ui/label';
import { useInventario } from '@/contextos/ContextoInventario';

const normalizarEstado = (grupo: GrupoMateriaDocencia): EstadoAprobacionGrupoDocencia => {
    return (grupo.estadoAprobacion || 'aprobado') as EstadoAprobacionGrupoDocencia;
};

const obtenerCodigoMateria = (grupo: GrupoMateriaDocencia) => {
    return String(grupo.sigla || grupo.codigoMateria || grupo.materia || '').trim().toUpperCase();
};

const obtenerNombreMateria = (
    grupo: GrupoMateriaDocencia,
    materiasPorCodigo?: Map<string, string>,
) => {
    const sigla = obtenerCodigoMateria(grupo);
    if (sigla && materiasPorCodigo?.has(sigla)) {
        return materiasPorCodigo.get(sigla)!;
    }
    return String(grupo.nombreMateria || grupo.nombre || 'Sin nombre').trim();
};

export type PropsGruposMaterias = PropsPaginaBase & {
    permiteCrearAdmin?: boolean;
};

export const GruposMaterias = ({ onNavegar, onCerrarSesion, permiteCrearAdmin = true }: PropsGruposMaterias) => {
    const { solicitarEntrada } = useDialogoEntrada();
    const { confirmar } = useConfirmacion();
    const [grupos, setGrupos] = useState<GrupoMateriaDocencia[]>([]);
    const [cargando, setCargando] = useState(false);
    const [procesandoAccion, setProcesandoAccion] = useState(false);
    const [busqueda, setBusqueda] = useState('');
    const [tabActiva, setTabActiva] = useState<'activos' | 'inactivos' | 'solicitados' | 'rechazados'>('activos');
    const [modalCrearAbierto, setModalCrearAbierto] = useState(false);
    const [docentes, setDocentes] = useState<UsuarioSesion[]>([]);
    const [cargandoDocentes, setCargandoDocentes] = useState(false);
    const [modalVerAbierto, setModalVerAbierto] = useState(false);
    const [grupoVer, setGrupoVer] = useState<GrupoMateriaDocencia | null>(null);
    const [estudiantesGrupo, setEstudiantesGrupo] = useState<Array<{ id: number; nombre: string; apellido: string; carnet: string; carrera: string }>>([]);
    const [cargandoEstudiantes, setCargandoEstudiantes] = useState(false);
    const [modalEditarAbierto, setModalEditarAbierto] = useState(false);
    const [grupoEdicion, setGrupoEdicion] = useState<GrupoMateriaDocencia | null>(null);
    const FORM_EDITAR_INICIAL = useMemo(() => ({ grupo: '' }), []);
    const [formEditar, setFormEditar] = useState(FORM_EDITAR_INICIAL);
    const { materias } = useInventario();
    const materiasOrdenadas = useMemo(() =>
        [...materias].sort((a, b) => a.codigo.localeCompare(b.codigo)),
    [materias]);
    const materiasPorCodigo = useMemo(() => {
        const mapa = new Map<string, string>();
        for (const m of materias) {
            if (m.nombre) mapa.set(m.codigo.trim().toUpperCase(), m.nombre);
        }
        return mapa;
    }, [materias]);
    const FORM_INICIAL = { docenteUsuarioId: '', materiaId: '', grupo: '' };
    const [formCrear, setFormCrear] = useState(FORM_INICIAL);
    const docentesFiltrados = useMemo(() => {
        if (!formCrear.materiaId) return [];
        const materia = materiasOrdenadas.find(m => m.id === formCrear.materiaId);
        if (!materia) return [];
        const sigla = materia.codigo.trim().toUpperCase();
        return docentes.filter(d => 
            Array.isArray(d.materiasAsignadas) && 
            d.materiasAsignadas.some(s => s.trim().toUpperCase() === sigla)
        );
    }, [docentes, formCrear.materiaId, materiasOrdenadas]);
    useEffect(() => {
        if (formCrear.docenteUsuarioId && formCrear.materiaId) {
            const esValido = docentesFiltrados.some(d => String(d.id) === String(formCrear.docenteUsuarioId));
            if (!esValido) {
                setFormCrear(prev => ({ ...prev, docenteUsuarioId: '' }));
            }
        }
    }, [formCrear.materiaId, formCrear.docenteUsuarioId, docentesFiltrados]);

    const cargarGrupos = useCallback(async (silencioso = false) => {
        try {
            if (!silencioso) setCargando(true);
            const data = await listarGruposAdministracionDocencia('todos');
            setGrupos(data);
        } catch (err: any) {
            toast.error(err?.message ?? 'No se pudieron cargar los grupos de materias.');
        } finally {
            if (!silencioso) setCargando(false);
        }
    }, []);

    useEffect(() => {
        void cargarGrupos();

        const refrescar = () => { void cargarGrupos(true); };
        const onFocus = () => refrescar();
        const onVisibilityChange = () => {
            if (document.visibilityState === 'visible') refrescar();
        };

        window.addEventListener('focus', onFocus);
        document.addEventListener('visibilitychange', onVisibilityChange);

        return () => {
            window.removeEventListener('focus', onFocus);
            document.removeEventListener('visibilitychange', onVisibilityChange);
        };
    }, [cargarGrupos]);

    const abrirModalCrear = async () => {
        setModalCrearAbierto(true);
        if (docentes.length === 0) {
            setCargandoDocentes(true);
            try {
                const usuarios = await listarDocentesAdmin();
                setDocentes(usuarios);
            } catch {
                toast.error('No se pudieron cargar los docentes');
            } finally {
                setCargandoDocentes(false);
            }
        }
    };



    const abrirModalEditar = (grupo: GrupoMateriaDocencia) => {
        setGrupoEdicion(grupo);
        setFormEditar({
            grupo: String(grupo.grupo || grupo.nombreGrupo || '').trim(),
        });
        setModalEditarAbierto(true);
    };

    const abrirModalVer = async (grupo: GrupoMateriaDocencia) => {
        setGrupoVer(grupo);
        setModalVerAbierto(true);
        setCargandoEstudiantes(true);
        setEstudiantesGrupo([]);
        try {
            const data = await listarEstudiantesInscritosMateria(grupo.id);
            setEstudiantesGrupo(data);
        } catch (error) {
            const mensaje = error instanceof Error ? error.message : 'No se pudieron cargar los estudiantes inscritos.';
            toast.error(mensaje);
        } finally {
            setCargandoEstudiantes(false);
        }
    };

    const submitCrear = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const materia = materiasOrdenadas.find(m => m.id === formCrear.materiaId);

            if (!materia) { toast.error('Selecciona una materia válida.'); return; }

            await crearGrupoAdministracionDocencia({
                docenteUsuarioId: Number(formCrear.docenteUsuarioId),
                sigla: materia.codigo,
                nombre: materia.nombre ?? materia.codigo,
                descripcion: materia.descripcion ?? '',
                grupo: formCrear.grupo,
            });

            toast.success('Grupo creado exitosamente.');
            setModalCrearAbierto(false);
            await cargarGrupos();
            setTabActiva('activos');
            setFormCrear(FORM_INICIAL);
        } catch (err: any) {
            toast.error(err?.message ?? 'No se pudo crear el grupo.');
        }
    };

    const gruposActivos = useMemo(() => {
        return grupos.filter(g => normalizarEstado(g) === 'aprobado' && g.activo !== false);
    }, [grupos]);

    const gruposInactivos = useMemo(() => {
        return grupos.filter(g => normalizarEstado(g) === 'aprobado' && g.activo === false);
    }, [grupos]);

    const gruposSolicitados = useMemo(() => {
        return grupos.filter(g => normalizarEstado(g) === 'pendiente');
    }, [grupos]);

    const gruposRechazados = useMemo(() => {
        return grupos.filter(g => normalizarEstado(g) === 'rechazado');
    }, [grupos]);

    const aplicarFiltros = useCallback((lista: GrupoMateriaDocencia[]) => {
        const termino = busqueda.trim().toLowerCase();
        if (termino === '') return lista;
        return lista.filter((grupo) => {
            const sigla = obtenerCodigoMateria(grupo).toLowerCase();
            const nombreMateria = obtenerNombreMateria(grupo).toLowerCase();
            const codigoGrupo = String(grupo.grupo || grupo.nombreGrupo || '').toLowerCase();

            return sigla.includes(termino)
                || nombreMateria.includes(termino)
                || codigoGrupo.includes(termino);
        });
    }, [busqueda]);

    const activosFiltrados = useMemo(() => aplicarFiltros(gruposActivos), [aplicarFiltros, gruposActivos]);
    const inactivosFiltrados = useMemo(() => aplicarFiltros(gruposInactivos), [aplicarFiltros, gruposInactivos]);
    const solicitadosFiltrados = useMemo(() => aplicarFiltros(gruposSolicitados), [aplicarFiltros, gruposSolicitados]);
    const rechazadosFiltrados = useMemo(() => aplicarFiltros(gruposRechazados), [aplicarFiltros, gruposRechazados]);



    const aprobar = async (id: string) => {
        setProcesandoAccion(true);
        try {
            await aprobarSolicitudGrupoDocencia(id);
            toast.success('Solicitud aprobada.');
            await cargarGrupos();
        } catch (err: any) {
            toast.error(err?.message ?? 'No se pudo aprobar la solicitud.');
        } finally {
            setProcesandoAccion(false);
        }
    };

    const rechazar = async (id: string) => {
        const valores = await solicitarEntrada({
            titulo: 'Rechazar solicitud',
            descripcion: 'Puedes registrar un motivo para dejar constancia del rechazo.',
            textoConfirmar: 'Rechazar solicitud',
            campos: [
                {
                    id: 'motivo',
                    etiqueta: 'Motivo de rechazo',
                    placeholder: 'Opcional',
                    tipo: 'textarea',
                    filas: 4,
                },
            ],
        });
        if (!valores) return;

        const motivo = valores.motivo.trim();
        setProcesandoAccion(true);
        try {
            await rechazarSolicitudGrupoDocencia(id, motivo);
            toast.success('Solicitud rechazada.');
            await cargarGrupos();
        } catch (err: any) {
            toast.error(err?.message ?? 'No se pudo rechazar la solicitud.');
        } finally {
            setProcesandoAccion(false);
        }
    };

    const submitEditar = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!grupoEdicion) return;

        const grupo = formEditar.grupo.trim();
        if (!grupo) {
            toast.error('El grupo es obligatorio.');
            return;
        }

        setProcesandoAccion(true);
        try {
            await editarGrupoDocencia(grupoEdicion.id, { grupo });
            toast.success('Grupo actualizado.');
            setModalEditarAbierto(false);
            setGrupoEdicion(null);
            setFormEditar(FORM_EDITAR_INICIAL);
            await cargarGrupos();
        } catch (err: any) {
            toast.error(err?.message ?? 'No se pudo actualizar el grupo.');
        } finally {
            setProcesandoAccion(false);
        }
    };

    const borrarGrupo = async (grupo: GrupoMateriaDocencia) => {
        const materia = obtenerCodigoMateria(grupo);
        const grupoNombre = String(grupo.grupo || grupo.nombreGrupo || '').trim();
        const ok = await confirmar({
            titulo: 'Eliminar grupo de materia',
            descripcion: `¿Eliminar el grupo ${materia}${grupoNombre ? ` (${grupoNombre})` : ''}?`,
            textoConfirmar: 'Eliminar',
            textoCancelar: 'Cancelar',
            varianteConfirmar: 'destructive',
        });
        if (!ok) return;

        setProcesandoAccion(true);
        try {
            await eliminarGrupoDocencia(grupo.id);
            toast.success('Grupo eliminado.');
            await cargarGrupos();
        } catch (err: any) {
            toast.error(err?.message ?? 'No se pudo eliminar el grupo.');
        } finally {
            setProcesandoAccion(false);
        }
    };

    const cambiarActivoGrupo = async (id: string, activo: boolean) => {
        setProcesandoAccion(true);
        try {
            await editarGrupoDocencia(id, { activo });
            toast.success(activo ? 'Grupo reactivado exitosamente.' : 'Grupo desactivado.');
            await cargarGrupos();
        } catch (err: any) {
            toast.error(err?.message ?? 'No se pudo cambiar el estado del grupo.');
        } finally {
            setProcesandoAccion(false);
        }
    };

    const renderTabla = (lista: GrupoMateriaDocencia[], mostrarMateria: boolean = true) => (
        <div className="overflow-x-auto">
            <table className="w-full text-xs">
                <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/50">
                        {mostrarMateria && <th className="px-4 py-2.5 text-left font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Materia</th>}
                        <th className="px-4 py-2.5 text-left font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Grupo</th>
                        <th className="px-4 py-2.5 text-left font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Docente</th>
                        <th className="px-4 py-2.5 text-left font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Estado</th>
                        <th className="px-4 py-2.5 text-right font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Acciones</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {lista.map((grupo) => {
                        const estado = normalizarEstado(grupo);
                        const docenteNombre = `${String(grupo.docenteUsuario?.nombre ?? '').trim()} ${String(grupo.docenteUsuario?.apellido ?? '').trim()}`.trim()
                            || String(grupo.docenteUsuario?.correo ?? '').trim()
                            || '-';

                        return (
                            <tr key={grupo.id} className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/40">
                                {mostrarMateria && (
                                    <td className="px-4 py-2.5 text-slate-700 dark:text-slate-200">
                                        <div className="font-semibold">{obtenerCodigoMateria(grupo)}</div>
                                        <div className="text-slate-500 dark:text-slate-400">{obtenerNombreMateria(grupo, materiasPorCodigo)}</div>
                                    </td>
                                )}
                                <td className="px-4 py-2.5 text-slate-700 dark:text-slate-300">{grupo.grupo || grupo.nombreGrupo || '-'}</td>
                                <td className="px-4 py-2.5 text-slate-700 dark:text-slate-300">{docenteNombre}</td>
                                <td className="px-4 py-2.5">
                                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                                        estado === 'aprobado'
                                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                                            : estado === 'rechazado'
                                                ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                                                : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                                    }`}>
                                        {estado}
                                    </span>
                                </td>
                                <td className="px-4 py-2.5">
                                    <div className="flex justify-end gap-2">
                                        {estado === 'pendiente' && (
                                            <>
                                                <Boton
                                                    type="button"
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => { void abrirModalVer(grupo); }}
                                                >
                                                    Ver
                                                </Boton>
                                                <Boton type="button" size="sm" disabled={procesandoAccion} onClick={() => { void aprobar(grupo.id); }}>
                                                    Aprobar
                                                </Boton>
                                                <Boton type="button" size="sm" variant="outline" disabled={procesandoAccion} onClick={() => { void rechazar(grupo.id); }}>
                                                    Rechazar
                                                </Boton>
                                            </>
                                        )}
                                        {estado !== 'pendiente' && (
                                            <div className="flex items-center justify-end gap-2">
                                                <Boton
                                                    type="button"
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => { void abrirModalVer(grupo); }}
                                                >
                                                    Ver
                                                </Boton>
                                                {grupo.activo === false ? (
                                                    <Boton
                                                        type="button"
                                                        size="sm"
                                                        variant="outline"
                                                        className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/20"
                                                        disabled={procesandoAccion}
                                                        onClick={() => { void cambiarActivoGrupo(grupo.id, true); }}
                                                    >
                                                        Reactivar
                                                    </Boton>
                                                ) : (
                                                    <Boton
                                                        type="button"
                                                        size="sm"
                                                        variant="outline"
                                                        className="text-slate-600 hover:text-red-600 hover:bg-red-50 dark:text-slate-400 dark:hover:bg-red-950/20"
                                                        disabled={procesandoAccion}
                                                        onClick={() => { void cambiarActivoGrupo(grupo.id, false); }}
                                                    >
                                                        Desactivar
                                                    </Boton>
                                                )}
                                                {permiteCrearAdmin ? (
                                                    <div className="flex justify-end">
                                                        <AccionesFilaAdmin
                                                            deshabilitado={procesandoAccion}
                                                            onEditar={() => { void abrirModalEditar(grupo); }}
                                                            onEliminar={() => { void borrarGrupo(grupo); }}
                                                        />
                                                    </div>
                                                ) : (
                                                    <span className="px-2 py-1 text-[11px] text-slate-500 dark:text-slate-400">Sin acciones</span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                    {lista.length === 0 && (
                        <tr>
                            <td colSpan={mostrarMateria ? 5 : 4} className="px-4 py-4 text-center text-slate-500 dark:text-slate-400">
                                No hay grupos.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );


    return (
        <LayoutPagina
            paginaActiva="grupos-materia"
            titulo="Grupos de materias"
            subtitulo="Administra solicitudes, aprobaciones y datos de grupos"
            onNavegar={onNavegar}
            onCerrarSesion={onCerrarSesion}
            onRecargar={() => void cargarGrupos()}
            recargando={cargando}
        >
            <Tabs value={tabActiva} onValueChange={(v) => setTabActiva(v as any)} className="w-full">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4 pb-1">
                    <TabsList className="w-full lg:w-auto">
                        <TabsTrigger value="activos" className="flex-1 lg:flex-initial">
                            <BookOpen className="h-4 w-4 mr-1.5" />
                            Activos ({gruposActivos.length})
                        </TabsTrigger>
                        <TabsTrigger value="inactivos" className="flex-1 lg:flex-initial">
                            <Archive className="h-4 w-4 mr-1.5" />
                            Inactivos ({gruposInactivos.length})
                        </TabsTrigger>
                        <TabsTrigger value="solicitados" className="flex-1 lg:flex-initial">
                            <Hourglass className="h-4 w-4 mr-1.5" />
                            Solicitados ({gruposSolicitados.length})
                            {gruposSolicitados.length > 0 && (
                                <span className="ml-1.5 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700 dark:bg-amber-900/50 dark:text-amber-300">
                                    {gruposSolicitados.length}
                                </span>
                            )}
                        </TabsTrigger>
                        <TabsTrigger value="rechazados" className="flex-1 lg:flex-initial">
                            <X className="h-4 w-4 mr-1.5" />
                            Rechazados ({gruposRechazados.length})
                        </TabsTrigger>
                    </TabsList>

                    <div className="flex items-center gap-3 w-full lg:w-auto justify-between lg:justify-end flex-wrap sm:flex-nowrap">
                        <div className="flex-1 sm:w-80 max-w-sm">
                            <BarraFiltros
                                busqueda={busqueda}
                                onBusquedaChange={setBusqueda}
                                placeholder="Buscar por materia, sigla o grupo..."
                                filtrosActivos={false}
                                onLimpiarFiltros={() => {
                                    setBusqueda('');
                                }}
                            />
                        </div>

                        {permiteCrearAdmin && (
                            <Boton onClick={abrirModalCrear} className="h-8 text-xs font-semibold shrink-0">
                                Crear Grupo
                            </Boton>
                        )}
                    </div>
                </div>

                <TabsContent value="activos" className="rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
                    {cargando && activosFiltrados.length === 0 ? (
                        <div className="p-4 text-center text-slate-500">Cargando activos...</div>
                    ) : activosFiltrados.length === 0 ? (
                        <div className="p-4 text-center text-slate-500">No hay grupos activos que coincidan con la búsqueda.</div>
                    ) : (
                        renderTabla(activosFiltrados, true)
                    )}
                </TabsContent>

                <TabsContent value="inactivos" className="rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
                    {cargando && inactivosFiltrados.length === 0 ? (
                        <div className="p-4 text-center text-slate-500">Cargando inactivos...</div>
                    ) : inactivosFiltrados.length === 0 ? (
                        <div className="p-4 text-center text-slate-500">No hay grupos inactivos que coincidan con la búsqueda.</div>
                    ) : (
                        renderTabla(inactivosFiltrados, true)
                    )}
                </TabsContent>

                <TabsContent value="solicitados" className="rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
                    {cargando && solicitadosFiltrados.length === 0 ? (
                        <div className="p-4 text-center text-slate-500">Cargando solicitudes...</div>
                    ) : solicitadosFiltrados.length === 0 ? (
                        <div className="p-4 text-center text-slate-500">No hay solicitudes pendientes que coincidan con la búsqueda.</div>
                    ) : (
                        renderTabla(solicitadosFiltrados, true)
                    )}
                </TabsContent>

                <TabsContent value="rechazados" className="rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
                    {cargando && rechazadosFiltrados.length === 0 ? (
                        <div className="p-4 text-center text-slate-500">Cargando rechazados...</div>
                    ) : rechazadosFiltrados.length === 0 ? (
                        <div className="p-4 text-center text-slate-500">No hay grupos rechazados que coincidan con la búsqueda.</div>
                    ) : (
                        renderTabla(rechazadosFiltrados, true)
                    )}
                </TabsContent>
            </Tabs>

            <Dialog open={modalCrearAbierto} onOpenChange={setModalCrearAbierto}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Crear Grupo de Materia (Admin)</DialogTitle>
                        <DialogDescription>
                            Selecciona la materia, elige el docente y asigna el número o letra de grupo.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={submitCrear} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="materiaId">Materia *</Label>
                            {materiasOrdenadas.length === 0 ? (
                                <div className="text-xs text-slate-500">No hay materias registradas.</div>
                            ) : (
                                <select
                                    id="materiaId"
                                    required
                                    value={formCrear.materiaId}
                                    onChange={(e) => setFormCrear({ ...formCrear, materiaId: e.target.value })}
                                    className="flex h-9 w-full rounded-md border border-slate-200 bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 dark:border-slate-800 dark:focus-visible:ring-slate-300"
                                >
                                    <option value="">Selecciona una materia...</option>
                                    {materiasOrdenadas.map(m => (
                                        <option key={m.id} value={m.id}>
                                            {m.codigo}{m.nombre ? ` — ${m.nombre}` : ''}
                                        </option>
                                    ))}
                                </select>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="docenteUsuarioId">Docente *</Label>
                            {cargandoDocentes ? (
                                <div className="text-xs text-slate-500">Cargando docentes...</div>
                            ) : (
                                <select
                                    id="docenteUsuarioId"
                                    required
                                    disabled={!formCrear.materiaId || cargandoDocentes}
                                    value={formCrear.docenteUsuarioId}
                                    onChange={(e) => setFormCrear({ ...formCrear, docenteUsuarioId: e.target.value })}
                                    className="flex h-9 w-full rounded-md border border-slate-200 bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 dark:border-slate-800 dark:focus-visible:ring-slate-300 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <option value="">
                                        {!formCrear.materiaId ? 'Primero selecciona una materia...' : 'Selecciona un docente...'}
                                    </option>
                                    {docentesFiltrados.map(d => (
                                        <option key={d.id} value={d.id}>
                                            {d.nombre} {d.apellido} ({d.correo ?? d.id})
                                        </option>
                                    ))}
                                </select>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="grupo">Número / Letra de Grupo *</Label>
                            <Input
                                required
                                id="grupo"
                                disabled={!formCrear.materiaId}
                                placeholder="Ej: A, B, 1, 2"
                                value={formCrear.grupo}
                                onChange={(e) => setFormCrear({ ...formCrear, grupo: e.target.value })}
                                className="disabled:opacity-50 disabled:cursor-not-allowed"
                            />
                        </div>

                        <DialogFooter className="mt-4">
                            <Boton type="button" variant="outline" onClick={() => setModalCrearAbierto(false)}>Cancelar</Boton>
                            <Boton
                                type="submit"
                                disabled={cargandoDocentes || !formCrear.docenteUsuarioId || !formCrear.materiaId || !formCrear.grupo.trim()}
                            >
                                Crear Grupo
                            </Boton>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog
                open={modalEditarAbierto}
                onOpenChange={(open) => {
                    setModalEditarAbierto(open);
                    if (!open) {
                        setGrupoEdicion(null);
                        setFormEditar(FORM_EDITAR_INICIAL);
                    }
                }}
            >
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Editar grupo de materia</DialogTitle>
                        <DialogDescription>
                            Actualiza el número/letra de grupo.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={submitEditar} className="space-y-4">
                        <div className="space-y-2">
                            <Label>Materia</Label>
                            <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-200">
                                <div className="font-semibold">{grupoEdicion ? obtenerCodigoMateria(grupoEdicion) : '-'}</div>
                                <div className="text-xs text-slate-500 dark:text-slate-400">{grupoEdicion ? obtenerNombreMateria(grupoEdicion, materiasPorCodigo) : ''}</div>
                            </div>
                        </div>



                        <div className="space-y-2">
                            <Label htmlFor="editar-grupo">Número / Letra de Grupo *</Label>
                            <Input
                                id="editar-grupo"
                                required
                                placeholder="Ej: A, B, 1, 2"
                                value={formEditar.grupo}
                                onChange={(e) => setFormEditar((prev) => ({ ...prev, grupo: e.target.value }))}
                            />
                        </div>

                        <DialogFooter className="mt-4">
                            <Boton type="button" variant="outline" onClick={() => setModalEditarAbierto(false)} disabled={procesandoAccion}>
                                Cancelar
                            </Boton>
                            <Boton type="submit" disabled={procesandoAccion || !grupoEdicion}>
                                Guardar cambios
                            </Boton>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
            <Dialog
                open={modalVerAbierto}
                onOpenChange={(open) => {
                    setModalVerAbierto(open);
                    if (!open) {
                        setGrupoVer(null);
                        setEstudiantesGrupo([]);
                    }
                }}
            >
                <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-bold flex items-center gap-2">
                            <BookOpen className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            Detalles del Grupo: {grupoVer ? `${obtenerCodigoMateria(grupoVer)} - ${grupoVer.grupo || grupoVer.nombreGrupo || ''}` : ''}
                        </DialogTitle>
                        <DialogDescription>
                            {grupoVer ? obtenerNombreMateria(grupoVer, materiasPorCodigo) : ''}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex-1 overflow-y-auto space-y-6 py-4 pr-1">
                        <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-900/50">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">Docente Asignado</h3>
                            {grupoVer?.docenteUsuario ? (
                                <div className="space-y-1 text-sm">
                                    <div className="font-semibold text-slate-800 dark:text-slate-200">
                                        {`${String(grupoVer.docenteUsuario.nombre ?? '').trim()} ${String(grupoVer.docenteUsuario.apellido ?? '').trim()}`.trim() || 'Sin nombre'}
                                    </div>
                                    <div className="text-xs text-slate-500 dark:text-slate-400">
                                        {grupoVer.docenteUsuario.correo || 'Sin correo electrónico'}
                                    </div>
                                </div>
                            ) : (
                                <div className="text-xs text-slate-500 italic">No se ha asignado docente.</div>
                            )}
                        </div>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between border-b border-slate-200 pb-2 dark:border-slate-800">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                                    Estudiantes Inscritos ({estudiantesGrupo.length})
                                </h3>
                            </div>

                            {cargandoEstudiantes ? (
                                <div className="py-8 text-center text-xs text-slate-500 dark:text-slate-400">
                                    Cargando lista de estudiantes...
                                </div>
                            ) : estudiantesGrupo.length === 0 ? (
                                <div className="rounded-lg border border-dashed border-slate-200 py-8 text-center text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
                                    No hay estudiantes inscritos en este grupo.
                                </div>
                            ) : (
                                <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800">
                                    <table className="w-full text-xs text-left">
                                        <thead>
                                            <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/50">
                                                <th className="px-4 py-2 font-semibold text-slate-600 dark:text-slate-400">Carnet</th>
                                                <th className="px-4 py-2 font-semibold text-slate-600 dark:text-slate-400">Estudiante</th>
                                                <th className="px-4 py-2 font-semibold text-slate-600 dark:text-slate-400">Carrera</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                            {estudiantesGrupo.map((estudiante) => (
                                                <tr key={estudiante.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                                                    <td className="px-4 py-2 font-mono font-semibold text-slate-700 dark:text-slate-350">{estudiante.carnet}</td>
                                                    <td className="px-4 py-2 text-slate-850 dark:text-slate-200">
                                                        {`${estudiante.apellido}, ${estudiante.nombre}`}
                                                    </td>
                                                    <td className="px-4 py-2 text-slate-500 dark:text-slate-400">{estudiante.carrera || '—'}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>

                    <DialogFooter className="mt-4 pt-2 border-t border-slate-100 dark:border-slate-800">
                        <Boton type="button" onClick={() => setModalVerAbierto(false)}>
                            Cerrar
                        </Boton>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </LayoutPagina>
    );
};
