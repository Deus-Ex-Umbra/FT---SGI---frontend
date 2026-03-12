import { useMemo, useState } from 'react';
import { type PaginaApp } from '../componentes/inventario/MenuLateral';
import { LayoutPagina } from '../componentes/layout/LayoutPagina';
import { BarraFiltros } from '../componentes/layout/BarraFiltros';
import { TablaEstudiantes } from '../componentes/inventario/TablaEstudiantes';
import { FormularioEstudiante } from '../componentes/inventario/FormularioEstudiante';
import { useInventario } from '../contextos/ContextoInventario';
import { LayoutGrid, ListIcon, User, BookOpen, GraduationCap } from 'lucide-react';
import { TarjetaDato } from '../componentes/ui/TarjetaDato';

interface Props {
    onNavegar: (pagina: PaginaApp) => void;
    onCerrarSesion: () => void;
}

const carreras = ['Todas las carreras', 'Ing. Electrónica', 'Ing. Industrial', 'Ing. Mecánica', 'Ing. Civil', 'Ing. de Sistemas', 'Ing. Química', 'Otra'];

export const Estudiantes = ({ onNavegar, onCerrarSesion }: Props) => {
    const { estudiantes, eliminarEstudiante } = useInventario();
    const [busqueda, setBusqueda] = useState('');
    const [filtroCarrera, setFiltroCarrera] = useState('Todas las carreras');
    const [mostrarFormulario, setMostrarFormulario] = useState(false);
    const [estudianteEdicion, setEstudianteEdicion] = useState<(typeof estudiantes)[number] | null>(null);
    const [vistaTabla, setVistaTabla] = useState(true);

    const abrirRegistro = () => {
        setEstudianteEdicion(null);
        setMostrarFormulario(true);
    };

    const abrirEdicion = (estudiante: (typeof estudiantes)[number]) => {
        setEstudianteEdicion(estudiante);
        setMostrarFormulario(true);
    };

    const borrar = async (estudiante: (typeof estudiantes)[number]) => {
        if (!estudiante.id) return;
        const ok = window.confirm(`¿Deseas descartar al estudiante ${estudiante.nombre} ${estudiante.apellido}? (borrado blando)`);
        if (!ok) return;
        try {
            await eliminarEstudiante(estudiante.id);
        } catch (err: any) {
            window.alert(err?.message ?? 'No se pudo descartar el estudiante.');
        }
    };

    const estudiantesFiltrados = useMemo(() => {
        const termino = busqueda.toLowerCase();
        return estudiantes.filter(e => {
            const coincideTexto = termino === '' ||
                e.carnet.includes(termino) ||
                e.nombre.toLowerCase().includes(termino) ||
                e.apellido.toLowerCase().includes(termino) ||
                e.carrera.toLowerCase().includes(termino) ||
                String(e.semestre).includes(termino);
            const coincideCarrera = filtroCarrera === 'Todas las carreras' || e.carrera === filtroCarrera;
            return coincideTexto && coincideCarrera;
        });
    }, [busqueda, estudiantes, filtroCarrera]);

    return (
        <LayoutPagina
            paginaActiva="estudiantes"
            titulo="Estudiantes registrados"
            subtitulo={`${estudiantes.length} estudiantes habilitados para préstamos`}
            onNavegar={onNavegar}
            onCerrarSesion={onCerrarSesion}
        >
            <div className="mb-6 flex items-center justify-between">
                <BarraFiltros
                    busqueda={busqueda}
                    onBusquedaChange={setBusqueda}
                    placeholder="Buscar por carnet, nombre, apellido..."
                    filtrosActivos={filtroCarrera !== 'Todas las carreras'}
                    onLimpiarFiltros={() => { setBusqueda(''); setFiltroCarrera('Todas las carreras'); }}
                    textoResultados={`${estudiantesFiltrados.length} de ${estudiantes.length}`}
                >
                    <select
                        title="Filtrar por carrera"
                        aria-label="Filtrar por carrera"
                        value={filtroCarrera}
                        onChange={e => setFiltroCarrera(e.target.value)}
                        className="h-8 rounded-md border border-slate-200 bg-white px-3 text-xs text-slate-700 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                    >
                        {carreras.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
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
                <TablaEstudiantes
                    estudiantes={estudiantesFiltrados}
                    onRegistrar={abrirRegistro}
                    onEditar={abrirEdicion}
                    onEliminar={borrar}
                />
            ) : (
                <>
                    <div className="mb-4 flex items-center justify-between">
                        <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                            Vista de tarjetas
                            <span className="ml-2 text-xs font-normal text-slate-400">({estudiantesFiltrados.length} resultados)</span>
                        </h2>
                        <button onClick={abrirRegistro} className="flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-blue-700">
                            Registrar estudiante
                        </button>
                    </div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {estudiantesFiltrados.map((est) => (
                            <TarjetaDato
                                key={est.carnet}
                                titulo={`${est.apellido}, ${est.nombre}`}
                                subtitulo={est.carrera}
                                Icono={User}
                                badge={{ text: `${est.semestre}° Sem`, color: 'blue' }}
                                atributos={[
                                    { label: 'Carnet', value: est.carnet, icon: GraduationCap },
                                    { label: 'Carrera', value: est.carrera, icon: BookOpen },
                                    { label: 'Carnet retenido', value: est.carnetRetenido ? 'Si' : 'No', icon: User },
                                ]}
                            />
                        ))}
                    </div>
                </>
            )}

            {mostrarFormulario && (
                <FormularioEstudiante
                    estudiante={estudianteEdicion}
                    onCerrar={() => {
                        setMostrarFormulario(false);
                        setEstudianteEdicion(null);
                    }}
                />
            )}
        </LayoutPagina>
    );
};
