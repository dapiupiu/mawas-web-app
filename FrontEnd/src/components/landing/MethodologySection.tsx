import { CloudRain, Satellite } from "lucide-react";
import { Reveal } from "./Reveal";

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

export function MethodologySection() {
  return (
    <section
      id="metrik-fapar"
      className="border-b border-[#173e32]/10 bg-[#f5f1e8] px-4 py-16 sm:px-6 sm:py-24 lg:px-10 xl:px-12"
    >
      <div className="mx-auto w-full max-w-[1680px]">
        <Reveal>
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-semibold text-[#557267]">Dasar data</p>
              <h2 className="mt-3 font-serif text-4xl leading-tight tracking-[-0.035em] sm:text-5xl">
                Sinyal satelit, dibaca dengan batas yang jelas.
              </h2>
            </div>
            <p className="text-base leading-7 text-[#36564a]">
              Mawas memakai anomali FAPAR untuk melihat perubahan kondisi
              vegetasi. Ini adalah indikator awal, bukan kepastian hasil panen.
            </p>
          </div>
        </Reveal>
        <div className="mt-10 grid border-y border-[#173e32]/15 sm:grid-cols-2">
          {signals.map(({ icon: Icon, title, text }) => (
            <Reveal key={title}>
              <article className="flex gap-4 py-6 sm:first:border-r sm:first:border-[#173e32]/15 sm:first:pr-8 sm:last:pl-8">
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[#dce7d7] text-[#173e32]">
                  <Icon className="size-5" />
                </span>
                <div>
                  <h3 className="font-semibold">{title}</h3>
                  <p className="mt-1 text-sm leading-6 text-[#36564a]">
                    {text}
                  </p>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
        <Reveal>
          <p className="mt-6 max-w-2xl border-l-2 border-[#b97a16] pl-4 text-sm leading-6 text-[#36564a]">
            Peta menunjukkan risiko stres vegetasi. Verifikasi lapangan tetap
            diperlukan sebelum menentukan tindakan.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
