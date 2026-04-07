import { useState, useEffect } from 'react';
import { InicioSesion } from './paginas/InicioSesion';
import { RecuperarContrasena } from './paginas/RecuperarContrasena';
import { Resumen } from './paginas/Resumen';
import { Activos } from './paginas/Activos';
import { Prestamos } from './paginas/Prestamos';
import { Estudiantes } from './paginas/Estudiantes';
import { Docentes } from './paginas/Docentes';
import { MaterialFungible } from './paginas/MaterialFungible';
import { Contenedores } from './paginas/Contenedores';
import { Configuracion } from './paginas/Configuracion';
import { Usuarios } from './paginas/Usuarios';
import { Auditoria } from './paginas/Auditoria';
import { ProveedorInventario } from './contextos/ContextoInventario';
import { ProveedorConfirmacion } from './contextos/ContextoConfirmacion';
import { Toaster } from './componentes/ui/sonner';
import type { PaginaApp } from '@/tipos/navegacion';
import { cerrarSesion as cerrarSesionAuth, obtenerUsuarioActual, type RolUsuario, type UsuarioSesion } from './lib/servicio-autenticacion';
import type { Tema } from '@/tipos/tema';

type EstadoApp = PaginaApp | 'recuperar-contrasena';

const CLAVE_PAGINA_ACTUAL = 'sgi-pagina-actual';
const PAGINAS_VALIDAS: readonly PaginaApp[] = ['login', 'resumen', 'activos', 'contenedores', 'prestamos', 'estudiantes', 'docentes', 'material', 'auditoria', 'usuarios', 'configuracion'];
const PAGINAS_ADMINISTRADOR: readonly PaginaApp[] = ['resumen', 'auditoria', 'usuarios', 'estudiantes', 'docentes', 'configuracion'];
const PAGINAS_ENCARGADO: readonly PaginaApp[] = ['resumen', 'activos', 'contenedores', 'prestamos', 'estudiantes', 'docentes', 'material', 'configuracion'];

const esPaginaValida = (pagina: string | null): pagina is PaginaApp => {
  return !!pagina && PAGINAS_VALIDAS.includes(pagina as PaginaApp);
};

const paginasPermitidasPorRol = (rol: RolUsuario | undefined): readonly PaginaApp[] => {
  return rol === 'administrador' ? PAGINAS_ADMINISTRADOR : PAGINAS_ENCARGADO;
};

const paginaInicioPorRol = (_rol: RolUsuario | undefined): PaginaApp => {
  // Página principal de la aplicación.
  // Se mantiene por rol por compatibilidad, pero el inicio ahora es Resumen para todos.
  return 'resumen';
};

const obtenerEstadoInicial = (): EstadoApp => {
  const token = localStorage.getItem('token_acceso');
  if (!token) return 'login';

  const usuario = obtenerUsuarioActual();
  const paginasPermitidas = paginasPermitidasPorRol(usuario?.rol);

  const paginaGuardada = localStorage.getItem(CLAVE_PAGINA_ACTUAL);
  if (esPaginaValida(paginaGuardada) && paginasPermitidas.includes(paginaGuardada)) {
    return paginaGuardada;
  }

  localStorage.removeItem(CLAVE_PAGINA_ACTUAL);
  return paginaInicioPorRol(usuario?.rol);
};

function App() {
  const [estado, setEstado] = useState<EstadoApp>(() => obtenerEstadoInicial());
  const [usuarioActual, setUsuarioActual] = useState<UsuarioSesion | null>(() => obtenerUsuarioActual());
  const [tema, setTema] = useState<Tema>(() => {
    const guardado = localStorage.getItem('sgi-tema');
    if (guardado === 'claro' || guardado === 'oscuro' || guardado === 'mixto') return guardado;
    if (guardado === 'sistema') {
      const prefiereOscuro = window.matchMedia('(prefers-color-scheme: dark)').matches;
      return prefiereOscuro ? 'oscuro' : 'claro';
    }
    return 'claro';
  });

  useEffect(() => {
    const token = localStorage.getItem('token_acceso');
    const usuario = obtenerUsuarioActual();
    setUsuarioActual(usuario);
    const paginasPermitidas = paginasPermitidasPorRol(usuario?.rol);

    if (!token && estado !== 'login' && estado !== 'recuperar-contrasena') {
      setEstado('login');
      return;
    }

    if (estado !== 'login' && estado !== 'recuperar-contrasena' && !paginasPermitidas.includes(estado)) {
      setEstado(paginaInicioPorRol(usuario?.rol));
      return;
    }

    if (estado !== 'login' && estado !== 'recuperar-contrasena') {
      localStorage.setItem(CLAVE_PAGINA_ACTUAL, estado);
    }
  }, [estado]);

  useEffect(() => {
    const raiz = document.documentElement;

    raiz.classList.remove(
      'theme-mixto',
      'theme-rojo',
      'theme-naranja',
      'theme-ambar',
      'theme-amarillo',
      'theme-lima',
      'theme-esmeralda',
      'theme-cian',
      'theme-purpura',
      'theme-violeta',
      'theme-rosa'
    );

    if (tema === 'oscuro') {
      raiz.classList.add('dark');
    } else if (tema === 'claro') {
      raiz.classList.remove('dark');
    } else if (tema === 'mixto') {
      raiz.classList.remove('dark');
      raiz.classList.add('theme-mixto');
    }
    localStorage.setItem('sgi-tema', tema);
  }, [tema]);

  if (estado === 'login') {
    return (
      <InicioSesion
        onAcceso={(usuario) => {
          setUsuarioActual(usuario);
          setEstado(paginaInicioPorRol(usuario.rol));
        }}
        onRecuperar={() => setEstado('recuperar-contrasena')}
      />
    );
  }

  if (estado === 'recuperar-contrasena') {
    return <RecuperarContrasena onVolver={() => setEstado('login')} />;
  }

  const propsPagina = {
    onNavegar: (pag: PaginaApp) => {
      const paginasPermitidas = paginasPermitidasPorRol(usuarioActual?.rol);
      if (!paginasPermitidas.includes(pag)) return;
      setEstado(pag);
    },
    onCerrarSesion: () => {
      cerrarSesionAuth();
      localStorage.removeItem(CLAVE_PAGINA_ACTUAL);
      setUsuarioActual(null);
      setEstado('login');
    },
  };

  return (
    <ProveedorInventario>
      <ProveedorConfirmacion>
        {estado === 'prestamos' && <Prestamos        {...propsPagina} />}
        {estado === 'estudiantes' && <Estudiantes      {...propsPagina} />}
        {estado === 'docentes' && <Docentes         {...propsPagina} />}
        {estado === 'material' && <MaterialFungible {...propsPagina} />}
        {estado === 'contenedores' && <Contenedores {...propsPagina} />}
        {estado === 'configuracion' && <Configuracion    {...propsPagina} temaActivo={tema} onCambiarTema={setTema} />}
        {estado === 'usuarios' && <Usuarios {...propsPagina} />}
        {estado === 'auditoria' && <Auditoria {...propsPagina} />}
        {estado === 'resumen' && <Resumen {...propsPagina} />}
        {estado === 'activos' && <Activos {...propsPagina} />}
        <Toaster position="top-right" richColors />
      </ProveedorConfirmacion>
    </ProveedorInventario>
  );
}

export default App;
