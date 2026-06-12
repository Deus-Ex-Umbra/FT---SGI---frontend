import { UserCog, GraduationCap, Users, BookOpen } from 'lucide-react';
import type { UsuarioSesion } from '@/tipos/autenticacion';
import { cn } from '@/utilidades/ui';
import { Skeleton } from '@/componentes/ui/skeleton';

interface Props {
    usuarios: UsuarioSesion[];
    filtroRol: string;
    onSelectRol: (rol: string) => void;
    className?: string;
    cargando?: boolean;
}

export const ResumenUsuarios = ({
    usuarios,
    filtroRol,
    onSelectRol,
    className,
    cargando = false,
}: Props) => {
    const stats = [
        {
            value: 'todos',
            label: 'Todos',
            valueCount: usuarios.length,
            icon: Users,
            color: 'text-blue-600 dark:text-blue-400',
            bg: 'bg-blue-500/10 dark:bg-blue-500/20',
            activeBg: 'bg-blue-50/80 border-blue-200 dark:bg-blue-950/30 dark:border-blue-900 ring-2 ring-blue-500/15',
        },
        {
            value: 'encargado_inventario',
            label: 'Encargados',
            valueCount: usuarios.filter((u) => u.rol === 'encargado_inventario').length,
            icon: UserCog,
            color: 'text-emerald-600 dark:text-emerald-400',
            bg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
            activeBg: 'bg-emerald-50/80 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-900 ring-2 ring-emerald-500/15',
        },
        {
            value: 'docente',
            label: 'Docentes',
            valueCount: usuarios.filter((u) => u.rol === 'docente').length,
            icon: GraduationCap,
            color: 'text-purple-600 dark:text-purple-400',
            bg: 'bg-purple-500/10 dark:bg-purple-500/20',
            activeBg: 'bg-purple-50/80 border-purple-200 dark:bg-purple-950/30 dark:border-purple-900 ring-2 ring-purple-500/15',
        },
        {
            value: 'estudiante',
            label: 'Estudiantes',
            valueCount: usuarios.filter((u) => u.rol === 'estudiante').length,
            icon: BookOpen,
            color: 'text-orange-600 dark:text-orange-400',
            bg: 'bg-orange-500/10 dark:bg-orange-500/20',
            activeBg: 'bg-orange-50/80 border-orange-200 dark:bg-orange-950/30 dark:border-orange-900 ring-2 ring-orange-500/15',
        },
    ];

    return (
        <div className={cn("flex flex-wrap items-center gap-2", className)}>
            {stats.map((stat) => {
                const isActive = filtroRol === stat.value;
                return (
                    <button
                        key={stat.value}
                        type="button"
                        onClick={() => onSelectRol(stat.value)}
                        className={cn(
                            "flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all text-left outline-none",
                            isActive
                                ? stat.activeBg
                                : "bg-slate-50 border-slate-100 dark:bg-slate-800/40 dark:border-slate-800/80 hover:bg-slate-100/70 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-300"
                        )}
                    >
                        <div className={cn("p-1.5 rounded-full shrink-0", stat.bg)}>
                            <stat.icon className={cn("h-3.5 w-3.5", stat.color)} />
                        </div>
                        <div className="flex flex-col -space-y-1 pr-1">
                            <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider leading-none">
                                {stat.label}
                            </span>
                            {cargando ? (
                                <Skeleton className="h-4 w-6 mt-0.5" />
                            ) : (
                                <span className={cn(
                                    "text-sm font-bold leading-none mt-0.5",
                                    isActive ? "text-slate-900 dark:text-white" : "text-slate-800 dark:text-slate-200"
                                )}>
                                    {stat.valueCount}
                                </span>
                            )}
                        </div>
                    </button>
                );
            })}
        </div>
    );
};

