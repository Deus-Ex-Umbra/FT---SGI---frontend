export type EstadoHerramienta =
    | 'disponible'
    | 'en_prestamo'
    | 'en_mantenimiento'
    | 'extraviado'
    | 'dado_de_baja'
    | 'buen_estado'
    | 'regular'
    | 'revision'
    | 'danado';

export type EstadoFisicoItemActivo = 'bueno' | 'regular' | 'malo';
export type EstadoPrestamo = 'solicitado' | 'aceptado' | 'rechazado' | 'despachado' | 'vencido' | 'devuelto' | 'devuelto_fuera_de_fecha_limite' | 'pendiente' | 'activo';

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
    contenedor?: {
        id: string | number;
        nombre: string;
        ubicacion: string;
    } | null;
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
    idInventario?: number | null;
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
    idInventario?: number | null;
}

export interface EstudianteCarreraNormalizada {
    carreraId?: string;
    carrera: string;
    cu: string;
    prefijoCu?: string | null;
}

export interface Estudiante {
    id?: string;
    carnet: string;
    cu?: string;
    nombre: string;
    apellido: string;
    carrera: string;
    cus?: string[];
    carreras?: string[];
    asignacionesCarrera?: EstudianteCarreraNormalizada[];
    carnetRetenido?: boolean;
    carnetRetenidoOverride?: boolean | null;
    carreraId?: string;
    correo?: string;
    fechaNacimiento?: string | null;
    estadoAprobacion?: 'pendiente' | 'aprobado' | 'rechazado';
}

export interface Carrera {
    id: string;
    nombre: string;
    prefijoCu: string;
    inventariosIds?: number[];
    inventarios?: Array<{
        id: number;
        nombre: string;
    }>;
}

export interface CarreraHabilitadaMateria {
    id: string;
    nombre: string;
    prefijoCu?: string | null;
}

export interface DocenteAsignadoMateria {
    id: string;
    codigo: string;
    nombre: string;
    apellido: string;
    correo: string;
}

export interface Materia {
    id: string;
    codigo: string;
    nombre?: string | null;
    descripcion?: string | null;
    carrerasIds?: string[];
    carrerasHabilitadas?: CarreraHabilitadaMateria[];
    docentesIds?: string[];
    docentesAsignados?: DocenteAsignadoMateria[];
}

export interface Docente {
    id: string;
    correo: string;
    codigo: string;
    nombre: string;
    apellido: string;
    materia: string;
    carnet: string;
    materias?: Materia[];
    fechaNacimiento?: string | null;
    carreras?: Carrera[];
    carrerasIds?: number[];
}

export interface Prestamo {
    id: string;
    carnetEstudiante: string;
    idHerramienta: string;
    grupoCanasta?: string | null;
    codigo?: string | null;
    fechaPrestamo: string;
    fechaDevolucion: string | null;
    estado: EstadoPrestamo;
    docente: string;
    observaciones: string;
    idDocente?: number;
    motivoRechazo?: string | null;
    estadoFisicoEntrega?: string;
    estadoFisicoDevolucion?: string | null;
    carnetRetenido?: boolean;
}

export interface PrestamoCanastaRegistro {
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
        carnetRetenido?: boolean;
    }>;
    idDocente?: string | number;
    docente: string;
    fechaPrestamo: string;
    fechaDevolucion?: string | null;
    estado: EstadoPrestamo;
    observaciones?: string;
    totalActivos?: number;
    totalConsumibles?: number;
    totalCosas: number;
    cosas?: Array<{
        idPrestamo?: string | number | null;
        idHerramienta: string | null;
        codigoInventario: string | null;
        idContenedor?: number | null;
        nombreContenedor?: string | null;
        nombre: string;
        registrado: boolean;
        estadoFisicoEntrega?: string;
        estadoFisicoDevolucion?: string | null;
    }>;
    consumibles?: Array<{
        idLote: string | null;
        idActivoFungible?: number | null;
        idContenedor?: number | null;
        lote: string;
        material: string;
        cantidadSolicitada: number;
        cantidadDespachada?: number;
        cantidadDevuelta?: number;
        motivo: string;
        estadoDevuelto?: string;
        fecha?: string;
    }>;
    motivoRechazo?: string | null;
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
    tipoCantidad?: 'entero' | 'decimal';
    cantidadDisponible?: number;
    precio?: number;
    subinstancias: SubinstanciaMaterial[];
    idInventario?: number | null;
    lote?: string | null;
    serie?: string | null;
    promedioSolicitado?: number;
    contenedor?: {
        id: number;
        nombre: string;
        ubicacion: string;
        tipo: string;
    } | null;
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
    idLote: string | null;
    idActivoFungible?: number | null;
    idContenedor?: number | null;
    cantidad: number;
    motivo: string;
}

export interface EquipoCanastaSeleccionado {
    idHerramienta: string | null;
    registrado: boolean;
    bloqueado?: boolean;
}

export interface CanastaPrestamo {
    carnetEstudiante?: string;
    carnetsEstudiantes: string[];
    idDocente: string;
    fechaPrestamo: string;
    fechaDevolucion: string;
    observaciones?: string;
    equipos: EquipoCanastaSeleccionado[];
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
