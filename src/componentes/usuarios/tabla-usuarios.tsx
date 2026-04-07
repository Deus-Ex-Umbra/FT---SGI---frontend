import type { UsuarioSesion } from '@/lib/servicio-autenticacion';

interface Props {
    usuarios: UsuarioSesion[];
}

const etiquetaRol = (rol: UsuarioSesion['rol']) => {
    return rol === 'administrador' ? 'Administrador' : 'Encargado de inventario';
};

export const TablaUsuarios = ({ usuarios }: Props) => {
    return (
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
                    <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-400">
                        <tr>
                            <th className="px-4 py-3 font-semibold">ID</th>
                            <th className="px-4 py-3 font-semibold">Correo (usuario)</th>
                            <th className="px-4 py-3 font-semibold">Rol</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                        {usuarios.length === 0 && (
                            <tr>
                                <td colSpan={3} className="px-4 py-6 text-center text-slate-500 dark:text-slate-400">
                                    No hay usuarios registrados.
                                </td>
                            </tr>
                        )}
                        {usuarios.map((usuario) => (
                            <tr key={usuario.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                                <td className="px-4 py-3">{usuario.id}</td>
                                <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">{usuario.nombre_usuario}</td>
                                <td className="px-4 py-3">
                                    <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300">
                                        {etiquetaRol(usuario.rol)}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
