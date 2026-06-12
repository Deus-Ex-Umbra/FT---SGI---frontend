import { KeyRound, ShieldAlert, ShieldCheck, Mail, User, Pencil } from 'lucide-react';
import { Boton } from '@/componentes/ui/button';
import { Skeleton } from '../../ui/skeleton';
import type { UsuarioSesion } from '@/tipos/autenticacion';
import { cn } from '@/utilidades/ui';

interface Props {
    usuarios: UsuarioSesion[];
    usuarioRestableciendoId?: number | null;
    onRestablecerContrasena: (usuario: UsuarioSesion) => void;
    onToggleEstado?: (usuario: UsuarioSesion) => void;
    onEditar?: (usuario: UsuarioSesion) => void;
    cargando?: boolean;
}

const INFO_ROL: Record<UsuarioSesion['rol'], { label: string; color: string; bg: string }> = {
    administrador: { label: 'Administrador', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200 dark:bg-blue-900/30 dark:border-blue-800' },
    docente: { label: 'Docente', color: 'text-purple-700', bg: 'bg-purple-50 border-purple-200 dark:bg-purple-900/30 dark:border-purple-800' },
    estudiante: { label: 'Estudiante', color: 'text-orange-700', bg: 'bg-orange-50 border-orange-200 dark:bg-orange-900/30 dark:border-orange-800' },
    encargado_inventario: { label: 'Encargado', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/30 dark:border-emerald-800' },
};

export const TablaUsuarios = ({
    usuarios,
    usuarioRestableciendoId = null,
    onRestablecerContrasena,
    onToggleEstado,
    onEditar,
    cargando = false,
}: Props) => {
    return (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
                    <thead className="border-b border-slate-200 bg-slate-50/50 text-xs uppercase text-slate-500 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-400">
                        <tr>
                            <th className="px-6 py-4 font-semibold">Usuario / Nombre</th>
                            <th className="px-6 py-4 font-semibold">Rol</th>
                            <th className="px-6 py-4 font-semibold text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {cargando ? (
                            Array.from({ length: 5 }).map((_, idx) => (
                                <tr key={idx} className="border-b border-slate-100 dark:border-slate-800">
                                    <td className="px-6 py-4">
                                        <div className="space-y-2">
                                            <Skeleton className="h-4 w-48" />
                                            <Skeleton className="h-3.5 w-32" />
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <Skeleton className="h-5 w-20 rounded-full" />
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex gap-2 justify-end">
                                            <Skeleton className="h-8 w-20" />
                                            <Skeleton className="h-8 w-20" />
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <>
                                {usuarios.length === 0 && (
                                    <tr>
                                        <td colSpan={3} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                                            <div className="flex flex-col items-center gap-2">
                                                <User className="h-8 w-8 text-slate-300" />
                                                <p>No se encontraron usuarios con los filtros aplicados.</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                                {usuarios.map((usuario) => {
                                    const rol = INFO_ROL[usuario.rol];
                                    const nombreCompleto = [usuario.nombre, usuario.apellido].filter(Boolean).join(' ');

                                    return (
                                        <tr key={usuario.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <div className="flex items-center gap-2 font-semibold text-slate-900 dark:text-slate-100">
                                                        <Mail className="h-3.5 w-3.5 text-slate-400" />
                                                        {usuario.correo}
                                                    </div>
                                                    {nombreCompleto && (
                                                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 ml-5">
                                                            {nombreCompleto}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={cn(
                                                    "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
                                                    rol.bg,
                                                    rol.color
                                                )}>
                                                    {rol.label}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right space-x-2">
                                                {onEditar && (
                                                    <Boton
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        className="gap-1.5 h-8 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-blue-600 dark:text-blue-400 hover:text-blue-700"
                                                        onClick={() => onEditar(usuario)}
                                                    >
                                                        <Pencil className="h-3.5 w-3.5" />
                                                        <span className="hidden sm:inline">Editar</span>
                                                    </Boton>
                                                )}
                                                <Boton
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    className="gap-1.5 h-8 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                                                    disabled={usuarioRestableciendoId === usuario.id}
                                                    onClick={() => onRestablecerContrasena(usuario)}
                                                >
                                                    <KeyRound className="h-3.5 w-3.5" />
                                                    <span className="hidden sm:inline">
                                                        {usuarioRestableciendoId === usuario.id ? 'Procesando...' : 'Restablecer'}
                                                    </span>
                                                </Boton>
                                                {onToggleEstado && usuario.rol !== 'administrador' && (
                                                    <Boton
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        className={cn(
                                                            "gap-1.5 h-8 border-slate-200 dark:border-slate-700",
                                                            usuario.estado 
                                                                ? "text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/20" 
                                                                : "text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/20"
                                                        )}
                                                        onClick={() => onToggleEstado(usuario)}
                                                    >
                                                        {usuario.estado ? <ShieldAlert className="h-3.5 w-3.5" /> : <ShieldCheck className="h-3.5 w-3.5" />}
                                                        <span className="hidden sm:inline">
                                                            {usuario.estado ? 'Inhabilitar' : 'Habilitar'}
                                                        </span>
                                                    </Boton>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

