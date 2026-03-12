import { useMemo, useState } from 'react';
import { ModalBase } from '../inventario/ModalBase';
import { Boton } from '../ui/button';
import type { CanastaPrestamo, Docente, Estudiante, Herramienta, MaterialFungible } from '../../tipos/inventario';
import { ahoraInputLocal, sumarHorasInputLocal } from '../../lib/fecha-local';
import { crearCanastaPrestamoEnBackend } from '../../lib/servicio-inventario';
import { useInventario } from '../../contextos/ContextoInventario';

interface Props {
    onCerrar: () => void;
}

export const FormularioCanastaPrestamo = ({ onCerrar }: Props) => {
    const { estudiantes, docentes, herramientas, materiales, prestamos, recargarDatos } = useInventario();
    const inicio = ahoraInputLocal();

    const [campos, setCampos] = useState<CanastaPrestamo>({
        carnetEstudiante: '',
        idDocente: '',
        fechaPrestamo: inicio,
        fechaDevolucion: sumarHorasInputLocal(inicio, 2),
        observaciones: 'Despacho inicial de clase',
        equipos: [],
        consumibles: [],
    });
    const [equipoSeleccionado, setEquipoSeleccionado] = useState('');
    const [loteSeleccionado, setLoteSeleccionado] = useState('');
    const [cantidadConsumible, setCantidadConsumible] = useState('1');
    const [motivoConsumible, setMotivoConsumible] = useState('Consumo en inicio de clase');
    const [error, setError] = useState('');
    const [guardando, setGuardando] = useState(false);

    const equiposPrestados = useMemo(
        () => new Set(prestamos
            .filter((p) => p.estado !== 'devuelto' && p.estado !== 'devuelto_fuera_de_fecha_limite')
            .map((p) => p.idHerramienta)),
        [prestamos],
    );

    const equiposDisponibles = useMemo(
        () => herramientas.filter((h) => h.estado !== 'dado_de_baja' && !equiposPrestados.has(h.id)),
        [equiposPrestados, herramientas],
    );
    const lotesConsumibles = useMemo(() => materiales.filter((m) => (m.cantidadDisponible ?? 0) > 0), [materiales]);

    const agregarEquipo = () => {
        if (!equipoSeleccionado) return;
        if (campos.equipos.includes(equipoSeleccionado)) return;
        setCampos((prev) => ({ ...prev, equipos: [...prev.equipos, equipoSeleccionado] }));
        setEquipoSeleccionado('');
    };

    const quitarEquipo = (id: string) => {
        setCampos((prev) => ({ ...prev, equipos: prev.equipos.filter((e) => e !== id) }));
    };

    const agregarConsumible = () => {
        const cantidad = Number(cantidadConsumible);
        if (!loteSeleccionado || !Number.isFinite(cantidad) || cantidad <= 0) return;
        if (campos.consumibles.some((c) => c.idLote === loteSeleccionado)) return;
        setCampos((prev) => ({
            ...prev,
            consumibles: [...prev.consumibles, { idLote: loteSeleccionado, cantidad, motivo: motivoConsumible.trim() || 'Consumo en clase' }],
        }));
        setLoteSeleccionado('');
        setCantidadConsumible('1');
    };

    const quitarConsumible = (idLote: string) => {
        setCampos((prev) => ({ ...prev, consumibles: prev.consumibles.filter((c) => c.idLote !== idLote) }));
    };

    const manejarEnvio = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!campos.carnetEstudiante || !campos.idDocente) {
            setError('Debes seleccionar estudiante y docente.');
            return;
        }
        if (campos.equipos.length === 0 && campos.consumibles.length === 0) {
            setError('La canasta debe tener al menos un activo fijo, un material fungible o ambos.');
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
        const eq = equiposDisponibles.find((h) => h.id === id);
        return eq ? `[${eq.codigoInventario}] ${eq.nombre}` : id;
    };

    const nombreLote = (id: string) => {
        const lo = lotesConsumibles.find((m) => m.id === id);
        return lo ? `${lo.nombre} (${lo.unidad})` : id;
    };

    return (
        <ModalBase titulo="Canasta de prestamo" onCerrar={onCerrar} ancho="max-w-2xl">
            <form onSubmit={manejarEnvio} className="space-y-4">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Estudiante *</label>
                        <select title="Estudiante" value={campos.carnetEstudiante} onChange={(e) => setCampos((p) => ({ ...p, carnetEstudiante: e.target.value }))} className="h-9 rounded-md border border-slate-200 bg-white px-3 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100">
                            <option value="">Seleccionar...</option>
                            {estudiantes.map((e: Estudiante) => <option key={e.carnet} value={e.carnet}>[{e.carnet}] {e.apellido}, {e.nombre}</option>)}
                        </select>
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Docente *</label>
                        <select title="Docente" value={campos.idDocente} onChange={(e) => setCampos((p) => ({ ...p, idDocente: e.target.value }))} className="h-9 rounded-md border border-slate-200 bg-white px-3 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100">
                            <option value="">Seleccionar...</option>
                            {docentes.map((d: Docente) => <option key={d.id} value={d.id}>[{d.codigo}] {d.apellido}, {d.nombre}</option>)}
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Fecha/hora prestamo</label>
                        <input title="Fecha prestamo" type="datetime-local" value={campos.fechaPrestamo} onChange={(e) => setCampos((p) => ({ ...p, fechaPrestamo: e.target.value }))} className="h-9 rounded-md border border-slate-200 bg-white px-3 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100" />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Fecha/hora devolucion</label>
                        <input title="Fecha devolucion" type="datetime-local" value={campos.fechaDevolucion} onChange={(e) => setCampos((p) => ({ ...p, fechaDevolucion: e.target.value }))} className="h-9 rounded-md border border-slate-200 bg-white px-3 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100" />
                    </div>
                </div>

                <div className="rounded-md border border-slate-200 p-3 dark:border-slate-700">
                    <p className="mb-2 text-xs font-semibold text-slate-700 dark:text-slate-300">Equipos en canasta</p>
                    <div className="flex gap-2">
                        <select title="Equipo" value={equipoSeleccionado} onChange={(e) => setEquipoSeleccionado(e.target.value)} className="h-9 flex-1 rounded-md border border-slate-200 bg-white px-3 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100">
                            <option value="">Agregar equipo...</option>
                            {equiposDisponibles.map((h: Herramienta) => <option key={h.id} value={h.id}>[{h.codigoInventario}] {h.nombre}</option>)}
                        </select>
                        <button type="button" onClick={agregarEquipo} className="h-9 rounded-md bg-blue-600 px-3 text-xs font-semibold text-white">Agregar</button>
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

                <div className="rounded-md border border-slate-200 p-3 dark:border-slate-700">
                    <p className="mb-2 text-xs font-semibold text-slate-700 dark:text-slate-300">Consumibles en canasta</p>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-4">
                        <select title="Lote consumible" value={loteSeleccionado} onChange={(e) => setLoteSeleccionado(e.target.value)} className="h-9 rounded-md border border-slate-200 bg-white px-3 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 sm:col-span-2">
                            <option value="">Agregar consumible...</option>
                            {lotesConsumibles.map((m: MaterialFungible) => <option key={m.id} value={m.id}>{m.nombre} - stock {m.cantidadDisponible ?? 0}</option>)}
                        </select>
                        <input title="Cantidad" type="number" min={1} value={cantidadConsumible} onChange={(e) => setCantidadConsumible(e.target.value)} className="h-9 rounded-md border border-slate-200 bg-white px-3 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100" />
                        <button type="button" onClick={agregarConsumible} className="h-9 rounded-md bg-emerald-600 px-3 text-xs font-semibold text-white">Agregar</button>
                    </div>
                    <input title="Motivo consumible" value={motivoConsumible} onChange={(e) => setMotivoConsumible(e.target.value)} placeholder="Motivo salida consumible" className="mt-2 h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100" />
                    <div className="mt-2 flex flex-wrap gap-2">
                        {campos.consumibles.map((c) => (
                            <span key={c.idLote} className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] text-emerald-700">
                                {nombreLote(c.idLote)} x{c.cantidad}
                                <button type="button" title="Quitar consumible" onClick={() => quitarConsumible(c.idLote)}>x</button>
                            </span>
                        ))}
                    </div>
                </div>

                <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Observaciones</label>
                    <textarea title="Observaciones" rows={2} value={campos.observaciones ?? ''} onChange={(e) => setCampos((p) => ({ ...p, observaciones: e.target.value }))} className="rounded-md border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100" />
                </div>

                {error && <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>}

                <div className="flex justify-end gap-2">
                    <button type="button" onClick={onCerrar} className="h-9 rounded-md border border-slate-200 px-4 text-xs">Cancelar</button>
                    <Boton type="submit" className="h-9 px-5 text-xs" disabled={guardando}>{guardando ? 'Guardando...' : 'Despachar canasta'}</Boton>
                </div>
            </form>
        </ModalBase>
    );
};
