import { KanbanBoard } from "@/components/leads/kanban-board";

export default function LeadsPage() {
  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-secondary mb-6">
        Kanban de Leads
      </h1>
      <KanbanBoard />
    </div>
  );
}
