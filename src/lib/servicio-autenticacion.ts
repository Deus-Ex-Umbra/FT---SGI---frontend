const API_BASE_URL = 'http://localhost:3001';
const API_AUTH_URL = `${API_BASE_URL}/auth`;

export type { CrearUsuarioPayload, RolUsuario, UsuarioSesion } from '@/tipos/autenticacion';

import type { CrearUsuarioPayload, UsuarioSesion } from '@/tipos/autenticacion';

export const iniciarSesion = async (nombre_usuario: string, contrasena: string) => {
    try {
        const respuesta = await fetch(`${API_AUTH_URL}/iniciar-sesion`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ nombre_usuario, contrasena }),
        });

        if (!respuesta.ok) {
            if (respuesta.status === 401) {
                throw new Error('Usuario o contraseña incorrectos.');
            }
            throw new Error('Ocurrió un error al intentar iniciar sesión.');
        }
        const datos = await respuesta.json();

        localStorage.setItem('token_acceso', datos.token_acceso);
        localStorage.setItem('usuario', JSON.stringify(datos.usuario));

        return datos;
    } catch (error) {
        throw error; 
    }
};

export const cerrarSesion = () => {
    localStorage.removeItem('token_acceso');
    localStorage.removeItem('usuario');
};

export const obtenerToken = () => {
    return localStorage.getItem('token_acceso');
};

export const obtenerUsuarioActual = (): UsuarioSesion | null => {
    const usuarioGuardado = localStorage.getItem('usuario');
    if (!usuarioGuardado) return null;

    try {
        const usuario = JSON.parse(usuarioGuardado) as UsuarioSesion;
        if (!usuario?.nombre_usuario || !usuario?.rol) return null;
        return usuario;
    } catch {
        return null;
    }
};

export const crearUsuario = async (entrada: CrearUsuarioPayload) => {
    const token = obtenerToken();
    if (!token) {
        throw new Error('Tu sesión expiró. Inicia sesión nuevamente.');
    }

    const respuesta = await fetch(`${API_BASE_URL}/usuarios`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(entrada),
    });

    if (!respuesta.ok) {
        if (respuesta.status === 403) {
            throw new Error('No tienes permisos para crear usuarios.');
        }
        if (respuesta.status === 401) {
            throw new Error('Tu sesión expiró. Inicia sesión nuevamente.');
        }
        if (respuesta.status === 409) {
            throw new Error('Ese nombre de usuario ya existe.');
        }
        const texto = await respuesta.text();
        throw new Error(texto || 'No se pudo crear el usuario.');
    }

    return respuesta.json();
};

export const listarUsuarios = async (): Promise<UsuarioSesion[]> => {
    const token = obtenerToken();
    if (!token) {
        throw new Error('Tu sesión expiró. Inicia sesión nuevamente.');
    }

    const respuesta = await fetch(`${API_BASE_URL}/usuarios`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    if (!respuesta.ok) {
        if (respuesta.status === 403) {
            throw new Error('No tienes permisos para ver usuarios.');
        }
        if (respuesta.status === 401) {
            throw new Error('Tu sesión expiró. Inicia sesión nuevamente.');
        }
        throw new Error('No se pudo cargar la lista de usuarios.');
    }

    return respuesta.json();
};
