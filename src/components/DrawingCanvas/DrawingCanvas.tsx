import React, { useRef, useEffect, useState, useCallback } from 'react';
import { fabric } from 'fabric';
import './DrawingCanvas.css';

interface DrawingCanvasProps {
  onDrawingComplete: (canvasData: string) => void;
  onDrawingUpdate?: (canvasData: string) => void;
  hasExistingDrawing?: boolean;
}

const COLORS = ['#000000', '#FF0000', '#FFFF00', '#90EE90', '#006400', '#0000FF', '#800080'];
const DEFAULT_COLOR = COLORS[0];
const DEFAULT_BRUSH_SIZE = 5;

export const DrawingCanvas: React.FC<DrawingCanvasProps> = ({ 
  onDrawingComplete, 
  onDrawingUpdate,
  hasExistingDrawing = false 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null);
  const [selectedColor, setSelectedColor] = useState(DEFAULT_COLOR);
  const [brushSize, setBrushSize] = useState(DEFAULT_BRUSH_SIZE);
  const [isEraserMode, setIsEraserMode] = useState(false);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = new fabric.Canvas(canvasRef.current, {
      width: 800,
      height: 600,
      backgroundColor: '#ffffff',
      isDrawingMode: true,
    });

    // Set up brush
    canvas.freeDrawingBrush.color = selectedColor;
    canvas.freeDrawingBrush.width = brushSize;

    fabricCanvasRef.current = canvas;

    return () => {
      canvas.dispose();
    };
  }, []);

  // Update brush settings
  useEffect(() => {
    if (!fabricCanvasRef.current) return;
    
    if (isEraserMode) {
      // Use EraserBrush for erasing
      try {
        // Check if EraserBrush is available
        if (fabric.EraserBrush) {
          fabricCanvasRef.current.freeDrawingBrush = new fabric.EraserBrush(fabricCanvasRef.current);
          fabricCanvasRef.current.freeDrawingBrush.width = brushSize;
        } else {
          // If EraserBrush is not available, use background color brush to simulate erasing
          fabricCanvasRef.current.freeDrawingBrush = new fabric.PencilBrush(fabricCanvasRef.current);
          (fabricCanvasRef.current.freeDrawingBrush as fabric.PencilBrush).color = '#ffffff';
          fabricCanvasRef.current.freeDrawingBrush.width = brushSize;
        }
      } catch (error) {
        // Fallback: use white brush to simulate erasing
        console.warn('EraserBrush not available, using white brush to simulate erasing', error);
        fabricCanvasRef.current.freeDrawingBrush = new fabric.PencilBrush(fabricCanvasRef.current);
        (fabricCanvasRef.current.freeDrawingBrush as fabric.PencilBrush).color = '#ffffff';
        fabricCanvasRef.current.freeDrawingBrush.width = brushSize;
      }
    } else {
      fabricCanvasRef.current.freeDrawingBrush = new fabric.PencilBrush(fabricCanvasRef.current);
      fabricCanvasRef.current.freeDrawingBrush.color = selectedColor;
      fabricCanvasRef.current.freeDrawingBrush.width = brushSize;
    }
    fabricCanvasRef.current.isDrawingMode = true;
  }, [selectedColor, brushSize, isEraserMode]);

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
    if (!fabricCanvasRef.current) return;
    
    // Convert canvas to Base64 image
    const dataURL = fabricCanvasRef.current.toDataURL({
      format: 'png',
      quality: 1.0
    });
    
    // Extract Base64 data (remove data:image/png;base64, prefix)
    const base64Data = dataURL.split(',')[1];
    
    onDrawingComplete(base64Data);
  }, [onDrawingComplete]);

  const handleUpdate = useCallback(() => {
    if (!fabricCanvasRef.current || !onDrawingUpdate) return;
    
    // Convert canvas to Base64 image
    const dataURL = fabricCanvasRef.current.toDataURL({
      format: 'png',
      quality: 1.0
    });
    
    // Extract Base64 data (remove data:image/png;base64, prefix)
    const base64Data = dataURL.split(',')[1];
    
    onDrawingUpdate(base64Data);
  }, [onDrawingUpdate]);

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
        
        {hasExistingDrawing && onDrawingUpdate && (
          <button className="update-button" onClick={handleUpdate}>
            <span className="star-icon">✨</span>
            Update Drawing
          </button>
        )}
        <button className="done-button" onClick={handleDone}>
          <span className="star-icon">⭐</span>
          {hasExistingDrawing ? 'Save Drawing' : "I'm Done!"}
        </button>
      </div>
    </div>
  );
};

