import type { ReactNode } from 'react';
import { MenuLateral } from '@/componentes/menu-lateral';
import { MenuLateralMovil } from '@/componentes-movil/menu-lateral-movil';
import type { PaginaApp } from '@/tipos/navegacion';
import { BarraSuperior } from '@/componentes/paginas/inventario/barra-superior';
import { useResponsive } from '@/hooks/use-responsive';

interface Props {
    paginaActiva: PaginaApp;
    titulo: string;
    subtitulo: string;
    alertas?: number;
    shadow?: boolean;
    cantidad?: number;
    onNavegar: (pagina: PaginaApp) => void;
    onCerrarSesion: () => void;
    children: ReactNode;
    onRecargar?: () => void;
    recargando?: boolean;
}

export const LayoutPagina = ({
    paginaActiva,
    titulo,
    subtitulo,
    alertas = 0,
    cantidad,
    onNavegar,
    onCerrarSesion,
    children,
    onRecargar,
    recargando
}: Props) => {
    const { es_movil } = useResponsive();

    if (es_movil) {
        return (
            <div className="flex h-screen w-full overflow-hidden bg-slate-100 relative">
                <MenuLateralMovil
                    paginaActiva={paginaActiva}
                    onNavegar={onNavegar}
                    onCerrarSesion={onCerrarSesion}
                />

                <div className="flex flex-1 flex-col overflow-hidden pl-16">
                    <BarraSuperior
                        paginaActiva={paginaActiva}
                        titulo={titulo}
                        subtitulo={subtitulo}
                        alertas={alertas}
                        cantidad={cantidad}
                        onRecargar={onRecargar}
                        recargando={recargando}
                    />

                    <main className="flex-1 overflow-y-auto p-4 space-y-4 animate-fade-in" key={paginaActiva}>
                        {children}
                    </main>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen w-full overflow-hidden bg-slate-100">
            <MenuLateral
                paginaActiva={paginaActiva}
                onNavegar={onNavegar}
                onCerrarSesion={onCerrarSesion}
            />

            <div className="flex flex-1 flex-col overflow-hidden">
                <BarraSuperior
                    paginaActiva={paginaActiva}
                    titulo={titulo}
                    subtitulo={subtitulo}
                    alertas={alertas}
                    cantidad={cantidad}
                    onRecargar={onRecargar}
                    recargando={recargando}
                />

                <main className="flex-1 overflow-y-auto p-5 space-y-4 animate-fade-in" key={paginaActiva}>
                    {children}
                </main>
            </div>
        </div>
    );
};

