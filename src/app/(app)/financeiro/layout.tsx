import { FinanceNav } from "@/components/finance/finance-nav";

export default function FinanceiroLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-7xl space-y-5 pb-8 sm:space-y-6">
      <FinanceNav />
      {children}
    </div>
  );
}
