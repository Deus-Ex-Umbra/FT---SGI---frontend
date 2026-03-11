import { X } from 'lucide-react';
import { createPortal } from 'react-dom';

interface Props {
    titulo: string;
    onCerrar: () => void;
    children: React.ReactNode;
    ancho?: string;
}

export const ModalBase = ({ titulo, onCerrar, children, ancho = 'max-w-lg' }: Props) => (
    createPortal(
        <div
            className="fixed left-0 top-0 z-[9999] h-screen w-screen flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in"
        >
            <div className={`relative w-full ${ancho} mx-4 rounded-xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900 animate-zoom-in`}>
                <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-700">
                    <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">{titulo}</h3>
                    <button
                        onClick={onCerrar}
                        className="rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
                <div className="px-5 py-4">{children}</div>
            </div>
        </div>,
        document.body
    )
);
