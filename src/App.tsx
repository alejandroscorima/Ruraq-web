import { lazy, Suspense } from 'react'

const RobotViewer = lazy(() => import('./components/RobotViewer'))

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

export default function App() {
  return (
    <div className="min-h-screen bg-ink text-fog">
      <header className="fixed inset-x-0 top-0 z-50 border-b border-line/60 bg-ink/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-5 md:px-8">
          <a href="#top" className="font-display text-[13px] font-semibold tracking-[0.32em]">
            RURAQ
          </a>
          <nav className="hidden items-center gap-8 text-[13px] text-muted md:flex">
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
          </nav>
          <a
            href="#modelo"
            className="rounded-full border border-line px-3.5 py-1.5 text-[12px] font-medium tracking-wide text-fog transition-colors hover:border-brass hover:text-brass"
          >
            Ver modelo 3D
          </a>
        </div>
      </header>

      <main id="top">
        {/* Hero */}
        <section className="relative flex min-h-[100svh] flex-col overflow-hidden pt-14">
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

          <div className="relative z-10 mx-auto w-full max-w-6xl px-5 pt-10 text-center md:px-8 md:pt-14">
            <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-brass">
              Robot social · Cultural mediation
            </p>
            <h1 className="mt-4 font-display text-[clamp(3.2rem,10vw,6.5rem)] font-semibold leading-[0.95] tracking-tight">
              RURAQ
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-[15px] leading-relaxed text-muted md:text-lg">
              El guía inteligente para museos y galerías. Acompaña visitantes, explica obras y conversa
              con Natural Language — cercano, intuitivo y listo para sala.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <a
                href="#modelo"
                className="rounded-full px-6 py-2.5 text-sm font-semibold transition-opacity hover:opacity-90"
                style={{ background: '#ece9e2', color: '#080a0c' }}
              >
                Explorar
              </a>
              <a
                href="#experiencia"
                className="rounded-full border border-line px-6 py-2.5 text-sm font-medium text-fog transition-colors hover:border-muted"
              >
                Ver cómo funciona
              </a>
            </div>
          </div>

          <div id="modelo" className="relative z-10 mt-4 flex-1 md:mt-2">
            <div className="mx-auto h-[min(62vh,580px)] w-full max-w-6xl md:h-[min(68vh,700px)]">
              <Suspense
                fallback={
                  <div className="flex h-full items-center justify-center text-sm text-muted">
                    Cargando modelo 3D…
                  </div>
                }
              >
                <RobotViewer />
              </Suspense>
            </div>
            <p className="pb-8 text-center text-[11px] tracking-[0.18em] text-muted uppercase">
              Arrastra para rotar · scroll para zoom
            </p>
          </div>
        </section>

        {/* Producto */}
        <section id="producto" className="border-t border-line bg-panel">
          <div className="mx-auto grid max-w-6xl gap-12 px-5 py-20 md:grid-cols-12 md:gap-16 md:px-8 md:py-28">
            <div className="md:col-span-5">
              <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-brass">El producto</p>
              <h2 className="mt-4 font-display text-3xl font-semibold tracking-tight md:text-4xl">
                Mediación cultural con presencia robótica
              </h2>
            </div>
            <div className="md:col-span-7 space-y-6 text-[15px] leading-relaxed text-muted md:text-base">
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
          <div className="mx-auto max-w-6xl px-5 py-20 md:px-8 md:py-28">
            <div className="max-w-2xl">
              <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-brass">Capacidades</p>
              <h2 className="mt-4 font-display text-3xl font-semibold tracking-tight md:text-4xl">
                Diseñado para la sala, no para el laboratorio
              </h2>
            </div>
            <ul className="mt-14 grid gap-x-10 gap-y-12 sm:grid-cols-2">
              {capabilities.map((item) => (
                <li key={item.title} className="border-t border-line pt-6">
                  <div className="flex items-baseline justify-between gap-4">
                    <h3 className="font-display text-xl font-medium tracking-tight">{item.title}</h3>
                    <span className="font-display text-xs tracking-[0.2em] text-brass">{item.label}</span>
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
          <div className="mx-auto max-w-6xl px-5 py-20 md:px-8 md:py-28">
            <div className="max-w-2xl">
              <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-brass">Experiencia</p>
              <h2 className="mt-4 font-display text-3xl font-semibold tracking-tight md:text-4xl">
                Del saludo al recorrido
              </h2>
              <p className="mt-4 text-muted">
                Una interacción natural, en cuatro momentos.
              </p>
            </div>
            <ol className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {journey.map((item, i) => (
                <li key={item.step}>
                  <p className="font-display text-sm tracking-[0.2em] text-brass">
                    {String(i + 1).padStart(2, '0')}
                  </p>
                  <h3 className="mt-3 font-display text-xl font-medium">{item.step}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{item.text}</p>
                </li>
              ))}
            </ol>

            <div className="mt-16 border border-line bg-soft/80 px-6 py-8 md:px-10 md:py-10">
              <p className="text-[11px] uppercase tracking-[0.22em] text-muted">Demo conversacional</p>
              <div className="mt-6 space-y-5 font-display text-lg md:text-xl">
                <p className="text-muted">
                  Visitante — <span className="text-fog">«Amigo»</span>
                </p>
                <p className="text-fog">
                  RURAQ — <span className="text-brass">«Hola, bienvenido al museo. ¿Qué obra te gustaría conocer?»</span>
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Specs */}
        <section id="specs" className="border-t border-line">
          <div className="mx-auto max-w-6xl px-5 py-20 md:px-8 md:py-28">
            <div className="max-w-2xl">
              <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-brass">Especificaciones</p>
              <h2 className="mt-4 font-display text-3xl font-semibold tracking-tight md:text-4xl">
                Plataforma lista para exhibición
              </h2>
            </div>
            <dl className="mt-14 grid gap-px overflow-hidden rounded-sm bg-line sm:grid-cols-2 lg:grid-cols-3">
              {specs.map((item) => (
                <div key={item.label} className="bg-ink px-5 py-6 md:px-6">
                  <dt className="text-[11px] uppercase tracking-[0.18em] text-muted">{item.label}</dt>
                  <dd className="mt-2 font-display text-base font-medium md:text-lg">{item.value}</dd>
                </div>
              ))}
            </dl>

            <div className="mt-16">
              <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-muted">Technology</p>
              <div className="mt-5 flex flex-wrap gap-x-5 gap-y-3">
                {tech.map((item) => (
                  <span key={item} className="text-sm text-fog/90 md:text-[15px]">
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CTA final */}
        <section className="border-t border-line bg-panel">
          <div className="mx-auto max-w-3xl px-5 py-20 text-center md:px-8 md:py-28">
            <h2 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">
              El futuro de la mediación cultural
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-muted">
              RURAQ une robótica, AI y diseño para acompañar al visitante en museos, galerías y
              centros culturales.
            </p>
            <a
              href="#modelo"
              className="mt-8 inline-flex rounded-full px-6 py-2.5 text-sm font-semibold transition-opacity hover:opacity-90"
              style={{ background: '#ece9e2', color: '#080a0c' }}
            >
              Volver al modelo 3D
            </a>
          </div>
        </section>
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-5 py-8 text-xs text-muted md:flex-row md:px-8">
          <p className="font-display tracking-[0.28em] text-fog/80">RURAQ</p>
          <p>Robot social para mediación cultural</p>
        </div>
      </footer>
    </div>
  )
}
