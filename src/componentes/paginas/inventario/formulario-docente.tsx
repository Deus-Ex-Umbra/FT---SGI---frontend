import { useEffect, useMemo, useState } from 'react';
import { ModalBase } from './modal-base';
import { useInventario } from '@/contextos/ContextoInventario';
import { Boton } from '@/componentes/ui/button';
import { Input } from '@/componentes/ui/input';
import { Label } from '@/componentes/ui/label';
import { DatePicker } from '@/componentes/ui/date-picker';
import { Checkbox } from '@/componentes/ui/checkbox';
import type { Docente } from '@/tipos/inventario';
import { useCierreSeguro } from '@/hooks/use-cierre-seguro';
import { useValidacionCamposRequeridos } from '@/hooks/use-validacion-campos-requeridos';
import { PasswordDisplay } from '@/componentes/paginas/usuarios/password-display';
import { Search } from 'lucide-react';

interface Props {
    onCerrar: () => void;
    docente?: Docente | null;
}

const Campo = ({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) => (
    <div className="flex flex-col gap-1.5">
        <Label>
            {label}{required && <span className="ml-0.5 text-red-500">*</span>}
        </Label>
        {children}
    </div>
);

const FiltroCarreras = ({ onFiltro }: { onFiltro: (q: string) => void }) => (
    <input
        type="text"
        placeholder="Filtrar carrera..."
        onChange={e => onFiltro(e.target.value)}
        className="h-8 w-full rounded-md border border-slate-200 bg-white pl-8 pr-3 text-[13px] text-slate-700 outline-none placeholder:text-slate-400 transition-colors focus:border-blue-400 focus:ring-1 focus:ring-blue-400/50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
    />
);

export const FormularioDocente = ({ onCerrar, docente }: Props) => {
    const { agregarDocente, editarDocente, carreras } = useInventario();
    const inicial = useMemo(() => ({
        correo: docente?.correo ?? '',
        codigo: docente?.codigo ?? '',
        nombre: docente?.nombre ?? '',
        apellido: docente?.apellido ?? '',
        carnet: docente?.carnet ?? '',
        fechaNacimiento: docente?.fechaNacimiento ?? '',
        carrerasIds: docente?.carrerasIds ?? (docente?.carreras ?? []).map(c => Number(c.id)),
    }), [docente?.id]);

    const [campos, setCampos] = useState(inicial);
    const [error, setError] = useState('');
    const [guardando, setGuardando] = useState(false);
    const [datosCreacion, setDatosCreacion] = useState<{ correo: string; contrasena: string } | null>(null);
    const [filtroCarrera, setFiltroCarrera] = useState('');

    const carrerasFiltradas = useMemo(() => {
        const q = filtroCarrera.trim().toLowerCase();
        if (!q) return carreras;
        return carreras.filter(c => c.nombre.toLowerCase().includes(q));
    }, [carreras, filtroCarrera]);

    useEffect(() => {
        setCampos(inicial);
        setError('');
    }, [inicial]);

    const estaSucio = useMemo(() => {
        const norm = (v: string) => v.trim();
        const tieneMismosIds =
            campos.carrerasIds.length === inicial.carrerasIds.length &&
            campos.carrerasIds.every(id => inicial.carrerasIds.includes(id));
        return (
            norm(campos.correo) !== norm(inicial.correo) ||
            norm(campos.codigo) !== norm(inicial.codigo) ||
            norm(campos.nombre) !== norm(inicial.nombre) ||
            norm(campos.apellido) !== norm(inicial.apellido) ||
            norm(campos.carnet) !== norm(inicial.carnet) ||
            norm(campos.fechaNacimiento) !== norm(inicial.fechaNacimiento) ||
            !tieneMismosIds
        );
    }, [campos, inicial]);

    const alternarCarrera = (id: number) => {
        setCampos(prev => {
            const existe = prev.carrerasIds.includes(id);
            const nuevas = existe
                ? prev.carrerasIds.filter(x => x !== id)
                : [...prev.carrerasIds, id];
            return { ...prev, carrerasIds: nuevas };
        });
    };

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
        mensajeConfirmacion: 'Hay cambios sin guardar en el docente. ¿Deseas cerrar y descartarlos?',
    });

    const { validarCampos, limpiarCampoResaltado, claseCampoResaltado } = useValidacionCamposRequeridos();

    const manejarEnvio = async (e: React.FormEvent) => {
        e.preventDefault();
        const ok = validarCampos([
            { id: 'docente-correo', etiqueta: 'Correo electrónico', valido: Boolean(campos.correo.trim()) },
            { id: 'docente-nombre', etiqueta: 'Nombres', valido: Boolean(campos.nombre.trim()) },
            { id: 'docente-apellido', etiqueta: 'Apellidos', valido: Boolean(campos.apellido.trim()) },
            { id: 'docente-carnet', etiqueta: 'Carnet de Identidad', valido: Boolean(campos.carnet.trim()) },
        ], docente ? 'guardar cambios' : 'registrar');
        if (!ok) return;

        setGuardando(true);
        setError('');
        try {
            const payload = {
                correo: campos.correo.trim().toLowerCase(),
                codigo: campos.codigo.trim(),
                nombre: campos.nombre.trim(),
                apellido: campos.apellido.trim(),
                materia: '',
                carnet: campos.carnet.trim(),
                fechaNacimiento: campos.fechaNacimiento.trim() || null,
                carrerasIds: campos.carrerasIds,
            };

            if (docente?.id) {
                await editarDocente(docente.id, payload);
                onCerrar();
            } else {
                await agregarDocente(payload);
                const fechaNac = campos.fechaNacimiento.trim();
                const partes = fechaNac.replace(/T.*$/, '').split('-');
                let contrasena = '';
                if (partes.length === 3) {
                    const [anio, mes, dia] = partes;
                    contrasena = `usfx-${dia}/${mes}/${anio}-docente`;
                } else {
                    const hoy = new Date();
                    const dia = String(hoy.getDate()).padStart(2, '0');
                    const mes = String(hoy.getMonth() + 1).padStart(2, '0');
                    const anio = String(hoy.getFullYear());
                    contrasena = `usfx-${dia}/${mes}/${anio}-docente`;
                }
                setDatosCreacion({
                    correo: campos.correo.trim().toLowerCase(),
                    contrasena,
                });
            }
        } catch (err: any) {
            setError(err?.message ?? 'No se pudo guardar el docente.');
        } finally {
            setGuardando(false);
        }
    };

    if (datosCreacion) {
        return (
            <ModalBase titulo="Docente registrado" onCerrar={onCerrar} ancho="max-w-sm">
                <div className="space-y-6 py-2 text-center">
                    <div className="flex justify-center">
                        <div className="rounded-full bg-emerald-100 p-3 dark:bg-emerald-950/30">
                            <svg className="h-8 w-8 text-emerald-600 dark:text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">¡Docente registrado!</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            Perfil creado correctamente. Comparte la contraseña inicial con el docente:
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
            <ModalBase titulo={docente ? 'Editar docente' : 'Registrar docente'} onCerrar={solicitarCierre}>
                <form onSubmit={manejarEnvio} className="space-y-4">

                    <Campo label="Correo electrónico" required>
                        <Input
                            id="docente-correo"
                            type="email"
                            value={campos.correo}
                            onChange={e => { setCampos(prev => ({ ...prev, correo: e.target.value })); setError(''); limpiarCampoResaltado('docente-correo'); }}
                            placeholder="usuario@institucion.edu"
                            title="Correo (usuario) del docente"
                            className={`h-9 text-sm ${claseCampoResaltado('docente-correo')}`}
                            autoComplete="off"
                        />
                    </Campo>

                    <div className="grid grid-cols-2 gap-3">
                        <Campo label="Nombre(s)" required>
                            <Input
                                id="docente-nombre"
                                type="text"
                                value={campos.nombre}
                                onChange={e => { setCampos(prev => ({ ...prev, nombre: e.target.value })); setError(''); limpiarCampoResaltado('docente-nombre'); }}
                                placeholder="Ej: Carlos Eduardo"
                                title="Nombres del docente"
                                className={`h-9 text-sm ${claseCampoResaltado('docente-nombre')}`}
                            />
                        </Campo>
                        <Campo label="Apellido(s)" required>
                            <Input
                                id="docente-apellido"
                                type="text"
                                value={campos.apellido}
                                onChange={e => { setCampos(prev => ({ ...prev, apellido: e.target.value })); setError(''); limpiarCampoResaltado('docente-apellido'); }}
                                placeholder="Ej: Mamani Quispe"
                                title="Apellidos del docente"
                                className={`h-9 text-sm ${claseCampoResaltado('docente-apellido')}`}
                            />
                        </Campo>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <Campo label="Carnet de Identidad" required>
                            <Input
                                id="docente-carnet"
                                type="text"
                                value={campos.carnet}
                                onChange={e => { setCampos(prev => ({ ...prev, carnet: e.target.value })); setError(''); limpiarCampoResaltado('docente-carnet'); }}
                                placeholder="Ej: 1234567"
                                title="Carnet de identidad del docente"
                                className={`h-9 text-sm ${claseCampoResaltado('docente-carnet')}`}
                            />
                        </Campo>
                        <Campo label="Código docente">
                            <Input
                                id="docente-codigo"
                                type="text"
                                value={campos.codigo}
                                onChange={e => { setCampos(prev => ({ ...prev, codigo: e.target.value })); setError(''); }}
                                placeholder="Ej: DOC-001 (opcional)"
                                title="Código del docente"
                                className="h-9 text-sm font-mono"
                            />
                        </Campo>
                    </div>

                    <Campo label="Fecha de nacimiento">
                        <DatePicker
                            value={campos.fechaNacimiento}
                            onChange={(val) => setCampos(prev => ({ ...prev, fechaNacimiento: val }))}
                            placeholder="Seleccionar fecha de nacimiento"
                            title="Fecha de nacimiento del docente"
                        />
                    </Campo>

                    <div className="rounded-md border border-slate-200 p-3 dark:border-slate-800">
                        <div className="mb-2 text-[13px] font-semibold text-slate-700 dark:text-slate-200">Carreras en las que dicta clases</div>
                        <div className="relative mb-2">
                            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                            <FiltroCarreras onFiltro={(q) => setFiltroCarrera(q)} />
                        </div>
                        <div className="max-h-36 space-y-1.5 overflow-auto pr-1">
                            {carrerasFiltradas.map((carrera) => {
                                const idNum = Number(carrera.id);
                                return (
                                    <label key={carrera.id} className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1 text-[13px] text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800/40">
                                        <Checkbox
                                            checked={campos.carrerasIds.includes(idNum)}
                                            onChange={() => alternarCarrera(idNum)}
                                        />
                                        <span>{carrera.nombre}</span>
                                    </label>
                                );
                            })}
                            {carrerasFiltradas.length === 0 && (
                                <p className="text-center text-[13px] text-slate-500">{filtroCarrera ? 'Sin resultados para ese filtro.' : 'No hay carreras registradas.'}</p>
                            )}
                        </div>
                    </div>

                    <div className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-[13px] text-blue-700 dark:border-blue-900/40 dark:bg-blue-900/20 dark:text-blue-300">
                        Las materias se asignan al docente desde la sección <strong>Materias</strong>.
                    </div>

                    {error && (
                        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-600 dark:border-red-800 dark:bg-red-950 dark:text-red-400">
                            {error}
                        </p>
                    )}

                    <div className="flex justify-end gap-2 pt-1">
                        <Boton type="button" variant="outline" onClick={solicitarCierre} className="h-9 px-4 text-sm">
                            Cancelar
                        </Boton>
                        <Boton type="submit" className="h-9 px-5 text-sm" disabled={guardando}>
                            {guardando ? 'Guardando...' : (docente ? 'Guardar cambios' : 'Guardar docente')}
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
