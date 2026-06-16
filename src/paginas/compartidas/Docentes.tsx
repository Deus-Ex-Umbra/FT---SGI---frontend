import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import type { PaginaApp } from '@/tipos/navegacion';
import type { PropsPaginaDocentes } from '@/tipos/paginas';
import { LayoutPagina } from '@/componentes/layout/layout-pagina';
import { TablaDocentes } from '@/componentes/paginas/inventario/tabla-docentes';
import { useInventario } from '@/contextos/ContextoInventario';
import { useConfirmacion } from '@/contextos/ContextoConfirmacion';
import { useAccionSegura } from '@/hooks/use-accion-segura';
import { Copy, GraduationCap, Plus, Trash2, ArrowLeft, Settings, Users, BookMarked, SendHorizonal, Clock, X, Check, ClipboardList } from 'lucide-react';
import { obtenerUsuarioActual } from '@/lib/servicio-autenticacion';
import {
    cargarSolicitudesPendientesDocentes,
    aprobarDocenteEnBackend,
    rechazarDocenteEnBackend,
} from '@/lib/servicio-docentes';
import { Boton } from '@/componentes/ui/button';
import { Skeleton } from '@/componentes/ui/skeleton';
import { ModalBase } from '@/componentes/paginas/inventario/modal-base';
import { Checkbox } from '@/componentes/ui/checkbox';
import { Input } from '@/componentes/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/componentes/ui/tabs';
import { Switch } from '@/componentes/ui/switch';
import type { GrupoMateriaDocencia, SubgrupoPrestamoDocencia } from '@/tipos/docencia';
import type { Estudiante } from '@/tipos/inventario';
import {
    crearGrupoDocencia,
    crearSubgrupoPrestamoDocencia,
    eliminarSubgrupoPrestamoDocencia,
    listarGruposDocencia,
    listarMateriasAsignadasDocencia,
    listarSubgruposPrestamoDocencia,
    editarGrupoDocencia,
    generarSubgruposAlAzarDocencia,
    eliminarTodosSubgruposPrestamoDocencia,
    desinscribirEstudianteMateria,
    desinscribirTodosEstudiantesMateria,
} from '@/lib/servicio-docencia';

const obtenerCodigoMateria = (materia: Pick<GrupoMateriaDocencia, 'sigla' | 'codigoMateria' | 'materia'>) => {
    return String(materia.sigla || materia.codigoMateria || materia.materia || '').trim().toUpperCase();
};

const obtenerNombreMateria = (
    materia: Pick<GrupoMateriaDocencia, 'nombre' | 'nombreMateria' | 'sigla' | 'codigoMateria' | 'materia'>,
    materiasPorCodigo?: Map<string, string>,
) => {
    const sigla = String(materia.sigla || materia.codigoMateria || materia.materia || '').trim().toUpperCase();
    if (sigla && materiasPorCodigo?.has(sigla)) {
        return materiasPorCodigo.get(sigla)!;
    }
    return String(materia.nombre || materia.nombreMateria || 'Sin nombre').trim();
};

const esGrupoAprobado = (grupo: GrupoMateriaDocencia) => (grupo.estadoAprobacion || 'aprobado') === 'aprobado';

const obtenerEtiquetaSubgrupo = (subgrupo: SubgrupoPrestamoDocencia) => {
    return subgrupo.codigo;
};

const DocentesDocente = ({ onNavegar, onCerrarSesion, vistaDocente = 'estudiantes' }: PropsPaginaDocentes) => {
    const { estudiantes, materias } = useInventario();
    const { confirmar } = useConfirmacion();
    const materiasPorCodigo = useMemo(() => {
        const mapa = new Map<string, string>();
        for (const m of materias || []) {
            if (m.nombre && m.codigo) {
                mapa.set(m.codigo.trim().toUpperCase(), m.nombre.trim());
            }
        }
        return mapa;
    }, [materias]);

    const [grupos, setGrupos] = useState<GrupoMateriaDocencia[]>([]);
    const [grupoDetalleId, setGrupoDetalleId] = useState<string | null>(null);
    const [maxEstudiantesInput, setMaxEstudiantesInput] = useState<string | number>('3');
    const [guardandoMaxEstudiantes, setGuardandoMaxEstudiantes] = useState(false);
    const [materiasAsignadas, setMateriasAsignadas] = useState<Array<{ codigo: string; nombre?: string | null }>>([]);
    const [cargando, setCargando] = useState(false);
    const [creandoGrupoMateria, setCreandoGrupoMateria] = useState<string | null>(null);
    const [codigoGrupoPorMateria, setCodigoGrupoPorMateria] = useState<Record<string, string>>({});

    const [configForm, setConfigForm] = useState({ codigoInscripcion: '' });
    const [guardandoConfig, setGuardandoConfig] = useState(false);

    const [subgruposPorGrupo, setSubgruposPorGrupo] = useState<Record<string, SubgrupoPrestamoDocencia[]>>({});
    const [cargandoSubgruposPorGrupo, setCargandoSubgruposPorGrupo] = useState<Record<string, boolean>>({});
    const [tabMateriasDocente, setTabMateriasDocente] = useState<'activos' | 'inactivos' | 'solicitados' | 'rechazados'>('activos');
    const [busquedaDocente, setBusquedaDocente] = useState('');
    const [dialogoSolicitudAbierto, setDialogoSolicitudAbierto] = useState(false);
    const [solicitudGrupoForm, setSolicitudGrupoForm] = useState({ codigoMateria: '', codigoGrupo: '' });
    const [dialogoSubgrupoGrupo, setDialogoSubgrupoGrupo] = useState<GrupoMateriaDocencia | null>(null);
    const [subTabDetalle, setSubTabDetalle] = useState<'subgrupos' | 'estudiantes' | 'configuracion'>('subgrupos');
    const [subgrupoForm, setSubgrupoForm] = useState({
        codigo: '',
        estudianteIds: [] as number[],
        responsableEstudianteId: '',
    });

    const gestionActual = String(new Date().getFullYear());

    const estudiantesConId = useMemo(
        () => estudiantes.filter((e) => e.id != null && String(e.id).trim() !== ''),
        [estudiantes],
    );

    const estudiantesPorId = useMemo(() => {
        const map = new Map<number, (typeof estudiantesConId)[number]>();
        for (const e of estudiantesConId) {
            const idNum = Number(e.id);
            if (Number.isFinite(idNum)) map.set(idNum, e);
        }
        return map;
    }, [estudiantesConId]);

    const materiasAsignadasNormalizadas = useMemo(() => {
        const normalizadas = new Map<string, { codigo: string; nombre: string }>();
        for (const materia of materiasAsignadas) {
            const codigo = String(materia.codigo || '').trim().toUpperCase();
            if (!codigo) continue;
            const nombre = String(materia.nombre || '').trim();
            if (!normalizadas.has(codigo)) {
                normalizadas.set(codigo, {
                    codigo,
                    nombre: nombre || 'Sin nombre',
                });
            }
        }
        return Array.from(normalizadas.values()).sort((a, b) => a.codigo.localeCompare(b.codigo));
    }, [materiasAsignadas]);
    const codigosAsignados = useMemo(() => {
        return new Set(materiasAsignadasNormalizadas.map((materia) => materia.codigo));
    }, [materiasAsignadasNormalizadas]);

    const gruposAsignados = useMemo(() => {
        return grupos.filter((grupo) => codigosAsignados.has(obtenerCodigoMateria(grupo)));
    }, [codigosAsignados, grupos]);

    const gruposActivos = useMemo(() => {
        return gruposAsignados.filter((g) => {
            if ((g.estadoAprobacion || 'aprobado') !== 'aprobado') return false;
            return g.activo !== false;
        });
    }, [gruposAsignados]);

    const gruposInactivos = useMemo(() => {
        return gruposAsignados.filter((g) => {
            if ((g.estadoAprobacion || 'aprobado') !== 'aprobado') return false;
            return g.activo === false;
        });
    }, [gruposAsignados]);

    const gruposSolicitados = useMemo(() => {
        return gruposAsignados.filter((g) => (g.estadoAprobacion || 'aprobado') === 'pendiente');
    }, [gruposAsignados]);

    const gruposRechazados = useMemo(() => {
        return gruposAsignados.filter((g) => (g.estadoAprobacion || 'aprobado') === 'rechazado');
    }, [gruposAsignados]);

    const filtrarGruposDocente = (lista: GrupoMateriaDocencia[]) => {
        const termino = busquedaDocente.trim().toLowerCase();
        if (termino === '') return lista;
        return lista.filter((grupo) => {
            const sigla = obtenerCodigoMateria(grupo).toLowerCase();
            const nombreMateria = obtenerNombreMateria(grupo, materiasPorCodigo).toLowerCase();
            const codigoGrupo = String(grupo.grupo || grupo.nombreGrupo || '').toLowerCase();

            return sigla.includes(termino)
                || nombreMateria.includes(termino)
                || codigoGrupo.includes(termino);
        });
    };

    const activosFiltrados = useMemo(() => filtrarGruposDocente(gruposActivos), [busquedaDocente, gruposActivos]);
    const inactivosFiltrados = useMemo(() => filtrarGruposDocente(gruposInactivos), [busquedaDocente, gruposInactivos]);
    const solicitadosFiltrados = useMemo(() => {
        return filtrarGruposDocente(gruposSolicitados).sort((a, b) => {
            const fechaA = new Date(String(a.createdAt ?? '')).getTime();
            const fechaB = new Date(String(b.createdAt ?? '')).getTime();
            return fechaB - fechaA;
        });
    }, [busquedaDocente, gruposSolicitados]);
    const rechazadosFiltrados = useMemo(() => {
        return filtrarGruposDocente(gruposRechazados).sort((a, b) => {
            const fechaA = new Date(String(a.createdAt ?? '')).getTime();
            const fechaB = new Date(String(b.createdAt ?? '')).getTime();
            return fechaB - fechaA;
        });
    }, [busquedaDocente, gruposRechazados]);

    const gruposVigentesAprobadosAsignados = gruposActivos;

    const subgruposPorEstudianteEnGrupo = useMemo(() => {
        const map = new Map<string, Map<number, SubgrupoPrestamoDocencia[]>>();

        for (const grupo of gruposVigentesAprobadosAsignados) {
            const estudianteMap = new Map<number, SubgrupoPrestamoDocencia[]>();
            const subgrupos = subgruposPorGrupo[grupo.id] ?? [];

            for (const sg of subgrupos) {
                const sgEstudianteIds = sg.estudianteIds ?? [];
                for (const estId of sgEstudianteIds) {
                    const list = estudianteMap.get(estId) ?? [];
                    list.push(sg);
                    estudianteMap.set(estId, list);
                }
            }
            map.set(grupo.id, estudianteMap);
        }

        return map;
    }, [gruposVigentesAprobadosAsignados, subgruposPorGrupo]);

    const estudiantesPorMateria = useMemo(() => {
        return gruposVigentesAprobadosAsignados.map((grupo) => {
            const estudianteIds = grupo.estudianteIds ?? [];
            const estudiantesMateriaDesglosados: Array<{
                id: number;
                estudiante: Estudiante | null;
                carreraUnica: string;
                cuUnica: string;
                keyUnica: string;
            }> = [];

            for (const estudianteId of estudianteIds) {
                const estudianteObj = estudiantesPorId.get(estudianteId) ?? null;
                if (estudianteObj) {
                    const asignacionesTodas = estudianteObj.asignacionesCarrera?.length
                        ? estudianteObj.asignacionesCarrera
                        : [{ carrera: estudianteObj.carrera, cu: estudianteObj.cu ?? '' }];
                    
                    const asignaciones = grupo.carrerasPorEstudiante?.[estudianteId]
                        ? asignacionesTodas.filter((asig: any) => grupo.carrerasPorEstudiante?.[estudianteId]?.includes(asig.carrera))
                        : asignacionesTodas;

                    for (const asig of asignaciones) {
                        estudiantesMateriaDesglosados.push({
                            id: estudianteId,
                            estudiante: estudianteObj,
                            carreraUnica: asig.carrera,
                            cuUnica: asig.cu,
                            keyUnica: `${grupo.id}-${estudianteId}-${asig.carrera}-${asig.cu}`,
                        });
                    }
                } else {
                    estudiantesMateriaDesglosados.push({
                        id: estudianteId,
                        estudiante: null,
                        carreraUnica: 'Sin carrera',
                        cuUnica: '',
                        keyUnica: `${grupo.id}-${estudianteId}-sin-carrera`,
                    });
                }
            }

            estudiantesMateriaDesglosados.sort((a, b) => {
                const nombreA = a.estudiante ? `${a.estudiante.apellido} ${a.estudiante.nombre}` : String(a.id);
                const nombreB = b.estudiante ? `${b.estudiante.apellido} ${b.estudiante.nombre}` : String(b.id);
                return nombreA.localeCompare(nombreB);
            });

            return {
                id: grupo.id,
                codigo: obtenerCodigoMateria(grupo),
                nombre: obtenerNombreMateria(grupo, materiasPorCodigo),
                grupo: grupo.grupo || grupo.nombreGrupo || 'Sin grupo',
                gestion: grupo.gestion,
                estudiantes: estudiantesMateriaDesglosados.map((fila) => ({
                    ...fila,
                    subgrupos: subgruposPorEstudianteEnGrupo.get(grupo.id)?.get(fila.id) ?? [],
                })),
            };
        });
    }, [estudiantesPorId, gruposVigentesAprobadosAsignados, subgruposPorEstudianteEnGrupo, materiasPorCodigo]);

    const grupoDetalle = useMemo(() => {
        return grupos.find((g) => g.id === grupoDetalleId) ?? null;
    }, [grupos, grupoDetalleId]);

    const { ejecutar: quitarEstudiante, estaEjecutando: quitandoEstudiante } = useAccionSegura({
        accion: async (estudianteId: number, nombreCompleto: string, carrera?: string) => {
            const descripcionConfirmacion = carrera
                ? `¿Deseas quitar a ${nombreCompleto} de la carrera ${carrera} en esta materia?`
                : `¿Deseas quitar a ${nombreCompleto} de esta materia? Esto también lo removerá de cualquier grupo de préstamo en esta materia.`;
            const ok = await confirmar({
                titulo: 'Quitar estudiante',
                descripcion: descripcionConfirmacion,
                textoConfirmar: 'Quitar',
                textoCancelar: 'Cancelar',
                varianteConfirmar: 'destructive',
            });
            if (!ok) return;
            await desinscribirEstudianteMateria(grupoDetalle!.id, estudianteId, carrera);
        },
        mensajeExito: 'Estudiante removido de la materia.',
        alExito: () => {
            void recargar();
        }
    });

    const { ejecutar: quitarTodosEstudiantes, estaEjecutando: quitandoTodosEstudiantes } = useAccionSegura({
        accion: async () => {
            const ok = await confirmar({
                titulo: 'Quitar todos los estudiantes',
                descripcion: '¿Deseas desmatricular a todos los estudiantes de esta materia? Esto también eliminará todos los subgrupos de préstamo creados. Esta acción es irreversible.',
                textoConfirmar: 'Quitar todos',
                textoCancelar: 'Cancelar',
                varianteConfirmar: 'destructive',
            });
            if (!ok) return;
            await desinscribirTodosEstudiantesMateria(grupoDetalle!.id);
        },
        mensajeExito: 'Todos los estudiantes fueron removidos de la materia.',
        alExito: () => {
            void recargar();
        }
    });

    const { ejecutar: togglePermitirInscripcion, estaEjecutando: guardandoPermitirInscripcion } = useAccionSegura({
        accion: async (permitir: boolean) => {
            if (!grupoDetalle) return;
            const ok = await confirmar({
                titulo: permitir ? 'Habilitar inscripciones' : 'Deshabilitar inscripciones',
                descripcion: permitir
                    ? '¿Estás seguro de que deseas permitir nuevas inscripciones? Los estudiantes podrán matricularse usando el código.'
                    : '¿Estás seguro de que deseas deshabilitar las nuevas inscripciones? Los estudiantes ya no podrán matricularse.',
                textoConfirmar: permitir ? 'Habilitar' : 'Deshabilitar',
                textoCancelar: 'Cancelar',
                varianteConfirmar: permitir ? 'default' : 'destructive',
            });
            if (!ok) return;
            await editarGrupoDocencia(grupoDetalle.id, { permitirInscripcion: permitir });
        },
        mensajeExito: 'Configuración de inscripción actualizada correctamente.',
        alExito: () => {
            void recargar();
        }
    });

    const resumenInscritos = useMemo(() => {
        if (!grupoDetalle) return { total: 0, conGrupo: 0, sinGrupo: 0, porcentaje: 0 };
        const estudiantesMateria = estudiantesPorMateria.find((em: any) => em.id === grupoDetalle.id)?.estudiantes ?? [];
        const total = estudiantesMateria.length;
        const conGrupo = estudiantesMateria.filter((e: any) => e.subgrupos && e.subgrupos.length > 0).length;
        const sinGrupo = total - conGrupo;
        const porcentaje = total > 0 ? Math.round((conGrupo / total) * 100) : 0;
        return { total, conGrupo, sinGrupo, porcentaje };
    }, [grupoDetalle, estudiantesPorMateria]);

    const volverASolicitarGrupo = async (grupo: GrupoMateriaDocencia) => {
        try {
            await editarGrupoDocencia(grupo.id, {});
            toast.success('El grupo ha sido solicitado nuevamente.');
            await recargar();
        } catch (err: any) {
            toast.error(err?.message ?? 'No se pudo volver a solicitar el grupo.');
        }
    };

    const totalEstudiantesAsignados = useMemo(() => {
        const ids = new Set<number>();
        for (const materia of estudiantesPorMateria) {
            for (const estudiante of materia.estudiantes) {
                if (Number.isFinite(estudiante.id)) ids.add(estudiante.id);
            }
        }
        return ids.size;
    }, [estudiantesPorMateria]);

    const recargar = async () => {
        try {
            setCargando(true);
            const [g, asignadas] = await Promise.all([
                listarGruposDocencia(),
                listarMateriasAsignadasDocencia(),
            ]);
            setGrupos(g);
            setMateriasAsignadas(asignadas);

            const codigosAsignadosActuales = new Set(
                asignadas
                    .map((materia) => String(materia.codigo || '').trim().toUpperCase())
                    .filter(Boolean),
            );

            const subgruposEntradas = await Promise.all(
                g
                    .filter((grupo) => esGrupoAprobado(grupo) && codigosAsignadosActuales.has(obtenerCodigoMateria(grupo)))
                    .map(async (grupo) => {
                        try {
                            const subgrupos = await listarSubgruposPrestamoDocencia(grupo.id);
                            return [grupo.id, subgrupos] as const;
                        } catch {
                            return [grupo.id, []] as const;
                        }
                    }),
            );

            setSubgruposPorGrupo(Object.fromEntries(subgruposEntradas));
        } catch (err: any) {
            toast.error(err?.message ?? 'No se pudo cargar Docencia.');
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => {
        void recargar();
    }, []);

    useEffect(() => {
        if (grupoDetalle) {
            setConfigForm({
                codigoInscripcion: grupoDetalle.codigoInscripcion || '',
            });
        }
    }, [grupoDetalle]);

    const cargarSubgrupos = async (grupoId: string) => {
        setCargandoSubgruposPorGrupo((prev) => ({ ...prev, [grupoId]: true }));
        try {
            const data = await listarSubgruposPrestamoDocencia(grupoId);
            setSubgruposPorGrupo((prev) => ({ ...prev, [grupoId]: data }));
        } catch (err: any) {
            toast.error(err?.message ?? 'No se pudieron cargar los subgrupos.');
        } finally {
            setCargandoSubgruposPorGrupo((prev) => ({ ...prev, [grupoId]: false }));
        }
    };

    const crearSolicitudGrupo = async (codigoMateria: string, nombreMateria: string, codigoGrupoForzado?: string) => {
        const codigoGrupo = String(codigoGrupoForzado ?? codigoGrupoPorMateria[codigoMateria] ?? '').trim().toUpperCase();
        if (!codigoGrupo) {
            toast.error('Ingresa el codigo del grupo. Ejemplo: A, 1 o B2.');
            return;
        }

        setCreandoGrupoMateria(codigoMateria);
        try {
            const ahora = new Date();
            const anio = Number(gestionActual);
            const inicioGestion = new Date(Date.UTC(anio, 0, 1));
            const finGestion = new Date(Date.UTC(anio, 11, 31, 23, 59, 59));
            const finInscripcion = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);

            await crearGrupoDocencia({
                sigla: codigoMateria,
                nombre: nombreMateria,
                descripcion: `Grupo ${codigoGrupo} de ${nombreMateria}`,
                gestion: gestionActual,
                fechaInicioInscripcion: ahora.toISOString(),
                fechaFinInscripcion: finInscripcion.toISOString(),
                fechaInicioGestion: inicioGestion.toISOString(),
                fechaFinGestion: finGestion.toISOString(),
                grupo: codigoGrupo,
                estudianteIds: [],
            });

            setCodigoGrupoPorMateria((prev) => ({ ...prev, [codigoMateria]: '' }));
            toast.success('Solicitud de grupo enviada. Espera la aprobacion del administrador.');
            await recargar();
        } catch (err: any) {
            toast.error(err?.message ?? 'No se pudo crear la solicitud de grupo.');
        } finally {
            setCreandoGrupoMateria(null);
        }
    };

    const abrirDialogoSolicitud = () => {
        setSolicitudGrupoForm((prev) => ({
            codigoMateria: prev.codigoMateria || materiasAsignadasNormalizadas[0]?.codigo || '',
            codigoGrupo: '',
        }));
        setDialogoSolicitudAbierto(true);
    };

    const cerrarDialogoSolicitud = () => {
        setDialogoSolicitudAbierto(false);
        setSolicitudGrupoForm({ codigoMateria: '', codigoGrupo: '' });
    };

    const enviarSolicitudGrupoDesdeDialogo = async () => {
        const codigoMateria = String(solicitudGrupoForm.codigoMateria ?? '').trim().toUpperCase();
        const codigoGrupo = String(solicitudGrupoForm.codigoGrupo ?? '').trim().toUpperCase();
        const materia = materiasAsignadasNormalizadas.find((item) => item.codigo === codigoMateria);

        if (!materia) {
            toast.error('Selecciona una materia asignada válida.');
            return;
        }

        await crearSolicitudGrupo(codigoMateria, materia.nombre, codigoGrupo);
        cerrarDialogoSolicitud();
    };

    const guardarConfiguracionInscripcion = async () => {
        const targetGrupo = grupoDetalle;
        if (!targetGrupo) return;

        const code = configForm.codigoInscripcion.trim().toUpperCase();
        if (code && code.length < 4) {
            toast.error('El código de inscripción debe tener al menos 4 caracteres.');
            return;
        }
        if (code && !/^[A-Z0-9]+$/.test(code)) {
            toast.error('El código de inscripción debe ser alfanumérico (solo letras y números).');
            return;
        }

        const ahora = new Date();
        const inicioDate = targetGrupo.fechaInicioInscripcion ? new Date(targetGrupo.fechaInicioInscripcion) : ahora;
        const inicioStr = (inicioDate.getTime() < ahora.getTime() ? inicioDate : ahora).toISOString();

        const finDate = new Date();
        finDate.setFullYear(finDate.getFullYear() + 10);
        const finStr = finDate.toISOString();

        setGuardandoConfig(true);
        try {
            await editarGrupoDocencia(targetGrupo.id, {
                codigoInscripcion: code || undefined,
                fechaInicioInscripcion: inicioStr,
                fechaFinInscripcion: finStr,
            });
            toast.success('Configuración de inscripción guardada correctamente.');
            await recargar();
        } catch (err: any) {
            toast.error(err?.message ?? 'No se pudo guardar la configuración de inscripción.');
        } finally {
            setGuardandoConfig(false);
        }
    };

    const abrirDialogoSubgrupo = (grupo: GrupoMateriaDocencia) => {
        setDialogoSubgrupoGrupo(grupo);
        setSubgrupoForm({
            codigo: '',
            estudianteIds: [],
            responsableEstudianteId: '',
        });
    };

    const cerrarDialogoSubgrupo = () => {
        setDialogoSubgrupoGrupo(null);
        setSubgrupoForm({
            codigo: '',
            estudianteIds: [],
            responsableEstudianteId: '',
        });
    };

    const crearSubgrupoDesdeDialogo = async () => {
        if (!dialogoSubgrupoGrupo) return;

        const codigo = subgrupoForm.codigo.trim().toUpperCase();
        const responsableEstudianteId = Number(subgrupoForm.responsableEstudianteId);

        if (!codigo) {
            toast.error('Ingresa el código del grupo de préstamo.');
            return;
        }

        if (subgrupoForm.estudianteIds.length < 1) {
            toast.error('Selecciona al menos un estudiante para el grupo de préstamo.');
            return;
        }

        const maxPorGrupo = dialogoSubgrupoGrupo.maxEstudiantesGrupo ?? 3;
        if (subgrupoForm.estudianteIds.length > maxPorGrupo) {
            toast.error(`El grupo de préstamo no puede tener más de ${maxPorGrupo} estudiantes.`);
            return;
        }

        if (!Number.isInteger(responsableEstudianteId) || responsableEstudianteId <= 0) {
            toast.error('Selecciona al estudiante responsable.');
            return;
        }

        try {
            await crearSubgrupoPrestamoDocencia(dialogoSubgrupoGrupo.id, {
                codigo,
                estudianteIds: subgrupoForm.estudianteIds,
                responsableEstudianteId,
            });

            toast.success('Grupo de préstamo creado.');
            await cargarSubgrupos(dialogoSubgrupoGrupo.id);
            cerrarDialogoSubgrupo();
        } catch (err: any) {
            toast.error(err?.message ?? 'No se pudo crear el grupo de préstamo.');
        }
    };

    const eliminarSubgrupo = async (grupoId: string, subgrupoId: string) => {
        const ok = await confirmar({
            titulo: 'Eliminar subgrupo',
            descripcion: 'Deseas eliminar este subgrupo de prestamo?',
            textoConfirmar: 'Eliminar',
            textoCancelar: 'Cancelar',
            varianteConfirmar: 'destructive',
        });

        if (!ok) return;

        try {
            await eliminarSubgrupoPrestamoDocencia(grupoId, subgrupoId);
            toast.success('Subgrupo eliminado.');
            await cargarSubgrupos(grupoId);
        } catch (err: any) {
            toast.error(err?.message ?? 'No se pudo eliminar el subgrupo.');
        }
    };

    const guardarLimiteEstudiantes = async (grupo: GrupoMateriaDocencia) => {
        const limite = Number(maxEstudiantesInput);
        if (!Number.isInteger(limite) || limite < 1) {
            toast.error('El límite debe ser un número entero mayor o igual a 1.');
            return;
        }

        setGuardandoMaxEstudiantes(true);
        try {
            await editarGrupoDocencia(grupo.id, { maxEstudiantesGrupo: limite });
            toast.success(`Límite de estudiantes por grupo actualizado a ${limite}.`);
            await recargar();
        } catch (err: any) {
            toast.error(err?.message ?? 'No se pudo actualizar el límite.');
        } finally {
            setGuardandoMaxEstudiantes(false);
        }
    };

    const lanzarGeneracionAlAzar = async (grupoId: string) => {
        const ok = await confirmar({
            titulo: 'Generar grupos al azar',
            descripcion: 'Esta acción eliminará todos los subgrupos actuales de esta materia y creará otros nuevos basados en los alumnos inscritos de manera aleatoria. ¿Deseas continuar?',
            textoConfirmar: 'Generar',
            textoCancelar: 'Cancelar',
        });
        if (!ok) return;

        setCargando(true);
        try {
            await generarSubgruposAlAzarDocencia(grupoId);
            toast.success('Grupos de préstamo generados aleatoriamente.');
            await recargar();
            await cargarSubgrupos(grupoId);
        } catch (err: any) {
            toast.error(err?.message ?? 'No se pudieron generar los grupos al azar.');
        } finally {
            setCargando(false);
        }
    };

    const limpiarTodosSubgrupos = async (grupoId: string) => {
        const ok = await confirmar({
            titulo: 'Limpiar todos los subgrupos',
            descripcion: '¿Deseas eliminar todos los subgrupos de préstamo de esta materia? Esta acción no se puede deshacer.',
            textoConfirmar: 'Limpiar',
            textoCancelar: 'Cancelar',
            varianteConfirmar: 'destructive',
        });
        if (!ok) return;

        setCargando(true);
        try {
            await eliminarTodosSubgruposPrestamoDocencia(grupoId);
            toast.success('Todos los subgrupos han sido eliminados.');
            await recargar();
            await cargarSubgrupos(grupoId);
        } catch (err: any) {
            toast.error(err?.message ?? 'No se pudieron eliminar los subgrupos.');
        } finally {
            setCargando(false);
        }
    };

    const paginaActivaDocente: PaginaApp = vistaDocente === 'materias' ? 'mis-materias' : 'mis-estudiantes';

    return (
        <LayoutPagina
            paginaActiva={paginaActivaDocente}
            titulo="Panel docente"
            subtitulo={`${materiasAsignadasNormalizadas.length} materia(s) asignada(s) - ${totalEstudiantesAsignados} estudiante(s) en grupos activos`}
            onNavegar={onNavegar}
            onCerrarSesion={onCerrarSesion}
        >

            {vistaDocente === 'estudiantes' && (
                <div className="rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                    <div className="border-b border-slate-200 px-4 py-3 dark:border-slate-800">
                        <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-100">
                            <GraduationCap className="h-4 w-4" />
                            Mis estudiantes por materia
                            <span className="ml-2 text-xs font-normal text-slate-400">({cargando ? 'Cargando...' : `${estudiantesPorMateria.length} materia(s) vigente(s)`})</span>
                        </h2>
                    </div>
                    <div className="space-y-4 p-4">
                        {cargando ? (
                            Array.from({ length: 2 }).map((_, idx) => (
                                <div key={idx} className="rounded-lg border border-slate-200 dark:border-slate-800">
                                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-800/50">
                                        <Skeleton className="h-4 w-48" />
                                        <Skeleton className="h-4 w-32" />
                                    </div>
                                    <div className="p-4 space-y-3">
                                        <Skeleton className="h-4 w-full" />
                                        <Skeleton className="h-4 w-11/12" />
                                        <Skeleton className="h-4 w-4/5" />
                                    </div>
                                </div>
                            ))
                        ) : (
                            <>
                                {estudiantesPorMateria.map((materia: any) => (
                                    <div key={materia.id} className="rounded-lg border border-slate-200 dark:border-slate-800">
                                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-slate-50 px-4 py-2.5 text-xs dark:border-slate-800 dark:bg-slate-800/50">
                                            <div className="font-semibold text-slate-700 dark:text-slate-200">
                                                {materia.codigo || '-'} - {materia.nombre}
                                            </div>
                                            <div className="text-slate-500 dark:text-slate-400">
                                                Grupo {materia.grupo}
                                            </div>
                                        </div>

                                        <div className="overflow-x-auto">
                                            <table className="w-full text-xs">
                                                <thead>
                                                    <tr className="border-b border-slate-100 dark:border-slate-800">
                                                        <th className="px-4 py-2 text-left font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Carnet</th>
                                                        <th className="px-4 py-2 text-left font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Estudiante</th>
                                                        <th className="px-4 py-2 text-left font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Carrera</th>
                                                        <th className="px-4 py-2 text-left font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Grupo de prestamo</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                                    {materia.estudiantes.map((fila: any) => (
                                                        <tr key={fila.keyUnica} className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/40">
                                                            <td className="px-4 py-2 text-slate-700 dark:text-slate-300">{fila.cuUnica || fila.estudiante?.carnet || fila.id}</td>
                                                            <td className="px-4 py-2 text-slate-700 dark:text-slate-300">
                                                                {fila.estudiante ? `${fila.estudiante.apellido}, ${fila.estudiante.nombre}` : `ID ${fila.id}`}
                                                            </td>
                                                            <td className="px-4 py-2 text-slate-700 dark:text-slate-300">{fila.carreraUnica || '-'}</td>
                                                            <td className="px-4 py-2 text-slate-700 dark:text-slate-300">
                                                                {fila.subgrupos.length > 0
                                                                    ? fila.subgrupos
                                                                        .map((subgrupo: SubgrupoPrestamoDocencia) => {
                                                                            const etiqueta = obtenerEtiquetaSubgrupo(subgrupo);
                                                                            return subgrupo.responsableEstudianteId === fila.id ? `${etiqueta} (responsable)` : etiqueta;
                                                                        })
                                                                        .join(' · ')
                                                                    : '—'}
                                                            </td>
                                                        </tr>
                                                    ))}

                                                    {materia.estudiantes.length === 0 && (
                                                        <tr>
                                                            <td colSpan={4} className="px-4 py-3 text-center text-slate-500 dark:text-slate-400">
                                                                Esta materia aun no tiene estudiantes inscritos.
                                                            </td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                ))}

                                {estudiantesPorMateria.length === 0 && (
                                    <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-center text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400">
                                        {materiasAsignadasNormalizadas.length === 0
                                            ? 'No tienes materias asignadas por administracion todavia.'
                                            : 'No hay grupos aprobados y activos con estudiantes inscritos.'}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            )}
            {vistaDocente === 'materias' && (
                grupoDetalleId && grupoDetalle ? (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-5 dark:border-slate-800">
                            <Boton
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setGrupoDetalleId(null)}
                                className="flex items-center gap-1.5 rounded-lg border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/80 transition-all text-xs font-semibold shrink-0"
                            >
                                <ArrowLeft className="h-3.5 w-3.5" />
                                Volver
                            </Boton>
                            
                            <div className="flex-1 flex flex-wrap items-center justify-center gap-3 text-center">
                                <h2 className="text-xl font-bold tracking-tight text-slate-950 dark:text-slate-100 flex items-center gap-2">
                                    <GraduationCap className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                                    {obtenerCodigoMateria(grupoDetalle)} - {obtenerNombreMateria(grupoDetalle, materiasPorCodigo)}
                                </h2>
                                <span className="text-xs bg-indigo-50 text-indigo-755 dark:bg-indigo-950/50 dark:text-indigo-400 px-2.5 py-0.5 rounded-lg font-semibold border border-indigo-100/30">
                                    Grupo {grupoDetalle.grupo || grupoDetalle.nombreGrupo || '-'}
                                </span>
                            </div>
                            <div className="w-[88px] shrink-0 pointer-events-none opacity-0 hidden sm:block" aria-hidden="true" />
                        </div>
                        <Tabs value={subTabDetalle} onValueChange={(val) => setSubTabDetalle(val as any)}>
                            <TabsList className="flex gap-1.5 p-1 rounded-xl bg-slate-100/65 dark:bg-slate-800/40 justify-start h-auto w-fit mb-5">
                                <TabsTrigger value="subgrupos" className="gap-2 text-sm font-semibold px-5 py-2.5 rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950 transition-all">
                                    <Users className="h-4 w-4 text-indigo-500" />
                                    Grupos de Préstamo ({(subgruposPorGrupo[grupoDetalle.id] ?? []).length})
                                </TabsTrigger>
                                <TabsTrigger value="estudiantes" className="gap-2 text-sm font-semibold px-5 py-2.5 rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950 transition-all">
                                    <GraduationCap className="h-4 w-4 text-emerald-500" />
                                    Estudiantes Inscritos ({(estudiantesPorMateria.find((em: any) => em.id === grupoDetalle.id)?.estudiantes ?? []).length})
                                </TabsTrigger>
                                <TabsTrigger value="configuracion" className="gap-2 text-sm font-semibold px-5 py-2.5 rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950 transition-all">
                                    <Settings className="h-4 w-4 text-amber-500" />
                                    Configuración y Autoinscripción
                                </TabsTrigger>
                            </TabsList>
                            <TabsContent value="subgrupos" className="space-y-6">
                                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                                    <h3 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-4">
                                        <Users className="h-3.5 w-3.5" />
                                        Gestión de Grupos de Préstamo
                                    </h3>
                                    <div className="flex flex-wrap gap-2.5">
                                        <Boton
                                            type="button"
                                            size="sm"
                                            onClick={() => lanzarGeneracionAlAzar(grupoDetalle.id)}
                                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold h-9 px-4 text-xs rounded-xl shadow-sm hover:shadow transition-all"
                                        >
                                            <Plus className="mr-1 h-3.5 w-3.5" />
                                            Generar al azar
                                        </Boton>
                                        <Boton
                                            type="button"
                                            size="sm"
                                            variant="outline"
                                            onClick={() => abrirDialogoSubgrupo(grupoDetalle)}
                                            className="font-semibold h-9 px-4 text-xs rounded-xl border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800"
                                        >
                                            <Plus className="mr-1 h-3.5 w-3.5" />
                                            Crear grupo manualmente
                                        </Boton>
                                        <Boton
                                            type="button"
                                            size="sm"
                                            variant="destructive"
                                            onClick={() => limpiarTodosSubgrupos(grupoDetalle.id)}
                                            className="font-semibold h-9 px-4 text-xs rounded-xl hover:bg-red-700"
                                        >
                                            <Trash2 className="mr-1 h-3.5 w-3.5" />
                                            Limpiar existentes
                                        </Boton>
                                    </div>
                                    <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-3.5">
                                        <strong>Generar al azar</strong> mezclará de forma aleatoria a todos los estudiantes inscritos en bloques no mayores a {grupoDetalle.maxEstudiantesGrupo ?? 3}. 
                                        <strong>Limpiar existentes</strong> eliminará de forma irreversible todos los grupos de préstamo definidos en esta materia.
                                    </p>
                                </div>

                                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                                    <h3 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-4">
                                        <Users className="h-3.5 w-3.5" />
                                        Grupos de Préstamo Definidos ({subgruposPorGrupo[grupoDetalle.id]?.length ?? 0})
                                    </h3>

                                    {cargandoSubgruposPorGrupo[grupoDetalle.id] ? (
                                        <div className="py-8 text-center text-xs text-slate-500">Cargando subgrupos...</div>
                                    ) : (subgruposPorGrupo[grupoDetalle.id] ?? []).length === 0 ? (
                                        <div className="py-8 text-center text-xs text-slate-500 border border-dashed border-slate-200 rounded-xl dark:border-slate-800">
                                            No se han definido grupos de préstamo para esta materia aún. Genera grupos al azar o crea uno manualmente.
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                            {(subgruposPorGrupo[grupoDetalle.id] ?? []).map((subgrupo) => {
                                                const responsableEst = subgrupo.responsableEstudianteId ? estudiantesPorId.get(Number(subgrupo.responsableEstudianteId)) : undefined;
                                                const integrantes = (subgrupo.estudianteIds ?? []).map(id => estudiantesPorId.get(id)).filter(Boolean);

                                                return (
                                                    <div key={subgrupo.id} className="relative rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-955 flex flex-col justify-between">
                                                        <button
                                                            type="button"
                                                            onClick={() => eliminarSubgrupo(grupoDetalle.id, subgrupo.id)}
                                                            className="absolute top-3 right-3 text-slate-400 hover:text-red-500 transition-colors"
                                                            title="Eliminar grupo de préstamo"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>

                                                        <div className="space-y-3 flex-grow">
                                                            <div>
                                                                <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1">
                                                                    <span className="bg-indigo-100 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-400 px-2 py-0.5 rounded text-[10px] font-mono">
                                                                        {subgrupo.codigo}
                                                                    </span>
                                                                </h4>
                                                            </div>

                                                            <div className="space-y-1.5">
                                                                <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Responsable / Líder:</div>
                                                                <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                                                                    {responsableEst ? `[${responsableEst.carnet}] ${responsableEst.apellido}, ${responsableEst.nombre}` : `ID ${subgrupo.responsableEstudianteId}`}
                                                                </div>
                                                            </div>

                                                            <div className="space-y-1.5">
                                                                <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                                                                    Compañeros ({integrantes.length} de {grupoDetalle.maxEstudiantesGrupo ?? 3}):
                                                                </div>
                                                                <ul className="text-xs space-y-1 text-slate-600 dark:text-slate-400">
                                                                    {integrantes.map(est => {
                                                                        if (!est) return null;
                                                                        const esResp = est.id === subgrupo.responsableEstudianteId;
                                                                        return (
                                                                            <li key={est.id} className={`flex items-center gap-1.5 ${esResp ? 'font-semibold text-slate-800 dark:text-slate-200' : ''}`}>
                                                                                <span className="h-1.5 w-1.5 rounded-full bg-slate-300 dark:bg-slate-700"></span>
                                                                                <span>[{est.carnet}] {est.apellido}, {est.nombre}</span>
                                                                                {esResp && <span className="text-[9px] bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 px-1 rounded font-normal">Líder</span>}
                                                                            </li>
                                                                        );
                                                                    })}
                                                                </ul>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </TabsContent>
                            <TabsContent value="estudiantes" className="space-y-4">
                                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                                    <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                                        <h3 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                            <GraduationCap className="h-3.5 w-3.5" />
                                            Estudiantes Inscritos en esta Materia ({(estudiantesPorMateria.find((em: any) => em.id === grupoDetalle.id)?.estudiantes ?? []).length})
                                        </h3>
                                        {((estudiantesPorMateria.find((em: any) => em.id === grupoDetalle.id)?.estudiantes ?? []).length > 0) && (
                                            <Boton
                                                type="button"
                                                size="sm"
                                                variant="destructive"
                                                onClick={() => void quitarTodosEstudiantes()}
                                                disabled={quitandoTodosEstudiantes}
                                                className="font-semibold h-8 px-3 text-xs rounded-lg flex items-center gap-1.5"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                                Quitar todos los estudiantes
                                            </Boton>
                                        )}
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-xs">
                                            <thead>
                                                <tr className="border-b border-slate-200 dark:border-slate-800">
                                                    <th className="px-4 py-2.5 text-left font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Carnet</th>
                                                    <th className="px-4 py-2.5 text-left font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Estudiante</th>
                                                    <th className="px-4 py-2.5 text-left font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Carrera</th>
                                                    <th className="px-4 py-2.5 text-left font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Grupo de Préstamo</th>
                                                    <th className="px-4 py-2.5 text-center font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Acciones</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                                {(estudiantesPorMateria.find((em: any) => em.id === grupoDetalle.id)?.estudiantes ?? []).map((fila: any) => (
                                                    <tr key={fila.keyUnica} className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/40">
                                                        <td className="px-4 py-2 text-slate-700 dark:text-slate-300">{fila.estudiante?.carnet || fila.id}</td>
                                                        <td className="px-4 py-2 text-slate-700 dark:text-slate-300">
                                                            {fila.estudiante ? `${fila.estudiante.apellido}, ${fila.estudiante.nombre}` : `ID ${fila.id}`}
                                                        </td>
                                                        <td className="px-4 py-2 text-slate-700 dark:text-slate-300">
                                                            <div>{fila.carreraUnica}</div>
                                                            {fila.cuUnica && (
                                                                <div className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">CU {fila.cuUnica}</div>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-2 text-slate-700 dark:text-slate-300">
                                                            {fila.subgrupos.length > 0
                                                                ? fila.subgrupos
                                                                    .map((subgrupo: SubgrupoPrestamoDocencia) => {
                                                                        const etiqueta = obtenerEtiquetaSubgrupo(subgrupo);
                                                                        return subgrupo.responsableEstudianteId === fila.id ? `${etiqueta} (responsable)` : etiqueta;
                                                                    })
                                                                    .join(' · ')
                                                                : <span className="text-slate-400 italic">Sin grupo de préstamo</span>}
                                                        </td>
                                                        <td className="px-4 py-2 text-center">
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    const nombre = fila.estudiante ? `${fila.estudiante.nombre} ${fila.estudiante.apellido}` : `ID ${fila.id}`;
                                                                    void quitarEstudiante(fila.id, nombre, fila.carreraUnica);
                                                                }}
                                                                disabled={quitandoEstudiante}
                                                                className="text-slate-400 hover:text-red-500 transition-colors p-1"
                                                                title={`Quitar estudiante de la carrera ${fila.carreraUnica}`}
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}

                                                {(estudiantesPorMateria.find((em: any) => em.id === grupoDetalle.id)?.estudiantes ?? []).length === 0 && (
                                                    <tr>
                                                        <td colSpan={5} className="px-4 py-6 text-center text-slate-500 dark:text-slate-400">
                                                            Esta materia aún no tiene estudiantes inscritos.
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </TabsContent>
                            <TabsContent value="configuracion" className="space-y-6">
                                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 md:col-span-1">
                                        <h3 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-4">
                                            <Settings className="h-3.5 w-3.5" />
                                            Límite de Alumnos
                                        </h3>
                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                                    Límite de estudiantes por grupo:
                                                </label>
                                                <div className="flex items-center gap-2">
                                                    <Input
                                                        type="number"
                                                        min={1}
                                                        max={100}
                                                        value={maxEstudiantesInput}
                                                        onChange={(e) => setMaxEstudiantesInput(e.target.value)}
                                                        className="w-20 text-center font-semibold rounded-lg h-9 text-xs"
                                                        disabled={guardandoMaxEstudiantes}
                                                    />
                                                    <Boton
                                                        type="button"
                                                        size="sm"
                                                        onClick={() => guardarLimiteEstudiantes(grupoDetalle)}
                                                        disabled={guardandoMaxEstudiantes}
                                                        className="bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:hover:bg-slate-200 dark:text-slate-950 font-semibold h-9 px-3 text-xs rounded-lg"
                                                    >
                                                        {guardandoMaxEstudiantes ? 'Guardando...' : 'Guardar'}
                                                    </Boton>
                                                </div>
                                                <p className="text-[10px] text-slate-450 dark:text-slate-500">
                                                    Este límite se aplicará al generar grupos al azar y a los subgrupos manuales creados por ti o actualizados por los líderes.
                                                </p>
                                            </div>

                                            <div className="border-t border-slate-100 dark:border-slate-800 pt-4 mt-2">
                                                <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
                                                    Resumen de Inscritos y Grupos
                                                </h4>
                                                <div className="space-y-2.5">
                                                    <div className="flex items-center justify-between text-xs">
                                                        <span className="text-slate-500">Total Alumnos:</span>
                                                        <span className="font-semibold text-slate-800 dark:text-slate-200">{resumenInscritos.total}</span>
                                                    </div>
                                                    <div className="flex items-center justify-between text-xs">
                                                        <span className="text-slate-500">Con grupo de préstamo:</span>
                                                        <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                                                            {resumenInscritos.conGrupo} alumnos
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center justify-between text-xs">
                                                        <span className="text-slate-500">Sin grupo asignado:</span>
                                                        <span className="font-semibold text-amber-600 dark:text-amber-400">
                                                            {resumenInscritos.sinGrupo} alumnos
                                                        </span>
                                                    </div>

                                                    <div className="mt-3">
                                                        <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-1">
                                                            <span>COBERTURA DE GRUPOS</span>
                                                            <span>{resumenInscritos.porcentaje}%</span>
                                                        </div>
                                                        <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                            <div 
                                                                className="h-full bg-indigo-600 dark:bg-indigo-500 transition-all duration-500" 
                                                                style={{ width: `${resumenInscritos.porcentaje}%` }} 
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 md:col-span-2">
                                        <h3 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-4">
                                            <BookMarked className="h-3.5 w-3.5 text-indigo-500" />
                                            Autoinscripción
                                        </h3>
                                        
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-900/50">
                                                <div className="space-y-1">
                                                    <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 block">
                                                        Permitir nuevas inscripciones
                                                    </span>
                                                    <span className="text-[10px] text-slate-450 dark:text-slate-400 block leading-normal">
                                                        Habilita o deshabilita la posibilidad de que nuevos estudiantes se matriculen a esta materia con el código.
                                                    </span>
                                                </div>
                                                <Switch
                                                    checked={grupoDetalle.permitirInscripcion !== false}
                                                    onCheckedChange={(checked) => void togglePermitirInscripcion(checked)}
                                                    disabled={guardandoPermitirInscripcion}
                                                />
                                            </div>
                                            <div className="space-y-4">
                                                <div className="space-y-2">
                                                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                                        Código de Autoinscripción (mín. 4 carac.)
                                                    </label>
                                                    <div className="flex flex-col sm:flex-row gap-3">
                                                        <div className="relative flex-1">
                                                            <Input
                                                                value={configForm.codigoInscripcion}
                                                                onChange={(e) => setConfigForm((prev) => ({ ...prev, codigoInscripcion: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '') }))}
                                                                placeholder="EJEMPLO: MAT101"
                                                                maxLength={20}
                                                                className="h-10 font-mono tracking-widest text-center text-sm border-slate-200 focus:border-indigo-500 rounded-lg"
                                                            />
                                                        </div>
                                                        <div className="flex gap-2 w-full sm:w-auto">
                                                            <Boton
                                                                type="button"
                                                                variant="outline"
                                                                onClick={() => {
                                                                    const code = configForm.codigoInscripcion.trim();
                                                                    if (!code) return;
                                                                    void navigator.clipboard.writeText(code)
                                                                        .then(() => toast.success('Código de inscripción copiado al portapapeles.'))
                                                                        .catch(() => toast.error('No se pudo copiar el código.'));
                                                                }}
                                                                disabled={!configForm.codigoInscripcion || configForm.codigoInscripcion.length < 4}
                                                                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 rounded-lg border-slate-200 hover:bg-slate-50 dark:border-slate-800 text-xs h-10 px-4"
                                                            >
                                                                <Copy className="h-3.5 w-3.5 text-indigo-500" />
                                                                Copiar Código
                                                            </Boton>
                                                            <Boton
                                                                type="button"
                                                                onClick={() => { void guardarConfiguracionInscripcion(); }}
                                                                disabled={guardandoConfig}
                                                                className="flex-1 sm:flex-none rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white h-10 px-5 text-xs font-semibold shadow-xs"
                                                            >
                                                                {guardandoConfig ? 'Guardando...' : 'Guardar Código'}
                                                            </Boton>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>
                        </Tabs>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <Tabs value={tabMateriasDocente} onValueChange={(value) => setTabMateriasDocente(value as any)}>
                            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                                <TabsList className="mb-0 flex gap-1 p-1 rounded-lg bg-slate-100/60 dark:bg-slate-800/40 justify-start h-auto w-fit">
                                    <TabsTrigger value="activos" className="gap-1.5 text-xs font-semibold px-3 py-1.5 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950">
                                        <BookMarked className="h-4 w-4 mr-1.5" />
                                        Activos ({gruposActivos.length})
                                    </TabsTrigger>
                                    <TabsTrigger value="inactivos" className="gap-1.5 text-xs font-semibold px-3 py-1.5 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950">
                                        <Clock className="h-4 w-4 mr-1.5" />
                                        Inactivos ({gruposInactivos.length})
                                    </TabsTrigger>
                                    <TabsTrigger value="solicitados" className="gap-1.5 text-xs font-semibold px-3 py-1.5 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950">
                                        <SendHorizonal className="h-4 w-4 mr-1.5" />
                                        Solicitados ({gruposSolicitados.length})
                                    </TabsTrigger>
                                    <TabsTrigger value="rechazados" className="gap-1.5 text-xs font-semibold px-3 py-1.5 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950">
                                        <X className="h-4 w-4 mr-1.5" />
                                        Rechazados ({gruposRechazados.length})
                                    </TabsTrigger>
                                </TabsList>

                                <div className="flex items-center gap-3 ml-auto">
                                    <div className="flex items-center gap-2">
                                        <Input
                                            placeholder="Buscar por materia, sigla o grupo..."
                                            value={busquedaDocente}
                                            onChange={(e) => setBusquedaDocente(e.target.value)}
                                            className="h-8 w-[250px] text-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                                        />
                                        {busquedaDocente && (
                                            <button
                                                onClick={() => setBusquedaDocente('')}
                                                className="text-xs text-slate-400 hover:text-slate-650 dark:hover:text-slate-200 font-semibold"
                                            >
                                                Limpiar
                                            </button>
                                        )}
                                    </div>
                                    <Boton type="button" size="sm" onClick={abrirDialogoSolicitud} disabled={materiasAsignadasNormalizadas.length === 0} className="h-8 text-xs font-semibold rounded-lg">
                                        <Plus className="mr-1 h-3.5 w-3.5" />
                                        Solicitar grupo
                                    </Boton>
                                </div>
                            </div>

                            <TabsContent value="activos" className="space-y-4">
                                <div className="rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-sm overflow-hidden">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-xs">
                                            <thead>
                                                <tr className="border-b border-slate-200 bg-slate-50/75 dark:border-slate-800 dark:bg-slate-800/50">
                                                    <th className="px-4 py-2.5 text-left font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Sigla/Código</th>
                                                    <th className="px-4 py-2.5 text-left font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Materia</th>
                                                    <th className="px-4 py-2.5 text-center font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Grupo</th>
                                                    <th className="px-4 py-2.5 text-center font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Estudiantes Inscritos</th>
                                                    <th className="px-4 py-2.5 text-center font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Acciones</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                                {activosFiltrados.map((grupo) => {
                                                    const totalEst = grupo.estudianteIds?.length ?? 0;
                                                    return (
                                                        <tr key={grupo.id} className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-850">
                                                            <td className="px-4 py-2.5 font-semibold text-slate-700 dark:text-slate-300">{obtenerCodigoMateria(grupo)}</td>
                                                            <td className="px-4 py-2.5 text-slate-700 dark:text-slate-300">{obtenerNombreMateria(grupo, materiasPorCodigo)}</td>
                                                            <td className="px-4 py-2.5 text-center font-semibold text-indigo-600 dark:text-indigo-400">Grupo {grupo.grupo || grupo.nombreGrupo || '-'}</td>
                                                            <td className="px-4 py-2.5 text-center font-medium text-slate-600 dark:text-slate-400">{totalEst}</td>
                                                            <td className="px-4 py-2.5 text-center">
                                                                <Boton
                                                                    type="button"
                                                                    size="sm"
                                                                    onClick={() => {
                                                                        setMaxEstudiantesInput(grupo.maxEstudiantesGrupo ?? 3);
                                                                        setGrupoDetalleId(grupo.id);
                                                                        void cargarSubgrupos(grupo.id);
                                                                    }}
                                                                    className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center gap-1.5 h-8 px-3 text-xs rounded-lg shadow-2xs font-semibold mx-auto"
                                                                >
                                                                    <Settings className="h-3.5 w-3.5" />
                                                                    Administrar
                                                                </Boton>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                                {activosFiltrados.length === 0 && (
                                                    <tr>
                                                        <td colSpan={5} className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
                                                            No hay materias con grupos activos vigentes.
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="inactivos" className="space-y-4">
                                <div className="rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-sm overflow-hidden">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-xs">
                                            <thead>
                                                <tr className="border-b border-slate-200 bg-slate-50/75 dark:border-slate-800 dark:bg-slate-800/50">
                                                    <th className="px-4 py-2.5 text-left font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Sigla/Código</th>
                                                    <th className="px-4 py-2.5 text-left font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Materia</th>
                                                    <th className="px-4 py-2.5 text-center font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Grupo</th>
                                                    <th className="px-4 py-2.5 text-center font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Acciones</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                                {inactivosFiltrados.map((grupo) => {
                                                    return (
                                                        <tr key={grupo.id} className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-850">
                                                            <td className="px-4 py-2.5 font-semibold text-slate-700 dark:text-slate-300">{obtenerCodigoMateria(grupo)}</td>
                                                            <td className="px-4 py-2.5 text-slate-700 dark:text-slate-300">{obtenerNombreMateria(grupo, materiasPorCodigo)}</td>
                                                            <td className="px-4 py-2.5 text-center font-semibold text-slate-500 dark:text-slate-400">Grupo {grupo.grupo || grupo.nombreGrupo || '-'}</td>
                                                            <td className="px-4 py-2.5 text-center">
                                                                <Boton
                                                                    type="button"
                                                                    size="sm"
                                                                    onClick={() => {
                                                                        setMaxEstudiantesInput(grupo.maxEstudiantesGrupo ?? 3);
                                                                        setGrupoDetalleId(grupo.id);
                                                                        void cargarSubgrupos(grupo.id);
                                                                    }}
                                                                    className="bg-indigo-650 hover:bg-indigo-700 text-white flex items-center justify-center gap-1.5 h-8 px-3 text-xs rounded-lg shadow-2xs font-semibold mx-auto"
                                                                >
                                                                    <Settings className="h-3.5 w-3.5" />
                                                                    Administrar
                                                                </Boton>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                                {inactivosFiltrados.length === 0 && (
                                                    <tr>
                                                        <td colSpan={4} className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
                                                            No hay materias con grupos inactivos.
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </TabsContent>
                            
                            <TabsContent value="solicitados" className="space-y-4">
                                {solicitadosFiltrados.length === 0 ? (
                                    <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-center text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400">
                                        No tienes solicitudes pendientes.
                                    </div>
                                ) : (
                                    <div className="rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-xs">
                                                <thead>
                                                    <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/50">
                                                        <th className="px-4 py-2.5 text-left font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Materia</th>
                                                        <th className="px-4 py-2.5 text-left font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Grupo</th>
                                                        <th className="px-4 py-2.5 text-left font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Estado</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                                    {solicitadosFiltrados.map((grupo) => (
                                                        <tr key={grupo.id} className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/40">
                                                            <td className="px-4 py-2.5 text-slate-700 dark:text-slate-300">{obtenerCodigoMateria(grupo)} - {obtenerNombreMateria(grupo, materiasPorCodigo)}</td>
                                                            <td className="px-4 py-2.5 text-slate-700 dark:text-slate-300">{grupo.grupo || grupo.nombreGrupo || '—'}</td>
                                                            <td className="px-4 py-2.5 text-slate-700 dark:text-slate-300">
                                                                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                                                                    {grupo.estadoAprobacion || 'pendiente'}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}
                            </TabsContent>

                            <TabsContent value="rechazados" className="space-y-4">
                                {rechazadosFiltrados.length === 0 ? (
                                    <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-center text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400">
                                        No tienes solicitudes rechazadas.
                                    </div>
                                ) : (
                                    <div className="rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-xs">
                                                <thead>
                                                    <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/50">
                                                        <th className="px-4 py-2.5 text-left font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Materia</th>
                                                        <th className="px-4 py-2.5 text-left font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Grupo</th>
                                                        <th className="px-4 py-2.5 text-left font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Motivo</th>
                                                        <th className="px-4 py-2.5 text-center font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Acciones</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                                    {rechazadosFiltrados.map((grupo) => (
                                                        <tr key={grupo.id} className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/40">
                                                            <td className="px-4 py-2.5 text-slate-700 dark:text-slate-300">{obtenerCodigoMateria(grupo)} - {obtenerNombreMateria(grupo, materiasPorCodigo)}</td>
                                                            <td className="px-4 py-2.5 text-slate-700 dark:text-slate-300">{grupo.grupo || grupo.nombreGrupo || '—'}</td>
                                                            <td className="px-4 py-2.5 text-slate-700 dark:text-slate-300">{grupo.motivoRechazo?.trim() || '—'}</td>
                                                            <td className="px-4 py-2.5 text-center">
                                                                <Boton
                                                                    type="button"
                                                                    size="sm"
                                                                    onClick={() => {
                                                                        void volverASolicitarGrupo(grupo);
                                                                    }}
                                                                >
                                                                    Volver a solicitar
                                                                </Boton>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}
                            </TabsContent>
                        </Tabs>
                    </div>
                )
            )}

            {dialogoSolicitudAbierto && (
                <ModalBase titulo="Solicitar grupo" onCerrar={cerrarDialogoSolicitud} ancho="max-w-lg">
                    <div className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Materia asignada</label>
                            <select
                                value={solicitudGrupoForm.codigoMateria}
                                onChange={(e) => setSolicitudGrupoForm((prev) => ({ ...prev, codigoMateria: e.target.value }))}
                                className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                            >
                                <option value="">Selecciona una materia</option>
                                {materiasAsignadasNormalizadas.map((materia) => (
                                    <option key={materia.codigo} value={materia.codigo}>{materia.codigo} - {materia.nombre}</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Código de grupo</label>
                            <Input
                                value={solicitudGrupoForm.codigoGrupo}
                                onChange={(e) => setSolicitudGrupoForm((prev) => ({ ...prev, codigoGrupo: e.target.value.toUpperCase() }))}
                                placeholder="Ejemplo: A, 1, B2"
                            />
                        </div>

                        <div className="flex justify-end gap-2">
                            <Boton type="button" variant="outline" onClick={cerrarDialogoSolicitud}>Cancelar</Boton>
                            <Boton type="button" onClick={() => { void enviarSolicitudGrupoDesdeDialogo(); }} disabled={!!creandoGrupoMateria}>
                                {creandoGrupoMateria ? 'Enviando...' : 'Enviar solicitud'}
                            </Boton>
                        </div>
                    </div>
                </ModalBase>
            )}

            {dialogoSubgrupoGrupo && (
                <ModalBase titulo={`Grupo de prestamo: ${obtenerCodigoMateria(dialogoSubgrupoGrupo)} - ${dialogoSubgrupoGrupo.grupo || dialogoSubgrupoGrupo.nombreGrupo || '-'}`} onCerrar={cerrarDialogoSubgrupo} ancho="max-w-2xl">
                    <div className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Código</label>
                            <Input value={subgrupoForm.codigo} onChange={(e) => setSubgrupoForm((prev) => ({ ...prev, codigo: e.target.value.toUpperCase() }))} placeholder="Ejemplo: G1, LAB-A" />
                        </div>

                        <div className="space-y-2 rounded-md border border-slate-200 p-3 dark:border-slate-800">
                            <div className="flex items-center justify-between gap-2">
                                <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">Estudiantes</p>
                                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                                    Seleccionados: {subgrupoForm.estudianteIds.length} de {dialogoSubgrupoGrupo.maxEstudiantesGrupo ?? 3} (Marca el círculo de la derecha para definir el responsable)
                                </span>
                            </div>

                            <div className="space-y-2">
                                {(dialogoSubgrupoGrupo.estudianteIds ?? []).map((estudianteId) => {
                                    const idNum = Number(estudianteId);
                                    const estudiante = estudiantesPorId.get(idNum);
                                    const marcado = subgrupoForm.estudianteIds.includes(idNum);
                                    return (
                                        <label key={idNum} className="flex items-center justify-between gap-3 rounded-md border border-slate-200 px-3 py-2 text-xs dark:border-slate-800">
                                            <div className="flex items-center gap-3">
                                                <Checkbox
                                                    checked={marcado}
                                                    onChange={(e) => {
                                                        const checked = e.target.checked;
                                                        const maxPorGrupo = dialogoSubgrupoGrupo.maxEstudiantesGrupo ?? 3;
                                                        if (checked && subgrupoForm.estudianteIds.length >= maxPorGrupo) {
                                                            toast.error(`El grupo de préstamo no puede exceder el límite de ${maxPorGrupo} estudiantes.`);
                                                            return;
                                                        }
                                                        setSubgrupoForm((prev) => {
                                                            const estudianteIds = checked
                                                                ? Array.from(new Set([...prev.estudianteIds, idNum]))
                                                                : prev.estudianteIds.filter((item) => item !== idNum);
                                                            const responsableEstudianteId = String(prev.responsableEstudianteId) === String(idNum) && !checked
                                                                ? ''
                                                                : prev.responsableEstudianteId;
                                                            return { ...prev, estudianteIds, responsableEstudianteId };
                                                        });
                                                    }}
                                                />
                                                <span>{estudiante ? `[${estudiante.carnet}] ${estudiante.apellido}, ${estudiante.nombre}` : `ID ${idNum}`}</span>
                                            </div>

                                            <input
                                                type="radio"
                                                name="responsable-subgrupo"
                                                checked={String(subgrupoForm.responsableEstudianteId) === String(idNum)}
                                                disabled={!marcado}
                                                onChange={() => setSubgrupoForm((prev) => ({ ...prev, responsableEstudianteId: String(idNum) }))}
                                            />
                                        </label>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="flex justify-end gap-2">
                            <Boton type="button" variant="outline" onClick={cerrarDialogoSubgrupo}>Cancelar</Boton>
                            <Boton type="button" onClick={() => { void crearSubgrupoDesdeDialogo(); }}>Crear grupo</Boton>
                        </div>
                    </div>
                </ModalBase>
            )}
        </LayoutPagina>
    );
};

const DocentesEncargado = ({ onNavegar, onCerrarSesion }: PropsPaginaDocentes) => {
    const { docentes, prestamos, recargarDatos, cargando } = useInventario();
    const [pestanaActiva, setPestanaActiva] = useState('activos');
    const [filtroNombre, setFiltroNombre] = useState('');
    const [filtroCarnet, setFiltroCarnet] = useState('');

    const [solicitudes, setSolicitudes] = useState<any[]>([]);
    const [cargandoSolicitudes, setCargandoSolicitudes] = useState(false);

    const cargarSolicitudes = async () => {
        setCargandoSolicitudes(true);
        try {
            const data = await cargarSolicitudesPendientesDocentes();
            setSolicitudes(data);
        } catch (err: any) {
            toast.error(err?.message ?? 'Error al cargar solicitudes de docentes.');
        } finally {
            setCargandoSolicitudes(false);
        }
    };

    useEffect(() => {
        void cargarSolicitudes();
    }, []);

    useEffect(() => {
        if (pestanaActiva === 'solicitudes') {
            void cargarSolicitudes();
        }
    }, [pestanaActiva]);

    const handleAprobar = async (id: string, nombreCompleto: string) => {
        try {
            await aprobarDocenteEnBackend(id);
            toast.success(`Docente ${nombreCompleto} aprobado correctamente.`);
            await cargarSolicitudes();
            if (recargarDatos) await recargarDatos();
        } catch (err: any) {
            toast.error(err?.message ?? 'No se pudo aprobar al docente.');
        }
    };

    const handleRechazar = async (id: string, nombreCompleto: string) => {
        try {
            await rechazarDocenteEnBackend(id);
            toast.success(`Solicitud de ${nombreCompleto} rechazada.`);
            await cargarSolicitudes();
            if (recargarDatos) await recargarDatos();
        } catch (err: any) {
            toast.error(err?.message ?? 'No se pudo rechazar al docente.');
        }
    };

    const docentesFiltradosPorRol = useMemo(() => {
        return docentes.filter((docente) => {
            return prestamos.some((p) => {
                const coincideDocente = String(p.idDocente) === String(docente.id);
                const esPrestamoEnCurso = p.estado !== 'devuelto' && p.estado !== 'rechazado';
                return coincideDocente && esPrestamoEnCurso;
            });
        });
    }, [docentes, prestamos]);

    const docentesFiltrados = useMemo(() => {
        const nombreTerm = filtroNombre.toLowerCase().trim();
        const carnetTerm = filtroCarnet.toLowerCase().trim();
        return docentesFiltradosPorRol.filter(d => {
            const coincideNombre = nombreTerm === '' ||
                d.nombre.toLowerCase().includes(nombreTerm) ||
                d.apellido.toLowerCase().includes(nombreTerm);
            const coincideCarnet = carnetTerm === '' ||
                d.carnet.toLowerCase().includes(carnetTerm);
            return coincideNombre && coincideCarnet;
        });
    }, [filtroNombre, filtroCarnet, docentesFiltradosPorRol]);

    return (
        <LayoutPagina
            paginaActiva="docentes"
            titulo="Docentes y Solicitudes"
            subtitulo={cargando ? 'Cargando...' : 'Administración de docentes y solicitudes de registro'}
            onNavegar={onNavegar}
            onCerrarSesion={onCerrarSesion}
            onRecargar={() => { if (recargarDatos) void recargarDatos(); void cargarSolicitudes(); }}
            recargando={cargando || cargandoSolicitudes}
        >
            <Tabs value={pestanaActiva} onValueChange={setPestanaActiva} className="space-y-4">
                <TabsList className="flex gap-1.5 p-1 rounded-xl bg-slate-100/65 dark:bg-slate-800/40 justify-start h-auto w-fit">
                    <TabsTrigger value="activos" className="gap-2 text-xs font-semibold px-4 py-2 rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950 transition-all">
                        <Users className="h-3.5 w-3.5 text-indigo-500" />
                        Docentes ({docentesFiltradosPorRol.length})
                    </TabsTrigger>
                    <TabsTrigger value="solicitudes" className="gap-2 text-xs font-semibold px-4 py-2 rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-955 transition-all">
                        <ClipboardList className="h-3.5 w-3.5 text-amber-500" />
                        Solicitudes de Registro ({solicitudes.length})
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="activos" className="space-y-4">
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
                            {(filtroNombre || filtroCarnet) && (
                                <button
                                    onClick={() => {
                                        setFiltroNombre('');
                                        setFiltroCarnet('');
                                    }}
                                    className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                >
                                    Limpiar
                                </button>
                            )}
                            <span className="text-xs text-slate-400">
                                {docentesFiltrados.length} de {docentesFiltradosPorRol.length}
                            </span>
                        </div>
                    </div>

                    <TablaDocentes
                        docentes={docentesFiltrados}
                        onEditar={() => {}}
                        onEliminar={() => {}}
                        puedeAdministrar={false}
                        cargando={cargando}
                    />
                </TabsContent>

                <TabsContent value="solicitudes" className="space-y-4">
                    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                                <ClipboardList className="h-4 w-4 text-amber-500" />
                                Validar datos de solicitudes de acceso de docentes
                            </h3>
                            <button
                                onClick={cargarSolicitudes}
                                disabled={cargandoSolicitudes}
                                className="text-xs text-indigo-500 hover:text-indigo-600 font-semibold"
                            >
                                Refrescar
                            </button>
                        </div>

                        {cargandoSolicitudes ? (
                            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                                <div className="animate-spin rounded-full h-6 w-6 border-2 border-indigo-500 border-t-transparent mb-2"></div>
                                <span>Cargando solicitudes pendientes...</span>
                            </div>
                        ) : (
                            <div className="overflow-x-auto rounded-lg border border-slate-150 dark:border-slate-800">
                                <table className="w-full text-xs text-left">
                                    <thead>
                                        <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/50">
                                            <th className="px-4 py-3 font-semibold text-slate-600 dark:text-slate-350">Nombre / Apellido</th>
                                            <th className="px-4 py-3 font-semibold text-slate-600 dark:text-slate-350">C.I.</th>
                                            <th className="px-4 py-3 font-semibold text-slate-600 dark:text-slate-350">Código Docente</th>
                                            <th className="px-4 py-3 font-semibold text-slate-600 dark:text-slate-350">Carrera(s)</th>
                                            <th className="px-4 py-3 font-semibold text-slate-600 dark:text-slate-350">Correo</th>
                                            <th className="px-4 py-3 font-semibold text-slate-600 dark:text-slate-350">Fecha Nac.</th>
                                            <th className="px-4 py-3 font-semibold text-slate-600 dark:text-slate-350 text-center">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {solicitudes.map((sol) => (
                                            <tr key={sol.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                                                <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">{sol.nombre} {sol.apellido}</td>
                                                <td className="px-4 py-3 text-slate-700 dark:text-slate-300 font-mono">{sol.carnet}</td>
                                                <td className="px-4 py-3 text-slate-700 dark:text-slate-300 font-mono">{sol.codigo || '—'}</td>
                                                <td className="px-4 py-3 text-slate-700 dark:text-slate-300">
                                                    {sol.carreras?.map((c: any) => c.nombre).join(', ') || '—'}
                                                </td>
                                                <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{sol.correo}</td>
                                                <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{sol.fechaNacimiento || '—'}</td>
                                                <td className="px-4 py-3 text-center">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <button
                                                            onClick={() => handleAprobar(sol.id, `${sol.nombre} ${sol.apellido}`)}
                                                            className="inline-flex items-center justify-center gap-1 rounded-md bg-emerald-500 hover:bg-emerald-600 text-white font-medium px-2 py-1 transition-all shadow-sm hover:shadow"
                                                            title="Aprobar registro de docente"
                                                        >
                                                            <Check className="h-3.5 w-3.5" />
                                                            <span>Aprobar</span>
                                                        </button>
                                                        <button
                                                            onClick={() => handleRechazar(sol.id, `${sol.nombre} ${sol.apellido}`)}
                                                            className="inline-flex items-center justify-center gap-1 rounded-md border border-red-200 hover:bg-red-50 hover:text-red-600 text-red-500 font-medium px-2 py-1 transition-all dark:border-red-900 dark:hover:bg-red-955/20"
                                                            title="Rechazar solicitud"
                                                        >
                                                            <X className="h-3.5 w-3.5" />
                                                            <span>Rechazar</span>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}

                                        {solicitudes.length === 0 && (
                                            <tr>
                                                <td colSpan={7} className="px-4 py-8 text-center text-slate-400 dark:text-slate-500 italic">
                                                    No hay solicitudes de registro pendientes.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </TabsContent>
            </Tabs>
        </LayoutPagina>
    );
};

export const Docentes = (props: PropsPaginaDocentes) => {
    const usuario = obtenerUsuarioActual();
    if (usuario?.rol === 'docente') {
        return <DocentesDocente {...props} vistaDocente={props.vistaDocente ?? 'estudiantes'} />;
    }
    return <DocentesEncargado {...props} />;
};

