import { useMemo, useState } from 'react';
import { Search, GraduationCap } from 'lucide-react';
import { toast } from 'sonner';
import type { Materia } from '@/tipos/inventario';
import type { PropsPaginaBase } from '@/tipos/paginas';
import { LayoutPagina } from '@/componentes/layout/layout-pagina';
import { Boton } from '@/componentes/ui/button';
import { Skeleton } from '@/componentes/ui/skeleton';
import { DialogoMateria } from '@/componentes/paginas/materias/dialogo-materia';
import { AccionesFilaAdmin } from '@/componentes/paginas/compartido/acciones-fila-admin';
import { AlertaPermisoAdmin } from '@/componentes/paginas/compartido/alerta-permiso-admin';
import { FilaTablaVacia } from '@/componentes/paginas/compartido/fila-tabla-vacia';
import { useInventario } from '@/contextos/ContextoInventario';
import { useConfirmacion } from '@/contextos/ContextoConfirmacion';
import { obtenerUsuarioActual } from '@/lib/servicio-autenticacion';

export const Materias = ({ onNavegar, onCerrarSesion }: PropsPaginaBase) => {
    const {
        materias,
        carreras,
        eliminarMateria,
        cargando,
    } = useInventario();
    const { confirmar } = useConfirmacion();

    const rol = obtenerUsuarioActual()?.rol;
    const esAdministrador = rol === 'administrador';

    const [busqueda, setBusqueda] = useState('');
    const [filtroCarreraId, setFiltroCarreraId] = useState('todos');

    const materiasOrdenadas = useMemo(() => {
        return [...materias].sort((a, b) => a.codigo.localeCompare(b.codigo));
    }, [materias]);

    const materiasFiltradas = useMemo(() => {
        const termino = busqueda.trim().toLowerCase();
        return materiasOrdenadas.filter((m) => {
            const codigoMatch = m.codigo.toLowerCase().includes(termino);
            const nombreMatch = m.nombre ? m.nombre.toLowerCase().includes(termino) : false;
            const coincideBusqueda = !termino || codigoMatch || nombreMatch;

            const idsList = m.carrerasIds ?? (m.carrerasHabilitadas ?? []).map(c => String(c.id));
            const coincideCarrera = filtroCarreraId === 'todos' || 
                idsList.some(id => String(id) === filtroCarreraId);

            return coincideBusqueda && coincideCarrera;
        });
    }, [materiasOrdenadas, busqueda, filtroCarreraId]);

    const carrerasOrdenadas = useMemo(() => {
        return [...carreras].sort((a, b) => a.nombre.localeCompare(b.nombre));
    }, [carreras]);


    const [guardando, setGuardando] = useState(false);

    const [dlgCrearOpen, setDlgCrearOpen] = useState(false);
    const [dlgEditarOpen, setDlgEditarOpen] = useState(false);
    const [materiaEdicion, setMateriaEdicion] = useState<Materia | undefined>(undefined);

    const abrirEdicion = (materia: Materia) => {
        setMateriaEdicion(materia);
        setDlgEditarOpen(true);
    };

    const borrarMateria = async (materia: Materia) => {
        if (!esAdministrador) return;

        const ok = await confirmar({
            titulo: 'Eliminar materia',
            descripcion: `¿Eliminar la materia ${materia.codigo}?`,
            textoConfirmar: 'Eliminar',
            textoCancelar: 'Cancelar',
            varianteConfirmar: 'destructive',
        });
        if (!ok) return;

        setGuardando(true);
        try {
            await eliminarMateria(materia.id);
        } catch (e: any) {
            toast.error(e?.message ?? 'No se pudo eliminar la materia.');
        } finally {
            setGuardando(false);
        }
    };

    return (
        <LayoutPagina
            paginaActiva="materias"
            titulo="Materias"
            subtitulo={
                cargando
                    ? 'Cargando materias...'
                    : (busqueda || filtroCarreraId !== 'todos')
                    ? `${materiasFiltradas.length} de ${materiasOrdenadas.length} materia(s) encontradas`
                    : `${materiasOrdenadas.length} materia(s) registradas`
            }
            onNavegar={onNavegar}
            onCerrarSesion={onCerrarSesion}
        >
            <div className="space-y-4">
                {!esAdministrador && (
                    <AlertaPermisoAdmin mensaje="Solo el administrador puede crear, editar o eliminar materias." />
                )}

                <div className="rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3 dark:border-slate-800">
                        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-0 pr-2">
                            <div className="relative flex-1 max-w-[240px] min-w-[150px]">
                                <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Buscar materia o sigla..."
                                    value={busqueda}
                                    onChange={(e) => setBusqueda(e.target.value)}
                                    className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-4 text-xs text-slate-800 placeholder-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-850 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-blue-900 transition-all font-medium"
                                />
                            </div>
                            <div className="relative max-w-[240px] min-w-[150px] w-full">
                                <GraduationCap className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                <select
                                    value={filtroCarreraId}
                                    onChange={(e) => setFiltroCarreraId(e.target.value)}
                                    className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-8 text-xs text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-850 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-blue-900 transition-all appearance-none font-medium"
                                >
                                    <option value="todos">Todas las carreras</option>
                                    {carrerasOrdenadas.map((carr) => (
                                        <option key={carr.id} value={String(carr.id)}>
                                            {carr.nombre}
                                        </option>
                                    ))}
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
                                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                                        <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                                    </svg>
                                </div>
                            </div>

                            {(busqueda || filtroCarreraId !== 'todos') && (
                                <button
                                    onClick={() => {
                                        setBusqueda('');
                                        setFiltroCarreraId('todos');
                                    }}
                                    className="text-xs text-slate-400 hover:text-slate-650 dark:hover:text-slate-200 transition-colors font-semibold"
                                >
                                    Limpiar
                                </button>
                            )}
                        </div>

                        {esAdministrador && (
                            <Boton
                                type="button"
                                size="sm"
                                className="text-xs"
                                disabled={guardando || cargando}
                                onClick={() => setDlgCrearOpen(true)}
                            >
                                Crear materia
                            </Boton>
                        )}
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                            <thead>
                                <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/50">
                                    <th className="px-4 py-2.5 text-left font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Código</th>
                                    <th className="px-4 py-2.5 text-left font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Nombre</th>
                                    <th className="px-4 py-2.5 text-left font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Descripción</th>
                                    <th className="px-4 py-2.5 text-left font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Carreras habilitadas</th>
                                    <th className="px-4 py-2.5 text-left font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Docentes asignados</th>
                                    {esAdministrador && (
                                        <th className="px-4 py-2.5 text-center font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Acciones</th>
                                    )}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {cargando ? (
                                    Array.from({ length: 5 }).map((_, idx) => (
                                        <tr key={idx} className="border-b border-slate-100 dark:border-slate-800">
                                            <td className="px-4 py-3"><Skeleton className="h-4 w-16" /></td>
                                            <td className="px-4 py-3"><Skeleton className="h-4 w-24" /></td>
                                            <td className="px-4 py-3"><Skeleton className="h-4 w-1/3" /></td>
                                            <td className="px-4 py-3"><Skeleton className="h-4 w-28" /></td>
                                            <td className="px-4 py-3"><Skeleton className="h-4 w-28" /></td>
                                            {esAdministrador && (
                                                <td className="px-4 py-3 text-center">
                                                    <Skeleton className="h-6 w-16 mx-auto" />
                                                </td>
                                            )}
                                        </tr>
                                    ))
                                ) : (
                                    <>
                                        {materiasFiltradas.map((materia) => (
                                            <tr key={materia.id} className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/40">
                                                <td className="px-4 py-2.5 font-mono font-semibold text-blue-600 dark:text-blue-400">{materia.codigo}</td>
                                                <td className="px-4 py-2.5 text-slate-700 dark:text-slate-200">{materia.nombre || '-'}</td>
                                                <td className="px-4 py-2.5 text-slate-700 dark:text-slate-300">{materia.descripcion || '-'}</td>
                                                <td className="px-4 py-2.5 text-slate-700 dark:text-slate-300">
                                                    {(materia.carrerasHabilitadas ?? []).length > 0
                                                        ? materia.carrerasHabilitadas?.map((carrera) => carrera.nombre).join(', ')
                                                        : '-'}
                                                </td>
                                                <td className="px-4 py-2.5 text-slate-700 dark:text-slate-300">
                                                    {(materia.docentesAsignados ?? []).length > 0
                                                        ? materia.docentesAsignados?.map((docente) => `${docente.codigo} (${docente.nombre} ${docente.apellido})`).join(', ')
                                                        : '-'}
                                                </td>
                                                {esAdministrador && (
                                                    <td className="px-4 py-2.5">
                                                        <AccionesFilaAdmin
                                                            onEditar={() => abrirEdicion(materia)}
                                                            onEliminar={() => {
                                                                void borrarMateria(materia);
                                                            }}
                                                            deshabilitado={guardando}
                                                        />
                                                    </td>
                                                )}
                                            </tr>
                                        ))}
                                        {materiasFiltradas.length === 0 && (
                                            <FilaTablaVacia
                                                colSpan={esAdministrador ? 6 : 5}
                                                mensaje={materiasOrdenadas.length === 0 ? "No hay materias registradas." : "No se encontraron materias."}
                                            />
                                        )}
                                    </>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {dlgCrearOpen && (
                <DialogoMateria
                    open={dlgCrearOpen}
                    onOpenChange={setDlgCrearOpen}
                />
            )}

            {dlgEditarOpen && (
                <DialogoMateria
                    open={dlgEditarOpen}
                    onOpenChange={(val) => {
                        setDlgEditarOpen(val);
                        if (!val) setMateriaEdicion(undefined);
                    }}
                    materia={materiaEdicion}
                />
            )}
        </LayoutPagina>
    );
};
