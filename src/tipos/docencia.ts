export type EstadoSolicitudDocencia =
  | 'vacio'
  | 'en_revision'
  | 'aprobado_docente'
  | 'rechazado_docente'
  | 'aprobado_almacen'
  | 'rechazado_almacen';

export type EstadoAprobacionGrupoDocencia = 'pendiente' | 'aprobado' | 'rechazado';

export interface UsuarioBasicoDocencia {
  id: number;
  nombre?: string | null;
  apellido?: string | null;
  correo?: string | null;
  rol?: string | null;
}

export interface GrupoMateriaDocencia {
  id: string;
  materia: string;
  materiaId?: number | null;
  sigla?: string | null;
  nombre?: string | null;
  descripcion?: string | null;
  codigoMateria?: string | null;
  nombreMateria?: string | null;
  gestion: string;
  codigoInscripcion?: string | null;
  fechaInicioInscripcion?: string | null;
  fechaFinInscripcion?: string | null;
  fechaInicioGestion?: string | null;
  fechaFinGestion?: string | null;
  grupo?: string | null;
  activo?: boolean;
  permitirInscripcion?: boolean;
  estadoAprobacion?: EstadoAprobacionGrupoDocencia;
  solicitadoAt?: string | null;
  aprobadoAt?: string | null;
  motivoRechazo?: string | null;
  rechazos?: number;
  docenteUsuario?: UsuarioBasicoDocencia | null;
  aprobadoPorUsuario?: UsuarioBasicoDocencia | null;
  duracionMateriaSemanas?: number;
  nombreGrupo?: string | null;
  maxEstudiantesGrupo?: number;
  estudianteIds: number[];
  carrerasPorEstudiante?: Record<number, string[]> | null;
  createdAt: string;
}

export interface SubgrupoPrestamoDocencia {
  id: string;
  codigo: string;
  nombre?: string | null;
  descripcion?: string | null;
  estudianteIds?: number[] | null;
  responsableEstudianteId?: number | null;
  habilitado: boolean;
  createdAt: string;
}

export interface SolicitudMaterialDocencia {
  id: string;
  estado: EstadoSolicitudDocencia;
  detalle?: string | null;
  responsableEstudianteId?: number | null;
  pdfFilename?: string | null;
  pdfPath?: string | null;
  pdfSubidoAt?: string | null;
  aprobadoDocenteAt?: string | null;
  aprobadoAlmacenAt?: string | null;
  createdAt: string;
  grupo?: GrupoMateriaDocencia | null;
}

export interface UrlFirmadaPdfDocencia {
  id: string;
  rid: number;
  exp: number;
  sig: string;
}

export interface UrlFirmadaInscripcionMateriaDocencia {
  id: string;
  eid: string;
  exp: number;
  nonce: string;
  sig: string;
}

export interface ResultadoInvitacionDocencia {
  ok: boolean;
  message?: string;
  deshabilitados?: number;
}

export interface MateriaAsignadaDocencia {
  codigo: string;
  nombre?: string | null;
}
