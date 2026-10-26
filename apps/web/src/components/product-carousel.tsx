"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { ProductDto } from "@sportarena/types";
import { ProductCard } from "@/components/product-card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const VISIBLE = 1;

export function ProductCarousel({
  products,
  onAdd,
  adding,
  autoMs = 4000,
}: {
  products: ProductDto[];
  onAdd?: (productId: string) => void;
  adding?: boolean;
  autoMs?: number;
}) {
  const items = products.slice(0, 6);
  const [index, setIndex] = useState(0);
  const idsKey = items.map((p) => p.id).join("|");

  useEffect(() => {
    setIndex(0);
  }, [idsKey]);

  useEffect(() => {
    if (items.length <= VISIBLE) return;
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % items.length);
    }, autoMs);
    return () => window.clearInterval(id);
  }, [items.length, autoMs]);

  if (!items.length) return null;

  const current = items[index % items.length];

  function go(delta: number) {
    setIndex((i) => (i + delta + items.length) % items.length);
  }

  return (
    <div className="relative mx-auto w-full max-w-[280px] sm:max-w-xs">
      <div className="overflow-hidden">
        <div key={current.id} className="transition-opacity duration-300">
          <ProductCard
            product={current}
            onAdd={onAdd ? () => onAdd(current.id) : undefined}
            adding={adding}
          />
        </div>
      </div>

      {items.length > 1 && (
        <>
          <div className="mt-3 flex items-center justify-between gap-2">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              aria-label="Anterior"
              onClick={() => go(-1)}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <div className="flex items-center gap-1.5">
              {items.map((p, i) => (
                <button
                  key={p.id}
                  type="button"
                  aria-label={`Produto ${i + 1}`}
                  onClick={() => setIndex(i)}
                  className={cn(
                    "h-2 rounded-full transition-all",
                    i === index
                      ? "w-5 bg-brand-600"
                      : "w-2 bg-slate-300 hover:bg-slate-400"
                  )}
                />
              ))}
            </div>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              aria-label="Próximo"
              onClick={() => go(1)}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
          <p className="mt-2 text-center text-xs text-muted">
            {index + 1} / {items.length}
          </p>
        </>
      )}
    </div>
  );
}
