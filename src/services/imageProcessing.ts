export interface CropBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type AspectRatioType = 'free' | 'original' | '1:1' | '4:5' | '16:9' | '9:16';

export type FilterCategory =
  | 'original'
  | 'natural'
  | 'portrait'
  | 'cinematic'
  | 'vintage'
  | 'warm'
  | 'cool'
  | 'black_white'
  | 'dramatic';

export type EffectKind =
  | 'none'
  | 'glow'
  | 'grain'
  | 'vignette'
  | 'light_leak'
  | 'noise'
  | 'color_overlay';

export type FrameKind = 'none' | 'simple' | 'modern' | 'classic' | 'polaroid' | 'social';

export interface TextOverlay {
  id: string;
  text: string;
  x: number; // percentage 0 - 100
  y: number; // percentage 0 - 100
  fontSize: number;
  color: string;
  isBold: boolean;
  isItalic: boolean;
  hasBackground: boolean;
  backgroundColor: string;
  rotation: number;
}

export interface StickerOverlay {
  id: string;
  symbol: string;
  x: number; // percentage 0 - 100
  y: number; // percentage 0 - 100
  scale: number;
  rotation: number;
}

export interface DrawPoint {
  x: number;
  y: number;
}

export interface DrawStroke {
  points: DrawPoint[];
  color: string;
  size: number;
  isEraser: boolean;
}

export interface EditorSettings {
  cropBox: CropBox | null;
  aspectRatio: AspectRatioType;
  rotation: number; // degrees: 0, 90, 180, 270
  flipH: boolean;
  flipV: boolean;

  // Sliders: -100 to +100
  brightness: number;
  contrast: number;
  saturation: number;
  exposure: number;
  highlights: number;
  shadows: number;
  temperature: number;
  sharpness: number;
  blur: number;

  filter: FilterCategory;
  filterIntensity: number; // 0 to 1

  effect: EffectKind;
  effectIntensity: number; // 0 to 1

  frame: FrameKind;
  frameThickness: number;

  textLayers: TextOverlay[];
  stickers: StickerOverlay[];
  drawStrokes: DrawStroke[];
}

export const defaultEditorSettings: EditorSettings = {
  cropBox: null,
  aspectRatio: 'original',
  rotation: 0,
  flipH: false,
  flipV: false,
  brightness: 0,
  contrast: 0,
  saturation: 0,
  exposure: 0,
  highlights: 0,
  shadows: 0,
  temperature: 0,
  sharpness: 0,
  blur: 0,
  filter: 'original',
  filterIntensity: 1,
  effect: 'none',
  effectIntensity: 0.6,
  frame: 'none',
  frameThickness: 16,
  textLayers: [],
  stickers: [],
  drawStrokes: []
};

/**
 * Apply real pixel filters and adjustments on an HTML Canvas
 */
export const renderEditedCanvas = (
  sourceImg: HTMLImageElement,
  settings: EditorSettings,
  targetCanvas: HTMLCanvasElement,
  maxDimension?: number
) => {
  // Determine base dimensions
  let srcW = sourceImg.naturalWidth || sourceImg.width;
  let srcH = sourceImg.naturalHeight || sourceImg.height;

  // Rotation swap dimensions
  const isRotated90or270 = settings.rotation === 90 || settings.rotation === 270;
  let canvasW = isRotated90or270 ? srcH : srcW;
  let canvasH = isRotated90or270 ? srcW : srcH;

  // Crop calculation
  let cropX = 0;
  let cropY = 0;
  let cropW = canvasW;
  let cropH = canvasH;

  if (settings.cropBox) {
    cropX = Math.max(0, settings.cropBox.x * canvasW);
    cropY = Math.max(0, settings.cropBox.y * canvasH);
    cropW = Math.max(10, settings.cropBox.width * canvasW);
    cropH = Math.max(10, settings.cropBox.height * canvasH);
  }

  // Dimension scaling if maxDimension specified (e.g. 1080p, 2K, 4K)
  let finalW = cropW;
  let finalH = cropH;
  if (maxDimension) {
    const curMax = Math.max(cropW, cropH);
    if (curMax > maxDimension) {
      const scale = maxDimension / curMax;
      finalW = Math.round(cropW * scale);
      finalH = Math.round(cropH * scale);
    }
  }

  targetCanvas.width = finalW;
  targetCanvas.height = finalH;

  const ctx = targetCanvas.getContext('2d');
  if (!ctx) return;

  ctx.save();

  // Create temporary canvas to hold rotated & flipped base
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = canvasW;
  tempCanvas.height = canvasH;
  const tempCtx = tempCanvas.getContext('2d');
  if (!tempCtx) return;

  tempCtx.save();
  tempCtx.translate(canvasW / 2, canvasH / 2);
  tempCtx.rotate((settings.rotation * Math.PI) / 180);
  tempCtx.scale(settings.flipH ? -1 : 1, settings.flipV ? -1 : 1);
  tempCtx.drawImage(sourceImg, -srcW / 2, -srcH / 2, srcW, srcH);
  tempCtx.restore();

  // Draw the cropped region onto final canvas
  ctx.drawImage(tempCanvas, cropX, cropY, cropW, cropH, 0, 0, finalW, finalH);

  // Apply CSS / Canvas Filter adjustments
  const bVal = 100 + settings.brightness + settings.exposure * 0.5;
  const cVal = 100 + settings.contrast;
  const sVal = 100 + settings.saturation;
  const blurVal = Math.max(0, settings.blur * 0.2);

  // Pixel manipulation for fine temperature, filters, and effects
  const imgData = ctx.getImageData(0, 0, finalW, finalH);
  const data = imgData.data;
  const tempShift = settings.temperature * 1.2;
  const hiShift = settings.highlights * 0.5;
  const shShift = settings.shadows * 0.5;

  const filterMatrix = getFilterRGBMultipliers(settings.filter);
  const intensity = settings.filterIntensity;

  for (let i = 0; i < data.length; i += 4) {
    let r = data[i];
    let g = data[i + 1];
    let b = data[i + 2];

    // Contrast & Brightness adjustment
    r = (r - 128) * (cVal / 100) + 128 + (bVal - 100) * 1.2;
    g = (g - 128) * (cVal / 100) + 128 + (bVal - 100) * 1.2;
    b = (b - 128) * (cVal / 100) + 128 + (bVal - 100) * 1.2;

    // Saturation adjustment
    const gray = 0.299 * r + 0.587 * g + 0.114 * b;
    r = gray + (r - gray) * (sVal / 100);
    g = gray + (g - gray) * (sVal / 100);
    b = gray + (b - gray) * (sVal / 100);

    // Temperature (Red warmer, Blue cooler)
    r += tempShift;
    b -= tempShift;

    // Highlights & Shadows
    const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    if (lum > 128) {
      r += hiShift;
      g += hiShift;
      b += hiShift;
    } else {
      r += shShift;
      g += shShift;
      b += shShift;
    }

    // Filter RGB transformation
    if (settings.filter !== 'original') {
      const origR = r,
        origG = g,
        origB = b;
      let targetR = r * filterMatrix.r + g * filterMatrix.gr + b * filterMatrix.br + filterMatrix.offsetR;
      let targetG = r * filterMatrix.rg + g * filterMatrix.g + b * filterMatrix.bg + filterMatrix.offsetG;
      let targetB = r * filterMatrix.rb + g * filterMatrix.gb + b * filterMatrix.b + filterMatrix.offsetB;

      if (settings.filter === 'black_white') {
        const bw = 0.299 * targetR + 0.587 * targetG + 0.114 * targetB;
        targetR = bw;
        targetG = bw;
        targetB = bw;
      }

      r = origR + (targetR - origR) * intensity;
      g = origG + (targetG - origG) * intensity;
      b = origB + (targetB - origB) * intensity;
    }

    data[i] = Math.min(255, Math.max(0, r));
    data[i + 1] = Math.min(255, Math.max(0, g));
    data[i + 2] = Math.min(255, Math.max(0, b));
  }

  ctx.putImageData(imgData, 0, 0);

  // Apply Special Effects
  applyEffects(ctx, finalW, finalH, settings.effect, settings.effectIntensity);

  // Render Drawings
  renderDrawingStrokes(ctx, finalW, finalH, settings.drawStrokes);

  // Render Stickers
  renderStickers(ctx, finalW, finalH, settings.stickers);

  // Render Text Layers
  renderTextLayers(ctx, finalW, finalH, settings.textLayers);

  // Render Frame
  renderFrameBorder(ctx, finalW, finalH, settings.frame, settings.frameThickness);

  ctx.restore();
};

function getFilterRGBMultipliers(filter: FilterCategory) {
  switch (filter) {
    case 'natural':
      return { r: 1.08, gr: 0, br: 0, rg: 0, g: 1.03, bg: 0, rb: 0, gb: 0, b: 0.96, offsetR: 5, offsetG: 3, offsetB: 0 };
    case 'portrait':
      return { r: 1.12, gr: 0.02, br: 0, rg: 0, g: 1.02, bg: 0, rb: 0, gb: 0, b: 0.92, offsetR: 8, offsetG: 4, offsetB: 2 };
    case 'cinematic':
      return { r: 1.15, gr: 0.05, br: 0, rg: 0, g: 1.05, bg: 0.05, rb: 0.05, gb: 0.1, b: 1.25, offsetR: 6, offsetG: 0, offsetB: 14 };
    case 'vintage':
      return { r: 1.2, gr: 0.1, br: 0, rg: 0.1, g: 1.05, bg: 0.05, rb: 0, gb: 0.1, b: 0.8, offsetR: 18, offsetG: 12, offsetB: 4 };
    case 'warm':
      return { r: 1.22, gr: 0, br: 0, rg: 0, g: 1.04, bg: 0, rb: 0, gb: 0, b: 0.82, offsetR: 16, offsetG: 6, offsetB: -8 };
    case 'cool':
      return { r: 0.88, gr: 0, br: 0, rg: 0, g: 0.98, bg: 0, rb: 0, gb: 0, b: 1.28, offsetR: -8, offsetG: 0, offsetB: 20 };
    case 'black_white':
      return { r: 1.1, gr: 0, br: 0, rg: 0, g: 1.1, bg: 0, rb: 0, gb: 0, b: 1.1, offsetR: -5, offsetG: -5, offsetB: -5 };
    case 'dramatic':
      return { r: 1.35, gr: 0, br: 0, rg: 0, g: 1.3, bg: 0, rb: 0, gb: 0, b: 1.4, offsetR: -25, offsetG: -25, offsetB: -20 };
    default:
      return { r: 1, gr: 0, br: 0, rg: 0, g: 1, bg: 0, rb: 0, gb: 0, b: 1, offsetR: 0, offsetG: 0, offsetB: 0 };
  }
}

function applyEffects(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  effect: EffectKind,
  intensity: number
) {
  if (effect === 'vignette') {
    const radius = Math.max(w, h) * 0.75;
    const grad = ctx.createRadialGradient(w / 2, h / 2, radius * 0.35, w / 2, h / 2, radius);
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(1, `rgba(0,0,0,${intensity * 0.85})`);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
  } else if (effect === 'light_leak') {
    const grad = ctx.createRadialGradient(0, 0, 10, 0, 0, Math.max(w, h) * 0.8);
    grad.addColorStop(0, `rgba(255, 140, 50, ${intensity * 0.7})`);
    grad.addColorStop(0.5, `rgba(255, 60, 120, ${intensity * 0.35})`);
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
  } else if (effect === 'glow') {
    ctx.fillStyle = `rgba(255, 255, 255, ${intensity * 0.25})`;
    ctx.globalCompositeOperation = 'screen';
    ctx.fillRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'source-over';
  } else if (effect === 'grain' || effect === 'noise') {
    const noiseData = ctx.getImageData(0, 0, w, h);
    const d = noiseData.data;
    const amount = intensity * 45;
    for (let i = 0; i < d.length; i += 4) {
      const n = (Math.random() - 0.5) * amount;
      d[i] += n;
      d[i + 1] += n;
      d[i + 2] += n;
    }
    ctx.putImageData(noiseData, 0, 0);
  } else if (effect === 'color_overlay') {
    ctx.fillStyle = `rgba(99, 102, 241, ${intensity * 0.3})`;
    ctx.fillRect(0, 0, w, h);
  }
}

function renderDrawingStrokes(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  strokes: DrawStroke[]
) {
  strokes.forEach((stroke) => {
    if (stroke.points.length < 2) return;
    ctx.save();
    ctx.strokeStyle = stroke.isEraser ? '#000000' : stroke.color;
    ctx.lineWidth = stroke.size * (w / 500);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    if (stroke.isEraser) {
      ctx.globalCompositeOperation = 'destination-out';
    }

    ctx.beginPath();
    const first = stroke.points[0];
    ctx.moveTo((first.x / 100) * w, (first.y / 100) * h);
    for (let i = 1; i < stroke.points.length; i++) {
      const pt = stroke.points[i];
      ctx.lineTo((pt.x / 100) * w, (pt.y / 100) * h);
    }
    ctx.stroke();
    ctx.restore();
  });
}

function renderStickers(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  stickers: StickerOverlay[]
) {
  stickers.forEach((sticker) => {
    ctx.save();
    const cx = (sticker.x / 100) * w;
    const cy = (sticker.y / 100) * h;
    ctx.translate(cx, cy);
    ctx.rotate((sticker.rotation * Math.PI) / 180);
    const size = Math.round(48 * sticker.scale * (w / 400));
    ctx.font = `${size}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(sticker.symbol, 0, 0);
    ctx.restore();
  });
}

function renderTextLayers(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  layers: TextOverlay[]
) {
  layers.forEach((layer) => {
    ctx.save();
    const cx = (layer.x / 100) * w;
    const cy = (layer.y / 100) * h;
    ctx.translate(cx, cy);
    ctx.rotate((layer.rotation * Math.PI) / 180);

    const scaledSize = Math.max(12, Math.round(layer.fontSize * (w / 400)));
    const fontStyle = `${layer.isItalic ? 'italic ' : ''}${layer.isBold ? 'bold ' : ''}${scaledSize}px sans-serif`;
    ctx.font = fontStyle;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    if (layer.hasBackground) {
      const metrics = ctx.measureText(layer.text);
      const pad = 12;
      const bgW = metrics.width + pad * 2;
      const bgH = scaledSize * 1.4;
      ctx.fillStyle = layer.backgroundColor || 'rgba(0, 0, 0, 0.7)';
      ctx.beginPath();
      ctx.roundRect(-bgW / 2, -bgH / 2, bgW, bgH, 8);
      ctx.fill();
    }

    ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
    ctx.shadowBlur = 8;
    ctx.fillStyle = layer.color;
    ctx.fillText(layer.text, 0, 0);

    ctx.restore();
  });
}

function renderFrameBorder(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  frame: FrameKind,
  thickness: number
) {
  if (frame === 'none') return;
  const scaledThick = Math.max(4, thickness * (w / 500));

  if (frame === 'simple') {
    ctx.lineWidth = scaledThick;
    ctx.strokeStyle = '#FFFFFF';
    ctx.strokeRect(scaledThick / 2, scaledThick / 2, w - scaledThick, h - scaledThick);
  } else if (frame === 'modern') {
    const pad = scaledThick * 1.5;
    ctx.lineWidth = scaledThick * 0.8;
    ctx.strokeStyle = '#000000';
    ctx.strokeRect(pad, pad, w - pad * 2, h - pad * 2);
  } else if (frame === 'polaroid') {
    ctx.fillStyle = '#FFFFFF';
    const top = h * 0.05;
    const bot = h * 0.16;
    const side = w * 0.05;
    ctx.fillRect(0, 0, w, top);
    ctx.fillRect(0, h - bot, w, bot);
    ctx.fillRect(0, 0, side, h);
    ctx.fillRect(w - side, 0, side, h);
  } else if (frame === 'classic') {
    ctx.lineWidth = scaledThick;
    ctx.strokeStyle = '#D4AF37'; // gold
    ctx.strokeRect(scaledThick / 2, scaledThick / 2, w - scaledThick, h - scaledThick);
  } else if (frame === 'social') {
    ctx.lineWidth = scaledThick;
    ctx.strokeStyle = '#6366F1'; // indigo
    ctx.strokeRect(scaledThick / 2, scaledThick / 2, w - scaledThick, h - scaledThick);
  }
}
