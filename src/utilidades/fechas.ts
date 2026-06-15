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

export const formatearFechaHora = (valor?: string | null): string => {
    if (!valor) return '-';

    const texto = String(valor).trim();
    if (!texto) return '-';

    const normalizado = texto.includes('T') ? texto : texto.replace(' ', 'T');
    const fecha = new Date(normalizado);

    if (Number.isNaN(fecha.getTime())) {
        return texto;
    }

    return new Intl.DateTimeFormat('es-BO', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    }).format(fecha);
};

export const localToApiDateTime = (valor?: string | null): string => {
    if (!valor) return '';
    const txt = String(valor).trim();
    if (!txt) return '';

    if (txt.endsWith('Z') || /[-+]\d{2}:\d{2}$/.test(txt)) {
        return txt;
    }

    const partes = txt.split('T');
    const fechaParte = partes[0];
    const horaParte = partes[1] || '00:00';

    const [anio, mes, dia] = fechaParte.split('-').map(Number);
    const [horas, minutos] = horaParte.split(':').map(Number);

    if (
        !Number.isNaN(anio) && !Number.isNaN(mes) && !Number.isNaN(dia) &&
        !Number.isNaN(horas) && !Number.isNaN(minutos)
    ) {
        const fecha = new Date(anio, mes - 1, dia, horas, minutos);
        if (!Number.isNaN(fecha.getTime())) {
            return fecha.toISOString();
        }
    }

    const fecha = new Date(txt);
    if (!Number.isNaN(fecha.getTime())) {
        return fecha.toISOString();
    }
    return txt;
};

