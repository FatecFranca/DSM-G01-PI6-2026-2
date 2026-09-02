"use client";

import { useQuery } from "@tanstack/react-query";
import type { ProductDto } from "@sportarena/types";
import { Header } from "@/components/layout/header";
import { ProductCard } from "@/components/product-card";
import { Card } from "@/components/ui/card";
import { apiFetch } from "@/lib/api";

export default function ForYouPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["recommendations"],
    queryFn: () =>
      apiFetch<{
        message: string;
        algorithm: string;
        products: ProductDto[];
      }>("/products/recommendations"),
  });

  return (
    <div className="min-h-screen">
      <Header />
      <main className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-2">Para você</h1>
        <p className="text-muted mb-6">
          Recomendações personalizadas — próximo passo do projeto.
        </p>

        <Card className="p-4 mb-6 bg-brand-50 border-brand-100 text-sm text-brand-800">
          {data?.message ??
            "Em breve: recomendações com base no seu histórico de compras e produtos relacionados."}
        </Card>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {data?.products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
