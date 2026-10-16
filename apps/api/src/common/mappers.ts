import { Decimal } from "@prisma/client/runtime/library";

export function decimalToNumber(value: Decimal | number | null | undefined): number {
  if (value == null) return 0;
  if (typeof value === "number") return value;
  return Number(value);
}

export function mapUser(user: {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  createdAt: Date;
}) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    createdAt: user.createdAt.toISOString(),
  };
}

export function mapCategory(c: {
  id: string;
  name: string;
  slug: string;
  icon: string;
}) {
  return { id: c.id, name: c.name, slug: c.slug, icon: c.icon };
}

const SHOE_SIZES = Array.from({ length: 11 }, (_, i) => String(34 + i));
const APPAREL_SIZES = ["P", "M", "G", "GG"];
const BALL_SIZES = ["3", "4", "5", "7"];

function sizesForCategory(slug?: string | null, fallback?: string | null): string[] {
  const listed = fallback
    ?.split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (listed && listed.length > 1) return listed;

  if (slug === "calcados") return SHOE_SIZES;
  if (slug === "camisetas" || slug === "shorts" || slug === "jaquetas") {
    return APPAREL_SIZES;
  }
  if (slug === "bolas") return BALL_SIZES;
  if (fallback) return [fallback];
  return [];
}

function colorsForProduct(color?: string | null): string[] {
  if (!color?.trim()) {
    return ["Preto", "Branco", "Azul", "Vermelho"];
  }
  const parts = color
    .split(/[/|,]/)
    .map((c) => c.trim())
    .filter(Boolean);
  const extras = ["Preto", "Branco", "Azul", "Verde", "Cinza"].filter(
    (c) => !parts.some((p) => p.toLowerCase() === c.toLowerCase())
  );
  return [...parts, ...extras].slice(0, 6);
}

export function mapProduct(p: {
  id: string;
  name: string;
  slug: string;
  description: string;
  brand: string;
  price: Decimal;
  compareAt: Decimal | null;
  size: string | null;
  color: string | null;
  sport: string | null;
  stock: number;
  imageUrl: string | null;
  createdAt: Date;
  category?: { id: string; name: string; slug: string; icon: string } | null;
}) {
  const categorySlug = p.category?.slug ?? null;
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    description: p.description,
    brand: p.brand,
    price: decimalToNumber(p.price),
    compareAt: p.compareAt ? decimalToNumber(p.compareAt) : null,
    size: p.size,
    color: p.color,
    sport: p.sport,
    stock: p.stock,
    imageUrl: p.imageUrl,
    createdAt: p.createdAt.toISOString(),
    category: p.category ? mapCategory(p.category) : null,
    availableSizes: sizesForCategory(categorySlug, p.size),
    availableColors: colorsForProduct(p.color),
  };
}
