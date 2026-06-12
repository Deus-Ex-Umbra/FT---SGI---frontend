import type { RolUsuario } from '@/tipos/autenticacion';

export const obtenerSufijoRol = (rol: RolUsuario | '') => {
    if (!rol) return '';
    if (rol === 'encargado_inventario') return 'encargado';
    return rol;
};

export const construirContrasenaPorDefecto = (rol: RolUsuario | '') => {
    if (!rol) return '';
    const hoy = new Date();
    const dia = String(hoy.getDate()).padStart(2, '0');
    const mes = String(hoy.getMonth() + 1).padStart(2, '0');
    const anio = String(hoy.getFullYear());
    return `usfx-${dia}/${mes}/${anio}-${obtenerSufijoRol(rol)}`;
};


export const construirContrasenaPorFechaNacimiento = (rol: RolUsuario | '', fechaNacimiento: string) => {
    if (!rol) return '';
    const sufijo = obtenerSufijoRol(rol);
    if (fechaNacimiento) {
        const partes = fechaNacimiento.replace(/T.*$/, '').split('-');
        if (partes.length === 3) {
            const [anio, mes, dia] = partes;
            return `usfx-${dia}/${mes}/${anio}-${sufijo}`;
        }
    }
    return construirContrasenaPorDefecto(rol);
};

