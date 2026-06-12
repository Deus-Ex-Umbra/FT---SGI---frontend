import { useEffect, useMemo, useState } from 'react';
import { ModalBase } from './modal-base';
import { useInventario } from '@/contextos/ContextoInventario';
import { Boton } from '@/componentes/ui/button';
import { Input } from '@/componentes/ui/input';
import { Label } from '@/componentes/ui/label';
import { DatePicker } from '@/componentes/ui/date-picker';
import type { Estudiante } from '@/tipos/inventario';
import { useCierreSeguro } from '@/hooks/use-cierre-seguro';
import { useValidacionCamposRequeridos } from '@/hooks/use-validacion-campos-requeridos';
import { PasswordDisplay } from '@/componentes/paginas/usuarios/password-display';

interface Props {
    onCerrar: () => void;
    estudiante?: Estudiante | null;
}

const Campo = ({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) => (
    <div className="flex flex-col gap-1.5">
        <Label>
            {label}{required && <span className="ml-0.5 text-red-500">*</span>}
        </Label>
        {children}
    </div>
);

export const FormularioEstudiante = ({ onCerrar, estudiante }: Props) => {
    const { agregarEstudiante, editarEstudiante, estudiantes } = useInventario();
    const inicial = useMemo(() => ({
        carnet: estudiante?.carnet ?? '',
        nombre: estudiante?.nombre ?? '',
        apellido: estudiante?.apellido ?? '',
        correo: estudiante?.correo ?? '',
        fechaNacimiento: estudiante?.fechaNacimiento ?? '',
    }), [estudiante]);

    const [campos, setCampos] = useState(inicial);
    const [error, setError] = useState('');
    const [guardando, setGuardando] = useState(false);
    const [datosCreacion, setDatosCreacion] = useState<{ correo: string; contrasena: string } | null>(null);

    useEffect(() => {
        setCampos(inicial);
        setError('');
    }, [inicial]);

    const estaSucio = useMemo(() => {
        const norm = (v: string) => v.trim();
        return (
            norm(campos.carnet) !== norm(inicial.carnet) ||
            norm(campos.nombre) !== norm(inicial.nombre) ||
            norm(campos.apellido) !== norm(inicial.apellido) ||
            norm(campos.correo) !== norm(inicial.correo) ||
            norm(campos.fechaNacimiento) !== norm(inicial.fechaNacimiento)
        );
    }, [campos, inicial]);

    const {
        solicitarCierre,
        confirmacionAbierta,
        cancelarCierre,
        confirmarCierre,
        mensajeConfirmacion,
    } = useCierreSeguro({
        estaSucio,
        estaCargando: guardando,
        alCerrar: onCerrar,
        mensajeConfirmacion: 'Hay cambios sin guardar en el estudiante. ¿Deseas cerrar y descartarlos?',
    });

    const { validarCampos, limpiarCampoResaltado, claseCampoResaltado } = useValidacionCamposRequeridos();

    const actualizar = (clave: string, valor: string) =>
        setCampos(prev => ({ ...prev, [clave]: valor }));

    const manejarEnvio = async (e: React.FormEvent) => {
        e.preventDefault();

        const ok = validarCampos([
            { id: 'estudiante-carnet', etiqueta: 'Carnet de Identidad (CI)', valido: Boolean(campos.carnet.trim()) },
            { id: 'estudiante-nombre', etiqueta: 'Nombre(s)', valido: Boolean(campos.nombre.trim()) },
            { id: 'estudiante-apellido', etiqueta: 'Apellido(s)', valido: Boolean(campos.apellido.trim()) },
        ], estudiante ? 'guardar cambios' : 'registrar');
        if (!ok) return;

        if (!campos.carnet.trim() || !campos.nombre.trim() || !campos.apellido.trim()) {
            setError('Carnet, nombre y apellido son obligatorios.');
            return;
        }

        if (estudiantes.some(est => est.carnet === campos.carnet.trim() && est.id !== estudiante?.id)) {
            setError('El carnet ya está registrado en el sistema.');
            return;
        }

        setGuardando(true);
        try {
            if (estudiante?.id) {
                const payload = {
                    carnet: campos.carnet.trim(),
                    carrera: estudiante.carrera || '',
                    correo: campos.correo.trim().toLowerCase() || undefined,
                    nombre: campos.nombre.trim(),
                    apellido: campos.apellido.trim(),
                    fechaNacimiento: campos.fechaNacimiento.trim() || null,
                };
                await editarEstudiante(estudiante.id, payload);
                onCerrar();
            } else {
                const fechaNac = campos.fechaNacimiento.trim() || '2000-01-01';
                const payload = {
                    carnet: campos.carnet.trim(),
                    carrera: '',
                    correo: campos.correo.trim().toLowerCase() || undefined,
                    nombre: campos.nombre.trim(),
                    apellido: campos.apellido.trim(),
                    fechaNacimiento: fechaNac,
                };
                await agregarEstudiante(payload);
                const partes = fechaNac.replace(/T.*$/, '').split('-');
                let contrasena = '';
                if (partes.length === 3) {
                    const [anio, mes, dia] = partes;
                    contrasena = `usfx-${dia}/${mes}/${anio}-estudiante`;
                }
                setDatosCreacion({
                    correo: campos.correo.trim().toLowerCase() || campos.carnet.trim(),
                    contrasena,
                });
            }
        } catch (err: any) {
            setError(err?.message ?? 'No se pudo guardar el estudiante.');
        } finally {
            setGuardando(false);
        }
    };

    if (datosCreacion) {
        return (
            <ModalBase titulo="Estudiante registrado" onCerrar={onCerrar} ancho="max-w-sm">
                <div className="space-y-6 py-2 text-center">
                    <div className="flex justify-center">
                        <div className="rounded-full bg-emerald-100 p-3 dark:bg-emerald-950/30">
                            <svg className="h-8 w-8 text-emerald-600 dark:text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">¡Estudiante registrado!</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            Perfil creado correctamente. Comparte la contraseña inicial con el estudiante:
                        </p>
                    </div>

                    <div className="text-left">
                        <PasswordDisplay password={datosCreacion.contrasena} label="Contraseña inicial" />
                    </div>

                    <div className="pt-2">
                        <Boton onClick={onCerrar} className="w-full">
                            Cerrar
                        </Boton>
                    </div>
                </div>
            </ModalBase>
        );
    }

    return (
        <>
            <ModalBase titulo={estudiante ? 'Editar estudiante' : 'Registrar estudiante'} onCerrar={solicitarCierre}>
                <form onSubmit={manejarEnvio} className="space-y-4">

                    <Campo label="Correo electrónico (Opcional)">
                        <Input
                            id="estudiante-correo"
                            type="email"
                            value={campos.correo}
                            onChange={e => { actualizar('correo', e.target.value); setError(''); limpiarCampoResaltado('estudiante-correo'); }}
                            placeholder="estudiante@institucion.edu"
                            className={`h-9 text-sm ${claseCampoResaltado('estudiante-correo')}`}
                        />
                    </Campo>

                    <Campo label="Carnet de identidad (CI)" required>
                        <Input
                            id="estudiante-carnet"
                            type="text"
                            value={campos.carnet}
                            onChange={e => { actualizar('carnet', e.target.value); setError(''); limpiarCampoResaltado('estudiante-carnet'); }}
                            placeholder="Ej: 1234567"
                            className={`h-9 font-mono text-sm ${claseCampoResaltado('estudiante-carnet')}`}
                        />
                    </Campo>

                    <div className="grid grid-cols-2 gap-3">
                        <Campo label="Nombre(s)" required>
                            <Input
                                id="estudiante-nombre"
                                type="text"
                                value={campos.nombre}
                                onChange={e => { actualizar('nombre', e.target.value); setError(''); limpiarCampoResaltado('estudiante-nombre'); }}
                                placeholder="Ej: Carlos Eduardo"
                                className={`h-9 text-sm ${claseCampoResaltado('estudiante-nombre')}`}
                            />
                        </Campo>
                        <Campo label="Apellido(s)" required>
                            <Input
                                id="estudiante-apellido"
                                type="text"
                                value={campos.apellido}
                                onChange={e => { actualizar('apellido', e.target.value); setError(''); limpiarCampoResaltado('estudiante-apellido'); }}
                                placeholder="Ej: Mamani Quispe"
                                className={`h-9 text-sm ${claseCampoResaltado('estudiante-apellido')}`}
                            />
                        </Campo>
                    </div>

                    <Campo label="Fecha de nacimiento">
                        <DatePicker
                            value={campos.fechaNacimiento}
                            onChange={(val) => actualizar('fechaNacimiento', val || '')}
                            placeholder="Seleccionar fecha de nacimiento"
                        />
                    </Campo>
                    <div className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-700 dark:border-blue-900/40 dark:bg-blue-900/20 dark:text-blue-300">
                        Las carreras y CUs se asignan desde el panel de acciones de cada estudiante.
                    </div>

                    {error && (
                        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600 dark:border-red-800 dark:bg-red-950 dark:text-red-400">
                            {error}
                        </p>
                    )}

                    <div className="flex justify-end gap-2 pt-1">
                        <Boton type="button" variant="outline" onClick={solicitarCierre} className="h-9 px-4 text-sm">
                            Cancelar
                        </Boton>
                        <Boton type="submit" className="h-9 px-5 text-sm" disabled={guardando}>
                            {guardando ? 'Guardando...' : (estudiante ? 'Guardar cambios' : 'Registrar estudiante')}
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
