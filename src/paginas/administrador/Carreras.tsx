import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Search, Archive } from 'lucide-react';
import type { Carrera } from '@/tipos/inventario';
import type { FormCarrera, PropsPaginaBase } from '@/tipos/paginas';
import { LayoutPagina } from '@/componentes/layout/layout-pagina';
import { Boton } from '@/componentes/ui/button';
import { Skeleton } from '@/componentes/ui/skeleton';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/componentes/ui/dialog';
import { FormularioCarrera } from '@/componentes/paginas/carreras/formulario-carrera';
import { AccionesFilaAdmin } from '@/componentes/paginas/compartido/acciones-fila-admin';
import { AlertaPermisoAdmin } from '@/componentes/paginas/compartido/alerta-permiso-admin';
import { FilaTablaVacia } from '@/componentes/paginas/compartido/fila-tabla-vacia';
import { MensajeErrorModulo } from '@/componentes/paginas/compartido/mensaje-error-modulo';
import { useInventario } from '@/contextos/ContextoInventario';
import { useConfirmacion } from '@/contextos/ContextoConfirmacion';
import { obtenerUsuarioActual, listarInventarios } from '@/lib/servicio-autenticacion';

const FORM_CARRERA_INICIAL: FormCarrera = { nombre: '', prefijoCu: '' };

export const Carreras = ({ onNavegar, onCerrarSesion }: PropsPaginaBase) => {
    const { carreras, agregarCarrera, editarCarrera, eliminarCarrera, cargando } = useInventario();
    const { confirmar } = useConfirmacion();

    const rol = obtenerUsuarioActual()?.rol;
    const esAdministrador = rol === 'administrador';

    const carrerasOrdenadas = useMemo(() => {
        return [...carreras].sort((a, b) => a.nombre.localeCompare(b.nombre));
    }, [carreras]);

    const [filtroNombre, setFiltroNombre] = useState('');
    const [filtroInventarioId, setFiltroInventarioId] = useState('todos');

    const carrerasFiltradas = useMemo(() => {
        return carrerasOrdenadas.filter((c) => {
            const coincideNombre = c.nombre.toLowerCase().includes(filtroNombre.toLowerCase().trim());
            const idsList = c.inventariosIds ?? (c.inventarios ?? []).map(i => Number(i.id));
            const coincideInventario = filtroInventarioId === 'todos' || 
                idsList.some(id => String(id) === filtroInventarioId);
            return coincideNombre && coincideInventario;
        });
    }, [carrerasOrdenadas, filtroNombre, filtroInventarioId]);

    const [error, setError] = useState<string | null>(null);
    const [guardando, setGuardando] = useState(false);

    const [dlgCrearOpen, setDlgCrearOpen] = useState(false);
    const [nuevaCarrera, setNuevaCarrera] = useState<FormCarrera>({ ...FORM_CARRERA_INICIAL, inventariosIds: [] });

    const [dlgEditarOpen, setDlgEditarOpen] = useState(false);
    const [carreraEdicion, setCarreraEdicion] = useState<null | ({ id: string } & FormCarrera)>(null);

    const [todosInventarios, setTodosInventarios] = useState<Array<{ id: number; nombre: string }>>([]);

    useEffect(() => {
        if (esAdministrador) {
            listarInventarios()
                .then(data => {
                    setTodosInventarios(data);
                })
                .catch(err => {
                    console.error('Error al cargar inventarios en Carreras:', err);
                });
        }
    }, [esAdministrador]);

    const abrirEdicion = (c: Carrera) => {
        setCarreraEdicion({
            id: c.id,
            nombre: c.nombre,
            prefijoCu: c.prefijoCu,
            inventariosIds: c.inventariosIds ?? (c.inventarios ?? []).map(i => Number(i.id))
        });
        setError(null);
        setDlgEditarOpen(true);
    };

    const guardarNuevaCarrera = async () => {
        if (!esAdministrador) return;
        const nombre = nuevaCarrera.nombre.trim();
        const prefijoCu = nuevaCarrera.prefijoCu.trim().toUpperCase();
        const inventariosIds = nuevaCarrera.inventariosIds ?? [];
        if (!nombre) {
            setError('El nombre de la carrera es obligatorio.');
            return;
        }
        if (!prefijoCu) {
            setError('El prefijo de CU es obligatorio.');
            return;
        }

        setGuardando(true);
        setError(null);
        try {
            await agregarCarrera({ nombre, prefijoCu, inventariosIds });
            setDlgCrearOpen(false);
            setNuevaCarrera({ ...FORM_CARRERA_INICIAL, inventariosIds: [] });
            toast.success('Carrera registrada correctamente.');
        } catch (e: any) {
            const msjError = e?.message ?? 'No se pudo registrar la carrera.';
            setError(msjError);
            toast.error(msjError);
        } finally {
            setGuardando(false);
        }
    };

    const guardarEdicion = async () => {
        if (!esAdministrador || !carreraEdicion) return;
        const nombre = carreraEdicion.nombre.trim();
        const prefijoCu = carreraEdicion.prefijoCu.trim().toUpperCase();
        const inventariosIds = carreraEdicion.inventariosIds ?? [];
        if (!nombre) {
            setError('El nombre de la carrera es obligatorio.');
            return;
        }
        if (!prefijoCu) {
            setError('El prefijo de CU es obligatorio.');
            return;
        }

        setGuardando(true);
        setError(null);
        try {
            await editarCarrera(carreraEdicion.id, { nombre, prefijoCu, inventariosIds });
            setDlgEditarOpen(false);
            setCarreraEdicion(null);
            toast.success('Carrera actualizada correctamente.');
        } catch (e: any) {
            const msjError = e?.message ?? 'No se pudo editar la carrera.';
            setError(msjError);
            toast.error(msjError);
        } finally {
            setGuardando(false);
        }
    };

    const borrarCarrera = async (c: Carrera) => {
        if (!esAdministrador) return;

        const ok = await confirmar({
            titulo: 'Eliminar carrera',
            descripcion: `¿Eliminar la carrera ${c.nombre}?`,
            textoConfirmar: 'Eliminar',
            textoCancelar: 'Cancelar',
            varianteConfirmar: 'destructive',
        });
        if (!ok) return;

        setGuardando(true);
        setError(null);
        try {
            await eliminarCarrera(c.id);
            toast.success('Carrera eliminada correctamente.');
        } catch (e: any) {
            const msjError = e?.message ?? 'No se pudo eliminar la carrera.';
            setError(msjError);
            toast.error(msjError);
        } finally {
            setGuardando(false);
        }
    };

    return (
        <LayoutPagina
            paginaActiva="carreras"
            titulo="Carreras"
            subtitulo={cargando ? 'Cargando carreras...' : (filtroNombre || filtroInventarioId !== 'todos') ? `${carrerasFiltradas.length} de ${carrerasOrdenadas.length} carrera(s) encontradas` : `${carrerasOrdenadas.length} carrera(s) registradas`}
            onNavegar={onNavegar}
            onCerrarSesion={onCerrarSesion}
        >
            <div className="space-y-4">
                {!esAdministrador && (
                    <AlertaPermisoAdmin mensaje="Solo Administrador puede crear, editar y eliminar carreras." />
                )}

                {error && <MensajeErrorModulo mensaje={error} />}

                <div className="rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3 dark:border-slate-800">
                        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-0 pr-2">
                            <div className="relative flex-1 max-w-[240px] min-w-[150px]">
                                <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Buscar carrera..."
                                    value={filtroNombre}
                                    onChange={(e) => setFiltroNombre(e.target.value)}
                                    className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-4 text-xs text-slate-800 placeholder-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-850 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-blue-900 transition-all font-medium"
                                />
                            </div>
                            <div className="relative max-w-[240px] min-w-[150px] w-full">
                                <Archive className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                <select
                                    value={filtroInventarioId}
                                    onChange={(e) => setFiltroInventarioId(e.target.value)}
                                    className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-8 text-xs text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-850 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-blue-900 transition-all appearance-none font-medium"
                                >
                                    <option value="todos">Todos los inventarios</option>
                                    {todosInventarios.map((inv) => (
                                        <option key={inv.id} value={String(inv.id)}>
                                            {inv.nombre}
                                        </option>
                                    ))}
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
                                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                                        <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                                    </svg>
                                </div>
                            </div>

                            {(filtroNombre || filtroInventarioId !== 'todos') && (
                                <button
                                    onClick={() => {
                                        setFiltroNombre('');
                                        setFiltroInventarioId('todos');
                                    }}
                                    className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors font-semibold"
                                >
                                    Limpiar
                                </button>
                            )}
                        </div>

                        {esAdministrador && (
                            <Dialog open={dlgCrearOpen} onOpenChange={setDlgCrearOpen}>
                                <DialogTrigger asChild>
                                    <Boton type="button" size="sm" className="text-xs" disabled={guardando || cargando}>
                                        Crear carrera
                                    </Boton>
                                </DialogTrigger>
                                <DialogContent className="max-w-xl">
                                    <DialogHeader>
                                        <DialogTitle>Registrar carrera</DialogTitle>
                                        <DialogDescription>Completa el nombre de la carrera y su prefijo de CU.</DialogDescription>
                                    </DialogHeader>
                                    <FormularioCarrera valores={nuevaCarrera} onCambiar={setNuevaCarrera} inventarios={todosInventarios} />
                                    <DialogFooter>
                                        <Boton type="button" variant="outline" onClick={() => setDlgCrearOpen(false)} disabled={guardando}>
                                            Cerrar
                                        </Boton>
                                        <Boton type="button" onClick={() => void guardarNuevaCarrera()} disabled={guardando}>
                                            {guardando ? 'Guardando...' : 'Agregar'}
                                        </Boton>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        )}
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                            <thead>
                                <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/50">
                                    <th className="px-4 py-2.5 text-left font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Nombre</th>
                                    <th className="px-4 py-2.5 text-left font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Prefijo CU</th>
                                    <th className="px-4 py-2.5 text-left font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Inventarios Asignados</th>
                                    {esAdministrador && (
                                        <th className="px-4 py-2.5 text-center font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Acciones</th>
                                    )}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {cargando ? (
                                    Array.from({ length: 5 }).map((_, idx) => (
                                        <tr key={idx} className="border-b border-slate-100 dark:border-slate-800">
                                            <td className="px-4 py-3"><Skeleton className="h-4 w-3/4" /></td>
                                            <td className="px-4 py-3"><Skeleton className="h-4 w-20" /></td>
                                            <td className="px-4 py-3"><Skeleton className="h-4 w-1/2" /></td>
                                            {esAdministrador && (
                                                <td className="px-4 py-3 text-center">
                                                    <Skeleton className="h-6 w-16 mx-auto" />
                                                </td>
                                            )}
                                        </tr>
                                    ))
                                ) : (
                                    <>
                                        {carrerasFiltradas.map((c) => (
                                            <tr key={c.id} className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/40">
                                                <td className="px-4 py-2.5 text-slate-700 dark:text-slate-200">{c.nombre}</td>
                                                <td className="px-4 py-2.5 font-mono text-slate-700 dark:text-slate-200">{c.prefijoCu || '-'}</td>
                                                <td className="px-4 py-2.5 text-slate-700 dark:text-slate-200">
                                                    {c.inventarios && c.inventarios.length > 0
                                                        ? c.inventarios.map((i) => i.nombre).join(', ')
                                                        : 'Ninguno'}
                                                </td>
                                                {esAdministrador && (
                                                    <td className="px-4 py-2.5">
                                                        <AccionesFilaAdmin
                                                            onEditar={() => abrirEdicion(c)}
                                                            onEliminar={() => {
                                                                void borrarCarrera(c);
                                                            }}
                                                            deshabilitado={guardando}
                                                        />
                                                    </td>
                                                )}
                                            </tr>
                                        ))}
                                        {carrerasFiltradas.length === 0 && (
                                            <FilaTablaVacia colSpan={esAdministrador ? 4 : 3} mensaje={carrerasOrdenadas.length === 0 ? "No hay carreras registradas." : "No se encontraron carreras."} />
                                        )}
                                    </>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <Dialog open={dlgEditarOpen} onOpenChange={setDlgEditarOpen}>
                <DialogContent className="max-w-xl">
                    <DialogHeader>
                        <DialogTitle>Editar carrera</DialogTitle>
                        <DialogDescription>Actualiza el nombre y el prefijo de CU.</DialogDescription>
                    </DialogHeader>
                    <FormularioCarrera
                        valores={{
                            nombre: carreraEdicion?.nombre ?? '',
                            prefijoCu: carreraEdicion?.prefijoCu ?? '',
                            inventariosIds: carreraEdicion?.inventariosIds ?? [],
                        }}
                        onCambiar={(valores) => {
                            setCarreraEdicion((prev) => (prev ? { ...prev, ...valores } : prev));
                        }}
                        inventarios={todosInventarios}
                    />
                    <DialogFooter>
                        <Boton type="button" variant="outline" onClick={() => setDlgEditarOpen(false)} disabled={guardando}>
                            Cerrar
                        </Boton>
                        <Boton type="button" onClick={() => void guardarEdicion()} disabled={guardando || !carreraEdicion}>
                            {guardando ? 'Guardando...' : 'Guardar cambios'}
                        </Boton>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </LayoutPagina>
    );
};
