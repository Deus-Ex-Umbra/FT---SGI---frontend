import { Archive, ClipboardList, GraduationCap, LayoutDashboard, Package, Settings, Users, Wrench } from 'lucide-react';
import { MenuLateralBase } from './menu-lateral-base';
import type { MenuLateralNavItem, MenuLateralProps } from '@/componentes/menu-lateral';

const elementosEncargado: MenuLateralNavItem[] = [
    { id: 'resumen', icono: LayoutDashboard, etiqueta: 'Resumen' },
    { id: 'activos', icono: Wrench, etiqueta: 'Activos Fijos' },
    { id: 'material', icono: Package, etiqueta: 'Activos fungibles' },
    { id: 'contenedores', icono: Archive, etiqueta: 'Contenedores' },
    { id: 'prestamos', icono: ClipboardList, etiqueta: 'Préstamos' },
    { id: 'estudiantes', icono: GraduationCap, etiqueta: 'Estudiantes' },
    { id: 'docentes', icono: Users, etiqueta: 'Docentes' },
    { id: 'configuracion', icono: Settings, etiqueta: 'Configuración' },
];

export const MenuLateralEncargado = (props: MenuLateralProps) => {
    return (
        <MenuLateralBase
            {...props}
            elementosNav={elementosEncargado}
            etiquetaRol="Encargado de inventario"
        />
    );
};
