import { lazy, Suspense, useState } from 'react'

const RobotViewer = lazy(() => import('./components/RobotViewer'))
const MuseumDemo = lazy(() => import('./components/MuseumDemo'))

const capabilities = [
  {
    label: '01',
    title: 'Locomoción',
    detail:
      'Plataforma móvil con differential drive, giro sobre su eje y navegación semiautónoma en interiores.',
  },
  {
    label: '02',
    title: 'Percepción',
    detail:
      'Cámara RGB, Computer Vision, Face Detection y seguimiento visual del visitante durante la conversación.',
  },
  {
    label: '03',
    title: 'Inteligencia Artificial',
    detail:
      'LLM + RAG con knowledge base cultural. Respuestas contextualizadas, sin alucinaciones sobre las obras.',
  },
  {
    label: '04',
    title: 'Interacción humana',
    detail:
      'Wake Word «amigo», Neural TTS, expresiones faciales digitales y comportamiento afectivo cercano.',
  },
]

const journey = [
  { step: 'Detecta', text: 'Identifica la presencia del visitante al entrar a la sala.' },
  { step: 'Saluda', text: 'Se activa con «amigo» y da la bienvenida al museo.' },
  { step: 'Explica', text: 'Cuenta la historia de la obra con contexto cultural real.' },
  { step: 'Acompaña', text: 'Guía hacia la siguiente pieza del recorrido.' },
]

const specs = [
  { label: 'Form factor', value: 'Móvil · Pan-Tilt head' },
  { label: 'Percepción', value: 'RGB Camera + ultrasonidos' },
  { label: 'Audio', value: 'Mic Array · Neural TTS' },
  { label: 'Compute', value: 'Raspberry Pi · Python' },
  { label: 'AI stack', value: 'LLM · RAG · Computer Vision' },
  { label: 'Diseño', value: 'CAD · 3D Printing modular' },
]

const tech = [
  'Computer Vision',
  'OpenCV',
  'MediaPipe',
  'LLM',
  'RAG',
  'Wake Word',
  'Neural TTS',
  'Raspberry Pi',
  'Python',
  'Fusion 360',
]

const contact = {
  name: 'Martin Alejandro Oscorima Palomino',
  role: 'Ingeniería mecatrónica · PUCP',
  city: 'Lima, Perú',
  email: 'alejandro.oscorima@pucp.edu.pe',
  phone: '+51 954 715 170',
  whatsapp: 'https://wa.me/51954715170',
  linkedin: 'https://www.linkedin.com/in/alejandro-oscorima/',
}

const contactLinks = [
  { label: 'Correo', value: contact.email, href: `mailto:${contact.email}` },
  { label: 'WhatsApp', value: contact.phone, href: contact.whatsapp, external: true },
  { label: 'LinkedIn', value: '/alejandro-oscorima', href: contact.linkedin, external: true },
]

export default function App() {
  const [museumOpen, setMuseumOpen] = useState(false)

  return (
    <div className="min-h-svh overflow-x-hidden bg-ink text-fog">
      {museumOpen && (
        <Suspense fallback={null}>
          <MuseumDemo open={museumOpen} onClose={() => setMuseumOpen(false)} />
        </Suspense>
      )}
      <header className="fixed inset-x-0 top-0 z-50 border-b border-line/60 bg-ink/85 backdrop-blur-md safe-top">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4 sm:px-5 md:px-8">
          <a href="#top" className="shrink-0 font-display text-[13px] font-semibold tracking-[0.32em]">
            RURAQ
          </a>
          <nav className="hidden items-center gap-6 text-[13px] text-muted lg:flex xl:gap-8">
            <a href="#producto" className="transition-colors hover:text-fog">
              Producto
            </a>
            <a href="#capacidades" className="transition-colors hover:text-fog">
              Capacidades
            </a>
            <a href="#experiencia" className="transition-colors hover:text-fog">
              Experiencia
            </a>
            <a href="#specs" className="transition-colors hover:text-fog">
              Specs
            </a>
            <a href="#contacto" className="transition-colors hover:text-fog">
              Contacto
            </a>
          </nav>
          <a
            href="#contacto"
            className="shrink-0 rounded-full border border-line px-3 py-1.5 text-[11px] font-medium tracking-wide text-fog transition-colors hover:border-brass hover:text-brass sm:px-3.5 sm:text-[12px]"
          >
            Contacto
          </a>
        </div>
      </header>

      <main id="top">
        {/* Hero */}
        <section className="relative flex min-h-svh flex-col overflow-hidden pt-14">
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background: `
                radial-gradient(ellipse 80% 60% at 50% 35%, rgba(201,168,108,0.14), transparent 55%),
                radial-gradient(ellipse 55% 45% at 15% 85%, rgba(70,95,120,0.22), transparent 50%),
                linear-gradient(180deg, #080a0c 0%, #0d1116 55%, #080a0c 100%)
              `,
            }}
          />

          <div className="relative z-10 mx-auto w-full max-w-6xl px-4 pt-8 text-center sm:px-5 sm:pt-10 md:px-8 md:pt-14">
            <p className="text-[10px] font-medium uppercase tracking-[0.24em] text-brass sm:text-[11px] sm:tracking-[0.28em]">
              Robot social · Cultural mediation
            </p>
            <h1 className="mt-3 font-display text-[clamp(2.75rem,14vw,6.5rem)] font-semibold leading-[0.95] tracking-tight sm:mt-4">
              RURAQ
            </h1>
            <p className="mx-auto mt-4 max-w-xl px-1 text-[14px] leading-relaxed text-muted sm:mt-5 sm:text-[15px] md:text-lg">
              El guía inteligente para museos y galerías. Acompaña visitantes, explica obras y conversa
              con Natural Language — cercano, intuitivo y listo para sala.
            </p>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-2.5 sm:mt-8 sm:gap-3">
              <a
                href="#modelo"
                className="rounded-full px-5 py-2.5 text-sm font-semibold transition-opacity hover:opacity-90 sm:px-6"
                style={{ background: '#ece9e2', color: '#080a0c' }}
              >
                Explorar
              </a>
              <button
                type="button"
                onClick={() => setMuseumOpen(true)}
                className="rounded-full border border-brass/50 px-5 py-2.5 text-sm font-medium text-brass transition-colors hover:border-brass hover:bg-brass/10 sm:px-6"
              >
                Entrar a la sala
              </button>
            </div>
          </div>

          <div id="modelo" className="relative z-10 mt-1 w-full flex-1 sm:mt-2 md:mt-0">
            {/* Márgenes laterales: se puede scrollear fuera del canvas */}
            <div className="mx-auto w-full max-w-6xl px-3 sm:px-5 md:px-8">
              <div
                className="relative overflow-hidden rounded-2xl border border-line/80 sm:rounded-3xl"
                style={{
                  background: `
                    radial-gradient(ellipse 65% 55% at 50% 42%, rgba(42,52,64,0.95), transparent 70%),
                    linear-gradient(165deg, #141a22 0%, #0b0e13 55%, #121820 100%)
                  `,
                  boxShadow: 'inset 0 1px 0 rgba(201,168,108,0.08), 0 24px 80px rgba(0,0,0,0.35)',
                }}
              >
                <div className="h-[min(52svh,480px)] w-full sm:h-[min(58svh,580px)] md:h-[min(66vh,700px)]">
                  <Suspense
                    fallback={
                      <div className="flex h-full items-center justify-center text-sm text-muted">
                        Cargando modelo 3D…
                      </div>
                    }
                  >
                    <RobotViewer fillScreen />
                  </Suspense>
                </div>
                <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center bg-gradient-to-t from-ink/80 to-transparent p-3 sm:p-4">
                  <button
                    type="button"
                    onClick={() => setMuseumOpen(true)}
                    className="pointer-events-auto rounded-full border border-line/80 bg-ink/70 px-4 py-2 text-[11px] font-medium tracking-wide text-fog backdrop-blur-md transition-colors hover:border-brass hover:text-brass sm:text-xs"
                  >
                    Abrir demo a pantalla completa
                  </button>
                </div>
              </div>
            </div>
            <p className="px-4 pb-6 pt-4 text-center text-[10px] tracking-[0.14em] text-muted uppercase sm:pb-8 sm:text-[11px] sm:tracking-[0.18em]">
              <span className="sm:hidden">Desliza horizontal para girar</span>
              <span className="hidden sm:inline">Arrastra horizontal para girar · scroll de página libre</span>
            </p>
          </div>
        </section>

        {/* Producto */}
        <section id="producto" className="border-t border-line bg-panel">
          <div className="mx-auto grid max-w-6xl gap-8 px-4 py-14 sm:gap-12 sm:px-5 sm:py-20 md:grid-cols-12 md:gap-16 md:px-8 md:py-28">
            <div className="md:col-span-5">
              <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-brass">El producto</p>
              <h2 className="mt-3 font-display text-[1.75rem] font-semibold tracking-tight sm:mt-4 sm:text-3xl md:text-4xl">
                Mediación cultural con presencia robótica
              </h2>
            </div>
            <div className="md:col-span-7 space-y-5 text-[15px] leading-relaxed text-muted sm:space-y-6 md:text-base">
              <p>
                Muchos museos no pueden ofrecer recorridos personalizados a cada visitante. RURAQ
                complementa esa experiencia: se acerca, saluda y responde preguntas sobre las obras
                con una base de conocimiento especializada.
              </p>
              <p>
                No busca reemplazar al guía humano. Amplía la capacidad de atención del museo con
                robótica móvil, Computer Vision e inteligencia artificial conversacional.
              </p>
            </div>
          </div>
        </section>

        {/* Capacidades */}
        <section id="capacidades" className="border-t border-line">
          <div className="mx-auto max-w-6xl px-4 py-14 sm:px-5 sm:py-20 md:px-8 md:py-28">
            <div className="max-w-2xl">
              <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-brass">Capacidades</p>
              <h2 className="mt-3 font-display text-[1.75rem] font-semibold tracking-tight sm:mt-4 sm:text-3xl md:text-4xl">
                Diseñado para la sala, no para el laboratorio
              </h2>
            </div>
            <ul className="mt-10 grid gap-x-10 gap-y-10 sm:mt-14 sm:grid-cols-2 sm:gap-y-12">
              {capabilities.map((item) => (
                <li key={item.title} className="border-t border-line pt-5 sm:pt-6">
                  <div className="flex items-baseline justify-between gap-3">
                    <h3 className="font-display text-lg font-medium tracking-tight sm:text-xl">{item.title}</h3>
                    <span className="shrink-0 font-display text-xs tracking-[0.2em] text-brass">{item.label}</span>
                  </div>
                  <p className="mt-3 max-w-md text-sm leading-relaxed text-muted md:text-[15px]">
                    {item.detail}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Experiencia */}
        <section id="experiencia" className="border-t border-line bg-panel">
          <div className="mx-auto max-w-6xl px-4 py-14 sm:px-5 sm:py-20 md:px-8 md:py-28">
            <div className="max-w-2xl">
              <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-brass">Experiencia</p>
              <h2 className="mt-3 font-display text-[1.75rem] font-semibold tracking-tight sm:mt-4 sm:text-3xl md:text-4xl">
                Del saludo al recorrido
              </h2>
              <p className="mt-3 text-[15px] text-muted sm:mt-4">
                Una interacción natural, en cuatro momentos.
              </p>
            </div>
            <ol className="mt-10 grid gap-8 sm:mt-14 sm:grid-cols-2 lg:grid-cols-4">
              {journey.map((item, i) => (
                <li key={item.step} className="border-t border-line pt-4 sm:border-0 sm:pt-0">
                  <p className="font-display text-sm tracking-[0.2em] text-brass">
                    {String(i + 1).padStart(2, '0')}
                  </p>
                  <h3 className="mt-2 font-display text-xl font-medium sm:mt-3">{item.step}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{item.text}</p>
                </li>
              ))}
            </ol>

            <div className="mt-12 border border-line bg-soft/80 px-4 py-7 sm:mt-16 sm:px-6 sm:py-8 md:px-10 md:py-10">
              <p className="text-[11px] uppercase tracking-[0.22em] text-muted">Demo conversacional</p>
              <div className="mt-5 space-y-4 font-display text-base leading-snug sm:mt-6 sm:space-y-5 sm:text-lg md:text-xl">
                <p className="text-muted">
                  Visitante — <span className="text-fog">«Amigo»</span>
                </p>
                <p className="text-fog">
                  RURAQ —{' '}
                  <span className="text-brass">
                    «Hola, bienvenido al museo. ¿Qué obra te gustaría conocer?»
                  </span>
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Specs */}
        <section id="specs" className="border-t border-line">
          <div className="mx-auto max-w-6xl px-4 py-14 sm:px-5 sm:py-20 md:px-8 md:py-28">
            <div className="max-w-2xl">
              <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-brass">Especificaciones</p>
              <h2 className="mt-3 font-display text-[1.75rem] font-semibold tracking-tight sm:mt-4 sm:text-3xl md:text-4xl">
                Plataforma lista para exhibición
              </h2>
            </div>
            <dl className="mt-10 grid gap-px overflow-hidden rounded-sm bg-line sm:mt-14 sm:grid-cols-2 lg:grid-cols-3">
              {specs.map((item) => (
                <div key={item.label} className="bg-ink px-4 py-5 sm:px-5 sm:py-6 md:px-6">
                  <dt className="text-[11px] uppercase tracking-[0.18em] text-muted">{item.label}</dt>
                  <dd className="mt-2 font-display text-[15px] font-medium sm:text-base md:text-lg">{item.value}</dd>
                </div>
              ))}
            </dl>

            <div className="mt-12 sm:mt-16">
              <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-muted">Technology</p>
              <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2.5 sm:mt-5 sm:gap-x-5 sm:gap-y-3">
                {tech.map((item) => (
                  <span key={item} className="text-sm text-fog/90 md:text-[15px]">
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Contacto */}
        <section id="contacto" className="relative overflow-hidden border-t border-line">
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background: `
                radial-gradient(ellipse 70% 55% at 80% 20%, rgba(201,168,108,0.12), transparent 60%),
                radial-gradient(ellipse 50% 40% at 10% 90%, rgba(70,95,120,0.18), transparent 55%),
                linear-gradient(180deg, #101419 0%, #080a0c 100%)
              `,
            }}
          />
          <div className="relative mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:gap-12 sm:px-5 sm:py-20 md:grid-cols-12 md:gap-16 md:px-8 md:py-28">
            <div className="md:col-span-5">
              <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-brass">Contacto</p>
              <h2 className="mt-3 font-display text-[1.75rem] font-semibold tracking-tight sm:mt-4 sm:text-3xl md:text-4xl">
                Hablemos de RURAQ
              </h2>
              <p className="mt-4 max-w-sm text-[15px] leading-relaxed text-muted sm:mt-5">
                ¿Museo, galería o colaboración académica? Escríbeme y conversamos sobre demos,
                integración o el proyecto.
              </p>
              <div className="mt-8 border-t border-line pt-6 sm:mt-10 sm:pt-8">
                <p className="font-display text-base font-medium leading-snug tracking-tight text-fog sm:text-lg md:text-xl">
                  {contact.name}
                </p>
                <p className="mt-2 text-sm text-brass">{contact.role}</p>
                <p className="mt-1 text-sm text-muted">{contact.city}</p>
              </div>
            </div>

            <div className="md:col-span-7">
              <ul className="divide-y divide-line border-y border-line">
                {contactLinks.map((item) => (
                  <li key={item.label}>
                    <a
                      href={item.href}
                      {...(item.external ? { target: '_blank', rel: 'noreferrer' } : {})}
                      className="flex flex-col gap-1.5 py-4 transition-colors hover:text-brass sm:flex-row sm:items-baseline sm:justify-between sm:gap-6 sm:py-5 md:py-6"
                    >
                      <span className="text-[11px] uppercase tracking-[0.2em] text-muted">{item.label}</span>
                      <span className="break-all font-display text-[14px] font-medium tracking-tight sm:text-right sm:text-[15px] md:text-lg">
                        {item.value}
                      </span>
                    </a>
                  </li>
                ))}
              </ul>

              <div className="mt-8 flex flex-col gap-2.5 sm:mt-10 sm:flex-row sm:flex-wrap sm:gap-3">
                <a
                  href={`mailto:${contact.email}`}
                  className="inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-semibold transition-opacity hover:opacity-90 sm:py-2.5"
                  style={{ background: '#ece9e2', color: '#080a0c' }}
                >
                  Escribir correo
                </a>
                <a
                  href={contact.whatsapp}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center rounded-full border border-line px-6 py-3 text-sm font-medium transition-colors hover:border-brass hover:text-brass sm:py-2.5"
                >
                  Abrir WhatsApp
                </a>
                <a
                  href={contact.linkedin}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center rounded-full border border-line px-6 py-3 text-sm font-medium transition-colors hover:border-brass hover:text-brass sm:py-2.5"
                >
                  Ver LinkedIn
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-line bg-ink safe-bottom">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 sm:px-5 sm:py-10 md:flex-row md:items-end md:justify-between md:px-8">
          <div>
            <p className="font-display text-[13px] font-semibold tracking-[0.32em] text-fog/90">RURAQ</p>
            <p className="mt-2 max-w-xs text-xs leading-relaxed text-muted">
              Robot social para mediación cultural · {contact.city}
            </p>
          </div>
          <div className="flex flex-col gap-2 text-xs text-muted md:items-end">
            <a href={`mailto:${contact.email}`} className="break-all transition-colors hover:text-brass">
              {contact.email}
            </a>
            <a
              href={contact.whatsapp}
              target="_blank"
              rel="noreferrer"
              className="transition-colors hover:text-brass"
            >
              {contact.phone}
            </a>
            <a
              href={contact.linkedin}
              target="_blank"
              rel="noreferrer"
              className="transition-colors hover:text-brass"
            >
              LinkedIn
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
