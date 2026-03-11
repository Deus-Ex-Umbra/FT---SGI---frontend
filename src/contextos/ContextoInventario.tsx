import { createContext, useContext, useState, useMemo, useEffect } from 'react';
import type {
    ContenedorHerramientas, Herramienta, SubinstanciaHerramienta,
    ContenedorMateriales, MaterialFungible, SubinstanciaMaterial,
    Estudiante, Prestamo, Docente
} from '../tipos/inventario';
import {
    contenedoresHerramientas as datoCH,
    contenedoresMateriales as datoCM,
} from '../lib/datos-inventario';
import {
    cargarActivosDesdeBackend,
    cargarMaterialesDesdeBackend,
    cargarPrestamosDesdeBackend,
    cargarEstudiantesDesdeBackend,
    cargarDocentesDesdeBackend,
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
    editarItemActivoEnBackend,
} from '../lib/servicio-inventario';

interface ContextoInventarioTipo {
    contenedoresHerramientas: ContenedorHerramientas[];
    contenedoresMateriales: ContenedorMateriales[];
    herramientas: Herramienta[];
    materiales: MaterialFungible[];
    estudiantes: Estudiante[];
    prestamos: Prestamo[];
    docentes: Docente[];
    agregarEstudiante: (e: Omit<Estudiante, 'id'>) => Promise<void>;
    editarEstudiante: (id: string, datos: Partial<Omit<Estudiante, 'id'>>) => Promise<void>;
    eliminarEstudiante: (id: string) => Promise<void>;
    agregarDocente: (d: Omit<Docente, 'id'>) => Promise<void>;
    editarDocente: (id: string, datos: Partial<Omit<Docente, 'id'>>) => Promise<void>;
    eliminarDocente: (id: string) => Promise<void>;
    agregarPrestamo: (p: Omit<Prestamo, 'id' | 'estado'>) => Promise<void>;
    editarPrestamo: (id: string, datos: Partial<Omit<Prestamo, 'id'>>) => Promise<void>;
    extenderPrestamo: (id: string, fechaDevolucion: string) => Promise<void>;
    devolverPrestamo: (id: string) => Promise<void>;
    agregarHerramienta: (h: Omit<Herramienta, 'id'>) => void;
    registrarEntregaMaterial: (idMaterial: string, cantidad: number, carnet: string, motivo: string) => void;
    recargarDatos: () => Promise<void>;

    // Jerarquías Activos
    agregarContenedorActivos: (datos: Omit<ContenedorHerramientas, 'id' | 'herramientas'>) => void;
    editarContenedorActivos: (id: string, datos: Omit<ContenedorHerramientas, 'id' | 'herramientas'>) => void;
    agregarCajaActivo: (idContenedor: string, datos: Omit<Herramienta, 'id' | 'subinstancias'>) => void;
    editarInstanciaActivo: (idContenedor: string, idHerramienta: string, datos: Partial<Omit<Herramienta, 'id' | 'subinstancias'>>) => Promise<void>;
    agregarSubinstanciaActivo: (idContenedor: string, idHerramienta: string, datos: Omit<SubinstanciaHerramienta, 'id'>) => void;
    editarSubinstanciaActivo: (idContenedor: string, idHerramienta: string, idSub: string, datos: Omit<SubinstanciaHerramienta, 'id'>) => Promise<void>;

    // Jerarquías Materiales
    agregarContenedorMateriales: (datos: Omit<ContenedorMateriales, 'id' | 'materiales'>) => void;
    editarContenedorMateriales: (id: string, datos: Omit<ContenedorMateriales, 'id' | 'materiales'>) => void;
    agregarCajaMateriales: (idContenedor: string, datos: Omit<MaterialFungible, 'id' | 'subinstancias'>) => void;
    editarInstanciaMaterial: (idContenedor: string, idMaterial: string, datos: Partial<Omit<MaterialFungible, 'id' | 'subinstancias'>>) => void;
    agregarSubinstanciaMaterial: (idContenedor: string, idMaterial: string, datos: Omit<SubinstanciaMaterial, 'id'>) => void;
    editarSubinstanciaMaterial: (idContenedor: string, idMaterial: string, idSub: string, datos: Omit<SubinstanciaMaterial, 'id'>) => void;
}

const ContextoInventario = createContext<ContextoInventarioTipo | null>(null);

export const useInventario = () => {
    const ctx = useContext(ContextoInventario);
    if (!ctx) throw new Error('useInventario debe usarse dentro de ProveedorInventario');
    return ctx;
};

export const ProveedorInventario = ({ children }: { children: React.ReactNode }) => {
    const [contenedoresHerramientas, setContenedoresHerramientas] = useState<ContenedorHerramientas[]>(datoCH);
    const [contenedoresMateriales, setContenedoresMateriales] = useState<ContenedorMateriales[]>(datoCM);
    const [estudiantes, setEstudiantes] = useState<Estudiante[]>([]);
    const [prestamos, setPrestamos] = useState<Prestamo[]>([]);
    const [docentes, setDocentes] = useState<Docente[]>([]);

    const cargarDesdeBackend = async () => {
            try {
                const [activosBd, materialesBd, prestamosBd, estudiantesBd, docentesBd] = await Promise.all([
                    cargarActivosDesdeBackend(),
                    cargarMaterialesDesdeBackend(),
                    cargarPrestamosDesdeBackend(),
                    cargarEstudiantesDesdeBackend(),
                    cargarDocentesDesdeBackend(),
                ]);

                if (activosBd.length > 0) setContenedoresHerramientas(activosBd);
                if (materialesBd.length > 0) setContenedoresMateriales(materialesBd);
                setPrestamos(prestamosBd);
                setEstudiantes(estudiantesBd);
                setDocentes(docentesBd);
            } catch {
                // Si backend no responde, estas páginas quedan vacías para evitar mostrar datos mock.
                setPrestamos([]);
                setEstudiantes([]);
                setDocentes([]);
            }
        };

    useEffect(() => {
        void cargarDesdeBackend();
    }, []);

    // Derivados planos para retrocompatibilidad con páginas que no usan contenedores (Ej. Resumen, Préstamos)
    const herramientas = useMemo(() => contenedoresHerramientas.flatMap(c =>
        c.herramientas.flatMap(h => {
            if (h.subinstancias.length === 0) return [];
            return h.subinstancias.map(sub => ({
                ...h,
                id: sub.id,
                codigoInventario: sub.codigoInventario,
                estado: sub.estado,
                observaciones: sub.observaciones,
                precio: sub.precio
            }));
        })
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
    };

    const editarDocente = async (id: string, datos: Partial<Omit<Docente, 'id'>>) => {
        const actualizado = await editarDocenteEnBackend(id, datos);
        setDocentes(prev => prev.map(d => d.id === id ? actualizado : d));
    };

    const eliminarDocente = async (id: string) => {
        await eliminarDocenteEnBackend(id);
        setDocentes(prev => prev.filter(d => d.id !== id));
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
            estado: 'pendiente' | 'devuelto' | 'vencido' | 'activo'
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
        // Añadimos por defecto al primer contenedor y como una instancia simple por retrocompatibilidad
        setContenedoresHerramientas(prev => prev.map((c, i) => i === 0 ? {
            ...c,
            herramientas: [...c.herramientas, {
                ...datos,
                id: `H${Date.now()}`,
                subinstancias: [{
                    id: `S${Date.now()}`,
                    codigoInventario: datos.codigoInventario || `COD-${Date.now()}`,
                    estado: datos.estado || 'buen_estado',
                    ue: '',
                    descripcion: '',
                    observaciones: datos.observaciones || ''
                }]
            }]
        } : c));
    };

    const registrarEntregaMaterial = (idMaterial: string, cantidad: number, _carnet: string, _motivo: string) => {
        setContenedoresMateriales(prev => prev.map(c => ({
            ...c,
            materiales: c.materiales.map(m => {
                if (m.subinstancias.some(s => s.id === idMaterial || m.id === idMaterial)) {
                    // Restamos al primer lote
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

    // Funciones CRUD para Activos Fijos
    const agregarContenedorActivos = (datos: Omit<ContenedorHerramientas, 'id' | 'herramientas'>) => {
        const id = `CH${Date.now()}`;
        setContenedoresHerramientas(prev => [...prev, { ...datos, id, herramientas: [] }]);
    };
    const editarContenedorActivos = (id: string, datos: Omit<ContenedorHerramientas, 'id' | 'herramientas'>) => {
        setContenedoresHerramientas(prev => prev.map(c => c.id === id ? { ...c, ...datos } : c));
    };
    const agregarCajaActivo = (idContenedor: string, datos: Omit<Herramienta, 'id' | 'subinstancias'>) => {
        setContenedoresHerramientas(prev => prev.map(c => c.id === idContenedor ? {
            ...c,
            herramientas: [...c.herramientas, { ...datos, id: `H${Date.now()}`, subinstancias: [] }]
        } : c));
    };
    const esNumero = (valor: string) => /^\d+$/.test(valor);

    const editarInstanciaActivo = async (idContenedor: string, idHerramienta: string, datos: Partial<Omit<Herramienta, 'id' | 'subinstancias'>>) => {
        if (idContenedor === 'CH-BD-1' && esNumero(idHerramienta) && typeof datos.nombre === 'string') {
            await editarActivoFijoEnBackend(idHerramienta, { nombre: datos.nombre });
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
    const agregarSubinstanciaActivo = (idContenedor: string, idHerramienta: string, datos: Omit<SubinstanciaHerramienta, 'id'>) => {
        setContenedoresHerramientas(prev => prev.map(c => c.id === idContenedor ? {
            ...c,
            herramientas: c.herramientas.map(h => h.id === idHerramienta ? {
                ...h,
                subinstancias: [...h.subinstancias, { ...datos, id: `S${Date.now()}` }]
            } : h)
        } : c));
    };
    const editarSubinstanciaActivo = async (idContenedor: string, idHerramienta: string, idSub: string, datos: Omit<SubinstanciaHerramienta, 'id'>) => {
        if (idContenedor === 'CH-BD-1' && esNumero(idSub)) {
            await editarItemActivoEnBackend(idSub, {
                codigoInventario: datos.codigoInventario,
                fechaEntrega: datos.fechaEntrega ?? null,
                fechaRetiro: datos.fechaRetiro ?? null,
                estado: datos.estado,
                observaciones: datos.observaciones,
                justificacion: datos.observaciones,
                precio: Number(datos.precio ?? 0),
            });
            const activosBd = await cargarActivosDesdeBackend();
            if (activosBd.length > 0) {
                setContenedoresHerramientas(activosBd);
                return;
            }
        }

        setContenedoresHerramientas(prev => prev.map(c => c.id === idContenedor ? {
            ...c,
            herramientas: c.herramientas.map(h => h.id === idHerramienta ? {
                ...h,
                subinstancias: h.subinstancias.map(s => s.id === idSub ? { ...datos, id: s.id } : s)
            } : h)
        } : c));
    };

    // Funciones CRUD para Material Fungible
    const agregarContenedorMateriales = (datos: Omit<ContenedorMateriales, 'id' | 'materiales'>) => {
        const id = `CM${Date.now()}`;
        setContenedoresMateriales(prev => [...prev, { ...datos, id, materiales: [] }]);
    };
    const editarContenedorMateriales = (id: string, datos: Omit<ContenedorMateriales, 'id' | 'materiales'>) => {
        setContenedoresMateriales(prev => prev.map(c => c.id === id ? { ...c, ...datos } : c));
    };
    const agregarCajaMateriales = (idContenedor: string, datos: Omit<MaterialFungible, 'id' | 'subinstancias'>) => {
        setContenedoresMateriales(prev => prev.map(c => c.id === idContenedor ? {
            ...c,
            materiales: [...c.materiales, { ...datos, id: `MF${Date.now()}`, subinstancias: [] }]
        } : c));
    };
    const editarInstanciaMaterial = (idContenedor: string, idMaterial: string, datos: Partial<Omit<MaterialFungible, 'id' | 'subinstancias'>>) => {
        setContenedoresMateriales(prev => prev.map(c => c.id === idContenedor ? {
            ...c,
            materiales: c.materiales.map(m => m.id === idMaterial ? { ...m, ...datos } : m)
        } : c));
    };
    const agregarSubinstanciaMaterial = (idContenedor: string, idMaterial: string, datos: Omit<SubinstanciaMaterial, 'id'>) => {
        setContenedoresMateriales(prev => prev.map(c => c.id === idContenedor ? {
            ...c,
            materiales: c.materiales.map(m => m.id === idMaterial ? {
                ...m,
                subinstancias: [...m.subinstancias, { ...datos, id: `SM${Date.now()}` }]
            } : m)
        } : c));
    };
    const editarSubinstanciaMaterial = (idContenedor: string, idMaterial: string, idSub: string, datos: Omit<SubinstanciaMaterial, 'id'>) => {
        setContenedoresMateriales(prev => prev.map(c => c.id === idContenedor ? {
            ...c,
            materiales: c.materiales.map(m => m.id === idMaterial ? {
                ...m,
                subinstancias: m.subinstancias.map(s => s.id === idSub ? { ...datos, id: s.id } : s)
            } : m)
        } : c));
    };

    return (
        <ContextoInventario.Provider value={{
            contenedoresHerramientas, contenedoresMateriales,
            herramientas, materiales,
            estudiantes, prestamos, docentes,
            agregarEstudiante, editarEstudiante, eliminarEstudiante, agregarDocente, editarDocente, eliminarDocente, agregarPrestamo, editarPrestamo, extenderPrestamo, devolverPrestamo,
            agregarHerramienta, registrarEntregaMaterial,
            recargarDatos: cargarDesdeBackend,
            agregarContenedorActivos, editarContenedorActivos, agregarCajaActivo, editarInstanciaActivo, agregarSubinstanciaActivo, editarSubinstanciaActivo,
            agregarContenedorMateriales, editarContenedorMateriales, agregarCajaMateriales, editarInstanciaMaterial, agregarSubinstanciaMaterial, editarSubinstanciaMaterial
        }}>
            {children}
        </ContextoInventario.Provider>
    );
};

