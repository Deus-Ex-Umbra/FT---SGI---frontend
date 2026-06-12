import { obtenerToken, refrescarUsuarioActual } from './servicio-autenticacion';
import { API_BASE_URL } from './api';
import type {
    CrearUsuarioPayload,
    ResultadoRestablecerContrasena,
    UsuarioSesion,
    CrearEncargadoPayload,
} from '@/tipos/autenticacion';

const API_BASE = API_BASE_URL;

const authHeaders = () => {
  const token = obtenerToken();
  if (!token) {
    throw new Error('Tu sesión expiró. Inicia sesión nuevamente.');
  }
  return { Authorization: `Bearer ${token}` };
};

const construirPayloadEncargado = (entrada: CrearUsuarioPayload): CrearEncargadoPayload => ({
    correo: entrada.correo,
    contrasena: entrada.contrasena,
    nombre: entrada.nombre?.trim() || undefined,
    apellido: entrada.apellido?.trim() || undefined,
    idInventario: entrada.idInventario ?? null,
    fechaNacimiento: entrada.fechaNacimiento || undefined,
});

const leerError = async (respuesta: Response, mensajeBase: string) => {
    const texto = await respuesta.text();
    return texto || mensajeBase;
};

export const crearUsuario = async (entrada: CrearUsuarioPayload): Promise<UsuarioSesion> => {
        if (entrada.rol === 'administrador') {
                throw new Error('El backend actual no expone una ruta para crear administradores desde el frontend.');
        }

        if (entrada.rol !== 'encargado_inventario') {
                throw new Error('Este método solo admite crear encargados de inventario.');
        }

        const respuesta = await fetch(`${API_BASE}/administrador/usuarios/encargados`, {
        method: 'POST',
                headers: { 'Content-Type': 'application/json', ...authHeaders() },
                body: JSON.stringify(construirPayloadEncargado(entrada)),
    });
    if (!respuesta.ok) {
        if (respuesta.status === 403) throw new Error('No tienes permisos para crear usuarios.');
        if (respuesta.status === 401) throw new Error('Tu sesión expiró. Inicia sesión nuevamente.');
        if (respuesta.status === 409) throw new Error('Ese correo ya existe.');
                throw new Error(await leerError(respuesta, 'No se pudo crear el usuario.'));
    }
    return respuesta.json();
};

export const listarUsuarios = async (): Promise<UsuarioSesion[]> => {
    const respuesta = await fetch(`${API_BASE}/administrador/usuarios`, {
                headers: authHeaders(),
    });
    if (!respuesta.ok) {
        if (respuesta.status === 403) throw new Error('No tienes permisos para ver usuarios.');
        if (respuesta.status === 401) throw new Error('Tu sesión expiró. Inicia sesión nuevamente.');
        throw new Error('No se pudo cargar la lista de usuarios.');
    }
    return respuesta.json();
};



export const asignarInventarioUsuario = async (
    usuarioId: number,
    idInventario: number | null,
): Promise<UsuarioSesion> => {
    const respuesta = await fetch(`${API_BASE}/administrador/usuarios/${usuarioId}/inventario`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ idInventario }),
    });
    if (!respuesta.ok) {
        if (respuesta.status === 403) throw new Error('No tienes permisos para asignar inventarios.');
        if (respuesta.status === 401) throw new Error('Tu sesión expiró. Inicia sesión nuevamente.');
        throw new Error(await leerError(respuesta, 'No se pudo actualizar el inventario del usuario.'));
    }
    const usuarioActualizado = await respuesta.json();
    void refrescarUsuarioActual().catch(() => undefined);
    return usuarioActualizado;
};

export const cambiarEstadoUsuario = async (
    usuarioId: number,
    estado: boolean,
): Promise<{ ok: boolean; message: string }> => {
    const respuesta = await fetch(`${API_BASE}/administrador/usuarios/${usuarioId}/estado`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ estado }),
    });
    if (!respuesta.ok) {
        if (respuesta.status === 403) throw new Error('No tienes permisos para modificar el estado de usuarios.');
        if (respuesta.status === 401) throw new Error('Tu sesión expiró. Inicia sesión nuevamente.');
        throw new Error(await leerError(respuesta, 'No se pudo actualizar el estado del usuario.'));
    }
    return respuesta.json();
};

export { crearUsuarioEstudiantePorAdministrador } from './servicio-estudiantes';
export { crearUsuarioDocentePorAdministrador, listarDocentesAdmin } from './servicio-docentes';

export const restablecerContrasenaUsuario = async (usuarioId: number): Promise<ResultadoRestablecerContrasena> => {
    const respuesta = await fetch(`${API_BASE}/administrador/usuarios/${usuarioId}/restablecer-contrasena`, {
        method: 'POST',
        headers: authHeaders(),
    });
    if (!respuesta.ok) {
        if (respuesta.status === 403) throw new Error('No tienes permisos para restablecer contraseñas.');
        if (respuesta.status === 401) throw new Error('Tu sesión expiró. Inicia sesión nuevamente.');
        if (respuesta.status === 404) throw new Error('No se encontró el usuario seleccionado.');
        throw new Error(await leerError(respuesta, 'No se pudo restablecer la contraseña.'));
    }
    return respuesta.json();
};

export const ejecutarSeeders = async (): Promise<{ ok: boolean; message: string }> => {
    const respuesta = await fetch(`${API_BASE}/administrador/datos/seed`, {
        method: 'POST',
        headers: authHeaders(),
    });
    if (!respuesta.ok) {
        if (respuesta.status === 403) throw new Error('No tienes permisos para ejecutar seeders.');
        if (respuesta.status === 401) throw new Error('Tu sesión expiró. Inicia sesión nuevamente.');
        throw new Error('No se pudo ejecutar los seeders.');
    }
    return respuesta.json();
};

export const limpiarBaseDatos = async (): Promise<{ ok: boolean; message: string }> => {
    const respuesta = await fetch(`${API_BASE}/administrador/datos/limpiar`, {
        method: 'POST',
        headers: authHeaders(),
    });
    if (!respuesta.ok) {
        if (respuesta.status === 403) throw new Error('No tienes permisos para limpiar la base de datos.');
        if (respuesta.status === 401) throw new Error('Tu sesión expiró. Inicia sesión nuevamente.');
        throw new Error('No se pudo limpiar la base de datos.');
    }
    return respuesta.json();
};

export const descargarEstructuraSql = async (): Promise<Blob> => {
    const respuesta = await fetch(`${API_BASE}/administrador/datos/estructura-sql`, {
        headers: authHeaders(),
    });
    if (!respuesta.ok) {
        if (respuesta.status === 403) throw new Error('No tienes permisos para descargar la estructura SQL.');
        if (respuesta.status === 401) throw new Error('Tu sesión expiró. Inicia sesión nuevamente.');
        throw new Error('No se pudo descargar la estructura SQL.');
    }
    return respuesta.blob();
};

export const descargarDatosSql = async (): Promise<Blob> => {
    const respuesta = await fetch(`${API_BASE}/administrador/datos/datos-sql`, {
        headers: authHeaders(),
    });
    if (!respuesta.ok) {
        if (respuesta.status === 403) throw new Error('No tienes permisos para descargar los datos.');
        if (respuesta.status === 401) throw new Error('Tu sesión expiró. Inicia sesión nuevamente.');
        throw new Error('No se pudo descargar los datos.');
    }
    return respuesta.blob();
};

export const editarUsuario = async (
    usuarioId: number,
    datos: any,
): Promise<UsuarioSesion> => {
    const respuesta = await fetch(`${API_BASE}/administrador/usuarios/${usuarioId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify(datos),
    });
    if (!respuesta.ok) {
        if (respuesta.status === 403) throw new Error('No tienes permisos para editar usuarios.');
        if (respuesta.status === 401) throw new Error('Tu sesión expiró. Inicia sesión nuevamente.');
        if (respuesta.status === 409) throw new Error('Ya existe un usuario con ese correo electrónico.');
        throw new Error(await leerError(respuesta, 'No se pudo actualizar el usuario.'));
    }
    return respuesta.json();
};

