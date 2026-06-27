import Image from "next/image";
import { IntakeForm } from "./components/intake-form";
import {
  faqItems,
  ogImage,
  siteDescription,
  siteName,
  siteTitle,
  siteUrl,
} from "./site-config";

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${siteUrl}/#organization`,
      name: siteName,
      url: siteUrl,
      logo: `${siteUrl}/icon.svg`,
    },
    {
      "@type": "WebSite",
      "@id": `${siteUrl}/#website`,
      name: siteName,
      url: siteUrl,
      inLanguage: "es-VE",
      publisher: {
        "@id": `${siteUrl}/#organization`,
      },
    },
    {
      "@type": "WebPage",
      "@id": `${siteUrl}/#webpage`,
      url: siteUrl,
      name: siteTitle,
      description: siteDescription,
      inLanguage: "es-VE",
      isPartOf: {
        "@id": `${siteUrl}/#website`,
      },
      primaryImageOfPage: {
        "@type": "ImageObject",
        url: `${siteUrl}${ogImage.url}`,
        width: ogImage.width,
        height: ogImage.height,
      },
    },
    {
      "@type": "Service",
      "@id": `${siteUrl}/#service`,
      name: "Apoyo psicológico en crisis para venezolanos en Venezuela",
      serviceType: "Apoyo psicológico en crisis",
      areaServed: {
        "@type": "Country",
        name: "Venezuela",
      },
      provider: {
        "@id": `${siteUrl}/#organization`,
      },
      audience: {
        "@type": "Audience",
        audienceType:
          "Venezolanos en Venezuela que experimentan angustia emocional",
      },
    },
    {
      "@type": "FAQPage",
      "@id": `${siteUrl}/#faq`,
      mainEntity: faqItems.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: item.answer,
        },
      })),
    },
  ],
};

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f6f8f7] text-[#14312d]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData),
        }}
      />

      <Image
        src="/icon.svg"
        alt=""
        width={900}
        height={600}
        loading="eager"
        unoptimized
        aria-hidden="true"
        className="pointer-events-none absolute right-0 top-0 z-0 w-[min(42rem,78vw)] translate-x-[40%] opacity-20 select-none"
      />

      <section className="relative z-10 mx-auto flex w-full max-w-6xl flex-col gap-10 px-5 py-6 sm:px-8 lg:grid lg:grid-cols-[0.95fr_1.05fr] lg:items-center lg:gap-14 lg:py-12">
        <div className="flex flex-col gap-7">
          <div className="flex items-center gap-3 text-sm font-semibold text-[#00695c]">
            <span className="h-2.5 w-2.5 rounded-full bg-[#00796b]" />
            Apoyo psicológico confidencial para Venezuela
          </div>

          <div className="space-y-5">
            <h1 className="max-w-2xl text-4xl font-bold leading-[1.08] tracking-normal text-[#0f2723] sm:text-5xl">
              Hay ayuda disponible.
              <br />
              Habla con alguien hoy.
            </h1>
            <div className="max-w-2xl space-y-4 text-lg leading-8 text-[#425e59]">
              <p>
                Somos profesionales de la salud mental en el exterior ofreciendo
                a todos los venezolanos que experimentan angustia emocional,
                acceso a servicios de apoyo en crisis. Existimos para que
                ningún venezolano tenga que enfrentar sus momentos más difíciles
                solo.
              </p>
              <p>
                Si tú o alguien cercano fue afectado por la actividad sísmica
                en Venezuela,{" "}
                <b>
                  puedes solicitar acompañamiento emocional con psicólogos y
                  consejeros voluntarios
                </b>
                . Comparte tus datos y el equipo de coordinación buscará
                contactarte lo antes posible.
              </p>
            </div>
          </div>

          <div className="grid gap-3 text-sm font-medium text-[#31504b] sm:grid-cols-3">
            <div className="rounded-lg border border-[#d9e5e2] bg-white px-4 py-3">
              Respuesta humana
            </div>
            <div className="rounded-lg border border-[#d9e5e2] bg-white px-4 py-3">
              Profesionales voluntarios
            </div>
            <div className="rounded-lg border border-[#d9e5e2] bg-white px-4 py-3">
              Datos tratados con reserva
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-lg border border-[#d7e2df] bg-white shadow-[0_18px_50px_rgba(20,49,45,0.08)]">
          <Image
            src="/images/salud-mental-venezuela-hero.png"
            alt="Profesional de salud mental escuchando a una persona en un espacio tranquilo"
            width={1806}
            height={871}
            priority
            sizes="(max-width: 1024px) 100vw, 560px"
            className="aspect-16/10 w-full object-cover"
          />
        </div>
      </section>

      <section className="relative z-10 bg-white">
        <div className="mx-auto grid w-full max-w-6xl gap-8 px-5 py-10 sm:px-8 lg:grid-cols-[0.8fr_1.2fr] lg:py-14">
          <div className="space-y-4">
            <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[#00796b]">
              Solicitud de ayuda
            </p>
            <h2 className="text-2xl font-bold leading-tight text-[#0f2723] sm:text-3xl">
              Completa el formulario con la información esencial
            </h2>
            <p className="text-base leading-7 text-[#526964]">
              No necesitas explicar todo lo ocurrido. Con estos datos, el equipo
              podrá derivar tu solicitud a una persona capacitada para ofrecer
              apoyo emocional.
            </p>
          </div>

          <IntakeForm />
        </div>
      </section>

      <section className="relative z-10 bg-[#f6f8f7]">
        <div className="mx-auto w-full max-w-6xl px-5 py-10 sm:px-8 lg:py-14">
          <div className="max-w-3xl space-y-3">
            <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[#00796b]">
              Preguntas frecuentes
            </p>
            <h2 className="text-2xl font-bold leading-tight text-[#0f2723] sm:text-3xl">
              Información clara antes de enviar tu solicitud
            </h2>
            <p className="text-base leading-7 text-[#526964]">
              Estas respuestas resumen cómo funciona el apoyo y qué esperar
              después de completar el formulario.
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {faqItems.map((item) => (
              <article
                key={item.question}
                className="rounded-lg border border-[#d9e5e2] bg-white p-5"
              >
                <h3 className="text-base font-bold leading-6 text-[#0f2723]">
                  {item.question}
                </h3>
                <p className="mt-3 text-sm leading-6 text-[#526964]">
                  {item.answer}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <footer className="relative z-10 border-t border-[#d9e5e2] bg-white">
        <div className="mx-auto w-full max-w-6xl px-5 py-6 text-sm leading-6 text-[#526964] sm:px-8">
          <p>
            © 2026{" "}
            <a
              href={siteUrl}
              className="font-semibold text-[#14312d] transition hover:text-[#00796b]"
            >
              saludmentalvenezuela.app
            </a>{" "}
            Salud Mental Venezuela | Apoyo psicológico confidencial. Diseño web
            por{" "}
            <a
              href="https://www.carlosesierra.com.au/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-[#14312d] transition hover:text-[#00796b]"
            >
              carlosesierra.com.au
            </a>
            .
          </p>
        </div>
      </footer>
    </main>
  );
}
