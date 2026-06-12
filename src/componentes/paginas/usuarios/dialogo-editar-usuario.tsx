import { useEffect, useMemo, useState } from 'react';
import { Save } from 'lucide-react';
import { Boton } from '@/componentes/ui/button';
import { Input } from '@/componentes/ui/input';
import { Label } from '@/componentes/ui/label';
import { ModalBase } from '@/componentes/paginas/inventario/modal-base';
import { DatePicker } from '@/componentes/ui/date-picker';
import type { UsuarioSesion } from '@/tipos/autenticacion';
import { editarUsuario } from '@/lib/servicio-administrador';
import { useCierreSeguro } from '@/hooks/use-cierre-seguro';
import { toast } from 'sonner';

interface Props {
    abierto: boolean;
    onCerrar: () => void;
    usuario: UsuarioSesion | null;
    onUsuarioEditado: () => Promise<void>;
}

const Campo = ({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) => (
    <div className="flex flex-col gap-1.5">
        <Label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
            {label}{required && <span className="ml-0.5 text-red-500">*</span>}
        </Label>
        {children}
    </div>
);

export const DialogoEditarUsuario = ({ abierto, onCerrar, usuario, onUsuarioEditado }: Props) => {
    const [correo, setCorreo] = useState('');
    const [nombre, setNombre] = useState('');
    const [apellido, setApellido] = useState('');
    const [ci, setCi] = useState('');
    const [codigoDocente, setCodigoDocente] = useState('');
    const [fechaNacimiento, setFechaNacimiento] = useState('');

    const [guardando, setGuardando] = useState(false);
    const [error, setError] = useState('');
    useEffect(() => {
        if (usuario) {
            setCorreo(usuario.correo || '');
            setNombre(usuario.nombre || '');
            setApellido(usuario.apellido || '');
            
            const usuarioAny = usuario as any;
            setCi(usuarioAny.ci || usuarioAny.carnet || '');
            setCodigoDocente(usuarioAny.codigo || '');
            
            let fechaStr = '';
            if (usuarioAny.fechaNacimiento) {
                const dateVal = usuarioAny.fechaNacimiento;
                if (typeof dateVal === 'string') {
                    fechaStr = dateVal.split('T')[0];
                }
            }
            setFechaNacimiento(fechaStr);
            setError('');
        }
    }, [usuario, abierto]);

    const esRolEstudiante = usuario?.rol === 'estudiante';
    const esRolDocente = usuario?.rol === 'docente';
    const esRolEncargado = usuario?.rol === 'encargado_inventario';

    const limpiar = () => {
        setCorreo('');
        setNombre('');
        setApellido('');
        setCi('');
        setCodigoDocente('');
        setFechaNacimiento('');
        setError('');
    };

    const cerrarSinConfirmar = () => {
        limpiar();
        onCerrar();
    };
    const estaSucio = useMemo(() => {
        if (!usuario) return false;
        const usuarioAny = usuario as any;
        const orgCorreo = usuario.correo || '';
        const orgNombre = usuario.nombre || '';
        const orgApellido = usuario.apellido || '';
        const orgCi = usuarioAny.ci || usuarioAny.carnet || '';
        const orgCodigo = usuarioAny.codigo || '';
        let orgFecha = '';
        if (usuarioAny.fechaNacimiento) {
            orgFecha = typeof usuarioAny.fechaNacimiento === 'string' 
                ? usuarioAny.fechaNacimiento.split('T')[0] 
                : '';
        }

        return Boolean(
            correo.trim() !== orgCorreo ||
            nombre.trim() !== orgNombre ||
            apellido.trim() !== orgApellido ||
            ci.trim() !== orgCi ||
            codigoDocente.trim() !== orgCodigo ||
            fechaNacimiento !== orgFecha
        );
    }, [usuario, correo, nombre, apellido, ci, codigoDocente, fechaNacimiento]);

    const {
        solicitarCierre,
        confirmacionAbierta,
        cancelarCierre,
        confirmarCierre,
        mensajeConfirmacion,
    } = useCierreSeguro({
        estaSucio,
        estaCargando: guardando,
        alCerrar: cerrarSinConfirmar,
        mensajeConfirmacion: 'Hay cambios sin guardar. ¿Deseas cerrar y descartar los cambios?',
    });

    const enviar = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!usuario) return;
        setError('');

        const correoNorm = correo.trim().toLowerCase();
        if (!correoNorm && !esRolEstudiante) {
            setError('El correo electrónico es obligatorio.');
            return;
        }

        const payload: any = {
            correo: correoNorm || undefined,
        };

        if (esRolEncargado) {
            if (!nombre.trim()) {
                setError('El nombre es obligatorio.');
                return;
            }
            payload.nombre = nombre.trim();
            payload.apellido = apellido.trim() || undefined;
        }

        if (esRolDocente) {
            if (!nombre.trim()) {
                setError('El nombre es obligatorio.');
                return;
            }
            if (!apellido.trim()) {
                setError('El apellido es obligatorio.');
                return;
            }
            if (!ci.trim()) {
                setError('El CI es obligatorio.');
                return;
            }
            payload.nombre = nombre.trim();
            payload.apellido = apellido.trim();
            payload.ci = ci.trim();
            payload.codigo = codigoDocente.trim() || undefined;
            payload.fechaNacimiento = fechaNacimiento || undefined;
        }

        if (esRolEstudiante) {
            if (!nombre.trim()) {
                setError('El nombre es obligatorio.');
                return;
            }
            if (!apellido.trim()) {
                setError('El apellido es obligatorio.');
                return;
            }
            if (!ci.trim()) {
                setError('El CI es obligatorio.');
                return;
            }
            payload.nombre = nombre.trim();
            payload.apellido = apellido.trim();
            payload.ci = ci.trim();
            payload.fechaNacimiento = fechaNacimiento || null;
        }

        try {
            setGuardando(true);
            await editarUsuario(usuario.id, payload);
            toast.success('Usuario actualizado correctamente.');
            await onUsuarioEditado();
            cerrarSinConfirmar();
        } catch (err: any) {
            setError(err?.message || 'No se pudo actualizar el usuario.');
        } finally {
            setGuardando(false);
        }
    };

    if (!abierto || !usuario) return null;

    return (
        <>
            <ModalBase titulo={`Editar usuario: ${usuario.correo || 'Sin correo'}`} onCerrar={solicitarCierre} ancho="max-w-lg">
                <form onSubmit={enviar} className="space-y-5">
                    <Campo label="Correo electrónico" required={!esRolEstudiante}>
                        <Input
                            type="email"
                            placeholder={esRolEstudiante ? "usuario@institucion.edu (opcional)" : "usuario@institucion.edu"}
                            value={correo}
                            onChange={(e) => setCorreo(e.target.value)}
                            disabled={guardando}
                            autoComplete="off"
                            className="h-9 text-sm"
                        />
                    </Campo>
                    <div className="flex flex-col gap-1.5">
                        <Label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                            Rol
                        </Label>
                        <div className="flex h-9 items-center rounded-md border border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-200">
                            {usuario.rol.charAt(0).toUpperCase() + usuario.rol.slice(1).replace('_', ' ')}
                        </div>
                    </div>
                    {esRolEncargado && (
                        <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50/60 p-4 dark:border-slate-700 dark:bg-slate-800/30">
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Perfil del encargado</p>
                            <div className="grid grid-cols-2 gap-3">
                                <Campo label="Nombre" required>
                                    <Input
                                        value={nombre}
                                        onChange={(e) => setNombre(e.target.value)}
                                        placeholder="Nombre"
                                        className="h-9 text-sm"
                                        disabled={guardando}
                                    />
                                </Campo>
                                <Campo label="Apellido">
                                    <Input
                                        value={apellido}
                                        onChange={(e) => setApellido(e.target.value)}
                                        placeholder="Apellido"
                                        className="h-9 text-sm"
                                        disabled={guardando}
                                    />
                                </Campo>
                            </div>
                        </div>
                    )}
                    {esRolDocente && (
                        <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50/60 p-4 dark:border-slate-700 dark:bg-slate-800/30">
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Perfil del docente</p>
                            <div className="grid grid-cols-2 gap-3">
                                <Campo label="Nombre(s)" required>
                                    <Input
                                        value={nombre}
                                        onChange={(e) => setNombre(e.target.value)}
                                        placeholder="Nombre"
                                        className="h-9 text-sm"
                                        disabled={guardando}
                                    />
                                </Campo>
                                <Campo label="Apellido(s)" required>
                                    <Input
                                        value={apellido}
                                        onChange={(e) => setApellido(e.target.value)}
                                        placeholder="Apellido"
                                        className="h-9 text-sm"
                                        disabled={guardando}
                                    />
                                </Campo>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <Campo label="CI" required>
                                    <Input
                                        value={ci}
                                        onChange={(e) => setCi(e.target.value)}
                                        placeholder="Cédula de identidad"
                                        className="h-9 text-sm"
                                        disabled={guardando}
                                    />
                                </Campo>
                                <Campo label="Código docente">
                                    <Input
                                        value={codigoDocente}
                                        onChange={(e) => setCodigoDocente(e.target.value)}
                                        placeholder="Código docente (opcional)"
                                        className="h-9 text-sm font-mono"
                                        disabled={guardando}
                                    />
                                </Campo>
                            </div>
                            <Campo label="Fecha de nacimiento">
                                <DatePicker
                                    value={fechaNacimiento}
                                    onChange={(val) => setFechaNacimiento(val || '')}
                                    placeholder="Seleccionar fecha de nacimiento"
                                />
                            </Campo>
                        </div>
                    )}
                    {esRolEstudiante && (
                        <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50/60 p-4 dark:border-slate-700 dark:bg-slate-800/30">
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Perfil del estudiante</p>
                            <div className="grid grid-cols-2 gap-3">
                                <Campo label="Nombre(s)" required>
                                    <Input
                                        value={nombre}
                                        onChange={(e) => setNombre(e.target.value)}
                                        placeholder="Nombre"
                                        className="h-9 text-sm"
                                        disabled={guardando}
                                    />
                                </Campo>
                                <Campo label="Apellido(s)" required>
                                    <Input
                                        value={apellido}
                                        onChange={(e) => setApellido(e.target.value)}
                                        placeholder="Apellido"
                                        className="h-9 text-sm"
                                        disabled={guardando}
                                    />
                                </Campo>
                            </div>
                            <Campo label="CI" required>
                                <Input
                                    value={ci}
                                    onChange={(e) => setCi(e.target.value)}
                                    placeholder="Cédula de identidad"
                                    className="h-9 text-sm"
                                    disabled={guardando}
                                />
                            </Campo>
                            <Campo label="Fecha de nacimiento">
                                <DatePicker
                                    value={fechaNacimiento}
                                    onChange={(val) => setFechaNacimiento(val || '')}
                                    placeholder="Seleccionar fecha de nacimiento"
                                />
                            </Campo>
                        </div>
                    )}
                    {error && (
                        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
                            {error}
                        </div>
                    )}
                    <div className="flex justify-end gap-2 pt-1">
                        <Boton type="button" variant="outline" onClick={solicitarCierre} disabled={guardando}>
                            Cancelar
                        </Boton>
                        <Boton type="submit" disabled={guardando} className="gap-2 bg-blue-600 hover:bg-blue-700 text-white">
                            <Save className="h-4 w-4" />
                            {guardando ? 'Guardando...' : 'Guardar cambios'}
                        </Boton>
                    </div>
                </form>
            </ModalBase>

            {confirmacionAbierta && (
                <ModalBase titulo="Descartar cambios" onCerrar={cancelarCierre} ancho="max-w-sm">
                    <div className="space-y-4">
                        <p className="text-sm text-slate-600 dark:text-slate-300">{mensajeConfirmacion}</p>
                        <div className="flex justify-end gap-2">
                            <Boton type="button" variant="outline" onClick={cancelarCierre}>
                                Seguir editando
                            </Boton>
                            <Boton type="button" variant="destructive" onClick={confirmarCierre}>
                                Descartar
                            </Boton>
                        </div>
                    </div>
                </ModalBase>
            )}
        </>
    );
};
