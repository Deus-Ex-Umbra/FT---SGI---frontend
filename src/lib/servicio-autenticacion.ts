import { API_BASE_URL, construirUrlApi } from './api';
const API_AUTH_URL = `${API_BASE_URL}/auth`;


import type {
    CrearUsuarioEstudiantePayload,
    CrearUsuarioDocentePayload,
    InventarioGestion,
    ResultadoGestionInvitacion,
    ResultadoRegistroEstudiante,
    ResultadoRegistroDocente,
    ResultadoVerificacionRegistroEstudiante,
    ResultadoVerificacionRegistroDocente,
    UrlFirmadaRegistroEstudiante,
    UrlFirmadaRegistroDocente,
    UsuarioSesion,
} from '@/tipos/autenticacion';

export const EVENTO_USUARIO_ACTUALIZADO = 'sgi:usuario-actualizado';

const normalizarUsuarioSesion = (usuario: Partial<UsuarioSesion> & { correo?: string | null }): UsuarioSesion | null => {
    const correo = String(usuario.correo ?? '').trim().toLowerCase();
    if (!correo || !usuario.rol || typeof usuario.id !== 'number') return null;

    return {
        id: usuario.id,
        correo,
        rol: usuario.rol,
        id_inventario: usuario.id_inventario ?? null,
        puedeEditarFijos: usuario.puedeEditarFijos ?? false,
        puedeEditarFungibles: usuario.puedeEditarFungibles ?? false,
        estado: usuario.estado ?? true,
        inventario: usuario.inventario ?? null,
    };
};

const notificarActualizacionUsuario = () => {
    window.dispatchEvent(new Event(EVENTO_USUARIO_ACTUALIZADO));
};

const guardarUsuarioSesion = (usuario: UsuarioSesion) => {
    const usuarioNormalizado = normalizarUsuarioSesion(usuario);
    if (!usuarioNormalizado) {
        localStorage.removeItem('usuario');
        notificarActualizacionUsuario();
        return;
    }

    localStorage.setItem('usuario', JSON.stringify(usuarioNormalizado));
    notificarActualizacionUsuario();
};

const limpiarUsuarioSesion = () => {
    localStorage.removeItem('usuario');
    notificarActualizacionUsuario();
};

export const iniciarSesion = async (identificador: string, contrasena: string) => {
    try {
        const respuesta = await fetch(`${API_AUTH_URL}/iniciar-sesion`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ identificador, contrasena }),
        });

        if (!respuesta.ok) {
            if (respuesta.status === 401) {
                throw new Error('Usuario o contraseña incorrectos.');
            }
            throw new Error('Ocurrió un error al intentar iniciar sesión.');
        }
        const datos = await respuesta.json();

        localStorage.setItem('token_acceso', datos.token_acceso);
        guardarUsuarioSesion(datos.usuario);

        return datos;
    } catch (error) {
        throw error; 
    }
};



export const cerrarSesion = () => {
    localStorage.removeItem('token_acceso');
    limpiarUsuarioSesion();
};

export const obtenerToken = () => {
    return localStorage.getItem('token_acceso');
};

export const obtenerUsuarioActual = (): UsuarioSesion | null => {
    const usuarioGuardado = localStorage.getItem('usuario');
    if (!usuarioGuardado) return null;

    try {
        return normalizarUsuarioSesion(JSON.parse(usuarioGuardado));
    } catch {
        return null;
    }
};



export const refrescarUsuarioActual = async (): Promise<UsuarioSesion | null> => {
    const token = obtenerToken();
    if (!token) {
        return null;
    }

    const respuesta = await fetch(`${API_AUTH_URL}/perfil`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    if (!respuesta.ok) {
        if (respuesta.status === 401) {
            cerrarSesion();
            return null;
        }
        throw new Error('No se pudo refrescar la sesión del usuario.');
    }

    const usuario = normalizarUsuarioSesion(await respuesta.json());
    if (!usuario) {
        throw new Error('La sesión actual no pudo normalizarse.');
    }
    guardarUsuarioSesion(usuario);
    return usuario;
};

export const listarInventarios = async (): Promise<InventarioGestion[]> => {
    const token = obtenerToken();
    if (!token) {
        throw new Error('Tu sesión expiró. Inicia sesión nuevamente.');
    }

    const respuesta = await fetch(construirUrlApi('/inventarios'), {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    if (!respuesta.ok) {
        if (respuesta.status === 403) {
            throw new Error('No tienes permisos para ver inventarios.');
        }
        if (respuesta.status === 401) {
            throw new Error('Tu sesión expiró. Inicia sesión nuevamente.');
        }
        const texto = await respuesta.text();
        throw new Error(texto || 'No se pudo cargar la lista de inventarios.');
    }

    return respuesta.json();
};

export const listarMisInventarios = async (): Promise<Array<{ id: number; nombre: string; descripcion?: string }>> => {
    const token = obtenerToken();
    if (!token) {
        throw new Error('Tu sesión expiró. Inicia sesión nuevamente.');
    }

    const respuesta = await fetch(construirUrlApi('/inventarios/mis-inventarios'), {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    if (!respuesta.ok) {
        if (respuesta.status === 401) {
            throw new Error('Tu sesión expiró. Inicia sesión nuevamente.');
        }
        const texto = await respuesta.text();
        throw new Error(texto || 'No se pudo cargar la lista de inventarios autorizados.');
    }

    return respuesta.json();
};

export const crearInventario = async (payload: { nombre: string; descripcion?: string; puedeEditarFijos?: boolean; puedeEditarFungibles?: boolean }): Promise<InventarioGestion> => {
    const token = obtenerToken();
    if (!token) {
        throw new Error('Tu sesión expiró. Inicia sesión nuevamente.');
    }

    const respuesta = await fetch(construirUrlApi('/inventarios'), {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
    });

    if (!respuesta.ok) {
        if (respuesta.status === 403) {
            throw new Error('No tienes permisos para crear inventarios.');
        }
        if (respuesta.status === 401) {
            throw new Error('Tu sesión expiró. Inicia sesión nuevamente.');
        }
        const texto = await respuesta.text();
        throw new Error(texto || 'No se pudo crear el inventario.');
    }

    return respuesta.json();
};

export const editarInventario = async (
    idInventario: number,
    payload: Partial<{ nombre: string; descripcion: string; puedeEditarFijos: boolean; puedeEditarFungibles: boolean }>,
): Promise<InventarioGestion> => {
    const token = obtenerToken();
    if (!token) {
        throw new Error('Tu sesión expiró. Inicia sesión nuevamente.');
    }

    const respuesta = await fetch(construirUrlApi(`/inventarios/${idInventario}`), {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
    });

    if (!respuesta.ok) {
        if (respuesta.status === 403) {
            throw new Error('No tienes permisos para editar inventarios.');
        }
        if (respuesta.status === 401) {
            throw new Error('Tu sesión expiró. Inicia sesión nuevamente.');
        }
        const texto = await respuesta.text();
        throw new Error(texto || 'No se pudo editar el inventario.');
    }

    const inventarioActualizado = await respuesta.json();
    void refrescarUsuarioActual().catch(() => undefined);
    return inventarioActualizado;
};

export const eliminarInventario = async (idInventario: number): Promise<void> => {
    const token = obtenerToken();
    if (!token) {
        throw new Error('Tu sesión expiró. Inicia sesión nuevamente.');
    }

    const respuesta = await fetch(construirUrlApi(`/inventarios/${idInventario}`), {
        method: 'DELETE',
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    if (!respuesta.ok) {
        if (respuesta.status === 403) {
            throw new Error('No tienes permisos para eliminar inventarios.');
        }
        if (respuesta.status === 401) {
            throw new Error('Tu sesión expiró. Inicia sesión nuevamente.');
        }
        const texto = await respuesta.text();
        throw new Error(texto || 'No se pudo eliminar el inventario.');
    }
};



export const generarUrlFirmadaRegistroEstudiante = async (): Promise<UrlFirmadaRegistroEstudiante> => {
    const token = obtenerToken();
    if (!token) {
        throw new Error('Tu sesión expiró. Inicia sesión nuevamente.');
    }

    const respuesta = await fetch(`${API_AUTH_URL}/registro-estudiantes/url-firmada`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    if (!respuesta.ok) {
        if (respuesta.status === 403) {
            throw new Error('No tienes permisos para generar enlaces de registro.');
        }
        if (respuesta.status === 401) {
            throw new Error('Tu sesión expiró. Inicia sesión nuevamente.');
        }
        const texto = await respuesta.text();
        throw new Error(texto || 'No se pudo generar el enlace de registro.');
    }

    return respuesta.json();
};

export const obtenerUrlFirmadaRegistroEstudianteActiva = async (): Promise<UrlFirmadaRegistroEstudiante> => {
    const token = obtenerToken();
    if (!token) {
        throw new Error('Tu sesión expiró. Inicia sesión nuevamente.');
    }

    const respuesta = await fetch(`${API_AUTH_URL}/registro-estudiantes/url-firmada`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    if (!respuesta.ok) {
        if (respuesta.status === 403) {
            throw new Error('No tienes permisos para ver enlaces de registro.');
        }
        if (respuesta.status === 401) {
            throw new Error('Tu sesión expiró. Inicia sesión nuevamente.');
        }
        const texto = await respuesta.text();
        throw new Error(texto || 'No se pudo obtener el enlace de registro activo.');
    }

    return respuesta.json();
};

export const deshabilitarUrlFirmadaRegistroEstudiante = async (): Promise<ResultadoGestionInvitacion> => {
    const token = obtenerToken();
    if (!token) {
        throw new Error('Tu sesión expiró. Inicia sesión nuevamente.');
    }

    const respuesta = await fetch(`${API_AUTH_URL}/registro-estudiantes/url-firmada/deshabilitar`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    if (!respuesta.ok) {
        if (respuesta.status === 403) {
            throw new Error('No tienes permisos para deshabilitar enlaces de registro.');
        }
        if (respuesta.status === 401) {
            throw new Error('Tu sesión expiró. Inicia sesión nuevamente.');
        }
        const texto = await respuesta.text();
        throw new Error(texto || 'No se pudo deshabilitar el enlace de registro.');
    }

    return respuesta.json();
};

export { obtenerCarrerasRegistroPublico } from './servicio-catalogo';

export const verificarRegistroEstudianteConEnlaceFirmado = async (input: {
    eid: string;
    exp: string;
    nonce: string;
    sig: string;
}): Promise<ResultadoVerificacionRegistroEstudiante> => {
    const url = `${API_AUTH_URL}/registro-estudiantes/verificar?eid=${encodeURIComponent(input.eid)}&exp=${encodeURIComponent(input.exp)}&nonce=${encodeURIComponent(input.nonce)}&sig=${encodeURIComponent(input.sig)}`;
    const respuesta = await fetch(url);

    if (!respuesta.ok) {
        const texto = await respuesta.text();
        throw new Error(texto || 'No se pudo verificar el enlace de registro.' );
    }

    return respuesta.json();
};

export const registrarEstudianteConEnlaceFirmado = async (input: {
    eid: string;
    exp: string;
    nonce: string;
    sig: string;
    payload: CrearUsuarioEstudiantePayload;
}): Promise<ResultadoRegistroEstudiante> => {
    const url = `${API_AUTH_URL}/registro-estudiantes?eid=${encodeURIComponent(input.eid)}&exp=${encodeURIComponent(input.exp)}&nonce=${encodeURIComponent(input.nonce)}&sig=${encodeURIComponent(input.sig)}`;
    const respuesta = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(input.payload),
    });

    if (!respuesta.ok) {
        const texto = await respuesta.text();
        throw new Error(texto || 'No se pudo completar el registro de estudiante.');
    }

    return respuesta.json();
};

export const generarUrlFirmadaRegistroDocente = async (): Promise<UrlFirmadaRegistroDocente> => {
    const token = obtenerToken();
    if (!token) {
        throw new Error('Tu sesión expiró. Inicia sesión nuevamente.');
    }

    const respuesta = await fetch(`${API_AUTH_URL}/registro-docentes/url-firmada`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    if (!respuesta.ok) {
        if (respuesta.status === 403) {
            throw new Error('No tienes permisos para generar enlaces de registro.');
        }
        if (respuesta.status === 401) {
            throw new Error('Tu sesión expiró. Inicia sesión nuevamente.');
        }
        const texto = await respuesta.text();
        throw new Error(texto || 'No se pudo generar el enlace de registro.');
    }

    return respuesta.json();
};

export const obtenerUrlFirmadaRegistroDocenteActiva = async (): Promise<UrlFirmadaRegistroDocente> => {
    const token = obtenerToken();
    if (!token) {
        throw new Error('Tu sesión expiró. Inicia sesión nuevamente.');
    }

    const respuesta = await fetch(`${API_AUTH_URL}/registro-docentes/url-firmada`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    if (!respuesta.ok) {
        if (respuesta.status === 403) {
            throw new Error('No tienes permisos para ver enlaces de registro.');
        }
        if (respuesta.status === 401) {
            throw new Error('Tu sesión expiró. Inicia sesión nuevamente.');
        }
        const texto = await respuesta.text();
        throw new Error(texto || 'No se pudo obtener el enlace de registro activo.');
    }

    return respuesta.json();
};

export const deshabilitarUrlFirmadaRegistroDocente = async (): Promise<ResultadoGestionInvitacion> => {
    const token = obtenerToken();
    if (!token) {
        throw new Error('Tu sesión expiró. Inicia sesión nuevamente.');
    }

    const respuesta = await fetch(`${API_AUTH_URL}/registro-docentes/url-firmada/deshabilitar`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    if (!respuesta.ok) {
        if (respuesta.status === 403) {
            throw new Error('No tienes permisos para deshabilitar enlaces de registro.');
        }
        if (respuesta.status === 401) {
            throw new Error('Tu sesión expiró. Inicia sesión nuevamente.');
        }
        const texto = await respuesta.text();
        throw new Error(texto || 'No se pudo deshabilitar el enlace de registro.');
    }

    return respuesta.json();
};

export const verificarRegistroDocenteConEnlaceFirmado = async (input: {
    eid: string;
    exp: string;
    nonce: string;
    sig: string;
}): Promise<ResultadoVerificacionRegistroDocente> => {
    const url = `${API_AUTH_URL}/registro-docentes/verificar?eid=${encodeURIComponent(input.eid)}&exp=${encodeURIComponent(input.exp)}&nonce=${encodeURIComponent(input.nonce)}&sig=${encodeURIComponent(input.sig)}`;
    const respuesta = await fetch(url);

    if (!respuesta.ok) {
        const texto = await respuesta.text();
        throw new Error(texto || 'No se pudo verificar el enlace de registro.');
    }

    return respuesta.json();
};

export const registrarDocenteConEnlaceFirmado = async (input: {
    eid: string;
    exp: string;
    nonce: string;
    sig: string;
    payload: CrearUsuarioDocentePayload;
}): Promise<ResultadoRegistroDocente> => {
    const url = `${API_AUTH_URL}/registro-docentes?eid=${encodeURIComponent(input.eid)}&exp=${encodeURIComponent(input.exp)}&nonce=${encodeURIComponent(input.nonce)}&sig=${encodeURIComponent(input.sig)}`;
    const respuesta = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(input.payload),
    });

    if (!respuesta.ok) {
        const texto = await respuesta.text();
        throw new Error(texto || 'No se pudo completar el registro de docente.');
    }

    return respuesta.json();
};

export const cambiarContrasena = async (contrasenaActual: string, nuevaContrasena: string): Promise<{ ok: boolean; message: string }> => {
    const token = obtenerToken();
    if (!token) {
        throw new Error('Tu sesión expiró. Inicia sesión nuevamente.');
    }

    const respuesta = await fetch(`${API_AUTH_URL}/cambiar-contrasena`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ contrasenaActual, nuevaContrasena }),
    });

    if (!respuesta.ok) {
        if (respuesta.status === 401) {
            throw new Error('Tu sesión expiró o las credenciales no son válidas.');
        }
        const datos = await respuesta.json().catch(() => ({}));
        throw new Error(datos.message || 'No se pudo cambiar la contraseña.');
    }

    return respuesta.json();
};

export const cambiarCorreo = async (contrasenaActual: string, nuevoCorreo: string): Promise<{ ok: boolean; message: string; nuevoCorreo: string }> => {
    const token = obtenerToken();
    if (!token) {
        throw new Error('Tu sesión expiró. Inicia sesión nuevamente.');
    }

    const respuesta = await fetch(`${API_AUTH_URL}/cambiar-correo`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ contrasenaActual, nuevoCorreo }),
    });

    if (!respuesta.ok) {
        if (respuesta.status === 401) {
            throw new Error('Tu sesión expiró o las credenciales no son válidas.');
        }
        if (respuesta.status === 403) {
            throw new Error('No tienes permisos para realizar esta acción.');
        }
        const datos = await respuesta.json().catch(() => ({}));
        throw new Error(datos.message || 'No se pudo cambiar el correo.');
    }

    const datos = await respuesta.json();
    if (datos.token_acceso && datos.usuario) {
        localStorage.setItem('token_acceso', datos.token_acceso);
        guardarUsuarioSesion(datos.usuario);
    }

    return datos;
};

