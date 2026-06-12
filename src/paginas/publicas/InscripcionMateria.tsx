import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Boton } from '@/componentes/ui/button';
import { Input } from '@/componentes/ui/input';
import { Label } from '@/componentes/ui/label';
import { inscribirseMateriaPublicaPorCodigo } from '@/lib/servicio-docencia';
import type { PropsPaginaVolver } from '@/tipos/paginas';
import { EstadoAccionPublica } from '@/componentes/paginas/compartido/estado-accion-publica';
import { BookOpen } from 'lucide-react';

export const InscripcionMateria = ({ onVolver }: PropsPaginaVolver) => {
  const params = useMemo(() => new URLSearchParams(window.location.search), []);
  const codigoUrl = params.get('inscribir-materia-codigo') ?? '';

  const [codigo, setCodigo] = useState(codigoUrl);
  const [carnet, setCarnet] = useState('');
  const [inscribiendo, setInscribiendo] = useState(false);
  const [estadoResultado, setEstadoResultado] = useState<'formulario' | 'exito' | 'error'>('formulario');
  const [mensajeError, setMensajeError] = useState('');
  const [materiaInscrita, setMateriaInscrita] = useState<any>(null);

  const prellenado = !!codigoUrl;

  const inscribir = async () => {
    const codeClean = codigo.trim().toUpperCase();
    if (!codeClean) {
      toast.error('Ingresa el código de inscripción.');
      return;
    }
    if (codeClean.length < 4) {
      toast.error('El código de inscripción debe tener al menos 4 caracteres.');
      return;
    }
    if (!carnet.trim()) {
      toast.error('Ingresa tu carnet para continuar.');
      return;
    }

    try {
      setInscribiendo(true);
      const resp = await inscribirseMateriaPublicaPorCodigo(codeClean, carnet.trim());

      if (resp.ok) {
        setMateriaInscrita(resp);
        setEstadoResultado('exito');
        toast.success('Inscripción registrada correctamente.');
        return;
      }

      setMensajeError(resp.message || 'No se pudo completar la inscripción.');
      setEstadoResultado('error');
    } catch (err: any) {
      setMensajeError(err?.message ?? 'No se pudo completar la inscripción.');
      setEstadoResultado('error');
    } finally {
      setInscribiendo(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 dark:bg-slate-950">
      <div className="w-full max-w-lg animate-in fade-in zoom-in-95 duration-300">
        {estadoResultado === 'exito' ? (
          <EstadoAccionPublica
            estado="exito"
            titulo="¡Inscripción Exitosa!"
            descripcion={
              <span>
                Te has inscrito correctamente en la materia{' '}
                <strong className="font-semibold text-slate-800 dark:text-slate-200">
                  {materiaInscrita?.nombreMateria || materiaInscrita?.materiaId || codigo.trim().toUpperCase()}
                </strong>{' '}
                {materiaInscrita?.grupo && `(Grupo ${materiaInscrita.grupo})`}. Ya figuras en la lista oficial del docente.
              </span>
            }
          >
            <Boton className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl" onClick={onVolver}>
              Ir al Panel
            </Boton>
          </EstadoAccionPublica>
        ) : estadoResultado === 'error' ? (
          <EstadoAccionPublica
            estado="error"
            titulo="No se pudo procesar la inscripción"
            descripcion={mensajeError}
          >
            <div className="flex flex-col gap-2">
              <Boton className="w-full bg-rose-600 hover:bg-rose-700 text-white rounded-xl" onClick={() => setEstadoResultado('formulario')}>
                Reintentar
              </Boton>
              <Boton variant="outline" className="w-full rounded-xl" onClick={onVolver}>
                Volver
              </Boton>
            </div>
          </EstadoAccionPublica>
        ) : inscribiendo ? (
          <EstadoAccionPublica
            estado="cargando"
            titulo="Registrando inscripción..."
            descripcion="Validando código de inscripción y registrando tu matrícula en el grupo oficial del docente."
          />
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900/80 backdrop-blur-md">
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-indigo-500" />
              Inscripción a Materia
            </h1>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              Ingresa el código alfanumérico provisto por tu docente y tu carnet de identidad para unirte al grupo oficial.
            </p>

            <div className="mt-6 space-y-5">
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Código de Inscripción</Label>
                <Input
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value.toUpperCase())}
                  disabled={prellenado || inscribiendo}
                  placeholder="Ej: MAT101"
                  className="h-10 text-sm rounded-lg font-mono font-bold tracking-wider"
                />
                {prellenado && (
                  <div className="text-[10px] text-indigo-500 dark:text-indigo-400 font-medium leading-tight">
                    Código de inscripción prellenado desde invitación QR.
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Carnet de Identidad</Label>
                <Input
                  value={carnet}
                  onChange={(e) => setCarnet(e.target.value)}
                  disabled={inscribiendo}
                  placeholder="Ej: 12345678"
                  className="h-10 text-sm rounded-lg"
                />
                <div className="text-[10px] text-slate-400 dark:text-slate-500 leading-tight">
                  Tu carnet debe coincidir exactamente con el carnet de estudiante registrado previamente en el sistema.
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 pt-2">
                <Boton variant="outline" onClick={onVolver} disabled={inscribiendo} className="rounded-xl h-10 px-5 text-xs">
                  Volver
                </Boton>
                <Boton onClick={() => { void inscribir(); }} disabled={inscribiendo} className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white h-10 px-6 text-xs shadow-md hover:shadow-lg transition-all">
                  Inscribirme
                </Boton>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
