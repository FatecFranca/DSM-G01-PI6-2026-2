"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShoppingBag, Package, Heart, LogOut, Home, PlusCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth";

const links = [
  { href: "/", label: "Loja", icon: Home },
  { href: "/cart", label: "Carrinho", icon: ShoppingBag },
  { href: "/orders", label: "Você comprou", icon: Package },
  { href: "/for-you", label: "Para você", icon: Heart },
  { href: "/admin/products", label: "Cadastrar", icon: PlusCircle },
];

export function Header() {
  const pathname = usePathname();
  const { user, logout, accessToken } = useAuthStore();

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-border">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-brand-600 text-white font-bold flex items-center justify-center">
            S
          </div>
          <div>
            <p className="font-bold text-slate-900 leading-none">SportArena</p>
            <p className="text-[11px] text-muted">artigos esportivos</p>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {links.map((l) => {
            const Icon = l.icon;
            const active = pathname === l.href;
            return (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition",
                  active
                    ? "bg-brand-50 text-brand-700"
                    : "text-slate-600 hover:bg-slate-50"
                )}
              >
                <Icon className="w-4 h-4" />
                {l.label}
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
