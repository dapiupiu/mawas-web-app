import { Link } from "react-router-dom";
import { BrandLogoFull } from "@/components/landing/BrandMark";

export function NotFoundPage() {
  return (
    <main className="grid min-h-dvh place-items-center bg-[#f5f1e8] px-4 text-[#173e32]">
      <section className="w-full max-w-md text-center">
        <BrandLogoFull className="mx-auto h-auto w-52 sm:w-60" />
        <p className="mt-10 text-xs font-semibold tracking-wide text-[#557267]">404</p>
        <h1 className="mt-2 font-serif text-3xl font-bold tracking-tight sm:text-4xl">
          Halaman tidak ditemukan
        </h1>
        <p className="mx-auto mt-4 max-w-sm text-sm leading-6 text-[#36564a]">
          Alamat yang Anda buka tidak tersedia atau sudah dipindahkan.
        </p>
        <Link
          to="/"
          className="mt-7 inline-flex min-h-11 items-center justify-center rounded-lg bg-[#173e32] px-5 text-sm font-semibold text-[#f5f1e8] hover:bg-[#245542] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#b97a16]"
        >
          Kembali ke beranda
        </Link>
      </section>
    </main>
  );
}
