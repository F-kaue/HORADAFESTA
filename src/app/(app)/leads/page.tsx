import { KanbanBoard } from "@/components/leads/kanban-board";
import { PageHeader } from "@/components/ui/page-header";

export default function LeadsPage() {
  return (
    <div className="app-page-leads flex h-[calc(100dvh-6.5rem)] flex-col gap-3 lg:h-[calc(100dvh-5.25rem)]">
      <PageHeader
        className="shrink-0"
        title="Kanban de Leads"
        description="Arraste entre colunas. Role horizontalmente nas setas ou na barra logo abaixo dos filtros."
      />
      <KanbanBoard className="min-h-0 flex-1" />
    </div>
  );
}
