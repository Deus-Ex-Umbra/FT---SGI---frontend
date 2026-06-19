import { useMemo, useState } from 'react';
import { Archive, Package, Boxes, Plus, Pencil, Trash2 } from 'lucide-react';
import type { PropsPaginaBase } from '@/tipos/paginas';
import { LayoutPagina } from '@/componentes/layout/layout-pagina';
import { BarraFiltros } from '@/componentes/layout/barra-filtros';
import { TarjetaMetrica } from '@/componentes/ui/tarjeta-metrica';
import { FormularioEdicionJerarquia } from '@/componentes/paginas/inventario/formulario-edicion-jerarquia';
import { useInventario } from '@/contextos/ContextoInventario';
import { useConfirmacion } from '@/contextos/ContextoConfirmacion';
import { Skeleton } from '@/componentes/ui/skeleton';

export const Contenedores = ({ onNavegar, onCerrarSesion }: PropsPaginaBase) => {
    const {
        contenedoresCompartidos,
        contenedoresHerramientas,
        contenedoresMateriales,
        agregarContenedorCompartido,
        editarContenedorCompartido,
        eliminarContenedorCompartido,
        cargando,
    } = useInventario();

    const { confirmar } = useConfirmacion();

    const [modal, setModal] = useState<null | {
        modo: 'crear' | 'editar';
        contenedor?: { id: string; nombre: string; descripcion: string; idActivo?: number; idMaterial?: number; visible?: boolean };
    }>(null);
    const [busqueda, setBusqueda] = useState('');

    const contenedoresFiltrados = useMemo(() => {
        const termino = busqueda.trim().toLowerCase();
        if (!termino) return contenedoresCompartidos;

        return contenedoresCompartidos.filter((contenedor) =>
            contenedor.nombre.toLowerCase().includes(termino) ||
            contenedor.descripcion.toLowerCase().includes(termino)
        );
    }, [busqueda, contenedoresCompartidos]);

    return (
        <LayoutPagina
            paginaActiva="contenedores"
            titulo="Contenedores"
            subtitulo={cargando ? 'Cargando contenedores...' : 'Crea lugares compartidos para activos fijos y activos fungibles'}
            onNavegar={onNavegar}
            onCerrarSesion={onCerrarSesion}
        >
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <TarjetaMetrica titulo="Contenedores compartidos" valor={contenedoresCompartidos.length} Icono={Archive} colorBase="indigo" cargando={cargando} />
                <TarjetaMetrica titulo="Disponibles en activos fijos" valor={contenedoresHerramientas.length} Icono={Package} colorBase="blue" cargando={cargando} />
                <TarjetaMetrica titulo="Disponibles en activos fungibles" valor={contenedoresMateriales.length} Icono={Boxes} colorBase="emerald" cargando={cargando} />
            </div>

            <BarraFiltros
                busqueda={busqueda}
                onBusquedaChange={setBusqueda}
                placeholder="Buscar contenedor por nombre o descripción..."
            >
                <div className="ml-auto flex flex-wrap items-center gap-2">
                    <button
                        onClick={() => setModal({ modo: 'crear' })}
                        disabled={cargando}
                        className="inline-flex h-8 items-center gap-1.5 rounded-md bg-indigo-600 px-3 text-xs font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
                    >
                        <Plus className="h-3.5 w-3.5" />
                        Crear contenedor
                    </button>
                </div>
            </BarraFiltros>

            {modal && (
                <FormularioEdicionJerarquia
                    titulo={modal.modo === 'crear' ? 'Crear contenedor' : 'Editar contenedor'}
                    mensajeExito={modal.modo === 'crear' ? 'Contenedor creado correctamente.' : 'Contenedor actualizado correctamente.'}
                    mensajeError={modal.modo === 'crear' ? 'No se pudo crear el contenedor.' : 'No se pudo actualizar el contenedor.'}
                    camposIniciales={[
                        { key: 'nombre', label: 'Nombre del contenedor', value: modal.contenedor?.nombre ?? '' },
                        { key: 'descripcion', label: 'Descripción', value: modal.contenedor?.descripcion ?? '', required: false },
                        { key: 'visible', label: 'Visible para préstamos', value: modal.contenedor?.visible !== false ? 'true' : 'false', type: 'switch', required: false },
                    ]}
                    onGuardar={async (valores) => {
                        const visible = valores.visible === 'true';
                        if (modal.modo === 'crear') {
                            await agregarContenedorCompartido({ nombre: valores.nombre, descripcion: valores.descripcion, visible });
                            return;
                        }

                        if (!modal.contenedor) return;
                        await editarContenedorCompartido({
                            id: modal.contenedor.id,
                            idActivo: modal.contenedor.idActivo,
                            idMaterial: modal.contenedor.idMaterial,
                            nombre: valores.nombre,
                            descripcion: valores.descripcion,
                            visible,
                        });
                    }}
                    onCerrar={() => setModal(null)}
                />
            )}
            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="mb-4 space-y-1">
                    <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Contenedores registrados</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Cada contenedor está disponible para activos fijos y activos fungibles, con edición y eliminación lógica.</p>
                </div>
                <div className="space-y-2">
                    {cargando ? (
                        Array.from({ length: 3 }).map((_, idx) => (
                            <div key={idx} className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 px-3 py-3 dark:border-slate-800">
                                <div className="space-y-2 flex-1">
                                    <Skeleton className="h-4 w-40" />
                                    <Skeleton className="h-3 w-64" />
                                </div>
                                <div className="flex gap-2">
                                    <Skeleton className="h-6 w-20 rounded-full" />
                                    <Skeleton className="h-8 w-8 rounded-md" />
                                    <Skeleton className="h-8 w-8 rounded-md" />
                                </div>
                            </div>
                        ))
                    ) : (
                        <>
                            {contenedoresFiltrados.length === 0 && (
                                <div className="rounded-lg border border-dashed border-slate-300 px-3 py-4 text-xs text-slate-500 dark:border-slate-700 dark:text-slate-400">
                                    {contenedoresCompartidos.length === 0 ? 'Aún no hay contenedores registrados.' : 'No se encontraron contenedores para esa búsqueda.'}
                                </div>
                            )}
                            {contenedoresFiltrados.map((contenedor) => (
                                <div key={contenedor.id} className="flex items-start justify-between gap-3 rounded-lg border border-slate-200 px-3 py-3 dark:border-slate-800">
                                    <div className="space-y-1">
                                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{contenedor.nombre}</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">{contenedor.descripcion}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="inline-flex rounded-full border border-indigo-200 bg-indigo-50 px-2 py-1 text-[11px] font-semibold text-indigo-700 dark:border-indigo-900 dark:bg-indigo-950/30 dark:text-indigo-300">
                                            Compartido
                                        </span>
                                        <span className={`inline-flex rounded-full border px-2 py-1 text-[11px] font-semibold ${contenedor.visible !== false ? 'border-emerald-250 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300' : 'border-slate-200 bg-slate-50 text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400'}`}>
                                            {contenedor.visible !== false ? 'Visible' : 'Oculto'}
                                        </span>
                                        <button
                                            onClick={() => setModal({ modo: 'editar', contenedor })}
                                            className="rounded-md p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                                            title="Editar contenedor"
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </button>
                                        <button
                                            onClick={async () => {
                                                const ok = await confirmar({
                                                    titulo: 'Eliminar contenedor',
                                                    descripcion: `¿Eliminar el contenedor "${contenedor.nombre}"?`,
                                                    textoConfirmar: 'Eliminar',
                                                    textoCancelar: 'Cancelar',
                                                    varianteConfirmar: 'destructive',
                                                });
                                                if (!ok) return;
                                                await eliminarContenedorCompartido({
                                                    id: contenedor.id,
                                                    idActivo: contenedor.idActivo,
                                                    idMaterial: contenedor.idMaterial,
                                                });
                                            }}
                                            className="rounded-md p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30 dark:hover:text-red-400"
                                            title="Eliminar contenedor"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </>
                    )}
                </div>
            </section>
        </LayoutPagina>
    );
};