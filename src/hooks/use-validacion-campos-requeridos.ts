import { useCallback, useState } from 'react';
import { toast } from 'sonner';

export type CampoRequerido = {
  id: string;
  etiqueta: string;
  valido: boolean;
};

const ESTILO_RESALTADO_AMARILLO =
  'border-yellow-300 ring-2 ring-yellow-200 shadow-[0_0_0_3px_rgba(253,224,71,0.18)] transition-all duration-200';

export function useValidacionCamposRequeridos() {
  const [camposResaltados, setCamposResaltados] = useState<Set<string>>(new Set());

  const limpiarCampoResaltado = useCallback((id: string) => {
    setCamposResaltados((prev) => {
      if (!prev.has(id)) return prev;
      const siguiente = new Set(prev);
      siguiente.delete(id);
      return siguiente;
    });
  }, []);

  const validarCampos = useCallback((campos: CampoRequerido[], accion?: string): boolean => {
    const faltantes = campos.filter((campo) => !campo.valido);
    if (faltantes.length === 0) return true;

    setCamposResaltados(new Set(faltantes.map((campo) => campo.id)));

    const etiquetas = faltantes.map((campo) => campo.etiqueta).join(', ');
    toast.error('Faltan datos obligatorios', {
      description: accion
        ? `Para ${accion}, completa: ${etiquetas}.`
        : `Completa los siguientes datos: ${etiquetas}.`,
      duration: 5000,
    });

    return false;
  }, []);

  const claseCampoResaltado = useCallback(
    (id: string) => (camposResaltados.has(id) ? ESTILO_RESALTADO_AMARILLO : ''),
    [camposResaltados],
  );

  return {
    validarCampos,
    limpiarCampoResaltado,
    claseCampoResaltado,
  };
}

export default useValidacionCamposRequeridos;
