import Image from "next/image";
import { IntakeForm } from "./components/intake-form";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#f6f8f7] text-[#14312d]">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-5 py-6 sm:px-8 lg:grid lg:grid-cols-[0.95fr_1.05fr] lg:items-center lg:gap-14 lg:py-12">
        <div className="flex flex-col gap-7">
          <div className="flex items-center gap-3 text-sm font-semibold text-[#00695c]">
            <span className="h-2.5 w-2.5 rounded-full bg-[#00796b]" />
            Apoyo psicológico confidencial
          </div>

          <div className="space-y-5">
            <h1 className="max-w-2xl text-4xl font-bold leading-[1.08] tracking-normal text-[#0f2723] sm:text-5xl">
              Encuentra apoyo profesional
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-[#425e59]">
              Si tú o alguien cercano fue afectado por la actividad sísmica en
              Venezuela, puedes solicitar acompañamiento emocional con
              psicólogos y consejeros voluntarios. Comparte tus datos y el
              equipo de coordinación buscará contactarte lo antes posible.
            </p>
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

      <section className="bg-white">
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
    </main>
  );
}
