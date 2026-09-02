"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formatCurrency } from "@sportarena/utils";
import type { CartDto } from "@sportarena/types";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { apiFetch } from "@/lib/api";
import { useAuthStore } from "@/store/auth";

export default function CartPage() {
  const router = useRouter();
  const accessToken = useAuthStore((s) => s.accessToken);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!accessToken) router.replace("/login");
  }, [accessToken, router]);

  const { data: cart, isLoading } = useQuery({
    queryKey: ["cart"],
    queryFn: () => apiFetch<CartDto>("/cart", { token: accessToken! }),
    enabled: !!accessToken,
  });

  const checkout = useMutation({
    mutationFn: () =>
      apiFetch("/orders/checkout", { method: "POST", token: accessToken! }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["purchased"] });
      router.push("/orders");
    },
  });

  const removeItem = useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/cart/items/${id}`, { method: "DELETE", token: accessToken! }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["cart"] }),
  });

  if (!accessToken) return null;

  return (
    <div className="min-h-screen">
      <Header />
      <main className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Carrinho</h1>
        {isLoading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : !cart?.items.length ? (
          <Card className="p-10 text-center text-muted">
            Seu carrinho está vazio.
          </Card>
        ) : (
          <div className="space-y-4">
            {cart.items.map((item) => (
              <Card key={item.id} className="p-4 flex items-center justify-between gap-4">
                <div>
                  <p className="font-semibold">{item.product.name}</p>
                  <p className="text-sm text-muted">
                    {item.quantity} × {formatCurrency(item.product.price)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <p className="font-bold">
                    {formatCurrency(item.product.price * item.quantity)}
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeItem.mutate(item.id)}
                  >
                    Remover
                  </Button>
                </div>
              </Card>
            ))}
            <Card className="p-5 flex items-center justify-between">
              <div>
                <p className="text-sm text-muted">Total</p>
                <p className="text-2xl font-bold">{formatCurrency(cart.total)}</p>
              </div>
              <Button
                size="lg"
                onClick={() => checkout.mutate()}
                disabled={checkout.isPending}
              >
                {checkout.isPending ? "Finalizando..." : "Finalizar compra"}
              </Button>
            </Card>
            {checkout.isError && (
              <p className="text-sm text-red-500">
                {(checkout.error as Error).message}
              </p>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
