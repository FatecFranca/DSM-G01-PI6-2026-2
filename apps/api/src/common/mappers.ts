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
  };
}
