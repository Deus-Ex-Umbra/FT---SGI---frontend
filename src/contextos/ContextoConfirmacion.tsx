import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/componentes/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/componentes/ui/alert-dialog';

type VarianteBoton = NonNullable<Parameters<typeof buttonVariants>[0]>['variant'];

export interface OpcionesConfirmacion {
  titulo: string;
  descripcion?: string;
  textoConfirmar?: string;
  textoCancelar?: string;
  varianteConfirmar?: VarianteBoton;
}

interface ContextoConfirmacionTipo {
  confirmar: (opciones: OpcionesConfirmacion) => Promise<boolean>;
}

const ContextoConfirmacion = createContext<ContextoConfirmacionTipo | null>(null);

export const useConfirmacion = () => {
  const ctx = useContext(ContextoConfirmacion);
  if (!ctx) throw new Error('useConfirmacion debe usarse dentro de ProveedorConfirmacion');
  return ctx;
};

export const ProveedorConfirmacion = ({ children }: { children: React.ReactNode }) => {
  const resolverRef = useRef<((valor: boolean) => void) | null>(null);
  const [abierto, setAbierto] = useState(false);
  const [opciones, setOpciones] = useState<OpcionesConfirmacion | null>(null);

  const resolver = useCallback((valor: boolean) => {
    const r = resolverRef.current;
    resolverRef.current = null;
    setAbierto(false);
    setOpciones(null);
    r?.(valor);
  }, []);

  const confirmar = useCallback((opts: OpcionesConfirmacion) => {
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve;
      setOpciones(opts);
      setAbierto(true);
    });
  }, []);

  const value = useMemo(() => ({ confirmar }), [confirmar]);

  return (
    <ContextoConfirmacion.Provider value={value}>
      {children}

      <AlertDialog
        open={abierto}
        onOpenChange={(open) => {
          // Si se cierra desde fuera (ESC/click overlay), equivale a cancelar.
          if (!open && abierto) resolver(false);
          setAbierto(open);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{opciones?.titulo ?? 'Confirmación'}</AlertDialogTitle>
            {opciones?.descripcion ? <AlertDialogDescription>{opciones.descripcion}</AlertDialogDescription> : null}
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => resolver(false)}>
              {opciones?.textoCancelar ?? 'Cancelar'}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => resolver(true)}
              className={cn(buttonVariants({ variant: opciones?.varianteConfirmar ?? 'default' }))}
            >
              {opciones?.textoConfirmar ?? 'Confirmar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ContextoConfirmacion.Provider>
  );
};
