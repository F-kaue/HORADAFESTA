import { z } from "zod";

export const createLeadSchema = z.object({
  name: z.string().min(2, "Nome muito curto"),
  whatsapp: z.string().min(10, "WhatsApp inválido"),
  event_date: z.string().optional(),
  slot_type: z.enum(["manha", "tarde", "noite", "dia_todo"]).optional(),
  location: z.string().min(2, "Informe o local"),
  neighborhood: z.string().min(2, "Informe o bairro"),
  guest_count: z.number().min(1).default(100),
  event_type: z.string().min(1, "Selecione o tipo"),
  observations: z.string().optional(),
});

export type CreateLeadInput = z.infer<typeof createLeadSchema>;
