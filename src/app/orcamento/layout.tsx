export const dynamic = "force-dynamic";

export default function OrcamentoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="orcamento-light min-h-[100dvh] bg-white">{children}</div>;
}
