import { useEffect, useMemo, useState } from 'react';
import { type PaginaApp } from '../componentes/inventario/MenuLateral';
import { LayoutPagina } from '../componentes/layout/LayoutPagina';
import { BarraFiltros } from '../componentes/layout/BarraFiltros';
import { FormularioCanastaPrestamo } from '../componentes/prestamos/FormularioCanastaPrestamo';
import { useInventario } from '../contextos/ContextoInventario';
import type { EstadoPrestamo, PrestamoCanastaRegistro } from '../tipos/inventario';
import { LayoutGrid, ListIcon } from 'lucide-react';
import { FormularioEdicionJerarquia } from '../componentes/inventario/FormularioEdicionJerarquia';
import { formatearFechaHora } from '../lib/formato-fecha';
import {
    cargarCanastasPrestamoDesdeBackend,
    editarCanastaPrestamoEnBackend,
    extenderCanastaPrestamoEnBackend,
    devolverCanastaPrestamoEnBackend,
    eliminarCanastaPrestamoEnBackend,
} from '../lib/servicio-inventario';

interface Props {
    onNavegar: (pagina: PaginaApp) => void;
    onCerrarSesion: () => void;
}

interface FiltroPrestamoDesdeActivos {
    idHerramienta: string;
    carnetEstudiante: string;
    estado: EstadoPrestamo;
}

const opcionesEstado: { valor: EstadoPrestamo | ''; etiqueta: string }[] = [
    { valor: '', etiqueta: 'Todos los estados' },
    { valor: 'activo', etiqueta: 'Activo' },
    { valor: 'pendiente', etiqueta: 'Pendiente' },
    { valor: 'devuelto', etiqueta: 'Devuelto' },
    { valor: 'devuelto_fuera_de_fecha_limite', etiqueta: 'Devuelto fuera de fecha limite' },
    { valor: 'vencido', etiqueta: 'Vencido' },
];

const CLAVE_FILTRO_PRESTAMO_ITEM = 'sgi-filtro-prestamo-item';

const colorEstadoCanasta = (estado: EstadoPrestamo) => {
    if (estado === 'activo' || estado === 'pendiente') return 'text-blue-700 bg-blue-50 border-blue-200 dark:text-blue-300 dark:bg-blue-950/30 dark:border-blue-800';
    if (estado === 'devuelto' || estado === 'devuelto_fuera_de_fecha_limite') return 'text-emerald-700 bg-emerald-50 border-emerald-200 dark:text-emerald-300 dark:bg-emerald-950/30 dark:border-emerald-800';
    return 'text-red-700 bg-red-50 border-red-200 dark:text-red-300 dark:bg-red-950/30 dark:border-red-800';
};

export const Prestamos = ({ onNavegar, onCerrarSesion }: Props) => {
    const { prestamos, estudiantes, docentes, recargarDatos } = useInventario();
    const [busqueda, setBusqueda] = useState('');
    const [filtroEstado, setFiltroEstado] = useState<EstadoPrestamo | ''>('');
    const [fechaDesde, setFechaDesde] = useState('');
    const [fechaHasta, setFechaHasta] = useState('');
    const [filtroIdHerramienta, setFiltroIdHerramienta] = useState('');
    const [vistaTabla, setVistaTabla] = useState(true);
    const [canastas, setCanastas] = useState<PrestamoCanastaRegistro[]>([]);
    const [cargandoCanastas, setCargandoCanastas] = useState(false);
    const [errorCanastas, setErrorCanastas] = useState('');
    const [modalEditarFechas, setModalEditarFechas] = useState<PrestamoCanastaRegistro | null>(null);
    const [modalEditarCanasta, setModalEditarCanasta] = useState<PrestamoCanastaRegistro | null>(null);
    const [mostrarCanasta, setMostrarCanasta] = useState(false);

    const estudiantesPorCarnet = useMemo(
        () => new Map(estudiantes.map((e) => [e.carnet, e])),
        [estudiantes],
    );
    const activos = prestamos.filter(p => p.estado === 'activo' || p.estado === 'pendiente').length;
    const vencidos = prestamos.filter(p => p.estado === 'vencido').length;

    const cargarCanastas = async () => {
        try {
            setCargandoCanastas(true);
            setErrorCanastas('');
            const data = await cargarCanastasPrestamoDesdeBackend();
            setCanastas(data);
        } catch (err: any) {
            setErrorCanastas(err?.message ?? 'No se pudieron cargar las canastas.');
        } finally {
            setCargandoCanastas(false);
        }
    };

    useEffect(() => {
        void cargarCanastas();
    }, []);

    useEffect(() => {
        const payload = sessionStorage.getItem(CLAVE_FILTRO_PRESTAMO_ITEM);
        if (!payload) return;

        try {
            const filtro = JSON.parse(payload) as FiltroPrestamoDesdeActivos;
            if (filtro?.idHerramienta) {
                setFiltroIdHerramienta(filtro.idHerramienta);
            }
            if (filtro?.carnetEstudiante) {
                setBusqueda(filtro.carnetEstudiante);
            }
            if (filtro?.estado) {
                setFiltroEstado(filtro.estado);
            }
            setVistaTabla(true);
        } catch {
            // Ignora formato inválido de filtro persistido.
        } finally {
            sessionStorage.removeItem(CLAVE_FILTRO_PRESTAMO_ITEM);
        }
    }, []);

    const aFecha = (valor: string, finDia = false) => {
        if (!valor) return null;
        if (valor.includes('T')) return new Date(valor);
        return new Date(`${valor}T${finDia ? '23:59:59' : '00:00:00'}`);
    };

    const canastasFiltradas = useMemo(() => {
        const termino = busqueda.toLowerCase();
        const desde = aFecha(fechaDesde, false);
        const hasta = aFecha(fechaHasta, true);

        return canastas.filter((c) => {
            const est = estudiantesPorCarnet.get(c.carnetEstudiante);
            const textoEquipos = c.cosas
                .map((i) => `${i.codigoInventario} ${i.nombre}`)
                .join(' ')
                .toLowerCase();
            const textoConsumibles = c.consumibles
                .map((i) => `${i.material} ${i.lote} ${i.motivo}`)
                .join(' ')
                .toLowerCase();
            const coincideTexto = termino === '' ||
                c.carnetEstudiante.toLowerCase().includes(termino) ||
                (est ? `${est.nombre} ${est.apellido}`.toLowerCase().includes(termino) : false) ||
                c.docente.toLowerCase().includes(termino) ||
                textoEquipos.includes(termino) ||
                textoConsumibles.includes(termino) ||
                c.observaciones.toLowerCase().includes(termino) ||
                c.fechaPrestamo.includes(termino);
            const coincideEstado = filtroEstado === '' || c.estado === filtroEstado;
            const coincideHerramienta = filtroIdHerramienta === '' || c.cosas.some((i) => i.idHerramienta === filtroIdHerramienta);
            const fechaPrestamo = aFecha(c.fechaPrestamo);
            const coincideFechaDesde = !desde || (!!fechaPrestamo && fechaPrestamo >= desde);
            const coincideFechaHasta = !hasta || (!!fechaPrestamo && fechaPrestamo <= hasta);
            return coincideTexto && coincideEstado && coincideHerramienta && coincideFechaDesde && coincideFechaHasta;
        });
    }, [busqueda, canastas, estudiantesPorCarnet, fechaDesde, fechaHasta, filtroEstado, filtroIdHerramienta]);

    const devolverCanasta = async (idCanasta: string) => {
        await devolverCanastaPrestamoEnBackend(idCanasta);
        await recargarDatos();
        await cargarCanastas();
    };

    const eliminarCanasta = async (idCanasta: string) => {
        const confirmar = window.confirm('¿Eliminar esta canasta de préstamo?');
        if (!confirmar) return;
        await eliminarCanastaPrestamoEnBackend(idCanasta);
        await recargarDatos();
        await cargarCanastas();
    };


    return (
        <LayoutPagina
            paginaActiva="prestamos"
            titulo="Préstamos de Activos Fijos"
            subtitulo={`${activos} activos · ${vencidos} vencidos · ${canastas.length} canastas en total`}
            alertas={vencidos}
            onNavegar={onNavegar}
            onCerrarSesion={onCerrarSesion}
        >
            <div className="mb-6 flex items-center justify-between">
                <BarraFiltros
                    busqueda={busqueda}
                    onBusquedaChange={setBusqueda}
                    placeholder="Buscar por carnet, estudiante, activo..."
                    filtrosActivos={filtroEstado !== '' || !!fechaDesde || !!fechaHasta || filtroIdHerramienta !== ''}
                    onLimpiarFiltros={() => { setBusqueda(''); setFiltroEstado(''); setFechaDesde(''); setFechaHasta(''); setFiltroIdHerramienta(''); }}
                    textoResultados={`${canastasFiltradas.length} de ${canastas.length}`}
                >
                    <select
                        title="Filtrar por estado"
                        value={filtroEstado}
                        onChange={e => setFiltroEstado(e.target.value as EstadoPrestamo | '')}
                        className="h-8 rounded-md border border-slate-200 bg-white px-3 text-xs text-slate-700 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                    >
                        {opcionesEstado.map(o => <option key={o.valor} value={o.valor}>{o.etiqueta}</option>)}
                    </select>
                    <input
                        type="date"
                        value={fechaDesde}
                        onChange={e => setFechaDesde(e.target.value)}
                        className="h-8 rounded-md border border-slate-200 bg-white px-2 text-xs text-slate-700 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                        title="Desde"
                    />
                    <input
                        type="date"
                        value={fechaHasta}
                        onChange={e => setFechaHasta(e.target.value)}
                        className="h-8 rounded-md border border-slate-200 bg-white px-2 text-xs text-slate-700 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                        title="Hasta"
                    />
                </BarraFiltros>

                <div className="ml-4 flex h-9 flex-shrink-0 items-center gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-800">
                    <button
                        onClick={() => setVistaTabla(true)}
                        className={`inline-flex h-7 items-center gap-1.5 rounded-md px-2.5 text-xs font-bold transition-all ${vistaTabla ? 'bg-white text-blue-600 shadow-sm dark:bg-slate-700 dark:text-blue-400' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'}`}
                    >
                        <ListIcon className="h-3.5 w-3.5" />
                        Tabla
                    </button>
                    <button
                        onClick={() => setVistaTabla(false)}
                        className={`inline-flex h-7 items-center gap-1.5 rounded-md px-2.5 text-xs font-bold transition-all ${!vistaTabla ? 'bg-white text-blue-600 shadow-sm dark:bg-slate-700 dark:text-blue-400' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'}`}
                    >
                        <LayoutGrid className="h-3.5 w-3.5" />
                        Bloques
                    </button>
                </div>
            </div>

            {vistaTabla ? (
                <div className="space-y-4">
                    <div className="flex justify-end">
                        <button onClick={() => setMostrarCanasta(true)} className="inline-flex h-8 items-center rounded-md bg-emerald-600 px-3 text-xs font-bold text-white transition-colors hover:bg-emerald-700">
                            Nueva canasta
                        </button>
                    </div>

                    <div className="rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800">
                            <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                                Canastas
                                <span className="ml-2 text-xs font-normal text-slate-400">({canastasFiltradas.length} registros)</span>
                            </h2>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs">
                                <thead>
                                    <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/50">
                                        <th className="px-4 py-2.5 text-left font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Canasta</th>
                                        <th className="px-4 py-2.5 text-left font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Carnet</th>
                                        <th className="px-4 py-2.5 text-left font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Estudiante</th>
                                        <th className="px-4 py-2.5 text-left font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Docente</th>
                                        <th className="px-4 py-2.5 text-left font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Equipos</th>
                                        <th className="px-4 py-2.5 text-center font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Fecha préstamo</th>
                                        <th className="px-4 py-2.5 text-center font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Fecha devolución</th>
                                        <th className="px-4 py-2.5 text-center font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Estado</th>
                                        <th className="px-4 py-2.5 text-right font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {canastasFiltradas.map((c) => (
                                        <tr key={c.id} className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/40">
                                            <td className="px-4 py-2.5 font-mono text-slate-500 dark:text-slate-400">{c.id}</td>
                                            <td className="px-4 py-2.5 font-mono font-semibold text-blue-600 dark:text-blue-400">{c.carnetEstudiante}</td>
                                            <td className="px-4 py-2.5 text-slate-700 dark:text-slate-300">{estudiantesPorCarnet.get(c.carnetEstudiante) ? `${estudiantesPorCarnet.get(c.carnetEstudiante)!.apellido}, ${estudiantesPorCarnet.get(c.carnetEstudiante)!.nombre}` : '—'}</td>
                                            <td className="px-4 py-2.5 text-slate-700 dark:text-slate-300">{c.docente}</td>
                                            <td className="px-4 py-2.5 text-slate-700 dark:text-slate-300">
                                                <div>{c.totalActivos} activo(s) · {c.cosas.map((i) => `[${i.codigoInventario}] ${i.nombre}`).join(', ') || '—'}</div>
                                                <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                                                    {c.totalConsumibles} consumible(s) · {c.consumibles.length > 0 ? c.consumibles.map((i) => `${i.material} (${i.lote}) x${i.cantidad}`).join(', ') : 'Sin consumibles'}
                                                </div>
                                            </td>
                                            <td className="px-4 py-2.5 text-center text-slate-600 dark:text-slate-400">{formatearFechaHora(c.fechaPrestamo)}</td>
                                            <td className="px-4 py-2.5 text-center text-slate-600 dark:text-slate-400">{c.fechaDevolucion ? formatearFechaHora(c.fechaDevolucion) : 'Pendiente'}</td>
                                            <td className="px-4 py-2.5 text-center text-slate-700 dark:text-slate-300">{c.estado}</td>
                                            <td className="px-4 py-2.5">
                                                <div className="flex justify-end gap-2">
                                                    <button onClick={() => setModalEditarCanasta(c)} className="h-7 rounded-md border border-slate-200 px-2 text-[11px] text-slate-700 dark:border-slate-700 dark:text-slate-200">Editar</button>
                                                    <button onClick={() => setModalEditarFechas(c)} className="h-7 rounded-md border border-blue-200 px-2 text-[11px] text-blue-700 dark:border-blue-800 dark:text-blue-300">Extender</button>
                                                    <button
                                                        onClick={() => { void devolverCanasta(c.id); }}
                                                        className="h-7 rounded-md border border-emerald-200 px-2 text-[11px] text-emerald-700 dark:border-emerald-800 dark:text-emerald-300"
                                                    >
                                                        Devolver
                                                    </button>
                                                    <button
                                                        onClick={() => { void eliminarCanasta(c.id); }}
                                                        className="h-7 rounded-md border border-red-200 px-2 text-[11px] text-red-700 dark:border-red-800 dark:text-red-300"
                                                    >
                                                        Eliminar
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {canastasFiltradas.length === 0 && (
                                        <tr>
                                            <td colSpan={9} className="px-4 py-4 text-center text-slate-500 dark:text-slate-400">
                                                {cargandoCanastas ? 'Cargando canastas...' : errorCanastas || 'Sin canastas para los filtros actuales.'}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="flex justify-end">
                        <button onClick={() => setMostrarCanasta(true)} className="inline-flex h-8 items-center rounded-md bg-emerald-600 px-3 text-xs font-bold text-white transition-colors hover:bg-emerald-700">
                            Nueva canasta
                        </button>
                    </div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                        {canastasFiltradas.map((c) => {
                            const estudiante = estudiantesPorCarnet.get(c.carnetEstudiante);
                            return (
                                <article key={c.id} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                                    <div className="mb-3 flex items-start justify-between gap-2">
                                        <div>
                                            <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400">{c.id}</p>
                                            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">{estudiante ? `${estudiante.apellido}, ${estudiante.nombre}` : c.carnetEstudiante}</h3>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">Docente: {c.docente}</p>
                                        </div>
                                        <span className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold uppercase ${colorEstadoCanasta(c.estado)}`}>
                                            {c.estado}
                                        </span>
                                    </div>

                                    <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
                                        <p><span className="font-semibold">Préstamo:</span> {formatearFechaHora(c.fechaPrestamo)}</p>
                                        <p><span className="font-semibold">Devolución:</span> {c.fechaDevolucion ? formatearFechaHora(c.fechaDevolucion) : 'Pendiente'}</p>
                                        <p><span className="font-semibold">Activos:</span> {c.totalActivos}</p>
                                        <p className="line-clamp-2"><span className="font-semibold">Detalle activos:</span> {c.cosas.map((i) => `[${i.codigoInventario}] ${i.nombre}`).join(', ') || 'Sin activos'}</p>
                                        <p><span className="font-semibold">Consumibles:</span> {c.totalConsumibles}</p>
                                        <p className="line-clamp-2"><span className="font-semibold">Detalle consumibles:</span> {c.consumibles.length > 0 ? c.consumibles.map((i) => `${i.material} (${i.lote}) x${i.cantidad}`).join(', ') : 'Sin consumibles'}</p>
                                    </div>

                                    <div className="mt-4 flex flex-wrap gap-2">
                                        <button onClick={() => setModalEditarCanasta(c)} className="h-7 rounded-md border border-slate-200 px-2 text-[11px] text-slate-700 dark:border-slate-700 dark:text-slate-200">Editar</button>
                                        <button onClick={() => setModalEditarFechas(c)} className="h-7 rounded-md border border-blue-200 px-2 text-[11px] text-blue-700 dark:border-blue-800 dark:text-blue-300">Extender</button>
                                        <button onClick={() => { void devolverCanasta(c.id); }} className="h-7 rounded-md border border-emerald-200 px-2 text-[11px] text-emerald-700 dark:border-emerald-800 dark:text-emerald-300">Devolver</button>
                                        <button onClick={() => { void eliminarCanasta(c.id); }} className="h-7 rounded-md border border-red-200 px-2 text-[11px] text-red-700 dark:border-red-800 dark:text-red-300">Eliminar</button>
                                    </div>
                                </article>
                            );
                        })}

                        {canastasFiltradas.length === 0 && (
                            <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
                                {cargandoCanastas ? 'Cargando canastas...' : errorCanastas || 'Sin canastas para los filtros actuales.'}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {mostrarCanasta && (
                <FormularioCanastaPrestamo
                    onCerrar={() => {
                        setMostrarCanasta(false);
                        void cargarCanastas();
                    }}
                />
            )}

            {modalEditarCanasta && (
                <FormularioEdicionJerarquia
                    titulo={`Editar canasta (${modalEditarCanasta.id})`}
                    camposIniciales={[
                        { key: 'carnetEstudiante', label: 'Carnet estudiante', value: modalEditarCanasta.carnetEstudiante },
                        {
                            key: 'idDocente',
                            label: 'Docente',
                            value: modalEditarCanasta.idDocente ?? '',
                            type: 'select',
                            options: [
                                { value: '', label: 'Seleccionar docente...' },
                                ...docentes.map((d) => ({ value: d.id, label: `[${d.codigo}] ${d.apellido}, ${d.nombre}` })),
                            ],
                        },
                        { key: 'fechaPrestamo', label: 'Fecha/hora de préstamo', value: modalEditarCanasta.fechaPrestamo, type: 'datetime-local' },
                        { key: 'fechaDevolucion', label: 'Fecha/hora límite de devolución', value: modalEditarCanasta.fechaDevolucion ?? '', type: 'datetime-local', required: false },
                        { key: 'observaciones', label: 'Observaciones', value: modalEditarCanasta.observaciones, type: 'text', required: false },
                    ]}
                    onGuardar={(valores) => {
                        void (async () => {
                            if (!valores.idDocente) {
                                throw new Error('Debes seleccionar un docente.');
                            }
                            await editarCanastaPrestamoEnBackend(modalEditarCanasta.id, {
                                carnetEstudiante: valores.carnetEstudiante,
                                idDocente: Number(valores.idDocente),
                                fechaPrestamo: valores.fechaPrestamo,
                                fechaDevolucion: valores.fechaDevolucion || null,
                                observaciones: valores.observaciones,
                            });
                            setModalEditarCanasta(null);
                            await recargarDatos();
                            await cargarCanastas();
                        })();
                    }}
                    onCerrar={() => setModalEditarCanasta(null)}
                />
            )}

            {modalEditarFechas && (
                <FormularioEdicionJerarquia
                    titulo={`Extender canasta (${modalEditarFechas.id})`}
                    camposIniciales={[
                        { key: 'fechaDevolucion', label: 'Fecha/hora límite de devolución', value: modalEditarFechas.fechaDevolucion ?? '', type: 'datetime-local', required: false },
                    ]}
                    onGuardar={(valores) => {
                        if (!valores.fechaDevolucion) return;
                        void (async () => {
                            await extenderCanastaPrestamoEnBackend(modalEditarFechas.id, valores.fechaDevolucion);
                            setModalEditarFechas(null);
                            await recargarDatos();
                            await cargarCanastas();
                        })();
                    }}
                    onCerrar={() => setModalEditarFechas(null)}
                />
            )}

        </LayoutPagina>
    );
};
