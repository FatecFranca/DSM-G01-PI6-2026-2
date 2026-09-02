"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { formatCurrency, formatDate } from "@sportarena/utils";
import type { OrderDto, ProductDto } from "@sportarena/types";
import { Header } from "@/components/layout/header";
import { ProductCard } from "@/components/product-card";
import { Card } from "@/components/ui/card";
import { apiFetch } from "@/lib/api";
import { useAuthStore } from "@/store/auth";

export default function OrdersPage() {
  const router = useRouter();
  const accessToken = useAuthStore((s) => s.accessToken);

  useEffect(() => {
    if (!accessToken) router.replace("/login");
  }, [accessToken, router]);

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["orders"],
    queryFn: () => apiFetch<OrderDto[]>("/orders", { token: accessToken! }),
    enabled: !!accessToken,
  });

  const { data: purchased = [] } = useQuery({
    queryKey: ["purchased"],
    queryFn: () =>
      apiFetch<ProductDto[]>("/orders/purchased", { token: accessToken! }),
    enabled: !!accessToken,
  });

  if (!accessToken) return null;

  return (
    <div className="min-h-screen">
      <Header />
      <main className="max-w-6xl mx-auto px-4 py-8 space-y-10">
        <section>
          <h1 className="text-2xl font-bold mb-2">Você comprou</h1>
          <p className="text-muted mb-6">
            Histórico de pedidos e produtos adquiridos — base para recomendações futuras.
          </p>

          {purchased.length > 0 && (
            <div className="mb-8">
              <h2 className="text-sm font-medium text-muted mb-3">
                Produtos no seu histórico
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {purchased.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            </div>
          )}

          {isLoading ? (
            <div className="flex justify-center py-16">
              <div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : orders.length === 0 ? (
            <Card className="p-10 text-center text-muted">
              Você ainda não fez nenhuma compra.
            </Card>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <Card key={order.id} className="p-5">
                  <div className="flex justify-between gap-4 mb-3">
                    <div>
                      <p className="font-semibold">Pedido #{order.id.slice(0, 8)}</p>
                      <p className="text-xs text-muted">{formatDate(order.createdAt)}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{formatCurrency(order.total)}</p>
                      <p className="text-xs text-brand-700">{order.status}</p>
                    </div>
                  </div>
                  <ul className="text-sm text-slate-600 space-y-1">
                    {order.items.map((i) => (
                      <li key={i.id}>
                        {i.quantity}× {i.product.name} — {formatCurrency(i.unitPrice)}
                      </li>
                    ))}
                  </ul>
                </Card>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
