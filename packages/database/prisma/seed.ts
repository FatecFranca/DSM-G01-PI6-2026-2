import { PrismaClient, type Product, type ProductRelationType } from "@prisma/client";
import * as bcrypt from "bcrypt";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const prisma = new PrismaClient();

type CategorySeed = { name: string; slug: string; icon: string };

type ProductSeed = {
  name: string;
  slug: string;
  brand: string;
  description: string;
  price: number;
  compareAt: number | null;
  size: string | null;
  color: string | null;
  sport: string | null;
  stock: number;
  imageUrl: string | null;
  category: string | null;
  active: boolean;
};

type CustomerSeed = {
  name: string;
  email: string;
  phone: string;
};

/** Perfis de compra: cada usuário gera vários pedidos nesses eixos */
const PURCHASE_PROFILES: {
  sports: string[];
  categoryHints: string[];
  ordersPerUser: [number, number];
  itemsPerOrder: [number, number];
}[] = [
  {
    sports: ["Futebol", "Futsal"],
    categoryHints: ["Camisetas", "Calçados", "Acessórios", "Bolas"],
    ordersPerUser: [3, 5],
    itemsPerOrder: [2, 4],
  },
  {
    sports: ["Corrida", "Treino"],
    categoryHints: ["Calçados", "Camisetas", "Acessórios"],
    ordersPerUser: [2, 4],
    itemsPerOrder: [2, 3],
  },
  {
    sports: ["Basquete", "Treino"],
    categoryHints: ["Camisetas", "Calçados", "Acessórios"],
    ordersPerUser: [2, 4],
    itemsPerOrder: [2, 4],
  },
  {
    sports: ["Geral", "Treino", "Casual"],
    categoryHints: ["Camisetas", "Acessórios", "Equipamentos"],
    ordersPerUser: [2, 3],
    itemsPerOrder: [2, 3],
  },
];

const CUSTOMERS: CustomerSeed[] = [
  { name: "Ana Souza", email: "ana.souza@sportarena.app", phone: "5511900000001" },
  { name: "Bruno Lima", email: "bruno.lima@sportarena.app", phone: "5511900000002" },
  { name: "Carla Mendes", email: "carla.mendes@sportarena.app", phone: "5511900000003" },
  { name: "Diego Alves", email: "diego.alves@sportarena.app", phone: "5511900000004" },
  { name: "Elena Castro", email: "elena.castro@sportarena.app", phone: "5511900000005" },
  { name: "Felipe Rocha", email: "felipe.rocha@sportarena.app", phone: "5511900000006" },
  { name: "Gina Martins", email: "gina.martins@sportarena.app", phone: "5511900000007" },
  { name: "Hugo Nunes", email: "hugo.nunes@sportarena.app", phone: "5511900000008" },
  { name: "Iris Barbosa", email: "iris.barbosa@sportarena.app", phone: "5511900000009" },
  { name: "João Pereira", email: "joao.pereira@sportarena.app", phone: "5511900000010" },
  { name: "Karen Dias", email: "karen.dias@sportarena.app", phone: "5511900000011" },
  { name: "Lucas Freitas", email: "lucas.freitas@sportarena.app", phone: "5511900000012" },
  { name: "Marina Costa", email: "marina.costa@sportarena.app", phone: "5511900000013" },
  { name: "Nicolas Vieira", email: "nicolas.vieira@sportarena.app", phone: "5511900000014" },
  { name: "Olivia Ramos", email: "olivia.ramos@sportarena.app", phone: "5511900000015" },
  { name: "Pedro Santos", email: "pedro.santos@sportarena.app", phone: "5511900000016" },
  { name: "Quenia Lopes", email: "quenia.lopes@sportarena.app", phone: "5511900000017" },
  { name: "Rafael Gomes", email: "rafael.gomes@sportarena.app", phone: "5511900000018" },
];

function readJson<T>(file: string): T {
  return JSON.parse(readFileSync(resolve(__dirname, "data", file), "utf-8"));
}

function randInt(min: number, max: number) {
  return min + Math.floor(Math.random() * (max - min + 1));
}

function pickN<T>(arr: T[], n: number): T[] {
  if (arr.length === 0) return [];
  const copy = [...arr];
  const out: T[] = [];
  const take = Math.min(n, copy.length);
  for (let i = 0; i < take; i++) {
    const idx = Math.floor(Math.random() * copy.length);
    out.push(copy.splice(idx, 1)[0]);
  }
  return out;
}

function matchesSport(product: Product & { category: { name: string } | null }, sports: string[]) {
  const sport = (product.sport || "").toLowerCase();
  return sports.some((s) => sport.includes(s.toLowerCase()) || s.toLowerCase().includes(sport));
}

function matchesCategory(
  product: Product & { category: { name: string } | null },
  hints: string[]
) {
  const cat = product.category?.name || "";
  return hints.includes(cat);
}

async function seedCatalog() {
  const categories = readJson<CategorySeed[]>("categories.json");
  const products = readJson<ProductSeed[]>("products.json");
  const passwordHash = await bcrypt.hash("123456", 10);

  const admin = await prisma.user.upsert({
    where: { email: "demo@sportarena.app" },
    update: {},
    create: {
      name: "Admin Demo",
      email: "demo@sportarena.app",
      phone: "5511888888888",
      passwordHash,
      role: "ADMIN",
    },
  });

  const categoryIds: Record<string, string> = {};
  for (const c of categories) {
    const cat = await prisma.category.upsert({
      where: { slug: c.slug },
      update: { name: c.name, icon: c.icon },
      create: { name: c.name, slug: c.slug, icon: c.icon },
    });
    categoryIds[c.name] = cat.id;
  }

  const unknownCategories = new Set(
    products
      .map((p) => p.category)
      .filter((c): c is string => Boolean(c) && !categoryIds[c!])
  );
  if (unknownCategories.size > 0) {
    throw new Error(
      `Categorias usadas em products.json mas ausentes em categories.json: ${[...unknownCategories].join(", ")}`
    );
  }

  for (const p of products) {
    const data = {
      name: p.name,
      description: p.description,
      brand: p.brand,
      price: p.price,
      compareAt: p.compareAt,
      size: p.size,
      color: p.color,
      sport: p.sport,
      stock: Math.max(p.stock, 50),
      imageUrl: p.imageUrl,
      active: p.active,
      categoryId: p.category ? categoryIds[p.category] : null,
    };
    await prisma.product.upsert({
      where: { slug: p.slug },
      update: data,
      create: { ...data, slug: p.slug, sellerId: admin.id },
    });
  }

  await prisma.cart.upsert({
    where: { userId: admin.id },
    update: {},
    create: { userId: admin.id },
  });

  return { admin, categoriesCount: categories.length, productsCount: products.length, passwordHash };
}

async function seedCustomers(passwordHash: string) {
  const users = [];
  for (const c of CUSTOMERS) {
    const user = await prisma.user.upsert({
      where: { email: c.email },
      update: { name: c.name, phone: c.phone, passwordHash },
      create: {
        name: c.name,
        email: c.email,
        phone: c.phone,
        passwordHash,
        role: "CUSTOMER",
      },
    });
    await prisma.cart.upsert({
      where: { userId: user.id },
      update: {},
      create: { userId: user.id },
    });
    users.push(user);
  }
  return users;
}

async function seedOrders(userIds: string[]) {
  // Remove pedidos de seed anteriores dos clientes demo (idempotente)
  await prisma.orderItem.deleteMany({
    where: { order: { user: { email: { endsWith: "@sportarena.app" }, role: "CUSTOMER" } } },
  });
  await prisma.order.deleteMany({
    where: { user: { email: { endsWith: "@sportarena.app" }, role: "CUSTOMER" } },
  });

  const catalog = await prisma.product.findMany({
    where: { active: true },
    include: { category: true },
  });

  if (catalog.length < 4) {
    throw new Error("Catálogo insuficiente para gerar pedidos de co-compra");
  }

  let ordersCreated = 0;
  let itemsCreated = 0;

  for (let i = 0; i < userIds.length; i++) {
    const userId = userIds[i];
    const profile = PURCHASE_PROFILES[i % PURCHASE_PROFILES.length];
    const pool = catalog.filter(
      (p) =>
        matchesSport(p, profile.sports) || matchesCategory(p, profile.categoryHints)
    );
    const source = pool.length >= 6 ? pool : catalog;

    const nOrders = randInt(profile.ordersPerUser[0], profile.ordersPerUser[1]);

    for (let o = 0; o < nOrders; o++) {
      const nItems = randInt(profile.itemsPerOrder[0], profile.itemsPerOrder[1]);
      const picked = pickN(source, nItems);
      if (picked.length < 2) continue;

      const items = picked.map((p) => ({
        productId: p.id,
        quantity: randInt(1, 2),
        unitPrice: p.price,
        size: p.size,
      }));
      const total = items.reduce(
        (sum, it) => sum + Number(it.unitPrice) * it.quantity,
        0
      );

      const statuses = ["PAID", "SHIPPED", "DELIVERED"] as const;
      const status = statuses[randInt(0, statuses.length - 1)];

      await prisma.order.create({
        data: {
          userId,
          status,
          total,
          items: { create: items },
        },
      });
      ordersCreated++;
      itemsCreated += items.length;
    }
  }

  // Cestas “âncora” compartilhadas — reforçam pares populares (mesmos produtos juntos)
  const anchors = buildAnchorBaskets(catalog);
  const anchorUsers = userIds.slice(0, Math.min(8, userIds.length));
  for (const basket of anchors) {
    for (const userId of anchorUsers) {
      if (Math.random() > 0.55) continue;
      const items = basket.map((p) => ({
        productId: p.id,
        quantity: 1,
        unitPrice: p.price,
        size: p.size,
      }));
      const total = items.reduce((s, it) => s + Number(it.unitPrice) * it.quantity, 0);
      await prisma.order.create({
        data: {
          userId,
          status: "DELIVERED",
          total,
          items: { create: items },
        },
      });
      ordersCreated++;
      itemsCreated += items.length;
    }
  }

  return { ordersCreated, itemsCreated };
}

function buildAnchorBaskets(catalog: (Product & { category: { name: string } | null })[]) {
  const bySport = (sport: string) =>
    catalog.filter((p) => (p.sport || "").toLowerCase().includes(sport.toLowerCase()));
  const byCat = (cat: string) =>
    catalog.filter((p) => p.category?.name === cat);

  const baskets: (Product & { category: { name: string } | null })[][] = [];

  const futebol = bySport("Futebol");
  const calcados = byCat("Calçados");
  const camisetas = byCat("Camisetas");
  const acessorios = byCat("Acessórios");
  const bolas = byCat("Bolas");
  const corrida = bySport("Corrida");
  const treino = bySport("Treino");

  if (camisetas[0] && calcados[0] && acessorios[0]) {
    baskets.push([camisetas[0], calcados[0], acessorios[0]]);
  }
  if (futebol[0] && futebol[1] && (bolas[0] || acessorios[1])) {
    baskets.push([futebol[0], futebol[1], bolas[0] || acessorios[1]!].filter(Boolean) as typeof futebol);
  }
  if (corrida[0] && corrida[1] && camisetas[1]) {
    baskets.push([corrida[0], corrida[1], camisetas[1]]);
  }
  if (treino[0] && treino[1] && acessorios[0]) {
    baskets.push([treino[0], treino[1], acessorios[0]]);
  }
  if (calcados[1] && camisetas[2] && acessorios[2]) {
    baskets.push([calcados[1], camisetas[2], acessorios[2]]);
  }

  return baskets.filter((b) => b.length >= 2);
}

/**
 * Agrega co-compras a partir dos pedidos pagos/enviados/entregues.
 * - BOUGHT_TOGETHER: par aparece no mesmo pedido
 * - ALSO_BOUGHT: par aparece no histórico do mesmo usuário (qualquer pedido)
 */
async function rebuildProductRelations() {
  await prisma.productRelation.deleteMany({});

  const orders = await prisma.order.findMany({
    where: { status: { in: ["PAID", "SHIPPED", "DELIVERED"] } },
    include: { items: true },
  });

  const together = new Map<string, number>();
  const alsoBought = new Map<string, number>();
  const userProducts = new Map<string, Set<string>>();

  for (const order of orders) {
    const ids = [...new Set(order.items.map((i) => i.productId))];
    if (!userProducts.has(order.userId)) userProducts.set(order.userId, new Set());
    const bag = userProducts.get(order.userId)!;
    for (const id of ids) bag.add(id);

    for (let i = 0; i < ids.length; i++) {
      for (let j = 0; j < ids.length; j++) {
        if (i === j) continue;
        const key = `${ids[i]}|${ids[j]}`;
        together.set(key, (together.get(key) || 0) + 1);
      }
    }
  }

  for (const [, products] of userProducts) {
    const ids = [...products];
    for (let i = 0; i < ids.length; i++) {
      for (let j = 0; j < ids.length; j++) {
        if (i === j) continue;
        const key = `${ids[i]}|${ids[j]}`;
        alsoBought.set(key, (alsoBought.get(key) || 0) + 1);
      }
    }
  }

  async function flush(
    map: Map<string, number>,
    relationType: ProductRelationType
  ) {
    const rows = [...map.entries()]
      .filter(([, score]) => score > 0)
      .map(([key, score]) => {
        const [sourceProductId, targetProductId] = key.split("|");
        return { sourceProductId, targetProductId, relationType, score };
      });

    const chunk = 200;
    for (let i = 0; i < rows.length; i += chunk) {
      await prisma.productRelation.createMany({
        data: rows.slice(i, i + chunk),
        skipDuplicates: true,
      });
    }
    return rows.length;
  }

  const nTogether = await flush(together, "BOUGHT_TOGETHER");
  const nAlso = await flush(alsoBought, "ALSO_BOUGHT");

  return { boughtTogether: nTogether, alsoBought: nAlso };
}

async function main() {
  const { categoriesCount, productsCount, passwordHash } = await seedCatalog();
  const customers = await seedCustomers(passwordHash);
  const { ordersCreated, itemsCreated } = await seedOrders(customers.map((u) => u.id));
  const relations = await rebuildProductRelations();

  const topPairs = await prisma.productRelation.findMany({
    where: { relationType: "ALSO_BOUGHT" },
    orderBy: { score: "desc" },
    take: 8,
    include: {
      sourceProduct: { select: { name: true, slug: true } },
      targetProduct: { select: { name: true, slug: true } },
    },
  });

  console.log("── Seed SportArena ──");
  console.log(`Categorias: ${categoriesCount}`);
  console.log(`Produtos: ${productsCount}`);
  console.log(`Clientes demo: ${customers.length} (senha: 123456)`);
  console.log(`Pedidos gerados: ${ordersCreated} (${itemsCreated} itens)`);
  console.log(
    `Relações: ${relations.alsoBought} ALSO_BOUGHT · ${relations.boughtTogether} BOUGHT_TOGETHER`
  );
  console.log("Top pares (quem compra também compra):");
  for (const r of topPairs) {
    console.log(
      `  [${r.score}] ${r.sourceProduct.name} → ${r.targetProduct.name}`
    );
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
