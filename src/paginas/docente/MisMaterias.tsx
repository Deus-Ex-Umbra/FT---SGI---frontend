import type { ComponentProps } from 'react';
import { Docentes } from '../compartidas';

type Props = Omit<ComponentProps<typeof Docentes>, 'vistaDocente'>;

export const MisMaterias = (props: Props) => {
    return <Docentes {...props} vistaDocente="materias" />;
};