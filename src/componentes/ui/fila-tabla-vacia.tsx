interface Props {
    colSpan: number;
    mensaje: string;
    className?: string;
}

export const FilaTablaVaciaUi = ({ colSpan, mensaje, className }: Props) => {
    return (
        <tr>
            <td colSpan={colSpan} className={`px-4 py-4 text-center text-slate-500 dark:text-slate-400 ${className ?? ''}`.trim()}>
                {mensaje}
            </td>
        </tr>
    );
};