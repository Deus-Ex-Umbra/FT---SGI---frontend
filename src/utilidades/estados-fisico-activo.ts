import type { EstadoFisicoItemActivo } from '@/tipos/inventario';

export const ESTADOS_FISICOS_ITEM: EstadoFisicoItemActivo[] = ['bueno', 'regular', 'malo'];

const ALIAS: Record<string, EstadoFisicoItemActivo> = {
    bueno: 'bueno',
    bien: 'bueno',
    regular: 'regular',
    malo: 'malo',
    mal: 'malo',
};

export const normalizarEstadoFisicoItem = (estado?: string | null): EstadoFisicoItemActivo | null => {
    const limpio = String(estado ?? '').trim().toLowerCase();
    if (!limpio) return null;
    return ALIAS[limpio] ?? (ESTADOS_FISICOS_ITEM.includes(limpio as any) ? (limpio as EstadoFisicoItemActivo) : null);
};

export const etiquetaEstadoFisicoItem = (estado?: string | null): string => {
    const canonico = normalizarEstadoFisicoItem(estado);
    if (!canonico) return String(estado ?? '').trim() || '—';
    if (canonico === 'bueno') return 'Bueno';
    if (canonico === 'regular') return 'Regular';
    return 'Malo';
};
