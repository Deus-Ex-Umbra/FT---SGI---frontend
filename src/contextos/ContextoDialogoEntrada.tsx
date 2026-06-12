import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { Boton } from '@/componentes/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/componentes/ui/dialog';
import { Input } from '@/componentes/ui/input';
import { Label } from '@/componentes/ui/label';
import { Textarea } from '@/componentes/ui/textarea';

type TipoCampoDialogoEntrada = 'text' | 'textarea';

export interface CampoDialogoEntrada {
    id: string;
    etiqueta: string;
    descripcion?: string;
    placeholder?: string;
    valorInicial?: string;
    requerido?: boolean;
    tipo?: TipoCampoDialogoEntrada;
    filas?: number;
}

export interface OpcionesDialogoEntrada {
    titulo: string;
    descripcion?: string;
    textoConfirmar?: string;
    textoCancelar?: string;
    campos: CampoDialogoEntrada[];
}

interface DialogoEntradaContextValue {
    solicitarEntrada: (opciones: OpcionesDialogoEntrada) => Promise<Record<string, string> | null>;
}

const ContextoDialogoEntrada = createContext<DialogoEntradaContextValue | null>(null);

export const useDialogoEntrada = () => {
    const ctx = useContext(ContextoDialogoEntrada);
    if (!ctx) throw new Error('useDialogoEntrada debe usarse dentro de ProveedorDialogoEntrada');
    return ctx;
};

const construirValoresIniciales = (campos: CampoDialogoEntrada[]) => (
    Object.fromEntries(campos.map((campo) => [campo.id, campo.valorInicial ?? '']))
);

export const ProveedorDialogoEntrada = ({ children }: { children: React.ReactNode }) => {
    const resolverRef = useRef<((valor: Record<string, string> | null) => void) | null>(null);
    const [abierto, setAbierto] = useState(false);
    const [opciones, setOpciones] = useState<OpcionesDialogoEntrada | null>(null);
    const [valores, setValores] = useState<Record<string, string>>({});

    useEffect(() => {
        if (!opciones) return;
        setValores(construirValoresIniciales(opciones.campos));
    }, [opciones]);

    const resolver = useCallback((valor: Record<string, string> | null) => {
        const actual = resolverRef.current;
        resolverRef.current = null;
        setAbierto(false);
        setOpciones(null);
        setValores({});
        actual?.(valor);
    }, []);

    const solicitarEntrada = useCallback((opts: OpcionesDialogoEntrada) => {
        return new Promise<Record<string, string> | null>((resolve) => {
            resolverRef.current = resolve;
            setOpciones(opts);
            setAbierto(true);
        });
    }, []);

    const camposRequeridosIncompletos = opciones?.campos.some((campo) => (
        campo.requerido && !String(valores[campo.id] ?? '').trim()
    )) ?? false;

    const manejarSubmit = useCallback((event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (camposRequeridosIncompletos) return;
        resolver({ ...valores });
    }, [camposRequeridosIncompletos, resolver, valores]);

    const value = useMemo(() => ({ solicitarEntrada }), [solicitarEntrada]);

    return (
        <ContextoDialogoEntrada.Provider value={value}>
            {children}

            <Dialog
                open={abierto}
                onOpenChange={(open) => {
                    if (!open && abierto) resolver(null);
                    setAbierto(open);
                }}
            >
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>{opciones?.titulo ?? 'Ingresar datos'}</DialogTitle>
                        {opciones?.descripcion ? <DialogDescription>{opciones.descripcion}</DialogDescription> : null}
                    </DialogHeader>

                    <form onSubmit={manejarSubmit} className="space-y-4">
                        <div className="space-y-4">
                            {opciones?.campos.map((campo) => {
                                const idCampo = `dialogo-entrada-${campo.id}`;
                                const valor = valores[campo.id] ?? '';
                                const esTextarea = campo.tipo === 'textarea';

                                return (
                                    <div key={campo.id} className="space-y-2">
                                        <Label htmlFor={idCampo}>
                                            {campo.etiqueta}
                                            {campo.requerido ? ' *' : ''}
                                        </Label>
                                        {campo.descripcion ? (
                                            <p className="text-xs text-slate-500 dark:text-slate-400">{campo.descripcion}</p>
                                        ) : null}
                                        {esTextarea ? (
                                            <Textarea
                                                id={idCampo}
                                                value={valor}
                                                rows={campo.filas ?? 4}
                                                placeholder={campo.placeholder}
                                                onChange={(event) => {
                                                    const nuevoValor = event.target.value;
                                                    setValores((previo) => ({ ...previo, [campo.id]: nuevoValor }));
                                                }}
                                            />
                                        ) : (
                                            <Input
                                                id={idCampo}
                                                value={valor}
                                                placeholder={campo.placeholder}
                                                onChange={(event) => {
                                                    const nuevoValor = event.target.value;
                                                    setValores((previo) => ({ ...previo, [campo.id]: nuevoValor }));
                                                }}
                                            />
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        <DialogFooter>
                            <Boton type="button" variant="outline" onClick={() => resolver(null)}>
                                {opciones?.textoCancelar ?? 'Cancelar'}
                            </Boton>
                            <Boton type="submit" disabled={camposRequeridosIncompletos}>
                                {opciones?.textoConfirmar ?? 'Aceptar'}
                            </Boton>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </ContextoDialogoEntrada.Provider>
    );
};