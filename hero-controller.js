/**
 * FISIOMED - Hero Canvas Controller
 * 
 * Funcionalidad:
 * 1. Renderiza los 80 frames sobre un <canvas> mediante cover proporcional y devicePixelRatio.
 * 2. Carga primero el frame 0 y lo dibuja instantáneamente.
 * 3. Carga el resto progresivamente en segundo plano, alimentando el preloader con barra dorada.
 * 4. Controla la animación sincronizada mediante GSAP ScrollTrigger con pin.
 * 5. Altura de scroll configurable centralizadamente.
 * 6. Respeta prefers-reduced-motion con fallback estático inmediato.
 */

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export class HeroCanvasController {
  constructor(options = {}) {
    this.canvas = document.getElementById(options.canvasId || 'hero-canvas');
    if (!this.canvas) return;

    this.ctx = this.canvas.getContext('2d', { alpha: false });
    this.preloader = document.getElementById('hero-preloader');
    this.progressBar = document.getElementById('preloader-progress-bar');
    this.progressStatus = document.getElementById('preloader-status');

    // Configuración Centralizada — un único lugar para ajustar el comportamiento
    this.config = {
      totalFrames: 80,
      framePattern: (i) => `/hero/Camera_moving_toward_treatment_bed_20261003132308_${String(i).padStart(3, '0')}.jpg`,
      minFramesForStart: 12,      // Muestra la web antes de cargar el 100%
      scrollHeightDesktop: '380vh',
      scrollHeightMobile: '320vh',
      scrubSmoothing: 0.8,
      ...options
    };

    this.frames = new Array(this.config.totalFrames);
    this.loadedCount = 0;
    this.currentFrameIndex = 0;
    this.renderedFrameIndex = -1;
    this.isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.isReady = false;

    this.init();
  }

  init() {
    this.applyScrollHeights();
    this.setupResizeHandler();

    if (this.isReducedMotion) {
      this.handleReducedMotion();
      return;
    }

    // 1. Cargar el frame 0 de inmediato y pintarlo
    this.loadFirstFrame(() => {
      // 2. Iniciar la precarga en segundo plano por lotes
      this.loadRemainingFrames();
      // 3. Configurar el ScrollTrigger con GSAP
      this.setupScrollTrigger();
    });
  }

  applyScrollHeights() {
    const container = document.querySelector('.hero-scroll-container');
    if (!container) return;
    container.style.setProperty('--hero-scroll-height', this.config.scrollHeightDesktop);
    container.style.setProperty('--hero-scroll-height-mobile', this.config.scrollHeightMobile);
  }

  setupResizeHandler() {
    const resizeCanvas = () => {
      if (!this.canvas) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = this.canvas.getBoundingClientRect();
      const targetW = Math.round(rect.width * dpr);
      const targetH = Math.round(rect.height * dpr);

      if (this.canvas.width !== targetW || this.canvas.height !== targetH) {
        this.canvas.width = targetW;
        this.canvas.height = targetH;
        this.renderedFrameIndex = -1;
        this.drawCurrentFrame();
      }
    };

    window.addEventListener('resize', resizeCanvas, { passive: true });
    window.addEventListener('orientationchange', resizeCanvas, { passive: true });
    resizeCanvas();
    this.resizeCanvas = resizeCanvas;
  }

  loadFirstFrame(callback) {
    const img = new Image();
    img.src = this.config.framePattern(0);
    img.onload = () => {
      this.frames[0] = img;
      this.loadedCount++;
      this.resizeCanvas();
      this.drawFrame(img);
      this.updateProgress(1);
      if (callback) callback();
    };
    img.onerror = () => {
      console.warn('Error al cargar el frame inicial.');
      if (callback) callback();
    };
  }

  loadRemainingFrames() {
    let loaded = 1;
    const total = this.config.totalFrames;

    for (let i = 1; i < total; i++) {
      const img = new Image();
      const idx = i; // Captura por valor
      img.src = this.config.framePattern(idx);
      img.onload = () => {
        this.frames[idx] = img;
        this.loadedCount++;
        loaded++;
        const percent = Math.round((loaded / total) * 100);
        this.updateProgress(percent);

        if (loaded >= this.config.minFramesForStart && !this.isReady) {
          this.isReady = true;
          this.dismissPreloader();
        }
        if (loaded >= total) {
          this.dismissPreloader();
        }
      };
      img.onerror = () => {
        loaded++;
        if (loaded >= this.config.minFramesForStart && !this.isReady) {
          this.isReady = true;
          this.dismissPreloader();
        }
      };
    }
  }

  updateProgress(percent) {
    if (this.progressBar) this.progressBar.style.width = `${percent}%`;
    if (this.progressStatus) this.progressStatus.textContent = `${percent}%`;
  }

  dismissPreloader() {
    if (!this.preloader) return;
    this.preloader.classList.add('loaded');
    setTimeout(() => {
      if (this.preloader && this.preloader.parentNode) {
        this.preloader.style.display = 'none';
      }
    }, 900);
  }

  drawFrame(img) {
    if (!this.ctx || !this.canvas || !img || !img.complete) return;

    const cw = this.canvas.width;
    const ch = this.canvas.height;
    const iw = img.naturalWidth || 1280;
    const ih = img.naturalHeight || 720;

    // Efecto "Cover" proporcional
    const scale = Math.max(cw / iw, ch / ih);
    const nw = iw * scale;
    const nh = ih * scale;
    const nx = (cw - nw) / 2;
    const ny = (ch - nh) / 2;

    this.ctx.drawImage(img, nx, ny, nw, nh);
  }

  drawCurrentFrame() {
    let targetIndex = Math.min(Math.max(this.currentFrameIndex, 0), this.config.totalFrames - 1);

    // Si el frame objetivo no ha cargado aún, busca el más cercano cargado
    let img = this.frames[targetIndex];
    if (!img) {
      for (let i = targetIndex; i >= 0; i--) {
        if (this.frames[i]) { img = this.frames[i]; break; }
      }
    }

    if (img && targetIndex !== this.renderedFrameIndex) {
      this.drawFrame(img);
      this.renderedFrameIndex = targetIndex;
    }
  }

  setupScrollTrigger() {
    const scrollContainer = document.querySelector('.hero-scroll-container');
    const stage1 = document.querySelector('.hero-stage-1');
    const stage2 = document.querySelector('.hero-stage-2');
    const stage3 = document.querySelector('.hero-stage-3');
    const scrollCue = document.querySelector('.hero-scroll-cue');
    const header = document.querySelector('.site-header');

    if (!scrollContainer) return;

    // ── A) Proxy para el índice de frame (interpolación suave con scrub) ──
    const proxy = { frame: 0 };
    gsap.to(proxy, {
      frame: this.config.totalFrames - 1,
      ease: 'none',
      scrollTrigger: {
        trigger: scrollContainer,
        start: 'top top',
        end: 'bottom bottom',
        scrub: this.config.scrubSmoothing,
        onUpdate: (self) => {
          const frameIndex = Math.round(self.progress * (this.config.totalFrames - 1));
          if (frameIndex !== this.currentFrameIndex) {
            this.currentFrameIndex = frameIndex;
            requestAnimationFrame(() => this.drawCurrentFrame());
          }

          // Glassmorphism de la Navbar
          if (header) {
            if (self.scroll() > 50) header.classList.add('scrolled');
            else header.classList.remove('scrolled');
          }
        }
      }
    });

    // ── B) Texto Stage 1: Scroll cue desvanece pronto (0% → 6%) ───────────
    if (scrollCue) {
      gsap.to(scrollCue, {
        opacity: 0,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: scrollContainer,
          start: 'top top',
          end: '6% top',
          scrub: true,
        }
      });
    }

    // Stage 1 visible al inicio; permanece hasta el 18% y sale suavemente hacia el 26%
    if (stage1) {
      gsap.to(stage1, {
        opacity: 0,
        y: -30,
        ease: 'power2.in',
        scrollTrigger: {
          trigger: scrollContainer,
          start: '18% top',
          end: '27% top',
          scrub: true,
          onUpdate: (self) => {
            stage1.style.pointerEvents = self.progress >= 0.9 ? 'none' : 'auto';
          }
        }
      });
    }

    // Stage 2 entra (28% → 36%), permanece visible (36% → 52%) y sale (52% → 60%)
    if (stage2) {
      gsap.fromTo(stage2,
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: scrollContainer,
            start: '28% top',
            end: '36% top',
            scrub: true,
            onUpdate: (self) => {
              if (self.progress > 0.1) stage2.style.pointerEvents = 'auto';
            }
          }
        }
      );

      gsap.to(stage2, {
        opacity: 0,
        y: -30,
        ease: 'power2.in',
        scrollTrigger: {
          trigger: scrollContainer,
          start: '52% top',
          end: '60% top',
          scrub: true,
          onUpdate: (self) => {
            if (self.progress >= 0.9) stage2.style.pointerEvents = 'none';
          }
        }
      });
    }

    // Stage 3 entra anticipadamente (62% → 70%), permanece en pantalla con máxima visibilidad (70% → 90%)
    // y desvanece suavemente al final (90% → 98%) para entregar el paso armónico a la sección de Tratamientos
    if (stage3) {
      gsap.fromTo(stage3,
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: scrollContainer,
            start: '62% top',
            end: '70% top',
            scrub: true,
            onUpdate: (self) => {
              if (self.progress > 0.1) stage3.style.pointerEvents = 'auto';
            }
          }
        }
      );

      gsap.to(stage3, {
        opacity: 0,
        y: -25,
        ease: 'power2.in',
        scrollTrigger: {
          trigger: scrollContainer,
          start: '90% top',
          end: '98% top',
          scrub: true,
          onUpdate: (self) => {
            if (self.progress >= 0.8) stage3.style.pointerEvents = 'none';
          }
        }
      });
    }
  }

  handleReducedMotion() {
    this.dismissPreloader();
    // Fallback estático: pinta el último frame y muestra todo el contenido
    const lastImg = new Image();
    lastImg.src = this.config.framePattern(this.config.totalFrames - 1);
    lastImg.onload = () => {
      this.frames[this.config.totalFrames - 1] = lastImg;
      this.resizeCanvas();
      this.drawFrame(lastImg);
    };

    // Navbar básica sin animación
    const header = document.querySelector('.site-header');
    window.addEventListener('scroll', () => {
      if (header) {
        if (window.scrollY > 40) header.classList.add('scrolled');
        else header.classList.remove('scrolled');
      }
    }, { passive: true });
  }
}
