import type { PaginaApp } from '@/tipos/navegacion';
import type { Tema } from '@/tipos/tema';
import type { UsuarioSesion } from '@/tipos/autenticacion';

export interface PropsPaginaBase {
    onNavegar: (pagina: PaginaApp) => void;
    onCerrarSesion: () => void;
}

export interface PropsPaginaConfiguracion extends PropsPaginaBase {
    temaActivo: Tema;
    onCambiarTema: (tema: Tema) => void;
}

export interface PropsPaginaVolver {
    onVolver: () => void;
}

export interface PropsPaginaInicioSesion {
    onAcceso: (usuario: UsuarioSesion) => void;
    onRecuperar: () => void;
}