import { GraduationCap, LayoutDashboard, Settings, Shield, Users } from 'lucide-react';
import { MenuLateralBase } from './menu-lateral-base';
import type { MenuLateralNavItem, MenuLateralProps } from '@/componentes/menu-lateral';

const elementosAdministrador: MenuLateralNavItem[] = [
    { id: 'resumen', icono: LayoutDashboard, etiqueta: 'Inicio' },
    { id: 'auditoria', icono: Shield, etiqueta: 'Auditoría' },
    { id: 'usuarios', icono: Users, etiqueta: 'Usuarios' },
    { id: 'estudiantes', icono: GraduationCap, etiqueta: 'Estudiantes' },
    { id: 'docentes', icono: Users, etiqueta: 'Docentes' },
    { id: 'configuracion', icono: Settings, etiqueta: 'Configuración' },
];

export const MenuLateralAdministrador = (props: MenuLateralProps) => {
    return (
        <MenuLateralBase
            {...props}
            elementosNav={elementosAdministrador}
            etiquetaRol="Administrador"
        />
    );
};
