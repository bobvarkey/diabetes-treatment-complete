import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X, ZoomIn, ZoomOut, RotateCcw, Hand } from "lucide-react";
import { cn } from "@/lib/utils";

type Ctx = { open: (src: string, alt?: string) => void };
const ImageViewerCtx = createContext<Ctx>({ open: () => {} });
export const useImageViewer = () => useContext(ImageViewerCtx);

type State = { src: string; alt: string } | null;

export function ImageViewerProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>(null);
  const [scale, setScale] = useState(1);
  const [tx, setTx] = useState(0);
  const [ty, setTy] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [panMode, setPanMode] = useState(true);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const dragRef = useRef<{ x: number; y: number; tx: number; ty: number } | null>(null);
  const pinchRef = useRef<{ dist: number; scale: number } | null>(null);
  const velRef = useRef<{ vx: number; vy: number; t: number; x: number; y: number }>({ vx: 0, vy: 0, t: 0, x: 0, y: 0 });
  const rafRef = useRef<number | null>(null);
  const scaleRef = useRef(1);
  scaleRef.current = scale;
  const posRef = useRef({ x: 0, y: 0 });
  posRef.current = { x: tx, y: ty };

  const stopInertia = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  // Maximum translation allowed so the image never drifts outside the frame
  const limits = useCallback((s: number) => {
    const c = containerRef.current;
    const img = imgRef.current;
    if (!c || !img) return { mx: 0, my: 0 };
    const mx = Math.max(0, (img.offsetWidth * s - c.clientWidth) / 2);
    const my = Math.max(0, (img.offsetHeight * s - c.clientHeight) / 2);
    return { mx, my };
  }, []);

  const clamp = useCallback((x: number, y: number, s: number) => {
    const { mx, my } = limits(s);
    return { x: Math.min(mx, Math.max(-mx, x)), y: Math.min(my, Math.max(-my, y)) };
  }, [limits]);

  const applyOffset = useCallback((x: number, y: number, s = scaleRef.current) => {
    const p = clamp(x, y, s);
    setTx(p.x);
    setTy(p.y);
  }, [clamp]);

  const open = useCallback((src: string, alt = "") => {
    setState({ src, alt });
    setScale(1); setTx(0); setTy(0); setPanMode(true);
  }, []);
  const close = useCallback(() => { stopInertia(); setState(null); }, [stopInertia]);

  // Zooming always keeps the image centred in the frame
  const zoom = useCallback((delta: number) => {
    stopInertia();
    setScale((s) => {
      const ns = Math.min(6, Math.max(1, +(s + delta).toFixed(2)));
      if (ns === 1) {
        setTx(0);
        setTy(0);
      }
      return ns;
    });
  }, [stopInertia]);

  const startInertia = useCallback(() => {
    const decay = 0.93;
    let { vx, vy } = velRef.current;
    let x = posRef.current.x;
    let y = posRef.current.y;
    if (Math.hypot(vx, vy) < 0.4) return;
    const step = () => {
      vx *= decay;
      vy *= decay;
      const p = clamp(x + vx, y + vy, scaleRef.current);
      if (p.x === x && p.y === y) { rafRef.current = null; return; }
      x = p.x; y = p.y;
      setTx(x); setTy(y);
      if (Math.hypot(vx, vy) < 0.15) { rafRef.current = null; return; }
      rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
  }, [clamp]);

  useEffect(() => {
    if (!state) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "+" || e.key === "=") zoom(0.25);
      if (e.key === "-") zoom(-0.25);
      if (e.key === "0") { setScale(1); setTx(0); setTy(0); }
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
      stopInertia();
    };
  }, [state, close, zoom, stopInertia]);

  // Global click delegation: any <img> inside <main> opens the viewer
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const t = e.target as HTMLElement | null;
      if (!t || t.tagName !== "IMG") return;
      if (t.closest("[data-noviewer]") || t.hasAttribute("data-noviewer")) return;
      if (!t.closest("main")) return;
      const img = t as HTMLImageElement;
      const src = img.currentSrc || img.src;
      if (!src) return;
      e.preventDefault();
      open(src, img.alt);
    };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [open]);

  return (
    <ImageViewerCtx.Provider value={{ open }}>
      {children}
      {state && typeof document !== "undefined" && createPortal(
        <div
          role="dialog"
          aria-modal="true"
          aria-label={state.alt || "Image viewer"}
          className="fixed inset-0 z-[100] flex flex-col bg-black/90 backdrop-blur-sm animate-in fade-in duration-150 motion-reduce:animate-none"
          onClick={close}
        >
          <div className="flex items-center justify-between gap-2 border-b border-white/10 px-3 py-2 text-white" onClick={(e) => e.stopPropagation()}>
            <div className="truncate text-sm">{state.alt || "Image"}</div>
            <div className="flex items-center gap-1">
              <button aria-label="Zoom out" onClick={() => zoom(-0.25)} className="grid h-9 w-9 place-items-center rounded-md hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"><ZoomOut className="h-4 w-4" /></button>
              <div className="min-w-14 text-center text-xs tabular-nums">{Math.round(scale * 100)}%</div>
              <button aria-label="Zoom in" onClick={() => zoom(0.25)} className="grid h-9 w-9 place-items-center rounded-md hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"><ZoomIn className="h-4 w-4" /></button>
              <button
                type="button"
                aria-label="Pan mode"
                aria-pressed={panMode && scale > 1}
                disabled={scale <= 1}
                onClick={() => setPanMode((p) => !p)}
                className={cn(
                  "grid h-9 w-9 place-items-center rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white transition-colors",
                  scale <= 1 ? "text-white/40 cursor-not-allowed" : panMode ? "bg-white/25 text-white" : "text-white/70 hover:bg-white/10",
                )}
                title={scale <= 1 ? "Zoom in to pan" : panMode ? "Pan mode on" : "Pan mode off"}
              >
                <Hand className="h-4 w-4" />
              </button>
              <button aria-label="Reset zoom" onClick={() => { stopInertia(); setScale(1); setTx(0); setTy(0); }} className="grid h-9 w-9 place-items-center rounded-md hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"><RotateCcw className="h-4 w-4" /></button>
              <button aria-label="Close viewer" onClick={close} className="grid h-9 w-9 place-items-center rounded-md hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"><X className="h-4 w-4" /></button>
            </div>
          </div>
          <div
            ref={containerRef}
            className={cn("relative flex-1 overflow-hidden select-none touch-none overscroll-contain", scale > 1 && panMode ? (dragging ? "cursor-grabbing" : "cursor-grab") : "cursor-default")}
            onClick={(e) => e.stopPropagation()}
            onWheel={(e) => {
              e.preventDefault();
              zoom(e.deltaY > 0 ? -0.2 : 0.2);
            }}
            onDoubleClick={(e) => {
              e.preventDefault();
              if (scale === 1) {
                zoom(1.5);
              } else {
                stopInertia();
                setScale(1);
                setTx(0);
                setTy(0);
              }
            }}
            onPointerDown={(e) => {
              if (!panMode || scaleRef.current <= 1) return;
              stopInertia();
              e.currentTarget.setPointerCapture?.(e.pointerId);
              dragRef.current = { x: e.clientX, y: e.clientY, tx, ty };
              velRef.current = { vx: 0, vy: 0, t: performance.now(), x: e.clientX, y: e.clientY };
              setDragging(true);
            }}
            onPointerMove={(e) => {
              if (!dragRef.current || pinchRef.current) return;
              e.preventDefault();
              const now = performance.now();
              const dt = Math.max(1, now - velRef.current.t);
              velRef.current = {
                vx: (e.clientX - velRef.current.x) / dt * 16,
                vy: (e.clientY - velRef.current.y) / dt * 16,
                t: now,
                x: e.clientX,
                y: e.clientY,
              };
              applyOffset(
                dragRef.current.tx + (e.clientX - dragRef.current.x),
                dragRef.current.ty + (e.clientY - dragRef.current.y),
              );
            }}
            onPointerUp={(e) => {
              e.currentTarget.releasePointerCapture?.(e.pointerId);
              if (!dragRef.current) return;
              dragRef.current = null;
              setDragging(false);
              if (scale > 1) startInertia();
            }}
            onPointerCancel={(e) => {
              e.currentTarget.releasePointerCapture?.(e.pointerId);
              dragRef.current = null;
              setDragging(false);
            }}
            onTouchStart={(e) => {
              if (e.touches.length === 2) {
                stopInertia();
                const dist = Math.hypot(
                  e.touches[0].clientX - e.touches[1].clientX,
                  e.touches[0].clientY - e.touches[1].clientY
                );
                pinchRef.current = { dist, scale };
              }
            }}
            onTouchMove={(e) => {
              if (e.touches.length === 2 && pinchRef.current) {
                e.preventDefault();
                const dist = Math.hypot(
                  e.touches[0].clientX - e.touches[1].clientX,
                  e.touches[0].clientY - e.touches[1].clientY
                );
                const newScale = Math.min(6, Math.max(1, pinchRef.current.scale * (dist / pinchRef.current.dist)));
                if (newScale !== scale) {
                  setScale(newScale);
                  if (newScale === 1) {
                    setTx(0);
                    setTy(0);
                  }
                }
              } else if (e.touches.length === 1 && scale > 1) {
                e.preventDefault();
              }
            }}
            onTouchEnd={() => {
              pinchRef.current = null;
              applyOffset(tx, ty);
            }}
          >
            <img
              ref={imgRef}
              src={state.src}
              alt={state.alt}
              draggable={false}
              onLoad={() => applyOffset(tx, ty)}
              className="absolute left-1/2 top-1/2 max-h-[92vh] max-w-[96vw] -translate-x-1/2 -translate-y-1/2 will-change-transform"
              style={{ transform: `translate(calc(-50% + ${tx}px), calc(-50% + ${ty}px)) scale(${scale})`, transition: dragging ? "none" : "transform 120ms ease-out" }}
              data-noviewer
            />
          </div>
          <div className="border-t border-white/10 px-3 py-1.5 text-center text-[11px] text-white/70">
            Scroll or pinch to zoom · drag to pan · double-tap to toggle · Esc to close
          </div>
        </div>,
        document.body,
      )}
    </ImageViewerCtx.Provider>
  );
}

export function ImageViewerTrigger({
  src,
  alt = "",
  children,
}: {
  src: string;
  alt?: string;
  children: ReactNode;
}) {
  const { open } = useImageViewer();
  return (
    <div className="cursor-zoom-in" onClick={() => open(src, alt)}>
      {children}
    </div>
  );
}
