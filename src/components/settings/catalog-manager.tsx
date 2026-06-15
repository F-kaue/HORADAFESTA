"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, Pencil, Plus, Trash2, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

type EventTypeItem = { id: string; name: string; active: boolean };
type ServiceTypeItem = {
  id: string;
  name: string;
  duration_hours: number;
  active: boolean;
};

export function CatalogManager() {
  const [eventTypes, setEventTypes] = useState<EventTypeItem[]>([]);
  const [serviceTypes, setServiceTypes] = useState<ServiceTypeItem[]>([]);
  const [newEventName, setNewEventName] = useState("");
  const [newServiceName, setNewServiceName] = useState("");
  const [newServiceHours, setNewServiceHours] = useState("3");
  const [loading, setLoading] = useState(true);

  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [editEventName, setEditEventName] = useState("");

  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [editServiceName, setEditServiceName] = useState("");
  const [editServiceHours, setEditServiceHours] = useState("3");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [evRes, svRes] = await Promise.all([
        fetch("/api/event-types", { cache: "no-store" }),
        fetch("/api/service-types", { cache: "no-store" }),
      ]);
      const evData = await evRes.json();
      const svData = await svRes.json();
      setEventTypes((evData.items ?? []).filter((e: EventTypeItem) => e.active));
      setServiceTypes((svData.items ?? []).filter((s: ServiceTypeItem) => s.active));
    } catch {
      toast.error("Erro ao carregar catálogo");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const addEventType = async () => {
    if (!newEventName.trim()) return;
    const res = await fetch("/api/event-types", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newEventName.trim() }),
    });
    if (!res.ok) {
      const d = await res.json();
      toast.error(d.error || "Erro ao adicionar");
      return;
    }
    setNewEventName("");
    toast.success("Tipo de evento adicionado");
    load();
  };

  const startEditEvent = (item: EventTypeItem) => {
    setEditingEventId(item.id);
    setEditEventName(item.name);
    setEditingServiceId(null);
  };

  const saveEventType = async (id: string) => {
    if (!editEventName.trim()) {
      toast.error("Informe o nome");
      return;
    }
    const res = await fetch(`/api/event-types/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editEventName.trim() }),
    });
    if (!res.ok) {
      const d = await res.json();
      toast.error(d.error || "Erro ao salvar");
      return;
    }
    setEditingEventId(null);
    toast.success("Tipo de evento atualizado");
    load();
  };

  const removeEventType = async (id: string) => {
    if (!confirm("Remover este tipo de evento?")) return;
    const res = await fetch(`/api/event-types/${id}`, { method: "DELETE" });
    if (!res.ok) {
      toast.error("Erro ao remover");
      return;
    }
    toast.success("Tipo de evento removido");
    load();
  };

  const addServiceType = async () => {
    if (!newServiceName.trim()) return;
    const hours = parseFloat(newServiceHours.replace(",", "."));
    if (!hours || hours <= 0 || hours > 24) {
      toast.error("Duração inválida (use entre 0,5 e 24 horas)");
      return;
    }
    const res = await fetch("/api/service-types", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newServiceName.trim(), duration_hours: hours }),
    });
    if (!res.ok) {
      const d = await res.json();
      toast.error(d.error || "Erro ao adicionar");
      return;
    }
    setNewServiceName("");
    setNewServiceHours("3");
    toast.success("Tipo de serviço adicionado");
    load();
  };

  const startEditService = (item: ServiceTypeItem) => {
    setEditingServiceId(item.id);
    setEditServiceName(item.name);
    setEditServiceHours(String(item.duration_hours));
    setEditingEventId(null);
  };

  const saveServiceType = async (id: string) => {
    if (!editServiceName.trim()) {
      toast.error("Informe o nome");
      return;
    }
    const hours = parseFloat(editServiceHours.replace(",", "."));
    if (!hours || hours <= 0 || hours > 24) {
      toast.error("Duração inválida");
      return;
    }
    const res = await fetch(`/api/service-types/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: editServiceName.trim(),
        duration_hours: hours,
      }),
    });
    if (!res.ok) {
      const d = await res.json();
      toast.error(d.error || "Erro ao salvar");
      return;
    }
    setEditingServiceId(null);
    toast.success("Tipo de serviço atualizado");
    load();
  };

  const removeServiceType = async (id: string) => {
    if (!confirm("Remover este tipo de serviço?")) return;
    const res = await fetch(`/api/service-types/${id}`, { method: "DELETE" });
    if (!res.ok) {
      toast.error("Erro ao remover");
      return;
    }
    toast.success("Tipo de serviço removido");
    load();
  };

  if (loading) {
    return (
      <p className="text-sm text-muted-foreground">Carregando catálogo...</p>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Tipos de evento</CardTitle>
          <p className="text-sm text-muted-foreground">
            Opções exibidas no formulário de orçamento (ex.: Aniversário, Casamento).
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <ul className="space-y-2">
            {eventTypes.map((item) => (
              <li
                key={item.id}
                className="rounded-lg border border-border px-3 py-2"
              >
                {editingEventId === item.id ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <Input
                      value={editEventName}
                      onChange={(e) => setEditEventName(e.target.value)}
                      className="min-w-[140px] flex-1"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter") saveEventType(item.id);
                        if (e.key === "Escape") setEditingEventId(null);
                      }}
                    />
                    <Button
                      type="button"
                      size="icon"
                      onClick={() => saveEventType(item.id)}
                      aria-label="Salvar"
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="outline"
                      onClick={() => setEditingEventId(null)}
                      aria-label="Cancelar"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium">{item.name}</span>
                    <div className="flex shrink-0 gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => startEditEvent(item)}
                        aria-label={`Editar ${item.name}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="text-danger hover:text-danger"
                        onClick={() => removeEventType(item.id)}
                        aria-label={`Remover ${item.name}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </li>
            ))}
            {eventTypes.length === 0 && (
              <p className="text-sm text-muted-foreground">Nenhum tipo cadastrado.</p>
            )}
          </ul>
          <div className="flex gap-2">
            <Input
              value={newEventName}
              onChange={(e) => setNewEventName(e.target.value)}
              placeholder="Novo tipo de evento"
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addEventType())}
            />
            <Button type="button" onClick={addEventType} className="shrink-0 gap-1">
              <Plus className="h-4 w-4" /> Adicionar
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Tipos de serviço</CardTitle>
          <p className="text-sm text-muted-foreground">
            Cada serviço tem duração em horas — ao confirmar, o horário de fim é calculado
            automaticamente (ex.: Barraquinhas 3h, início 13:00 → fim 16:00).
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <ul className="space-y-2">
            {serviceTypes.map((item) => (
              <li
                key={item.id}
                className="rounded-lg border border-border px-3 py-2"
              >
                {editingServiceId === item.id ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <Input
                      value={editServiceName}
                      onChange={(e) => setEditServiceName(e.target.value)}
                      className="min-w-[120px] flex-1"
                      autoFocus
                    />
                    <Input
                      type="number"
                      min={0.5}
                      max={24}
                      step={0.5}
                      value={editServiceHours}
                      onChange={(e) => setEditServiceHours(e.target.value)}
                      className="w-20"
                      aria-label="Duração em horas"
                    />
                    <span className="text-sm text-muted-foreground">h</span>
                    <Button
                      type="button"
                      size="icon"
                      onClick={() => saveServiceType(item.id)}
                      aria-label="Salvar"
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="outline"
                      onClick={() => setEditingServiceId(null)}
                      aria-label="Cancelar"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium">
                      {item.name}{" "}
                      <span className="text-muted-foreground font-normal">
                        ({item.duration_hours}h)
                      </span>
                    </span>
                    <div className="flex shrink-0 gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => startEditService(item)}
                        aria-label={`Editar ${item.name}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="text-danger hover:text-danger"
                        onClick={() => removeServiceType(item.id)}
                        aria-label={`Remover ${item.name}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </li>
            ))}
            {serviceTypes.length === 0 && (
              <p className="text-sm text-muted-foreground">Nenhum serviço cadastrado.</p>
            )}
          </ul>
          <div className="space-y-2">
            <Label className="sr-only">Novo serviço</Label>
            <div className="flex flex-wrap gap-2">
              <Input
                value={newServiceName}
                onChange={(e) => setNewServiceName(e.target.value)}
                placeholder="Nome do serviço"
                className="min-w-[140px] flex-1"
              />
              <Input
                type="number"
                min={0.5}
                max={24}
                step={0.5}
                value={newServiceHours}
                onChange={(e) => setNewServiceHours(e.target.value)}
                className="w-24"
                aria-label="Duração em horas"
              />
              <span className="self-center text-sm text-muted-foreground">horas</span>
              <Button type="button" onClick={addServiceType} className="gap-1">
                <Plus className="h-4 w-4" /> Adicionar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
