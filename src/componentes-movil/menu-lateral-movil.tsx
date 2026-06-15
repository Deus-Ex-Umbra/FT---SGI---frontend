import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, LogOut } from 'lucide-react';
import { cn } from '@/utilidades/ui';
import { Boton } from '@/componentes/ui/button';
import { obtenerUsuarioActual } from '@/lib/servicio-autenticacion';
import { obtenerMenuPermitidoPorUsuario, obtenerEtiquetaRol } from '@/utilidades/navegacion';
import type { PaginaApp } from '@/tipos/navegacion';

interface Props {
    paginaActiva: PaginaApp;
    onNavegar: (pagina: PaginaApp) => void;
    onCerrarSesion: () => void;
}

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
            className={cn(
                "flex flex-shrink-0 items-center justify-center rounded-full bg-sidebar-primary text-sidebar-primary-foreground font-bold tracking-wide ring-2 ring-sidebar-ring/25 transition-all duration-200 select-none",
                colapsado ? "h-8 w-8 text-[11px]" : "h-10 w-10 text-[14px]"
            )}
            title={correo}
        >
            {iniciales || '?'}
        </div>
    );
};

export function MenuLateralMovil({ paginaActiva, onNavegar, onCerrarSesion }: Props) {
    const [colapsado, setColapsado] = useState(true);
    const usuario = obtenerUsuarioActual();
    const elementosNav = obtenerMenuPermitidoPorUsuario(usuario);
    const etiquetaRol = obtenerEtiquetaRol(usuario?.rol);
    const nombreUsuario = usuario?.correo || 'Usuario';

    // Auto-collapse sidebar when route changes
    useEffect(() => {
        setColapsado(true);
    }, [paginaActiva]);

    return (
        <>
            {/* Backdrop overlay when menu is expanded */}
            {!colapsado && (
                <div 
                    className="fixed inset-0 bg-black/45 backdrop-blur-xs z-30 transition-opacity duration-300" 
                    onClick={() => setColapsado(true)} 
                />
            )}

            <aside className={cn(
                "absolute left-0 top-0 flex h-screen flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-all duration-300 z-40",
                colapsado ? "w-16" : "w-64"
            )}>
                <div className={cn(
                    "flex h-[4.25rem] items-center border-b border-sidebar-border bg-gradient-to-br from-sidebar-primary/5 to-transparent",
                    colapsado ? "justify-center px-2" : "justify-between px-3.5"
                )}>
                    <div className="flex items-center gap-3">
                        <LogoSGI className={cn(
                            "flex-shrink-0 text-sidebar-ring transition-all duration-300",
                            colapsado ? "h-8 w-8" : "h-9 w-9"
                        )} />
                        {!colapsado && (
                            <div className="min-w-0 leading-none">
                                <p className="truncate text-[15px] font-extrabold tracking-tight text-sidebar-foreground">
                                    SGI · Activos
                                </p>
                                <p className="mt-0.5 truncate text-[11px] font-medium text-sidebar-foreground/55">
                                    Préstamos y material
                                </p>
                            </div>
                        )}
                    </div>
                    {!colapsado && (
                        <button
                            type="button"
                            onClick={() => setColapsado(true)}
                            title="Colapsar menú"
                            className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md text-sidebar-foreground/50 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </button>
                    )}
                </div>

                {colapsado && (
                    <button
                        type="button"
                        onClick={() => setColapsado(false)}
                        title="Expandir menú"
                        className="mx-auto mt-2 flex h-7 w-7 items-center justify-center rounded-md text-sidebar-foreground/50 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
                    >
                        <ChevronRight className="h-4 w-4" />
                    </button>
                )}

                <div className="flex-1 overflow-y-auto p-2 scroll-elegant">
                    <nav className="space-y-1">
                        {elementosNav.map((elemento) => {
                            const { id, icono: Icono, etiqueta } = elemento;
                            const activo = paginaActiva === id;

                            return (
                                <Boton
                                    key={id}
                                    variant={activo ? 'secondary' : 'ghost'}
                                    className={cn(
                                        'w-full h-11 text-[13.5px] font-medium transition-all duration-200',
                                        colapsado ? 'justify-center px-0 rounded-lg' : 'justify-start gap-3 px-3',
                                        activo 
                                            ? 'bg-sidebar-accent text-sidebar-ring shadow-sm' 
                                            : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground'
                                    )}
                                    onClick={() => onNavegar(id)}
                                    title={colapsado ? etiqueta : undefined}
                                >
                                    <Icono className={cn(
                                        "flex-shrink-0 transition-transform duration-150 hover:scale-110",
                                        colapsado ? "h-[19px] w-[19px]" : "h-[18px] w-[18px]",
                                        activo ? "text-sidebar-ring" : ""
                                    )} />
                                    {!colapsado && <span className="truncate">{etiqueta}</span>}
                                </Boton>
                            );
                        })}
                    </nav>
                </div>

                <div className="border-t border-sidebar-border p-2 space-y-2 bg-sidebar-accent/20">
                    <div className={cn(
                        "flex items-center",
                        colapsado ? "justify-center" : "gap-3 px-2 py-1"
                    )}>
                        <AvatarIniciales correo={nombreUsuario} colapsado={colapsado} />
                        {!colapsado && (
                            <div className="min-w-0 flex-1 leading-none">
                                <p className="truncate text-[13px] font-semibold text-sidebar-foreground">
                                    {nombreUsuario.split('@')[0]}
                                </p>
                                <p className="mt-0.5 truncate text-[10.5px] font-semibold uppercase tracking-widest text-sidebar-foreground/50">
                                    {etiquetaRol}
                                </p>
                            </div>
                        )}
                    </div>
                    
                    <Boton
                        variant="ghost"
                        className={cn(
                            "w-full text-red-500 hover:text-red-500 hover:bg-red-500/10 font-medium transition-all duration-200",
                            colapsado ? "h-11 justify-center px-0 rounded-lg" : "h-10 justify-start gap-3 px-3"
                        )}
                        onClick={onCerrarSesion}
                        title={colapsado ? "Cerrar Sesión" : undefined}
                    >
                        <LogOut className={cn(
                            "flex-shrink-0",
                            colapsado ? "h-[19px] w-[19px]" : "h-[18px] w-[18px]"
                        )} />
                        {!colapsado && <span>Cerrar Sesión</span>}
                    </Boton>
                </div>
            </aside>
        </>
    );
}
