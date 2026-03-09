"use client";

import { useRef, useCallback, useEffect, useState } from "react";

const WIDTH = 512;
const HEIGHT = 512;

const PALETTE = [
  "#000000",
  "#1a1a1a",
  "#c0392b",
  "#e74c3c",
  "#d35400",
  "#f39c12",
  "#27ae60",
  "#2ecc71",
  "#2980b9",
  "#3498db",
  "#8e44ad",
  "#9b59b6",
  "#795548",
  "#ffffff",
] as const;

const PEN_WIDTH = 4;
const ERASER_WIDTH = 24;

export type DrawCanvasRef = {
  canvas: HTMLCanvasElement | null;
  captureStream: (frameRate?: number) => MediaStream;
  clear: () => void;
};

type Point = { x: number; y: number };

type Tool = "pen" | "eraser";

export default function DrawCanvas({
  canvasRef,
  className,
  onFirstDraw,
}: {
  canvasRef: React.MutableRefObject<DrawCanvasRef | null>;
  className?: string;
  onFirstDraw?: () => void;
}) {
  const elRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const last = useRef<Point | null>(null);
  const firstDrawFired = useRef(false);

  const [tool, setTool] = useState<Tool>("pen");
  const [color, setColor] = useState<string>(PALETTE[0]);

  const getPoint = useCallback((e: React.MouseEvent | React.TouchEvent): Point | null => {
    const canvas = elRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if ("touches" in e) {
      if (e.touches.length === 0) return null;
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }, []);

  const applyToolToCtx = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      if (tool === "eraser") {
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = ERASER_WIDTH;
        ctx.globalCompositeOperation = "source-over";
      } else {
        ctx.strokeStyle = color;
        ctx.lineWidth = PEN_WIDTH;
        ctx.globalCompositeOperation = "source-over";
      }
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
    },
    [tool, color]
  );

  const draw = useCallback(
    (p: Point) => {
      const canvas = elRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      applyToolToCtx(ctx);
      if (last.current) {
        ctx.beginPath();
        ctx.moveTo(last.current.x, last.current.y);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();
      }
      last.current = p;
    },
    [applyToolToCtx]
  );

  const startDraw = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      e.preventDefault();
      const p = getPoint(e);
      if (p) {
        if (!firstDrawFired.current && onFirstDraw) {
          firstDrawFired.current = true;
          onFirstDraw();
        }
        drawing.current = true;
        last.current = p;
      }
    },
    [getPoint, onFirstDraw]
  );

  const moveDraw = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      e.preventDefault();
      if (!drawing.current) return;
      const p = getPoint(e);
      if (p) draw(p);
    },
    [getPoint, draw]
  );

  const endDraw = useCallback(() => {
    drawing.current = false;
    last.current = null;
  }, []);

  const clear = useCallback(() => {
    const canvas = elRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // Canvas is the stream source — next captured frame is the clear (white) image for the AI.
  }, []);

  useEffect(() => {
    const canvas = elRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.width = WIDTH;
    canvas.height = HEIGHT;
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
  }, []);

  useEffect(() => {
    const c = elRef.current;
    if (!c) return;
    canvasRef.current = {
      get canvas() {
        return elRef.current;
      },
      captureStream: (frameRate = 30) => {
        const canvas = elRef.current;
        if (!canvas) throw new Error("Canvas not mounted");
        return canvas.captureStream(frameRate);
      },
      clear,
    };
    return () => {
      canvasRef.current = null;
    };
  }, [canvasRef, clear]);

  useEffect(() => {
    const canvas = elRef.current;
    if (!canvas) return;
    const onTouchEnd = () => endDraw();
    window.addEventListener("touchend", onTouchEnd);
    window.addEventListener("touchcancel", onTouchEnd);
    return () => {
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("touchcancel", onTouchEnd);
    };
  }, [endDraw]);

  const cursor = tool === "eraser" ? "cell" : "crosshair";

  return (
    <div className="draw-canvas-wrap">
      <canvas
        ref={elRef}
        className={className}
        onMouseDown={startDraw}
        onMouseMove={moveDraw}
        onMouseUp={endDraw}
        onMouseLeave={endDraw}
        onTouchStart={startDraw}
        onTouchMove={moveDraw}
        style={{ touchAction: "none", cursor }}
      />
      <div className="draw-canvas-toolbar">
        <div className="draw-canvas-tools" role="group" aria-label="Drawing tool">
          <button
            type="button"
            className={`draw-tool-btn ${tool === "pen" ? "draw-tool-btn-active" : ""}`}
            onClick={() => setTool("pen")}
            title="Pen"
            aria-pressed={tool === "pen"}
          >
            Pen
          </button>
          <button
            type="button"
            className={`draw-tool-btn ${tool === "eraser" ? "draw-tool-btn-active" : ""}`}
            onClick={() => setTool("eraser")}
            title="Eraser"
            aria-pressed={tool === "eraser"}
          >
            Eraser
          </button>
        </div>
        <div className="draw-canvas-palette" role="group" aria-label="Color palette">
          {PALETTE.map((c) => (
            <button
              key={c}
              type="button"
              className={`draw-swatch ${color === c && tool === "pen" ? "draw-swatch-active" : ""}`}
              style={{ backgroundColor: c }}
              onClick={() => {
                setColor(c);
                setTool("pen");
              }}
              title={c}
              aria-label={`Color ${c}`}
              aria-pressed={color === c && tool === "pen"}
            />
          ))}
        </div>
        <div className="draw-canvas-custom-color">
          <label className="draw-color-label">
            <span className="draw-color-label-text">Custom</span>
            <input
              type="color"
              value={color}
              onChange={(e) => {
                setColor(e.target.value);
                setTool("pen");
              }}
              className="draw-color-input"
              title="Pick a color"
            />
          </label>
        </div>
        <button
          type="button"
          onClick={clear}
          className="draw-canvas-clear"
          title="Clear all — sends clear image to stream"
        >
          Clear All
        </button>
      </div>
    </div>
  );
}
