import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Boton } from '@/componentes/ui/button';
import { Input } from '@/componentes/ui/input';
import { Label } from '@/componentes/ui/label';
import { subirPdfSolicitudFirmada } from '@/lib/servicio-docencia';
import type { PropsPaginaVolver } from '@/tipos/paginas';

export const SubirSolicitudFirmada = ({ onVolver }: PropsPaginaVolver) => {
  const params = useMemo(() => new URLSearchParams(window.location.search), []);
  const id = params.get('subir-solicitud') ?? '';
  const rid = params.get('rid') ?? '';
  const exp = params.get('exp') ?? '';
  const sig = params.get('sig') ?? '';

  const [archivo, setArchivo] = useState<File | null>(null);
  const [subiendo, setSubiendo] = useState(false);

  const invalido = !id || !rid || !exp || !sig;

  const subir = async () => {
    if (!archivo) {
      toast.error('Selecciona un PDF antes de subirlo.');
      return;
    }

    if (archivo.type !== 'application/pdf' && !archivo.name.toLowerCase().endsWith('.pdf')) {
      toast.error('Solo se permiten archivos PDF.');
      return;
    }

    try {
      setSubiendo(true);
      const resp = await subirPdfSolicitudFirmada({ id, rid, exp, sig, archivo });
      if (resp.ok) {
        toast.success('PDF subido correctamente.');
        setArchivo(null);
        return;
      }
      toast.error(resp.message || 'No se pudo subir el PDF.');
    } catch (err: any) {
      toast.error(err?.message ?? 'No se pudo subir el PDF.');
    } finally {
      setSubiendo(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 dark:bg-slate-950">
      <div className="mx-auto w-full max-w-xl rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">Subir solicitud firmada</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Sube el PDF de la solicitud con las firmas según el formato estándar.
        </p>

        {invalido ? (
          <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-200">
            El enlace no es válido o está incompleto.
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300">
              <div><span className="font-semibold">Solicitud:</span> {id}</div>
            </div>

            <div className="space-y-2">
              <Label>PDF firmado</Label>
              <Input
                type="file"
                accept="application/pdf,.pdf"
                disabled={subiendo}
                onChange={(e) => setArchivo(e.target.files?.[0] ?? null)}
              />
              <div className="text-xs text-slate-500 dark:text-slate-400">
                Solo PDF. Tamaño máximo ~12MB.
              </div>
            </div>

            <div className="flex items-center justify-between gap-3">
              <Boton variant="outline" onClick={onVolver} disabled={subiendo}>
                Volver
              </Boton>
              <Boton onClick={() => { void subir(); }} disabled={subiendo || !archivo}>
                {subiendo ? 'Subiendo…' : 'Subir PDF'}
              </Boton>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
