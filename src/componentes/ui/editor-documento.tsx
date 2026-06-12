import { useEffect, useMemo, useRef, useState } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { ListItem as BaseListItem } from '@tiptap/extension-list-item';
import { BulletList } from '@tiptap/extension-bullet-list';
import { OrderedList } from '@tiptap/extension-ordered-list';
import { wrappingInputRule } from '@tiptap/core';
import Underline from '@tiptap/extension-underline';
import { TextStyle } from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import TextAlign from '@tiptap/extension-text-align';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableHeader } from '@tiptap/extension-table-header';
import { TableCell } from '@tiptap/extension-table-cell';
import { HexColorPicker } from 'react-colorful';
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Check,
  Italic,
  List,
  ListOrdered,
  Strikethrough,
  Table as TableIcon,
  Underline as UnderlineIcon,
} from 'lucide-react';

import { FontSize } from '@/utilidades/editor';
import { cn } from '@/utilidades/ui';
import { Boton } from '@/componentes/ui/button';
import { ToggleGroup, ToggleGroupItem } from '@/componentes/ui/toggle-group';
import { Popover, PopoverContent, PopoverTrigger } from '@/componentes/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/componentes/ui/select';
import { Switch } from '@/componentes/ui/switch';

export interface DocumentoConfig {
  widthMm: number;
  heightMm: number;
  margenes: { top: number; right: number; bottom: number; left: number };
}

interface Props {
  valorHtml: string;
  onChangeHtml: (html: string) => void;
  config: DocumentoConfig;
  onChangeConfig: (cfg: DocumentoConfig) => void;
  className?: string;
  minHeight?: string;
  soloLectura?: boolean;
}

const mmToPx = (mm: number) => (mm / 25.4) * 96;
const tamanosFuente = ['10px', '12px', '14px', '16px', '18px', '20px', '24px', '28px', '32px'];
const ZOOM_STEPS = [0.67, 0.75, 0.9, 1, 1.25, 1.5, 1.75, 2];

const coloresPredefinidos = ['#000000', '#FFFFFF', '#ef4444', '#22c55e', '#3b82f6', '#eab308', '#a855f7', '#ec4899', '#6b7280'];

const clampNumber = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const MARGEN_MIN_MM = 0;
const MARGEN_MAX_MM = 50;
const MIN_CONTENIDO_MM = 40;

const CustomListItem = BaseListItem.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      color: {
        default: null,
        parseHTML: (element) => (element as HTMLElement)?.style?.color || null,
        renderHTML: (attributes) => {
          if (!attributes.color) return {};
          return { style: `color: ${attributes.color}` };
        },
      },
    };
  },
});

const CustomOrderedList = OrderedList.extend({
  addInputRules() {
    return [
      wrappingInputRule({
        find: /^\s*(\d+)\.\s$/,
        type: this.type,
        getAttributes: (match) => {
          const attributes = this.editor.state.selection.$from.parent.attrs as any;
          return {
            start: +match[1],
            ...(attributes.textAlign ? { textAlign: attributes.textAlign } : {}),
          };
        },
      }),
    ];
  },
});

const CustomBulletList = BulletList.extend({
  addInputRules() {
    return [
      wrappingInputRule({
        find: /^\s*([-+*])\s$/,
        type: this.type,
        getAttributes: () => {
          const attributes = this.editor.state.selection.$from.parent.attrs as any;
          return attributes.textAlign ? { textAlign: attributes.textAlign } : {};
        },
      }),
    ];
  },
});

export function EditorDocumento({ valorHtml, onChangeHtml, config, onChangeConfig, className, minHeight = '260px', soloLectura = false }: Props) {
  const pageLabel = useMemo(() => `${Math.round(config.widthMm)}×${Math.round(config.heightMm)} mm`, [config.heightMm, config.widthMm]);

  const debounceRef = useRef<number | null>(null);
  const contenedorRef = useRef<HTMLDivElement>(null);
  const contentMeasureRef = useRef<HTMLDivElement>(null);

  const [colorActual, setColorActual] = useState('#000000');
  const [colorTemporal, setColorTemporal] = useState('#000000');
  const [popoverColorAbierto, setPopoverColorAbierto] = useState(false);
  const [selectionGuardada, setSelectionGuardada] = useState<{ from: number; to: number } | null>(null);

  const [fontSize, setFontSize] = useState('16px');
  const [formatosActivos, setFormatosActivos] = useState({
    bold: false,
    italic: false,
    underline: false,
    strike: false,
  });
  const [listMode, setListMode] = useState<'bullet' | 'ordered' | ''>('');
  const [alignMode, setAlignMode] = useState<'left' | 'center' | 'right'>('left');
  const [zoom, setZoom] = useState(1);

  const [pageCount, setPageCount] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [maskClipPath, setMaskClipPath] = useState<string>('none');
  const [mostrarGuiasMargen, setMostrarGuiasMargen] = useState(true);

  const pageWidthPx = Math.max(1, Math.round(mmToPx(config.widthMm)));
  const pageHeightPx = Math.max(1, Math.round(mmToPx(config.heightMm)));

  const paddingTop = Math.max(0, Math.round(mmToPx(config.margenes.top)));
  const paddingRight = Math.max(0, Math.round(mmToPx(config.margenes.right)));
  const paddingBottom = Math.max(0, Math.round(mmToPx(config.margenes.bottom)));
  const paddingLeft = Math.max(0, Math.round(mmToPx(config.margenes.left)));

  const effectivePageOffset = Math.max(1, pageHeightPx - paddingTop - paddingBottom);
  const contentWidthPx = Math.max(0, pageWidthPx - paddingLeft - paddingRight);

  const editor = useEditor({
    editable: !soloLectura,
    extensions: [
      StarterKit.configure({
        bulletList: false,
        orderedList: false,
        listItem: false,
      }),
      Underline,
      TextStyle,
      Color,
      FontSize,
      CustomBulletList,
      CustomOrderedList,
      CustomListItem,
      TextAlign.configure({
        types: ['heading', 'paragraph', 'bulletList', 'orderedList'],
        alignments: ['left', 'center', 'right'],
        defaultAlignment: 'left',
      }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: valorHtml,
    editorProps: {
      attributes: {
        class: 'focus:outline-none',
      },
    },
    onUpdate: ({ editor }) => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
      debounceRef.current = window.setTimeout(() => {
        onChangeHtml(editor.getHTML());
      }, 120);

      const color = (editor.getAttributes('textStyle').color as string | undefined) || '#000000';
      setColorActual((prev) => (prev === color ? prev : color));
      if (!popoverColorAbierto) {
        setColorTemporal((prev) => (prev === color ? prev : color));
      }
      const tamano = (editor.getAttributes('textStyle').fontSize as string | undefined) || '16px';
      setFontSize((prev) => (prev === tamano ? prev : tamano));

      const nextFormatos = {
        bold: editor.isActive('bold'),
        italic: editor.isActive('italic'),
        underline: editor.isActive('underline'),
        strike: editor.isActive('strike'),
      };
      setFormatosActivos((prev) =>
        prev.bold === nextFormatos.bold &&
        prev.italic === nextFormatos.italic &&
        prev.underline === nextFormatos.underline &&
        prev.strike === nextFormatos.strike
          ? prev
          : nextFormatos,
      );

      const nextListMode: '' | 'bullet' | 'ordered' = editor.isActive('orderedList')
        ? 'ordered'
        : editor.isActive('bulletList')
          ? 'bullet'
          : '';
      setListMode((prev) => (prev === nextListMode ? prev : nextListMode));

      const nextAlign = (() => {
        if (editor.isActive('bulletList')) {
          return ((editor.getAttributes('bulletList').textAlign as string | undefined) || 'left') as 'left' | 'center' | 'right';
        }
        if (editor.isActive('orderedList')) {
          return ((editor.getAttributes('orderedList').textAlign as string | undefined) || 'left') as 'left' | 'center' | 'right';
        }
        if (editor.isActive({ textAlign: 'center' })) return 'center';
        if (editor.isActive({ textAlign: 'right' })) return 'right';
        return 'left';
      })();
      setAlignMode((prev) => (prev === nextAlign ? prev : nextAlign));
    },
    onSelectionUpdate: ({ editor }) => {
      const color = (editor.getAttributes('textStyle').color as string | undefined) || '#000000';
      setColorActual((prev) => (prev === color ? prev : color));
      if (!popoverColorAbierto) {
        setColorTemporal((prev) => (prev === color ? prev : color));
      }
      const tamano = (editor.getAttributes('textStyle').fontSize as string | undefined) || '16px';
      setFontSize((prev) => (prev === tamano ? prev : tamano));

      const nextFormatos = {
        bold: editor.isActive('bold'),
        italic: editor.isActive('italic'),
        underline: editor.isActive('underline'),
        strike: editor.isActive('strike'),
      };
      setFormatosActivos((prev) =>
        prev.bold === nextFormatos.bold &&
        prev.italic === nextFormatos.italic &&
        prev.underline === nextFormatos.underline &&
        prev.strike === nextFormatos.strike
          ? prev
          : nextFormatos,
      );

      const nextListMode: '' | 'bullet' | 'ordered' = editor.isActive('orderedList')
        ? 'ordered'
        : editor.isActive('bulletList')
          ? 'bullet'
          : '';
      setListMode((prev) => (prev === nextListMode ? prev : nextListMode));

      const nextAlign = (() => {
        if (editor.isActive('bulletList')) {
          return ((editor.getAttributes('bulletList').textAlign as string | undefined) || 'left') as 'left' | 'center' | 'right';
        }
        if (editor.isActive('orderedList')) {
          return ((editor.getAttributes('orderedList').textAlign as string | undefined) || 'left') as 'left' | 'center' | 'right';
        }
        if (editor.isActive({ textAlign: 'center' })) return 'center';
        if (editor.isActive({ textAlign: 'right' })) return 'right';
        return 'left';
      })();
      setAlignMode((prev) => (prev === nextAlign ? prev : nextAlign));
    },
  });

  useEffect(() => {
    if (editor && valorHtml !== editor.getHTML()) {
      editor.commands.setContent(valorHtml);
    }
  }, [valorHtml, editor]);

  useEffect(() => {
    if (!editor) return;
    const color = (editor.getAttributes('textStyle').color as string | undefined) || '#000000';
    setColorActual(color);
    if (!popoverColorAbierto) setColorTemporal(color);
    const tamano = (editor.getAttributes('textStyle').fontSize as string | undefined) || '16px';
    setFontSize(tamano);
  }, [editor, popoverColorAbierto]);

  const totalHeightPx = useMemo(() => pageCount * effectivePageOffset + paddingTop + paddingBottom, [effectivePageOffset, pageCount, paddingBottom, paddingTop]);

  useEffect(() => {
    if (!editor) return;

    const updatePage = () => {
      const { from } = editor.state.selection;
      const view = editor.view;
      const coords = view.coordsAtPos(from);
      const domRect = view.dom.getBoundingClientRect();
      const relativeYZoomed = (coords.bottom - 2) - domRect.top;
      const relativeY = relativeYZoomed / zoom;
      const pageIndex = Math.max(0, Math.floor(relativeY / effectivePageOffset));
      setCurrentPage(pageIndex + 1);
    };

    editor.on('selectionUpdate', updatePage);
    editor.on('update', updatePage);

    return () => {
      editor.off('selectionUpdate', updatePage);
      editor.off('update', updatePage);
    };
  }, [editor, zoom, effectivePageOffset]);

  useEffect(() => {
    const el = contentMeasureRef.current;
    if (!el) return;

    const update = () => {
      const h = el.scrollHeight;
      if (effectivePageOffset <= 0) {
        setPageCount(1);
        return;
      }
      const pages = Math.max(1, Math.ceil(h / effectivePageOffset));
      setPageCount(pages);
    };

    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [effectivePageOffset, valorHtml]);

  useEffect(() => {
    setCurrentPage((p) => Math.max(1, Math.min(p, pageCount)));
  }, [pageCount]);

  useEffect(() => {
    const pageIndex = currentPage - 1;
    const top = pageIndex * effectivePageOffset;
    const bottom = top + pageHeightPx;
    const buffer = 20;
    const insetTop = Math.max(0, top - buffer);
    const insetBottom = Math.max(0, totalHeightPx - bottom - buffer);
    setMaskClipPath(`inset(${insetTop}px 0px ${insetBottom}px 0px)`);
  }, [currentPage, effectivePageOffset, pageHeightPx, totalHeightPx]);

  useEffect(() => {
    const cont = contenedorRef.current;
    if (!cont) return;
    const top = (currentPage - 1) * effectivePageOffset * zoom;
    const padding = 24;
    const desiredTop = Math.max(0, top - padding);
    const delta = Math.abs(cont.scrollTop - desiredTop);
    if (delta > 8) {
      cont.scrollTo({ top: desiredTop, behavior: 'auto' });
    }
  }, [currentPage, effectivePageOffset, zoom]);

  useEffect(() => {
    if (!popoverColorAbierto || !editor) return;
    const { from, to } = editor.state.selection;
    setSelectionGuardada({ from, to });
    setColorTemporal(colorActual);
  }, [popoverColorAbierto, editor, colorActual]);

  const aplicarColor = (color: string) => {
    if (!editor || soloLectura) return;
    const { from, to } = selectionGuardada ?? editor.state.selection;

    editor.chain().focus().setTextSelection({ from, to }).setColor(color).run();

    editor.commands.command(({ tr, state }) => {
      const listItemType = state.schema.nodes.listItem;
      if (!listItemType) return true;
      state.doc.nodesBetween(from, to, (node, pos) => {
        if (node.type === listItemType) {
          tr.setNodeMarkup(pos, listItemType, { ...node.attrs, color });
        }
      });
      return true;
    });

    editor.chain().setTextSelection({ from, to }).run();
    setColorActual(color);
    setColorTemporal(color);
  };

  const minHeightPx = useMemo(() => {
    const m = /([0-9]+(?:\.[0-9]+)?)px/.exec(minHeight);
    return m ? Number(m[1]) : 260;
  }, [minHeight]);
  const alturaCajaDocumento = useMemo(() => `clamp(${Math.max(minHeightPx, 420)}px, 60vh, 760px)`, [minHeightPx]);

  const currentPageContentTop = (currentPage - 1) * effectivePageOffset + paddingTop;

  const styleGroupValue = useMemo(() => {
    const next: string[] = [];
    if (formatosActivos.bold) next.push('bold');
    if (formatosActivos.italic) next.push('italic');
    if (formatosActivos.underline) next.push('underline');
    if (formatosActivos.strike) next.push('strike');
    return next;
  }, [formatosActivos]);

  const listGroupValue = listMode === 'ordered' ? 'ordered' : listMode === 'bullet' ? 'bullet' : '';

  const alignmentValue = alignMode;

  const maxMargen = useMemo(() => {
    const maxTop = Math.min(MARGEN_MAX_MM, Math.max(MARGEN_MIN_MM, config.heightMm - MIN_CONTENIDO_MM - config.margenes.bottom));
    const maxBottom = Math.min(MARGEN_MAX_MM, Math.max(MARGEN_MIN_MM, config.heightMm - MIN_CONTENIDO_MM - config.margenes.top));
    const maxLeft = Math.min(MARGEN_MAX_MM, Math.max(MARGEN_MIN_MM, config.widthMm - MIN_CONTENIDO_MM - config.margenes.right));
    const maxRight = Math.min(MARGEN_MAX_MM, Math.max(MARGEN_MIN_MM, config.widthMm - MIN_CONTENIDO_MM - config.margenes.left));

    return {
      top: maxTop,
      right: maxRight,
      bottom: maxBottom,
      left: maxLeft,
    };
  }, [config.heightMm, config.margenes.bottom, config.margenes.left, config.margenes.right, config.margenes.top, config.widthMm]);

  const actualizarMargen = (lado: keyof DocumentoConfig['margenes'], valor: number) => {
    const asNumber = Number.isFinite(valor) ? valor : 0;
    const max = maxMargen[lado];
    const clamped = clampNumber(asNumber, MARGEN_MIN_MM, max);
    onChangeConfig({
      ...config,
      margenes: {
        ...config.margenes,
        [lado]: clamped,
      },
    });
  };

  const cambiarTamanoFuente = (delta: -1 | 1) => {
    if (!editor || soloLectura) return;

    const actual = fontSize;
    let idx = tamanosFuente.indexOf(actual);

    if (idx === -1) {
      const actualPx = Number.parseFloat(String(actual).replace('px', ''));
      if (Number.isFinite(actualPx)) {
        let mejor = 0;
        let mejorDist = Number.POSITIVE_INFINITY;
        for (let i = 0; i < tamanosFuente.length; i++) {
          const px = Number.parseFloat(tamanosFuente[i].replace('px', ''));
          const d = Math.abs(px - actualPx);
          if (d < mejorDist) {
            mejorDist = d;
            mejor = i;
          }
        }
        idx = mejor;
      } else {
        idx = tamanosFuente.indexOf('16px');
      }
    }

    const nextIdx = clampNumber(idx + delta, 0, tamanosFuente.length - 1);
    const next = tamanosFuente[nextIdx];
    setFontSize(next);
    editor.chain().focus().setFontSize(next).run();
  };

  const puedeDisminuirTamano = fontSize === tamanosFuente[0];
  const puedeAumentarTamano = fontSize === tamanosFuente[tamanosFuente.length - 1];

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[11px] text-slate-500 dark:text-slate-400">Documento: {pageLabel} · Márgenes (mm)</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {(
            [
              { k: 'top' as const, label: 'Arriba' },
              { k: 'right' as const, label: 'Derecha' },
              { k: 'bottom' as const, label: 'Abajo' },
              { k: 'left' as const, label: 'Izquierda' },
            ]
          ).map(({ k, label }) => (
            <label key={k} className="flex flex-col gap-1">
              <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">{label}</span>
              <input
                type="number"
                min={MARGEN_MIN_MM}
                max={maxMargen[k]}
                step={1}
                value={config.margenes[k]}
                onChange={(e) => actualizarMargen(k, Number(e.target.value))}
                className="w-24 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs dark:border-slate-700 dark:bg-slate-900"
                disabled={soloLectura}
              />
            </label>
          ))}
        </div>
      </div>

      {!editor ? null : (
        <div className={cn('space-y-2')}>
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-slate-200 bg-white p-2 dark:border-slate-800 dark:bg-slate-950">
            <div className="flex flex-wrap items-center gap-1">
              <ToggleGroup
                type="multiple"
                value={styleGroupValue}
                onValueChange={(next) => {
                  if (soloLectura) return;
                  const wants = new Set(next);
                  if (wants.has('bold') !== editor.isActive('bold')) editor.chain().focus().toggleBold().run();
                  if (wants.has('italic') !== editor.isActive('italic')) editor.chain().focus().toggleItalic().run();
                  if (wants.has('underline') !== editor.isActive('underline')) editor.chain().focus().toggleUnderline().run();
                  if (wants.has('strike') !== editor.isActive('strike')) editor.chain().focus().toggleStrike().run();
                }}
              >
                <ToggleGroupItem value="bold" variant="outline" size="sm" className="h-8 w-8" aria-label="Negrita" disabled={soloLectura}>
                  <Bold className="h-4 w-4" />
                </ToggleGroupItem>
                <ToggleGroupItem value="italic" variant="outline" size="sm" className="h-8 w-8" aria-label="Cursiva" disabled={soloLectura}>
                  <Italic className="h-4 w-4" />
                </ToggleGroupItem>
                <ToggleGroupItem value="underline" variant="outline" size="sm" className="h-8 w-8" aria-label="Subrayado" disabled={soloLectura}>
                  <UnderlineIcon className="h-4 w-4" />
                </ToggleGroupItem>
                <ToggleGroupItem value="strike" variant="outline" size="sm" className="h-8 w-8" aria-label="Tachado" disabled={soloLectura}>
                  <Strikethrough className="h-4 w-4" />
                </ToggleGroupItem>
              </ToggleGroup>

              <div className="mx-2 h-6 w-px bg-slate-200 dark:bg-slate-800" />

              <ToggleGroup
                type="single"
                value={listGroupValue}
                onValueChange={(next) => {
                  if (soloLectura) return;
                  const value = next || '';
                  const isBullet = editor.isActive('bulletList');
                  const isOrdered = editor.isActive('orderedList');

                  const align = alignMode;

                  if (value === 'bullet') {
                    if (isOrdered) editor.chain().focus().toggleOrderedList().run();
                    editor.chain().focus().toggleBulletList().updateAttributes('bulletList', { textAlign: align }).run();
                    return;
                  }
                  if (value === 'ordered') {
                    if (isBullet) editor.chain().focus().toggleBulletList().run();
                    editor.chain().focus().toggleOrderedList().updateAttributes('orderedList', { textAlign: align }).run();
                    return;
                  }
                  if (isBullet) editor.chain().focus().toggleBulletList().run();
                  if (isOrdered) editor.chain().focus().toggleOrderedList().run();
                }}
              >
                <ToggleGroupItem value="bullet" variant="outline" size="sm" className="h-8 w-8" aria-label="Viñetas" disabled={soloLectura}>
                  <List className="h-4 w-4" />
                </ToggleGroupItem>
                <ToggleGroupItem value="ordered" variant="outline" size="sm" className="h-8 w-8" aria-label="Numeración" disabled={soloLectura}>
                  <ListOrdered className="h-4 w-4" />
                </ToggleGroupItem>
              </ToggleGroup>

              <div className="mx-2 h-6 w-px bg-slate-200 dark:bg-slate-800" />

              <ToggleGroup
                type="single"
                value={alignmentValue}
                onValueChange={(next) => {
                  if (soloLectura) return;
                  if (!next) return;
                  const value = next as 'left' | 'center' | 'right';
                  if (editor.isActive('bulletList')) {
                    editor.chain().focus().updateAttributes('bulletList', { textAlign: value }).setTextAlign(value).run();
                    return;
                  }
                  if (editor.isActive('orderedList')) {
                    editor.chain().focus().updateAttributes('orderedList', { textAlign: value }).setTextAlign(value).run();
                    return;
                  }

                  editor.chain().focus().setTextAlign(value).run();
                }}
              >
                <ToggleGroupItem value="left" variant="outline" size="sm" className="h-8 w-8" aria-label="Alinear izquierda" disabled={soloLectura}>
                  <AlignLeft className="h-4 w-4" />
                </ToggleGroupItem>
                <ToggleGroupItem value="center" variant="outline" size="sm" className="h-8 w-8" aria-label="Alinear centro" disabled={soloLectura}>
                  <AlignCenter className="h-4 w-4" />
                </ToggleGroupItem>
                <ToggleGroupItem value="right" variant="outline" size="sm" className="h-8 w-8" aria-label="Alinear derecha" disabled={soloLectura}>
                  <AlignRight className="h-4 w-4" />
                </ToggleGroupItem>
              </ToggleGroup>

              <div className="mx-2 h-6 w-px bg-slate-200 dark:bg-slate-800" />

              <Popover
                open={popoverColorAbierto}
                onOpenChange={(open: boolean) => {
                  if (soloLectura) return;
                  setPopoverColorAbierto(open);
                }}
              >
                <PopoverTrigger asChild>
                  <Boton type="button" variant="outline" size="sm" className="h-8 w-8 p-0" aria-label="Seleccionar color" disabled={soloLectura}>
                    <div className="h-4 w-4 rounded border border-slate-200 dark:border-slate-800" style={{ backgroundColor: colorActual }} />
                  </Boton>
                </PopoverTrigger>
                <PopoverContent
                  className="w-64 p-3"
                  align="start"
                  onInteractOutside={(e) => {
                    const target = e.target as HTMLElement;
                    if (target.closest('.react-colorful') || target.closest('[role="dialog"]')) {
                      e.preventDefault();
                    }
                  }}
                  onPointerDownOutside={(e) => {
                    const target = e.target as HTMLElement;
                    if (target.closest('.react-colorful') || target.closest('[role="dialog"]')) {
                      e.preventDefault();
                    }
                  }}
                >
                  <div className="space-y-3">
                    <HexColorPicker color={colorTemporal} onChange={(c) => setColorTemporal(c)} />
                    <div className="flex items-center justify-between text-xs">
                      <span className="rounded border bg-slate-100 px-2 py-1 dark:bg-slate-900" style={{ backgroundColor: colorTemporal, color: '#fff' }}>
                        {colorTemporal.toUpperCase()}
                      </span>
                      {colorTemporal !== colorActual && <span className="text-slate-500 dark:text-slate-400">(no aplicado)</span>}
                    </div>
                    <div className="grid grid-cols-9 gap-2">
                      {coloresPredefinidos.map((color) => (
                        <button
                          key={color}
                          type="button"
                          className={cn('h-6 w-6 rounded border-2 transition-transform hover:scale-110', color === '#FFFFFF' ? 'border-slate-300' : 'border-slate-200 dark:border-slate-800')}
                          style={{ backgroundColor: color }}
                          onClick={() => aplicarColor(color)}
                          title={color}
                        />
                      ))}
                    </div>
                    <Boton
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 w-full"
                      onClick={() => {
                        aplicarColor(colorTemporal);
                        setPopoverColorAbierto(false);
                      }}
                      disabled={soloLectura}
                    >
                      <Check className="mr-2 h-4 w-4" /> Aplicar
                    </Boton>
                    <Boton
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 w-full"
                      onClick={() => {
                        setColorTemporal(colorActual);
                        setPopoverColorAbierto(false);
                      }}
                      disabled={soloLectura}
                    >
                      Cancelar
                    </Boton>
                  </div>
                </PopoverContent>
              </Popover>

              <div className="flex items-center gap-1">
                <Boton
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 px-0"
                  onClick={() => cambiarTamanoFuente(-1)}
                  disabled={soloLectura || !editor || puedeDisminuirTamano}
                  title="Disminuir tamaño"
                >
                  -
                </Boton>

                <Select
                  value={fontSize}
                  onValueChange={(v) => {
                    setFontSize(v);
                    editor.chain().focus().setFontSize(v).run();
                  }}
                >
                  <SelectTrigger className="h-8 w-[88px]">
                    <SelectValue placeholder="Tamaño" />
                  </SelectTrigger>
                  <SelectContent>
                    {tamanosFuente.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Boton
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 px-0"
                  onClick={() => cambiarTamanoFuente(1)}
                  disabled={soloLectura || !editor || puedeAumentarTamano}
                  title="Aumentar tamaño"
                >
                  +
                </Boton>
              </div>

              <Boton
                type="button"
                variant="outline"
                size="sm"
                className="h-8 px-2"
                onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
                disabled={soloLectura}
                title="Insertar tabla"
              >
                <TableIcon className="h-4 w-4" />
              </Boton>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-slate-500 dark:text-slate-400">Zoom</span>
                <Select value={String(zoom)} onValueChange={(v) => setZoom(Number(v))}>
                  <SelectTrigger className="h-7 w-[74px] text-[11px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ZOOM_STEPS.map((z) => (
                      <SelectItem key={z} value={String(z)}>
                        {Math.round(z * 100)}%
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-slate-500 dark:text-slate-400">Guías</span>
                <Switch
                  checked={mostrarGuiasMargen}
                  onCheckedChange={setMostrarGuiasMargen}
                  disabled={soloLectura}
                  className="scale-75 origin-center"
                />
              </div>
            </div>
          </div>

          <div
            ref={contenedorRef}
            className="w-full overflow-auto rounded-lg border border-slate-200 bg-slate-100 p-4 dark:border-slate-800 dark:bg-slate-900"
            style={{
              height: alturaCajaDocumento,
              maxHeight: alturaCajaDocumento,
            }}
          >
            <div
              className="relative mx-auto overflow-hidden"
              style={{
                width: `${pageWidthPx * zoom}px`,
                height: `${totalHeightPx * zoom}px`,
              }}
            >
              <div
                className="absolute top-0 left-0"
                style={{
                  width: pageWidthPx,
                  height: totalHeightPx,
                  transform: `scale(${zoom})`,
                  transformOrigin: 'top left',
                  pointerEvents: 'none',
                  zIndex: 0,
                }}
              >
                {Array.from({ length: pageCount }).map((_, i) => {
                  const isCurrentPage = i + 1 === currentPage;
                  const topPos = i * effectivePageOffset + paddingTop;

                  return (
                    <div
                      key={`bg-${i}`}
                      className="absolute border-x border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950"
                      style={{
                        top: topPos,
                        left: 0,
                        width: pageWidthPx,
                        height: effectivePageOffset,
                        zIndex: isCurrentPage ? 1 : 0,
                        boxShadow: '0 0 20px rgba(0,0,0,0.08)',
                      }}
                    />
                  );
                })}
              </div>

              {mostrarGuiasMargen && (
                <div
                  className="absolute top-0 left-0 pointer-events-none"
                  style={{
                    width: pageWidthPx,
                    height: totalHeightPx,
                    transform: `scale(${zoom})`,
                    transformOrigin: 'top left',
                    zIndex: 20,
                  }}
                >
                  {Array.from({ length: pageCount }).map((_, i) => {
                    if (i + 1 !== currentPage) return null;
                    const topPos = i * effectivePageOffset + paddingTop;

                    return (
                      <div key={`guides-${i}`} style={{ position: 'absolute', top: topPos, left: 0, width: pageWidthPx, height: effectivePageOffset }}>
                        <div style={{ position: 'absolute', top: 0, left: 0, width: pageWidthPx, borderTop: '1px dashed rgba(59, 130, 246, 0.5)' }} />
                        <div style={{ position: 'absolute', bottom: 0, left: 0, width: pageWidthPx, borderBottom: '1px dashed rgba(59, 130, 246, 0.5)' }} />
                        <div style={{ position: 'absolute', top: 0, bottom: 0, left: paddingLeft, borderLeft: '1px dashed rgba(59, 130, 246, 0.5)' }} />
                        <div style={{ position: 'absolute', top: 0, bottom: 0, right: paddingRight, borderRight: '1px dashed rgba(59, 130, 246, 0.5)' }} />
                      </div>
                    );
                  })}
                </div>
              )}

              <div
                className="absolute top-0 left-0"
                style={{
                  width: pageWidthPx,
                  height: totalHeightPx,
                  transform: `scale(${zoom})`,
                  transformOrigin: 'top left',
                  zIndex: 30,
                  clipPath: maskClipPath,
                  transition: 'clip-path 0.15s ease-out',
                }}
              >
                <div
                  className={cn(
                    'editor-documento-prosemirror prose prose-sm max-w-none text-slate-900',
                    '[&_li]:my-1 [&_p]:my-2 [&_h1]:my-3 [&_h2]:my-3 [&_h3]:my-2',
                  )}
                  style={{
                    position: 'absolute',
                    top: paddingTop,
                    left: paddingLeft,
                    width: contentWidthPx,
                    minHeight: Math.max(120, Math.min(minHeightPx, effectivePageOffset)),
                    fontSize: '16px',
                  }}
                >
                  <div ref={contentMeasureRef}>
                    <EditorContent editor={editor} />
                  </div>
                </div>
              </div>

              <div
                className="absolute top-0 left-0 pointer-events-none"
                style={{
                  width: pageWidthPx,
                  height: totalHeightPx,
                  transform: `scale(${zoom})`,
                  transformOrigin: 'top left',
                  zIndex: 40,
                }}
              >
                {Array.from({ length: pageCount }).map((_, i) => {
                  const isCurrentPage = i + 1 === currentPage;
                  const topPos = i * effectivePageOffset + paddingTop;

                  return (
                    <div
                      key={`dim-${i}`}
                      style={{
                        position: 'absolute',
                        top: topPos,
                        left: 0,
                        width: pageWidthPx,
                        height: effectivePageOffset,
                        backgroundColor: isCurrentPage ? 'transparent' : '#e2e8f0',
                        opacity: isCurrentPage ? 0 : 1,
                        borderBottom: i < pageCount - 1 ? '1px solid #94a3b8' : 'none',
                        transition: 'opacity 0.2s ease, background-color 0.2s ease',
                        pointerEvents: isCurrentPage ? 'none' : 'auto',
                        cursor: isCurrentPage ? 'text' : 'pointer',
                      }}
                      onClick={(e) => {
                        if (!isCurrentPage) {
                          e.preventDefault();
                          e.stopPropagation();
                          setCurrentPage(i + 1);
                        }
                      }}
                    >
                      {!isCurrentPage && (
                        <div className="flex h-full w-full flex-col items-center justify-center opacity-50">
                          <span className="select-none text-lg font-bold text-slate-500">Página {i + 1}</span>
                          <span className="select-none text-xs text-slate-400">(Clic para editar)</span>
                        </div>
                      )}
                      {isCurrentPage && (
                        <div style={{ position: 'absolute', bottom: 4, right: 8, fontSize: '10px', color: '#94a3b8', pointerEvents: 'none' }}>
                          Pag. {i + 1}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div
                className="absolute top-0 left-0 pointer-events-none"
                style={{
                  width: pageWidthPx,
                  height: totalHeightPx,
                  transform: `scale(${zoom})`,
                  transformOrigin: 'top left',
                  zIndex: 50,
                }}
              >
                {paddingTop > 0 && (
                  <div
                    style={{
                      position: 'absolute',
                      top: currentPageContentTop - paddingTop,
                      left: 0,
                      width: pageWidthPx,
                      height: paddingTop,
                      backgroundColor: '#fff',
                      boxShadow: '0 -2px 5px rgba(0,0,0,0.05)',
                    }}
                  >
                    {mostrarGuiasMargen && (
                      <>
                        <div style={{ position: 'absolute', top: 0, bottom: 0, left: paddingLeft, borderLeft: '1px dashed rgba(59, 130, 246, 0.5)' }} />
                        <div style={{ position: 'absolute', top: 0, bottom: 0, right: paddingRight, borderRight: '1px dashed rgba(59, 130, 246, 0.5)' }} />
                      </>
                    )}
                  </div>
                )}

                {paddingBottom > 0 && (
                  <div
                    style={{
                      position: 'absolute',
                      top: currentPageContentTop + effectivePageOffset,
                      left: 0,
                      width: pageWidthPx,
                      height: paddingBottom,
                      backgroundColor: '#fff',
                      boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
                    }}
                  >
                    {mostrarGuiasMargen && (
                      <>
                        <div style={{ position: 'absolute', top: 0, bottom: 0, left: paddingLeft, borderLeft: '1px dashed rgba(59, 130, 246, 0.5)' }} />
                        <div style={{ position: 'absolute', top: 0, bottom: 0, right: paddingRight, borderRight: '1px dashed rgba(59, 130, 246, 0.5)' }} />
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .editor-documento-prosemirror .ProseMirror {
          outline: none;
          line-height: 1.55;
          white-space: pre-wrap;
          word-break: break-word;
          overflow-wrap: anywhere;
        }

        .editor-documento-prosemirror .ProseMirror p {
          margin: 0.5em 0;
          min-height: 1em;
        }

        .editor-documento-prosemirror .ProseMirror h1,
        .editor-documento-prosemirror .ProseMirror h2,
        .editor-documento-prosemirror .ProseMirror h3 {
          line-height: 1.3;
        }

        .editor-documento-prosemirror .ProseMirror ul,
        .editor-documento-prosemirror .ProseMirror ol {
          padding-left: 1.5rem;
          margin: 0.5rem 0;
          list-style-position: outside;
          color: currentColor;
        }
        .editor-documento-prosemirror .ProseMirror ul {
          list-style-type: disc;
          display: block;
        }
        .editor-documento-prosemirror .ProseMirror ol {
          list-style-type: decimal;
          display: block;
        }
        .editor-documento-prosemirror .ProseMirror ul li,
        .editor-documento-prosemirror .ProseMirror ol li {
          margin: 0.25rem 0;
          display: list-item;
          color: currentColor;
        }
        .editor-documento-prosemirror .ProseMirror ul li::marker,
        .editor-documento-prosemirror .ProseMirror ol li::marker {
          color: currentColor;
        }

        .editor-documento-prosemirror .ProseMirror ul[style*="text-align: center"],
        .editor-documento-prosemirror .ProseMirror ol[style*="text-align: center"],
        .editor-documento-prosemirror .ProseMirror ul[style*="text-align:center"],
        .editor-documento-prosemirror .ProseMirror ol[style*="text-align:center"] {
          display: table;
          text-align: left;
          list-style-position: outside;
          padding-left: 1.5rem;
          margin-left: auto;
          margin-right: auto;
        }
        .editor-documento-prosemirror .ProseMirror ul[style*="text-align: right"],
        .editor-documento-prosemirror .ProseMirror ol[style*="text-align: right"],
        .editor-documento-prosemirror .ProseMirror ul[style*="text-align:right"],
        .editor-documento-prosemirror .ProseMirror ol[style*="text-align:right"] {
          display: table;
          text-align: left;
          list-style-position: outside;
          padding-left: 1.5rem;
          margin-left: auto;
          margin-right: 0;
        }

        .editor-documento-prosemirror .ProseMirror table {
          width: 100%;
          border-collapse: collapse;
          margin: 0.5rem 0;
        }

        .editor-documento-prosemirror .ProseMirror table td,
        .editor-documento-prosemirror .ProseMirror table th {
          border: 1px solid #cbd5e1;
          padding: 2px 4px;
          vertical-align: top;
          word-break: break-word;
        }
      `}</style>
    </div>
  );
}

