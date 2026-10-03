# FISIOMED — Clínica de Fisioterapia en Benicarló
> Web de marketing de una sola página con hero inmersivo de secuencia de frames por scroll

---

## Cómo ejecutar el proyecto

```bash
# Instalar dependencias (solo la primera vez)
npm install

# Servidor de desarrollo local en http://localhost:5173
npm run dev

# Build de producción → /dist
npm run build

# Previsualizar el build de producción
npm run preview
```

**Requisitos:** Node.js ≥ 18

---

## Arquitectura del proyecto

```
fisiomed.com/
├── index.html          # Landing page completa (HTML5 semántico)
├── style.css           # Sistema de diseño Sunlit Sanctuary (CSS variables, 8px grid)
├── main.js             # Orquestador principal (Lenis, menú, formulario, navegación)
├── hero-controller.js  # Controlador del Hero Canvas (80 frames + ScrollTrigger GSAP)
│
├── public/
│   ├── hero/           # 80 frames JPEG (1280×720) del recorrido de cámara
│   └── images/         # Logo, imágenes de la clínica
│
├── package.json        # Dependencias (vite, gsap, lenis)
└── README.md           # Este documento
```

---

## Cómo cambiar la carpeta de frames

En [`hero-controller.js`](./hero-controller.js), ajusta la opción `framePattern` dentro de la clase `HeroCanvasController`:

```js
// Línea ~35 — Patrón de URL de cada frame
framePattern: (i) => `/hero/TU_PREFIJO_${String(i).padStart(3, '0')}.jpg`,

// Número total de frames
totalFrames: 80,
```

También puedes pasar estas opciones desde `main.js` al instanciar el controlador:

```js
this.heroController = new HeroCanvasController({
  canvasId: 'hero-canvas',
  totalFrames: 120,                         // ← cambia si añades más frames
  framePattern: (i) => `/hero/frame_${i}.jpg`,
  scrollHeightDesktop: '300vh',             // ← longitud del scroll en escritorio
  scrollHeightMobile: '250vh',              // ← longitud del scroll en móvil
});
```

---

## Ajustar la longitud del scroll del Hero

La duración del scroll del hero se controla con **una sola variable** en `main.js`:

```js
// En main.js → método init()
this.heroController = new HeroCanvasController({
  scrollHeightDesktop: '300vh',   // ← cambia aquí para escritorio
  scrollHeightMobile: '250vh',    // ← cambia aquí para móvil
});
```

Los porcentajes de aparición/desaparición de cada etapa de texto se ajustan en `hero-controller.js`, en el método `setupScrollTrigger()`:

| Etapa de texto | Aparece en | Desaparece en |
|---|---|---|
| Scroll cue | 0% | 8% |
| Stage 1 (Titular inicial) | 0% (visible por defecto) | 25–34% |
| Stage 2 (Mensaje intermedio) | 34–44% | 62–70% |
| Stage 3 (CTA final) | 72–82% | — |

---

## Contenido marcado como [PENDIENTE]

El siguiente contenido **no se ha inventado** y requiere confirmación del cliente antes de publicar:

| Sección | Elemento | Estado |
|---|---|---|
| **Equipo** | Nombres y Nº Colegiados ICOFCV de los fisioterapeutas | 🔴 Pendiente |
| **Equipo** | Fotografías de portada del equipo | 🔴 Pendiente |
| **Testimonios** | Reseñas reales de pacientes verificadas | 🔴 Pendiente |
| **Métricas** | "4.9★ valoración Google" — verificar rating actual | 🟡 Verificar |
| **Métricas** | "+8 Años en Benicarló" / "Desde 2018" — verificar fecha | 🟡 Verificar |
| **Registro** | Nº Registro Sanitario CS-12493 — verificar vigencia | 🟡 Verificar |

Para reemplazar los marcadores, busca `[PENDIENTE]` en `index.html`.

---

## Stack Tecnológico

| Herramienta | Versión | Uso |
|---|---|---|
| [Vite](https://vitejs.dev) | ^8 | Build y servidor de desarrollo |
| [GSAP](https://greensock.com/gsap/) | ^3.15 | ScrollTrigger para el hero canvas |
| [Lenis](https://lenis.darkroom.engineering) | ^1.3 | Scroll suave cinemático |

### Fuentes (Google Fonts)
- **Playfair Display** — Titulares editoriales y citas
- **Manrope** — Cuerpo, UI, labels y formularios

---

## Datos de Contacto Verificados

- **Dirección:** Carrer d'Alcalà de Xivert, 110, bajo — 12580 Benicarló (Castellón)
- **Teléfono:** 964 47 26 23
- **WhatsApp/Móvil:** 601 251 316
- **Horario:** Lunes a viernes, 09:00–13:00 h y 15:00–20:00 h
- **Instagram:** [@fisiomed_blo](https://instagram.com/fisiomed_blo)

---

## Accesibilidad

- ✅ HTML5 semántico (`<header>`, `<main>`, `<section>`, `<article>`, `<footer>`, etc.)
- ✅ `prefers-reduced-motion`: fallback estático con el último frame en reposo
- ✅ ARIA labels en elementos interactivos críticos
- ✅ Foco visible en todos los elementos de formulario y botones
- ✅ `aria-live` en el preloader para lectores de pantalla

---

*Diseño: Sistema "Sunlit Sanctuary" — Warm Minimalist Medical Spa*
