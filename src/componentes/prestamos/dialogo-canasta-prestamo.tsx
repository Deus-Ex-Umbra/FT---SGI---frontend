import { useMemo, useState } from 'react';
import { ModalBase } from '@/componentes/inventario/modal-base';
import { Boton } from '@/componentes/ui/button';
import { Input } from '@/componentes/ui/input';
import { Label } from '@/componentes/ui/label';
import { Combobox, ComboboxContent, ComboboxEmpty, ComboboxInput, ComboboxItem, ComboboxList } from '@/componentes/ui/combobox';
import { DateTimePicker } from '@/componentes/ui/date-time-picker';
import { ScrollArea } from '@/componentes/ui/scroll-area';
import type { CanastaPrestamo } from '@/tipos/inventario';
import { ahoraInputLocal, sumarHorasInputLocal } from '@/lib/fecha-local';
import { crearCanastaPrestamoEnBackend } from '@/lib/servicio-inventario';
import { useInventario } from '@/contextos/ContextoInventario';
import { useCierreSeguro } from '@/hooks/use-cierre-seguro';
import { normalizarEstadoItem } from '@/lib/estados-activo';

interface Props {
    onCerrar: () => void;
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
    semestre: string;
}

interface NuevoDocenteForm {
    codigo: string;
    nombre: string;
    apellido: string;
    materia: string;
    carnet: string;
}

const NUEVO_ESTUDIANTE_INICIAL: NuevoEstudianteForm = {
    carnet: '',
    nombre: '',
    apellido: '',
    carrera: '',
    semestre: '1',
};

const NUEVO_DOCENTE_INICIAL: NuevoDocenteForm = {
    codigo: '',
    nombre: '',
    apellido: '',
    materia: '',
    carnet: '',
};

export const FormularioCanastaPrestamo = ({ onCerrar }: Props) => {
    const { estudiantes, docentes, herramientas, prestamos, recargarDatos, agregarEstudiante, agregarDocente } = useInventario();
    const inicio = ahoraInputLocal();
    const formId = 'formulario-canasta-prestamo';

    const [campos, setCampos] = useState<CanastaPrestamo>({
        carnetsEstudiantes: [],
        idDocente: '',
        fechaPrestamo: inicio,
        fechaDevolucion: sumarHorasInputLocal(inicio, 2),
        observaciones: 'Despacho inicial de clase',
        equipos: [],
        consumibles: [],
    });

    const [camposIniciales] = useState<CanastaPrestamo>(() => ({
        carnetsEstudiantes: [],
        idDocente: '',
        fechaPrestamo: inicio,
        fechaDevolucion: sumarHorasInputLocal(inicio, 2),
        observaciones: 'Despacho inicial de clase',
        equipos: [],
        consumibles: [],
    }));
    const [estudianteSeleccionado, setEstudianteSeleccionado] = useState('');
    const [docenteSeleccionado, setDocenteSeleccionado] = useState('');
    const [equipoSeleccionado, setEquipoSeleccionado] = useState('');
    const [error, setError] = useState('');
    const [guardando, setGuardando] = useState(false);
    const [modalAlta, setModalAlta] = useState<'estudiante' | 'docente' | null>(null);
    const [nuevoEstudiante, setNuevoEstudiante] = useState<NuevoEstudianteForm>(NUEVO_ESTUDIANTE_INICIAL);
    const [nuevoDocente, setNuevoDocente] = useState<NuevoDocenteForm>(NUEVO_DOCENTE_INICIAL);
    const [errorAlta, setErrorAlta] = useState('');
    const [guardandoAlta, setGuardandoAlta] = useState(false);

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

    const estaSucio = useMemo(() => {
        const baseCambio = JSON.stringify(campos) !== JSON.stringify(camposIniciales);
        const seleccionesPendientes = Boolean(estudianteSeleccionado || docenteSeleccionado || equipoSeleccionado);
        return baseCambio || seleccionesPendientes;
    }, [campos, camposIniciales, docenteSeleccionado, equipoSeleccionado, estudianteSeleccionado]);

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
            String(nuevoEstudiante.semestre).trim() !== String(NUEVO_ESTUDIANTE_INICIAL.semestre).trim()
        );
    }, [modalAlta, nuevoEstudiante.apellido, nuevoEstudiante.carnet, nuevoEstudiante.carrera, nuevoEstudiante.nombre, nuevoEstudiante.semestre]);

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
            nuevoDocente.carnet.trim() !== NUEVO_DOCENTE_INICIAL.carnet
        );
    }, [modalAlta, nuevoDocente.apellido, nuevoDocente.carnet, nuevoDocente.codigo, nuevoDocente.materia, nuevoDocente.nombre]);

    const cierreSeguroAltaDocente = useCierreSeguro({
        estaSucio: estaSucioAltaDocente,
        estaCargando: guardandoAlta,
        alCerrar: cerrarAlta,
        mensajeConfirmacion: 'Hay datos del docente sin guardar. ¿Deseas cerrar y descartarlos?',
    });

    const equiposPrestados = useMemo(
        () => new Set(prestamos
            .filter((p) => p.estado !== 'devuelto' && p.estado !== 'devuelto_fuera_de_fecha_limite')
            .map((p) => p.idHerramienta)),
        [prestamos],
    );

    const equiposDisponibles = useMemo(
        () => herramientas.filter((h) => {
            const estado = normalizarEstadoItem(h.estado) ?? 'disponible';
            return estado === 'disponible' && !equiposPrestados.has(h.id);
        }),
        [equiposPrestados, herramientas],
    );

    const opcionesEstudiantes = useMemo<OpcionSelector[]>(() => (
        [...estudiantes]
            .sort((a, b) => `${a.apellido} ${a.nombre}`.localeCompare(`${b.apellido} ${b.nombre}`, 'es'))
            .filter((estudiante) => !campos.carnetsEstudiantes.includes(estudiante.carnet))
            .map((estudiante) => ({
                value: estudiante.carnet,
                label: `[${estudiante.carnet}] ${estudiante.apellido}, ${estudiante.nombre}`,
            }))
    ), [campos.carnetsEstudiantes, estudiantes]);

    const opcionesDocentes = useMemo<OpcionSelector[]>(() => (
        [...docentes]
            .sort((a, b) => `${a.apellido} ${a.nombre}`.localeCompare(`${b.apellido} ${b.nombre}`, 'es'))
            .filter((docente) => docente.id !== campos.idDocente)
            .map((docente) => ({
                value: docente.id,
                label: `[${docente.codigo}] ${docente.apellido}, ${docente.nombre}`,
            }))
    ), [campos.idDocente, docentes]);

    const opcionesEstudiantesCombobox = useMemo<OpcionSelector[]>(() => (
        [
            ...opcionesEstudiantes,
            { value: OPCION_REGISTRAR_ESTUDIANTE, label: 'Registrar nuevo estudiante...' },
        ]
    ), [opcionesEstudiantes]);

    const opcionesDocentesCombobox = useMemo<OpcionSelector[]>(() => (
        [
            ...opcionesDocentes,
            { value: OPCION_REGISTRAR_DOCENTE, label: 'Registrar nuevo docente...' },
        ]
    ), [opcionesDocentes]);

    const opcionesEquipos = useMemo<OpcionSelector[]>(() => (
        equiposDisponibles
            .filter((equipo) => !campos.equipos.includes(equipo.id))
            .map((equipo) => ({
                value: equipo.id,
                label: (() => {
                    const inv = String(equipo.codigoInventario ?? '').trim();
                    const uni = String(equipo.codigoUnico ?? '').trim();
                    const etiqueta = inv || uni
                        ? `I: ${inv || '—'} | U: ${uni || '—'}`
                        : 'SIN-CODIGO';
                    return `[${etiqueta}] ${equipo.nombre}`;
                })(),
            }))
    ), [campos.equipos, equiposDisponibles]);

    const agregarEquipo = () => {
        if (!equipoSeleccionado) return;
        if (campos.equipos.includes(equipoSeleccionado)) return;
        setCampos((prev) => ({ ...prev, equipos: [...prev.equipos, equipoSeleccionado] }));
        setEquipoSeleccionado('');
    };

    const quitarEquipo = (id: string) => {
        setCampos((prev) => ({ ...prev, equipos: prev.equipos.filter((e) => e !== id) }));
    };

    const agregarEstudianteSeleccionado = () => {
        if (!estudianteSeleccionado) return;
        if (campos.carnetsEstudiantes.includes(estudianteSeleccionado)) return;
        setCampos((prev) => ({
            ...prev,
            carnetsEstudiantes: [...prev.carnetsEstudiantes, estudianteSeleccionado],
            carnetEstudiante: prev.carnetEstudiante ?? estudianteSeleccionado,
        }));
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

        const semestre = Number(nuevoEstudiante.semestre);
        if (!Number.isFinite(semestre) || semestre <= 0) {
            setErrorAlta('El semestre debe ser mayor a 0.');
            return;
        }

        try {
            setGuardandoAlta(true);
            const creado = await agregarEstudiante({
                carnet: nuevoEstudiante.carnet.trim(),
                nombre: nuevoEstudiante.nombre.trim(),
                apellido: nuevoEstudiante.apellido.trim(),
                carrera: nuevoEstudiante.carrera.trim(),
                semestre,
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

        try {
            setGuardandoAlta(true);
            const creado = await agregarDocente({
                codigo: nuevoDocente.codigo.trim(),
                nombre: nuevoDocente.nombre.trim(),
                apellido: nuevoDocente.apellido.trim(),
                materia: nuevoDocente.materia.trim(),
                carnet: nuevoDocente.carnet.trim(),
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

        if (campos.carnetsEstudiantes.length === 0 || !campos.idDocente) {
            setError('Debes seleccionar estudiante y docente.');
            return;
        }
        if (campos.equipos.length === 0) {
            setError('La canasta debe tener al menos un activo fijo.');
            return;
        }

        try {
            setGuardando(true);
            await crearCanastaPrestamoEnBackend(campos);
            await recargarDatos();
            onCerrar();
        } catch (err: any) {
            setError(err?.message ?? 'No se pudo registrar la canasta.');
        } finally {
            setGuardando(false);
        }
    };

    const nombreEquipo = (id: string) => {
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
        return estudiante ? `[${estudiante.carnet}] ${estudiante.apellido}, ${estudiante.nombre}` : carnet;
    };

    const nombreDocente = (id: string) => {
        const docente = docentes.find((item) => item.id === id);
        return docente ? `[${docente.codigo}] ${docente.apellido}, ${docente.nombre}` : id;
    };

    return (
        <>
            <ModalBase
                titulo="Canasta de prestamo"
                onCerrar={cierreSeguro.solicitarCierre}
                ancho="max-w-3xl"
                dialogClassName="h-[90vh]"
                bodyClassName="flex min-h-0 flex-col p-0"
                footer={
                    <div className="flex justify-end gap-2">
                        <button type="button" onClick={cierreSeguro.solicitarCierre} className="h-9 rounded-md border border-slate-200 px-4 text-xs font-medium">Cancelar</button>
                        <Boton type="submit" form={formId} className="h-9 px-5 text-xs font-medium" disabled={guardando}>{guardando ? 'Guardando...' : 'Despachar canasta'}</Boton>
                    </div>
                }
            >
                <ScrollArea type="auto" className="flex-1 min-h-0">
                <form id={formId} onSubmit={manejarEnvio} className="flex min-h-0 flex-col p-4 sm:p-6 space-y-5 relative">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                            <button type="button" onClick={agregarEstudianteSeleccionado} disabled={!estudianteSeleccionado} className="h-8 rounded-md bg-blue-600 px-3 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">
                                Añadir
                            </button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {campos.carnetsEstudiantes.length > 0 ? (
                                campos.carnetsEstudiantes.map((carnet) => (
                                    <span key={carnet} className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-[11px] text-blue-700">
                                        {nombreEstudiante(carnet)}
                                        <button type="button" title="Quitar estudiante" onClick={() => quitarEstudianteSeleccionado(carnet)}>x</button>
                                    </span>
                                ))
                            ) : (
                                <span className="text-[11px] text-slate-400 dark:text-slate-500">Sin estudiante añadido.</span>
                            )}
                        </div>
                    </div>
                    <div className="flex flex-col gap-2 rounded-md border border-slate-200 p-3 dark:border-slate-700">
                        <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Docente *</label>
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
                            <button type="button" onClick={agregarDocenteSeleccionado} disabled={!docenteSeleccionado || !!campos.idDocente} className="h-8 rounded-md bg-blue-600 px-3 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">
                                Añadir
                            </button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {campos.idDocente ? (
                                <span className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-[11px] text-blue-700">
                                    {nombreDocente(campos.idDocente)}
                                    <button type="button" title="Quitar docente" onClick={quitarDocenteSeleccionado}>x</button>
                                </span>
                            ) : (
                                <span className="text-[11px] text-slate-400 dark:text-slate-500">Sin docente añadido.</span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Fecha/hora prestamo</label>
                        <DateTimePicker title="Fecha prestamo" value={campos.fechaPrestamo} onChange={(value) => setCampos((p) => ({ ...p, fechaPrestamo: value }))} className="w-full" dateButtonClassName="w-full" />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Fecha/hora devolucion</label>
                        <DateTimePicker title="Fecha devolucion" value={campos.fechaDevolucion} onChange={(value) => setCampos((p) => ({ ...p, fechaDevolucion: value }))} className="w-full" dateButtonClassName="w-full" />
                    </div>
                </div>

                <div className="rounded-md border border-slate-200 p-3 dark:border-slate-700">
                    <p className="mb-2 text-xs font-semibold text-slate-700 dark:text-slate-300">Equipos en canasta</p>
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
                        <button type="button" onClick={agregarEquipo} disabled={!equipoSeleccionado} className="h-9 rounded-md bg-blue-600 px-3 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">
                            Agregar
                        </button>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                        {campos.equipos.map((id) => (
                            <span key={id} className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-[11px] text-blue-700">
                                {nombreEquipo(id)}
                                <button type="button" title="Quitar equipo" onClick={() => quitarEquipo(id)}>x</button>
                            </span>
                        ))}
                    </div>
                </div>

                <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Observaciones</label>
                    <textarea title="Observaciones" rows={2} value={campos.observaciones ?? ''} onChange={(e) => setCampos((p) => ({ ...p, observaciones: e.target.value }))} className="rounded-md border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100" />
                </div>

                {error && <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>}
                </form>
                </ScrollArea>
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
                            <div className="space-y-1">
                                <Label htmlFor="nuevo-estudiante-semestre">Semestre</Label>
                                <Input id="nuevo-estudiante-semestre" type="number" min={1} value={nuevoEstudiante.semestre} onChange={(e) => setNuevoEstudiante((prev) => ({ ...prev, semestre: e.target.value }))} required />
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

                        {errorAlta && <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">{errorAlta}</p>}

                        <div className="flex justify-end gap-2">
                            <button type="button" onClick={cierreSeguroAltaEstudiante.solicitarCierre} className="h-9 rounded-md border border-slate-200 px-4 text-xs">Cancelar</button>
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
                            <button type="button" onClick={cierreSeguroAltaDocente.solicitarCierre} className="h-9 rounded-md border border-slate-200 px-4 text-xs">Cancelar</button>
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
