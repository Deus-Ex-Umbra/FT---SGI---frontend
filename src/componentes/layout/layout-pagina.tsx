import type { ReactNode } from 'react';
import { MenuLateral } from '@/componentes/menu-lateral';
import type { PaginaApp } from '@/tipos/navegacion';
import { BarraSuperior } from '@/componentes/inventario/barra-superior';

interface Props {
    paginaActiva: PaginaApp;
    titulo: string;
    subtitulo: string;
    alertas?: number;
    onNavegar: (pagina: PaginaApp) => void;
    onCerrarSesion: () => void;
    children: ReactNode;
}

export const LayoutPagina = ({
    paginaActiva,
    titulo,
    subtitulo,
    alertas = 0,
    onNavegar,
    onCerrarSesion,
    children
}: Props) => {
    return (
        <div className="flex h-screen w-full overflow-hidden bg-slate-100 dark:bg-slate-950">
            <MenuLateral
                paginaActiva={paginaActiva}
                onNavegar={onNavegar}
                onCerrarSesion={onCerrarSesion}
            />

            <div className="flex flex-1 flex-col overflow-hidden">
                <BarraSuperior
                    titulo={titulo}
                    subtitulo={subtitulo}
                    alertas={alertas}
                />

                <main className="flex-1 overflow-y-auto p-5 space-y-4 animate-fade-in" key={paginaActiva}>
                    {children}
                </main>
            </div>
        </div>
    );
};
