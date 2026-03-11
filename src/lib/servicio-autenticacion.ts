export const API_URL = 'http://localhost:3001/auth';

/**
 * Función para iniciar sesión
 * @param nombre_usuario El usuario ingresado (ej. "director")
 * @param contrasena La contraseña ingresada
 * @returns Los datos del usuario y el token si es exitoso
 */
export const iniciarSesion = async (nombre_usuario: string, contrasena: string) => {
    try {
        const respuesta = await fetch(`${API_URL}/iniciar-sesion`, {
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

        // 1. Guardamos el token en localStorage
        localStorage.setItem('token_acceso', datos.token_acceso);

        // 2. Guardamos los datos del usuario (id, nombre_usuario, rol)
        localStorage.setItem('usuario', JSON.stringify(datos.usuario));

        return datos; // Retornamos los datos por si el componente los necesita
    } catch (error) {
        throw error; // Propagamos el error para mostrarlo en el formulario
    }
};

/**
 * Función para cerrar sesión
 */
export const cerrarSesion = () => {
    localStorage.removeItem('token_acceso');
    localStorage.removeItem('usuario');
    // Aquí podrías agregar un redireccionamiento al login, ej. window.location.href = '/';
};

/**
 * Función auxiliar para obtener el token desde cualquier parte del frontend
 */
export const obtenerToken = () => {
    return localStorage.getItem('token_acceso');
};
