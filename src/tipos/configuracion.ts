export interface ConfiguracionIA {
  geminiApiUrl: string | null;
  geminiApiKeyConfigurada: boolean;
}

export interface ActualizarConfiguracionIAPayload {
  geminiApiUrl?: string;
  geminiApiKey?: string;
}

export interface ConfiguracionRegistroEstudiante {
  habilitado: boolean;
}

export interface ActualizarConfiguracionRegistroEstudiantePayload {
  habilitado: boolean;
}

export interface ConfiguracionRegistroDocente {
  habilitado: boolean;
}

export interface ActualizarConfiguracionRegistroDocentePayload {
  habilitado: boolean;
}
