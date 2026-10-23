interface BrandMarkProps {
  className?: string;
  variant?: "colour" | "green" | "cream" | "white";
}

export function BrandMark({ className = "size-9", variant = "colour" }: BrandMarkProps) {
  return (
    <img
      src={`/logo-mawas/VEKTOR/icon/MAWAS-icon-${variant}.svg`}
      alt="Logo Mawas"
      className={`${className} object-contain shrink-0`}
    />
  );
}

export function BrandLogoFull({ className = "h-9 w-auto", variant = "colour" }: { className?: string; variant?: "colour" | "green" | "cream" | "white" }) {
  return (
    <img
      src={`/logo-mawas/PNG/rectangle/MAWAS-rectangle-${variant}.png`}
      alt="Logo Mawas"
      className={`${className} object-contain shrink-0`}
    />
  );
}
