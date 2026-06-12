import {
    Archive,
    BookOpen,
    ClipboardList,
    GraduationCap,
    Layers,
    LayoutDashboard,
    Package,
    Settings,
    Shield,
    Users,
    Wrench,
    type LucideIcon,
} from 'lucide-react';
import type { RolUsuario } from '@/tipos/autenticacion';
import type { PaginaApp } from '@/tipos/navegacion';

export type RolApp = RolUsuario;

export interface ItemNavegacionRol {
    id: PaginaApp;
    etiqueta: string;
    icono: LucideIcon;
}

interface ConfiguracionRol {
    etiquetaRol: string;
    paginaInicio: PaginaApp;
    paginasPermitidas: readonly PaginaApp[];
    menu: readonly ItemNavegacionRol[];
}

export const PAGINAS_VALIDAS_APP: readonly PaginaApp[] = [
    'login',
    'resumen',
    'mi-perfil',
    'mis-estudiantes',
    'mis-materias',
    'carreras',
    'materias',
    'grupos-materia',
    'activos',
    'contenedores',
    'prestamos',
    'estudiantes',
    'docentes',
    'material',
    'auditoria',
    'inventarios',
    'usuarios',
    'configuracion',
];

const CONFIGURACION_ROL: Record<RolApp, ConfiguracionRol> = {
    administrador: {
        etiquetaRol: 'Administrador',
        paginaInicio: 'resumen',
        paginasPermitidas: ['resumen', 'carreras', 'materias', 'grupos-materia', 'estudiantes', 'docentes', 'auditoria', 'inventarios', 'usuarios', 'configuracion'],
        menu: [
            { id: 'resumen', icono: LayoutDashboard, etiqueta: 'Inicio' },
            { id: 'carreras', icono: GraduationCap, etiqueta: 'Carreras' },
            { id: 'materias', icono: BookOpen, etiqueta: 'Materias' },
            { id: 'grupos-materia', icono: Layers, etiqueta: 'Grupos de materias' },
            { id: 'estudiantes', icono: GraduationCap, etiqueta: 'Estudiantes' },
            { id: 'docentes', icono: Users, etiqueta: 'Docentes' },
            { id: 'auditoria', icono: Shield, etiqueta: 'Auditoria' },
            { id: 'inventarios', icono: Archive, etiqueta: 'Inventarios' },
            { id: 'usuarios', icono: Users, etiqueta: 'Usuarios' },
            { id: 'configuracion', icono: Settings, etiqueta: 'Configuracion' },
        ],
    },
    encargado_inventario: {
        etiquetaRol: 'Encargado de inventario',
        paginaInicio: 'resumen',
        paginasPermitidas: ['resumen', 'activos', 'contenedores', 'prestamos', 'estudiantes', 'docentes', 'material', 'configuracion'],
        menu: [
            { id: 'resumen', icono: LayoutDashboard, etiqueta: 'Resumen' },
            { id: 'activos', icono: Wrench, etiqueta: 'Activos Fijos' },
            { id: 'material', icono: Package, etiqueta: 'Activos fungibles' },
            { id: 'contenedores', icono: Archive, etiqueta: 'Contenedores' },
            { id: 'prestamos', icono: ClipboardList, etiqueta: 'Prestamos' },
            { id: 'estudiantes', icono: GraduationCap, etiqueta: 'Estudiantes' },
            { id: 'docentes', icono: Users, etiqueta: 'Docentes' },
            { id: 'configuracion', icono: Settings, etiqueta: 'Configuracion' },
        ],
    },
    docente: {
        etiquetaRol: 'Docente',
        paginaInicio: 'resumen',
        paginasPermitidas: ['resumen', 'mis-estudiantes', 'mis-materias', 'prestamos', 'configuracion'],
        menu: [
            { id: 'resumen', icono: LayoutDashboard, etiqueta: 'Resumen' },
            { id: 'mis-estudiantes', icono: GraduationCap, etiqueta: 'Mis estudiantes' },
            { id: 'mis-materias', icono: BookOpen, etiqueta: 'Mis materias' },
            { id: 'prestamos', icono: ClipboardList, etiqueta: 'Mis prestamos' },
            { id: 'configuracion', icono: Settings, etiqueta: 'Configuracion' },
        ],
    },
    estudiante: {
        etiquetaRol: 'Estudiante',
        paginaInicio: 'resumen',
        paginasPermitidas: ['resumen', 'mi-perfil', 'mis-materias', 'prestamos', 'configuracion'],
        menu: [
            { id: 'resumen', icono: LayoutDashboard, etiqueta: 'Resumen' },
            { id: 'mis-materias', icono: BookOpen, etiqueta: 'Mis materias' },
            { id: 'prestamos', icono: ClipboardList, etiqueta: 'Mis prestamos' },
            { id: 'configuracion', icono: Settings, etiqueta: 'Configuracion' },
        ],
    },
};

export const normalizarRolApp = (rol: RolUsuario | undefined): RolApp => {
    if (!rol) return 'encargado_inventario';
    return rol;
};

export const obtenerPaginasPermitidasPorRol = (rol: RolUsuario | undefined): readonly PaginaApp[] => {
    const rolNormalizado = normalizarRolApp(rol);
    return CONFIGURACION_ROL[rolNormalizado].paginasPermitidas;
};

export const obtenerPaginaInicioPorRol = (rol: RolUsuario | undefined): PaginaApp => {
    const rolNormalizado = normalizarRolApp(rol);
    return CONFIGURACION_ROL[rolNormalizado].paginaInicio;
};

export const obtenerMenuPorRol = (rol: RolUsuario | undefined): readonly ItemNavegacionRol[] => {
    const rolNormalizado = normalizarRolApp(rol);
    return CONFIGURACION_ROL[rolNormalizado].menu;
};

export const obtenerEtiquetaRol = (rol: RolUsuario | undefined): string => {
    const rolNormalizado = normalizarRolApp(rol);
    return CONFIGURACION_ROL[rolNormalizado].etiquetaRol;
};

export const filtrarPaginasPorInventarioUsuario = (
    usuario: {
        rol: string;
        id_inventario?: number | null;
        puedeEditarFijos?: boolean;
        puedeEditarFungibles?: boolean;
    } | null,
    paginas: readonly PaginaApp[],
): PaginaApp[] => {
    if (usuario?.rol !== 'encargado_inventario') return [...paginas];
    const paginasBase = usuario.id_inventario != null
        ? [...paginas]
        : paginas.filter((pagina) => pagina === 'resumen' || pagina === 'configuracion');

    const paginasBloqueadas = new Set<PaginaApp>();
    if (usuario.puedeEditarFijos === false) paginasBloqueadas.add('activos');
    if (usuario.puedeEditarFungibles === false) paginasBloqueadas.add('material');

    if (paginasBloqueadas.size === 0) {
        return paginasBase;
    }

    return paginasBase.filter((pagina) => !paginasBloqueadas.has(pagina));
};

export const obtenerMenuPermitidoPorUsuario = (
    usuario: {
        rol: string;
        id_inventario?: number | null;
        puedeEditarFijos?: boolean;
        puedeEditarFungibles?: boolean;
    } | null,
): ItemNavegacionRol[] => {
    const rol = usuario?.rol as RolUsuario | undefined;
    const menuCompleto = obtenerMenuPorRol(rol);
    const paginasPermitidas = filtrarPaginasPorInventarioUsuario(usuario, obtenerPaginasPermitidasPorRol(rol));
    return menuCompleto.filter(item => paginasPermitidas.includes(item.id));
};

export const esPaginaValidaApp = (pagina: string | null): pagina is PaginaApp => {
    return !!pagina && PAGINAS_VALIDAS_APP.includes(pagina as PaginaApp);
};
