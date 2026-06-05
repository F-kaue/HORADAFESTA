import { KanbanBoard } from "@/components/leads/kanban-board";
import { PageHeader } from "@/components/ui/page-header";

export default function LeadsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Kanban de Leads"
        description="Arraste os cards para atualizar o status do funil"
      />
      <KanbanBoard />
    </div>
  );
}
