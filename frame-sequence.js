/**
 * FISIOMED - Frame Sequence Canvas Renderer (Módulo Base Común)
 * 
 * Gestiona el dibujado fluido de secuencias de frames en un <canvas>
 * con ajuste 'cover' proporcional, soporte retina DPR y caché de imágenes.
 */
export class FrameSequence {
  constructor(canvas, options = {}) {
    this.canvas = canvas;
    this.ctx = canvas ? canvas.getContext('2d', { alpha: false }) : null;
    this.totalFrames = options.totalFrames || 0;
    this.framePattern = options.framePattern || ((i) => '');
    this.frames = new Array(this.totalFrames);
    this.renderedIndex = -1;
    this.lastDrawnIndex = -1;
    this.onResize = options.onResize || null;

    if (this.canvas) {
      this.initResize();
    }
  }

  initResize() {
    this.resizeHandler = () => {
      if (!this.canvas) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = this.canvas.getBoundingClientRect();
      const targetW = Math.round(rect.width * dpr);
      const targetH = Math.round(rect.height * dpr);

      if (this.canvas.width !== targetW || this.canvas.height !== targetH) {
        this.canvas.width = targetW;
        this.canvas.height = targetH;
        this.renderedIndex = -1;
        if (this.lastDrawnIndex >= 0) {
          this.drawFrameByIndex(this.lastDrawnIndex);
        }
      }
      if (this.onResize) this.onResize();
    };

    window.addEventListener('resize', this.resizeHandler, { passive: true });
    window.addEventListener('orientationchange', this.resizeHandler, { passive: true });
    this.resizeHandler();
  }

  drawFrame(img) {
    if (!this.ctx || !this.canvas || !img || !img.complete) return;

    const cw = this.canvas.width;
    const ch = this.canvas.height;
    const iw = img.naturalWidth || 1280;
    const ih = img.naturalHeight || 720;

    // Cover proporcional centrado
    const scale = Math.max(cw / iw, ch / ih);
    const nw = iw * scale;
    const nh = ih * scale;
    const nx = (cw - nw) / 2;
    const ny = (ch - nh) / 2;

    this.ctx.drawImage(img, nx, ny, nw, nh);
  }

  drawFrameByIndex(index) {
    if (!this.canvas || !this.ctx) return;
    const idx = Math.min(Math.max(index, 0), this.totalFrames - 1);
    this.lastDrawnIndex = idx;

    // Si las dimensiones del canvas son 0, intentar recalcularlas
    if (this.canvas.width === 0 || this.canvas.height === 0) {
      this.resizeHandler();
    }

    let img = this.frames[idx];

    // Fallback al frame disponible más cercano si el índice exacto no ha terminado de cargar
    if (!img || !img.complete) {
      for (let i = idx; i >= 0; i--) {
        if (this.frames[i] && this.frames[i].complete) { img = this.frames[i]; break; }
      }
      if (!img || !img.complete) {
        for (let i = idx + 1; i < this.totalFrames; i++) {
          if (this.frames[i] && this.frames[i].complete) { img = this.frames[i]; break; }
        }
      }
    }

    if (img && img.complete) {
      this.drawFrame(img);
      this.renderedIndex = idx;
    }
  }

  destroy() {
    if (this.resizeHandler) {
      window.removeEventListener('resize', this.resizeHandler);
      window.removeEventListener('orientationchange', this.resizeHandler);
    }
    this.frames = [];
  }
}
