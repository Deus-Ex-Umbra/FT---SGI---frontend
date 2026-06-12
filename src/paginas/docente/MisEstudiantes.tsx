import type { ComponentProps } from 'react';
import { Docentes } from '../compartidas';

type Props = Omit<ComponentProps<typeof Docentes>, 'vistaDocente'>;

export const MisEstudiantes = (props: Props) => {
    return <Docentes {...props} vistaDocente="estudiantes" />;
};