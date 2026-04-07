import { useEffect, useState } from 'react';
import { UserPlus } from 'lucide-react';
import type { PaginaApp } from '@/tipos/navegacion';
import { LayoutPagina } from '@/componentes/layout/layout-pagina';
import { Boton } from '@/componentes/ui/button';
import { DialogoCrearUsuario } from '@/componentes/usuarios/dialogo-crear-usuario';
import { TablaUsuarios } from '@/componentes/usuarios/tabla-usuarios';
import { ResumenUsuarios } from '@/componentes/usuarios/resumen-usuarios';
import { listarUsuarios, type UsuarioSesion } from '@/lib/servicio-autenticacion';

interface Props {
    onNavegar: (pagina: PaginaApp) => void;
    onCerrarSesion: () => void;
}

export const Usuarios = ({ onNavegar, onCerrarSesion }: Props) => {
    const [usuarios, setUsuarios] = useState<UsuarioSesion[]>([]);
    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState('');
    const [dialogoAbierto, setDialogoAbierto] = useState(false);

    const cargarUsuarios = async () => {
        setCargando(true);
        setError('');
        try {
            const datos = await listarUsuarios();
            setUsuarios(datos);
        } catch (err: any) {
            setError(err?.message || 'No se pudo cargar la lista de usuarios.');
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => {
        void cargarUsuarios();
    }, []);

    return (
        <LayoutPagina
            paginaActiva="usuarios"
            titulo="Usuarios del sistema"
            subtitulo="Gestión de administradores y encargados de inventario"
            onNavegar={onNavegar}
            onCerrarSesion={onCerrarSesion}
        >
            <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                    El usuario inicia sesión con correo y contraseña.
                </p>
                <Boton onClick={() => setDialogoAbierto(true)} className="gap-2">
                    <UserPlus className="h-4 w-4" />
                    Nuevo usuario
                </Boton>
            </div>

            <ResumenUsuarios usuarios={usuarios} />

            {error && (
                <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
                    {error}
                </div>
            )}

            {cargando ? (
                <div className="rounded-lg border border-slate-200 bg-white p-6 text-center text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
                    Cargando usuarios...
                </div>
            ) : (
                <TablaUsuarios usuarios={usuarios} />
            )}

            <DialogoCrearUsuario
                abierto={dialogoAbierto}
                onCerrar={() => setDialogoAbierto(false)}
                onUsuarioCreado={cargarUsuarios}
            />
        </LayoutPagina>
    );
};
