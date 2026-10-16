"use client";

import { useState } from "react";
import Link from "next/link";
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
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <Card className="overflow-hidden flex flex-col">
      <Link href={`/products/${product.id}`} className="block">
        <div className="relative aspect-square bg-slate-100 overflow-hidden">
          {product.imageUrl && !imageFailed ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-full h-full object-cover transition hover:scale-[1.03]"
              loading="lazy"
              referrerPolicy="no-referrer"
              onError={() => setImageFailed(true)}
            />
          ) : (
            <div className="h-full flex items-center justify-center text-5xl bg-gradient-to-br from-brand-50 to-brand-100">
              {product.category?.icon ?? "🏅"}
            </div>
          )}
        </div>
      </Link>
      <div className="p-4 flex flex-col flex-1 gap-2">
        <Link href={`/products/${product.id}`} className="min-w-0">
          <p className="text-xs text-muted">{product.brand}</p>
          <h3 className="font-semibold text-slate-900 leading-snug line-clamp-2 hover:text-brand-700">
            {product.name}
          </h3>
        </Link>
        <p className="text-xs text-muted line-clamp-2">{product.description}</p>
        <div className="flex flex-wrap gap-1.5 text-[11px]">
          {product.sport && (
            <span className="px-2 py-0.5 rounded-lg bg-brand-50 text-brand-700">
              {product.sport}
            </span>
          )}
        </div>
        <div className="mt-auto pt-2 flex flex-wrap items-end justify-between gap-2">
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
          <div className="flex gap-2">
            <Link href={`/products/${product.id}`}>
              <Button size="sm" variant="secondary">
                Ver
              </Button>
            </Link>
            {onAdd && (
              <Button size="sm" onClick={onAdd} disabled={adding || product.stock < 1}>
                <ShoppingCart className="w-3.5 h-3.5 mr-1" />
                {product.stock < 1 ? "Esgotado" : "Carrinho"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
