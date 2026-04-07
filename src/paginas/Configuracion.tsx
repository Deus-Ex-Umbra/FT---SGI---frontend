import { BookOpen, GraduationCap, Moon, Palette, Pencil, Sun, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { PaginaApp } from '@/tipos/navegacion';
import { LayoutPagina } from '@/componentes/layout/layout-pagina';
import type { Tema } from '@/tipos/tema';
import { Boton } from '@/componentes/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/componentes/ui/dialog';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/componentes/ui/accordion';
import { useCierreSeguro } from '@/hooks/use-cierre-seguro';
import { useInventario } from '@/contextos/ContextoInventario';
import { useConfirmacion } from '@/contextos/ContextoConfirmacion';
import type { Carrera, Materia } from '@/tipos/inventario';

interface Props {
    onNavegar: (pagina: PaginaApp) => void;
    onCerrarSesion: () => void;
    temaActivo: Tema;
    onCambiarTema: (tema: Tema) => void;
}

interface OpcionTema {
    id: Tema;
    icono: React.ElementType;
    etiqueta: string;
    descripcion: string;
}

const opcionesTema: OpcionTema[] = [
    { id: 'claro', icono: Sun, etiqueta: 'Claro', descripcion: 'Interfaz en modo claro' },
    { id: 'oscuro', icono: Moon, etiqueta: 'Oscuro', descripcion: 'Interfaz en modo oscuro' },
    { id: 'mixto', icono: Palette, etiqueta: 'Mixto', descripcion: 'Menú lateral oscuro con fondo claro' },
];

export const Configuracion = ({ onNavegar, onCerrarSesion, temaActivo, onCambiarTema }: Props) => {
    const {
        materias,
        carreras,
        agregarMateria,
        editarMateria,
        eliminarMateria,
        agregarCarrera,
        editarCarrera,
        eliminarCarrera,
    } = useInventario();

    const { confirmar } = useConfirmacion();

    const materiasOrdenadas = useMemo(() => {
        return [...materias].sort((a, b) => a.codigo.localeCompare(b.codigo));
    }, [materias]);

    const carrerasOrdenadas = useMemo(() => {
        return [...carreras].sort((a, b) => a.nombre.localeCompare(b.nombre));
    }, [carreras]);

    const [errorCatalogos, setErrorCatalogos] = useState<string | null>(null);
    const [guardandoCatalogos, setGuardandoCatalogos] = useState(false);

    // Materias: crear
    const [dlgCrearMateriaOpen, setDlgCrearMateriaOpen] = useState(false);
    const [nuevoMateria, setNuevoMateria] = useState<{ codigo: string; nombre: string }>({ codigo: '', nombre: '' });

    const resetCrearMateria = () => setNuevoMateria({ codigo: '', nombre: '' });

    const cierreSeguroCrearMateria = useCierreSeguro({
        estaSucio: Boolean(nuevoMateria.codigo.trim() || nuevoMateria.nombre.trim()),
        estaCargando: guardandoCatalogos,
        alCerrar: () => {
            setDlgCrearMateriaOpen(false);
            resetCrearMateria();
            setErrorCatalogos(null);
        },
    });

    const guardarNuevaMateria = async () => {
        const codigo = nuevoMateria.codigo.trim();
        if (!codigo) {
            setErrorCatalogos('El código de materia es obligatorio.');
            return;
        }
        setGuardandoCatalogos(true);
        setErrorCatalogos(null);
        try {
            await agregarMateria({ codigo, nombre: nuevoMateria.nombre.trim() || null });
            cierreSeguroCrearMateria.confirmarCierre();
        } catch (e: any) {
            setErrorCatalogos(e?.message ?? 'No se pudo registrar la materia.');
        } finally {
            setGuardandoCatalogos(false);
        }
    };

    // Materias: editar
    const [dlgEditarMateriaOpen, setDlgEditarMateriaOpen] = useState(false);
    const [materiaEdicion, setMateriaEdicion] = useState<null | { id: string; codigo: string; nombre: string }>(null);
    const [materiaEdicionBase, setMateriaEdicionBase] = useState<null | { codigo: string; nombre: string }>(null);

    const abrirEdicionMateria = (m: Materia) => {
        const nombre = (m.nombre ?? '').toString();
        setMateriaEdicion({ id: m.id, codigo: m.codigo, nombre });
        setMateriaEdicionBase({ codigo: m.codigo, nombre });
        setErrorCatalogos(null);
        setDlgEditarMateriaOpen(true);
    };

    const editarMateriaEstaSucia = Boolean(
        materiaEdicion &&
        materiaEdicionBase &&
        (materiaEdicion.codigo.trim() !== materiaEdicionBase.codigo.trim() || materiaEdicion.nombre.trim() !== materiaEdicionBase.nombre.trim())
    );

    const cierreSeguroEditarMateria = useCierreSeguro({
        estaSucio: editarMateriaEstaSucia,
        estaCargando: guardandoCatalogos,
        alCerrar: () => {
            setDlgEditarMateriaOpen(false);
            setMateriaEdicion(null);
            setMateriaEdicionBase(null);
            setErrorCatalogos(null);
        },
    });

    const guardarEdicionMateria = async () => {
        if (!materiaEdicion) return;
        const codigo = materiaEdicion.codigo.trim();
        if (!codigo) {
            setErrorCatalogos('El código de materia es obligatorio.');
            return;
        }
        setGuardandoCatalogos(true);
        setErrorCatalogos(null);
        try {
            await editarMateria(materiaEdicion.id, {
                codigo,
                nombre: materiaEdicion.nombre.trim() || null,
            });
            cierreSeguroEditarMateria.confirmarCierre();
        } catch (e: any) {
            setErrorCatalogos(e?.message ?? 'No se pudo editar la materia.');
        } finally {
            setGuardandoCatalogos(false);
        }
    };

    const borrarMateria = async (m: Materia) => {
        const ok = await confirmar({
            titulo: 'Eliminar materia',
            descripcion: `¿Eliminar la materia ${m.codigo}?`,
            textoConfirmar: 'Eliminar',
            textoCancelar: 'Cancelar',
            varianteConfirmar: 'destructive',
        });
        if (!ok) return;
        setGuardandoCatalogos(true);
        setErrorCatalogos(null);
        try {
            await eliminarMateria(m.id);
        } catch (e: any) {
            setErrorCatalogos(e?.message ?? 'No se pudo eliminar la materia.');
        } finally {
            setGuardandoCatalogos(false);
        }
    };

    // Carreras: crear
    const [dlgCrearCarreraOpen, setDlgCrearCarreraOpen] = useState(false);
    const [nuevoCarrera, setNuevoCarrera] = useState<{ nombre: string }>({ nombre: '' });
    const resetCrearCarrera = () => setNuevoCarrera({ nombre: '' });
    const cierreSeguroCrearCarrera = useCierreSeguro({
        estaSucio: Boolean(nuevoCarrera.nombre.trim()),
        estaCargando: guardandoCatalogos,
        alCerrar: () => {
            setDlgCrearCarreraOpen(false);
            resetCrearCarrera();
            setErrorCatalogos(null);
        },
    });

    const guardarNuevaCarrera = async () => {
        const nombre = nuevoCarrera.nombre.trim();
        if (!nombre) {
            setErrorCatalogos('El nombre de la carrera es obligatorio.');
            return;
        }
        setGuardandoCatalogos(true);
        setErrorCatalogos(null);
        try {
            await agregarCarrera({ nombre });
            cierreSeguroCrearCarrera.confirmarCierre();
        } catch (e: any) {
            setErrorCatalogos(e?.message ?? 'No se pudo registrar la carrera.');
        } finally {
            setGuardandoCatalogos(false);
        }
    };

    // Carreras: editar
    const [dlgEditarCarreraOpen, setDlgEditarCarreraOpen] = useState(false);
    const [carreraEdicion, setCarreraEdicion] = useState<null | { id: string; nombre: string }>(null);
    const [carreraEdicionBase, setCarreraEdicionBase] = useState<null | { nombre: string }>(null);

    const abrirEdicionCarrera = (c: Carrera) => {
        setCarreraEdicion({ id: c.id, nombre: c.nombre });
        setCarreraEdicionBase({ nombre: c.nombre });
        setErrorCatalogos(null);
        setDlgEditarCarreraOpen(true);
    };

    const editarCarreraEstaSucia = Boolean(
        carreraEdicion && carreraEdicionBase && carreraEdicion.nombre.trim() !== carreraEdicionBase.nombre.trim()
    );

    const cierreSeguroEditarCarrera = useCierreSeguro({
        estaSucio: editarCarreraEstaSucia,
        estaCargando: guardandoCatalogos,
        alCerrar: () => {
            setDlgEditarCarreraOpen(false);
            setCarreraEdicion(null);
            setCarreraEdicionBase(null);
            setErrorCatalogos(null);
        },
    });

    const guardarEdicionCarrera = async () => {
        if (!carreraEdicion) return;
        const nombre = carreraEdicion.nombre.trim();
        if (!nombre) {
            setErrorCatalogos('El nombre de la carrera es obligatorio.');
            return;
        }
        setGuardandoCatalogos(true);
        setErrorCatalogos(null);
        try {
            await editarCarrera(carreraEdicion.id, { nombre });
            cierreSeguroEditarCarrera.confirmarCierre();
        } catch (e: any) {
            setErrorCatalogos(e?.message ?? 'No se pudo editar la carrera.');
        } finally {
            setGuardandoCatalogos(false);
        }
    };

    const borrarCarrera = async (c: Carrera) => {
        const ok = await confirmar({
            titulo: 'Eliminar carrera',
            descripcion: `¿Eliminar la carrera ${c.nombre}?`,
            textoConfirmar: 'Eliminar',
            textoCancelar: 'Cancelar',
            varianteConfirmar: 'destructive',
        });
        if (!ok) return;
        setGuardandoCatalogos(true);
        setErrorCatalogos(null);
        try {
            await eliminarCarrera(c.id);
        } catch (e: any) {
            setErrorCatalogos(e?.message ?? 'No se pudo eliminar la carrera.');
        } finally {
            setGuardandoCatalogos(false);
        }
    };

    return (
    <LayoutPagina
        paginaActiva="configuracion"
        titulo="Configuración"
        subtitulo="Ajustes generales del sistema"
        onNavegar={onNavegar}
        onCerrarSesion={onCerrarSesion}
    >
        <div className="space-y-4">
            <div className="rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-2 border-b border-slate-200 px-4 py-3 dark:border-slate-800">
                <Palette className="h-4 w-4 text-slate-500" />
                <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Temas</h2>
            </div>

            <div className="p-4">
                <p className="mb-4 text-xs text-slate-500 dark:text-slate-400">
                    Selecciona el tema visual de la interfaz del sistema.
                </p>
                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                    {opcionesTema.map(({ id, icono: Icono, etiqueta, descripcion }) => {
                        const estaActivo = temaActivo === id;
                        return (
                            <button
                                key={id}
                                onClick={() => onCambiarTema(id)}
                                className={`flex flex-col items-center gap-3 rounded-lg border-2 p-4 text-center transition-all ${estaActivo
                                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                                    : 'border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-slate-600'
                                    }`}
                            >
                                <div className={`flex h-10 w-10 items-center justify-center rounded-full ${estaActivo ? 'bg-blue-100 dark:bg-blue-900' : 'bg-white dark:bg-slate-700'
                                    }`}>
                                    <Icono className={`h-5 w-5 ${estaActivo ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400'}`} />
                                </div>
                                <div>
                                    <p className={`text-sm font-semibold ${estaActivo ? 'text-blue-700 dark:text-blue-300' : 'text-slate-700 dark:text-slate-300'}`}>
                                        {etiqueta}
                                    </p>
                                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{descripcion}</p>
                                </div>
                                {estaActivo && (
                                    <span className="rounded-full bg-blue-500 px-2 py-0.5 text-[10px] font-semibold text-white">
                                        Activo
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center gap-2 border-b border-slate-200 px-4 py-3 dark:border-slate-800">
                    <BookOpen className="h-4 w-4 text-slate-500" />
                    <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Catálogos</h2>
                </div>

                <div className="p-4 space-y-3">
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                        Registra y mantiene los catálogos del sistema.
                    </p>

                    {errorCatalogos && (
                        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-200">
                            {errorCatalogos}
                        </div>
                    )}

                    <Accordion type="multiple" className="space-y-3">
                        <AccordionItem value="materias">
                            <AccordionTrigger>
                                <span className="inline-flex items-center gap-2">
                                    <BookOpen className="h-4 w-4 text-slate-500" />
                                    Materias
                                    <span className="text-xs font-normal text-slate-500 dark:text-slate-400">({materiasOrdenadas.length})</span>
                                </span>
                            </AccordionTrigger>
                            <AccordionContent>
                                <div className="flex items-center justify-between gap-3">
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                        Código obligatorio, nombre opcional.
                                    </p>

                                    <Dialog
                                        open={dlgCrearMateriaOpen}
                                        onOpenChange={(open) => {
                                            if (open) {
                                                setErrorCatalogos(null);
                                                resetCrearMateria();
                                                setDlgCrearMateriaOpen(true);
                                                return;
                                            }
                                            cierreSeguroCrearMateria.solicitarCierre();
                                        }}
                                    >
                                        <DialogTrigger asChild>
                                            <Boton type="button" size="sm" className="text-xs" disabled={guardandoCatalogos}>
                                                Crear
                                            </Boton>
                                        </DialogTrigger>
                                        <DialogContent className="max-w-xl">
                                            <DialogHeader>
                                                <DialogTitle>Registrar materia</DialogTitle>
                                                <DialogDescription>Completa el código y, si corresponde, el nombre.</DialogDescription>
                                            </DialogHeader>

                                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                                                <div className="flex flex-col gap-1">
                                                    <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Código *</label>
                                                    <input
                                                        value={nuevoMateria.codigo}
                                                        onChange={(e) => setNuevoMateria((p) => ({ ...p, codigo: e.target.value }))}
                                                        placeholder="Ej: SIS245"
                                                        className="h-9 rounded-md border border-slate-200 bg-white px-3 text-xs text-slate-800 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                                                    />
                                                </div>
                                                <div className="flex flex-col gap-1 sm:col-span-2">
                                                    <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Nombre</label>
                                                    <input
                                                        value={nuevoMateria.nombre}
                                                        onChange={(e) => setNuevoMateria((p) => ({ ...p, nombre: e.target.value }))}
                                                        placeholder="Opcional"
                                                        className="h-9 rounded-md border border-slate-200 bg-white px-3 text-xs text-slate-800 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                                                    />
                                                </div>
                                            </div>

                                            <DialogFooter>
                                                <Boton type="button" variant="outline" onClick={() => cierreSeguroCrearMateria.solicitarCierre()} disabled={guardandoCatalogos}>
                                                    Cerrar
                                                </Boton>
                                                <Boton type="button" onClick={() => void guardarNuevaMateria()} disabled={guardandoCatalogos}>
                                                    {guardandoCatalogos ? 'Guardando...' : 'Agregar'}
                                                </Boton>
                                            </DialogFooter>
                                        </DialogContent>
                                    </Dialog>
                                </div>

                                <div className="mt-3 overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
                                    <table className="w-full text-xs">
                                        <thead>
                                            <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/50">
                                                <th className="px-4 py-2.5 text-left font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Código</th>
                                                <th className="px-4 py-2.5 text-left font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Nombre</th>
                                                <th className="px-4 py-2.5 text-center font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Acciones</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                            {materiasOrdenadas.map((m) => (
                                                <tr key={m.id} className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/40">
                                                    <td className="px-4 py-2.5 font-mono font-semibold text-blue-600 dark:text-blue-400">{m.codigo}</td>
                                                    <td className="px-4 py-2.5 text-slate-600 dark:text-slate-300">{m.nombre || '—'}</td>
                                                    <td className="px-4 py-2.5">
                                                        <div className="flex items-center justify-center gap-2">
                                                            <button
                                                                onClick={() => abrirEdicionMateria(m)}
                                                                className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                                                                disabled={guardandoCatalogos}
                                                            >
                                                                <Pencil className="h-3 w-3" />
                                                                Editar
                                                            </button>

                                                            <button
                                                                onClick={() => void borrarMateria(m)}
                                                                className="inline-flex items-center gap-1 rounded-md border border-red-200 px-2 py-1 text-[11px] font-medium text-red-600 hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950"
                                                                disabled={guardandoCatalogos}
                                                            >
                                                                <Trash2 className="h-3 w-3" />
                                                                Eliminar
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                <Dialog
                                    open={dlgEditarMateriaOpen}
                                    onOpenChange={(open) => {
                                        if (open) {
                                            setDlgEditarMateriaOpen(true);
                                            return;
                                        }
                                        cierreSeguroEditarMateria.solicitarCierre();
                                    }}
                                >
                                    <DialogContent className="max-w-xl">
                                        <DialogHeader>
                                            <DialogTitle>Editar materia</DialogTitle>
                                            <DialogDescription>Actualiza código y/o nombre.</DialogDescription>
                                        </DialogHeader>
                                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                                            <div className="flex flex-col gap-1">
                                                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Código *</label>
                                                <input
                                                    value={materiaEdicion?.codigo ?? ''}
                                                    onChange={(e) => setMateriaEdicion((p) => (p ? { ...p, codigo: e.target.value } : p))}
                                                    className="h-9 rounded-md border border-slate-200 bg-white px-3 text-xs text-slate-800 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                                                />
                                            </div>
                                            <div className="flex flex-col gap-1 sm:col-span-2">
                                                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Nombre</label>
                                                <input
                                                    value={materiaEdicion?.nombre ?? ''}
                                                    onChange={(e) => setMateriaEdicion((p) => (p ? { ...p, nombre: e.target.value } : p))}
                                                    className="h-9 rounded-md border border-slate-200 bg-white px-3 text-xs text-slate-800 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                                                />
                                            </div>
                                        </div>
                                        <DialogFooter>
                                            <Boton type="button" variant="outline" onClick={() => cierreSeguroEditarMateria.solicitarCierre()} disabled={guardandoCatalogos}>
                                                Cerrar
                                            </Boton>
                                            <Boton type="button" onClick={() => void guardarEdicionMateria()} disabled={guardandoCatalogos || !materiaEdicion}>
                                                {guardandoCatalogos ? 'Guardando...' : 'Guardar cambios'}
                                            </Boton>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>

                                <Dialog
                                    open={cierreSeguroCrearMateria.confirmacionAbierta}
                                    onOpenChange={(open) => {
                                        if (!open) cierreSeguroCrearMateria.cancelarCierre();
                                    }}
                                >
                                    <DialogContent className="max-w-md">
                                        <DialogHeader>
                                            <DialogTitle>Confirmar cierre</DialogTitle>
                                            <DialogDescription>{cierreSeguroCrearMateria.mensajeConfirmacion}</DialogDescription>
                                        </DialogHeader>
                                        <DialogFooter>
                                            <Boton variant="outline" onClick={cierreSeguroCrearMateria.cancelarCierre} disabled={guardandoCatalogos}>
                                                Cancelar
                                            </Boton>
                                            <Boton onClick={cierreSeguroCrearMateria.confirmarCierre} disabled={guardandoCatalogos}>
                                                Cerrar
                                            </Boton>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>

                                <Dialog
                                    open={cierreSeguroEditarMateria.confirmacionAbierta}
                                    onOpenChange={(open) => {
                                        if (!open) cierreSeguroEditarMateria.cancelarCierre();
                                    }}
                                >
                                    <DialogContent className="max-w-md">
                                        <DialogHeader>
                                            <DialogTitle>Confirmar cierre</DialogTitle>
                                            <DialogDescription>{cierreSeguroEditarMateria.mensajeConfirmacion}</DialogDescription>
                                        </DialogHeader>
                                        <DialogFooter>
                                            <Boton variant="outline" onClick={cierreSeguroEditarMateria.cancelarCierre} disabled={guardandoCatalogos}>
                                                Cancelar
                                            </Boton>
                                            <Boton onClick={cierreSeguroEditarMateria.confirmarCierre} disabled={guardandoCatalogos}>
                                                Cerrar
                                            </Boton>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>
                            </AccordionContent>
                        </AccordionItem>

                        <AccordionItem value="carreras">
                            <AccordionTrigger>
                                <span className="inline-flex items-center gap-2">
                                    <GraduationCap className="h-4 w-4 text-slate-500" />
                                    Carreras
                                    <span className="text-xs font-normal text-slate-500 dark:text-slate-400">({carrerasOrdenadas.length})</span>
                                </span>
                            </AccordionTrigger>
                            <AccordionContent>
                                <div className="flex items-center justify-between gap-3">
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                        Nombre obligatorio.
                                    </p>

                                    <Dialog
                                        open={dlgCrearCarreraOpen}
                                        onOpenChange={(open) => {
                                            if (open) {
                                                setErrorCatalogos(null);
                                                resetCrearCarrera();
                                                setDlgCrearCarreraOpen(true);
                                                return;
                                            }
                                            cierreSeguroCrearCarrera.solicitarCierre();
                                        }}
                                    >
                                        <DialogTrigger asChild>
                                            <Boton type="button" size="sm" className="text-xs" disabled={guardandoCatalogos}>
                                                Crear
                                            </Boton>
                                        </DialogTrigger>
                                        <DialogContent className="max-w-xl">
                                            <DialogHeader>
                                                <DialogTitle>Registrar carrera</DialogTitle>
                                                <DialogDescription>Completa el nombre de la carrera.</DialogDescription>
                                            </DialogHeader>
                                            <div className="flex flex-col gap-1">
                                                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Nombre *</label>
                                                <input
                                                    value={nuevoCarrera.nombre}
                                                    onChange={(e) => setNuevoCarrera({ nombre: e.target.value })}
                                                    placeholder="Ej: Ing. de Sistemas"
                                                    className="h-9 rounded-md border border-slate-200 bg-white px-3 text-xs text-slate-800 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                                                />
                                            </div>
                                            <DialogFooter>
                                                <Boton type="button" variant="outline" onClick={() => cierreSeguroCrearCarrera.solicitarCierre()} disabled={guardandoCatalogos}>
                                                    Cerrar
                                                </Boton>
                                                <Boton type="button" onClick={() => void guardarNuevaCarrera()} disabled={guardandoCatalogos}>
                                                    {guardandoCatalogos ? 'Guardando...' : 'Agregar'}
                                                </Boton>
                                            </DialogFooter>
                                        </DialogContent>
                                    </Dialog>
                                </div>

                                <div className="mt-3 overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
                                    <table className="w-full text-xs">
                                        <thead>
                                            <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/50">
                                                <th className="px-4 py-2.5 text-left font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Nombre</th>
                                                <th className="px-4 py-2.5 text-center font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Acciones</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                            {carrerasOrdenadas.map((c) => (
                                                <tr key={c.id} className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/40">
                                                    <td className="px-4 py-2.5 text-slate-700 dark:text-slate-200">{c.nombre}</td>
                                                    <td className="px-4 py-2.5">
                                                        <div className="flex items-center justify-center gap-2">
                                                            <button
                                                                onClick={() => abrirEdicionCarrera(c)}
                                                                className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                                                                disabled={guardandoCatalogos}
                                                            >
                                                                <Pencil className="h-3 w-3" />
                                                                Editar
                                                            </button>

                                                            <button
                                                                onClick={() => void borrarCarrera(c)}
                                                                className="inline-flex items-center gap-1 rounded-md border border-red-200 px-2 py-1 text-[11px] font-medium text-red-600 hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950"
                                                                disabled={guardandoCatalogos}
                                                            >
                                                                <Trash2 className="h-3 w-3" />
                                                                Eliminar
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                <Dialog
                                    open={dlgEditarCarreraOpen}
                                    onOpenChange={(open) => {
                                        if (open) {
                                            setDlgEditarCarreraOpen(true);
                                            return;
                                        }
                                        cierreSeguroEditarCarrera.solicitarCierre();
                                    }}
                                >
                                    <DialogContent className="max-w-xl">
                                        <DialogHeader>
                                            <DialogTitle>Editar carrera</DialogTitle>
                                            <DialogDescription>Actualiza el nombre de la carrera.</DialogDescription>
                                        </DialogHeader>
                                        <div className="flex flex-col gap-1">
                                            <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Nombre *</label>
                                            <input
                                                value={carreraEdicion?.nombre ?? ''}
                                                onChange={(e) => setCarreraEdicion((p) => (p ? { ...p, nombre: e.target.value } : p))}
                                                className="h-9 rounded-md border border-slate-200 bg-white px-3 text-xs text-slate-800 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                                            />
                                        </div>
                                        <DialogFooter>
                                            <Boton type="button" variant="outline" onClick={() => cierreSeguroEditarCarrera.solicitarCierre()} disabled={guardandoCatalogos}>
                                                Cerrar
                                            </Boton>
                                            <Boton type="button" onClick={() => void guardarEdicionCarrera()} disabled={guardandoCatalogos || !carreraEdicion}>
                                                {guardandoCatalogos ? 'Guardando...' : 'Guardar cambios'}
                                            </Boton>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>

                                <Dialog
                                    open={cierreSeguroCrearCarrera.confirmacionAbierta}
                                    onOpenChange={(open) => {
                                        if (!open) cierreSeguroCrearCarrera.cancelarCierre();
                                    }}
                                >
                                    <DialogContent className="max-w-md">
                                        <DialogHeader>
                                            <DialogTitle>Confirmar cierre</DialogTitle>
                                            <DialogDescription>{cierreSeguroCrearCarrera.mensajeConfirmacion}</DialogDescription>
                                        </DialogHeader>
                                        <DialogFooter>
                                            <Boton variant="outline" onClick={cierreSeguroCrearCarrera.cancelarCierre} disabled={guardandoCatalogos}>
                                                Cancelar
                                            </Boton>
                                            <Boton onClick={cierreSeguroCrearCarrera.confirmarCierre} disabled={guardandoCatalogos}>
                                                Cerrar
                                            </Boton>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>

                                <Dialog
                                    open={cierreSeguroEditarCarrera.confirmacionAbierta}
                                    onOpenChange={(open) => {
                                        if (!open) cierreSeguroEditarCarrera.cancelarCierre();
                                    }}
                                >
                                    <DialogContent className="max-w-md">
                                        <DialogHeader>
                                            <DialogTitle>Confirmar cierre</DialogTitle>
                                            <DialogDescription>{cierreSeguroEditarCarrera.mensajeConfirmacion}</DialogDescription>
                                        </DialogHeader>
                                        <DialogFooter>
                                            <Boton variant="outline" onClick={cierreSeguroEditarCarrera.cancelarCierre} disabled={guardandoCatalogos}>
                                                Cancelar
                                            </Boton>
                                            <Boton onClick={cierreSeguroEditarCarrera.confirmarCierre} disabled={guardandoCatalogos}>
                                                Cerrar
                                            </Boton>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                </div>
            </div>
        </div>
    </LayoutPagina>
    );
};
