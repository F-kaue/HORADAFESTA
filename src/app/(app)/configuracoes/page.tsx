"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Profile } from "@/types/database";
import { CatalogManager } from "@/components/settings/catalog-manager";
import { toast } from "sonner";

const DAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function ConfiguracoesContent() {
  const supabase = createClient();
  const searchParams = useSearchParams();
  const [profile, setProfile] = useState<Partial<Profile>>({});
  const [saving, setSaving] = useState(false);
  const [syncingCalendar, setSyncingCalendar] = useState(false);
  const [blockedDateInput, setBlockedDateInput] = useState("");

  const publicUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/orcamento`
      : `${process.env.NEXT_PUBLIC_APP_URL}/orcamento`;

  useEffect(() => {
    if (searchParams.get("google") === "connected") {
      toast.success("Google Calendar conectado!");
    }
    if (searchParams.get("google") === "error") {
      toast.error("Erro ao conectar Google Calendar");
    }
  }, [searchParams]);

  useEffect(() => {
    supabase
      .from("profiles")
      .select("*")
      .single()
      .then(({ data }) => {
        if (data) setProfile(data as Profile);
      });
  }, [supabase]);

  const save = async () => {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from("profiles")
      .update({
        name: profile.name,
        business_name: profile.business_name,
        cnpj: profile.cnpj,
        whatsapp: profile.whatsapp,
        max_events_per_day: profile.max_events_per_day,
        morning_start: profile.morning_start,
        morning_end: profile.morning_end,
        afternoon_start: profile.afternoon_start,
        afternoon_end: profile.afternoon_end,
        evening_start: profile.evening_start,
        evening_end: profile.evening_end,
        working_days: profile.working_days,
        blocked_dates: profile.blocked_dates,
        whatsapp_template: profile.whatsapp_template,
      })
      .eq("id", user.id);

    setSaving(false);
    if (error) toast.error("Erro ao salvar");
    else {
      toast.success("Configurações salvas!");
      if (profile.whatsapp) {
        toast.message(
          "O formulário /orcamento usa este WhatsApp para redirecionar novos leads."
        );
      }
    }
  };

  const toggleDay = (day: number) => {
    const days = profile.working_days ?? [0, 1, 2, 3, 4, 5, 6];
    setProfile({
      ...profile,
      working_days: days.includes(day)
        ? days.filter((d) => d !== day)
        : [...days, day].sort(),
    });
  };

  const addBlockedDate = () => {
    if (!blockedDateInput) return;
    const dates = profile.blocked_dates ?? [];
    if (!dates.includes(blockedDateInput)) {
      setProfile({
        ...profile,
        blocked_dates: [...dates, blockedDateInput],
      });
    }
    setBlockedDateInput("");
  };

  const copyLink = () => {
    navigator.clipboard.writeText(publicUrl);
    toast.success("Link copiado!");
  };

  const isGoogleConnected = !!profile.google_calendar_token;

  const syncPendingCalendarEvents = async () => {
    setSyncingCalendar(true);
    try {
      const res = await fetch("/api/leads/sync-calendar-events", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Erro ao sincronizar calendário");
        return;
      }
      if (data.created > 0 || data.updated > 0) {
        toast.success(data.message);
      } else if (data.failed > 0) {
        toast.warning(data.message);
      } else {
        toast.message(data.message);
      }
    } catch {
      toast.error("Erro ao sincronizar calendário");
    } finally {
      setSyncingCalendar(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 sm:space-y-8">
      <PageHeader
        title="Configurações"
        description="Perfil, catálogo, agenda, WhatsApp e integrações"
      />

      <CatalogManager />

      <Card>
        <CardHeader>
          <CardTitle>Perfil</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Nome completo</Label>
            <Input
              value={profile.name ?? ""}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
            />
          </div>
          <div>
            <Label>Nome do negócio</Label>
            <Input
              value={profile.business_name ?? ""}
              onChange={(e) =>
                setProfile({ ...profile, business_name: e.target.value })
              }
            />
          </div>
          <div>
            <Label>CNPJ (relatórios e PDF)</Label>
            <Input
              value={profile.cnpj ?? ""}
              onChange={(e) => setProfile({ ...profile, cnpj: e.target.value })}
              placeholder="00.000.000/0001-00"
            />
          </div>
          <div>
            <Label>WhatsApp (recebe leads)</Label>
            <Input
              value={profile.whatsapp ?? ""}
              onChange={(e) =>
                setProfile({ ...profile, whatsapp: e.target.value })
              }
              placeholder="5585999999999"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Disponibilidade</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Máximo de eventos por dia</Label>
            <div className="flex gap-2 mt-2">
              {[1, 2, 3].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() =>
                    setProfile({ ...profile, max_events_per_day: n })
                  }
                  className={`flex-1 rounded-xl border-2 py-3 font-semibold min-h-[44px] transition-all ${
                    profile.max_events_per_day === n
                      ? "border-primary bg-primary/10 text-primary dark:bg-primary/20"
                      : "border-border bg-muted/30 text-muted-foreground hover:border-primary/40"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Manhã — início</Label>
              <Input
                type="time"
                value={profile.morning_start?.slice(0, 5) ?? "08:00"}
                onChange={(e) =>
                  setProfile({ ...profile, morning_start: e.target.value })
                }
              />
            </div>
            <div>
              <Label>Manhã — fim</Label>
              <Input
                type="time"
                value={profile.morning_end?.slice(0, 5) ?? "12:00"}
                onChange={(e) =>
                  setProfile({ ...profile, morning_end: e.target.value })
                }
              />
            </div>
            <div>
              <Label>Tarde — início</Label>
              <Input
                type="time"
                value={profile.afternoon_start?.slice(0, 5) ?? "12:00"}
                onChange={(e) =>
                  setProfile({ ...profile, afternoon_start: e.target.value })
                }
              />
            </div>
            <div>
              <Label>Tarde — fim</Label>
              <Input
                type="time"
                value={profile.afternoon_end?.slice(0, 5) ?? "18:00"}
                onChange={(e) =>
                  setProfile({ ...profile, afternoon_end: e.target.value })
                }
              />
            </div>
            <div>
              <Label>Noite — início</Label>
              <Input
                type="time"
                value={profile.evening_start?.slice(0, 5) ?? "18:00"}
                onChange={(e) =>
                  setProfile({ ...profile, evening_start: e.target.value })
                }
              />
            </div>
            <div>
              <Label>Noite — fim</Label>
              <Input
                type="time"
                value={profile.evening_end?.slice(0, 5) ?? "23:59"}
                onChange={(e) =>
                  setProfile({ ...profile, evening_end: e.target.value })
                }
              />
            </div>
          </div>

          <div>
            <Label>Dias da semana</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {DAYS.map((label, i) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => toggleDay(i)}
                  className={`rounded-lg px-3 py-2 text-sm min-h-[44px] border-2 font-semibold transition-colors ${
                    (profile.working_days ?? []).includes(i)
                      ? "border-primary bg-primary/10 text-primary dark:bg-primary/20"
                      : "border-border bg-muted/30 text-muted-foreground hover:border-primary/40"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label>Bloquear data (férias)</Label>
            <div className="flex gap-2 mt-2">
              <Input
                type="date"
                value={blockedDateInput}
                onChange={(e) => setBlockedDateInput(e.target.value)}
              />
              <Button type="button" variant="outline" onClick={addBlockedDate}>
                Adicionar
              </Button>
            </div>
            {(profile.blocked_dates ?? []).length > 0 && (
              <ul className="mt-2 text-sm text-muted-foreground">
                {profile.blocked_dates?.map((d) => (
                  <li key={d}>{d}</li>
                ))}
              </ul>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Google Calendar</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm">
            {isGoogleConnected ? "✅ Conectado" : "⚠️ Não conectado"}
          </p>
          <p className="text-xs text-muted-foreground">
            O evento só é criado na agenda ao confirmar pelo card (aba Confirmação),
            não ao arrastar o card para a coluna Confirmado.
          </p>
          <p className="text-xs text-muted-foreground">
            Se o Google mostrar &quot;O Google não verificou este app&quot;, clique em
            <strong> Avançado</strong> e depois em <strong>Ir para Hora da Festa CRM (não seguro)</strong>.
            Isso é normal enquanto o app estiver em modo de teste no Google Cloud.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <a href="/api/google/connect">Conectar Google Calendar</a>
            </Button>
            {isGoogleConnected && (
              <Button
                type="button"
                variant="secondary"
                disabled={syncingCalendar}
                onClick={syncPendingCalendarEvents}
              >
                {syncingCalendar ? "Sincronizando..." : "Sincronizar calendário"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Link público do formulário</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm break-all text-primary">{publicUrl}</p>
          <div className="flex gap-2">
            <Button onClick={copyLink}>Copiar link</Button>
          </div>
          <div className="flex justify-center rounded-xl border border-border bg-muted/40 p-4 dark:bg-muted/30">
            <div className="rounded-lg bg-white p-3">
              <QRCodeSVG value={publicUrl} size={160} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Button onClick={save} disabled={saving} size="lg" className="w-full">
        {saving ? "Salvando..." : "Salvar configurações"}
      </Button>
    </div>
  );
}

export default function ConfiguracoesPage() {
  return (
    <Suspense fallback={<div className="animate-pulse h-64 bg-muted rounded-xl" />}>
      <ConfiguracoesContent />
    </Suspense>
  );
}
