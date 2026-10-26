"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formatCurrency } from "@sportarena/utils";
import type { CartDto, ProductDto } from "@sportarena/types";
import { Header } from "@/components/layout/header";
import { ProductCarousel } from "@/components/product-carousel";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { apiFetch } from "@/lib/api";
import { useAuthStore } from "@/store/auth";
import { useAuthReady } from "@/hooks/use-auth-ready";

type RecommendationsResponse = {
  algorithm: string;
  message: string;
  basedOn: ProductDto | null;
  products: ProductDto[];
};

export default function CartPage() {
  const router = useRouter();
  const authReady = useAuthReady();
  const accessToken = useAuthStore((s) => s.accessToken);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (authReady && !accessToken) router.replace("/login");
  }, [authReady, accessToken, router]);

  const { data: cart, isLoading } = useQuery({
    queryKey: ["cart"],
    queryFn: () => apiFetch<CartDto>("/cart", { token: accessToken! }),
    enabled: authReady && !!accessToken,
  });

  const productIds = (cart?.items ?? []).map((i) => i.product.id).join(",");

  const { data: recommendations, isLoading: loadingRecs } = useQuery({
    queryKey: ["recommendations", "cart", productIds],
    queryFn: () =>
      apiFetch<RecommendationsResponse>(
        `/products/recommendations?productIds=${encodeURIComponent(productIds)}`,
        { token: accessToken! }
      ),
    enabled: authReady && !!accessToken && productIds.length > 0,
  });

  const checkout = useMutation({
    mutationFn: () =>
      apiFetch("/orders/checkout", { method: "POST", token: accessToken! }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["purchased"] });
      queryClient.invalidateQueries({ queryKey: ["recommendations"] });
      router.push("/orders");
    },
  });

  const removeItem = useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/cart/items/${id}`, { method: "DELETE", token: accessToken! }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      queryClient.invalidateQueries({ queryKey: ["recommendations"] });
    },
  });

  const addMutation = useMutation({
    mutationFn: (productId: string) =>
      apiFetch("/cart/items", {
        method: "POST",
        token: accessToken!,
        body: JSON.stringify({ productId, quantity: 1 }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      queryClient.invalidateQueries({ queryKey: ["recommendations"] });
    },
  });

  if (!authReady || !accessToken) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

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
              <Card
                key={item.id}
                className="p-4 flex items-center justify-between gap-4"
              >
                <div>
                  <p className="font-semibold">{item.product.name}</p>
                  <p className="text-sm text-muted">
                    {item.quantity} × {formatCurrency(item.product.price)}
                    {item.size ? ` · Tam. ${item.size}` : ""}
                    {item.color ? ` · ${item.color}` : ""}
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

        {productIds.length > 0 && (
          <section className="mt-12">
            <h2 className="text-xl font-bold text-slate-900 mb-1">
              Quem comprou isso também gostou:
            </h2>
            <p className="text-sm text-muted mb-5">
              {recommendations?.message ??
                "Produtos que você também pode gostar"}
            </p>
            {loadingRecs ? (
              <div className="flex justify-center py-10">
                <div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (recommendations?.products?.length ?? 0) > 0 ? (
              <ProductCarousel
                products={(recommendations?.products ?? []).slice(0, 6)}
                onAdd={(id) => addMutation.mutate(id)}
                adding={addMutation.isPending}
              />
            ) : (
              <Card className="p-6 text-sm text-muted">
                Ainda não há pares associados para os itens do carrinho.
              </Card>
            )}
          </section>
        )}
      </main>
    </div>
  );
}
