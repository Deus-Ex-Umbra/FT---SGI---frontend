import { useEffect, useState, useMemo } from 'react';
import { UserPlus, UserCheck, UserX, Mail, User } from 'lucide-react';
import { toast } from 'sonner';
import type { PropsPaginaBase } from '@/tipos/paginas';
import { LayoutPagina } from '@/componentes/layout/layout-pagina';
import { Boton } from '@/componentes/ui/button';
import { Input } from '@/componentes/ui/input';
import { DialogoCrearUsuario } from '@/componentes/paginas/usuarios/dialogo-crear-usuario';
import { DialogoEditarUsuario } from '@/componentes/paginas/usuarios/dialogo-editar-usuario';
import { TablaUsuarios } from '@/componentes/paginas/usuarios/tabla-usuarios';
import { ResumenUsuarios } from '@/componentes/paginas/usuarios/resumen-usuarios';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/componentes/ui/tabs';
import { useConfirmacion } from '@/contextos/ContextoConfirmacion';
import { } from '@/lib/servicio-autenticacion';
import type { UsuarioSesion } from '@/tipos/autenticacion';
import { construirContrasenaPorDefecto } from '@/utilidades/usuarios';
import { ModalBase } from '@/componentes/paginas/inventario/modal-base';
import { PasswordDisplay } from '@/componentes/paginas/usuarios/password-display';
import { CheckCircle2 } from 'lucide-react';

import {
    listarUsuarios,
    cambiarEstadoUsuario,
    restablecerContrasenaUsuario,
} from '@/lib/servicio-administrador';

export const Usuarios = ({ onNavegar, onCerrarSesion }: PropsPaginaBase) => {
    const { confirmar } = useConfirmacion();
    const [usuarios, setUsuarios] = useState<UsuarioSesion[]>([]);
    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState('');
    const [dialogoAbierto, setDialogoAbierto] = useState(false);
    const [usuarioParaEditar, setUsuarioParaEditar] = useState<UsuarioSesion | null>(null);
    const [usuarioRestableciendoId, setUsuarioRestableciendoId] = useState<number | null>(null);
    const [resultadoReset, setResultadoReset] = useState<{ correo: string; contrasena: string } | null>(null);

    const [tabActiva, setTabActiva] = useState<'activos' | 'inactivos'>('activos');
    const [filtroNombre, setFiltroNombre] = useState('');
    const [filtroApellido, setFiltroApellido] = useState('');
    const [filtroCorreo, setFiltroCorreo] = useState('');
    const [filtroRol, setFiltroRol] = useState('todos');

    const usuariosFiltrados = useMemo(() => {
        return usuarios.filter((usuario) => {
            const nombreBusqueda = filtroNombre.trim().toLowerCase();
            const apellidoBusqueda = filtroApellido.trim().toLowerCase();
            const correoBusqueda = filtroCorreo.trim().toLowerCase();

            const coincideNombre = !nombreBusqueda || (usuario.nombre || '').toLowerCase().includes(nombreBusqueda);
            const coincideApellido = !apellidoBusqueda || (usuario.apellido || '').toLowerCase().includes(apellidoBusqueda);
            const coincideCorreo = !correoBusqueda || (usuario.correo || '').toLowerCase().includes(correoBusqueda);

            const coincideRol = filtroRol === 'todos' || usuario.rol === filtroRol;

            return coincideNombre && coincideApellido && coincideCorreo && coincideRol;
        });
    }, [usuarios, filtroNombre, filtroApellido, filtroCorreo, filtroRol]);

    const usuariosParaResumen = useMemo(() => {
        return usuarios.filter(u => tabActiva === 'activos' ? u.estado : !u.estado);
    }, [usuarios, tabActiva]);

    const cargarUsuarios = async () => {
        setCargando(true);
        setError('');
        try {
            const datosUsuarios = await listarUsuarios();
            setUsuarios(datosUsuarios);
        } catch (err: any) {
            setError(err?.message || 'No se pudo cargar la lista de usuarios.');
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => {
        void cargarUsuarios();
    }, []);

    const toggleEstadoUsuario = async (usuario: UsuarioSesion) => {
        const accion = usuario.estado ? 'inhabilitar' : 'habilitar';
        const confirmado = await confirmar({
            titulo: `${usuario.estado ? 'Inhabilitar' : 'Habilitar'} usuario`,
            descripcion: `¿Estás seguro de que deseas ${accion} al usuario ${usuario.correo}?`,
            textoConfirmar: usuario.estado ? 'Inhabilitar' : 'Habilitar',
        });
        if (!confirmado) return;

        try {
            await cambiarEstadoUsuario(usuario.id, !usuario.estado);
            toast.success(`Usuario ${accion}do correctamente.`);
            void cargarUsuarios();
        } catch (err: any) {
            toast.error(err?.message || `No se pudo ${accion} al usuario.`);
        }
    };

    const restablecerContrasena = async (usuario: UsuarioSesion) => {
        const contrasenaPredeterminada = construirContrasenaPorDefecto(usuario.rol);
        const confirmado = await confirmar({
            titulo: 'Restablecer contraseña',
            descripcion: `Se restablecerá la contraseña del usuario ${usuario.correo} a la predeterminada: "${contrasenaPredeterminada}". ¿Deseas continuar?`,
            textoConfirmar: 'Restablecer',
        });

        if (!confirmado) return;

        setUsuarioRestableciendoId(usuario.id);
        try {
            const respuesta = await restablecerContrasenaUsuario(usuario.id);
            setResultadoReset({ 
                correo: usuario.correo, 
                contrasena: respuesta.contrasenaTemporal || contrasenaPredeterminada 
            });
            toast.success('Contraseña restablecida correctamente.');
        } catch (err: any) {
            toast.error(err?.message || 'No se pudo restablecer la contraseña.');
        } finally {
            setUsuarioRestableciendoId(null);
        }
    };

    return (
        <LayoutPagina
            paginaActiva="usuarios"
            titulo="Usuarios del sistema"
            subtitulo="Gestión de administradores, encargados, docentes y estudiantes"
            onNavegar={onNavegar}
            onCerrarSesion={onCerrarSesion}
        >
            <Tabs value={tabActiva} onValueChange={(val) => setTabActiva(val as 'activos' | 'inactivos')} className="w-full">
                <div className="flex flex-col gap-6">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-1">
                        <TabsList className="w-full lg:w-auto">
                            <TabsTrigger value="activos" className="flex-1 lg:flex-initial">
                                <UserCheck className="h-4 w-4" />
                                Usuarios Habilitados
                                <span className="ml-1.5 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                                    {usuariosFiltrados.filter(u => u.estado).length}
                                </span>
                            </TabsTrigger>
                            <TabsTrigger value="inactivos" className="flex-1 lg:flex-initial">
                                <UserX className="h-4 w-4" />
                                Inhabilitados
                                <span className="ml-1.5 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                                    {usuariosFiltrados.filter(u => !u.estado).length}
                                </span>
                            </TabsTrigger>
                        </TabsList>

                        <div className="flex flex-wrap items-center gap-3 lg:justify-end flex-1">
                            <ResumenUsuarios
                                usuarios={usuariosParaResumen}
                                filtroRol={filtroRol}
                                onSelectRol={setFiltroRol}
                                cargando={cargando}
                            />
                            
                            <Boton 
                                onClick={() => setDialogoAbierto(true)} 
                                className="gap-2 shadow-md hover:shadow-lg transition-all bg-blue-600 hover:bg-blue-700 h-9 shrink-0"
                            >
                                <UserPlus className="h-4 w-4" />
                                Nuevo usuario
                            </Boton>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <Input
                                placeholder="Filtrar por nombre..."
                                value={filtroNombre}
                                onChange={(e) => setFiltroNombre(e.target.value)}
                                className="pl-9 h-9 bg-white/50 dark:bg-slate-900/50 text-sm"
                            />
                        </div>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <Input
                                placeholder="Filtrar por apellido..."
                                value={filtroApellido}
                                onChange={(e) => setFiltroApellido(e.target.value)}
                                className="pl-9 h-9 bg-white/50 dark:bg-slate-900/50 text-sm"
                            />
                        </div>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <Input
                                placeholder="Filtrar por correo..."
                                value={filtroCorreo}
                                onChange={(e) => setFiltroCorreo(e.target.value)}
                                className="pl-9 h-9 bg-white/50 dark:bg-slate-900/50 text-sm"
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
                            {error}
                        </div>
                    )}

                    <TabsContent value="activos" className="mt-0">
                        <TablaUsuarios
                            usuarios={usuariosFiltrados.filter(u => u.estado)}
                            usuarioRestableciendoId={usuarioRestableciendoId}
                            onRestablecerContrasena={restablecerContrasena}
                            onToggleEstado={toggleEstadoUsuario}
                            onEditar={setUsuarioParaEditar}
                            cargando={cargando}
                        />
                    </TabsContent>
                    <TabsContent value="inactivos" className="mt-0">
                        <TablaUsuarios
                            usuarios={usuariosFiltrados.filter(u => !u.estado)}
                            usuarioRestableciendoId={usuarioRestableciendoId}
                            onRestablecerContrasena={restablecerContrasena}
                            onToggleEstado={toggleEstadoUsuario}
                            onEditar={setUsuarioParaEditar}
                            cargando={cargando}
                        />
                    </TabsContent>
                </div>
            </Tabs>

            <DialogoCrearUsuario
                abierto={dialogoAbierto}
                onCerrar={() => setDialogoAbierto(false)}
                onUsuarioCreado={cargarUsuarios}
            />

            <DialogoEditarUsuario
                abierto={usuarioParaEditar !== null}
                onCerrar={() => setUsuarioParaEditar(null)}
                usuario={usuarioParaEditar}
                onUsuarioEditado={cargarUsuarios}
            />

            {resultadoReset && (
                <ModalBase 
                    titulo="Contraseña restablecida" 
                    onCerrar={() => setResultadoReset(null)}
                    ancho="max-w-sm"
                >
                    <div className="space-y-6 py-2 text-center">
                        <div className="flex justify-center">
                            <div className="rounded-full bg-blue-100 p-3 dark:bg-blue-950/30">
                                <CheckCircle2 className="h-8 w-8 text-blue-600 dark:text-blue-500" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                Nueva contraseña para <span className="font-semibold text-slate-700 dark:text-slate-300">{resultadoReset.correo}</span>:
                            </p>
                        </div>

                        <div className="text-left">
                            <PasswordDisplay password={resultadoReset.contrasena} label="Nueva contraseña temporal" />
                        </div>

                        <div className="pt-2">
                            <Boton onClick={() => setResultadoReset(null)} className="w-full">
                                Cerrar
                            </Boton>
                        </div>
                    </div>
                </ModalBase>
            )}
        </LayoutPagina>
    );
};

