import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
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
  const dragRef = useRef<{ x: number; y: number; tx: number; ty: number } | null>(null);
  const pinchRef = useRef<{ dist: number; scale: number } | null>(null);
  const [dragging, setDragging] = useState(false);

  const open = useCallback((src: string, alt = "") => {
    setState({ src, alt });
    setScale(1); setTx(0); setTy(0);
  }, []);
  const close = useCallback(() => setState(null), []);

  const zoom = (delta: number, cx?: number, cy?: number) => {
    setScale((s) => {
      const ns = Math.min(6, Math.max(1, +(s + delta).toFixed(2)));
      if (ns === 1) { setTx(0); setTy(0); }
      // simple cursor-anchored zoom
      if (cx !== undefined && cy !== undefined && ns !== s) {
        const factor = ns / s - 1;
        setTx((v) => v - cx * factor);
        setTy((v) => v - cy * factor);
      }
      return ns;
    });
  };

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
    };
  }, [state, close]);

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
              <button aria-label="Reset zoom" onClick={() => { setScale(1); setTx(0); setTy(0); }} className="grid h-9 w-9 place-items-center rounded-md hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"><RotateCcw className="h-4 w-4" /></button>
              <button aria-label="Close viewer" onClick={close} className="grid h-9 w-9 place-items-center rounded-md hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"><X className="h-4 w-4" /></button>
            </div>
          </div>
          <div
            className={cn("relative flex-1 overflow-hidden select-none touch-none", dragging ? "cursor-grabbing" : "cursor-grab")}
            onClick={(e) => e.stopPropagation()}
            onWheel={(e) => {
              e.preventDefault();
              zoom(e.deltaY > 0 ? -0.2 : 0.2, e.clientX - window.innerWidth / 2, e.clientY - window.innerHeight / 2);
            }}
            onDoubleClick={(e) => {
              e.preventDefault();
              if (scale === 1) {
                zoom(1.5, e.clientX - window.innerWidth / 2, e.clientY - window.innerHeight / 2);
              } else {
                setScale(1);
                setTx(0);
                setTy(0);
              }
            }}
            onPointerDown={(e) => {
              (e.target as Element).setPointerCapture?.(e.pointerId);
              dragRef.current = { x: e.clientX, y: e.clientY, tx, ty };
              setDragging(true);
            }}
            onPointerMove={(e) => {
              if (!dragRef.current) return;
              setTx(dragRef.current.tx + (e.clientX - dragRef.current.x));
              setTy(dragRef.current.ty + (e.clientY - dragRef.current.y));
            }}
            onPointerUp={(e) => {
              (e.target as Element).releasePointerCapture?.(e.pointerId);
              dragRef.current = null;
              setDragging(false);
            }}
            onPointerCancel={(e) => {
              (e.target as Element).releasePointerCapture?.(e.pointerId);
              dragRef.current = null;
              setDragging(false);
            }}
            onTouchStart={(e) => {
              if (e.touches.length === 2) {
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
                const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2 - window.innerWidth / 2;
                const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2 - window.innerHeight / 2;
                
                const newScale = Math.min(6, Math.max(1, pinchRef.current.scale * (dist / pinchRef.current.dist)));
                
                if (newScale !== scale) {
                  const factor = newScale / scale - 1;
                  setTx((v) => v - midX * factor);
                  setTy((v) => v - midY * factor);
                  setScale(newScale);
                }
              } else if (e.touches.length === 1 && scale > 1) {
                e.preventDefault();
              }
            }}
            onTouchEnd={() => {
              pinchRef.current = null;
            }}
          >
            <img
              src={state.src}
              alt={state.alt}
              draggable={false}
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