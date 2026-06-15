import Image from "next/image";
import { cn } from "@/lib/utils";

interface BrandLogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
  businessName?: string;
  cnpj?: string | null;
  className?: string;
}

const sizes = {
  sm: { img: 32, text: "text-sm" },
  md: { img: 40, text: "text-sm" },
  lg: { img: 56, text: "text-base" },
  xl: { img: 72, text: "text-lg" },
};

export function BrandLogo({
  size = "md",
  showText = true,
  businessName,
  cnpj,
  className,
}: BrandLogoProps) {
  const s = sizes[size];
  const title = businessName?.trim() || "Hora da Festa";

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="relative shrink-0 overflow-hidden rounded-xl bg-card ring-1 ring-border/60">
        <Image
          src="/logo.png"
          alt={title}
          width={s.img}
          height={s.img}
          className="object-contain"
          priority
        />
      </div>
      {showText && (
        <div className="min-w-0">
          <p className={cn("font-display font-bold text-foreground leading-tight", s.text)}>
            {title}
          </p>
          {cnpj ? (
            <p className="text-2xs font-semibold text-muted-foreground sm:text-xs">
              CNPJ {cnpj}
            </p>
          ) : (
            <p className="text-xs font-semibold text-muted-foreground">Buffet & Eventos</p>
          )}
        </div>
      )}
    </div>
  );
}
