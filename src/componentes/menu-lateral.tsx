import { obtenerUsuarioActual, type RolUsuario } from '@/lib/servicio-autenticacion';
import { MenuLateralAdministrador } from './menu-lateral/menu-lateral-administrador';
import { MenuLateralEncargado } from './menu-lateral/menu-lateral-encargado';

export type { PaginaApp } from '@/tipos/navegacion';
import type { PaginaApp } from '@/tipos/navegacion';

interface ElementoNav {
    id: PaginaApp;
    icono: React.ComponentType<{ className?: string }>;
    etiqueta: string;
}

interface Props {
    paginaActiva: PaginaApp;
    onNavegar: (pagina: PaginaApp) => void;
    onCerrarSesion: () => void;
}

export type MenuLateralProps = Props;
export type MenuLateralNavItem = ElementoNav;

const obtenerRolActual = (): RolUsuario => {
    return obtenerUsuarioActual()?.rol === 'administrador' ? 'administrador' : 'encargado_inventario';
};

export const MenuLateral = ({ paginaActiva, onNavegar, onCerrarSesion }: Props) => {
    const rolActual = obtenerRolActual();

    if (rolActual === 'administrador') {
        return (
            <MenuLateralAdministrador
                paginaActiva={paginaActiva}
                onNavegar={onNavegar}
                onCerrarSesion={onCerrarSesion}
            />
        );
    }

    return (
        <MenuLateralEncargado
            paginaActiva={paginaActiva}
            onNavegar={onNavegar}
            onCerrarSesion={onCerrarSesion}
        />
    );
};
