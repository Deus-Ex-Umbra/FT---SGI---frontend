export type RolUsuario = 'administrador' | 'encargado_inventario' | 'docente' | 'estudiante';

export interface InventarioSesion {
  id: number;
  nombre: string;
  puedeEditarFijos?: boolean;
  puedeEditarFungibles?: boolean;
}

export interface InventarioGestion {
  id: number;
  nombre: string;
  descripcion?: string | null;
  puedeEditarFijos: boolean;
  puedeEditarFungibles: boolean;
  totalEncargados: number;
  encargados: Array<{ id: number; correo: string }>;
}

export interface UsuarioSesion {
  id: number;
  correo: string;
  rol: RolUsuario;
  nombre?: string | null;
  apellido?: string | null;
  id_inventario?: number | null;
  puedeEditarFijos?: boolean;
  puedeEditarFungibles?: boolean;
  estado: boolean;
  inventario?: InventarioSesion | null;
  materiasAsignadas?: string[];
}

export interface CrearUsuarioPayload {
  correo: string;
  contrasena: string;
  rol: RolUsuario;
  nombre?: string;
  apellido?: string;
  idInventario?: number | null;
  fechaNacimiento?: string;
}

export interface AsignacionCarreraEstudiantePayload {
  cu: string;
  carreraId?: number;
  carrera?: string;
}

export interface CrearUsuarioEstudiantePayload {
  correo?: string;
  ci: string;
  nombre: string;
  apellido: string;
  cu?: string;
  carreraId?: number;
  carrera?: string;
  asignacionesCarrera?: AsignacionCarreraEstudiantePayload[];
  fechaNacimiento: string;
  contrasena?: string;
}

export interface CarreraRegistroPublico {
  id: string;
  nombre: string;
  prefijoCu: string;
}

export interface CrearUsuarioDocentePayload {
  correo: string;
  ci: string;
  codigo?: string;
  nombre: string;
  apellido: string;
  fechaNacimiento?: string;
  contrasena?: string;
  carrerasIds?: number[];
  carreraId?: number;
}

export interface ResultadoRestablecerContrasena {
  ok: boolean;
  message: string;
  contrasenaTemporal: string;
}

export interface UrlFirmadaRegistroEstudiante {
  ok: boolean;
  eid?: string;
  exp?: number;
  nonce?: string;
  sig?: string;
  message?: string;
}

export interface UrlFirmadaRegistroDocente {
  ok: boolean;
  eid?: string;
  exp?: number;
  nonce?: string;
  sig?: string;
  message?: string;
}

export interface ResultadoRegistroEstudiante {
  ok: boolean;
  message?: string;
}

export interface ResultadoRegistroDocente {
  ok: boolean;
  message?: string;
}

export interface ResultadoVerificacionRegistroEstudiante {
  ok: boolean;
  message?: string;
}

export interface ResultadoVerificacionRegistroDocente {
  ok: boolean;
  message?: string;
}

export interface ResultadoGestionInvitacion {
  ok: boolean;
  message?: string;
}

export interface CrearEncargadoPayload {
    correo: string;
    contrasena: string;
    nombre?: string;
    apellido?: string;
    idInventario?: number | null;
    fechaNacimiento?: string;
}

export interface CarreraRegistroApi {
    id: string | number;
    nombre: string;
    prefijoCu?: string | null;
}
