import type { ReactNode } from 'react';
import { MenuLateral } from '@/componentes/menu-lateral';
import type { PaginaApp } from '@/tipos/navegacion';
import { BarraSuperior } from '@/componentes/paginas/inventario/barra-superior';

interface Props {
    paginaActiva: PaginaApp;
    titulo: string;
    subtitulo: string;
    alertas?: number;
    cantidad?: number;
    onNavegar: (pagina: PaginaApp) => void;
    onCerrarSesion: () => void;
    children: ReactNode;
}

export const LayoutPagina = ({
    paginaActiva,
    titulo,
    subtitulo,
    alertas = 0,
    cantidad,
    onNavegar,
    onCerrarSesion,
    children
}: Props) => {
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
                />

                <main className="flex-1 overflow-y-auto p-5 space-y-4 animate-fade-in" key={paginaActiva}>
                    {children}
                </main>
            </div>
        </div>
    );
};
