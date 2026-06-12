import { useMemo, useState } from 'react';
import { RotateCcw, UserPlus } from 'lucide-react';
import { Boton } from '@/componentes/ui/button';
import { Input } from '@/componentes/ui/input';
import { Label } from '@/componentes/ui/label';
import { ModalBase } from '@/componentes/paginas/inventario/modal-base';
import { DatePicker } from '@/componentes/ui/date-picker';
import type { CrearUsuarioPayload, RolUsuario } from '@/tipos/autenticacion';
import {
    crearUsuario,
    crearUsuarioDocentePorAdministrador,
    crearUsuarioEstudiantePorAdministrador,
} from '@/lib/servicio-administrador';
import { useCierreSeguro } from '@/hooks/use-cierre-seguro';
import { PasswordDisplay } from './password-display';
import { CheckCircle2 } from 'lucide-react';
import { construirContrasenaPorDefecto, construirContrasenaPorFechaNacimiento } from '@/utilidades/usuarios';



interface Props {
    abierto: boolean;
    onCerrar: () => void;
    onUsuarioCreado: () => Promise<void>;
}

const ROL_ETIQUETAS: Record<RolUsuario, string> = {
    administrador: 'Administrador',
    encargado_inventario: 'Encargado de inventario',
    docente: 'Docente',
    estudiante: 'Estudiante',
};



type FormularioDocenteState = {
    ci: string;
    codigo: string;
    nombre: string;
    apellido: string;
    fechaNacimiento: string;
};

type FormularioEstudianteState = {
    ci: string;
    nombre: string;
    apellido: string;
    fechaNacimiento: string;
};

const crearFormularioDocenteInicial = (): FormularioDocenteState => ({
    ci: '',
    codigo: '',
    nombre: '',
    apellido: '',
    fechaNacimiento: '',
});

const crearFormularioEstudianteInicial = (): FormularioEstudianteState => ({
    ci: '',
    nombre: '',
    apellido: '',
    fechaNacimiento: '',
});

const Campo = ({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) => (
    <div className="flex flex-col gap-1.5">
        <Label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
            {label}{required && <span className="ml-0.5 text-red-500">*</span>}
        </Label>
        {children}
    </div>
);

export const DialogoCrearUsuario = ({ abierto, onCerrar, onUsuarioCreado }: Props) => {
    const [correo, setCorreo] = useState('');
    const [rolSeleccionado, setRolSeleccionado] = useState<RolUsuario | ''>('');
    const [formularioDocente, setFormularioDocente] = useState<FormularioDocenteState>(crearFormularioDocenteInicial);
    const [formularioEstudiante, setFormularioEstudiante] = useState<FormularioEstudianteState>(crearFormularioEstudianteInicial);
    const [nombreEncargado, setNombreEncargado] = useState('');
    const [apellidoEncargado, setApellidoEncargado] = useState('');
    const [fechaNacimientoEncargado, setFechaNacimientoEncargado] = useState('');

    const [datosExito, setDatosExito] = useState<{ correo: string; contrasena: string } | null>(null);


    const [guardando, setGuardando] = useState(false);
    const [error, setError] = useState('');

    const esRolEstudiante = rolSeleccionado === 'estudiante';
    const esRolDocente = rolSeleccionado === 'docente';
    const esRolEncargado = rolSeleccionado === 'encargado_inventario';
    const rolFijado = rolSeleccionado !== '';

    const limpiar = () => {
        setCorreo('');
        setRolSeleccionado('');
        setFormularioDocente(crearFormularioDocenteInicial());
        setFormularioEstudiante(crearFormularioEstudianteInicial());
        setNombreEncargado('');
        setApellidoEncargado('');
        setFechaNacimientoEncargado('');
        setDatosExito(null);
        setError('');

    };

    const cerrarSinConfirmar = () => {
        limpiar();
        onCerrar();
    };

    const estaSucio = useMemo(() => {
        return Boolean(
            correo.trim() ||
            rolSeleccionado !== '' ||
            formularioEstudiante.ci.trim() ||
            formularioEstudiante.nombre.trim() ||
            formularioEstudiante.apellido.trim() ||
            formularioEstudiante.fechaNacimiento.trim() ||
            formularioDocente.ci.trim() ||
            formularioDocente.codigo.trim() ||
            formularioDocente.nombre.trim() ||
            formularioDocente.apellido.trim() ||
            formularioDocente.fechaNacimiento.trim() ||
            nombreEncargado.trim() ||
            apellidoEncargado.trim()
        );
    }, [correo, rolSeleccionado, formularioEstudiante, formularioDocente, nombreEncargado, apellidoEncargado]);

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

    const cambiarRol = (nuevoRol: RolUsuario | '') => {
        setRolSeleccionado(nuevoRol);
        setError('');
    };

    const resetearRol = () => {
        setRolSeleccionado('');
        setError('');
    };

    const enviar = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        const correoNorm = correo.trim().toLowerCase();
        if (rolSeleccionado !== 'estudiante' && !correoNorm) {
            setError('El correo es obligatorio.');
            return;
        }
        if (!rolSeleccionado) {
            setError('Selecciona un rol para el usuario.');
            return;
        }

        const contrasenaInicial = (esRolEstudiante && formularioEstudiante.fechaNacimiento)
            ? construirContrasenaPorFechaNacimiento(rolSeleccionado, formularioEstudiante.fechaNacimiento)
            : (esRolDocente && formularioDocente.fechaNacimiento)
                ? construirContrasenaPorFechaNacimiento(rolSeleccionado, formularioDocente.fechaNacimiento)
                : (esRolEncargado && fechaNacimientoEncargado)
                    ? construirContrasenaPorFechaNacimiento(rolSeleccionado, fechaNacimientoEncargado)
                    : construirContrasenaPorDefecto(rolSeleccionado);

        try {
            if (esRolEstudiante) {
                if (!formularioEstudiante.ci.trim()) throw new Error('El CI del estudiante es obligatorio.');
                if (!formularioEstudiante.fechaNacimiento.trim()) throw new Error('La fecha de nacimiento es obligatoria.');

                setGuardando(true);
                await crearUsuarioEstudiantePorAdministrador({
                    correo: correoNorm || undefined,
                    ci: formularioEstudiante.ci.trim(),
                    nombre: formularioEstudiante.nombre.trim(),
                    apellido: formularioEstudiante.apellido.trim(),
                    cu: '',
                    fechaNacimiento: formularioEstudiante.fechaNacimiento,
                    contrasena: contrasenaInicial,
                });
            } else if (esRolDocente) {
                if (!formularioDocente.nombre.trim()) throw new Error('El nombre del docente es obligatorio.');
                if (!formularioDocente.apellido.trim()) throw new Error('El apellido del docente es obligatorio.');
                if (!formularioDocente.ci.trim()) throw new Error('El CI del docente es obligatorio.');

                setGuardando(true);
                await crearUsuarioDocentePorAdministrador({
                    correo: correoNorm,
                    ci: formularioDocente.ci.trim(),
                    codigo: formularioDocente.codigo.trim() || undefined,
                    nombre: formularioDocente.nombre.trim(),
                    apellido: formularioDocente.apellido.trim(),
                    fechaNacimiento: formularioDocente.fechaNacimiento.trim() || undefined,
                    contrasena: contrasenaInicial,
                });
            } else {
                if (esRolEncargado && !nombreEncargado.trim()) {
                    throw new Error('El nombre del encargado es obligatorio.');
                }

                const payload: CrearUsuarioPayload = {
                    correo: correoNorm,
                    contrasena: contrasenaInicial,
                    rol: rolSeleccionado,
                    nombre: esRolEncargado ? (nombreEncargado.trim() || undefined) : undefined,
                    apellido: esRolEncargado ? (apellidoEncargado.trim() || undefined) : undefined,
                    fechaNacimiento: esRolEncargado ? (fechaNacimientoEncargado.trim() || undefined) : undefined,
                };
                setGuardando(true);
                await crearUsuario(payload);
            }

            await onUsuarioCreado();
            setDatosExito({ correo: correoNorm, contrasena: contrasenaInicial });
        } catch (err: any) {

            setError(err?.message || 'No se pudo crear el usuario.');
        } finally {
            setGuardando(false);
        }
    };

    if (!abierto) return null;

    return (
        <>
            <ModalBase titulo="Crear usuario" onCerrar={solicitarCierre} ancho="max-w-lg">
                {datosExito ? (
                    <div className="space-y-6 py-4 text-center">
                        <div className="flex justify-center">
                            <div className="rounded-full bg-emerald-100 p-3 dark:bg-emerald-950/30">
                                <CheckCircle2 className="h-10 w-10 text-emerald-600 dark:text-emerald-500" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">¡Usuario creado con éxito!</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                Se ha registrado el usuario <span className="font-semibold text-slate-700 dark:text-slate-300">{datosExito.correo}</span>.
                                Comparte las siguientes credenciales con el usuario:
                            </p>
                        </div>

                        <div className="mx-auto max-w-sm text-left">
                            <PasswordDisplay password={datosExito.contrasena} label="Contraseña temporal" />
                        </div>

                        <div className="pt-4">
                            <Boton onClick={cerrarSinConfirmar} className="w-full sm:w-auto px-8">
                                Entendido, cerrar
                            </Boton>
                        </div>
                    </div>
                ) : (
                    <form onSubmit={enviar} className="space-y-5">
                    <Campo label="Correo electrónico" required={rolSeleccionado !== 'estudiante'}>
                        <Input
                            id="crear-usuario-correo"
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
                            Rol<span className="ml-0.5 text-red-500">*</span>
                        </Label>
                        {rolFijado ? (
                            <div className="flex items-center gap-2">
                                <div className="flex h-9 flex-1 items-center rounded-md border border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-200">
                                    {ROL_ETIQUETAS[rolSeleccionado as RolUsuario]}
                                </div>
                                <Boton
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={resetearRol}
                                    className="h-9 gap-1.5 px-3 text-xs"
                                    title="Cambiar rol"
                                    disabled={guardando}
                                >
                                    <RotateCcw className="h-3.5 w-3.5" />
                                    Cambiar
                                </Boton>
                            </div>
                        ) : (
                            <select
                                id="crear-usuario-rol"
                                value={rolSeleccionado}
                                onChange={(e) => cambiarRol(e.target.value as RolUsuario)}
                                className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                                disabled={guardando}
                            >
                                <option value="" disabled hidden>Selecciona un rol...</option>
                                <option value="encargado_inventario">Encargado de inventario</option>
                                <option value="docente">Docente</option>
                                <option value="estudiante">Estudiante</option>
                            </select>
                        )}
                    </div>
                    {esRolEncargado && (
                        <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50/60 p-4 dark:border-slate-700 dark:bg-slate-800/30">
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Perfil del encargado</p>
                            <div className="grid grid-cols-2 gap-3">
                                <Campo label="Nombre" required>
                                    <Input
                                        id="crear-encargado-nombre"
                                        value={nombreEncargado}
                                        onChange={(e) => setNombreEncargado(e.target.value)}
                                        placeholder="Ej: María"
                                        className="h-9 text-sm"
                                        disabled={guardando}
                                    />
                                </Campo>
                                <Campo label="Apellido">
                                    <Input
                                        id="crear-encargado-apellido"
                                        value={apellidoEncargado}
                                        onChange={(e) => setApellidoEncargado(e.target.value)}
                                        placeholder="Ej: García"
                                        className="h-9 text-sm"
                                        disabled={guardando}
                                    />
                                </Campo>
                            </div>
                            <Campo label="Fecha de nacimiento">
                                <DatePicker
                                    value={fechaNacimientoEncargado}
                                    onChange={(val) => setFechaNacimientoEncargado(val || '')}
                                    placeholder="Seleccionar fecha de nacimiento"
                                />
                            </Campo>
                        </div>
                    )}
                    {esRolDocente && (
                        <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50/60 p-4 dark:border-slate-700 dark:bg-slate-800/30">
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Perfil del docente</p>
                            <div className="grid grid-cols-2 gap-3">
                                <Campo label="Nombre(s)" required>
                                    <Input
                                        id="crear-docente-nombre"
                                        value={formularioDocente.nombre}
                                        onChange={(e) => setFormularioDocente(prev => ({ ...prev, nombre: e.target.value }))}
                                        placeholder="Ej: Carlos"
                                        className="h-9 text-sm"
                                        disabled={guardando}
                                    />
                                </Campo>
                                <Campo label="Apellido(s)" required>
                                    <Input
                                        id="crear-docente-apellido"
                                        value={formularioDocente.apellido}
                                        onChange={(e) => setFormularioDocente(prev => ({ ...prev, apellido: e.target.value }))}
                                        placeholder="Ej: Mamani"
                                        className="h-9 text-sm"
                                        disabled={guardando}
                                    />
                                </Campo>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <Campo label="CI" required>
                                    <Input
                                        id="crear-docente-ci"
                                        value={formularioDocente.ci}
                                        onChange={(e) => setFormularioDocente(prev => ({ ...prev, ci: e.target.value }))}
                                        placeholder="Ej: 1234567"
                                        className="h-9 text-sm"
                                        disabled={guardando}
                                    />
                                </Campo>
                                <Campo label="Código docente">
                                    <Input
                                        id="crear-docente-codigo"
                                        value={formularioDocente.codigo}
                                        onChange={(e) => setFormularioDocente(prev => ({ ...prev, codigo: e.target.value }))}
                                        placeholder="Ej: DOC-001 (opcional)"
                                        className="h-9 text-sm font-mono"
                                        disabled={guardando}
                                    />
                                </Campo>
                            </div>
                            <Campo label="Fecha de nacimiento">
                                <DatePicker
                                    value={formularioDocente.fechaNacimiento}
                                    onChange={(val) => setFormularioDocente(prev => ({ ...prev, fechaNacimiento: val }))}
                                    placeholder="Seleccionar fecha de nacimiento"
                                    title="Fecha de nacimiento del docente"
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
                                        id="crear-estudiante-nombre"
                                        value={formularioEstudiante.nombre}
                                        onChange={(e) => setFormularioEstudiante(prev => ({ ...prev, nombre: e.target.value }))}
                                        placeholder="Ej: Juan"
                                        className="h-9 text-sm"
                                        disabled={guardando}
                                    />
                                </Campo>
                                <Campo label="Apellido(s)" required>
                                    <Input
                                        id="crear-estudiante-apellido"
                                        value={formularioEstudiante.apellido}
                                        onChange={(e) => setFormularioEstudiante(prev => ({ ...prev, apellido: e.target.value }))}
                                        placeholder="Ej: Pérez"
                                        className="h-9 text-sm"
                                        disabled={guardando}
                                    />
                                </Campo>
                            </div>
                            <Campo label="CI" required>
                                <Input
                                    id="crear-estudiante-ci"
                                    value={formularioEstudiante.ci}
                                    onChange={(e) => setFormularioEstudiante(prev => ({ ...prev, ci: e.target.value }))}
                                    placeholder="Cédula de identidad"
                                    className="h-9 text-sm"
                                    disabled={guardando}
                                />
                            </Campo>
                            <Campo label="Fecha de nacimiento" required>
                                <DatePicker
                                    value={formularioEstudiante.fechaNacimiento}
                                    onChange={(val) => setFormularioEstudiante(prev => ({ ...prev, fechaNacimiento: val }))}
                                    placeholder="Seleccionar fecha de nacimiento"
                                    title="Fecha de nacimiento del estudiante"
                                />
                            </Campo>
                            <div className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-700 dark:border-blue-900/40 dark:bg-blue-900/20 dark:text-blue-300">
                                Las carreras y CUs se asignan desde la sección de Estudiantes una vez creado el perfil.
                            </div>
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
                        <Boton type="submit" disabled={guardando || !rolFijado} className="gap-2">
                            <UserPlus className="h-4 w-4" />
                            {guardando ? 'Creando...' : 'Crear usuario'}
                        </Boton>
                    </div>
                </form>
                )}
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

