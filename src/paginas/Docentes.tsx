import { useState } from 'react';
import { type PaginaApp } from '../componentes/inventario/MenuLateral';
import { LayoutPagina } from '../componentes/layout/LayoutPagina';
import { BarraFiltros } from '../componentes/layout/BarraFiltros';
import { TablaDocentes } from '../componentes/inventario/TablaDocentes';
import { FormularioDocente } from '../componentes/inventario/FormularioDocente';
import { useInventario } from '../contextos/ContextoInventario';
import { LayoutGrid, ListIcon, User, Fingerprint, Award, BookOpen } from 'lucide-react';
import { TarjetaDato } from '../componentes/ui/TarjetaDato';

interface Props {
    onNavegar: (pagina: PaginaApp) => void;
    onCerrarSesion: () => void;
}

export const Docentes = ({ onNavegar, onCerrarSesion }: Props) => {
    const { docentes, eliminarDocente } = useInventario();
    const [mostrarFormulario, setMostrarFormulario] = useState(false);
    const [docenteEdicion, setDocenteEdicion] = useState<(typeof docentes)[number] | null>(null);
    const [busqueda, setBusqueda] = useState('');
    const [vistaTabla, setVistaTabla] = useState(true);

    const abrirRegistro = () => {
        setDocenteEdicion(null);
        setMostrarFormulario(true);
    };

    const abrirEdicion = (docente: (typeof docentes)[number]) => {
        setDocenteEdicion(docente);
        setMostrarFormulario(true);
    };

    const borrar = async (docente: (typeof docentes)[number]) => {
        const ok = window.confirm(`¿Deseas descartar al docente ${docente.nombre} ${docente.apellido}? (borrado blando)`);
        if (!ok) return;
        try {
            await eliminarDocente(docente.id);
        } catch (err: any) {
            window.alert(err?.message ?? 'No se pudo descartar el docente.');
        }
    };

    const docentesFiltrados = docentes.filter(d => {
        const termino = busqueda.toLowerCase();
        return (
            termino === '' ||
            d.nombre.toLowerCase().includes(termino) ||
            d.apellido.toLowerCase().includes(termino) ||
            d.materia.toLowerCase().includes(termino) ||
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
                                subtitulo={doc.materia}
                                Icono={User}
                                badge={{ text: 'DOCENTE', color: 'slate' }}
                                atributos={[
                                    { label: 'Código', value: doc.codigo, icon: Fingerprint },
                                    { label: 'Carnet', value: doc.carnet, icon: Award },
                                    { label: 'Materia', value: doc.materia, icon: BookOpen },
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
