import { useMemo, useState, useEffect } from 'react';
import type { PropsPaginaBase } from '@/tipos/paginas';
import { LayoutPagina } from '@/componentes/layout/layout-pagina';
import { TablaEstudiantes } from '@/componentes/paginas/inventario/tabla-estudiantes';
import { useInventario } from '@/contextos/ContextoInventario';
import { useConfirmacion } from '@/contextos/ContextoConfirmacion';
import { Input } from '@/componentes/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/componentes/ui/tabs';
import { toast } from 'sonner';
import {
    cargarSolicitudesPendientesEstudiantes,
    aprobarEstudianteEnBackend,
    rechazarEstudianteEnBackend,
} from '@/lib/servicio-estudiantes';
import { obtenerUsuarioActual } from '@/lib/servicio-autenticacion';
import { Check, X, Users, ClipboardList } from 'lucide-react';
import type { Carrera } from '@/tipos/inventario';

export const Estudiantes = ({ onNavegar, onCerrarSesion }: PropsPaginaBase) => {
    const { estudiantes, prestamos, carreras, recargarDatos, cargando, actualizarRetencionCue } = useInventario();
    const { confirmar } = useConfirmacion();
    
    const [pestanaActiva, setPestanaActiva] = useState('activos');
    const [filtroNombre, setFiltroNombre] = useState('');
    const [filtroCarnet, setFiltroCarnet] = useState('');
    const [filtroCarrera, setFiltroCarrera] = useState('');

    const [solicitudes, setSolicitudes] = useState<any[]>([]);
    const [cargandoSolicitudes, setCargandoSolicitudes] = useState(false);

    const cargarSolicitudes = async () => {
        setCargandoSolicitudes(true);
        try {
            const data = await cargarSolicitudesPendientesEstudiantes();
            setSolicitudes(data);
        } catch (err: any) {
            toast.error(err?.message ?? 'Error al cargar solicitudes de estudiantes.');
        } finally {
            setCargandoSolicitudes(false);
        }
    };

    useEffect(() => {
        void cargarSolicitudes();
    }, []);

    useEffect(() => {
        if (pestanaActiva === 'solicitudes') {
            void cargarSolicitudes();
        }
    }, [pestanaActiva]);

    const handleAprobar = async (id: string, nombreCompleto: string) => {
        try {
            await aprobarEstudianteEnBackend(id);
            toast.success(`Estudiante ${nombreCompleto} aprobado correctamente.`);
            await cargarSolicitudes();
            await recargarDatos();
        } catch (err: any) {
            toast.error(err?.message ?? 'No se pudo aprobar al estudiante.');
        }
    };

    const handleRechazar = async (id: string, nombreCompleto: string) => {
        try {
            await rechazarEstudianteEnBackend(id);
            toast.success(`Solicitud de ${nombreCompleto} rechazada.`);
            await cargarSolicitudes();
            await recargarDatos();
        } catch (err: any) {
            toast.error(err?.message ?? 'No se pudo rechazar al estudiante.');
        }
    };

    const obtenerCarrerasEstudiante = (estudiante: any): string[] => {
        const carrerasEstudiante = estudiante.carreras?.filter(Boolean) ?? [];
        return carrerasEstudiante.length > 0
            ? carrerasEstudiante
            : (estudiante.carrera ? [estudiante.carrera] : []);
    };

    const obtenerCarrerasCompletasEstudiante = (estudiante: any): Carrera[] => {
        const ids = estudiante.asignacionesCarrera
            ?.map((asig: any) => String(asig.carreraId))
            .filter(Boolean) ?? [];
        
        const nombres = estudiante.carreras ?? (estudiante.carrera ? [estudiante.carrera] : []);

        return carreras.filter(c => {
            if (ids.length > 0) {
                return ids.includes(String(c.id));
            }
            return nombres.some((n: string) => n.toLowerCase().trim() === c.nombre.toLowerCase().trim());
        });
    };

    const tieneInventarioAsignado = (carrera: Carrera, idInventario: number) => {
        if (carrera.inventariosIds?.includes(idInventario)) return true;
        if (carrera.inventarios?.some(i => i.id === idInventario)) return true;
        return false;
    };

    const estudiantesFiltradosPorRol = useMemo(() => {
        const usuarioActual = obtenerUsuarioActual();
        const idInventario = usuarioActual?.id_inventario ? Number(usuarioActual.id_inventario) : null;

        return estudiantes.filter((estudiante) => {
            // Check if student has a loan in progress
            const tienePrestamo = prestamos.some((p) => {
                const coincideCarnet = p.carnetEstudiante === estudiante.carnet;
                const esPrestamoEnCurso = p.estado !== 'devuelto' && p.estado !== 'devuelto_fuera_de_fecha_limite' && p.estado !== 'rechazado';
                return coincideCarnet && esPrestamoEnCurso;
            });

            if (tienePrestamo) return true;

            // Check if student has carnet/CU retained
            if (estudiante.carnetRetenido === true) {
                if (!idInventario) return false;
                // Check if they belong to a career assigned to this manager's inventory
                const carrerasEstudiante = obtenerCarrerasCompletasEstudiante(estudiante);
                return carrerasEstudiante.some(carrera => tieneInventarioAsignado(carrera, idInventario));
            }

            return false;
        });
    }, [estudiantes, prestamos, carreras]);

    const estudiantesFiltrados = useMemo(() => {
        const nombreTerm = filtroNombre.toLowerCase().trim();
        const carnetTerm = filtroCarnet.toLowerCase().trim();
        const carreraTerm = filtroCarrera.toLowerCase().trim();
        return estudiantesFiltradosPorRol.filter(e => {
            const carrerasEstudiante = obtenerCarrerasEstudiante(e);
            const coincideNombre = nombreTerm === '' ||
                e.nombre.toLowerCase().includes(nombreTerm) ||
                e.apellido.toLowerCase().includes(nombreTerm);
            const coincideCarnet = carnetTerm === '' ||
                e.carnet.toLowerCase().includes(carnetTerm);
            const coincideCarrera = carreraTerm === '' ||
                carrerasEstudiante.some((c: string) => c.toLowerCase().includes(carreraTerm));
            return coincideNombre && coincideCarnet && coincideCarrera;
        });
    }, [filtroNombre, filtroCarnet, filtroCarrera, estudiantesFiltradosPorRol]);

    const toggleRetencion = async (estudiante: any) => {
        if (!estudiante.id) return;
        const nuevoEstado = !estudiante.carnetRetenido;
        const ok = await confirmar({
            titulo: nuevoEstado ? 'Retener CU/Carnet' : 'Liberar CU/Carnet',
            descripcion: nuevoEstado 
                ? `¿Deseas retener manualmente el carnet de ${estudiante.nombre} ${estudiante.apellido}?`
                : `¿Deseas liberar manualmente la retención del carnet de ${estudiante.nombre} ${estudiante.apellido}?`,
            textoConfirmar: nuevoEstado ? 'Retener' : 'Liberar',
            textoCancelar: 'Cancelar',
            varianteConfirmar: nuevoEstado ? 'destructive' : 'default',
        });
        if (!ok) return;

        try {
            await actualizarRetencionCue(estudiante.id, { carnetRetenidoOverride: nuevoEstado });
            toast.success(nuevoEstado ? 'Carnet retenido manualmente.' : 'Carnet liberado manualmente.');
            await recargarDatos();
        } catch (err: any) {
            toast.error(err?.message ?? 'No se pudo actualizar el estado del CU.');
        }
    };

    const restablecerRetencion = async (estudiante: any) => {
        if (!estudiante.id) return;
        const ok = await confirmar({
            titulo: 'Restablecer cálculo automático',
            descripcion: `¿Deseas volver a calcular automáticamente el estado del carnet de ${estudiante.nombre} ${estudiante.apellido} según sus préstamos activos?`,
            textoConfirmar: 'Restablecer',
            textoCancelar: 'Cancelar',
        });
        if (!ok) return;

        try {
            await actualizarRetencionCue(estudiante.id, { carnetRetenidoOverride: null });
            toast.success('Cálculo automático de retención restablecido.');
            await recargarDatos();
        } catch (err: any) {
            toast.error(err?.message ?? 'No se pudo restablecer el cálculo automático.');
        }
    };

    return (
        <LayoutPagina
            paginaActiva="estudiantes"
            titulo="Estudiantes y Solicitudes"
            subtitulo={cargando ? 'Cargando...' : 'Administración de estudiantes y solicitudes de registro'}
            onNavegar={onNavegar}
            onCerrarSesion={onCerrarSesion}
        >
            <Tabs value={pestanaActiva} onValueChange={setPestanaActiva} className="space-y-4">
                <TabsList className="flex gap-1.5 p-1 rounded-xl bg-slate-100/65 dark:bg-slate-800/40 justify-start h-auto w-fit">
                    <TabsTrigger value="activos" className="gap-2 text-xs font-semibold px-4 py-2 rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950 transition-all">
                        <Users className="h-3.5 w-3.5 text-indigo-500" />
                        Estudiantes ({estudiantesFiltradosPorRol.length})
                    </TabsTrigger>
                    <TabsTrigger value="solicitudes" className="gap-2 text-xs font-semibold px-4 py-2 rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-955 transition-all">
                        <ClipboardList className="h-3.5 w-3.5 text-amber-500" />
                        Solicitudes de Registro ({solicitudes.length})
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="activos" className="space-y-4">
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
                            <Input
                                placeholder="Carrera..."
                                value={filtroCarrera}
                                onChange={(e) => setFiltroCarrera(e.target.value)}
                                className="h-8 max-w-[200px] text-xs bg-white dark:bg-slate-900"
                            />
                            {(filtroNombre || filtroCarnet || filtroCarrera) && (
                                <button
                                    onClick={() => {
                                        setFiltroNombre('');
                                        setFiltroCarnet('');
                                        setFiltroCarrera('');
                                    }}
                                    className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                >
                                    Limpiar
                                </button>
                            )}
                        </div>
                    </div>

                    <TablaEstudiantes
                        estudiantes={estudiantesFiltrados}
                        puedeAdministrar={false}
                        onToggleRetencion={toggleRetencion}
                        onRestablecerRetencion={restablecerRetencion}
                        cargando={cargando}
                    />
                </TabsContent>

                <TabsContent value="solicitudes" className="space-y-4">
                    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                                <ClipboardList className="h-4 w-4 text-amber-500" />
                                Validar datos de solicitudes de acceso
                            </h3>
                            <button
                                onClick={cargarSolicitudes}
                                disabled={cargandoSolicitudes}
                                className="text-xs text-indigo-500 hover:text-indigo-600 font-semibold"
                            >
                                Refrescar
                            </button>
                        </div>

                        {cargandoSolicitudes ? (
                            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                                <div className="animate-spin rounded-full h-6 w-6 border-2 border-indigo-500 border-t-transparent mb-2"></div>
                                <span>Cargando solicitudes pendientes...</span>
                            </div>
                        ) : (
                            <div className="overflow-x-auto rounded-lg border border-slate-150 dark:border-slate-800">
                                <table className="w-full text-xs text-left">
                                    <thead>
                                        <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/50">
                                            <th className="px-4 py-3 font-semibold text-slate-600 dark:text-slate-350">Nombre / Apellido</th>
                                            <th className="px-4 py-3 font-semibold text-slate-600 dark:text-slate-350">C.I.</th>
                                            <th className="px-4 py-3 font-semibold text-slate-600 dark:text-slate-350">Carrera</th>
                                            <th className="px-4 py-3 font-semibold text-slate-600 dark:text-slate-350">C.U.</th>
                                            <th className="px-4 py-3 font-semibold text-slate-600 dark:text-slate-350">Correo</th>
                                            <th className="px-4 py-3 font-semibold text-slate-600 dark:text-slate-350">Fecha Nac.</th>
                                            <th className="px-4 py-3 font-semibold text-slate-600 dark:text-slate-350 text-center">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {solicitudes.map((sol) => (
                                            <tr key={sol.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                                                <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">{sol.nombre} {sol.apellido}</td>
                                                <td className="px-4 py-3 text-slate-700 dark:text-slate-300 font-mono">{sol.carnet}</td>
                                                <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{sol.carrera}</td>
                                                <td className="px-4 py-3 text-slate-700 dark:text-slate-300 font-mono">{sol.cu || '—'}</td>
                                                <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{sol.correo}</td>
                                                <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{sol.fechaNacimiento || '—'}</td>
                                                <td className="px-4 py-3 text-center">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <button
                                                            onClick={() => handleAprobar(sol.id, `${sol.nombre} ${sol.apellido}`)}
                                                            className="inline-flex items-center justify-center gap-1 rounded-md bg-emerald-500 hover:bg-emerald-600 text-white font-medium px-2 py-1 transition-all shadow-sm hover:shadow"
                                                            title="Aprobar registro de estudiante"
                                                        >
                                                            <Check className="h-3.5 w-3.5" />
                                                            <span>Aprobar</span>
                                                        </button>
                                                        <button
                                                            onClick={() => handleRechazar(sol.id, `${sol.nombre} ${sol.apellido}`)}
                                                            className="inline-flex items-center justify-center gap-1 rounded-md border border-red-200 hover:bg-red-50 hover:text-red-600 text-red-500 font-medium px-2 py-1 transition-all dark:border-red-900 dark:hover:bg-red-950/20"
                                                            title="Rechazar solicitud"
                                                        >
                                                            <X className="h-3.5 w-3.5" />
                                                            <span>Rechazar</span>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}

                                        {solicitudes.length === 0 && (
                                            <tr>
                                                <td colSpan={7} className="px-4 py-8 text-center text-slate-400 dark:text-slate-500 italic">
                                                    No hay solicitudes de registro pendientes.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </TabsContent>
            </Tabs>
        </LayoutPagina>
    );
};
