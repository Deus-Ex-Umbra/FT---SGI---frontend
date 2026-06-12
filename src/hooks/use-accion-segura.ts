import { useState, useCallback, useRef, useEffect } from 'react';
import { toast } from 'sonner';

export interface UseAccionSeguraOptions<TArgs extends any[], TReturn> {
  accion: (...args: TArgs) => Promise<TReturn>;
  mensajeExito?: string | ((resultado: TReturn) => string);
  mensajeError?: string | ((error: any) => string);
  alExito?: (resultado: TReturn) => void;
  alError?: (error: any) => void;
  alFinalizar?: () => void;
  mostrarErroresPorDefecto?: boolean;
}

export function useAccionSegura<TArgs extends any[], TReturn>(
  options: UseAccionSeguraOptions<TArgs, TReturn>
) {
  const [estaEjecutando, setEstaEjecutando] = useState(false);
  const estaEjecutandoRef = useRef(false);
  const optionsRef = useRef(options);
  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  const ejecutar = useCallback(async (...args: TArgs) => {
    if (estaEjecutandoRef.current) return;

    estaEjecutandoRef.current = true;
    setEstaEjecutando(true);

    const currentOptions = optionsRef.current;

    try {
      const resultado = await currentOptions.accion(...args);

      if (currentOptions.mensajeExito) {
        toast.success(
          typeof currentOptions.mensajeExito === 'function'
            ? currentOptions.mensajeExito(resultado)
            : currentOptions.mensajeExito
        );
      }

      currentOptions.alExito?.(resultado);
      return resultado;
    } catch (error: any) {
      if (currentOptions.mensajeError) {
        toast.error(
          typeof currentOptions.mensajeError === 'function'
            ? currentOptions.mensajeError(error)
            : currentOptions.mensajeError
        );
      } else if (currentOptions.mostrarErroresPorDefecto !== false) {
        toast.error(
          error instanceof Error
            ? error.message
            : 'Ocurrió un error inesperado al realizar la acción.'
        );
      }

      currentOptions.alError?.(error);
      throw error;
    } finally {
      estaEjecutandoRef.current = false;
      setEstaEjecutando(false);
      currentOptions.alFinalizar?.();
    }
  }, []);

  return { ejecutar, estaEjecutando };
}
