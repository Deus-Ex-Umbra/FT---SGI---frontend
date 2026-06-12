export interface ActivoFijoApi {
    id: string | number;
    nombre: string;
    categoria?: string;
    descripcion?: string;
    idInventario?: number | null;
    contenedor?: {
        id: string | number;
        nombre: string;
        ubicacion: string;
    } | null;
    items?: Array<{
        id: string | number;
        codigoInventario?: string | null;
        codigoUnico?: string | null;
        ubicacion?: string | null;
        ue?: string | null;
        descripcion?: string | null;
        fechaEntrega?: string;
        fechaRetiro?: string;
        estado: string;
        estadoFisico?: string;
        observaciones?: string;
        precio?: number;
    }>;
}

export interface TransicionPermitidaItemActivoApi {
    estadoDestino: string;
    requiereJustificacion: boolean;
}

export interface TransicionesPermitidasItemActivoApi {
    itemId: number;
    codigoInventario: string;
    estadoActual: string;
    estadoFisico: string;
    transiciones: TransicionPermitidaItemActivoApi[];
}

export interface EditarItemActivoApi {
    codigoInventario?: string;
    codigoUnico?: string;
    ubicacion?: string;
    ue?: string;
    descripcion?: string;
    estadoFisico?: string;
    fechaEntrega?: string | null;
    fechaRetiro?: string | null;
    estado?: string;
    observaciones?: string;
    justificacion?: string;
    precio?: number;
}

export interface CrearItemActivoApi {
    idActivo: number | string;
    codigoInventario?: string;
    codigoUnico?: string;
    ubicacion?: string;
    ue?: string;
    descripcion?: string;
    fechaEntrega?: string | null;
    fechaRetiro?: string | null;
    estado?: string;
    estadoFisico?: string;
    observaciones?: string;
    precio?: number;
}

export interface MaterialApi {
    id: string | number;
    nombre: string;
    categoria: string;
    descripcion?: string;
    unidad: string;
    stockMinimoHabilitado?: boolean;
    stockMinimo: number;
    tipoIdentificacion?: 'lote' | 'serie' | 'simple';
    idInventario?: number | null;
    contenedor?: {
        id: string | number;
        nombre: string;
        ubicacion: string;
    };
    lotes?: Array<{
        id: string | number;
        tipo?: 'lote' | 'serie' | 'simple';
        lote?: string | null;
        serie?: string | null;
        contenedor?: {
            id: string | number;
            nombre: string;
            ubicacion: string;
        };
        fechaEntrega?: string;
        fechaRetiro?: string;
        cantidadDisponible: number;
        fechaCaducidad?: string;
        precio?: number;
    }>;
}

export interface ContenedorMaterialApi {
    id: string | number;
    nombre: string;
    ubicacion: string;
}

export interface ContenedorCompartidoApi {
    id: string;
    nombre: string;
    descripcion: string;
    idActivo?: number;
    idMaterial?: number;
}

export interface MateriaApi {
    id: string | number;
    codigo: string;
    nombre?: string | null;
    descripcion?: string | null;
    carrerasIds?: Array<string | number>;
    carrerasHabilitadas?: Array<{
        id: string | number;
        nombre: string;
        prefijoCu?: string | null;
    }>;
    docentesIds?: Array<string | number>;
    docentesAsignados?: Array<{
        id: string | number;
        codigo: string;
        nombre: string;
        apellido: string;
        correo?: string | null;
    }>;
}

export interface CarreraApi {
    id: string | number;
    nombre: string;
    prefijoCu?: string | null;
    inventariosIds?: number[];
    inventarios?: Array<{
        id: number;
        nombre: string;
    }>;
}

export interface CrearCajaMaterialApi {
    idContenedor?: number;
    nombre: string;
    categoria?: string;
    descripcion?: string;
    unidad?: string;
    stockMinimoHabilitado?: boolean;
    stockMinimo?: number;
    tipoIdentificacion?: 'lote' | 'serie' | 'simple';
}

export interface CrearLoteMaterialApi {
    idMaterial: number;
    idContenedor: number;
    tipo: 'lote' | 'serie' | 'simple';
    lote?: string | null;
    serie?: string | null;
    fechaEntrega?: string | null;
    fechaRetiro?: string | null;
    cantidadDisponible?: number;
    fechaCaducidad?: string | null;
    precio?: number;
}

export interface EditarCajaMaterialApi {
    nombre?: string;
    categoria?: string;
    descripcion?: string;
    unidad?: string;
    stockMinimoHabilitado?: boolean;
    stockMinimo?: number;
    tipoIdentificacion?: 'lote' | 'serie' | 'simple';
}

export interface EditarLoteMaterialApi {
    tipo?: 'lote' | 'serie' | 'simple';
    lote?: string | null;
    serie?: string | null;
    fechaEntrega?: string | null;
    fechaRetiro?: string | null;
    cantidadDisponible?: number;
    fechaCaducidad?: string | null;
    precio?: number;
}

export interface EstudianteApi {
    id: string | number;
    carnet: string;
    cu?: string | null;
    nombre: string;
    apellido: string;
    carrera: string;
    carreraRef?: {
        id: string | number;
        nombre: string;
        prefijoCu?: string | null;
    } | null;
    asignacionesCarrera?: Array<{
        id?: string | number;
        cu?: string | null;
        carrera?: {
            id: string | number;
            nombre: string;
            prefijoCu?: string | null;
        } | null;
    }>;
    carnetRetenido?: boolean;
    carnetRetenidoOverride?: boolean | null;
    correo?: string;
    fechaNacimiento?: string;
    estadoAprobacion?: 'pendiente' | 'aprobado' | 'rechazado';
}

export interface DocenteApi {
    id: string | number;
    correo?: string | null;
    ci?: string | null;
    codigo?: string | null;
    nombre?: string | null;
    apellido?: string | null;
    materiasAsignadas?: string[] | null;
    fechaNacimiento?: string | null;
    carreras?: CarreraApi[] | null;
    carrerasIds?: number[] | null;
    materia?: string | null;
    carnet?: string | null;
    materias?: Array<{
        id: string | number;
        codigo: string;
        nombre?: string | null;
    }>;
}

export interface PrestamoApi {
    id: string | number;
    carnetEstudiante: string;
    idHerramienta: string;
    grupoCanasta?: string | null;
    codigo?: string | null;
    fechaPrestamo: string;
    fechaDevolucion?: string | null;
    estado: string;
    docente: string;
    idDocente?: string | number;
    observaciones?: string;
}

export interface PrestamoCanastaApi {
    id: string;
    grupoCanasta?: string | null;
    codigo?: string | null;
    idsPrestamo: Array<string | number>;
    carnetEstudiante: string;
    carnetsEstudiantes?: string[];
    estudiantes?: Array<{
        id?: string | number;
        carnet: string;
        nombre: string;
        apellido: string;
        carrera?: string | null;
        cu?: string | null;
    }>;
    idDocente?: string | number;
    docente: string;
    fechaPrestamo: string;
    fechaDevolucion?: string | null;
    estado: string;
    observaciones?: string;
    totalActivos?: number;
    totalConsumibles?: number;
    totalCosas: number;
    cosas: Array<{
        idHerramienta: string;
        codigoInventario: string;
        nombre: string;
        registrado: boolean;
    }>;
    consumibles?: Array<{
        idLote: string;
        lote: string;
        material: string;
        cantidad: number;
        motivo: string;
        fecha: string;
    }>;
}

export interface CrearPrestamoApi {
    carnetEstudiante: string;
    idDocente: number;
    idHerramienta: string;
    fechaPrestamo: string;
    fechaDevolucion: string;
    observaciones?: string;
    carnetRetenido?: boolean;
}

export interface DashboardEstudiante {
    perfil: {
        id: number;
        carnet: string;
        cu?: string | null;
        cus?: string[];
        nombre: string;
        apellido: string;
        carrera: string;
        carreras?: string[];
        asignacionesCarrera?: Array<{
            carreraId?: number | null;
            carrera: string;
            cu: string;
            prefijoCu?: string | null;
        }>;
        carnetRetenido: boolean;
        cusRetenidos?: string[];
    };
    materias: Array<{
        grupoId: string;
        materiaCodigo?: string | null;
        materiaNombre?: string | null;
        docente?: string | null;
        grupo?: string | null;
        maxEstudiantesGrupo?: number;
        carreras: Array<{
            carreraId?: number | null;
            carrera: string;
            cu: string;
            prefijoCu?: string | null;
        }>;
        gruposPrestamo: Array<{
            id: string;
            codigo: string;
            nombre?: string | null;
            descripcion?: string | null;
            cantidadIntegrantes: number;
            esResponsable: boolean;
            estudianteIds: number[];
            integrantes?: Array<{
                id: number;
                nombre: string;
                apellido: string;
                carnet: string;
                carrera?: string;
                esResponsable?: boolean;
            }>;
        }>;
    }>;
    materiasPorCarrera: Array<{
        carreraId?: number | null;
        carrera: string;
        cu: string;
        prefijoCu?: string | null;
        materias: Array<{
            grupoId: string;
            materiaCodigo?: string | null;
            materiaNombre?: string | null;
            docente?: string | null;
            grupo?: string | null;
            maxEstudiantesGrupo?: number;
            carreras: Array<{
                carreraId?: number | null;
                carrera: string;
                cu: string;
                prefijoCu?: string | null;
            }>;
            gruposPrestamo: Array<{
                id: string;
                codigo: string;
                nombre?: string | null;
                descripcion?: string | null;
                cantidadIntegrantes: number;
                esResponsable: boolean;
                estudianteIds: number[];
                integrantes?: Array<{
                    id: number;
                    nombre: string;
                    apellido: string;
                    carnet: string;
                    carrera?: string;
                    esResponsable?: boolean;
                }>;
            }>;
        }>;
    }>;
    prestamos: PrestamoApi[];
    prestamosResumen: Array<PrestamoCanastaApi & {
        esPrestamoGrupal: boolean;
        esLiderGrupo: boolean;
        puedeDescargarPdf: boolean;
        grupoPrestamoId?: string | null;
        grupoPrestamoCodigo?: string | null;
        grupoPrestamoNombre?: string | null;
        materiaGrupoId?: string | null;
        materiaCodigo?: string | null;
        materiaNombre?: string | null;
        pdfUrl?: string | null;
    }>;
}

export interface CarreraRegistroApi {
    id: string | number;
    nombre: string;
    prefijoCu?: string | null;
}

export interface RegistroHistorialPrestamoApi {
    id: number;
    fecha: string;
    estado: string;
    accion: string;
    observaciones?: string | null;
    nombreUsuario?: string | null;
    rolUsuario?: string | null;
    correoUsuario?: string | null;
    detalles?: {
        antes?: Record<string, any>;
        despues?: Record<string, any>;
    } | null;
    estadoActivosCanasta?: Array<{
        idHerramienta: string;
        nombre: string;
        codigo: string;
        estado: string;
    }> | null;
}
