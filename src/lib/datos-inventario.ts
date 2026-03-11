import type { ContenedorHerramientas, Estudiante, Prestamo, ContenedorMateriales, Docente } from '../tipos/inventario';

export const contenedoresHerramientas: ContenedorHerramientas[] = [
    {
        id: 'CH01',
        nombre: 'Estante Principal',
        ubicacion: 'Laboratorio de Electrónica',
        herramientas: [
            {
                id: 'H001', nombre: 'Taladro inalámbrico Bosch 18V', categoria: 'Taladros', descripcion: 'Taladro percutor con batería de litio, 2 velocidades', ue: 'Electrónica',
                subinstancias: [
                    { id: 'S01', codigoInventario: 'TL-001-A', fechaEntrega: '2026-01-15', estado: 'buen_estado', observaciones: 'Batería 1', ue: '', descripcion: '', precio: 1250 },
                    { id: 'S02', codigoInventario: 'TL-001-B', fechaEntrega: '2026-01-20', fechaRetiro: '2026-03-05', estado: 'buen_estado', observaciones: 'Batería 2', ue: '', descripcion: '', precio: 1250 }
                ]
            },
            {
                id: 'H002', nombre: 'Multímetro digital Fluke 117', categoria: 'Medición', descripcion: 'Medición de voltaje, corriente y resistencia', ue: 'Electrónica',
                subinstancias: [
                    { id: 'S03', codigoInventario: 'ME-001-A', fechaEntrega: '2026-02-01', estado: 'buen_estado', observaciones: '', ue: '', descripcion: '', precio: 800 },
                    { id: 'S04', codigoInventario: 'ME-001-B', fechaEntrega: '2026-02-10', fechaRetiro: '2026-03-01', estado: 'en_mantenimiento', observaciones: 'Puntas gastadas', ue: '', descripcion: '', precio: 800 }
                ]
            }
        ]
    },
    {
        id: 'CH02',
        nombre: 'Almacén de Maquinaria',
        ubicacion: 'Taller de Mecánica',
        herramientas: [
            {
                id: 'H003', nombre: 'Soldadora MIG 130A', categoria: 'Soldadura', descripcion: 'Soldadora MIG/MAG con carrete de alambre incluido', ue: 'Mecánica',
                subinstancias: [
                    { id: 'S05', codigoInventario: 'SM-001', fechaEntrega: '2026-01-12', estado: 'buen_estado', observaciones: '', ue: '', descripcion: '', precio: 3500 }
                ]
            }
        ]
    }
];

export const estudiantes: Estudiante[] = [
    { carnet: '2021-15430', nombre: 'Carlos Eduardo', apellido: 'Mamani Quispe', carrera: 'Ing. Electrónica', semestre: 6 },
    { carnet: '2022-08712', nombre: 'Lucía Fernanda', apellido: 'Torrez Mamani', carrera: 'Ing. Industrial', semestre: 4 },
    { carnet: '2020-33891', nombre: 'Rodrigo Andrés', apellido: 'Vásquez Chávez', carrera: 'Ing. Mecánica', semestre: 8 },
    { carnet: '2023-04521', nombre: 'Ana Patricia', apellido: 'Flores Condori', carrera: 'Ing. Electrónica', semestre: 2 },
    { carnet: '2019-67234', nombre: 'Miguel Ángel', apellido: 'Cruz Huanca', carrera: 'Ing. Civil', semestre: 10 },
    { carnet: '2022-19043', nombre: 'Valeria Sofía', apellido: 'Rojas Pérez', carrera: 'Ing. Industrial', semestre: 3 },
];

export const docentes: Docente[] = [
    { id: 'D001', codigo: 'DOC-001', nombre: 'Alan', apellido: 'Brito', materia: 'SIS245', carnet: '1234567' },
    { id: 'D002', codigo: 'DOC-002', nombre: 'María', apellido: 'López', materia: 'SIS104', carnet: '7654321' },
    { id: 'D003', codigo: 'DOC-003', nombre: 'Armando', apellido: 'Casas', materia: 'SIS101', carnet: '3456789' },
    { id: 'D004', codigo: 'DOC-004', nombre: 'Susana', apellido: 'Horia', materia: 'SIS303', carnet: '9876543' },
    { id: 'D005', codigo: 'DOC-005', nombre: 'Carlos', apellido: 'Torres', materia: 'SIS405', carnet: '5678901' },
];

export const prestamos: Prestamo[] = [
    { id: 'P001', carnetEstudiante: '2021-15430', idHerramienta: 'S01', fechaPrestamo: '2026-03-01', fechaDevolucion: null, estado: 'activo', docente: 'Ing. Alan Brito', observaciones: 'Para práctica de automatización' },
    { id: 'P002', carnetEstudiante: '2020-33891', idHerramienta: 'S05', fechaPrestamo: '2026-02-28', fechaDevolucion: '2026-03-02', estado: 'devuelto', docente: 'Ing. María López', observaciones: '' },
    { id: 'P003', carnetEstudiante: '2022-08712', idHerramienta: 'S03', fechaPrestamo: '2026-02-25', fechaDevolucion: null, estado: 'vencido', docente: 'Lic. Armando Casas', observaciones: 'No devolvió en fecha acordada' },
    { id: 'P004', carnetEstudiante: '2023-04521', idHerramienta: 'H007', fechaPrestamo: '2026-03-03', fechaDevolucion: null, estado: 'activo', docente: 'Ing. Susana Horia', observaciones: 'Medición de señales digitales' },
    { id: 'P005', carnetEstudiante: '2019-67234', idHerramienta: 'H009', fechaPrestamo: '2026-03-04', fechaDevolucion: null, estado: 'activo', docente: 'Ing. Carlos Torres', observaciones: 'Proyecto integrador final' },
];

export const contenedoresMateriales: ContenedorMateriales[] = [
    {
        id: 'CM01',
        nombre: 'Gabinete de Consumibles',
        ubicacion: 'Laboratorio de Electrónica',
        materiales: [
            {
                id: 'MF001', nombre: 'Cable AWG 14 (color rojo)', categoria: 'Materiales Eléctricos', unidad: 'metros', stockMinimo: 10,
                subinstancias: [
                    { id: 'SM01', lote: 'Lote A', fechaEntrega: '2026-01-05', cantidadDisponible: 20, precio: 3.5 },
                    { id: 'SM02', lote: 'Lote B', fechaEntrega: '2026-02-01', fechaRetiro: '2026-03-02', cantidadDisponible: 10, precio: 3.8 }
                ]
            },
            {
                id: 'MF002', nombre: 'Pasta de soldar (flux)', categoria: 'Consumibles', unidad: 'unidades', stockMinimo: 5,
                subinstancias: [
                    { id: 'SM03', lote: 'Lote Único', fechaEntrega: '2026-02-14', cantidadDisponible: 12, fechaCaducidad: '2026-12-31', precio: 25.0 }
                ]
            }
        ]
    }
];
