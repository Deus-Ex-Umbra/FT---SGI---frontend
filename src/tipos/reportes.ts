export type TipoReporte = 'blanco' | 'precreado';

export interface ReporteMetadata {
  tipo?: TipoReporte | string;
  areas?: string[];
  usarIA?: boolean;
}

export interface ReporteListado {
  id: number;
  titulo: string;
  fechaInicio: string;
  fechaFin: string;
  metadata?: ReporteMetadata | null;
  creadoEn: string;
}

export interface ReporteDetalle {
  id: number;
  titulo: string;
  html: string;
  fechaInicio: string;
  fechaFin: string;
  metadata?: ReporteMetadata | null;
  creadoEn: string;
}

export interface ReportePdfListado {
  id: number;
  reporteId?: number;
  filename: string;
  mime: string;
  sizeBytes: number;
  sha256: string;
  creadoEn: string;
}

export interface GenerarPreReporteIAPayload {
  fechaInicio: string;
  fechaFin: string;
  instrucciones?: string;
}

export interface CrearReportePayload {
  tituloBase: string;
  tipo: TipoReporte;
  fechaInicio?: string;
  fechaFin?: string;
  areas?: string[];
  usarIA?: boolean;
}

export interface ActualizarReportePayload {
  titulo?: string;
  html?: string;
  fechaInicio?: string;
  fechaFin?: string;
}
