import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import * as fabric from "fabric";
import {
  ArrowLeft, Pen, Eraser, Square, Circle, Type, Trash2,
  Download, Minus, Undo2, Redo2, ChevronDown, Heart,
  Highlighter, Hand, StickyNote, Save, Maximize2, Minimize2, CheckCircle, PenLine
} from "lucide-react";
import { toast } from "sonner";

type Tool = "select" | "pen" | "highlighter" | "eraser" | "line" | "rect" | "circle" | "text" | "sticky";

const COLORS = [
  { hex: "#14b8a6", label: "Teal" },
  { hex: "#10b981", label: "Emerald" },
  { hex: "#3b82f6", label: "Blue" },
  { hex: "#ef4444", label: "Red" },
  { hex: "#f59e0b", label: "Amber" },
  { hex: "#8b5cf6", label: "Purple" },
  { hex: "#ffffff", label: "White" },
];

const HIGHLIGHT_COLORS = [
  { hex: "#fef08a", label: "Yellow" },
  { hex: "#a7f3d0", label: "Green" },
  { hex: "#bfdbfe", label: "Blue" },
  { hex: "#fecaca", label: "Red" },
];

const STROKE_SIZES = [2, 4, 6, 10, 16];

export default function Whiteboard() {
  const { appointmentId } = useParams();
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fabricRef = useRef<fabric.Canvas | null>(null);
  const historyRef = useRef<string[]>([]);
  const historyIndexRef = useRef(-1);

  const [tool, setTool] = useState<Tool>("pen");
  const [color, setColor] = useState("#14b8a6");
  const [highlightColor, setHighlightColor] = useState("#fef08a");
  const [strokeSize, setStrokeSize] = useState(3);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showSizeMenu, setShowSizeMenu] = useState(false);
  const [showHighlightPicker, setShowHighlightPicker] = useState(false);

  const saveHistory = useCallback(() => {
    const fc = fabricRef.current;
    if (!fc) return;
    const json = JSON.stringify(fc.toJSON());
    historyRef.current = historyRef.current.slice(0, historyIndexRef.current + 1);
    historyRef.current.push(json);
    historyIndexRef.current = historyRef.current.length - 1;
    setCanUndo(historyIndexRef.current > 0);
    setCanRedo(false);
  }, []);

  const undo = useCallback(() => {
    const fc = fabricRef.current;
    if (!fc || historyIndexRef.current <= 0) return;
    historyIndexRef.current -= 1;
    fc.loadFromJSON(historyRef.current[historyIndexRef.current]).then(() => {
      fc.renderAll();
      setCanUndo(historyIndexRef.current > 0);
      setCanRedo(true);
    });
  }, []);

  const redo = useCallback(() => {
    const fc = fabricRef.current;
    if (!fc || historyIndexRef.current >= historyRef.current.length - 1) return;
    historyIndexRef.current += 1;
    fc.loadFromJSON(historyRef.current[historyIndexRef.current]).then(() => {
      fc.renderAll();
      setCanUndo(true);
      setCanRedo(historyIndexRef.current < historyRef.current.length - 1);
    });
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    const el = canvasRef.current;
    if (!el || !container) return;

    const fc = new fabric.Canvas(el, {
      width: container.clientWidth,
      height: container.clientHeight,
      backgroundColor: "#09090b", // Pure dark zinc for clinical canvas
      isDrawingMode: true,
      selection: false,
    });

    fc.freeDrawingBrush = new fabric.PencilBrush(fc);
    (fc.freeDrawingBrush as fabric.PencilBrush).color = color;
    (fc.freeDrawingBrush as fabric.PencilBrush).width = strokeSize;

    fabricRef.current = fc;
    historyRef.current = [JSON.stringify(fc.toJSON())];
    historyIndexRef.current = 0;

    fc.on("object:added", saveHistory);
    fc.on("object:modified", saveHistory);
    fc.on("object:removed", saveHistory);

    const resizeObserver = new ResizeObserver(() => {
      fc.setDimensions({ width: container.clientWidth, height: container.clientHeight });
      fc.renderAll();
    });
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      fc.dispose();
    };
  }, [saveHistory]);

  useEffect(() => {
    const fc = fabricRef.current;
    if (!fc) return;

    fc.off("mouse:down");
    fc.off("mouse:move");
    fc.off("mouse:up");

    if (tool === "select") {
      fc.isDrawingMode = false;
      fc.selection = true;
      fc.forEachObject(o => { o.selectable = true; });
      return;
    }

    fc.selection = false;
    fc.forEachObject(o => { o.selectable = false; });

    if (tool === "pen") {
      fc.isDrawingMode = true;
      fc.freeDrawingBrush = new fabric.PencilBrush(fc);
      (fc.freeDrawingBrush as any).color = color;
      (fc.freeDrawingBrush as any).width = strokeSize;
      return;
    }

    if (tool === "highlighter") {
      fc.isDrawingMode = true;
      fc.freeDrawingBrush = new fabric.PencilBrush(fc);
      (fc.freeDrawingBrush as any).color = highlightColor;
      (fc.freeDrawingBrush as any).width = 24;
      (fc.freeDrawingBrush as any).strokeDashArray = [];
      fc.on("path:created", (e: any) => {
        if (tool === "highlighter" && e.path) {
          e.path.set({ opacity: 0.4 });
          fc.renderAll();
        }
      });
      return;
    }

    if (tool === "eraser") {
      fc.isDrawingMode = true;
      fc.freeDrawingBrush = new fabric.PencilBrush(fc);
      (fc.freeDrawingBrush as any).color = "#09090b"; // Erase with background color
      (fc.freeDrawingBrush as any).width = 24;
      return;
    }

    fc.isDrawingMode = false;
    let isDown = false, origX = 0, origY = 0, shape: fabric.Object | null = null;

    fc.on("mouse:down", (o: any) => {
      isDown = true;
      const pointer = fc.getViewportPoint(o.e);
      origX = pointer.x; origY = pointer.y;

      if (tool === "text") {
        const text = new fabric.IText("TEXT INPUT", {
          left: origX, top: origY, fill: color, fontFamily: "monospace", fontSize: strokeSize * 5 + 12, editable: true, selectable: true
        });
        fc.add(text); fc.setActiveObject(text); text.enterEditing(); text.selectAll(); fc.renderAll();
        isDown = false; return;
      }
      if (tool === "sticky") {
        const rect = new fabric.Rect({
          left: origX, top: origY, width: 150, height: 120, fill: "rgba(254, 240, 138, 0.9)", rx: 8, ry: 8, stroke: "#ca8a04", strokeWidth: 1
        });
        const text = new fabric.IText("LOG:", {
          left: origX + 12, top: origY + 12, fill: "#78350f", fontFamily: "monospace", fontSize: 14, width: 126, editable: true
        });
        const group = new fabric.Group([rect, text], { left: origX, top: origY, selectable: true });
        fc.add(group); fc.renderAll(); saveHistory(); isDown = false; return;
      }

      if (tool === "rect") {
        shape = new fabric.Rect({ left: origX, top: origY, width: 0, height: 0, fill: "transparent", stroke: color, strokeWidth: strokeSize, selectable: false });
        fc.add(shape);
      } else if (tool === "circle") {
        shape = new fabric.Ellipse({ left: origX, top: origY, rx: 0, ry: 0, fill: "transparent", stroke: color, strokeWidth: strokeSize, selectable: false });
        fc.add(shape);
      } else if (tool === "line") {
        shape = new fabric.Line([origX, origY, origX, origY], { stroke: color, strokeWidth: strokeSize, selectable: false });
        fc.add(shape);
      }
    });

    fc.on("mouse:move", (o: any) => {
      if (!isDown || !shape) return;
      const pointer = fc.getViewportPoint(o.e);
      const w = pointer.x - origX, h = pointer.y - origY;

      if (tool === "rect") { shape.set({ left: w < 0 ? pointer.x : origX, top: h < 0 ? pointer.y : origY, width: Math.abs(w), height: Math.abs(h) } as any); }
      else if (tool === "circle") { shape.set({ left: w < 0 ? pointer.x : origX, top: h < 0 ? pointer.y : origY, rx: Math.abs(w) / 2, ry: Math.abs(h) / 2 } as any); }
      else if (tool === "line") { shape.set({ x2: pointer.x, y2: pointer.y } as any); }
      fc.renderAll();
    });

    fc.on("mouse:up", () => { isDown = false; shape = null; });
  }, [tool, color, strokeSize, highlightColor, saveHistory]);

  const clearCanvas = () => {
    const fc = fabricRef.current;
    if (!fc) return;
    fc.clear();
    fc.backgroundColor = "#09090b";
    fc.renderAll();
    saveHistory();
    toast.success("Canvas purged");
  };

  const exportPNG = () => {
    const fc = fabricRef.current;
    if (!fc) return;
    const link = document.createElement("a");
    link.download = `whiteboard_${appointmentId}_${Date.now()}.png`;
    link.href = fc.toDataURL({ format: "png", multiplier: 2 });
    link.click();
    toast.success("PNG Terminated");
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) { document.documentElement.requestFullscreen(); setIsFullscreen(true); }
    else { document.exitFullscreen(); setIsFullscreen(false); }
  };

  const TOOLS = [
    { id: "select", icon: Hand, label: "Select", shortcut: "S" },
    { id: "pen", icon: Pen, label: "Pen", shortcut: "P" },
    { id: "highlighter", icon: Highlighter, label: "Highlighter", shortcut: "H" },
    { id: "eraser", icon: Eraser, label: "Eraser", shortcut: "E" },
    { id: "line", icon: Minus, label: "Line", shortcut: "L" },
    { id: "rect", icon: Square, label: "Rectangle", shortcut: "R" },
    { id: "circle", icon: Circle, label: "Circle", shortcut: "C" },
    { id: "text", icon: Type, label: "Text", shortcut: "T" },
    { id: "sticky", icon: StickyNote, label: "Sticky Note", shortcut: "N" },
  ] as const;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const key = e.key.toLowerCase();
      if (key === "z" && (e.ctrlKey || e.metaKey) && !e.shiftKey) { e.preventDefault(); undo(); }
      if (key === "z" && (e.ctrlKey || e.metaKey) && e.shiftKey) { e.preventDefault(); redo(); }
      if (key === "y" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); redo(); }
      if (key === "delete" || key === "backspace") {
        const fc = fabricRef.current;
        if (fc && fc.getActiveObjects().length > 0) {
          fc.getActiveObjects().forEach(obj => fc.remove(obj));
          fc.discardActiveObject(); fc.renderAll(); saveHistory();
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [undo, redo, saveHistory]);

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col selection:bg-red-600/30">
      {/* Top Bar */}
      <div className="bg-zinc-900/80 backdrop-blur-xl border-b border-white/[0.05] px-4 py-3 flex items-center justify-between z-20 shadow-xl">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(`/consultation/${appointmentId}`)} className="p-2.5 hover:bg-white/10 rounded-xl transition-colors"><ArrowLeft className="w-5 h-5 text-white" /></button>
          <div className="w-9 h-9 bg-red-600/20 border border-red-600/30 rounded-xl flex items-center justify-center"><Pen className="w-4 h-4 text-red-500" /></div>
          <div>
            <h2 className="text-sm font-black uppercase tracking-widest text-white mt-0.5">Clinical Whiteboard</h2>
            <p className="text-[9px] font-bold text-red-500 uppercase tracking-[0.2em]">Target ID: {appointmentId?.slice(0, 8)}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={undo} disabled={!canUndo} className="p-2.5 bg-white/[0.02] border border-white/[0.05] text-zinc-400 hover:text-white rounded-lg disabled:opacity-30 transition-colors"><Undo2 className="w-4 h-4" /></button>
          <button onClick={redo} disabled={!canRedo} className="p-2.5 bg-white/[0.02] border border-white/[0.05] text-zinc-400 hover:text-white rounded-lg disabled:opacity-30 transition-colors"><Redo2 className="w-4 h-4" /></button>
          <div className="w-px h-6 bg-white/[0.1] mx-1" />
          <button onClick={exportPNG} className="flex items-center gap-2 px-4 py-2 bg-red-600/10 border border-red-600/30 text-red-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-600/20 transition-colors"><Download className="w-4 h-4" /> Save Feed</button>
          <button onClick={toggleFullscreen} className="p-2 hover:bg-white/10 text-white rounded-lg transition-colors">{isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}</button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Toolbar */}
        <div className="w-16 bg-zinc-950 border-r border-white/[0.05] flex flex-col items-center py-4 gap-2 z-10 shadow-2xl overflow-y-auto scrollbar-none">
          {TOOLS.map((t) => (
            <button key={t.id} onClick={() => setTool(t.id)} title={`${t.label} (${t.shortcut})`}
              className={`relative w-10 h-10 rounded-xl flex items-center justify-center transition-all ${tool === t.id ? "bg-red-600/20 border border-red-600/50 text-red-500 shadow-[0_0_15px_rgba(220,38,38,0.3)]" : "text-zinc-500 border border-transparent hover:text-white hover:bg-white/[0.05]"}`}>
              <t.icon className="w-5 h-5" />
            </button>
          ))}
          <div className="w-8 h-px bg-white/[0.1] my-2" />
          <button onClick={clearCanvas} title="Purge Canvas" className="w-10 h-10 rounded-xl flex items-center justify-center text-red-500 border border-transparent hover:border-red-500/30 hover:bg-red-500/10 transition-colors">
            <Trash2 className="w-5 h-5" />
          </button>
        </div>

        {/* Canvas Workspace */}
        <div className="flex-1 flex flex-col min-w-0 relative">
          {/* Floating Properties Bar */}
          <div className="absolute top-4 left-4 z-20 flex gap-3">
            {tool !== "eraser" && tool !== "select" && tool !== "highlighter" && (
              <div className="flex items-center gap-2 bg-zinc-900/90 backdrop-blur-xl border border-white/[0.08] px-3 py-2 rounded-[1rem] shadow-2xl">
                {COLORS.map(c => (
                  <button key={c.hex} onClick={() => setColor(c.hex)} title={`Set color to ${c.label}`} aria-label={`Color ${c.label}`}
                    className={`w-6 h-6 rounded-full border-2 transition-transform ${color === c.hex ? "border-white scale-110 shadow-[0_0_10px_rgba(255,255,255,0.4)]" : "border-transparent opacity-50 hover:opacity-100"}`} 
                    style={{ backgroundColor: c.hex }} />
                ))}
              </div>
            )}
            
            {tool === "highlighter" && (
               <div className="flex items-center gap-2 bg-zinc-900/90 backdrop-blur-xl border border-white/[0.08] px-3 py-2 rounded-[1rem] shadow-2xl">
                {HIGHLIGHT_COLORS.map(c => (
                  <button key={c.hex} onClick={() => setHighlightColor(c.hex)} title={`Highlighter: ${c.label}`} aria-label={`Highlighter ${c.label}`}
                    className={`w-6 h-6 rounded-full border-2 transition-transform ${highlightColor === c.hex ? "border-white scale-110 shadow-[0_0_10px_rgba(255,255,255,0.4)]" : "border-transparent opacity-50 hover:opacity-100"}`} 
                    style={{ backgroundColor: c.hex }} />
                ))}
              </div>
            )}

            {tool !== "select" && tool !== "text" && tool !== "sticky" && (
              <div className="flex-1 px-4 py-3 bg-white/[0.03] border border-white/[0.05] rounded-xl flex items-center gap-3">
                <PenLine className="w-4 h-4 text-zinc-500" />
                <input type="range" min="1" max="25" value={strokeSize} onChange={(e) => setStrokeSize(parseInt(e.target.value))} title="Brush Size" aria-label="Adjust Brush Size" className="flex-1 accent-red-600 h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer" />
              </div>
            )}
          </div>

          <div ref={containerRef} className="flex-1 bg-[#09090b] relative w-full h-full cursor-crosshair">
            <canvas ref={canvasRef} className="w-full h-full block" />
            <div className="absolute bottom-4 right-4 text-[9px] font-black uppercase tracking-[0.2em] text-zinc-700 pointer-events-none">Subsystem Secure // E2E Encrypted</div>
          </div>
        </div>
      </div>
    </div>
  );
}
