import { useState, useEffect } from 'react';
import { InicioSesion } from './paginas/InicioSesion';
import { RecuperarContrasena } from './paginas/RecuperarContrasena';
import { Resumen } from './paginas/Resumen';
import { Activos } from './paginas/Activos';
import { Prestamos } from './paginas/Prestamos';
import { Estudiantes } from './paginas/Estudiantes';
import { Docentes } from './paginas/Docentes';
import { MaterialFungible } from './paginas/MaterialFungible';
import { Configuracion } from './paginas/Configuracion';
import { PantallaCarga } from './componentes/PantallaCarga';
import { ProveedorInventario } from './contextos/ContextoInventario';
import type { PaginaApp } from './componentes/inventario/MenuLateral';
import { cerrarSesion as cerrarSesionAuth } from './lib/servicio-autenticacion';

export type Tema = 'claro' | 'oscuro' | 'sistema';
export type Acento = 'rojo' | 'naranja' | 'ambar' | 'amarillo' | 'lima' | 'esmeralda' | 'cian' | 'azul' | 'purpura' | 'violeta' | 'rosa';

type EstadoApp = PaginaApp | 'recuperar-contrasena';

const CLAVE_PAGINA_ACTUAL = 'sgi-pagina-actual';

const obtenerEstadoInicial = (): EstadoApp => {
  const token = localStorage.getItem('token_acceso');
  if (!token) return 'login';

  const paginaGuardada = localStorage.getItem(CLAVE_PAGINA_ACTUAL) as PaginaApp | null;
  return paginaGuardada ?? 'activos';
};

function App() {
  const [cargando, setCargando] = useState(true);
  const [estado, setEstado] = useState<EstadoApp>(() => obtenerEstadoInicial());
  const [tema, setTema] = useState<Tema>(
    () => (localStorage.getItem('sgi-tema') as Tema) ?? 'claro'
  );
  const [acento, setAcento] = useState<Acento>(
    () => (localStorage.getItem('sgi-acento') as Acento) ?? 'azul'
  );

  useEffect(() => {
    const temporizador = setTimeout(() => setCargando(false), 3000);
    return () => clearTimeout(temporizador);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token_acceso');

    if (!token && estado !== 'login' && estado !== 'recuperar-contrasena') {
      setEstado('login');
      return;
    }

    if (estado !== 'login' && estado !== 'recuperar-contrasena') {
      localStorage.setItem(CLAVE_PAGINA_ACTUAL, estado);
    }
  }, [estado]);

  // Aplica el tema al DOM y lo persiste en localStorage cada vez que cambia
  useEffect(() => {
    const raiz = document.documentElement;
    // Tema Claro/Oscuro
    if (tema === 'oscuro') {
      raiz.classList.add('dark');
    } else if (tema === 'claro') {
      raiz.classList.remove('dark');
    } else {
      const prefiereOscuro = window.matchMedia('(prefers-color-scheme: dark)').matches;
      prefiereOscuro ? raiz.classList.add('dark') : raiz.classList.remove('dark');
    }
    localStorage.setItem('sgi-tema', tema);

    // Color de Acento
    raiz.classList.remove('theme-rojo', 'theme-naranja', 'theme-ambar', 'theme-amarillo', 'theme-lima', 'theme-esmeralda', 'theme-cian', 'theme-purpura', 'theme-violeta', 'theme-rosa');
    if (acento !== 'azul') {
      raiz.classList.add(`theme-${acento}`);
    }
    localStorage.setItem('sgi-acento', acento);
  }, [tema, acento]);

  if (cargando) return <PantallaCarga />;

  if (estado === 'login') {
    return (
      <InicioSesion
        onAcceso={() => setEstado('activos')}
        onRecuperar={() => setEstado('recuperar-contrasena')}
      />
    );
  }

  if (estado === 'recuperar-contrasena') {
    return <RecuperarContrasena onVolver={() => setEstado('login')} />;
  }

  const propsPagina = {
    onNavegar: (pag: PaginaApp) => setEstado(pag),
    onCerrarSesion: () => {
      cerrarSesionAuth();
      localStorage.removeItem(CLAVE_PAGINA_ACTUAL);
      setEstado('login');
    },
  };

  return (
    <ProveedorInventario>
      {estado === 'prestamos' && <Prestamos        {...propsPagina} />}
      {estado === 'estudiantes' && <Estudiantes      {...propsPagina} />}
      {estado === 'docentes' && <Docentes         {...propsPagina} />}
      {estado === 'material' && <MaterialFungible {...propsPagina} />}
      {estado === 'configuracion' && <Configuracion    {...propsPagina} temaActivo={tema} onCambiarTema={setTema} acentoActivo={acento} onCambiarAcento={setAcento} />}
      {estado === 'resumen' && <Resumen {...propsPagina} />}
      {estado === 'activos' && <Activos {...propsPagina} />}
    </ProveedorInventario>
  );
}

export default App;
