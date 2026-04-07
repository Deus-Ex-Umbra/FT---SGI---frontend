export type EstadoHerramienta =
    // Canónicos
    | 'disponible'
    | 'en_prestamo'
    | 'en_mantenimiento'
    | 'extraviado'
    | 'dado_de_baja'
    // Legacy
    | 'buen_estado'
    | 'regular'
    | 'revision'
    | 'danado';

export type EstadoFisicoItemActivo = 'bueno' | 'regular' | 'malo';
export type EstadoPrestamo = 'pendiente' | 'devuelto' | 'vencido' | 'activo' | 'devuelto_fuera_de_fecha_limite';

export interface SubinstanciaHerramienta {
    id: string;
    codigoInventario?: string;
    codigoUnico?: string;
    fechaEntrega?: string;
    fechaRetiro?: string;
    estado: EstadoHerramienta;
    estadoFisico?: EstadoFisicoItemActivo;
    ubicacion?: string;
    observaciones?: string;
    ue?: string;
    descripcion?: string;
    precio?: number;
}

export interface Herramienta {
    id: string;
    nombre: string;
    categoria: string;
    descripcion: string;
    estado?: EstadoHerramienta;
    observaciones?: string;
    precio?: number;
    subinstancias: SubinstanciaHerramienta[];
}

export interface ContenedorHerramientas {
    id: string;
    nombre: string;
    descripcion: string;
    ubicacion?: string;
    herramientas: Herramienta[];
}

export interface ItemActivoResumen {
    id: string;
    idActivoPadre: string;
    nombre: string;
    categoria: string;
    descripcion: string;
    ue: string;
    codigoInventario?: string;
    codigoUnico?: string;
    fechaEntrega?: string;
    fechaRetiro?: string;
    estado: EstadoHerramienta;
    estadoFisico?: EstadoFisicoItemActivo;
    ubicacion?: string;
    observaciones?: string;
    precio?: number;
    contenedorId?: string;
    contenedorNombre?: string;
}

export interface Estudiante {
    id?: string;
    carnet: string;
    nombre: string;
    apellido: string;
    carrera: string;
    semestre: number;
    carnetRetenido?: boolean;
    // null/undefined => automático (según préstamos activos)
    // true/false => override manual persistente
    carnetRetenidoOverride?: boolean | null;
    carreraId?: string;
}

export interface Carrera {
    id: string;
    nombre: string;
}

export interface Materia {
    id: string;
    codigo: string;
    nombre?: string | null;
}

export interface Docente {
    id: string;
    codigo: string;
    nombre: string;
    apellido: string;
    materia: string;
    carnet: string;
    materias?: Materia[];
}

export interface Prestamo {
    id: string;
    carnetEstudiante: string;
    idHerramienta: string;
    grupoCanasta?: string | null;
    fechaPrestamo: string;
    fechaDevolucion: string | null;
    estado: EstadoPrestamo;
    docente: string;
    observaciones: string;
}

export interface PrestamoCanastaRegistro {
    id: string;
    grupoCanasta: string | null;
    idsPrestamo: string[];
    carnetEstudiante: string;
    carnetsEstudiantes: string[];
    estudiantes: Array<{
        id?: string;
        carnet: string;
        nombre: string;
        apellido: string;
    }>;
    idDocente?: string;
    docente: string;
    fechaPrestamo: string;
    fechaDevolucion: string | null;
    estado: EstadoPrestamo;
    observaciones: string;
    totalActivos: number;
    totalConsumibles: number;
    totalCosas: number;
    cosas: Array<{
        idHerramienta: string;
        codigoInventario: string;
        nombre: string;
    }>;
    consumibles: Array<{
        idLote: string;
        lote: string;
        material: string;
        cantidad: number;
        motivo: string;
        fecha: string;
    }>;
}

export interface SubinstanciaMaterial {
    id: string;
    tipo: 'lote' | 'serie' | 'simple';
    lote?: string | null;
    serie?: string | null;
    fechaEntrega?: string;
    fechaRetiro?: string;
    cantidadDisponible: number;
    fechaCaducidad?: string;
    precio?: number;
}

export interface MaterialFungible {
    id: string;
    nombre: string;
    categoria: string;
    descripcion?: string;
    unidad: string;
    stockMinimoHabilitado: boolean;
    stockMinimo: number;
    tipoIdentificacion: 'lote' | 'serie' | 'simple';
    cantidadDisponible?: number;
    precio?: number;
    subinstancias: SubinstanciaMaterial[];
}

export interface ContenedorMateriales {
    id: string;
    nombre: string;
    descripcion: string;
    ubicacion?: string;
    materiales: MaterialFungible[];
}

export interface EntregaMaterial {
    id: string;
    carnetEstudiante: string;
    idMaterial: string;
    cantidad: number;
    fecha: string;
    motivo: string;
}

export interface ItemCanastaConsumible {
    idLote: string;
    cantidad: number;
    motivo: string;
}

export interface CanastaPrestamo {
    carnetEstudiante?: string;
    carnetsEstudiantes: string[];
    idDocente: string;
    fechaPrestamo: string;
    fechaDevolucion: string;
    observaciones?: string;
    equipos: string[];
    consumibles: ItemCanastaConsumible[];
}

export interface KardexMovimiento {
    id: string;
    fecha: string;
    tipo: 'entrada' | 'salida';
    cantidad: number;
    motivo: string;
    referencia?: string;
    lote: string;
}

export interface KardexMaterial {
    materialId: string;
    materialNombre: string | null;
    movimientos: KardexMovimiento[];
}
