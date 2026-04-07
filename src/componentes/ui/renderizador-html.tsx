import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface RenderizadorHtmlProps {
  contenido: string;
  className?: string;
  altura?: string;
  margenes?: { top: number; right: number; bottom: number; left: number };
  tamanoPersonalizado?: { widthMm: number; heightMm: number } | null;
  ajustarAncho?: boolean;
  mostrarGuiasMargen?: boolean;
}

const mmToPx = (mm: number) => (mm / 25.4) * 96;

const BUFFER_CORTE_PX = 4;

const SELECTOR_EVITAR_CORTE = 'li, h1, h2, h3, h4, h5, h6';
const MAX_ITERACIONES_ESPACIADORES = 8;

export function RenderizadorHtml({
  contenido,
  className,
  altura = '520px',
  margenes,
  tamanoPersonalizado = null,
  ajustarAncho = true,
  mostrarGuiasMargen = true,
}: RenderizadorHtmlProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const measurerRef = useRef<HTMLDivElement>(null);
  const [breaks, setBreaks] = useState<number[]>([0]);
  const [anchoContenedor, setAnchoContenedor] = useState(0);
  const [contenidoPaginado, setContenidoPaginado] = useState<string>(contenido);

  const page = useMemo(() => {
    const base = tamanoPersonalizado ?? { widthMm: 216, heightMm: 279 };
    const m = margenes ?? { top: 20, right: 20, bottom: 20, left: 20 };

    const widthPx = Math.max(1, Math.round(mmToPx(base.widthMm)));
    const heightPx = Math.max(1, Math.round(mmToPx(base.heightMm)));
    const padTop = Math.max(0, Math.round(mmToPx(m.top)));
    const padRight = Math.max(0, Math.round(mmToPx(m.right)));
    const padBottom = Math.max(0, Math.round(mmToPx(m.bottom)));
    const padLeft = Math.max(0, Math.round(mmToPx(m.left)));

    return {
      widthPx,
      heightPx,
      contentWidthPx: Math.max(1, widthPx - padLeft - padRight),
      contentHeightPx: Math.max(1, heightPx - padTop - padBottom),
      padTop,
      padRight,
      padBottom,
      padLeft,
    };
  }, [tamanoPersonalizado, margenes]);

  useEffect(() => {
    if (!scrollRef.current) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) setAnchoContenedor(entry.contentRect.width);
    });
    ro.observe(scrollRef.current);
    return () => ro.disconnect();
  }, []);

  const zoom = useMemo(() => {
    if (!ajustarAncho || anchoContenedor <= 0) return 1;
    const padding = 32;
    const disponible = Math.max(1, anchoContenedor - padding);
    return Math.min(1, disponible / page.widthPx);
  }, [ajustarAncho, anchoContenedor, page.widthPx]);

  const calcularSaltosDePagina = useCallback((container: HTMLDivElement, alturaDisponible: number): number[] => {
    // La paginación NO debe solapar páginas (eso causa repetición). El truco para evitar cortes
    // en listas/encabezados es insertar espaciadores invisibles que empujan el bloque a la
    // siguiente página cuando no cabe.
    const paso = Math.max(1, alturaDisponible);
    const totalHeight = container.scrollHeight;
    const numPages = Math.max(1, Math.ceil(totalHeight / paso));
    const nextBreaks: number[] = [];
    for (let i = 0; i < numPages; i++) nextBreaks.push(i * paso);
    return nextBreaks;
  }, []);

  useEffect(() => {
    setContenidoPaginado(contenido);
  }, [contenido]);

  useEffect(() => {
    if (!measurerRef.current) return;
    const el = measurerRef.current;
    // Esperar layout.
    const t = window.setTimeout(() => {
      const alturaEfectiva = Math.max(1, page.contentHeightPx - BUFFER_CORTE_PX);

      // 1) Limpiar espaciadores anteriores.
      el.querySelectorAll('[data-page-spacer="1"]').forEach((n) => n.remove());

      // 2) Insertar espaciadores para evitar cortes en listas/encabezados.
      let iter = 0;
      while (iter < MAX_ITERACIONES_ESPACIADORES) {
        let changed = false;
        const containerRect = el.getBoundingClientRect();
        const elementos = Array.from(el.querySelectorAll(SELECTOR_EVITAR_CORTE)) as HTMLElement[];

        for (const node of elementos) {
          const rect = node.getBoundingClientRect();
          const top = rect.top - containerRect.top;
          const bottom = rect.bottom - containerRect.top;
          const height = rect.height;

          const pageIndex = Math.floor(top / alturaEfectiva);
          const pageEnd = (pageIndex + 1) * alturaEfectiva;

          if (bottom > pageEnd && height <= alturaEfectiva) {
            const spacerHeight = pageEnd - top;
            if (spacerHeight > 0.5) {
              const spacer = document.createElement('div');
              spacer.setAttribute('data-page-spacer', '1');
              spacer.style.display = 'block';
              spacer.style.width = '100%';
              spacer.style.height = `${Math.ceil(spacerHeight)}px`;
              (node.parentElement ?? el).insertBefore(spacer, node);
              changed = true;
              break; // Recalcular layout.
            }
          }
        }

        if (!changed) break;
        iter++;
      }

      const nuevoHtml = el.innerHTML;
      if (nuevoHtml !== contenidoPaginado) {
        setContenidoPaginado(nuevoHtml);
        return;
      }

      // 3) Con el contenido ya paginado (sin solape), los saltos son múltiplos del alto efectivo.
      const next = calcularSaltosDePagina(el, alturaEfectiva);
      setBreaks(next);
    }, 60);
    return () => window.clearTimeout(t);
  }, [calcularSaltosDePagina, contenidoPaginado, page.contentHeightPx, page.contentWidthPx]);

  const contentStyle: React.CSSProperties = {
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    overflowWrap: 'anywhere',
    fontSize: '16px',
    lineHeight: '1.55',
    boxSizing: 'border-box',
    paddingRight: 1,
  };

  return (
    <div className={cn('w-full overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900', className)} style={{ height: altura }}>
      <div ref={scrollRef} className="h-full w-full overflow-auto bg-slate-100/60 p-4 dark:bg-slate-950/20">
        {/* Measurer */}
        <div
          ref={measurerRef}
          className="renderizador-html-documento"
          style={{
            ...contentStyle,
            position: 'absolute',
            visibility: 'hidden',
            pointerEvents: 'none',
            left: -99999,
            top: 0,
            width: `${page.contentWidthPx}px`,
          }}
          dangerouslySetInnerHTML={{ __html: contenidoPaginado }}
        />

        <div className="flex flex-col items-center gap-6">
          {breaks.map((top, idx) => (
            <div
              key={idx}
              className="rounded-md border border-slate-200 bg-white text-slate-900 shadow-sm dark:border-slate-800"
              style={{
                width: page.widthPx,
                height: page.heightPx,
                transform: `scale(${zoom})`,
                transformOrigin: 'top left',
              }}
              id={`pagina-render-${idx}`}
            >
              <div
                className="relative h-full w-full"
                style={{
                  paddingTop: page.padTop,
                  paddingRight: page.padRight,
                  paddingBottom: page.padBottom,
                  paddingLeft: page.padLeft,
                  boxSizing: 'border-box',
                }}
              >
                {mostrarGuiasMargen && (
                  <div className="pointer-events-none absolute inset-0 z-10">
                    <div style={{ position: 'absolute', top: page.padTop, left: 0, width: page.widthPx, borderTop: '1px dashed rgba(59, 130, 246, 0.5)' }} />
                    <div style={{ position: 'absolute', top: page.heightPx - page.padBottom, left: 0, width: page.widthPx, borderTop: '1px dashed rgba(59, 130, 246, 0.5)' }} />
                    <div style={{ position: 'absolute', top: page.padTop, bottom: page.padBottom, left: page.padLeft, borderLeft: '1px dashed rgba(59, 130, 246, 0.5)' }} />
                    <div style={{ position: 'absolute', top: page.padTop, bottom: page.padBottom, right: page.padRight, borderRight: '1px dashed rgba(59, 130, 246, 0.5)' }} />
                  </div>
                )}

                <div
                  className="relative overflow-hidden"
                  style={{
                    width: page.contentWidthPx,
                    height: Math.max(1, page.contentHeightPx - BUFFER_CORTE_PX),
                  }}
                >
                  <div
                    className="renderizador-html-documento text-slate-900"
                    style={{
                      ...contentStyle,
                      width: page.contentWidthPx,
                      transform: `translateY(-${top}px)`,
                    }}
                    dangerouslySetInnerHTML={{ __html: contenidoPaginado }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        .renderizador-html-documento {
          line-height: 1.55;
          white-space: pre-wrap;
          word-break: break-word;
          overflow-wrap: anywhere;
        }

        .renderizador-html-documento p {
          margin: 0.5em 0;
          min-height: 1em;
        }

        .renderizador-html-documento h1,
        .renderizador-html-documento h2,
        .renderizador-html-documento h3 {
          line-height: 1.3;
          margin: 0.6em 0 0.35em;
        }

        .renderizador-html-documento ul,
        .renderizador-html-documento ol {
          padding-left: 1.5rem;
          margin: 0.5rem 0;
          list-style-position: outside;
          color: currentColor;
        }

        .renderizador-html-documento ul {
          list-style-type: disc;
          display: block;
        }

        .renderizador-html-documento ol {
          list-style-type: decimal;
          display: block;
        }

        .renderizador-html-documento ul li,
        .renderizador-html-documento ol li {
          margin: 0.25rem 0;
          display: list-item;
          color: currentColor;
        }

        .renderizador-html-documento ul li::marker,
        .renderizador-html-documento ol li::marker {
          color: currentColor;
        }

        .renderizador-html-documento ul[style*="text-align: center"],
        .renderizador-html-documento ol[style*="text-align: center"],
        .renderizador-html-documento ul[style*="text-align:center"],
        .renderizador-html-documento ol[style*="text-align:center"] {
          display: table;
          text-align: left;
          list-style-position: outside;
          padding-left: 1.5rem;
          margin-left: auto;
          margin-right: auto;
        }

        .renderizador-html-documento ul[style*="text-align: right"],
        .renderizador-html-documento ol[style*="text-align: right"],
        .renderizador-html-documento ul[style*="text-align:right"],
        .renderizador-html-documento ol[style*="text-align:right"] {
          display: table;
          text-align: left;
          list-style-position: outside;
          padding-left: 1.5rem;
          margin-left: auto;
          margin-right: 0;
        }

        .renderizador-html-documento table {
          width: 100%;
          border-collapse: collapse;
          margin: 0.5rem 0;
        }

        .renderizador-html-documento table td,
        .renderizador-html-documento table th {
          border: 1px solid #cbd5e1;
          padding: 2px 4px;
          vertical-align: top;
          word-break: break-word;
        }
      `}</style>
    </div>
  );
}
