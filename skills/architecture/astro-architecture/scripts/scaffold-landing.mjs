#!/usr/bin/env node
/**
 * Scaffolds a modular Astro landing page architecture (Zero-JS by default,
 * Tailwind CSS, typed data, and technical SEO layout).
 */
import fs from 'node:fs';
import path from 'node:path';

function parseArgs(argv) {
  const options = {
    targetDir: '.',
    name: 'Mi Producto',
    dryRun: false,
    force: false,
    help: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--target-dir' && argv[i + 1]) {
      options.targetDir = argv[++i];
    } else if (arg === '--name' && argv[i + 1]) {
      options.name = argv[++i];
    } else if (arg === '--dry-run') {
      options.dryRun = true;
    } else if (arg === '--force') {
      options.force = true;
    } else if (arg === '--help' || arg === '-h') {
      options.help = true;
    }
  }

  return options;
}

function printHelp() {
  console.log(`Usage: node scaffold-landing.mjs [options]

Options:
  --target-dir <path>  Root directory of the Astro project (default: ".")
  --name <string>      Site/product name for initial copy (default: "Mi Producto")
  --dry-run            Preview files without writing to disk
  --force              Overwrite existing files
  -h, --help           Show this help message`);
}

function buildFiles(siteName) {
  return {
    'src/styles/global.css': `@import "tailwindcss";

@layer base {
  html {
    scroll-behavior: smooth;
  }

  @media (prefers-reduced-motion: reduce) {
    html {
      scroll-behavior: auto;
    }
  }
}
`,
    'src/data/site.ts': `export interface NavItem {
  label: string;
  href: string;
}

export interface FeatureItem {
  title: string;
  description: string;
}

export interface FaqItem {
  question: string;
  answer: string;
}

export const siteConfig = {
  name: '${siteName.replace(/'/g, "\\'")}',
  title: '${siteName.replace(/'/g, "\\'")} — Solución rápida y moderna',
  description:
    'Landing page construida con Astro, Tailwind CSS y arquitectura Zero-JS por defecto.',
  nav: [
    { label: 'Características', href: '#features' },
    { label: 'Preguntas', href: '#faq' },
  ] satisfies NavItem[],
};

export const landingContent = {
  hero: {
    eyebrow: 'Nuevo lanzamiento',
    headline: 'Construye más rápido con ${siteName.replace(/'/g, "\\'")}',
    subheadline:
      'Una arquitectura limpia, rápida y optimizada para SEO y conversión desde el primer día.',
    primaryCta: { label: 'Empezar ahora', href: '#cta' },
    secondaryCta: { label: 'Ver características', href: '#features' },
  },
  features: [
    {
      title: 'Zero-JS por defecto',
      description:
        'HTML estático ultrarrápido que solo hidrata islas cuando es estrictamente necesario.',
    },
    {
      title: 'SEO técnico integrado',
      description:
        'Metadatos Open Graph, canonical, sitemap y estructura semántica lista para indexar.',
    },
    {
      title: 'Accesibilidad WCAG AA',
      description:
        'Contraste verificado, navegación por teclado y controles nativos sin dependencias extra.',
    },
  ] satisfies FeatureItem[],
  faqs: [
    {
      question: '¿Por qué usar Astro para una landing page?',
      answer:
        'Porque entrega HTML estático sin JavaScript innecesario, logrando tiempos de carga mínimos y mejor posicionamiento SEO.',
    },
    {
      question: '¿Puedo añadir interactividad después?',
      answer:
        'Sí, mediante Astro Islands usando directivas como client:visible únicamente en los componentes que lo requieran.',
    },
  ] satisfies FaqItem[],
  cta: {
    title: '¿Listo para lanzar?',
    description: 'Despliega tu landing page con rendimiento óptimo en minutos.',
    buttonLabel: 'Contactar',
    buttonHref: '#top',
  },
};
`,
    'src/layouts/BaseLayout.astro': `---
import '../styles/global.css';
import Navbar from '../components/ui/Navbar.astro';
import Footer from '../components/ui/Footer.astro';
import { siteConfig } from '../data/site';

interface Props {
  title?: string;
  description?: string;
  ogImage?: string;
  noindex?: boolean;
}

const {
  title = siteConfig.title,
  description = siteConfig.description,
  ogImage = '/og-default.png',
  noindex = false,
} = Astro.props;

const canonicalURL = Astro.site
  ? new URL(Astro.url.pathname, Astro.site).toString()
  : Astro.url.pathname;
---

<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{title}</title>
    <meta name="description" content={description} />
    <link rel="canonical" href={canonicalURL} />
    {noindex && <meta name="robots" content="noindex, nofollow" />}

    <meta property="og:type" content="website" />
    <meta property="og:url" content={canonicalURL} />
    <meta property="og:title" content={title} />
    <meta property="og:description" content={description} />
    <meta property="og:image" content={ogImage} />

    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content={title} />
    <meta name="twitter:description" content={description} />
    <meta name="twitter:image" content={ogImage} />
  </head>
  <body id="top" class="min-h-screen bg-white text-slate-900 antialiased">
    <a
      href="#main-content"
      class="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-slate-900 focus:px-4 focus:py-2 focus:text-white"
    >
      Saltar al contenido principal
    </a>
    <Navbar />
    <main id="main-content">
      <slot />
    </main>
    <Footer />
  </body>
</html>
`,
    'src/components/ui/Navbar.astro': `---
import { siteConfig } from '../../data/site';
---

<header class="border-b border-slate-200 bg-white/90 backdrop-blur">
  <nav
    aria-label="Navegación principal"
    class="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6"
  >
    <a href="/" class="text-lg font-bold tracking-tight text-slate-900">
      {siteConfig.name}
    </a>
    <div class="flex items-center gap-6">
      <ul class="hidden items-center gap-6 text-sm font-medium text-slate-600 sm:flex">
        {
          siteConfig.nav.map((item) => (
            <li>
              <a href={item.href} class="transition-colors hover:text-slate-900">
                {item.label}
              </a>
            </li>
          ))
        }
      </ul>
      <a
        href="#cta"
        class="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2"
      >
        Empezar
      </a>
    </div>
  </nav>
</header>
`,
    'src/components/ui/Footer.astro': `---
import { siteConfig } from '../../data/site';
const year = new Date().getFullYear();
---

<footer class="border-t border-slate-200 bg-slate-50 py-10">
  <div class="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 text-sm text-slate-600 sm:flex-row sm:px-6">
    <p>&copy; {year} {siteConfig.name}. Todos los derechos reservados.</p>
    <div class="flex gap-6">
      <a href="#features" class="hover:text-slate-900">Características</a>
      <a href="#faq" class="hover:text-slate-900">FAQ</a>
    </div>
  </div>
</footer>
`,
    'src/components/sections/HeroSection.astro': `---
interface Props {
  eyebrow?: string;
  headline: string;
  subheadline: string;
  primaryCta: { label: string; href: string };
  secondaryCta?: { label: string; href: string };
}

const { eyebrow, headline, subheadline, primaryCta, secondaryCta } = Astro.props;
---

<section class="mx-auto max-w-6xl px-4 py-20 text-center sm:px-6 lg:py-28">
  {
    eyebrow && (
      <p class="mb-4 inline-block rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-slate-700">
        {eyebrow}
      </p>
    )
  }
  <h1 class="mx-auto max-w-3xl text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
    {headline}
  </h1>
  <p class="mx-auto mt-6 max-w-2xl text-lg text-slate-600">
    {subheadline}
  </p>
  <div class="mt-10 flex flex-wrap items-center justify-center gap-4">
    <a
      href={primaryCta.href}
      class="rounded-lg bg-slate-900 px-6 py-3 text-base font-semibold text-white transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2"
    >
      {primaryCta.label}
    </a>
    {
      secondaryCta && (
        <a
          href={secondaryCta.href}
          class="rounded-lg border border-slate-300 px-6 py-3 text-base font-semibold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2"
        >
          {secondaryCta.label}
        </a>
      )
    }
  </div>
</section>
`,
    'src/components/sections/FeaturesSection.astro': `---
import type { FeatureItem } from '../../data/site';

interface Props {
  features: FeatureItem[];
}

const { features } = Astro.props;
---

<section id="features" class="border-t border-slate-100 bg-slate-50 py-20">
  <div class="mx-auto max-w-6xl px-4 sm:px-6">
    <div class="mx-auto max-w-2xl text-center">
      <h2 class="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
        Diseñado para velocidad y conversión
      </h2>
    </div>
    <div class="mt-12 grid grid-cols-1 gap-8 md:grid-cols-3">
      {
        features.map((feature) => (
          <article class="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
            <h3 class="text-lg font-semibold text-slate-900">{feature.title}</h3>
            <p class="mt-2 text-sm leading-relaxed text-slate-600">
              {feature.description}
            </p>
          </article>
        ))
      }
    </div>
  </div>
</section>
`,
    'src/components/sections/FaqSection.astro': `---
import type { FaqItem } from '../../data/site';

interface Props {
  faqs: FaqItem[];
}

const { faqs } = Astro.props;
---

<section id="faq" class="py-20">
  <div class="mx-auto max-w-3xl px-4 sm:px-6">
    <h2 class="text-center text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
      Preguntas frecuentes
    </h2>
    <div class="mt-10 space-y-4">
      {
        faqs.map((faq) => (
          <details class="group rounded-xl border border-slate-200 bg-white p-5">
            <summary class="flex cursor-pointer list-none items-center justify-between font-semibold text-slate-900">
              <span>{faq.question}</span>
              <span
                aria-hidden="true"
                class="ml-4 text-slate-500 transition-transform group-open:rotate-45 motion-reduce:transition-none"
              >
                +
              </span>
            </summary>
            <p class="mt-3 text-sm leading-relaxed text-slate-600">
              {faq.answer}
            </p>
          </details>
        ))
      }
    </div>
  </div>
</section>
`,
    'src/components/sections/CtaSection.astro': `---
interface Props {
  title: string;
  description: string;
  buttonLabel: string;
  buttonHref: string;
}

const { title, description, buttonLabel, buttonHref } = Astro.props;
---

<section id="cta" class="bg-slate-900 py-20 text-white">
  <div class="mx-auto max-w-4xl px-4 text-center sm:px-6">
    <h2 class="text-3xl font-bold tracking-tight sm:text-4xl">{title}</h2>
    <p class="mx-auto mt-4 max-w-xl text-base text-slate-300">{description}</p>
    <div class="mt-8">
      <a
        href={buttonHref}
        class="inline-block rounded-lg bg-white px-6 py-3 text-base font-semibold text-slate-900 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
      >
        {buttonLabel}
      </a>
    </div>
  </div>
</section>
`,
    'src/pages/index.astro': `---
import BaseLayout from '../layouts/BaseLayout.astro';
import HeroSection from '../components/sections/HeroSection.astro';
import FeaturesSection from '../components/sections/FeaturesSection.astro';
import FaqSection from '../components/sections/FaqSection.astro';
import CtaSection from '../components/sections/CtaSection.astro';
import { siteConfig, landingContent } from '../data/site';
---

<BaseLayout title={siteConfig.title} description={siteConfig.description}>
  <HeroSection {...landingContent.hero} />
  <FeaturesSection features={landingContent.features} />
  <FaqSection faqs={landingContent.faqs} />
  <CtaSection {...landingContent.cta} />
</BaseLayout>
`,
    'public/robots.txt': `User-agent: *
Allow: /
`,
  };
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    printHelp();
    process.exit(0);
  }

  const targetRoot = path.resolve(options.targetDir);
  const files = buildFiles(options.name);
  let created = 0;
  let skipped = 0;

  for (const [relativePath, content] of Object.entries(files)) {
    const dest = path.join(targetRoot, relativePath);
    const exists = fs.existsSync(dest);

    if (exists && !options.force) {
      console.log(`SKIP (exists): ${relativePath}`);
      skipped += 1;
      continue;
    }

    if (options.dryRun) {
      console.log(`DRY-RUN ${exists ? 'OVERWRITE' : 'CREATE'}: ${relativePath}`);
      created += 1;
      continue;
    }

    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, content, 'utf8');
    console.log(`${exists ? 'OVERWRITE' : 'CREATE'}: ${relativePath}`);
    created += 1;
  }

  console.log(
    `\nSummary: ${created} file(s) ${options.dryRun ? 'planned' : 'written'}, ${skipped} skipped.`,
  );
}

main();
