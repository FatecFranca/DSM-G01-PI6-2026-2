"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, ChevronRight, LayoutGrid, Menu, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { CATEGORY_MENU, collectionHref } from "@/lib/categories";

export type NavLink = { href: string; label: string; icon: LucideIcon };

const rowLinkClass =
  "flex min-h-11 flex-1 items-center rounded-xl px-3 text-sm font-medium text-slate-700 transition-colors " +
  "hover:bg-brand-50 hover:text-brand-800 active:bg-brand-100 " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-500";

export function CategoryMenu({ links = [] }: { links?: NavLink[] }) {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const rootRef = useRef<HTMLElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();
  const pathname = usePathname();

  const close = useCallback(() => {
    setOpen(false);
    setExpanded(null);
  }, []);

  useEffect(() => {
    close();
  }, [pathname, close]);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(e: PointerEvent) {
      if (!rootRef.current?.contains(e.target as Node)) close();
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== "Escape") return;
      close();
      triggerRef.current?.focus();
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, close]);

  return (
    <nav ref={rootRef} aria-label="Categorias" className="md:relative">
      <button
        ref={triggerRef}
        type="button"
        aria-label="Mais categorias"
        aria-haspopup="true"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => (open ? close() : setOpen(true))}
        className={cn(
          "inline-flex h-11 items-center gap-2 rounded-xl px-3 text-sm font-semibold transition",
          "text-slate-700 hover:bg-slate-100 hover:text-slate-900 active:scale-95",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2",
          open && "bg-brand-50 text-brand-700 hover:bg-brand-100 hover:text-brand-800"
        )}
      >
        <Menu className="h-6 w-6" aria-hidden />
        Categorias
      </button>

      {/* Fundo escurecido só no mobile; o painel é posicionado em relação ao header (sticky). */}
      <div
        aria-hidden
        onClick={close}
        className={cn(
          "absolute inset-x-0 top-full h-[100dvh] bg-slate-900/30 transition-opacity duration-200 md:hidden motion-reduce:transition-none",
          open ? "opacity-100" : "pointer-events-none opacity-0"
        )}
      />

      <div
        id={panelId}
        className={cn(
          "absolute inset-x-0 top-full z-50 origin-top border-b border-border bg-white shadow-xl",
          "max-h-[calc(100dvh-4rem)] overflow-y-auto",
          "md:left-0 md:right-auto md:mt-2 md:w-72 md:max-h-none md:origin-top-left md:overflow-visible",
          "md:rounded-2xl md:border md:shadow-lg",
          "transition-[opacity,transform,visibility] duration-200 ease-out motion-reduce:transition-none",
          open
            ? "visible translate-y-0 opacity-100"
            : "invisible -translate-y-2 opacity-0"
        )}
      >
        <p className="px-5 pb-1 pt-4 text-xs font-semibold uppercase tracking-wide text-muted md:px-4 md:pt-3">
          Categorias
        </p>

        <ul className="px-2 pb-2">
          {CATEGORY_MENU.map((item) => {
            const isExpanded = expanded === item.slug;
            const subId = `${panelId}-${item.slug}`;

            return (
              <li
                key={item.slug}
                className="relative"
                onPointerEnter={(e) => {
                  if (e.pointerType === "mouse" && item.children) setExpanded(item.slug);
                }}
                onPointerLeave={(e) => {
                  if (e.pointerType === "mouse" && item.children) setExpanded(null);
                }}
              >
                <div className="flex items-stretch gap-1">
                  <Link href={collectionHref(item.slug)} onClick={close} className={rowLinkClass}>
                    {item.label}
                  </Link>

                  {item.children && (
                    <button
                      type="button"
                      aria-expanded={isExpanded}
                      aria-controls={subId}
                      aria-label={`${isExpanded ? "Ocultar" : "Mostrar"} subcategorias de ${item.label}`}
                      onClick={() => setExpanded(isExpanded ? null : item.slug)}
                      className={cn(
                        "inline-flex w-11 shrink-0 items-center justify-center rounded-xl text-slate-500 transition",
                        "hover:bg-slate-100 hover:text-slate-800 active:bg-slate-200",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-500",
                        isExpanded && "text-brand-700"
                      )}
                    >
                      <ChevronDown
                        aria-hidden
                        className={cn(
                          "h-4 w-4 transition-transform duration-200 md:hidden",
                          isExpanded && "rotate-180"
                        )}
                      />
                      <ChevronRight aria-hidden className="hidden h-4 w-4 md:block" />
                    </button>
                  )}
                </div>

                {item.children && (
                  // Mobile: sanfona (grid-rows 0fr → 1fr). Desktop: flyout à direita; o pl-2 mantém o hover contínuo até o submenu.
                  <div
                    id={subId}
                    className={cn(
                      "grid transition-[grid-template-rows,opacity,transform,visibility] duration-200 ease-out motion-reduce:transition-none",
                      "md:absolute md:left-full md:top-0 md:block md:w-52 md:pl-2",
                      isExpanded
                        ? "visible grid-rows-[1fr] opacity-100 md:translate-x-0"
                        : "invisible grid-rows-[0fr] opacity-0 md:-translate-x-1"
                    )}
                  >
                    <div className="overflow-hidden md:overflow-visible">
                      <ul className="ml-3 border-l border-border pl-2 md:ml-0 md:rounded-2xl md:border md:bg-white md:p-2 md:shadow-lg">
                        <li>
                          <Link
                            href={collectionHref(item.slug)}
                            onClick={close}
                            className={cn(rowLinkClass, "text-brand-700")}
                          >
                            Ver tudo em {item.label}
                          </Link>
                        </li>
                        {item.children.map((child) => (
                          <li key={child.slug}>
                            <Link
                              href={collectionHref(child.slug)}
                              onClick={close}
                              className={rowLinkClass}
                            >
                              {child.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>

        <div className="border-t border-border px-2 py-2">
          <Link href="/" onClick={close} className={cn(rowLinkClass, "gap-2 text-slate-600")}>
            <LayoutGrid className="h-4 w-4" aria-hidden />
            Ver todo o catálogo
          </Link>
        </div>

        {links.length > 0 && (
          <ul className="border-t border-border px-2 py-2 md:hidden">
            {links.map((l) => {
              const Icon = l.icon;
              return (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    onClick={close}
                    aria-current={pathname === l.href ? "page" : undefined}
                    className={cn(
                      rowLinkClass,
                      "gap-2",
                      pathname === l.href && "bg-brand-50 text-brand-700"
                    )}
                  >
                    <Icon className="h-4 w-4" aria-hidden />
                    {l.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </nav>
  );
}
