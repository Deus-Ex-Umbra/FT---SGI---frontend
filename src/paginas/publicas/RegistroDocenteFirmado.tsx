import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Eye, EyeOff, GraduationCap, IdCard, KeyRound, User } from 'lucide-react';
import { Boton } from '@/componentes/ui/button';
import { Input } from '@/componentes/ui/input';
import { Label } from '@/componentes/ui/label';
import { DatePicker } from '@/componentes/ui/date-picker';
import { Checkbox } from '@/componentes/ui/checkbox';
import {
  obtenerCarrerasRegistroPublico,
  registrarDocenteConEnlaceFirmado,
  verificarRegistroDocenteConEnlaceFirmado,
} from '@/lib/servicio-autenticacion';
import type { CarreraRegistroPublico } from '@/tipos/autenticacion';
import type { PropsPaginaVolver } from '@/tipos/paginas';
import { EstadoAccionPublica } from '@/componentes/paginas/compartido/estado-accion-publica';
import { cn } from '@/utilidades/ui';

const calcularFortaleza = (pass: string): 0 | 1 | 2 | 3 => {
  if (!pass) return 0;
  let score = 0;
  if (pass.length >= 6) score++;
  if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) score++;
  if (/[^A-Za-z0-9]/.test(pass) || /\d/.test(pass)) score++;
  return score as 0 | 1 | 2 | 3;
};

const fortalezaConfig: Record<
  0 | 1 | 2 | 3,
  { label: string; color: string; bg: string; barras: number }
> = {
  0: { label: '', color: 'text-slate-400', bg: 'bg-slate-200 dark:bg-slate-700', barras: 0 },
  1: { label: 'Débil', color: 'text-rose-500', bg: 'bg-rose-400', barras: 1 },
  2: { label: 'Media', color: 'text-amber-500', bg: 'bg-amber-400', barras: 2 },
  3: { label: 'Fuerte', color: 'text-emerald-500', bg: 'bg-emerald-400', barras: 3 },
};

const SeccionHeader = ({
  icono,
  titulo,
}: {
  icono: React.ReactNode;
  titulo: string;
}) => (
  <div className="flex items-center gap-2 mb-3">
    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-500 dark:text-indigo-400 shrink-0">
      {icono}
    </span>
    <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">
      {titulo}
    </span>
    <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800" />
  </div>
);

const CampoContrasena = ({
  label,
  value,
  onChange,
  disabled,
  placeholder,
  minLength,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  disabled: boolean;
  placeholder?: string;
  minLength?: number;
}) => {
  const [visible, setVisible] = useState(false);
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-semibold text-slate-600 dark:text-slate-400">{label}</Label>
      <div className="relative">
        <Input
          type={visible ? 'text' : 'password'}
          minLength={minLength}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          placeholder={placeholder ?? '••••••••'}
          className="h-10 text-sm rounded-lg pr-10"
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setVisible((v) => !v)}
          disabled={disabled}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors focus:outline-none disabled:pointer-events-none"
          aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
};

export const RegistroDocenteFirmado = ({ onVolver }: PropsPaginaVolver) => {
  const params = useMemo(() => new URLSearchParams(window.location.search), []);
  const eid = params.get('eid') ?? '';
  const exp = params.get('exp') ?? '';
  const nonce = params.get('nonce') ?? '';
  const sig = params.get('sig') ?? '';

  const [ci, setCi] = useState('');
  const [codigoDocente, setCodigoDocente] = useState('');
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [correo, setCorreo] = useState('');
  const [carreras, setCarreras] = useState<CarreraRegistroPublico[]>([]);
  const [cargandoCarreras, setCargandoCarreras] = useState(true);
  const [verificandoEnlace, setVerificandoEnlace] = useState(true);
  const [mensajeNoDisponible, setMensajeNoDisponible] = useState<string | null>(null);
  const [seleccionadasIds, setSeleccionadasIds] = useState<number[]>([]);
  const [fechaNacimiento, setFechaNacimiento] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [confirmarContrasena, setConfirmarContrasena] = useState('');
  const [registrando, setRegistrando] = useState(false);
  const [registrado, setRegistrado] = useState(false);

  const fechaInicioCalendario = useMemo(() => new Date(1950, 0), []);
  const fechaFinCalendario = useMemo(() => new Date(), []);

  const invalido = !eid || !exp || !nonce || !sig;

  const fortaleza = calcularFortaleza(contrasena);
  const fortalezaInfo = fortalezaConfig[fortaleza];
  const contrasenaCoincide = contrasena && confirmarContrasena && contrasena === confirmarContrasena;
  const contrasenaNoCoincide = confirmarContrasena && contrasena !== confirmarContrasena;

  const deshabilitado = registrando || registrado;

  useEffect(() => {
    const verificar = async () => {
      if (invalido) {
        setVerificandoEnlace(false);
        return;
      }

      try {
        setVerificandoEnlace(true);
        const resp = await verificarRegistroDocenteConEnlaceFirmado({ eid, exp, nonce, sig });
        if (!resp.ok) {
          setMensajeNoDisponible(resp.message || 'El registro de docentes no está disponible en este momento.');
          return;
        }

        setMensajeNoDisponible(null);
      } catch (error: any) {
        setMensajeNoDisponible(error?.message ?? 'El registro de docentes no está disponible en este momento.');
      } finally {
        setVerificandoEnlace(false);
      }
    };

    void verificar();
  }, []);

  useEffect(() => {
    if (invalido || verificandoEnlace || mensajeNoDisponible) {
      setCargandoCarreras(false);
      return;
    }

    const cargarCarreras = async () => {
      try {
        setCargandoCarreras(true);
        const resultado = await obtenerCarrerasRegistroPublico();
        setCarreras(resultado);
      } catch (error: any) {
        toast.error(error?.message ?? 'No se pudieron cargar las carreras.');
      } finally {
        setCargandoCarreras(false);
      }
    };

    void cargarCarreras();
  }, [invalido, verificandoEnlace, mensajeNoDisponible]);

  const toggleCarrera = (id: number) => {
    if (seleccionadasIds.includes(id)) {
      setSeleccionadasIds(seleccionadasIds.filter((x) => x !== id));
    } else {
      setSeleccionadasIds([...seleccionadasIds, id]);
    }
  };

  const registrar = async () => {
    if (!correo.trim()) { toast.error('Ingresa tu correo electrónico.'); return; }
    if (!ci.trim()) { toast.error('Ingresa tu CI.'); return; }
    if (!nombre.trim()) { toast.error('Ingresa tu nombre.'); return; }
    if (!apellido.trim()) { toast.error('Ingresa tu apellido.'); return; }
    if (!codigoDocente.trim()) { toast.error('Ingresa tu código de docente.'); return; }
    if (seleccionadasIds.length === 0) { toast.error('Selecciona al menos una carrera.'); return; }
    if (!fechaNacimiento.trim()) { toast.error('Ingresa tu fecha de nacimiento.'); return; }
    if (!contrasena.trim() || contrasena.trim().length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres.'); return;
    }
    if (contrasena !== confirmarContrasena) {
      toast.error('La confirmación de contraseña no coincide.'); return;
    }

    try {
      setRegistrando(true);
      const respuesta = await registrarDocenteConEnlaceFirmado({
        eid, exp, nonce, sig,
        payload: {
          correo: correo.trim().toLowerCase(),
          ci: ci.trim(),
          codigo: codigoDocente.trim(),
          nombre: nombre.trim(),
          apellido: apellido.trim(),
          carrerasIds: seleccionadasIds,
          carreraId: seleccionadasIds[0],
          fechaNacimiento,
          contrasena: contrasena.trim(),
        },
      });

      if (respuesta.ok) {
        setRegistrado(true);
        toast.success('Solicitud de registro enviada. Pendiente de aprobación.');
        return;
      }

      const msg = respuesta.message || 'No se pudo completar el registro.';
      toast.error(msg);
      if (/deshabilitad|no disponible|invitaci[oó]n/i.test(msg)) {
        setMensajeNoDisponible(msg);
      }
    } catch (err: any) {
      toast.error(err?.message ?? 'No se pudo completar el registro.');
    } finally {
      setRegistrando(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-slate-100 dark:from-slate-950 dark:via-indigo-950/20 dark:to-slate-900 flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-xl animate-in fade-in zoom-in-95 duration-300">
        {invalido ? (
          <EstadoAccionPublica
            estado="expirado"
            titulo="Enlace inválido o incompleto"
            descripcion="El enlace de registro que has abierto no contiene los parámetros firmados necesarios o está incompleto. Por favor solicita un nuevo enlace al administrador."
          >
            <Boton variant="outline" className="w-full rounded-xl" onClick={onVolver}>
              Volver al inicio
            </Boton>
          </EstadoAccionPublica>
        ) : verificandoEnlace ? (
          <EstadoAccionPublica
            estado="cargando"
            titulo="Verificando invitación..."
            descripcion="Estamos validando los parámetros de tu invitación firmada con el servidor para habilitar el formulario de registro."
          />
        ) : mensajeNoDisponible ? (
          <EstadoAccionPublica
            estado="expirado"
            titulo="Registro no disponible"
            descripcion={mensajeNoDisponible}
          >
            <Boton variant="outline" className="w-full rounded-xl" onClick={onVolver}>
              Volver
            </Boton>
          </EstadoAccionPublica>
        ) : registrado ? (
          <EstadoAccionPublica
            estado="exito"
            titulo="¡Solicitud de Registro Enviada!"
            descripcion={
              <span>
                Tu cuenta de docente con correo <strong className="font-semibold text-slate-800 dark:text-slate-200">{correo}</strong> se ha registrado y está pendiente de aprobación por el encargado de inventario. Podrás iniciar sesión una vez sea aprobada.
              </span>
            }
          >
            <Boton className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl" onClick={onVolver}>
              Volver al inicio
            </Boton>
          </EstadoAccionPublica>
        ) : registrando ? (
          <EstadoAccionPublica
            estado="cargando"
            titulo="Creando tu cuenta..."
            descripcion="Estamos procesando tus datos de docente y generando tus claves de acceso seguras. Esto tomará solo unos segundos."
          />
        ) : (
          <div className="rounded-2xl border border-slate-200/80 bg-white/95 shadow-2xl shadow-indigo-100/40 dark:border-slate-800 dark:bg-slate-900/90 dark:shadow-indigo-950/20 backdrop-blur-sm overflow-hidden">
            <div className="px-6 pt-6 pb-5 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-200 dark:shadow-indigo-950 shrink-0">
                  <GraduationCap className="h-5 w-5" />
                </div>
                <div>
                  <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100">
                    Registro de Docente
                  </h1>
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Completa tus datos para crear tu cuenta oficial de docente. Asegúrate de ingresar información válida.
                  </p>
                </div>
              </div>
            </div>
            <div className="px-6 py-5 space-y-6 max-h-[70vh] overflow-y-auto">
              <div>
                <SeccionHeader icono={<User className="h-4 w-4" />} titulo="Datos personales" />
                <div className="space-y-3">
                  {/* Correo */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Correo electrónico</Label>
                    <Input
                      type="email"
                      value={correo}
                      onChange={(e) => setCorreo(e.target.value)}
                      disabled={deshabilitado}
                      placeholder="Ej: docente@usfx.edu.bo"
                      className="h-10 text-sm rounded-lg"
                    />
                  </div>
                  <div className="grid gap-3 grid-cols-2">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Nombre(s)</Label>
                      <Input
                        value={nombre}
                        onChange={(e) => setNombre(e.target.value)}
                        disabled={deshabilitado}
                        placeholder="Ej: Juan"
                        className="h-10 text-sm rounded-lg"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Apellido(s)</Label>
                      <Input
                        value={apellido}
                        onChange={(e) => setApellido(e.target.value)}
                        disabled={deshabilitado}
                        placeholder="Ej: Pérez"
                        className="h-10 text-sm rounded-lg"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Fecha de nacimiento</Label>
                    <DatePicker
                      value={fechaNacimiento}
                      onChange={setFechaNacimiento}
                      placeholder="Selecciona tu fecha de nacimiento"
                      className="h-10 rounded-lg"
                      startMonth={fechaInicioCalendario}
                      endMonth={fechaFinCalendario}
                    />
                  </div>
                </div>
              </div>
              <div>
                <SeccionHeader icono={<IdCard className="h-4 w-4" />} titulo="Datos académicos" />
                <div className="space-y-3">
                  <div className="grid gap-3 grid-cols-2">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-slate-600 dark:text-slate-400">CI</Label>
                      <Input
                        value={ci}
                        onChange={(e) => setCi(e.target.value)}
                        disabled={deshabilitado}
                        placeholder="Ej: 12345678"
                        className="h-10 text-sm rounded-lg"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Código de Docente</Label>
                      <Input
                        value={codigoDocente}
                        onChange={(e) => setCodigoDocente(e.target.value)}
                        disabled={deshabilitado}
                        placeholder="Ej: DOC-456"
                        className="h-10 text-sm rounded-lg"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Carrera(s)</Label>
                    {cargandoCarreras ? (
                      <p className="text-xs text-slate-500 dark:text-slate-400">Cargando carreras...</p>
                    ) : carreras.length === 0 ? (
                      <p className="text-[10px] text-rose-500 dark:text-rose-400 leading-none mt-1">
                        No hay carreras disponibles para registro en este momento.
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2 max-h-36 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-lg p-3 bg-slate-50/50 dark:bg-slate-950/50">
                        {carreras.map((carrera) => {
                          const idNum = Number(carrera.id);
                          const isChecked = seleccionadasIds.includes(idNum);
                          return (
                            <label
                              key={carrera.id}
                              className="flex items-center gap-2.5 p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-900 cursor-pointer select-none"
                            >
                              <Checkbox
                                checked={isChecked}
                                onChange={() => toggleCarrera(idNum)}
                                disabled={deshabilitado}
                              />
                              <span className="text-xs text-slate-700 dark:text-slate-300">{carrera.nombre}</span>
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* ── Sección: Seguridad ── */}
              <div>
                <SeccionHeader icono={<KeyRound className="h-4 w-4" />} titulo="Seguridad" />
                <div className="space-y-3">
                  <CampoContrasena
                    label="Contraseña"
                    value={contrasena}
                    onChange={setContrasena}
                    disabled={deshabilitado}
                    minLength={6}
                  />

                  {/* Indicador de fortaleza */}
                  {contrasena && (
                    <div className="space-y-1">
                      <div className="flex gap-1">
                        {[1, 2, 3].map((i) => (
                          <div
                            key={i}
                            className={cn(
                              'h-1 flex-1 rounded-full transition-all duration-300',
                              i <= fortalezaInfo.barras
                                ? fortalezaInfo.bg
                                : 'bg-slate-200 dark:bg-slate-700',
                            )}
                          />
                        ))}
                      </div>
                      {fortaleza > 0 && (
                        <p className={cn('text-[10px] font-medium', fortalezaInfo.color)}>
                          Contraseña {fortalezaInfo.label.toLowerCase()}
                        </p>
                      )}
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <CampoContrasena
                      label="Confirmar contraseña"
                      value={confirmarContrasena}
                      onChange={setConfirmarContrasena}
                      disabled={deshabilitado}
                      minLength={6}
                    />
                    {contrasenaNoCoincide && (
                      <p className="text-[10px] text-rose-500 dark:text-rose-400 leading-none">
                        Las contraseñas no coinciden.
                      </p>
                    )}
                    {contrasenaCoincide && (
                      <p className="text-[10px] text-emerald-500 dark:text-emerald-400 leading-none">
                        Las contraseñas coinciden. ✓
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 flex items-center justify-between gap-3">
              <Boton
                variant="outline"
                onClick={onVolver}
                disabled={registrando}
                className="rounded-xl h-10 px-5 text-xs"
              >
                Volver
              </Boton>
              <Boton
                onClick={() => { void registrar(); }}
                disabled={registrando || registrado}
                className="rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white h-10 px-6 text-xs font-semibold shadow-md shadow-indigo-200 dark:shadow-indigo-950 hover:shadow-lg transition-all duration-150"
              >
                Crear cuenta
              </Boton>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
