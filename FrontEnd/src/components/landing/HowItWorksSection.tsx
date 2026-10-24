import {
  CircleAlert,
  CloudRain,
  Database,
  Route,
  Satellite,
} from "lucide-react";
import { Reveal } from "./Reveal";

const steps = [
  {
    number: "01",
    title: "Agregasi indikator satelit",
    body: "Sistem mengumpulkan data anomali penyerapan vegetasi (FAPAR HDX/JRC) dan variabel iklim historis.",
    icon: Database,
  },
  {
    number: "02",
    title: "Estimasi risiko 30 hari",
    body: "Data diolah menjadi estimasi tingkat stres vegetasi per kabupaten sebagai indikator awal kekeringan pertanian.",
    icon: CircleAlert,
  },
  {
    number: "03",
    title: "Dukung mitigasi lapangan",
    body: "Menyediakan sinyal dini bagi dinas pertanian dan pemangku kepentingan untuk intervensi irigasi atau pompanisasi.",
    icon: Route,
  },
];

const signals = [
  {
    icon: Satellite,
    title: "Anomali FAPAR",
    text: "Sinyal vegetasi dari satelit JRC dan HDX.",
  },
  {
    icon: CloudRain,
    title: "Kondisi iklim",
    text: "Konteks curah hujan dan cuaca historis.",
  },
];

export function HowItWorksSection() {
  return (
    <section
      id="cara-kerja"
      className="border-b border-[#173e32]/10 bg-[#f5f1e8] px-4 py-14 sm:px-6 sm:py-20 lg:px-10 lg:py-24 xl:px-12"
    >
      <div className="mx-auto w-full max-w-[1680px]">
        <Reveal>
          <div className="grid gap-6 border-b border-[#173e32]/15 pb-8 md:grid-cols-2 md:items-end md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#557267]">
                Cara kerja
              </p>
              <h2 className="mt-2 font-serif text-3xl tracking-[-0.03em] text-[#173e32] sm:text-4xl lg:text-5xl">
                Dari sinyal satelit ke respons lapangan.
              </h2>
            </div>
            <p className="text-xs leading-relaxed text-[#36564a] sm:text-sm sm:leading-6">
              Mawas membaca anomali FAPAR sebagai indikator awal, bukan
              kepastian hasil panen. Verifikasi lapangan tetap diperlukan
              sebelum menentukan tindakan.
            </p>
          </div>
        </Reveal>

        <div className="mt-8 grid gap-0 md:grid-cols-3">
          {steps.map((step, index) => (
            <Reveal key={step.number}>
              <article
                className={`group border-b border-[#173e32]/15 py-8 md:border-b-0 md:px-7 ${
                  index === 0 ? "md:pl-0" : ""
                } ${index === steps.length - 1 ? "md:pr-0" : "md:border-r md:border-[#173e32]/15"}`}
              >
                <div className="flex items-start justify-between">
                  <span className="font-serif text-2xl text-[#b97a16]">
                    {step.number}
                  </span>
                  <step.icon className="size-5 text-[#557267]" aria-hidden="true" />
                </div>
                <h3 className="mt-8 text-lg font-semibold text-[#173e32]">
                  {step.title}
                </h3>
                <p className="mt-2.5 max-w-xs text-xs leading-5 text-[#36564a] sm:text-sm sm:leading-6">
                  {step.body}
                </p>
              </article>
            </Reveal>
          ))}
        </div>

        <div className="mt-4 grid border-y border-[#173e32]/15 sm:grid-cols-2">
          {signals.map(({ icon: Icon, title, text }) => (
            <Reveal key={title}>
              <article className="flex gap-4 py-6 sm:first:border-r sm:first:border-[#173e32]/15 sm:first:pr-8 sm:last:pl-8">
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[#dce7d7] text-[#173e32]">
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <div>
                  <h3 className="font-semibold text-[#173e32]">{title}</h3>
                  <p className="mt-1 text-sm leading-6 text-[#36564a]">{text}</p>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
