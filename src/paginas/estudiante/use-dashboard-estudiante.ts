import { useEffect, useState } from 'react';
import { obtenerMiDashboardEstudiante } from '@/lib/servicio-prestamos';
import type { DashboardEstudiante } from '@/tipos/api';

const MENSAJE_ERROR = 'Ocurrió un error al cargar tu información.';

export const useDashboardEstudiante = (onSesionExpirada: () => void) => {
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [datos, setDatos] = useState<DashboardEstudiante | null>(null);

    const cargar = async (silencioso = false) => {
        try {
            if (!silencioso) setCargando(true);
            setError(null);

            const respuesta = await obtenerMiDashboardEstudiante();
            setDatos(respuesta);
        } catch (errorCargando) {
            const mensaje = errorCargando instanceof Error ? errorCargando.message : MENSAJE_ERROR;
            const mensajeNormalizado = mensaje.toLowerCase();
            if (mensajeNormalizado.includes('sesion') || mensajeNormalizado.includes('sesión')) {
                onSesionExpirada();
                return;
            }

            setError(mensaje || MENSAJE_ERROR);
        } finally {
            if (!silencioso) setCargando(false);
        }
    };

    useEffect(() => {
        void cargar();

        const intervalo = setInterval(() => {
            void cargar(true);
        }, 5000);

        return () => clearInterval(intervalo);
    }, []);

    return {
        cargando,
        error,
        datos,
        recargar: cargar,
    };
};