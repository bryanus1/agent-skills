# 🧩 Blueprint de Secciones para Landing Pages

Una landing page efectiva sigue una narrativa progresiva de conversión. Cada sección debe vivir en `src/components/sections/` como un componente `.astro` independiente y recibir sus datos tipados desde `src/data/`.

---

## 1. Orden Recomendado de Secciones

1. **Navbar (`src/components/ui/Navbar.astro`)**
   - Logo + máximo 3–5 enlaces de anclaje (`#features`, `#pricing`, `#faq`) + 1 CTA principal destacado.
   - Sin menús mega-desplegables que distraigan del objetivo de conversión.

2. **Hero (`HeroSection.astro`)**
   - **Un único `<h1>` por página**, claro y orientado a beneficio (no solo el nombre de la marca).
   - Subtítulo conciso (1–2 líneas) explicando *qué hace* y *para quién*.
   - **CTA primario** (acción principal) + **CTA secundario** opcional (ej. "Ver demo").
   - Visual principal (*product shot*, ilustración o código) optimizado con `<Image loading="eager" fetchpriority="high" />` para proteger el LCP.

3. **Social Proof (`SocialProofSection.astro`)**
   - Logos de clientes, métricas verificables o testimonios breves inmediatamente debajo del Hero.

4. **Propuesta de Valor / Features (`FeaturesSection.astro`)**
   - Grid responsive (`grid-cols-1 md:grid-cols-3`) con 3–6 beneficios concretos.
   - Iconos SVG inline ligeros o de un set optimizado; evitar librerías pesadas de iconos en cliente.

5. **Cómo Funciona (`HowItWorksSection.astro`)**
   - 3 pasos numerados que reducen la fricción percibida.

6. **Pricing / Planes (`PricingSection.astro`)** *(si aplica)*
   - Máximo 3 columnas, destacando visualmente el plan recomendado (`aria-label` o badge claro).

7. **FAQ (`FaqSection.astro`)**
   - Usar `<details>` y `<summary>` nativos estilizados con Tailwind (`group`, `group-open:rotate-180`) para lograr acordeones accesibles sin JavaScript.

8. **CTA Final + Footer (`CtaSection.astro`, `Footer.astro`)**
   - Cierre con llamada a la acción directa y footer con enlaces legales, contacto y redes.

---

## 2. Accesibilidad (WCAG AA) y Tailwind CSS

- **Skip link:** Incluir `<a href="#main-content" class="sr-only focus:not-sr-only ...">Saltar al contenido</a>` al inicio de `BaseLayout.astro`.
- **Contraste:** Mínimo `4.5:1` en texto normal y `3:1` en texto grande o elementos UI.
- **Estados de foco:** Nunca eliminar `outline` sin reemplazarlo por `focus-visible:ring-2 focus-visible:ring-offset-2`.
- **Movimiento reducido:** Respetar `motion-reduce:transition-none` y `motion-reduce:animate-none` en animaciones.
