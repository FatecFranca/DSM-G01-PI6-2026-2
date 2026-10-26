"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/auth";

/** Evita redirect falso para /login antes do persist do Zustand reidratar. */
export function useAuthReady() {
  // Sempre inicia false no servidor/cliente; só marca ready no useEffect (após montar).
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const api = useAuthStore.persist;
    if (!api) {
      setReady(true);
      return;
    }

    if (api.hasHydrated()) {
      setReady(true);
      return;
    }

    const unsub = api.onFinishHydration(() => setReady(true));
    // Em alguns ambientes a hidratação já terminou entre o check e o subscribe
    if (api.hasHydrated()) setReady(true);
    return unsub;
  }, []);

  return ready;
}
