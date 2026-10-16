import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

/** Números visíveis: sempre a primeira, a última e duas vizinhas da atual; o resto vira "…". */
function visiblePages(page: number, totalPages: number): (number | "gap")[] {
  const wanted = new Set([1, totalPages, page - 2, page - 1, page, page + 1, page + 2]);
  const pages = [...wanted].filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b);
  const out: (number | "gap")[] = [];
  pages.forEach((p, i) => {
    if (i > 0 && p - pages[i - 1] > 1) out.push("gap");
    out.push(p);
  });
  return out;
}

const itemClass =
  "inline-flex h-11 min-w-11 items-center justify-center rounded-xl px-3 text-sm font-medium transition " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2";

export function Pagination({
  page,
  totalPages,
  hrefFor,
}: {
  page: number;
  totalPages: number;
  hrefFor: (page: number) => string;
}) {
  if (totalPages <= 1) return null;

  const edge = (target: number, disabled: boolean, label: string, children: React.ReactNode) =>
    disabled ? (
      <span aria-disabled="true" className={cn(itemClass, "gap-1 text-slate-300")}>
        {children}
      </span>
    ) : (
      <Link
        href={hrefFor(target)}
        aria-label={label}
        className={cn(itemClass, "gap-1 text-slate-700 hover:bg-slate-100 active:bg-slate-200")}
      >
        {children}
      </Link>
    );

  return (
    <nav aria-label="Paginação" className="mt-10 flex justify-center">
      <ul className="flex flex-wrap items-center justify-center gap-1">
        <li>
          {edge(
            page - 1,
            page <= 1,
            "Página anterior",
            <>
              <ChevronLeft className="h-4 w-4" aria-hidden />
              <span className="hidden sm:inline">Anterior</span>
            </>
          )}
        </li>
        {visiblePages(page, totalPages).map((p, i) =>
          p === "gap" ? (
            <li key={`gap-${i}`} aria-hidden className="px-1 text-muted">
              …
            </li>
          ) : (
            <li key={p}>
              <Link
                href={hrefFor(p)}
                aria-label={`Página ${p}`}
                aria-current={p === page ? "page" : undefined}
                className={cn(
                  itemClass,
                  p === page
                    ? "bg-brand-600 text-white hover:bg-brand-700"
                    : "text-slate-700 hover:bg-slate-100 active:bg-slate-200"
                )}
              >
                {p}
              </Link>
            </li>
          )
        )}
        <li>
          {edge(
            page + 1,
            page >= totalPages,
            "Próxima página",
            <>
              <span className="hidden sm:inline">Próxima</span>
              <ChevronRight className="h-4 w-4" aria-hidden />
            </>
          )}
        </li>
      </ul>
    </nav>
  );
}
