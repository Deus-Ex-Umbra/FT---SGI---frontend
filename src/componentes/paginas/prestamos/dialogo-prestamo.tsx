import { useEffect, useMemo, useState } from 'react';
import type { Prestamo } from '@/tipos/inventario';
import { ModalBase } from '@/componentes/paginas/inventario/modal-base';
import { Boton } from '@/componentes/ui/button';
import { Label } from '@/componentes/ui/label';
import { Textarea } from '@/componentes/ui/textarea';
import { DateTimePicker } from '@/componentes/ui/date-time-picker';
import { Combobox, ComboboxContent, ComboboxEmpty, ComboboxInput, ComboboxItem, ComboboxList } from '@/componentes/ui/combobox';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/componentes/ui/tabs';
import { useInventario } from '@/contextos/ContextoInventario';
import { ahoraInputLocal, apiDateTimeAInputLocal, sumarHorasInputLocal } from '@/utilidades/fechas';
import { useCierreSeguro } from '@/hooks/use-cierre-seguro';
import { normalizarEstadoItem } from '@/utilidades/estados-activo';
import { listarMisInventarios } from '@/lib/servicio-autenticacion';

interface Props {
    onCerrar: () => void;
    prestamo?: Prestamo;
}

const nombreCompletoDocente = (docente: { nombre: string; apellido: string }): string => `${docente.nombre} ${docente.apellido}`.trim();

export const DialogoPrestamo = ({ onCerrar, prestamo }: Props) => {
    const { agregarPrestamo, editarPrestamo, herramientas, estudiantes, docentes, prestamos } = useInventario();
    const esEdicion = !!prestamo;
    const inicio = ahoraInputLocal();
    const formId = 'dialogo-prestamo-form';

    const resolverIdDocentePorNombre = (nombre: string): string => {
        const buscado = nombre.trim().toLowerCase();
        const encontrado = docentes.find((d) => nombreCompletoDocente(d).toLowerCase() === buscado);
        return encontrado?.id ?? '';
    };

    const construirCamposIniciales = () => ({
        carnetEstudiante: prestamo?.carnetEstudiante ?? '',
        idHerramienta: prestamo?.idHerramienta ?? '',
        idDocente: prestamo ? resolverIdDocentePorNombre(prestamo.docente) : '',
        fechaPrestamo: prestamo ? apiDateTimeAInputLocal(prestamo.fechaPrestamo) : inicio,
        fechaDevolucion: prestamo
            ? apiDateTimeAInputLocal(prestamo.fechaDevolucion)
            : sumarHorasInputLocal(inicio, 24),
        observaciones: prestamo?.observaciones ?? '',
        carnetRetenido: prestamo?.carnetRetenido ?? false,
    });

    const [campos, setCampos] = useState(() => construirCamposIniciales());
    const [camposIniciales, setCamposIniciales] = useState(() => construirCamposIniciales());

    useEffect(() => {
        const inicioLocal = ahoraInputLocal();
        const siguientes = {
            carnetEstudiante: prestamo?.carnetEstudiante ?? '',
            idHerramienta: prestamo?.idHerramienta ?? '',
            idDocente: prestamo ? resolverIdDocentePorNombre(prestamo.docente) : '',
            fechaPrestamo: prestamo ? apiDateTimeAInputLocal(prestamo.fechaPrestamo) : inicioLocal,
            fechaDevolucion: prestamo
                ? apiDateTimeAInputLocal(prestamo.fechaDevolucion)
                : sumarHorasInputLocal(inicioLocal, 24),
            observaciones: prestamo?.observaciones ?? '',
            carnetRetenido: prestamo?.carnetRetenido ?? false,
        };
        setCampos(siguientes);
        setCamposIniciales(siguientes);
    }, [prestamo?.id]);

    useEffect(() => {
        if (!prestamo) return;
        setCampos((prev) => {
            if (prev.idDocente) return prev;
            const idDocente = resolverIdDocentePorNombre(prestamo.docente);
            return idDocente ? { ...prev, idDocente } : prev;
        });
    }, [docentes.length, prestamo?.id]);

    const [misInventarios, setMisInventarios] = useState<Array<{ id: number; nombre: string; puedeEditarFungibles?: boolean; puedeEditarFijos?: boolean }>>([]);
    useEffect(() => {
        const cargar = async () => {
            try {
                const lista = await listarMisInventarios();
                setMisInventarios(lista);
            } catch (err) {
                console.error(err);
            }
        };
        cargar();
    }, []);

    const tienePermisoFungibles = useMemo(() => {
        if (!campos.idHerramienta) return false;
        const h = herramientas.find((it) => it.id === campos.idHerramienta);
        if (!h?.idInventario) return false;
        const inv = misInventarios.find((i) => Number(i.id) === Number(h.idInventario));
        return inv ? inv.puedeEditarFungibles === true : false;
    }, [campos.idHerramienta, herramientas, misInventarios]);

    const tienePermisoFijos = useMemo(() => {
        if (!campos.idHerramienta) return false;
        const h = herramientas.find((it) => it.id === campos.idHerramienta);
        if (!h?.idInventario) return false;
        const inv = misInventarios.find((i) => Number(i.id) === Number(h.idInventario));
        return inv ? inv.puedeEditarFijos === true : false;
    }, [campos.idHerramienta, herramientas, misInventarios]);

    const mostrarTabs = tienePermisoFungibles && tienePermisoFijos;

    const [error, setError] = useState('');
    const [guardando, setGuardando] = useState(false);

    const estaSucio = useMemo(() => {
        const normalizar = (v: string) => v.trim();
        return (
            normalizar(campos.carnetEstudiante) !== normalizar(camposIniciales.carnetEstudiante) ||
            normalizar(campos.idHerramienta) !== normalizar(camposIniciales.idHerramienta) ||
            normalizar(campos.idDocente) !== normalizar(camposIniciales.idDocente) ||
            normalizar(campos.fechaPrestamo) !== normalizar(camposIniciales.fechaPrestamo) ||
            normalizar(campos.fechaDevolucion) !== normalizar(camposIniciales.fechaDevolucion) ||
            normalizar(campos.observaciones) !== normalizar(camposIniciales.observaciones) ||
            campos.carnetRetenido !== camposIniciales.carnetRetenido
        );
    }, [campos, camposIniciales]);

    const {
        solicitarCierre,
        confirmacionAbierta,
        cancelarCierre,
        confirmarCierre,
        mensajeConfirmacion,
    } = useCierreSeguro({
        estaSucio,
        estaCargando: guardando,
        alCerrar: onCerrar,
        mensajeConfirmacion: 'Hay cambios sin guardar en el préstamo. ¿Deseas cerrar y descartarlos?',
    });

    const actualizar = (clave: keyof typeof campos, valor: any) => {
        setCampos((prev) => ({ ...prev, [clave]: valor }));
    };

    const idsPrestados = useMemo(() => new Set(
        prestamos
            .filter((p) => p.estado !== 'devuelto' && p.estado !== 'devuelto_fuera_de_fecha_limite')
            .map((p) => p.idHerramienta)
    ), [prestamos]);

    const herramientasDisponibles = useMemo(() => herramientas.filter((h) => {
        const estado = normalizarEstadoItem(h.estado) ?? 'disponible';
        const esActual = prestamo?.idHerramienta === h.id;
        if (esActual) return true;
        return estado === 'disponible' && !idsPrestados.has(h.id);
    }), [herramientas, idsPrestados, prestamo?.idHerramienta]);

    const manejarGuardar = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!campos.carnetEstudiante || !campos.idHerramienta || !campos.idDocente || !campos.fechaPrestamo) {
            setError('Completa estudiante, activo fijo, docente y fecha de préstamo.');
            return;
        }

        if (!esEdicion && !campos.fechaDevolucion) {
            setError('Debes ingresar la fecha/hora límite de devolución.');
            return;
        }

        if (campos.fechaDevolucion && new Date(campos.fechaDevolucion).getTime() <= new Date(campos.fechaPrestamo).getTime()) {
            setError('La fecha/hora de devolución debe ser posterior al préstamo.');
            return;
        }

        const docente = docentes.find((d) => d.id === campos.idDocente);
        if (!docente) {
            setError('Selecciona un docente válido.');
            return;
        }

        try {
            setGuardando(true);
            if (prestamo) {
                await editarPrestamo(prestamo.id, {
                    carnetEstudiante: campos.carnetEstudiante,
                    idHerramienta: campos.idHerramienta,
                    docente: nombreCompletoDocente(docente),
                    fechaPrestamo: campos.fechaPrestamo,
                    fechaDevolucion: campos.fechaDevolucion || null,
                    observaciones: campos.observaciones.trim(),
                    carnetRetenido: campos.carnetRetenido,
                });
            } else {
                await agregarPrestamo({
                    carnetEstudiante: campos.carnetEstudiante,
                    idHerramienta: campos.idHerramienta,
                    docente: nombreCompletoDocente(docente),
                    fechaPrestamo: campos.fechaPrestamo,
                    fechaDevolucion: campos.fechaDevolucion,
                    observaciones: campos.observaciones.trim(),
                    carnetRetenido: campos.carnetRetenido,
                });
            }
            onCerrar();
        } catch (err) {
            setError(err instanceof Error ? err.message : (prestamo ? 'No se pudo editar el préstamo.' : 'No se pudo registrar el préstamo.'));
        } finally {
            setGuardando(false);
        }
    };

    const renderSeccionFijos = () => {
        return (
            <div className="space-y-3">
                <div className="flex flex-col gap-1">
                    <Label className="text-xs font-medium text-slate-700 dark:text-slate-300">Estudiante *</Label>
                    <Combobox<{ value: string; label: string }>
                        items={estudiantes.map((est) => ({ value: est.carnet, label: `[${est.carnet}] ${est.apellido}, ${est.nombre}` }))}
                        value={campos.carnetEstudiante}
                        onValueChange={(val) => { actualizar('carnetEstudiante', val); setError(''); }}
                        getItemValue={(item) => item.value}
                        getItemLabel={(item) => item.label}
                    >
                        <ComboboxInput placeholder="Seleccionar estudiante..." showClear />
                        <ComboboxContent>
                            <ComboboxEmpty>No se encontraron estudiantes.</ComboboxEmpty>
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
                <div className="flex items-center gap-2 mt-1">
                    <input
                        type="checkbox"
                        id="retener-cu"
                        checked={campos.carnetRetenido}
                        onChange={(e) => actualizar('carnetRetenido', e.target.checked)}
                        className="h-4 w-4 cursor-pointer rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <Label htmlFor="retener-cu" className="cursor-pointer select-none text-xs font-medium text-slate-700 dark:text-slate-300">
                        Retener Carnet Universitario (CU)
                    </Label>
                </div>

                <div className="flex flex-col gap-1">
                    <Label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                        Activo fijo *
                        <span className="ml-1 font-normal text-slate-400">(solo en buen estado)</span>
                    </Label>
                    <Combobox<{ value: string; label: string }>
                        items={herramientasDisponibles.map((h) => {
                            const inv = String(h.codigoInventario ?? '').trim();
                            const uni = String(h.codigoUnico ?? '').trim();
                            const etiqueta = inv || uni ? `I: ${inv || '—'} | U: ${uni || '—'}` : 'SIN-CODIGO';
                            return { value: String(h.id), label: `[${etiqueta}] ${h.nombre}` };
                        })}
                        value={campos.idHerramienta}
                        onValueChange={(val) => { actualizar('idHerramienta', val); setError(''); }}
                        getItemValue={(item) => item.value}
                        getItemLabel={(item) => item.label}
                    >
                        <ComboboxInput placeholder="Seleccionar activo fijo..." showClear />
                        <ComboboxContent>
                            <ComboboxEmpty>No se encontraron activos fijos.</ComboboxEmpty>
                            <ComboboxList<{ value: string; label: string }>>
                                {(opcion) => (
                                    <ComboboxItem key={opcion.value} value={opcion.value}>
                                        {opcion.label}
                                    </ComboboxItem>
                                )}
                            </ComboboxList>
                        </ComboboxContent>
                    </Combobox>
                    {herramientasDisponibles.length === 0 && !prestamo ? (
                        <p className="text-xs text-amber-600 dark:text-amber-400">No hay activos fijos en buen estado disponibles.</p>
                    ) : null}
                </div>

                <div className="flex flex-col gap-1">
                    <Label className="text-xs font-medium text-slate-700 dark:text-slate-300">Docente que autoriza *</Label>
                    <Combobox<{ value: string; label: string }>
                        items={docentes.map((d) => ({ value: String(d.id), label: `[${d.codigo}] ${d.apellido}, ${d.nombre}` }))}
                        value={campos.idDocente}
                        onValueChange={(val) => { actualizar('idDocente', val); setError(''); }}
                        getItemValue={(item) => item.value}
                        getItemLabel={(item) => item.label}
                    >
                        <ComboboxInput placeholder="Seleccionar docente..." showClear />
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
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="flex flex-col gap-1">
                        <Label className="text-xs font-medium text-slate-700 dark:text-slate-300">Fecha y hora de préstamo *</Label>
                        <DateTimePicker
                            title="Fecha y hora de préstamo"
                            value={campos.fechaPrestamo}
                            onChange={(value) => {
                                actualizar('fechaPrestamo', value);
                                setError('');
                                if (!prestamo) {
                                    if (!campos.fechaDevolucion || new Date(campos.fechaDevolucion).getTime() <= new Date(value).getTime()) {
                                        actualizar('fechaDevolucion', sumarHorasInputLocal(value, 24));
                                    }
                                }
                            }}
                            className="w-full"
                            dateButtonClassName="w-full"
                        />
                    </div>
                    <div className="flex flex-col gap-1">
                        <Label className="text-xs font-medium text-slate-700 dark:text-slate-300">Fecha y hora devolución{prestamo ? '' : ' *'}</Label>
                        <DateTimePicker
                            title="Fecha y hora de devolución"
                            value={campos.fechaDevolucion}
                            onChange={(value) => { actualizar('fechaDevolucion', value); setError(''); }}
                            className="w-full"
                            dateButtonClassName="w-full"
                        />
                    </div>
                </div>

                <div className="flex flex-col gap-1">
                    <Label className="text-xs font-medium text-slate-700 dark:text-slate-300">Observaciones</Label>
                    <Textarea
                        title="Observaciones del préstamo"
                        value={campos.observaciones}
                        onChange={(e) => actualizar('observaciones', e.target.value)}
                        rows={2}
                        placeholder={prestamo ? undefined : 'Motivo del préstamo u observaciones adicionales...'}
                        className="min-h-[72px] resize-none text-xs"
                    />
                </div>
            </div>
        );
    };

    const renderSeccionFungibles = () => {
        return (
            <div className="rounded-md border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-900/50 text-center">
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    Para gestionar activos fungibles (materiales/consumibles) en préstamos, por favor utiliza el flujo de **Préstamo Canasta** en la página principal de Préstamos.
                </p>
            </div>
        );
    };

    const titulo = prestamo ? `Editar préstamo #${prestamo.id}` : 'Registrar préstamo';
    const textoGuardar = prestamo ? 'Guardar cambios' : 'Registrar préstamo';

    return (
        <>
            <ModalBase
                titulo={titulo}
                onCerrar={solicitarCierre}
                ancho="max-w-xl"
                dialogClassName="h-[90vh]"
                bodyClassName="flex min-h-0 flex-col p-0"
                footer={
                    <div className="flex justify-end gap-2">
                        <Boton type="button" variant="outline" onClick={solicitarCierre} className="h-9 px-4 text-xs">
                            Cancelar
                        </Boton>
                        <Boton type="submit" form={formId} className="h-9 px-5 text-xs" disabled={guardando}>
                            {guardando ? 'Guardando...' : textoGuardar}
                        </Boton>
                    </div>
                }
            >
                <div className="flex-1 min-h-0 overflow-y-auto overflow-x-auto scroll-elegante">
                    <form id={formId} onSubmit={manejarGuardar} className="space-y-3 p-4 sm:p-6">
                    {mostrarTabs ? (
                        <Tabs defaultValue="fijos" className="w-full">
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="fijos" className="text-xs">Activos Fijos</TabsTrigger>
                                <TabsTrigger value="fungibles" className="text-xs">Activos Fungibles</TabsTrigger>
                            </TabsList>
                            <TabsContent value="fijos" className="mt-4 space-y-3">
                                {renderSeccionFijos()}
                            </TabsContent>
                            <TabsContent value="fungibles" className="mt-4 space-y-4">
                                {renderSeccionFungibles()}
                            </TabsContent>
                        </Tabs>
                    ) : tienePermisoFungibles ? (
                        renderSeccionFungibles()
                    ) : (
                        renderSeccionFijos()
                    )}

                    {error ? (
                        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600 dark:border-red-800 dark:bg-red-950 dark:text-red-400">{error}</p>
                    ) : null}
                    </form>
                </div>
            </ModalBase>

            {confirmacionAbierta && (
                <ModalBase titulo="Descartar cambios" onCerrar={cancelarCierre} ancho="max-w-sm">
                    <div className="space-y-4">
                        <p className="text-sm text-slate-600 dark:text-slate-300">{mensajeConfirmacion}</p>
                        <div className="flex justify-end gap-2">
                            <Boton type="button" variant="outline" onClick={cancelarCierre}>
                                Seguir editando
                            </Boton>
                            <Boton type="button" variant="destructive" onClick={confirmarCierre}>
                                Descartar
                            </Boton>
                        </div>
                    </div>
                </ModalBase>
            )}
        </>
    );
};

