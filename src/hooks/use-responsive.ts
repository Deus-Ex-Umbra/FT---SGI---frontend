import { useEffect, useState } from 'react';

const PUNTOS_RUPTURA = {
    sm: 640,
    md: 768,
    lg: 1024,
};

export function useResponsive() {
    const [ancho_pantalla, setAnchoPantalla] = useState(() => {
        if (typeof window === 'undefined') return PUNTOS_RUPTURA.lg;
        return window.innerWidth;
    });

    useEffect(() => {
        const manejarRedimension = () => setAnchoPantalla(window.innerWidth);
        window.addEventListener('resize', manejarRedimension);
        return () => window.removeEventListener('resize', manejarRedimension);
    }, []);

    return {
        es_movil: ancho_pantalla < PUNTOS_RUPTURA.md,
        es_tablet: ancho_pantalla >= PUNTOS_RUPTURA.md && ancho_pantalla < PUNTOS_RUPTURA.lg,
        es_escritorio: ancho_pantalla >= PUNTOS_RUPTURA.lg,
        ancho_pantalla,
    };
}
