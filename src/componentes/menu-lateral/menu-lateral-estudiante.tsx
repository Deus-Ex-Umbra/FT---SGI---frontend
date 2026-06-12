import { MenuLateralBase } from './menu-lateral-base';
import type { MenuLateralProps } from '@/componentes/menu-lateral';
import { obtenerEtiquetaRol, obtenerMenuPermitidoPorUsuario } from '@/utilidades/navegacion';
import { obtenerUsuarioActual } from '@/lib/servicio-autenticacion';

export const MenuLateralEstudiante = (props: MenuLateralProps) => {
  const usuario = obtenerUsuarioActual();
  const elementosEstudiante = obtenerMenuPermitidoPorUsuario(usuario);

  return <MenuLateralBase {...props} elementosNav={elementosEstudiante} etiquetaRol={obtenerEtiquetaRol('estudiante')} />;
};

