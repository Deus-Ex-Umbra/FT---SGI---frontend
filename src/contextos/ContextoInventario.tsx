import { createContext, useContext, useState, useMemo, useEffect } from 'react';
import { toast } from 'sonner';
import type {
    ContenedorHerramientas, Herramienta, SubinstanciaHerramienta,
    ContenedorMateriales, MaterialFungible, SubinstanciaMaterial,
    Estudiante, Prestamo, Docente, Materia, Carrera, ItemActivoResumen
} from '@/tipos/inventario';
import {
    cargarActivosDesdeBackend,
    cargarContenedoresCompartidosDesdeBackend,
    cargarMaterialesDesdeBackend,
    cargarPrestamosDesdeBackend,
    cargarEstudiantesDesdeBackend,
    cargarDocentesDesdeBackend,
    cargarMateriasDesdeBackend,
    crearMateriaEnBackend,
    editarMateriaEnBackend,
    eliminarMateriaEnBackend,
    cargarCarrerasDesdeBackend,
    crearCarreraEnBackend,
    editarCarreraEnBackend,
    eliminarCarreraEnBackend,
    crearEstudianteEnBackend,
    editarEstudianteEnBackend,
    eliminarEstudianteEnBackend,
    crearDocenteEnBackend,
    editarDocenteEnBackend,
    eliminarDocenteEnBackend,
    crearPrestamoEnBackend,
    editarPrestamoEnBackend,
    extenderPrestamoEnBackend,
    devolverPrestamoEnBackend,
    editarActivoFijoEnBackend,
    eliminarActivoFijoEnBackend,
    editarItemActivoEnBackend,
    crearActivoFijoEnBackend,
    crearItemActivoEnBackend,
    eliminarItemActivoEnBackend,
    crearContenedorActivoEnBackend,
    crearContenedorCompartidoEnBackend,
    editarContenedorCompartidoEnBackend,
    editarContenedorActivoEnBackend,
    crearContenedorMaterialEnBackend,
    editarContenedorMaterialEnBackend,
    crearCajaMaterialEnBackend,
    crearLoteMaterialEnBackend,
    editarCajaMaterialEnBackend,
    editarLoteMaterialEnBackend,
    eliminarContenedorCompartidoEnBackend,
    eliminarContenedorMaterialEnBackend,
    eliminarCajaMaterialEnBackend,
    eliminarLoteMaterialEnBackend,
} from '@/lib/servicio-inventario';

interface ContextoInventarioTipo {
    contenedoresCompartidos: Array<{ id: string; nombre: string; descripcion: string; idActivo?: number; idMaterial?: number }>;
    contenedoresHerramientas: ContenedorHerramientas[];
    contenedoresMateriales: ContenedorMateriales[];
    catalogoMaterialesFungibles: MaterialFungible[];
    herramientas: ItemActivoResumen[];
    materiales: MaterialFungible[];
    estudiantes: Estudiante[];
    prestamos: Prestamo[];
    docentes: Docente[];
    materias: Materia[];
    carreras: Carrera[];
    agregarEstudiante: (e: Omit<Estudiante, 'id'>) => Promise<Estudiante>;
    editarEstudiante: (id: string, datos: Partial<Omit<Estudiante, 'id'>>) => Promise<void>;
    eliminarEstudiante: (id: string) => Promise<void>;
    agregarDocente: (d: Omit<Docente, 'id'>) => Promise<Docente>;
    editarDocente: (id: string, datos: Partial<Omit<Docente, 'id'>>) => Promise<void>;
    eliminarDocente: (id: string) => Promise<void>;
    agregarMateria: (m: { codigo: string; nombre?: string | null }) => Promise<Materia>;
    editarMateria: (id: string, datos: Partial<{ codigo: string; nombre: string | null }>) => Promise<void>;
    eliminarMateria: (id: string) => Promise<void>;
    agregarCarrera: (c: { nombre: string }) => Promise<Carrera>;
    editarCarrera: (id: string, datos: Partial<{ nombre: string }>) => Promise<void>;
    eliminarCarrera: (id: string) => Promise<void>;
    agregarPrestamo: (p: Omit<Prestamo, 'id' | 'estado'>) => Promise<void>;
    editarPrestamo: (id: string, datos: Partial<Omit<Prestamo, 'id'>>) => Promise<void>;
    extenderPrestamo: (id: string, fechaDevolucion: string) => Promise<void>;
    devolverPrestamo: (id: string) => Promise<void>;
    agregarHerramienta: (h: Omit<Herramienta, 'id'>) => void;
    registrarEntregaMaterial: (idMaterial: string, cantidad: number, carnet: string, motivo: string) => void;
    recargarDatos: () => Promise<void>;
    agregarContenedorCompartido: (datos: { nombre: string; descripcion: string }) => Promise<void>;
    editarContenedorCompartido: (datos: { id: string; idActivo?: number; idMaterial?: number; nombre: string; descripcion: string }) => Promise<void>;
    eliminarContenedorCompartido: (datos: { id: string; idActivo?: number; idMaterial?: number }) => Promise<void>;
    agregarContenedorActivos: (datos: Omit<ContenedorHerramientas, 'id' | 'herramientas'>) => Promise<void>;
    editarContenedorActivos: (id: string, datos: Omit<ContenedorHerramientas, 'id' | 'herramientas'>) => Promise<void>;
    agregarCajaActivo: (idContenedor: string, datos: Omit<Herramienta, 'id' | 'subinstancias'>) => Promise<void>;
    editarInstanciaActivo: (idContenedor: string, idHerramienta: string, datos: Partial<Omit<Herramienta, 'id' | 'subinstancias'>>) => Promise<void>;
    eliminarInstanciaActivo: (idContenedor: string, idHerramienta: string) => Promise<void>;
    agregarSubinstanciaActivo: (idContenedor: string, idHerramienta: string, datos: Omit<SubinstanciaHerramienta, 'id'>) => Promise<void>;
    editarSubinstanciaActivo: (
        idContenedor: string,
        idHerramienta: string,
        idSub: string,
        datos: Partial<Omit<SubinstanciaHerramienta, 'id'>> & { justificacion?: string },
    ) => Promise<void>;
    eliminarSubinstanciaActivo: (idContenedor: string, idHerramienta: string, idSub: string) => Promise<void>;
    agregarContenedorMateriales: (datos: Omit<ContenedorMateriales, 'id' | 'materiales'>) => Promise<void>;
    editarContenedorMateriales: (id: string, datos: Omit<ContenedorMateriales, 'id' | 'materiales'>) => Promise<void>;
    eliminarContenedorMateriales: (id: string) => Promise<void>;
    agregarMaterialFungible: (datos: Omit<MaterialFungible, 'id' | 'subinstancias'>) => Promise<void>;
    editarInstanciaMaterial: (idContenedor: string, idMaterial: string, datos: Partial<Omit<MaterialFungible, 'id' | 'subinstancias'>>) => Promise<void>;
    eliminarInstanciaMaterial: (idContenedor: string, idMaterial: string) => Promise<void>;
    agregarSubinstanciaMaterial: (idContenedor: string, idMaterial: string, datos: Omit<SubinstanciaMaterial, 'id'>) => Promise<void>;
    editarSubinstanciaMaterial: (idContenedor: string, idMaterial: string, idSub: string, datos: Omit<SubinstanciaMaterial, 'id'>) => Promise<void>;
    eliminarSubinstanciaMaterial: (idContenedor: string, idMaterial: string, idSub: string) => Promise<void>;
}

const ContextoInventario = createContext<ContextoInventarioTipo | null>(null);

export const useInventario = () => {
    const ctx = useContext(ContextoInventario);
    if (!ctx) throw new Error('useInventario debe usarse dentro de ProveedorInventario');
    return ctx;
};

export const ProveedorInventario = ({ children }: { children: React.ReactNode }) => {
    const [contenedoresCompartidos, setContenedoresCompartidos] = useState<Array<{ id: string; nombre: string; descripcion: string; idActivo?: number; idMaterial?: number }>>([]);
    const [contenedoresHerramientas, setContenedoresHerramientas] = useState<ContenedorHerramientas[]>([]);
    const [contenedoresMateriales, setContenedoresMateriales] = useState<ContenedorMateriales[]>([]);
    const [catalogoMaterialesFungibles, setCatalogoMaterialesFungibles] = useState<MaterialFungible[]>([]);
    const [estudiantes, setEstudiantes] = useState<Estudiante[]>([]);
    const [prestamos, setPrestamos] = useState<Prestamo[]>([]);
    const [docentes, setDocentes] = useState<Docente[]>([]);
    const [materias, setMaterias] = useState<Materia[]>([]);
    const [carreras, setCarreras] = useState<Carrera[]>([]);

    const cargarDesdeBackend = async () => {
            try {
                const [contenedoresBd, activosBd, materialesBd, prestamosBd, estudiantesBd, docentesBd, materiasBd, carrerasBd] = await Promise.all([
                    cargarContenedoresCompartidosDesdeBackend(),
                    cargarActivosDesdeBackend(),
                    cargarMaterialesDesdeBackend(),
                    cargarPrestamosDesdeBackend(),
                    cargarEstudiantesDesdeBackend(),
                    cargarDocentesDesdeBackend(),
                    cargarMateriasDesdeBackend(),
                    cargarCarrerasDesdeBackend(),
                ]);

                setContenedoresCompartidos(contenedoresBd);
                setContenedoresHerramientas(activosBd);
                setContenedoresMateriales(materialesBd.contenedores);
                setCatalogoMaterialesFungibles(materialesBd.catalogo);
                setPrestamos(prestamosBd);
                setEstudiantes(estudiantesBd);
                setDocentes(docentesBd);
                setMaterias(materiasBd);
                setCarreras(carrerasBd);
            } catch {
                setContenedoresCompartidos([]);
                setContenedoresHerramientas([]);
                setContenedoresMateriales([]);
                setCatalogoMaterialesFungibles([]);
                setPrestamos([]);
                setEstudiantes([]);
                setDocentes([]);
                setMaterias([]);
                setCarreras([]);
            }
        };

    useEffect(() => {
        void cargarDesdeBackend();
    }, []);

    const herramientas = useMemo<ItemActivoResumen[]>(() => contenedoresHerramientas.flatMap((contenedor) =>
        contenedor.herramientas.flatMap((activo) =>
            activo.subinstancias.map((item) => ({
                id: item.id,
                idActivoPadre: activo.id,
                nombre: activo.nombre,
                categoria: activo.categoria,
                descripcion: item.descripcion?.trim() || activo.descripcion,
                ue: item.ue?.trim() || '',
                codigoInventario: item.codigoInventario,
                codigoUnico: item.codigoUnico,
                fechaEntrega: item.fechaEntrega,
                fechaRetiro: item.fechaRetiro,
                estado: item.estado,
                estadoFisico: item.estadoFisico,
                ubicacion: item.ubicacion?.trim() || contenedor.nombre,
                observaciones: item.observaciones,
                precio: item.precio,
                contenedorId: contenedor.id,
                contenedorNombre: contenedor.nombre,
            })),
        ),
    ), [contenedoresHerramientas]);

    const materiales = useMemo(() => contenedoresMateriales.flatMap(c =>
        c.materiales.flatMap(m => {
            if (m.subinstancias.length === 0) return [];
            return m.subinstancias.map(sub => ({
                ...m,
                id: sub.id,
                cantidadDisponible: sub.cantidadDisponible,
                precio: sub.precio
            }));
        })
    ), [contenedoresMateriales]);

    const agregarEstudiante = async (datos: Omit<Estudiante, 'id'>) => {
        const creado = await crearEstudianteEnBackend(datos);
        setEstudiantes(prev => [...prev, creado]);
        return creado;
    };

    const editarEstudiante = async (id: string, datos: Partial<Omit<Estudiante, 'id'>>) => {
        const actualizado = await editarEstudianteEnBackend(id, datos);
        setEstudiantes(prev => prev.map(e => e.id === id ? actualizado : e));
    };

    const eliminarEstudiante = async (id: string) => {
        await eliminarEstudianteEnBackend(id);
        setEstudiantes(prev => prev.filter(e => e.id !== id));
    };

    const agregarDocente = async (datos: Omit<Docente, 'id'>) => {
        const creado = await crearDocenteEnBackend(datos);
        setDocentes(prev => [...prev, creado]);
        return creado;
    };

    const editarDocente = async (id: string, datos: Partial<Omit<Docente, 'id'>>) => {
        const actualizado = await editarDocenteEnBackend(id, datos);
        setDocentes(prev => prev.map(d => d.id === id ? actualizado : d));
    };

    const eliminarDocente = async (id: string) => {
        await eliminarDocenteEnBackend(id);
        setDocentes(prev => prev.filter(d => d.id !== id));
    };

    const agregarMateria = async (datos: { codigo: string; nombre?: string | null }) => {
        const creada = await crearMateriaEnBackend(datos);
        setMaterias(prev => [...prev, creada].sort((a, b) => a.codigo.localeCompare(b.codigo)));
        return creada;
    };

    const editarMateria = async (id: string, datos: Partial<{ codigo: string; nombre: string | null }>) => {
        const actualizada = await editarMateriaEnBackend(id, datos);
        setMaterias(prev => prev.map(m => m.id === id ? actualizada : m).sort((a, b) => a.codigo.localeCompare(b.codigo)));
    };

    const eliminarMateria = async (id: string) => {
        await eliminarMateriaEnBackend(id);
        setMaterias(prev => prev.filter(m => m.id !== id));
        // No recargamos docentes automáticamente; la UI fuerza a desasignar antes de eliminar.
    };

    const agregarCarrera = async (datos: { nombre: string }) => {
        const creada = await crearCarreraEnBackend(datos);
        setCarreras(prev => [...prev, creada].sort((a, b) => a.nombre.localeCompare(b.nombre)));
        return creada;
    };

    const editarCarrera = async (id: string, datos: Partial<{ nombre: string }>) => {
        const actualizada = await editarCarreraEnBackend(id, datos);
        setCarreras(prev => prev.map(c => c.id === id ? actualizada : c).sort((a, b) => a.nombre.localeCompare(b.nombre)));
    };

    const eliminarCarrera = async (id: string) => {
        await eliminarCarreraEnBackend(id);
        setCarreras(prev => prev.filter(c => c.id !== id));
    };

    const toApiDateTime = (valor?: string | null): string | null => {
        if (!valor) return null;
        const limpio = valor.trim();
        if (!limpio) return null;
        if (limpio.includes('T')) return `${limpio.replace('T', ' ')}:00`;
        if (limpio.length === 10) return `${limpio} 00:00:00`;
        return limpio;
    };

    const buscarIdDocente = (nombreCompleto: string): number | null => {
        const buscado = nombreCompleto.trim().toLowerCase();
        const docente = docentes.find(d => `${d.nombre} ${d.apellido}`.trim().toLowerCase() === buscado);
        return docente ? Number(docente.id) : null;
    };

    const agregarPrestamo = async (datos: Omit<Prestamo, 'id' | 'estado'>) => {
        const idDocente = buscarIdDocente(datos.docente);
        if (!idDocente) {
            throw new Error('Selecciona un docente válido de la lista.');
        }

        const creado = await crearPrestamoEnBackend({
            carnetEstudiante: datos.carnetEstudiante,
            idDocente,
            idHerramienta: datos.idHerramienta,
            fechaPrestamo: toApiDateTime(datos.fechaPrestamo) ?? '',
            fechaDevolucion: toApiDateTime(datos.fechaDevolucion ?? datos.fechaPrestamo) ?? '',
            observaciones: datos.observaciones,
        });

        setPrestamos(prev => [...prev, creado]);
        const estudiantesActualizados = await cargarEstudiantesDesdeBackend();
        setEstudiantes(estudiantesActualizados);
    };

    const editarPrestamo = async (id: string, datos: Partial<Omit<Prestamo, 'id'>>) => {
        const payload: Partial<{
            carnetEstudiante: string;
            idHerramienta: string;
            fechaPrestamo: string;
            fechaDevolucion: string | null;
            observaciones: string;
            idDocente: number;
            estado: 'pendiente' | 'devuelto' | 'vencido' | 'activo' | 'devuelto_fuera_de_fecha_limite'
        }> = {};

        if (datos.carnetEstudiante !== undefined) payload.carnetEstudiante = datos.carnetEstudiante;
        if (datos.idHerramienta !== undefined) payload.idHerramienta = datos.idHerramienta;
        if (datos.fechaPrestamo !== undefined) payload.fechaPrestamo = toApiDateTime(datos.fechaPrestamo) ?? '';
        if (datos.fechaDevolucion !== undefined) payload.fechaDevolucion = toApiDateTime(datos.fechaDevolucion);
        if (datos.observaciones !== undefined) payload.observaciones = datos.observaciones;
        if (datos.estado !== undefined) payload.estado = datos.estado;
        if (datos.docente !== undefined) {
            const idDocente = buscarIdDocente(datos.docente);
            if (!idDocente) throw new Error('Docente no válido para actualizar préstamo.');
            payload.idDocente = idDocente;
        }

        const actualizado = await editarPrestamoEnBackend(id, payload);
        setPrestamos(prev => prev.map(p => p.id === id ? actualizado : p));
        const estudiantesActualizados = await cargarEstudiantesDesdeBackend();
        setEstudiantes(estudiantesActualizados);
    };

    const extenderPrestamo = async (id: string, fechaDevolucion: string) => {
        const actualizado = await extenderPrestamoEnBackend(id, toApiDateTime(fechaDevolucion) ?? '');
        setPrestamos(prev => prev.map(p => p.id === id ? actualizado : p));
        const estudiantesActualizados = await cargarEstudiantesDesdeBackend();
        setEstudiantes(estudiantesActualizados);
    };

    const devolverPrestamo = async (id: string) => {
        const actualizado = await devolverPrestamoEnBackend(id);
        setPrestamos(prev => prev.map(p => p.id === id ? actualizado : p));
        const estudiantesActualizados = await cargarEstudiantesDesdeBackend();
        setEstudiantes(estudiantesActualizados);
    };

    const agregarHerramienta = (datos: Omit<Herramienta, 'id'>) => {
        const primerItem = datos.subinstancias[0];
        setContenedoresHerramientas(prev => prev.map((c, i) => i === 0 ? {
            ...c,
            herramientas: [...c.herramientas, {
                ...datos,
                id: `H${Date.now()}`,
                subinstancias: [{
                    id: `S${Date.now()}`,
                    codigoInventario: (primerItem?.codigoInventario ?? '').trim(),
                    codigoUnico: primerItem?.codigoUnico?.trim(),
                    estado: primerItem?.estado || datos.estado || 'disponible',
                    ue: '',
                    descripcion: '',
                    observaciones: primerItem?.observaciones || datos.observaciones || ''
                }]
            }]
        } : c));
    };

    const registrarEntregaMaterial = (idMaterial: string, cantidad: number, _carnet: string, _motivo: string) => {
        setContenedoresMateriales(prev => prev.map(c => ({
            ...c,
            materiales: c.materiales.map(m => {
                if (m.subinstancias.some(s => s.id === idMaterial || m.id === idMaterial)) {
                    return {
                        ...m,
                        subinstancias: m.subinstancias.map((s, i) => i === 0 ? {
                            ...s, cantidadDisponible: Math.max(0, s.cantidadDisponible - cantidad)
                        } : s)
                    };
                }
                return m;
            })
        })));
    };

    const agregarContenedorCompartido = async (datos: { nombre: string; descripcion: string }) => {
        await crearContenedorCompartidoEnBackend(datos);
        await cargarDesdeBackend();
    };

    const editarContenedorCompartido = async (datos: { id: string; idActivo?: number; idMaterial?: number; nombre: string; descripcion: string }) => {
        await editarContenedorCompartidoEnBackend(datos);
        await cargarDesdeBackend();
    };

    const eliminarContenedorCompartido = async (datos: { id: string; idActivo?: number; idMaterial?: number }) => {
        try {
            await eliminarContenedorCompartidoEnBackend(datos);
            await cargarDesdeBackend();
            toast.success('Contenedor eliminado correctamente.');
        } catch (error: any) {
            const mensaje = error?.message ?? 'No se pudo eliminar el contenedor.';
            toast.error(mensaje);
            throw error;
        }
    };
    const agregarContenedorActivos = async (datos: Omit<ContenedorHerramientas, 'id' | 'herramientas'>) => {
        const nombre = datos.nombre?.trim();
        const descripcion = datos.descripcion?.trim();
        if (!nombre || !descripcion) return;

        await crearContenedorActivoEnBackend({ nombre, descripcion });
        const activosBd = await cargarActivosDesdeBackend();
        setContenedoresHerramientas(activosBd);
    };
    const editarContenedorActivos = async (id: string, datos: Omit<ContenedorHerramientas, 'id' | 'herramientas'>) => {
        if (esNumero(id)) {
            await editarContenedorActivoEnBackend(id, {
                nombre: datos.nombre,
                descripcion: datos.descripcion,
            });
            const activosBd = await cargarActivosDesdeBackend();
            setContenedoresHerramientas(activosBd);
            return;
        }

        setContenedoresHerramientas(prev => prev.map(c => c.id === id ? { ...c, ...datos, ubicacion: datos.descripcion } : c));
    };
    const agregarCajaActivo = async (idContenedor: string, datos: Omit<Herramienta, 'id' | 'subinstancias'>) => {
        const nombre = datos.nombre?.trim();
        if (!nombre) {
            throw new Error('El nombre del activo fijo es obligatorio.');
        }

        if (esNumero(idContenedor)) {
            await crearActivoFijoEnBackend({
                nombre,
                idContenedor: Number(idContenedor),
                categoria: datos.categoria,
                descripcion: datos.descripcion,
            });
            const activosBd = await cargarActivosDesdeBackend();
            setContenedoresHerramientas(activosBd);
            return;
        }

        throw new Error('El contenedor seleccionado para el activo fijo no es válido.');
    };
    const esNumero = (valor: string) => /^\d+$/.test(valor);
    const esUuid = (valor: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(valor.trim());
    const esIdBackend = (valor: string) => esNumero(valor) || esUuid(valor);

    const editarInstanciaActivo = async (idContenedor: string, idHerramienta: string, datos: Partial<Omit<Herramienta, 'id' | 'subinstancias'>>) => {
        const hayCamposBackend =
            typeof datos.nombre === 'string' ||
            typeof datos.categoria === 'string' ||
            typeof datos.descripcion === 'string';

        if (esNumero(idContenedor) && esNumero(idHerramienta) && hayCamposBackend) {
            await editarActivoFijoEnBackend(idHerramienta, {
                ...(typeof datos.nombre === 'string' ? { nombre: datos.nombre } : {}),
                ...(typeof datos.categoria === 'string' ? { categoria: datos.categoria } : {}),
                ...(typeof datos.descripcion === 'string' ? { descripcion: datos.descripcion } : {}),
            });
            const activosBd = await cargarActivosDesdeBackend();
            if (activosBd.length > 0) {
                setContenedoresHerramientas(activosBd);
                return;
            }
        }

        setContenedoresHerramientas(prev => prev.map(c => c.id === idContenedor ? {
            ...c,
            herramientas: c.herramientas.map(h => h.id === idHerramienta ? { ...h, ...datos } : h)
        } : c));
    };

    const eliminarInstanciaActivo = async (idContenedor: string, idHerramienta: string) => {
        if (esNumero(idContenedor) && esNumero(idHerramienta)) {
            await eliminarActivoFijoEnBackend(idHerramienta);
            const activosBd = await cargarActivosDesdeBackend();
            setContenedoresHerramientas(activosBd);
            return;
        }

        setContenedoresHerramientas((prev) =>
            prev.map((c) =>
                c.id === idContenedor
                    ? { ...c, herramientas: c.herramientas.filter((h) => h.id !== idHerramienta) }
                    : c,
            ),
        );
    };
    const agregarSubinstanciaActivo = async (idContenedor: string, idHerramienta: string, datos: Omit<SubinstanciaHerramienta, 'id'>) => {
        if (esNumero(idContenedor) && esNumero(idHerramienta)) {
            await crearItemActivoEnBackend({
                idActivo: idHerramienta,
                codigoInventario: datos.codigoInventario,
                codigoUnico: datos.codigoUnico,
                ubicacion: datos.ubicacion,
                ue: datos.ue,
                descripcion: datos.descripcion,
                fechaEntrega: datos.fechaEntrega ?? null,
                fechaRetiro: datos.fechaRetiro ?? null,
                estado: datos.estado,
                estadoFisico: datos.estadoFisico ?? 'bueno',
                observaciones: datos.observaciones,
                precio: Number(datos.precio ?? 0),
            });
            const activosBd = await cargarActivosDesdeBackend();
            setContenedoresHerramientas(activosBd);
            return;
        }

        setContenedoresHerramientas(prev => prev.map(c => c.id === idContenedor ? {
            ...c,
            herramientas: c.herramientas.map(h => h.id === idHerramienta ? {
                ...h,
                subinstancias: [...h.subinstancias, { ...datos, id: `S${Date.now()}` }]
            } : h)
        } : c));
    };
    const editarSubinstanciaActivo = async (
        idContenedor: string,
        idHerramienta: string,
        idSub: string,
        datos: Partial<Omit<SubinstanciaHerramienta, 'id'>> & { justificacion?: string },
    ) => {
        if (esNumero(idContenedor) && esIdBackend(idSub)) {
            await editarItemActivoEnBackend(idSub, {
                codigoInventario: datos.codigoInventario,
                codigoUnico: datos.codigoUnico,
                ubicacion: datos.ubicacion,
                ue: datos.ue,
                descripcion: datos.descripcion,
                fechaEntrega: datos.fechaEntrega !== undefined ? (datos.fechaEntrega ?? null) : undefined,
                fechaRetiro: datos.fechaRetiro !== undefined ? (datos.fechaRetiro ?? null) : undefined,
                estado: datos.estado,
                estadoFisico: datos.estadoFisico,
                observaciones: datos.observaciones,
                justificacion: datos.justificacion,
                precio: typeof datos.precio === 'number' ? Number(datos.precio) : undefined,
            });
            const activosBd = await cargarActivosDesdeBackend();
            setContenedoresHerramientas(activosBd);
            return;
        }

        setContenedoresHerramientas(prev => prev.map(c => c.id === idContenedor ? {
            ...c,
            herramientas: c.herramientas.map(h => h.id === idHerramienta ? {
                ...h,
                subinstancias: h.subinstancias.map(s => s.id === idSub ? { ...s, ...datos, id: s.id } : s)
            } : h)
        } : c));
    };

    const eliminarSubinstanciaActivo = async (idContenedor: string, idHerramienta: string, idSub: string) => {
        if (esNumero(idContenedor) && esNumero(idHerramienta) && esIdBackend(idSub)) {
            await eliminarItemActivoEnBackend(idSub);
            const activosBd = await cargarActivosDesdeBackend();
            setContenedoresHerramientas(activosBd);
            return;
        }

        setContenedoresHerramientas((prev) =>
            prev.map((c) =>
                c.id === idContenedor
                    ? {
                          ...c,
                          herramientas: c.herramientas.map((h) =>
                              h.id === idHerramienta
                                  ? { ...h, subinstancias: h.subinstancias.filter((s) => s.id !== idSub) }
                                  : h,
                          ),
                      }
                    : c,
            ),
        );
    };
    const agregarContenedorMateriales = async (datos: Omit<ContenedorMateriales, 'id' | 'materiales'>) => {
        const nombre = datos.nombre?.trim();
        const descripcion = datos.descripcion?.trim();
        if (!nombre || !descripcion) return;

        await crearContenedorMaterialEnBackend({ nombre, descripcion });
        const materialesBd = await cargarMaterialesDesdeBackend();
        setContenedoresMateriales(materialesBd.contenedores);
        setCatalogoMaterialesFungibles(materialesBd.catalogo);
    };
    const editarContenedorMateriales = async (id: string, datos: Omit<ContenedorMateriales, 'id' | 'materiales'>) => {
        if (esNumero(id)) {
            await editarContenedorMaterialEnBackend(id, {
                nombre: datos.nombre,
                descripcion: datos.descripcion,
            });
            const materialesBd = await cargarMaterialesDesdeBackend();
            setContenedoresMateriales(materialesBd.contenedores);
            setCatalogoMaterialesFungibles(materialesBd.catalogo);
            return;
        }

        setContenedoresMateriales(prev => prev.map(c => c.id === id ? { ...c, ...datos, ubicacion: datos.descripcion } : c));
    };
    const eliminarContenedorMateriales = async (id: string) => {
        try {
            if (esNumero(id)) {
                await eliminarContenedorMaterialEnBackend(id);
                const materialesBd = await cargarMaterialesDesdeBackend();
                setContenedoresMateriales(materialesBd.contenedores);
                setCatalogoMaterialesFungibles(materialesBd.catalogo);
                toast.success('Contenedor eliminado correctamente.');
                return;
            }

            setContenedoresMateriales(prev => prev.filter(c => c.id !== id));
            toast.success('Contenedor eliminado correctamente.');
        } catch (error: any) {
            const mensaje = error?.message ?? 'No se pudo eliminar el contenedor.';
            toast.error(mensaje);
            throw error;
        }
    };
    const agregarMaterialFungible = async (datos: Omit<MaterialFungible, 'id' | 'subinstancias'>) => {
        const nombre = datos.nombre?.trim();
        if (!nombre) {
            throw new Error('El nombre del activo fungible es obligatorio.');
        }

        await crearCajaMaterialEnBackend({
            nombre,
            categoria: datos.categoria,
            descripcion: datos.descripcion,
            unidad: datos.unidad,
            stockMinimoHabilitado: Boolean(datos.stockMinimoHabilitado),
            stockMinimo: Number(datos.stockMinimo ?? 0),
            tipoIdentificacion: datos.tipoIdentificacion,
        });
        const materialesBd = await cargarMaterialesDesdeBackend();
        setContenedoresMateriales(materialesBd.contenedores);
        setCatalogoMaterialesFungibles(materialesBd.catalogo);
    };
    const editarInstanciaMaterial = async (idContenedor: string, idMaterial: string, datos: Partial<Omit<MaterialFungible, 'id' | 'subinstancias'>>) => {
        if (esNumero(idMaterial)) {
            await editarCajaMaterialEnBackend(idMaterial, {
                nombre: datos.nombre,
                categoria: datos.categoria,
                descripcion: datos.descripcion,
                unidad: datos.unidad,
                stockMinimoHabilitado: typeof datos.stockMinimoHabilitado === 'boolean' ? datos.stockMinimoHabilitado : undefined,
                stockMinimo: typeof datos.stockMinimo === 'number' ? Number(datos.stockMinimo) : undefined,
                tipoIdentificacion: datos.tipoIdentificacion,
            });
            const materialesBd = await cargarMaterialesDesdeBackend();
            setContenedoresMateriales(materialesBd.contenedores);
            setCatalogoMaterialesFungibles(materialesBd.catalogo);
            return;
        }

        setContenedoresMateriales(prev => prev.map(c => c.id === idContenedor ? {
            ...c,
            materiales: c.materiales.map(m => m.id === idMaterial ? { ...m, ...datos } : m)
        } : c));
    };
    const eliminarInstanciaMaterial = async (idContenedor: string, idMaterial: string) => {
        try {
            if (esNumero(idMaterial)) {
                await eliminarCajaMaterialEnBackend(idMaterial);
                const materialesBd = await cargarMaterialesDesdeBackend();
                setContenedoresMateriales(materialesBd.contenedores);
                setCatalogoMaterialesFungibles(materialesBd.catalogo);
                toast.success('Activo fungible eliminado correctamente.');
                return;
            }

            setContenedoresMateriales(prev => prev.map(c => c.id === idContenedor ? {
                ...c,
                materiales: c.materiales.filter(m => m.id !== idMaterial)
            } : c));
            toast.success('Activo fungible eliminado correctamente.');
        } catch (error: any) {
            const mensaje = error?.message ?? 'No se pudo eliminar el activo fungible.';
            toast.error(mensaje);
            throw error;
        }
    };
    const agregarSubinstanciaMaterial = async (idContenedor: string, idMaterial: string, datos: Omit<SubinstanciaMaterial, 'id'>) => {
        if (esNumero(idContenedor) && esNumero(idMaterial)) {
            await crearLoteMaterialEnBackend({
                idMaterial: Number(idMaterial),
                idContenedor: Number(idContenedor),
                tipo: datos.tipo,
                lote: datos.lote ?? null,
                serie: datos.serie ?? null,
                fechaEntrega: datos.fechaEntrega ?? null,
                fechaRetiro: datos.fechaRetiro ?? null,
                cantidadDisponible: Number(datos.cantidadDisponible ?? 0),
                fechaCaducidad: datos.fechaCaducidad ?? null,
                precio: Number(datos.precio ?? 0),
            });
            const materialesBd = await cargarMaterialesDesdeBackend();
            setContenedoresMateriales(materialesBd.contenedores);
            setCatalogoMaterialesFungibles(materialesBd.catalogo);
            return;
        }

        setContenedoresMateriales(prev => prev.map(c => c.id === idContenedor ? {
            ...c,
            materiales: c.materiales.map(m => m.id === idMaterial ? {
                ...m,
                subinstancias: [...m.subinstancias, { ...datos, id: `SM${Date.now()}` }]
            } : m)
        } : c));
    };
    const editarSubinstanciaMaterial = async (idContenedor: string, idMaterial: string, idSub: string, datos: Omit<SubinstanciaMaterial, 'id'>) => {
        if (esNumero(idContenedor) && esNumero(idMaterial)) {
            await editarLoteMaterialEnBackend(idSub, {
                tipo: datos.tipo,
                lote: datos.lote ?? null,
                serie: datos.serie ?? null,
                fechaEntrega: datos.fechaEntrega ?? null,
                fechaRetiro: datos.fechaRetiro ?? null,
                cantidadDisponible: Number(datos.cantidadDisponible ?? 0),
                fechaCaducidad: datos.fechaCaducidad ?? null,
                precio: Number(datos.precio ?? 0),
            });
            const materialesBd = await cargarMaterialesDesdeBackend();
            setContenedoresMateriales(materialesBd.contenedores);
            setCatalogoMaterialesFungibles(materialesBd.catalogo);
            return;
        }

        setContenedoresMateriales(prev => prev.map(c => c.id === idContenedor ? {
            ...c,
            materiales: c.materiales.map(m => m.id === idMaterial ? {
                ...m,
                subinstancias: m.subinstancias.map(s => s.id === idSub ? { ...datos, id: s.id } : s)
            } : m)
        } : c));
    };

    const eliminarSubinstanciaMaterial = async (idContenedor: string, idMaterial: string, idSub: string) => {
        if (esNumero(idContenedor) && esNumero(idMaterial)) {
            await eliminarLoteMaterialEnBackend(idSub);
            const materialesBd = await cargarMaterialesDesdeBackend();
            setContenedoresMateriales(materialesBd.contenedores);
            setCatalogoMaterialesFungibles(materialesBd.catalogo);
            return;
        }

        setContenedoresMateriales((prev) =>
            prev.map((c) =>
                c.id === idContenedor
                    ? {
                          ...c,
                          materiales: c.materiales.map((m) =>
                              m.id === idMaterial
                                  ? { ...m, subinstancias: m.subinstancias.filter((s) => s.id !== idSub) }
                                  : m,
                          ),
                      }
                    : c,
            ),
        );
    };

    return (
        <ContextoInventario.Provider value={{
            contenedoresHerramientas, contenedoresMateriales,
            contenedoresCompartidos,
            catalogoMaterialesFungibles,
            herramientas, materiales,
            estudiantes, prestamos, docentes,
            materias, carreras,
            agregarEstudiante, editarEstudiante, eliminarEstudiante, agregarDocente, editarDocente, eliminarDocente, agregarPrestamo, editarPrestamo, extenderPrestamo, devolverPrestamo,
            agregarMateria, editarMateria, eliminarMateria,
            agregarCarrera, editarCarrera, eliminarCarrera,
            agregarHerramienta, registrarEntregaMaterial,
            recargarDatos: cargarDesdeBackend,
            agregarContenedorCompartido,
            editarContenedorCompartido,
            eliminarContenedorCompartido,
            agregarContenedorActivos,
            editarContenedorActivos,
            agregarCajaActivo,
            editarInstanciaActivo,
            eliminarInstanciaActivo,
            agregarSubinstanciaActivo,
            editarSubinstanciaActivo,
            eliminarSubinstanciaActivo,

            agregarContenedorMateriales,
            editarContenedorMateriales,
            eliminarContenedorMateriales,
            agregarMaterialFungible,
            editarInstanciaMaterial,
            eliminarInstanciaMaterial,
            agregarSubinstanciaMaterial,
            editarSubinstanciaMaterial,
            eliminarSubinstanciaMaterial
        }}>
            {children}
        </ContextoInventario.Provider>
    );
};

