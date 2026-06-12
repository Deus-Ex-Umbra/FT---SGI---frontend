import { useState } from 'react';
import { 
    Lock, 
    KeyRound, 
    ShieldCheck, 
    Eye, 
    EyeOff, 
    AlertCircle,
    Database,
    Trash2,
    Download,
    AlertTriangle,
    Loader2,
    Mail
} from 'lucide-react';
import type { PropsPaginaConfiguracion } from '@/tipos/paginas';
import { LayoutPagina } from '@/componentes/layout/layout-pagina';
import { obtenerUsuarioActual, cambiarContrasena, cambiarCorreo } from '@/lib/servicio-autenticacion';
import { obtenerEtiquetaRol } from '@/utilidades/navegacion';
import { limpiarBaseDatos, descargarEstructuraSql, descargarDatosSql } from '@/lib/servicio-administrador';
import { toast } from 'sonner';

export const Configuracion = ({ onNavegar, onCerrarSesion }: PropsPaginaConfiguracion) => {
    const usuario = obtenerUsuarioActual();
    const [contrasenaActual, setContrasenaActual] = useState('');
    const [nuevaContrasena, setNuevaContrasena] = useState('');
    const [confirmarContrasena, setConfirmarContrasena] = useState('');
    const [guardando, setGuardando] = useState(false);
    const [verContrasenaActual, setVerContrasenaActual] = useState(false);
    const [verNuevaContrasena, setVerNuevaContrasena] = useState(false);
    const [verConfirmarContrasena, setVerConfirmarContrasena] = useState(false);
    const [correoContrasenaActual, setCorreoContrasenaActual] = useState('');
    const [nuevoCorreo, setNuevoCorreo] = useState('');
    const [guardandoCorreo, setGuardandoCorreo] = useState(false);
    const [verCorreoContrasena, setVerCorreoContrasena] = useState(false);
    const [editandoCorreo, setEditandoCorreo] = useState(false);
    const [tabActiva, setTabActiva] = useState<'cuenta' | 'datos'>('cuenta');
    const [limpiandoDb, setLimpiandoDb] = useState(false);
    const [descargandoSql, setDescargandoSql] = useState(false);
    const [descargandoDatos, setDescargandoDatos] = useState(false);
    const [mostrarConfirmacionLimpieza, setMostrarConfirmacionLimpieza] = useState(false);
    const [confirmInput, setConfirmInput] = useState('');

    const handleCambiarContrasena = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!contrasenaActual) {
            toast.error('Ingresa tu contraseña actual.');
            return;
        }

        if (nuevaContrasena.length < 6) {
            toast.error('La nueva contraseña debe tener al menos 6 caracteres.');
            return;
        }

        if (nuevaContrasena !== confirmarContrasena) {
            toast.error('La confirmación de la nueva contraseña no coincide.');
            return;
        }

        try {
            setGuardando(true);
            const respuesta = await cambiarContrasena(contrasenaActual, nuevaContrasena);
            if (respuesta.ok) {
                toast.success('Contraseña cambiada exitosamente.');
                setContrasenaActual('');
                setNuevaContrasena('');
                setConfirmarContrasena('');
            } else {
                toast.error(respuesta.message || 'No se pudo cambiar la contraseña.');
            }
        } catch (error: any) {
            toast.error(error?.message || 'Error al intentar cambiar la contraseña.');
        } finally {
            setGuardando(false);
        }
    };

    const handleCambiarCorreo = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!correoContrasenaActual) {
            toast.error('Ingresa tu contraseña actual.');
            return;
        }

        const correoNorm = nuevoCorreo.trim().toLowerCase();
        if (!correoNorm) {
            toast.error('El nuevo correo electrónico es obligatorio.');
            return;
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correoNorm)) {
            toast.error('El formato del correo es inválido.');
            return;
        }

        try {
            setGuardandoCorreo(true);
            const respuesta = await cambiarCorreo(correoContrasenaActual, correoNorm);
            if (respuesta.ok) {
                toast.success('Correo electrónico cambiado exitosamente. Recargando...');
                setCorreoContrasenaActual('');
                setNuevoCorreo('');
                setEditandoCorreo(false);
                setTimeout(() => {
                    window.location.reload();
                }, 1000);
            } else {
                toast.error(respuesta.message || 'No se pudo cambiar el correo.');
            }
        } catch (error: any) {
            toast.error(error?.message || 'Error al intentar cambiar el correo.');
        } finally {
            setGuardandoCorreo(false);
        }
    };

    const handleLimpiarBaseDatos = async () => {
        if (confirmInput.toUpperCase() !== 'LIMPIAR') {
            toast.error('Por favor escribe "LIMPIAR" para confirmar la limpieza.');
            return;
        }

        try {
            setLimpiandoDb(true);
            const res = await limpiarBaseDatos();
            if (res.ok) {
                toast.success(res.message || 'Base de datos limpia correctamente.');
                setMostrarConfirmacionLimpieza(false);
                setConfirmInput('');
            } else {
                toast.error('Ocurrió un error al limpiar la base de datos.');
            }
        } catch (error: any) {
            toast.error(error?.message || 'Error al limpiar la base de datos.');
        } finally {
            setLimpiandoDb(false);
        }
    };

    const handleDescargarEstructuraSql = async () => {
        try {
            setDescargandoSql(true);
            const blob = await descargarEstructuraSql();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'estructura_db.sql';
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
            toast.success('Estructura SQL descargada correctamente.');
        } catch (error: any) {
            toast.error(error?.message || 'Error al descargar la estructura SQL.');
        } finally {
            setDescargandoSql(false);
        }
    };

    const handleDescargarDatosSql = async () => {
        try {
            setDescargandoDatos(true);
            const blob = await descargarDatosSql();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'datos_db.sql';
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
            toast.success('Datos descargados correctamente.');
        } catch (error: any) {
            toast.error(error?.message || 'Error al descargar los datos.');
        } finally {
            setDescargandoDatos(false);
        }
    };

    const primeraLetraCorreo = usuario?.correo ? usuario.correo.charAt(0).toUpperCase() : 'U';

    return (
        <LayoutPagina
            paginaActiva="configuracion"
            titulo="Configuración"
            subtitulo="Ajustes generales del sistema y de tu cuenta"
            onNavegar={onNavegar}
            onCerrarSesion={onCerrarSesion}
        >
            <div className="space-y-6">
                {usuario?.rol === 'administrador' && (
                    <div className="flex border-b border-slate-200">
                        <button
                            onClick={() => setTabActiva('cuenta')}
                            className={`flex items-center gap-2 pb-3 px-4 text-sm font-bold border-b-2 transition-all outline-none ${
                                tabActiva === 'cuenta'
                                    ? 'border-blue-600 text-blue-600'
                                    : 'border-transparent text-slate-500 hover:text-slate-700'
                             }`}
                        >
                            <Lock className="h-4 w-4" />
                            Mi Cuenta y Seguridad
                        </button>
                        <button
                            onClick={() => setTabActiva('datos')}
                            className={`flex items-center gap-2 pb-3 px-4 text-sm font-bold border-b-2 transition-all outline-none ${
                                tabActiva === 'datos'
                                    ? 'border-blue-600 text-blue-600'
                                    : 'border-transparent text-slate-500 hover:text-slate-700'
                            }`}
                        >
                            <Database className="h-4 w-4" />
                            Administración de Datos
                        </button>
                    </div>
                )}

                {tabActiva === 'cuenta' ? (
                    <div className="space-y-6">
                        <div className="grid gap-6 md:grid-cols-[1fr_1.5fr]">
                            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col items-center text-center justify-between">
                                <div className="space-y-4 w-full">
                                    <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 text-3xl font-bold text-white shadow-md">
                                        {primeraLetraCorreo}
                                    </div>
                                    
                                    <div className="w-full">
                                        {editandoCorreo ? (
                                            <form onSubmit={handleCambiarCorreo} className="space-y-3 mt-2 text-left">
                                                <div className="space-y-1">
                                                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                                        Nuevo Correo
                                                    </label>
                                                    <input
                                                        type="email"
                                                        value={nuevoCorreo}
                                                        onChange={(e) => setNuevoCorreo(e.target.value)}
                                                        className="w-full rounded-lg border border-slate-200 py-1.5 px-3 text-sm text-slate-800 bg-white outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                                                        placeholder="nuevo-correo@ejemplo.com"
                                                        required
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                                        Confirmar con Contraseña
                                                    </label>
                                                    <div className="relative">
                                                        <input
                                                            type={verCorreoContrasena ? 'text' : 'password'}
                                                            value={correoContrasenaActual}
                                                            onChange={(e) => setCorreoContrasenaActual(e.target.value)}
                                                            className="w-full rounded-lg border border-slate-200 py-1.5 pl-3 pr-8 text-sm text-slate-800 bg-white outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                                                            placeholder="Contraseña actual"
                                                            required
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => setVerCorreoContrasena(!verCorreoContrasena)}
                                                            className="absolute inset-y-0 right-0 flex items-center pr-2.5 text-slate-400 hover:text-slate-600"
                                                        >
                                                            {verCorreoContrasena ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2 pt-1">
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setEditandoCorreo(false);
                                                            setNuevoCorreo('');
                                                            setCorreoContrasenaActual('');
                                                        }}
                                                        className="flex-1 rounded-lg border border-slate-200 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                                                    >
                                                        Cancelar
                                                    </button>
                                                    <button
                                                        type="submit"
                                                        disabled={guardandoCorreo}
                                                        className="flex-1 rounded-lg bg-blue-600 py-1.5 text-xs font-bold text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
                                                    >
                                                        {guardandoCorreo ? 'Guardando...' : 'Guardar'}
                                                    </button>
                                                </div>
                                            </form>
                                        ) : (
                                            <div className="flex flex-col items-center">
                                                <h3 className="text-lg font-bold text-slate-800 break-all flex items-center gap-1.5 justify-center">
                                                    {usuario?.correo}
                                                    {usuario?.rol === 'administrador' && (
                                                        <button
                                                            onClick={() => {
                                                                setNuevoCorreo(usuario.correo || '');
                                                                setEditandoCorreo(true);
                                                            }}
                                                            className="text-slate-400 hover:text-blue-600 transition-colors p-1 rounded-md hover:bg-slate-50"
                                                            title="Editar correo"
                                                        >
                                                            <Mail className="h-4 w-4" />
                                                        </button>
                                                    )}
                                                </h3>
                                                <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-slate-500">
                                                    {usuario?.rol ? obtenerEtiquetaRol(usuario.rol) : 'Usuario'}
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    <hr className="border-slate-100" />

                                    <div className="space-y-3 text-left">
                                        <div className="flex items-center gap-2 text-sm text-slate-600">
                                            <ShieldCheck className="h-4 w-4 text-emerald-500" />
                                            <span>Estado: </span>
                                            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                                                Activa y Verificada
                                            </span>
                                        </div>

                                        {usuario?.rol === 'encargado_inventario' && (
                                            <div className="mt-2 space-y-1 rounded-lg bg-slate-50 p-3 text-xs text-slate-500">
                                                <p className="font-semibold text-slate-700 mb-1">Permisos asignados:</p>
                                                <p>• Activos fijos: {usuario.puedeEditarFijos ? 'Edición habilitada' : 'Solo lectura'}</p>
                                                <p>• Activos fungibles: {usuario.puedeEditarFungibles ? 'Edición habilitada' : 'Solo lectura'}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {usuario?.rol !== 'administrador' && (
                                    <div className="mt-6 flex items-start gap-2 rounded-lg bg-blue-50 p-3 text-left text-xs text-blue-800 dark:bg-blue-950/20 dark:text-blue-300">
                                        <AlertCircle className="h-4 w-4 flex-shrink-0 text-blue-500" />
                                        <span>Tus datos son personales. Para cambiar otros datos académicos o de correo, contacta con Soporte Técnico.</span>
                                    </div>
                                )}
                            </div>
                            <div className="space-y-6">
                                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                                    <div className="flex items-center gap-2 border-b border-slate-100 pb-4 mb-4">
                                        <KeyRound className="h-5 w-5 text-blue-500" />
                                        <h2 className="text-base font-bold text-slate-800">Cambiar Contraseña</h2>
                                    </div>

                                    <form onSubmit={handleCambiarContrasena} className="space-y-4">
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-slate-600">
                                                Contraseña Actual
                                            </label>
                                            <div className="relative">
                                                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                                                    <Lock className="h-4 w-4" />
                                                </span>
                                                <input
                                                    type={verContrasenaActual ? 'text' : 'password'}
                                                    value={contrasenaActual}
                                                    onChange={(e) => setContrasenaActual(e.target.value)}
                                                    className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-10 text-sm text-slate-800 bg-white outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                                                    placeholder="••••••••"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setVerContrasenaActual(!verContrasenaActual)}
                                                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600"
                                                >
                                                    {verContrasenaActual ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                </button>
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-slate-600">
                                                Nueva Contraseña
                                            </label>
                                            <div className="relative">
                                                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                                                    <KeyRound className="h-4 w-4" />
                                                </span>
                                                <input
                                                    type={verNuevaContrasena ? 'text' : 'password'}
                                                    value={nuevaContrasena}
                                                    onChange={(e) => setNuevaContrasena(e.target.value)}
                                                    className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-10 text-sm text-slate-800 bg-white outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                                                    placeholder="Mínimo 6 caracteres"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setVerNuevaContrasena(!verNuevaContrasena)}
                                                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600"
                                                >
                                                    {verNuevaContrasena ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                </button>
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-slate-600">
                                                Confirmar Nueva Contraseña
                                            </label>
                                            <div className="relative">
                                                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                                                    <KeyRound className="h-4 w-4" />
                                                </span>
                                                <input
                                                    type={verConfirmarContrasena ? 'text' : 'password'}
                                                    value={confirmarContrasena}
                                                    onChange={(e) => setConfirmarContrasena(e.target.value)}
                                                    className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-10 text-sm text-slate-800 bg-white outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                                                    placeholder="Repite la nueva contraseña"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setVerConfirmarContrasena(!verConfirmarContrasena)}
                                                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600"
                                                >
                                                    {verConfirmarContrasena ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                </button>
                                            </div>
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={guardando}
                                            className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-blue-700 active:scale-[0.99] disabled:opacity-50"
                                        >
                                            {guardando ? 'Actualizando...' : 'Actualizar Contraseña'}
                                        </button>
                                    </form>
                                </div>


                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="grid gap-6 md:grid-cols-3">
                        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between h-full hover:shadow-md transition-all">
                            <div className="space-y-4">
                                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                                    <Download className="h-6 w-6" />
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-base font-bold text-slate-800">Exportar Estructura SQL</h3>
                                    <p className="text-sm text-slate-500">
                                        Descarga un archivo <code>.sql</code> con la estructura completa de las tablas y relaciones del sistema, útil para migrar a otro servidor.
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={handleDescargarEstructuraSql}
                                disabled={descargandoSql}
                                className="mt-6 w-full flex items-center justify-center gap-2 rounded-lg bg-emerald-600 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-emerald-700 active:scale-[0.99] disabled:opacity-50"
                            >
                                {descargandoSql ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Generando SQL...
                                    </>
                                ) : (
                                    'Descargar SQL'
                                )}
                            </button>
                        </div>
                        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between h-full hover:shadow-md transition-all">
                            <div className="space-y-4">
                                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                                    <Database className="h-6 w-6" />
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-base font-bold text-slate-800">Exportar Todos los Datos</h3>
                                    <p className="text-sm text-slate-500">
                                        Descarga un archivo <code>.sql</code> con las instrucciones INSERT de todos los registros de la base de datos para una migración completa.
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={handleDescargarDatosSql}
                                disabled={descargandoDatos}
                                className="mt-6 w-full flex items-center justify-center gap-2 rounded-lg bg-blue-600 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-blue-700 active:scale-[0.99] disabled:opacity-50"
                            >
                                {descargandoDatos ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Exportando...
                                    </>
                                ) : (
                                    'Descargar Datos (SQL)'
                                )}
                            </button>
                        </div>
                        <div className="rounded-xl border border-red-200 bg-red-50/20 p-6 shadow-sm flex flex-col justify-between h-full hover:shadow-md transition-all">
                            <div className="space-y-4">
                                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-100 text-red-600">
                                    <Trash2 className="h-6 w-6" />
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-base font-bold text-slate-800">Limpiar Base de Datos</h3>
                                    <p className="text-sm text-slate-500">
                                        Elimina todos los datos (préstamos, activos, docentes, estudiantes, etc.), <strong>exceptuando</strong> la cuenta actual de administrador y su configuración.
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setMostrarConfirmacionLimpieza(true)}
                                disabled={limpiandoDb}
                                className="mt-6 w-full flex items-center justify-center gap-2 rounded-lg bg-red-600 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-red-700 active:scale-[0.99] disabled:opacity-50"
                            >
                                {limpiandoDb ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Limpiando...
                                    </>
                                ) : (
                                    'Limpiar Base de Datos'
                                )}
                            </button>
                        </div>
                    </div>
                )}
            </div>
            {mostrarConfirmacionLimpieza && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-md rounded-2xl border border-slate-100 bg-white p-6 shadow-xl space-y-6">
                        <div className="flex items-start gap-3 text-red-600">
                            <AlertTriangle className="h-6 w-6 flex-shrink-0 mt-0.5" />
                            <div className="space-y-1">
                                <h3 className="text-lg font-bold text-slate-900">¿Estás absolutamente seguro?</h3>
                                <p className="text-sm text-slate-500">
                                    Esta acción eliminará de forma permanente todos los activos, préstamos, docentes y estudiantes del sistema. Esta acción no se puede deshacer.
                                </p>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <p className="text-xs text-slate-600">
                                Para confirmar, escribe <strong>LIMPIAR</strong> en el campo a continuación:
                            </p>
                            <input
                                type="text"
                                value={confirmInput}
                                onChange={(e) => setConfirmInput(e.target.value)}
                                placeholder="Escribe LIMPIAR"
                                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 bg-white outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all font-bold uppercase tracking-wider text-center"
                            />
                        </div>

                        <div className="flex items-center gap-3 justify-end">
                            <button
                                type="button"
                                onClick={() => {
                                    setMostrarConfirmacionLimpieza(false);
                                    setConfirmInput('');
                                }}
                                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all"
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                onClick={handleLimpiarBaseDatos}
                                disabled={confirmInput.toUpperCase() !== 'LIMPIAR' || limpiandoDb}
                                className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-50 transition-all"
                            >
                                {limpiandoDb && <Loader2 className="h-4 w-4 animate-spin" />}
                                Confirmar Limpieza
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </LayoutPagina>
    );
};
