import { useEffect, useMemo, useState } from 'react';
import { ModalBase } from '@/componentes/paginas/inventario/modal-base';
import { Boton } from '@/componentes/ui/button';
import { Trash2 } from 'lucide-react';
import { Input } from '@/componentes/ui/input';
import { Label } from '@/componentes/ui/label';
import { Combobox, ComboboxContent, ComboboxEmpty, ComboboxInput, ComboboxItem, ComboboxList } from '@/componentes/ui/combobox';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/componentes/ui/tabs';
import { DateTimePicker } from '@/componentes/ui/date-time-picker';
import type { CanastaPrestamo, PrestamoCanastaRegistro } from '@/tipos/inventario';
import { ahoraInputLocal, apiDateTimeAInputLocal, sumarHorasInputLocal } from '@/utilidades/fechas';
import { crearCanastaPrestamoEnBackend, editarCanastaPrestamoEnBackend } from '@/lib/servicio-prestamos';
import { obtenerUsuarioActual, listarMisInventarios } from '@/lib/servicio-autenticacion';
import { useInventario } from '@/contextos/ContextoInventario';
import { cargarContenedoresPorInventarioEnBackend } from '@/lib/servicio-activos';
import { useCierreSeguro } from '@/hooks/use-cierre-seguro';
import { normalizarEstadoItem } from '@/utilidades/estados-activo';
import { listarGruposDocencia, listarSubgruposPrestamoDocencia } from '@/lib/servicio-docencia';
import type { GrupoMateriaDocencia, SubgrupoPrestamoDocencia } from '@/tipos/docencia';

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

interface Props {
    onCerrar: () => void;
    canasta?: PrestamoCanastaRegistro;
    onGuardado?: () => void | Promise<void>;
}

interface OpcionSelector {
    value: string;
    label: string;
}

const OPCION_REGISTRAR_ESTUDIANTE = '__registrar_nuevo_estudiante__';
const OPCION_REGISTRAR_DOCENTE = '__registrar_nuevo_docente__';

interface NuevoEstudianteForm {
    carnet: string;
    nombre: string;
    apellido: string;
    carrera: string;
    cu: string;
}

interface NuevoDocenteForm {
    codigo: string;
    nombre: string;
    apellido: string;
    materia: string;
    carnet: string;
    correo: string;
}

const NUEVO_ESTUDIANTE_INICIAL: NuevoEstudianteForm = {
    carnet: '',
    nombre: '',
    apellido: '',
    carrera: '',
    cu: '',
};

const NUEVO_DOCENTE_INICIAL: NuevoDocenteForm = {
    codigo: '',
    nombre: '',
    apellido: '',
    materia: '',
    carnet: '',
    correo: '',
};

const construirCamposCanasta = (canasta?: PrestamoCanastaRegistro, docentePredeterminadoId?: string): CanastaPrestamo => {
    if (canasta) {
        return {
            carnetEstudiante: canasta.carnetEstudiante,
            carnetsEstudiantes: canasta.carnetsEstudiantes?.length
                ? canasta.carnetsEstudiantes
                : (canasta.carnetEstudiante ? [canasta.carnetEstudiante] : []),
            idDocente: String(canasta.idDocente ?? ''),
            fechaPrestamo: apiDateTimeAInputLocal(canasta.fechaPrestamo) || ahoraInputLocal(),
            fechaDevolucion: canasta.fechaDevolucion ? (apiDateTimeAInputLocal(canasta.fechaDevolucion) || '') : '',
            observaciones: canasta.observaciones ?? '',
            equipos: (canasta.cosas ?? []).map((equipo) => ({
                idHerramienta: equipo.idHerramienta,
                registrado: equipo.registrado !== false,
                bloqueado: equipo.registrado !== false,
            })),
            consumibles: (canasta.consumibles ?? []).map((c) => ({
                idLote: c.idLote,
                cantidad: Number(c.cantidadDespachada ?? c.cantidadSolicitada ?? 0),
                motivo: c.motivo ?? 'Uso en clase',
            })),
        };
    }

    const inicio = ahoraInputLocal();
    return {
        carnetsEstudiantes: [],
        idDocente: docentePredeterminadoId ?? '',
        fechaPrestamo: inicio,
        fechaDevolucion: sumarHorasInputLocal(inicio, 2),
        observaciones: 'Despacho inicial de clase',
        equipos: [],
        consumibles: [],
    };
};

export const FormularioCanastaPrestamo = ({ onCerrar, canasta, onGuardado }: Props) => {
    const { estudiantes, docentes, herramientas, prestamos, recargarDatos, agregarEstudiante, agregarDocente, materias, materiales } = useInventario();
    const usuarioActual = useMemo(() => obtenerUsuarioActual(), []);
    const esAdministrador = usuarioActual?.rol === 'administrador';
    const esDocente = usuarioActual?.rol === 'docente';
    const docentePredeterminado = useMemo(() => {
        const correoActual = String(usuarioActual?.correo ?? '').trim().toLowerCase();
        if (!correoActual) return null;
        return docentes.find((docente) => String(docente.correo ?? '').trim().toLowerCase() === correoActual) ?? null;
    }, [docentes, usuarioActual?.correo]);
    const esEdicion = !!canasta;
    const formId = 'formulario-canasta-prestamo';

    const [campos, setCampos] = useState<CanastaPrestamo>(() => construirCamposCanasta(canasta, docentePredeterminado?.id));
    const [camposIniciales, setCamposIniciales] = useState<CanastaPrestamo>(() => construirCamposCanasta(canasta, docentePredeterminado?.id));
    const [estudianteSeleccionado, setEstudianteSeleccionado] = useState('');
    const [docenteSeleccionado, setDocenteSeleccionado] = useState('');
    const [equipoSeleccionado, setEquipoSeleccionado] = useState('');
    const [error, setError] = useState('');

    const [contenedores, setContenedores] = useState<Array<{ id: number; nombre: string; ubicacion: string; tipo?: string }>>([]);
    const [cargandoContenedores, setCargandoContenedores] = useState(false);
    const [cantidadesContenedores, setCantidadesContenedores] = useState<Record<number, number>>({});


    useEffect(() => {
        if (canasta && esDocente) {
            const counts: Record<number, number> = {};
            (canasta.cosas ?? []).forEach((cosa: any) => {
                if (cosa.idContenedor) {
                    const cid = Number(cosa.idContenedor);
                    counts[cid] = (counts[cid] ?? 0) + 1;
                }
            });
            setCantidadesContenedores(counts);
        } else {
            setCantidadesContenedores({});
        }
    }, [canasta, esDocente]);
    const [guardando, setGuardando] = useState(false);
    const [modalAlta, setModalAlta] = useState<'estudiante' | 'docente' | null>(null);
    const [nuevoEstudiante, setNuevoEstudiante] = useState<NuevoEstudianteForm>(NUEVO_ESTUDIANTE_INICIAL);
    const [carnetsRetenidos, setCarnetsRetenidos] = useState<string[]>(() => {
        if (canasta?.estudiantes) {
            return canasta.estudiantes.filter(e => e.carnetRetenido).map(e => e.carnet);
        }
        return [];
    });

    const [gruposMateriaDocente, setGruposMateriaDocente] = useState<GrupoMateriaDocencia[]>([]);
    const [tipoSeleccion, setTipoSeleccion] = useState<'grupo' | 'materia'>('grupo');
    const [materiaSeleccionadaId, setMateriaSeleccionadaId] = useState<string>('');
    const [subgruposMateria, setSubgruposMateria] = useState<SubgrupoPrestamoDocencia[]>([]);
    const [subgrupoSeleccionadoId, setSubgrupoSeleccionadoId] = useState<string>('');
    const [cargandoSubgrupos, setCargandoSubgrupos] = useState<boolean>(false);

    const materiasPorCodigo = useMemo(() => {
        const mapa = new Map<string, string>();
        for (const m of materias || []) {
            if (m.nombre && m.codigo) {
                mapa.set(m.codigo.trim().toUpperCase(), m.nombre.trim());
            }
        }
        return mapa;
    }, [materias]);

    useEffect(() => {
        if (!esDocente) return;
        const cargarDatosDocente = async () => {
            try {
                const g = await listarGruposDocencia();
                setGruposMateriaDocente(g);
            } catch (err) {
                console.error('Error al cargar materias del docente:', err);
            }
        };
        void cargarDatosDocente();
    }, [esDocente]);

    useEffect(() => {
        if (!esDocente || !materiaSeleccionadaId) {
            setSubgruposMateria([]);
            return;
        }
        const cargarSubgrupos = async () => {
            try {
                setCargandoSubgrupos(true);
                const data = await listarSubgruposPrestamoDocencia(materiaSeleccionadaId);
                setSubgruposMateria(data);
            } catch (err) {
                console.error('Error al cargar subgrupos:', err);
                setSubgruposMateria([]);
            } finally {
                setCargandoSubgrupos(false);
            }
        };
        void cargarSubgrupos();
    }, [esDocente, materiaSeleccionadaId]);
    const [nuevoDocente, setNuevoDocente] = useState<NuevoDocenteForm>(NUEVO_DOCENTE_INICIAL);
    const [errorAlta, setErrorAlta] = useState('');
    const [guardandoAlta, setGuardandoAlta] = useState(false);

    const [misInventarios, setMisInventarios] = useState<Array<{ id: number; nombre: string; descripcion?: string; puedeEditarFungibles?: boolean; puedeEditarFijos?: boolean }>>([]);
    const [idInventarioSeleccionado, setIdInventarioSeleccionado] = useState<string>('');

    useEffect(() => {
        if (!idInventarioSeleccionado) {
            setContenedores([]);
            return;
        }
        const fetchContenedores = async () => {
            try {
                setCargandoContenedores(true);
                const data = await cargarContenedoresPorInventarioEnBackend(Number(idInventarioSeleccionado));
                const contenedoresVisibles = data.filter((c: any) => c.visible !== false);
                setContenedores(contenedoresVisibles);
            } catch (err) {
                console.error('Error al cargar contenedores:', err);
            } finally {
                setCargandoContenedores(false);
            }
        };
        void fetchContenedores();
    }, [idInventarioSeleccionado]);

    // Fungible States
    const [fungibleSeleccionadoId, setFungibleSeleccionadoId] = useState('');
    const [cantFungible, setCantFungible] = useState<number>(1);
    const [motivoFungible, setMotivoFungible] = useState('Uso en clase');

    const tienePermisoFungibles = useMemo(() => {
        const inv = misInventarios.find((i) => String(i.id) === String(idInventarioSeleccionado));
        return inv ? inv.puedeEditarFungibles === true : false;
    }, [misInventarios, idInventarioSeleccionado]);

    const tienePermisoFijos = useMemo(() => {
        const inv = misInventarios.find((i) => String(i.id) === String(idInventarioSeleccionado));
        return inv ? inv.puedeEditarFijos === true : false;
    }, [misInventarios, idInventarioSeleccionado]);

    const mostrarTabs = tienePermisoFungibles && tienePermisoFijos;

    const materialesFiltrados = useMemo(() => {
        return materiales.filter(m => {
            if (!idInventarioSeleccionado) return true;
            return Number(m.idInventario) === Number(idInventarioSeleccionado);
        });
    }, [materiales, idInventarioSeleccionado]);

    const opcionesFungibles = useMemo<OpcionSelector[]>(() => {
        return materialesFiltrados
            .filter(m => !campos.consumibles.some(c => c.idLote === m.id))
            .map(m => {
                const descLote = m.lote ? `Lote: ${m.lote}` : (m.serie ? `Serie: ${m.serie}` : 'Sistema');
                return {
                    value: m.id,
                    label: `[${descLote}] ${m.nombre} (${m.cantidadDisponible} ${m.unidad} disp.)`
                };
            })
            .sort((a, b) => a.label.localeCompare(b.label, 'es'));
    }, [materialesFiltrados, campos.consumibles]);

    const agregarFungible = () => {
        if (!fungibleSeleccionadoId) return;
        if (campos.consumibles.some(c => c.idLote === fungibleSeleccionadoId)) return;
        const mat = materiales.find(m => m.id === fungibleSeleccionadoId);
        if (!mat) return;
        setCampos(prev => ({
            ...prev,
            consumibles: [
                ...prev.consumibles,
                {
                    idLote: fungibleSeleccionadoId,
                    cantidad: Number(cantFungible),
                    motivo: motivoFungible || 'Uso en clase'
                }
            ]
        }));
        setFungibleSeleccionadoId('');
        setCantFungible(1);
        setMotivoFungible('Uso en clase');
    };

    const quitarFungible = (idLote: string) => {
        setCampos((prev) => ({
            ...prev,
            consumibles: prev.consumibles.filter(c => c.idLote !== idLote)
        }));
    };

    const cambiarCantFungible = (idLote: string, cantidad: number) => {
        setCampos((prev) => ({
            ...prev,
            consumibles: prev.consumibles.map(c => c.idLote === idLote ? { ...c, cantidad } : c)
        }));
    };

    const cambiarMotivoFungible = (idLote: string, motivo: string) => {
        setCampos((prev) => ({
            ...prev,
            consumibles: prev.consumibles.map(c => c.idLote === idLote ? { ...c, motivo } : c)
        }));
    };

    useEffect(() => {
        const cargarInventarios = async () => {
            try {
                const lista = await listarMisInventarios();
                setMisInventarios(lista);
            } catch (err: any) {
                console.error('Error al cargar mis inventarios:', err);
            }
        };
        cargarInventarios();
    }, []);

    useEffect(() => {
        if (misInventarios.length === 0) return;
        const primerEquipoId = canasta?.cosas?.[0]?.idHerramienta;
        if (primerEquipoId && herramientas.length > 0) {
            const hAsociada = herramientas.find(h => h.id === primerEquipoId);
            if (hAsociada?.idInventario) {
                const idStr = String(hAsociada.idInventario);
                if (misInventarios.some(inv => String(inv.id) === idStr)) {
                    setIdInventarioSeleccionado(idStr);
                    return;
                }
            }
        }
        const primerConsumibleId = canasta?.consumibles?.[0]?.idLote;
        if (primerConsumibleId && materiales.length > 0) {
            const mAsociado = materiales.find(m => m.id === primerConsumibleId);
            if (mAsociado?.idInventario) {
                const idStr = String(mAsociado.idInventario);
                if (misInventarios.some(inv => String(inv.id) === idStr)) {
                    setIdInventarioSeleccionado(idStr);
                    return;
                }
            }
        }
        if (!idInventarioSeleccionado) {
            setIdInventarioSeleccionado(String(misInventarios[0].id));
        }
    }, [misInventarios, canasta, herramientas, materiales, idInventarioSeleccionado]);

    const cambiarInventarioSeleccionado = (nuevoId: string) => {
        setIdInventarioSeleccionado(nuevoId);
        setCampos((prev) => {
            const equiposFiltrados = prev.equipos.filter((eq) => {
                const herr = herramientas.find((h) => h.id === eq.idHerramienta);
                return herr && Number(herr.idInventario) === Number(nuevoId);
            });
            const consumiblesFiltrados = prev.consumibles.filter((cons) => {
                const mat = materiales.find((m) => m.id === cons.idLote);
                return mat && Number(mat.idInventario) === Number(nuevoId);
            });
            return {
                ...prev,
                equipos: equiposFiltrados,
                consumibles: consumiblesFiltrados,
            };
        });
    };

    useEffect(() => {
        const siguientes = construirCamposCanasta(canasta, docentePredeterminado?.id);
        setCampos(siguientes);
        setCamposIniciales(siguientes);
        setEstudianteSeleccionado('');
        setDocenteSeleccionado('');
        setEquipoSeleccionado('');
        setError('');
        if (canasta?.estudiantes) {
            setCarnetsRetenidos(canasta.estudiantes.filter(e => e.carnetRetenido).map(e => e.carnet));
        } else {
            setCarnetsRetenidos([]);
        }
        if (canasta && esDocente) {
            const counts: Record<number, number> = {};
            (canasta.cosas ?? []).forEach((cosa: any) => {
                if (cosa.idContenedor) {
                    const cid = Number(cosa.idContenedor);
                    counts[cid] = (counts[cid] ?? 0) + 1;
                }
            });
            setCantidadesContenedores(counts);
        } else {
            setCantidadesContenedores({});
        }
    }, [canasta?.id, docentePredeterminado?.id, esDocente]);

    useEffect(() => {
        if (!esDocente || esEdicion || !docentePredeterminado?.id) return;
        setCampos((prev) => (prev.idDocente ? prev : { ...prev, idDocente: docentePredeterminado.id }));
        setCamposIniciales((prev) => (prev.idDocente ? prev : { ...prev, idDocente: docentePredeterminado.id }));
    }, [docentePredeterminado?.id, esDocente, esEdicion]);

    const abrirAlta = (tipo: 'estudiante' | 'docente') => {
        setErrorAlta('');
        if (tipo === 'estudiante') {
            setNuevoEstudiante(NUEVO_ESTUDIANTE_INICIAL);
        } else {
            setNuevoDocente(NUEVO_DOCENTE_INICIAL);
        }
        setModalAlta(tipo);
    };

    const cerrarAlta = () => {
        setModalAlta(null);
        setErrorAlta('');
        setGuardandoAlta(false);
        setNuevoEstudiante(NUEVO_ESTUDIANTE_INICIAL);
        setNuevoDocente(NUEVO_DOCENTE_INICIAL);
    };

    const inicialesContenedores = useMemo(() => {
        if (!canasta || !esDocente) return {};
        const counts: Record<number, number> = {};
        (canasta.cosas ?? []).forEach((cosa: any) => {
            if (cosa.idContenedor) {
                const cid = Number(cosa.idContenedor);
                counts[cid] = (counts[cid] ?? 0) + 1;
            }
        });
        return counts;
    }, [canasta, esDocente]);

    const estaSucio = useMemo(() => {
        const baseCambio = JSON.stringify(campos) !== JSON.stringify(camposIniciales);
        const seleccionesPendientes = Boolean(estudianteSeleccionado || docenteSeleccionado || equipoSeleccionado);
        const contenedoresSucios = esDocente && JSON.stringify(cantidadesContenedores) !== JSON.stringify(inicialesContenedores);
        return baseCambio || seleccionesPendientes || contenedoresSucios;
    }, [campos, camposIniciales, docenteSeleccionado, equipoSeleccionado, estudianteSeleccionado, esDocente, cantidadesContenedores, inicialesContenedores]);

    const cierreSeguro = useCierreSeguro({
        estaSucio,
        estaCargando: guardando || guardandoAlta,
        alCerrar: onCerrar,
        mensajeConfirmacion: 'Hay cambios sin guardar en la canasta. ¿Deseas cerrar y descartarlos?',
    });

    const estaSucioAltaEstudiante = useMemo(() => {
        if (modalAlta !== 'estudiante') return false;
        return (
            nuevoEstudiante.carnet.trim() !== NUEVO_ESTUDIANTE_INICIAL.carnet ||
            nuevoEstudiante.nombre.trim() !== NUEVO_ESTUDIANTE_INICIAL.nombre ||
            nuevoEstudiante.apellido.trim() !== NUEVO_ESTUDIANTE_INICIAL.apellido ||
            nuevoEstudiante.carrera.trim() !== NUEVO_ESTUDIANTE_INICIAL.carrera ||
            nuevoEstudiante.cu.trim() !== NUEVO_ESTUDIANTE_INICIAL.cu
        );
    }, [modalAlta, nuevoEstudiante.apellido, nuevoEstudiante.carnet, nuevoEstudiante.carrera, nuevoEstudiante.cu, nuevoEstudiante.nombre]);

    const cierreSeguroAltaEstudiante = useCierreSeguro({
        estaSucio: estaSucioAltaEstudiante,
        estaCargando: guardandoAlta,
        alCerrar: cerrarAlta,
        mensajeConfirmacion: 'Hay datos del estudiante sin guardar. ¿Deseas cerrar y descartarlos?',
    });

    const estaSucioAltaDocente = useMemo(() => {
        if (modalAlta !== 'docente') return false;
        return (
            nuevoDocente.codigo.trim() !== NUEVO_DOCENTE_INICIAL.codigo ||
            nuevoDocente.nombre.trim() !== NUEVO_DOCENTE_INICIAL.nombre ||
            nuevoDocente.apellido.trim() !== NUEVO_DOCENTE_INICIAL.apellido ||
            nuevoDocente.materia.trim() !== NUEVO_DOCENTE_INICIAL.materia ||
            nuevoDocente.carnet.trim() !== NUEVO_DOCENTE_INICIAL.carnet ||
            nuevoDocente.correo.trim() !== NUEVO_DOCENTE_INICIAL.correo
        );
    }, [modalAlta, nuevoDocente.apellido, nuevoDocente.carnet, nuevoDocente.codigo, nuevoDocente.correo, nuevoDocente.materia, nuevoDocente.nombre]);

    const cierreSeguroAltaDocente = useCierreSeguro({
        estaSucio: estaSucioAltaDocente,
        estaCargando: guardandoAlta,
        alCerrar: cerrarAlta,
        mensajeConfirmacion: 'Hay datos del docente sin guardar. ¿Deseas cerrar y descartarlos?',
    });


    const equiposDisponibles = useMemo(
        () => herramientas.filter((h) => {
            const estado = normalizarEstadoItem(h.estado) ?? 'disponible';
            if (estado === 'en_mantenimiento' || estado === 'dado_de_baja') return false;
            
            if (idInventarioSeleccionado) {
                return Number(h.idInventario) === Number(idInventarioSeleccionado);
            }
            return true;
        }),
        [herramientas, idInventarioSeleccionado],
    );

    const gruposActivos = useMemo(() => {
        return gruposMateriaDocente.filter(g => (g.estadoAprobacion || 'aprobado') === 'aprobado' && g.activo !== false);
    }, [gruposMateriaDocente]);

    const opcionesEstudiantes = useMemo<OpcionSelector[]>(() => {
        let base = estudiantes;
        if (esDocente && !esEdicion) {
            if (!materiaSeleccionadaId) {
                return [];
            }
            const grupoMateria = gruposActivos.find(g => g.id === materiaSeleccionadaId);
            if (grupoMateria) {
                const idsSet = new Set(grupoMateria.estudianteIds ?? []);
                base = estudiantes.filter(e => e.id && idsSet.has(Number(e.id)));
            } else {
                base = [];
            }
        }

        const desglosados: OpcionSelector[] = [];
        for (const est of base) {
            if (campos.carnetsEstudiantes.includes(est.carnet)) {
                continue;
            }
            const asignaciones = est.asignacionesCarrera?.length
                ? est.asignacionesCarrera
                : [{ carrera: est.carrera, cu: est.cu ?? '' }];
            for (const asig of asignaciones) {
                desglosados.push({
                    value: est.carnet,
                    label: `[${est.carnet}] ${est.apellido}, ${est.nombre} - ${asig.carrera} (CU: ${asig.cu || '—'})`,
                });
            }
        }

        return desglosados.sort((a, b) => a.label.localeCompare(b.label, 'es'));
    }, [campos.carnetsEstudiantes, estudiantes, esDocente, esEdicion, materiaSeleccionadaId, gruposActivos]);

    const opcionesDocentes = useMemo<OpcionSelector[]>(() => (
        [...(esDocente ? docentes.filter((docente) => docente.id === docentePredeterminado?.id) : docentes)]
            .sort((a, b) => `${a.apellido} ${a.nombre}`.localeCompare(`${b.apellido} ${b.nombre}`, 'es'))
            .filter((docente) => docente.id !== campos.idDocente)
            .map((docente) => ({
                value: docente.id,
                label: `[${docente.codigo}] ${docente.apellido}, ${docente.nombre}`,
            }))
    ), [campos.idDocente, docentePredeterminado?.id, docentes, esDocente]);

    const opcionesEstudiantesCombobox = useMemo<OpcionSelector[]>(() => (
        [
            ...opcionesEstudiantes,
            { value: OPCION_REGISTRAR_ESTUDIANTE, label: 'Registrar nuevo estudiante...' },
        ]
    ), [opcionesEstudiantes]);

    const opcionesDocentesCombobox = useMemo<OpcionSelector[]>(() => (
        esAdministrador
            ? [
                ...opcionesDocentes,
                { value: OPCION_REGISTRAR_DOCENTE, label: 'Registrar nuevo docente...' },
            ]
            : opcionesDocentes
    ), [esAdministrador, opcionesDocentes]);

    const opcionesEquipos = useMemo<OpcionSelector[]>(() => {
        let baseEquipos = equiposDisponibles;
        if (esDocente) {
            baseEquipos = baseEquipos.filter((equipo) => {
                const prestamoActivo = prestamos.find(
                    (p) => String(p.idHerramienta) === String(equipo.id) &&
                           p.estado !== 'devuelto' &&
                           p.estado !== 'devuelto_fuera_de_fecha_limite' &&
                           p.estado !== 'rechazado'
                );
                return !prestamoActivo;
            });
        }

        return baseEquipos
            .filter((equipo) => !campos.equipos.some((item) => item.idHerramienta === equipo.id))
            .map((equipo) => {
                const prestamoActivo = prestamos.find(
                    (p) => String(p.idHerramienta) === String(equipo.id) &&
                           p.estado !== 'devuelto' &&
                           p.estado !== 'devuelto_fuera_de_fecha_limite' &&
                           p.estado !== 'rechazado'
                );

                const inv = String(equipo.codigoInventario ?? '').trim();
                const uni = String(equipo.codigoUnico ?? '').trim();
                const etiqueta = inv || uni
                    ? `I: ${inv || '—'} | U: ${uni || '—'}`
                    : 'SIN-CODIGO';
                let label = `[${etiqueta}] ${equipo.nombre}`;

                if (prestamoActivo) {
                    const etapaStr = prestamoActivo.estado.charAt(0).toUpperCase() + prestamoActivo.estado.slice(1);
                    label = `[${etapaStr}] ${label}`;
                }

                return {
                    value: equipo.id,
                    label,
                };
            });
    }, [campos.equipos, equiposDisponibles, prestamos, esDocente]);

    const agregarEquipo = () => {
        if (!equipoSeleccionado) return;
        if (campos.equipos.some((item) => item.idHerramienta === equipoSeleccionado)) return;
        setCampos((prev) => ({
            ...prev,
            equipos: [
                ...prev.equipos,
                {
                    idHerramienta: equipoSeleccionado,
                    registrado: true,
                    bloqueado: false,
                },
            ],
        }));
        setEquipoSeleccionado('');
    };

    const quitarEquipo = (id: string | null) => {
        if (!id) return;
        setCampos((prev) => ({
            ...prev,
            equipos: prev.equipos.filter((equipo) => equipo.idHerramienta !== id || equipo.bloqueado),
        }));
    };



    const agregarEstudianteSeleccionado = () => {
        if (!estudianteSeleccionado) return;
        if (campos.carnetsEstudiantes.includes(estudianteSeleccionado)) return;
        setCampos((prev) => ({
            ...prev,
            carnetsEstudiantes: [...prev.carnetsEstudiantes, estudianteSeleccionado],
            carnetEstudiante: prev.carnetEstudiante ?? estudianteSeleccionado,
        }));
        setCarnetsRetenidos((prev) => [...prev, estudianteSeleccionado]);
        setEstudianteSeleccionado('');
    };

    const quitarEstudianteSeleccionado = (carnet: string) => {
        setCampos((prev) => {
            const carnetsEstudiantes = prev.carnetsEstudiantes.filter((item) => item !== carnet);
            return {
                ...prev,
                carnetsEstudiantes,
                carnetEstudiante: carnetsEstudiantes[0],
            };
        });
        setCarnetsRetenidos((prev) => prev.filter((item) => item !== carnet));
    };

    const agregarDocenteSeleccionado = () => {
        if (!docenteSeleccionado || campos.idDocente) return;
        setCampos((prev) => ({ ...prev, idDocente: docenteSeleccionado }));
        setDocenteSeleccionado('');
    };

    const quitarDocenteSeleccionado = () => {
        setCampos((prev) => ({ ...prev, idDocente: '' }));
    };

    const manejarCrearEstudiante = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorAlta('');


        if (!nuevoEstudiante.cu.trim()) {
            setErrorAlta('El CU es obligatorio para registrar al estudiante.');
            return;
        }

        try {
            setGuardandoAlta(true);
            const creado = await agregarEstudiante({
                carnet: nuevoEstudiante.carnet.trim(),
                cu: nuevoEstudiante.cu.trim().toUpperCase(),
                nombre: nuevoEstudiante.nombre.trim(),
                apellido: nuevoEstudiante.apellido.trim(),
                carrera: nuevoEstudiante.carrera.trim(),
                carreras: [nuevoEstudiante.carrera.trim()],
                cus: [nuevoEstudiante.cu.trim().toUpperCase()],
                asignacionesCarrera: [{ carrera: nuevoEstudiante.carrera.trim(), cu: nuevoEstudiante.cu.trim().toUpperCase() }],
                carnetRetenido: false,
            });
            setCampos((prev) => ({
                ...prev,
                carnetsEstudiantes: prev.carnetsEstudiantes.includes(creado.carnet)
                    ? prev.carnetsEstudiantes
                    : [...prev.carnetsEstudiantes, creado.carnet],
                carnetEstudiante: prev.carnetEstudiante ?? creado.carnet,
            }));
            setEstudianteSeleccionado('');
            cerrarAlta();
        } catch (err: any) {
            setErrorAlta(err?.message ?? 'No se pudo registrar el estudiante.');
            setGuardandoAlta(false);
        }
    };

    const manejarCrearDocente = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorAlta('');

        if (!esAdministrador) {
            setErrorAlta('Solo el administrador puede registrar docentes.');
            return;
        }

        try {
            setGuardandoAlta(true);
            const creado = await agregarDocente({
                codigo: nuevoDocente.codigo.trim(),
                nombre: nuevoDocente.nombre.trim(),
                apellido: nuevoDocente.apellido.trim(),
                materia: nuevoDocente.materia.trim(),
                carnet: nuevoDocente.carnet.trim(),
                correo: nuevoDocente.correo.trim(),
            });
            setCampos((prev) => ({ ...prev, idDocente: creado.id }));
            setDocenteSeleccionado('');
            cerrarAlta();
        } catch (err: any) {
            setErrorAlta(err?.message ?? 'No se pudo registrar el docente.');
            setGuardandoAlta(false);
        }
    };

    const manejarEnvio = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (esDocente && !docentePredeterminado?.id && !campos.idDocente) {
            setError('No se pudo identificar tu perfil docente para asignarte la canasta.');
            return;
        }

        if (campos.carnetsEstudiantes.length === 0 || !campos.idDocente) {
            setError('Debes seleccionar estudiante y docente.');
            return;
        }

        const totalContenedores = Object.values(cantidadesContenedores).reduce((a, b) => a + b, 0);

        if (esDocente) {
            if (totalContenedores === 0 && campos.consumibles.length === 0) {
                setError('La solicitud debe tener al menos un equipo o un material fungible.');
                return;
            }
        } else {
            if (campos.equipos.length === 0 && campos.consumibles.length === 0) {
                setError('La canasta debe tener al menos un activo fijo o un material fungible.');
                return;
            }
            if (campos.equipos.length > 0 && !campos.equipos.some((equipo) => equipo.registrado)) {
                setError('Debes marcar al menos un activo fijo para registrar/descontar.');
                return;
            }
        }

        if (campos.fechaDevolucion && new Date(campos.fechaDevolucion).getTime() <= new Date(campos.fechaPrestamo).getTime()) {
            setError('La fecha/hora de devolución debe ser posterior al préstamo.');
            return;
        }

        try {
            setGuardando(true);
            const payloadItems = campos.equipos.map((equipo) => ({
                idItem: equipo.idHerramienta!,
                registrado: equipo.registrado,
            }));

            const payloadContenedores = esDocente
                ? Object.entries(cantidadesContenedores)
                    .map(([id, qty]) => ({ idContenedor: Number(id), cantidad: qty }))
                    .filter((c) => c.cantidad > 0)
                : [];

            if (canasta) {
                await editarCanastaPrestamoEnBackend(canasta.id, {
                    carnetsEstudiantes: campos.carnetsEstudiantes,
                    idDocente: Number(campos.idDocente),
                    fechaPrestamo: campos.fechaPrestamo,
                    fechaDevolucion: campos.fechaDevolucion || null,
                    observaciones: campos.observaciones,
                    items: esDocente ? [] : payloadItems,
                    contenedores: payloadContenedores,
                    materiales: campos.consumibles.map(c => ({
                        idLote: c.idLote || null,
                        idActivoFungible: c.idActivoFungible || null,
                        idContenedor: c.idContenedor || null,
                        cantidad: c.cantidad,
                        motivo: c.motivo
                    })),
                    carnetsRetenidos,
                });
            } else {
                await crearCanastaPrestamoEnBackend({
                    carnetEstudiante: campos.carnetsEstudiantes[0] || '',
                    carnetsEstudiantes: campos.carnetsEstudiantes,
                    idDocente: Number(campos.idDocente),
                    items: esDocente ? [] : payloadItems,
                    contenedores: payloadContenedores,
                    materiales: campos.consumibles.map(c => ({
                        idLote: c.idLote || null,
                        idActivoFungible: c.idActivoFungible || null,
                        idContenedor: c.idContenedor || null,
                        cantidad: c.cantidad,
                        motivo: c.motivo
                    })),
                    fechaPrestamo: campos.fechaPrestamo,
                    fechaDevolucion: campos.fechaDevolucion,
                    observaciones: campos.observaciones,
                    idInventario: Number(idInventarioSeleccionado) || undefined,
                    carnetsRetenidos,
                });
            }
            await recargarDatos();
            await onGuardado?.();
            onCerrar();
        } catch (err: any) {
            setError(err?.message ?? (esEdicion ? 'No se pudo actualizar la canasta.' : 'No se pudo registrar la canasta.'));
        } finally {
            setGuardando(false);
        }
    };

    const nombreEquipo = (id: string | null) => {
        if (!id) return '';
        const eq = herramientas.find((h) => h.id === id);
        if (!eq) return id;
        const inv = String(eq.codigoInventario ?? '').trim();
        const uni = String(eq.codigoUnico ?? '').trim();
        const etiqueta = inv || uni
            ? `I: ${inv || '—'} | U: ${uni || '—'}`
            : 'SIN-CODIGO';
        return `[${etiqueta}] ${eq.nombre}`;
    };

    const nombreEstudiante = (carnet: string) => {
        const estudiante = estudiantes.find((item) => item.carnet === carnet);
        if (!estudiante) return carnet;
        const asignaciones = estudiante.asignacionesCarrera?.length
            ? estudiante.asignacionesCarrera
            : [{ carrera: estudiante.carrera, cu: estudiante.cu ?? '' }];
        const carrerasStr = asignaciones.map(a => `${a.carrera} (CU: ${a.cu || '—'})`).join(' / ');
        return `[${estudiante.carnet}] ${estudiante.apellido}, ${estudiante.nombre} - ${carrerasStr}`;
    };

    const nombreDocente = (id: string) => {
        const docente = docentes.find((item) => item.id === id);
        return docente ? `[${docente.codigo}] ${docente.apellido}, ${docente.nombre}` : id;
    };

    const renderSeccionContenedoresDocente = () => {
        const contenedoresFijos = contenedores.filter((c: any) => c.tipo === 'fijo');
        return (
            <div className="rounded-md border border-slate-200 p-4 dark:border-slate-700 bg-slate-50/30 space-y-4">
                <div>
                    <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Equipos Solicitados</h3>
                    <p className="text-xs text-slate-500">Selecciona la cantidad de equipos que necesitas por tipo.</p>
                </div>
                {cargandoContenedores ? (
                    <div className="flex items-center justify-center py-6 text-xs text-slate-500">
                        <span className="animate-pulse">Cargando tipos de equipos disponibles...</span>
                    </div>
                ) : contenedoresFijos.length === 0 ? (
                    <p className="text-xs text-slate-400 py-4 text-center">No hay tipos de equipos disponibles en este inventario.</p>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {contenedoresFijos.map((cont: any) => {
                            const qty = cantidadesContenedores[cont.id] ?? 0;
                            return (
                                <div key={cont.id} className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-950/40 hover:border-slate-300 transition-colors">
                                    <div className="min-w-0 pr-2">
                                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate">{cont.nombre}</p>
                                        <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate">{cont.ubicacion || 'General'}</p>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <Boton
                                            type="button"
                                            variant="outline"
                                            size="icon"
                                            className="h-8 w-8 rounded-md hover:bg-slate-100 hover:text-slate-900 border-slate-200 dark:border-slate-800 dark:hover:bg-slate-900/60"
                                            onClick={() => {
                                                setCantidadesContenedores((prev) => ({
                                                    ...prev,
                                                    [cont.id]: Math.max(0, qty - 1),
                                                }));
                                            }}
                                            disabled={qty <= 0}
                                        >
                                            -
                                        </Boton>
                                        <Input
                                            type="number"
                                            min={0}
                                            value={qty}
                                            onChange={(e) => {
                                                const val = Math.max(0, parseInt(e.target.value) || 0);
                                                setCantidadesContenedores((prev) => ({
                                                    ...prev,
                                                    [cont.id]: val,
                                                }));
                                            }}
                                            className="h-8 w-14 text-center text-xs font-medium p-1 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                        />
                                        <Boton
                                            type="button"
                                            variant="outline"
                                            size="icon"
                                            className="h-8 w-8 rounded-md hover:bg-slate-100 hover:text-slate-900 border-slate-200 dark:border-slate-800 dark:hover:bg-slate-900/60"
                                            onClick={() => {
                                                setCantidadesContenedores((prev) => ({
                                                    ...prev,
                                                    [cont.id]: qty + 1,
                                                }));
                                            }}
                                        >
                                            +
                                        </Boton>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        );
    };

    const renderSeccionMaterialesDocente = () => {
        const contenedoresFungibles = contenedores.filter((c: any) => c.tipo === 'fungible');
        return (
            <div className="rounded-md border border-slate-200 p-4 dark:border-slate-700 bg-slate-50/30 space-y-4">
                <div>
                    <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Contenedores de Materiales Solicitados</h3>
                    <p className="text-xs text-slate-500">Selecciona los contenedores de materiales que necesitas.</p>
                </div>
                {cargandoContenedores ? (
                    <div className="flex items-center justify-center py-6 text-xs text-slate-500">
                        <span className="animate-pulse">Cargando contenedores de materiales...</span>
                    </div>
                ) : contenedoresFungibles.length === 0 ? (
                    <p className="text-xs text-slate-400 py-4 text-center">No hay contenedores de materiales disponibles en este inventario.</p>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {contenedoresFungibles.map((cont: any) => {
                            const qty = cantidadesContenedores[cont.id] ?? 0;
                            const seleccionado = qty > 0;

                            return (
                                <div key={cont.id} className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-950/40 hover:border-slate-300 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="checkbox"
                                            id={`chk-cont-${cont.id}`}
                                            checked={seleccionado}
                                            onChange={(e) => {
                                                setCantidadesContenedores((prev) => ({
                                                    ...prev,
                                                    [cont.id]: e.target.checked ? 1 : 0,
                                                }));
                                            }}
                                            className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                        />
                                        <label htmlFor={`chk-cont-${cont.id}`} className="cursor-pointer select-none min-w-0 pr-2">
                                            <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate">{cont.nombre}</p>
                                            <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate">{cont.ubicacion || 'General'}</p>
                                        </label>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        );
    };

    const renderFijosSeccion = () => {
        if (esDocente) {
            return renderSeccionContenedoresDocente();
        }
        return (
            <div className="rounded-md border border-slate-200 p-3 dark:border-slate-700">
                <div className="mb-2 flex items-center justify-between gap-3">
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">Equipos en canasta</p>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        {campos.equipos.filter((equipo) => equipo.registrado).length} de {campos.equipos.length} marcado(s) para registrar/descontar
                    </span>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                    <div className="flex-1">
                        <Combobox<OpcionSelector>
                            items={opcionesEquipos}
                            value={equipoSeleccionado}
                            onValueChange={setEquipoSeleccionado}
                            getItemValue={(opcion) => opcion.value}
                            getItemLabel={(opcion) => opcion.label}
                        >
                            <ComboboxInput placeholder="Buscar equipo para agregar..." showClear />
                            <ComboboxContent>
                                <ComboboxEmpty>No hay equipos disponibles.</ComboboxEmpty>
                                <ComboboxList<OpcionSelector>>
                                    {(opcion) => (
                                        <ComboboxItem key={opcion.value} value={opcion.value}>
                                            {opcion.label}
                                        </ComboboxItem>
                                    )}
                                </ComboboxList>
                            </ComboboxContent>
                        </Combobox>
                    </div>
                    <Boton type="button" onClick={agregarEquipo} disabled={!equipoSeleccionado} className="h-9 px-3 text-xs font-semibold">
                        Agregar
                    </Boton>
                </div>
                <div className="mt-3 space-y-2">
                    {campos.equipos.length === 0 ? (
                        <p className="text-[11px] text-slate-400 dark:text-slate-500">Sin equipos añadidos.</p>
                    ) : campos.equipos.map((equipo) => (
                        <div key={equipo.idHerramienta} className="flex items-start justify-between gap-3 rounded-md border border-slate-200 px-3 py-2 dark:border-slate-700">
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-xs font-medium text-slate-800 dark:text-slate-100">{nombreEquipo(equipo.idHerramienta)}</p>
                                <div className="mt-1 flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">

                                    {equipo.bloqueado ? (
                                        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                                            Ya registrado
                                        </span>
                                    ) : null}
                                </div>
                            </div>
                            <Boton
                                type="button"
                                variant="outline"
                                size="sm"
                                title={equipo.bloqueado ? 'No se puede quitar un equipo ya registrado' : 'Quitar equipo'}
                                onClick={() => quitarEquipo(equipo.idHerramienta)}
                                disabled={equipo.bloqueado}
                                className="h-7 px-2 text-[11px]"
                            >
                                Quitar
                            </Boton>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    const renderFungiblesSeccion = () => {
        if (esDocente) {
            return renderSeccionMaterialesDocente();
        }
        return (
            <div className="rounded-md border border-slate-200 p-3 dark:border-slate-700">
                <div className="mb-2 flex items-center justify-between gap-3">
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">Materiales Fungibles en canasta</p>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        {campos.consumibles.length} material(es) seleccionado(s)
                    </span>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row items-end">
                    <div className="flex-1 min-w-0">
                        <Label className="text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1 block">Buscar material</Label>
                        <Combobox<OpcionSelector>
                            items={opcionesFungibles}
                            value={fungibleSeleccionadoId}
                            onValueChange={setFungibleSeleccionadoId}
                            getItemValue={(opcion) => opcion.value}
                            getItemLabel={(opcion) => opcion.label}
                        >
                            <ComboboxInput placeholder="Buscar material para agregar..." showClear />
                            <ComboboxContent>
                                <ComboboxEmpty>No hay materiales disponibles.</ComboboxEmpty>
                                <ComboboxList<OpcionSelector>>
                                    {(opcion) => (
                                        <ComboboxItem key={opcion.value} value={opcion.value}>
                                            {opcion.label}
                                        </ComboboxItem>
                                    )}
                                </ComboboxList>
                            </ComboboxContent>
                        </Combobox>
                    </div>
                    <div className="w-full sm:w-24 shrink-0">
                        <Label className="text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1 block">Cantidad</Label>
                        <Input
                            type="number"
                            min={1}
                            value={cantFungible}
                            onChange={(e) => setCantFungible(Math.max(1, Number(e.target.value)))}
                            className="h-9 text-xs"
                        />
                    </div>
                    <div className="w-full sm:w-48 shrink-0">
                        <Label className="text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1 block">Motivo</Label>
                        <Input
                            type="text"
                            value={motivoFungible}
                            onChange={(e) => setMotivoFungible(e.target.value)}
                            className="h-9 text-xs"
                            placeholder="Motivo..."
                        />
                    </div>
                    <Boton type="button" onClick={agregarFungible} disabled={!fungibleSeleccionadoId} className="h-9 px-3 text-xs font-semibold w-full sm:w-auto shrink-0">
                        Agregar
                    </Boton>
                </div>

                <div className="mt-3 space-y-2">
                    {campos.consumibles.length === 0 ? (
                        <p className="text-[11px] text-slate-400 dark:text-slate-500">Sin materiales fungibles añadidos.</p>
                    ) : campos.consumibles.map((c) => {
                        const mat = materiales.find(m => m.id === c.idLote!);
                        const descLote = mat?.lote ? `Lote: ${mat.lote}` : (mat?.serie ? `Serie: ${mat.serie}` : 'Sistema');
                        return (
                            <div key={c.idLote!} className="flex flex-col gap-2 rounded-md border border-slate-200 px-3 py-2 dark:border-slate-700 bg-slate-50/20">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-xs font-medium text-slate-800 dark:text-slate-100">
                                            {mat?.nombre || 'Material'}
                                        </p>
                                        <p className="text-[10px] text-slate-500 dark:text-slate-400">
                                            [{descLote}] • Disp: {mat?.cantidadDisponible ?? 0} {mat?.unidad ?? 'unidades'}
                                        </p>
                                    </div>
                                    <Boton
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => quitarFungible(c.idLote!)}
                                        className="h-7 px-2 text-[11px]"
                                    >
                                        Quitar
                                    </Boton>
                                </div>
                                <div className="grid grid-cols-2 gap-2 mt-1 border-t border-slate-100 pt-2 dark:border-slate-800">
                                    <div className="flex items-center gap-2">
                                        <Label className="text-[10px] text-slate-500 w-16">Cant. Sol.:</Label>
                                        <Input
                                            type="number"
                                            min={1}
                                            max={mat?.cantidadDisponible}
                                            value={c.cantidad}
                                            onChange={(e) => cambiarCantFungible(c.idLote!, Math.max(1, Number(e.target.value)))}
                                            className="h-7 text-[11px] w-20 px-1.5"
                                        />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Label className="text-[10px] text-slate-500 w-12">Motivo:</Label>
                                        <Input
                                            type="text"
                                            value={c.motivo}
                                            onChange={(e) => cambiarMotivoFungible(c.idLote!, e.target.value)}
                                            className="h-7 text-[11px] flex-1 px-1.5"
                                        />
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    return (
        <>
            <ModalBase
                titulo={esEdicion ? `Editar canasta (${canasta?.id})` : (esDocente ? 'Solicitar préstamo' : 'Canasta de prestamo')}
                onCerrar={cierreSeguro.solicitarCierre}
                ancho="max-w-3xl"
                dialogClassName="h-[90vh]"
                bodyClassName="flex min-h-0 flex-col p-0"
                footer={
                    <div className="flex justify-end gap-2">
                            <Boton type="button" variant="outline" onClick={cierreSeguro.solicitarCierre} className="h-9 px-4 text-xs">Cancelar</Boton>
                        <Boton type="submit" form={formId} className="h-9 px-5 text-xs font-medium" disabled={guardando}>{guardando ? 'Guardando...' : (esEdicion ? 'Guardar cambios' : (esDocente ? 'Solicitar' : 'Despachar canasta'))}</Boton>
                    </div>
                }
            >
                <div className="flex-1 min-h-0 overflow-y-auto overflow-x-auto scroll-elegante">
                <form id={formId} onSubmit={manejarEnvio} className="flex min-h-0 flex-col p-4 sm:p-6 space-y-5 relative">
                    {(esDocente || !esEdicion) && (
                        <div className="flex flex-col gap-1 rounded-md border border-slate-200 bg-slate-50/50 p-3 dark:border-slate-700 dark:bg-slate-900/50">
                            <Label htmlFor="selector-inventario" className="text-xs font-medium text-slate-700 dark:text-slate-300">
                                Inventario Autorizado *
                            </Label>
                            <Combobox<{ value: string; label: string }>
                                items={misInventarios.map((inv) => ({ value: String(inv.id), label: `${inv.nombre} ${inv.descripcion ? `(${inv.descripcion})` : ''}`.trim() }))}
                                value={idInventarioSeleccionado}
                                onValueChange={(val) => { if (val) cambiarInventarioSeleccionado(val); }}
                                getItemValue={(item) => item.value}
                                getItemLabel={(item) => item.label}
                            >
                                <ComboboxInput id="selector-inventario" placeholder={misInventarios.length === 0 ? "Cargando inventarios autorizados..." : "Seleccionar inventario..."} disabled={misInventarios.length === 0} />
                                <ComboboxContent>
                                    <ComboboxEmpty>No se encontraron inventarios.</ComboboxEmpty>
                                    <ComboboxList<{ value: string; label: string }>>
                                        {(opcion) => (
                                            <ComboboxItem key={opcion.value} value={opcion.value}>
                                                {opcion.label}
                                            </ComboboxItem>
                                        )}
                                    </ComboboxList>
                                </ComboboxContent>
                            </Combobox>
                            <p className="text-[10px] text-slate-500 mt-1">
                                Solo se muestran los activos fijos asociados al inventario seleccionado. Al cambiar de inventario, se limpiarán los activos que no correspondan.
                            </p>
                        </div>
                    )}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {esDocente && !esEdicion ? (
                        <div className="flex flex-col gap-3 rounded-md border border-slate-200 p-3 dark:border-slate-700 bg-slate-50/20">
                            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Asignar Estudiantes *</label>
                            
                            <div className="flex flex-wrap items-center gap-4 text-xs">
                                <label className="flex items-center gap-1.5 cursor-pointer font-medium text-slate-700 dark:text-slate-300">
                                    <input
                                        type="radio"
                                        name="tipoSeleccionEstudiante"
                                        value="grupo"
                                        checked={tipoSeleccion === 'grupo'}
                                        onChange={() => {
                                            setTipoSeleccion('grupo');
                                            setMateriaSeleccionadaId('');
                                            setSubgrupoSeleccionadoId('');
                                            setCampos(prev => ({ ...prev, carnetsEstudiantes: [], carnetEstudiante: '' }));
                                        }}
                                        className="accent-indigo-650"
                                    />
                                    Por Grupo de Préstamo
                                </label>
                                <label className="flex items-center gap-1.5 cursor-pointer font-medium text-slate-700 dark:text-slate-300">
                                    <input
                                        type="radio"
                                        name="tipoSeleccionEstudiante"
                                        value="materia"
                                        checked={tipoSeleccion === 'materia'}
                                        onChange={() => {
                                            setTipoSeleccion('materia');
                                            setMateriaSeleccionadaId('');
                                            setSubgrupoSeleccionadoId('');
                                            setCampos(prev => ({ ...prev, carnetsEstudiantes: [], carnetEstudiante: '' }));
                                        }}
                                        className="accent-indigo-650"
                                    />
                                    Por Estudiante de una Materia
                                </label>
                            </div>

                            <div className="flex flex-col gap-1">
                                <label className="text-[11px] font-medium text-slate-650 dark:text-slate-400">Materia *</label>
                                <Combobox<{ value: string; label: string }>
                                    items={gruposActivos.map((g) => ({ value: g.id, label: `${obtenerCodigoMateria(g)} - ${obtenerNombreMateria(g, materiasPorCodigo)} (Grupo ${g.grupo || g.nombreGrupo})` }))}
                                    value={materiaSeleccionadaId}
                                    onValueChange={(val) => {
                                        setMateriaSeleccionadaId(val);
                                        setSubgrupoSeleccionadoId('');
                                        setCampos(prev => ({ ...prev, carnetsEstudiantes: [], carnetEstudiante: '' }));
                                    }}
                                    getItemValue={(item) => item.value}
                                    getItemLabel={(item) => item.label}
                                >
                                    <ComboboxInput placeholder="Selecciona una materia..." showClear />
                                    <ComboboxContent>
                                        <ComboboxEmpty>No se encontraron materias.</ComboboxEmpty>
                                        <ComboboxList<{ value: string; label: string }>>
                                            {(opcion) => (
                                                <ComboboxItem key={opcion.value} value={opcion.value}>
                                                    {opcion.label}
                                                </ComboboxItem>
                                            )}
                                        </ComboboxList>
                                    </ComboboxContent>
                                </Combobox>
                            </div>

                            {tipoSeleccion === 'grupo' ? (
                                <div className="flex flex-col gap-1">
                                    <label className="text-[11px] font-medium text-slate-650 dark:text-slate-400">Grupo de Préstamo *</label>
                                    <Combobox<{ value: string; label: string }>
                                        items={subgruposMateria.map((sub) => ({ value: sub.id, label: sub.codigo }))}
                                        value={subgrupoSeleccionadoId}
                                        onValueChange={(val) => {
                                            setSubgrupoSeleccionadoId(val);
                                            if (!val) {
                                                setCampos(prev => ({ ...prev, carnetsEstudiantes: [], carnetEstudiante: '' }));
                                                return;
                                            }
                                            const sub = subgruposMateria.find(s => s.id === val);
                                            if (sub) {
                                                const integranteCarnets = (sub.estudianteIds ?? [])
                                                    .map(id => estudiantes.find(est => Number(est.id) === id)?.carnet)
                                                    .filter((c): c is string => !!c);
                                                
                                                const respEstId = Number(sub.responsableEstudianteId);
                                                const respEst = estudiantes.find(est => Number(est.id) === respEstId);
                                                const respCarnet = respEst?.carnet || integranteCarnets[0] || '';

                                                setCarnetsRetenidos(integranteCarnets);
                                                setCampos(prev => {
                                                    const tag = `[Grupo: ${sub.codigo}]`;
                                                    let obs = prev.observaciones || '';
                                                    if (!obs.includes(tag)) {
                                                        obs = obs ? `${tag} ${obs}` : tag;
                                                    }
                                                    return {
                                                        ...prev,
                                                        carnetsEstudiantes: integranteCarnets,
                                                        carnetEstudiante: respCarnet,
                                                        observaciones: obs
                                                    };
                                                });
                                            }
                                        }}
                                        getItemValue={(item) => item.value}
                                        getItemLabel={(item) => item.label}
                                    >
                                        <ComboboxInput 
                                            placeholder={cargandoSubgrupos ? "Cargando grupos de préstamo..." : (!materiaSeleccionadaId ? "Selecciona primero una materia" : "Selecciona un grupo...")} 
                                            showClear 
                                            disabled={!materiaSeleccionadaId || cargandoSubgrupos} 
                                        />
                                        <ComboboxContent>
                                            <ComboboxEmpty>No se encontraron grupos de préstamo.</ComboboxEmpty>
                                            <ComboboxList<{ value: string; label: string }>>
                                                {(opcion) => (
                                                    <ComboboxItem key={opcion.value} value={opcion.value}>
                                                        {opcion.label}
                                                    </ComboboxItem>
                                                )}
                                            </ComboboxList>
                                        </ComboboxContent>
                                    </Combobox>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-2">
                                    <label className="text-[11px] font-medium text-slate-655 dark:text-slate-400">Estudiante *</label>
                                    <Combobox<OpcionSelector>
                                        items={opcionesEstudiantesCombobox}
                                        value={estudianteSeleccionado}
                                        onValueChange={(value) => {
                                            if (value === OPCION_REGISTRAR_ESTUDIANTE) {
                                                setEstudianteSeleccionado('');
                                                abrirAlta('estudiante');
                                                return;
                                            }
                                            setEstudianteSeleccionado(value);
                                        }}
                                        getItemValue={(opcion) => opcion.value}
                                        getItemLabel={(opcion) => opcion.label}
                                    >
                                        <ComboboxInput placeholder={materiaSeleccionadaId ? "Buscar estudiante..." : "Selecciona primero una materia"} showClear disabled={!materiaSeleccionadaId} />
                                        <ComboboxContent>
                                            <ComboboxEmpty>No se encontraron estudiantes.</ComboboxEmpty>
                                            <ComboboxList<OpcionSelector>>
                                                {(opcion) => (
                                                    <ComboboxItem
                                                        key={opcion.value}
                                                        value={opcion.value}
                                                        className={opcion.value === OPCION_REGISTRAR_ESTUDIANTE ? 'border-t text-blue-600 font-medium dark:text-blue-400' : undefined}
                                                    >
                                                        {opcion.label}
                                                    </ComboboxItem>
                                                )}
                                            </ComboboxList>
                                        </ComboboxContent>
                                    </Combobox>
                                    <div className="flex items-center justify-between gap-2">
                                        <p className="text-[11px] text-slate-500 dark:text-slate-400">Añadir confirma la selección actual en la canasta.</p>
                                        <Boton type="button" onClick={agregarEstudianteSeleccionado} disabled={!estudianteSeleccionado} className="h-8 px-3 text-xs font-semibold">
                                            Añadir
                                        </Boton>
                                    </div>
                                </div>
                            )}

                            <div className="flex flex-wrap gap-2 pt-1">
                                {campos.carnetsEstudiantes.length > 0 ? (
                                    campos.carnetsEstudiantes.map((carnet) => (
                                        <span key={carnet} className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-[11px] text-blue-700 max-w-full">
                                            <span className="truncate max-w-[240px] sm:max-w-[360px]" title={nombreEstudiante(carnet)}>
                                                {nombreEstudiante(carnet)}
                                            </span>
                                            {tipoSeleccion === 'materia' && (
                                                <Boton type="button" variant="outline" size="sm" title="Quitar estudiante" onClick={() => quitarEstudianteSeleccionado(carnet)} className="h-5 w-5 px-0 text-[10px] leading-none shrink-0">
                                                    x
                                                </Boton>
                                            )}
                                        </span>
                                    ))
                                ) : (
                                    <span className="text-[11px] text-slate-400 dark:text-slate-500">Sin estudiantes añadidos.</span>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-2 rounded-md border border-slate-200 p-3 dark:border-slate-700">
                            <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Estudiante *</label>
                            <Combobox<OpcionSelector>
                                items={opcionesEstudiantesCombobox}
                                value={estudianteSeleccionado}
                                onValueChange={(value) => {
                                    if (value === OPCION_REGISTRAR_ESTUDIANTE) {
                                        setEstudianteSeleccionado('');
                                        abrirAlta('estudiante');
                                        return;
                                    }
                                    setEstudianteSeleccionado(value);
                                }}
                                getItemValue={(opcion) => opcion.value}
                                getItemLabel={(opcion) => opcion.label}
                            >
                                <ComboboxInput placeholder="Buscar estudiante..." showClear />
                                <ComboboxContent>
                                    <ComboboxEmpty>No se encontraron estudiantes.</ComboboxEmpty>
                                    <ComboboxList<OpcionSelector>>
                                        {(opcion) => (
                                            <ComboboxItem
                                                key={opcion.value}
                                                value={opcion.value}
                                                className={opcion.value === OPCION_REGISTRAR_ESTUDIANTE ? 'border-t text-blue-600 font-medium dark:text-blue-400' : undefined}
                                            >
                                                {opcion.label}
                                            </ComboboxItem>
                                        )}
                                    </ComboboxList>
                                </ComboboxContent>
                            </Combobox>
                            <div className="flex items-center justify-between gap-2">
                                <p className="text-[11px] text-slate-500 dark:text-slate-400">Añadir confirma la selección actual en la canasta.</p>
                                <Boton type="button" onClick={agregarEstudianteSeleccionado} disabled={!estudianteSeleccionado} className="h-8 px-3 text-xs font-semibold">
                                    Añadir
                                </Boton>
                            </div>
                            <div className="space-y-2 mt-2">
                                {campos.carnetsEstudiantes.length > 0 ? (
                                    <>
                                        {!esDocente && (
                                            <p className="text-[11px] text-slate-400 mb-1">
                                                Marca la casilla de cada estudiante al que se le retendrá físicamente el CU:
                                            </p>
                                        )}
                                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                            {campos.carnetsEstudiantes.map((carnet) => {
                                                const isRetained = carnetsRetenidos.includes(carnet);
                                                return (
                                                    <div key={carnet} className="flex items-center justify-between gap-2 rounded-md border border-slate-100 p-2 dark:border-slate-800 bg-slate-50/50">
                                                        <div className="flex items-center gap-2 min-w-0">
                                                            {!esDocente && (
                                                                <input
                                                                    type="checkbox"
                                                                    id={`retener-crear-${carnet}`}
                                                                    checked={isRetained}
                                                                    onChange={(e) => {
                                                                        setCarnetsRetenidos(prev => 
                                                                            e.target.checked 
                                                                                ? [...prev, carnet] 
                                                                                : prev.filter(c => c !== carnet)
                                                                        );
                                                                    }}
                                                                    className="h-4 w-4 cursor-pointer rounded border-slate-300 text-blue-600 focus:ring-blue-500 shrink-0"
                                                                />
                                                            )}
                                                            <Label 
                                                                htmlFor={`retener-crear-${carnet}`} 
                                                                className="cursor-pointer select-none text-xs font-medium text-slate-700 dark:text-slate-300 truncate max-w-[200px] sm:max-w-[285px]" 
                                                                title={nombreEstudiante(carnet)}
                                                            >
                                                                {nombreEstudiante(carnet)}
                                                            </Label>
                                                        </div>
                                                        <Boton 
                                                            type="button" 
                                                            variant="ghost" 
                                                            size="icon" 
                                                            title="Quitar estudiante" 
                                                            onClick={() => {
                                                                quitarEstudianteSeleccionado(carnet);
                                                            }} 
                                                            className="h-7 w-7 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 shrink-0"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Boton>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </>
                                ) : (
                                    <span className="text-[11px] text-slate-400 dark:text-slate-500">Sin estudiantes añadidos.</span>
                                )}
                            </div>
                        </div>
                    )}
                    <div className="flex flex-col gap-2 rounded-md border border-slate-200 p-3 dark:border-slate-700">
                        <Label className="text-xs font-medium text-slate-700 dark:text-slate-300">Docente *</Label>
                        {esDocente ? (
                            <div className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-700 dark:border-blue-900/40 dark:bg-blue-950/30 dark:text-blue-300">
                                {docentePredeterminado
                                    ? `Asignado automáticamente: ${nombreDocente(docentePredeterminado.id)}`
                                    : 'No se encontró tu perfil docente asociado.'}
                            </div>
                        ) : (
                            <>
                                <Combobox<OpcionSelector>
                                    items={opcionesDocentesCombobox}
                                    value={docenteSeleccionado}
                                    onValueChange={(value) => {
                                        if (value === OPCION_REGISTRAR_DOCENTE) {
                                            setDocenteSeleccionado('');
                                            abrirAlta('docente');
                                            return;
                                        }
                                        setDocenteSeleccionado(value);
                                    }}
                                    getItemValue={(opcion) => opcion.value}
                                    getItemLabel={(opcion) => opcion.label}
                                >
                                    <ComboboxInput placeholder="Buscar docente..." showClear />
                                    <ComboboxContent>
                                        <ComboboxEmpty>No se encontraron docentes.</ComboboxEmpty>
                                        <ComboboxList<OpcionSelector>>
                                            {(opcion) => (
                                                <ComboboxItem
                                                    key={opcion.value}
                                                    value={opcion.value}
                                                    className={opcion.value === OPCION_REGISTRAR_DOCENTE ? 'border-t text-blue-600 font-medium dark:text-blue-400' : undefined}
                                                >
                                                    {opcion.label}
                                                </ComboboxItem>
                                            )}
                                        </ComboboxList>
                                    </ComboboxContent>
                                </Combobox>
                                <div className="flex items-center justify-between gap-2">
                                    <p className="text-[11px] text-slate-500 dark:text-slate-400">Solo se permite un docente por canasta.</p>
                                    <Boton type="button" onClick={agregarDocenteSeleccionado} disabled={!docenteSeleccionado || !!campos.idDocente} className="h-8 px-3 text-xs font-semibold">
                                        Añadir
                                    </Boton>
                                </div>
                            </>
                        )}
                        <div className="flex flex-wrap gap-2">
                            {campos.idDocente ? (
                                <span className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-[11px] text-blue-700 max-w-full">
                                    <span className="truncate max-w-[240px] sm:max-w-[360px]" title={nombreDocente(campos.idDocente)}>
                                        {nombreDocente(campos.idDocente)}
                                    </span>
                                    {!esDocente && (
                                        <Boton type="button" variant="outline" size="sm" title="Quitar docente" onClick={quitarDocenteSeleccionado} className="h-5 w-5 px-0 text-[10px] leading-none shrink-0">
                                            x
                                        </Boton>
                                    )}
                                </span>
                            ) : (
                                <span className="text-[11px] text-slate-400 dark:text-slate-500">Sin docente añadido.</span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="flex flex-col gap-1">
                        <Label className="text-xs font-medium text-slate-700 dark:text-slate-300">Fecha/hora prestamo</Label>
                        <DateTimePicker
                            title="Fecha prestamo"
                            value={campos.fechaPrestamo}
                            onChange={(value) => {
                                setError('');
                                setCampos((p) => {
                                    const nextCampos = { ...p, fechaPrestamo: value };
                                    if (!esEdicion) {
                                        if (!nextCampos.fechaDevolucion || new Date(nextCampos.fechaDevolucion).getTime() <= new Date(value).getTime()) {
                                            nextCampos.fechaDevolucion = sumarHorasInputLocal(value, 2);
                                        }
                                    }
                                    return nextCampos;
                                });
                            }}
                            className="w-full"
                            dateButtonClassName="w-full"
                        />
                    </div>
                    <div className="flex flex-col gap-1">
                        <Label className="text-xs font-medium text-slate-700 dark:text-slate-300">Fecha/hora devolucion</Label>
                        <DateTimePicker
                            title="Fecha devolucion"
                            value={campos.fechaDevolucion}
                            onChange={(value) => {
                                setError('');
                                setCampos((p) => ({ ...p, fechaDevolucion: value }));
                            }}
                            className="w-full"
                            dateButtonClassName="w-full"
                        />
                    </div>
                </div>

                {mostrarTabs ? (
                    <Tabs defaultValue="equipos" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="equipos" className="text-xs">Activos Fijos</TabsTrigger>
                            <TabsTrigger value="materiales" className="text-xs">Activos Fungibles</TabsTrigger>
                        </TabsList>
                        <TabsContent value="equipos" className="mt-4 space-y-4">
                            {renderFijosSeccion()}
                        </TabsContent>
                        <TabsContent value="materiales" className="mt-4 space-y-4">
                            {renderFungiblesSeccion()}
                        </TabsContent>
                    </Tabs>
                ) : tienePermisoFungibles ? (
                    <div className="space-y-4 mt-2">
                        <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Activos Fungibles</Label>
                        {renderFungiblesSeccion()}
                    </div>
                ) : (
                    <div className="space-y-4 mt-2">
                        <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Activos Fijos</Label>
                        {renderFijosSeccion()}
                    </div>
                )}



                {error && <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>}
                </form>
                </div>
            </ModalBase>

            {cierreSeguro.confirmacionAbierta && (
                <ModalBase titulo="Descartar cambios" onCerrar={cierreSeguro.cancelarCierre} ancho="max-w-sm">
                    <div className="space-y-4">
                        <p className="text-sm text-slate-600 dark:text-slate-300">{cierreSeguro.mensajeConfirmacion}</p>
                        <div className="flex justify-end gap-2">
                            <Boton type="button" variant="outline" onClick={cierreSeguro.cancelarCierre}>
                                Seguir editando
                            </Boton>
                            <Boton type="button" variant="destructive" onClick={cierreSeguro.confirmarCierre}>
                                Descartar
                            </Boton>
                        </div>
                    </div>
                </ModalBase>
            )}

            {modalAlta === 'estudiante' && (
                <>
                    <ModalBase titulo="Añadir estudiante" onCerrar={cierreSeguroAltaEstudiante.solicitarCierre} ancho="max-w-lg">
                    <form onSubmit={manejarCrearEstudiante} className="space-y-4">
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <div className="space-y-1">
                                <Label htmlFor="nuevo-estudiante-carnet">Carnet</Label>
                                <Input id="nuevo-estudiante-carnet" value={nuevoEstudiante.carnet} onChange={(e) => setNuevoEstudiante((prev) => ({ ...prev, carnet: e.target.value }))} required />
                            </div>

                        </div>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <div className="space-y-1">
                                <Label htmlFor="nuevo-estudiante-nombre">Nombre</Label>
                                <Input id="nuevo-estudiante-nombre" value={nuevoEstudiante.nombre} onChange={(e) => setNuevoEstudiante((prev) => ({ ...prev, nombre: e.target.value }))} required />
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="nuevo-estudiante-apellido">Apellido</Label>
                                <Input id="nuevo-estudiante-apellido" value={nuevoEstudiante.apellido} onChange={(e) => setNuevoEstudiante((prev) => ({ ...prev, apellido: e.target.value }))} required />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="nuevo-estudiante-carrera">Carrera</Label>
                            <Input id="nuevo-estudiante-carrera" value={nuevoEstudiante.carrera} onChange={(e) => setNuevoEstudiante((prev) => ({ ...prev, carrera: e.target.value }))} required />
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="nuevo-estudiante-cu">CU</Label>
                            <Input id="nuevo-estudiante-cu" value={nuevoEstudiante.cu} onChange={(e) => setNuevoEstudiante((prev) => ({ ...prev, cu: e.target.value.toUpperCase() }))} required />
                        </div>

                        {errorAlta && <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">{errorAlta}</p>}

                        <div className="flex justify-end gap-2">
                            <Boton type="button" variant="outline" onClick={cierreSeguroAltaEstudiante.solicitarCierre} className="h-9 px-4 text-xs">Cancelar</Boton>
                            <Boton type="submit" className="h-9 px-5 text-xs" disabled={guardandoAlta}>{guardandoAlta ? 'Guardando...' : 'Guardar estudiante'}</Boton>
                        </div>
                    </form>
                    </ModalBase>

                    {cierreSeguroAltaEstudiante.confirmacionAbierta && (
                        <ModalBase titulo="Descartar cambios" onCerrar={cierreSeguroAltaEstudiante.cancelarCierre} ancho="max-w-sm">
                            <div className="space-y-4">
                                <p className="text-sm text-slate-600 dark:text-slate-300">{cierreSeguroAltaEstudiante.mensajeConfirmacion}</p>
                                <div className="flex justify-end gap-2">
                                    <Boton type="button" variant="outline" onClick={cierreSeguroAltaEstudiante.cancelarCierre}>
                                        Seguir editando
                                    </Boton>
                                    <Boton type="button" variant="destructive" onClick={cierreSeguroAltaEstudiante.confirmarCierre}>
                                        Descartar
                                    </Boton>
                                </div>
                            </div>
                        </ModalBase>
                    )}
                </>
            )}

            {modalAlta === 'docente' && (
                <>
                    <ModalBase titulo="Añadir docente" onCerrar={cierreSeguroAltaDocente.solicitarCierre} ancho="max-w-lg">
                    <form onSubmit={manejarCrearDocente} className="space-y-4">
                        <div className="grid gap-1">
                            <Label htmlFor="nuevo-docente-correo">Correo</Label>
                            <Input id="nuevo-docente-correo" type="email" value={nuevoDocente.correo} onChange={(e) => setNuevoDocente((prev) => ({ ...prev, correo: e.target.value }))} required />
                        </div>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <div className="space-y-1">
                                <Label htmlFor="nuevo-docente-codigo">Código</Label>
                                <Input id="nuevo-docente-codigo" value={nuevoDocente.codigo} onChange={(e) => setNuevoDocente((prev) => ({ ...prev, codigo: e.target.value }))} required />
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="nuevo-docente-carnet">Carnet</Label>
                                <Input id="nuevo-docente-carnet" value={nuevoDocente.carnet} onChange={(e) => setNuevoDocente((prev) => ({ ...prev, carnet: e.target.value }))} required />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <div className="space-y-1">
                                <Label htmlFor="nuevo-docente-nombre">Nombre</Label>
                                <Input id="nuevo-docente-nombre" value={nuevoDocente.nombre} onChange={(e) => setNuevoDocente((prev) => ({ ...prev, nombre: e.target.value }))} required />
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="nuevo-docente-apellido">Apellido</Label>
                                <Input id="nuevo-docente-apellido" value={nuevoDocente.apellido} onChange={(e) => setNuevoDocente((prev) => ({ ...prev, apellido: e.target.value }))} required />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="nuevo-docente-materia">Materia</Label>
                            <Input id="nuevo-docente-materia" value={nuevoDocente.materia} onChange={(e) => setNuevoDocente((prev) => ({ ...prev, materia: e.target.value }))} required />
                        </div>

                        {errorAlta && <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">{errorAlta}</p>}

                        <div className="flex justify-end gap-2">
                            <Boton type="button" variant="outline" onClick={cierreSeguroAltaDocente.solicitarCierre} className="h-9 px-4 text-xs">Cancelar</Boton>
                            <Boton type="submit" className="h-9 px-5 text-xs" disabled={guardandoAlta}>{guardandoAlta ? 'Guardando...' : 'Guardar docente'}</Boton>
                        </div>
                    </form>
                    </ModalBase>

                    {cierreSeguroAltaDocente.confirmacionAbierta && (
                        <ModalBase titulo="Descartar cambios" onCerrar={cierreSeguroAltaDocente.cancelarCierre} ancho="max-w-sm">
                            <div className="space-y-4">
                                <p className="text-sm text-slate-600 dark:text-slate-300">{cierreSeguroAltaDocente.mensajeConfirmacion}</p>
                                <div className="flex justify-end gap-2">
                                    <Boton type="button" variant="outline" onClick={cierreSeguroAltaDocente.cancelarCierre}>
                                        Seguir editando
                                    </Boton>
                                    <Boton type="button" variant="destructive" onClick={cierreSeguroAltaDocente.confirmarCierre}>
                                        Descartar
                                    </Boton>
                                </div>
                            </div>
                        </ModalBase>
                    )}
                </>
            )}
        </>
    );
};

