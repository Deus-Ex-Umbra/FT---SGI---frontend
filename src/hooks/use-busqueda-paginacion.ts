import { useEffect, useMemo, useState } from 'react';

export interface UseBusquedaPaginacionOptions<T> {
  items: T[];
  busqueda: string;
  sensible_mayusculas?: boolean;
  obtenerTexto: (item: T) => string;
  items_por_pagina_inicial?: number;
}

export interface UseBusquedaPaginacionReturn<T> {
  items_filtrados: T[];
  items_paginados: T[];
  pagina_actual: number;
  setPaginaActual: (pagina: number | ((prev: number) => number)) => void;
  items_por_pagina: number;
  setItemsPorPagina: (items: number) => void;
  total_paginas: number;
}

export function useBusquedaPaginacion<T>({
  items,
  busqueda,
  sensible_mayusculas = false,
  obtenerTexto,
  items_por_pagina_inicial = 10,
}: UseBusquedaPaginacionOptions<T>): UseBusquedaPaginacionReturn<T> {
  const [pagina_actual, setPaginaActual] = useState(1);
  const [items_por_pagina, setItemsPorPagina] = useState(items_por_pagina_inicial);

  const items_filtrados = useMemo(() => {
    const termino_raw = busqueda.trim();
    if (!termino_raw) return items;

    const termino = sensible_mayusculas ? termino_raw : termino_raw.toLowerCase();

    return items.filter((item) => {
      const texto_raw = obtenerTexto(item) ?? '';
      const texto = sensible_mayusculas ? texto_raw : texto_raw.toLowerCase();
      return texto.includes(termino);
    });
  }, [busqueda, items, obtenerTexto, sensible_mayusculas]);

  const total_paginas = useMemo(() => {
    if (items_filtrados.length === 0) return 0;
    return Math.ceil(items_filtrados.length / items_por_pagina);
  }, [items_filtrados.length, items_por_pagina]);

  const items_paginados = useMemo(() => {
    return items_filtrados.slice(
      (pagina_actual - 1) * items_por_pagina,
      pagina_actual * items_por_pagina,
    );
  }, [items_filtrados, pagina_actual, items_por_pagina]);

  useEffect(() => {
    setPaginaActual(1);
  }, [busqueda, sensible_mayusculas]);

  useEffect(() => {
    if (total_paginas === 0) {
      setPaginaActual(1);
      return;
    }
    setPaginaActual((p) => Math.min(Math.max(1, p), total_paginas));
  }, [total_paginas]);

  useEffect(() => {
    setPaginaActual(1);
  }, [items_por_pagina]);

  return {
    items_filtrados,
    items_paginados,
    pagina_actual,
    setPaginaActual,
    items_por_pagina,
    setItemsPorPagina,
    total_paginas,
  };
}
