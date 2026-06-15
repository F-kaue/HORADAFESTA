"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/types/database";

export function useReportBranding() {
  const [branding, setBranding] = useState({
    businessName: "Hora da Festa",
    cnpj: null as string | null,
    logoUrl: "/logo.png",
  });

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("profiles")
      .select("business_name, cnpj")
      .single()
      .then(({ data }) => {
        if (!data) return;
        const p = data as Profile;
        setBranding({
          businessName: p.business_name || "Hora da Festa",
          cnpj: p.cnpj ?? null,
          logoUrl: "/logo.png",
        });
      });
  }, []);

  return branding;
}
