import { useCallback, useEffect, useRef, useState } from 'react';

export interface UseCierreSeguroOptions {
    estaSucio: boolean;
    alCerrar: () => void;
    estaCargando?: boolean;
    mensajeConfirmacion?: string;
}

export interface UseCierreSeguroReturn {
    solicitarCierre: () => void;
    confirmacionAbierta: boolean;
    cancelarCierre: () => void;
    confirmarCierre: () => void;
    mensajeConfirmacion: string;
}

export function useCierreSeguro({
    estaSucio,
    alCerrar,
    estaCargando = false,
    mensajeConfirmacion = 'Hay cambios sin guardar. ¿Deseas cerrar y descartar los cambios?',
}: UseCierreSeguroOptions): UseCierreSeguroReturn {
    const cerrarRef = useRef(alCerrar);
    cerrarRef.current = alCerrar;

    const [confirmacionAbierta, setConfirmacionAbierta] = useState(false);

    useEffect(() => {
        if (!estaSucio) {
            setConfirmacionAbierta(false);
        }
    }, [estaSucio]);

    const solicitarCierre = useCallback(() => {
        if (estaCargando) return;
        if (!estaSucio) {
            cerrarRef.current();
            return;
        }

        setConfirmacionAbierta(true);
    }, [estaCargando, estaSucio]);

    const cancelarCierre = useCallback(() => {
        setConfirmacionAbierta(false);
    }, []);

    const confirmarCierre = useCallback(() => {
        setConfirmacionAbierta(false);
        cerrarRef.current();
    }, []);

    return { solicitarCierre, confirmacionAbierta, cancelarCierre, confirmarCierre, mensajeConfirmacion };
}
