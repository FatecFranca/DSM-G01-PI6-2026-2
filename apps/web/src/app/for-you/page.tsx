"use client";

import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ProductDto } from "@sportarena/types";
import { Header } from "@/components/layout/header";
import { ProductCard } from "@/components/product-card";
import { Card } from "@/components/ui/card";
import { apiFetch } from "@/lib/api";
import { useAuthStore } from "@/store/auth";

type RecommendationsResponse = {
  message: string;
  algorithm: string;
  basedOn: ProductDto | null;
  products: ProductDto[];
};

export default function ForYouPage() {
  const router = useRouter();
  const accessToken = useAuthStore((s) => s.accessToken);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["recommendations", "for-you", accessToken ?? "guest"],
    queryFn: () =>
      apiFetch<RecommendationsResponse>("/products/recommendations", {
        token: accessToken!,
      }),
    enabled: Boolean(accessToken),
  });

  const addMutation = useMutation({
    mutationFn: (productId: string) =>
      apiFetch("/cart/items", {
        method: "POST",
        token: accessToken!,
        body: JSON.stringify({ productId, quantity: 1 }),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["cart"] }),
  });

  return (
    <div className="min-h-screen">
      <Header />
      <main className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-2">Para você</h1>
        <p className="text-muted mb-6">
          Quem comprou isso também gostou — produtos que você também pode gostar.
        </p>

        {!accessToken ? (
          <Card className="p-6 text-sm text-muted">
            Faça login para ver sugestões personalizadas.
          </Card>
        ) : (
          <>
            <Card className="p-4 mb-6 bg-brand-50 border-brand-100 text-sm text-brand-800">
              {data?.message ??
                "Produtos que você também pode gostar"}
            </Card>

            {isLoading ? (
              <div className="flex justify-center py-16">
                <div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (data?.products?.length ?? 0) > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {data!.products.map((p) => (
                  <ProductCard
                    key={p.id}
                    product={p}
                    onAdd={() => {
                      if (!accessToken) {
                        router.push("/login");
                        return;
                      }
                      addMutation.mutate(p.id);
                    }}
                    adding={addMutation.isPending}
                  />
                ))}
              </div>
            ) : (
              <Card className="p-8 text-center text-muted">
                Nenhuma sugestão ainda. Adicione produtos ao carrinho ou finalize
                uma compra.
              </Card>
            )}
          </>
        )}
      </main>
    </div>
  );
}
