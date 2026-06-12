import type { EstadoItemActivoCanonico } from '@/tipos/activos';

export const ESTADOS_ITEM_ACTIVO: EstadoItemActivoCanonico[] = [
    'disponible',
    'en_prestamo',
    'en_mantenimiento',
    'extraviado',
    'dado_de_baja',
];

const ESTADO_ALIAS: Record<string, EstadoItemActivoCanonico> = {
    disponible: 'disponible',
    en_prestamo: 'en_prestamo',
    en_mantenimiento: 'en_mantenimiento',
    extraviado: 'extraviado',
    dado_de_baja: 'dado_de_baja',
    en_revision: 'en_mantenimiento',
    'en prestamo': 'en_prestamo',
    'en préstamo': 'en_prestamo',
    revision: 'en_mantenimiento',
    'en revision': 'en_mantenimiento',
    'en revisión': 'en_mantenimiento',
    mantenimiento: 'en_mantenimiento',
    perdido: 'extraviado',
    perdida: 'extraviado',
    buen_estado: 'disponible',
    regular: 'disponible',
    danado: 'en_mantenimiento',
    dañado: 'en_mantenimiento',
};

export const ETIQUETAS_ESTADO_ITEM: Record<EstadoItemActivoCanonico, string> = {
    disponible: 'Disponible',
    en_prestamo: 'En préstamo',
    en_mantenimiento: 'En mantenimiento',
    extraviado: 'Extraviado',
    dado_de_baja: 'Dado de baja',
};

export const normalizarEstadoItem = (estado?: string | null): EstadoItemActivoCanonico | null => {
    const limpio = String(estado ?? '').trim().toLowerCase();
    if (!limpio) return null;
    return ESTADO_ALIAS[limpio] ?? null;
};

export const etiquetaEstadoItem = (estado?: string | null): string => {
    const canonico = normalizarEstadoItem(estado);
    if (!canonico) return String(estado ?? '').trim() || '—';
    return ETIQUETAS_ESTADO_ITEM[canonico];
};
