"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import type { CartDto } from "@sportarena/types";
import { apiFetch } from "@/lib/api";
import { useAuthStore } from "@/store/auth";
import { useAuthReady } from "@/hooks/use-auth-ready";

/** IDs de produtos já presentes no carrinho (cache compartilhado do React Query). */
export function useCartProductIds() {
  const authReady = useAuthReady();
  const accessToken = useAuthStore((s) => s.accessToken);

  const { data: cart } = useQuery({
    queryKey: ["cart"],
    queryFn: () => apiFetch<CartDto>("/cart", { token: accessToken! }),
    enabled: authReady && !!accessToken,
  });

  const ids = useMemo(
    () => new Set((cart?.items ?? []).map((i) => i.product.id)),
    [cart?.items]
  );

  return {
    ids,
    itemCount: cart?.itemCount ?? 0,
    isInCart: (productId: string) => ids.has(productId),
  };
}
