import { ArrowRight } from "lucide-react"
import { Reveal } from "./Reveal"
import { TextReveal } from "./TextReveal"

const phases = [{ label: "Sekarang", title: "Pantau kekeringan pertanian", text: "Risiko stres vegetasi dan catatan mitigasi." }, { label: "Berikutnya", title: "Baca distribusi pangan", text: "Logistik dan keterjangkauan antarwilayah." }, { label: "Lanjutan", title: "Lengkapi konteks konsumsi", text: "Gizi serta pemanfaatan pangan." }]

export function RoadmapSection() {
  return (
    <section id="roadmap" className="border-b border-[#173e32]/10 bg-[#fbfaf5] px-4 py-16 sm:px-6 sm:py-24 lg:px-10 xl:px-12">
      <div className="mx-auto grid w-full max-w-[1680px] gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-start lg:justify-between">
        <Reveal>
          <div>
            <p className="text-sm font-semibold text-[#557267]">Peta jalan</p>
            <TextReveal>
              <h2 className="mt-3 font-serif text-4xl leading-tight tracking-[-0.035em] sm:text-5xl">
                Bertahap, dari data yang bisa diuji.
              </h2>
            </TextReveal>
            <p className="mt-5 text-base leading-7 text-[#36564a]">
              Cakupan Mawas bertambah saat sumber data dan kebutuhan lapangan siap.
            </p>
          </div>
        </Reveal>
        <Reveal>
          <ol className="border-y border-[#173e32]/15">
            {phases.map((phase, index) => (
              <li
                key={phase.label}
                className="grid grid-cols-[auto_1fr] gap-4 py-6 sm:grid-cols-[8rem_auto_1fr] sm:items-center sm:gap-6"
              >
                <p className="text-sm font-semibold text-[#b97a16]">{phase.label}</p>
                <ArrowRight className="mt-0.5 size-5 text-[#557267] sm:mt-0" />
                <div className="col-span-2 sm:col-span-1">
                  <h3 className="text-lg font-semibold">{phase.title}</h3>
                  <p className="mt-1 text-sm leading-6 text-[#36564a]">{phase.text}</p>
                </div>
                {index < phases.length - 1 && (
                  <div className="col-span-2 border-b border-[#173e32]/10 sm:col-span-3" />
                )}
              </li>
            ))}
          </ol>
        </Reveal>
      </div>
    </section>
  )
}
