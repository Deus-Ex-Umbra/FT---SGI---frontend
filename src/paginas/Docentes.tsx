import { useState } from 'react';
import { toast } from 'sonner';
import type { PaginaApp } from '@/tipos/navegacion';
import { LayoutPagina } from '@/componentes/layout/layout-pagina';
import { BarraFiltros } from '@/componentes/layout/barra-filtros';
import { TablaDocentes } from '@/componentes/inventario/tabla-docentes';
import { FormularioDocente } from '@/componentes/inventario/formulario-docente';
import { useInventario } from '@/contextos/ContextoInventario';
import { useConfirmacion } from '@/contextos/ContextoConfirmacion';
import { LayoutGrid, ListIcon, User, Fingerprint, Award, BookOpen } from 'lucide-react';
import { TarjetaDato } from '@/componentes/ui/tarjeta-dato';

interface Props {
    onNavegar: (pagina: PaginaApp) => void;
    onCerrarSesion: () => void;
}

export const Docentes = ({ onNavegar, onCerrarSesion }: Props) => {
    const { docentes, eliminarDocente } = useInventario();
    const { confirmar } = useConfirmacion();
    const [mostrarFormulario, setMostrarFormulario] = useState(false);
    const [docenteEdicion, setDocenteEdicion] = useState<(typeof docentes)[number] | null>(null);
    const [busqueda, setBusqueda] = useState('');
    const [vistaTabla, setVistaTabla] = useState(true);

    const obtenerTextoMaterias = (docente: (typeof docentes)[number]) => {
        const codigos = (docente.materias ?? []).map((m) => m.codigo);
        const fallback = docente.materia ? [docente.materia] : [];
        const unicos = Array.from(
            new Set([...codigos, ...fallback].map((v) => v.trim()).filter(Boolean)),
        );
        return unicos.join(', ');
    };

    const abrirRegistro = () => {
        setDocenteEdicion(null);
        setMostrarFormulario(true);
    };

    const abrirEdicion = (docente: (typeof docentes)[number]) => {
        setDocenteEdicion(docente);
        setMostrarFormulario(true);
    };

    const borrar = async (docente: (typeof docentes)[number]) => {
        const ok = await confirmar({
            titulo: 'Descartar docente',
            descripcion: `¿Deseas descartar al docente ${docente.nombre} ${docente.apellido}? (borrado blando)`,
            textoConfirmar: 'Descartar',
            textoCancelar: 'Cancelar',
            varianteConfirmar: 'destructive',
        });
        if (!ok) return;
        try {
            await eliminarDocente(docente.id);
        } catch (err: any) {
            toast.error(err?.message ?? 'No se pudo descartar el docente.');
        }
    };

    const docentesFiltrados = docentes.filter(d => {
        const termino = busqueda.toLowerCase();
        const materiasTexto = obtenerTextoMaterias(d).toLowerCase();
        return (
            termino === '' ||
            d.nombre.toLowerCase().includes(termino) ||
            d.apellido.toLowerCase().includes(termino) ||
            materiasTexto.includes(termino) ||
            d.codigo.toLowerCase().includes(termino) ||
            d.carnet.toLowerCase().includes(termino)
        );
    });

    return (
        <LayoutPagina
            paginaActiva="docentes"
            titulo="Docentes"
            subtitulo={`${docentes.length} docentes registrados en el sistema`}
            onNavegar={onNavegar}
            onCerrarSesion={onCerrarSesion}
        >
            <div className="mb-6 flex items-center justify-between">
                <BarraFiltros
                    busqueda={busqueda}
                    onBusquedaChange={setBusqueda}
                    placeholder="Buscar por código, nombre, materia, carnet..."
                    textoResultados={`${docentesFiltrados.length} de ${docentes.length}`}
                />
                <div className="ml-4 flex items-center gap-3">
                    <button
                        onClick={() => onNavegar('configuracion')}
                        className="h-9 rounded-md border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                        Catálogos
                    </button>

                    <div className="flex h-9 flex-shrink-0 items-center gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-800">
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
            </div>

            {vistaTabla ? (
                <TablaDocentes
                    docentes={docentesFiltrados}
                    onRegistrar={abrirRegistro}
                    onEditar={abrirEdicion}
                    onEliminar={borrar}
                />
            ) : (
                <>
                    <div className="mb-4 flex items-center justify-between">
                        <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                            Vista de tarjetas
                            <span className="ml-2 text-xs font-normal text-slate-400">({docentesFiltrados.length} resultados)</span>
                        </h2>
                        <button onClick={abrirRegistro} className="flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-blue-700">
                            Registrar docente
                        </button>
                    </div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {docentesFiltrados.map((doc) => (
                            <TarjetaDato
                                key={doc.id}
                                titulo={`${doc.apellido}, ${doc.nombre}`}
                                subtitulo={obtenerTextoMaterias(doc)}
                                Icono={User}
                                badge={{ text: 'DOCENTE', color: 'slate' }}
                                atributos={[
                                    { label: 'Código', value: doc.codigo, icon: Fingerprint },
                                    { label: 'Carnet', value: doc.carnet, icon: Award },
                                    { label: 'Materias', value: obtenerTextoMaterias(doc), icon: BookOpen },
                                ]}
                            />
                        ))}
                    </div>
                </>
            )}

            {mostrarFormulario && (
                <FormularioDocente
                    docente={docenteEdicion}
                    onCerrar={() => {
                        setMostrarFormulario(false);
                        setDocenteEdicion(null);
                    }}
                />
            )}
        </LayoutPagina>
    );
};
