import { useMemo, useState } from 'react';
import { type PaginaApp } from '../componentes/inventario/MenuLateral';
import { LayoutPagina } from '../componentes/layout/LayoutPagina';
import { BarraFiltros } from '../componentes/layout/BarraFiltros';
import { TablaPrestamos } from '../componentes/prestamos/TablaPrestamos';
import { FormularioPrestamo } from '../componentes/prestamos/FormularioPrestamo';
import { FormularioEditarPrestamo } from '../componentes/prestamos/FormularioEditarPrestamo';
import { FormularioCanastaPrestamo } from '../componentes/prestamos/FormularioCanastaPrestamo';
import { useInventario } from '../contextos/ContextoInventario';
import type { EstadoPrestamo, Prestamo } from '../tipos/inventario';
import { LayoutGrid, ListIcon, ClipboardList, User, Calendar, Info } from 'lucide-react';
import { TarjetaDato } from '../componentes/ui/TarjetaDato';
import { FormularioEdicionJerarquia } from '../componentes/inventario/FormularioEdicionJerarquia';
import { BotonesAuditoria } from '../componentes/layout/BotonesAuditoria';
import { formatearFechaHora } from '../lib/formato-fecha';

interface Props {
    onNavegar: (pagina: PaginaApp) => void;
    onCerrarSesion: () => void;
}

const opcionesEstado: { valor: EstadoPrestamo | ''; etiqueta: string }[] = [
    { valor: '', etiqueta: 'Todos los estados' },
    { valor: 'pendiente', etiqueta: 'Pendiente' },
    { valor: 'devuelto', etiqueta: 'Devuelto' },
    { valor: 'vencido', etiqueta: 'Vencido' },
];

export const Prestamos = ({ onNavegar, onCerrarSesion }: Props) => {
    const { prestamos, herramientas, estudiantes, docentes, editarPrestamo, devolverPrestamo, extenderPrestamo } = useInventario();
    const [mostrarFormulario, setMostrarFormulario] = useState(false);
    const [busqueda, setBusqueda] = useState('');
    const [filtroEstado, setFiltroEstado] = useState<EstadoPrestamo | ''>('');
    const [fechaDesde, setFechaDesde] = useState('');
    const [fechaHasta, setFechaHasta] = useState('');
    const [vistaTabla, setVistaTabla] = useState(true);
    const [modalEditarFechas, setModalEditarFechas] = useState<Prestamo | null>(null);
    const [modalEditarPrestamo, setModalEditarPrestamo] = useState<Prestamo | null>(null);
    const [mostrarCanasta, setMostrarCanasta] = useState(false);

    const estudiantesPorCarnet = useMemo(
        () => new Map(estudiantes.map((e) => [e.carnet, e])),
        [estudiantes],
    );
    const herramientasPorId = useMemo(
        () => new Map(herramientas.map((h) => [h.id, h])),
        [herramientas],
    );

    const activos = prestamos.filter(p => p.estado === 'activo' || p.estado === 'pendiente').length;
    const vencidos = prestamos.filter(p => p.estado === 'vencido').length;

    const aFecha = (valor: string, finDia = false) => {
        if (!valor) return null;
        if (valor.includes('T')) return new Date(valor);
        return new Date(`${valor}T${finDia ? '23:59:59' : '00:00:00'}`);
    };

    const prestamosFiltrados = useMemo(() => {
        const termino = busqueda.toLowerCase();
        const desde = aFecha(fechaDesde, false);
        const hasta = aFecha(fechaHasta, true);

        return prestamos.filter(p => {
            const est = estudiantesPorCarnet.get(p.carnetEstudiante);
            const herr = herramientasPorId.get(p.idHerramienta);
            const coincideTexto = termino === '' ||
                p.carnetEstudiante.includes(termino) ||
                (est ? `${est.nombre} ${est.apellido}`.toLowerCase().includes(termino) : false) ||
                (herr ? herr.nombre.toLowerCase().includes(termino) : false) ||
                (herr ? herr.codigoInventario?.toLowerCase().includes(termino) ?? false : false) ||
                p.observaciones.toLowerCase().includes(termino) ||
                p.fechaPrestamo.includes(termino);
            const coincideEstado = filtroEstado === '' || p.estado === filtroEstado;
            const fechaPrestamo = aFecha(p.fechaPrestamo);
            const coincideFechaDesde = !desde || (!!fechaPrestamo && fechaPrestamo >= desde);
            const coincideFechaHasta = !hasta || (!!fechaPrestamo && fechaPrestamo <= hasta);
            return coincideTexto && coincideEstado && coincideFechaDesde && coincideFechaHasta;
        });
    }, [busqueda, fechaDesde, fechaHasta, filtroEstado, herramientasPorId, prestamos, estudiantesPorCarnet]);

    const descargarExcelAuditoria = () => {
        const encabezados = ['ID', 'Carnet', 'Estudiante', 'Docente', 'Activo', 'FechaPrestamo', 'FechaDevolucion', 'Estado', 'Observaciones'];
        const filas = prestamosFiltrados.map(p => {
            const est = estudiantesPorCarnet.get(p.carnetEstudiante);
            const herr = herramientasPorId.get(p.idHerramienta);
            return [
                p.id,
                p.carnetEstudiante,
                est ? `${est.apellido}, ${est.nombre}` : 'N/A',
                p.docente,
                herr ? `[${herr.codigoInventario}] ${herr.nombre}` : 'N/A',
                formatearFechaHora(p.fechaPrestamo),
                p.fechaDevolucion ? formatearFechaHora(p.fechaDevolucion) : 'Pendiente',
                p.estado,
                p.observaciones || ''
            ];
        });

        const csv = [encabezados, ...filas]
            .map(fila => fila.map(valor => `"${String(valor).replace(/"/g, '""')}"`).join(';'))
            .join('\n');

        const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `auditoria_prestamos_filtrados_${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const generarPdfAuditoria = () => {
        const filas = prestamosFiltrados.map(p => {
            const est = estudiantes.find(e => e.carnet === p.carnetEstudiante);
            const herr = herramientas.find(h => h.id === p.idHerramienta);
            return `
                <tr>
                    <td>${p.id}</td>
                    <td>${p.carnetEstudiante}</td>
                    <td>${est ? `${est.apellido}, ${est.nombre}` : 'N/A'}</td>
                    <td>${p.docente}</td>
                    <td>${herr ? `[${herr.codigoInventario}] ${herr.nombre}` : 'N/A'}</td>
                    <td>${formatearFechaHora(p.fechaPrestamo)}</td>
                    <td>${p.fechaDevolucion ? formatearFechaHora(p.fechaDevolucion) : 'Pendiente'}</td>
                    <td>${p.estado}</td>
                </tr>
            `;
        }).join('');

        const ventana = window.open('', '_blank', 'width=1200,height=800');
        if (!ventana) return;

        ventana.document.write(`
            <html>
                <head>
                    <title>Auditoria de Prestamos</title>
                    <style>
                        body { font-family: Arial, sans-serif; padding: 24px; }
                        h1 { margin-bottom: 4px; }
                        p { color: #555; margin-top: 0; }
                        table { width: 100%; border-collapse: collapse; font-size: 12px; }
                        th, td { border: 1px solid #d1d5db; padding: 6px; text-align: left; }
                        th { background: #f3f4f6; }
                    </style>
                </head>
                <body>
                    <h1>Reporte de Auditoria - Prestamos</h1>
                    <p>Generado: ${new Date().toLocaleString('es-BO')} · Registros: ${prestamosFiltrados.length}</p>
                    <table>
                        <thead>
                            <tr>
                                <th>ID</th><th>Carnet</th><th>Estudiante</th><th>Docente</th><th>Activo</th><th>Prestamo</th><th>Devolucion</th><th>Estado</th>
                            </tr>
                        </thead>
                        <tbody>${filas}</tbody>
                    </table>
                </body>
            </html>
        `);
        ventana.document.close();
        ventana.focus();
        ventana.print();
    };

    return (
        <LayoutPagina
            paginaActiva="prestamos"
            titulo="Préstamos de Activos Fijos"
            subtitulo={`${activos} activos · ${vencidos} vencidos · ${prestamos.length} registros en total`}
            alertas={vencidos}
            onNavegar={onNavegar}
            onCerrarSesion={onCerrarSesion}
        >
            <div className="mb-6 flex items-center justify-between">
                <BarraFiltros
                    busqueda={busqueda}
                    onBusquedaChange={setBusqueda}
                    placeholder="Buscar por carnet, estudiante, activo..."
                    filtrosActivos={filtroEstado !== '' || !!fechaDesde || !!fechaHasta}
                    onLimpiarFiltros={() => { setBusqueda(''); setFiltroEstado(''); setFechaDesde(''); setFechaHasta(''); }}
                    textoResultados={`${prestamosFiltrados.length} de ${prestamos.length}`}
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
                    <BotonesAuditoria onExcel={descargarExcelAuditoria} onPdf={generarPdfAuditoria} />
                    <button
                        onClick={() => setMostrarCanasta(true)}
                        className="inline-flex h-7 items-center rounded-md bg-emerald-600 px-2.5 text-xs font-bold text-white transition-colors hover:bg-emerald-700"
                    >
                        Canasta
                    </button>
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
                <TablaPrestamos
                    prestamos={prestamosFiltrados}
                    herramientas={herramientas}
                    estudiantes={estudiantes}
                    onRegistrar={() => setMostrarFormulario(true)}
                    onEditar={p => setModalEditarPrestamo(p)}
                    onExtender={p => setModalEditarFechas(p)}
                    onDevolver={p => { void devolverPrestamo(p.id); }}
                />
            ) : (
                <>
                    <div className="mb-4 flex items-center justify-between">
                        <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                            Vista de tarjetas de préstamos
                            <span className="ml-2 text-xs font-normal text-slate-400">({prestamosFiltrados.length} resultados)</span>
                        </h2>
                        <button onClick={() => setMostrarFormulario(true)} className="flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-blue-700">
                            Nuevo préstamo
                        </button>
                    </div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {prestamosFiltrados.map((p) => {
                            const est = estudiantesPorCarnet.get(p.carnetEstudiante);
                            const herr = herramientasPorId.get(p.idHerramienta);
                            return (
                                <TarjetaDato
                                    key={p.id}
                                    titulo={est ? `${est.nombre} ${est.apellido}` : 'Estudiante desconocido'}
                                    subtitulo={herr?.nombre || 'Activo desconocido'}
                                    Icono={ClipboardList}
                                    badge={{
                                        text: p.estado,
                                        color: (p.estado === 'activo' || p.estado === 'pendiente') ? 'blue' : p.estado === 'devuelto' ? 'green' : 'red'
                                    }}
                                    atributos={[
                                        { label: 'Estudiante', value: p.carnetEstudiante, icon: User },
                                        { label: 'Carnet retenido', value: est?.carnetRetenido ? 'Si' : 'No', icon: Info },
                                        { label: 'Fecha', value: formatearFechaHora(p.fechaPrestamo), icon: Calendar },
                                        { label: 'Estado', value: p.estado.toUpperCase(), icon: Info },
                                    ]}
                                />
                            );
                        })}
                    </div>
                </>
            )}

            {mostrarFormulario && <FormularioPrestamo onCerrar={() => setMostrarFormulario(false)} />}
            {mostrarCanasta && <FormularioCanastaPrestamo onCerrar={() => setMostrarCanasta(false)} />}

            {modalEditarPrestamo && (
                <FormularioEditarPrestamo
                    prestamo={modalEditarPrestamo}
                    estudiantes={estudiantes}
                    docentes={docentes}
                    herramientas={herramientas}
                    onCerrar={() => setModalEditarPrestamo(null)}
                />
            )}

            {modalEditarFechas && (
                <FormularioEdicionJerarquia
                    titulo={`Editar fechas (${modalEditarFechas.id})`}
                    camposIniciales={[
                        { key: 'fechaPrestamo', label: 'Fecha/hora de préstamo', value: modalEditarFechas.fechaPrestamo, type: 'datetime-local' },
                        { key: 'fechaDevolucion', label: 'Fecha/hora límite de devolución', value: modalEditarFechas.fechaDevolucion ?? '', type: 'datetime-local', required: false },
                    ]}
                    onGuardar={(valores) => {
                        const fechaDev = valores.fechaDevolucion || null;
                        if (fechaDev) {
                            void extenderPrestamo(modalEditarFechas.id, fechaDev);
                        }
                        void editarPrestamo(modalEditarFechas.id, {
                            fechaPrestamo: valores.fechaPrestamo,
                        });
                    }}
                    onCerrar={() => setModalEditarFechas(null)}
                />
            )}

        </LayoutPagina>
    );
};
