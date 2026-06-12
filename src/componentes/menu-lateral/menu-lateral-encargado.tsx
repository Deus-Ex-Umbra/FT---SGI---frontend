import { MenuLateralBase } from './menu-lateral-base';
import type { MenuLateralProps } from '@/componentes/menu-lateral';
import { obtenerEtiquetaRol, obtenerMenuPermitidoPorUsuario } from '@/utilidades/navegacion';
import { obtenerUsuarioActual } from '@/lib/servicio-autenticacion';

export const MenuLateralEncargado = (props: MenuLateralProps) => {
    const usuario = obtenerUsuarioActual();
    const elementosEncargado = obtenerMenuPermitidoPorUsuario(usuario);

    return (
        <MenuLateralBase
            {...props}
            elementosNav={elementosEncargado}
            etiquetaRol={obtenerEtiquetaRol('encargado_inventario')}
        />
    );
};

