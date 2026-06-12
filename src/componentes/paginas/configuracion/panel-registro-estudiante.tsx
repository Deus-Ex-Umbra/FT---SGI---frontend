import { Copy, Download } from 'lucide-react';
import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { toast } from 'sonner';
import { Boton } from '@/componentes/ui/button';
import { Input } from '@/componentes/ui/input';
import {
    actualizarConfiguracionRegistroEstudiante,
    obtenerConfiguracionRegistroEstudiante,
} from '@/lib/servicio-configuracion';
import {
    deshabilitarUrlFirmadaRegistroEstudiante,
    generarUrlFirmadaRegistroEstudiante,
    obtenerUrlFirmadaRegistroEstudianteActiva,
} from '@/lib/servicio-autenticacion';

const construirUrlRegistro = (params: { eid: string; exp: number; nonce: string; sig: string }) => {
    const base = `${window.location.origin}/registro-estudiante`;
    const query = new URLSearchParams({
        eid: params.eid,
        exp: String(params.exp),
        nonce: params.nonce,
        sig: params.sig,
    });
    return `${base}?${query.toString()}`;
};

export const PanelRegistroEstudiante = () => {
    const [registroHabilitado, setRegistroHabilitado] = useState(true);
    const [cargandoRegistro, setCargandoRegistro] = useState(false);
    const [guardandoRegistro, setGuardandoRegistro] = useState(false);
    const [generandoEnlace, setGenerandoEnlace] = useState(false);
    const [deshabilitandoEnlace, setDeshabilitandoEnlace] = useState(false);
    const [cargandoEnlaceActivo, setCargandoEnlaceActivo] = useState(false);
    const [enlaceRegistro, setEnlaceRegistro] = useState('');
    const [qrRegistroDataUrl, setQrRegistroDataUrl] = useState('');
    const [generandoQrRegistro, setGenerandoQrRegistro] = useState(false);

    useEffect(() => {
        const cargar = async () => {
            setCargandoRegistro(true);
            try {
                const cfg = await obtenerConfiguracionRegistroEstudiante();
                setRegistroHabilitado(cfg.habilitado);
            } catch (err: any) {
                toast.error(err?.message || 'No se pudo cargar la configuracion de registro de estudiantes.');
            } finally {
                setCargandoRegistro(false);
            }
        };

        const cargarEnlaceActivo = async () => {
            setCargandoEnlaceActivo(true);
            try {
                const activa = await obtenerUrlFirmadaRegistroEstudianteActiva();
                if (activa.ok && activa.eid && activa.exp && activa.nonce && activa.sig) {
                    setEnlaceRegistro(
                        construirUrlRegistro({
                            eid: activa.eid,
                            exp: activa.exp,
                            nonce: activa.nonce,
                            sig: activa.sig,
                        }),
                    );
                    return;
                }
                setEnlaceRegistro('');
            } catch {
                setEnlaceRegistro('');
            } finally {
                setCargandoEnlaceActivo(false);
            }
        };

        void cargar();
        void cargarEnlaceActivo();
    }, []);

    useEffect(() => {
        let activa = true;

        const generarQrLocal = async () => {
            if (!enlaceRegistro) {
                setQrRegistroDataUrl('');
                setGenerandoQrRegistro(false);
                return;
            }

            setGenerandoQrRegistro(true);
            try {
                const dataUrl = await QRCode.toDataURL(enlaceRegistro, {
                    errorCorrectionLevel: 'M',
                    margin: 2,
                    width: 320,
                });
                if (activa) {
                    setQrRegistroDataUrl(dataUrl);
                }
            } catch {
                if (activa) {
                    setQrRegistroDataUrl('');
                }
            } finally {
                if (activa) {
                    setGenerandoQrRegistro(false);
                }
            }
        };

        void generarQrLocal();

        return () => {
            activa = false;
        };
    }, [enlaceRegistro]);

    const cambiarEstadoRegistro = async (habilitado: boolean) => {
        if (registroHabilitado === habilitado) return;

        setGuardandoRegistro(true);
        try {
            const cfg = await actualizarConfiguracionRegistroEstudiante({ habilitado });
            setRegistroHabilitado(cfg.habilitado);
            setEnlaceRegistro('');
            toast.success(
                cfg.habilitado
                    ? 'Inscripcion habilitada. Debes generar un nuevo QR.'
                    : 'Inscripcion deshabilitada. El QR anterior ya no es valido.',
            );
        } catch (err: any) {
            toast.error(err?.message || 'No se pudo actualizar el estado del registro.');
        } finally {
            setGuardandoRegistro(false);
        }
    };

    const generarEnlace = async () => {
        setGenerandoEnlace(true);
        try {
            const data = await generarUrlFirmadaRegistroEstudiante();
            if (!data.ok || !data.eid || !data.exp || !data.nonce || !data.sig) {
                toast.error(data.message || 'No se pudo generar el enlace firmado.');
                return;
            }

            const url = construirUrlRegistro({
                eid: data.eid,
                exp: data.exp,
                nonce: data.nonce,
                sig: data.sig,
            });
            setEnlaceRegistro(url);

            try {
                await navigator.clipboard.writeText(url);
                toast.success('Enlace generado y copiado al portapapeles.');
            } catch {
                toast.success('Enlace generado.');
            }
        } catch (err: any) {
            toast.error(err?.message || 'No se pudo generar el enlace firmado.');
        } finally {
            setGenerandoEnlace(false);
        }
    };

    const deshabilitarEnlaceRegistro = async () => {
        setDeshabilitandoEnlace(true);
        try {
            const resp = await deshabilitarUrlFirmadaRegistroEstudiante();
            setEnlaceRegistro('');
            toast.success(resp.message || 'Invitacion de registro deshabilitada.');
        } catch (err: any) {
            toast.error(err?.message || 'No se pudo deshabilitar la invitacion de registro.');
        } finally {
            setDeshabilitandoEnlace(false);
        }
    };

    const copiarEnlaceRegistro = async () => {
        if (!enlaceRegistro) return;
        try {
            await navigator.clipboard.writeText(enlaceRegistro);
            toast.success('Enlace copiado al portapapeles.');
        } catch {
            toast.error('No se pudo copiar el enlace.');
        }
    };

    const copiarQrRegistro = async () => {
        if (!qrRegistroDataUrl) return;

        const clipboard = navigator.clipboard as Clipboard & {
            write?: (data: unknown[]) => Promise<void>;
        };
        const ClipboardItemGlobal = (window as Window & { ClipboardItem?: new (items: Record<string, Blob>) => unknown }).ClipboardItem;

        if (!clipboard?.write || !ClipboardItemGlobal) {
            toast.error('Tu navegador no permite copiar imagenes. Usa Descargar QR.');
            return;
        }

        try {
            const respuesta = await fetch(qrRegistroDataUrl);
            const blob = await respuesta.blob();
            const item = new ClipboardItemGlobal({
                'image/png': blob,
            });
            await clipboard.write([item]);
            toast.success('QR copiado al portapapeles.');
        } catch {
            toast.error('No se pudo copiar el QR.');
        }
    };

    const descargarQrRegistro = () => {
        if (!qrRegistroDataUrl) return;
        const enlaceDescarga = document.createElement('a');
        enlaceDescarga.href = qrRegistroDataUrl;
        enlaceDescarga.download = 'qr-registro-estudiante.png';
        enlaceDescarga.click();
    };

    return (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Inscripcion de nuevos estudiantes</h3>

            <div className="mt-4 space-y-4">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                    Controla si los estudiantes pueden registrarse por enlace firmado y genera un enlace temporal.
                </p>

                <div className="flex flex-wrap items-center gap-2">
                    <Boton
                        type="button"
                        variant={registroHabilitado ? 'default' : 'outline'}
                        onClick={() => {
                            void cambiarEstadoRegistro(true);
                        }}
                        disabled={cargandoRegistro || guardandoRegistro}
                    >
                        Habilitar registro
                    </Boton>
                    <Boton
                        type="button"
                        variant={!registroHabilitado ? 'destructive' : 'outline'}
                        onClick={() => {
                            void cambiarEstadoRegistro(false);
                        }}
                        disabled={cargandoRegistro || guardandoRegistro}
                    >
                        Deshabilitar registro
                    </Boton>
                    <span className="text-xs text-slate-500 dark:text-slate-400">Estado actual: {registroHabilitado ? 'habilitado' : 'deshabilitado'}</span>
                </div>

                <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                        <Boton
                            type="button"
                            onClick={() => {
                                void generarEnlace();
                            }}
                            disabled={!registroHabilitado || generandoEnlace || cargandoRegistro || guardandoRegistro || deshabilitandoEnlace}
                        >
                            {generandoEnlace ? 'Generando Enlace...' : 'Generar Enlace'}
                        </Boton>
                        <Boton
                            type="button"
                            variant="outline"
                            onClick={() => {
                                void deshabilitarEnlaceRegistro();
                            }}
                            disabled={!enlaceRegistro || generandoEnlace || deshabilitandoEnlace || cargandoRegistro || guardandoRegistro}
                        >
                            {deshabilitandoEnlace ? 'Deshabilitando...' : 'Deshabilitar Enlace'}
                        </Boton>
                        {cargandoEnlaceActivo && <span className="text-xs text-slate-500 dark:text-slate-400">Cargando enlace activo...</span>}
                    </div>

                    <div className="flex flex-col gap-2 md:flex-row md:items-center">
                        <Input value={enlaceRegistro} onChange={(e) => setEnlaceRegistro(e.target.value)} placeholder="Aqui se mostrara la URL firmada para registro" />
                        <Boton
                            type="button"
                            variant="outline"
                            onClick={() => {
                                void copiarEnlaceRegistro();
                            }}
                            disabled={!enlaceRegistro}
                            className="md:shrink-0"
                        >
                            <Copy className="mr-1 h-4 w-4" />
                            Copiar enlace
                        </Boton>
                    </div>

                    {enlaceRegistro && (
                        <div className="flex flex-col items-center justify-center gap-3 rounded-md border border-slate-200 bg-slate-50 p-4 text-center dark:border-slate-800 dark:bg-slate-950">
                            <span className="text-xs text-slate-600 dark:text-slate-300">QR para compartir el registro habilitado</span>

                            {generandoQrRegistro ? (
                                <div className="flex h-44 w-44 items-center justify-center rounded-md border border-slate-200 bg-white text-xs text-slate-500 dark:border-slate-700">
                                    Generando QR...
                                </div>
                            ) : qrRegistroDataUrl ? (
                                <img
                                    src={qrRegistroDataUrl}
                                    alt="QR invitacion registro estudiante"
                                    className="h-44 w-44 rounded-md border border-slate-200 bg-white p-1 dark:border-slate-700"
                                />
                            ) : (
                                <div className="flex h-44 w-44 items-center justify-center rounded-md border border-slate-200 bg-white text-xs text-red-600 dark:border-slate-700 dark:text-red-400">
                                    No se pudo generar el QR
                                </div>
                            )}

                            <div className="flex flex-wrap items-center justify-center gap-2">
                                <Boton
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                        void copiarQrRegistro();
                                    }}
                                    disabled={!qrRegistroDataUrl}
                                >
                                    <Copy className="mr-1 h-4 w-4" />
                                    Copiar QR
                                </Boton>
                                <Boton type="button" variant="outline" onClick={descargarQrRegistro} disabled={!qrRegistroDataUrl}>
                                    <Download className="mr-1 h-4 w-4" />
                                    Descargar QR
                                </Boton>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};