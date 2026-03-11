export type EstadoHerramienta = 'buen_estado' | 'regular' | 'en_mantenimiento' | 'en_prestamo' | 'revision' | 'dado_de_baja' | 'danado';
export type EstadoPrestamo = 'pendiente' | 'devuelto' | 'vencido' | 'activo';

export interface SubinstanciaHerramienta {
    id: string;
    codigoInventario: string;
    fechaEntrega?: string;
    fechaRetiro?: string;
    estado: EstadoHerramienta;
    observaciones: string;
    ue: string;
    descripcion: string;
    precio?: number;
}

export interface Herramienta {
    id: string;
    nombre: string;
    categoria: string;
    descripcion: string;
    ue: string;
    // Propiedades originales de compatibilidad plana
    codigoInventario?: string;
    estado?: EstadoHerramienta;
    observaciones?: string;
    precio?: number;
    // Jerarquía
    subinstancias: SubinstanciaHerramienta[];
}

export interface ContenedorHerramientas {
    id: string;
    nombre: string;
    ubicacion: string;
    herramientas: Herramienta[];
}

export interface Estudiante {
    id?: string;
    carnet: string;
    nombre: string;
    apellido: string;
    carrera: string;
    semestre: number;
    carnetRetenido?: boolean;
}

export interface Docente {
    id: string;
    codigo: string;
    nombre: string;
    apellido: string;
    materia: string;
    carnet: string;
}

export interface Prestamo {
    id: string;
    carnetEstudiante: string;
    idHerramienta: string;
    fechaPrestamo: string;
    fechaDevolucion: string | null;
    estado: EstadoPrestamo;
    docente: string;
    observaciones: string;
}

export interface SubinstanciaMaterial {
    id: string;
    lote: string;
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
    stockMinimo: number;
    // Propiedades originales de compatibilidad plana
    cantidadDisponible?: number;
    precio?: number;
    // Jerarquía
    subinstancias: SubinstanciaMaterial[];
}

export interface ContenedorMateriales {
    id: string;
    nombre: string;
    ubicacion: string;
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
    carnetEstudiante: string;
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
