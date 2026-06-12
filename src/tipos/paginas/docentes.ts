import type { ReactNode } from 'react';
import type { PropsPaginaBase } from './compartido';

export interface PropsPaginaDocentes extends PropsPaginaBase {
    vistaDocente?: 'estudiantes' | 'materias';
    botonExtra?: ReactNode;
}