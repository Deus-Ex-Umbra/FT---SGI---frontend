import { FileSpreadsheet, FileText } from 'lucide-react';

interface Props {
    onExcel: () => void;
    onPdf: () => void;
}

export const BotonesAuditoria = ({ onExcel, onPdf }: Props) => (
    <>
        <button
            onClick={onExcel}
            className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
        >
            <span className="inline-flex items-center gap-1"><FileSpreadsheet className="h-3.5 w-3.5" /> Excel</span>
        </button>
        <button
            onClick={onPdf}
            className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
        >
            <span className="inline-flex items-center gap-1"><FileText className="h-3.5 w-3.5" /> PDF</span>
        </button>
    </>
);
