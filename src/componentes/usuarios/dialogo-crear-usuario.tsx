import { useMemo, useState } from 'react';
import { UserPlus } from 'lucide-react';
import { Boton } from '@/componentes/ui/button';
import { Input } from '@/componentes/ui/input';
import { Label } from '@/componentes/ui/label';
import { ModalBase } from '@/componentes/inventario/modal-base';
import { crearUsuario, type CrearUsuarioPayload, type RolUsuario } from '@/lib/servicio-autenticacion';
import { useCierreSeguro } from '@/hooks/use-cierre-seguro';

interface Props {
    abierto: boolean;
    onCerrar: () => void;
    onUsuarioCreado: () => Promise<void>;
}

export const DialogoCrearUsuario = ({ abierto, onCerrar, onUsuarioCreado }: Props) => {
    const [formulario, setFormulario] = useState<CrearUsuarioPayload>({
        nombre_usuario: '',
        contrasena: '',
        rol: 'encargado_inventario',
    });
    const [guardando, setGuardando] = useState(false);
    const [error, setError] = useState('');

    if (!abierto) return null;

    const actualizarCampo = <K extends keyof CrearUsuarioPayload>(campo: K, valor: CrearUsuarioPayload[K]) => {
        setFormulario((prev) => ({ ...prev, [campo]: valor }));
    };

    const limpiar = () => {
        setFormulario({ nombre_usuario: '', contrasena: '', rol: 'encargado_inventario' });
        setError('');
    };

    const cerrarSinConfirmar = () => {
        limpiar();
        onCerrar();
    };

    const estaSucio = useMemo(() => {
        return Boolean(
            formulario.nombre_usuario.trim() ||
            formulario.contrasena.trim() ||
            formulario.rol !== 'encargado_inventario'
        );
    }, [formulario.contrasena, formulario.nombre_usuario, formulario.rol]);

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
        mensajeConfirmacion: 'Hay datos ingresados. ¿Deseas cerrar y descartarlos?',
    });

    const enviar = async (e: React.FormEvent) => {
        e.preventDefault();
        setGuardando(true);
        setError('');

        try {
            await crearUsuario(formulario);
            await onUsuarioCreado();
            cerrarSinConfirmar();
        } catch (err: any) {
            setError(err?.message || 'No se pudo crear el usuario.');
        } finally {
            setGuardando(false);
        }
    };

    return (
        <>
            <ModalBase titulo="Crear usuario" onCerrar={solicitarCierre} ancho="max-w-xl">
                <form onSubmit={enviar} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                        <Label htmlFor="crear-usuario-correo">Correo (usuario)</Label>
                        <Input
                            id="crear-usuario-correo"
                            type="email"
                            placeholder="encargado@institucion.edu"
                            value={formulario.nombre_usuario}
                            onChange={(e) => actualizarCampo('nombre_usuario', e.target.value)}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="crear-usuario-rol">Rol</Label>
                        <select
                            id="crear-usuario-rol"
                            value={formulario.rol}
                            onChange={(e) => actualizarCampo('rol', e.target.value as RolUsuario)}
                            className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                        >
                            <option value="encargado_inventario">Encargado de inventario</option>
                            <option value="administrador">Administrador</option>
                        </select>
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="crear-usuario-contrasena">Contraseña</Label>
                    <Input
                        id="crear-usuario-contrasena"
                        type="password"
                        minLength={6}
                        value={formulario.contrasena}
                        onChange={(e) => actualizarCampo('contrasena', e.target.value)}
                        required
                    />
                </div>

                {error && (
                    <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
                        {error}
                    </div>
                )}

                    <div className="flex justify-end gap-2">
                        <Boton type="button" variant="outline" onClick={solicitarCierre}>
                            Cancelar
                        </Boton>
                        <Boton type="submit" disabled={guardando} className="gap-2">
                            <UserPlus className="h-4 w-4" />
                            {guardando ? 'Creando...' : 'Crear usuario'}
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
