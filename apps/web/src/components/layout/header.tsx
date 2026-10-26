"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShoppingBag, Package, LogOut, Home, PlusCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth";
import { useCartProductIds } from "@/hooks/use-cart-ids";
import { CategoryMenu, type NavLink } from "./category-menu";

const links: NavLink[] = [
  { href: "/", label: "Loja", icon: Home },
  { href: "/cart", label: "Carrinho", icon: ShoppingBag },
  { href: "/orders", label: "Você comprou", icon: Package },
  { href: "/admin/products", label: "Cadastrar", icon: PlusCircle },
];

export function Header() {
  const pathname = usePathname();
  const { user, logout, accessToken } = useAuthStore();
  const { itemCount } = useCartProductIds();

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-border">
      <div className="px-2 sm:px-4 lg:px-6 h-16 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          <CategoryMenu links={links} />
          <Link href="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-brand-600 text-white font-bold flex items-center justify-center">
              S
            </div>
            <div className="hidden sm:block">
              <p className="font-bold text-slate-900 leading-none">SportArena</p>
              <p className="text-[11px] text-muted">artigos esportivos</p>
            </div>
          </Link>
        </div>

        <nav aria-label="Principal" className="hidden md:flex items-center gap-1">
          {links.map((l) => {
            const Icon = l.icon;
            const active = pathname === l.href;
            const isCart = l.href === "/cart";
            return (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  "relative flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition",
                  active
                    ? "bg-brand-50 text-brand-700"
                    : "text-slate-600 hover:bg-slate-50",
                  isCart && itemCount > 0 && !active && "text-brand-700"
                )}
              >
                <Icon
                  className={cn(
                    "w-4 h-4 transition-transform",
                    isCart && itemCount > 0 && "scale-110"
                  )}
                />
                {l.label}
                {isCart && itemCount > 0 && (
                  <span className="ml-0.5 min-w-5 h-5 px-1 rounded-full bg-brand-600 text-white text-[11px] font-bold inline-flex items-center justify-center">
                    {itemCount > 99 ? "99+" : itemCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          {accessToken ? (
            <>
              <span className="hidden sm:block text-sm text-muted truncate max-w-[120px]">
                {user?.name}
              </span>
              <button
                onClick={logout}
                className="p-2 rounded-xl hover:bg-red-50 text-slate-500 hover:text-red-600"
                title="Sair"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="text-sm font-medium text-brand-700 hover:underline"
            >
              Entrar
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
