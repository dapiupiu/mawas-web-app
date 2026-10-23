import { ArrowUpRight, Sprout, Truck } from "lucide-react";
import { Reveal } from "./Reveal";
import { TextReveal } from "./TextReveal";
import { VisualPlaceholder } from "./VisualPlaceholder";

const nextScopes = [
  { icon: Truck, title: "Distribusi", text: "Logistik dan harga pangan." },
  { icon: ArrowUpRight, title: "Konsumsi", text: "Gizi dan pola pangan." },
];

export function PillarsSection() {
  return (
    <section
      id="pilar-pangan"
      className="border-b border-[#173e32]/10 bg-[#fbfaf5] px-4 py-16 sm:px-6 sm:py-24 lg:px-10 xl:px-12"
    >
      <div className="mx-auto grid w-full max-w-[1680px] gap-10 lg:grid-cols-[0.88fr_1.12fr] lg:items-center lg:justify-between">
        <Reveal>
          <div>
            <p className="text-sm font-semibold text-[#557267]">
              Fokus saat ini
            </p>
            <TextReveal>
              <h2 className="mt-3 font-serif text-4xl leading-tight tracking-[-0.035em] sm:text-5xl">
                Mawas mulai dari kondisi lahan.
              </h2>
            </TextReveal>
            <p className="mt-5 text-base leading-7 text-[#36564a]">
              Kami membaca sinyal kekeringan pertanian sebagai bagian dari
              ketersediaan pangan.
            </p>
            <div className="mt-8 border-l-2 border-[#b97a16] pl-4 text-sm leading-6 text-[#36564a]">
              Produksi pangan adalah fokus MVP. Distribusi dan konsumsi menyusul
              pada tahap berikutnya.
            </div>
          </div>
        </Reveal>
        <Reveal>
          <div className="overflow-hidden rounded-2xl border border-[#173e32]/15 bg-[#f5f1e8] shadow-[0_16px_40px_rgba(23,62,50,0.08)]">
            <VisualPlaceholder
              label="CITRA LAHAN PERTANIAN ATAU PETA VEGETASI"
              className="min-h-60 sm:min-h-72"
            />
            <div className="grid gap-6 p-6 sm:grid-cols-[1fr_auto] sm:p-8">
              <div>
                <div className="flex items-center gap-3">
                  <span className="grid size-10 place-items-center rounded-full bg-[#dce7d7] text-[#173e32]">
                    <Sprout className="size-5" />
                  </span>
                  <div>
                    <p className="text-sm text-[#557267]">Fokus MVP</p>
                    <h3 className="font-serif text-2xl tracking-[-0.03em]">
                      Produksi pangan
                    </h3>
                  </div>
                </div>
                <p className="mt-5 max-w-md text-sm leading-6 text-[#36564a]">
                  Indikator vegetasi membantu melihat tekanan air sebelum
                  dampaknya meluas.
                </p>
              </div>
              <div className="grid content-start gap-3 border-t border-[#173e32]/10 pt-5 sm:w-48 sm:border-l sm:border-t-0 sm:pl-6 sm:pt-0">
                {nextScopes.map(({ icon: Icon, title, text }) => (
                  <div key={title} className="flex gap-2.5">
                    <Icon className="mt-0.5 size-4 shrink-0 text-[#557267]" />
                    <p className="text-sm leading-5 text-[#36564a]">
                      <strong className="font-semibold text-[#173e32]">
                        {title}
                      </strong>
                      <br />
                      {text}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
