"use client";

import { formatCurrency } from "@sportarena/utils";
import type { ProductDto } from "@sportarena/types";
import { ShoppingCart } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function ProductCard({
  product,
  onAdd,
  adding,
}: {
  product: ProductDto;
  onAdd?: () => void;
  adding?: boolean;
}) {
  return (
    <Card className="overflow-hidden flex flex-col">
      <div className="h-36 bg-gradient-to-br from-brand-50 to-brand-100 flex items-center justify-center text-5xl">
        {product.category?.icon ?? "🏅"}
      </div>
      <div className="p-4 flex flex-col flex-1 gap-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs text-muted">{product.brand}</p>
            <h3 className="font-semibold text-slate-900 leading-snug line-clamp-2">
              {product.name}
            </h3>
          </div>
        </div>
        <p className="text-xs text-muted line-clamp-2">{product.description}</p>
        <div className="flex flex-wrap gap-1.5 text-[11px]">
          {product.size && (
            <span className="px-2 py-0.5 rounded-lg bg-slate-100">Tam. {product.size}</span>
          )}
          {product.color && (
            <span className="px-2 py-0.5 rounded-lg bg-slate-100">{product.color}</span>
          )}
          {product.sport && (
            <span className="px-2 py-0.5 rounded-lg bg-brand-50 text-brand-700">
              {product.sport}
            </span>
          )}
        </div>
        <div className="mt-auto pt-2 flex items-end justify-between gap-2">
          <div>
            <p className="text-lg font-bold text-slate-900">
              {formatCurrency(product.price)}
            </p>
            {product.compareAt && (
              <p className="text-xs text-muted line-through">
                {formatCurrency(product.compareAt)}
              </p>
            )}
          </div>
          {onAdd && (
            <Button size="sm" onClick={onAdd} disabled={adding || product.stock < 1}>
              <ShoppingCart className="w-3.5 h-3.5 mr-1" />
              {product.stock < 1 ? "Esgotado" : "Carrinho"}
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
