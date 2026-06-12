import { useEffect, useState } from 'react';
import { AlertCircle, ChevronLeft, ChevronRight, LogOut } from 'lucide-react';
import { ModalBase } from '@/componentes/paginas/inventario/modal-base';
import { Boton } from '@/componentes/ui/button';
import type { MenuLateralNavItem, MenuLateralProps } from '@/componentes/menu-lateral';
import { obtenerUsuarioActual } from '@/lib/servicio-autenticacion';

const LogoSGI = ({ className }: { className?: string }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 36 36"
        fill="none"
        className={className}
        aria-hidden="true"
    >
        <rect width="36" height="36" rx="9" fill="currentColor" fillOpacity="0.15" />
        <rect x="9" y="11" width="18" height="20" rx="2.5" fill="currentColor" fillOpacity="0.2" stroke="currentColor" strokeWidth="1.6" />
        <rect x="14" y="8.5" width="8" height="4" rx="2" fill="currentColor" stroke="currentColor" strokeWidth="1.4" />
        <polyline points="13.5,20 16.5,23 22.5,16.5" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" />
        <line x1="13.5" y1="27" x2="22.5" y2="27" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.45" />
    </svg>
);

const AvatarIniciales = ({ correo, colapsado }: { correo: string; colapsado: boolean }) => {
    const iniciales = correo
        .split('@')[0]
        .split(/[._-]/)
        .slice(0, 2)
        .map((p) => p[0]?.toUpperCase() ?? '')
        .join('');

    return (
        <div
            className={`flex flex-shrink-0 items-center justify-center rounded-full bg-sidebar-primary text-sidebar-primary-foreground font-bold tracking-wide ring-2 ring-sidebar-ring/25 transition-all duration-200 select-none ${colapsado ? 'h-8 w-8 text-[11px]' : 'h-9 w-9 text-[13px]'
                }`}
            title={correo}
        >
            {iniciales || '?'}
        </div>
    );
};

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
    const [colapsado, setColapsado] = useState<boolean>(
        () => localStorage.getItem('sgi-menu-colapsado') === 'true',
    );
    const [mostrarConfirmacionCerrarSesion, setMostrarConfirmacionCerrarSesion] = useState(false);
    const [, setRenderNav] = useState(0);
    const nombreUsuario = obtenerUsuarioActual()?.correo || 'Usuario';

    useEffect(() => {
        localStorage.setItem('sgi-menu-colapsado', String(colapsado));
    }, [colapsado]);

    return (
        <>
            <aside
                className={`relative flex h-full flex-shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-[width] duration-200 ease-in-out ${colapsado ? 'w-[3.75rem]' : 'w-60'
                    }`}
            >
                <div
                    className={`flex h-[4.25rem] items-center border-b border-sidebar-border ${colapsado ? 'justify-center px-2' : 'justify-between px-3.5'
                        }`}
                >
                    <div
                        className={`flex min-w-0 items-center ${colapsado ? 'justify-center' : 'gap-3'
                            }`}
                    >
                        <LogoSGI
                            className={`flex-shrink-0 text-sidebar-ring transition-all duration-200 ${colapsado ? 'h-8 w-8' : 'h-9 w-9'
                                }`}
                        />
                        {!colapsado && (
                            <div className="min-w-0 leading-none">
                                <p className="truncate text-[15px] font-extrabold tracking-tight text-sidebar-foreground">
                                    SGI · Activos
                                </p>
                                <p className="mt-0.5 truncate text-[11.5px] font-medium text-sidebar-foreground/55">
                                    Préstamos y material
                                </p>
                            </div>
                        )}
                    </div>
                    {!colapsado && (
                        <button
                            type="button"
                            onClick={() => setColapsado((v) => !v)}
                            title="Colapsar menú"
                            className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md text-sidebar-foreground/50 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
                            aria-label="Colapsar menú"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </button>
                    )}
                </div>
                {colapsado && (
                    <button
                        type="button"
                        onClick={() => setColapsado((v) => !v)}
                        title="Expandir menú"
                        className="mx-auto mt-2 flex h-7 w-7 items-center justify-center rounded-md text-sidebar-foreground/50 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
                        aria-label="Expandir menú"
                    >
                        <ChevronRight className="h-4 w-4" />
                    </button>
                )}
                <nav
                    className="flex-1 overflow-y-auto px-2 py-3 scroll-elegant"
                    aria-label="Menú principal"
                >
                    {!colapsado && (
                        <p className="mb-2 px-3 text-[10.5px] font-semibold uppercase tracking-widest text-sidebar-foreground/40">
                            Navegación
                        </p>
                    )}

                    {elementosNav.map((elemento) => {
                        const { clave, id, icono: Icono, etiqueta, alSeleccionar, esActivo } = elemento;
                        const activo = esActivo ? esActivo(paginaActiva) : paginaActiva === id;

                        return (
                            <button
                                key={clave ?? id}
                                onClick={() => {
                                    alSeleccionar?.();
                                    setRenderNav((v) => v + 1);
                                    onNavegar(id);
                                }}
                                title={colapsado ? etiqueta : undefined}
                                aria-current={activo ? 'page' : undefined}
                                className={`
                                    group relative mb-0.5 flex w-full items-center rounded-lg
                                    text-[13.5px] font-medium transition-all duration-150
                                    ${colapsado ? 'justify-center px-0 py-2.5' : 'gap-3 px-3 py-2.5'}
                                    ${activo
                                        ? 'bg-sidebar-accent text-sidebar-ring shadow-sm'
                                        : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground'
                                    }
                                `}
                            >
                                <span
                                    className={`absolute left-0 top-1/2 -translate-y-1/2 w-[3px] rounded-r-full bg-sidebar-ring transition-all duration-200 ${activo ? 'h-[60%] opacity-100' : 'h-0 opacity-0'
                                        }`}
                                />

                                <Icono
                                    className={`flex-shrink-0 transition-transform duration-150 group-hover:scale-110 ${colapsado ? 'h-[19px] w-[19px]' : 'h-[18px] w-[18px]'
                                        } ${activo ? 'text-sidebar-ring' : ''}`}
                                />

                                {!colapsado && (
                                    <span className="truncate">{etiqueta}</span>
                                )}
                            </button>
                        );
                    })}
                </nav>
                <div className={`border-t border-sidebar-border px-2.5 py-3.5`}>
                    <div
                        className={`flex items-center ${colapsado ? 'justify-center' : 'gap-3 px-0.5'
                            }`}
                    >
                        <AvatarIniciales correo={nombreUsuario} colapsado={colapsado} />

                        {!colapsado && (
                            <div className="min-w-0 flex-1 leading-none">
                                <p className="truncate text-[13.5px] font-semibold text-sidebar-foreground">
                                    {nombreUsuario}
                                </p>
                                <p className="mt-0.5 truncate text-[11px] font-semibold uppercase tracking-widest text-sidebar-foreground/50">
                                    {etiquetaRol}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
                <div className="border-t border-sidebar-border px-2 pb-3 pt-2">
                    <button
                        onClick={() => setMostrarConfirmacionCerrarSesion(true)}
                        title={colapsado ? 'Cerrar sesión' : undefined}
                        aria-label="Cerrar sesión"
                        className={`
                            group flex w-full items-center rounded-lg
                            text-[13.5px] font-medium
                            text-sidebar-foreground/60 transition-all duration-150
                            hover:bg-red-500/10 hover:text-red-500
                            ${colapsado ? 'justify-center px-0 py-2.5' : 'gap-3 px-3 py-2.5'}
                        `}
                    >
                        <LogOut
                            className={`flex-shrink-0 transition-transform duration-150 group-hover:-translate-x-0.5 ${colapsado ? 'h-[19px] w-[19px]' : 'h-[18px] w-[18px]'
                                }`}
                        />
                        {!colapsado && <span>Cerrar sesión</span>}
                    </button>
                </div>
            </aside>
            {mostrarConfirmacionCerrarSesion && (
                <ModalBase
                    titulo="Cerrar sesión"
                    onCerrar={() => setMostrarConfirmacionCerrarSesion(false)}
                    ancho="max-w-sm"
                >
                    <div className="flex flex-col items-center justify-center space-y-4 py-2 text-center">
                        <div className="flex h-13 w-13 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                            <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
                        </div>
                        <div className="space-y-1">
                            <p className="text-[15px] font-semibold text-slate-800 dark:text-slate-100">
                                ¿Cerrar sesión?
                            </p>
                            <p className="text-[13px] text-slate-500 dark:text-slate-400">
                                Volverás a la pantalla de inicio de sesión.
                            </p>
                        </div>
                        <div className="flex w-full gap-3 pt-1">
                            <button
                                type="button"
                                onClick={() => setMostrarConfirmacionCerrarSesion(false)}
                                className="flex-1 h-9 rounded-lg border border-slate-200 px-4 text-[13.5px] font-medium text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
                            >
                                Cancelar
                            </button>
                            <Boton
                                type="button"
                                onClick={onCerrarSesion}
                                variant="destructive"
                                className="flex-1 h-9 px-5 text-[13.5px]"
                            >
                                Cerrar sesión
                            </Boton>
                        </div>
                    </div>
                </ModalBase>
            )}
        </>
    );
};
