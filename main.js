/**
 * FISIOMED - Script Principal
 * Orquesta:
 * 1. Inicialización del Hero Canvas Controller (80 frames + ScrollTrigger).
 * 2. Lenis Smooth Scroll sincronizado con GSAP.
 * 3. Menú móvil interactivo con transiciones fluidas.
 * 4. Gestión del formulario de contacto y feedback visual.
 * 5. Navegación activa dinámica al hacer scroll.
 */

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { HeroCanvasController } from './hero-controller.js';
import { MethodController } from './method-controller.js';

gsap.registerPlugin(ScrollTrigger);

class FisiomedApp {
  constructor() {
    this.isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.init();
  }

  init() {
    // 1. Lenis Smooth Scroll (omitido si el usuario prefiere movimiento reducido)
    this.initLenis();

    // 2. Controlador del Hero Canvas
    this.heroController = new HeroCanvasController({
      canvasId: 'hero-canvas',
      scrollHeightDesktop: '380vh',
      scrollHeightMobile: '320vh',
      scrubSmoothing: 0.8
    });

    // 3. Controlador del Escenario Sticky Nuestro Método (50 frames /our_method)
    this.methodController = new MethodController({
      sectionId: 'metodo',
      canvasId: 'method-canvas',
      scrollHeightDesktop: '300vh',
      scrollHeightTablet: '260vh',
      scrollHeightMobile: '220vh',
      scrubSmoothing: 0.7
    });

    // 4. Menú Móvil
    this.initMobileMenu();

    // 5. Formulario de Reserva
    this.initBookingForm();

    // 6. Enlaces de Navegación Suave y Resaltado Activo
    this.initNavigation();

    // Recalcular posiciones de ScrollTrigger tras montar el DOM y las alturas dinámicas
    requestAnimationFrame(() => {
      ScrollTrigger.refresh();
    });
    window.addEventListener('load', () => {
      ScrollTrigger.refresh();
    });
  }

  initLenis() {
    if (this.isReducedMotion) return;

    try {
      this.lenis = new Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        orientation: 'vertical',
        gestureOrientation: 'vertical',
        smoothWheel: true,
        wheelMultiplier: 1,
        touchMultiplier: 1.5,
        infinite: false,
      });

      this.lenis.on('scroll', ScrollTrigger.update);

      gsap.ticker.add((time) => {
        this.lenis.raf(time * 1000);
      });

      gsap.ticker.lagSmoothing(0);
    } catch (err) {
      console.warn('Lenis no pudo iniciarse, usando scroll nativo:', err);
    }
  }

  initMobileMenu() {
    const toggleBtn = document.getElementById('menu-toggle');
    const drawer = document.getElementById('mobile-drawer');
    if (!toggleBtn || !drawer) return;

    const toggle = (force) => {
      const isOpen = force !== undefined ? force : !drawer.classList.contains('open');
      drawer.classList.toggle('open', isOpen);
      toggleBtn.classList.toggle('menu-open', isOpen);
      toggleBtn.setAttribute('aria-expanded', isOpen);
      drawer.setAttribute('aria-hidden', !isOpen);
      document.body.style.overflow = isOpen ? 'hidden' : '';
    };

    toggleBtn.addEventListener('click', () => toggle());

    // Cerrar al hacer clic en cualquier enlace del menú móvil
    const links = drawer.querySelectorAll('a');
    links.forEach(link => {
      link.addEventListener('click', () => toggle(false));
    });
  }

  initBookingForm() {
    const form = document.getElementById('booking-form');
    const successBanner = document.getElementById('booking-success');
    if (!form) return;

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const nameInput = document.getElementById('form-name');
      const phoneInput = document.getElementById('form-phone');

      if (!nameInput.value.trim() || !phoneInput.value.trim()) {
        alert('Por favor, indica al menos tu nombre y un teléfono de contacto.');
        return;
      }

      if (successBanner) {
        successBanner.style.display = 'flex';
        form.querySelector('button[type="submit"]').disabled = true;
        form.querySelector('button[type="submit"]').style.opacity = '0.6';
      }
    });
  }

  initNavigation() {
    // Sincronizar estado activo de enlaces al hacer scroll
    const sections = document.querySelectorAll('section[id], footer[id]');
    const navLinks = document.querySelectorAll('.nav-desktop .nav-link');

    window.addEventListener('scroll', () => {
      let currentId = '';
      const scrollPos = window.scrollY + 120;

      sections.forEach(section => {
        const top = section.offsetTop;
        const height = section.offsetHeight;
        if (scrollPos >= top && scrollPos < top + height) {
          currentId = section.getAttribute('id');
        }
      });

      if (currentId) {
        navLinks.forEach(link => {
          link.classList.remove('active');
          if (link.getAttribute('href') === `#${currentId}`) {
            link.classList.add('active');
          }
        });
      }
    }, { passive: true });
  }
}

// Iniciar aplicación al cargar el DOM
document.addEventListener('DOMContentLoaded', () => {
  new FisiomedApp();
});
