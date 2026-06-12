import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { LayoutPagina } from '@/componentes/layout/layout-pagina';
import { TablaDocentes } from '@/componentes/paginas/inventario/tabla-docentes';
import { FormularioDocente } from '@/componentes/paginas/inventario/formulario-docente';
import { useInventario } from '@/contextos/ContextoInventario';
import { useConfirmacion } from '@/contextos/ContextoConfirmacion';
import { Plus } from 'lucide-react';
import { Boton } from '@/componentes/ui/button';
import { Input } from '@/componentes/ui/input';
import type { PropsPaginaBase } from '@/tipos/paginas';

export const Docentes = ({ onNavegar, onCerrarSesion }: PropsPaginaBase) => {
    const { docentes, eliminarDocente, cargando } = useInventario();
    const { confirmar } = useConfirmacion();
    const [mostrarFormulario, setMostrarFormulario] = useState(false);
    const [docenteEdicion, setDocenteEdicion] = useState<(typeof docentes)[number] | null>(null);
    const [filtroNombre, setFiltroNombre] = useState('');
    const [filtroCarnet, setFiltroCarnet] = useState('');

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
            toast.success('Docente descartado correctamente.');
        } catch (err: any) {
            toast.error(err?.message ?? 'No se pudo descartar el docente.');
        }
    };

    const docentesFiltrados = useMemo(() => {
        const nombreTerm = filtroNombre.toLowerCase().trim();
        const carnetTerm = filtroCarnet.toLowerCase().trim();
        return docentes.filter(d => {
            const coincideNombre = nombreTerm === '' ||
                d.nombre.toLowerCase().includes(nombreTerm) ||
                d.apellido.toLowerCase().includes(nombreTerm);
            const coincideCarnet = carnetTerm === '' ||
                d.carnet.toLowerCase().includes(carnetTerm);
            return coincideNombre && coincideCarnet;
        });
    }, [filtroNombre, filtroCarnet, docentes]);

    return (
        <LayoutPagina
            paginaActiva="docentes"
            titulo="Docentes"
            subtitulo={cargando ? 'Cargando docentes...' : `${docentes.length} docentes registrados en el sistema`}
            onNavegar={onNavegar}
            onCerrarSesion={onCerrarSesion}
        >
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
                    <Input
                        placeholder="Nombre..."
                        value={filtroNombre}
                        onChange={(e) => setFiltroNombre(e.target.value)}
                        className="h-8 max-w-[200px] text-xs bg-white dark:bg-slate-900"
                    />
                    <Input
                        placeholder="Carnet..."
                        value={filtroCarnet}
                        onChange={(e) => setFiltroCarnet(e.target.value)}
                        className="h-8 max-w-[150px] text-xs bg-white dark:bg-slate-900"
                    />
                    {(filtroNombre || filtroCarnet) && (
                        <button
                            onClick={() => {
                                setFiltroNombre('');
                                setFiltroCarnet('');
                            }}
                            className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                        >
                            Limpiar
                        </button>
                    )}
                    <span className="text-xs text-slate-400">
                        {docentesFiltrados.length} de {docentes.length}
                    </span>
                </div>
                <Boton onClick={abrirRegistro} disabled={cargando} size="sm" className="h-8 px-3 text-xs font-semibold gap-1.5 rounded-lg">
                    <Plus className="h-3.5 w-3.5" />
                    Registrar docente
                </Boton>
            </div>

            <TablaDocentes
                docentes={docentesFiltrados}
                onEditar={abrirEdicion}
                onEliminar={borrar}
                puedeAdministrar={true}
                cargando={cargando}
            />

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
