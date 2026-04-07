import { ShieldCheck, UserCog } from 'lucide-react';
import type { UsuarioSesion } from '@/lib/servicio-autenticacion';

interface Props {
    usuarios: UsuarioSesion[];
}

export const ResumenUsuarios = ({ usuarios }: Props) => {
    const totalAdministradores = usuarios.filter((usuario) => usuario.rol === 'administrador').length;
    const totalEncargados = usuarios.filter((usuario) => usuario.rol === 'encargado_inventario').length;

    return (
        <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
                    <ShieldCheck className="h-4 w-4 text-blue-500" />
                    Administradores
                </div>
                <p className="mt-2 text-2xl font-black text-slate-900 dark:text-slate-100">{totalAdministradores}</p>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
                    <UserCog className="h-4 w-4 text-emerald-500" />
                    Encargados de inventario
                </div>
                <p className="mt-2 text-2xl font-black text-slate-900 dark:text-slate-100">{totalEncargados}</p>
            </div>
        </div>
    );
};
