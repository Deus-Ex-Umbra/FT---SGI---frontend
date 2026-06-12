import { MenuLateralBase } from './menu-lateral-base';
import type { MenuLateralProps } from '@/componentes/menu-lateral';
import { obtenerEtiquetaRol, obtenerMenuPermitidoPorUsuario } from '@/utilidades/navegacion';
import { obtenerUsuarioActual } from '@/lib/servicio-autenticacion';

export const MenuLateralDocente = (props: MenuLateralProps) => {
  const usuario = obtenerUsuarioActual();
  const elementosDocente = obtenerMenuPermitidoPorUsuario(usuario);

  return <MenuLateralBase {...props} elementosNav={elementosDocente} etiquetaRol={obtenerEtiquetaRol('docente')} />;
};

