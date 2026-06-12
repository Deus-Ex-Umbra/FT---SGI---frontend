import { X } from 'lucide-react';
import { createPortal } from 'react-dom';

interface Props {
    titulo: string;
    onCerrar: () => void;
    children: React.ReactNode;
    footer?: React.ReactNode;
    ancho?: string;
    fixedHeader?: boolean;
    dialogClassName?: string;
    bodyClassName?: string;
}

export const ModalBase = ({ titulo, onCerrar, children, footer, ancho = 'max-w-lg', fixedHeader = false, dialogClassName = '', bodyClassName = '' }: Props) => (
    createPortal(
        <div
            className="fixed inset-0 z-[9999] flex h-screen w-screen items-center justify-center bg-black/55 p-2 backdrop-blur-[2px] sm:p-4"
        >
            <div className={`relative flex max-h-full w-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900 animate-zoom-in ${ancho} ${dialogClassName}`}>
                <div className={`flex shrink-0 items-center justify-between border-b border-slate-200 bg-white px-5 py-3.5 dark:border-slate-700 dark:bg-slate-900 ${fixedHeader ? 'absolute inset-x-0 top-0 z-20' : ''}`}>
                    <h3 className="text-[15px] font-semibold text-slate-800 dark:text-slate-100">{titulo}</h3>
                    <button
                        onClick={onCerrar}
                        className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
                <div className={`scroll-elegante relative min-h-0 flex-1 overflow-x-hidden overflow-y-auto ${bodyClassName.includes('p-0') ? bodyClassName : `px-5 py-5 ${bodyClassName}`}`}>{children}</div>
                {footer ? (
                    <div className="relative z-20 shrink-0 border-t border-slate-200 bg-white px-5 py-3.5 dark:border-slate-700 dark:bg-slate-900">
                        {footer}
                    </div>
                ) : null}
            </div>
        </div>,
        document.body
    )
);
