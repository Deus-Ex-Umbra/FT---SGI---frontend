import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { InicioSesion, InscripcionMateria, RecuperarContrasena, RegistroEstudianteFirmado, RegistroDocenteFirmado, SubirSolicitudFirmada } from './paginas/publicas';
import { RenderizarPaginaPrivada } from './paginas/renderizador-por-rol';
import { ProveedorInventario } from './contextos/ContextoInventario';
import { ProveedorConfirmacion } from './contextos/ContextoConfirmacion';
import { ProveedorDialogoEntrada } from './contextos/ContextoDialogoEntrada';
import { Toaster } from './componentes/ui/sonner';
import { Skeleton } from './componentes/ui/skeleton';
import type { PaginaApp } from '@/tipos/navegacion';
import {
  EVENTO_USUARIO_ACTUALIZADO,
  cerrarSesion as cerrarSesionAuth,
  obtenerUsuarioActual,
  refrescarUsuarioActual,
} from './lib/servicio-autenticacion';
import type { UsuarioSesion } from '@/tipos/autenticacion';
import {
  obtenerPaginaInicioPorRol,
  obtenerPaginasPermitidasPorRol,
  filtrarPaginasPorInventarioUsuario,
  PAGINAS_VALIDAS_APP,
} from './utilidades/navegacion';
import type { Tema } from '@/tipos/tema';
import { DialogoPrestamosVencidos } from './componentes/paginas/compartido/DialogoPrestamosVencidos';
import { cargarCanastasPrestamoDesdeBackend } from './lib/servicio-prestamos';
import type { PrestamoCanastaRegistro } from '@/tipos/inventario';


const CLAVE_PAGINA_ACTUAL = 'sgi-pagina-actual';
const INTERVALO_REFRESCO_SESION_MS = 15000;

const sonUsuariosEquivalentes = (a: UsuarioSesion | null, b: UsuarioSesion | null) => {
  if (!a && !b) return true;
  if (!a || !b) return false;
  return (
    a.id === b.id &&
    a.correo === b.correo &&
    a.rol === b.rol &&
    (a.id_inventario ?? null) === (b.id_inventario ?? null) &&
    (a.puedeEditarFijos ?? false) === (b.puedeEditarFijos ?? false) &&
    (a.puedeEditarFungibles ?? false) === (b.puedeEditarFungibles ?? false)
  );
};

const PAGINAS_PRIVADAS = PAGINAS_VALIDAS_APP.filter((p) => p !== 'login');

function App() {
  const [usuarioActual, setUsuarioActual] = useState<UsuarioSesion | null>(() => obtenerUsuarioActual());
  const [tokenValido, setTokenValido] = useState<boolean>(() => !!localStorage.getItem('token_acceso'));
  const [prestamosVencidos, setPrestamosVencidos] = useState<PrestamoCanastaRegistro[]>([]);
  const [mostrarDialogoVencidos, setMostrarDialogoVencidos] = useState(false);
  const [cargandoSesion, setCargandoSesion] = useState(false);
  const tema: Tema = 'mixto';

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const sincronizarUsuarioConSesion = () => {
      const usuario = obtenerUsuarioActual();
      setUsuarioActual((previo: UsuarioSesion | null) => (sonUsuariosEquivalentes(previo, usuario) ? previo : usuario));
      setTokenValido(!!localStorage.getItem('token_acceso'));
    };

    const manejarStorage = (evento: StorageEvent) => {
      if (!evento.key || evento.key === 'usuario' || evento.key === 'token_acceso') {
        sincronizarUsuarioConSesion();
      }
    };

    sincronizarUsuarioConSesion();
    window.addEventListener('storage', manejarStorage);
    window.addEventListener(EVENTO_USUARIO_ACTUALIZADO, sincronizarUsuarioConSesion);

    return () => {
      window.removeEventListener('storage', manejarStorage);
      window.removeEventListener(EVENTO_USUARIO_ACTUALIZADO, sincronizarUsuarioConSesion);
    };
  }, []);

  useEffect(() => {
    if (!usuarioActual) return;

    let cancelado = false;

    const sincronizarPerfil = async () => {
      try {
        const usuarioRefrescado = await refrescarUsuarioActual();
        if (cancelado) return;

        setUsuarioActual((previo: UsuarioSesion | null) =>
          sonUsuariosEquivalentes(previo, usuarioRefrescado) ? previo : usuarioRefrescado,
        );
      } catch {
      }
    };

    const manejarFoco = () => {
      void sincronizarPerfil();
    };

    const manejarVisibilidad = () => {
      if (document.visibilityState === 'visible') {
        void sincronizarPerfil();
      }
    };

    const intervalo = window.setInterval(() => {
      void sincronizarPerfil();
    }, INTERVALO_REFRESCO_SESION_MS);

    window.addEventListener('focus', manejarFoco);
    document.addEventListener('visibilitychange', manejarVisibilidad);
    void sincronizarPerfil();

    return () => {
      cancelado = true;
      window.clearInterval(intervalo);
      window.removeEventListener('focus', manejarFoco);
      document.removeEventListener('visibilitychange', manejarVisibilidad);
    };
  }, [usuarioActual?.id]);

  useEffect(() => {
    if (!usuarioActual) {
      setPrestamosVencidos([]);
      setMostrarDialogoVencidos(false);
      return;
    }

    if (usuarioActual.rol !== 'estudiante' && usuarioActual.rol !== 'docente') {
      return;
    }

    const yaMostrado = sessionStorage.getItem('sgi:dialogo-vencidos-mostrado');
    if (yaMostrado === 'true') {
      return;
    }

    const verificarPrestamosVencidos = async () => {
      try {
        const canastas = await cargarCanastasPrestamoDesdeBackend();
        const vencidos = canastas.filter((c) => c.estado === 'vencido');
        if (vencidos.length > 0) {
          setPrestamosVencidos(vencidos);
          setMostrarDialogoVencidos(true);
          sessionStorage.setItem('sgi:dialogo-vencidos-mostrado', 'true');
        }
      } catch (error) {
        console.error('Error al verificar préstamos vencidos:', error);
      }
    };

    void verificarPrestamosVencidos();
  }, [usuarioActual]);


  useEffect(() => {
    const raiz = document.documentElement;
    raiz.classList.remove(
      'dark', 'theme-rojo', 'theme-naranja', 'theme-ambar', 'theme-amarillo',
      'theme-lima', 'theme-esmeralda', 'theme-cian', 'theme-purpura', 'theme-violeta', 'theme-rosa'
    );
    raiz.classList.add('theme-mixto');
    localStorage.setItem('sgi-tema', 'mixto');
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tieneSubidaFirmada =
      !!params.get('subir-solicitud') &&
      !!params.get('rid') &&
      !!params.get('exp') &&
      !!params.get('sig');

    const tieneInscripcionMateria =
      !!params.get('inscribir-materia') &&
      !!params.get('eid') &&
      !!params.get('exp') &&
      !!params.get('nonce') &&
      !!params.get('sig');

    const tieneRegistroEstudianteFirmado =
      params.has('registro-estudiante') &&
      !!params.get('eid') &&
      !!params.get('exp') &&
      !!params.get('nonce') &&
      !!params.get('sig');

    const tieneRegistroDocenteFirmado =
      params.has('registro-docente') &&
      !!params.get('eid') &&
      !!params.get('exp') &&
      !!params.get('nonce') &&
      !!params.get('sig');

    const tieneInscripcionCodigo = !!params.get('inscribir-materia-codigo');

    if (location.pathname === '/') {
      if (tieneSubidaFirmada) {
        navigate(`/subir-solicitud${location.search}`, { replace: true });
      } else if (tieneInscripcionMateria || tieneInscripcionCodigo) {
        navigate(`/inscribir-materia${location.search}`, { replace: true });
      } else if (tieneRegistroEstudianteFirmado) {
        navigate(`/registro-estudiante${location.search}`, { replace: true });
      } else if (tieneRegistroDocenteFirmado) {
        navigate(`/registro-docente${location.search}`, { replace: true });
      } else {
        const token = localStorage.getItem('token_acceso');
        if (token && usuarioActual) {
          const inicio = obtenerPaginaInicioPorRol(usuarioActual.rol);
          navigate(`/${inicio}`, { replace: true });
        } else {
          navigate('/login', { replace: true });
        }
      }
    }
  }, [location, navigate, usuarioActual]);

  const paginasPermitidas = usuarioActual
    ? filtrarPaginasPorInventarioUsuario(
        usuarioActual,
        obtenerPaginasPermitidasPorRol(usuarioActual.rol),
      )
    : [];

  const propsPagina = {
    onNavegar: (pag: PaginaApp) => {
      navigate(`/${pag}`);
    },
    onCerrarSesion: () => {
      setCargandoSesion(true);
      setTimeout(() => {
        cerrarSesionAuth();
        localStorage.removeItem(CLAVE_PAGINA_ACTUAL);
        sessionStorage.removeItem('sgi:dialogo-vencidos-mostrado');
        setUsuarioActual(null);
        setTokenValido(false);
        navigate('/login', { replace: true });
        setCargandoSesion(false);
      }, 500);
    },
  };

  const propsConfiguracion = { ...propsPagina, temaActivo: tema, onCambiarTema: (_t: Tema) => {} };

  if (cargandoSesion) {
    return (
      <div className="flex h-screen w-full flex-col bg-slate-50 dark:bg-slate-900 p-6 space-y-6">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between border-b pb-4 border-slate-200 dark:border-slate-800">
          <Skeleton className="h-8 w-48 bg-slate-200 dark:bg-slate-800 animate-pulse" />
          <div className="flex space-x-4">
            <Skeleton className="h-8 w-24 bg-slate-200 dark:bg-slate-800 animate-pulse" />
            <Skeleton className="h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-800 animate-pulse" />
          </div>
        </div>
        {/* Main Content Skeleton */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <Skeleton className="h-32 w-full rounded-xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
          <Skeleton className="h-32 w-full rounded-xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
          <Skeleton className="h-32 w-full rounded-xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <Skeleton className="h-[300px] w-full rounded-xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
          <Skeleton className="h-[300px] w-full rounded-xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <>
      <Routes>
        <Route
          path="/login"
          element={
            tokenValido && usuarioActual ? (
              <Navigate to={`/${obtenerPaginaInicioPorRol(usuarioActual.rol)}`} replace />
            ) : (
              <InicioSesion
                onAcceso={(usuario) => {
                  setCargandoSesion(true);
                  setTimeout(() => {
                    setUsuarioActual(usuario);
                    setTokenValido(true);
                    navigate(`/${obtenerPaginaInicioPorRol(usuario.rol)}`, { replace: true });
                    setCargandoSesion(false);
                  }, 500);
                }}
                onRecuperar={() => navigate('/recuperar-contrasena')}
              />
            )
          }
        />

        <Route
          path="/recuperar-contrasena"
          element={
            tokenValido && usuarioActual ? (
              <Navigate to={`/${obtenerPaginaInicioPorRol(usuarioActual.rol)}`} replace />
            ) : (
              <RecuperarContrasena onVolver={() => navigate('/login')} />
            )
          }
        />
        <Route
          path="/subir-solicitud"
          element={<SubirSolicitudFirmada onVolver={() => navigate('/login')} />}
        />
        <Route
          path="/inscribir-materia"
          element={<InscripcionMateria onVolver={() => navigate('/login')} />}
        />
        <Route
          path="/registro-estudiante"
          element={<RegistroEstudianteFirmado onVolver={() => navigate('/login')} />}
        />
        <Route
          path="/registro-docente"
          element={<RegistroDocenteFirmado onVolver={() => navigate('/login')} />}
        />
        {PAGINAS_PRIVADAS.map((pag) => (
          <Route
            key={pag}
            path={`/${pag}`}
            element={
              !tokenValido || !usuarioActual ? (
                <Navigate to="/login" replace />
              ) : !paginasPermitidas.includes(pag) ? (
                <Navigate to={`/${obtenerPaginaInicioPorRol(usuarioActual.rol)}`} replace />
              ) : (
                <ProveedorInventario key={location.pathname}>
                  <ProveedorConfirmacion>
                    <ProveedorDialogoEntrada>
                      <RenderizarPaginaPrivada
                        pagina={pag}
                        rol={usuarioActual.rol}
                        propsPagina={propsPagina}
                        propsConfiguracion={propsConfiguracion}
                      />
                    </ProveedorDialogoEntrada>
                  </ProveedorConfirmacion>
                </ProveedorInventario>
              )
            }
          />
        ))}

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster position="top-right" richColors />
      <DialogoPrestamosVencidos
        abierto={mostrarDialogoVencidos}
        onClose={() => setMostrarDialogoVencidos(false)}
        prestamos={prestamosVencidos}
        onIrAPrestamos={() => {
          setMostrarDialogoVencidos(false);
          navigate('/prestamos');
        }}
      />
    </>
  );
}

export default App;
