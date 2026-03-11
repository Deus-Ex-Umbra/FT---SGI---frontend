const pad2 = (n: number): string => String(n).padStart(2, '0');

export const aInputDateTimeLocal = (fecha: Date): string => {
    const y = fecha.getFullYear();
    const m = pad2(fecha.getMonth() + 1);
    const d = pad2(fecha.getDate());
    const h = pad2(fecha.getHours());
    const mm = pad2(fecha.getMinutes());
    return `${y}-${m}-${d}T${h}:${mm}`;
};

export const ahoraInputLocal = (): string => aInputDateTimeLocal(new Date());

export const sumarHorasInputLocal = (baseInputLocal: string, horas: number): string => {
    const base = new Date(baseInputLocal);
    if (Number.isNaN(base.getTime())) return ahoraInputLocal();
    base.setHours(base.getHours() + horas);
    return aInputDateTimeLocal(base);
};

export const apiDateTimeAInputLocal = (valor?: string | null): string => {
    if (!valor) return '';
    const txt = String(valor).trim();
    if (!txt) return '';

    const normalizado = txt.includes(' ') && !txt.includes('T') ? txt.replace(' ', 'T') : txt;
    const fecha = new Date(normalizado);
    if (Number.isNaN(fecha.getTime())) {
        if (normalizado.includes('T')) return normalizado.slice(0, 16);
        return `${normalizado}T00:00`.slice(0, 16);
    }

    return aInputDateTimeLocal(fecha);
};
