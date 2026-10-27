"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { createClient } from "../../lib/supabase/client";

const TABELAS = ["agendamentos", "bloqueios_agenda"] as const;

export function TempoReal() {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    let canal = supabase.channel("agenda");
    for (const table of TABELAS) {
      canal = canal.on("postgres_changes", { event: "*", schema: "public", table }, () =>
        router.refresh(),
      );
    }
    canal.subscribe();
    return () => {
      void supabase.removeChannel(canal);
    };
  }, [router]);

  return null;
}
