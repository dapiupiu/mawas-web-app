import { ChevronDown } from "lucide-react"
import { useState } from "react"

const questions: [string, string][] = [
  [
    "Apa itu Mawas dan apa tujuannya?",
    "Mawas adalah Sistem Peringatan Dini Risiko Kekeringan Pertanian untuk Mendukung Ketahanan Pangan. Sistem ini memprediksi risiko stres vegetasi tanaman pangan per kabupaten untuk rentang 30 hari ke depan, menyajikan indikator awal ancaman terhadap ketersediaan (produksi) pangan dan mendukung swasembada."
  ],
  [
    "Mengapa fokus pada kekeringan pertanian, bukan langsung memprediksi ketahanan pangan secara luas?",
    "Ketahanan pangan mencakup tiga pilar utama: ketersediaan (produksi), aksesibilitas (distribusi/pasar), dan pemanfaatan (gizi). Memprediksi ketahanan pangan secara makro memerlukan data primer yang sangat kompleks (daya beli, logistik antarpulau, dan asupan gizi) yang tidak tersedia secara mentah. Berhubung waktu pengujian MVP terbatas, Mawas secara jujur berfokus pada pilar ketersediaan hulu: memantau kekeringan pertanian dan anomali vegetasi satelit. Dimensi akses dan pemanfaatan dijadwalkan pada roadmap pengembangan lanjutan."
  ],
  [
    "Apakah Mawas memprediksi kepastian 'gagal panen' atau 'krisis pangan'?",
    "Tidak. Mawas tidak mengklaim memprediksi vonis gagal panen ataupun krisis pangan. Keberhasilan panen di lapangan bergantung pada banyak faktor seperti serangan hama, banjir lokal, serta kesiapan petani. Yang diukur oleh Mawas adalah sinyal stres vegetasi dan defisit air (kekeringan pertanian) agar pemangku kebijakan dan petani dapat melakukan langkah antisipasi (seperti giliran irigasi atau distribusi pompa air) sebelum dampak buruk terjadi."
  ],
  [
    "Apa itu indikator FAPAR dan dari mana sumber datanya?",
    "FAPAR (Fraction of Absorbed Photosynthetically Active Radiation) bersumber dari dataset Joint Research Centre (JRC) / Humanitarian Data Exchange (HDX). Indikator ini mengukur fraksi radiasi matahari yang diserap oleh klorofil tajuk tanaman. Anomali negatif FAPAR merupakan standar ilmiah internasional untuk memantau stres tanaman akibat kekeringan pertanian."
  ],
  [
    "Apa arti tingkatan warna risiko pada peta?",
    "Hijau menandakan risiko rendah (kondisi vegetasi normal). Kuning menandai wilayah yang perlu perhatian (terdeteksi anomali stres vegetasi yang perlu dipantau berkala). Merah menandai risiko tinggi (indikasi kuat kekeringan pertanian yang membutuhkan tindak lanjut atau intervensi prioritas)."
  ],
  [
    "Apakah masyarakat umum perlu membuat akun untuk membaca peta?",
    "Tidak. Peta risiko kekeringan pertanian Mawas dirancang sebagai ruang baca publik yang transparan dan dapat diakses terbuka oleh siapa saja. Akses masuk berjenjang hanya diperlukan bagi operator dan pengelola untuk memperbarui catatan status intervensi di lapangan."
  ],
  [
    "Bagaimana rencana pengembangan Mawas untuk aspek akses, peternakan, atau perikanan?",
    "Aspek perluasan seperti integrasi rantai pasok logistik, disparitas harga pangan, serta komoditas peternakan dan perikanan telah dirumuskan dalam peta jalan (roadmap) pengembangan lanjutan Mawas untuk menyempurnakan ekosistem ketahanan pangan di masa mendatang."
  ]
]

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  return (
    <div className="divide-y divide-[#173e32]/15 border-y border-[#173e32]/15">
      {questions.map(([question, answer], index) => {
        const isOpen = openIndex === index
        return (
          <div key={question}>
            <button
              type="button"
              className="flex min-h-16 w-full items-center justify-between gap-6 py-4 text-left text-base font-semibold text-[#173e32] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#b97a16]"
              aria-expanded={isOpen}
              onClick={() => setOpenIndex(isOpen ? null : index)}
            >
              <span>{question}</span>
              <ChevronDown
                className={`size-5 shrink-0 text-[#557267] transition-transform duration-200 ${
                  isOpen ? "rotate-180" : ""
                }`}
              />
            </button>
            {isOpen && (
              <p className="max-w-2xl pb-5 pr-8 text-sm leading-6 text-[#36564a]">
                {answer}
              </p>
            )}
          </div>
        )
      })}
    </div>
  )
}
