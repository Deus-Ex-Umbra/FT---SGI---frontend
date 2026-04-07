import { useEffect, useMemo, useState } from 'react';
import { ModalBase } from './modal-base';
import { useInventario } from '@/contextos/ContextoInventario';
import { Boton } from '@/componentes/ui/button';
import type { Docente, Materia } from '@/tipos/inventario';
import { useCierreSeguro } from '@/hooks/use-cierre-seguro';
import { useValidacionCamposRequeridos } from '@/hooks/use-validacion-campos-requeridos';

interface Props {
    onCerrar: () => void;
    docente?: Docente | null;
}

export const FormularioDocente = ({ onCerrar, docente }: Props) => {
    const { agregarDocente, editarDocente, materias } = useInventario();
    const inicial = useMemo(() => ({
        codigo: docente?.codigo ?? '',
        nombre: docente?.nombre ?? '',
        apellido: docente?.apellido ?? '',
        carnet: docente?.carnet ?? '',
    }), [docente?.id]);

    const [campos, setCampos] = useState(inicial);
    const [materiasIds, setMateriasIds] = useState<string[]>(() => (docente?.materias ?? []).map((m) => m.id));
    const [materiasIdsIniciales, setMateriasIdsIniciales] = useState<string[]>(() => (docente?.materias ?? []).map((m) => m.id));
    const [materiasTocadas, setMateriasTocadas] = useState(false);
    const [error, setError] = useState('');
    const [guardando, setGuardando] = useState(false);

    useEffect(() => {
        setCampos(inicial);
        const ids = (docente?.materias ?? []).map((m) => m.id);
        setMateriasIds(ids);
        setMateriasIdsIniciales(ids);
        setMateriasTocadas(false);
        setError('');
    }, [inicial]);

    // Compatibilidad: si el docente viejo solo trae `materia` string, preseleccionamos si existe en el catálogo.
    useEffect(() => {
        if (materiasTocadas) return;
        if (materiasIdsIniciales.length > 0) return;
        const codigo = (docente?.materia ?? '').trim();
        if (!codigo) return;
        const encontrada = materias.find((m) => m.codigo === codigo);
        if (!encontrada) return;
        setMateriasIds([encontrada.id]);
        setMateriasIdsIniciales([encontrada.id]);
    }, [docente?.materia, materias, materiasIdsIniciales.length, materiasTocadas]);

    const materiasOrdenadas = useMemo(() => {
        return [...materias].sort((a, b) => a.codigo.localeCompare(b.codigo));
    }, [materias]);

    const estaSucio = useMemo(() => {
        const normalizar = (v: string) => v.trim();
        const normIds = (ids: string[]) => [...ids].sort().join('|');
        return (
            normalizar(campos.codigo) !== normalizar(inicial.codigo) ||
            normalizar(campos.nombre) !== normalizar(inicial.nombre) ||
            normalizar(campos.apellido) !== normalizar(inicial.apellido) ||
            normalizar(campos.carnet) !== normalizar(inicial.carnet) ||
            normIds(materiasIds) !== normIds(materiasIdsIniciales)
        );
    }, [campos.apellido, campos.carnet, campos.codigo, campos.nombre, inicial, materiasIds, materiasIdsIniciales]);

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
        mensajeConfirmacion: 'Hay cambios sin guardar en el docente. ¿Deseas cerrar y descartarlos?',
    });

    const { validarCampos, limpiarCampoResaltado, claseCampoResaltado } = useValidacionCamposRequeridos();

    const manejarEnvio = async (e: React.FormEvent) => {
        e.preventDefault();
        const ok = validarCampos([
            { id: 'docente-codigo', etiqueta: 'Código', valido: Boolean(campos.codigo.trim()) },
            { id: 'docente-nombre', etiqueta: 'Nombres', valido: Boolean(campos.nombre.trim()) },
            { id: 'docente-apellido', etiqueta: 'Apellidos', valido: Boolean(campos.apellido.trim()) },
            { id: 'docente-materias', etiqueta: 'Materias', valido: materiasIds.length > 0 },
            { id: 'docente-carnet', etiqueta: 'Carnet de Identidad', valido: Boolean(campos.carnet.trim()) },
        ], docente ? 'guardar cambios' : 'registrar');
        if (!ok) return;

        setGuardando(true);
        setError('');
        try {
            const materiasSeleccionadas: Materia[] = materias
                .filter((m) => materiasIds.includes(m.id))
                .map((m) => ({ ...m, nombre: m.nombre ?? null }));

            if (materiasSeleccionadas.length === 0) {
                setError('Selecciona al menos una materia.');
                return;
            }

            const payload = {
                codigo: campos.codigo.trim(),
                nombre: campos.nombre.trim(),
                apellido: campos.apellido.trim(),
                materia: materiasSeleccionadas[0]?.codigo ?? '',
                carnet: campos.carnet.trim(),
                materias: materiasSeleccionadas,
            };

            if (docente?.id) {
                await editarDocente(docente.id, payload);
            } else {
                await agregarDocente(payload);
            }
            onCerrar();
        } catch (err: any) {
            setError(err?.message ?? 'No se pudo guardar el docente.');
        } finally {
            setGuardando(false);
        }
    };

    return (
        <>
            <ModalBase titulo={docente ? 'Editar docente' : 'Registrar docente'} onCerrar={solicitarCierre}>
                <form onSubmit={manejarEnvio} className="space-y-3">
                <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Código *</label>
                    <input
                        id="docente-codigo"
                        type="text"
                        value={campos.codigo}
                        onChange={e => { setCampos(prev => ({ ...prev, codigo: e.target.value })); setError(''); limpiarCampoResaltado('docente-codigo'); }}
                        required
                        title="Código del docente"
                        className={`h-9 rounded-md border border-slate-200 bg-white px-3 text-xs text-slate-800 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 ${claseCampoResaltado('docente-codigo')}`}
                    />
                </div>
                <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Nombres *</label>
                    <input
                        id="docente-nombre"
                        type="text"
                        value={campos.nombre}
                        onChange={e => { setCampos(prev => ({ ...prev, nombre: e.target.value })); setError(''); limpiarCampoResaltado('docente-nombre'); }}
                        required
                        title="Nombres del docente"
                        className={`h-9 rounded-md border border-slate-200 bg-white px-3 text-xs text-slate-800 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 ${claseCampoResaltado('docente-nombre')}`}
                    />
                </div>
                <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Apellidos *</label>
                    <input
                        id="docente-apellido"
                        type="text"
                        value={campos.apellido}
                        onChange={e => { setCampos(prev => ({ ...prev, apellido: e.target.value })); setError(''); limpiarCampoResaltado('docente-apellido'); }}
                        required
                        title="Apellidos del docente"
                        className={`h-9 rounded-md border border-slate-200 bg-white px-3 text-xs text-slate-800 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 ${claseCampoResaltado('docente-apellido')}`}
                    />
                </div>
                <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Materias *</label>
                    <div
                        id="docente-materias"
                        className={`rounded-md border border-slate-200 bg-white p-2 dark:border-slate-700 dark:bg-slate-800 ${claseCampoResaltado('docente-materias')}`}
                    >
                        {materiasOrdenadas.length === 0 ? (
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                No hay materias registradas. Ve a la sección “Catálogos” y registra al menos una materia.
                            </p>
                        ) : (
                            <div className="max-h-36 space-y-1 overflow-auto pr-1">
                                {materiasOrdenadas.map((m) => {
                                    const checked = materiasIds.includes(m.id);
                                    const etiqueta = m.nombre ? `${m.codigo} — ${m.nombre}` : m.codigo;
                                    return (
                                        <label key={m.id} className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1 text-xs text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-700/50">
                                            <input
                                                type="checkbox"
                                                checked={checked}
                                                onChange={() => {
                                                    setMateriasTocadas(true);
                                                    setError('');
                                                    limpiarCampoResaltado('docente-materias');
                                                    setMateriasIds((prev) => {
                                                        if (prev.includes(m.id)) return prev.filter((x) => x !== m.id);
                                                        return [...prev, m.id];
                                                    });
                                                }}
                                            />
                                            <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400">{m.codigo}</span>
                                            <span className="truncate">{m.nombre ?? ''}</span>
                                            <span className="sr-only">{etiqueta}</span>
                                        </label>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
                <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Carnet de Identidad *</label>
                    <input
                        id="docente-carnet"
                        type="text"
                        value={campos.carnet}
                        onChange={e => { setCampos(prev => ({ ...prev, carnet: e.target.value })); setError(''); limpiarCampoResaltado('docente-carnet'); }}
                        required
                        title="Carnet de identidad del docente"
                        className={`h-9 rounded-md border border-slate-200 bg-white px-3 text-xs text-slate-800 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 ${claseCampoResaltado('docente-carnet')}`}
                    />
                </div>
                {error && <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600 dark:border-red-800 dark:bg-red-950 dark:text-red-400">{error}</p>}
                    <div className="flex justify-end gap-2 pt-1">
                        <button type="button" onClick={solicitarCierre} className="h-9 rounded-md border border-slate-200 px-4 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400">
                            Cancelar
                        </button>
                        <Boton type="submit" className="h-9 px-5 text-xs" disabled={guardando}>
                            {guardando ? 'Guardando...' : (docente ? 'Guardar cambios' : 'Guardar docente')}
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
