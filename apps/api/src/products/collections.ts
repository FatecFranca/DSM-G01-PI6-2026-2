import { Prisma } from "@sportarena/database";

function mentionsAny(terms: string[]): Prisma.ProductWhereInput {
  return {
    OR: terms.flatMap((t) => [
      { name: { contains: t, mode: "insensitive" as const } },
      { description: { contains: t, mode: "insensitive" as const } },
    ]),
  };
}

function inCategories(...slugs: string[]): Prisma.ProductWhereInput {
  return { category: { slug: { in: slugs } } };
}

// Postgres "insensitive" ignora maiúsculas mas não acentos: variantes com e sem acento precisam estar listadas.
const TOP_TERMS = ["camiseta", "camisa", "camisola", "t-shirt", "regata", "polo", "jersey"];
const KIDS_TERMS = ["infantil", "júnior", "junior", "criança", "crianca", "rapariga", "rapaz", "kids", "bebê", "menino", "menina"];
const PANTS_TERMS = ["calça", "calca", "legging", "jogger", "tights"];
const WARM_TERMS = ["moletom", "moleton", "moletinho", "agasalho", "blusa", "sweat", "hood", "capuz", "casaco", "jaqueta", "corta-vento", "windrunner", "suéter", "sueter", "fleece", "colete", "fato de treino", "camada intermédia"];
const SHORTS_TERMS = ["shorts", "short ", "bermuda", "calções", "calcoes", "saia", "macacão"];
const TOPS_TERMS = ["sutiã", "sutia", "bralette", "top "];
const GEAR_TERMS = ["bucket", "boné", "bone ", "chapéu", "viseira", "mochila", "meias"];
const MALE_TERMS = ["masculino", "homem"];
const FEMALE_TERMS = ["feminino", "mulher"];

const shirts = { AND: [inCategories("camisetas"), mentionsAny(TOP_TERMS)] };
const shoes = inCategories("calcados");

export const PRODUCT_COLLECTIONS: Record<string, Prisma.ProductWhereInput> = {
  camisetas: shirts,
  "camisetas-adulto": { AND: [shirts, { NOT: mentionsAny(KIDS_TERMS) }] },
  "camisetas-infantil": { AND: [shirts, mentionsAny(KIDS_TERMS)] },
  calcas: mentionsAny(PANTS_TERMS),
  shorts: mentionsAny(SHORTS_TERMS),
  "tops-sutias": mentionsAny(TOPS_TERMS),
  moletons: mentionsAny(WARM_TERMS),
  "artigos-esportivos": {
    OR: [inCategories("acessorios", "equipamentos", "bolas"), mentionsAny(GEAR_TERMS)],
  },
  tenis: shoes,
  // Tênis sem gênero informado são tratados como unissex e aparecem nos dois filtros.
  "tenis-masculino": { AND: [shoes, { NOT: mentionsAny(FEMALE_TERMS) }] },
  "tenis-feminino": { AND: [shoes, { NOT: mentionsAny(MALE_TERMS) }] },
};

export const COLLECTION_LABELS: Record<string, string> = {
  camisetas: "Camisetas",
  "camisetas-adulto": "Camisetas · Adulto",
  "camisetas-infantil": "Camisetas · Infantil",
  calcas: "Calças",
  shorts: "Shorts e Bermudas",
  "tops-sutias": "Tops e Sutiãs",
  moletons: "Moletons / Blusas de Frio",
  "artigos-esportivos": "Artigos Esportivos",
  tenis: "Tênis",
  "tenis-masculino": "Tênis · Masculino",
  "tenis-feminino": "Tênis · Feminino",
};

export type CatalogSection = { slug: string; label: string; where: Prisma.ProductWhereInput | null };

/**
 * Seções do catálogo sem filtro, na ordem de exibição. Um produto entra só na primeira seção
 * cuja `priority` (menor = antes) o reconheça; `where: null` recolhe o que sobrou.
 */
export const CATALOG_SECTIONS: (CatalogSection & { priority: number })[] = [
  { slug: "camisetas", label: "Camisetas", where: shirts, priority: 6 },
  { slug: "tops-sutias", label: "Tops e Sutiãs", where: PRODUCT_COLLECTIONS["tops-sutias"], priority: 3 },
  { slug: "calcas", label: "Calças", where: PRODUCT_COLLECTIONS.calcas, priority: 4 },
  { slug: "shorts", label: "Shorts e Bermudas", where: PRODUCT_COLLECTIONS.shorts, priority: 2 },
  { slug: "moletons", label: "Moletons / Blusas de Frio", where: PRODUCT_COLLECTIONS.moletons, priority: 5 },
  { slug: "artigos-esportivos", label: "Artigos Esportivos", where: PRODUCT_COLLECTIONS["artigos-esportivos"], priority: 1 },
  { slug: "tenis", label: "Tênis", where: shoes, priority: 0 },
  { slug: "outros", label: "Outros produtos", where: null, priority: 7 },
];
