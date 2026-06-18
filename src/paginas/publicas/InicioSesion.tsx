import { useState } from 'react';
import { Boton } from '@/componentes/ui/button';
import { Input } from '@/componentes/ui/input';
import { Label } from '@/componentes/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/componentes/ui/card';
import { LogIn, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { iniciarSesion } from '@/lib/servicio-autenticacion';
import type { UsuarioSesion } from '@/tipos/autenticacion';
import type { PropsPaginaInicioSesion } from '@/tipos/paginas';

export const InicioSesion = ({ onAcceso, onRecuperar }: PropsPaginaInicioSesion) => {
    const [usuario, setUsuario] = useState('');
    const [contrasena, setContrasena] = useState('');
    const [mostrarContrasena, setMostrarContrasena] = useState(false);
    const [errorTexto, setErrorTexto] = useState('');
    const [cargando, setCargando] = useState(false);

    const manejarEnvio = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorTexto('');
        setCargando(true);
        try {
            const datos = await iniciarSesion(usuario, contrasena);
            console.log('Ingreso exitoso:', datos.usuario.rol);
            onAcceso(datos.usuario as UsuarioSesion);
        } catch (error: any) {
            setErrorTexto(error.message);
        } finally {
            setCargando(false);
        }
    };

    return (
        <div className="flex h-screen w-full items-center justify-center bg-slate-50 dark:bg-slate-900">
            <Card className="w-[450px] shadow-lg border-slate-200 dark:border-slate-800">
                <CardHeader className="space-y-1 pb-6 text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
                        <LogIn className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                    </div>
                    <CardTitle className="text-2xl font-bold tracking-tight">Bienvenido de vuelta</CardTitle>
                    <CardDescription className="text-slate-500 dark:text-slate-400">
                        Ingresa tus credenciales para acceder al sistema
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={manejarEnvio} className="space-y-4">
                        <div className="flex flex-col items-center space-y-2 w-full">
                            <Label htmlFor="usuario" className="text-sm font-medium">Correo Electrónico</Label>
                            <Input
                                id="usuario"
                                type="text"
                                value={usuario}
                                onChange={(e) => { setUsuario(e.target.value); setErrorTexto(''); }}
                                required
                                className={`h-11 text-center ${errorTexto ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                            />
                        </div>
                        <div className="flex flex-col items-center space-y-2 w-full">
                            <Label htmlFor="contrasena" className="text-sm font-medium">Contraseña</Label>
                            <div className="relative w-full">
                                <Input
                                    id="contrasena"
                                    type={mostrarContrasena ? "text" : "password"}
                                    value={contrasena}
                                    onChange={(e) => { setContrasena(e.target.value); setErrorTexto(''); }}
                                    required
                                    className={`h-11 pr-10 text-center w-full ${errorTexto ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                                />
                                <button
                                    type="button"
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                                    onClick={() => setMostrarContrasena(!mostrarContrasena)}
                                >
                                    {mostrarContrasena ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                </button>
                            </div>
                        </div>

                        {errorTexto && (
                            <div className="flex items-center gap-2 rounded-md bg-red-50 border border-red-200 px-3 py-2 dark:bg-red-950 dark:border-red-800">
                                <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                                <p className="text-sm text-red-600 dark:text-red-400">{errorTexto}</p>
                            </div>
                        )}

                        <div className="pt-2 flex flex-col items-center space-y-4">
                            <Boton type="submit" disabled={cargando} className="w-full h-11 text-base font-medium">
                                {cargando ? 'Ingresando...' : 'Iniciar sesión'}
                            </Boton>

                            <button
                                type="button"
                                onClick={onRecuperar}
                                className="text-sm font-medium text-slate-600 hover:text-blue-600 hover:underline dark:text-slate-400 dark:hover:text-blue-400"
                            >
                                ¿Olvidaste la contraseña?
                            </button>
                        </div>
                    </form>
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
