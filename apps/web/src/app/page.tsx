"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Search, X } from "lucide-react";
import type { ProductDto } from "@sportarena/types";
import { Header } from "@/components/layout/header";
import { Pagination } from "@/components/pagination";
import { ProductCard } from "@/components/product-card";
import { Input } from "@/components/ui/input";
import { apiFetch } from "@/lib/api";
import { findCollectionLabel } from "@/lib/categories";
import { useAuthStore } from "@/store/auth";
import { useRouter, useSearchParams } from "next/navigation";

type RecommendationsResponse = {
  message: string;
  basedOn: ProductDto | null;
  products: ProductDto[];
};

type ProductPage = {
  items: ProductDto[];
  page: number;
  totalPages: number;
  total: number;
  section: { slug: string; label: string } | null;
  sections: { slug: string; label: string; total: number; firstPage: number; pageCount: number }[];
};

function Spinner() {
  return (
    <div className="flex justify-center py-20">
      <div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function buildQuery(params: { q?: string; collection?: string; page?: number }) {
  const sp = new URLSearchParams();
  if (params.q) sp.set("q", params.q);
  if (params.collection) sp.set("collection", params.collection);
  if (params.page && params.page > 1) sp.set("page", String(params.page));
  const qs = sp.toString();
  return qs ? `?${qs}` : "";
}

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen">
          <Header />
          <Spinner />
        </div>
      }
    >
      <HomeContent />
    </Suspense>
  );
}

function HomeContent() {
  const searchParams = useSearchParams();
  const search = searchParams.get("q")?.trim() ?? "";
  const collection = searchParams.get("collection") ?? "";
  const collectionLabel = collection ? findCollectionLabel(collection) : null;
  const requestedPage = Math.max(1, Number(searchParams.get("page")) || 1);

  const [q, setQ] = useState(search);
  const accessToken = useAuthStore((s) => s.accessToken);
  const router = useRouter();
  const queryClient = useQueryClient();

  useEffect(() => {
    setQ(search);
  }, [search]);

  const { data: catalog, isLoading } = useQuery({
    queryKey: ["products", search, collection, requestedPage],
    queryFn: () =>
      apiFetch<ProductPage>(
        `/products${buildQuery({ q: search, collection, page: requestedPage })}`
      ),
    placeholderData: (previous) => previous,
  });
  const products = catalog?.items ?? [];
  const page = catalog?.page ?? requestedPage;
  const totalPages = catalog?.totalPages ?? 0;
  const pageHref = (p: number) => `/${buildQuery({ q: search, collection, page: p })}`;

  const { data: recommendations, isLoading: loadingRecs } = useQuery({
    queryKey: ["recommendations", accessToken ?? "guest"],
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

  const showSuggestions =
    !search &&
    !collection &&
    page === 1 &&
    recommendations?.basedOn &&
    (recommendations.products?.length ?? 0) > 0;

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
              router.push(`/${buildQuery({ q: q.trim(), collection })}`);
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

        {showSuggestions && (
          <section className="mb-10">
            <h2 className="text-xl font-bold text-slate-900 mb-1">
              Se você gostou do produto{" "}
              <span className="text-brand-700">{recommendations.basedOn!.name}</span>
              , pode gostar destes
            </h2>
            <p className="text-sm text-muted mb-5">
              Sugestões com base no mesmo esporte ou categoria.
            </p>
            {loadingRecs ? (
              <div className="flex justify-center py-10">
                <div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {recommendations!.products.map((p) => (
                  <ProductCard
                    key={p.id}
                    product={p}
                    onAdd={() => handleAdd(p.id)}
                    adding={addMutation.isPending}
                  />
                ))}
              </div>
            )}
          </section>
        )}

        <section>
          <div className="mb-5 flex flex-wrap items-center gap-x-3 gap-y-2">
            <h2 className="text-xl font-bold text-slate-900">
              {collection
                ? collectionLabel ?? "Categoria não encontrada"
                : search
                  ? `Resultados para "${search}"${catalog?.section ? ` · ${catalog.section.label}` : ""}`
                  : catalog?.section?.label ?? "Catálogo"}
            </h2>
            {collection && (
              <Link
                href={`/${buildQuery({ q: search })}`}
                className="inline-flex min-h-9 items-center gap-1 rounded-full border border-border px-3 text-sm text-slate-600 transition hover:bg-slate-50 active:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
              >
                <X className="w-3.5 h-3.5" aria-hidden />
                Limpar filtro
              </Link>
            )}
            {catalog && catalog.total > 0 && (
              <span className="text-sm text-muted">
                {catalog.total} {catalog.total === 1 ? "produto" : "produtos"}
                {collection && search ? ` para "${search}"` : ""}
                {totalPages > 1 && ` · página ${page} de ${totalPages}`}
              </span>
            )}
          </div>

          {isLoading ? (
            <Spinner />
          ) : products.length === 0 ? (
            <p className="text-center text-muted py-16">
              Nenhum produto encontrado{search ? ` para "${search}"` : ""}.
            </p>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
                {products.map((p) => (
                  <ProductCard
                    key={p.id}
                    product={p}
                    onAdd={() => handleAdd(p.id)}
                    adding={addMutation.isPending}
                  />
                ))}
              </div>
              <Pagination page={page} totalPages={totalPages} hrefFor={pageHref} />
            </>
          )}
        </section>
      </main>
    </div>
  );
}
