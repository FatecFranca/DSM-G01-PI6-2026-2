"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Search } from "lucide-react";
import type { ProductDto } from "@sportarena/types";
import { Header } from "@/components/layout/header";
import { ProductCard } from "@/components/product-card";
import { Input } from "@/components/ui/input";
import { apiFetch } from "@/lib/api";
import { useAuthStore } from "@/store/auth";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const [q, setQ] = useState("");
  const [search, setSearch] = useState("");
  const accessToken = useAuthStore((s) => s.accessToken);
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["products", search],
    queryFn: () =>
      apiFetch<ProductDto[]>(
        `/products${search ? `?q=${encodeURIComponent(search)}` : ""}`
      ),
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
    },
  });

  function handleAdd(productId: string) {
    if (!accessToken) {
      router.push("/login");
      return;
    }
    addMutation.mutate(productId);
  }

  return (
    <div className="min-h-screen">
      <Header />
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Artigos esportivos
          </h1>
          <p className="text-muted mb-6">
            Encontre tênis, camisas, bolas e equipamentos para o seu esporte.
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setSearch(q.trim());
            }}
            className="relative max-w-xl"
          >
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
            <Input
              className="pl-11"
              placeholder="Buscar por nome, marca ou esporte..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </form>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : products.length === 0 ? (
          <p className="text-center text-muted py-16">
            Nenhum produto encontrado{search ? ` para "${search}"` : ""}.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {products.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                onAdd={() => handleAdd(p.id)}
                adding={addMutation.isPending}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
