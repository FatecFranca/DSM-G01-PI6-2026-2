"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ShoppingCart } from "lucide-react";
import { formatCurrency } from "@sportarena/utils";
import type { ProductDto } from "@sportarena/types";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";
import { useAuthStore } from "@/store/auth";
import { cn } from "@/lib/utils";

export default function ProductDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const accessToken = useAuthStore((s) => s.accessToken);
  const queryClient = useQueryClient();

  const { data: product, isLoading, error } = useQuery({
    queryKey: ["product", params.id],
    queryFn: () => apiFetch<ProductDto>(`/products/${params.id}`),
    enabled: Boolean(params.id),
  });

  const [size, setSize] = useState<string>("");
  const [color, setColor] = useState<string>("");
  const [imageFailed, setImageFailed] = useState(false);

  const selectedSize = size || product?.availableSizes[0] || product?.size || "";
  const selectedColor =
    color || product?.availableColors[0] || product?.color || "";

  const addMutation = useMutation({
    mutationFn: () =>
      apiFetch("/cart/items", {
        method: "POST",
        token: accessToken!,
        body: JSON.stringify({
          productId: product!.id,
          quantity: 1,
          size: selectedSize || undefined,
          color: selectedColor || undefined,
        }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      router.push("/cart");
    },
  });

  function handleAdd() {
    if (!accessToken) {
      router.push("/login");
      return;
    }
    if (product?.availableSizes.length && !selectedSize) return;
    if (product?.availableColors.length && !selectedColor) return;
    addMutation.mutate();
  }

  return (
    <div className="min-h-screen">
      <Header />
      <main className="max-w-6xl mx-auto px-4 py-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-muted hover:text-brand-700 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar ao catálogo
        </Link>

        {isLoading ? (
          <div className="flex justify-center py-24">
            <div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : error || !product ? (
          <p className="text-center text-muted py-16">Produto não encontrado.</p>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">
            <div className="rounded-2xl overflow-hidden bg-white border border-border shadow-sm aspect-square">
              {product.imageUrl && !imageFailed ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                  onError={() => setImageFailed(true)}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-7xl bg-brand-50">
                  {product.category?.icon ?? "🏅"}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-5">
              <div>
                <p className="text-sm text-muted mb-1">{product.brand}</p>
                <h1 className="text-3xl font-bold text-slate-900 leading-tight">
                  {product.name}
                </h1>
                {product.sport && (
                  <span className="inline-block mt-3 px-3 py-1 rounded-lg bg-brand-50 text-brand-700 text-sm font-medium">
                    {product.sport}
                  </span>
                )}
              </div>

              <div>
                <p className="text-3xl font-bold text-slate-900">
                  {formatCurrency(product.price)}
                </p>
                {product.compareAt && (
                  <p className="text-sm text-muted line-through">
                    {formatCurrency(product.compareAt)}
                  </p>
                )}
                <p className="text-sm text-muted mt-1">
                  {product.stock > 0
                    ? `${product.stock} em estoque`
                    : "Esgotado"}
                </p>
              </div>

              <div>
                <h2 className="text-sm font-semibold text-slate-800 mb-2">
                  Descrição
                </h2>
                <p className="text-slate-600 leading-relaxed">
                  {product.description}
                </p>
              </div>

              {product.availableSizes.length > 0 && (
                <div>
                  <h2 className="text-sm font-semibold text-slate-800 mb-2">
                    {product.category?.slug === "calcados"
                      ? "Numeração"
                      : product.category?.slug === "bolas"
                        ? "Tamanho da bola"
                        : "Tamanho"}
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {product.availableSizes.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setSize(s)}
                        className={cn(
                          "min-w-11 h-11 px-3 rounded-xl border text-sm font-medium transition",
                          selectedSize === s
                            ? "border-brand-600 bg-brand-50 text-brand-800"
                            : "border-border bg-white text-slate-700 hover:border-brand-300"
                        )}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {product.availableColors.length > 0 && (
                <div>
                  <h2 className="text-sm font-semibold text-slate-800 mb-2">
                    Cor
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {product.availableColors.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setColor(c)}
                        className={cn(
                          "px-3 h-11 rounded-xl border text-sm font-medium transition",
                          selectedColor === c
                            ? "border-brand-600 bg-brand-50 text-brand-800"
                            : "border-border bg-white text-slate-700 hover:border-brand-300"
                        )}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {addMutation.isError && (
                <p className="text-sm text-red-500">
                  {(addMutation.error as Error).message}
                </p>
              )}

              <Button
                size="lg"
                className="w-full sm:w-auto"
                disabled={product.stock < 1 || addMutation.isPending}
                onClick={handleAdd}
              >
                <ShoppingCart className="w-4 h-4 mr-2" />
                {product.stock < 1
                  ? "Esgotado"
                  : addMutation.isPending
                    ? "Adicionando..."
                    : "Adicionar ao carrinho"}
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
