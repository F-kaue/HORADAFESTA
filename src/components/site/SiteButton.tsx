import Link from "next/link";
import { cn } from "@/lib/utils";

type Variant = "primary" | "ghost" | "white" | "outline-white";

const styles: Record<Variant, string> = {
  primary:
    "bg-[#E8612C] text-white hover:bg-[#d45626] shadow-[0_8px_32px_rgba(232,97,44,0.35)]",
  ghost:
    "border-2 border-white/80 bg-transparent text-white hover:bg-white/10",
  white: "bg-white text-[#E8612C] hover:bg-[#FFF8F3] shadow-lg",
  "outline-white":
    "border-2 border-white bg-transparent text-white hover:bg-white/10",
};

export function SiteButton({
  href,
  children,
  variant = "primary",
  className,
  external,
}: {
  href: string;
  children: React.ReactNode;
  variant?: Variant;
  className?: string;
  external?: boolean;
}) {
  const cls = cn(
    "inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full px-7 py-3 text-base font-semibold tracking-wide transition-all duration-200",
    styles[variant],
    className
  );

  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>
        {children}
      </a>
    );
  }

  return (
    <Link href={href} className={cls}>
      {children}
    </Link>
  );
}
