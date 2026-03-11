import { useState, useEffect } from 'react';
import {
    Wrench, Package, ClipboardList, GraduationCap, Users,
    LayoutDashboard, Settings, LogOut, ChevronLeft, ChevronRight, AlertCircle,
    UserCircle2
} from 'lucide-react';
import { ModalBase } from './ModalBase';
import { Boton } from '../ui/button';

export type PaginaApp = 'login' | 'resumen' | 'activos' | 'prestamos' | 'estudiantes' | 'docentes' | 'material' | 'configuracion';

interface ElementoNav {
    id: PaginaApp;
    icono: React.ElementType;
    etiqueta: string;
}

interface Props {
    paginaActiva: PaginaApp;
    onNavegar: (pagina: PaginaApp) => void;
    onCerrarSesion: () => void;
}

const elementosNav: ElementoNav[] = [
    { id: 'resumen', icono: LayoutDashboard, etiqueta: 'Resumen' },
    { id: 'activos', icono: Wrench, etiqueta: 'Activos Fijos' },
    { id: 'material', icono: Package, etiqueta: 'Material fungible' },
    { id: 'prestamos', icono: ClipboardList, etiqueta: 'Préstamos' },
    { id: 'estudiantes', icono: GraduationCap, etiqueta: 'Estudiantes' },
    { id: 'docentes', icono: Users, etiqueta: 'Docentes' },
    { id: 'configuracion', icono: Settings, etiqueta: 'Configuración' },
];

export const MenuLateral = ({ paginaActiva, onNavegar, onCerrarSesion }: Props) => {
    const [colapsado, setColapsado] = useState<boolean>(
        () => localStorage.getItem('sgi-menu-colapsado') === 'true'
    );
    const [mostrarConfirmacionCerrarSesion, setMostrarConfirmacionCerrarSesion] = useState(false);
    const [usuario, setUsuario] = useState<{ nombre_usuario: string, rol: string } | null>(null);

    useEffect(() => {
        const usuarioGuardado = localStorage.getItem('usuario');
        if (usuarioGuardado) {
            try {
                setUsuario(JSON.parse(usuarioGuardado));
            } catch (e) {
                console.error("Error al parsear usuario", e);
            }
        }
    }, []);

    useEffect(() => {
        localStorage.setItem('sgi-menu-colapsado', String(colapsado));
    }, [colapsado]);

    return (
        <aside className={`relative flex h-full flex-shrink-0 flex-col border-r border-slate-200 bg-white transition-all duration-200 dark:border-slate-800 dark:bg-slate-900 ${colapsado ? 'w-14' : 'w-56'}`}>
            <div className={`flex h-14 items-center border-b border-slate-200 dark:border-slate-800 ${colapsado ? 'justify-center px-2' : 'gap-2 px-4'}`}>
                <Wrench className="h-5 w-5 flex-shrink-0 text-blue-600" />
                {!colapsado && (
                    <div className="min-w-0">
                        <p className="truncate text-xs font-bold tracking-tight text-slate-800 dark:text-slate-100">SGI · Activos</p>
                        <p className="truncate text-[10px] text-slate-400">Préstamos y material</p>
                    </div>
                )}
            </div>

            <nav className="flex-1 overflow-y-auto px-2 py-3">
                {elementosNav.map(({ id, icono: Icono, etiqueta }) => (
                    <button
                        key={id}
                        onClick={() => onNavegar(id)}
                        title={colapsado ? etiqueta : undefined}
                        className={`mb-0.5 flex w-full items-center rounded-md px-2 py-2 text-sm font-medium transition-colors ${colapsado ? 'justify-center' : 'gap-3 px-3'} ${paginaActiva === id
                            ? 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-400'
                            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100'
                            }`}
                    >
                        <Icono className="h-4 w-4 flex-shrink-0" />
                        {!colapsado && <span className="truncate text-sm">{etiqueta}</span>}
                    </button>
                ))}
            </nav>

            <div className="border-t border-slate-200 px-3 py-4 dark:border-slate-800">
                <div className={`flex items-center gap-3 ${colapsado ? 'justify-center px-0' : 'px-1'}`}>
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                        <UserCircle2 className="h-5 w-5" />
                    </div>
                    {!colapsado && (
                        <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-bold text-slate-700 dark:text-slate-200">
                                {usuario?.nombre_usuario || 'Usuario'}
                            </p>
                            <p className="truncate text-[10px] uppercase tracking-wider font-semibold text-slate-400">
                                {usuario?.rol || 'Director'}
                            </p>
                        </div>
                    )}
                </div>
            </div>

            <div className="border-t border-slate-200 px-2 py-3 dark:border-slate-800 space-y-1">
                <button
                    onClick={() => setMostrarConfirmacionCerrarSesion(true)}
                    title={colapsado ? 'Cerrar sesión' : undefined}
                    className={`flex w-full items-center rounded-md px-2 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-red-50 hover:text-red-600 dark:text-slate-400 dark:hover:bg-red-950 dark:hover:text-red-400 ${colapsado ? 'justify-center' : 'gap-3 px-3'}`}
                >
                    <LogOut className="h-4 w-4 flex-shrink-0" />
                    {!colapsado && <span>Cerrar sesión</span>}
                </button>

                <button
                    onClick={() => setColapsado(prev => !prev)}
                    className={`flex w-full items-center rounded-md px-2 py-2 text-xs font-medium text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200 ${colapsado ? 'justify-center' : 'gap-3 px-3'}`}
                >
                    {colapsado
                        ? <ChevronRight className="h-4 w-4 flex-shrink-0" />
                        : (<><ChevronLeft className="h-4 w-4 flex-shrink-0" /><span>Colapsar menú</span></>)
                    }
                </button>
            </div>

            {mostrarConfirmacionCerrarSesion && (
                <ModalBase titulo="Cerrar sesión" onCerrar={() => setMostrarConfirmacionCerrarSesion(false)} ancho="max-w-sm">
                    <div className="flex flex-col items-center justify-center space-y-4 py-2 text-center">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                            <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
                        </div>
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-200 pb-2">
                            ¿Seguro que quieres cerrar sesion?
                        </p>
                        <div className="flex w-full gap-3 pt-2">
                            <button
                                type="button"
                                onClick={() => setMostrarConfirmacionCerrarSesion(false)}
                                className="flex-1 h-9 rounded-md border border-slate-200 px-4 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
                            >
                                Cancelar
                            </button>
                            <Boton
                                type="button"
                                onClick={onCerrarSesion}
                                variant="destructive"
                                className="flex-1 h-9 px-5 text-sm"
                            >
                                Cerrar
                            </Boton>
                        </div>
                    </div>
                </ModalBase>
            )}
        </aside>
    );
};
