import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isDateInRange } from "@/lib/finance-period";
import { z } from "zod";

export const dynamic = "force-dynamic";

const schema = z.object({
  description: z.string().min(2),
  supplier: z.string().optional(),
  category: z.string().default("Outro"),
  amount: z.number().positive(),
  due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  paid_date: z.string().optional(),
  status: z.enum(["pendente", "pago", "cancelado"]).default("pendente"),
  holder: z.string().optional(),
  payment_method: z.string().optional(),
  notes: z.string().optional(),
  lead_id: z.string().uuid().nullable().optional(),
});

function mapPayableRow(row: Record<string, unknown>) {
  const leads = row.leads as { name?: string } | null | undefined;
  return {
    ...row,
    amount: Number(row.amount),
    lead_id: (row.lead_id as string | null) ?? null,
    client_name: leads?.name ?? null,
    status: row.status as string,
    paid_date: (row.paid_date as string | null) ?? null,
    due_date: row.due_date as string,
    leads: undefined,
  };
}

function matchesPeriodFilter(
  item: {
    status: string;
    paid_date: string | null;
    due_date: string;
  },
  from: string,
  to: string
) {
  const range = { from, to };
  if (item.status === "pago" && item.paid_date) {
    return isDateInRange(item.paid_date, range);
  }
  if (item.status === "pendente") {
    return isDateInRange(item.due_date, range);
  }
  return false;
}

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  let q = supabase
    .from("accounts_payable")
    .select("*, leads(name)")
    .order("due_date");

  const status = searchParams.get("status");
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const category = searchParams.get("category");
  const holder = searchParams.get("holder");
  const paymentMethod = searchParams.get("payment_method");
  const leadId = searchParams.get("lead_id");

  if (status) q = q.eq("status", status);
  if (category) q = q.eq("category", category);
  if (holder) q = q.eq("holder", holder);
  if (paymentMethod) q = q.eq("payment_method", paymentMethod);
  if (leadId) q = q.eq("lead_id", leadId);

  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  let items = (data ?? []).map((row) => mapPayableRow(row as Record<string, unknown>));

  if (from && to) {
    items = items.filter((item) => matchesPeriodFilter(item, from, to));
  }

  const { data: holderRows } = await supabase
    .from("accounts_payable")
    .select("holder")
    .not("holder", "is", null);

  const holders = Array.from(
    new Set(
      (holderRows ?? [])
        .map((r) => r.holder as string)
        .filter((h) => h.trim().length > 0)
    )
  ).sort();

  const periodPaidOut = items
    .filter((item) => item.status === "pago")
    .reduce((s, item) => s + Number(item.amount), 0);

  return NextResponse.json({
    items,
    holders,
    periodPaidOut,
  });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }

  const payload = {
    ...parsed.data,
    user_id: user.id,
    lead_id: parsed.data.lead_id ?? null,
    paid_date:
      parsed.data.status === "pago"
        ? parsed.data.paid_date ?? new Date().toISOString().slice(0, 10)
        : null,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("accounts_payable")
    .insert(payload)
    .select("*, leads(name)")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(mapPayableRow(data as Record<string, unknown>), {
    status: 201,
  });
}
