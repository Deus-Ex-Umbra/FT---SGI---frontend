import { useEffect, useState } from 'react';
import { AlertCircle, ChevronLeft, ChevronRight, LogOut, UserCircle2, Wrench } from 'lucide-react';
import { ModalBase } from '@/componentes/inventario/modal-base';
import { Boton } from '@/componentes/ui/button';
import type { MenuLateralNavItem, MenuLateralProps } from '@/componentes/menu-lateral';
import { obtenerUsuarioActual } from '@/lib/servicio-autenticacion';

interface Props extends MenuLateralProps {
    elementosNav: MenuLateralNavItem[];
    etiquetaRol: string;
}

export const MenuLateralBase = ({
    paginaActiva,
    onNavegar,
    onCerrarSesion,
    elementosNav,
    etiquetaRol,
}: Props) => {
    const [colapsado, setColapsado] = useState<boolean>(() => localStorage.getItem('sgi-menu-colapsado') === 'true');
    const [mostrarConfirmacionCerrarSesion, setMostrarConfirmacionCerrarSesion] = useState(false);
    const nombreUsuario = obtenerUsuarioActual()?.nombre_usuario || 'Usuario';

    useEffect(() => {
        localStorage.setItem('sgi-menu-colapsado', String(colapsado));
    }, [colapsado]);

    return (
        <>
            <aside className={`relative flex h-full flex-shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-all duration-200 ${colapsado ? 'w-14' : 'w-56'}`}>
                <div className={`flex h-14 items-center justify-between border-b border-sidebar-border ${colapsado ? 'px-2' : 'px-3'}`}>
                    <div className={`flex min-w-0 items-center ${colapsado ? 'justify-center' : 'gap-2'}`}>
                        <Wrench className="h-5 w-5 flex-shrink-0 text-sidebar-ring" />
                        {!colapsado && (
                            <div className="min-w-0">
                                <p className="truncate text-sm font-bold leading-tight tracking-tight">SGI · Activos</p>
                                <p className="truncate text-xs leading-tight text-sidebar-foreground/60">Préstamos y material</p>
                            </div>
                        )}
                    </div>

                    <Boton
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => setColapsado((v) => !v)}
                        title={colapsado ? 'Expandir menú' : 'Colapsar menú'}
                        className="h-8 w-8 text-sidebar-foreground/70 hover:bg-sidebar-accent"
                    >
                        {colapsado ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                    </Boton>
                </div>

                <nav className="flex-1 overflow-y-auto px-2 py-3">
                    {elementosNav.map(({ id, icono: Icono, etiqueta }) => (
                        <button
                            key={id}
                            onClick={() => onNavegar(id)}
                            title={colapsado ? etiqueta : undefined}
                            className={`mb-0.5 flex w-full items-center rounded-md px-2 py-2 text-sm font-medium transition-colors ${colapsado ? 'justify-center' : 'gap-3 px-3'} ${paginaActiva === id
                                ? 'bg-sidebar-accent text-sidebar-ring'
                                : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                                }`}
                        >
                            <Icono className="h-4 w-4 flex-shrink-0" />
                            {!colapsado && <span className="truncate text-sm">{etiqueta}</span>}
                        </button>
                    ))}
                </nav>

                <div className="border-t border-sidebar-border px-3 py-4">
                    <div className={`flex items-center gap-3 ${colapsado ? 'justify-center px-0' : 'px-1'}`}>
                        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-sidebar-accent text-sidebar-ring">
                            <UserCircle2 className="h-5 w-5" />
                        </div>
                        {!colapsado && (
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-bold">{nombreUsuario}</p>
                                <p className="truncate text-[10px] uppercase tracking-wider font-semibold text-sidebar-foreground/60">{etiquetaRol}</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="border-t border-sidebar-border px-2 py-3">
                    <button
                        onClick={() => setMostrarConfirmacionCerrarSesion(true)}
                        title={colapsado ? 'Cerrar sesión' : undefined}
                        className={`flex w-full items-center rounded-md px-2 py-2 text-sm font-medium text-sidebar-foreground/70 transition-colors hover:bg-red-500/10 hover:text-red-500 ${colapsado ? 'justify-center' : 'gap-3 px-3'}`}
                    >
                        <LogOut className="h-4 w-4 flex-shrink-0" />
                        {!colapsado && <span>Cerrar sesión</span>}
                    </button>
                </div>
            </aside>

            {mostrarConfirmacionCerrarSesion && (
                <ModalBase titulo="Cerrar sesión" onCerrar={() => setMostrarConfirmacionCerrarSesion(false)} ancho="max-w-sm">
                    <div className="flex flex-col items-center justify-center space-y-4 py-2 text-center">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                            <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
                        </div>
                        <p className="pb-2 text-sm font-medium text-slate-700 dark:text-slate-200">¿Seguro que quieres cerrar sesión?</p>
                        <div className="flex w-full gap-3 pt-2">
                            <button
                                type="button"
                                onClick={() => setMostrarConfirmacionCerrarSesion(false)}
                                className="flex-1 h-9 rounded-md border border-slate-200 px-4 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
                            >
                                Cancelar
                            </button>
                            <Boton type="button" onClick={onCerrarSesion} variant="destructive" className="flex-1 h-9 px-5 text-sm">
                                Cerrar
                            </Boton>
                        </div>
                    </div>
                </ModalBase>
            )}
        </>
    );
};
