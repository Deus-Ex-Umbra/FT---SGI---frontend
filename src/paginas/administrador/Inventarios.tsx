import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Eye, Archive, Users2, Wrench, Package, Search, AtSign } from 'lucide-react';
import type { PropsPaginaBase } from '@/tipos/paginas';
import { LayoutPagina } from '@/componentes/layout/layout-pagina';
import { Boton } from '@/componentes/ui/button';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/componentes/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from '@/componentes/ui/dialog';
import {
  eliminarInventario,
  listarInventarios,
  obtenerToken,
} from '@/lib/servicio-autenticacion';
import type { InventarioGestion, UsuarioSesion } from '@/tipos/autenticacion';
import {
  asignarInventarioUsuario,
  listarUsuarios,
} from '@/lib/servicio-administrador';
import { useConfirmacion } from '@/contextos/ContextoConfirmacion';
import { DialogoInventario } from '@/componentes/paginas/inventario/dialogo-inventario';
import { API_BASE_URL } from '@/lib/api';
import type { ActivoFijoApi, MaterialApi } from '@/tipos/api';

export const Inventarios = ({ onNavegar, onCerrarSesion }: PropsPaginaBase) => {
  const { confirmar } = useConfirmacion();
  const [usuarios, setUsuarios] = useState<UsuarioSesion[]>([]);
  const [inventarios, setInventarios] = useState<InventarioGestion[]>([]);
  const [todosFijos, setTodosFijos] = useState<ActivoFijoApi[]>([]);
  const [todosFungibles, setTodosFungibles] = useState<MaterialApi[]>([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [usuarioActualizandoInventarioId, setUsuarioActualizandoInventarioId] = useState<number | null>(null);

  const [tabActiva, setTabActiva] = useState<'inventarios' | 'usuarios'>('inventarios');
  const [filtroInventarioNombre, setFiltroInventarioNombre] = useState('');
  const [filtroEncargadoBusqueda, setFiltroEncargadoBusqueda] = useState('');

  const [filtroActivos, setFiltroActivos] = useState<'disponibles' | 'no_disponibles' | 'todos'>('disponibles');
  const [filtroActivosId, setFiltroActivosId] = useState('');
  const [filtroActivosNombre, setFiltroActivosNombre] = useState('');

  const encargados = useMemo(
    () => usuarios.filter((usuario) => usuario.rol === 'encargado_inventario'),
    [usuarios],
  );

  const inventariosFiltrados = useMemo(() => {
    const term = filtroInventarioNombre.toLowerCase().trim();
    if (!term) return inventarios;
    return inventarios.filter(i => i.nombre.toLowerCase().includes(term));
  }, [inventarios, filtroInventarioNombre]);

  const encargadosFiltrados = useMemo(() => {
    const term = filtroEncargadoBusqueda.toLowerCase().trim();
    if (!term) return encargados;
    return encargados.filter(e => 
      (e.nombre || '').toLowerCase().includes(term) ||
      (e.apellido || '').toLowerCase().includes(term) ||
      (e.correo || '').toLowerCase().includes(term)
    );
  }, [encargados, filtroEncargadoBusqueda]);

  const cargarDatos = async () => {
    setCargando(true);
    setError('');
    try {
      const [datosUsuarios, datosInventarios] = await Promise.all([listarUsuarios(), listarInventarios()]);
      setUsuarios(datosUsuarios);
      setInventarios(datosInventarios);
      let fijosData: ActivoFijoApi[] = [];
      let fungiblesData: MaterialApi[] = [];
      try {
        const token = obtenerToken();
        const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};
        const [fResp, mResp] = await Promise.all([
          fetch(`${API_BASE_URL}/activos/fijos`, { headers }),
          fetch(`${API_BASE_URL}/activos/fungibles`, { headers }),
        ]);
        if (fResp.ok) fijosData = await fResp.json();
        if (mResp.ok) fungiblesData = await mResp.json();
      } catch (e) {
        console.error('Error cargando activos fijos y fungibles:', e);
      }
      setTodosFijos(fijosData);
      setTodosFungibles(fungiblesData);
    } catch (err: any) {
      setError(err?.message || 'No se pudo cargar inventarios y encargados.');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    void cargarDatos();
  }, []);

  const recargar = () => {
    void cargarDatos();
  };

  const obtenerItemsFijosDeInventario = (inventarioId: number) => {
    const fijos = todosFijos.filter((f) => f.idInventario === inventarioId);
    return fijos.flatMap((f) => 
      (f.items ?? []).map((it) => ({
        ...it,
        nombreActivo: f.nombre,
        categoriaActivo: f.categoria,
      }))
    );
  };

  const obtenerLotesFungiblesDeInventario = (inventarioId: number) => {
    const fungibles = todosFungibles.filter((f) => f.idInventario === inventarioId);
    return fungibles.flatMap((f) =>
      (f.lotes ?? []).map((lote) => ({
        ...lote,
        nombreActivo: f.nombre,
        categoriaActivo: f.categoria,
        unidadActivo: f.unidad,
      }))
    );
  };

  const renderizarPermisosInventario = (puedeEditarFijos: boolean, puedeEditarFungibles: boolean) => (
    <div className="flex flex-wrap gap-2">
      <span className={`inline-flex items-center rounded-full px-2 py-1 text-[11px] font-medium ${puedeEditarFijos ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}`}>
        {puedeEditarFijos ? 'Activos fijos habilitados' : 'Activos fijos bloqueados'}
      </span>
      <span className={`inline-flex items-center rounded-full px-2 py-1 text-[11px] font-medium ${puedeEditarFungibles ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}`}>
        {puedeEditarFungibles ? 'Fungibles habilitados' : 'Fungibles bloqueados'}
      </span>
    </div>
  );

  const eliminarInventarioExistente = async (inventario: InventarioGestion) => {
    const confirmado = await confirmar({
      titulo: 'Eliminar inventario',
      descripcion: `¿Eliminar el inventario "${inventario.nombre}"?`,
      textoConfirmar: 'Eliminar',
      varianteConfirmar: 'destructive',
    });
    if (!confirmado) return;

    try {
      await eliminarInventario(inventario.id);
      await cargarDatos();
      toast.success('Inventario eliminado.');
    } catch (err: any) {
      toast.error(err?.message || 'No se pudo eliminar el inventario.');
    }
  };

  const actualizarInventarioUsuario = async (
    usuario: UsuarioSesion,
    cambios: {
      idInventario?: number | null;
    },
    mensajeExito = 'Inventario asignado correctamente al encargado.',
  ) => {
    setUsuarioActualizandoInventarioId(usuario.id);
    try {
      await asignarInventarioUsuario(
        usuario.id,
        cambios.idInventario !== undefined ? cambios.idInventario : (usuario.id_inventario ?? null),
      );
      await cargarDatos();
      toast.success(mensajeExito);
    } catch (err: any) {
      toast.error(err?.message || 'No se pudo actualizar la asignación del inventario.');
    } finally {
      setUsuarioActualizandoInventarioId(null);
    }
  };

  return (
    <LayoutPagina
      paginaActiva="inventarios"
      titulo="Gestión de Inventarios"
      subtitulo="Administración global de inventarios y usuarios encargados"
      onNavegar={onNavegar}
      onCerrarSesion={onCerrarSesion}
    >
      {error && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
          {error}
        </div>
      )}

      {cargando && inventarios.length === 0 ? (
        <div className="rounded-lg border border-slate-200 bg-white p-6 text-center text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
          Cargando datos...
        </div>
      ) : (
        <Tabs value={tabActiva} onValueChange={(val) => setTabActiva(val as any)} className="w-full">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 pb-1">
            <TabsList className="w-full sm:w-auto">
              <TabsTrigger value="inventarios" className="flex-1 sm:flex-initial">
                <Archive className="h-4 w-4 mr-1.5" />
                Inventarios Creados
              </TabsTrigger>
              <TabsTrigger value="usuarios" className="flex-1 sm:flex-initial">
                <Users2 className="h-4 w-4 mr-1.5" />
                Usuarios Encargados
              </TabsTrigger>
            </TabsList>

            <div className="flex flex-wrap items-center gap-3 sm:justify-end flex-1">
              {tabActiva === 'inventarios' ? (
                <div className="relative flex-1 max-w-[280px] min-w-[180px]">
                  <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Buscar inventario..."
                    value={filtroInventarioNombre}
                    onChange={(e) => setFiltroInventarioNombre(e.target.value)}
                    className="h-10 w-full rounded-lg border border-slate-205 bg-white pl-10 pr-4 text-xs text-slate-800 placeholder-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-850 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-blue-900 transition-all font-medium"
                  />
                  {filtroInventarioNombre && (
                    <button
                      onClick={() => setFiltroInventarioNombre('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-semibold"
                    >
                      Limpiar
                    </button>
                  )}
                </div>
              ) : (
                <div className="relative flex-1 max-w-[280px] min-w-[180px]">
                  <AtSign className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Buscar encargado o correo..."
                    value={filtroEncargadoBusqueda}
                    onChange={(e) => setFiltroEncargadoBusqueda(e.target.value)}
                    className="h-10 w-full rounded-lg border border-slate-205 bg-white pl-10 pr-4 text-xs text-slate-800 placeholder-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-850 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-blue-900 transition-all font-medium"
                  />
                  {filtroEncargadoBusqueda && (
                    <button
                      onClick={() => setFiltroEncargadoBusqueda('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-semibold"
                    >
                      Limpiar
                    </button>
                  )}
                </div>
              )}

              <DialogoInventario onExito={recargar} />
            </div>
          </div>

          <TabsContent value="inventarios" className="space-y-4">

            <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
                  <thead className="border-b border-slate-200 text-slate-500 dark:border-slate-700 dark:text-slate-400">
                    <tr>
                      <th className="px-2 py-2">ID</th>
                      <th className="px-2 py-2">Nombre</th>
                      <th className="px-2 py-2">Descripción</th>
                      <th className="px-2 py-2 text-center">Encargados</th>
                      <th className="px-2 py-2">Permisos</th>
                      <th className="px-2 py-2 text-center">Cantidades</th>
                      <th className="px-2 py-2 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inventariosFiltrados.map((inventario) => {
                      const fijosCount = obtenerItemsFijosDeInventario(inventario.id).length;
                      const fungiblesCount = obtenerLotesFungiblesDeInventario(inventario.id).length;

                      const fijosFiltrados = obtenerItemsFijosDeInventario(inventario.id).filter((it) => {
                        if (filtroActivos === 'disponibles') {
                          if (it.estado !== 'disponible') return false;
                        } else if (filtroActivos === 'no_disponibles') {
                          if (it.estado === 'disponible') return false;
                        }
                        if (filtroActivosId.trim() !== '') {
                          const val = filtroActivosId.toLowerCase().trim();
                          const codigo = String(it.codigoInventario || it.codigoUnico || it.id || '').toLowerCase();
                          if (!codigo.includes(val)) return false;
                        }
                        if (filtroActivosNombre.trim() !== '') {
                          const val = filtroActivosNombre.toLowerCase().trim();
                          const nombre = String(it.nombreActivo || '').toLowerCase();
                          const desc = String(it.descripcion || '').toLowerCase();
                          const ue = String(it.ue || '').toLowerCase();
                          if (!nombre.includes(val) && !desc.includes(val) && !ue.includes(val)) return false;
                        }
                        return true;
                      });

                      const fungiblesFiltrados = obtenerLotesFungiblesDeInventario(inventario.id).filter((lote) => {
                        if (filtroActivos === 'disponibles') {
                          if (lote.cantidadDisponible <= 0) return false;
                        } else if (filtroActivos === 'no_disponibles') {
                          if (lote.cantidadDisponible > 0) return false;
                        }
                        if (filtroActivosId.trim() !== '') {
                          const val = filtroActivosId.toLowerCase().trim();
                          const codigo = String(lote.lote || lote.serie || lote.id || '').toLowerCase();
                          if (!codigo.includes(val)) return false;
                        }
                        if (filtroActivosNombre.trim() !== '') {
                          const val = filtroActivosNombre.toLowerCase().trim();
                          const nombre = String(lote.nombreActivo || '').toLowerCase();
                          const cat = String(lote.categoriaActivo || '').toLowerCase();
                          const tipo = String(lote.tipo || '').toLowerCase();
                          if (!nombre.includes(val) && !cat.includes(val) && !tipo.includes(val)) return false;
                        }
                        return true;
                      });

                      return (
                        <tr key={inventario.id} className="border-b border-slate-100 dark:border-slate-800">
                          <td className="px-2 py-2 font-medium text-slate-500">{inventario.id}</td>
                          <td className="px-2 py-2 font-medium text-slate-900 dark:text-slate-100">{inventario.nombre}</td>
                          <td className="px-2 py-2">{inventario.descripcion || '—'}</td>
                          <td className="px-2 py-2 text-center">{inventario.totalEncargados}</td>
                          <td className="px-2 py-2 min-w-[260px]">{renderizarPermisosInventario(inventario.puedeEditarFijos, inventario.puedeEditarFungibles)}</td>
                          <td className="px-2 py-2 text-center whitespace-nowrap text-slate-600 dark:text-slate-400">
                            <span className="mr-2">Fijos: <span className="font-semibold text-slate-900 dark:text-slate-100">{fijosCount}</span></span>
                            <span>Fungibles: <span className="font-semibold text-slate-900 dark:text-slate-100">{fungiblesCount}</span></span>
                          </td>
                          <td className="px-2 py-2 text-right">
                            <div className="inline-flex items-center gap-2 flex-wrap justify-end">
                              <Dialog onOpenChange={(open) => {
                                if (!open) {
                                  setFiltroActivosId('');
                                  setFiltroActivosNombre('');
                                  setFiltroActivos('disponibles');
                                }
                              }}>
                                <DialogTrigger asChild>
                                  <Boton type="button" size="sm" variant="outline" className="gap-1 h-7 text-xs px-2">
                                    <Eye className="h-3 w-3" />
                                    Activos
                                  </Boton>
                                </DialogTrigger>
                                <DialogContent className="max-w-6xl">
                                  <DialogHeader>
                                    <DialogTitle>Activos - {inventario.nombre}</DialogTitle>
                                    <DialogDescription>Consulta y filtra los activos fijos y fungibles.</DialogDescription>
                                  </DialogHeader>
                                  <div className="mt-2">
                                    <Tabs defaultValue="fijos" className="w-full">
                                      <div className="flex flex-col lg:flex-row lg:items-center justify-between border-b border-slate-200 dark:border-slate-700 mb-4 gap-3 pb-2">
                                        <TabsList className="border-b-0 w-full lg:w-auto">
                                          <TabsTrigger value="fijos">
                                            <Wrench className="h-4 w-4" />
                                            Activos Fijos
                                          </TabsTrigger>
                                          <TabsTrigger value="fungibles">
                                            <Package className="h-4 w-4" />
                                            Activos Fungibles
                                          </TabsTrigger>
                                        </TabsList>
                                        
                                        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto lg:justify-end">
                                          <div className="relative flex-1 min-w-[120px] max-w-[160px]">
                                            <input
                                              type="text"
                                              placeholder="Buscar ID/Código..."
                                              value={filtroActivosId}
                                              onChange={(e) => setFiltroActivosId(e.target.value)}
                                              className="h-8 w-full rounded-md border border-slate-205 bg-white px-2.5 text-xs text-slate-800 placeholder-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-blue-900 transition-all font-medium"
                                            />
                                            {filtroActivosId && (
                                              <button
                                                type="button"
                                                onClick={() => setFiltroActivosId('')}
                                                className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-semibold"
                                              >
                                                ✕
                                              </button>
                                            )}
                                          </div>
                                          <div className="relative flex-1 min-w-[160px] max-w-[220px]">
                                            <input
                                              type="text"
                                              placeholder="Buscar nombre/desc..."
                                              value={filtroActivosNombre}
                                              onChange={(e) => setFiltroActivosNombre(e.target.value)}
                                              className="h-8 w-full rounded-md border border-slate-205 bg-white px-2.5 text-xs text-slate-800 placeholder-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-blue-900 transition-all font-medium"
                                            />
                                            {filtroActivosNombre && (
                                              <button
                                                type="button"
                                                onClick={() => setFiltroActivosNombre('')}
                                                className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-semibold"
                                              >
                                                ✕
                                              </button>
                                            )}
                                          </div>

                                          <select
                                            value={filtroActivos}
                                            onChange={(e) => setFiltroActivos(e.target.value as any)}
                                            className="h-8 rounded-md border border-slate-205 bg-white px-2 text-xs text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-blue-900 transition-all font-medium"
                                          >
                                            <option value="disponibles">Disponibles</option>
                                            <option value="no_disponibles">No disponibles</option>
                                            <option value="todos">Todos los estados</option>
                                          </select>
                                        </div>
                                      </div>
                                      
                                      <TabsContent value="fijos" className="mt-4">
                                        <div className="border border-slate-200 dark:border-slate-800 rounded-md overflow-hidden max-h-[500px] overflow-y-auto">
                                          <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
                                            <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 sticky top-0">
                                              <tr>
                                                <th className="px-3 py-2 font-medium">ID</th>
                                                <th className="px-3 py-2 font-medium">Nombre / Descripción</th>
                                                <th className="px-3 py-2 font-medium">Estado</th>
                                              </tr>
                                            </thead>
                                            <tbody>
                                              {fijosFiltrados.map((it) => (
                                                <tr key={it.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/30">
                                                  <td className="px-3 py-2 font-mono text-slate-500">{it.codigoInventario || it.codigoUnico || it.id}</td>
                                                  <td className="px-3 py-2">
                                                    <div className="font-medium text-slate-900 dark:text-slate-100">{it.nombreActivo}</div>
                                                    {(it.descripcion || it.ue) && (
                                                      <div className="text-slate-500 text-[10px]">
                                                        {it.ue && <span className="font-semibold text-slate-600 mr-1">UE: {it.ue}</span>}
                                                        {it.descripcion}
                                                      </div>
                                                    )}
                                                  </td>
                                                  <td className="px-3 py-2">
                                                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${it.estado === 'disponible' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'}`}>
                                                      {it.estado}
                                                    </span>
                                                  </td>
                                                </tr>
                                              ))}
                                              {fijosFiltrados.length === 0 && (
                                                <tr>
                                                  <td colSpan={3} className="px-3 py-8 text-center text-slate-500 italic">
                                                    No se encontraron activos fijos.
                                                  </td>
                                                </tr>
                                              )}
                                            </tbody>
                                          </table>
                                        </div>
                                      </TabsContent>
                                      
                                      <TabsContent value="fungibles" className="mt-4">
                                        <div className="border border-slate-200 dark:border-slate-800 rounded-md overflow-hidden max-h-[500px] overflow-y-auto">
                                          <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
                                            <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 sticky top-0">
                                              <tr>
                                                <th className="px-3 py-2 font-medium">ID / Lote / Serie</th>
                                                <th className="px-3 py-2 font-medium">Nombre / Categoría</th>
                                                <th className="px-3 py-2 font-medium">Cantidad</th>
                                                <th className="px-3 py-2 font-medium">Estado</th>
                                              </tr>
                                            </thead>
                                            <tbody>
                                              {fungiblesFiltrados.map((lote) => (
                                                <tr key={lote.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/30">
                                                  <td className="px-3 py-2 font-mono text-slate-500">{lote.lote || lote.serie || lote.id}</td>
                                                  <td className="px-3 py-2">
                                                    <div className="font-medium text-slate-900 dark:text-slate-100">{lote.nombreActivo}</div>
                                                    <div className="text-slate-500 text-[10px]">{lote.categoriaActivo} {lote.tipo ? `· ${lote.tipo}` : ''}</div>
                                                  </td>
                                                  <td className="px-3 py-2 font-semibold text-slate-800 dark:text-slate-200">
                                                    {lote.cantidadDisponible} {lote.unidadActivo}
                                                  </td>
                                                  <td className="px-3 py-2">
                                                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${lote.cantidadDisponible > 0 ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300' : 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300'}`}>
                                                      {lote.cantidadDisponible > 0 ? 'Disponible' : 'Agotado'}
                                                    </span>
                                                  </td>
                                                </tr>
                                              ))}
                                              {fungiblesFiltrados.length === 0 && (
                                                <tr>
                                                  <td colSpan={4} className="px-3 py-8 text-center text-slate-500 italic">
                                                    No se encontraron activos fungibles.
                                                  </td>
                                                </tr>
                                              )}
                                            </tbody>
                                          </table>
                                        </div>
                                      </TabsContent>
                                    </Tabs>
                                  </div>
                                </DialogContent>
                              </Dialog>

                              <DialogoInventario 
                                inventario={inventario} 
                                onExito={recargar}
                                trigger={
                                  <Boton type="button" size="sm" variant="outline" className="h-7 text-xs px-2">
                                    Editar
                                  </Boton>
                                }
                              />
                              <Boton type="button" size="sm" variant="outline" onClick={() => eliminarInventarioExistente(inventario)} className="h-7 text-xs px-2 text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950/30">
                                Eliminar
                              </Boton>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {inventariosFiltrados.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-2 py-8 text-center text-slate-500 dark:text-slate-400">
                          {inventarios.length === 0
                            ? 'No hay inventarios registrados en el sistema.'
                            : 'No se encontraron inventarios que coincidan con la búsqueda.'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="usuarios">
            <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Encargados de Inventario</h3>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                La asignación del encargado solo vincula un inventario. Los permisos de Activos y Material se heredan desde el inventario asignado.
              </p>

              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
                  <thead className="border-b border-slate-200 text-slate-500 dark:border-slate-700 dark:text-slate-400">
                    <tr>
                      <th className="px-2 py-2 w-16">ID</th>
                      <th className="px-2 py-2">Correo</th>
                      <th className="px-2 py-2">Inventario asignado</th>
                      <th className="px-2 py-2">Permisos heredados</th>
                    </tr>
                  </thead>
                  <tbody>
                    {encargadosFiltrados.map((usuario) => (
                      <tr key={usuario.id} className="border-b border-slate-100 dark:border-slate-800">
                        <td className="px-2 py-2 font-medium text-slate-500">{usuario.id}</td>
                        <td className="px-2 py-2 font-medium text-slate-900 dark:text-slate-100">{usuario.correo}</td>
                        <td className="px-2 py-2">
                          <select
                            value={usuario.id_inventario ?? ''}
                            onChange={(e) => {
                              const valor = e.target.value.trim();
                              void actualizarInventarioUsuario(usuario, {
                                idInventario: valor ? Number(valor) : null,
                              });
                            }}
                            disabled={usuarioActualizandoInventarioId === usuario.id}
                            className="h-8 min-w-[250px] rounded-md border border-slate-200 bg-white px-2 text-xs text-slate-700 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 transition-colors"
                          >
                            <option value="">Sin inventario asignado</option>
                            {inventarios.map((inventario) => (
                              <option key={inventario.id} value={inventario.id}>{inventario.nombre}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-2 py-2">
                          {usuario.id_inventario == null ? (
                            <span className="text-xs text-slate-500 dark:text-slate-400">Sin inventario asignado.</span>
                          ) : renderizarPermisosInventario(usuario.puedeEditarFijos ?? false, usuario.puedeEditarFungibles ?? false)}
                        </td>
                      </tr>
                    ))}
                    {encargadosFiltrados.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-2 py-8 text-center text-slate-500 dark:text-slate-400">
                          {encargados.length === 0
                            ? 'No hay usuarios con el rol de encargado registrados.'
                            : 'No se encontraron encargados que coincidan con la búsqueda.'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      )}
    </LayoutPagina>
  );
};
