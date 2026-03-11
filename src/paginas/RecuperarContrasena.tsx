import { useState } from 'react';
import { KeyRound, Eye, EyeOff, CheckCircle2, ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../componentes/ui/card';
import { Input } from '../componentes/ui/input';
import { Label } from '../componentes/ui/label';
import { Boton } from '../componentes/ui/button';

interface Props {
    onVolver: () => void;
}

export const RecuperarContrasena = ({ onVolver }: Props) => {
    const [usuario, setUsuario] = useState('');
    const [nuevaContrasena, setNuevaContrasena] = useState('');
    const [confirmarContrasena, setConfirmarContrasena] = useState('');
    const [mostrarNueva, setMostrarNueva] = useState(false);
    const [mostrarConfirmar, setMostrarConfirmar] = useState(false);
    const [error, setError] = useState('');
    const [exito, setExito] = useState(false);

    const manejarEnvio = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (usuario !== 'usfx2026') {
            setError('El usuario ingresado no existe en el sistema.');
            return;
        }
        if (nuevaContrasena.length < 4) {
            setError('La contraseña debe tener al menos 4 caracteres.');
            return;
        }
        if (nuevaContrasena !== confirmarContrasena) {
            setError('Las contraseñas no coinciden.');
            return;
        }

        setExito(true);
    };

    return (
        <div className="flex h-screen w-full items-center justify-center bg-slate-50 dark:bg-slate-900">
            <Card className="w-[450px] shadow-lg border-slate-200 dark:border-slate-800">
                <CardHeader className="space-y-1 pb-6 text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900">
                        <KeyRound className="h-8 w-8 text-amber-600 dark:text-amber-400" />
                    </div>
                    <CardTitle className="text-2xl font-bold tracking-tight">Cambiar contraseña</CardTitle>
                    <CardDescription className="text-slate-500 dark:text-slate-400">
                        Ingresa tu usuario y define una nueva contraseña
                    </CardDescription>
                </CardHeader>

                <CardContent>
                    {exito ? (
                        <div className="flex flex-col items-center gap-4 py-4 text-center">
                            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900">
                                <CheckCircle2 className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
                                Contraseña actualizada correctamente
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                Ya puedes ingresar al sistema con tu nueva contraseña.
                            </p>
                            <Boton onClick={onVolver} className="mt-2 w-full h-10">
                                Volver al inicio de sesión
                            </Boton>
                        </div>
                    ) : (
                        <form onSubmit={manejarEnvio} className="space-y-4">
                            <div className="flex flex-col space-y-2">
                                <Label htmlFor="usuario-recuperar" className="text-sm font-medium">
                                    Usuario
                                </Label>
                                <Input
                                    id="usuario-recuperar"
                                    type="text"
                                    placeholder="Ej: usfx2026"
                                    value={usuario}
                                    onChange={(e) => { setUsuario(e.target.value); setError(''); }}
                                    required
                                    className="h-10"
                                />
                            </div>

                            <div className="flex flex-col space-y-2">
                                <Label htmlFor="nueva-contrasena" className="text-sm font-medium">
                                    Nueva contraseña
                                </Label>
                                <div className="relative">
                                    <Input
                                        id="nueva-contrasena"
                                        type={mostrarNueva ? 'text' : 'password'}
                                        value={nuevaContrasena}
                                        onChange={(e) => { setNuevaContrasena(e.target.value); setError(''); }}
                                        required
                                        className="h-10 pr-10"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setMostrarNueva(!mostrarNueva)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                                    >
                                        {mostrarNueva ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                            </div>

                            <div className="flex flex-col space-y-2">
                                <Label htmlFor="confirmar-contrasena" className="text-sm font-medium">
                                    Confirmar contraseña
                                </Label>
                                <div className="relative">
                                    <Input
                                        id="confirmar-contrasena"
                                        type={mostrarConfirmar ? 'text' : 'password'}
                                        value={confirmarContrasena}
                                        onChange={(e) => { setConfirmarContrasena(e.target.value); setError(''); }}
                                        required
                                        className="h-10 pr-10"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setMostrarConfirmar(!mostrarConfirmar)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                                    >
                                        {mostrarConfirmar ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                            </div>

                            {error && (
                                <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600 dark:border-red-800 dark:bg-red-950 dark:text-red-400">
                                    {error}
                                </p>
                            )}

                            <div className="pt-2 space-y-2">
                                <Boton type="submit" className="w-full h-10">
                                    Actualizar contraseña
                                </Boton>
                                <button
                                    type="button"
                                    onClick={onVolver}
                                    className="flex w-full items-center justify-center gap-2 text-sm text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                                >
                                    <ArrowLeft className="h-3.5 w-3.5" />
                                    Volver al inicio de sesión
                                </button>
                            </div>
                        </form>
                    )}
                </CardContent>

                <CardFooter className="flex justify-center border-t border-slate-100 pt-4 pb-2 dark:border-slate-800">
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                        Sistema de Gestión de Inventario
                    </p>
                </CardFooter>
            </Card>
        </div>
    );
};
