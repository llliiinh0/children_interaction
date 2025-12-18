import React, { useRef, useEffect, useState, useCallback } from 'react';
import './DrawingCanvas.css';

interface DrawingCanvasProps {
  onDrawingComplete: (canvasData: string) => void;
}

const COLORS = ['#000000', '#FF0000', '#FFFF00', '#90EE90', '#006400', '#0000FF', '#800080'];
const DEFAULT_COLOR = COLORS[0];
const DEFAULT_BRUSH_SIZE = 5;

export const DrawingCanvas: React.FC<DrawingCanvasProps> = ({ 
  onDrawingComplete
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [selectedColor, setSelectedColor] = useState(DEFAULT_COLOR);
  const [brushSize, setBrushSize] = useState(DEFAULT_BRUSH_SIZE);
  const [isEraserMode, setIsEraserMode] = useState(false);

  const isDrawingRef = useRef(false);
  const lastPosRef = useRef<{ x: number; y: number } | null>(null);
  const currentColorRef = useRef(DEFAULT_COLOR);
  const currentBrushSizeRef = useRef(DEFAULT_BRUSH_SIZE);
  const isEraserRef = useRef(false);

  // Initialize canvas and pointer events ONCE
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 根据实际渲染尺寸自适应画布大小，避免手机端坐标错位
    const rect = canvas.getBoundingClientRect();
    const width = rect.width || 800;
    const height = rect.height || 500;
    const dpr = window.devicePixelRatio || 1;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr); // 逻辑坐标仍然按 CSS 像素计算

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    const getPos = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    };

    const handlePointerDown = (e: PointerEvent) => {
      e.preventDefault();
      const pos = getPos(e);
      isDrawingRef.current = true;
      lastPosRef.current = pos;
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (!isDrawingRef.current || !lastPosRef.current) return;
      e.preventDefault();
      const pos = getPos(e);

      ctx.strokeStyle = isEraserRef.current ? '#ffffff' : currentColorRef.current;
      ctx.lineWidth = currentBrushSizeRef.current;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      ctx.beginPath();
      ctx.moveTo(lastPosRef.current.x, lastPosRef.current.y);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();

      lastPosRef.current = pos;
    };

    const handlePointerUp = (e: PointerEvent) => {
      e.preventDefault();
      isDrawingRef.current = false;
      lastPosRef.current = null;
    };

    canvas.addEventListener('pointerdown', handlePointerDown);
    canvas.addEventListener('pointermove', handlePointerMove);
    canvas.addEventListener('pointerup', handlePointerUp);
    canvas.addEventListener('pointerleave', handlePointerUp);

    return () => {
      canvas.removeEventListener('pointerdown', handlePointerDown);
      canvas.removeEventListener('pointermove', handlePointerMove);
      canvas.removeEventListener('pointerup', handlePointerUp);
      canvas.removeEventListener('pointerleave', handlePointerUp);
    };
  }, []);

  // Keep refs in sync with latest UI state (used by drawing handlers)
  useEffect(() => {
    currentColorRef.current = selectedColor;
  }, [selectedColor]);

  useEffect(() => {
    currentBrushSizeRef.current = brushSize;
  }, [brushSize]);

  useEffect(() => {
    isEraserRef.current = isEraserMode;
  }, [isEraserMode]);

  const handleColorSelect = (color: string) => {
    setSelectedColor(color);
    setIsEraserMode(false);
  };

  const handleBrushSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBrushSize(Number(e.target.value));
  };

  const handleEraserClick = () => {
    setIsEraserMode(!isEraserMode);
  };

  const handleDone = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dataURL = canvas.toDataURL('image/png');
    const base64Data = dataURL.split(',')[1];
    onDrawingComplete(base64Data);
  }, [onDrawingComplete]);

  return (
    <div className="drawing-canvas-container">
      <div className="canvas-header">
        <h2>
          <span className="star-icon">⭐</span>
          Magic Story Canvas
        </h2>
      </div>
      
      <div className="canvas-wrapper">
        <canvas ref={canvasRef} className="drawing-canvas" />
      </div>
      
      <div className="drawing-tools">
        <div className="color-palette">
          {COLORS.map((color) => (
            <button
              key={color}
              className={`color-swatch ${selectedColor === color && !isEraserMode ? 'selected' : ''}`}
              style={{ backgroundColor: color }}
              onClick={() => handleColorSelect(color)}
              title={color}
            />
          ))}
        </div>
        
        <div className="brush-controls">
          <label className="brush-size-label">
            Brush Size
            <input
              type="range"
              min="1"
              max="20"
              value={brushSize}
              onChange={handleBrushSizeChange}
              className="brush-size-slider"
            />
            <span className="brush-size-value">{brushSize}</span>
          </label>
        </div>
        <button
          className={`eraser-button ${isEraserMode ? 'active' : ''}`}
          onClick={handleEraserClick}
        >
          Eraser
        </button>
        <button className="done-button" onClick={handleDone}>
          <span className="star-icon">⭐</span>
          {"I'm Done!"}
        </button>
      </div>
    </div>
  );
};


