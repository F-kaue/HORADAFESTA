import { KanbanBoard } from "@/components/leads/kanban-board";
import { PageHeader } from "@/components/ui/page-header";

export default function LeadsPage() {
  return (
    <div className="app-page-leads space-y-6">
      <PageHeader
        title="Kanban de Leads"
        description="Arraste entre colunas. Role horizontalmente nas setas ou na barra logo abaixo dos filtros."
      />
      <KanbanBoard />
    </div>
  );
}
