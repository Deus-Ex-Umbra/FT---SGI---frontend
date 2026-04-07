export type RolUsuario = 'administrador' | 'encargado_inventario';

export interface UsuarioSesion {
  id: number;
  nombre_usuario: string;
  rol: RolUsuario;
}

export interface CrearUsuarioPayload {
  nombre_usuario: string;
  contrasena: string;
  rol: RolUsuario;
}
