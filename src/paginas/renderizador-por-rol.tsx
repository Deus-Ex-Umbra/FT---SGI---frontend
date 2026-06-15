import type { ComponentType } from 'react';
import type { RolUsuario } from '@/tipos/autenticacion';
import type { PaginaApp } from '@/tipos/navegacion';
import type { PropsPaginaBase, PropsPaginaConfiguracion } from '@/tipos/paginas';
import { useResponsive } from '@/hooks/use-responsive';
import { ResumenMovil } from '../paginas-movil/compartidas/Resumen-movil';
import { ResumenEstudianteMovil } from '../paginas-movil/estudiante/Resumen-movil';


import {
    Configuracion,
    Resumen,
    Docentes,
} from './compartidas';

import {
    Auditoria,
    Carreras,
    GruposMaterias,
    Inventarios,
    Materias,
    Usuarios,
    DocentesAdmin,
    EstudiantesAdmin,
} from './administrador';

import {
    MisEstudiantes,
    MisMaterias as MisMateriasDocente,
    Prestamos as PrestamosDocente,
} from './docente';


import {
    Activos,
    Contenedores,
    MaterialFungible,
    Prestamos as PrestamosEncargado,
    Estudiantes as EstudiantesEncargado,
} from './encargado-gabinete';

import {
    MisMaterias as MisMateriasEstudiante,
    Prestamos as PrestamosEstudiante,
    Resumen as ResumenEstudiante,
} from './estudiante';

type ComponentePaginaBase = ComponentType<PropsPaginaBase>;
type ComponentePaginaConfiguracion = ComponentType<PropsPaginaConfiguracion>;
type PaginasBasePorRol = Partial<Record<PaginaApp, Partial<Record<RolUsuario, ComponentePaginaBase>>>>;

const PAGINAS_BASE_POR_ROL: PaginasBasePorRol = {
    resumen: {
        administrador: Resumen,
        docente: Resumen,
        estudiante: ResumenEstudiante,
        encargado_inventario: Resumen,
    },
    'mi-perfil': {
        estudiante: ResumenEstudiante,
    },
    'mis-estudiantes': {
        docente: MisEstudiantes,
    },
    'mis-materias': {
        docente: MisMateriasDocente,
        estudiante: MisMateriasEstudiante,
    },
    carreras: {
        administrador: Carreras,
    },
    materias: {
        administrador: Materias,
    },
    'grupos-materia': {
        administrador: GruposMaterias,
    },
    activos: {
        encargado_inventario: Activos,
    },
    contenedores: {
        encargado_inventario: Contenedores,
    },
    prestamos: {
        docente: PrestamosDocente,
        estudiante: PrestamosEstudiante,
        encargado_inventario: PrestamosEncargado,
    },
    estudiantes: {
        administrador: EstudiantesAdmin,
        encargado_inventario: EstudiantesEncargado,
    },
    docentes: {
        administrador: DocentesAdmin,
        encargado_inventario: Docentes,
    },
    material: {
        encargado_inventario: MaterialFungible,
    },
    auditoria: {
        administrador: Auditoria,
    },
    inventarios: {
        administrador: Inventarios,
    },
    usuarios: {
        administrador: Usuarios,
    },
};

const PAGINAS_CONFIGURACION_POR_ROL: Partial<Record<RolUsuario, ComponentePaginaConfiguracion>> = {
    administrador: Configuracion,
    encargado_inventario: Configuracion,
    docente: Configuracion,
    estudiante: Configuracion,
};

interface RenderizadorPaginaPrivadaProps {
    pagina: PaginaApp;
    rol: RolUsuario | undefined;
    propsPagina: PropsPaginaBase;
    propsConfiguracion: PropsPaginaConfiguracion;
}

export const renderizarPaginaPrivada = ({
    pagina,
    rol,
    propsPagina,
    propsConfiguracion,
}: RenderizadorPaginaPrivadaProps) => {
    if (!rol) return null;

    const { es_movil } = useResponsive();

    if (es_movil && pagina === 'resumen') {
        if (rol === 'estudiante') {
            return <ResumenEstudianteMovil {...propsPagina} />;
        }
        return <ResumenMovil {...propsPagina} />;
    }

    if (pagina === 'configuracion') {
        const ComponenteConfiguracion = PAGINAS_CONFIGURACION_POR_ROL[rol];
        return ComponenteConfiguracion ? <ComponenteConfiguracion {...propsConfiguracion} /> : null;
    }

    const ComponentePagina = PAGINAS_BASE_POR_ROL[pagina]?.[rol];
    return ComponentePagina ? <ComponentePagina {...propsPagina} /> : null;
};