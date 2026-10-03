/**
 * FISIOMED - Method Canvas Controller
 * 
 * Escenario Sticky Dividido:
 * - Visor interactivo sticky con marco refinado y tag flotante (Valoración, Plan a medida, Seguimiento).
 * - Sincronización precisa de 50 frames con ScrollTrigger y scrub (0.7).
 * - 3 fases de contenido sincronizadas con escala y opacidad.
 * - Indicador de progreso vertical con barra dorada y nodos interactivos clicables accesibles.
 * - Carga diferida inteligente con IntersectionObserver (~1.5 viewports antes).
 * - Soporte accesible prefers-reduced-motion y modo móvil optimizado.
 */

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { FrameSequence } from './frame-sequence.js';

gsap.registerPlugin(ScrollTrigger);

export class MethodController {
  constructor(options = {}) {
    this.section = document.getElementById(options.sectionId || 'metodo');
    if (!this.section) return;

    this.canvas = document.getElementById(options.canvasId || 'method-canvas');
    this.badgeEl = document.getElementById('method-sticky-badge');
    this.progressFill = document.getElementById('method-progress-fill');
    this.stepNodes = Array.from(document.querySelectorAll('.method-progress-node'));
    this.stepBlocks = Array.from(document.querySelectorAll('.method-step-block'));

    // Configuración Centralizada
    this.config = {
      totalFrames: 50,
      framePattern: (i) => `/our_method/ezgif-frame-${String(i + 1).padStart(3, '0')}.png`,
      scrollHeightDesktop: '300vh',
      scrollHeightTablet: '260vh',
      scrollHeightMobile: '220vh',
      scrubSmoothing: 0.7,
      // Puntos de corte para las 3 fases (normalizados 0 a 1)
      phases: [
        { id: 1, name: 'Valoración', range: [0.0, 0.33], frameRange: [0, 16] },
        { id: 2, name: 'Plan a Medida', range: [0.33, 0.66], frameRange: [17, 33] },
        { id: 3, name: 'Seguimiento', range: [0.66, 1.0], frameRange: [34, 49] }
      ],
      ...options
    };

    this.isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.hasInitiatedLoading = false;
    this.isReady = false;
    this.currentPhaseIndex = 0;
    this.renderer = null;

    this.init();
  }

  init() {
    this.applyScrollHeight();

    if (this.isReducedMotion) {
      this.handleReducedMotion();
      return;
    }

    if (this.canvas) {
      this.renderer = new FrameSequence(this.canvas, {
        totalFrames: this.config.totalFrames,
        framePattern: this.config.framePattern
      });
    } else {
      console.warn('[MethodController] Canvas #method-canvas no encontrado.');
    }

    // Configurar la carga diferida con IntersectionObserver
    this.setupLazyLoading();

    // Configurar la sincronización GSAP ScrollTrigger
    this.setupScrollTrigger();

    // Eventos clic en los nodos de progreso (accesibilidad y salto suave)
    this.setupNodeClicks();

    // Recalcular ScrollTrigger después de que Lenis y el DOM estén listos
    window.addEventListener('load', () => {
      setTimeout(() => ScrollTrigger.refresh(), 200);
    }, { once: true });
  }

  applyScrollHeight() {
    const container = document.querySelector('.method-scroll-track');
    if (!container) return;
    container.style.setProperty('--method-scroll-height', this.config.scrollHeightDesktop);
    container.style.setProperty('--method-scroll-height-tablet', this.config.scrollHeightTablet);
    container.style.setProperty('--method-scroll-height-mobile', this.config.scrollHeightMobile);
  }

  setupLazyLoading() {
    // Iniciar carga del primer frame de inmediato para tener el canvas listo
    this.loadFirstFrame();

    // IntersectionObserver para el resto de los 50 frames cuando el usuario se acerque a la sección
    if (!('IntersectionObserver' in window)) {
      this.loadBatchFrames(1);
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !this.hasInitiatedLoading) {
          this.hasInitiatedLoading = true;
          this.loadBatchFrames(1);
          observer.disconnect();
        }
      });
    }, {
      rootMargin: '600px 0px 600px 0px'
    });

    observer.observe(this.section);
  }

  loadFirstFrame() {
    if (!this.renderer) return;

    const img0 = new Image();
    img0.src = this.config.framePattern(0);
    img0.onload = () => {
      this.renderer.frames[0] = img0;
      this.renderer.initResize();
      this.renderer.drawFrameByIndex(0);
      const placeholder = document.getElementById('method-canvas-placeholder');
      if (placeholder) placeholder.style.opacity = '0';
      // Refrescar posiciones de scroll trigger cuando el primer frame está listo
      ScrollTrigger.refresh();
    };
    img0.onerror = () => {
      console.warn('[MethodController] No se pudo cargar el frame 0 de /our_method. Verifica que existe public/our_method/ezgif-frame-001.png');
    };
  }

  loadBatchFrames(startIndex) {
    const total = this.config.totalFrames;

    for (let i = startIndex; i < total; i++) {
      const idx = i;
      const img = new Image();
      img.src = this.config.framePattern(idx);
      img.onload = () => {
        if (this.renderer && this.renderer.frames) {
          this.renderer.frames[idx] = img;
          // Si estamos en este frame, forzar renderizado inmediato
          if (this.currentFrameIndex === idx || this.renderer.lastDrawnIndex === idx) {
            this.renderer.drawFrameByIndex(idx);
          }
        }
      };
    }
  }

  setupScrollTrigger() {
    const track = document.querySelector('.method-scroll-track');
    if (!track) return;

    const proxy = { progress: 0 };

    gsap.to(proxy, {
      progress: 1,
      ease: 'none',
      scrollTrigger: {
        trigger: track,
        start: 'top top',
        end: 'bottom bottom',
        scrub: this.config.scrubSmoothing,
        onUpdate: (self) => {
          const progress = self.progress;

          // 1. Sincronizar frame en el Canvas
          const frameIndex = Math.min(
            Math.max(Math.round(progress * (this.config.totalFrames - 1)), 0),
            this.config.totalFrames - 1
          );

          if (this.renderer) {
            requestAnimationFrame(() => this.renderer.drawFrameByIndex(frameIndex));
          }

          // 2. Actualizar barra de progreso vertical
          if (this.progressFill) {
            this.progressFill.style.height = `${Math.min(progress * 100, 100)}%`;
          }

          // 3. Determinar fase activa (0, 1 o 2) o -1 si ya pasó
          let activePhaseIdx = -1;
          if (progress >= 0.0 && progress < 0.33) {
            activePhaseIdx = 0;
          } else if (progress >= 0.33 && progress < 0.66) {
            activePhaseIdx = 1;
          } else if (progress >= 0.66 && progress < 0.99) {
            activePhaseIdx = 2;
          }

          if (activePhaseIdx !== this.currentPhaseIndex) {
            this.setActivePhase(activePhaseIdx);
          }
        }
      }
    });
  }

  setActivePhase(index) {
    this.currentPhaseIndex = index;
    const currentPhase = this.config.phases[index];

    // Actualizar etiqueta flotante con fade suave
    if (this.badgeEl && currentPhase) {
      this.badgeEl.style.opacity = '0';
      this.badgeEl.style.transform = 'translateY(-4px)';
      setTimeout(() => {
        const textSpan = this.badgeEl.querySelector('.method-badge-text');
        if (textSpan) textSpan.textContent = currentPhase.name;
        this.badgeEl.style.opacity = '1';
        this.badgeEl.style.transform = 'translateY(0)';
      }, 180);
    } else if (this.badgeEl) {
      this.badgeEl.style.opacity = '0';
    }

    // Actualizar nodos de progreso
    this.stepNodes.forEach((node, i) => {
      if (i <= index) {
        node.classList.add('active');
        node.setAttribute('aria-current', i === index ? 'step' : 'true');
      } else {
        node.classList.remove('active');
        node.removeAttribute('aria-current');
      }
    });

    // Actualizar bloques de texto (fase activa 100% y escala ligera, inactivas 35%)
    this.stepBlocks.forEach((block, i) => {
      if (i === index) {
        block.classList.add('is-active');
        block.classList.remove('is-dimmed');
      } else {
        block.classList.remove('is-active');
        block.classList.add('is-dimmed');
      }
    });
  }

  setupNodeClicks() {
    this.stepNodes.forEach((node) => {
      const handleAction = (e) => {
        e.preventDefault();
        const targetStep = parseInt(node.getAttribute('data-step'), 10);
        if (isNaN(targetStep)) return;

        const targetBlock = document.getElementById(`method-phase-${targetStep}`);
        if (!targetBlock) return;

        // Scroll suave al centro del bloque
        const yOffset = -window.innerHeight * 0.25;
        const yPos = targetBlock.getBoundingClientRect().top + window.pageYOffset + yOffset;

        window.scrollTo({
          top: yPos,
          behavior: 'smooth'
        });
      };

      node.addEventListener('click', handleAction);
      node.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          handleAction(e);
        }
      });
    });
  }

  handleReducedMotion() {
    // Si prefiere movimiento reducido, los 3 bloques se muestran estáticos con un frame representativo
    this.stepBlocks.forEach((block, i) => {
      block.classList.add('is-active');
      block.classList.remove('is-dimmed');
    });

    // Cargar frame estático inicial
    if (this.renderer) {
      const sampleImg = new Image();
      sampleImg.src = this.config.framePattern(20);
      sampleImg.onload = () => {
        this.renderer.frames[20] = sampleImg;
        this.renderer.drawFrameByIndex(20);
        const placeholder = document.getElementById('method-canvas-placeholder');
        if (placeholder) placeholder.style.opacity = '0';
      };
    }
  }

  destroy() {
    if (this.renderer) this.renderer.destroy();
  }
}
