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
