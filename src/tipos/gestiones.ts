export interface Gestion {
  id: number;
  nombre: string;
  estado: 'abierta' | 'cerrada';
  fechaInicio?: string | null;
  fechaFin?: string | null;
  createdAt: string;
  updatedAt: string;
}
