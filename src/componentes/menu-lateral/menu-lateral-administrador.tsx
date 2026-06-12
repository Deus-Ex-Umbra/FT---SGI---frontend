import { MenuLateralBase } from './menu-lateral-base';
import type { MenuLateralProps } from '@/componentes/menu-lateral';
import { obtenerEtiquetaRol, obtenerMenuPermitidoPorUsuario } from '@/utilidades/navegacion';
import { obtenerUsuarioActual } from '@/lib/servicio-autenticacion';

export const MenuLateralAdministrador = (props: MenuLateralProps) => {
    const usuario = obtenerUsuarioActual();
    const elementosAdministrador = obtenerMenuPermitidoPorUsuario(usuario);

    return (
        <MenuLateralBase
            {...props}
            elementosNav={elementosAdministrador}
            etiquetaRol={obtenerEtiquetaRol('administrador')}
        />
    );
};

