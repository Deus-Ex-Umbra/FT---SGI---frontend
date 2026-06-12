import { obtenerUsuarioActual } from '@/lib/servicio-autenticacion';
import type { RolUsuario } from '@/tipos/autenticacion';
import { MenuLateralAdministrador } from './menu-lateral/menu-lateral-administrador';
import { MenuLateralEncargado } from './menu-lateral/menu-lateral-encargado';
import { MenuLateralDocente } from './menu-lateral/menu-lateral-docente';
import { MenuLateralEstudiante } from './menu-lateral/menu-lateral-estudiante';

export type { PaginaApp } from '@/tipos/navegacion';
import type { PaginaApp } from '@/tipos/navegacion';

interface ElementoNav {
    clave?: string;
    id: PaginaApp;
    icono: React.ComponentType<{ className?: string }>;
    etiqueta: string;
    alSeleccionar?: () => void;
    esActivo?: (paginaActiva: PaginaApp) => boolean;
}

interface Props {
    paginaActiva: PaginaApp;
    onNavegar: (pagina: PaginaApp) => void;
    onCerrarSesion: () => void;
}

export type MenuLateralProps = Props;
export type MenuLateralNavItem = ElementoNav;

const obtenerRolActual = (): RolUsuario => {
    return obtenerUsuarioActual()?.rol ?? 'encargado_inventario';
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

    if (rolActual === 'docente') {
        return (
            <MenuLateralDocente
                paginaActiva={paginaActiva}
                onNavegar={onNavegar}
                onCerrarSesion={onCerrarSesion}
            />
        );
    }

    if (rolActual === 'estudiante') {
        return (
            <MenuLateralEstudiante
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
