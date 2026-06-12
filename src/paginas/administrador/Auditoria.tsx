import { useState, useEffect, useMemo } from 'react';
import { 
    Shield, Search, Calendar, CheckCircle, Clock, Edit, Trash2, ArrowRight, 
    User, Mail, Info, RefreshCw, AlertTriangle, ChevronRight, FileText,
    ChevronDown, ChevronUp, Eye, X
} from 'lucide-react';
import type { PropsPaginaBase } from '@/tipos/paginas';
import { LayoutPagina } from '@/componentes/layout/layout-pagina';
import { useInventario } from '@/contextos/ContextoInventario';
import { cargarHistorialPrestamoDesdeBackend } from '@/lib/servicio-prestamos';
import type { RegistroHistorialPrestamoApi } from '@/tipos/api';
import type { Prestamo } from '@/tipos/inventario';
import { Input } from '@/componentes/ui/input';
import { Boton } from '@/componentes/ui/button';
import { toast } from 'sonner';

interface PrestamoMapeado extends Prestamo {
    estudianteNombre: string;
    estudianteCarrera: string;
    herramientaNombre: string;
    herramientaCodigo: string;
    herramientaCategoria: string;
}

interface PrestamoGrupoMapeado extends PrestamoMapeado {
    idsPrestamos: string[];
    itemsGrupo: PrestamoMapeado[];
    esGrupal: boolean;
}

export const Auditoria = ({ onNavegar, onCerrarSesion }: PropsPaginaBase) => {
    const { prestamos, estudiantes, herramientas, cargando, recargarDatos } = useInventario();
    
    const [prestamoSeleccionado, setPrestamoSeleccionado] = useState<PrestamoGrupoMapeado | null>(null);
    const [historial, setHistorial] = useState<RegistroHistorialPrestamoApi[]>([]);
    const [cargandoHistorial, setCargandoHistorial] = useState(false);
    
    const [busqueda, setBusqueda] = useState('');
    const [filtroEstado, setFiltroEstado] = useState<string>('todos');
    const [activosVisibles, setActivosVisibles] = useState<Record<number, boolean>>({});

    useEffect(() => {
        if (!prestamoSeleccionado) {
            setHistorial([]);
            setActivosVisibles({});
            return;
        }

        const fetchHistorial = async () => {
            setCargandoHistorial(true);
            setActivosVisibles({});
            try {
                const data = await cargarHistorialPrestamoDesdeBackend(String(prestamoSeleccionado.id));
                setHistorial(data);
            } catch (err: any) {
                console.error(err);
                toast.error(err?.message || 'Error al obtener historial del préstamo');
                setHistorial([]);
            } finally {
                setCargandoHistorial(false);
            }
        };

        void fetchHistorial();
    }, [prestamoSeleccionado]);

    // Resumen de préstamos mapeados y agrupados por canasta
    const prestamosMapeados = useMemo(() => {
        const mapeados = prestamos.map(p => {
            const est = estudiantes.find(e => e.carnet === p.carnetEstudiante);
            const herr = herramientas.find(h => h.id === p.idHerramienta);
            
            return {
                ...p,
                estudianteNombre: est ? `${est.nombre} ${est.apellido}`.trim() : 'Estudiante no registrado',
                estudianteCarrera: est?.carrera || 'Carrera no registrada',
                herramientaNombre: herr ? herr.nombre : `Herramienta ${p.idHerramienta}`,
                herramientaCodigo: herr?.codigoInventario || p.idHerramienta,
                herramientaCategoria: herr?.categoria || 'Sin categoría',
            };
        });

        const gruposMap = new Map<string, typeof mapeados>();
        
        mapeados.forEach(p => {
            const clave = p.grupoCanasta || `IND-${p.id}`;
            const lista = gruposMap.get(clave) || [];
            lista.push(p);
            gruposMap.set(clave, lista);
        });

        return Array.from(gruposMap.entries()).map(([, lista]) => {
            const principal = lista[0];
            const esGrupal = !!principal.grupoCanasta;
            const herramientaNombre = esGrupal 
                ? lista.map(item => item.herramientaNombre).join(', ')
                : principal.herramientaNombre;
                
            return {
                ...principal,
                id: principal.id,
                idsPrestamos: lista.map(item => item.id),
                herramientaNombre,
                itemsGrupo: lista,
                esGrupal,
            };
        });
    }, [prestamos, estudiantes, herramientas]);

    const prestamosFiltrados = useMemo(() => {
        return prestamosMapeados.filter(p => {
            const coincideEstado = filtroEstado === 'todos' || p.estado === filtroEstado;
            
            const term = busqueda.toLowerCase().trim();
            if (!term) return coincideEstado;

            const coincideTerm = 
                (p.codigo || '').toLowerCase().includes(term) ||
                p.carnetEstudiante.toLowerCase().includes(term) ||
                p.estudianteNombre.toLowerCase().includes(term) ||
                p.itemsGrupo.some(item => 
                    item.herramientaNombre.toLowerCase().includes(term) ||
                    item.herramientaCodigo.toLowerCase().includes(term)
                );

            return coincideEstado && coincideTerm;
        });
    }, [prestamosMapeados, busqueda, filtroEstado]);

    const normalizarAccion = (accion: string) => {
        switch (accion) {
            case 'creacion_solicitud': return 'Préstamo solicitado';
            case 'devolucion': return 'Item devuelto';
            case 'extension': return 'Extensión de plazo';
            case 'modificacion_detalles': return 'Cambio en detalles';
            case 'eliminacion': return 'Préstamo eliminado (soft delete)';
            case 'sistema_vencimiento': return 'Marcado como vencido (sistema)';
            case 'despacho': return 'Herramientas despachadas';
            case 'no_despachado': return 'No despachado (desmarcado)';
            default: return accion.replace(/_/g, ' ');
        }
    };

    const getAccionIcon = (accion: string) => {
        switch (accion) {
            case 'creacion_solicitud': 
                return <Calendar className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />;
            case 'devolucion': 
                return <CheckCircle className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />;
            case 'extension': 
                return <Clock className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />;
            case 'modificacion_detalles': 
                return <Edit className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />;
            case 'eliminacion': 
                return <Trash2 className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400" />;
            case 'sistema_vencimiento':
                return <AlertTriangle className="h-3.5 w-3.5 text-yellow-600 dark:text-yellow-400" />;
            case 'no_despachado':
                return <X className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />;
            default: 
                return <Info className="h-3.5 w-3.5 text-slate-600 dark:text-slate-400" />;
        }
    };

    const normalizarNombrePropiedad = (key: string) => {
        switch (key) {
            case 'estado': return 'Estado';
            case 'fechaDevolucion': return 'Fecha límite';
            case 'fechaPrestamo': return 'Fecha de préstamo';
            case 'observaciones': return 'Observaciones';
            case 'idHerramienta': return 'Código de activo';
            case 'idDocente': return 'Docente autorizador';
            case 'carnetEstudiante': return 'CI Estudiante';
            case 'deletedAt': return 'Fecha de eliminación';
            default: return key;
        }
    };

    const formatValorPropiedad = (key: string, val: any) => {
        if (val === null || val === undefined || val === '') {
            return <span className="text-slate-400 dark:text-slate-500 italic text-[11px]">vacío</span>;
        }
        if (key === 'estado') {
            const est = String(val);
            let color = 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
            let label = est;
            if (est === 'pendiente') {
                color = 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300';
                label = 'Pendiente';
            } else if (est === 'solicitado') {
                color = 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300';
                label = 'Solicitado';
            } else if (est === 'aceptado') {
                color = 'bg-purple-100 text-purple-800 dark:bg-purple-950/40 dark:text-purple-300';
                label = 'Aceptado';
            } else if (est === 'despachado' || est === 'activo') {
                color = 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300';
                label = est === 'activo' ? 'Activo' : 'Despachado';
            } else if (est === 'disponible') {
                color = 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300';
                label = 'Disponible';
            } else if (est === 'devuelto') {
                color = 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300';
                label = 'Devuelto';
            } else if (est === 'vencido') {
                color = 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300';
                label = 'Vencido';
            } else if (est === 'rechazado') {
                color = 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300';
                label = 'Rechazado';
            } else if (est === 'devuelto_fuera_de_fecha_limite') {
                color = 'bg-orange-100 text-orange-800 dark:bg-orange-950/40 dark:text-orange-300';
                label = 'Devuelto fuera de plazo';
            } else if (est === 'no_despachado') {
                color = 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700';
                label = 'No despachado';
            }
            return <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-semibold ${color}`}>{label}</span>;
        }
        if (key.startsWith('fecha') || key === 'deletedAt') {
            try {
                const date = new Date(val);
                if (!isNaN(date.getTime())) {
                    return date.toLocaleDateString('es-BO', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    });
                }
            } catch (_) {}
        }
        return String(val);
    };

    const renderModificaciones = (detalles: any) => {
        if (!detalles) return null;
        const antes = detalles.antes || {};
        const despues = detalles.despues || {};
        
        const todasLasLlaves = Array.from(new Set([
            ...Object.keys(antes),
            ...Object.keys(despues)
        ])).filter(key => key !== 'id' && key !== 'idItem' && key !== 'idActivo');

        if (todasLasLlaves.length === 0) return null;

        const esCreacion = Object.keys(antes).length === 0;

        return (
            <div className="mt-2 rounded-lg border border-slate-100 bg-slate-50/50 p-2.5 dark:border-slate-800 dark:bg-slate-900/30">
                <h4 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">
                    {esCreacion ? 'Datos Registrados' : 'Valores Modificados'}
                </h4>
                <div className="space-y-1">
                    {todasLasLlaves.map(key => {
                        const valAntes = antes[key];
                        const valDespues = despues[key];

                        if (!esCreacion && JSON.stringify(valAntes) === JSON.stringify(valDespues)) return null;

                        return (
                            <div key={key} className="flex flex-col sm:flex-row sm:items-center justify-between py-1 border-b border-slate-100/50 dark:border-slate-800/20 last:border-b-0 text-xs">
                                <span className="font-medium text-slate-500 dark:text-slate-400">
                                    {normalizarNombrePropiedad(key)}:
                                </span>
                                <div className="flex items-center gap-1.5 mt-0.5 sm:mt-0 font-medium">
                                    {esCreacion ? (
                                        <span className="text-slate-700 dark:text-slate-300">
                                            {formatValorPropiedad(key, valDespues)}
                                        </span>
                                    ) : (
                                        <>
                                            <span className="text-slate-400 line-through dark:text-slate-500">
                                                {formatValorPropiedad(key, valAntes)}
                                            </span>
                                            <ArrowRight className="h-3 w-3 text-slate-400" />
                                            <span className="text-slate-700 dark:text-slate-200 font-semibold">
                                                {formatValorPropiedad(key, valDespues)}
                                            </span>
                                        </>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    const formatRol = (rol?: string | null) => {
        if (!rol) return '';
        switch (rol) {
            case 'administrador': return 'Administrador';
            case 'encargado_inventario': return 'Encargado';
            case 'docente': return 'Docente';
            case 'estudiante': return 'Estudiante';
            case 'sistema': return 'Sistema';
            default: return rol;
        }
    };

    const renderRolBadge = (rol?: string | null) => {
        if (!rol) return null;
        let style = 'bg-slate-100 text-slate-700 dark:bg-slate-850 dark:text-slate-300';
        if (rol === 'administrador') {
            style = 'bg-red-50 text-red-700 border border-red-200/50 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/30';
        } else if (rol === 'encargado_inventario') {
            style = 'bg-blue-50 text-blue-700 border border-blue-200/50 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/30';
        } else if (rol === 'docente') {
            style = 'bg-purple-50 text-purple-700 border border-purple-200/50 dark:bg-purple-950/20 dark:text-purple-400 dark:border-purple-900/30';
        } else if (rol === 'estudiante') {
            style = 'bg-emerald-50 text-emerald-700 border border-emerald-200/50 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30';
        }
        return (
            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${style}`}>
                {formatRol(rol)}
            </span>
        );
    };

    const renderBadgeEstado = (estado: string) => {
        let cls = 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
        let txt = estado;
        
        if (estado === 'pendiente') {
            cls = 'bg-amber-50 text-amber-700 border border-amber-200/60 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900/40';
            txt = 'Pendiente';
        } else if (estado === 'solicitado') {
            cls = 'bg-amber-50 text-amber-700 border border-amber-200/60 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900/40';
            txt = 'Solicitado';
        } else if (estado === 'aceptado') {
            cls = 'bg-purple-50 text-purple-700 border border-purple-200/60 dark:bg-purple-950/30 dark:text-purple-400 dark:border-purple-900/40';
            txt = 'Aceptado';
        } else if (estado === 'despachado' || estado === 'activo') {
            cls = 'bg-blue-50 text-blue-700 border border-blue-200/60 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900/40';
            txt = estado === 'activo' ? 'Activo' : 'Despachado';
        } else if (estado === 'disponible') {
            cls = 'bg-emerald-50 text-emerald-700 border border-emerald-200/60 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/40';
            txt = 'Disponible';
        } else if (estado === 'devuelto') {
            cls = 'bg-emerald-50 text-emerald-700 border border-emerald-200/60 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/40';
            txt = 'Devuelto';
        } else if (estado === 'vencido') {
            cls = 'bg-rose-50 text-rose-700 border border-rose-200/60 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-900/40';
            txt = 'Vencido';
        } else if (estado === 'rechazado') {
            cls = 'bg-rose-50 text-rose-700 border border-rose-200/60 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-900/40';
            txt = 'Rechazado';
        } else if (estado === 'devuelto_fuera_de_fecha_limite') {
            cls = 'bg-orange-50 text-orange-700 border border-orange-200/60 dark:bg-orange-950/30 dark:text-orange-400 dark:border-orange-900/40';
            txt = 'Devuelto fuera de plazo';
        } else if (estado === 'no_despachado') {
            cls = 'bg-slate-50 text-slate-500 border border-slate-200 dark:bg-slate-900/30 dark:text-slate-400 dark:border-slate-800';
            txt = 'No despachado';
        }

        return (
            <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold ${cls}`}>
                {txt}
            </span>
        );
    };

    const handleRecargar = async () => {
        try {
            await recargarDatos();
            toast.success('Datos actualizados correctamente.');
        } catch (_) {
            toast.error('No se pudieron actualizar los datos.');
        }
    };

    return (
        <LayoutPagina
            paginaActiva="auditoria"
            titulo="Historial de Auditoría"
            subtitulo="Trazabilidad y registro de cambios en préstamos"
            onNavegar={onNavegar}
            onCerrarSesion={onCerrarSesion}
        >
            <div className="flex flex-col lg:grid lg:grid-cols-12 gap-6 h-[calc(100vh-13rem)] min-h-[500px]">
                <div className="lg:col-span-5 flex flex-col h-full bg-white border border-slate-200 dark:bg-slate-900 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-3">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-bold text-slate-850 dark:text-slate-200 flex items-center gap-2">
                                <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                Lista de Préstamos
                            </h3>
                            <Boton 
                                variant="outline" 
                                size="sm" 
                                onClick={handleRecargar} 
                                disabled={cargando}
                                className="h-8 px-2 text-xs"
                            >
                                <RefreshCw className={`h-3.5 w-3.5 mr-1 ${cargando ? 'animate-spin' : ''}`} />
                                Actualizar
                            </Boton>
                        </div>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <Input
                                placeholder="Buscar por código, CI, estudiante..."
                                value={busqueda}
                                onChange={(e) => setBusqueda(e.target.value)}
                                className="pl-9 h-9 text-xs"
                            />
                        </div>
                        <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
                            {[
                                { key: 'todos', label: 'Todos' },
                                { key: 'pendiente', label: 'Pendientes' },
                                { key: 'activo', label: 'Activos' },
                                { key: 'devuelto', label: 'Devueltos' },
                                { key: 'vencido', label: 'Vencidos' }
                            ].map((tab) => (
                                <button
                                    key={tab.key}
                                    onClick={() => setFiltroEstado(tab.key)}
                                    className={`px-2.5 py-1 text-[11px] font-semibold rounded-full border transition-all shrink-0 ${
                                        filtroEstado === tab.key
                                            ? 'bg-blue-600 text-white border-blue-600 dark:bg-blue-500 dark:border-blue-500'
                                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 dark:bg-slate-950 dark:text-slate-400 dark:border-slate-800 dark:hover:bg-slate-900/50'
                                    }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/40">
                        {cargando ? (
                            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                                <RefreshCw className="h-8 w-8 animate-spin mb-2" />
                                <span className="text-xs">Cargando préstamos...</span>
                            </div>
                        ) : prestamosFiltrados.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-slate-400 px-4 text-center">
                                <Info className="h-8 w-8 text-slate-300 dark:text-slate-700 mb-2" />
                                <span className="text-xs font-medium">No se encontraron préstamos</span>
                                <span className="text-[11px] mt-1 text-slate-500">Intenta cambiar los filtros o el término de búsqueda.</span>
                            </div>
                        ) : (
                            prestamosFiltrados.map((p) => {
                                const seleccionado = prestamoSeleccionado?.id === p.id;
                                return (
                                    <div
                                        key={p.id}
                                        onClick={() => setPrestamoSeleccionado(p)}
                                        className={`p-3.5 cursor-pointer transition-all flex items-start justify-between gap-3 ${
                                            seleccionado
                                                ? 'bg-blue-50/60 dark:bg-blue-950/20 border-l-4 border-blue-600 dark:border-blue-500'
                                                : 'hover:bg-slate-50/50 dark:hover:bg-slate-800/30 border-l-4 border-transparent'
                                        }`}
                                    >
                                        <div className="space-y-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="font-mono text-xs font-bold text-slate-900 dark:text-slate-100">
                                                    {p.codigo || `PR-${p.id}`}
                                                </span>
                                                {p.grupoCanasta && (
                                                    <span className="inline-flex items-center rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                                        Grupal
                                                    </span>
                                                )}
                                            </div>
                                            <div className="text-xs font-semibold text-slate-800 dark:text-slate-300 truncate">
                                                {p.estudianteNombre}
                                            </div>
                                            <div className="text-[11px] text-slate-550 dark:text-slate-400 truncate font-semibold">
                                                {p.esGrupal ? `[${p.itemsGrupo.length} activos] ${p.herramientaNombre}` : p.herramientaNombre}
                                            </div>
                                            <div className="text-[10px] text-slate-400 dark:text-slate-500">
                                                {new Date(p.fechaPrestamo).toLocaleDateString('es-BO', {
                                                    day: '2-digit', month: '2-digit', year: 'numeric'
                                                })}
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-2 shrink-0">
                                            {renderBadgeEstado(p.estado)}
                                            <ChevronRight className={`h-4 w-4 text-slate-400 dark:text-slate-600 transition-transform ${seleccionado ? 'translate-x-1' : ''}`} />
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
                <div className="lg:col-span-7 flex flex-col h-full bg-white border border-slate-200 dark:bg-slate-900 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
                    {!prestamoSeleccionado ? (
                        <div className="flex flex-col items-center justify-center flex-1 p-8 text-center bg-slate-50/20 dark:bg-slate-900/20">
                            <div className="rounded-full bg-blue-50/50 p-4 dark:bg-blue-950/20 mb-3 border border-blue-100/50 dark:border-blue-900/30">
                                <Shield className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                            </div>
                            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                                Vista de Auditoría
                            </h3>
                            <p className="max-w-xs mt-1 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                                Selecciona un préstamo de la lista izquierda para visualizar su línea de tiempo de cambios, encargados involucrados y datos modificados.
                            </p>
                        </div>
                    ) : (
                        <div className="flex flex-col h-full overflow-hidden">
                            <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-mono text-sm font-bold text-slate-900 dark:text-slate-100">
                                                Código: {prestamoSeleccionado.codigo || `PR-${prestamoSeleccionado.id}`}
                                            </span>
                                            {renderBadgeEstado(prestamoSeleccionado.estado)}
                                        </div>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                            Autorizado por: <span className="font-semibold text-slate-700 dark:text-slate-300">{prestamoSeleccionado.docente || 'Sin docente'}</span>
                                        </p>
                                    </div>
                                    <button 
                                        onClick={() => setPrestamoSeleccionado(null)}
                                        className="text-xs text-slate-550 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 font-semibold"
                                    >
                                        Cerrar Vista
                                    </button>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3.5">
                                    <div className="rounded-xl border border-slate-100 bg-white p-3 dark:border-slate-800/80 dark:bg-slate-950 shadow-2xs">
                                        <h4 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Estudiante</h4>
                                        <div className="mt-1.5 flex items-center gap-2">
                                            <div className="h-7 w-7 rounded-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center shrink-0">
                                                <User className="h-3.5 w-3.5 text-slate-600 dark:text-slate-400" />
                                            </div>
                                            <div className="min-w-0">
                                                <div className="text-xs font-semibold text-slate-850 dark:text-slate-350 truncate">
                                                    {prestamoSeleccionado.estudianteNombre}
                                                </div>
                                                <div className="text-[10px] text-slate-500 dark:text-slate-400">
                                                    CI: {prestamoSeleccionado.carnetEstudiante} • {prestamoSeleccionado.estudianteCarrera}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="rounded-xl border border-slate-100 bg-white p-3 dark:border-slate-800/80 dark:bg-slate-950 shadow-2xs max-h-[120px] overflow-y-auto scrollbar-thin">
                                        <h4 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                                            {prestamoSeleccionado.esGrupal ? 'Activos Fijos (Canasta)' : 'Activo Fijo'}
                                        </h4>
                                        <div className="mt-1.5 space-y-2">
                                            {prestamoSeleccionado.itemsGrupo.map((item) => (
                                                <div key={item.id} className="flex items-center gap-2">
                                                    <div className="h-6 w-6 rounded-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center shrink-0">
                                                        <Shield className="h-3 w-3 text-slate-600 dark:text-slate-400" />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="text-xs font-semibold text-slate-850 dark:text-slate-350 truncate">
                                                            {item.herramientaNombre}
                                                        </div>
                                                        <div className="text-[10px] text-slate-500 dark:text-slate-400">
                                                            Cat: {item.herramientaCategoria} • Cód: {item.herramientaCodigo}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="flex-1 overflow-y-auto p-4 bg-slate-50/20 dark:bg-slate-950/10">
                                <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">
                                    Línea de Tiempo de Cambios
                                </h3>

                                {cargandoHistorial ? (
                                    <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                                        <RefreshCw className="h-6 w-6 animate-spin mb-2" />
                                        <span className="text-xs">Cargando trazabilidad...</span>
                                    </div>
                                ) : historial.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-8 text-slate-400">
                                        <Info className="h-6 w-6 text-slate-300 mb-1" />
                                        <span className="text-xs">No se ha registrado historial para este préstamo.</span>
                                    </div>
                                ) : (
                                    <div className="relative before:absolute before:top-2 before:bottom-2 before:left-3 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800 space-y-6">
                                        {historial.map((log) => (
                                            <div key={log.id} className="relative pl-8 group">
                                                <div className="absolute left-0 top-0.5 flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-sm z-10 transition-transform group-hover:scale-105">
                                                    {getAccionIcon(log.accion)}
                                                </div>
                                                <div className="space-y-1">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                                            {normalizarAccion(log.accion)}
                                                        </span>
                                                        <span className="text-[10px] text-slate-400 dark:text-slate-500">
                                                            {new Date(log.fecha).toLocaleDateString('es-BO', {
                                                                day: '2-digit', month: 'short', year: 'numeric',
                                                                hour: '2-digit', minute: '2-digit', second: '2-digit'
                                                            })}
                                                        </span>
                                                    </div>
                                                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-slate-500 dark:text-slate-400">
                                                        <span>Por: <span className="font-semibold text-slate-700 dark:text-slate-300">{log.nombreUsuario || 'Sistema'}</span></span>
                                                        {renderRolBadge(log.rolUsuario)}
                                                        {log.correoUsuario && log.correoUsuario !== 'sistema@sgi.local' && (
                                                            <span className="inline-flex items-center gap-0.5 text-slate-400 dark:text-slate-500">
                                                                • <Mail className="h-2.5 w-2.5 ml-0.5" />
                                                                {log.correoUsuario}
                                                            </span>
                                                        )}
                                                    </div>
                                                    {log.observaciones && (
                                                        <p className="text-[11px] text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/45 p-2 rounded border border-slate-100/50 dark:border-slate-800/20 mt-1 italic">
                                                            "{log.observaciones}"
                                                        </p>
                                                    )}
                                                    {renderModificaciones(log.detalles)}
                                                    {log.estadoActivosCanasta && log.estadoActivosCanasta.length > 1 && (
                                                        <div className="mt-2 text-left">
                                                            <button
                                                                onClick={() => setActivosVisibles(prev => ({ ...prev, [log.id]: !prev[log.id] }))}
                                                                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-bold text-blue-600 hover:text-blue-700 bg-blue-50/50 hover:bg-blue-50 border border-blue-150 rounded-lg dark:text-blue-400 dark:hover:text-blue-300 dark:bg-blue-950/20 dark:hover:bg-blue-950/40 dark:border-blue-900/30 transition-all shadow-2xs cursor-pointer"
                                                            >
                                                                <Eye className="h-3 w-3" />
                                                                {activosVisibles[log.id] ? 'Ocultar estado de activos' : `Ver estado de activos (${log.estadoActivosCanasta.length})`}
                                                                {activosVisibles[log.id] ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                                                            </button>
                                                            
                                                            {activosVisibles[log.id] && (
                                                                <div className="mt-2 rounded-xl border border-slate-200/60 bg-slate-50/50 p-3 dark:border-slate-800/80 dark:bg-slate-950/80 shadow-xs space-y-2 max-w-md animate-in fade-in duration-200">
                                                                    <div className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                                                                        Activos en esta etapa
                                                                    </div>
                                                                    <div className="divide-y divide-slate-200/40 dark:divide-slate-800/50">
                                                                        {log.estadoActivosCanasta.map((activo) => (
                                                                            <div key={activo.idHerramienta} className="flex items-center justify-between py-1.5 first:pt-0 last:pb-0 gap-3">
                                                                                <div className="min-w-0">
                                                                                    <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                                                                                        {activo.nombre}
                                                                                    </div>
                                                                                    <div className="text-[10px] text-slate-400 dark:text-slate-500">
                                                                                        Cód: {activo.codigo}
                                                                                    </div>
                                                                                </div>
                                                                                <div className="shrink-0">
                                                                                    {renderBadgeEstado(activo.estado)}
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </LayoutPagina>
    );
};
