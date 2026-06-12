import { CheckCircle2, ShieldAlert, AlertCircle, Loader2 } from 'lucide-react';

export type EstadoAccion = 'cargando' | 'exito' | 'expirado' | 'error';

interface Props {
  estado: EstadoAccion;
  titulo?: string;
  descripcion?: string | React.ReactNode;
  children?: React.ReactNode;
}

export const EstadoAccionPublica = ({ estado, titulo, descripcion, children }: Props) => {
  const configs = {
    cargando: {
      icono: <Loader2 className="h-10 w-10 animate-spin text-indigo-500" />,
      colorFondo: 'bg-indigo-500/5 dark:bg-indigo-500/10',
      colorBorde: 'border-indigo-200/50 dark:border-indigo-800/30',
      tituloPredeterminado: 'Cargando información',
    },
    exito: {
      icono: <CheckCircle2 className="h-10 w-10 text-emerald-500 animate-in zoom-in-50 duration-300" />,
      colorFondo: 'bg-emerald-500/5 dark:bg-emerald-500/10',
      colorBorde: 'border-emerald-200/50 dark:border-emerald-800/30',
      tituloPredeterminado: '¡Operación exitosa!',
    },
    expirado: {
      icono: <ShieldAlert className="h-10 w-10 text-amber-500 animate-in shake duration-300" />,
      colorFondo: 'bg-amber-500/5 dark:bg-amber-500/10',
      colorBorde: 'border-amber-200/50 dark:border-amber-800/30',
      tituloPredeterminado: 'Enlace expirado o inválido',
    },
    error: {
      icono: <AlertCircle className="h-10 w-10 text-rose-500 animate-in shake duration-300" />,
      colorFondo: 'bg-rose-500/5 dark:bg-rose-500/10',
      colorBorde: 'border-rose-200/50 dark:border-rose-800/30',
      tituloPredeterminado: 'Ha ocurrido un error',
    },
  };

  const actual = configs[estado];

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border ${actual.colorBorde} ${actual.colorFondo} p-6 shadow-xl backdrop-blur-md transition-all duration-300 hover:shadow-2xl dark:bg-slate-900/40`}
    >
      <div className="absolute -right-16 -top-16 h-32 w-32 rounded-full bg-current opacity-5 blur-3xl transition-all duration-500" />
      <div className="flex flex-col items-center text-center">
        <div className="mb-4 rounded-full bg-white p-3 shadow-md dark:bg-slate-800">
          {actual.icono}
        </div>
        
        <h2 className="text-lg font-bold tracking-tight text-slate-800 dark:text-slate-100">
          {titulo || actual.tituloPredeterminado}
        </h2>
        
        {descripcion && (
          <div className="mt-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
            {descripcion}
          </div>
        )}

        {children && <div className="mt-5 w-full">{children}</div>}
      </div>
    </div>
  );
};
