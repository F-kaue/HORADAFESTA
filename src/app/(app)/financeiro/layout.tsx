import { FinanceNav } from "@/components/finance/finance-nav";

export default function FinanceiroLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-6">
      <FinanceNav />
      {children}
    </div>
  );
}
