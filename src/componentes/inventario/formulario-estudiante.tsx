import { useEffect, useMemo, useState } from 'react';
import { ModalBase } from './modal-base';
import { useInventario } from '@/contextos/ContextoInventario';
import { Boton } from '@/componentes/ui/button';
import { ToggleGroup, ToggleGroupItem } from '@/componentes/ui/toggle-group';
import type { Estudiante } from '@/tipos/inventario';
import { useCierreSeguro } from '@/hooks/use-cierre-seguro';
import { useValidacionCamposRequeridos } from '@/hooks/use-validacion-campos-requeridos';

interface Props {
    onCerrar: () => void;
    estudiante?: Estudiante | null;
}

export const FormularioEstudiante = ({ onCerrar, estudiante }: Props) => {
    const { agregarEstudiante, editarEstudiante, estudiantes, carreras } = useInventario();
    const inicial = useMemo(() => ({
        carnet: estudiante?.carnet ?? '',
        nombre: estudiante?.nombre ?? '',
        apellido: estudiante?.apellido ?? '',
        carrera: estudiante?.carrera ?? '',
        semestre: estudiante ? String(estudiante.semestre) : '',
        carnetRetenidoEfectivo: Boolean(estudiante?.carnetRetenido),
        carnetRetenidoOverride: typeof estudiante?.carnetRetenidoOverride === 'boolean' ? estudiante.carnetRetenidoOverride : null,
    }), [estudiante]);

    const [campos, setCampos] = useState(inicial);
    const [error, setError] = useState('');
    const [guardando, setGuardando] = useState(false);

    useEffect(() => {
        setCampos(inicial);
        setError('');
    }, [inicial]);

    const estaSucio = useMemo(() => {
        const normalizar = (v: string) => v.trim();
        return (
            normalizar(campos.carnet) !== normalizar(inicial.carnet) ||
            normalizar(campos.nombre) !== normalizar(inicial.nombre) ||
            normalizar(campos.apellido) !== normalizar(inicial.apellido) ||
            campos.carrera !== inicial.carrera ||
            normalizar(campos.semestre) !== normalizar(inicial.semestre) ||
            campos.carnetRetenidoOverride !== inicial.carnetRetenidoOverride
        );
    }, [campos, inicial]);

    const carnetRetenidoPreview = useMemo(() => {
        return campos.carnetRetenidoOverride === null ? inicial.carnetRetenidoEfectivo : campos.carnetRetenidoOverride;
    }, [campos.carnetRetenidoOverride, inicial.carnetRetenidoEfectivo]);

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
        mensajeConfirmacion: 'Hay cambios sin guardar en el estudiante. ¿Deseas cerrar y descartarlos?',
    });

    const { validarCampos, limpiarCampoResaltado, claseCampoResaltado } = useValidacionCamposRequeridos();

    const carrerasOrdenadas = useMemo(() => {
        return [...carreras].sort((a, b) => a.nombre.localeCompare(b.nombre));
    }, [carreras]);

    const opcionesCarrera = useMemo(() => {
        const nombres = carrerasOrdenadas.map((c) => c.nombre);
        const actual = campos.carrera?.trim();
        if (actual && !nombres.includes(actual)) {
            return [actual, ...nombres];
        }
        return nombres;
    }, [carrerasOrdenadas, campos.carrera]);

    const actualizar = (clave: string, valor: string) =>
        setCampos(prev => ({ ...prev, [clave]: valor }));

    const manejarEnvio = async (e: React.FormEvent) => {
        e.preventDefault();

        const ok = validarCampos([
            { id: 'estudiante-carnet', etiqueta: 'Carnet', valido: Boolean(campos.carnet.trim()) },
            { id: 'estudiante-nombre', etiqueta: 'Nombre(s)', valido: Boolean(campos.nombre.trim()) },
            { id: 'estudiante-apellido', etiqueta: 'Apellido(s)', valido: Boolean(campos.apellido.trim()) },
            { id: 'estudiante-carrera', etiqueta: 'Carrera', valido: Boolean(campos.carrera) },
            { id: 'estudiante-semestre', etiqueta: 'Semestre', valido: Boolean(campos.semestre.trim()) },
        ], estudiante ? 'guardar cambios' : 'registrar');
        if (!ok) return;

        if (!campos.carnet.trim() || !campos.nombre.trim() || !campos.apellido.trim()) {
            setError('Carnet, nombre y apellido son obligatorios.');
            return;
        }
        if (estudiantes.some(est => est.carnet === campos.carnet.trim() && est.id !== estudiante?.id)) {
            setError('El carnet ya está registrado en el sistema.');
            return;
        }
        const semestre = parseInt(campos.semestre);
        if (isNaN(semestre) || semestre < 1 || semestre > 10) {
            setError('El semestre debe ser un número entre 1 y 10.');
            return;
        }

        setGuardando(true);
        try {
            const payload = {
                carnet: campos.carnet.trim(),
                nombre: campos.nombre.trim(),
                apellido: campos.apellido.trim(),
                carrera: campos.carrera,
                semestre,
                carnetRetenidoOverride: campos.carnetRetenidoOverride,
            };

            if (estudiante?.id) {
                await editarEstudiante(estudiante.id, payload);
            } else {
                await agregarEstudiante(payload);
            }
            onCerrar();
        } catch (err: any) {
            setError(err?.message ?? 'No se pudo guardar el estudiante.');
        } finally {
            setGuardando(false);
        }
    };

    return (
        <>
            <ModalBase titulo={estudiante ? 'Editar estudiante' : 'Registrar estudiante'} onCerrar={solicitarCierre}>
                <form onSubmit={manejarEnvio} className="space-y-3">
                <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Carnet universitario *</label>
                    <input
                        id="estudiante-carnet"
                        type="text"
                        value={campos.carnet}
                        onChange={e => { actualizar('carnet', e.target.value); setError(''); limpiarCampoResaltado('estudiante-carnet'); }}
                        placeholder="Ej: 2024-12345"
                        className={`h-9 rounded-md border border-slate-200 bg-white px-3 font-mono text-xs text-slate-800 placeholder-slate-400 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 ${claseCampoResaltado('estudiante-carnet')}`}
                    />
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Nombre(s) *</label>
                        <input
                            id="estudiante-nombre"
                            type="text"
                            value={campos.nombre}
                            onChange={e => { actualizar('nombre', e.target.value); setError(''); limpiarCampoResaltado('estudiante-nombre'); }}
                            placeholder="Ej: Carlos Eduardo"
                            className={`h-9 rounded-md border border-slate-200 bg-white px-3 text-xs text-slate-800 placeholder-slate-400 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 ${claseCampoResaltado('estudiante-nombre')}`}
                        />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Apellido(s) *</label>
                        <input
                            id="estudiante-apellido"
                            type="text"
                            value={campos.apellido}
                            onChange={e => { actualizar('apellido', e.target.value); setError(''); limpiarCampoResaltado('estudiante-apellido'); }}
                            placeholder="Ej: Mamani Quispe"
                            className={`h-9 rounded-md border border-slate-200 bg-white px-3 text-xs text-slate-800 placeholder-slate-400 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 ${claseCampoResaltado('estudiante-apellido')}`}
                        />
                    </div>
                </div>

                <div className="flex items-center justify-between rounded-md border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-800/60">
                    <div>
                        <p className="text-xs font-medium text-slate-700 dark:text-slate-300">Retención de carnet</p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            Automático: se retiene si tiene préstamos activos. Retenido/Libre: override manual.
                        </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                        <span className={`text-[11px] font-semibold ${carnetRetenidoPreview ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                            {carnetRetenidoPreview ? 'Retenido' : 'Libre'}
                        </span>
                        <ToggleGroup
                            type="single"
                            value={campos.carnetRetenidoOverride === null ? 'auto' : (campos.carnetRetenidoOverride ? 'retenido' : 'libre')}
                            onValueChange={(v) => {
                                if (!v) return;
                                setCampos(prev => ({
                                    ...prev,
                                    carnetRetenidoOverride: v === 'auto' ? null : (v === 'retenido'),
                                }));
                            }}
                            className="justify-end"
                            aria-label="Modo de retención de carnet"
                        >
                            <ToggleGroupItem value="auto" variant="outline" size="sm" className="h-8 text-[11px]">Auto</ToggleGroupItem>
                            <ToggleGroupItem value="retenido" variant="outline" size="sm" className="h-8 text-[11px]">Retenido</ToggleGroupItem>
                            <ToggleGroupItem value="libre" variant="outline" size="sm" className="h-8 text-[11px]">Libre</ToggleGroupItem>
                        </ToggleGroup>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Carrera *</label>
                        <select
                            id="estudiante-carrera"
                            value={campos.carrera}
                            onChange={e => { actualizar('carrera', e.target.value); limpiarCampoResaltado('estudiante-carrera'); }}
                            required
                            className={`h-9 rounded-md border border-slate-200 bg-white px-3 text-xs text-slate-800 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 ${claseCampoResaltado('estudiante-carrera')}`}
                        >
                            <option value="">Seleccionar...</option>
                            {opcionesCarrera.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                        {carrerasOrdenadas.length === 0 && (
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                No hay carreras registradas. Ve a la sección “Catálogos” y registra al menos una carrera.
                            </p>
                        )}
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Semestre *</label>
                        <input
                            id="estudiante-semestre"
                            type="number"
                            min={1}
                            max={10}
                            value={campos.semestre}
                            onChange={e => { actualizar('semestre', e.target.value); setError(''); limpiarCampoResaltado('estudiante-semestre'); }}
                            placeholder="1 – 10"
                            className={`h-9 rounded-md border border-slate-200 bg-white px-3 text-xs text-slate-800 placeholder-slate-400 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 ${claseCampoResaltado('estudiante-semestre')}`}
                        />
                    </div>
                </div>

                {error && <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600 dark:border-red-800 dark:bg-red-950 dark:text-red-400">{error}</p>}

                    <div className="flex justify-end gap-2 pt-1">
                        <button type="button" onClick={solicitarCierre} className="h-9 rounded-md border border-slate-200 px-4 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400">
                            Cancelar
                        </button>
                        <Boton type="submit" className="h-9 px-5 text-xs" disabled={guardando}>
                            {guardando ? 'Guardando...' : (estudiante ? 'Guardar cambios' : 'Registrar estudiante')}
                        </Boton>
                    </div>
                </form>
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
