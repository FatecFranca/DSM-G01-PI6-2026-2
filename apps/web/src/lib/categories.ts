export type CategoryMenuItem = {
  slug: string;
  label: string;
  children?: CategoryMenuItem[];
};

/** Os slugs precisam existir em PRODUCT_COLLECTIONS na API (apps/api/src/products/collections.ts). */
export const CATEGORY_MENU: CategoryMenuItem[] = [
  {
    slug: "camisetas",
    label: "Camisetas",
    children: [
      { slug: "camisetas-adulto", label: "Adulto" },
      { slug: "camisetas-infantil", label: "Infantil" },
    ],
  },
  { slug: "tops-sutias", label: "Tops e Sutiãs" },
  { slug: "calcas", label: "Calças" },
  { slug: "shorts", label: "Shorts e Bermudas" },
  { slug: "moletons", label: "Moletons / Blusas de Frio" },
  { slug: "artigos-esportivos", label: "Artigos Esportivos" },
  {
    slug: "tenis",
    label: "Tênis",
    children: [
      { slug: "tenis-masculino", label: "Masculino" },
      { slug: "tenis-feminino", label: "Feminino" },
    ],
  },
];

export function collectionHref(slug: string) {
  return `/?collection=${slug}`;
}

export function findCollectionLabel(slug: string): string | null {
  for (const item of CATEGORY_MENU) {
    if (item.slug === slug) return item.label;
    const child = item.children?.find((c) => c.slug === slug);
    if (child) return `${item.label} · ${child.label}`;
  }
  return null;
}
