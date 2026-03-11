import { Palette, Monitor, Sun, Moon } from 'lucide-react';
import { type PaginaApp } from '../componentes/inventario/MenuLateral';
import { LayoutPagina } from '../componentes/layout/LayoutPagina';
import type { Tema, Acento } from '../App';

interface Props {
    onNavegar: (pagina: PaginaApp) => void;
    onCerrarSesion: () => void;
    temaActivo: Tema;
    onCambiarTema: (tema: Tema) => void;
    acentoActivo: Acento;
    onCambiarAcento: (acento: Acento) => void;
}

interface OpcionTema {
    id: Tema;
    icono: React.ElementType;
    etiqueta: string;
    descripcion: string;
}

const opcionesTema: OpcionTema[] = [
    { id: 'claro', icono: Sun, etiqueta: 'Claro', descripcion: 'Interfaz en modo claro' },
    { id: 'oscuro', icono: Moon, etiqueta: 'Oscuro', descripcion: 'Interfaz en modo oscuro' },
    { id: 'sistema', icono: Monitor, etiqueta: 'Sistema', descripcion: 'Sigue la preferencia del sistema operativo' },
];

const opcionesAcento: { id: Acento; etiqueta: string; colorClass: string }[] = [
    { id: 'rojo', etiqueta: 'Rojo', colorClass: 'bg-red-500' },
    { id: 'naranja', etiqueta: 'Naranja', colorClass: 'bg-orange-500' },
    { id: 'ambar', etiqueta: 'Ámbar', colorClass: 'bg-amber-500' },
    { id: 'amarillo', etiqueta: 'Amarillo', colorClass: 'bg-yellow-400' },
    { id: 'lima', etiqueta: 'Lima', colorClass: 'bg-lime-500' },
    { id: 'esmeralda', etiqueta: 'Esmeralda', colorClass: 'bg-emerald-500' },
    { id: 'cian', etiqueta: 'Cian', colorClass: 'bg-cyan-500' },
    { id: 'azul', etiqueta: 'Azul', colorClass: 'bg-blue-500' },
    { id: 'purpura', etiqueta: 'Púrpura', colorClass: 'bg-purple-500' },
    { id: 'violeta', etiqueta: 'Violeta', colorClass: 'bg-violet-500' },
    { id: 'rosa', etiqueta: 'Rosa', colorClass: 'bg-pink-500' },
];

export const Configuracion = ({ onNavegar, onCerrarSesion, temaActivo, onCambiarTema, acentoActivo, onCambiarAcento }: Props) => (
    <LayoutPagina
        paginaActiva="configuracion"
        titulo="Configuración"
        subtitulo="Ajustes generales del sistema"
        onNavegar={onNavegar}
        onCerrarSesion={onCerrarSesion}
    >
        <div className="rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-2 border-b border-slate-200 px-4 py-3 dark:border-slate-800">
                <Palette className="h-4 w-4 text-slate-500" />
                <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Temas</h2>
            </div>

            <div className="p-4">
                <p className="mb-4 text-xs text-slate-500 dark:text-slate-400">
                    Selecciona el tema visual de la interfaz del sistema.
                </p>
                <div className="grid grid-cols-3 gap-3">
                    {opcionesTema.map(({ id, icono: Icono, etiqueta, descripcion }) => {
                        const estaActivo = temaActivo === id;
                        return (
                            <button
                                key={id}
                                onClick={() => onCambiarTema(id)}
                                className={`flex flex-col items-center gap-3 rounded-lg border-2 p-4 text-center transition-all ${estaActivo
                                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                                    : 'border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-slate-600'
                                    }`}
                            >
                                <div className={`flex h-10 w-10 items-center justify-center rounded-full ${estaActivo ? 'bg-blue-100 dark:bg-blue-900' : 'bg-white dark:bg-slate-700'
                                    }`}>
                                    <Icono className={`h-5 w-5 ${estaActivo ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400'}`} />
                                </div>
                                <div>
                                    <p className={`text-sm font-semibold ${estaActivo ? 'text-blue-700 dark:text-blue-300' : 'text-slate-700 dark:text-slate-300'}`}>
                                        {etiqueta}
                                    </p>
                                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{descripcion}</p>
                                </div>
                                {estaActivo && (
                                    <span className="rounded-full bg-blue-500 px-2 py-0.5 text-[10px] font-semibold text-white">
                                        Activo
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 mt-5">
            <div className="flex items-center gap-2 border-b border-slate-200 px-4 py-3 dark:border-slate-800">
                <Palette className="h-4 w-4 text-slate-500" />
                <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Color de Acento</h2>
            </div>

            <div className="p-4">
                <p className="mb-4 text-xs text-slate-500 dark:text-slate-400">
                    Personaliza el color principal del sistema.
                </p>
                <div className="flex flex-wrap gap-4">
                    {opcionesAcento.map(({ id, etiqueta, colorClass }) => {
                        const estaActivo = acentoActivo === id;
                        return (
                            <button
                                key={id}
                                onClick={() => onCambiarAcento(id)}
                                className={`group flex flex-col items-center gap-2 rounded-lg border-2 p-3 w-24 text-center transition-all ${estaActivo
                                    ? 'border-blue-500 bg-slate-50 dark:border-slate-600 dark:bg-slate-800'
                                    : 'border-transparent bg-transparent hover:bg-slate-50 dark:hover:bg-slate-800'
                                    }`}
                            >
                                <div className={`h-8 w-8 rounded-full ${colorClass} ${estaActivo ? 'ring-2 ring-blue-500 ring-offset-2 dark:ring-slate-400 dark:ring-offset-slate-900' : 'group-hover:scale-110 transition-transform'}`} />
                                <span className={`text-xs font-medium ${estaActivo ? 'text-slate-800 dark:text-slate-200' : 'text-slate-500 dark:text-slate-400'}`}>
                                    {etiqueta}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    </LayoutPagina>
);
