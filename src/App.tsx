import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { InicioSesion, InscripcionMateria, RecuperarContrasena, RegistroEstudianteFirmado, SubirSolicitudFirmada } from './paginas/publicas';
import { renderizarPaginaPrivada } from './paginas/renderizador-por-rol';
import { ProveedorInventario } from './contextos/ContextoInventario';
import { ProveedorConfirmacion } from './contextos/ContextoConfirmacion';
import { ProveedorDialogoEntrada } from './contextos/ContextoDialogoEntrada';
import { Toaster } from './componentes/ui/sonner';
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
  const tema: Tema = 'mixto';

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const sincronizarUsuarioConSesion = () => {
      const usuario = obtenerUsuarioActual();
      setUsuarioActual((previo: UsuarioSesion | null) => (sonUsuariosEquivalentes(previo, usuario) ? previo : usuario));
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

    const tieneInscripcionCodigo = !!params.get('inscribir-materia-codigo');

    if (location.pathname === '/') {
      if (tieneSubidaFirmada) {
        navigate(`/subir-solicitud${location.search}`, { replace: true });
      } else if (tieneInscripcionMateria || tieneInscripcionCodigo) {
        navigate(`/inscribir-materia${location.search}`, { replace: true });
      } else if (tieneRegistroEstudianteFirmado) {
        navigate(`/registro-estudiante${location.search}`, { replace: true });
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

  const tokenValido = !!localStorage.getItem('token_acceso');
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
      cerrarSesionAuth();
      localStorage.removeItem(CLAVE_PAGINA_ACTUAL);
      setUsuarioActual(null);
      navigate('/login', { replace: true });
    },
  };

  const propsConfiguracion = { ...propsPagina, temaActivo: tema, onCambiarTema: (_t: Tema) => {} };

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
                  setUsuarioActual(usuario);
                  navigate(`/${obtenerPaginaInicioPorRol(usuario.rol)}`, { replace: true });
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
                      {renderizarPaginaPrivada({
                        pagina: pag,
                        rol: usuarioActual.rol,
                        propsPagina,
                        propsConfiguracion,
                      })}
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
    </>
  );
}

export default App;
